// GENERIERT aus dem Signaturblock von Issue #120.
// [project-store] setzeEinblendung implementieren
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
// GERUEST-PRUEFSUMME: 9e5d360659e43689
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// [ERLEDIGT: Die Zeile ist mit dem Fuellen des Rumpfes entfernt - alle Parameter
//  und Importe werden benutzt.]

import { holeAktivesProjekt } from './aktives-projekt'   // #192
import { planeAutoSpeicherung } from './auto-speichern'  // #47
import { mitD1Lock } from './d1-lock'                    // #32

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #32:  mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//         // fuehrt aktion() garantiert seriell aus (FIFO, prozessintern, KEINE Datei-Sperre);
//         // der kritische Abschnitt darf NICHT erneut mitD1Lock rufen (Deadlock-Gefahr).
//   #47:  planeAutoSpeicherung(projekt: Project): void
//         // merkt projekt als zu speichernde, aktuelle Version vor und (re-)startet den
//         // Entprellungstimer. SYNCHRON, kein Rueckgabewert, nimmt KEIN Lock.
//   #192: holeAktivesProjekt(): Project | null
//         // das aktuell geoeffnete Projekt als LEBENDEN Stand (dieselbe Objektreferenz, die
//         // die Instant-Operationen mutieren), kein Projekt offen -> null. SYNCHRON, NIMMT
//         // KEIN LOCK, WIRFT NIE.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProjectStoreFehlercode } from './assets'   // #72
import type { Einblendung, Listenelement } from '../../shared/contracts/project'
export async function setzeEinblendung(
  elementId: string,
  einblendung: Einblendung | null,   // null = Band entfernen; Typ aus #15
): Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>> {
  // FUER AUFRUFER: Das Lock wird hier SELBST genommen - dieselbe Linie wie #44/#45. Diese
  // Funktion darf NICHT noch einmal in mitD1Lock eingewickelt werden (#32 ist nicht reentrant).
  //
  // Das Lock liegt UM ALLES, nicht nur um die Zuweisung. Der kritische Abschnitt ist die Folge
  // Lesen -> Pruefen -> Schreiben: Zwischen dem Nachschlagen der Aktionen und dem Setzen des
  // Bandes koennte sonst loescheAktion (#39) genau eine der geprueften Aktionen entfernen, und
  // im Modell stuende danach ein Band, dessen Abschnitte ins Leere zeigen - geprueft gegen
  // einen Stand, den es beim Schreiben nicht mehr gibt.
  return mitD1Lock(async (): Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>> => {
    const projekt = holeAktivesProjekt()
    if (projekt === null) {
      // NICHT in der Fehlerpfad-Tabelle des Issues - dort steht nur "elementId existiert nicht
      // in Project.liste". Ohne geoeffnetes Projekt gibt es diese Liste gar nicht. Der Code
      // `kein_projekt` ist am 13.08.2026 vom User entschieden und laut assets.ts (#72)
      // ausdruecklich fuer ALLE project-store-Mutationen einheitlich; die Nachbarn #44/#45
      // benutzen ihn bereits. S. Bericht (Abweichung zum einparametrigen Signatur-Zitat).
      return fehler('kein_projekt', 'Es ist kein Projekt geoeffnet; es wurde nichts geaendert.')
    }

    // LEBENDE Referenz, keine Kopie: #192 gibt ausdruecklich "dieselbe Objektreferenz" heraus,
    // die die Instant-Operationen mutieren. Wer hier eine Kopie zoege, aenderte sie - und
    // planeAutoSpeicherung schriebe spaeter den unveraenderten Originalstand.
    const element = projekt.liste.find((eintrag) => eintrag.id === elementId)
    if (element === undefined) {
      return fehler('nicht_gefunden', 'Zu dieser Kennung gibt es kein Element in der Wiedergabeliste.')
    }

    if (element.art !== 'video') {
      // "Parallele Baender gibt es NUR bei video-Items; bild und segment sind bereits
      // vollflaechige Standbilder." (TK 9.2.8, im Issue woertlich zitiert.)
      return fehler(
        'ungueltige_eingabe',
        `Ein Werbeband gibt es nur bei Video-Elementen; dieses Element ist ein ${element.art}-Element.`,
      )
    }

    // ------------------------------------------------------------------
    // PRUEFEN UND NORMALISIEREN - VOLLSTAENDIG, BEVOR IRGENDETWAS WIRKT.
    //
    // `pruefe` liefert entweder einen Fehler oder das fertige, in DIESER Datei neu gebaute
    // Band. Es mutiert nichts. Damit ist "auf jedem Fehlerpfad bleibt Project.liste
    // unveraendert" (TK 9.1.1 Punkt 6) nicht zugesichert, sondern strukturell wahr: Es gibt
    // keinen Rueckweg, der etwas zurueckdrehen muesste - insbesondere kann kein Band TEILWEISE
    // uebernommen werden, wenn erst der letzte Abschnitt auffaellt.
    // ------------------------------------------------------------------
    const geprueft = pruefe(einblendung, (aktionId) =>
      projekt.aktionen.some((aktion) => aktion.id === aktionId),
    )
    if (!geprueft.ok) {
      return geprueft
    }

    // AB HIER WIRKT ES.
    //
    // Zugewiesen wird das in `pruefe` neu gebaute Objekt, NICHT die hereingereichte
    // `einblendung`. Zwei Gruende: (1) Ein main-interner Aufrufer behielte sonst eine Referenz
    // auf ein Objekt, das jetzt IM Datenmodell haengt, und koennte es hinterher an D1 vorbei
    // veraendern - dieselbe Klasse von zweiter Wahrheit, die #192 fuer das Projekt
    // ausschliesst. (2) Der Neubau uebernimmt AUSSCHLIESSLICH die vier Felder des Vertrags
    // (#15); alles, was ein Renderer darueber hinaus mitschickte, faellt dabei weg, statt
    // ungeprueft in der project.json zu landen. Genau davor warnt die Einleitung des Issues
    // (kein zusaetzliches Feld an der Einblendung - die Geometrie gehoert der Vorlage).
    element.einblendung = geprueft.wert

    // `dauer`, `trimStart` und `trimEnde` werden NICHT angefasst: "Die Elementdauer bestimmt
    // allein das Video (Trim). Das Band verlaengert oder verkuerzt sie nie." (TK 9.2.8). Auch
    // kein vorsorgliches Setzen auf null - "bleibt" heisst unveraendert, nicht neu gesetzt; ein
    // kaputter Fremdstand bliebe sonst unsichtbar (gleiche Linie wie #44/#45).

    // Entprelltes Speichern, KEIN sofortFlush: Instant-Operation, kein Auftrag (TK 9.5.4).
    // Uebergeben wird die LEBENDE Referenz, damit der ablaufende Termin den dann neuesten Stand
    // schreibt (#47). Der Aufruf steht NOCH INNERHALB des Locks - er ist synchron und nimmt
    // selbst kein Lock, es entsteht also keine Schachtelung; ausserhalb koennte zwischen dem
    // Verlassen des Locks und dem Vormerken ein Projektwechsel liegen.
    //
    // Auch im Fall "war schon null, bleibt null" wird vorgemerkt. Das ist bewusst EIN Pfad
    // statt zweier: Ein Gleichheitsvergleich, der das Vormerken einspart, muesste bei einem
    // gesetzten Band tief vergleichen; ein flacher Vergleich waere fast immer falsch-negativ
    // und spaerte nichts. Ein zusaetzlicher entprellter Schreibvorgang kostet nichts, ein
    // ausgelassener verliert Daten.
    planeAutoSpeicherung(projekt)

    // Zurueck geht das LEBENDE Element, keine Kopie - ueber die IPC-Grenze wird ohnehin
    // serialisiert; main-intern bleibt es der eine Stand (gleiche Entscheidung wie #34/#44/#45).
    return { ok: true, wert: element }
  })
}

