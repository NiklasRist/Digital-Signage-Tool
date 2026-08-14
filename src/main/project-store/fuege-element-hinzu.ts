// GENERIERT aus dem Signaturblock von Issue #41.
// [project-store] fügeElementHinzu implementieren
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
// GERUEST-PRUEFSUMME: b96baff0ec291e8f
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.
// [ERLEDIGT: Zeile 1 ist mit diesem Rumpf entfernt - Parameter und Importe werden
//  benutzt.]

import { erzeugeId } from '../../shared/contracts/id'                              // #20
import { DAUER_BEREICH, STANDARD_ANZEIGEDAUER_SEKUNDEN } from '../../shared/contracts/konstanten' // #21

import { holeAktivesProjekt } from './aktives-projekt'                             // #192
import { planeAutoSpeicherung } from './auto-speichern'                            // #47
import { mitD1Lock } from './d1-lock'                                              // #32

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #20:  erzeugeId(): string
//         // UUID v4, "die EINE Stelle, an der IDs entstehen" (TK 9.11.4). Kann nicht
//         // regulaer fehlschlagen; hier wird nichts nachgebaut und nichts abgefangen.
//   #21:  STANDARD_ANZEIGEDAUER_SEKUNDEN: number   // 10
//         DAUER_BEREICH: { readonly min: number; readonly max: number }   // 10 / 45
//         // "Konstanten in contracts/types (an *einer* Stelle, nicht verstreut)" (TK 9.11.4).
//   #32:  mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//         // fuehrt aktion() garantiert seriell aus (FIFO, prozessintern, KEINE Datei-Sperre);
//         // der kritische Abschnitt darf selbst NICHT erneut mitD1Lock aufrufen
//         // (Deadlock-Gefahr).
//   #47:  planeAutoSpeicherung(projekt: Project): void
//         // merkt projekt als zu speichernde, aktuelle Version vor und (re-)startet den
//         // 3-5s-Entprellungstimer; SYNCHRON, nimmt KEIN Lock, kann nicht fehlschlagen.
//         // Setzt seit dem 12.08.2026 ausserdem Project.geaendertAm - DIESE Datei also nicht.
//   #192: holeAktivesProjekt(): Project | null
//         // das aktuell geoeffnete Projekt als LEBENDEN Stand (dieselbe Objektreferenz, die
//         // die Instant-Operationen mutieren) - KEINE Kopie; kein Projekt offen -> null.
//         // SYNCHRON, NIMMT KEIN LOCK, WIRFT NIE.

