// [composer] Auto-Scroll der Zeitleiste beim Ziehen (06.11.2026)
//
// WARUM ES DIESE DATEI GIBT: Niklas, 06.11.2026: „beim drag and drop muss die zeileiste
// automatisch scrollable sein". Die Zeitleiste ist ein eigener horizontaler Scroll-Container
// (`overflowX: auto`). dnd-kit scrollt ihn zwar auch, aber erst an der FENSTERkante und ohne
// eigene Geschwindigkeit; am Fenster gemessen: 2112 px in 1,2 s ohne diese Regel. Die eigene
// Rechnung macht die Kante der ZEITLEISTE zum Ausloeser: Der Zeiger nahe am linken/rechten
// Rand verschiebt den Inhalt, je naeher am Rand, desto schneller (gemessen: 3380 px).
//
// KEIN DOM, KEIN TIMER, KEIN CANVAS: nur Zahlen. Damit ist die Regel ohne Browser pruefbar
// (`tests/unit/zeit-autoscroll.spec.ts`); die Zeitleiste ruft sie in ihrem Lauf auf.

/** Abstand zum Rand, ab dem gescrollt wird (px). */
export const AUTOSCROLL_RAND_PX = 48
/** Hoechste Verschiebung je Bild (px). */
export const AUTOSCROLL_MAX_PX = 18

/** Das Rechteck des Scroll-Containers – dieselben vier Kanten wie `getBoundingClientRect`. */
export interface ScrollKasten {
  links: number
  rechts: number
  oben: number
  unten: number
}

/**
 * Wie weit die Zeitleiste in diesem Bild scrollen soll.
 *
 * Negativ = nach links, positiv = nach rechts, 0 = nicht scrollen. Der Zeiger wird auf
 * den Kasten geklemmt: Wer ueber den Rand hinauszieht, scrollt weiter (das ist genau der
 * Fall „bis an den Rand und darueber hinaus"). Senkrecht zaehlt nur das Innere des Kastens
 * (plus keine Toleranz): Ein Zeiger ueber der Buehne soll die Zeitleiste nicht bewegen.
 *
 * Die Formel ist linear: Direkt am Rand `AUTOSCROLL_MAX_PX`, an der inneren Kante des
 * Randbereichs 0. Ein Sprung waere am Fenster ein Ruck.
 */
export function autoScrollSchritt(
  zeiger: { x: number; y: number },
  kasten: ScrollKasten,
  randPx: number = AUTOSCROLL_RAND_PX,
  maxPx: number = AUTOSCROLL_MAX_PX,
): number {
  if (!Number.isFinite(zeiger.x) || !Number.isFinite(zeiger.y)) return 0
  if (!Number.isFinite(kasten.links) || !Number.isFinite(kasten.rechts)) return 0
  if (!(kasten.rechts > kasten.links)) return 0
  if (!(randPx > 0) || !(maxPx > 0)) return 0
  if (zeiger.y < kasten.oben || zeiger.y > kasten.unten) return 0

  // Auf den Kasten klemmen: ausserhalb links/rechts bleibt die Richtung erhalten.
  const x = Math.min(kasten.rechts, Math.max(kasten.links, zeiger.x))
  const vomLinkenRand = x - kasten.links
  const vomRechtenRand = kasten.rechts - x

  if (vomLinkenRand < randPx) {
    const naehe = (randPx - vomLinkenRand) / randPx
    return -Math.max(1, Math.ceil(naehe * maxPx))
  }
  if (vomRechtenRand < randPx) {
    const naehe = (randPx - vomRechtenRand) / randPx
    return Math.max(1, Math.ceil(naehe * maxPx))
  }
  return 0
}
