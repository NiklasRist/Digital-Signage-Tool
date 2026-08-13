// GENERIERT aus dem Signaturblock von Issue #69.
// [auftrags-manager] Queue-Dateien atomar und serialisiert lesen und schreiben
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
// GERUEST-PRUEFSUMME: 181485a5a570e96c
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
// ERLEDIGT (13.08.2026): Die Abschaltzeile ist mit dem Fuellen der Rumpfe entfernt;
// beide Parameter werden jetzt benutzt. Der Absatz darueber bleibt als Beleg stehen.

import fs from 'node:fs/promises'
import path from 'node:path'

import type { Ergebnis, GenerischerFehlercode } from '../../shared/contracts/ergebnis'

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #49: projektOrdner(projektId: string): string
//        // WIRD HIER NICHT GERUFEN. Diese Datei kennt das Datei-Layout ausdruecklich NICHT -
//        // sie bekommt fertige Pfade. Q2 = <projektOrdner(id)>/queue-retry.json (#55),
//        // Q3 = <ermittleDatenOrt()>/protokoll.json (#56),
//        // Q4 = <ermittleDatenOrt()>/warteschlangen-journal.json (#57); zusammengesetzt wird
//        // das beim AUFRUFER, denn die Pfad-Autoritaet ist die eine Stelle, die das darf
//        // (TK 9.5.7).
//   #32: mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//        // WIRD HIER NICHT GERUFEN und darf es nicht: "Das D1-Lock schuetzt nur project.json.
//        // Die Auftragsverwaltungs-Speicher Q2/Q3 (eigene Dateien, 9.3) haben ihre eigene
//        // Serialisierung - der auftrags-manager haengt nicht am project-store-Lock."
//        // (TK 9.5.4) Die Kette weiter unten IST diese eigene Serialisierung.

// Die modul-eigene Fehlercode-Union der Auftragsverwaltungs-Speicher. #12 liefert NUR die drei
// generischen Codes (ungueltige_eingabe, nicht_gefunden, unbekannter_fehler); #22 fuegt Ergebnis
// den zweiten Typparameter F hinzu, ueber den jedes Modul seine EIGENE Union in seiner EIGENEN
// Datei einhaengt. speicher_fehler steht deshalb HIER und nicht in einem geteilten Typ;
// src/shared/contracts/ergebnis.ts wird dafuer NICHT angefasst (fremde Datei, Regel E).
export type QueueFehlercode = 'speicher_fehler'

// Schema-Version ALLER Queue-Dateien (Q2, Q3, Q4). Modul-lokal und hier deklariert, damit die
// drei Speicher nicht je eine eigene Zahl erfinden. NICHT die AKTUELLE_SCHEMA_VERSION aus #21
// verwenden – die gehoert zu project.json/config.json, eine Kopplung an D1-Migrationen ist
// unerwuenscht.
export const QUEUE_SCHEMA_VERSION = 1
// Bewusst NUR deklariert: Diese Datei wertet die Zahl nirgends aus. Ob eine gelesene Datei die
// passende schemaVersion traegt, entscheiden #55/#56/#57 - sie kennen ihren Inhalt, hier ist er
// `T` bzw. `unknown`.

/**
 * Wartezeiten in Millisekunden VOR dem 2., 3., 4. und 5. Versuch; der erste laeuft sofort.
 * Insgesamt also fuenf Versuche.
 *
 * WARUM WIEDERHOLT WIRD (gemessen, Issue #31): Ein Rename-mit-Ersetzen gelingt auf Windows - es
 * scheitert aber mit EPERM, sobald irgendjemand das ZIEL offen haelt, und ein reines LESE-Handle
 * genuegt dafuer. Das trifft Virenscanner, Sicherungswerkzeuge und Editoren. Ein solcher Fehler
 * ist voruebergehend: Wer sofort aufgibt, meldet "nicht gespeichert", obwohl 100 ms spaeter
 * alles funktioniert haette.
 *
 * Dieselben Zahlen wie in #31 (config-store), #46 (project-store) und #187 (export-service). Der
 * STOPP-Block dieses Issues verlangt genau das ("Falls dort bereits eine Loesung feststeht: exakt
 * dieselbe verwenden"). BEWUSST NICHT von dort importiert: Das waere eine Modulgrenze fuer eine
 * Zahl, und die Faelle duerfen sich unabhaengig aendern.
 */
const WARTEZEITEN_MS = [100, 200, 400, 800] as const

// ---------------------------------------------------------------------------------------------
// Die Serialisierung - JE PFAD, nicht global
// ---------------------------------------------------------------------------------------------

