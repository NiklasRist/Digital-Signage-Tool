// #428 (docs/agents/428-zeitband-plan.md): die REINE Zeitband-Geometrie der Zeitleiste.
// Kein JSX, kein react - deshalb eine eigene Datei (wie band-aufnahme.ts) und ohne DOM
// pruefbar. Die Anzeige (zeitleiste.tsx) zeichnet nur noch.

import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

/** Pixel je Sekunde bei Standard-Zoom. Auch der zeitbasierte Drop (index.tsx) rechnet mit
 *  dem AKTUELLEN Mass, damit Messung und Bild nicht auseinanderlaufen. */
export const EA_PX_PRO_SEKUNDE = 8
/** Die waehlbaren Zoom-Stufen (px/s). Hoeher = feiner; ab ~64 px/s werden einzelne Frames sichtbar. */
export const ZOOM_STUFEN = [4, 8, 16, 32, 64, 128] as const

/** Tick-Schrittweiten in FRAMES - von einem Frame bis zu mehreren Minuten. Der Schritt wird je
 *  Zoom so gewaehlt, dass die Ticks einen Mindestabstand halten. */
const TICK_SCHRITTE_FRAMES = [1, 2, 5, 10, 15, 30, 60, 150, 300, 600, 1800, 3600, 9000, 18000] as const

/** Eine Frame-Zahl als `mm:ss:ff` (Minuten:Sekunden:Frames, 30 fps). */
export function formatiereFrameZahl(frames: number): string {
  const fps = RENDER_PROFILE.fps
  const ganz = Math.max(0, Math.round(frames))
  const ff = ganz % fps
  const gesamtSekunden = Math.floor(ganz / fps)
  const ss = gesamtSekunden % 60
  const mm = Math.floor(gesamtSekunden / 60)
  const zweistellig = (n: number): string => String(n).padStart(2, '0')
  return `${zweistellig(mm)}:${zweistellig(ss)}:${zweistellig(ff)}`
}

/** Der kleinste Schritt aus `TICK_SCHRITTE_FRAMES`, dessen Abstand mindestens `zielPx` ist. */
function waehleMinorSchritt(framePx: number): number {
  for (const schritt of TICK_SCHRITTE_FRAMES) {
    if (schritt * framePx >= 5) return schritt
  }
  return TICK_SCHRITTE_FRAMES[TICK_SCHRITTE_FRAMES.length - 1] ?? 18000
}

/** Der Beschriftungs-Schritt: ein VIELFACHES des Minor-Schritts (sonst faellt kein Label auf
 *  einen Tick), so gross, dass die Labels mindestens ~48 px auseinanderliegen. */
function waehleMajorSchritt(minorSchritt: number, framePx: number): number {
  const faktor = Math.max(1, Math.ceil(48 / (framePx * minorSchritt)))
  return minorSchritt * faktor
}

export interface ZeitTick {
  xPx: number
  beschriftet: boolean
  text: string
}
export interface ZeitachsenSegment {
  breitePx: number
  ticks: ZeitTick[]
}

/** #428: die Zeitachse ueber der Blockzeile. Je Block ein Segment gleicher Breite; darin
 *  Ticks in einem an den Zoom angepassten Frame-Schritt. Bei hohem Zoom liegt zwischen zwei
 *  Ticks nur ein Frame; beschriftet wird in `mm:ss:ff`. REIN - die Anordnung ist eine Funktion
 *  der Dauer/Breite/des Zooms, nicht des Zustands. So fallen Achse und Bloecke nicht auseinander,
 *  auch wenn ein Block eine Mindestbreite hat. */
export function baueZeitachse(
  zeilen: readonly { dauerSekunden: number | null; breitePx: number }[],
  pxProSekunde: number,
  fps: number = RENDER_PROFILE.fps,
): ZeitachsenSegment[] {
  const framePx = pxProSekunde / fps
  const minorSchritt = waehleMinorSchritt(framePx)
  const majorSchritt = waehleMajorSchritt(minorSchritt, framePx)
  let sekundeKum = 0
  return zeilen.map((zeile) => {
    const ticks: ZeitTick[] = []
    if (zeile.dauerSekunden !== null && zeile.dauerSekunden > 0) {
      const startFrame = Math.round(sekundeKum * fps)
      const endFrame = Math.round((sekundeKum + zeile.dauerSekunden) * fps)
      const erster = Math.ceil(startFrame / minorSchritt) * minorSchritt
      for (let frame = erster; frame <= endFrame; frame += minorSchritt) {
        ticks.push({
          xPx: ((frame - startFrame) / fps) * pxProSekunde,
          beschriftet: frame % majorSchritt === 0,
          text: formatiereFrameZahl(frame),
        })
      }
      sekundeKum += zeile.dauerSekunden
    }
    return { breitePx: zeile.breitePx, ticks }
  })
}

export interface Bandspur {
  segmente: Array<{ startPx: number; breitePx: number }>
  wiederholungen: number
}

/** #428: die Band-Abschnitte als Unterbloecke am Zeitmass des Video-Blocks. Sie liegen
 *  ab Sekunde 0 (die Rotation beginnt mit dem Video, TK 9.2.8); ihre Breite ist die Dauer
 *  in Sekunden zum AKTUELLEN Zoom. REIN. `wiederholungen` sagt, wie oft die Folge ins Video
 *  passt (>1 = sie wiederholt sich, 9.2.8). */
export function baueBandspur(
  abschnitte: readonly { dauer: number }[],
  videoSekunden: number | null,
  pxProSekunde: number,
): Bandspur {
  let x = 0
  let gesamtSekunden = 0
  const segmente = abschnitte.map((abschnitt) => {
    const dauer = Number.isFinite(abschnitt.dauer) && abschnitt.dauer > 0 ? abschnitt.dauer : 0
    const breitePx = Math.round(dauer * pxProSekunde)
    const segment = { startPx: x, breitePx }
    x += breitePx
    gesamtSekunden += dauer
    return segment
  })
  const wiederholungen =
    videoSekunden !== null && gesamtSekunden > 0 && gesamtSekunden < videoSekunden
      ? Math.ceil(videoSekunden / gesamtSekunden)
      : 1
  return { segmente, wiederholungen }
}
