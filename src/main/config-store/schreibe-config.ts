// GENERIERT aus dem Signaturblock von Issue #31.
// [config-store] Atomares Schreiben von config.json mit Backup und schemaVersion
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
// GERUEST-PRUEFSUMME: fa959b36be5ce10b

import fs from 'node:fs/promises'
import path from 'node:path'

import { AKTUELLE_SCHEMA_VERSION } from '../../shared/contracts/konstanten'
import { ermittleDatenOrt } from '../datenort'

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #5:  ermittleDatenOrt(): string
//        // absoluter Pfad des Ordners, der config.json, vorlagen.json, protokoll.json,
//        // warteschlangen-journal.json und projects/ enthaelt bzw. enthalten wird.
//        // REINE Pfadberechnung - der Ordner wird dort NICHT angelegt und NICHT geprueft
//        // ("das tun die Store-Module beim ersten Schreiben"), deshalb das mkdir unten.
//   #21: const AKTUELLE_SCHEMA_VERSION = 1
//        // "Die Schema-Version, auf die `project.json` und `config.json` beim Schreiben
//        // gebracht werden" (konstanten.ts, woertlich) - config.json ist dort ausdruecklich
//        // genannt, die Zahl wird hier also nicht zweckentfremdet. Eine
//        // eigene Zahl waere eine zweite Quelle der Wahrheit (vgl. #69, #98, die aus
//        // demselben Grund je eine EIGENE Zahl fuehren, weil sie NICHT zu D1/D3 gehoeren).
//   #265: interface AppKonfig { aktivesProjektId: string | null
//                               letztesExportZiel: string | null
//                               uiVoreinstellungen: Record<string, unknown> }
//        // OHNE schemaVersion - und das ist kein Widerspruch zu diesem Issue, sondern
//        // die Arbeitsteilung: Der TYP beschreibt den Stand im Speicher, die DATEI traegt
//        // die Version (TK 9.5.5). Sie entsteht genau hier, beim Schreiben.

/**
 * Wartezeiten in Millisekunden VOR dem 2., 3., 4. und 5. Versuch; der erste laeuft sofort.
 * Insgesamt also fuenf Versuche.
 *
 * WARUM WIEDERHOLT WIRD (gemessen am 10.08.2026, Issue #31): Ein Rename-mit-Ersetzen gelingt
 * auf Windows - es scheitert aber mit EPERM, sobald irgendjemand das ZIEL offen haelt, und ein
 * reines LESE-Handle genuegt dafuer. Das trifft Virenscanner, Sicherungswerkzeuge und Editoren.
 * Ein solcher Fehler ist voruebergehend: Wer sofort aufgibt, meldet "nicht gespeichert", obwohl
 * 100 ms spaeter alles funktioniert haette.
 *
 * Dieselben Zahlen wie in #187 (export-service). BEWUSST NICHT von dort importiert: Das waere
 * eine Modulgrenze fuer eine Zahl, und die beiden Faelle duerfen sich unabhaengig aendern.
 */
const WARTEZEITEN_MS = [100, 200, 400, 800] as const

/** Dateinamen unterhalb des Datenorts. An EINER Stelle, damit .tmp/.bak nicht auseinanderlaufen. */
const DATEI = 'config.json'

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { AppKonfig } from '../../shared/contracts/app-konfig'   // #265
import { leseKonfig } from './lese-konfig'                           // #26

/**
 * Die fachliche Fehlercode-Union dieses Moduls (#31, Nachtrag 12.08.2026).
 *
 * Sie steht HIER, weil der Code hier entsteht - wie `QueueFehlercode` in
 * `auftrags-manager/schreibe-queue-json.ts` und `ProjectStoreFehlercode` in
 * `project-store/assets.ts`. Der GETEILTE Vertrag kennt nur die drei generischen Codes; wer
 * fachliche dort einsammelte, liesse `contracts/` auf Main-Code zeigen.
 */
export type ConfigFehlercode = 'speicher_fehler'

