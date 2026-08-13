// GENERIERT aus dem Signaturblock von Issue #39.
// [project-store] bearbeiteAktion implementieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: 8c7393b5f8a2c80e
//
// [ERLEDIGT: Zeile 1 (eslint-disable no-unused-vars) ist mit diesem Rumpf entfernt -
//  alle Parameter und Importe werden benutzt.]

import { holeAktivesProjekt } from './aktives-projekt'              // #192
import { planeAutoSpeicherung } from './auto-speichern'             // #47
import { mitD1Lock } from './d1-lock'                               // #32

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #32:  mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//         // fuehrt aktion() garantiert seriell aus (FIFO, prozessintern, KEINE Datei-Sperre).
//         // Der kritische Abschnitt "darf selbst nicht erneut mitD1Lock aufrufen
//         // (Deadlock-Gefahr)" - deshalb steht unten kein zweiter, geschachtelter Aufruf.
//   #47:  planeAutoSpeicherung(projekt: Project): void
//         // merkt projekt als zu speichernde, aktuelle Version vor und (re-)startet den
//         // Entprellungstimer. SYNCHRON, KEIN Rueckgabewert - "reine Terminplanung kann nicht
//         // fehlschlagen". Nimmt das Lock NICHT. Setzt seit dem 12.08.2026 ZUSAETZLICH
//         // Project.geaendertAm - "DER EINE ORT, an dem geaendertAm fortgeschrieben wird";
//         // diese Datei fasst das Feld deshalb NICHT an.
//   #192: holeAktivesProjekt(): Project | null
//         // das aktuell geoeffnete Projekt als LEBENDEN Stand (dieselbe Objektreferenz, die
//         // die Instant-Operationen mutieren), kein Projekt offen -> null. SYNCHRON, NIMMT
//         // KEIN LOCK, WIRFT NIE.

