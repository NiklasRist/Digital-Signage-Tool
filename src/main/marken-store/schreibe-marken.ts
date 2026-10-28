// [marken-store] marken.json atomar und serialisiert lesen und schreiben

import fs from 'node:fs/promises'
import path from 'node:path'

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { FarbRolle, SchriftRolle, Schrift, Herkunft } from '../../shared/contracts/marke'
import type { MarkenFehlercode } from './fehlercodes'
import { eingebauteMarke } from './anfangsbestand'
import { ermittleDatenOrt } from '../datenort'
// Q2/A: die domain-freie Schreib-Mechanik liegt jetzt an EINER Stelle
// (docs/agents/schreib-mechanik-plan.md). Die Zahl WARTEZEITEN_MS bleibt hier.
import { mitWiederholung, taugtAlsSicherung } from '../gemeinsam/schreib-mechanik'
// Die generischen Systemfehler-Helfer liegen neutral (Q2/A S7).
import { istCode, text } from '../gemeinsam/systemfehler'

/**
 * Die drei verbindlichen Antworten des Rumpfs - in DREI Bauteilen:
 *
 * 1. RENAME MIT ERSETZEN UNTER WINDOWS (Erneuten Versuch): dieselben Wartezeiten wie in #31,
 *    #46 und #187 - Klebrigkeit (offene Handles bei Virenscanner/Editor) trifft dort weiter;
 *    es sind die gebauten Zahlen, nicht erfundene. BEWUSST NICHT importiert - eine Modulgrenze
 *    fuer eine Zahl, und die Faelle duerfen sich unabhaengig aendern.
 * 2. FSYNC: ein fsync auf die .tmp vor dem Rename, Stufe wie in #46 (schreibeProjekt) - deshalb
 *    schreibt diese Datei ueber einen eigenen Griff (fs.open), nicht ueber fs.writeFile.
 * 3. FEHLSCHLAG DES .bak-KOPIERENS: Abbruch, gleiche Antwort wie #46. Der haeufigste Grund
 *    (volle Platte) laesst auch das .tmp scheitern; ein Abbruch haelt marken.json garantiert
 *    unberuehrt, und der Bestand bleibt im Speicher (NFA-02). Preis wie in #46 bekannt und
 *    bewusst: Haelt ein fremdes Werkzeug die .bak dauerhaft offen, kann nicht gespeichert
 *    werden - dagegen half der Erneute Versuch oben.
 */
const WARTEZEITEN_MS = [100, 200, 400, 800] as const

/** Dateiname (TK Abschnitt 6). An EINER Stelle, damit .tmp/.bak nicht auseinanderlaufen. */
const DATEINAME = 'marken.json'

/** Entprellzeit: 4000 ms nach der LETZTEN entprellten Aenderung wird geschrieben. */
const ABDELLZEIT_MS = 4000

/**
 * Der MELDE-Ergebnis-Typ von `aufSchreibversuch` - Zustand nach EINEM abgeschlossenen
 * Schreibversuch (Erfolg oder jeden Code).
 */
type SchreibVersuch = { erfolgreich: true } | { erfolgreich: false; code: MarkenFehlercode }

/** HAUPT-INTERNE Hoerer - kein IPC, kein Ereignis (TK 9.1.1); die Oeffnung nach aussen baut #278. */
const hoerer = new Set<(ergebnis: SchreibVersuch) => void>()

/** Der Bestand, im Speicher; null = noch nie geladen. */
let bestand: MarkenEintrag[] | null = null

/**
 * Serialisationskette: JEDES Laden und JEDES Schreiben laeuft hier durch. Sie ist eine
 * Reihenfolge-Garantie INNERHALB dieser Datei (TK 9.15.1: "eigene Schreib-Serialisierung") -
 * kein zweiter Sperr-Mechanismus neben dem D1-Lock (TK 9.5.4), das nur project.json kennt.
 */
