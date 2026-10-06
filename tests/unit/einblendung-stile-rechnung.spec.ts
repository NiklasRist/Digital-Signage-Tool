// Tests zu #219 - einblendung-stile.ts, die REINE Uebernahme (ohne Browser, ohne Doppel).
//
// Pflicht-Testfaelle aus dem Issue (162 ist die eingebaut-e Vorlage, 200 und 204
// die Kontrollhoehen); der Eigenschafts-Test laeuft ueber ALLE geraden Hoehen.
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

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

describe('Quelldatei-Verbote (Grep-Probe, code ohne Kommentare)', () => {
  const quelle = readFileSync(
    new URL('../../src/renderer/preview-player/einblendung-stile.ts', import.meta.url),
    'utf8',
  )
  const code = quelle
    .split('\n')
    .filter((z) => {
      const t = z.trim()
      return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
    })
    .join('\n')

  it('kein Math., kein Zahlenliteral, kein Multiplizieren/Dividieren, GENAU EINE Subtraktion, keine split-Felder', () => {
    expect(code).not.toContain('Math.')
    expect(code).not.toMatch(/\d/)
    // Zeichenketten (Import-Pfade) tragen Schraegstriche ohne arithmetische Bedeutung:
    const ohneStrings = code.replace(/'[^']*'/g, "''")
    expect(ohneStrings).not.toMatch(/\*/)
    expect(ohneStrings).not.toMatch(/\//)
    const subtraktionen = ohneStrings.match(/-/g) ?? []
    expect(subtraktionen).toHaveLength(1)
    expect(ohneStrings).toMatch(/RENDER_PROFILE\.hoehe - \w+\.bandY/)
    // ENTSCHIEDEN 1: die sechs split-Felder kommen in diesen Dateien NICHT vor
    // (die Probe sieht den Code, nicht zum Vertragsnamen einer Kommentierung).
    for (const feld of [
      'videoBreite', 'videoHöhe', 'videoVersatzX', 'videoVersatzY',
      'videoBereichBreite', 'videoBereichHöhe',
    ]) {
      expect(code).not.toContain(feld)
    }
  })

  it('kein JSX, kein react-Import (die Datei ist rein; ihre Tests laufen ohne Browser)', () => {
    expect(code).not.toContain('react')
    expect(code).not.toContain('<')
  })
})