/**
 * Eine Promise-Kette JE Queue-Datei. Das ist der Unterschied zu den Schwesterdateien #31 und #46:
 * Dort gibt es genau EINE Datei, ein einzelner Modul-Wert genuegt. Hier sind es beliebig viele -
 * Q2 liegt je Projekt einmal vor, dazu Q3 und Q4. Eine gemeinsame Kette wuerde das Protokoll
 * hinter dem Wiederholungsspeicher eines fremden Projekts warten lassen, ohne dass die beiden
 * irgendetwas miteinander zu tun haetten; die Signatur verlangt ausdruecklich, dass
 * "Schreibvorgaenge auf VERSCHIEDENE Pfade unabhaengig laufen und einander nicht blockieren".
 *
 * WAS DIESE KETTE NICHT IST (TK 9.3.5, woertlich zitiert im Issue): keine systemweite Sperre,
 * kein Mutex-Objekt fuer fremde Module, keine OS-Dateisperre und kein Ersatz fuer die serielle
 * Auftragsordnung. Sie ist eine Reihenfolge-Garantie INNERHALB dieser Datei und verlaesst sie
 * nicht - deshalb ist sie auch nicht exportiert.
 */
const ketten = new Map<string, Promise<void>>()

/**
 * Der Schluessel der Kette. Zwei Aufrufe auf physisch dieselbe Datei MUESSEN denselben Schluessel
 * ergeben, sonst landen sie in zwei Ketten und verschraenken sich wieder - die Serialisierung
 * waere dann da, aber wirkungslos.
 *
 * ENTSCHIEDEN (STOPP-Punkt des Issues, hier als lokale Detailfrage beantwortet):
 * `path.resolve` und unter Windows zusaetzlich Kleinschreibung.
 *   - `path.resolve` vereinheitlicht Trennzeichen, `.`/`..`-Segmente und macht relative Pfade
 *     absolut. Damit faellt die haeufigste Doppelung weg.
 *   - Die Kleinschreibung NUR unter win32, weil das dortige Dateisystem
 *     gross-/kleinschreibungsblind ist: `C:\Daten\protokoll.json` und `c:\daten\Protokoll.json`
 *     sind DIESELBE Datei. Unter macOS waere dieselbe Massnahme falsch - dort koennen zwei
 *     Dateien existieren, die sich nur in der Schreibweise unterscheiden; sie in eine Kette zu
 *     zwingen waere kein Fehler, aber eine unnoetige Bremse mit falscher Begruendung.
 *   - KEIN `fs.realpath`. Es loeste zwar zusaetzlich Verknuepfungen auf, greift dafuer aber auf
 *     das Dateisystem zu: Es ist asynchron (der Schluessel muesste erst erwartet werden, und
 *     genau in dieser Wartezeit koennte sich ein zweiter Aufruf vordraengeln - die Luecke, die
 *     die Kette schliessen soll) und es SCHEITERT bei einer noch nicht existierenden Datei,
 *     also im Normalfall des ersten Schreibens. Der Preis ist bekannt und klein: Zwei
 *     verschiedene Verknuepfungen auf dieselbe Queue-Datei bekaemen zwei Ketten. Diese
 *     Anwendung legt ihre Datenorte selbst an; ein solcher Aufbau kommt hier nicht vor.
 */
function schluessel(pfad: string): string {
  const aufgeloest = path.resolve(pfad)
  return process.platform === 'win32' ? aufgeloest.toLowerCase() : aufgeloest
}

/**
 * Haengt `arbeit` hinten an die Kette dieses Pfades an und liefert deren Ergebnis.
 *
 * Die Kette selbst darf NIE in den Fehlerzustand geraten - sonst risse ein einziger Fehlschlag
 * jeden spaeteren Zugriff auf diese Datei mit, und die Anwendung koennte bis zum Neustart nichts
 * mehr in sie schreiben. Deshalb wird der neutralisierte Ausgang gespeichert, nicht der echte.
 */
function inReihe<T>(schl: string, arbeit: () => Promise<T>): Promise<T> {
  const vorgaenger = ketten.get(schl) ?? Promise.resolve()
  const laufend = vorgaenger.then(arbeit)
  const schwanz = laufend.then(
    () => undefined,
    () => undefined,
  )
  ketten.set(schl, schwanz)

  // Aufraeumen, damit die Map nicht ueber die Laufzeit waechst: Eine lange Sitzung, in der viele
  // Projekte geoeffnet werden, sammelte sonst je Projekt einen erledigten Eintrag. Entfernt wird
  // NUR, wenn sich seither niemand angehaengt hat - sonst zeigt die Map auf einen anderen
  // Schwanz, und dann gehoert sie ihm.
  void schwanz.then(() => {
    if (ketten.get(schl) === schwanz) {
      ketten.delete(schl)
    }
  })

  return laufend
}

