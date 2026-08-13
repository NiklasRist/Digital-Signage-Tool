// GENERIERT aus dem Signaturblock von Issue #37.
// [project-store] löscheProjekt implementieren
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
// GERUEST-PRUEFSUMME: aee5c32cbdbac761
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

import fs from 'node:fs/promises'
import path from 'node:path'

import { leseKonfig } from '../config-store/lese-konfig'          // #26
import { aendereKonfig } from '../config-store/schreibe-config'   // #31

import { holeAktivesProjekt, merkeAktivesProjekt } from './aktives-projekt'  // #192
import { verwirfGeplanteSpeicherung } from './auto-speichern'      // #47
import { mitD1Lock } from './d1-lock'                             // #32
import { projektOrdner } from './pfade'                           // #49

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #49: projektOrdner(projektId: string): string
//        // absoluter Pfad des Projektordners, z. B. <Datenort>/projects/<projektId>;
//        // reine String-Operation, kein Dateisystemzugriff, keine Existenzpruefung -
//        // und KEINE Pruefung der projektId (Signatur ohne Fehlerkanal). S. `istLoeschbareId`.
//   #32: mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//        // fuehrt aktion() garantiert seriell aus; aktion darf selbst NICHT erneut
//        // mitD1Lock aufrufen (Deadlock-Gefahr).
//   #26: leseKonfig(): Promise<Ergebnis<AppKonfig, ConfigFehlercode>>
//        // fehlende config.json ist KEIN Fehler (erster Start) -> Vorbelegungen
//        // { aktivesProjektId: null, letztesExportZiel: null, uiVoreinstellungen: {} }.
//   #31: aendereKonfig<T>(
//          aenderung: (konfig: AppKonfig) => Ergebnis<{ konfig: AppKonfig; wert: T }, ConfigFehlercode>,
//        ): Promise<Ergebnis<T, ConfigFehlercode>>
//        // Lesen - Aendern - Schreiben als EINE ununterbrechbare Einheit; `aenderung` ist SYNCHRON.
//   #265: interface AppKonfig { aktivesProjektId: string | null
//                               letztesExportZiel: string | null
//                               uiVoreinstellungen: Record<string, unknown> }

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProjectStoreFehlercode } from './assets'            // #72

// WARUM `aendereKonfig` (#31) UND NICHT `setzeAktivesProjekt` (#27): Die Abhaengigkeitsliste des
// Issues nennt #27 als die Stelle, die "das aktive Projekt in config-store zurueck auf null"
// setzt. Das kann #27 NICHT: Seine Signatur ist `setzeAktivesProjekt(projektId: string)`, und sein
// Rumpf weist einen leeren String ausdruecklich ab - es gibt dort keinen Weg zu `null`. GEMELDET,
// nicht umgangen: Statt einer erfundenen zweiten Setz-Operation laeuft der Rueckfall ueber genau
// den Baustein, auf dem #27 selbst aufsetzt, und traegt damit dieselbe Lost-Update-Sicherheit.
//
// Dass der `project-store` den `config-store` ruft, ist die im TK vorgesehene Richtung:
// "`öffneProjekt` | `id` → `Ergebnis<Projekt>` (laedt in den Speicher; setzt aktives Projekt via
// `config-store`)" (TK 9.5.2).

/**
 * Eine unbedenkliche Projekt-ID, die NUR als Vergleichswert dient (s. `istLoeschbareId`).
 * Ihr Ordner wird nie angelegt, nie gelesen und nie geloescht.
 */
const VERGLEICHS_ID = 'vergleich'