import type { Aktion } from '../../shared/contracts/aktion'
import type { Asset } from '../../shared/contracts/asset'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProjectStoreFehlercode } from './assets'            // #72
import type { Listenelement } from '../../shared/contracts/project'
export async function fügeElementHinzu(
  referenz: string,
): Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>> {
  // DAS LOCK NIMMT DIESE FUNKTION SELBST - dieselbe Linie wie #38, #42, #44, #45. Sie darf
  // NICHT noch einmal in mitD1Lock eingewickelt werden; der innere Aufruf wartete auf den
  // aeusseren, der auf ihn wartet (#32, "Deadlock-Gefahr").
  //
  // WARUM EIN LOCK, OBWOHL NUR IM SPEICHER GEARBEITET WIRD: Der kritische Abschnitt ist
  // "nachschlagen, dann anhaengen". Zwischen dem Nachschlagen der Referenz und dem `push`
  // darf kein loescheMedium (#87) das Asset aus Project.assets nehmen und kein
  // schreibeProjekt (#46) das Projekt serialisieren - sonst stuende in der project.json ein
  // Element, dessen Referenz schon beim Schreiben ins Leere zeigte. TK 9.5.1 verlangt
  // ohnehin das eine D1-Lock, "durch das ALLE project.json-Mutationen laufen"; eine Ausnahme
  // "das hier ist ja nur Speicher" waere der Anfang eines zweiten Regelwerks.
  //
  // Der Rueckgabetyp des Abschnitts steht ausgeschrieben da, statt sich ableiten zu lassen:
  // Ohne ihn wuerde `ok: false` in einem Objektliteral zu `boolean` verbreitert, und die
  // Ergebnis-Huelle waere nicht mehr diskriminierbar.
  return mitD1Lock(async (): Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>> => {
    const projekt = holeAktivesProjekt()
    if (projekt === null) {
      // KEIN OFFENES PROJEKT -> `nicht_gefunden`, kein eigener Code. Die als "(vollstaendig)"
      // ueberschriebene Fehlerpfad-Tabelle des Issues kennt genau eine Zeile, und die trifft
      // fachlich zu: Ohne offenes Projekt gibt es weder `Project.assets` noch
      // `Project.aktionen`, in denen diese Referenz stehen koennte. Dieselbe Antwort geben
      // #38, #42, #43, #44 und #45 - der Bestand ist hier einheitlich, und ein zweiter Code
      // danebenzustellen waere eine Vertragsaenderung. Gemeldet, s. Bericht/STOPP.
      return fehler(
        'kein_projekt',
        'Es ist kein Projekt geoeffnet, in dessen Wiedergabeliste das Element gehoeren koennte.',
      )
    }

    // KEINE EIGENE FORMPRUEFUNG DER `referenz`. Ueber die Prozessgrenze kann ein `unknown`
    // als `string` getarnt hereinkommen (TK 9.1.1 Punkt 6) - hier ist das gefahrlos: Die
    // beiden Suchen unten sind reine Gleichheitstests, sie werfen bei keinem Wert und
    // treffen bei keinem Unsinnswert. Ein leerer String, `null` oder ein Objekt landen also
    // auf demselben Weg bei `nicht_gefunden`, ohne dass ein zweiter Fehlercode noetig waere.
    //
    // ZUERST DIE ASSETS, DANN DIE AKTIONEN - und die Reihenfolge ist eine Festlegung, keine
    // Beilaeufigkeit: Traegt ein beschaedigtes Projekt dieselbe Kennung in beiden Bestaenden,
    // gewinnt das Asset. Beide IDs sind UUIDs (TK 9.11.4), der Fall kann also nur aus einer
    // von Hand veraenderten project.json kommen; eine Antwort muss die Funktion trotzdem
    // haben, und "die erste Fundstelle in der Suchreihenfolge" ist die einzige, die ohne
    // einen Fehlercode auskommt, den die Tabelle nicht kennt.
    const asset = projekt.assets.find((eintrag) => eintrag.id === referenz)
    const aktion =
      asset === undefined ? projekt.aktionen.find((eintrag) => eintrag.id === referenz) : undefined

    // DAS NEUE ELEMENT WIRD JE ART VOLLSTAENDIG BELEGT, nicht teilweise. Die Belegungstabelle
    // aus TK 9.11.3 ist als "(bindend)" ueberschrieben und laesst kein Feld offen; ein
    // fehlendes Feld waere ueberdies `undefined`, und `JSON.stringify` liesse den Schluessel
    // beim Speichern weg - nach dem naechsten Laden liefe jede Pruefung auf `=== null` daran
    // vorbei. Der Unterschied waere erst nach einem Neustart sichtbar.
    //
    // Die Fallunterscheidung steht ausgeschrieben da, statt die Nicht-Fundstelle vorab
    // abzufangen und danach die verbliebene Moeglichkeit zu behaupten: Eine Behauptung
    // (`as`, `!`) waere hier genau die Fluchttuer, die der Bestand verbietet - und sie waere
    // falsch, sobald jemand die Suchreihenfolge oben aendert.
    let ergebnis: Ergebnis<Listenelement, ProjectStoreFehlercode>
    if (asset !== undefined) {
      ergebnis = bauAusAsset(asset)
    } else if (aktion !== undefined) {
      ergebnis = bauAusAktion(aktion)
    } else {
      // Die EINE Zeile der Fehlerpfad-Tabelle. `String(...)` statt der Einbettung ueber die
      // Vorlage, weil der Wert ueber die Prozessgrenze auch etwas anderes als ein String
      // sein kann.
      return fehler(
        'nicht_gefunden',
        `Die Referenz ${String(referenz)} gehoert in diesem Projekt weder zu einem Medium ` +
          'noch zu einer Aktion.',
      )
    }

    if (!ergebnis.ok) {
      return ergebnis
    }
    const element = ergebnis.wert

    // ANS ENDE. "die naheliegende Umkehrung `fügeElementHinzu` vergibt eine neue `id`
    // (9.11.4) und hängt das Element ans Ende" (TK 9.5.2, wörtlich, ohne die
    // Hervorhebungssterne des Originals) - das ist
    // keine eigene Wahl, sondern steht so im Vertrag. Die Signatur kennt ohnehin keinen
    // Positionsparameter; wer das Element woanders haben will, ruft danach `ordneNeu` (#43).
    // Ein `unshift` waere die stille Behauptung "neueste zuerst", die kein Vertrag aufstellt.
    //
    // `push` und NICHT eine Zuweisung an `projekt.liste`: Die Reihenfolge IST die
    // Array-Reihenfolge (TK 9.11.3, "kein separates position-Feld"), und #43 haelt sich aus
    // demselben Grund an `splice` - wer eine Referenz auf das Array haelt (der Renderer haelt
    // sie), saehe nach einer Zuweisung fuer immer den alten Stand.
    //
    // Mutiert wird der LEBENDE Stand: #192 gibt "dieselbe Objektreferenz" heraus, "keine
    // Kopie" - und es geschieht INNERHALB des Locks.
    projekt.liste.push(element)

    // ENTPRELLT, NICHT SOFORT. Das Hinzufuegen ist eine Instant-Operation (TK 9.5.4:
    // "Instant-Operationen (Millisekunden)"), kein Auftrag - nur Auftraege schreiben am Ende
    // sofort (sofortFlush, TK 9.5.4 Faelle 1-4). Wer eine Wiedergabeliste zusammenstellt,
    // legt mehrere Elemente hintereinander ab; jedes einzeln zu schreiben waere genau das,
    // wogegen die Entprellung existiert.
    //
    // Uebergeben wird das LEBENDE Projekt, damit der ablaufende Termin den dann NEUESTEN
    // Stand schreibt. `Project.geaendertAm` setzt diese Datei NICHT - das tut seit dem
    // 12.08.2026 planeAutoSpeicherung (#47) als der eine Engpass, durch den jede Aenderung
    // laeuft. Zwei Stellen fuer denselben Zeitstempel liefen unweigerlich auseinander.
    planeAutoSpeicherung(projekt)

    // Zurueck geht DASSELBE Objekt, das in `projekt.liste` haengt - keine Kopie. Ueber den
    // IPC-Vertrag wird ohnehin serialisiert (der Renderer bekommt also einen Wert); ein
    // main-interner Aufrufer bekaeme mit einer Kopie dagegen einen Stand, der sich vom
    // gespeicherten fortentwickeln kann - die zweite Wahrheit, die #192 ausschliesst.
    return { ok: true, wert: element }
  })
}
// referenz ist entweder eine Asset-ID (video|bild) oder eine Aktions-ID (segment)

