// GENERIERT aus dem Signaturblock von Issue #57.
// [auftrags-manager] Q4-Warteschlangenjournal rotierend führen
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
// GERUEST-PRUEFSUMME: 504811fd1556c856
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
//
// ERLEDIGT (13.08.2026): Die Abschaltzeile ist mit dem Fuellen des Rumpfes entfernt;
// Parameter und Importe werden jetzt benutzt. Der Absatz darueber bleibt als Beleg
// stehen.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { JournalEintrag } from '../../shared/contracts/protokoll'
import type { QueueFehlercode } from './schreibe-queue-json'   // = 'speicher_fehler' (#69)

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #69: leseQueueDatei<T>(pfad: string, fallback: T): Promise<Ergebnis<T, QueueFehlercode>>
//   #69: schreibeQueueDatei(pfad: string, inhalt: unknown): Promise<Ergebnis<void, QueueFehlercode>>
//   #69: const QUEUE_SCHEMA_VERSION = 1   // gilt fuer Q2, Q3 und Q4 – KEINE eigene Zahl erfinden
//   #5:    ermittleDatenOrt(): string       // app-weiter Datenort der portablen App

// Die Wert-Importe zu den drei Zeilen darueber. Sie stehen bewusst UNTER dem
// Vertragsblock, damit die vom Generator gesetzten Zeilen unveraendert bleiben.
import path from 'node:path'

import type { Bewegung } from '../../shared/contracts/protokoll'
import { ermittleDatenOrt } from '../datenort'
import { QUEUE_SCHEMA_VERSION, leseQueueDatei, schreibeQueueDatei } from './schreibe-queue-json'

const MAX_JOURNAL_EINTRAEGE = 1000   // modul-lokale Konstante, NICHT in die projektweiten
                                     // Konstanten (#21) auslagern – das waere eine fremde Datei

/** Der Dateiname aus TK 9.3, app-weit im Datenort (#5). */
const JOURNAL_DATEINAME = 'warteschlangen-journal.json'

/**
 * Die vier gueltigen Bewegungen als LAUFZEIT-Wert.
 *
 * Warum ein `Record<Bewegung, true>` und kein Array von Literalen: #53 exportiert
 * `Bewegung` nur als Typ, geprueft werden muss aber zur Laufzeit. Ein Array
 * `['eingereiht', …]` liefe still auseinander, sobald #53 eine fuenfte Bewegung
 * ergaenzt - die Pruefung wiese sie dann ab, ohne dass irgendetwas rot wuerde. Der
 * Record erzwingt die Vollstaendigkeit im Typecheck: Ein neues Glied der Union laesst
 * DIESE Zeile brechen, und das ist der richtige Ort dafuer.
 */
const BEWEGUNGEN: Record<Bewegung, true> = {
  eingereiht: true,
  gestartet: true,
  entfernt: true,
  erneut_eingereiht: true,
}

/**
 * Die Dateiform. NICHT exportiert - die DoD verlangt, dass diese Datei
 * ausschliesslich `haengeJournalEintragAn` nach aussen gibt.
 */
interface Q4Datei {
  schemaVersion: number
  eintraege: JournalEintrag[]
}