// ---------------------------------------------------------------------------------------------
// Lesen
// ---------------------------------------------------------------------------------------------

export async function leseQueueDatei<T>(pfad: string, fallback: T): Promise<Ergebnis<T, QueueFehlercode>> {
  if (typeof pfad !== 'string' || pfad.length === 0) {
    return fehler('ungueltige_eingabe', 'leseQueueDatei wurde ohne Pfad aufgerufen.')
  }
  try {
    // DAS LESEN LAEUFT EBENFALLS UEBER DIE KETTE (STOPP-Punkt des Issues, hier entschieden).
    // Begruendung: Ein Aufrufer, der einen Schreibvorgang angestossen und noch nicht erwartet
    // hat, wuerde sonst den Stand VOR seiner eigenen Aenderung lesen und ihn anschliessend
    // zurueckschreiben. Der Kostenpunkt ist gering (ein Lesen wartet hoechstens auf einen
    // laufenden Schreibvorgang derselben Datei), der Gewinn ist eine Zusage, auf die sich
    // #55/#56/#57 verlassen koennen: Was hier gelesen wird, ist immer der zuletzt an DIESE
    // Funktion uebergebene Stand.
    //
    // WAS DAS NICHT LEISTET - und was deshalb im Bericht gemeldet ist: Es macht Lesen-Aendern-
    // Schreiben NICHT unteilbar. Zwischen dem Lesen und dem Schreiben eines Aufrufers kann sich
    // ein fremder Schreibvorgang schieben; dessen Aenderung ist danach weg (Lost Update). Dagegen
    // hilft nur, dass je Datei genau EIN Schreiber existiert (fuer Q2 ist das mit #55
    // entschieden) - oder eine Operation, die den ganzen Zyklus in die Kette nimmt, wie
    // `aendereKonfig` in #31. Eine solche Operation steht in der verbindlichen Signatur dieses
    // Issues NICHT und wird hier deshalb nicht erfunden.
    return await inReihe(schluessel(pfad), () => leseJetzt<T>(pfad, fallback))
  } catch (ursache) {
    // Der Auffangbogen fuer den Fall, den die Fehlerpfad-Tabelle als "unerwartete Ausnahme
    // irgendwo im Ablauf" fuehrt. Diese Funktion wirft NIE - jeder Ausgang ist eine Huelle
    // (TK 9.1.1).
    return fehler('unbekannter_fehler', `Lesen von ${pfad} unerwartet abgebrochen: ${text(ursache)}`)
  }
}
// pfad existiert nicht        -> { ok: true, wert: fallback }
// pfad existiert und ist gueltiges JSON -> { ok: true, wert: <geparster Inhalt> }
// pfad existiert, ist NICHT parsebar, <pfad>.bak ist parsebar
//                             -> { ok: true, wert: <geparster Inhalt von <pfad>.bak> }
// pfad NICHT parsebar UND <pfad>.bak fehlt oder ist ebenfalls NICHT parsebar
//                             -> { ok: false, fehler: { code: 'speicher_fehler', … } }

