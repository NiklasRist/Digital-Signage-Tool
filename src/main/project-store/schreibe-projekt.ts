// GENERIERT aus dem Signaturblock von Issue #46.
// [project-store] Atomares Schreiben von project.json mit .bak und schemaVersion
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
// GERUEST-PRUEFSUMME: d9afa29c87e4a3da

import fs from 'node:fs/promises'
import path from 'node:path'

import { AKTUELLE_SCHEMA_VERSION } from '../../shared/contracts/konstanten'

import { projektOrdner } from './pfade'

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #49: projektOrdner(projektId: string): string
//        // absoluter Pfad des Projektordners, z. B. <Datenort>/projects/<projektId>;
//        // reine String-Operation, kein Dateisystemzugriff, keine Existenzpruefung.
//        // Die Pfad-Autoritaet ist die EINE Stelle, die das Datei-Layout kennt (TK 9.5.7) -
//        // deshalb wird hier NICHTS aus ermittleDatenOrt() und "projects" selbst zusammengesetzt.
//   #21: const AKTUELLE_SCHEMA_VERSION = 1
//        // "Die Schema-Version, auf die `project.json` und `config.json` beim Schreiben
//        // gebracht werden" (konstanten.ts, woertlich) - project.json ist dort ausdruecklich
//        // genannt. Eine eigene Zahl hier waere die zweite von drei Kopien, die TK 9.11.4
//        // gerade verhindern will.
//   #32: mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//        // WIRD HIER NICHT GERUFEN - s. "ZUM D1-LOCK" unten. Der Vertrag dieses Issues
//        // verbietet es ausdruecklich; #32 verbietet Verschachtelung ("darf selbst nicht
//        // erneut mitD1Lock aufrufen (Deadlock-Gefahr)").

/**
 * Wartezeiten in Millisekunden VOR dem 2., 3., 4. und 5. Versuch; der erste laeuft sofort.
 * Insgesamt also fuenf Versuche.
 *
 * WARUM WIEDERHOLT WIRD (gemessen, Issue #31, dort fuer config.json): Ein Rename-mit-Ersetzen
 * gelingt auf Windows - es scheitert aber mit EPERM, sobald irgendjemand das ZIEL offen haelt,
 * und ein reines LESE-Handle genuegt dafuer. Das trifft Virenscanner, Sicherungswerkzeuge und
 * Editoren. Ein solcher Fehler ist voruebergehend: Wer sofort aufgibt, meldet "nicht
 * gespeichert", obwohl 100 ms spaeter alles funktioniert haette.
 *
 * Dieselben Zahlen wie in #31 (config-store) und #187 (export-service) - der STOPP-Block des
 * Issues verlangt genau das ("falls dort bereits eine Loesung feststeht, dieselbe hier
 * wiederverwenden, sonst gemeinsam klaeren statt drei unterschiedliche Workarounds"). BEWUSST
 * NICHT von dort importiert: Das waere eine Modulgrenze fuer eine Zahl, und die Faelle duerfen
 * sich unabhaengig aendern.
 */
const WARTEZEITEN_MS = [100, 200, 400, 800] as const

/** Dateiname im Projektordner. An EINER Stelle, damit .tmp/.bak nicht auseinanderlaufen. */
const DATEI = 'project.json'

/**
 * Eine unbedenkliche Projekt-ID, die NUR als Vergleichswert dient (s. `istSchreibbareId`).
 * Ihr Ordner wird nie angelegt und nie angefasst.
 */