let kette: Promise<void> = Promise.resolve()

/** Ist der Bestand im Speicher gegenueber der DATEI verspaetet? Gibt eine ausstehende Entprellung an. */
let unbestaetigt: boolean = false

/** Der laufende Entprell-Timer (entfaellt, wenn kein Stand aussteht). */
let entprelltimer: ReturnType<typeof setTimeout> | null = null

/**
 * Wurde der Bestand aus dem .bak gerettet? Dann ueberspringt GENAU EIN Schreibvorgang das
 * Kopieren nach .bak - sonst ueberschriebe er die einzige heile Fassung mit dem Schrott, das
 * ihn gerade rettete, WENN der neue Stand scheitert (Begruendung wie in #34/#46).
 */
let ausBakGerettet = false
/**
 * ROHE, gespeicherte Form einer Marke in marken.json, BEVOR die Vererbung aufgeloest ist (#279).
 * Bei einer eigenstaendigen Marke (parent === null) sind farben/schriften VOLLSTAENDIG befuellt und
 * alle uebrigen Feld ER GESETZT (Invariante, durchgesetzt von #280 und #284). Bei einer
 * ABGELEITETEN Marke (parent !== null) darf JEDES Feld ausser id/name/parent/eingebaut fehlen bzw.
 * nur teilweise gesetzt sein: farben/schriften sind PARTIELLE Records (fehlende ROLLE = geerbt),
 * logo/sicherheit/radien/schatten/slogan sind je als GANZES Feld optional (undefined = geerbt).
 */
export interface MarkenEintrag {
  id: string
  name: string
  parent: string | null
  eingebaut: boolean
  farben: Partial<Record<FarbRolle, string>>
  schriften: Partial<Record<SchriftRolle, Schrift>>
  logo?: { datei: string; herkunft: Herkunft; seitenverhaeltnis: number } | null
  sicherheit?: { horizontal: number; vertikal: number }
  radien?: { pille: number; karte: number; klein: number }
  schatten?: { versatzY: number; weichzeichnen: number; farbe: string }
  slogan?: { text: string; aktiv: boolean }
}

/**
 * Schema-Version von marken.json. Modul-lokal und hier deklariert. NICHT die
 * AKTUELLE_SCHEMA_VERSION aus #21 verwenden – die gehoert zu project.json/config.json; eine Kopplung
 * an D1-Migrationen ist unerwuenscht. Auch NICHT VORLAGEN_SCHEMA_VERSION (M4-04) oder
 * QUEUE_SCHEMA_VERSION (#69) verwenden.
 */
export const MARKEN_SCHEMA_VERSION = 1

/** Dateiform von marken.json. */
export interface MarkenDatei {
  schemaVersion: number
  marken: MarkenEintrag[]
}

/**
 * Liefert den vollstaendigen Bestand als TIEFE Kopie. Beim ersten Aufruf wird die Datei geladen bzw.
 * (falls sie fehlt) mit GENAU der einen eingebauten Marke angelegt; danach kommt der Bestand aus dem
 * Speicher. Laeuft auf DERSELBEN Serialisierungskette wie `aendereBestand` und niemals daran vorbei;
 * der Erstladevorgang findet HOECHSTENS EINMAL statt (geteiltes in-flight-Promise).
 */
export async function ladeBestand(): Promise<Ergebnis<MarkenEintrag[], MarkenFehlercode>> {
  return inKette(ladenJetzt)
}

/**
 * Der eigentliche Ladeablauf. Nach dem ersten erfolgreichen Laden kommt der Bestand aus dem
 * Speicher (als TIEFE Kopie); bei einem scheiternden Laden bleibt `bestand` null, und ein
 * zweiter Aufruf wiederholt den Versuch - es gibt keinen halb geladenen Zustand.
 */