export async function haengeJournalEintragAn(eintrag: JournalEintrag): Promise<Ergebnis<void, QueueFehlercode>> {
  try {
    // 1. EINGANG PRUEFEN, BEVOR die Datei angefasst wird. Die Fehlerpfad-Tabelle
    //    verlangt fuer alle drei Faelle ausdruecklich "Datei wird nicht angefasst" -
    //    ein halb geschriebenes Journal waere schlimmer als ein fehlender Eintrag.
    const mangel = pruefeEintrag(eintrag)
    if (mangel !== null) {
      return fehler('ungueltige_eingabe', mangel)
    }

    // 2. Den Pfad bilden. `ermittleDatenOrt` ist reine Rechnerei (#5) und liefert
    //    keine Huelle - fehlschlagen kann sie nur durch einen Wurf (etwa
    //    `app.getPath` vor `ready`). Der wird hier zu `speicher_fehler`, wie es die
    //    Fehlerpfad-Tabelle fuer "Datenort nicht ermittelbar" vorschreibt; ein
    //    Ersatzpfad wird NICHT geraten.
    let pfad: string
    try {
      pfad = path.join(ermittleDatenOrt(), JOURNAL_DATEINAME)
    } catch (ursache) {
      return fehler('speicher_fehler', `Datenort nicht ermittelbar: ${text(ursache)}`)
    }

    // 3. Lesen. Der `fallback` deckt den Normalfall der Erstbenutzung ab: Vor der
    //    ersten Bewegung existiert die Datei nicht, und das ist kein Fehler (#69
    //    legt sie beim Lesen ausdruecklich nicht an).
    const gelesen = await leseQueueDatei<unknown>(pfad, leereDatei())

    let bisherige: JournalEintrag[]
    if (!gelesen.ok) {
      if (gelesen.fehler.code !== 'speicher_fehler') {
        // `ungueltige_eingabe` (leerer Pfad) oder `unbekannter_fehler` sind KEINE
        // Aussage ueber den Zustand der Datei, sondern ueber den Aufruf. Sie werden
        // unveraendert durchgereicht - ein Neuanfang waere hier nicht gedeckt.
        return gelesen
      }
      // DIE Q4-AUSNAHME (Invariante): Datei unlesbar/unparsebar UND die .bak half
      // ebenfalls nicht (#69 meldet beides als `speicher_fehler`). Q4 ist "rein
      // diagnostisch" (TK 9.3) und rotiert ohnehin - hier gehen keine Nutzdaten
      // verloren, nur alte Bewegungen. Fuer Q2 (#55) und Q3 (#56) gilt das
      // ausdruecklich NICHT und darf nicht uebertragen werden.
      //
      // BEKANNTE UNSCHAERFE, gemeldet: #69 fasst "nicht parsebar" und "vorhanden,
      // aber gerade nicht lesbar" (EACCES/EBUSY/EIO) zu EINEM Code zusammen. Diese
      // Datei kann die beiden also nicht trennen und beginnt in beiden Faellen neu.
      // Fuer Q4 ist das vertretbar; der zweite Fall wird das anschliessende
      // Schreiben ohnehin meist ebenfalls zu Fall bringen, und dann steht die alte
      // Datei unveraendert da.
      vermerke(`${JOURNAL_DATEINAME} wird neu begonnen: ${gelesen.fehler.meldung}`)
      bisherige = []
    } else {
      const befund = pruefeDatei(gelesen.wert)
      if (befund.art === 'fremde_version') {
        // NICHT RATEN und NICHT SCHREIBEN. Eine hoehere Version stammt aus einer
        // neueren Fassung der Anwendung; sie zu ueberschreiben hiesse, deren Daten
        // mit einem alten Format zu ersetzen. Eine niedrigere gibt es heute nicht -
        // es existiert nur Version 1 -, deshalb der ausdrueckliche Hinweis, dass
        // eine Migration nicht vorgesehen ist.
        return fehler(
          'speicher_fehler',
          `${JOURNAL_DATEINAME} hat schemaVersion ${befund.version}, erwartet ist ` +
            `${QUEUE_SCHEMA_VERSION}. ` +
            (befund.version > QUEUE_SCHEMA_VERSION
              ? 'Die Datei stammt aus einer neueren Fassung der Anwendung und wird nicht ueberschrieben.'
              : 'Eine Migration aelterer Journal-Dateien ist nicht vorgesehen.'),
        )
      }
      if (befund.art === 'unbrauchbar') {
        // Parsebar, aber nicht die vereinbarte Form (kein Objekt, `eintraege` kein
        // Array, `schemaVersion` keine Zahl). Das ist KEINE fremde Version, sondern
        // eine kaputte Datei - und faellt damit unter dieselbe Q4-Ausnahme wie oben.
        // Die Unterscheidung ist wichtig: Eine fremde Version traegt lesbare Daten
        // einer anderen Fassung, eine formlose Datei traegt gar nichts.
        vermerke(`${JOURNAL_DATEINAME} wird neu begonnen: ${befund.grund}`)
        bisherige = []
      } else {
        bisherige = befund.eintraege
      }
    }

    // 4. Anhaengen und rotieren - in DIESER Reihenfolge.
    //
    //    `slice(-MAX)` nach dem Anhaengen haelt den gerade geschriebenen Eintrag
    //    IMMER: Er ist das letzte Element, und das letzte Element ueberlebt jedes
    //    Abschneiden vom Anfang, solange MAX >= 1 ist (die Konstante ist 1000 und
    //    nicht konfigurierbar - genau deshalb kann dieser Fall nicht kippen).
    //    Andersherum - erst kuerzen, dann anhaengen - waere die Datei bei jedem
    //    Schreiben um einen Eintrag zu kurz, und der neueste koennte bei einer
    //    ueberlangen Altdatei sogar sofort wieder herausfallen.
    //
    //    Gekuerzt wird am ANFANG: Die aeltesten Bewegungen fallen weg, die
    //    Reihenfolge bleibt chronologisch aufsteigend. Findet sich eine Altdatei mit
    //    mehr als MAX Eintraegen (Handarbeit, aeltere Fassung), schneidet derselbe
    //    Aufruf sie in einem Zug auf MAX herunter, statt sie nur um eins zu kuerzen.
    const eintraege = [...bisherige, eintrag].slice(-MAX_JOURNAL_EINTRAEGE)

    // 5. Vollstaendig und atomar neu schreiben - ausschliesslich ueber #69. Kein
    //    `fs.appendFile`: Das Journal ist eine JSON-Datei mit Rotation, an die sich
    //    zeilenweise nichts anhaengen laesst, ohne die Klammerung zu zerstoeren.
    //    `schemaVersion` kommt IMMER aus der Konstante von #69, nie aus der gerade
    //    gelesenen Datei - sonst schriebe ein Tippfehler in der Datei sich selbst
    //    fort.
    return await schreibeQueueDatei(pfad, { schemaVersion: QUEUE_SCHEMA_VERSION, eintraege })
  } catch (ursache) {
    // "Kein `throw` – auch nicht 'weil es ja nur Diagnose ist'." Jeder Ausgang ist
    // eine Huelle (TK 9.1.1); der Text der Ausnahme landet in `meldung`, ein
    // Stacktrace verlaesst diese Funktion nicht.
    return fehler('unbekannter_fehler', `Journal-Eintrag konnte nicht angehaengt werden: ${text(ursache)}`)
  }
}
// Dateiform: { schemaVersion: number; eintraege: JournalEintrag[] }
//            schemaVersion beim Schreiben IMMER QUEUE_SCHEMA_VERSION aus #69
// Ablauf: Datei lesen -> eintrag ans Ende haengen -> auf die letzten MAX_JOURNAL_EINTRAEGE
//         kuerzen (aelteste fallen weg) -> Datei komplett neu schreiben ueber #69.
//         Defekte (nicht parsebare) Datei: mit leerer Liste NEU beginnen und den Vorgang
//         vermerken – Ausnahme NUR fuer Q4, s. Invarianten.
// Ort: <Datenort>/warteschlangen-journal.json, Datenort ueber ermittleDatenOrt() (#5).