const VERGLEICHS_ID = 'vergleich'

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProjectStoreFehlercode } from './assets'            // #72
import type { Project } from '../../shared/contracts/project'
export async function schreibeProjekt(projekt: Project): Promise<Ergebnis<void, ProjectStoreFehlercode>> {
  // ZUM D1-LOCK: Hier steht KEIN mitD1Lock und auch KEINE eigene Promise-Kette wie in
  // schreibeConfig (#31). Der Unterschied zwischen den beiden Schwesterdateien ist gewollt:
  // config.json hat keinen eigenen Sperr-Mechanismus und muss sich deshalb selbst
  // serialisieren, D1 hat mit mitD1Lock (#32) genau einen - "das eine D1-Schreib-Lock"
  // (TK 9.5.1). Eine zweite Warteschlange daneben waere der zweite Sperr-Mechanismus, den
  // TK 9.4.8 verbietet, und ein Lock-Aufruf hier waere die vom Vertrag benannte
  // Deadlock-Falle (jeder Aufrufer haelt das Lock bereits).
  //
  // DIE FOLGE, die jeder Aufrufer kennen muss: Wer schreibeProjekt AUSSERHALB von mitD1Lock
  // ruft, hat keine Serialisierung. Zwei solche Aufrufe benutzen DIESELBE project.json.tmp,
  // und project.json traegt danach die Haelfte des einen und die Haelfte des anderen Standes.
  // Diese Datei kann das nicht abfangen - sie kann nicht erkennen, ob sie im Lock laeuft.

  // Schutz gegen den einen Fall, den der Typ nicht abfaengt: einen Aufrufer, der zur Laufzeit
  // null/undefined durchreicht. Ohne die Pruefung schriebe `{ ...null }` klaglos eine
  // project.json, die NUR die schemaVersion enthaelt - und das .bak daneben traegt dann schon
  // die vorherige Fassung, die diesen Schrott ueberlebt haette. Genau der Datenverlust, gegen
  // den dieses Issue existiert.
  if (typeof projekt !== 'object' || projekt === null) {
    return fehler('ungueltige_eingabe', 'schreibeProjekt wurde ohne Project-Objekt aufgerufen.')
  }
  if (!istSchreibbareId(projekt.id)) {
    return fehler(
      'ungueltige_eingabe',
      'Die Projekt-ID ist als Ordnername nicht verwendbar; es wurde nichts geschrieben.',
    )
  }

  const ordner = projektOrdner(projekt.id)
  const ziel = path.join(ordner, DATEI)
  const temp = `${ziel}.tmp`
  const sicherung = `${ziel}.bak`

  // Die schemaVersion wird ZULETZT gesetzt, nicht zuerst. Der Unterschied ist nicht kosmetisch:
  // Bei `{ schemaVersion, ...projekt }` gewaenne die Version, die im uebergebenen Objekt steht -
  // und das ist beim Speichern eines gerade MIGRIERTEN Projekts (#48) die alte. Die Datei truege
  // dann eine Angabe, die nicht zu ihrem Inhalt passt, und die naechste Migration liefe erneut.
  // Der Spread ueber das GANZE Objekt ist Absicht: Kaeme ein Feld zu Project hinzu, wuerde eine
  // Aufzaehlung einzelner Felder es lautlos wegwerfen.
  //
  // ALLES ANDERE BLEIBT UNANGETASTET - insbesondere `geaendertAm`. Das Issue sagt "wird
  // unveraendert serialisiert, nur schemaVersion wird beim Schreiben (neu) gesetzt"; ein hier
  // gesetzter Zeitstempel waere eine zweite, unsichtbare Quelle fuer ein fachliches Feld.
  let inhalt: string
  try {
    inhalt = `${JSON.stringify({ ...projekt, schemaVersion: AKTUELLE_SCHEMA_VERSION }, null, 2)}\n`
  } catch (ursache) {
    // Project traegt Arrays fremder Herkunft (assets, aktionen, liste). Landet dort ein
    // Zirkelbezug oder ein BigInt, wirft JSON.stringify. Der Wurf darf NICHT nach draussen:
    // Fehler reisen in der Ergebnis-Huelle, nie als Ausnahme (ergebnis.ts).
    return fehler('ungueltige_eingabe', `project.json ist nicht serialisierbar: ${text(ursache)}`)
  }

  try {
    // Der Projektordner existiert im Normalfall (erstelleProjekt #33 legt ihn an).
    // `recursive: true` ist trotzdem richtig: Es tut bei vorhandenem Ordner nichts, und ohne
    // ihn scheiterte ein Speichern endgueltig, nur weil jemand den Ordner verschoben hat -
    // obwohl der vollstaendige Stand im Speicher liegt und rettbar waere.
    await fs.mkdir(ordner, { recursive: true })
  } catch (ursache) {
    return fehler(
      'speicher_fehler',
      `Projektordner ${ordner} nicht nutzbar: ${text(ursache)}`,
    )
  }

  // SCHRITT 3 DES ISSUES, ausgefuehrt als erster: die bestehende Datei sichern.
  // KOPIEREN, nicht verschieben - so verlangt es die Signatur ("fs.copyFile, KEIN
  // Verschieben/Unlink der Quelle"). Ein Verschieben liesse project.json fuer die Dauer des
  // Schreibvorgangs verschwinden, und es traefe zusaetzlich die macOS-Falle aus dem
  // STOPP-Block ("unlink gelingt still, obwohl die Datei noch geoeffnet ist").
  // NUR sichern, wenn die vorhandene Datei als Rueckfallebene taugt - s. taugtAlsSicherung().
  const sicherungsFehler = (await taugtAlsSicherung(ziel))
    ? await mitWiederholung(() => fs.copyFile(ziel, sicherung))
    : null
  if (sicherungsFehler !== null && !istCode(sicherungsFehler, 'ENOENT')) {
    // ENOENT = es gibt noch keine project.json (erstes Speichern eines neuen Projekts). Dann
    // ist nichts zu sichern, und das ist KEIN Fehler.
    //
    // Jeder andere Grund BRICHT AB, statt ohne frisches Backup weiterzuschreiben. Das ist die
    // Frage aus dem STOPP-Block; entschieden ist sie hier NICHT neu, sondern gleichlautend
    // mit der bereits gebauten Schwesterfunktion schreibeConfig (#31) - zwei Schreiber
    // derselben Bauart, die sich bei einem defekten Backup verschieden verhalten, waeren die
    // schlechtere Antwort als jede der beiden Varianten. Die Begruendung traegt hier sogar
    // schwerer: Die haeufigste Ursache ist eine volle Platte, dann waere auch das .tmp
    // unvollstaendig; ein Abbruch laesst project.json garantiert unberuehrt, und der Stand
    // liegt weiter im Speicher. Der Preis ist bekannt und bewusst: Haelt ein fremdes Werkzeug
    // dauerhaft die .bak offen, kann nicht gespeichert werden. Genau dagegen laeuft die
    // Wiederholung oben. S. Bericht/STOPP - der Punkt gehoert bestaetigt, nicht geerbt.
    return fehler(
      'speicher_fehler',
      `Sicherung von ${DATEI} fehlgeschlagen: ${text(sicherungsFehler)}`,
    )
  }

  // SCHRITT 1: vollstaendig in die Nebendatei schreiben.
  try {
    const griff = await fs.open(temp, 'w')
    try {
      await griff.writeFile(inhalt, 'utf8')
      // fsync VOR dem Rename. Ohne ihn kann das Betriebssystem den Verzeichniseintrag schon
      // umgehaengt haben, waehrend die Nutzdaten noch im Puffer stehen - nach einem
      // Stromausfall stuende dann eine LEERE project.json da, und das Projekt waere weg.
      // Der STOPP-Block verlangt ausdruecklich, das nicht stillschweigend wegzulassen; das
      // Sicherheitsniveau ist damit dasselbe wie beim Export (TK 9.6.2/9.6.3) und wie in #31.
      await griff.sync()
    } finally {
      // Schliessen MUSS gelingen, bevor umbenannt wird: Ein eigenes offenes Handle auf die
      // Quelle ist derselbe EPERM-Fall wie ein fremdes, und dagegen hilft keine Wiederholung.
      // Ein Fehler beim Schliessen wird verschluckt, damit er nicht die eigentliche Ursache
      // aus dem try-Block verdeckt - die Daten sind zu diesem Zeitpunkt bereits gesynct.
      await griff.close().catch(() => undefined)
    }
  } catch (ursache) {
    // project.json bleibt unveraendert, weil das Rename nie stattgefunden hat. Die .tmp kann
    // als Bruchstueck liegenbleiben; sie wird beim naechsten Versuch mit 'w' ueberschrieben
    // und von niemandem gelesen (das Laden in #34 kennt nur project.json und .bak).
    return fehler(
      'speicher_fehler',
      `${DATEI} konnte nicht geschrieben werden: ${text(ursache)}`,
    )
  }

  // SCHRITT 2: der unteilbare Moment. Vorher zeigt der Name auf den alten Stand, nachher auf
  // den neuen; ein Dritter sieht nie etwas dazwischen. Die vorhandene Zieldatei wird NICHT
  // vorher geloescht - das oeffnete ein Fenster, in dem gar keine project.json existiert.
  const umbenennFehler = await mitWiederholung(() => fs.rename(temp, ziel))
  if (umbenennFehler !== null) {
    // Die .tmp bleibt bewusst liegen. Sie ist an dieser Stelle VOLLSTAENDIG und gesynct, also
    // die einzige Fassung des neuen Standes auf der Platte; sie wegzuraeumen wuerde die Arbeit
    // des Nutzers vernichten, um aufgeraeumt auszusehen. Der naechste Schreibvorgang oeffnet
    // sie ohnehin mit 'w' und ueberschreibt sie.
    return fehler(
      'speicher_fehler',
      `${DATEI} konnte nicht ersetzt werden: ${text(umbenennFehler)}`,
    )
  }

  return { ok: true, wert: undefined }
}
// 1. projekt + aktuelle schemaVersion nach <Datenort>/projects/<projekt.id>/project.json.tmp schreiben
// 2. fs.rename project.json.tmp -> project.json (atomar, gleiche Partition)
// 3. VORHER (vor Schritt 1): bestehende project.json (falls vorhanden) nach project.json.bak
//    kopieren (fs.copyFile, KEIN Verschieben/Unlink der Quelle)

