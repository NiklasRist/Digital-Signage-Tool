// [preview-player] Das Zeitverhalten des Werbebandes – wechseln, wiederholen, am Videoende abschneiden

import type { Einblendung } from '../../shared/contracts/project'
import { sekundenZuFrame } from './zeitachse'

/** Ein Abschnitt EINER Runde der Abschnittsfolge. Halboffen: [startFrame, endeFrame). */
export interface Bandabschnitt {
  /** Aktions-ID dieses Abschnitts (Einblendung.abschnitte[i].aktionRef). */
  aktionRef: string
  /** Position in Einblendung.abschnitte (0-basiert). */
  index: number
  /** Erster Frame dieses Abschnitts INNERHALB der Runde, einschliesslich. */
  startFrame: number
  /** Erster Frame des naechsten Abschnitts innerhalb der Runde, ausschliesslich. */
  endeFrame: number
  /** endeFrame − startFrame. Kann 0 sein (s. ENTSCHIEDEN 3). */
  frames: number
}

export interface Bandtakt {
  /** Die Abschnitte EINER Runde, in Array-Reihenfolge. */
  abschnitte: readonly Bandabschnitt[]
  /** Laenge EINER Runde in Frames. 0, wenn es keine Abschnitte mit Laenge gibt. */
  rundeFrames: number
}

/**
 * Baut den Takt EINER Runde. Total: wirft nie, prueft nichts, traegt KEINE Ergebnis-Huelle und
 * KEINEN Fehlercode (TK 9.9.2: der preview-player prueft nichts und meldet keine Fehlercodes).
 * Eine Einblendung OHNE Abschnitte ergibt einen leeren Takt mit rundeFrames = 0.
 */
export function baueBandtakt(einblendung: Einblendung): Bandtakt {
  const abschnitte: Bandabschnitt[] = []
  let start = 0

  for (let index = 0; index < einblendung.abschnitte.length; index += 1) {
    const abschnitt = einblendung.abschnitte[index]
    if (abschnitt === undefined) {
      continue
    }
    // Die Frames kommen AUSSCHLIESSLICH aus `sekundenZuFrame` (#213) - ENTSCHIEDEN 1.
    // Nicht endlich (NaN/Infinity) oder negativ ergibt 0 Frames, ENTSCHIEDEN 3.
    let frames = sekundenZuFrame(abschnitt.dauer)
    if (!Number.isFinite(frames) || frames < 0) frames = 0
    abschnitte.push({
      aktionRef: abschnitt.aktionRef,
      index,
      startFrame: start,
      endeFrame: start + frames,
      frames,
    })
    start += frames
  }

  return { abschnitte, rundeFrames: start }
}

/**
 * Welcher Abschnitt bei `lokalerFrame` sichtbar ist – WIEDERHOLT ueber die Runde,
 * ABGESCHNITTEN bei `elementFrames`.
 * null bedeutet: kein Abschnitt sichtbar (vor dem Anfang, ab dem Videoende, oder leerer Takt).
 * Total: wirft nie.
 */
export function waehleAbschnitt(
  takt: Bandtakt,
  lokalerFrame: number,
  elementFrames: number,
): Bandabschnitt | null {
  if (takt.rundeFrames <= 0) return null
  if (!Number.isFinite(lokalerFrame) || lokalerFrame < 0) return null
  if (lokalerFrame >= elementFrames) return null

  // Wiederholung per Rest der Division, ENTSCHIEDEN 4 - keine ausgerollte Liste.
  const pos = lokalerFrame % takt.rundeFrames
  for (const abschnitt of takt.abschnitte) {
    // Halboffen [startFrame, endeFrame): der Anfang gehoert dazu, das Ende nicht.
    if (abschnitt.startFrame <= pos && pos < abschnitt.endeFrame) return abschnitt
  }
  return null
}