async function ladenJetzt(): Promise<Ergebnis<MarkenEintrag[], MarkenFehlercode>> {
  if (bestand !== null) {
    return { ok: true, wert: tief(bestand) }
  }
  const ziel = path.join(ermittleDatenOrt(), DATEINAME)

  // SCHRITT 1 des Ladens: marken.json lesen.
  const haupt = await liesKandidat(ziel)

  if (haupt.fehlt) {
    // SCHRITT 2: Datei fehlt -> ANFANGSBESTAND mit GENAU EINER eingebauten Marke; marken.json
    // anlegen (Schritt-Schema des Schreibens unten). Die ID entsteht hier EINMAL und bleibt im
    // Bestand; `eingebauteMarke()` liefert bei jedem Aufruf eine NEUE UUID - der einzige
    // bisherige Aufrufer ist genau dieses Anlegen. Scheitert das Anlegen, bleibt der Speicher
    // leer und nichts von dem Stand ist irgendwo "angelegt".
    const anfangsstand: MarkenEintrag[] = [eingebauteMarke()]
    const angelegt = await schreibeDateiNeu(anfangsstand)
    if (!angelegt.ok) {
      return fehlerHuelle(angelegt.code, angelegt.meldung)
    }
    bestand = anfangsstand
    return { ok: true, wert: tief(bestand) }
  }

  // SCHRITT 3: marken.json NICHT parsebar ODER unbrauchbar gestaltet (marken fehlt, kein
  // Array oder leer - Schritt 6 lautet ausdruecklich "wie nicht parsebar behandeln",
  // erst .bak, dann Fehler) -> das .bak versuchen.  Ein Lesefehler (Rechte, EBUSY) läuft
  // ebenso in den Versuch des .bak: Ist die Fassung im .bak lesbar, ist die Rettung die
  // bessere Antwort als das Angleichen an ein Unlesbares.
  //
  // Scheitert der Versuch, folgt SCHRITT 4: `speicher_fehler` - KEIN Rueckfall auf
  // [eingebauteMarke()]. Ein stiller Wechsel zum Anfangsbestand haette jede vom Nutzer
  // angelegte Marke lautlos vernichtet - genau der Stillverlust, gegen den dieses Issue
  // existiert.

  const hauptFassung =
    haupt.parsebar && traegtBestand(haupt.wert) ? (haupt.wert as MarkenDatei) : null

  let gewaehlt: MarkenDatei
  if (hauptFassung !== null) {
    gewaehlt = hauptFassung
  } else {
    const sicherung = await liesKandidat(`${ziel}.bak`)
    const bakFassung =
      sicherung.parsebar && traegtBestand(sicherung.wert) ? (sicherung.wert as MarkenDatei) : null
    if (bakFassung === null) {
      // Das .bak fehlt oder taugt nichts: `speicher_fehler` - KEIN Rueckfall auf
      // [eingebauteMarke()] (s. Kommentar oben).
      return fehlerHuelle(
        'speicher_fehler',
        `${DATEINAME} ist unlesbar, und ${DATEINAME}.bak bot keine heile Fassung.`,
      )
    }
    // Das .bak rettet: sein Inhalt ist der Bestand; die defekte marken.json bleibt
    // UNVERAENDERT liegen (sie wird in diesem Ablauf nie angefasst), und der naechste
    // Schreibvorgang ueberspringt EINMALIG das frische Kopieren nach .bak (`ausBakGerettet`)
    // - sonst ueberschriebe er die einzige heile Fassung mit dem Schrott, der sie gerade
    // rettete.
    gewaehlt = bakFassung
    ausBakGerettet = true
  }

  // SCHRITT 5, an der GEWAEHLTEN Fassung: falsche schemaVersion -> `speicher_fehler`.
  // Keine Migration, kein Raten ("eine unbekannte Version wird nicht geraten").
  if (gewaehlt.schemaVersion !== MARKEN_SCHEMA_VERSION) {
    return fehlerHuelle(
      'speicher_fehler',
      `${DATEINAME} traegt schemaVersion ${String(gewaehlt.schemaVersion)}, erwartet wird ${String(MARKEN_SCHEMA_VERSION)} - es gibt keine Migration, also wird nicht geladen.`,
    )
  }

  bestand = gewaehlt.marken
  return { ok: true, wert: tief(bestand) }
}