async function leseJetzt<T>(pfad: string, fallback: T): Promise<Ergebnis<T, QueueFehlercode>> {
  const haupt = await leseDatei(pfad)

  // FEHLT die Datei, ist das KEIN Fehler: erste Benutzung. Beim allerersten Start existiert
  // keine der drei Queue-Dateien, und angelegt wird sie hier ausdruecklich nicht - erst der
  // naechste regulaere Schreibvorgang bringt sie in die Welt.
  if (haupt.zustand === 'fehlt') {
    return { ok: true, wert: fallback }
  }
  if (haupt.zustand === 'gelesen') {
    // Der einzige Zwang in dieser Datei: JSON.parse liefert `any`, der Vertrag verspricht `T`.
    // Geprueft wird der Inhalt NICHT - "Keine Kenntnis ueber den Inhalt aufbauen" (STOPP-Block);
    // wer T behauptet, prueft es bei sich (#55/#56/#57).
    return { ok: true, wert: haupt.wert as T }
  }

  // BESCHAEDIGT: erst die Sicherung versuchen (TK 9.5.4). Ein Backup, aus dem nie
  // wiederhergestellt wird, waere reine Schreiblast.
  const sicherung = await leseDatei(`${pfad}.bak`)
  if (sicherung.zustand === 'gelesen') {
    // WICHTIG: Die defekte <pfad> wird dabei NICHT ueberschrieben, nicht geloescht und nicht
    // durch das Backup ersetzt - das Zurueckschreiben geschieht erst beim naechsten regulaeren
    // schreibeQueueDatei des Aufrufers. Diese Funktion repariert nichts von selbst.
    return { ok: true, wert: sicherung.wert as T }
  }

  // Beides unbrauchbar. HIER WIRD NICHT AUF `fallback` ZURUECKGEFALLEN, und das ist der Kern des
  // Issues: Der Rueckfall saehe aus wie eine leere Datei und wuerfe alle vorgemerkten
  // Fehlschlaege und alle offenen Loeschungen still weg. TK 9.5.4 verlangt ausdruecklich
  // "Fehler melden, nicht leer/verlustbehaftet weiterstarten".
  return fehler(
    'speicher_fehler',
    `${pfad} ist nicht lesbar und die Sicherung ${path.basename(pfad)}.bak ebenfalls nicht. ` +
      `Grund: ${haupt.grund}${sicherung.zustand === 'beschaedigt' ? ` / ${sicherung.grund}` : ' / keine Sicherung vorhanden'}`,
  )
}

type Leseergebnis =
  | { zustand: 'gelesen'; wert: unknown }
  | { zustand: 'fehlt' }
  | { zustand: 'beschaedigt'; grund: string }

/**
 * Liest EINE Datei und entscheidet zwischen den drei Zustaenden.
 *
 * ENOENT wird von "beschaedigt" getrennt, weil daran der ganze Ablauf haengt: Eine fehlende
 * Datei ist der Normalfall der ersten Benutzung, eine unlesbare ist ein Verlust. Wer beides
 * gleich behandelt, macht aus einem defekten Dateisystem stillschweigend einen Neuanfang.
 *
 * Jeder ANDERE E/A-Fehler (EACCES, EBUSY, EIO) zaehlt als beschaedigt: Die Datei ist da, nur
 * gerade nicht lesbar. Das fuehrt hier - genau wie im Vertrag beschrieben - zum Versuch auf der
 * .bak und, wenn auch der scheitert, zu speicher_fehler; ein Rueckfall auf den `fallback`
 * entsteht daraus nie.
 */
async function leseDatei(pfad: string): Promise<Leseergebnis> {
  let roh: string
  try {
    roh = await fs.readFile(pfad, 'utf8')
  } catch (ursache) {
    if (istCode(ursache, 'ENOENT')) {
      return { zustand: 'fehlt' }
    }
    return { zustand: 'beschaedigt', grund: text(ursache) }
  }

  try {
    return { zustand: 'gelesen', wert: JSON.parse(roh) as unknown }
  } catch (ursache) {
    return { zustand: 'beschaedigt', grund: `kein gueltiges JSON (${text(ursache)})` }
  }
}

// ---------------------------------------------------------------------------------------------
// Schreiben
// ---------------------------------------------------------------------------------------------