/**
 * Ist `projektId` ein Name, der genau EINEN Ordner unterhalb von `projects/` bezeichnet?
 *
 * WARUM DIESE PRUEFUNG UEBERHAUPT: `projektOrdner` (#49) prueft seine ID ausdruecklich NICHT
 * ("koennen es nicht: Ihre Signatur gibt einen String zurueck, kein Ergebnis") und weist die
 * Pruefung den Aufrufern zu. Eine ID wie `../..` ergaebe dort einen Pfad ausserhalb des
 * Datenorts - und diese Funktion legt Ordner an und ueberschreibt Dateien.
 *
 * WARUM SIE NICHT DIE ZEICHENLISTE VON #49 WIEDERHOLT: Die Pruefungen dort sind bewusst nicht
 * exportiert ("wer eine davon braucht, braucht in Wahrheit eine der fuenf Funktionen oben");
 * eine Abschrift waere eine zweite Antwort auf "ist dieser Name in Ordnung?" und liefe beim
 * naechsten Zusatz auseinander. Stattdessen wird das ERGEBNIS von `projektOrdner` gegen einen
 * mit unbedenklicher ID gebildeten Vergleichspfad gehalten: Liegt der Ordner im selben
 * Elternverzeichnis und heisst er genau wie die ID, kann die ID kein Pfad gewesen sein.
 */
