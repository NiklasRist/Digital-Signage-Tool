// #428 (docs/agents/428-zeitband-plan.md): die REINE Zeitband-Geometrie der Zeitleiste.
// Kein JSX, kein react - deshalb eine eigene Datei (wie band-aufnahme.ts) und ohne DOM
// pruefbar. Die Anzeige (zeitleiste.tsx) zeichnet nur noch.

/** Pixel je Sekunde - die Zeitleiste ist proportional zur Dauer. Auch der zeitbasierte
 *  Drop (index.tsx) rechnet mit DIESEM Mass, damit Messung und Bild nicht auseinanderlaufen. */
export const EA_PX_PRO_SEKUNDE = 8
/** Beschriftet wird nicht jede Sekunde (das liefe bei 8 px/s ineinander), sondern jede fuenfte. */
export const LABEL_ALLE_SEKUNDEN = 5

export interface ZeitachsenSegment {
  breitePx: number
  ticks: Array<{ xPx: number; sekunde: number; beschriftet: boolean }>
}

/** #428: die Zeitachse ueber der Blockzeile. Je Block ein Segment gleicher Breite; darin
 *  ein Tick je Sekunde, beschriftet jede fuenfte. REIN - die Anordnung ist eine Funktion
 *  der Dauer/Breite, nicht des Zustands. So fallen Achse und Bloecke nicht auseinander,
 *  auch wenn ein Block eine Mindestbreite hat. */
export function baueZeitachse(
  zeilen: readonly { dauerSekunden: number | null; breitePx: number }[],
): ZeitachsenSegment[] {
  let sekundeKum = 0
  return zeilen.map((zeile) => {
    const ticks: ZeitachsenSegment['ticks'] = []
    if (zeile.dauerSekunden !== null && zeile.dauerSekunden > 0) {
      const ganze = Math.floor(zeile.dauerSekunden)
      for (let s = 0; s <= ganze; s += 1) {
        const sekunde = sekundeKum + s
        ticks.push({ xPx: s * EA_PX_PRO_SEKUNDE, sekunde, beschriftet: sekunde % LABEL_ALLE_SEKUNDEN === 0 })
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
 *  in Sekunden zu `EA_PX_PRO_SEKUNDE`. REIN. `wiederholungen` sagt, wie oft die Folge ins
 *  Video passt (>1 = sie wiederholt sich, 9.2.8). */
export function baueBandspur(
  abschnitte: readonly { dauer: number }[],
  videoSekunden: number | null,
): Bandspur {
  let x = 0
  let gesamtSekunden = 0
  const segmente = abschnitte.map((abschnitt) => {
    const dauer = Number.isFinite(abschnitt.dauer) && abschnitt.dauer > 0 ? abschnitt.dauer : 0
    const breitePx = Math.round(dauer * EA_PX_PRO_SEKUNDE)
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