export async function löscheProjekt(id: string): Promise<Ergebnis<void, ProjectStoreFehlercode>> {
  // VOR dem Lock und vor jeder Wirkung: Diese Funktion loescht rekursiv. Ein Pfad, der auch nur
  // eine Ordnerebene zu weit oben ansetzt, nimmt fremde Projekte oder den ganzen Datenort mit.
  if (!istLoeschbareId(id)) {
    // Der beanstandete Wert steht ABSICHTLICH nicht in der Meldung - sie reist bis in die
    // Oberflaeche (gleiche Linie wie pfade.ts #49).
    return fehler(
      'ungueltige_eingabe',
      'Die Projekt-ID bezeichnet keinen einzelnen Ordner unterhalb von projects/; es wurde nichts geloescht.',
    )
  }

  const ordner = projektOrdner(id)

  // Das Lock wird HIER genommen, nicht vom Aufrufer erwartet - dieselbe Linie wie fuegeAssetHinzu
  // (#72, "diese Funktion nimmt das Lock SELBST"). Es umschliesst Pruefung UND Loeschung: Laeuft
  // parallel ein Schreibvorgang auf project.json desselben Projekts, legt dessen `mkdir`
  // (schreibe-projekt.ts) den soeben geloeschten Ordner sonst mitten im Loeschen wieder an.
  //
  // Der Aufruf des `config-store` weiter unten liegt ebenfalls im Lock. Das ist unbedenklich:
  // config.json hat eine EIGENE Serialisierung (#31), die nie zurueck in D1 greift - es gibt also
  // keine zweite Sperre, die auf diese warten koennte.
  //
  // Die Rueckgabeangabe am Rueckruf ist nicht Zierde: Ohne sie hat `return { ok: true, ... }`
  // keinen Zieltyp, `ok` weitete sich zu `boolean` - und die unterschiedene Union `Ergebnis`
  // passte nicht mehr. Der Fehler traefe erst die Zuweisung ganz aussen.
  return mitD1Lock(async (): Promise<Ergebnis<void, ProjectStoreFehlercode>> => {
    const zustand = await pruefeOrdner(ordner, id)
    if (zustand.zustand !== 'projektordner') {
      return zustand.antwort
    }

    // Ein rekursives Loeschen scheitert auf Windows regelmaessig voruebergehend: Ein
    // Virenscanner, der Explorer oder ein extern geoeffnetes loop.mp4 im Ausgabeordner halten ein
    // Handle, und der Versuch endet mit EBUSY/EPERM - oder mit ENOTEMPTY, weil ein Kind-Eintrag
    // im selben Moment noch nicht weg war.
    //
    // WIEDERHOLT WIRD MIT DER EINGEBAUTEN MECHANIK VON `fs.rm`, NICHT MIT EINER EIGENEN SCHLEIFE
    // wie in #31/#46. Der Unterschied ist nicht Geschmack: Eine eigene Schleife koennte nur den
    // GANZEN Aufruf wiederholen und liefe den bereits abgearbeiteten Baum jedes Mal von vorn ab;
    // `maxRetries` wiederholt dort, wo der Fehler auftritt - beim einzelnen Eintrag. Node
    // wiederholt laut Vertrag genau bei EBUSY, EMFILE, ENFILE, ENOTEMPTY und EPERM, also der
    // Fehlerfamilie, die auch die Schwesterdateien wiederholen, und wartet je Versuch
    // `retryDelay` ms laenger. Fuenf Versuche insgesamt, wie dort.
    //
    // `force: true` unterdrueckt allein ENOENT - dass ein Eintrag waehrend des Loeschens von
    // aussen verschwindet, ist kein Fehlschlag, sondern das Ziel. Die Frage "gibt es das Projekt
    // ueberhaupt?" ist oben schon beantwortet, `force` verdeckt sie also nicht.
    let loeschFehler: unknown = null
    try {
      await fs.rm(ordner, { recursive: true, force: true, maxRetries: 4, retryDelay: 100 })
    } catch (ursache) {
      loeschFehler = ursache
    }

    // ZUERST die geplante Speicherung verwerfen - noch INNERHALB des Locks und noch bevor
    // irgendetwas zurueckgemeldet wird. Ohne das legt der ablaufende Entprellungstimer (#47)
    // Projektordner und project.json ueber schreibeProjekt (#46) NEU an, und das eben
    // geloeschte Projekt ist wenige Sekunden spaeter zurueck - mit dem Stand von vor dem
    // Loeschen. Die Funktion verwirft nur, wenn der vorgemerkte Stand zu DIESEM Projekt
    // gehoert; das Loeschen eines anderen Projekts laesst die ausstehende Arbeit unberuehrt.
    //
    // Auch nach einem TEILWEISE gescheiterten Loeschen richtig: Ein Torso soll nicht durch
    // einen nachlaufenden Schreibvorgang wieder zu einem scheinbar heilen Projekt werden.
    verwirfGeplanteSpeicherung(id)

    // Und aus dem Halter nehmen, falls das geloeschte das aktive Projekt war. Ohne das gaebe
    // holeAktivesProjekt (#192) weiter dasselbe Objekt heraus, und der naechste Sofort-Flush
    // (Render, Export, Beenden) schriebe es ueber schreibeProjekt neu auf die Platte - derselbe
    // Weg zurueck wie ueber den Entprellungstimer, nur ueber einen anderen Ausloeser.
    // Der Vergleich laeuft ueber die ID, nicht ueber die Referenz: Wer ein anderes Projekt
    // loescht, darf das offene nicht schliessen.
    const offen = holeAktivesProjekt()
    if (offen !== null && offen.id === id) {
      merkeAktivesProjekt(null)
    }

    // Der Rueckfall laeuft AUCH nach einem Fehlschlag. Nach einem abgebrochenen rekursiven
    // Loeschen ist der Ordner ein Torso (media/ halb weg, project.json vielleicht noch da); ein
    // config-Eintrag, der weiter darauf zeigt, laedt beim naechsten Start einen Wrack-Stand.
    // TK 9.5.6 verlangt den sanften Rueckfall ausdruecklich fuer den Fall, dass das aktive
    // Projekt fehlt - halb geloescht ist der schlimmere Fall, nicht der harmlosere.
    const konfigFehler = await vergissAktivesProjekt(id)

    if (loeschFehler !== null) {
      return fehler(
        'speicher_fehler',
        `Der Projektordner ${ordner} konnte nicht vollstaendig entfernt werden und ist ` +
          `moeglicherweise TEILWEISE geloescht. Grund: ${text(loeschFehler)}`,
      )
    }
    if (konfigFehler !== null) {
      // Bewusst KEIN `ok: true`. Das Projekt ist zwar weg - aber die zweite Zusage dieser
      // Operation ("war es aktiv, faellt config-store sanft zurueck") ist nicht eingeloest, und
      // ein stiller Teilerfolg ist genau die Klasse Fehler, die spaeter niemand mehr findet.
      // Die Meldung sagt deshalb ausdruecklich, dass das Loeschen selbst gelungen ist; ein
      // Wiederholungsversuch des Nutzers ist ungefaehrlich und endet mit `nicht_gefunden`.
      return fehler(
        'speicher_fehler',
        `Das Projekt wurde geloescht, aber der Vermerk ueber das aktive Projekt in config.json ` +
          `konnte nicht zurueckgesetzt werden. Grund: ${konfigFehler}`,
      )
    }
    return { ok: true, wert: undefined }
  })
}
// - entfernt den KOMPLETTEN Projektordner (project.json, .bak, media/, output/, queue-retry.json)
// - laeuft innerhalb von mitD1Lock (#32); das Lock wird hier SELBST genommen
// - war id das aktive Projekt, ist config-stores aktives Projekt danach null (TK 9.5.6)