import type { Aktion } from '../../shared/contracts/aktion'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
export async function bearbeiteAktion(
  id: string,
  aktionsdaten: Partial<Omit<Aktion, 'id'>>,
): Promise<Ergebnis<Aktion>> {
  // DIESE EINE PRUEFUNG LAEUFT VOR DEM LOCK - und nur sie. Sie fragt nicht nach einem
  // FELD, sondern danach, ob der Aufruf ueberhaupt die Form eines Aufrufs hat: Der Wert
  // kommt ueber IPC aus dem Renderer (#75/#76), und ueber die Prozessgrenze reist ein
  // `unknown` als `Partial<Omit<Aktion, 'id'>>` getarnt (TK 9.1.1 Punkt 6). Ohne sie
  // wuerde `null.titel` werfen - und ein Wurf reist nie ueber die Grenze, dort kaeme nur
  // noch Text an (ergebnis.ts). Ein derart missgestalteter Aufruf ist ein Defekt des
  // Aufrufers, keine Auskunft ueber den Bestand; ihn hinter der Warteschlange abzuweisen
  // hiesse, einen laufenden Schreibvorgang abzuwarten, nur um nichts zu tun (#38).
  if (typeof aktionsdaten !== 'object' || aktionsdaten === null) {
    return ungueltig('bearbeiteAktion wurde ohne Aktionsdaten aufgerufen.')
  }

  // ALLE UEBRIGEN PRUEFUNGEN LIEGEN IM LOCK, UND ZWAR HINTER DER EXISTENZPRUEFUNG.
  // Das ist bewusst ANDERS als in #38 (dort steht die Titelpruefung vor dem Lock) - der
  // Unterschied ist, dass es hier ueberhaupt eine Existenzfrage gibt. Die Reihenfolge der
  // Pruefungen folgt der Reihenfolge der Fehlerpfad-Tabelle des Issues (erst
  // `nicht_gefunden`, dann `ungueltige_eingabe`), dieselbe Linie wie #45: Bei mehreren
  // Maengeln zugleich - unbekannte Kennung UND leerer Titel - ist "diese Aktion gibt es
  // nicht" die Auskunft, die weiterhilft; "der Titel ist leer" schickte den Nutzer zum
  // Korrigieren eines Formulars, das auf nichts zeigt. Der Preis ist eine Wartezeit von
  // Millisekunden auf einem Pfad, der ohnehin nichts tut.
  //
  // FUER AUFRUFER: Diese Funktion nimmt das Lock SELBST. Sie darf NICHT noch einmal in
  // mitD1Lock eingewickelt werden - der innere Aufruf wartete auf den aeusseren, der auf
  // ihn wartet (#32, "Deadlock-Gefahr").
  //
  // WARUM UEBERHAUPT EIN LOCK, OBWOHL HIER NUR FELDER IM SPEICHER GESETZT WERDEN: Der
  // kritische Abschnitt ist nicht die Zuweisung, sondern Suchen, Aendern und Vormerken
  // ZUSAMMEN. Ohne Lock koennte zwischen dem Finden der Aktion und der Zuweisung ein
  // laufendes schreibeProjekt (#46) genau dieses Projekt serialisieren - die geschriebene
  // project.json truege dann einen Stand, den es im Speicher nie gab. TK 9.5.1 verlangt
  // ausdruecklich das eine D1-Lock, "durch das ALLE project.json-Mutationen laufen".
  //
  // Der Rueckgabetyp des Abschnitts steht ausgeschrieben da, statt sich ableiten zu lassen:
  // Ohne ihn wuerde `ok: false` in einem Objektliteral zu `boolean` verbreitert, und die
  // Ergebnis-Huelle waere nicht mehr diskriminierbar.
  return mitD1Lock(async (): Promise<Ergebnis<Aktion>> => {
    const projekt = holeAktivesProjekt()
    if (projekt === null) {
      // Die Fehlerpfad-Tabelle kennt fuer diesen Fall keine eigene Zeile - sie fragt nur,
      // ob `id` existiert. Ohne offenes Projekt gibt es die Aktions-Bibliothek nicht, die
      // Aktion kann darin also nicht existieren: `nicht_gefunden`. Dieselbe Wahl wie #38,
      // #45 und #72; ein zweiter Code fuer dieselbe Lage waere die Uneinheitlichkeit, die
      // der STOPP-Block von #38 ausdruecklich verhindern will.
      return fehler('nicht_gefunden', 'Es ist kein Projekt geoeffnet; es wurde nichts geaendert.')
    }

    // Gesucht wird im LEBENDEN Stand: #192 gibt "dieselbe Objektreferenz" heraus, "keine
    // Kopie". Die gefundene Aktion ist damit der Eintrag der Bibliothek selbst - genau der,
    // der geaendert werden soll.
    //
    // Ein `id`, das gar kein String ist (IPC, s. o.), trifft hier schlicht nichts und faellt
    // damit in dieselbe Zeile der Fehlerpfad-Tabelle. Dafuer braucht es keine eigene Pruefung
    // und keinen dritten Fehlercode.
    const aktion = projekt.aktionen.find((eintrag) => eintrag.id === id)
    if (aktion === undefined) {
      // Die Kennung steht ABSICHTLICH nicht in der Meldung - sie reist bis in die Oberflaeche,
      // und eine UUID hilft dort niemandem (gleiche Linie wie #37/#45/#49).
      return fehler('nicht_gefunden', 'Zu dieser Kennung gibt es keine Aktion in der Bibliothek.')
    }

    // ---------------------------------------------------------------------------
    // WAS "MITGESCHICKT" HEISST - die tragende Entscheidung dieser Datei.
    //
    // Mitgeschickt ist ein Feld, dessen Wert NICHT `undefined` ist. Fehlt der Schluessel
    // ganz oder steht `undefined` darin, bleibt der bestehende Wert stehen ("`titel` NICHT
    // mitschicken laesst den bestehenden Wert unveraendert", Issue).
    //
    // WARUM NICHT `'titel' in aktionsdaten`: Der Electron-IPC serialisiert mit dem
    // Structured Clone, und der BEHAELT einen Schluessel mit dem Wert `undefined`. Ein
    // Renderer, der sein Formular als `{ titel, preis, cta }` zusammensetzt und dabei zwei
    // Felder gar nicht befuellt hat, schickte damit drei "mitgeschickte" Felder - zwei davon
    // mit `undefined`. Mit der `in`-Pruefung waere das ein `ungueltige_eingabe` bzw. ein
    // stilles Leeren; mit der Pruefung auf `undefined` ist es das, was `Partial` bedeutet.
    //
    // UND DESHALB IST `null` HIER ETWAS ANDERES ALS IN #38. Dort wird `undefined` zu `null`
    // NORMALISIERT, weil beim Anlegen jedes Feld einen Wert bekommen MUSS und "nicht
    // mitgeschickt" nur "kein Wert gewaehlt" heissen kann. Hier waere genau dieselbe Regel
    // zerstoererisch: Ein Update `{ titel: "Neu" }` loeschte Beschreibung, Preis, Bild, CTA,
    // Dauer und Akzentfarbe der Aktion - und zwar lautlos, weil der Aufrufer diese Felder
    // nie erwaehnt hat. `null` bleibt trotzdem ein gueltiger, uebernommener Wert: Es ist der
    // einzige Weg, ein Feld ABSICHTLICH zu leeren ("Bild entfernen" ist nach TK 9.8.5 eine
    // der drei Fix-Optionen und muss moeglich bleiben).
    // ---------------------------------------------------------------------------

    // "Titel ist Pflicht: eine Aktion ohne Titel ist nicht speicherbar." (TK 9.8.4) - und das
    // "gilt auch fuer ein Update, das den Titel auf leer setzen wuerde" (Issue).
    //
    // GUELTIG IST: ein String, der nach dem Abschneiden der Randleerzeichen noch Zeichen hat -
    // wortgleich zu #38. Ein Titel aus lauter Leerzeichen ist KEIN Titel; im gerenderten
    // Segment-PNG ist er von "gar kein Titel" nicht zu unterscheiden. Ein Wert, der kein
    // String ist, faellt in dieselbe Ablehnung: Er wuerde als Titel gezeichnet werden.
    let neuerTitel: string | null = null
    if (aktionsdaten.titel !== undefined) {
      const geputzt = typeof aktionsdaten.titel === 'string' ? aktionsdaten.titel.trim() : ''
      if (geputzt.length === 0) {
        return fehler(
          'ungueltige_eingabe',
          'Eine Aktion ohne Titel ist nicht speicherbar (TK 9.8.4).',
        )
      }
      // GESPEICHERT WIRD DER GETRIMMTE TITEL - #38 tut es beim Anlegen und hat es
      // ausdruecklich hierher weitergereicht. Ohne dieselbe Regel aenderte sich der Titel
      // beim ERSTEN Bearbeiten von selbst: Der Editor laedt "Sommeraktion", schickt beim
      // Speichern unveraendert zurueck - und ein Nutzer, der versehentlich ein Leerzeichen
      // voranstellt, verschoebe den Text im Segment-PNG sichtbar, ohne dass irgendwo etwas
      // falsch aussieht.
      neuerTitel = geputzt
    }

    // `vorlagenId` ist AENDERBAR (sie steht in `Omit<Aktion, 'id'>`) - der Editor darf eine
    // Aktion von "Vollbild" auf "Split" umstellen. Wird sie mitgeschickt, gilt fuer sie
    // dieselbe Schranke wie beim Anlegen: "Eine Aktion braucht eine Vorlage" (#38). Ohne sie
    // ist die Aktion nicht zeichenbar - das template-canvas haette keine Anweisung, was wohin
    // gehoert.
    //
    // ZUR FEHLERPFAD-TABELLE: Sie ist als "(vollstaendig)" ueberschrieben und kennt diese
    // Zeile NICHT. Die Alternative waere aber, dass sich ueber `bearbeiteAktion` genau der
    // Zustand herstellen laesst, den `erstelleAktion` verweigert - eine dauerhaft
    // unzeichenbare Aktion, die erst weit entfernt im template-canvas auffiele. Der Code ist
    // kein neuer (`ungueltige_eingabe`, schon in der Tabelle), und der action-editor kennt
    // den Befund bereits als Feldmeldung (`{ feld: 'vorlagenId', grund: 'leer' }`, #136), er
    // ist auf die Abweisung also vorbereitet. Entschieden und GEMELDET, s. Bericht/STOPP.
    let neueVorlagenId: string | null = null
    if (aktionsdaten.vorlagenId !== undefined) {
      const roh = aktionsdaten.vorlagenId
      if (typeof roh !== 'string' || roh.trim().length === 0) {
        return fehler('ungueltige_eingabe', 'Eine Aktion braucht eine Vorlage (vorlagenId).')
      }
      // UNVERAENDERT uebernommen, NICHT getrimmt - wortgleich zur Begruendung in #38: Sie ist
      // ein SCHLUESSEL, kein Anzeigetext. Ein stilles Zurechtbiegen machte aus einer Kennung,
      // die nirgends trifft, eine, die zufaellig trifft. Beim Titel ist es umgekehrt, weil
      // dort die Zeichenkette selbst das Ergebnis ist.
      neueVorlagenId = roh
    }

    // GEPRUEFT WIRD AUCH HIER NUR DIE FORM, NICHT DIE EXISTENZ DER VORLAGE. Der STOPP-Block
    // des Issues legt genau diese Vermutung nahe und verlangt ihre Bestaetigung; gebaut ist
    // sie so, weil die Alternative die Abhaengigkeitsrichtung umdrehte: `project-store` (M1)
    // muesste den `vorlagen-store` (M4) fragen. S. Bericht/STOPP.

    // ---------------------------------------------------------------------------
    // AB HIER WIRKT ES. Alle Pruefungen liegen davor, deshalb ist "keine Wirkung" auf jedem
    // Fehlerpfad nicht zugesichert, sondern strukturell wahr - es gibt keinen Rueckweg, der
    // zurueckdrehen muesste. Das ist der Grund fuer die beiden Zwischenwerte oben: Waere der
    // Titel schon gesetzt, wenn die vorlagenId scheitert, truege die Aktion die halbe
    // Aenderung.
    //
    // GEAENDERT WIRD DER GEFUNDENE DATENSATZ SELBST, FELD FUER FELD - er wird NICHT durch ein
    // neues Objekt ersetzt:
    // 1. Nur so ist "aendert nur die mitgeschickten Felder, laesst andere unangetastet" (DoD)
    //    strukturell wahr statt nachgerechnet: Was hier nicht zugewiesen wird, kann sich nicht
    //    aendern.
    // 2. Ein Ersatz braeche die Identitaet der Referenz. Aktionen sind "referenzierbar"
    //    (TK 5, Punkt 2); wer main-intern eine Aktion in der Hand haelt, haette danach eine
    //    Leiche, waehrend im Array ein anderes Objekt stuende - die zweite Wahrheit, die #192
    //    fuer das Projekt ausschliesst.
    // 3. `aktionsdaten` wird NICHT gespreizt (`{ ...aktion, ...aktionsdaten }`). Das ist die
    //    naheliegendste Fassung dieser Funktion und die falsche: Sie uebernaehme jedes
    //    zusaetzliche Feld, das der Renderer mitschickt, #46 serialisiert das GANZE Projekt,
    //    und der Fremdkoerper stuende ab dann dauerhaft in project.json. Ein Spread truege
    //    ausserdem `undefined`-Werte HINEIN und loeschte damit genau die Felder, die der
    //    Aufrufer gar nicht erwaehnt hat.
    // ---------------------------------------------------------------------------
    if (neuerTitel !== null) {
      aktion.titel = neuerTitel
    }
    if (neueVorlagenId !== null) {
      aktion.vorlagenId = neueVorlagenId
    }
    if (aktionsdaten.beschreibung !== undefined) {
      aktion.beschreibung = aktionsdaten.beschreibung
    }
    if (aktionsdaten.preis !== undefined) {
      aktion.preis = aktionsdaten.preis
    }
    // "Bild = Referenz, nie Kopie: die Aktion haelt nur eine Asset-ID" (TK 9.8.4). Uebernommen
    // wird die Kennung und sonst nichts - kein Nachschlagen in `Project.assets`, keine
    // Existenzpruefung: Ein `bildRef`, das auf ein fehlendes Asset zeigt, ist ein VORGESEHENER
    // Zustand (TK 9.8.5, "kaputt" + Platzhalter), kein Ablehnungsgrund. Und `null` MUSS
    // durchgehen - "entfernen" ist eine der drei Fix-Optionen aus TK 9.8.5, und "eine Aktion
    // ohne Bild ist gueltig".
    if (aktionsdaten.bildRef !== undefined) {
      aktion.bildRef = aktionsdaten.bildRef
    }
    if (aktionsdaten.cta !== undefined) {
      aktion.cta = aktionsdaten.cta
    }
    // "`standardDauer` ist nur ein Default" (TK 9.8.4) - massgeblich fuer den Render ist die
    // Listenelement-Dauer. Deshalb wird die Spanne 10-45 s hier NICHT geprueft (das tut #45 an
    // der Dauer, die wirklich zaehlt, und der Editor meldet sie dem Nutzer vorab als
    // `standardDauer: 'ausserhalb_bereich'`, #136). Unbrauchbare Zahlen werden zu `null`
    // umgesetzt, s. `brauchbareDauer`.
    if (aktionsdaten.standardDauer !== undefined) {
      aktion.standardDauer = brauchbareDauer(aktionsdaten.standardDauer)
    }
    // KEINE FARBPRUEFUNG. "Akzentfarbe ist ein freier Farbwert" (TK 9.8.4, FA-24) - die
    // Farbwahl ist seit v3.4 NICHT mehr auf die Markenpalette begrenzt, damit Partner-
    // Hausfarben darstellbar sind, und "die Gegenmassnahme ist die Kontrast-Warnung (9.15.2),
    // nicht die Sperre" (Risiko R-08). Eine Pruefung hier - auf eine Rolle wie in #136 oder
    // auf ein Hex-Muster - waere genau die Sperre, die das TK zurueckgenommen hat, und wuerde
    // die Hausfarbe abweisen, um die es geht. `null` heisst "keine eigene Farbe, es gilt der
    // Markenwert" und ist ein zugesagter Zustand, kein Fehler.
    if (aktionsdaten.akzentfarbe !== undefined) {
      aktion.akzentfarbe = aktionsdaten.akzentfarbe
    }

    // VORGEMERKT WIRD UNBEDINGT - auch wenn `aktionsdaten` leer war oder jedes Feld seinen
    // alten Wert trug. Die Alternative waere, das tatsaechliche Aendern mitzuzaehlen und den
    // Termin nur dann zu planen; sie spart einen Schreibvorgang und riskiert dafuer den
    // teuersten Fehler dieser Datei: Zaehlt die Erkennung eine echte Aenderung nicht mit,
    // wird sie NIE geschrieben, und der Verlust faellt erst nach einem Neustart auf. Der Preis
    // der unbedingten Fassung ist ein entprellter Schreibvorgang zu viel und ein
    // fortgeschriebenes `geaendertAm` - beides ohne Datenwirkung.
    //
    // DAS SPEICHERN WIRD NUR ANGESTOSSEN, NICHT ABGEWARTET: "Eine Instant-Operation (9.5.2)
    // validiert und wendet im Speicher an, *bevor* sie 'ok' meldet - ihr Erfolg bedeutet
    // 'gueltig uebernommen', nicht 'schon auf Platte'." (TK 9.5.4) Deshalb hier
    // `planeAutoSpeicherung` und NICHT `sofortFlush`: Der Sofort-Flush gehoert den vier in #47
    // aufgezaehlten Faellen, und das Bearbeiten einer Aktion ist keiner davon.
    //
    // NOCH INNERHALB DES LOCKS: Der Aufruf ist synchron und nimmt selbst kein Lock (#47), es
    // entsteht also keine Schachtelung. Ausserhalb waere er falsch - zwischen dem Verlassen
    // des Locks und dem Vormerken koennte ein Projektwechsel (#34) oder ein Loeschen (#37)
    // liegen, und die Aenderung stuende in keinem Termin mehr.
    //
    // `Project.geaendertAm` wird hier NICHT gesetzt: Das tut seit dem 12.08.2026 genau diese
    // Funktion, "DER EINE ORT, an dem geaendertAm fortgeschrieben wird" (#47). Ein zweiter
    // Zeitstempel daneben waere eine zweite Quelle fuer dasselbe Feld.
    planeAutoSpeicherung(projekt)

    // Zurueck kommt DASSELBE Objekt, das in `projekt.aktionen` steht - wie in #38 und #45.
    // Fuer den Renderer ist es ohnehin eine Kopie (IPC serialisiert); ein main-interner
    // Aufrufer bekaeme mit einer Kopie dagegen einen Stand, der sich vom gespeicherten
    // fortentwickeln kann.
    return { ok: true, wert: aktion }
  })
}
// Ausgang bei Erfolg: die aktualisierte Aktion (der lebende Eintrag der Bibliothek); auf der
// Platte steht sie erst nach der entprellten Auto-Speicherung (#47).
// Auf jedem Fehlerpfad bleibt Project.aktionen unveraendert.

