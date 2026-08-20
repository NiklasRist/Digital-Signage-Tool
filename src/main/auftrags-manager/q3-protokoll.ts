// GENERIERT aus dem Signaturblock von Issue #56.
// [auftrags-manager] Q3-Ausführungsprotokoll anhängen
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
// GERUEST-PRUEFSUMME: 3eabc77e77710a7f
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
// der Parameter und alle Importe werden jetzt benutzt. Der Absatz darueber bleibt
// als Beleg stehen.

import path from 'node:path'

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProtokollEintrag } from '../../shared/contracts/protokoll'
import { ermittleDatenOrt } from '../datenort'
import {
  QUEUE_SCHEMA_VERSION,
  leseQueueDatei,
  schreibeQueueDatei,
} from './schreibe-queue-json'
import type { QueueFehlercode } from './schreibe-queue-json'   // = 'speicher_fehler' (#69)

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #69: leseQueueDatei<T>(pfad: string, fallback: T): Promise<Ergebnis<T, QueueFehlercode>>
//   #69: schreibeQueueDatei(pfad: string, inhalt: unknown): Promise<Ergebnis<void, QueueFehlercode>>
//   #69: const QUEUE_SCHEMA_VERSION = 1   // gilt fuer Q2, Q3 und Q4 – KEINE eigene Zahl erfinden
//   #5:    ermittleDatenOrt(): string       // app-weiter Datenort der portablen App

/**
 * Der Dateiname von Q3. Zusammengesetzt wird der Pfad HIER, weil #69 das Datei-Layout
 * ausdruecklich nicht kennt ("Q3 = <ermittleDatenOrt()>/protokoll.json (#56); zusammengesetzt
 * wird das beim AUFRUFER") und weil die Pfad-Autoritaet des project-store (TK 9.5.7) nur die
 * PROJEKT-Pfade fuehrt - protokoll.json liegt app-weit neben config.json und vorlagen.json.
 */
const DATEINAME = 'protokoll.json'

/** Die Pflichtfelder, die schlicht "gesetzt" sein muessen (alle Zeichenketten). */
const PFLICHT_TEXTE = [
  'id',
  'auftragId',
  'art',
  'projektId',
  'begonnenAm',
  'beendetAm',
] as const

/**
 * Q3 protokolliert nur Beendetes. "Ein Auftrag, der die Schlange nie verlassen hat, erzeugt
 * keinen Protokolleintrag - es gibt nichts zu berichten." (TK 9.3)
 *
 * Die Liste wiederholt bewusst die drei Werte von `ProtokollErgebnis` (#53) - der Typ existiert
 * zur Laufzeit nicht, und der Aufrufer #70 kann ueber die IPC-Grenze hinweg alles Moegliche
 * uebergeben. Das ist die EINZIGE Stelle, an der diese Datei den Inhalt eines Feldes bewertet,
 * und sie steht ausdruecklich in der Fehlerpfad-Tabelle des Issues.
 */
const TERMINALE_ERGEBNISSE: readonly string[] = ['erfolg', 'fehlgeschlagen', 'abgebrochen']