// ---------------------------------------------------------------------------
// Intern. Nichts davon ist exportiert: Wer eine dieser Pruefungen braucht, braucht in Wahrheit
// löscheProjekt - eine zweite Stelle, die entscheidet, welcher Ordner geloescht werden darf,
// ist bei einem unumkehrbaren Vorgang das Letzte, was dieses Projekt brauchen kann.
// ---------------------------------------------------------------------------

/**
 * Ist `id` ein Name, der genau EINEN Ordner unterhalb von `projects/` bezeichnet?
 *
 * WARUM DIESE PRUEFUNG UEBERHAUPT: `projektOrdner` (#49) prueft seine ID ausdruecklich NICHT
 * ("koennen es nicht: Ihre Signatur gibt einen String zurueck, kein Ergebnis") und weist die
 * Pruefung den Aufrufern zu. Fuer eine Leseoperation ist das ein Schoenheitsfehler, hier ist es
 * der kritische Fall: `projektOrdner("..")` ergibt den DATENORT, und ein rekursives Loeschen
 * darauf nimmt alle Projekte, config.json und das Protokoll mit.
 *
 * WARUM SIE NICHT DIE ZEICHENLISTE VON #49 WIEDERHOLT: Die Pruefungen dort sind bewusst nicht
 * exportiert; eine Abschrift waere eine zweite Antwort auf "ist dieser Name in Ordnung?" und
 * liefe beim naechsten Zusatz auseinander. Uebernommen ist deshalb die Linie der bereits
 * gebauten Schwesterfunktion `schreibeProjekt` (#46): Das ERGEBNIS von `projektOrdner` wird
 * gegen einen mit unbedenklicher ID gebildeten Vergleichspfad gehalten. Liegt der Ordner im
 * selben Elternverzeichnis und heisst er genau wie die ID, kann die ID kein Pfad gewesen sein.
 *
 * DIE EINE ZEILE MEHR ALS IN #46 ist der Punkt-/Leerzeichen-Abschluss, und sie steht hier wegen
 * der Loeschwirkung: Windows schneidet Punkte und Leerzeichen am Ende eines Pfadsegments still
 * ab. `"<uuid> "` besteht den Vergleich oben (basename === id), zeigt auf dem Dateisystem aber
 * auf `"<uuid>"` - dieselbe Funktion loeschte damit ein Projekt, nach dem gar nicht gefragt
 * wurde, und meldete Erfolg. Der Preis ist ein macOS-Ordner mit Punkt am Ende, der hier nicht
 * geloescht werden kann; Projekt-IDs sind UUIDs (TK 9.11.3), der Fall kann echte Aufrufe nicht
 * treffen.
 */
