// #437 (TK v3.26 / 9.7.7): die REINE Fachlichkeit der Unterbrechungs-Bedienung im Composer.
// Kein JSX, kein react, kein IPC, kein throw - ohne DOM pruefbar.
//
// WER ENTSCHEIDET BAND ODER UNTERBRECHUNG? Die VORLAGE DER AKTION, nicht ein Schalter
// (User-Entscheidung 17.10.2026): Eine vollflaechige Aktion (`art: 'vollflaeche'`) wird beim
// Drop auf den Video-Koerper eine UNTERBRECHUNG (sequenziell, 9.2.9); eine Band-Aktion
// (`art: 'split' | 'einblendung'`) wird ein BAND-ABSCHNITT (parallel, 9.2.8) - der bisherige
// Weg. Eine Aktion ist damit nie beides (TK 9.7.7).
//
// DIE ZEITSTELLE ist die GESPIELTE Videozeit (Sekunden ab 0 der getrimmten Sicht, 9.11.3).
// Der Block zeigt aber die SEQUENZ [Video0][Aktion1][Video1]… - deshalb liegen die Marken
// NICHT bei `zeitstelle`, sondern bei `zeitstelle + Summe der Dauern davor` (die Wanduhr-
// Position). Diese Datei rechnet beide Richtungen: Marke -> Position und Position -> Zeit.
//
// KEIN ZWEITER SCHREIBWEG: Diese Datei baut nur die Liste; geschrieben wird ueber
// `setzeUnterbrechungen` (projekt-store, #426) und die Sicht-Korrektur der Wurzel (#243).

import type { Listenelement, Unterbrechung } from '../../shared/contracts/project'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Vorlage } from '../../shared/contracts/vorlage'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

/** Ist die Aktion vollflaechig? Dann wird ein Drop auf das Video eine Unterbrechung.
 *  Unbekannte Vorlage -> `false` (Band, bisheriges Verhalten); die Band-Pruefung meldet es. */
export function istVollflaechigeAktion(aktion: Aktion, vorlagen: readonly Vorlage[]): boolean {
  const vorlage = vorlagen.find((kandidat) => kandidat.id === aktion.vorlagenId)
  return vorlage?.art === 'vollflaeche'
}

/** Die GESPIELTE Videodauer (trimEnde − trimStart) in Sekunden; `null`, wenn unbrauchbar.
 *  Bewusst ROH (keine Frame-Rundung): der Store prueft die Zeitstelle gegen genau diese Zahl. */
export function videoSekunden(element: Listenelement): number | null {
  const start = element.trimStart
  const ende = element.trimEnde
  if (typeof start !== 'number' || !Number.isFinite(start) || start < 0) return null
  if (typeof ende !== 'number' || !Number.isFinite(ende) || !(ende > start)) return null
  return ende - start
}

/** Eine Marke eines Einschubs im Video-Block. */
export interface UnterbrechungsMarke {
  /** Position in `element.unterbrechungen`. */
  index: number
  aktionRef: string
  /** Die Wanduhr-Position ihres Starts im Block (Sekunden ab Blockanfang) - fuer das Bild. */
  startSekunden: number
  dauerSekunden: number
  /** Die gespeicherte Zeitstelle in der GESPIELTEN Videozeit (Sekunden ab 0 der Sicht). */
  zeitstelle: number
}

/**
 * Die Marken aller Einschuebe in Reihenfolge. `startSekunden = zeitstelle + Summe der
 * Dauern davor` - das ist die sequenzielle Position im Block (Video0 · Aktion1 · Video1 …).
 */
export function unterbrechungsMarken(element: Listenelement): UnterbrechungsMarke[] {
  const liste = element.unterbrechungen ?? []
  const marken: UnterbrechungsMarke[] = []
  let summe = 0
  for (let index = 0; index < liste.length; index += 1) {
    const eintrag = liste[index]
    if (eintrag === undefined) continue
    const dauerSekunden = Number.isFinite(eintrag.dauer) && eintrag.dauer > 0 ? eintrag.dauer : 0
    const zeitstelle = Number.isFinite(eintrag.zeitstelle) ? eintrag.zeitstelle : 0
    marken.push({
      index,
      aktionRef: eintrag.aktionRef,
      startSekunden: zeitstelle + summe,
      dauerSekunden,
      zeitstelle,
    })
    summe += dauerSekunden
  }
  return marken
}

/** Klemmt in das offene Intervall (0, gesamt) - eine Zeitstelle darf nie auf 0 oder das Ende
 *  fallen (der Store verlangt `0 < zeitstelle < videoDauer`, 9.5.2). Ein Frame Rand genuegt. */
function klemmeZeitstelle(zeitstelle: number, gesamt: number): number {
  const rand = 1 / RENDER_PROFILE.fps
  if (!(gesamt > 2 * rand)) return gesamt / 2
  return Math.min(Math.max(zeitstelle, rand), gesamt - rand)
}

/**
 * Rechnet eine Wanduhr-Position im Block in die GESPIELTE Videozeit um (die Umkehrung der
 * Marke). Faellt die Position IN einen Einschub, steht das Video an dessen Zeitstelle still -
 * dann kommt genau diese zurueck (kein Punkt "zwischen" zwei Einschueben). `null`, wenn die
 * Videodauer unbrauchbar ist.
 */
