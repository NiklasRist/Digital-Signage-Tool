// Tests zu #219 - einblendung-stile.ts, die REINE Uebernahme (ohne Browser, ohne Doppel).
//
// Pflicht-Testfaelle aus dem Issue (162 ist die eingebaut-e Vorlage, 200 und 204
// die Kontrollhoehen); der Eigenschafts-Test laeuft ueber ALLE geraden Hoehen.
import { describe, expect, it, vi } from 'vitest'

import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'
import { baueEinblendungStile } from '../../src/renderer/preview-player/einblendung-stile'

describe('Nachgerechnete Belege (Pflicht-Testfaelle)', () => {
  it('H = 162', () => {
    expect(baueEinblendungStile(162)).toEqual({ bandY: 918, bandHöhe: 162, bandBreite: 1920 })
  })
  it('H = 200', () => {
    expect(baueEinblendungStile(200)).toEqual({ bandY: 880, bandHöhe: 200, bandBreite: 1920 })
  })
  it('H = 204', () => {
    expect(baueEinblendungStile(204)).toEqual({ bandY: 876, bandHöhe: 204, bandBreite: 1920 })
  })
})

describe('Eigenschafts-Test ueber ALLE geraden Hoehen 2..1078', () => {
  const geradenHoehen: number[] = []
  for (let h = 2; h <= 1078; h += 2) {
    geradenHoehen.push(h)
  }

  it('bandY + bandHoehe === RENDER_PROFILE.hoehe; bandHoehe === H; bandBreite === RENDER_PROFILE.breite', () => {
    for (const h of geradenHoehen) {
      const stile = baueEinblendungStile(h)
      expect(stile.bandY + stile.bandHöhe).toBe(RENDER_PROFILE.hoehe)
      expect(stile.bandHöhe).toBe(h)
      expect(stile.bandBreite).toBe(RENDER_PROFILE.breite)
    }
  })
})

describe('Totalitaet: unbrauchbare Hoehen werfen NICHT', () => {
  it('NaN, -4 und 1080 liefern Werte statt eines Wurfs', () => {
    expect(() => baueEinblendungStile(Number.NaN)).not.toThrow()
    expect(() => baueEinblendungStile(-4)).not.toThrow()
    expect(() => baueEinblendungStile(1080)).not.toThrow()
    expect(Number.isNaN(baueEinblendungStile(Number.NaN).bandHöhe)).toBe(true)
  })
})

// ENTSCHIEDEN 2: Die Bandhoehe wird aus bandY zurueckgewonnen und NICHT aus dem
// Eingabeparameter uebernommen. Bei der echten geteilten Rechnung sind beide Wege
// heute gleich (bandY ist 1080 - H) - der Unterschied ist nur mit einer Geometrie
// sichtbar, die nicht 1080 - H liefert. Genau die wird hier untergeschoben: Wer
// spaeter `bandHöhe: höhe` schreibt, faellt hier auf, nicht erst am Fernseher.
describe('die Bandhoehe stammt aus bandY, nicht aus dem Parameter (ENTSCHIEDEN 2)', () => {
  it('rechnet RENDER_PROFILE.hoehe - bandY, auch wenn bandY nicht 1080 - H ist', async () => {
    vi.resetModules()
    vi.doMock('../../src/shared/band-geometrie', () => ({
      berechneBandGeometrie: () => ({
        videoBereichBreite: 1920,
        videoBereichHöhe: 900,
        videoBreite: 1600,
        videoHöhe: 900,
        videoVersatzX: 160,
        videoVersatzY: 0,
        bandY: 900,
      }),
    }))

    const frisch = await import('../../src/renderer/preview-player/einblendung-stile')
    expect(frisch.baueEinblendungStile(162)).toEqual({
      bandY: 900,
      bandHöhe: 180,
      bandBreite: 1920,
    })

    vi.doUnmock('../../src/shared/band-geometrie')
    vi.resetModules()
  })
})