export async function schreibeQueueDatei(pfad: string, inhalt: unknown): Promise<Ergebnis<void, QueueFehlercode>> {
  if (typeof pfad !== 'string' || pfad.length === 0) {
    return fehler('ungueltige_eingabe', 'schreibeQueueDatei wurde ohne Pfad aufgerufen.')
  }

  // SERIALISIEREN VOR DEM ANSTELLEN IN DIE KETTE, nicht darin. Zwei Gruende, beide vom Vertrag
  // verlangt:
  //   1. Die Fehlerpfad-Tabelle fordert die Pruefung "VOR jedem Dateizugriff; weder .bak noch
  //      .tmp noch Zieldatei werden beruehrt". Ein nicht serialisierbarer Inhalt soll ausserdem
  //      gar nicht erst die Kette dieses Pfades belegen.
  //   2. Der Text ist damit eine MOMENTAUFNAHME vom Zeitpunkt des Aufrufs. Aendert der Aufrufer
  //      sein Objekt weiter, waehrend er in der Kette wartet, wird trotzdem der Stand
  //      geschrieben, den er uebergeben hat - sonst haengt der Dateiinhalt davon ab, wie lange
  //      ein fremder Schreibvorgang gedauert hat.
  let roh: string | undefined
  try {
    roh = JSON.stringify(inhalt, null, 2)
  } catch (ursache) {
    // Zirkelbezug und BigInt werfen hier; Q2/Q3/Q4 tragen Inhalte fremder Herkunft
    // (Fehlermeldungen, Auftragsdaten), also ist das ein realer Fall. Der Wurf darf NICHT nach
    // draussen: Fehler reisen in der Ergebnis-Huelle, nie als Ausnahme (ergebnis.ts).
    return fehler('ungueltige_eingabe', `Inhalt fuer ${pfad} ist nicht serialisierbar: ${text(ursache)}`)
  }
  if (roh === undefined) {
    // JSON.stringify WIRFT bei einer Funktion, einem Symbol oder undefined nicht, sondern
    // liefert `undefined`. Ohne diese Abfrage stuende hinterher das Wort "undefined" in der
    // Datei - gueltiges JavaScript, aber kein gueltiges JSON, und beim naechsten Laden waere die
    // Datei "beschaedigt". Die Fehlerpfad-Tabelle nennt "Funktion" ausdruecklich.
    return fehler(
      'ungueltige_eingabe',
      `Inhalt fuer ${pfad} ist nicht serialisierbar (undefined, Funktion oder Symbol).`,
    )
  }
  // Abschliessender Zeilenumbruch wie in #31/#46 - Textwerkzeuge und Editoren erwarten ihn.
  // Eingerueckt (null, 2), damit eine Queue-Datei im Fehlerfall von Hand lesbar ist; sie sind
  // Diagnosematerial (Q3 ist dauerhaft), und der Platzgewinn einer einzeiligen Fassung wiegt
  // das nicht auf.
  const dateiInhalt = `${roh}\n`

  try {
    return await inReihe(schluessel(pfad), () => schreibeJetzt(pfad, dateiInhalt))
  } catch (ursache) {
    return fehler('unbekannter_fehler', `Schreiben von ${pfad} unerwartet abgebrochen: ${text(ursache)}`)
  }
}
// 1. bestehende Datei (falls vorhanden) nach <pfad>.bak kopieren (fs.copyFile, kein Verschieben)
// 2. inhalt als JSON nach <pfad>.tmp schreiben
// 3. <pfad>.tmp durch Rename-mit-Ersetzen auf <pfad> bringen (gleiche Partition)
// Schreibvorgaenge auf DENSELBEN pfad laufen streng nacheinander (verkettete Promise je Pfad);
// Schreibvorgaenge auf VERSCHIEDENE Pfade laufen unabhaengig und blockieren einander nicht.

/**
 * Lesen-Aendern-Schreiben als EINE ununterbrechbare Einheit. NACHGETRAGEN 12.08.2026.
 *
 * WARUM ES SIE BRAUCHT: `inReihe` garantiert REIHENFOLGE, nicht UNTEILBARKEIT. Wer
 * `leseQueueDatei` und danach `schreibeQueueDatei` aufruft, haengt ZWEI Glieder in die Kette -
 * und dazwischen kann sich ein fremdes drittes schieben. Dessen Aenderung ist danach weg.
 *
 * Fuer Q2 (#55) ist das gedeckt, weil dort genau EIN Schreiber festgelegt ist. Fuer Q4 (#57)
 * nicht: Dort haengen FUENF Stellen in dieselbe app-weite Datei an, und bei zwei gleichzeitigen
 * Bewegungen ginge eine Journalzeile verloren. #57 hat die Luecke korrekt nicht selbst
 * geschlossen - ein modul-eigener Mutex ist dort ausdruecklich verboten, und er waere auch der
 * zweite Sperrmechanismus, den das Konzept durchgehend ausschliesst.
 *
 * `aenderung` IST SYNCHRON, und das ist die ganze Zusage: Ohne `await` im Rueckruf kann zwischen
 * Lesen und Schreiben kein zweiter Aufruf dazwischenkommen, weil JavaScript den Abschnitt nicht
 * verlaesst. Eine asynchrone Aenderungsfunktion hoebe sie auf. Dieselbe Form wie `aendereKonfig`
 * (#31) und `aendereBestand` (#98).
 *
 * Liefert `aenderung` ein `ok: false`, wird NICHTS geschrieben und der Fehler unveraendert
 * durchgereicht - der Aufrufer soll seinen eigenen Grund zurueckbekommen, nicht einen von hier.
 */