// ---------------------------------------------------------------------------
// Intern. Nicht exportiert: Eine zweite Stelle, die entscheidet, welches Band gueltig ist,
// liefe beim naechsten Zusatz auseinander. Wer diese Pruefung braucht, braucht setzeEinblendung.
// ---------------------------------------------------------------------------

/**
 * Prueft die hereingereichte Einblendung vollstaendig und baut sie neu auf.
 *
 * DIE LAUFZEITPRUEFUNG IST NICHT UEBERFLUESSIG, obwohl die Signatur `Einblendung | null` sagt:
 * Der Aufruf kommt ueber IPC aus dem Renderer (#153), und was dort ankommt, ist zur Laufzeit
 * ungeprueft - "Der Main validiert jede eingehende Nutzlast, er vertraut dem Renderer nicht"
 * (TK 9.1.1 Punkt 6). Ein statischer Typ ist ueber die Prozessgrenze hinweg eine Zusage, kein
 * Beleg.
 *
 * `istBekannteAktion` wird als FUNKTION hereingereicht und nicht als Aktionsliste: So kann diese
 * Pruefung nichts anderes tun, als zu fragen - sie kann Project.aktionen weder lesen noch
 * anfassen, und der Aufrufer behaelt die Hoheit ueber den Stand, gegen den geprueft wird.
 *
 * Der Rueckgabetyp ist dieselbe Ergebnis-Huelle wie aussen, damit ein Fehler unveraendert
 * durchgereicht werden kann. `Einblendung | null` als Erfolgswert: Das leere Band ist KEIN
 * Fehler, sondern normalisiert sich zu null (TK 9.5.3, s. unten).
 */