export async function haengeProtokollEintragAn(eintrag: ProtokollEintrag): Promise<Ergebnis<void, QueueFehlercode>> {
  // 1. PRUEFEN, BEVOR IRGENDEINE DATEI ANGEFASST WIRD. Die Fehlerpfad-Tabelle verlangt bei jedem
  //    Eingabemangel "Datei wird nicht angefasst" - also weder Lesen noch Schreiben.
  const mangel = pruefeEintrag(eintrag)
  if (mangel !== null) {
    return fehler('ungueltige_eingabe', mangel)
  }

  try {
    // 2. DEN ORT BESTIMMEN. ermittleDatenOrt() ist reine Pfadrechnung (#5) und wirft im Normalfall
    //    nicht; der Fall "Datenort nicht ermittelbar" der Fehlerpfad-Tabelle kann trotzdem
    //    eintreten (im gepackten Lauf greift die Funktion auf `app` zu). Er wird als
    //    speicher_fehler gemeldet, und es wird KEIN Ersatzpfad geraten - eine protokoll.json an
    //    einem selbst ausgedachten Ort waere eine zweite, unauffindbare Historie.
    let pfad: string
    try {
      pfad = path.join(ermittleDatenOrt(), DATEINAME)
    } catch (ursache) {
      return fehler('speicher_fehler', `Datenort nicht ermittelbar: ${text(ursache)}`)
    }

    // 3. LESEN. Der Rueckfall bei FEHLENDER Datei ist die leere, aber bereits versionierte Datei -
    //    so laeuft der allererste beendete Auftrag durch dieselbe Versionspruefung wie jeder
    //    spaetere, statt an einem Sonderweg vorbei. Frisch gebaut je Aufruf, damit ein von #69
    //    durchgereichter Rueckfallwert nie zwischen zwei Aufrufen geteilt wird.
    const gelesen = await leseQueueDatei<unknown>(pfad, {
      schemaVersion: QUEUE_SCHEMA_VERSION,
      eintraege: [],
    })
    if (!gelesen.ok) {
      // DURCHREICHEN, NICHT UEBERSCHREIBEN. #69 meldet speicher_fehler erst, wenn auch die .bak
      // nicht half. Ein Neuanfang mit leerer Liste waere hier der teuerste Fehlgriff des ganzen
      // Issues: Q3 ist "dauerhaft, unbegrenzt - nie automatisch geloescht" (TK 9.3), die Historie
      // ist unwiederbringlich. Fuer Q4 (#57) gilt bewusst das Gegenteil - dort sind es reine
      // Diagnosedaten. Wer die Q4-Regel hierher uebertraegt, loescht die Historie.
      return gelesen
    }

    // 4. DIE GELESENE DATEI PRUEFEN.
    const bestand = pruefeDatei(gelesen.wert)
    if (!bestand.ok) {
      return bestand
    }

    // 5. ANHAENGEN UND KOMPLETT NEU SCHREIBEN. Angehaengt wird IMMER - ein bestehender Eintrag mit
    //    derselben auftragId wird nie gesucht, nie ersetzt und nie ueberschrieben: "Fehlschlaege
    //    bleiben sichtbar: Eine Wiederholung erzeugt einen neuen Q3-Eintrag mit hoeherem versuch."
    //    (TK 9.3) Kein Kuerzen, kein Rotieren, keine Obergrenze - das gehoert ausschliesslich Q4.
    //
    //    Die bestehenden Eintraege reisen als `unknown[]` unveraendert durch. Sie hier auf
    //    ProtokollEintrag[] zu zwingen waere eine Behauptung ueber fremde, womoeglich aeltere
    //    Daten; sie einzeln zu pruefen und Abweichler auszusortieren waere Geschichtsfaelschung.
    //    Was drinsteht, bleibt drin - in gleicher Reihenfolge, mit dem neuen Eintrag am Ende.
    return await schreibeQueueDatei(pfad, {
      schemaVersion: QUEUE_SCHEMA_VERSION,
      eintraege: [...bestand.wert, eintrag],
    })
  } catch (ursache) {
    // "Kein throw." (TK 9.1.1) Jeder Ausgang dieser Funktion ist eine Huelle; ein Stacktrace geht
    // nie nach draussen, die Meldung des Ausloesers landet in `meldung`, nie im Code.
    return fehler('unbekannter_fehler', `Protokolleintrag konnte nicht angehaengt werden: ${text(ursache)}`)
  }
}
// Dateiform: { schemaVersion: number; eintraege: ProtokollEintrag[] }
//            schemaVersion beim Schreiben IMMER QUEUE_SCHEMA_VERSION aus #69
// Ablauf: Datei lesen -> eintrag ans Ende von eintraege haengen -> Datei KOMPLETT neu schreiben,
//         atomar ueber schreibeQueueDatei (#69). Kein zeilenweises Anhaengen.
// Ort: <Datenort>/protokoll.json, Datenort ueber ermittleDatenOrt() (#5).

/**
 * Prueft den uebergebenen Eintrag und liefert die Mangelbeschreibung oder `null`.
 *
 * Geprueft wird VORHANDENSEIN, nicht Inhalt (Ausnahme: `ergebnis`, s. dort). Der Aufrufer ist
 * #70, also Main-Code, und der Typ ProtokollEintrag steht im geteilten Vertrag - trotzdem wird
 * hier zur Laufzeit geprueft: Ein fehlendes Feld faellt sonst erst Jahre spaeter beim Auswerten
 * der Historie auf, und dann ist der Eintrag nicht mehr zu retten.
 */