export async function aendereQueueDatei<T, W>(
  pfad: string,
  fallback: T,
  aenderung: (inhalt: T) => Ergebnis<{ inhalt: unknown; wert: W }, QueueFehlercode>,
): Promise<Ergebnis<W, QueueFehlercode>> {
  if (typeof pfad !== 'string' || pfad.length === 0) {
    return fehler('ungueltige_eingabe', 'aendereQueueDatei wurde ohne Pfad aufgerufen.')
  }
  if (typeof aenderung !== 'function') {
    return fehler('ungueltige_eingabe', `aendereQueueDatei fuer ${pfad} braucht eine Aenderungsfunktion.`)
  }

  try {
    return await inReihe(schluessel(pfad), async (): Promise<Ergebnis<W, QueueFehlercode>> => {
      const gelesen = await leseJetzt<T>(pfad, fallback)
      if (!gelesen.ok) {
        return gelesen
      }

      // Ab hier bis zum Schreiben steht KEIN `await` - genau das macht den Zyklus unteilbar.
      let geaendert: Ergebnis<{ inhalt: unknown; wert: W }, QueueFehlercode>
      try {
        geaendert = aenderung(gelesen.wert)
      } catch (ursache) {
        return fehler(
          'unbekannter_fehler',
          `Aenderungsfunktion fuer ${pfad} hat unerwartet abgebrochen: ${text(ursache)}`,
        )
      }
      if (!geaendert.ok) {
        return geaendert
      }

      let roh: string | undefined
      try {
        roh = JSON.stringify(geaendert.wert.inhalt, null, 2)
      } catch (ursache) {
        return fehler('ungueltige_eingabe', `Inhalt fuer ${pfad} ist nicht serialisierbar: ${text(ursache)}`)
      }
      if (roh === undefined) {
        return fehler(
          'ungueltige_eingabe',
          `Inhalt fuer ${pfad} ist nicht serialisierbar (undefined, Funktion oder Symbol).`,
        )
      }

      const geschrieben = await schreibeJetzt(pfad, `${roh}
`)
      if (!geschrieben.ok) {
        return geschrieben
      }
      return { ok: true, wert: geaendert.wert.wert }
    })
  } catch (ursache) {
    return fehler('unbekannter_fehler', `Aendern von ${pfad} unerwartet abgebrochen: ${text(ursache)}`)
  }
}

/**
 * DIE EIGENTLICHE ARBEIT - laeuft fuer diesen Pfad immer allein (s. `inReihe`).
 *
 * Reihenfolge: Sicherung -> vollstaendig schreiben und auf die Platte zwingen -> ersetzen. Erst
 * nach dem Rename zeigt der Name auf den neuen Inhalt; bricht vorher irgendetwas ab, ist die
 * alte Datei unangetastet. Dieselbe Reihenfolge wie in #31 und #46 - der STOPP-Block verlangt
 * ausdruecklich dieselbe Loesung wie dort und nicht eine vierte eigene.
 */