/**
 * Struktur-Nutzbarkeit einer geparsten Fassung - ohne Fachweiterung: `marken` muss ein
 * nichtleeres Array sein ("ein Bestand ohne JEDE Marke ist ein Datenfehler"; TK 9.15.1
 * verlangt, dass die eingebaute Marke immer vorhanden ist). Die EINTRaGE selbst werden
 * hier NICHT geprueft - das verbietet der Vertrag ausdruecklich; die fachlichen Regeln
 * gehoeren den Operationen (#281 bis #289).
 */
function traegtBestand(wert: unknown): wert is MarkenDatei {
  if (typeof wert !== 'object' || wert === null || Array.isArray(wert)) {
    return false
  }
  if (!('schemaVersion' in wert) || !('marken' in wert)) {
    return false
  }
  const marken = (wert as { marken?: unknown }).marken
  return Array.isArray(marken) && marken.length > 0
}

/**
 * Die EINZIGE Art, den Bestand zu aendern. Laedt (falls noetig), ruft `aenderung` mit einer tiefen
 * Kopie des Bestands auf, uebernimmt das Ergebnis in den Speicher und schreibt.
 *
 * `aenderung` ist SYNCHRON – sie darf nicht `await`en. Genau das macht Lesen-Aendern-Schreiben zu
 * einer ununterbrechbaren Einheit: Ohne `await` kann zwischen Lesen und Schreiben kein zweiter Aufruf
 * dazwischenkommen. Liefert `aenderung` ein `ok: false`, wird NICHTS geschrieben und der Fehler
 * unveraendert durchgereicht. Aufrufe laufen streng nacheinander (verkettete Promise), auch die aus
 * verschiedenen Operationen und verschiedenen Dateien des Moduls.
 */
export async function aendereBestand<T>(
  aenderung: (bestand: MarkenEintrag[]) =>
    Ergebnis<{ bestand: MarkenEintrag[]; wert: T }, MarkenFehlercode>,
  schreibart: 'sofort' | 'entprellt',
): Promise<Ergebnis<T, MarkenFehlercode>> {
  return inKette(async () => {
    // Falls der Bestand noch nie geladen wurde, geschieht das Hier und Jetzt innerhalb
    // desselben Kettenlaufs (Lesen-Aendern-Schreiben bleibt eine ununterbrechbare Einheit).
    if (bestand === null) {
      const geladen = await ladenJetzt()
      if (!geladen.ok) {
        return geladen
      }
    }

    let zustand: Ergebnis<{ bestand: MarkenEintrag[]; wert: T }, MarkenFehlercode>
    try {
      zustand = aenderung(tief(bestand as MarkenEintrag[]))
    } catch (ursache) {
      // Die aenderung wirft (Programmfehler des Aufrufers): nichts wird geschrieben,
      // der Bestand im Speicher bleibt unverändert; kein Stacktrace nach draussen.
      return { ok: false, fehler: { code: 'unbekannter_fehler', meldung: text(ursache) } }
    }

    if (!zustand.ok) {
      // Der Aufrufer lehnt ab: NICHTS wird geschrieben, der Fehler unveraendert
      // durchgereicht. Der Bestand im Speicher bleibt unverändert.
      return zustand
    }

    // Das Ergebnis wird im Speicher uebernommen - als TIEFE Kopie, damit der Aufrufer
    // den Bestand nicht hinter dem Ruecken dieser Datei mutieren kann. `unbestaetigt`
    // merkt den Divergenz-Zustand; das Schreiben folgt je nach Schreibart.
    bestand = tief(zustand.wert.bestand)
    unbestaetigt = true

    if (schreibart === 'sofort') {
      // 'sofort' deckt eine noch ausstehende entprellte Aenderung mit: DIESE Datei wird
      // mit dem GESAMTEN aktuellen Bestand geschrieben, und kein Timer läuft danach weiter.
      entprellAnhalten()
      const schreib = await schreibeDateiNeu(bestand)
      if (!schreib.ok) {
        // SCHREIBFEHLER ohne Rollback (NFA-02): die Aenderung bleibt im Speicher; der
        // Code geht an die Hoerer UND an den Aufrufer hinueber. Kein Text wird erfunden -
        // beide Seiten bekommen denselben, den der Schreibvorgang vergeben hat.
        return { ok: false, fehler: { code: schreib.code, meldung: schreib.meldung } }
      }
      unbestaetigt = false
      return { ok: true, wert: zustand.wert.wert }
    }

    // 'entprellt': der Bestand ist im Speicher uebernommen, das Promise erfuellt sich
    // SOFORT; geschrieben wird 4000 ms nach der LETZTEN entprellten Aenderung. Ein
    // laufender Timer wird abgebrochen und frisch gestellt.
    if (entprelltimer !== null) {
      clearTimeout(entprelltimer)
    }
    entprelltimer = setTimeout(() => {
      entprelltimer = null
      // Der Schreibe-Steoss des Timers läuft auf derselben Kettenkoppel wie alle
      // Übrigen Schreibseiten, Damit er sich mit einem 'sofort'-Schreiben niemals
      // verschränkt. Der hier gestartete Kettenlauf wartet NICHT auf Dessen Ende.
      void fuehreEntprelltAus()
    }, ABDELLZEIT_MS)
    return { ok: true, wert: zustand.wert.wert }
  })
}

