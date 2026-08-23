// GENERIERT aus dem Signaturblock von Issue #55.
// [auftrags-manager] Q2-Wiederholungsspeicher je Projekt führen
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
// GERUEST-PRUEFSUMME: cc4f7812eba8731a
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
// alle Parameter werden jetzt benutzt. Der Absatz darueber bleibt als Beleg stehen.

import path from 'node:path'

import { projektOrdner } from '../project-store/pfade'

import { QUEUE_SCHEMA_VERSION, leseQueueDatei, schreibeQueueDatei } from './schreibe-queue-json'

import type { Ergebnis, GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import type { Auftrag } from '../../shared/contracts/auftrag'
import type { QueueFehlercode } from './schreibe-queue-json'   // = 'speicher_fehler' (#69)

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #69: leseQueueDatei<T>(pfad: string, fallback: T): Promise<Ergebnis<T, QueueFehlercode>>
//   #69: schreibeQueueDatei(pfad: string, inhalt: unknown): Promise<Ergebnis<void, QueueFehlercode>>
//   #69: const QUEUE_SCHEMA_VERSION = 1   // gilt fuer Q2, Q3 und Q4 – KEINE eigene Zahl erfinden
//   #49:   projektOrdner(projektId: string): string   // reine Berechnung, kann nicht fehlschlagen
// Dateipfad (verbindlich): path.join(projektOrdner(projektId), 'queue-retry.json')

export interface PendingDeletion {
  dateiname: string        // <uuid>.<ext>, OHNE Verzeichnisanteil (TK 9.4.8 Punkt 1)
  vermerktAm: string       // ISO-8601 UTC
}

export interface Q2Datei {
  schemaVersion: number    // beim Schreiben IMMER QUEUE_SCHEMA_VERSION aus #69
  auftraege: Auftrag[]
  pendingDeletions: PendingDeletion[]
}

const Q2_DATEINAME = 'queue-retry.json'

/**
 * Der zuletzt geladene Q2-Stand - genau EINER, samt der projektId, zu der er gehoert.
 *
 * Warum die projektId dazugehoert und nicht nur der Inhalt: Q2 liegt PRO PROJEKT (TK 9.3).
 * Ohne die mitgefuehrte Zugehoerigkeit koennte eine Schreibfunktion nicht erkennen, dass der
 * gehaltene Stand zu einem anderen Projekt gehoert - sie schriebe dessen Fehlschlaege in die
 * Datei des gerade gemeinten Projekts. Deshalb pruefen alle drei Schreibfunktionen ueber
 * `sicherGeladen` zuerst die Zugehoerigkeit.
 *
 * Zulaessig ist ein gehaltener Stand ueberhaupt nur, weil #51 genau EINE App-Instanz erzwingt;
 * ein zweiter Prozess, der dieselbe Datei hinter dem Ruecken dieses Standes fortschreibt, kann
 * es nicht geben.
 */
let stand: { projektId: string; datei: Q2Datei } | null = null

/**
 * Die Unterscheidung "Datei fehlt" von "Datei enthaelt etwas".
 *
 * #69 meldet eine fehlende Datei, indem es den uebergebenen `fallback` zurueckgibt - es gibt
 * keinen eigenen Zustand dafuer. Ein gewoehnlicher Rueckfallwert (`null`, `{}`) waere hier
 * mehrdeutig: Eine Datei, die woertlich `null` enthaelt, parst fehlerfrei, und der Rueckgabewert
 * saehe genauso aus wie "es gibt sie nicht". Der Unterschied ist nicht akademisch - "fehlt" ist
 * der Normalfall der Erstbenutzung und ergibt eine leere Q2, waehrend eine vorhandene, aber
 * unbrauchbare Datei speicher_fehler ergeben MUSS (sonst verschwinden Fehlschlaege lautlos).
 * Ein Symbol kann aus JSON.parse nie hervorgehen, der Vergleich ist damit eindeutig.
 */
const FEHLT: unique symbol = Symbol('queue-retry.json existiert nicht')

export async function ladeQ2(projektId: string): Promise<Ergebnis<Q2Datei, QueueFehlercode>> {
  if (!istGefuellterText(projektId)) {
    return fehler('ungueltige_eingabe', 'ladeQ2 wurde ohne Projekt-ID aufgerufen.')
  }

  try {
    const pfad = q2Pfad(projektId)
    const gelesen = await leseQueueDatei<unknown>(pfad, FEHLT)
    if (!gelesen.ok) {
      // Durchreichen, KEIN Rueckfall auf eine leere Q2. #69 hat an dieser Stelle bereits die
      // .bak versucht; kommt trotzdem ein Fehler, ist der Inhalt wirklich weg. Eine leere Q2
      // an seiner Stelle saehe aus wie ein Projekt ohne Fehlschlaege und ohne offene
      // Loeschungen - der Verlust waere unsichtbar (TK 9.5.4: "Fehler melden, nicht
      // leer/verlustbehaftet weiterstarten").
      return gelesen
    }

    if (gelesen.wert === FEHLT) {
      // ERSTBENUTZUNG. Die Datei wird hier NICHT vorsorglich angelegt: Ein Projekt, in dem nie
      // etwas fehlgeschlagen ist, soll auch keine Wiederholungsdatei haben - erst der erste
      // echte Fehlschlag bringt sie in die Welt.
      return uebernimm(projektId, leereQ2())
    }

    const geprueft = pruefeQ2Form(gelesen.wert, projektId)
    if (!geprueft.ok) {
      return geprueft
    }
    return uebernimm(projektId, geprueft.wert)
  } catch (ursache) {
    return fehler('unbekannter_fehler', `Laden der Q2 von ${projektId} abgebrochen: ${text(ursache)}`)
  }
}
// fehlende Datei -> leere, gueltige Q2Datei (Erstbenutzung ist kein Fehler)
// fuellt ausserdem den modul-internen Stand, den holeQ2Stand() zurueckgibt

// synchron, nur RAM
export function vergissQ2Stand(projektId: string): void {
  // NACHGETRAGEN 12.08.2026. Ohne diese Funktion legt der naechste merkeFehlschlag oder
  // aenderePendingDeletions die queue-retry.json im GELOESCHTEN Projektordner wieder an -
  // schreibeQueueDatei macht mkdir -p. Das geloeschte Projekt haette danach wieder einen
  // Ordner mit einer Datei darin, und listeProjekte (#35) fuehrte es als beschaedigt.
  //
  // Dieselbe Fehlerklasse wie A1, wo der Auto-Speicher-Timer project.json neu anlegte - nur
  // ueber die Warteschlange statt ueber D1.
  //
  // NIMMT EINE ID UND VERGISST NICHT BLIND: Wer ein ANDERES Projekt loescht, duerfte den Stand
  // des offenen nicht mitvernichten. Dieselbe Ueberlegung wie bei verwirfGeplanteSpeicherung.
  if (stand !== null && stand.projektId === projektId) {
    stand = null
  }
}

export function holeQ2Stand(): { projektId: string; datei: Q2Datei } | null {
  if (stand === null) {
    return null
  }
  // HERAUSGEGEBEN WIRD EINE KOPIE, nicht der gehaltene Stand selbst.
  //
  // #64 (holeStand) fuehrt Q1 und Q2 zusammen und wird dabei sortieren, filtern oder anhaengen.
  // Bekaeme es die Original-Arrays, veraenderte ein `sort()` beim Zusammenfuehren den Stand
  // dieses Moduls - und der naechste Schreibvorgang schriebe die veraenderte Reihenfolge auf die
  // Platte, ohne dass irgendjemand das beabsichtigt haette. Kopiert werden nur die beiden Listen
  // (flach): Die Auftraege selbst werden hier wie Werte behandelt und nie im Bestand veraendert -
  // `merkeFehlschlag` ERSETZT einen Eintrag, statt in ihm herumzuschreiben.
  return { projektId: stand.projektId, datei: kopie(stand.datei) }
}
// liefert den zuletzt per ladeQ2 geladenen Stand OHNE Dateizugriff;
// null, solange in dieser Sitzung noch kein Projekt geladen wurde

export async function merkeFehlschlag(projektId: string, auftrag: Auftrag): Promise<Ergebnis<void, QueueFehlercode>> {
  if (!istGefuellterText(projektId)) {
    return fehler('ungueltige_eingabe', 'merkeFehlschlag wurde ohne Projekt-ID aufgerufen.')
  }
  if (!istAuftragMitId(auftrag)) {
    return fehler('ungueltige_eingabe', 'merkeFehlschlag wurde ohne brauchbaren Auftrag aufgerufen.')
  }

  try {
    const bereit = await sicherGeladen(projektId)
    if (!bereit.ok) {
      return bereit
    }
    const bisher = bereit.wert

    // ANLEGEN ODER AKTUALISIEREN - nie ein Duplikat. Der bestehende Eintrag wird an SEINER
    // Stelle ersetzt, nicht ans Ende geschoben: Die Reihenfolge in Q2 ist die Reihenfolge des
    // ersten Scheiterns, und ein wiederholt gescheiterter Auftrag springt im Panel (#64) sonst
    // bei jedem Versuch nach unten.
    const index = bisher.auftraege.findIndex((vorhanden) => vorhanden.auftragId === auftrag.auftragId)
    const auftraege =
      index >= 0
        ? bisher.auftraege.map((vorhanden, i) => (i === index ? auftrag : vorhanden))
        : [...bisher.auftraege, auftrag]

    // `versuche` und `fehler` werden UEBERNOMMEN, nicht hier hochgezaehlt: "versuche steigt beim
    // START der Wiederholung (9.3.3)", und der Start ist #63/#59, nicht dieser Speicher. Wer hier
    // zusaetzlich zaehlte, zaehlte doppelt.
    return await sichere(projektId, { ...bisher, auftraege })
  } catch (ursache) {
    return fehler('unbekannter_fehler', `merkeFehlschlag abgebrochen: ${text(ursache)}`)
  }
}
// legt den Eintrag an ODER aktualisiert den bestehenden mit gleicher auftragId – nie ein Duplikat
// aendert ERST den Stand im Speicher, DANN die Datei

export async function streicheAusQ2(projektId: string, auftragId: string): Promise<Ergebnis<void, QueueFehlercode>> {
  if (!istGefuellterText(projektId)) {
    return fehler('ungueltige_eingabe', 'streicheAusQ2 wurde ohne Projekt-ID aufgerufen.')
  }
  if (!istGefuellterText(auftragId)) {
    return fehler('ungueltige_eingabe', 'streicheAusQ2 wurde ohne Auftrags-ID aufgerufen.')
  }

  try {
    const bereit = await sicherGeladen(projektId)
    if (!bereit.ok) {
      return bereit
    }
    const bisher = bereit.wert

    const auftraege = bisher.auftraege.filter((vorhanden) => vorhanden.auftragId !== auftragId)
    if (auftraege.length === bisher.auftraege.length) {
      // IDEMPOTENT UND OHNE SCHREIBVORGANG. Der Regelfall ist der Erfolg eines Auftrags, der nie
      // fehlgeschlagen war - #70 streicht dort "einen etwaigen" Eintrag. Ein Fehlercode machte
      // aus jedem gewoehnlichen Erfolg einen Fehlschlag; ein Schreibvorgang schriebe bei jedem
      // Erfolg dieselbe Datei neu und legte sie im Extremfall erst dadurch an.
      return { ok: true, wert: undefined }
    }

    return await sichere(projektId, { ...bisher, auftraege })
  } catch (ursache) {
    return fehler('unbekannter_fehler', `streicheAusQ2 abgebrochen: ${text(ursache)}`)
  }
}
// entfernt den Eintrag; pendingDeletions bleiben davon unberuehrt
// IDEMPOTENT: ohne Treffer { ok: true, wert: undefined } – NICHT nicht_gefunden
// aendert ERST den Stand im Speicher, DANN die Datei

export async function aenderePendingDeletions(
  projektId: string,
  aendere: (liste: PendingDeletion[]) => PendingDeletion[],
): Promise<Ergebnis<void, QueueFehlercode>> {
  if (!istGefuellterText(projektId)) {
    return fehler('ungueltige_eingabe', 'aenderePendingDeletions wurde ohne Projekt-ID aufgerufen.')
  }
  if (typeof aendere !== 'function') {
    return fehler('ungueltige_eingabe', 'aenderePendingDeletions wurde ohne Aenderungsfunktion aufgerufen.')
  }

  try {
    const bereit = await sicherGeladen(projektId)
    if (!bereit.ok) {
      return bereit
    }
    const bisher = bereit.wert

    // DIE FUNKTION SIEHT NUR DIE pendingDeletions - und davon eine Kopie. Die Trennung der
    // beiden Listen haengt damit nicht am Wohlverhalten des Aufrufers: `auftraege` ist fuer
    // `aendere` schlicht nicht erreichbar, und ein Aufrufer, der die uebergebene Liste an Ort
    // und Stelle veraendert (`liste.push(...)` statt `[...liste, x]`), kann den gehaltenen Stand
    // nicht mehr beruehren.
    let neue: unknown
    try {
      neue = aendere([...bisher.pendingDeletions])
    } catch (ursache) {
      return fehler('unbekannter_fehler', `Die Aenderungsfunktion ist gescheitert: ${text(ursache)}`)
    }
    if (!Array.isArray(neue) || !neue.every(istPendingDeletion)) {
      // Weder Speicher noch Platte werden angefasst: Der alte Stand ist der letzte, von dem
      // bekannt ist, dass er stimmt.
      return fehler(
        'ungueltige_eingabe',
        'Die Aenderungsfunktion hat keine Liste vorgemerkter Loeschungen geliefert.',
      )
    }

    return await sichere(projektId, { ...bisher, pendingDeletions: neue })
  } catch (ursache) {
    return fehler('unbekannter_fehler', `aenderePendingDeletions abgebrochen: ${text(ursache)}`)
  }
}
// die EINZIGE Schreib-Tuer fuer pendingDeletions – #66 benutzt ausschliesslich diese Funktion
// liest den gehaltenen Stand, wendet `aendere` NUR auf die Liste pendingDeletions an,
// laesst `auftraege` unveraendert, aktualisiert den Stand im Speicher und schreibt die Datei
// ueber den gemeinsamen Baustein (#69)
// aendert ERST den Stand im Speicher, DANN die Datei

// ---------------------------------------------------------------------------------------------
// Innere Bausteine
// ---------------------------------------------------------------------------------------------

/**
 * Der Pfad der Q2-Datei dieses Projekts.
 *
 * Der ORDNER kommt ausschliesslich aus der Pfad-Autoritaet (#49) - ein selbst zusammengesetztes
 * `<Datenort>/projects/<id>` waere eine zweite Quelle der Wahrheit fuer das Datei-Layout
 * (TK 9.5.7). Das Anhaengen des Dateinamens an einen fertigen Ordner ist normale Pfadbildung und
 * ausdruecklich erlaubt; `projektOrdner` rechnet nur und kann nicht fehlschlagen, hier entsteht
 * also kein Fehlerzweig.
 */
function q2Pfad(projektId: string): string {
  return path.join(projektOrdner(projektId), Q2_DATEINAME)
}

function leereQ2(): Q2Datei {
  return { schemaVersion: QUEUE_SCHEMA_VERSION, auftraege: [], pendingDeletions: [] }
}

/** Uebernimmt eine geladene Datei in den gehaltenen Stand und gibt sie als Kopie heraus. */
function uebernimm(projektId: string, datei: Q2Datei): Ergebnis<Q2Datei, QueueFehlercode> {
  stand = { projektId, datei }
  return { ok: true, wert: kopie(datei) }
}

/**
 * ACHTUNG, FLACHE KOPIE - und das ist eine Falle fuer jeden Aufrufer.
 *
 * Die LISTEN sind neu: Wer sortiert, filtert oder etwas anhaengt, veraendert den gehaltenen
 * Stand nicht. Die `Auftrag`-OBJEKTE darin sind aber DIESELBEN. Wer eines davon irgendwo
 * einhaengt, wo es veraendert wird, veraendert damit den Q2-Eintrag.
 *
 * REAL PASSIERT beim Bau von #63 (wiederhole): Haette es den gefundenen Eintrag direkt an
 * `fuegeAnsEndeAn` (Q1) gereicht, saetzte der Torwaechter (#59) anschliessend `status` und
 * `versuche` AM Q2-EINTRAG. Der letzte Fehlerstand waere ueberschrieben, und der naechste
 * Schreibvorgang legte `status: 'laeuft'` dauerhaft in die `queue-retry.json` - ein Eintrag,
 * der beim naechsten Start weder als Fehlschlag erkennbar noch wiederholbar waere. Genau der
 * Verlust, gegen den FA-17 steht. #63 reiht deshalb eine WERTKOPIE ein.
 *
 * Warum hier nicht tief kopiert wird: `holeQ2Stand` wird auch von `holeStand` (#64) gerufen,
 * das den Stand bei JEDER Zustandsaenderung liefert. Eine tiefe Kopie waere dort reine
 * Verschwendung, und sie naehme dem Panel die lebenden Objekte, ueber die der Fortschritt
 * eines laufenden Auftrags aktuell bleibt. Die Verantwortung liegt beim Aufrufer - dieser
 * Vermerk ist der Ort, an dem er davon erfaehrt.
 */
function kopie(datei: Q2Datei): Q2Datei {
  return {
    schemaVersion: datei.schemaVersion,
    auftraege: [...datei.auftraege],
    pendingDeletions: [...datei.pendingDeletions],
  }
}

/**
 * Die verbindliche Vorbedingung ALLER drei Schreibfunktionen: Sie arbeiten auf dem gehaltenen
 * Stand, und gehoert der zu einem ANDEREN Projekt oder gibt es noch keinen, wird zuerst geladen.
 *
 * Ohne diese Regel haengt das Ergebnis davon ab, ob zufaellig vorher jemand `ladeQ2` gerufen hat:
 * Ein Fehlschlag landete mal in der richtigen Datei und mal - lautlos - im Stand eines fremden
 * Projekts. Ein Laden "auf Verdacht" bei JEDEM Zugriff ist damit ausdruecklich nicht gemeint; das
 * hoebe den Zweck des gehaltenen Standes auf und machte aus jedem Streichen einen Dateizugriff.
 *
 * Zurueckgegeben wird der GEHALTENE Stand (keine Kopie): Die Schreibfunktionen bauen daraus einen
 * neuen Stand und veraendern den alten nie an Ort und Stelle.
 */
async function sicherGeladen(projektId: string): Promise<Ergebnis<Q2Datei, QueueFehlercode>> {
  if (stand === null || stand.projektId !== projektId) {
    const geladen = await ladeQ2(projektId)
    if (!geladen.ok) {
      // Der Fehler des Ladens wird UNVERAENDERT durchgereicht - kein eigener Code, keine eigene
      // Meldung. Wer hier uebersetzte, verlaengerte die Kette, ueber die eine volle Platte als
      // etwas anderes ankommt, als sie ist.
      return geladen
    }
  }
  // Nach dem Laden steht der Stand; die Abfrage ist die Bedingung, unter der TypeScript das
  // ebenfalls weiss - ein `!` waere hier die verbotene Abkuerzung (#193).
  if (stand === null) {
    return fehler('unbekannter_fehler', 'Der Q2-Stand fehlt unmittelbar nach dem Laden.')
  }
  return { ok: true, wert: stand.datei }
}

/**
 * ERST der Stand im Speicher, DANN die Datei - in dieser Reihenfolge und verbindlich.
 *
 * Warum der Stand auch dann gesetzt bleibt, wenn das Schreiben scheitert: Der Fehlschlag IST
 * passiert; die Oberflaeche muss ihn zeigen koennen, auch wenn er gerade nicht auf die Platte
 * ging. Der Fehler wird dabei vollstaendig gemeldet (NFA-02), und der naechste gelungene
 * Schreibvorgang traegt den gesammelten Stand nach. Ein Ruecknehmen der Speicheraenderung waere
 * das Gegenteil: Der Eintrag verschwaende aus dem Panel, und der Nutzer erfuehre nichts von einem
 * Auftrag, der nie fertig wurde.
 *
 * Die `schemaVersion` wird beim Schreiben IMMER aus #69 gesetzt und nie aus dem gelesenen Stand
 * uebernommen - eine Datei traegt damit nie eine Zahl, die dieses Modul nicht selbst kennt.
 */
async function sichere(projektId: string, datei: Q2Datei): Promise<Ergebnis<void, QueueFehlercode>> {
  const zuSchreiben: Q2Datei = { ...datei, schemaVersion: QUEUE_SCHEMA_VERSION }
  stand = { projektId, datei: zuSchreiben }
  return schreibeQueueDatei(q2Pfad(projektId), zuSchreiben)
}

/**
 * Prueft die gelesene Datei auf die Form, die dieses Modul verspricht.
 *
 * #69 liefert bewusst `unknown` und baut keine Kenntnis ueber den Inhalt auf ("wer T behauptet,
 * prueft es bei sich"). Ohne die Pruefung hier stuende der Zwang `as Q2Datei` allein da, und eine
 * fremde oder halb geschriebene Datei ergaebe einen Stand, dessen `auftraege` gar kein Array ist -
 * der Fehler faellt dann erst beim naechsten `findIndex` auf, und zwar als Absturz.
 *
 * Bewusst NICHT geprueft wird die INNERE Form der Auftraege. Dazu muesste die Union aus #16
 * hier ein zweites Mal beschrieben werden; zwei Beschreibungen desselben Vertrages laufen
 * auseinander, und die zweite wuerde beim naechsten Feld zur stillen Schranke, die gueltige
 * Auftraege abweist. Was hier zaehlt, ist die Form der DATEI.
 */
function pruefeQ2Form(wert: unknown, projektId: string): Ergebnis<Q2Datei, QueueFehlercode> {
  if (typeof wert !== 'object' || wert === null || Array.isArray(wert)) {
    return fehler(
      'speicher_fehler',
      `Die Wiederholungsdatei von ${projektId} enthaelt kein Objekt und ist damit unbrauchbar.`,
    )
  }

  // SAFETY: die Zeile davor hat wert als nicht-null, nicht-Array Objekt belegt; der Cast
  // macht die drei Felder als unknown sichtbar, und ihre Form wird darunter geprueft
  // (Version exakt, auftraege/pendingDeletions als Array).
  const roh = wert as { schemaVersion?: unknown; auftraege?: unknown; pendingDeletions?: unknown }

  // DIE VERSION ZUERST: Eine Datei mit unbekannter Version darf gar nicht erst nach bekannten
  // Feldern durchsucht werden - deren Bedeutung ist ja gerade das, was sich geaendert haben kann.
  if (roh.schemaVersion !== QUEUE_SCHEMA_VERSION) {
    const hinweis =
      typeof roh.schemaVersion === 'number' && roh.schemaVersion < QUEUE_SCHEMA_VERSION
        ? 'eine Migration aelterer Wiederholungsdateien ist nicht vorgesehen'
        : 'diese Fassung ist unbekannt und wird nicht geraten'
    return fehler(
      'speicher_fehler',
      `Die Wiederholungsdatei von ${projektId} traegt schemaVersion ${String(roh.schemaVersion)}, ` +
        `erwartet ist ${QUEUE_SCHEMA_VERSION} - ${hinweis}. Die Datei bleibt unveraendert.`,
    )
  }

  if (!Array.isArray(roh.auftraege) || !Array.isArray(roh.pendingDeletions)) {
    return fehler(
      'speicher_fehler',
      `Die Wiederholungsdatei von ${projektId} hat nicht die erwartete Form ` +
        `(auftraege und pendingDeletions muessen Listen sein). Die Datei bleibt unveraendert.`,
    )
  }

  // SAFETY: die Array-Form beider Felder ist davor geprueft (Array.isArray, sonst
  // fruehe Rueckgabe fehler); die innere Form prueft die Union aus #16 - sie wird
  // hier bewusst nicht ein zweites Mal beschrieben (Kommentar oben).
  return {
    ok: true,
    wert: {
      schemaVersion: QUEUE_SCHEMA_VERSION,
      auftraege: [...roh.auftraege] as Auftrag[],
      pendingDeletions: [...roh.pendingDeletions] as PendingDeletion[],
    },
  }
}

import { istGefuellterText } from "../ipc-gateway/nutzlast-pruefer"

// function istGefuellterText removed – imported from common location

/**
 * "auftrag fehlt auftragId oder ist kein gueltiger Auftrag" - hier gelesen als: ein Objekt mit
 * brauchbarer `auftragId`.
 *
 * Weiter geht die Pruefung bewusst nicht. Eine vollstaendige Strukturpruefung waere eine zweite,
 * mitzupflegende Fassung der Union aus #16 - und sie saesse an der falschen Stelle: Der Auftrag
 * kommt aus Q1, also main-intern und aus dem eigenen Bestand, nicht ueber die IPC-Grenze. Die
 * `auftragId` dagegen wird HIER gebraucht (sie entscheidet ueber Anlegen oder Aktualisieren), und
 * ohne sie legte jeder Fehlschlag ein neues Element an.
 */
function istAuftragMitId(wert: unknown): wert is Auftrag {
  if (typeof wert !== 'object' || wert === null) {
    return false
  }
  // SAFETY: die Zeile davor hat wert als nicht-null Objekt belegt; der Cast macht das
  // Feld sichtbar, und istGefuellterText prueft es zur Laufzeit.
  return istGefuellterText((wert as { auftragId?: unknown }).auftragId)
}

/** Die flache Form eines Vermerks - mehr traegt der Typ nicht, mehr wird nicht verlangt. */
function istPendingDeletion(wert: unknown): wert is PendingDeletion {
  if (typeof wert !== 'object' || wert === null) {
    return false
  }
  // SAFETY: die Zeile davor hat wert als nicht-null Objekt belegt; der Cast macht die
  // Felder sichtbar, und istGefuellterText prueft sie darunter zur Laufzeit.
  const roh = wert as { dateiname?: unknown; vermerktAm?: unknown }
  return istGefuellterText(roh.dateiname) && istGefuellterText(roh.vermerktAm)
}

function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

/**
 * Die Fehlerseite der Huelle - ohne Nutztyp, damit sie fuer `Ergebnis<Q2Datei, …>` genauso passt
 * wie fuer `Ergebnis<void, …>`. Kein `throw`: Diese Funktionen werden aus IPC-bedienten
 * Operationen heraus benutzt, und eine Ausnahme verlaere dabei ihren Code (TK 9.1.1).
 */
function fehler(
  code: QueueFehlercode | GenerischerFehlercode,
  meldung: string,
): { ok: false; fehler: { code: QueueFehlercode | GenerischerFehlercode; meldung: string } } {
  return { ok: false, fehler: { code, meldung } }
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEIN VERGESSEN DES GEHALTENEN STANDES. Es gibt keine Funktion, die den Stand leert - die
//    Signatur nennt keine, und eine erfundene haette keinen Aufrufer. Folge: Wird ein Projekt
//    geloescht (#37), waehrend sein Q2-Stand hier liegt, legt der naechste `merkeFehlschlag` oder
//    `aenderePendingDeletions` fuer diese projektId die `queue-retry.json` im geloeschten Ordner
//    wieder an (schreibeQueueDatei legt den Ordner per mkdir an). Genau darauf weist
//    loesche-projekt.ts in seinem eigenen Schluss-Vermerk hin. Zu schliessen ist das nicht hier,
//    sondern durch eine Abmeldung beim Loeschen bzw. Projektwechsel - das waere eine neue
//    Operation und gehoert ins Issue.
//
// 2. KEINE UNTEILBARKEIT ZWISCHEN LESEN UND SCHREIBEN. #69 garantiert Reihenfolge je Datei, nicht
//    Unteilbarkeit; gedeckt ist das, weil diese Datei der einzige Schreiber der queue-retry.json
//    ist (#66 und #64 gehen ueber die Funktionen hier). Innerhalb dieser Datei bleibt ein enger
//    Rest: Laufen ZWEI Schreibfunktionen gleichzeitig los, waehrend noch kein oder ein fremder
//    Stand gehalten wird, laden beide - die zweite Ladung ueberschreibt den bereits geaenderten
//    Stand der ersten, und deren Aenderung ist verloren. Sobald der Stand steht, tritt der Fall
//    nicht mehr auf (jede Funktion aendert den Speicher synchron, bevor sie auf die Platte
//    wartet). Geschlossen ist er NICHT: Ein Mutex oder eine eigene Kette waere das vom STOPP-Block
//    verbotene zweite Lock, und eine unteilbare Lesen-Aendern-Schreiben-Operation in #69 (wie
//    `aendereKonfig` in #31) steht in keiner der beiden Signaturen. In der Anwendung serialisiert
//    der Torwaechter (TK 9.3) die Auftraege ohnehin.
//
// 3. KEINE PRUEFUNG DER projektId ALS PFADSEGMENT. pfade.ts (#49) haelt in seinem Schluss-Vermerk
//    fest, dass `projektOrdner` seine Eingabe nicht prueft und die Pruefung "Sache der Aufrufer"
//    ist - und nennt diese Datei ausdruecklich. Die Fehlertabelle dieses Issues verlangt nur
//    "leer oder kein String", und die Segmentpruefung von #49 ist bewusst nicht exportiert, damit
//    keine zweite Stelle entsteht, die "ist dieser Name in Ordnung?" beantwortet. Nachgebaut wurde
//    sie deshalb nicht. Die projektId stammt heute aus dem eigenen Bestand (D1), ein `..` darin
//    schriebe die Datei aber ausserhalb des Datenorts.
//
// 4. KEIN AUFRAEUMEN. Kein Verfallsdatum, keine Obergrenze, kein Loeschen alter Eintraege - ein
//    Q2-Eintrag verschwindet ausschliesslich ueber streicheAusQ2 (STOPP-Block).
//
// 5. KEINE AUSFUEHRUNG. Diese Datei reiht nichts wieder ein (#63), startet nichts (#59) und
//    fuehrt keine pendingDeletions aus - die verwahrt sie nur, ausgefuehrt werden sie vom
//    Reconcile des media-service (TK v2.4).