/** Ein abgelehnter Aufruf - immer ohne jede Wirkung auf D1. */
function ungueltig(meldung: string): Ergebnis<Aktion> {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

/** Die Fehlerseite der Huelle. Beide Codes sind generisch (ergebnis.ts, #12). */
function fehler(
  code: 'nicht_gefunden' | 'ungueltige_eingabe',
  meldung: string,
): Ergebnis<Aktion> {
  return { ok: false, fehler: { code, meldung } }
}

/**
 * Eine Zahl, die sich unveraendert speichern und wieder lesen laesst - sonst `null`.
 *
 * WORTGLEICH ZU `dauerOderNull` IN #38, und zwar bewusst als KOPIE: Dort ist die Funktion
 * modulprivat und wird nicht exportiert. Sie von hier zu importieren hiesse, sie in
 * `erstelle-aktion.ts` zu oeffnen - eine fremde, fertige Datei anzufassen, nur um eine Zeile
 * zu teilen. Weicht eine der beiden je ab, ist das ein Befund fuer den Prueflauf.
 *
 * WARUM DER WERT NICHT STEHEN BLEIBEN DARF: `JSON.stringify` schreibt fuer `NaN` und
 * `Infinity` `null` in die Datei. Ohne diese Zeile stuende im Speicher `NaN`, auf der Platte
 * `null` - Speicher und Datei sagten Verschiedenes, und beim naechsten Laden waere die Aktion
 * eine andere. `null` heisst hier ohnehin "keine Vorgabe", also genau das, was eine
 * unbrauchbare Zahl bedeutet.
 *
 * WARUM KEIN DRITTER ABLEHNUNGSGRUND: Die Fehlerpfad-Tabelle des Issues ist als
 * "(vollstaendig)" ueberschrieben; einen Fehlercode fuer eine Zahl zu erfinden, die ohnehin
 * "kein Wert" bedeutet, waere eine Vertragsaenderung ohne Gewinn. S. Bericht/STOPP.
 */
function brauchbareDauer(wert: number | null): number | null {
  return typeof wert === 'number' && Number.isFinite(wert) ? wert : null
}

// ---------------------------------------------------------------------------
// NICHT HIER, UND GEMELDET:
//
// 1. `id` IST NICHT AENDERBAR - und das ist kein Versehen, sondern die Signatur:
//    `Partial<Omit<Aktion, 'id'>>` kennt das Feld nicht. Diese Datei liest es deshalb auch
//    nicht aus `aktionsdaten` aus; schickt ein Renderer eines mit, landet es nirgends (kein
//    Spread, s. o.). Das ist richtig so: Listenelemente verweisen ueber genau diese Kennung
//    auf die Aktion (TK 9.11.3), ein Wechsel machte jedes davon zum kaputten Element.
//
// 2. KEINE MARKEN-KENNUNG. TK 9.8.2 fuehrt in `Aktion` ein Pflichtfeld `markeId: string`;
//    der gebaute Typ (#14) hat es NICHT. M8 (#320, "M8-46") sieht dafuer eine eigene Zeile in
//    dieser Funktion vor ("ein mitgeschicktes, leeres `markeId` -> `ungueltige_eingabe`;
//    nicht mitgeschickt = unveraendert"). Sie ist heute nicht baubar - das Feld existiert im
//    geteilten Vertrag nicht, und es hier zu erfinden waere eine Vertragsaenderung an einem
//    geteilten Typ. Kommt das Feld, gehoert genau EIN weiterer Block in die Zuweisungskette
//    oben; die Form-Pruefung dafuer ist dieselbe wie bei `vorlagenId`. Dieselbe Meldung steht
//    bereits in #33 und #38.
//
// 3. KEINE PRUEFUNG DER REFERENZEN. Aendert sich `bildRef` oder `vorlagenId`, aendern sich
//    damit ALLE Listenelemente und Band-Abschnitte, die diese Aktion verwenden (Issue,
//    "Warum das im Gesamtsystem wichtig ist") - das ist GEWOLLT (TK 9.8.5) und braucht hier
//    keine Kaskade. Diese Funktion aendert nur den `Aktion`-Datensatz; wer die Elemente neu
//    zeichnet, ist der composer.
//
// 4. KEIN SCHNAPPSCHUSS FUER UNDO. TK 9.13.1 fuehrt "Aktionen: bearbeiten" ausdruecklich als
//    undo-faehig, 9.13.2 verlangt den Schnappschuss vor jeder Instant-Operation. Er entsteht
//    aber nicht hier, sondern an der EINEN Stelle im Renderer, die jede Aenderung passiert
//    (#243, die Huelle um die gemeinsame Projekt-Sicht).
//
// 5. KEIN IPC-KANAL. Diese Datei meldet sich nirgends an; die Verdrahtung von
//    `project:bearbeiteAktion` liegt beim ipc-gateway (#76). Ohne sie bliebe die Funktion
//    eine Main-Funktion ohne Aufrufer.