async function schreibeJetzt(ziel: string, inhalt: string): Promise<Ergebnis<void, QueueFehlercode>> {
  const temp = `${ziel}.tmp`
  const sicherung = `${ziel}.bak`
  const ordner = path.dirname(ziel)

  try {
    // Der Ordner existiert im Normalfall. `recursive: true` ist trotzdem richtig: Es tut bei
    // vorhandenem Ordner nichts, und ohne ihn scheiterte der allererste Schreibvorgang von Q3/Q4
    // nur deshalb, weil #5 (ermittleDatenOrt) das Anlegen ausdruecklich den Store-Modulen
    // zuschiebt und ihn selbst nicht erzeugt.
    await fs.mkdir(ordner, { recursive: true })
  } catch (ursache) {
    return fehler('speicher_fehler', `Ordner ${ordner} nicht nutzbar: ${text(ursache)}`)
  }

  // SCHRITT 1 DES ISSUES: die bestehende Datei sichern.
  // KOPIEREN, nicht verschieben - so verlangt es die Signatur ("fs.copyFile, kein Verschieben").
  // Ein Verschieben liesse die Queue-Datei fuer die Dauer des Schreibvorgangs verschwinden.
  // NUR sichern, wenn die vorhandene Datei als Rueckfallebene taugt - s. taugtAlsSicherung().
  const sicherungsFehler = (await taugtAlsSicherung(ziel))
    ? await mitWiederholung(() => fs.copyFile(ziel, sicherung))
    : null
  if (sicherungsFehler !== null && !istCode(sicherungsFehler, 'ENOENT')) {
    // ENOENT = die Datei gibt es noch nicht (erste Benutzung). Dann ist nichts zu sichern, und
    // das ist KEIN Fehler.
    //
    // Jeder andere Grund BRICHT AB, statt ohne frisches Backup weiterzuschreiben. Das ist die
    // offene Frage aus dem STOPP-Block; entschieden ist sie hier NICHT neu, sondern gleichlautend
    // mit den beiden bereits gebauten Schwesterfunktionen #31 und #46 - drei Schreiber derselben
    // Bauart, die sich bei einem defekten Backup verschieden verhalten, waeren die schlechteste
    // aller Antworten. Die Begruendung traegt auch fuer sich: Die haeufigste Ursache ist eine
    // volle Platte, dann waere auch das .tmp unvollstaendig; ein Abbruch laesst die Zieldatei
    // garantiert unberuehrt. Der Preis ist bekannt und bewusst: Haelt ein fremdes Werkzeug
    // dauerhaft die .bak offen, kann nicht gespeichert werden. Genau dagegen laeuft die
    // Wiederholung oben.
    return fehler(
      'speicher_fehler',
      `Sicherung von ${path.basename(ziel)} fehlgeschlagen: ${text(sicherungsFehler)}`,
    )
  }

  // SCHRITT 2: vollstaendig in die Nebendatei schreiben.
  try {
    const griff = await fs.open(temp, 'w')
    try {
      await griff.writeFile(inhalt, 'utf8')
      // fsync VOR dem Rename. Ohne ihn kann das Betriebssystem den Verzeichniseintrag schon
      // umgehaengt haben, waehrend die Nutzdaten noch im Puffer stehen - nach einem Stromausfall
      // stuende dann eine LEERE Queue-Datei da, und die alte waere weg. Der STOPP-Block verlangt
      // ausdruecklich, das nicht stillschweigend wegzulassen, und nennt den realen Anlass: Der
      // Datenort kann auf einem USB-Stick liegen. Gleichstand mit #31, #46 und dem Export
      // (TK 9.6.3).
      await griff.sync()
    } finally {
      // Schliessen MUSS gelingen, bevor umbenannt wird: Ein eigenes offenes Handle auf die
      // Quelle ist derselbe EPERM-Fall wie ein fremdes, und dagegen hilft keine Wiederholung.
      // Ein Fehler beim Schliessen wird verschluckt, damit er nicht die eigentliche Ursache aus
      // dem try-Block verdeckt - die Daten sind zu diesem Zeitpunkt bereits gesynct.
      await griff.close().catch(() => undefined)
    }
  } catch (ursache) {
    // ABWEICHUNG VON #31/#46, und zwar auf Geheiss der Fehlerpfad-Tabelle dieses Issues
    // (".tmp-Rest wird aufgeraeumt"): Das Bruchstueck wird entfernt. Es ist hier ungefaehrlich,
    // weil an dieser Stelle NICHT feststeht, dass die .tmp vollstaendig ist - im Gegenteil, sie
    // ist es gerade nicht. Scheitert auch das Aufraeumen, ist das kein eigener Fehler: Der
    // naechste Versuch oeffnet dieselbe Datei mit 'w' und ueberschreibt sie.
    await fs.rm(temp, { force: true }).catch(() => undefined)
    return fehler(
      'speicher_fehler',
      `${path.basename(ziel)} konnte nicht geschrieben werden: ${text(ursache)}`,
    )
  }

  // SCHRITT 3: der unteilbare Moment. Vorher zeigt der Name auf den alten Stand, nachher auf den
  // neuen; ein Dritter sieht nie etwas dazwischen. Die vorhandene Zieldatei wird NICHT vorher
  // geloescht - das oeffnete ein Fenster, in dem die Datei gar nicht existiert.
  const umbenennFehler = await mitWiederholung(() => fs.rename(temp, ziel))
  if (umbenennFehler !== null) {
    // Die .tmp bleibt hier bewusst liegen - anders als im Zweig darueber. Sie ist an dieser
    // Stelle VOLLSTAENDIG und gesynct, also die einzige Fassung des neuen Standes auf der Platte;
    // sie wegzuraeumen wuerde Daten vernichten, um aufgeraeumt auszusehen. Der naechste
    // Schreibvorgang oeffnet sie ohnehin mit 'w' und ueberschreibt sie.
    return fehler(
      'speicher_fehler',
      `${path.basename(ziel)} konnte nicht ersetzt werden: ${text(umbenennFehler)}`,
    )
  }

  return { ok: true, wert: undefined }
}

