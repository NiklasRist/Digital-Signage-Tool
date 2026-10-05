// Tests zu #218 - split-stile.ts, die VERDRAHTUNG mit der geteilten Rechnung.
//
// Zwei Nachweise, die die Rechnungs-Spec nicht stellen kann: berechneBandGeometrie
// wird GENAU EINMAL je Aufruf und mit GENAU dem uebergebenen Wert gerufen, und
// alle sieben Geometrie-Felder landen UNVERAENDERT an ihren Stellen (Doppel mit
// eindeutig unterscheidbaren Zahlen). Dazu wird das Modul #239 ersetzt.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const doppel = vi.hoisted(() => ({
  aufrufe: [] as number[],
  ergebnis: null as import('../../src/shared/band-geometrie').BandGeometrie | null,
}))

vi.mock('../../src/shared/band-geometrie', () => ({
  berechneBandGeometrie: (höhe: number) => {
    doppel.aufrufe.push(höhe)
    return doppel.ergebnis
  },
}))

import { baueSplitStile } from '../../src/renderer/preview-player/split-stile'

function ergebnisMitEindeutigenZahlen() {
  return {
    videoBereichBreite: 1001,
    videoBereichHöhe: 1002,
    videoBreite: 1003,
    videoHöhe: 1004,
    videoVersatzX: 1005,
    videoVersatzY: 1006,
    bandY: 1007,
  }
}

beforeEach(() => {
  doppel.aufrufe = []
  doppel.ergebnis = ergebnisMitEindeutigenZahlen()
})

describe('Der einzige Aufruf der geteilten Rechnung', () => {
  it('ruft berechneBandGeometrie GENAU EINMAL je Aufruf, mit GENAU dem uebergebenen Wert', () => {
    baueSplitStile(234)
    expect(doppel.aufrufe).toEqual([234])
    baueSplitStile(Number.NaN)
    expect(doppel.aufrufe).toEqual([234, Number.NaN])
  })
})

describe('Alle sieben Felder erscheinen UNVERAENDERT (Doppel mit eindeutigen Zahlen)', () => {
  it('videoRahmen = Versatz X/Y, Breite, Hoehe - ohne Umrechnung', () => {
    const stile = baueSplitStile(162)
    expect(stile.videoRahmen).toEqual({ x: 1005, y: 1006, breite: 1003, höhe: 1004 })
  })

  it('videoBereich = (0, 0, videoBereichBreite, videoBereichHoehe)', () => {
    const stile = baueSplitStile(162)
    expect(stile.videoBereich).toEqual({ x: 0, y: 0, breite: 1001, höhe: 1002 })
  })

  it('band = (0, bandY, videoBereichBreite, RENDER_PROFILE.hoehe - bandY)', () => {
    const stile = baueSplitStile(162)
    expect(stile.band).toEqual({ x: 0, y: 1007, breite: 1001, höhe: 1080 - 1007 })
  })

  it('restflaecheBreite = videoVersatzX', () => {
    expect(baueSplitStile(162).restflaecheBreite).toBe(1005)
  })
})