// ---------------------------------------------------------------------------
// Die beiden Bauwege. Getrennt, weil sich hier der Fehler aus der Einleitung des Issues
// einnistet: Wer `art` und Feldbelegung an zwei Stellen entscheidet, bekommt irgendwann ein
// Video mit `dauer` oder ein Bild mit `trimEnde` - und beides faellt erst am fertigen Video
// auf. Jede der beiden Funktionen belegt ALLE sieben Felder von `Listenelement`.
// ---------------------------------------------------------------------------

/**
 * Video- und Bild-Elemente. Die `art` folgt AUSSCHLIESSLICH `Asset.typ` - nie der
 * Dateiendung, nie dem Namen (genau die Verwechslung beschreibt das Issue als Schaden).
 */
function bauAusAsset(asset: Asset): Ergebnis<Listenelement, ProjectStoreFehlercode> {
  if (asset.typ === 'video') {
    // VOLLE LAENGE ALS VORBELEGUNG: trimStart = 0, trimEnde = Asset.dauer. Das ist die offen
    // benannte Festlegung des Issues (kein TK-Zitat) und die einzige, die nichts wegnimmt:
    // Wer ein Video einfuegt, will erst einmal das ganze Video; kuerzen kann er danach mit
    // setzeTrim (#44). Ein voreingestellter Ausschnitt wuerde dagegen Material verschwinden
    // lassen, ohne dass jemand es gewaehlt hat.
    //
    // Die so erzeugten Werte erfuellen die Pruefung von #44 (0 <= start < ende <= Quelldauer)
    // - absichtlich, denn sonst waere jedes frisch eingefuegte Video ein Element, dessen
    // eigener Zustand von der Operation abgewiesen wuerde, die ihn aendern soll.
    const quelldauer = asset.dauer
    if (quelldauer === null || !Number.isFinite(quelldauer) || quelldauer <= 0) {
      // NICHT IN DER FEHLERPFAD-TABELLE, und deshalb gemeldet (s. Dateiende, Punkt 1).
      // `Asset.dauer` ist laut #13 nur bei BILDERN null; ein Video-Asset ohne brauchbare
      // Laufzeit ist ein beschaedigter Datenstand. Ihn trotzdem einzufuegen ginge nur mit
      // `trimEnde: null` (verletzt die bindende Belegungstabelle TK 9.11.3) oder mit
      // `trimEnde: 0` (verletzt `start < ende` aus TK 9.5.2) - beides waere ein Element, das
      // der Render nicht schneiden kann und das keine Operation mehr geradezieht.
      //
      // Bewusst `ungueltige_eingabe` und NICHT `nicht_gefunden`: Das Medium IST gefunden.
      // Ein Aufrufer, der hier `nicht_gefunden` bekaeme, duerfte schliessen, das Asset sei
      // verschwunden, und es aus seiner Anzeige nehmen - dieselbe Abwaegung wie in #44.
      return fehler(
        'ungueltige_eingabe',
        `Zum Video ${asset.id} ist keine brauchbare Laufzeit hinterlegt; ohne sie laesst ` +
          'sich kein Ausschnitt vorbelegen.',
      )
    }

    return {
      ok: true,
      wert: {
        id: erzeugeId(),
        art: 'video',
        ref: asset.id,
        // "null - die Dauer ergibt sich aus dem Trim" (TK 9.11.3, Belegungstabelle).
        dauer: null,
        trimStart: 0,
        trimEnde: quelldauer,
        // "erlaubt", nicht "gesetzt" (TK 9.11.3). Eine Einblendung entsteht erst, wenn der
        // Nutzer sie in der Bandbearbeitung waehlt (setzeEinblendung, TK 9.5.2) - hier eine
        // leere Huelle anzulegen hiesse, ein Band zu behaupten, das es nicht gibt.
        einblendung: null,
      },
    }
  }

  if (asset.typ === 'bild') {
    return {
      ok: true,
      wert: {
        id: erzeugeId(),
        art: 'bild',
        ref: asset.id,
        // DIE KONSTANTE, NICHT DIE ZAHL 10. "Konstanten in contracts/types (an *einer*
        // Stelle, nicht verstreut)" (TK 9.11.4) - eine abgeschriebene 10 waere die zweite
        // Quelle, die beim ersten Aendern der Vorbelegung auseinanderlaeuft. Ein Bild hat
        // keine Eigenlaenge, also gibt es nichts anderes, woraus die Dauer folgen koennte.
        dauer: STANDARD_ANZEIGEDAUER_SEKUNDEN,
        trimStart: null,
        trimEnde: null,
        einblendung: null,
      },
    }
  }

  // UNBEKANNTE ART. Nach dem Typ (#13) unerreichbar, nach der Laufzeit nicht: `Asset.typ`
  // kommt aus einer geladenen project.json. Der Zweig existiert, damit ein unbekannter Wert
  // NICHT stillschweigend als Bild durchgeht - genau die Verwechslung, gegen die dieses
  // Issue geschrieben ist ("landet das Element mit der falschen Feldbelegung in der Liste").
  // Lieber ein sichtbarer Fehler als ein Standbild, das ein Video sein sollte.
  return fehler(
    'ungueltige_eingabe',
    `Das Medium ${asset.id} traegt die unbekannte Art "${String(asset.typ)}"; daraus laesst ` +
      'sich kein Listenelement bilden.',
  )
}