/**
 * Der Schreib-Stoss des entprellten Timers: schreibt den AKTUELLEN Bestand. Scheitert
 * der Schreib, bleibt `unbestaetigt` stehen - flushBestand() schreibt denselben Stand
 * dann erneut ('Die Aenderungen bleiben im Speicher', NFA-02). Der Schreibvorgang
 * benachrichtigt die Hoerer selbst.
 */
async function fuehreEntprelltAus(): Promise<void> {
  await inKette(async (): Promise<Ergebnis<void, MarkenFehlercode>> => {
    if (!unbestaetigt || entprelltimer !== null) {
      return { ok: true, wert: undefined }
    }
    if (bestand === null) {
      unbestaetigt = false
      return { ok: true, wert: undefined }
    }
    const schreib = await schreibeDateiNeu(bestand)
    if (schreib.ok) {
      unbestaetigt = false
      return { ok: true, wert: undefined }
    }
    // Bei einem Fehlschlag bleibt `unbestaetigt` stehen - der Timer ist bereits
    // abgelaufen; flushBestand() schreibt denselben Stand erneut. Der Schreiblauf
    // hat die Hoerer bereits benachrichtigt; hier ist der Abschluss still.
    return { ok: true, wert: undefined }
  })
}
// 'sofort'    -> die Datei ist geschrieben, BEVOR das Promise erfuellt wird
// 'entprellt' -> der Bestand ist im Speicher uebernommen und das Promise wird erfuellt; die Datei
//                wird 4000 ms nach der LETZTEN entprellten Aenderung geschrieben

/**
 * Schreibt einen noch ausstehenden entprellten Stand sofort und bricht den Timer ab. Steht nichts
 * aus, ist das ein erfolgreicher Leerlauf ({ ok: true }), kein Fehler. Aufrufer: Main-Bootstrap (#3)
 * beim Beenden der App.
 */
