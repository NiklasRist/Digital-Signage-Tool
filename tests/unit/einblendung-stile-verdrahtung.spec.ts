// Tests zu #219 - einblendung-stile.ts, die VERDRAHTUNG mit der geteilten Rechnung.
//
// Zwei Nachweise, die die Rechnungs-Spec nicht stellen kann: berechneBandGeometrie
// wird GENAU EINmal je Aufruf mit GENAU dem uebergebenen Wert gerufen, bandY
// wird UNVERAENDERT uebernommen, bandHoehe ist RENDER_PROFILE.hoehe minus DIESEM
// Wert - und die sechs uebrigen erfundenen Zahlen tauchen NIRGENDS im Ergebnis
// auf (ENTSCHIEDEN 1). Dazu wird das Modul #239 ersetzt.
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

import { baueEinblendungStile } from '../../src/renderer/preview-player/einblendung-stile'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'

function ergebnisMitEindeutigenZahlen() {
  return {
    videoBereichBreite: 2001,
    videoBereichHöhe: 2002,
    videoBreite: 2003,
    videoHöhe: 2004,
    videoVersatzX: 2005,
    videoVersatzY: 2006,
    bandY: 2007,
  }
}

beforeEach(() => {
  doppel.aufrufe = []
  doppel.ergebnis = ergebnisMitEindeutigenZahlen()
})

describe('Der einzige Aufruf der geteilten Rechnung', () => {
  it('ruft berechneBandGeometrie GENAU EINmal je Aufruf, mit GENAU dem uebergebenen Wert', () => {
    baueEinblendungStile(162)
    expect(doppel.aufrufe).toEqual([162])
    baueEinblendungStile(Number.NaN)
    expect(doppel.aufrufe).toEqual([162, Number.NaN])
  })
})

describe('bandY unverändert; die uebrigen sechs Felder NICHT gelesen', () => {
  it('bandY = 2007 unverändert; bandHoehe = RENDER_PROFILE.hoehe - 2007', () => {
    const stile = baueEinblendungStile(162)
    expect(stile.bandY).toBe(2007)
    expect(stile.bandHöhe).toBe(RENDER_PROFILE.hoehe - 2007)
  })

  it('die sechs erfundenen Zahlen tauchen NIRGENDS im Ergebnis auf', () => {
    const stile = baueEinblendungStile(162)
    const alleWerte = [
      stile.bandY, stile.bandHöhe, stile.bandBreite,
    ]
    for (const wert of alleWerte) {
      for (const erfunden of [2001, 2002, 2003, 2004, 2005, 2006]) {
        expect(wert).not.toBe(erfunden)
      }
    }
    expect(Object.values(stile)).toHaveLength(3)
  })
})
