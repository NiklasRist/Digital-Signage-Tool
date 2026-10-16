// [preview-player] Die frame-gerundete Zeitachse und die Gesamtdauer der Vorschau

import type { Listenelement } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'
import { frameDauer } from '../composer/gesamtlaenge'

/** Der Platz genau eines Listenelements auf der Achse. Halboffen: [startFrame, endeFrame). */
export interface Achsenabschnitt {
  elementId: string
  /** Position in der übergebenen Liste (0-basiert) – die „Markierung des aktuellen Elements". */
  index: number
  /** Erster Frame dieses Elements, einschliesslich. */
  startFrame: number
  /** Erster Frame des NÄCHSTEN Elements, ausschliesslich. */
  endeFrame: number
  /** endeFrame − startFrame. */
  frames: number
}

export interface Zeitachse {
  abschnitte: readonly Achsenabschnitt[]
  /** Summe aller Abschnitts-Frames. */
  gesamtFrames: number
  /** gesamtFrames / RENDER_PROFILE.fps – exaktes Vielfaches von 1/fps. */
  gesamtSekunden: number
}

/**
 * Baut die Achse. Eine LEERE Liste ergibt eine leere Achse mit 0 Frames und ist KEIN Fehler.
 * Scheitert `frameDauer` an EINEM Element, bricht der Aufbau ab und der Fehler des ersten
 * gescheiterten Elements wird UNVERÄNDERT durchgereicht (Code und Meldung).
 */
export function baueZeitachse(liste: readonly Listenelement[]): Ergebnis<Zeitachse, string> {
  const abschnitte: Achsenabschnitt[] = []
  let startFrame = 0
  let index = 0

  // Die Frames jedes Elements kommen AUSSCHLIESSLICH aus `frameDauer` (TK 9.2.6,
  // ENTSCHIEDEN 2). Kein Feld des Listenelements wird hier gelesen ausser `id`.
  for (const element of liste) {
    const einzeln = frameDauer(element)
    // Abbruch beim ersten Fehlschlag: der Fehler wird UNVERAENDERT durchgereicht,
    // keine Teil-Achse, kein Ueberspringen, kein Ersatzwert.
    if (!einzeln.ok) return einzeln
    const frames = einzeln.wert
    abschnitte.push({
      elementId: element.id,
      index,
      startFrame,
      endeFrame: startFrame + frames,
      frames,
    })
    startFrame += frames
    index += 1
  }

  return {
    ok: true,
    wert: {
      abschnitte,
      gesamtFrames: startFrame,
      // Eine Division am Schluss auf der fertigen Frame-Summe - dadurch ist
      // `gesamtSekunden` immer ein exaktes Vielfaches von 1/fps.
      gesamtSekunden: startFrame / RENDER_PROFILE.fps,
    },
  }
}

/** Der Abschnitt, in dem `frame` liegt; null ausserhalb von [0, gesamtFrames). */
export function findeAbschnitt(achse: Zeitachse, frame: number): Achsenabschnitt | null {
  for (const abschnitt of achse.abschnitte) {
    // Halboffen [startFrame, endeFrame): der Anfang gehoert dazu, das Ende nicht.
    // Bei `NaN` sind beide Vergleiche falsch - das liefert von selbst `null`.
    if (abschnitt.startFrame <= frame && frame < abschnitt.endeFrame) return abschnitt
  }
  return null
}

/** Position INNERHALB des Abschnitts: frame − abschnitt.startFrame. Klemmt nicht. */
export function lokalerFrame(abschnitt: Achsenabschnitt, frame: number): number {
  return frame - abschnitt.startFrame
}

/** frame / RENDER_PROFILE.fps. */
export function frameZuSekunden(frame: number): number {
  return frame / RENDER_PROFILE.fps
}

/** Rundet Sekunden × RENDER_PROFILE.fps – die EINZIGE Rundung dieser Datei, s. ENTSCHIEDEN 3. */
export function sekundenZuFrame(sekunden: number): number {
  return Math.round(sekunden * RENDER_PROFILE.fps)
}