function istLoeschbareId(id: unknown): id is string {
  if (typeof id !== 'string' || id.length === 0) {
    return false
  }
  if (id.endsWith('.') || id.endsWith(' ')) {
    return false
  }
  const ordner = path.resolve(projektOrdner(id))
  const vergleich = path.resolve(projektOrdner(VERGLEICHS_ID))
  return path.dirname(ordner) === path.dirname(vergleich) && path.basename(ordner) === id
}

type Ordnerzustand =
  | { zustand: 'projektordner' }
  | { zustand: 'unbrauchbar'; antwort: Ergebnis<void, ProjectStoreFehlercode> }

/**
 * Gibt es an dieser Stelle einen echten Ordner - und nur dann darf geloescht werden?
 *
 * `lstat` und NICHT `stat`: `stat` folgt einer Verknuepfung und meldete fuer einen Symlink (auf
 * Windows auch eine Junction) `isDirectory() === true`. Was dann geloescht wuerde, haengt davon
 * ab, wie `fs.rm` mit dem Link umgeht - eine Frage, die man bei einem unumkehrbaren Vorgang
 * nicht offen lassen darf. `lstat` sieht den Link selbst, `isDirectory()` ist dafuer `false`,
 * und dieser Fall wird abgewiesen statt geraten. Ein verknuepfter Projektordner ist damit hier
 * nicht loeschbar; er muss im Explorer/Finder entfernt werden. Das ist die Seite des Irrtums,
 * auf der nichts verloren geht - s. Vermerk am Dateiende.
 *
 * NICHT GEPRUEFT WIRD, OB DER ORDNER WIE EIN PROJEKT AUSSIEHT (project.json vorhanden und
 * lesbar). Das waere hier falsch: `listeProjekte` (#35) fuehrt beschaedigte Projekte
 * ausdruecklich mit auf ("listet **auch** Projekte mit defekter `project.json`, gekennzeichnet
 * statt weggelassen", TK 9.5.2), und genau die will der Nutzer loeschen koennen.
 */
