// GENERIERT aus dem Signaturblock von Issue #254.
// [vorlagen-editor] Die Nutzung einer Vorlage anzeigen
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
// GERUEST-PRUEFSUMME: f94d2e5af43b8f9a
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

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Vorlagennutzung, VorlagenReferenz } from '../../shared/contracts/vorlage'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

/** Beide Listen leer. NUR als Vergleichswert – NIE als Ersatz fuer ein fehlendes Ergebnis. */
export const LEERE_NUTZUNG: Vorlagennutzung = Object.freeze({
  aktionen: [],
  listenelemente: [],
})

/**
 * Holt die Nutzung ueber `vorlagen:pruefeVorlagenReferenzen` (TK 9.12.1).
 * REIN LESEND: kein Lock, kein Auftrag, keine Wirkung. Eine leere Nutzung ist ein GUELTIGES
 * Ergebnis (`ok: true`), kein Fehler.
 * Das Ergebnis des Main wird UNVERAENDERT durchgereicht – kein Auspacken, kein Ersetzen eines
 * Fehlercodes, kein Umwandeln in einen Wurf.
 *
 * NUTZLAST (verbindlich): `rufeAuf(KANAELE.vorlagen.pruefeVorlagenReferenzen, { vorlagenId })` –
 * ein OBJEKT mit dem Feld `vorlagenId: string`, NICHT `{ id }` und NICHT der blosse String.
 * Begruendung und Melde-Klausel stehen unmittelbar unter diesem Block.
 */
export async function holeNutzung(
  vorlagenId: string,
): Promise<Ergebnis<Vorlagennutzung, string>> {
  // 1. Leere oder nicht-Zeichenkette: ungueltige_eingabe OHNE IPC-Aufruf (Fehlerpfad).
  if (typeof vorlagenId !== 'string' || vorlagenId === '') {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'Die vorlagenId darf nicht leer sein.',
      },
    }
  }

  try {
    // 2. Genau ein Aufruf, Nutzlast { vorlagenId: id } (verbindlich, s. #255). Das Ergebnis
    //    des Main wird UNVERAENDERT durchgereicht - kein Auspacken, kein Code-Ersatz.
    return await rufeAuf<Vorlagennutzung, string>(
      KANAELE.vorlagen.pruefeVorlagenReferenzen,
      { vorlagenId },
    )
  } catch (ursache) {
    // `rufeAuf` wirft, wenn die Preload-Bruecke fehlt (#24) - kein throw ueber die Grenze.
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: ursache instanceof Error ? ursache.message : String(ursache),
      },
    }
  }
}

/**
 * Liest eine `Vorlagennutzung` aus einem `fehler.daten`-Feld heraus (Code
 * `vorlage_referenziert`, TK 9.1.1/9.12.1). Passt die Form nicht, ist das Ergebnis `null` –
 * NIE ein Wurf und NIE eine erfundene leere Nutzung (s. ENTSCHIEDEN 4).
 */
export function leseVorlagennutzung(daten: unknown): Vorlagennutzung | null {
  // ENTSCHIEDEN 4: Diese Funktion erfindet nichts. Passt die Form nicht, ist das Ergebnis
  // null - NIE LEERE_NUTZUNG (die bedeutet: nachgesehen und nichts gefunden). Einzelne
  // unvollstaendige Eintraege werden UEBERSPRUNGEN; ist danach keiner mehr uebrig, ist das
  // Ergebnis null.
  if (typeof daten !== 'object' || daten === null) {
    return null
  }
  // SAFETY: die Zeile davor hat daten als nicht-null Objekt belegt; der Cast macht
  // die Index-Form sichtbar, und die Felder werden darunter einzeln geprueft.
  const roh = daten as Record<string, unknown>
  const aktionenRoh = roh['aktionen']
  const listenRoh = roh['listenelemente']
  if (!Array.isArray(aktionenRoh) || !Array.isArray(listenRoh)) {
    return null
  }

  const aktionen = aktionenRoh.filter((e): e is VorlagenReferenz => istReferenz(e))
  const listenelemente = listenRoh.filter((e): e is VorlagenReferenz => istReferenz(e))

  // Es wurden Eintraege verworfen und danach ist keiner mehr uebrig: nicht gelesen, nicht
  // "frei" - genau das, was der vorlage_referenziert-Fehler gerade bestritten hat.
  if (aktionen.length === 0 && listenelemente.length === 0) {
    if (aktionenRoh.length === 0 && listenRoh.length === 0) {
      return LEERE_NUTZUNG
    }
    return null
  }
  return { aktionen, listenelemente }
}