/**
 * Ist die vorhandene Zieldatei als Sicherung ueberhaupt brauchbar?
 *
 * WARUM DIESE FRAGE UEBERHAUPT GESTELLT WIRD (gefunden beim Bau von #34 am 12.08.2026, hier
 * uebernommen): Die Sicherung laeuft als ERSTER Schritt und kopierte in #31/#46 zunaechst, was
 * immer dort lag. Wurde eine Datei gerade AUS ihrer .bak gerettet - weil die Hauptdatei defekt
 * war -, dann kopierte der naechste Schreibvorgang genau diese defekte Datei ueber die einzige
 * heile Fassung. Scheitert danach das Schreiben, und die haeufigste Ursache dafuer ist eine
 * volle Platte, ist der Stand ENDGUELTIG weg.
 *
 * Fuer die Queue-Dateien ist dieser Ablauf nicht bloss denkbar, sondern eingebaut: leseJetzt
 * liefert oben ausdruecklich den Inhalt der .bak zurueck und laesst die defekte Hauptdatei
 * liegen. Ohne diese Pruefung wuerde der darauffolgende Schreibvorgang die Rettung zunichte
 * machen.
 *
 * Die Pruefung ist bewusst schwach - nur "laesst sich lesen und als JSON auswerten". Sie
 * beurteilt NICHT, ob der Inhalt fachlich vollstaendig ist; das entscheiden #55/#56/#57. Hier
 * geht es allein um die Frage, ob diese Datei als Rueckfallebene taugt - und eine Datei, die
 * nicht einmal parst, taugt es nicht.
 *
 * Ist sie unbrauchbar, wird die Sicherung UEBERSPRUNGEN statt abgebrochen: Die vorhandene .bak
 * bleibt unberuehrt und damit die letzte heile Fassung, und der neue, gute Stand wird trotzdem
 * geschrieben. Ein Abbruch waere hier das Gegenteil von hilfreich - er verweigerte das Speichern
 * genau dann, wenn die Hauptdatei ohnehin schon kaputt ist.
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
      // Alles andere (ENOENT, ENOSPC, EACCES) verschwindet nicht von selbst - dort waere Warten
      // nur eine Verzoegerung mit demselben Ausgang.
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
 * Die Fehlerseite der Huelle - bewusst OHNE Nutztyp, damit sie fuer `Ergebnis<void, …>` genauso
 * passt wie fuer das generische `Ergebnis<T, …>` von `leseQueueDatei`.
 *
 * "Eine rohe Exception-Meldung wird nie zum Code." (TK 9.1.1 Punkt 3) - der Text einer Ausnahme
 * landet ausschliesslich in `meldung`, der Code kommt immer aus dieser geschlossenen Union.
 */
function fehler(
  code: QueueFehlercode | GenerischerFehlercode,
  meldung: string,
): { ok: false; fehler: { code: QueueFehlercode | GenerischerFehlercode; meldung: string } } {
  return { ok: false, fehler: { code, meldung } }
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEIN fsync AUF DAS VERZEICHNIS. Nach POSIX ueberlebt ein Rename einen Stromausfall erst,
//    wenn auch der Verzeichniseintrag gesynct ist. Auf Windows ist ein fsync auf ein Verzeichnis
//    nicht moeglich (gemessen, #46), unter macOS waere es machbar. Der STOPP-Block nennt es als
//    offene Frage; eine plattformabhaengige Zusatzsicherung wurde NICHT eingebaut, weil sie das
//    Verhalten der beiden Zielplattformen auseinanderzoege, ohne dass irgendwo festgelegt ist,
//    dass die Queue-Dateien dieses Niveau brauchen. Das .tmp selbst ist gesynct - der Fall "leere
//    Queue-Datei nach Stromausfall" ist damit ausgeschlossen; offen bleibt allein "Rename nach
//    Stromausfall nicht sichtbar", dann steht die ALTE Datei da. Gleichstand mit #31 und #46.
//
// 2. KEIN fsync AUF DIE .bak. fs.copyFile schreibt ueber den Puffer; ein Absturz unmittelbar nach
//    dem Kopieren kann eine unvollstaendige .bak hinterlassen. Gleichstand mit #31 und #46.
//
// 3. KEINE UNTEILBARE LESEN-AENDERN-SCHREIBEN-OPERATION. S. den Vermerk in leseQueueDatei.
//
// 4. KEINE AUSWERTUNG VON QUEUE_SCHEMA_VERSION, keine Migration, kein Zurueckschreiben einer
//    geretteten .bak, keine Kenntnis der Q2-/Q3-/Q4-Struktur, keine Rotation und kein Loeschen
//    alter .bak-Dateien - alles ausdruecklich verboten (STOPP-Block) und Sache von #55/#56/#57.
//
// 5. KEIN AUFRAEUMEN DER .tmp NACH EINEM GESCHEITERTEN RENAME - begruendet an der Stelle selbst.