function istSchreibbareId(projektId: unknown): projektId is string {
  if (typeof projektId !== 'string' || projektId.length === 0) {
    return false
  }
  const ordner = path.resolve(projektOrdner(projektId))
  const vergleich = path.resolve(projektOrdner(VERGLEICHS_ID))
  return path.dirname(ordner) === path.dirname(vergleich) && path.basename(ordner) === projektId
}

/**
 * Fuehrt `arbeit` aus und wiederholt sie, solange der Fehler auf ein offenes Handle hindeutet.
 * Rueckgabe `null` = gelungen; sonst der letzte Fehler.
 *
 * Die Schleife laeuft ueber die Wartezeiten statt ueber einen Zaehler - so gibt es keinen
 * Feldzugriff, der wegen `noUncheckedIndexedAccess` `undefined` liefern koennte, und damit auch
 * keine Versuchung zum verbotenen `!` (#193).
 */
async function mitWiederholung(arbeit: () => Promise<void>): Promise<unknown> {
  let letzter: unknown = null
  for (const warteMs of [0, ...WARTEZEITEN_MS]) {
    if (warteMs > 0) {
      await new Promise<void>((weiter) => setTimeout(weiter, warteMs))
    }
    try {
      await arbeit()
      return null
    } catch (ursache) {
      letzter = ursache
      // Alles andere (ENOENT, ENOSPC, EACCES) verschwindet nicht von selbst - dort waere
      // Warten nur eine Verzoegerung mit demselben Ausgang.
      if (!istCode(ursache, 'EPERM', 'EBUSY')) {
        return ursache
      }
    }
  }
  return letzter
}

/** Prueft den `code` eines Node-Systemfehlers, ohne ihn auf einen Typ zu zwingen, den er nicht hat. */
function istCode(ursache: unknown, ...codes: readonly string[]): boolean {
  if (typeof ursache !== 'object' || ursache === null || !('code' in ursache)) {
    return false
  }
  const code = (ursache as { code?: unknown }).code
  return typeof code === 'string' && codes.includes(code)
}