function pruefeEintrag(eintrag: unknown): string | null {
  if (typeof eintrag !== 'object' || eintrag === null || Array.isArray(eintrag)) {
    return 'haengeProtokollEintragAn wurde ohne Eintrag aufgerufen.'
  }
  // SAFETY: die Zeile davor hat eintrag als nicht-null, nicht-Array Objekt belegt; der
  // Cast macht die Index-Form sichtbar, die Felder werden darunter einzeln geprueft.
  const roh = eintrag as Record<string, unknown>

  for (const feld of PFLICHT_TEXTE) {
    const wert = roh[feld]
    if (typeof wert !== 'string' || wert.length === 0) {
      return `Protokolleintrag ohne ${feld}: Pflichtfeld fehlt oder ist leer.`
    }
  }

  // versuch: endliche Zahl. Die Endlichkeit ist keine Fachlogik, sondern eine Serialisierungs-
  // frage: JSON.stringify macht aus NaN und Infinity klaglos `null`. Ohne diese Pruefung stuende
  // im dauerhaften Protokoll ein Eintrag, dem der Versuchszaehler fehlt - und #69 wuerde ihn
  // anstandslos schreiben, weil dort nur die Serialisierbarkeit als solche geprueft wird.
  if (typeof roh['versuch'] !== 'number' || !Number.isFinite(roh['versuch'])) {
    return 'Protokolleintrag ohne gueltigen versuch: Pflichtfeld fehlt oder ist keine endliche Zahl.'
  }

  // ergebnis: der einzige inhaltlich gepruefte Wert - Q3 nimmt nur Beendetes auf.
  const ergebnis = roh['ergebnis']
  if (typeof ergebnis !== 'string' || !TERMINALE_ERGEBNISSE.includes(ergebnis)) {
    return (
      `Protokolleintrag mit ergebnis=${JSON.stringify(ergebnis)}: Q3 nimmt nur beendete ` +
      `Versuche auf (erfolg/fehlgeschlagen/abgebrochen).`
    )
  }

  // fehler und ausgabe: PFLICHTFELDER MIT ERLAUBTEM WERT null. #53 typisiert beide als `| null`
  // und ausdruecklich nicht als optional. Geprueft wird deshalb der SCHLUESSEL, nicht der Inhalt:
  // Einem Eintrag ohne den Schluessel ist beim spaeteren Auswerten nicht anzusehen, ob es keine
  // Ausgabe gab oder ob der Schreiber sie vergessen hat. `undefined` zaehlt wie fehlend - es
  // ueberlebt JSON.stringify ohnehin nicht und stuende danach als fehlender Schluessel in der
  // Datei.
  for (const feld of ['fehler', 'ausgabe'] as const) {
    if (!(feld in roh) || roh[feld] === undefined) {
      return `Protokolleintrag ohne Schluessel ${feld}: null ist erlaubt, ein fehlendes Feld nicht.`
    }
  }

  return null
}

/**
 * Prueft die von #69 gelieferte Dateistruktur und liefert die bestehenden Eintraege.
 *
 * Jeder Mangel fuehrt zu `speicher_fehler` OHNE Schreibvorgang - nie zu einem Neuanfang. #69
 * liefert `T` ungeprueft ("wer T behauptet, prueft es bei sich"), also ist das hier die Stelle,
 * an der die Behauptung eingeloest wird.
 */
function pruefeDatei(inhalt: unknown): Ergebnis<unknown[], QueueFehlercode> {
  if (typeof inhalt !== 'object' || inhalt === null || Array.isArray(inhalt)) {
    return fehler(
      'speicher_fehler',
      `${DATEINAME} hat nicht die erwartete Form { schemaVersion, eintraege } - es wird nichts geschrieben, ` +
        `damit die vorhandene Historie unangetastet bleibt.`,
    )
  }
  // SAFETY: die Zeile davor hat inhalt als nicht-null, nicht-Array Objekt belegt; der
  // Cast macht die Index-Form sichtbar, die Felder werden darunter einzeln geprueft.
  const datei = inhalt as Record<string, unknown>

  const version = datei['schemaVersion']
  if (version !== QUEUE_SCHEMA_VERSION) {
    // Gleiche Version -> laden. Hoehere -> nicht raten. Niedrigere -> es gibt sie noch nicht, eine
    // Migration ist nicht vorgesehen. In keinem der drei Faelle wird geschrieben; ein
    // ungefragtes Hochschreiben der Version machte aus einer fremden Datei still eine eigene.
    const hinweis =
      typeof version === 'number' && version < QUEUE_SCHEMA_VERSION
        ? 'eine Migration aelterer Protokolle ist nicht vorgesehen'
        : 'diese Fassung der Anwendung kennt sie nicht und raet nicht'
    return fehler(
      'speicher_fehler',
      `${DATEINAME} traegt schemaVersion ${JSON.stringify(version)} statt ${QUEUE_SCHEMA_VERSION} - ${hinweis}. Es wurde nichts geschrieben.`,
    )
  }

  const eintraege = datei['eintraege']
  if (!Array.isArray(eintraege)) {
    return fehler(
      'speicher_fehler',
      `${DATEINAME} enthaelt kein Feld eintraege als Liste - es wird nichts geschrieben, damit die ` +
        `vorhandene Historie unangetastet bleibt.`,
    )
  }

  // SAFETY: eintraege ist als Array belegt (Array.isArray, sonst fruehe Rueckgabe
  // fehler); die Eintraege selbst reisen als unknown[] weiter, jeder wird beim
  // Anhaengen durch pruefeEintrag einzeln geprueft.
  return { ok: true, wert: eintraege as unknown[] }
}

