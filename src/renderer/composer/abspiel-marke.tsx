// [composer] Die Abspielmarke in der Zeitleiste (#457, Welle 3)
//
// Sie liest den Stand, den die Vorschau veroeffentlicht (`gemeinsam/abspielposition`)
// und zeichnet eine senkrechte Linie an `frame / fps * pxProSekunde`. Die Zeitleiste
// selbst abonniert NICHTS - nur diese Komponente, damit 30 Bilder je Sekunde nicht
// die ganze Blockzeile neu rendern.
//
// DIE ZWEI SCROLL-REGELN SIND REIN UND HIER GETESTET: Waehrend der Wiedergabe folgt
// der Ausschnitt der Marke, wenn sie den sichtbaren Bereich verlaesst; bei Pause wird
// NICHT gescrollt (sonst spraenge die Liste unter dem Nutzer weg, waehrend er klickt).

import { useEffect, useSyncExternalStore, type JSX, type RefObject } from 'react'

import { RENDER_PROFILE } from '../../shared/contracts/render-profile'
import {
  abonniereAbspielstand,
  holeAbspielstand,
  type Abspielstand,
} from '../gemeinsam/abspielposition'

/** Der Rand, ab dem die Marke als "aus dem Bild" gilt (px). */
const RAND_PX = 12

/** true, wenn die Marke den sichtbaren Bereich verlaesst (oder der Bereich 0 ist). */
export function sollMitscrollen(xPx: number, scrollLeft: number, breite: number): boolean {
  if (breite <= 0) return false
  return xPx < scrollLeft + RAND_PX || xPx > scrollLeft + breite - RAND_PX
}

/** Der neue Scroll-Stand: die Marke in der Mitte des Ausschnitts, nie negativ. */
export function zielScrollLeft(xPx: number, breite: number): number {
  return Math.max(0, Math.round(xPx - breite / 2))
}

export function AbspielMarke({
  pxProSekunde,
  scrollRef,
}: {
  pxProSekunde: number
  /** Der Scroll-Container der Zeitleiste (das Element mit `overflow-x`). */
  scrollRef: RefObject<HTMLDivElement | null>
}): JSX.Element {
  const stand: Abspielstand = useSyncExternalStore(
    abonniereAbspielstand,
    holeAbspielstand,
    holeAbspielstand,
  )
  const x = Math.max(0, Math.round((stand.frame / RENDER_PROFILE.fps) * pxProSekunde))

  useEffect(() => {
    if (!stand.laeuft) return
    const behaelter = scrollRef.current
    if (behaelter === null) return
    if (sollMitscrollen(x, behaelter.scrollLeft, behaelter.clientWidth)) {
      behaelter.scrollLeft = zielScrollLeft(x, behaelter.clientWidth)
    }
  }, [x, stand.laeuft, scrollRef])

  return (
    <div
      data-testid="zeitleiste-playhead"
      data-frame={stand.frame}
      data-laeuft={stand.laeuft ? 'ja' : 'nein'}
      title={`Abspielposition: Frame ${stand.frame}`}
      style={{
        position: 'absolute',
        left: x,
        top: 0,
        bottom: 0,
        width: 2,
        background: '#e5a94d',
        zIndex: 3,
        pointerEvents: 'none',
      }}
    />
  )
}