async function pruefeOrdner(ordner: string, id: string): Promise<Ordnerzustand> {
  try {
    const eintrag = await fs.lstat(ordner)

    // DER ORDNERNAME WIRD NACHGERECHNET (ENTSCHIEDEN 12.08.2026).
    //
    // Die Pruefung der Kennung weiter oben ist eine ZEICHENKETTEN-Pruefung - das Ziel bestimmt
    // aber das DATEISYSTEM. Auf Windows und dem macOS-Standarddateisystem ist die Gross- und
    // Kleinschreibung egal: `loescheProjekt("P1")` besteht jede Pruefung und trifft den Ordner
    // `p1`. Ein Projekt waere geloescht, nach dem niemand gefragt hat, und die Funktion meldete
    // Erfolg.
    //
    // `readdir` auf den Elternordner liefert die Namen so, wie sie WIRKLICH auf der Platte
    // stehen. Steht die uebergebene Kennung nicht exakt darunter, wird abgebrochen - `fs.lstat`
    // allein haette das nicht gemerkt, es folgt derselben schreibungsblinden Aufloesung.
    //
    // Heute kann der Fall keinen echten Aufruf treffen (Kennungen sind klein geschriebene
    // UUIDs). Die Pruefung kostet nichts und schliesst die Flanke, bevor sich das
    // Kennungsformat je aendert.
    const namen = await fs.readdir(path.dirname(ordner))
    if (!namen.includes(id)) {
      return {
        zustand: 'unbrauchbar',
        antwort: fehler(
          'ungueltige_eingabe',
          `Unter dieser Kennung liegt kein Ordner mit exakt diesem Namen - moeglicherweise ` +
            `unterscheidet sich die Gross- und Kleinschreibung. Es wurde nichts geloescht.`,
        ),
      }
    }

    if (!eintrag.isDirectory()) {
      return {
        zustand: 'unbrauchbar',
        antwort: fehler(
          'nicht_gefunden',
          `Unter ${ordner} liegt kein Projektordner, sondern eine Datei oder eine Verknuepfung. ` +
            `Es wurde nichts geloescht.`,
        ),
      }
    }
    return { zustand: 'projektordner' }
  } catch (ursache) {
    if (istCode(ursache, 'ENOENT', 'ENOTDIR')) {
      // Der Normalfall dieses Fehlerpfads: Das Projekt gibt es nicht (mehr). "keine Wirkung",
      // wie die Fehlertabelle des Issues es verlangt - und ausdruecklich KEIN Fehlschlag der
      // Anwendung: Zweimal auf Loeschen zu klicken darf nicht wie ein Defekt aussehen.
      return {
        zustand: 'unbrauchbar',
        antwort: fehler('nicht_gefunden', `Es gibt kein Projekt mit dieser Kennung (${ordner}).`),
      }
    }
    // EACCES, EIO, EBUSY: Der Ordner ist da, laesst sich aber nicht befragen. Das ist kein
    // "nicht gefunden" - wer das verwechselt, sagt dem Nutzer, sein Projekt sei weg, obwohl nur
    // die Rechte fehlen.
    return {
      zustand: 'unbrauchbar',
      antwort: fehler(
        'speicher_fehler',
        `Der Projektordner ${ordner} ist nicht zugaenglich. Grund: ${text(ursache)}`,
      ),
    }
  }
}

/**
 * Setzt `aktivesProjektId` auf `null`, WENN dort noch `id` steht. Rueckgabe `null` = erledigt
 * (oder nichts zu tun); sonst der Grund als Text.
 *
 * ERST LESEN, DANN AENDERN: `aendereKonfig` schreibt config.json bei JEDEM Aufruf, auch wenn der
 * Rueckruf nichts veraendert. Ohne das vorgeschaltete `leseKonfig` kostete jedes Loeschen eines
 * BELIEBIGEN Projekts einen Schreibvorgang auf config.json - und ein Fehlschlag dieses
 * ueberfluessigen Schreibens machte aus einem gelungenen Loeschen eine Fehlermeldung. Die
 * eigentliche Entscheidung faellt trotzdem noch einmal INNERHALB des Rueckrufs, weil zwischen
 * Lesen und Aendern ein anderer Projektwechsel liegen kann; nur dort ist sie gegen Lost Update
 * geschuetzt.
 *
 * IST config.json UNLESBAR, gilt das hier NICHT als Fehlschlag. Dann laesst sich gar nicht
 * feststellen, ob das geloeschte Projekt das aktive war, und `leseKonfig` (#26) hat den Fall
 * bereits als eigenen `speicher_fehler` gemeldet. Der Start deckt ihn ohnehin ab: "**fehlt** es
 * (extern geloescht) → sanfter Rueckfall auf 'kein aktives Projekt / Projektliste', **kein**
 * Absturz." (TK 9.5.6) Aus einem gelungenen Loeschvorgang deswegen einen Fehlschlag zu machen,
 * verwirrte nur - der Nutzer wuerde erneut loeschen wollen, was es nicht mehr gibt.
 */