export async function flushBestand(): Promise<Ergebnis<void, MarkenFehlercode>> {
  return inKette(async () => {
    // Nichts steht aus: erfolgreicher Leerlauf ({ ok: true }), keine Datei wird angefasst -
    // auch dann, wenn der Speicher leer ist (niemand hat geladen) steht nichts aus.
    entprellAnhalten()
    if (!unbestaetigt) {
      return { ok: true, wert: undefined }
    }
    if (bestand === null) {
      unbestaetigt = false
      return { ok: true, wert: undefined }
    }
    const schreib = await schreibeDateiNeu(bestand)
    if (!schreib.ok) {
      // Der Bestand BLEIBT im Speicher (kein Rollback, NFA-02); `unbestaetigt` bleibt
      // stehen, ein spaeterer Aufruf schreibt denselben Stand erneut.
      return { ok: false, fehler: { code: schreib.code, meldung: schreib.meldung } }
    }
    unbestaetigt = false
    return { ok: true, wert: undefined }
  })
}

/**
 * Registriert einen HAUPT-INTERNEN Hoerer, der nach JEDEM abgeschlossenen Schreibversuch (gleich ob
 * 'sofort', 'entprellt' oder ueber flushBestand) genau einmal aufgerufen wird. Kein Ereignis im Sinne
 * von TK 9.1.1 (kein IPC, kein Kanalname) – reine main-interne Kopplung fuer #278, das daraus den
 * oeffentlichen Kanal `marken:autoSpeichernStatus` baut. Rueckgabewert ist die Abmelde-Funktion.
 */
export function aufSchreibversuch(
  hoererNeu: (ergebnis: SchreibVersuch) => void,
): () => void {
  hoerer.add(hoererNeu)
  return () => hoerer.delete(hoererNeu)
}

/**
 * Benachrichtigt ALLE angemeldeten Hoerer nach EINEM abgeschlossenen Schreibversuch -
 * gleich ob 'sofort', 'entprellt' (Timer) oder 'ueber flushBestand'. JEDER abgeschlossene
 * Versuch benachrichtigt GENAU EINMAL, Erfolg UND Fehler.
 */
function meldeSchreibversuch(ergebnis: SchreibVersuch): void {
  for (const hoererJeder of hoerer) {
    try {
      hoererJeder(ergebnis)
    } catch {
      // Ein Hörer, der wirft, bricht die Runde nicht: Die übrigen Hoerer bekommen
      // ihre Meldung trotzdem, und der Schreibzustand bleibt unberührt.
    }
  }
}

function entprellAnhalten(): void {
  if (entprelltimer !== null) {
    clearTimeout(entprelltimer)
    entprelltimer = null
  }
}

// ---------------------------------------------------------------------------
// Die gemeinsamen Bauteile: Kette, Lesen, Schreiben, Kopieren der tiefe.
// ---------------------------------------------------------------------------

/**
 * Haengt einen Kettenlauf AN die Serialisationskette. Der Aufrufer bekommt sein
 * Promise erst, wenn alle bisherigen Lauf fertig sind - "streng nacheinander",
 * auch aus verschiedenen Operationen und verschiedenen Dateien des Moduls.
 * Runft ein Kettenlauf, bleibt die Kette begehbar: Der NAECHSTE Aufruf trocknet
 * nicht aus, sondern bekommt den Misserfolg als ERGEBNIS und die Kette geht
 * weiter. Nur ein Wurf AUSserhalb der Huelle wuerde sie brechen - deshalb fangen
 * alle Laeufe ihre Fehler in Ergebnis-Huellen.
 */
function inKette<T>(arbeit: () => Promise<Ergebnis<T, MarkenFehlercode>>): Promise<Ergebnis<T, MarkenFehlercode>> {
  const laufUebernimm = kette.then(arbeit, arbeit)
  // Die Kette speichert eine FEHLERIGNORENDE Fassung - sonst wuerde nach einem
  // geworfenen Fehler KEIN spaeteres Anhaengen mehr laufen (der Zustand der Kette
  // ist dann "rejected forever").
  kette = laufUebernimm.then(
    () => undefined,
    () => undefined,
  )
  return laufUebernimm
}