function pruefe(
  einblendung: Einblendung | null,
  istBekannteAktion: (aktionId: string) => boolean,
): Ergebnis<Einblendung | null, ProjectStoreFehlercode> {
  // Ausdruecklich beide leeren Werte: Ueber IPC serialisiertes JSON kennt kein `undefined`,
  // ein main-interner Aufrufer kann es aber sehr wohl uebergeben. Beide bedeuten dasselbe -
  // "kein Band" - und beide sind Erfolg, nicht Fehler.
  if (einblendung === null || einblendung === undefined) {
    return { ok: true, wert: null }
  }

  // `typeof [] === 'object'` und `typeof null === 'object'` - deshalb reicht typeof nicht.
  // Ein Array kaeme durch und truege danach weder bandVorlageId noch abschnitte.
  if (typeof einblendung !== 'object' || Array.isArray(einblendung)) {
    return fehlerhaft('Die Einblendung muss ein Objekt sein oder null (Band entfernen).')
  }

  const roh = einblendung as { bandVorlageId?: unknown; abschnitte?: unknown }

  const bandVorlageId = roh.bandVorlageId
  // REINE FORMPRUEFUNG. Ob es die Vorlage gibt und ob ihre Art zum Band passt, wird hier
  // NICHT geprueft: Vorlagen sind app-weit und gehoeren dem vorlagen-store (TK 9.12.1), eine
  // Pruefung hier fuehrte eine Abhaengigkeit project-store -> vorlagen-store ein, die das TK
  // nirgends vorsieht. Der STOPP-Block des Issues verbietet die Entscheidung ausdruecklich.
  // Folge, offen und gemeldet: Eine geloeschte Band-Vorlage faellt erst beim Render auf.
  if (typeof bandVorlageId !== 'string' || bandVorlageId.trim() === '') {
    return fehlerhaft('Zum Band fehlt die Angabe der Band-Vorlage.')
  }

  const abschnitte = roh.abschnitte
  if (!Array.isArray(abschnitte)) {
    return fehlerhaft('Die Abschnitte des Bandes muessen als Liste uebergeben werden.')
  }

  // DER RANDFALL AUS TK 9.5.3, hier auf dem SETZ-Weg statt auf dem Loeschweg: "Wird ein Band
  // durch das Entfernen leer (keine Abschnitte mehr), entfaellt die Einblendung ganz
  // (einblendung = null) - das Videoelement bleibt." Ein Band ohne Abschnitte haette nichts zu
  // zeigen, und der Render muesste eine Bandspur der Laenge 0 bauen. Deshalb Erfolg mit null
  // und KEIN Fehler: Sonst haenge der Zustand von D1 davon ab, auf welchem Weg der letzte
  // Abschnitt verschwunden ist.
  //
  // Beachte die Reihenfolge: Die Form von bandVorlageId wird VORHER geprueft. Ein Band ohne
  // Vorlage und ohne Abschnitte ist eine kaputte Nutzlast und wird abgewiesen - nicht
  // stillschweigend in "kein Band" umgedeutet.
  if (abschnitte.length === 0) {
    return { ok: true, wert: null }
  }

  const gebaut: Einblendung = { bandVorlageId, abschnitte: [] }

  for (const abschnitt of abschnitte) {
    if (typeof abschnitt !== 'object' || abschnitt === null || Array.isArray(abschnitt)) {
      return fehlerhaft('Jeder Abschnitt des Bandes muss ein Objekt mit Aktion und Dauer sein.')
    }

    const { aktionRef, dauer } = abschnitt as { aktionRef?: unknown; dauer?: unknown }

    if (typeof aktionRef !== 'string' || aktionRef.trim() === '') {
      return fehlerhaft('Zu einem Abschnitt des Bandes fehlt die Angabe der Aktion.')
    }

    // `Number.isFinite` MUSS vor jedem Groessenvergleich stehen: Jeder Vergleich mit NaN ist
    // falsch, auch `NaN <= 0` - eine reine Bereichspruefung wuerde NaN glatt durchwinken, und
    // in der project.json stuende danach `null` (JSON kennt kein NaN). `Number.isFinite`
    // schliesst NaN, Infinity und -Infinity in einem Zug aus und ist zugleich die
    // Typpruefung: Fuer eine Zeichenkette wie "12" liefert es false, anders als das globale
    // `isFinite`, das vorher umwandelt.
    if (!Number.isFinite(dauer)) {
      return fehlerhaft('Die Dauer eines Band-Abschnitts muss eine Zahl in Sekunden sein.')
    }

    // Nur `> 0`, KEIN Bereich. Die Spanne 10-45 s (DAUER_BEREICH, #21) gilt laut TK 9.5.2 und
    // 9.11.4 fuer LISTENELEMENTE vom Typ Bild/Segment; ein Band-Abschnitt ist etwas anderes -
    // er rotiert WAEHREND eines Videos, und eine Rotation im Sekundenbereich kann gewollt sein.
    // Das TK legt fuer Abschnitts-Dauern keinen Bereich fest, und der STOPP-Block des Issues
    // verbietet, das hier zu entscheiden. Offen und gemeldet.
    if ((dauer as number) <= 0) {
      return fehlerhaft('Die Dauer eines Band-Abschnitts muss groesser als null Sekunden sein.')
    }

    if (!istBekannteAktion(aktionRef)) {
      // `nicht_gefunden`, NICHT `ungueltige_eingabe`: Es geht um einen Verweis auf ein
      // Fachobjekt - dieselbe Klasse wie bei fuegeElementHinzu (#41). Formfehler am Band
      // (kein Array, fehlende Felder, Dauer keine Zahl) sind dagegen ungueltige_eingabe.
      //
      // Der ZUSTAND der Aktion wird ausdruecklich NICHT geprueft: Eine Aktion, deren Bild
      // fehlt, darf als Abschnitt gesetzt werden. TK 9.7.5 behandelt den kaputten
      // Band-Abschnitt als NACHTRAEGLICH erkannten Reparaturfall (Fall 3), und eine Sperre
      // hier blockierte die Reparaturwege, die selbst ueber diese Operation laufen.
      return {
        ok: false,
        fehler: {
          code: 'nicht_gefunden',
          meldung: 'Ein Abschnitt des Bandes verweist auf eine Aktion, die es in diesem Projekt nicht gibt.',
        },
      }
    }

    // Neu gebaut, Feld fuer Feld - kein Weiterreichen des hereingereichten Objekts. Die
    // Reihenfolge der Abschnitte IST die Array-Reihenfolge (TK 9.11.3, sinngemaess fuer
    // `abschnitte`); `push` erhaelt sie unveraendert, und es entsteht kein Sortier- oder
    // Indexfeld am Abschnitt.
    gebaut.abschnitte.push({ aktionRef, dauer: dauer as number })
  }

  // Die Dauern gehen ROH weiter, ungerundet - genau wie setzeTrim (#44) die rohen Trim-Sekunden
  // speichert. Die Rundung auf das Ausgaberaster passiert im render-service (TK 9.2.6/9.2.8);
  // zwei rundende Stellen waeren zwei Regeln, die auseinanderlaufen.
  return { ok: true, wert: gebaut }
}