async function vergissAktivesProjekt(id: string): Promise<string | null> {
  const gelesen = await leseKonfig()
  if (!gelesen.ok || gelesen.wert.aktivesProjektId !== id) {
    return null
  }

  const geaendert = await aendereKonfig<void>((konfig) => ({
    ok: true,
    // Der Spread uebernimmt den GANZEN gelesenen Stand; nur `aktivesProjektId` wird ersetzt, und
    // auch das nur, wenn dort immer noch das geloeschte Projekt steht. Hat zwischenzeitlich
    // jemand ein anderes Projekt geoeffnet, bleibt dessen Eintrag stehen - sonst risse dieses
    // Loeschen dem Nutzer das Projekt weg, das er gerade offen hat.
    wert: {
      konfig:
        konfig.aktivesProjektId === id ? { ...konfig, aktivesProjektId: null } : { ...konfig },
      wert: undefined,
    },
  }))

  return geaendert.ok ? null : geaendert.fehler.meldung
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
 * Die Fehlerseite der Huelle.
 *
 * `speicher_fehler` stammt aus `ProjectStoreFehlercode` (#72) und ist seit dem Issue-Nachtrag vom
 * 12.08.2026 zuweisbar; `nicht_gefunden` und `ungueltige_eingabe` sind generisch (ergebnis.ts)
 * und stehen jeder Operation ohnehin offen.
 */
function fehler(
  code: ProjectStoreFehlercode | 'nicht_gefunden' | 'ungueltige_eingabe',
  meldung: string,
): Ergebnis<void, ProjectStoreFehlercode> {
  return { ok: false, fehler: { code, meldung } }
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEINE ABSTIMMUNG MIT DER AUFTRAGSVERWALTUNG. löscheProjekt ist eine Instant-Operation und
//    laeuft NICHT ueber den Torwaechter (TK 9.3), der import/loeschen/render/export serialisiert;
//    das "loeschen" dort meint das MEDIEN-Loeschen des media-service. Laeuft also gerade ein
//    Render oder Export fuer dieses Projekt, wird ihm hier der Ordner unter den Fuessen
//    weggezogen: Der Render schreibt danach in einen Baum, den es nicht mehr gibt, legt Teile
//    davon per mkdir wieder an und hinterlaesst eine Projektleiche. Diese Datei kann das nicht
//    verhindern - sie hat keinen Zugang zu Q1 und darf sich keinen zweiten Sperr-Mechanismus
//    bauen (TK 9.4.8). Die Bedienung (M7) muss das Loeschen sperren, solange ein Auftrag dieses
//    Projekts laeuft, ODER das Loeschen wird ein Auftrag.
//
// 2. KEIN ABBRUCH EINER LAUFENDEN AUTO-SPEICHERUNG. `planeAutoSpeicherung` (#47) haelt einen
//    entprellten Timer von 3-5 s mit dem Projektstand im Speicher; laeuft er NACH dem Loeschen
//    ab, ruft er `schreibeProjekt` (#46), und dessen `mkdir(..., { recursive: true })` legt den
//    geloeschten Projektordner samt project.json wieder an. Ein Abbrecher fehlt: #47 exportiert
//    `planeAutoSpeicherung`, `sofortFlush`, `flushBeimBeenden` und `aufAutoSpeichernEreignis` -
//    keine Funktion, die eine geplante Speicherung VERWIRFT. Solange die nicht existiert, kann
//    diese Datei den Fall nicht schliessen (heute faellt er nicht auf, weil #47 noch ein Rumpf
//    ist). Dasselbe gilt fuer in Q2 gehaltene Wiederholungs-Eintraege dieses Projekts, die
//    `queue-retry.json` im geloeschten Ordner neu schreiben wuerden.
//
// 3. KEIN LEEREN DER MAIN-INTERNEN PROJEKT-SICHT. War das geloeschte Projekt geladen, gibt
//    `holeAktivesProjekt` (#192) danach weiter dasselbe Objekt heraus - eine Setz-Operation dazu
//    gibt es nicht, und #192 ist heute ein Rumpf. Der Renderer leert seine Sicht ueber
//    `leereProjektSicht()` (TK 9.7.4), das ist Sache von M7; main-intern fehlt das Gegenstueck.
//
// 4. KEIN PAPIERKORB. Geloescht wird endgueltig (`fs.rm`), nicht in den Papierkorb verschoben.
//    Das entspricht dem Issue ("physisch von der Platte") und der Bestaetigungspflicht der
//    Oberflaeche (TK 9.5.2); ein Papierkorb waere eine Produktentscheidung, keine Randnotiz -
//    und auf dem USB-Stick gibt es ihn ohnehin nicht.
//
// 5. VERKNUEPFUNGEN INNERHALB DES PROJEKTORDNERS SIND NICHT NACHGEMESSEN. Zeigt in media/ oder
//    output/ ein Symlink nach draussen, haengt es vom Verhalten von `fs.rm` ab, ob nur der
//    Verweis oder sein Ziel faellt. Der Projektordner entsteht ausschliesslich durch Kopieren
//    beim Import (TK: Medien werden ins Projekt KOPIERT), Verknuepfungen kann also nur jemand
//    von Hand hineinlegen. Nachgestellt und gemessen wurde das hier NICHT.
