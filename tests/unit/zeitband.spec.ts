import { describe, expect, it } from 'vitest'

import { baueZeitachse, baueBandspur, formatiereFrameZahl } from '../../src/renderer/composer/zeitband'

// #428 (docs/agents/428-zeitband-plan.md): die REINE Zeitband-Geometrie der Zeitleiste
// (Sekunden-/Frame-Achse + Band-Spur) samt Zoom. Ohne DOM pruefbar.

describe('formatiereFrameZahl (#428)', () => {
  it('schreibt Frames als mm:ss:ff (30 fps)', () => {
    expect(formatiereFrameZahl(0)).toBe('00:00:00')
    expect(formatiereFrameZahl(31)).toBe('00:01:01')
    expect(formatiereFrameZahl(190)).toBe('00:06:10')
    expect(formatiereFrameZahl(30 * 65)).toBe('01:05:00')
  })
})

describe('baueZeitachse (#428)', () => {
  it('legt je Block ein Segment mit Ticks im Frame-Schritt', () => {
    // Standard-Zoom 8 px/s: Tick-Schritt 30 Frames (1 s).
    const achse = baueZeitachse([{ dauerSekunden: 2, breitePx: 16 }], 8)
    expect(achse[0]!.breitePx).toBe(16)
    expect(achse[0]!.ticks.map((tick) => tick.text)).toEqual([
      '00:00:00',
      '00:01:00',
      '00:02:00',
    ])
  })

  it('bei hohem Zoom werden einzelne Frames sichtbar (Tick-Schritt 2)', () => {
    // 128 px/s: 30 Frames = 128 px; Schritt 2 Frames, beschriftet alle 15 (0,5 s).
    const achse = baueZeitachse([{ dauerSekunden: 1, breitePx: 128 }], 128)
    const ticks = achse[0]!.ticks
    expect(ticks.length).toBe(16) // 0,2,4,...,30
    expect(ticks[1]!.xPx).toBeCloseTo((2 / 30) * 128, 5)
    const labels = ticks.filter((tick) => tick.beschriftet).map((tick) => tick.text)
    expect(labels).toEqual(['00:00:00', '00:00:12', '00:00:24'])
  })

  it('ein Block ohne bestimmbare Dauer bekommt keine Ticks', () => {
    const achse = baueZeitachse([{ dauerSekunden: null, breitePx: 64 }], 8)
    expect(achse[0]!.ticks).toEqual([])
  })
})

describe('baueBandspur (#428)', () => {
  it('legt die Abschnitte ab Sekunde 0 aneinander (aktueller Zoom)', () => {
    const spur = baueBandspur([{ dauer: 10 }, { dauer: 5 }], 60, 8)
    expect(spur.segmente).toEqual([
      { startPx: 0, breitePx: 80 },
      { startPx: 80, breitePx: 40 },
    ])
  })

  it('meldet die Wiederholungen, wenn die Folge kuerzer als das Video ist (TK 9.2.8)', () => {
    expect(baueBandspur([{ dauer: 10 }, { dauer: 5 }], 60, 8).wiederholungen).toBe(4)
    expect(baueBandspur([{ dauer: 10 }, { dauer: 5 }], 10, 8).wiederholungen).toBe(1)
    expect(baueBandspur([], 60, 8).wiederholungen).toBe(1)
  })
})