/** Formfehler am Band. Eigene Hilfe, weil `pruefe` einen anderen Nutzwert traegt als aussen. */
function fehlerhaft(meldung: string): Ergebnis<Einblendung | null, ProjectStoreFehlercode> {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

/** Die Fehlerseite der Huelle nach aussen. */
function fehler(
  code: 'nicht_gefunden' | 'ungueltige_eingabe' | ProjectStoreFehlercode,
  meldung: string,
): Ergebnis<Listenelement, ProjectStoreFehlercode> {
  return { ok: false, fehler: { code, meldung } }
}

// ---------------------------------------------------------------------------
// WAS HIER BEWUSST NICHT STEHT - UND GEMELDET IST
//
// 1. KEIN GEOMETRIE-WERT AM BAND, IN KEINER FORM. Diese Datei kennt keine Bandhoehe, keine
//    Bildmasse, keine Deckkraft und keine Kompositionsart; sie importiert weder RENDER_PROFILE
//    (#18) noch berechneBandGeometrie (#239) und nennt keine Bildzahl. "Die Bandhoehe H stammt
//    ausschliesslich aus der Vorlage - sie ist KEIN Wert am Listenelement und nicht pro Element
//    ueberschreibbar." (TK 9.2.8). Der Neubau des Bandes in `pruefe` uebernimmt deshalb
//    ausschliesslich die vier Felder aus #15; ein zusaetzlich mitgeschicktes Feld faellt weg,
//    ohne dass diese Datei es benennen muesste.
//
// 2. KEINE RUNDUNG AUF DAS AUSGABERASTER. Gespeichert werden rohe Sekundenwerte; die
//    Frame-Rundung liegt im render-service (TK 9.2.6, im Issue woertlich zitiert).
//
// 3. KEINE EXISTENZ- ODER ARTPRUEFUNG DER BAND-VORLAGE. Nur Formpruefung (nicht leerer String).
//    Der STOPP-Block des Issues verbietet die modulaebergreifende Pruefung; offen ist, ob sie
//    spaeter dazukommt. Folge heute: eine falsche oder geloeschte Band-Vorlage faellt erst beim
//    Render auf (bestimmeBandgeometrie, #176, ungueltiges_element).
//
// 4. KEIN BEREICH FUER `abschnitte[].dauer` AUSSER `> 0`. STOPP-Block: ob zusaetzlich eine
//    Unter-/Obergrenze gilt und ob es dieselbe Konstante DAUER_BEREICH (#21) ist, ist nicht
//    hier zu entscheiden. Offen und gemeldet.
//
// 5. KEIN ANFASSEN VON `Project.geaendertAm`. Ebenfalls STOPP-Block; alle Liste-Mutationen
//    (#41-#45) verhalten sich gleich, naemlich gar nicht. Die Luecke ist real - ausser
//    erstelleProjekt (#33) setzt den Zeitstempel im gesamten gebauten Bestand niemand.
//
// 6. KEIN UNDO-SCHNAPPSCHUSS. TK 9.13.2 verlangt ihn vor jeder Instant-Operation; gebaut wird
//    er nach M7-Beschluss in der Huelle um die gemeinsame Projekt-Sicht (#243), nicht in den
//    aufrufenden Operationen.
//
// 7. KEIN IPC-KANAL. `project:setzeEinblendung` wird hier nicht angemeldet und nichts in
//    kanaele.ts eingetragen - das tut #153 (verdrahteProjectStoreNachtragIPC). Ausdrueckliches
//    Verbot im STOPP-Block dieses Issues.
