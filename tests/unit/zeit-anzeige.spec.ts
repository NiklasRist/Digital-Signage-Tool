// Tests zu #443 - zeit-anzeige.ts: die bildgenaue Position des Zeiger-Tooltips.
//
// Der Test rechnet mit RENDER_PROFILE.fps, nie mit einem Literal-30: Eine andere
// Bildrate ist eine Aenderung des Profils (TK 9.2.4), kein Testfehler.

import { describe, expect, it } from 'vitest'

import { formatierePosition } from '../../src/renderer/preview-player/zeit-anzeige'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'

const fps = RENDER_PROFILE.fps
const zwei = (wert: number): string => String(wert).padStart(2, '0')

describe('#443 formatierePosition (mm:ss:ff)', () => {
  it('Frame 0 ist 00:00:00', () => {
    expect(formatierePosition(0)).toBe('00:00:00')
  })

  it('der Frame INNERHALB der Sekunde steht in ff', () => {
    expect(formatierePosition(1)).toBe(`00:00:${zwei(1)}`)
    expect(formatierePosition(fps - 1)).toBe(`00:00:${zwei(fps - 1)}`)
  })

  it('genau eine Sekunde springt in ss', () => {
    expect(formatierePosition(fps)).toBe('00:01:00')
  })

  it('Minuten und Sekunden zugleich', () => {
    expect(formatierePosition(fps * 61 + 7)).toBe(`01:01:${zwei(7)}`)
  })

  it('Minuten wachsen ueber 99 hinaus, statt in Stunden umzurechnen', () => {
    expect(formatierePosition(fps * 60 * 100)).toBe('100:00:00')
  })

  it('unbrauchbar oder negativ zeigt 00:00:00 (am wenigsten Behauptung)', () => {
    expect(formatierePosition(-5)).toBe('00:00:00')
    expect(formatierePosition(Number.NaN)).toBe('00:00:00')
    expect(formatierePosition(Number.POSITIVE_INFINITY)).toBe('00:00:00')
  })

  it('rundet ab: 1.9 Frames sind Frame 1', () => {
    expect(formatierePosition(1.9)).toBe(`00:00:${zwei(1)}`)
  })
})