// ---------------------------------------------------------------------------------------------
// Pruefungen
// ---------------------------------------------------------------------------------------------

/**
 * Prueft den uebergebenen Eintrag gegen die Eingangs-Tabelle des Issues.
 * Rueckgabe `null` = in Ordnung, sonst die Meldung fuer `ungueltige_eingabe`.
 *
 * WARUM UEBERHAUPT GEPRUEFT WIRD, obwohl der Parameter typisiert ist: Die Aufrufer
 * (#59, #61, #62, #63, #64) bauen den Eintrag von Hand zusammen, und `zeit` sowie
 * `auftragId` sind blanke `string` - ein vergessenes Feld ist im Typ ein leerer String,
 * kein Fehler. Ein Journal mit Eintraegen ohne Auftrags-Kennung beantwortet die einzige
 * Frage nicht mehr, fuer die es existiert ("warum lief das nie?").
 */
function pruefeEintrag(eintrag: JournalEintrag): string | null {
  if (typeof eintrag !== 'object' || eintrag === null) {
    return 'haengeJournalEintragAn wurde ohne Eintrag aufgerufen.'
  }
  if (typeof eintrag.zeit !== 'string' || eintrag.zeit.length === 0) {
    return 'JournalEintrag.zeit fehlt (erwartet: ISO-8601 UTC).'
  }
  if (typeof eintrag.auftragId !== 'string' || eintrag.auftragId.length === 0) {
    return 'JournalEintrag.auftragId fehlt.'
  }
  if (
    typeof eintrag.bewegung !== 'string' ||
    // `Object.prototype.hasOwnProperty.call` statt `in`: `'toString' in BEWEGUNGEN`
    // waere wahr und liesse eine erfundene Bewegung durch.
    !Object.prototype.hasOwnProperty.call(BEWEGUNGEN, eintrag.bewegung)
  ) {
    return (
      `JournalEintrag.bewegung "${String(eintrag.bewegung)}" ist keine der vier Bewegungen ` +
      'eingereiht/gestartet/entfernt/erneut_eingereiht.'
    )
  }
  if (eintrag.position !== null) {
    if (typeof eintrag.position !== 'number' || !Number.isFinite(eintrag.position)) {
      // NaN und Infinity werden ausdruecklich abgewiesen und nicht stillschweigend
      // durchgelassen: `JSON.stringify(NaN)` ergibt `null`. Der Eintrag stuende dann
      // mit "kein sinnvoller Platz" in der Datei, obwohl der Aufrufer eine Zahl
      // gemeint hat - eine Diagnosedatei, die falsch aussagt, ist schlimmer als eine
      // fehlende Zeile.
      return 'JournalEintrag.position ist weder eine endliche Zahl noch null.'
    }
  }
  return null
}