function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

/**
 * Die Fehlerseite der Huelle - bewusst ohne Nutztyp, damit sie sowohl fuer `Ergebnis<void, …>`
 * als auch fuer `Ergebnis<unknown[], …>` passt. Gleiche Bauart wie in #69.
 */
function fehler(
  code: QueueFehlercode | 'ungueltige_eingabe' | 'unbekannter_fehler',
  meldung: string,
): { ok: false; fehler: { code: QueueFehlercode | 'ungueltige_eingabe' | 'unbekannter_fehler'; meldung: string } } {
  return { ok: false, fehler: { code, meldung } }
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEINE LESEOPERATION, KEIN IPC-KANAL. Diese Datei exportiert ausschliesslich
//    haengeProtokollEintragAn - kein leseProtokoll, kein holeHistorie, auch nicht "nur fuer
//    Tests". Die Ausgabe-Liste der Oberflaeche kommt aus listeAusgaben des project-store
//    (TK 9.5.2, Ist-Bestand des Ordners), nicht aus Q3 (Historie). Zwei Quellen fuer dieselbe
//    Anzeige drifteten auseinander, sobald eine Ausgabedatei geloescht oder ersetzt wird.
//
// 2. KEINE REAKTION AUF DEN EIGENEN FEHLER. Kein Auftragszustand wird veraendert, kein Ereignis
//    gesendet, nichts in der Warteschlangen-Leiste angezeigt, kein eigener Wiederholversuch. Was
//    aus einem Schreibfehler folgt, entscheidet der Aufrufer (#70).
//
// 3. KEIN EIGENER SCHREIB-MUTEX UND KEIN DIREKTER DATEIZUGRIFF (STOPP-Block). Jeder Zugriff
//    laeuft ueber #69; `node:path` ist reine Pfadrechnung und beruehrt die Platte nicht.
//
// 4. DIE LUECKE, DIE DIESE DATEI NICHT SCHLIESSEN DARF - LOST UPDATE BEI ZWEI GLEICHZEITIGEN
//    ABSCHLUESSEN: #69 garantiert Reihenfolge, nicht Unteilbarkeit. Zwischen dem Lesen (Schritt 3)
//    und dem Schreiben (Schritt 5) kann sich ein fremder Schreibvorgang auf dieselbe Datei
//    schieben; dessen Eintrag waere danach weg. Fuer Q2 ist der Fall gedeckt, weil dort genau EIN
//    Schreiber festgelegt ist. Fuer Q3 traegt heute dasselbe Argument - der einzige Aufrufer ist
//    #70 (terminaler Uebergang), und der Torwaechter laesst immer nur EINEN Auftrag laufen, es gibt
//    also zu jedem Zeitpunkt hoechstens einen terminalen Uebergang. Getragen wird die Zusage damit
//    aber von der Seriellitaet der Schlange, NICHT von dieser Datei: Sobald irgendwann ein zweiter
//    Schreiber hinzukaeme (etwa ein Sammelabbruch, der mehrere laufende Auftraege gleichzeitig
//    beendet), verschwaende ein Eintrag lautlos. Der saubere Weg waere eine unteilbare
//    Lesen-Aendern-Schreiben-Operation in #69 - so wie #31 fuer denselben Fall `aendereKonfig`
//    als Issue-Nachtrag bekommen hat. Sie steht in der verbindlichen Signatur dieses Issues NICHT
//    und wird hier deshalb nicht erfunden; ein eigener Mutex ist ausdruecklich verboten.
