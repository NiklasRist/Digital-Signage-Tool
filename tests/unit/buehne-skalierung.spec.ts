// Logik-Tests zu #212 - die reine Rechnung (buehne-skalierung.ts, node, ohne Browser).
//
// Die Datei darf kein JSX und keinen react-Import tragen (DoD-Grep) - deshalb laufen
// diese Tests vollstaendig ohne Browser-Umgebung. Gemessen werden die ausgeschriebene
// Rechnung des Issues, die Nullfaelle und die Eigenschaft, dass das Raster nie herausragt.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'
import { berechneBuehnenmaße } from '../../src/renderer/preview-player/buehne-skalierung'

describe('berechneBuehnenmaße – DoD-Faelle', () => {
  it('liefert bei 1920×1080 das Raster 1:1 (DoD)', () => {
    expect(berechneBuehnenmaße(1920, 1080)).toEqual({
      skalierung: 1,
      breite: 1920,
      höhe: 1080,
      versatzX: 0,
      versatzY: 0,
    })
  })

  it('liefert bei 960×540 die Haelfte (DoD)', () => {
    expect(berechneBuehnenmaße(960, 540)).toEqual({
      skalierung: 0.5,
      breite: 960,
      höhe: 540,
      versatzX: 0,
      versatzY: 0,
    })
  })

  it('begrenzt bei breitem Kasten die Hoehe und zentriert seitlich (DoD)', () => {
    expect(berechneBuehnenmaße(1920, 540)).toEqual({
      skalierung: 0.5,
      breite: 960,
      höhe: 540,
      versatzX: 480,
      versatzY: 0,
    })
  })

  it('begrenzt bei hohem Kasten die Breite und zentriert oben (DoD)', () => {
    expect(berechneBuehnenmaße(960, 1080)).toEqual({
      skalierung: 0.5,
      breite: 960,
      höhe: 540,
      versatzX: 0,
      versatzY: 270,
    })
  })

  it('vergroessert ohne Deckel ueber das Raster hinaus (DoD)', () => {
    expect(berechneBuehnenmaße(3840, 2160)).toEqual({
      skalierung: 2,
      breite: 3840,
      höhe: 2160,
      versatzX: 0,
      versatzY: 0,
    })
  })
})

describe('berechneBuehnenmaße – Nullfaelle (ENTSCHIEDEN 3)', () => {
  it('liefert bei 0,0, negativen, NaN- und Infinity-Werten lauter Nullen und wirft nicht (DoD)', () => {
    for (const [b, h] of [
      [0, 0],
      [-5, 100],
      [100, -5],
      [Number.NaN, 100],
      [100, Number.NaN],
      [Number.POSITIVE_INFINITY, 100],
      [100, Number.POSITIVE_INFINITY],
    ] as const) {
      expect(berechneBuehnenmaße(b, h)).toEqual({
        skalierung: 0,
        breite: 0,
        höhe: 0,
        versatzX: 0,
        versatzY: 0,
      })
    }
  })
})

describe('berechneBuehnenmaße – Eigenschaften (DoD)', () => {
  it('laesst das Raster nie herausragen: breite <= aussenBreite, hoehe <= aussenHoehe (DoD)', () => {
    // Eine Stichprobe quer ueber Seitenverhaeltnisse und Groessenordnungen.
    const kaesten: ReadonlyArray<readonly [number, number]> = [
      [1920, 1080],
      [960, 540],
      [1920, 540],
      [960, 1080],
      [3840, 2160],
      [800, 600],
      [100, 100],
      [4096, 2160],
      [640, 480],
    ]
    for (const [aussenBreite, aussenHöhe] of kaesten) {
      const maße = berechneBuehnenmaße(aussenBreite, aussenHöhe)
      expect(maße.breite).toBeLessThanOrEqual(aussenBreite + 1e-9)
      expect(maße.höhe).toBeLessThanOrEqual(aussenHöhe + 1e-9)
      expect(maße.skalierung).toBeGreaterThan(0)
    }
  })

  it('rechnet aus den Profil-Maßen, nicht aus festen 1920/1080-Literalen (Verbot)', () => {
    const breit = berechneBuehnenmaße(RENDER_PROFILE.breite * 2, RENDER_PROFILE.hoehe * 2)
    expect(breit.breite).toBe(RENDER_PROFILE.breite * 2)
  })
})

describe('DoD-Grep-Proben (buehne-skalierung.ts, nur Code - Kommentarzeilen raus)', () => {
  const CODE = readFileSync('src/renderer/preview-player/buehne-skalierung.ts', 'utf8')
    .split('\n')
    .filter((zeile) => {
      const getrimmt = zeile.trim()
      return (
        !getrimmt.startsWith('//') &&
        !getrimmt.startsWith('/*') &&
        !getrimmt.startsWith('*') &&
        getrimmt !== ''
      )
    })
    .join('\n')

  it('enthaelt kein JSX und keinen react-Import (DoD)', () => {
    expect(CODE).not.toContain('react')
    expect(CODE).not.toContain('JSX')
  })

  it('rundet nirgends und kennt keine Literale 1920/1080 (Verbot)', () => {
    for (const verboten of ['Math.round', 'Math.floor', 'Math.ceil', 'toFixed', '1920', '1080']) {
      expect(CODE, verboten).not.toContain(verboten)
    }
  })

  it('verwendet das RENDER_PROFILE statt eigener Zahlen (DoD)', () => {
    expect(CODE).toContain('RENDER_PROFILE.breite')
    expect(CODE).toContain('RENDER_PROFILE.hoehe')
  })
})