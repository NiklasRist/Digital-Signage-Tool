// GENERIERT aus dem Signaturblock von Issue #98.
// [vorlagen-store] vorlagen.json atomar und serialisiert lesen und schreiben
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
// GERUEST-PRUEFSUMME: 609201be2e0330af
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
// alle Importe werden jetzt benutzt. Der Absatz darueber bleibt als Beleg stehen.

import fs from 'node:fs/promises'
import path from 'node:path'

import type { Ergebnis, GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { VorlagenFehlercode } from './fehlercodes'
import { eingebauteVorlagen, EINGEBAUTE_VORLAGEN_IDS } from './eingebaute-vorlagen'
import { ermittleDatenOrt } from '../datenort'

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #5:     ermittleDatenOrt(): string
//           // absoluter Pfad zum Ordner, der projects/, config.json, vorlagen.json,
//           // protokoll.json, warteschlangen-journal.json enthaelt bzw. enthalten wird
//   #96:  eingebauteVorlagen(): Vorlage[]      // frische TIEFE Kopie der drei Mitgelieferten
//   #96:  const EINGEBAUTE_VORLAGEN_IDS = ['vollbild', 'split', 'band-standard'] as const
//   #97:  type VorlagenFehlercode = 'vorlage_referenziert' | 'parent_eingebaut' | 'speicher_fehler'
//   #12/#22: type Ergebnis<T, F extends string = GenerischerFehlercode> =
//              | { ok: true; wert: T }
//              | { ok: false; fehler: { code: F | GenerischerFehlercode
//                                       meldung: string; daten?: unknown } }
//   #22:    type GenerischerFehlercode =
//              'ungueltige_eingabe' | 'nicht_gefunden' | 'unbekannter_fehler'

/**
 * Schema-Version von vorlagen.json. Modul-lokal und hier deklariert.
 * NICHT die AKTUELLE_SCHEMA_VERSION aus #21 verwenden – die gehoert zu project.json/config.json;
 * eine Kopplung an D1-Migrationen ist unerwuenscht. Auch NICHT die QUEUE_SCHEMA_VERSION aus #69.
 */
export const VORLAGEN_SCHEMA_VERSION = 1

/** Dateiform von vorlagen.json. `vorlagen` enthaelt nutzbare Vorlagen UND Arbeitskopien. */
export interface VorlagenDatei {
  schemaVersion: number
  vorlagen: Vorlage[]
}

/** Dateiname unterhalb des Datenorts. An EINER Stelle, damit .tmp/.bak nicht auseinanderlaufen. */
const DATEI = 'vorlagen.json'

/**
 * Die Entprellung. TK 9.5.4 gibt eine SPANNE vor ("entprellt 3-5 s"), das Issue entscheidet daraus
 * verbindlich 4000 ms ("die Mitte des vorgegebenen Bereichs").
 *
 * BEWUSST NICHT aus dem `project-store` (#47) importiert, obwohl dort dieselbe Zahl steht: "Die
 * beiden Entprellungen bewachen verschiedene Dateien und duerfen unabhaengig voneinander geaendert
 * werden." (Issue, woertlich)
 */
const ENTPRELLUNG_MS = 4000

/**
 * Abstand zwischen zwei automatischen Wiederholversuchen nach einem `speicher_fehler`.
 *
 * WARUM ES DIE WIEDERHOLUNG HIER GIBT: Die Invariante aus TK 9.12.1 verlangt fuer den
 * `vorlagen-store` ein Verhalten "gleichartig zu `project:autoSpeichernStatus` (9.5.4): dauerhafter
 * Hinweis 'nicht gespeichert' in der Oberflaeche, AUTOMATISCHER WIEDERHOLVERSUCH, die Aenderungen
 * bleiben im Speicher (kein Rollback), und der Hinweis verschwindet erst nach erfolgreichem
 * Schreiben". Ohne Wiederholung koennte der Hinweis nie von selbst verschwinden - der Nutzer haette
 * den vollen Datentraeger geraeumt und muesste raten, wie er ein neues Speichern ausloest.
 *
 * FESTER Abstand, KEIN Backoff, KEINE Obergrenze - dieselbe Abwaegung und derselbe Wert wie in #47
 * (dort ausfuehrlich begruendet): Die voruebergehenden Fehler faengt eine Ebene tiefer schon
 * `mitWiederholung` ab (EPERM/EBUSY, 100/200/400/800 ms); was hier oben ankommt, ist die dauerhafte
 * Ursache, und die verschwindet nicht schneller, wenn man laenger wartet.
 *
 * NICHT VOM VERTRAG GEDECKT ist der Zahlenwert: TK 9.5.4/9.12.1 nennen weder Intervall noch
 * Obergrenze. Er ist von #47 uebernommen, damit die beiden Speicher sich nicht verschieden
 * verhalten - er gehoert bestaetigt, nicht geerbt. S. Bericht/STOPP.
 */
const WIEDERHOLUNG_MS = 5000

/**
 * Wartezeiten in Millisekunden VOR dem 2., 3., 4. und 5. Versuch; der erste laeuft sofort.
 * Insgesamt also fuenf Versuche.
 *
 * WARUM WIEDERHOLT WIRD (gemessen, Issue #31): Ein Rename-mit-Ersetzen gelingt auf Windows - es
 * scheitert aber mit EPERM, sobald irgendjemand das ZIEL offen haelt, und ein reines LESE-Handle
 * genuegt dafuer. Das trifft Virenscanner, Sicherungswerkzeuge und Editoren. Ein solcher Fehler ist
 * voruebergehend: Wer sofort aufgibt, meldet "nicht gespeichert", obwohl 100 ms spaeter alles
 * funktioniert haette.
 *
 * Dieselben Zahlen wie in #31 (config-store), #46 (project-store), #69 (Queue-Dateien) und #187
 * (export-service). Der STOPP-Block dieses Issues verlangt genau das ("Falls dort bereits eine
 * Loesung feststeht: exakt dieselbe verwenden"). BEWUSST NICHT von dort importiert: Das waere eine
 * Modulgrenze fuer eine Zahl, und die Faelle duerfen sich unabhaengig aendern.
 */
const WARTEZEITEN_MS = [100, 200, 400, 800] as const

/**
 * Der zwischengespeicherte Bestand - `null`, solange nie geladen wurde.
 *
 * Er verlaesst diese Datei NIE als Referenz, sondern immer nur als tiefe Kopie (s. `tiefeKopie`).
 * Andernfalls koennte ein Aufrufer ihn hinter dem Ruecken dieser Datei aendern; die Aenderung waere
 * wirksam, ohne je geschrieben zu werden, und ein spaeterer Absturz liesse sie verschwinden.
 */
let bestand: Vorlage[] | null = null

/**
 * Weicht der Stand im Speicher vom Stand auf der Platte ab?
 *
 * Das ist die eine Frage, die `flushBestand` beantworten muss ("Steht nichts aus, ist das ein
 * erfolgreicher Leerlauf"). Gesetzt wird die Marke bei JEDER uebernommenen Aenderung - auch bei
 * `'sofort'`, denn scheitert dort das Schreiben, bleibt der Stand im Speicher gueltig (TK 9.5.4:
 * kein Rollback) und muss weiter auf die Platte.
 */
let ausstehend = false

/** Der EINE ausstehende Schreib-Termin - Entprellung und Wiederholung teilen ihn sich. */
let timer: ReturnType<typeof setTimeout> | null = null

/**
 * Steht der Hinweis "nicht gespeichert" gerade? Nur dann meldet ein Erfolg `{ typ: 'gespeichert' }`.
 *
 * So verlangt es das Issue: "Ein Dauerfeuer aus 'gespeichert'-Meldungen bei jedem Tastendruck ist
 * nicht gewollt; der Hinweis soll verschwinden, nicht blinken."
 */
let fehlerAktiv = false

/**
 * Wurde der Bestand aus `vorlagen.json.bak` gerettet und liegt die defekte `vorlagen.json` noch
 * unveraendert daneben?
 *
 * Solange das gilt, ueberspringt der naechste Schreibvorgang das Kopieren nach `.bak`. Der Grund
 * steht im Issue: "Ein blindes Kopieren vorlagen.json -> vorlagen.json.bak wuerde die letzte heile
 * Version mit dem Schrott ueberschreiben - und scheitert danach das Schreiben der neuen Fassung
 * (Platte voll, Rechte, Absturz), ist die gesamte Vorlagen-Bibliothek des Nutzers weg."
 */
let ausBakGerettet = false

/**
 * Die Hoerer, jeder in einer eigenen Huelle.
 *
 * WARUM DIE HUELLE UND KEIN `Set<Hoerer>`: Ein Set haelt jede Funktion nur EINMAL. Meldet sich
 * dieselbe Funktion zweimal an, traegt das Set einen Eintrag - und die erste Abmeldung naehme dem
 * zweiten Anmelder lautlos seine Meldungen weg. Das Issue verlangt ausdruecklich das Gegenteil:
 * "Ein zweimal angemeldeter Hoerer wird zweimal gerufen ... Die Abmelde-Funktion entfernt GENAU
 * EINE Anmeldung." Gleiche Bauart wie in #47.
 */
const hoerende = new Set<{ hoerer: (ereignis: VorlagenSpeichernEreignis) => void }>()

/**
 * Die Serialisierungskette dieses Moduls. EIN Wert im Modulbereich genuegt, weil es genau EINE
 * vorlagen.json gibt (anders als in #69, wo je Pfad eine eigene Kette noetig ist).
 *
 * WAS SIE NICHT IST (TK 9.3.5/9.5.4, im Issue woertlich zitiert): keine systemweite Sperre, kein
 * Mutex-Objekt fuer fremde Module, keine OS-Dateisperre und kein zweites Lock neben `mitD1Lock`
 * (#32) - das schuetzt ausdruecklich NUR project.json. Sie ist eine Reihenfolge-Garantie INNERHALB
 * dieser Datei und wird deshalb nicht exportiert.
 */
let kette: Promise<void> = Promise.resolve()

/**
 * Das Promise eines LAUFENDEN Erstladevorgangs, damit er hoechstens einmal stattfindet.
 *
 * EHRLICHE EINORDNUNG: Solange jeder Zugriff durch `inReihe` laeuft, kann dieser Fall gar nicht
 * eintreten - die Kette laesst den zweiten Aufrufer erst los, wenn der erste den Bestand
 * zwischengespeichert hat. Das Issue verlangt die geteilte Zusage trotzdem ausdruecklich
 * ("geteiltes in-flight-Promise"), und sie haelt UNABHAENGIG von der Kette: Kaeme je ein Pfad
 * hinzu, der ausserhalb laedt, legten sonst zwei gleichzeitige Leser beim allerersten Start den
 * Anfangsbestand doppelt an und schrieben ihn doppelt.
 */
let laufendesLaden: Promise<Ergebnis<Vorlage[], VorlagenFehlercode>> | null = null

/**
 * Haengt `arbeit` hinten an die Kette an und liefert deren Ergebnis.
 *
 * Die Kette selbst darf NIE in den Fehlerzustand geraten - sonst risse ein einziger Fehlschlag
 * jeden spaeteren Zugriff mit, und die App koennte bis zum Neustart keine Vorlage mehr speichern.
 * Deshalb wird der neutralisierte Ausgang gespeichert, nicht der echte.
 */
function inReihe<T>(arbeit: () => Promise<T>): Promise<T> {
  const laufend = kette.then(arbeit)
  kette = laufend.then(
    () => undefined,
    () => undefined,
  )
  return laufend
}

/**
 * Liefert den vollstaendigen Bestand (nutzbare Vorlagen UND Arbeitskopien) als TIEFE Kopie.
 * Beim ersten Aufruf wird die Datei geladen bzw. angelegt; danach kommt der Bestand aus dem
 * Speicher. Reine Leser (#99, #107) benutzen diese Funktion.
 *
 * Laeuft auf DERSELBEN Serialisierungskette wie `aendereBestand` und niemals daran vorbei.
 */
export async function ladeBestand(): Promise<Ergebnis<Vorlage[], VorlagenFehlercode>> {
  try {
    return await inReihe(async (): Promise<Ergebnis<Vorlage[], VorlagenFehlercode>> => {
      const bereit = await stelleBestandBereit()
      if (!bereit.ok) {
        return bereit
      }
      // Die Kopie entsteht INNERHALB der Kette. Ausserhalb koennte sich zwischen dem Ende der
      // Kette und dem Kopieren eine Aenderung schieben, und der Leser saehe einen Stand, den es
      // so nie gab.
      return { ok: true, wert: tiefeKopie(bereit.wert) }
    })
  } catch (ursache) {
    // Der Auffangbogen fuer "unerwartete Ausnahme irgendwo im Ablauf" (Fehlerpfad-Tabelle). Diese
    // Funktion wirft NIE - jeder Ausgang ist eine Huelle (TK 9.1.1).
    return fehler('unbekannter_fehler', `Laden von ${DATEI} unerwartet abgebrochen: ${text(ursache)}`)
  }
}

/**
 * Die EINZIGE Art, den Bestand zu aendern. Laedt (falls noetig), ruft `aenderung` mit einer tiefen
 * Kopie des Bestands auf, uebernimmt das Ergebnis in den Speicher und schreibt.
 *
 * `aenderung` ist SYNCHRON – sie darf nicht `await`en. Genau das macht Lesen-Aendern-Schreiben zu
 * einer ununterbrechbaren Einheit: Ohne `await` kann zwischen Lesen und Schreiben kein zweiter
 * Aufruf dazwischenkommen. Eine asynchrone Aenderungsfunktion wuerde diese Zusage aufheben.
 *
 * Liefert `aenderung` ein `ok: false`, wird NICHTS geschrieben und der Fehler unveraendert
 * durchgereicht.
 *
 * Aufrufe laufen streng nacheinander (verkettete Promise), auch die aus verschiedenen Operationen.
 */
export async function aendereBestand<T>(
  aenderung: (bestand: Vorlage[]) => Ergebnis<{ bestand: Vorlage[]; wert: T }, VorlagenFehlercode>,
  schreibart: 'sofort' | 'entprellt',
): Promise<Ergebnis<T, VorlagenFehlercode>> {
  // Schutz gegen den einen Fall, den der Typ nicht abfaengt: einen Aufrufer, der zur Laufzeit
  // etwas anderes durchreicht. Beide Pruefungen laufen VOR der Kette - ein unbrauchbarer Aufruf
  // soll sie gar nicht erst belegen.
  if (typeof aenderung !== 'function') {
    return fehler('ungueltige_eingabe', 'aendereBestand wurde ohne Aenderungsfunktion aufgerufen.')
  }
  if (schreibart !== 'sofort' && schreibart !== 'entprellt') {
    return fehler('ungueltige_eingabe', `aendereBestand kennt die Schreibart ${String(schreibart)} nicht.`)
  }

  try {
    return await inReihe(async (): Promise<Ergebnis<T, VorlagenFehlercode>> => {
      const bereit = await stelleBestandBereit()
      if (!bereit.ok) {
        return bereit
      }

      // AB HIER BIS ZUM SCHREIBEN STEHT KEIN `await` - genau das macht Lesen-Aendern-Schreiben
      // unteilbar. Deshalb ist `aenderung` synchron; eine asynchrone Aenderungsfunktion wuerde
      // die Zusage aufheben.
      let geaendert: Ergebnis<{ bestand: Vorlage[]; wert: T }, VorlagenFehlercode>
      try {
        // Die tiefe Kopie ist Vertrag: "darf den uebergebenen Bestand veraendern, weil er bereits
        // eine tiefe Kopie ist". Ohne sie waere eine abgelehnte Aenderung nicht folgenlos - der
        // Rueckruf haette den zwischengespeicherten Bestand bereits zerpfluegt.
        geaendert = aenderung(tiefeKopie(bereit.wert))
      } catch (ursache) {
        // "kein Stacktrace nach aussen" (Fehlerpfad-Tabelle): Der Text landet in `meldung`, der
        // Code kommt aus der geschlossenen Union. Geschrieben wird NICHTS.
        return fehler('unbekannter_fehler', `Aenderungsfunktion hat geworfen: ${text(ursache)}`)
      }
      if (!geaendert.ok) {
        // "der Fehler unveraendert durchgereicht" - der Aufrufer soll seinen eigenen Grund
        // zurueckbekommen, nicht einen von hier. Der Bestand im Speicher bleibt unberuehrt.
        return geaendert
      }
      if (!Array.isArray(geaendert.wert.bestand)) {
        return fehler('ungueltige_eingabe', 'Die Aenderungsfunktion hat keinen Bestand geliefert.')
      }

      // UEBERNAHME IN DEN SPEICHER - bei BEIDEN Schreibarten dieselbe Stelle. "Ihr Erfolg bedeutet
      // 'gueltig uebernommen', nicht 'schon auf Platte'." (TK 9.5.4)
      bestand = geaendert.wert.bestand
      ausstehend = true

      if (schreibart === 'entprellt') {
        planeTermin(ENTPRELLUNG_MS)
        return { ok: true, wert: geaendert.wert.wert }
      }

      // 'sofort': Der Termin wird abgebrochen, weil gleich der GANZE Bestand geschrieben wird -
      // "ein 'sofort'-Schreibvorgang persistiert auch alles, was eine noch ausstehende entprellte
      // Aenderung geschrieben haette".
      brichTerminAb()
      const geschrieben = await schreibeStand()
      if (!geschrieben.ok) {
        // KEIN ROLLBACK, auch hier nicht: Der uebernommene Bestand bleibt im Speicher gueltig
        // (TK 9.5.4), er steht nur noch nicht auf der Platte. `ausstehend` bleibt gesetzt, die
        // Wiederholung und `flushBestand` finden ihn.
        return geschrieben
      }
      return { ok: true, wert: geaendert.wert.wert }
    })
  } catch (ursache) {
    return fehler('unbekannter_fehler', `Aendern von ${DATEI} unerwartet abgebrochen: ${text(ursache)}`)
  }
}
// 'sofort'    -> die Datei ist geschrieben, BEVOR das Promise erfuellt wird
// 'entprellt' -> der Bestand ist im Speicher uebernommen und das Promise wird erfuellt; die Datei
//                wird 4000 ms nach der LETZTEN entprellten Aenderung geschrieben

/**
 * Schreibt einen noch ausstehenden entprellten Stand sofort und bricht den Timer ab.
 * Steht nichts aus, ist das ein erfolgreicher Leerlauf ({ ok: true }), kein Fehler.
 * Aufrufer: das Beenden der App (#3) – „Beim Beenden blockiert die App, bis der Schreibvorgang
 * abgeschlossen ist" (TK 9.5.4).
 */
export async function flushBestand(): Promise<Ergebnis<void, VorlagenFehlercode>> {
  // Der Termin wird SYNCHRON abgebrochen, bevor die Kette betreten wird. Stuende der Abbruch nur
  // drinnen, koennte er waehrend der Wartezeit auf einen fremden Kettenzugriff ablaufen und ein
  // zweites Glied anhaengen, das unmittelbar nach diesem hier dasselbe noch einmal schriebe.
  brichTerminAb()
  try {
    return await inReihe(async (): Promise<Ergebnis<void, VorlagenFehlercode>> => {
      brichTerminAb()
      if (bestand === null || !ausstehend) {
        // "Steht nichts aus, ist das ein erfolgreicher Leerlauf ({ ok: true }), kein Fehler" -
        // und KEINE Datei wird angefasst (Fehlerpfad-Tabelle).
        return { ok: true, wert: undefined }
      }
      return schreibeStand()
    })
  } catch (ursache) {
    return fehler('unbekannter_fehler', `Flush von ${DATEI} unerwartet abgebrochen: ${text(ursache)}`)
  }
}

/**
 * Ereignisform des Speicherstatus dieses Stores. Gleichartig zu `AutoSpeichernEreignis` des
 * project-store (#47) – TK 9.12.1: „Nutzlast und Verhalten **gleichartig** zu
 * `project:autoSpeichernStatus` (9.5.4)". KEINE Ergebnis-Huelle: Ereignisse tragen keine
 * (TK 9.1.1 Punkte 2 und 5).
 */
export type VorlagenSpeichernEreignis =
  | { typ: 'gespeichert' }
  | { typ: 'fehler'; code: VorlagenFehlercode | GenerischerFehlercode }

/**
 * Registriert einen Hoerer fuer Statuswechsel des Vorlagen-Speichers; Rueckgabewert ist die
 * ABMELDE-Funktion. Baugleich zu `aufAutoSpeichernEreignis` (#47) – ein anderer Name, weil ein
 * zweiter gleichnamiger Export im selben Projekt bei einem falschen Import lautlos den falschen
 * Speicher beobachten wuerde.
 *
 * Diese Datei kennt WEDER den Kanalnamen `vorlagen:autoSpeichernStatus` NOCH ein `BrowserWindow`:
 * Sie meldet main-intern. Den Weg auf den IPC-Kanal baut die Verdrahtung im `ipc-gateway` (M7).
 */
export function aufVorlagenSpeichernEreignis(
  hoerer: (ereignis: VorlagenSpeichernEreignis) => void,
): () => void {
  const eintrag = { hoerer }
  hoerende.add(eintrag)
  // Mehrfaches Abmelden ist harmlos: `delete` auf einen bereits entfernten Eintrag tut nichts.
  return () => {
    hoerende.delete(eintrag)
  }
}

// ---------------------------------------------------------------------------------------------
// Laden
// ---------------------------------------------------------------------------------------------

/**
 * Sorgt dafuer, dass der Bestand im Speicher liegt, und liefert ihn als LEBENDES Array.
 *
 * Nur fuer den Gebrauch INNERHALB der Kette - die Aufrufer kopieren, bevor etwas nach draussen
 * geht.
 */
async function stelleBestandBereit(): Promise<Ergebnis<Vorlage[], VorlagenFehlercode>> {
  const vorhanden = bestand
  if (vorhanden !== null) {
    return { ok: true, wert: vorhanden }
  }
  const laufend = laufendesLaden ?? ladeVonPlatte()
  laufendesLaden = laufend
  try {
    return await laufend
  } finally {
    // Nur den EIGENEN Lauf abraeumen. Haengt inzwischen ein anderer dort, gehoert der Platz ihm.
    if (laufendesLaden === laufend) {
      laufendesLaden = null
    }
  }
}

/**
 * Der Erstladevorgang - Schritt fuer Schritt nach dem verbindlichen Ablauf des Issues.
 *
 * Setzt `bestand` NUR bei Erfolg. Scheitert das Anlegen bzw. Ergaenzen beim Schreiben, wird der
 * Bestand ausdruecklich NICHT zwischengespeichert: "der naechste Aufruf versucht es erneut".
 */
async function ladeVonPlatte(): Promise<Ergebnis<Vorlage[], VorlagenFehlercode>> {
  const ziel = path.join(ermittleDatenOrt(), DATEI)

  const anfang = await ermittleAnfangsbestand(ziel)
  if (!anfang.ok) {
    return anfang
  }
  const vorlagen = anfang.wert.vorlagen

  // SCHRITT 6: fehlende eingebaute Vorlagen ergaenzen - und NUR fehlende.
  //
  // "Ein vorhandener Eintrag mit dieser ID wird NIE ersetzt, ergaenzt oder verglichen." Das ist
  // keine Kleinigkeit: Ein "Reparieren beim Start" waere exakt die von TK 9.11.1.1 verbotene
  // In-place-Aenderung an einer eingebauten Vorlage und liesse Aktionen in bestehenden Projekten
  // nach einem App-Update anders aussehen.
  const vorhandeneIds = new Set<string>()
  for (const eintrag of vorlagen) {
    const id = idVon(eintrag)
    if (id !== null) {
      vorhandeneIds.add(id)
    }
  }
  // Die Reihenfolge von EINGEBAUTE_VORLAGEN_IDS bestimmt die Reihenfolge des Anhaengens; angehaengt
  // wird HINTEN, damit die Reihenfolge der vorhandenen Eintraege unberuehrt bleibt.
  const fehlendeIds = EINGEBAUTE_VORLAGEN_IDS.filter((id) => !vorhandeneIds.has(id))
  if (fehlendeIds.length > 0) {
    const mitgelieferte = eingebauteVorlagen()
    for (const id of fehlendeIds) {
      const vorlage = mitgelieferte.find((eintrag) => eintrag.id === id)
      if (vorlage !== undefined) {
        vorlagen.push(vorlage)
      }
    }
  }

  if (anfang.wert.neuAngelegt || fehlendeIds.length > 0) {
    const geschrieben = await schreibeUndMelde(vorlagen)
    if (!geschrieben.ok) {
      return geschrieben
    }
  }

  // ERST JETZT zwischenspeichern - s. Rumpfkommentar oben.
  bestand = vorlagen
  // NICHTS STEHT AUS, auch nach einer .bak-Rettung nicht: Der Bestand im Speicher weicht dann zwar
  // von der (defekten) Datei ab, aber "die defekte vorlagen.json bleibt unveraendert liegen und wird
  // erst beim NAECHSTEN REGULAEREN SCHREIBEN ersetzt" (Issue). Ein hier gesetztes `ausstehend`
  // machte aus dem Laden ein Schreiben und damit aus jedem Programmstart eine Aenderung an der
  // Platte - genau das, was die Rettung ausdruecklich nicht tun soll.
  ausstehend = false
  return { ok: true, wert: vorlagen }
}

/**
 * Die Schritte 1 bis 5 des Ladens: Datei lesen, fehlende Datei vom Defekt trennen, notfalls aus
 * dem `.bak` retten.
 *
 * `neuAngelegt` sagt, ob der Anfangsbestand frisch entstanden ist und deshalb geschrieben werden
 * muss. Eine reine `.bak`-Rettung setzt es NICHT: "die defekte vorlagen.json bleibt unveraendert
 * liegen und wird erst beim naechsten regulaeren Schreiben ersetzt".
 */
async function ermittleAnfangsbestand(
  ziel: string,
): Promise<Ergebnis<{ vorlagen: Vorlage[]; neuAngelegt: boolean }, VorlagenFehlercode>> {
  const haupt = await leseDatei(ziel)

  // SCHRITT 2: Die fehlende Datei ist der Normalfall der Erstbenutzung und KEIN Defekt.
  if (haupt.zustand === 'fehlt') {
    return { ok: true, wert: { vorlagen: eingebauteVorlagen(), neuAngelegt: true } }
  }

  const bewertung: Auswertung =
    haupt.zustand === 'gelesen' ? werteAus(haupt.wert) : { art: 'unbrauchbar', grund: haupt.grund }

  // SCHRITT 5: Eine unbekannte schemaVersion wird NICHT geraten - kein Laden, keine Migration,
  // und ausdruecklich auch kein Ausweichen auf das `.bak` (Fehlerpfad-Tabelle).
  if (bewertung.art === 'version') {
    return fehler(
      'speicher_fehler',
      `${ziel} traegt schemaVersion ${String(bewertung.gelesen)}, erwartet wird ` +
        `${VORLAGEN_SCHEMA_VERSION}. Es gibt keine Migration; die Datei wurde NICHT geladen.`,
    )
  }
  if (bewertung.art === 'bestand') {
    return { ok: true, wert: { vorlagen: bewertung.vorlagen, neuAngelegt: false } }
  }

  // SCHRITT 3: Erst die Sicherung versuchen. Ein Backup, aus dem nie wiederhergestellt wird, waere
  // reine Schreiblast (TK 9.5.4).
  const sicherung = await leseDatei(`${ziel}.bak`)
  const bewertungSicherung: Auswertung =
    sicherung.zustand === 'gelesen'
      ? werteAus(sicherung.wert)
      : {
          art: 'unbrauchbar',
          grund: sicherung.zustand === 'fehlt' ? 'keine Sicherung vorhanden' : sicherung.grund,
        }

  if (bewertungSicherung.art === 'bestand') {
    // Die defekte Datei wird NICHT geloescht und NICHT durch das Backup ersetzt: "Die
    // Wiederherstellung aus .bak repariert nichts von selbst."
    ausBakGerettet = true
    return { ok: true, wert: { vorlagen: bewertungSicherung.vorlagen, neuAngelegt: false } }
  }

  // SCHRITT 4: Beides unbrauchbar. HIER WIRD NICHT AUF DEN ANFANGSBESTAND ZURUECKGEFALLEN, und das
  // ist der Kern des Issues: Der Rueckfall saehe aus wie eine frische Bibliothek und vernichtete
  // ALLE eigenen Vorlagen des Nutzers - beim naechsten Schreiben unwiderruflich.
  const grundSicherung =
    bewertungSicherung.art === 'unbrauchbar' ? bewertungSicherung.grund : 'unbekannte schemaVersion'
  return fehler(
    'speicher_fehler',
    `${ziel} ist nicht verwendbar (${bewertung.grund}) und ${DATEI}.bak ebenfalls nicht ` +
      `(${grundSicherung}). Es wurde NICHTS geladen und NICHTS ueberschrieben.`,
  )
}

type Auswertung =
  | { art: 'bestand'; vorlagen: Vorlage[] }
  | { art: 'unbrauchbar'; grund: string }
  | { art: 'version'; gelesen: unknown }

/**
 * Beurteilt den geparsten Inhalt - NUR die Huelle, nie den Inhalt der Vorlagen.
 *
 * "Keine Kenntnis ueber den Inhalt aufbauen" (STOPP-Block): Ob eine Vorlage gueltig ist, ob Zonen
 * innerhalb der Flaeche liegen oder ob `hoehe` zur `art` passt, entscheiden #100 bis #108. Eine
 * zweite, abweichende Pruefung hier waere eine zweite Quelle der Wahrheit.
 *
 * ZUR REIHENFOLGE DER PRUEFUNGEN: Eine NUMERISCHE, abweichende Version schlaegt zuerst zu - sonst
 * fiele eine kuenftige Fassung, die das Feld `vorlagen` umbenennt, still auf ein altes `.bak`
 * zurueck und der Nutzer verloere seine neueren Vorlagen. Fehlt das Feld dagegen ganz oder ist es
 * kein Array, gilt die Datei als beschaedigt ("wie nicht parsebar behandelt", Fehlerpfad-Tabelle)
 * und das `.bak` ist die richtige Antwort.
 */
function werteAus(roh: unknown): Auswertung {
  if (typeof roh !== 'object' || roh === null || Array.isArray(roh)) {
    return { art: 'unbrauchbar', grund: 'Inhalt ist kein JSON-Objekt' }
  }
  const datei = roh as { schemaVersion?: unknown; vorlagen?: unknown }
  const version = datei.schemaVersion
  if (typeof version === 'number' && version !== VORLAGEN_SCHEMA_VERSION) {
    return { art: 'version', gelesen: version }
  }
  if (!Array.isArray(datei.vorlagen)) {
    return { art: 'unbrauchbar', grund: 'Feld "vorlagen" fehlt oder ist kein Array' }
  }
  if (version !== VORLAGEN_SCHEMA_VERSION) {
    return { art: 'version', gelesen: version }
  }
  // Der einzige Zwang in dieser Datei: JSON.parse liefert `any`, der Vertrag verspricht Vorlage[].
  // Wer den Inhalt behauptet, prueft ihn bei sich (#100 bis #108).
  return { art: 'bestand', vorlagen: datei.vorlagen as Vorlage[] }
}

type Leseergebnis =
  | { zustand: 'gelesen'; wert: unknown }
  | { zustand: 'fehlt' }
  | { zustand: 'beschaedigt'; grund: string }

/**
 * Liest EINE Datei und trennt die drei Zustaende.
 *
 * ENOENT wird von "beschaedigt" getrennt, weil daran der ganze Ablauf haengt: Eine fehlende Datei
 * ist die Erstbenutzung, eine unlesbare ist ein Verlust. Wer beides gleich behandelt, macht aus
 * einem defekten Dateisystem stillschweigend einen Neuanfang.
 *
 * Jeder ANDERE E/A-Fehler (EACCES, EBUSY, EIO) zaehlt als beschaedigt: Die Datei ist da, nur gerade
 * nicht lesbar - das fuehrt zum Versuch auf dem `.bak` und, wenn auch der scheitert, zu
 * `speicher_fehler`. Ein Rueckfall auf den Anfangsbestand entsteht daraus nie.
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

/** Liest die `id` eines Eintrags, ohne an einem kaputten Element zu zerbrechen. */
function idVon(eintrag: unknown): string | null {
  if (typeof eintrag !== 'object' || eintrag === null) {
    return null
  }
  const id = (eintrag as { id?: unknown }).id
  return typeof id === 'string' ? id : null
}

// ---------------------------------------------------------------------------------------------
// Schreiben
// ---------------------------------------------------------------------------------------------

/**
 * Schreibt den zwischengespeicherten Bestand und pflegt Marke, Meldung und Wiederholung.
 *
 * Nur fuer den Gebrauch INNERHALB der Kette. Weil jede Aenderung ebenfalls in der Kette
 * stattfindet, kann waehrend des Schreibens keine dazukommen - deshalb genuegt hier die einfache
 * Marke `ausstehend`, wo #47 einen Stand-Zaehler braucht (dort aendert der Renderer das lebende
 * Projekt an der Entprellung vorbei).
 */
async function schreibeStand(): Promise<Ergebnis<void, VorlagenFehlercode>> {
  const stand = bestand
  if (stand === null) {
    return { ok: true, wert: undefined }
  }

  const ergebnis = await schreibeUndMelde(stand)
  if (ergebnis.ok) {
    ausstehend = false
    return ergebnis
  }

  // KEIN ROLLBACK: "die Aenderungen bleiben im Speicher (kein Rollback, kein Arbeitsverlust)"
  // (TK 9.5.4). `ausstehend` bleibt gesetzt, damit die Wiederholung und `flushBestand` den Stand
  // finden.
  //
  // WIEDERHOLT WIRD NUR BEI `speicher_fehler` - der Code, den TK 9.5.4 meint (Platte voll, Rechte,
  // Datei gesperrt): eine Ursache, die der Nutzer behebt, waehrend die App laeuft. Ein
  // `ungueltige_eingabe` (nicht serialisierbarer Bestand) faellt beim naechsten Versuch mit
  // DEMSELBEN Eingang identisch aus - eine endlose Schleife, die alle 5 s dasselbe Ereignis feuert
  // und den Nutzer mit einem Hinweis beschaeftigt, den kein Warten aufloest. Gemeldet wird auch
  // dieser Fall (verschluckt wird nichts).
  if (ergebnis.fehler.code === 'speicher_fehler' && timer === null) {
    planeTermin(WIEDERHOLUNG_MS)
  }
  return ergebnis
}

/**
 * Die EINE Stelle, an der der Speicherstatus gemeldet wird - fuer JEDEN Schreibvorgang, auch fuer
 * den beim Anlegen der Datei.
 *
 * Der Erfolg meldet NUR, wenn zuvor ein Fehler-Zustand aktiv war (Regel 1 des Issues); der
 * Fehlschlag meldet immer und mit genau dem Code, den der Vorgang auch als `Ergebnis` liefert
 * (Regel 2).
 */
async function schreibeUndMelde(vorlagen: Vorlage[]): Promise<Ergebnis<void, VorlagenFehlercode>> {
  const ergebnis = await schreibeJetzt(vorlagen)
  if (ergebnis.ok) {
    if (fehlerAktiv) {
      fehlerAktiv = false
      melde({ typ: 'gespeichert' })
    }
    return ergebnis
  }
  fehlerAktiv = true
  melde({ typ: 'fehler', code: ergebnis.fehler.code })
  return ergebnis
}

/**
 * DIE EIGENTLICHE ARBEIT - laeuft fuer vorlagen.json immer allein (s. `inReihe`).
 *
 * Reihenfolge: Sicherung -> vollstaendig schreiben und auf die Platte zwingen -> ersetzen. Erst
 * nach dem Rename zeigt der Name `vorlagen.json` auf den neuen Inhalt; bricht vorher irgendetwas
 * ab, ist die alte Datei unangetastet. Dieselbe Reihenfolge wie in #31, #46 und #69 - der
 * STOPP-Block verlangt ausdruecklich dieselbe Loesung wie dort und nicht eine vierte eigene.
 */
async function schreibeJetzt(vorlagen: Vorlage[]): Promise<Ergebnis<void, VorlagenFehlercode>> {
  const datenOrt = ermittleDatenOrt()
  const ziel = path.join(datenOrt, DATEI)
  const temp = `${ziel}.tmp`
  const sicherung = `${ziel}.bak`

  // Serialisieren VOR jedem Dateizugriff: Ein nicht serialisierbarer Bestand darf weder `.bak` noch
  // `.tmp` noch die Zieldatei beruehren.
  let roh: string | undefined
  try {
    roh = JSON.stringify({ schemaVersion: VORLAGEN_SCHEMA_VERSION, vorlagen }, null, 2)
  } catch (ursache) {
    // Der Bestand kommt aus einer fremden Aenderungsfunktion; ein Zirkelbezug oder ein BigInt ist
    // ein realer Fall. Der Wurf darf NICHT nach draussen (TK 9.1.1).
    return fehler('ungueltige_eingabe', `${DATEI} ist nicht serialisierbar: ${text(ursache)}`)
  }
  if (roh === undefined) {
    return fehler('ungueltige_eingabe', `${DATEI} ist nicht serialisierbar (undefined, Funktion oder Symbol).`)
  }
  // Eingerueckt und mit abschliessendem Zeilenumbruch wie in #31/#46/#69: Die Datei ist im
  // Fehlerfall Diagnosematerial und soll von Hand lesbar sein.
  const inhalt = `${roh}\n`

  try {
    // Der Datenort existiert im Normalfall. `recursive: true` ist trotzdem richtig, weil #5 das
    // Anlegen ausdruecklich den Store-Modulen zuschiebt - und weil es bei vorhandenem Ordner
    // nichts tut.
    await fs.mkdir(datenOrt, { recursive: true })
  } catch (ursache) {
    return fehler('speicher_fehler', `Datenort ${datenOrt} nicht nutzbar: ${text(ursache)}`)
  }

  // SCHRITT 1: die bestehende Datei sichern. KOPIEREN, nicht verschieben - ein Verschieben liesse
  // vorlagen.json fuer die Dauer des Schreibvorgangs verschwinden.
  //
  // ZWEI GRUENDE, DIE SICHERUNG ZU UEBERSPRINGEN, und beide schuetzen dieselbe Datei:
  //   1. `ausBakGerettet` - die vom Issue verlangte Ausnahme. Nach einer Rettung liegt die DEFEKTE
  //      Datei noch da, waehrend das `.bak` die einzige heile Fassung ist; ein Kopieren machte die
  //      Rettung zunichte.
  //   2. `taugtAlsSicherung` - dieselbe Gefahr aus einer anderen Richtung: Die Datei kann auch
  //      NACH dem Laden beschaedigt worden sein (Absturz, fremdes Werkzeug), ohne dass dieser
  //      Prozess je aus dem `.bak` gerettet hat. Ohne die Pruefung wanderte der Schrott in die
  //      Sicherung. Uebernommen aus #31/#46/#69, wo sie beim Bau von #34 gefunden wurde.
  const sicherungsFehler =
    !ausBakGerettet && (await taugtAlsSicherung(ziel))
      ? await mitWiederholung(() => fs.copyFile(ziel, sicherung))
      : null
  if (sicherungsFehler !== null && !istCode(sicherungsFehler, 'ENOENT')) {
    // ENOENT = es gibt noch keine vorlagen.json (erster Start). Dann ist nichts zu sichern, und
    // das ist KEIN Fehler.
    //
    // Jeder andere Grund BRICHT AB, statt ohne frisches Backup weiterzuschreiben. Das ist die
    // offene Frage aus dem STOPP-Block; entschieden ist sie hier NICHT neu, sondern gleichlautend
    // mit den drei bereits gebauten Schwesterfunktionen #31, #46 und #69 - vier Schreiber
    // derselben Bauart, die sich bei einem defekten Backup verschieden verhalten, waeren "das
    // schlechteste aller Ergebnisse" (STOPP-Block, woertlich). Die Begruendung traegt auch fuer
    // sich: Die haeufigste Ursache ist eine volle Platte, dann waere auch das .tmp unvollstaendig;
    // ein Abbruch laesst vorlagen.json garantiert unberuehrt, und der Bestand liegt weiter im
    // Speicher.
    return fehler('speicher_fehler', `Sicherung von ${DATEI} fehlgeschlagen: ${text(sicherungsFehler)}`)
  }

  // SCHRITT 2: vollstaendig in die Nebendatei schreiben.
  try {
    const griff = await fs.open(temp, 'w')
    try {
      await griff.writeFile(inhalt, 'utf8')
      // fsync VOR dem Rename. Ohne ihn kann das Betriebssystem den Verzeichniseintrag schon
      // umgehaengt haben, waehrend die Nutzdaten noch im Puffer stehen - nach einem Stromausfall
      // stuende dann eine LEERE vorlagen.json da, und die Bibliothek waere weg. Der STOPP-Block
      // verlangt ausdruecklich, das nicht stillschweigend wegzulassen, und nennt den realen Anlass:
      // Der Datenort kann bei der portablen Auslieferung auf einem USB-Stick liegen. Gleichstand
      // mit #31, #46, #69 und dem Export (TK 9.6.3).
      await griff.sync()
    } finally {
      // Schliessen MUSS gelingen, bevor umbenannt wird: Ein eigenes offenes Handle auf die Quelle
      // ist derselbe EPERM-Fall wie ein fremdes, und dagegen hilft keine Wiederholung. Ein Fehler
      // beim Schliessen wird verschluckt, damit er nicht die eigentliche Ursache aus dem try-Block
      // verdeckt - die Daten sind zu diesem Zeitpunkt bereits gesynct.
      await griff.close().catch(() => undefined)
    }
  } catch (ursache) {
    // ".tmp-Rest wird aufgeraeumt" (Fehlerpfad-Tabelle). Das ist hier ungefaehrlich, weil an dieser
    // Stelle gerade NICHT feststeht, dass die .tmp vollstaendig ist. Scheitert auch das Aufraeumen,
    // ist das kein eigener Fehler: Der naechste Versuch oeffnet dieselbe Datei mit 'w'.
    await fs.rm(temp, { force: true }).catch(() => undefined)
    return fehler('speicher_fehler', `${DATEI} konnte nicht geschrieben werden: ${text(ursache)}`)
  }

  // SCHRITT 3: der unteilbare Moment. Vorher zeigt der Name auf den alten Stand, nachher auf den
  // neuen; ein Dritter sieht nie etwas dazwischen. Die vorhandene Zieldatei wird NICHT vorher
  // geloescht - das oeffnete ein Fenster, in dem gar keine vorlagen.json existiert.
  const umbenennFehler = await mitWiederholung(() => fs.rename(temp, ziel))
  if (umbenennFehler !== null) {
    // Die .tmp bleibt hier bewusst liegen - anders als im Zweig darueber. Sie ist an dieser Stelle
    // VOLLSTAENDIG und gesynct, also die einzige Fassung des neuen Standes auf der Platte; sie
    // wegzuraeumen wuerde die Arbeit des Nutzers vernichten, um aufgeraeumt auszusehen.
    return fehler('speicher_fehler', `${DATEI} konnte nicht ersetzt werden: ${text(umbenennFehler)}`)
  }

  // "Danach gilt die Datei wieder als heil: Der gemerkte Wiederherstellungs-Zustand wird geloescht,
  // und alle weiteren Schreibvorgaenge kopieren wieder ganz normal nach .bak."
  ausBakGerettet = false
  return { ok: true, wert: undefined }
}

/**
 * Ist die vorhandene Zieldatei als Sicherung ueberhaupt brauchbar?
 *
 * Die Pruefung ist bewusst schwach - nur "laesst sich lesen und als JSON auswerten". Sie beurteilt
 * NICHT, ob der Inhalt fachlich vollstaendig ist. Hier geht es allein um die Frage, ob diese Datei
 * als Rueckfallebene taugt - und eine Datei, die nicht einmal parst, taugt es nicht.
 *
 * Ist sie unbrauchbar, wird die Sicherung UEBERSPRUNGEN statt abgebrochen: Die vorhandene `.bak`
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
      // Alles andere (ENOENT, ENOSPC, EACCES) verschwindet nicht von selbst - dort waere Warten nur
      // eine Verzoegerung mit demselben Ausgang.
      if (!istCode(ursache, 'EPERM', 'EBUSY')) {
        return ursache
      }
    }
  }
  return letzter
}

// ---------------------------------------------------------------------------------------------
// Termine, Meldung, Kleinkram
// ---------------------------------------------------------------------------------------------

/**
 * Plant den naechsten Schreibversuch und bricht einen bereits geplanten ab.
 *
 * Es gibt bewusst nur EINEN Termin fuer Entprellung UND Wiederholung: Beide wollen dasselbe tun
 * (den ausstehenden Bestand schreiben), und zwei Timer stellten im Fehlerfall zwei Schreibvorgaenge
 * in die Kette, von denen der zweite garantiert ueberfluessig ist.
 */
function planeTermin(verzoegerungMs: number): void {
  brichTerminAb()
  timer = setTimeout(() => {
    timer = null
    void inReihe(async () => {
      if (bestand === null || !ausstehend) {
        return
      }
      // `schreibeStand` liefert eine Huelle und wirft nicht; der Fang steht trotzdem hier, weil
      // dieser Aufruf KEINEN Empfaenger hat - eine Abweisung landete als unbehandelte
      // Promise-Abweisung im Main-Prozess, sichtbar hoechstens in einer Konsole, die beim Kunden
      // niemand sieht.
      try {
        await schreibeStand()
      } catch {
        // Der Fehlschlag ist ueber `schreibeUndMelde` bereits gemeldet; hier gibt es nichts mehr
        // zu tun ausser das Weiterreichen zu verhindern.
      }
    })
  }, verzoegerungMs)
}

function brichTerminAb(): void {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

/**
 * Gibt ein Ereignis an alle Hoerer.
 *
 * Ueber eine KOPIE der Menge, damit ein Hoerer sich waehrend der Zustellung abmelden darf, ohne die
 * laufende Schleife zu stoeren. Der Wurf eines Hoerers wird gefangen - so verlangt es Regel 3 des
 * Issues: "Wirft ein Hoerer, wird das gefangen; die uebrigen Hoerer werden trotzdem gerufen, und
 * der Wurf verlaesst diese Datei nicht." Das ist die einzige Stelle dieser Datei, an der etwas
 * verschluckt wird.
 */
function melde(ereignis: VorlagenSpeichernEreignis): void {
  for (const eintrag of [...hoerende]) {
    try {
      eintrag.hoerer(ereignis)
    } catch {
      // absichtlich leer, s. oben
    }
  }
}

/**
 * Die tiefe Kopie, ueber die der Bestand diese Datei verlaesst und in die Aenderungsfunktion geht.
 *
 * `structuredClone` und nicht JSON-Umweg oder Spread: Ein Spread kopierte nur die oberste Ebene -
 * `zonen`, `rahmen` und `text` blieben geteilt, und genau dort aendert der Vorlagen-Editor.
 */
function tiefeKopie(vorlagen: Vorlage[]): Vorlage[] {
  return structuredClone(vorlagen)
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
 * passt wie fuer `Ergebnis<Vorlage[], …>` und das generische `Ergebnis<T, …>`.
 *
 * "Eine rohe Exception-Meldung wird nie zum Code." (TK 9.1.1) - der Text einer Ausnahme landet
 * ausschliesslich in `meldung`, der Code kommt immer aus dieser geschlossenen Union.
 */
function fehler(
  code: VorlagenFehlercode | GenerischerFehlercode,
  meldung: string,
): { ok: false; fehler: { code: VorlagenFehlercode | GenerischerFehlercode; meldung: string } } {
  return { ok: false, fehler: { code, meldung } }
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEIN fsync AUF DAS VERZEICHNIS. Nach POSIX ueberlebt ein Rename einen Stromausfall erst, wenn
//    auch der Verzeichniseintrag gesynct ist. Auf Windows ist ein fsync auf ein Verzeichnis nicht
//    moeglich (gemessen, #46), unter macOS waere es machbar. Der STOPP-Block nennt es als offene
//    Frage; eine plattformabhaengige Zusatzsicherung wurde NICHT eingebaut, weil sie das Verhalten
//    der beiden Zielplattformen auseinanderzoege, ohne dass irgendwo festgelegt ist, dass V1 dieses
//    Niveau braucht. Das .tmp selbst ist gesynct - der Fall "leere vorlagen.json nach Stromausfall"
//    ist damit ausgeschlossen; offen bleibt allein "Rename nach Stromausfall nicht sichtbar", dann
//    steht die ALTE Datei da. Gleichstand mit #31, #46 und #69.
//
// 2. KEIN fsync AUF DIE .bak. fs.copyFile schreibt ueber den Puffer; ein Absturz unmittelbar nach
//    dem Kopieren kann eine unvollstaendige .bak hinterlassen. Gleichstand mit #31, #46 und #69.
//
// 3. KEIN SENDER AUF DEN IPC-KANAL, kein Fenster, kein Renderer-Zugriff und kein Eintrag in der
//    Kanal-Registry (#25). Den Weg zum Fenster baut verdrahteSpeicherstatusIPC (#238) im
//    ipc-gateway ueber `aufVorlagenSpeichernEreignis`. Zwei Sender fuer einen Kanal waeren der
//    teure Fehler: Der Renderer bekaeme jede Meldung doppelt.
//    (Die Bezeichner selbst stehen hier bewusst nicht ausgeschrieben, damit die Grep-Probe der DoD
//    sauber bleibt; die einzigen Treffer sind die vom Issue vorgegebenen JSDoc-Zeilen oben.)
//
// 4. KEINE FACHLICHE PRUEFUNG, kein D1-Lock, keine Rotation, kein Loeschen alter .bak-Dateien und
//    kein "verwaiste Arbeitskopien beim Laden entfernen" (das ist #108) - alles ausdruecklich
//    verboten (STOPP-Block).
//
// 5. KEIN AUFRAEUMEN DER .tmp NACH EINEM GESCHEITERTEN RENAME - begruendet an der Stelle selbst.