/** Das Ergebnis einer Lesung: fehlte die Datei, oder war sie nicht parsebar? */
type Lesecs = { fehlt: true; parsebar: false; wert: null }
  | { fehlt: false; parsebar: true; wert: unknown }
  | { fehlt: false; parsebar: false; wert: null }

/**
 * Liest EINE Datei und parst sie. ENOENT liefert `fehlt: true` (ungerade das ist
 * der Rueckfallgrund zum Anfangsbestand bzw. ein Zustand fuer eine Antwort);
 * jeder andere Lesefehler oder ein JSON-Fehler liefert "nicht parsebar".
 * `JSON.parse` liefert `any`; der Cast auf `unknown` ist gewollt - die Beurteilung,
 * ob der Inhalt "traegt", geschieht NICHT hier, sondern in `traegtBestand`.
 */
async function liesKandidat(pfad: string): Promise<Lesecs> {
  let roh: string
  try {
    roh = await fs.readFile(pfad, 'utf8')
  } catch (ursache) {
    if (istCode(ursache, 'ENOENT')) {
      return { fehlt: true, parsebar: false, wert: null }
    }
    return { fehlt: false, parsebar: false, wert: null }
  }
  try {
    JSON.parse(roh) as unknown
  } catch {
    return { fehlt: false, parsebar: false, wert: null }
  }
  return { fehlt: false, parsebar: true, wert: JSON.parse(roh) as unknown }
}

/** Ein Schreib-Ergebnis: gelungen oder mit Code + Meldung. */
type SchreibErc = { ok: true } | { ok: false; code: MarkenFehlercode; meldung: string }

/**
 * Der GEMEINSAME Schreibablauf (Schritt-Schema des Issues). Wird vom Anlegen
 * (fehlende marken.json), vom 'sofort'-Schreiben, vom entprellten Timer und von
 * flushBestand benutzt - EINE Stelle, damit .bak/.tmp/Notify an keiner Seite
 * auseinanderlaufen.
 */