/** Ob ein Eintrag die Form einer `VorlagenReferenz` traegt (alle drei Felder Zeichenketten). */
function istReferenz(e: unknown): e is VorlagenReferenz {
  if (typeof e !== 'object' || e === null) {
    return false
  }
  // SAFETY: die Zeile davor hat e als nicht-null Objekt belegt; der Cast macht die
  // Index-Form sichtbar, und die drei Felder werden darunter als Zeichenketten geprueft.
  const r = e as Record<string, unknown>
  return (
    typeof r['projektId'] === 'string' &&
    typeof r['projektName'] === 'string' &&
    typeof r['id'] === 'string'
  )
}

/** Alle Treffer EINES Projekts, zusammengefasst fuer die aufklappbare Liste. */
export interface NutzungsGruppe {
  projektId: string
  /** `VorlagenReferenz.projektName` des ersten Treffers dieses Projekts. */
  projektName: string
  aktionen: readonly VorlagenReferenz[]
  listenelemente: readonly VorlagenReferenz[]
}

/** Die fertige Anzeige – rein abgeleitet, ohne Zustand. */
export interface NutzungsAnzeige {
  /** true NUR, wenn BEIDE Listen leer sind. Aus einer GELADENEN Nutzung, nie aus `null`. */
  frei: boolean
  anzahlAktionen: number
  anzahlListenelemente: number
  /** Verschiedene `projektId` ueber BEIDE Listen zusammen. */
  anzahlProjekte: number
  /** Der eine Satz: „wird von 7 Aktionen in 2 Projekten verwendet". */
  text: string
  /** Die Trefferliste, nach Projekt gruppiert. Leer, wenn `frei`. */
  gruppen: readonly NutzungsGruppe[]
}
export function baueNutzungsAnzeige(nutzung: Vorlagennutzung): NutzungsAnzeige {
  // Rein abgeleitet, ohne Zustand. Die Eingabe wird NUR gelesen, nie verändert.
  const anzahlAktionen = nutzung.aktionen.length
  const anzahlListenelemente = nutzung.listenelemente.length
  const anzahlProjekte = zaehleProjekte(nutzung)
  const frei = anzahlAktionen === 0 && anzahlListenelemente === 0
  return {
    frei,
    anzahlAktionen,
    anzahlListenelemente,
    anzahlProjekte,
    text: baueText(frei, anzahlAktionen, anzahlListenelemente, anzahlProjekte),
    gruppen: gruppiere(nutzung),
  }
}

/**
 * Der eine Satz (ENTSCHIEDEN 7): nennt beide Referenzarten NUR, wenn beide vorkommen.
 * Bei einer Band-Vorlage duerfte nie "von 0 Aktionen" stehen - das hiesse "frei".
 */
function baueText(
  frei: boolean,
  aktionen: number,
  listenelemente: number,
  projekte: number,
): string {
  if (frei) {
    return 'wird nirgends verwendet'
  }
  if (aktionen > 0 && listenelemente > 0) {
    return `wird von ${aktionen} Aktionen und ${listenelemente} Listenelementen in ${projekte} Projekten verwendet`
  }
  if (aktionen > 0) {
    return `wird von ${aktionen} Aktionen in ${projekte} Projekten verwendet`
  }
  return `wird von ${listenelemente} Listenelementen in ${projekte} Projekten verwendet`
}

/**
 * Gruppiert die Treffer nach Projekt (ENTSCHIEDEN 9): Reihenfolge des ersten Auftretens,
 * je Projekt genau eine Gruppe; innerhalb einer Gruppe bleibt die Listen-Reihenfolge
 * erhalten. Keine Sortierung, kein Zusammenwerfen der beiden Trefferarten.
 */