type Befund =
  | { art: 'gelesen'; eintraege: JournalEintrag[] }
  | { art: 'unbrauchbar'; grund: string }
  | { art: 'fremde_version'; version: number }

/**
 * Prueft die geladene Datei auf die vereinbarte Form.
 *
 * `leseQueueDatei` gibt den Inhalt als `T` heraus, OHNE ihn zu pruefen - das ist dort
 * ausdrueckliche Absicht ("wer T behauptet, prueft es bei sich"). Deshalb kommt der
 * Inhalt hier als `unknown` herein und wird an dieser einen Stelle eingegrenzt.
 *
 * Was NICHT geprueft wird: die einzelnen Eintraege. Bis zu 1000 Datensaetze bei jeder
 * Bewegung durchzugehen kostet Zeit fuer eine Datei, aus der niemand etwas ableitet -
 * sie wird gelesen, wenn ein Mensch nachsieht. Ein unsauberer Alt-Eintrag wandert
 * unveraendert wieder hinaus und rotiert von selbst heraus.
 */
function pruefeDatei(inhalt: unknown): Befund {
  if (typeof inhalt !== 'object' || inhalt === null || Array.isArray(inhalt)) {
    return { art: 'unbrauchbar', grund: 'Inhalt ist kein Objekt.' }
  }
  const datei = inhalt as Partial<Q4Datei>
  if (!Array.isArray(datei.eintraege)) {
    return { art: 'unbrauchbar', grund: 'Feld "eintraege" fehlt oder ist keine Liste.' }
  }
  if (typeof datei.schemaVersion !== 'number' || !Number.isFinite(datei.schemaVersion)) {
    return { art: 'unbrauchbar', grund: 'Feld "schemaVersion" fehlt oder ist keine Zahl.' }
  }
  if (datei.schemaVersion !== QUEUE_SCHEMA_VERSION) {
    return { art: 'fremde_version', version: datei.schemaVersion }
  }
  return { art: 'gelesen', eintraege: datei.eintraege }
}