/**
 * Segment-Elemente. Eine Aktion wird immer zu `art: "segment"` - eine andere Zuordnung gibt
 * es nicht (TK 9.11.3).
 */
function bauAusAktion(aktion: Aktion): Ergebnis<Listenelement, ProjectStoreFehlercode> {
  return {
    ok: true,
    wert: {
      id: erzeugeId(),
      art: 'segment',
      // "mehrere Listenelemente dürfen dieselbe Aktion referenzieren" (TK 9.7.2) - hier wird
      // deshalb NICHT geprueft, ob die Aktion schon in der Liste steht. Die Aktion selbst
      // wird nur referenziert, nie kopiert; sie bleibt Eigentum von Project.aktionen.
      ref: aktion.id,
      dauer: startdauer(aktion.standardDauer),
      trimStart: null,
      trimEnde: null,
      einblendung: null,
    },
  }
}

/**
 * Die Anfangsdauer eines Segment-Elements.
 *
 * "`standardDauer` ist nur ein Default: … Beim Platzieren wird `standardDauer` als Startwert
 * übernommen, danach überschreibbar." (TK 9.8.4, wörtlich) - genau das geschieht hier, und
 * nur das: Der Wert wird UEBERNOMMEN, nicht zurueckgeschrieben. Wer das Element spaeter
 * aendert (#45), aendert die Aktion nicht mit.
 *
 * WARUM DER BEREICH TROTZDEM GEPRUEFT WIRD, obwohl das Issue nur "falls gesetzt" sagt:
 * `erstelleAktion` (#38) prueft die Spanne ausdruecklich NICHT ("weder die Spanne 10-45 s
 * geprueft" - der Editor meldet sie dem Nutzer nur als Hinweis, #136). In `Aktion.standardDauer`
 * darf also eine 3 oder eine 100 stehen. Die Belegungstabelle TK 9.11.3 ist dagegen "(bindend)"
 * und schreibt fuer `segment` "gesetzt (10-45 s)" vor - ein uebernommener Ausreisser erzeugte
 * also sofort ein Element, das seine eigene Invariante verletzt und das setzeDauer (#45)
 * anschliessend nicht mehr auf denselben Wert setzen koennte.
 *
 * NICHT BEGRENZT, SONDERN AUF DIE STANDARDDAUER ZURUECKGEFALLEN: Ein Zurechtstutzen auf 45
 * gaebe dem Nutzer einen Wert, den weder er noch die Aktion je genannt hat, und liesse
 * zugleich glauben, seine Vorgabe sei uebernommen worden. Der dokumentierte Standard ist die
 * ehrlichere Antwort - er ist ohnehin das, was bei `null` gilt, und ein unbrauchbarer Wert
 * bedeutet fachlich dasselbe wie "keine Vorgabe" (dieselbe Linie wie `dauerOderNull` in #38).
 * Der Bereich kommt aus DAUER_BEREICH (#21), nie als Zahlenpaar.
 *
 * `Number.isFinite` VOR den Bereichsvergleichen, nicht daneben: Jeder Vergleich mit `NaN` ist
 * falsch, `NaN < min` und `NaN > max` waeren also BEIDE falsch - `NaN` rutschte durch eine
 * reine Bereichspruefung glatt hindurch und stuende danach als `null` in der project.json
 * (JSON kennt kein NaN). Dieselbe Reihenfolge wie in #44 und #45.
 */