function gruppiere(nutzung: Vorlagennutzung): NutzungsGruppe[] {
  // Intern muessen die Listen befuellt werden; die exportierte Form ist `readonly`.
  interface GruppeIntern {
    projektId: string
    projektName: string
    aktionen: VorlagenReferenz[]
    listenelemente: VorlagenReferenz[]
  }
  const gruppen: NutzungsGruppe[] = []
  const index = new Map<string, GruppeIntern>()

  function aufnehmen(treffer: VorlagenReferenz): void {
    let gruppe = index.get(treffer.projektId)
    if (gruppe === undefined) {
      gruppe = {
        projektId: treffer.projektId,
        projektName: treffer.projektName, // des ERSTEN Treffers dieses Projekts
        aktionen: [],
        listenelemente: [],
      }
      gruppen.push(gruppe)
      index.set(treffer.projektId, gruppe)
    }
  }

  for (const a of nutzung.aktionen) {
    aufnehmen(a)
    const gruppe = index.get(a.projektId)
    if (gruppe !== undefined) {
      gruppe.aktionen.push(a)
    }
  }
  for (const l of nutzung.listenelemente) {
    aufnehmen(l)
    const gruppe = index.get(l.projektId)
    if (gruppe !== undefined) {
      gruppe.listenelemente.push(l)
    }
  }
  return gruppen
}

/** Verschiedene Projekte ueber BEIDE Listen. Rein; wirft nie. */
export function zaehleProjekte(nutzung: Vorlagennutzung): number {
  // ENTSCHIEDEN 8: ein Projekt in beiden Listen zaehlt EINMAL.
  const projekte = new Set<string>()
  for (const a of nutzung.aktionen) {
    projekte.add(a.projektId)
  }
  for (const l of nutzung.listenelemente) {
    projekte.add(l.projektId)
  }
  return projekte.size
}

/** Der gehaltene Stand. `'unbekannt'` heisst NICHT `frei` (s. oben). */
export interface Nutzungsstand {
  zustand: 'unbekannt' | 'laedt' | 'geladen' | 'fehler'
  /** Die Vorlage, auf die sich der Stand bezieht; null, solange nie geladen wurde. */
  vorlagenId: string | null
  /** NUR bei `zustand: 'geladen'` gesetzt. */
  nutzung: Vorlagennutzung | null
  /** NUR bei `zustand: 'fehler'` gesetzt. */
  fehler: { code: string; meldung: string } | null
}

/** Unbekannt, ohne Vorlage, ohne Nutzung, ohne Fehler. */
export const LEERER_NUTZUNGSSTAND: Nutzungsstand = {
  zustand: 'unbekannt',
  vorlagenId: null,
  nutzung: null,
  fehler: null,
}

/** Jede dieser Funktionen liefert einen NEUEN Stand; der uebergebene bleibt unveraendert.
 *  Alle sind total: sie werfen nie. */
export function beginneLaden(stand: Nutzungsstand, vorlagenId: string): Nutzungsstand {
  // Ein alter Wert steht nie neben einem neuen Ladevorgang: nutzung UND fehler auf null.
  return { zustand: 'laedt', vorlagenId, nutzung: null, fehler: null }
}
export function uebernimmNutzung(
  stand: Nutzungsstand,
  vorlagenId: string,
  nutzung: Vorlagennutzung,
): Nutzungsstand {
  // ENTSCHIEDEN 6: Eine Antwort fuer eine ANDERE Vorlage als die laufende wird verworfen -
  // der Stand bleibt unveraendert zurueckgegeben (toBe-gleich).
  if (stand.vorlagenId !== vorlagenId) {
    return stand
  }
  return { zustand: 'geladen', vorlagenId, nutzung, fehler: null }
}
export function uebernimmFehler(
  stand: Nutzungsstand,
  vorlagenId: string,
  code: string,
  meldung: string,
): Nutzungsstand {
  if (stand.vorlagenId !== vorlagenId) {
    return stand
  }
  return { zustand: 'fehler', vorlagenId, nutzung: null, fehler: { code, meldung } }
}

/**
 * Gilt der Stand fuer DIESE Vorlage? false, sobald `vorlagenId` abweicht – ein Stand einer
 * anderen Vorlage darf NIE als Auskunft ueber diese durchgehen (s. ENTSCHIEDEN 5).
 */
export function giltFuer(stand: Nutzungsstand, vorlagenId: string): boolean {
  return stand.zustand === 'geladen' && stand.vorlagenId === vorlagenId
}