export async function schreibeConfig(konfig: AppKonfig): Promise<Ergebnis<void, ConfigFehlercode>> {
  // Die Serialisierung ist der Grund, warum hier eine Kette und kein direkter Aufruf steht.
  // Ohne sie koennen zwei Schreibvorgaenge ineinanderlaufen und benutzen DIESELBE .tmp-Datei -
  // dann traegt config.json anschliessend die Haelfte des einen und die Haelfte des anderen
  // Standes. Das D1-Lock des project-store gilt dafuer NICHT - #31 haelt fest, dass TK 9.5.4
  // den anderen Speichern ausdruecklich eine EIGENE Serialisierung zuweist.
  return inReihe(() => schreibeJetzt(konfig))
}

/**
 * Lesen - Aendern - Schreiben als EINE ununterbrechbare Einheit (#31, Nachtrag 12.08.2026).
 *
 * WOZU, wenn es `schreibeConfig` schon gibt: `schreibeConfig` serialisiert nur das SCHREIBEN. Der
 * uebliche Ablauf einer Setz-Operation (#27, #28, #30) ist aber Lesen, ein Feld aendern,
 * zurueckschreiben. Zwischen `leseKonfig()` und `schreibeConfig()` kann eine zweite Operation
 * dazwischenkommen; beide lesen denselben Stand, beide schreiben ihr eigenes Feld, und die zuerst
 * geschriebene Aenderung ist weg. Genau dieses Lost Update fuehrt #31 als Begruendung an - und
 * genau davor schuetzte die Schreib-Serialisierung NICHT.
 *
 * `aenderung` ist SYNCHRON, und das ist die tragende Zusage: Ohne `await` im Rueckruf kann
 * zwischen dem Lesen und dem Schreiben nichts anderes laufen. Eine asynchrone
 * Aenderungsfunktion hoebe die Unteilbarkeit wieder auf. Form woertlich nach `aendereBestand` (#98).
 *
 * Liefert `aenderung` ein `ok:false`, wird NICHTS geschrieben und der Fehler unveraendert
 * durchgereicht - eine abgelehnte Aenderung darf die Datei nicht anfassen.
 */
export async function aendereKonfig<T>(
  aenderung: (konfig: AppKonfig) => Ergebnis<{ konfig: AppKonfig; wert: T }, ConfigFehlercode>,
): Promise<Ergebnis<T, ConfigFehlercode>> {
  return inReihe(async () => {
    // Das Lesen liegt INNERHALB der Kette - draussen waere es genau die Luecke, die diese
    // Operation schliessen soll.
    const gelesen = await leseKonfig()
    if (!gelesen.ok) {
      return gelesen
    }

    let geaendert: Ergebnis<{ konfig: AppKonfig; wert: T }, ConfigFehlercode>
    try {
      geaendert = aenderung(gelesen.wert)
    } catch (ursache) {
      // Ein Rueckruf von aussen darf den Schreibpfad nicht mit einer Ausnahme verlassen: Der
      // Fehler traefe `inReihe`, und der Aufrufer bekaeme eine abgewiesene Zusage statt einer
      // Huelle. Fehler reisen hier immer als Ergebnis (ergebnis.ts).
      return fehler('ungueltige_eingabe', `Aenderungsfunktion hat geworfen: ${text(ursache)}`)
    }
    if (!geaendert.ok) {
      return geaendert
    }

    // schreibeJetzt, NICHT schreibeConfig: Wir stehen bereits in der Kette. Ein Aufruf von
    // schreibeConfig haengte sich ein ZWEITES Mal an dieselbe Kette an und wartete damit auf
    // sich selbst - der Aufruf kaeme nie zurueck.
    const geschrieben = await schreibeJetzt(geaendert.wert.konfig)
    if (!geschrieben.ok) {
      return geschrieben
    }
    return { ok: true, wert: geaendert.wert.wert }
  })
}

/**
 * Die Warteschlange dieses Moduls: eine Promise-Kette, an die jeder Schreibvorgang angehaengt wird.
 * Ein Wert im Modul-Bereich reicht, weil es genau EINE config.json gibt (anders als in #69, wo je
 * PFAD eine eigene Kette noetig ist).
 */
let kette: Promise<void> = Promise.resolve()

function inReihe<T>(arbeit: () => Promise<T>): Promise<T> {
  const laufend = kette.then(arbeit)
  // Die Kette selbst darf NIE in den Fehlerzustand geraten - sonst wuerde ein einziger
  // Fehlschlag jeden spaeteren Schreibvorgang mitreissen, und die App koennte bis zum
  // Neustart nichts mehr speichern.
  kette = laufend.then(
    () => undefined,
    () => undefined,
  )
  return laufend
}