// ---------------------------------------------------------------------------------------------
// Kleinkram
// ---------------------------------------------------------------------------------------------

/** Der Stand vor der ersten Bewegung - dient zugleich als `fallback` fuer #69. */
function leereDatei(): Q4Datei {
  return { schemaVersion: QUEUE_SCHEMA_VERSION, eintraege: [] }
}

/**
 * "der Vorgang wird vermerkt" (Invariante) - als INTERNE MELDUNG DES MAIN-PROZESSES.
 *
 * Ausdruecklich NICHT als Q3-Eintrag (das Protokoll beantwortet "was wurde produziert",
 * nicht "die Diagnosedatei war kaputt") und NICHT als Anzeige in der Oberflaeche: Q4
 * bekommt keinen IPC-Kanal, und der Nutzer kann an einem verlorenen Journal ohnehin
 * nichts tun. Dieselbe vorlaeufige Loesung wie im ipc-gateway (#23) und im Dispatcher
 * (#60): `console` des Hauptprozesses.
 */
function vermerke(meldung: string): void {
  console.warn(`[auftrags-manager] ${meldung}`)
}

function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

/**
 * Die Fehlerseite der Huelle.
 *
 * Die drei Codes sind genau die, die diese Datei selbst vergibt; `nicht_gefunden`
 * kommt hier nicht vor, weil eine fehlende Journal-Datei kein Fehler ist.
 * "Eine rohe Exception-Meldung wird nie zum Code." (TK 9.1.1)
 */
function fehler(
  code: QueueFehlercode | 'ungueltige_eingabe' | 'unbekannter_fehler',
  meldung: string,
): Ergebnis<void, QueueFehlercode> {
  return { ok: false, fehler: { code, meldung } }
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEIN SCHUTZ GEGEN VERSCHRAENKTES LESEN-AENDERN-SCHREIBEN. #69 serialisiert je
//    Datei, garantiert damit aber nur REIHENFOLGE, nicht Unteilbarkeit: Zwischen dem
//    Lesen und dem Schreiben dieser Funktion kann sich ein fremder Schreibvorgang
//    schieben, und dessen Eintrag ist danach weg (Lost Update). #69 nennt als Ausweg
//    "je Datei genau EIN Schreiber" - fuer Q2 ist das mit #55 entschieden. Q4 hat
//    diesen einen Schreiber NICHT: #59, #61, #62, #63 und #64 haengen alle in dieselbe
//    app-weite Datei an. Der zweite von #69 genannte Ausweg - eine Operation, die den
//    ganzen Zyklus in die Kette nimmt, wie `aendereKonfig` in #31 - steht in der
//    verbindlichen Signatur DIESES Issues nicht und wird hier deshalb nicht erfunden;
//    ein eigener Mutex ist zudem im STOPP-Block ausdruecklich verboten ("Kein zweites
//    Lock ... die Serialisierung liefert #69"). Folge im Betrieb: Bei zwei im selben
//    Moment ausgeloesten Bewegungen kann eine Journal-Zeile fehlen. Der Auftragsfluss
//    bleibt davon unberuehrt (Q4 ist rein diagnostisch), die Datei bleibt gueltig -
//    verloren geht allein ein Diagnose-Eintrag.
//
// 2. KEINE LESEOPERATION, KEIN IPC-KANAL, KEIN LOESCHEN (STOPP-Block). Wer das Journal
//    ansehen will, oeffnet die Datei; die Sicht der Oberflaeche auf die Warteschlange
//    liefert `holeStand` (#64) und `queue:geaendert` (#65).
//
// 3. KEINE REAKTION AUF DEN EIGENEN FEHLER: keine Anzeige, kein Ereignis, keine
//    Zustandsaenderung an einem Auftrag, kein eigener Wiederholversuch. Dass die
//    Aufrufer bei `speicher_fehler` NICHT abbrechen, ist ihre Pflicht (#59, #61, #62,
//    #63, #64) - hier kann sie nicht durchgesetzt werden.