function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

/**
 * Ist die vorhandene Zieldatei als Sicherung ueberhaupt brauchbar?
 *
 * WARUM DIESE FRAGE UEBERHAUPT GESTELLT WIRD (gefunden beim Bau von #34 am 12.08.2026):
 * Die Sicherung laeuft als ERSTER Schritt und kopierte bisher, was immer dort lag. Wurde ein
 * Projekt gerade AUS der `.bak` gerettet - weil die Hauptdatei defekt war -, dann kopierte der
 * naechste Schreibvorgang genau diese defekte Datei ueber die einzige heile Fassung. Scheitert
 * danach das Schreiben, und die haeufigste Ursache dafuer ist eine volle Platte, ist der Stand
 * ENDGUELTIG weg: Hauptdatei kaputt, Sicherung mit derselben kaputten Fassung ueberschrieben.
 *
 * Die Pruefung ist bewusst schwach - nur "laesst sich lesen und als JSON auswerten". Sie
 * beurteilt NICHT, ob der Inhalt fachlich vollstaendig ist; das entscheidet, wer laedt (#34
 * ueber die Pflichtfeldpruefung aus #48). Hier geht es allein um die Frage, ob diese Datei als
 * Rueckfallebene taugt - und eine Datei, die nicht einmal parst, taugt es nicht.
 *
 * Ist sie unbrauchbar, wird die Sicherung UEBERSPRUNGEN statt abgebrochen: Die vorhandene
 * `.bak` bleibt unberuehrt und damit die letzte heile Fassung, und der neue, gute Stand wird
 * trotzdem geschrieben. Ein Abbruch waere hier das Gegenteil von hilfreich - er verweigerte
 * das Speichern genau dann, wenn die Hauptdatei ohnehin schon kaputt ist.
 */
async function taugtAlsSicherung(pfad: string): Promise<boolean> {
  try {
    JSON.parse(await fs.readFile(pfad, 'utf8')) as unknown
    return true
  } catch {
    return false
  }
}

/**
 * Die Fehlerseite der Huelle.
 *
 * Seit dem Issue-Nachtrag vom 12.08.2026 traegt die Signatur `ProjectStoreFehlercode` (#72), der
 * von der Fehlerpfad-Tabelle verlangte `speicher_fehler` ist damit zuweisbar. Zuvor stand hier
 * `unbekannter_fehler` mit dem echten Code als Textpraefix - worauf kein Aufrufer verzweigen
 * konnte.
 */
function fehler(
  code: ProjectStoreFehlercode | 'ungueltige_eingabe',
  meldung: string,
): { ok: false; fehler: { code: ProjectStoreFehlercode | 'ungueltige_eingabe'; meldung: string } } {
  return { ok: false, fehler: { code, meldung } }
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEIN fsync AUF DAS VERZEICHNIS. Nach POSIX ueberlebt ein Rename einen Stromausfall erst,
//    wenn auch der Verzeichniseintrag gesynct ist. Auf Windows ist ein fsync auf ein
//    Verzeichnis nicht moeglich (gemessen), unter macOS waere es machbar. Der STOPP-Block des
//    Issues nennt es als offene Frage; eine plattformabhaengige Zusatzsicherung wurde NICHT
//    eingebaut, weil sie das Verhalten der beiden Zielplattformen auseinanderziehen wuerde,
//    ohne dass irgendwo festgelegt ist, dass D1 dieses Niveau braucht. Das .tmp selbst ist
//    gesynct - der Fall "leere project.json nach Stromausfall" ist damit ausgeschlossen; offen
//    bleibt allein "Rename nach Stromausfall nicht sichtbar", dann steht die ALTE Datei da.
//
// 2. KEIN fsync AUF DIE .bak. fs.copyFile schreibt ueber den Puffer; ein Absturz unmittelbar
//    nach dem Kopieren kann eine unvollstaendige .bak hinterlassen. Gleichstand mit #31.
//
// 3. KEINE PRUEFUNG, OB DAS D1-LOCK GEHALTEN WIRD (s. Vermerk oben im Rumpf).
//
// 4. KEIN AUFRAEUMEN DER .tmp IM FEHLERFALL - begruendet an den beiden Stellen oben.