export function spieleZeitBeiSequenzzeit(element: Listenelement, sequenzSekunden: number): number | null {
  const gesamt = videoSekunden(element)
  if (gesamt === null || !Number.isFinite(sequenzSekunden)) return null
  if (sequenzSekunden < 0) return null
  let summe = 0
  for (const marke of unterbrechungsMarken(element)) {
    if (sequenzSekunden < marke.startSekunden) break
    if (sequenzSekunden <= marke.startSekunden + marke.dauerSekunden) {
      return klemmeZeitstelle(marke.zeitstelle, gesamt)
    }
    summe += marke.dauerSekunden
  }
  return klemmeZeitstelle(sequenzSekunden - summe, gesamt)
}

/** Der Ausgang des Einfuegens - abgelehnt MIT Begruendung statt Wurf (Muster band-aufnahme.ts). */
export type UnterbrechungEinfuegen =
  | { ok: true; unterbrechungen: Unterbrechung[] }
  | { ok: false; meldung: string }

/**
 * Fuegt EINEN Einschub an der (gespielten) Zeitstelle ein und liefert die NEUE Liste,
 * aufsteigend nach Zeitstelle. Geprueft wird nur, was ohne Projektwissen pruefbar ist
 * (Zeitstelle im offenen Intervall, Dauer > 0, keine doppelte Stelle) - die massgebliche
 * Pruefung bleibt beim Store (9.5.2). Ein Schreibvorgang, EIN Undo-Schritt.
 */
export function fuegeUnterbrechungEin(
  bestehende: readonly Unterbrechung[],
  aktionRef: string,
  dauer: number,
  zeitstelle: number,
  videoSekunden: number,
): UnterbrechungEinfuegen {
  if (typeof aktionRef !== 'string' || aktionRef.trim() === '') {
    return { ok: false, meldung: 'Zu einer Unterbrechung gehoert eine Aktion.' }
  }
  if (!Number.isFinite(dauer) || dauer <= 0) {
    return { ok: false, meldung: 'Die Dauer einer Unterbrechung muss groesser als null sein.' }
  }
  if (!Number.isFinite(zeitstelle) || !(zeitstelle > 0) || !(zeitstelle < videoSekunden)) {
    return {
      ok: false,
      meldung: `Die Zeitstelle ${String(zeitstelle)} s liegt nicht innerhalb des Videos.`,
    }
  }
  const rand = 1 / RENDER_PROFILE.fps
  if (bestehende.some((eintrag) => Math.abs(eintrag.zeitstelle - zeitstelle) < rand)) {
    return { ok: false, meldung: 'An dieser Stelle liegt schon eine Unterbrechung.' }
  }
  const neu: Unterbrechung[] = [...bestehende, { zeitstelle, aktionRef, dauer }]
  neu.sort((a, b) => a.zeitstelle - b.zeitstelle)
  return { ok: true, unterbrechungen: neu }
}

/** Entfernt den Einschub an `index` (ungueltiger Index -> unveraenderte Kopie). */
export function entferneUnterbrechung(
  bestehende: readonly Unterbrechung[],
  index: number,
): Unterbrechung[] {
  return bestehende.filter((_, stelle) => stelle !== index)
}

/** Der Ausgang des Verschiebens - abgelehnt MIT Begruendung statt Wurf. */
export type UnterbrechungVerschieben =
  | { ok: true; unterbrechungen: Unterbrechung[] }
  | { ok: false; meldung: string }

/**
 * Verschiebt den Einschub `index` auf die GESPIELTE Zeitstelle `neueZeitstelle` und
 * liefert die nach Zeitstelle sortierte Liste. Geklemmt wird in das offene Intervall
 * (0, videoDauer) und zwischen die Nachbarn - der Store verlangt aufsteigend und ohne
 * doppelte Stelle (TK 9.5.2); ein Zug auf eine belegte Stelle landet also direkt
 * daneben statt zu scheitern. Nur das betroffene Feld `zeitstelle` aendert sich.
 */
export function verschiebeUnterbrechung(
  bestehende: readonly Unterbrechung[],
  index: number,
  neueZeitstelle: number,
  videoDauer: number,
): UnterbrechungVerschieben {
  const eintrag = bestehende[index]
  if (eintrag === undefined) {
    return { ok: false, meldung: 'Diese Unterbrechung gibt es nicht (mehr).' }
  }
  if (!Number.isFinite(videoDauer) || !(videoDauer > 0)) {
    return { ok: false, meldung: 'Ohne brauchbare Videodauer laesst sich nichts verschieben.' }
  }
  if (!Number.isFinite(neueZeitstelle)) {
    return { ok: false, meldung: 'Die neue Zeitstelle ist keine Zahl.' }
  }

  const rand = 1 / RENDER_PROFILE.fps
  const rest = bestehende.filter((_, stelle) => stelle !== index)
  // Die Nachbarn im ZIEL: kleiner/groesser als die gewuenschte Stelle.
  const davor = rest.filter((kandidat) => kandidat.zeitstelle < neueZeitstelle)
  const danach = rest.filter((kandidat) => kandidat.zeitstelle > neueZeitstelle)
  const unten = davor.length === 0 ? 0 : Math.max(...davor.map((kandidat) => kandidat.zeitstelle))
  const oben = danach.length === 0 ? videoDauer : Math.min(...danach.map((kandidat) => kandidat.zeitstelle))
  const min = Math.max(rand, unten + rand)
  const max = Math.min(videoDauer - rand, oben - rand)
  if (!(max > min)) {
    return { ok: false, meldung: 'Zwischen den Nachbarn ist kein Platz fuer diese Unterbrechung.' }
  }

  const ziel = Math.min(Math.max(neueZeitstelle, min), max)
  const neu = [...rest, { ...eintrag, zeitstelle: ziel }].sort((a, b) => a.zeitstelle - b.zeitstelle)
  return { ok: true, unterbrechungen: neu }
}
