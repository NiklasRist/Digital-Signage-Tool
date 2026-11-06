import { describe, expect, it } from 'vitest'

import {
  AUTOSCROLL_MAX_PX,
  AUTOSCROLL_RAND_PX,
  autoScrollSchritt,
  type ScrollKasten,
} from '../../src/renderer/composer/zeit-autoscroll'

// Die reine Regel des Auto-Scrolls (06.11.2026). Niklas: „beim drag and drop muss die
// zeileiste automatisch scrollable sein". Die Zeitleiste ist ein eigener horizontaler
// Scroll-Container; hier steht NUR, wie weit ein Bild scrollt - nicht, wer den Lauf treibt.

const KASTEN: ScrollKasten = { links: 100, rechts: 1100, oben: 700, unten: 800 }

describe('autoScrollSchritt', () => {
  it('scrollt in der Mitte nicht', () => {
    expect(autoScrollSchritt({ x: 600, y: 750 }, KASTEN)).toBe(0)
  })

  it('scrollt am linken Rand nach links, am rechten nach rechts', () => {
    expect(autoScrollSchritt({ x: 100, y: 750 }, KASTEN)).toBe(-AUTOSCROLL_MAX_PX)
    expect(autoScrollSchritt({ x: 1100, y: 750 }, KASTEN)).toBe(AUTOSCROLL_MAX_PX)
  })

  it('wird zur Mitte hin schwaecher - kein Sprung am Randbereich', () => {
    const knapp = autoScrollSchritt({ x: 101, y: 750 }, KASTEN)
    const halb = autoScrollSchritt({ x: 100 + AUTOSCROLL_RAND_PX / 2, y: 750 }, KASTEN)
    expect(knapp).toBeLessThan(0)
    expect(Math.abs(knapp)).toBeGreaterThanOrEqual(Math.abs(halb))
    expect(halb).toBeLessThan(0)
  })

  it('an der inneren Kante des Randbereichs ist Schluss', () => {
    expect(autoScrollSchritt({ x: 100 + AUTOSCROLL_RAND_PX, y: 750 }, KASTEN)).toBe(0)
    expect(autoScrollSchritt({ x: 1100 - AUTOSCROLL_RAND_PX, y: 750 }, KASTEN)).toBe(0)
  })

  it('ausserhalb links/rechts bleibt die Richtung erhalten (ueber den Rand ziehen)', () => {
    expect(autoScrollSchritt({ x: -500, y: 750 }, KASTEN)).toBe(-AUTOSCROLL_MAX_PX)
    expect(autoScrollSchritt({ x: 5000, y: 750 }, KASTEN)).toBe(AUTOSCROLL_MAX_PX)
  })

  it('ueber oder unter dem Kasten wird NICHT gescrollt', () => {
    expect(autoScrollSchritt({ x: 100, y: 699 }, KASTEN)).toBe(0)
    expect(autoScrollSchritt({ x: 1100, y: 801 }, KASTEN)).toBe(0)
  })

  it('unbrauchbare Zahlen und leere Spannen liefern 0', () => {
    expect(autoScrollSchritt({ x: Number.NaN, y: 750 }, KASTEN)).toBe(0)
    expect(autoScrollSchritt({ x: 100, y: Number.POSITIVE_INFINITY }, KASTEN)).toBe(0)
    expect(autoScrollSchritt({ x: 600, y: 750 }, { ...KASTEN, rechts: 100 })).toBe(0)
    expect(autoScrollSchritt({ x: 600, y: 750 }, KASTEN, 0)).toBe(0)
    expect(autoScrollSchritt({ x: 600, y: 750 }, KASTEN, 48, 0)).toBe(0)
  })
})