function startdauer(standardDauer: number | null): number {
  if (
    typeof standardDauer === 'number' &&
    Number.isFinite(standardDauer) &&
    standardDauer >= DAUER_BEREICH.min &&
    standardDauer <= DAUER_BEREICH.max
  ) {
    return standardDauer
  }
  return STANDARD_ANZEIGEDAUER_SEKUNDEN
}

/** Die Fehlerseite der Huelle. Beide Codes sind generisch (ergebnis.ts, #12). */
function fehler(
  code: 'nicht_gefunden' | 'ungueltige_eingabe' | ProjectStoreFehlercode,
  meldung: string,
): Ergebnis<Listenelement, ProjectStoreFehlercode> {
  return { ok: false, fehler: { code, meldung } }
}

// ---------------------------------------------------------------------------
// NICHT HIER, UND GEMELDET:
//
// 1. ZWEI FEHLERPFADE UEBER DIE TABELLE HINAUS. Die Fehlerpfad-Tabelle des Issues ist als
//    "(vollstaendig)" ueberschrieben und kennt nur `nicht_gefunden`. Diese Datei gibt
//    zusaetzlich `ungueltige_eingabe` bei einem Video-Asset ohne brauchbare `dauer` und bei
//    einem Asset mit unbekanntem `typ`. Beide Codes traegt die Signatur (sie sind generisch),
//    ein Notbehelf ist es also nicht - aber es ist eine Erweiterung des Vertrags, und sie
//    gehoert bestaetigt. Die Gegenprobe waere schlechter: Ein Element, das die bindende
//    Belegungstabelle (TK 9.11.3) verletzt, faellt erst im Render auf.
//
// 2. KEINE AUSWERTUNG VON `Asset.zustand`. Ein Medium mit zustand "fehlt" wird ganz normal
//    eingefuegt; das Element landet damit sofort im Reparatur-Modus (TK 9.7.5). Der
//    STOPP-Block des Issues stellt genau diese Frage und beantwortet sie selbst mit einem
//    Argument ("nachtraegliche Erkennung bereits vorhandener kaputter Elemente"); gebaut ist
//    die Nicht-Blockade auch deshalb, weil der Bestand sie an der Nachbarstelle bereits so
//    haelt (#38 nimmt ein `bildRef` auf ein fehlendes Asset ausdruecklich an, "die Aktion muss
//    erst einmal existieren, damit man sie reparieren kann"). Eine Sperre haette ueberdies
//    keinen Code in der Tabelle. Offen und gemeldet.
//
// 3. KEINE EINFUEGEPOSITION. Die verbindliche Signatur nimmt genau einen Parameter; ein
//    zweiter ("vor welchem Element") waere eine Vertragsaenderung. Wer per Drag-and-Drop an
//    eine bestimmte Stelle ablegt, fuegt an und sortiert danach mit `ordneNeu` (#43) - beide
//    Operationen fuehrt TK 9.7.2 als Ausgang des composer nebeneinander auf. Eine
//    "ungueltige Einfuegeposition" kann es hier daher nicht geben.
//
// 4. KEINE PRUEFUNG AUF DOPPELTE VERWENDUNG. Dieselbe Aktion und dasselbe Medium duerfen
//    mehrfach in der Liste stehen ("mehrere Listenelemente dürfen dieselbe Aktion
//    referenzieren", TK 9.7.2) - eine Wiederholung im Reel ist der Normalfall, keine
//    Verwechslung.
//
// 5. KEIN SETZEN VON `Project.geaendertAm`. Der STOPP-Block des Issues verbietet die
//    Festlegung; entschieden ist sie inzwischen anderswo: `planeAutoSpeicherung` (#47) setzt
//    den Zeitstempel seit dem 12.08.2026 an der einen Stelle, durch die jede Aenderung laeuft.
//    Diese Datei fasst das Feld deshalb nicht an - zwei Stempler waeren die zweite Quelle.
//
// 6. KEIN SCHNAPPSCHUSS FUER UNDO. TK 9.13.2 verlangt ihn vor jeder Instant-Operation; gebaut
//    wird er nach M7-Beschluss in der Huelle um die gemeinsame Projekt-Sicht (#243), nicht in
//    den dreissig aufrufenden Operationen.
//
// 7. KEIN IPC-KANAL, KEINE ANMELDUNG. Der Weg vom Renderer hierher entsteht in
//    verdrahteProjectStoreIPC (#75/#76); diese Datei kennt den Kanal nicht. Ohne die
//    Verdrahtung ist die Funktion fertig, aber vom composer aus unerreichbar.
