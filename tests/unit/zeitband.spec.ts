import { describe, expect, it } from 'vitest'

import { baueZeitachse, baueBandspur } from '../../src/renderer/composer/zeitband'

// #428 (docs/agents/428-zeitband-plan.md): die REINE Zeitband-Geometrie der Zeitleiste
// (Sekundenachse + Band-Spur). Ohne DOM pruefbar.

describe('baueZeitachse (#428)', () => {
  it('legt je Block ein Segment mit einem Tick je Sekunde', () => {
    const achse = baueZeitachse([
      { dauerSekunden: 3, breitePx: 24 },
      { dauerSekunden: 2, breitePx: 16 },
    ])

    expect(achse.map((segment) => segment.breitePx)).toEqual([24, 16])
    // Erster Block: Sekunden 0..3 (kumulativ ab 0).
    expect(achse[0]!.ticks.map((tick) => tick.sekunde)).toEqual([0, 1, 2, 3])
    // Zweiter Block setzt die Zaehlung fort: 3, 4, 5.
    expect(achse[1]!.ticks.map((tick) => tick.sekunde)).toEqual([3, 4, 5])
  })

  it('beschriftet jede fuenfte Sekunde', () => {
    const achse = baueZeitachse([{ dauerSekunden: 6, breitePx: 48 }])
    const labels = achse[0]!.ticks.filter((tick) => tick.beschriftet).map((tick) => tick.sekunde)
    expect(labels).toEqual([0, 5])
  })

  it('ein Block ohne bestimmbare Dauer bekommt keine Ticks', () => {
    const achse = baueZeitachse([{ dauerSekunden: null, breitePx: 64 }])
    expect(achse[0]!.ticks).toEqual([])
  })
})

describe('baueBandspur (#428)', () => {
  it('legt die Abschnitte ab Sekunde 0 aneinander (8 px/s)', () => {
    const spur = baueBandspur([{ dauer: 10 }, { dauer: 5 }], 60)
    expect(spur.segmente).toEqual([
      { startPx: 0, breitePx: 80 },
      { startPx: 80, breitePx: 40 },
    ])
  })

  it('meldet die Wiederholungen, wenn die Folge kuerzer als das Video ist (TK 9.2.8)', () => {
    expect(baueBandspur([{ dauer: 10 }, { dauer: 5 }], 60).wiederholungen).toBe(4)
    expect(baueBandspur([{ dauer: 10 }, { dauer: 5 }], 10).wiederholungen).toBe(1)
    expect(baueBandspur([], 60).wiederholungen).toBe(1)
  })
})