/**
 * DIE EIGENTLICHE ARBEIT - laeuft immer allein (s. `inReihe`).
 *
 * Reihenfolge: Sicherung -> vollstaendig schreiben und auf die Platte zwingen -> ersetzen.
 * Erst nach dem Rename zeigt der Name `config.json` auf den neuen Inhalt; bricht vorher
 * irgendetwas ab, ist die alte Datei unangetastet.
 */
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

async function schreibeJetzt(konfig: AppKonfig): Promise<Ergebnis<void, ConfigFehlercode>> {
  // Schutz gegen den einen Fall, den der Typ nicht abfaengt: einen Aufrufer, der zur Laufzeit
  // null/undefined durchreicht. Ohne die Pruefung wuerde `{ ...null }` klaglos eine config.json
  // schreiben, die NUR die schemaVersion enthaelt - das aktive Projekt waere still verloren.
  if (typeof konfig !== 'object' || konfig === null) {
    return fehler('ungueltige_eingabe', 'schreibeConfig wurde ohne AppKonfig-Objekt aufgerufen.')
  }

  const datenOrt = ermittleDatenOrt()
  const ziel = path.join(datenOrt, DATEI)
  const temp = `${ziel}.tmp`
  const sicherung = `${ziel}.bak`

  // Die schemaVersion wird ZULETZT gesetzt, nicht zuerst. Der Unterschied ist nicht kosmetisch:
  // Bei `{ schemaVersion, ...konfig }` koennte ein Aufrufer, der zur Laufzeit ein Feld dieses
  // Namens mitbringt, unsere Version ueberschreiben - und die Datei traege eine falsche Angabe,
  // die spaeter eine Migration in die Irre fuehrt. So gewinnt immer die hier gesetzte.
  // Der Spread ueber das GANZE Objekt ist Absicht: Kaeme ein Feld zu AppKonfig hinzu, wuerde eine
  // Aufzaehlung einzelner Felder es lautlos wegwerfen (und der STOPP-Block verbietet genau das:
  // "Keine Teil-Schreibvorgaenge").
  let inhalt: string
  try {
    inhalt = `${JSON.stringify({ ...konfig, schemaVersion: AKTUELLE_SCHEMA_VERSION }, null, 2)}\n`
  } catch (ursache) {
    // `uiVoreinstellungen` ist `Record<string, unknown>` - dort kann ein Zirkelbezug oder ein
    // BigInt landen, an dem JSON.stringify wirft. Der Wurf darf NICHT nach draussen: Fehler
    // reisen in der Ergebnis-Huelle, nie als Ausnahme (ergebnis.ts).
    return fehler(
      'ungueltige_eingabe',
      `config.json ist nicht serialisierbar: ${text(ursache)}`,
    )
  }

  try {
    // Der Datenort existiert im Normalfall (Dev: das Projektverzeichnis, portabel: der Ordner
    // neben der EXE). `recursive: true` ist trotzdem richtig, weil #5 das Anlegen ausdruecklich
    // den Store-Modulen zuschiebt - und weil es bei vorhandenem Ordner nichts tut.
    await fs.mkdir(datenOrt, { recursive: true })
  } catch (ursache) {
    return fehler('speicher_fehler', `Datenort ${datenOrt} nicht nutzbar: ${text(ursache)}`)
  }

  // SCHRITT 3 DES ISSUES, ausgefuehrt als erster: die bestehende Datei sichern.
  // KOPIEREN, nicht verschieben - ein Verschieben wuerde config.json fuer die Dauer des
  // Schreibvorgangs verschwinden lassen, und ein Absturz genau dort liesse die App ohne
  // Konfiguration zurueck.
  // NUR sichern, wenn die vorhandene Datei als Rueckfallebene taugt - s. taugtAlsSicherung().
  const sicherungsFehler = (await taugtAlsSicherung(ziel))
    ? await mitWiederholung(() => fs.copyFile(ziel, sicherung))
    : null
  if (sicherungsFehler !== null && !istCode(sicherungsFehler, 'ENOENT')) {
    // ENOENT = es gibt noch keine config.json (erster Start). Dann ist nichts zu sichern, und
    // das ist KEIN Fehler.
    //
    // Jeder andere Grund bricht ab, statt ohne Sicherung weiterzuschreiben. Begruendung: Die
    // haeufigste Ursache ist eine volle Platte - dann waere auch das .tmp unvollstaendig, und
    // ein Abbruch hier laesst config.json garantiert unberuehrt. Der Preis ist bekannt und
    // bewusst: Haelt ein fremdes Werkzeug dauerhaft die .bak offen, kann nicht gespeichert
    // werden. Genau dagegen laeuft die Wiederholung oben.
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
      // umgehaengt haben, waehrend die Nutzdaten noch im Puffer stehen - nach einem Stromausfall
      // stuende dann eine LEERE config.json da, und die alte waere weg. Genau der Datenverlust,
      // den dieses Issue ausschliesst.
      await griff.sync()
    } finally {
      // Schliessen MUSS gelingen, bevor umbenannt wird: Ein eigenes offenes Handle auf die
      // Quelle ist derselbe EPERM-Fall wie ein fremdes, und dagegen hilft keine Wiederholung.
      // Ein Fehler beim Schliessen wird verschluckt, damit er nicht die eigentliche Ursache
      // aus dem try-Block verdeckt - die Daten sind zu diesem Zeitpunkt bereits gesynct.
      await griff.close().catch(() => undefined)
    }
  } catch (ursache) {
    return fehler(
      'speicher_fehler',
      `${DATEI} konnte nicht geschrieben werden: ${text(ursache)}`,
    )
  }

  // SCHRITT 2: der unteilbare Moment. Vorher zeigt der Name auf den alten Stand, nachher auf den
  // neuen; ein Dritter sieht nie etwas dazwischen. Die vorhandene Zieldatei wird NICHT vorher
  // geloescht - das oeffnete ein Fenster, in dem gar keine config.json existiert.
  const umbenennFehler = await mitWiederholung(() => fs.rename(temp, ziel))
  if (umbenennFehler !== null) {
    // Die .tmp bleibt bewusst liegen. Sie ist an dieser Stelle VOLLSTAENDIG und gesynct, also
    // die einzige Fassung des neuen Standes auf der Platte; sie wegzuraeumen wuerde die Daten
    // des Nutzers vernichten, um aufgeraeumt auszusehen. Der naechste Schreibvorgang oeffnet
    // sie ohnehin mit 'w' und ueberschreibt sie.
    return fehler(
      'speicher_fehler',
      `${DATEI} konnte nicht ersetzt werden: ${text(umbenennFehler)}`,
    )
  }

  return { ok: true, wert: undefined }
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
 * Die Fehlerseite einer Huelle - bewusst OHNE Nutztyp, damit sie fuer `Ergebnis<void, …>` genauso
 * passt wie fuer das generische `Ergebnis<T, …>` von `aendereKonfig`.
 *
 * ERLEDIGT (12.08.2026): Hier stand die Meldung, dass die Fehlerpfad-Tabelle `speicher_fehler`
 * verlangt, die damalige Signatur `Ergebnis<void>` ihn aber nicht tragen kann - ohne zweiten
 * Typparameter laesst die Huelle nur die drei generischen Codes zu. Der Bau meldete deshalb
 * zunaechst `unbekannter_fehler` und schrieb die fachliche Einordnung in den Meldungstext, worauf
 * kein Aufrufer verzweigen kann. Das Issue fuehrt seit dem Nachtrag `Ergebnis<void,
 * ConfigFehlercode>`; der Code ist damit zuweisbar.
 */
function fehler(
  code: ConfigFehlercode | 'ungueltige_eingabe',
  meldung: string,
): { ok: false; fehler: { code: ConfigFehlercode | 'ungueltige_eingabe'; meldung: string } } {
  return { ok: false, fehler: { code, meldung } }
}
// 1. konfig + aktuelle schemaVersion nach <Datenort>/config.json.tmp schreiben
// 2. fs.rename config.json.tmp -> config.json (atomar, gleiche Partition)
// 3. VORHER (vor Schritt 1): bestehende config.json (falls vorhanden) nach config.json.bak kopieren