async function schreibeDateiNeu(inhalt: MarkenEintrag[]): Promise<SchreibErc> {
  const ziel = path.join(ermittleDatenOrt(), DATEINAME)
  const temp = `${ziel}.tmp`
  const sicherung = `${ziel}.bak`

  // SCHRITT A: die bestehende Datei nach .bak KOPIEREN (fs.copyFile, kein Verschieben) -
  // ausser, die Fassung wurde AUS dem .bak gerettet: Wurde der Bestand eben noch aus dem
  // .bak geholt, weil die HAUPTdatei defekt war, dann ueberschriebe das Kopieren die
  // einzige heile Fassung mit dem Schrott - BEVOR die neue, gute Fassung ueberhaupt
  // geschrieben ist. Deshalb wird hier EINMALIG uebersprungen und danach wieder
  // gewohnt gesichert.
  if (!ausBakGerettet) {
    const sicherungstest = await taugtAlsSicherung(ziel)
    const kopierFehler = sicherungstest
      ? await mitWiederholung(() => fs.copyFile(ziel, sicherung), WARTEZEITEN_MS)
      : null
    if (kopierFehler !== null && !istCode(kopierFehler, 'ENOENT')) {
      // ENOENT = es gibt noch keine marken.json (der erste Start) - dann ist nichts
      // zu sichern und das ist kein Fehler. Jeder andere Grund BRICHT AB (Antwort wie
      // in #46): Der haeufigste Grund ist eine volle Platte, dann waere auch das .tmp
      // unvollstaendig; ein Abbruch haelt marken.json garantiert unberuehrt, und der
      // Bestand bleibt im Speicher (NFA-02).
      return { ok: false, code: 'speicher_fehler', meldung: `Sicherung von ${DATEINAME} fehlgeschlagen: ${text(kopierFehler)}` }
    }
  } else {
    // Gerettet: dieses eine Schreiben sichert NICHT; danach gilt die Datei wieder
    // als heil (das Rename unten schreibt eine vollstaendige Fassung).
    ausBakGerettet = false
  }

  // SCHRITT B: JSON nach .tmp schreiben (ueber den eigenen Griff, um fsync VOR dem
  // Rename zu koennen - Antwort zur offenen Frage gleichlautend mit #46).
  let serialisiert: string
  try {
    serialisiert = `${JSON.stringify({ schemaVersion: MARKEN_SCHEMA_VERSION, marken: inhalt }, null, 2)}\n`
  } catch (ursache) {
    // Kreise beim Bestand (ein Aufrufer hat zirkulaere Struktur eingebaut): kein Wurf
    // ueber die Grenze; die Datei bleibt unberuehrt.
    return { ok: false, code: 'speicher_fehler', meldung: `marken.json ist nicht serialisierbar: ${text(ursache)}` }
  }
  try {
    const griff = await fs.open(temp, 'w')
    try {
      await griff.writeFile(serialisiert, 'utf8')
      // fsync VOR dem Rename. Ohne ihn wuerde nach einem Stromausfall moeglicherweise
      // eine LEERE oder halbe marken.json unter dem Zieldateinamen stehen, obwohl das
      // .bak die letzte heile Fassung traege. Sicherheitsniveau gleichlautend mit
      // #46 (schreibeProjekt) und dem Export TK 9.6.2/9.6.3.
      await griff.sync()
    } finally {
      // Schliessen MUSS gelingen, BEVOR umbenannt wird - ein eigenes offenes Handle
      // auf die Quelle ist derselbe EPERM-Fall wie ein fremdes (Antwort wie in #46).
      // Ein Fehler beim Schliessen wird verschluckt: Er darf die eigentliche Ursache
      // nicht verdecken, und die Daten sind zu diesem Zeitpunkt bereits gesynct.
      await griff.close().catch(() => undefined)
    }
  } catch (ursache) {
    // marken.json bleibt unveraendert (das Rename fand nie statt). Die .tmp bleibt
    // liegen (VOLLSTAENDIG und gesynct) und wird beim naechsten Versuch mit 'w'
    // ueberschrieben - aufraeumen wuerde nichts retten und nur aufgeraumt aussehen.
    return { ok: false, code: 'speicher_fehler', meldung: `${DATEINAME} konnte nicht geschrieben werden: ${text(ursache)}` }
  }

  // SCHRITT C: der unteilbare Moment. Die vorhandene Zieldatei wird NICHT vorher
  // geloescht - das oeffnete ein Fenster, in dem GAR KEINE marken.json existiert.
  const umbenennFehler = await mitWiederholung(() => fs.rename(temp, ziel), WARTEZEITEN_MS)
  if (umbenennFehler !== null) {
    return { ok: false, code: 'speicher_fehler', meldung: `${DATEINAME} konnte nicht ersetzt werden: ${text(umbenennFehler)}` }
  }

  meldeSchreibversuch({ erfolgreich: true })
  return { ok: true }
}


/**
 * Tiefe Kopie - der verbindliche Weg, wie der Bestand diese Datei verlaesst und wie
 * `aenderung` ihn bekommt. `structuredClone` (Node 17+ verfuegbar, hier Node >= 20)
 * kopiert die besten Felder, die der Bestand traegt: Strings, Zahlen, Records,
 * Arrays, null. Erhalten bleibt die Form; gegeben bleibt die Unabhaengigkeit.
 */
function tief(bestandOriginal: MarkenEintrag[]): MarkenEintrag[] {
  return structuredClone(bestandOriginal)
}

/** Die Fehlerseite der Huelle (kurzform). */
function fehlerHuelle(
  code: MarkenFehlercode,
  meldung: string,
): { ok: false; fehler: { code: MarkenFehlercode; meldung: string } } {
  return { ok: false, fehler: { code, meldung } }
}
