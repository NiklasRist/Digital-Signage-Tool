// Tests zu #218 - split-stile.ts, die REINE Rechnung (ohne Browser, ohne Doppel).
//
// Die Zahlen stammen aus TK 9.2.8 und #239: 162 ist die eingebaute Vorlage
// (geht zufaellig glatt auf), 200 verlangt das Abrunden ohne glatten Ausgang,
// 204 ist der Fall, in dem die Vierer-Regel BEISST (1557 -> 1556, x gerade).
// Der Eigenschafts-Test laeuft ueber ALLE geraden Hoehen 2..1078 - nicht nur
// ueber die Beispiele.
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'
import { baueSplitStile } from '../../src/renderer/preview-player/split-stile'

describe('Nachgerechnete Belege (Pflicht-Testfaelle, TK 9.2.8)', () => {
  it('H = 162: die eingebaute Vorlage, die Abrundung aendert NICHTS', () => {
    const stile = baueSplitStile(162)
    expect(stile.videoRahmen).toEqual({ x: 144, y: 0, breite: 1632, höhe: 918 })
    expect(stile.videoBereich).toEqual({ x: 0, y: 0, breite: 1920, höhe: 918 })
    expect(stile.band).toEqual({ x: 0, y: 918, breite: 1920, höhe: 162 })
    expect(stile.restflaecheBreite).toBe(144)
  })

  it('H = 200: 880 x 16/9 = 1564,44... - ohne Rundung keine ganze Zahl', () => {
    const stile = baueSplitStile(200)
    expect(stile.videoRahmen.breite).toBe(1564)
    expect(stile.videoRahmen.x).toBe(178)
    expect(stile.band.y).toBe(880)
    expect(stile.band.höhe).toBe(200)
    expect(stile.restflaecheBreite).toBe(178)
  })

  it('H = 204: hier beisst die Vierer-Regel - blosses Abschneiden gaebe 1557 und x = 181,5', () => {
    const stile = baueSplitStile(204)
    expect(stile.videoRahmen.breite).toBe(1556)
    expect(stile.videoRahmen.x).toBe(182)
    expect(stile.band.y).toBe(876)
    expect(stile.band.höhe).toBe(204)
    expect(stile.restflaecheBreite).toBe(182)
  })
})

describe('Eigenschafts-Test ueber ALLE geraden Hoehen 2..1078', () => {
  const geradenHoehen: number[] = []
  for (let h = 2; h <= 1078; h += 2) {
    geradenHoehen.push(h)
  }

  it('videoRahmen.breite durch 4 teilbar; x ganzzahlig UND gerade; band.y === videoBereich.hoehe; band.hoehe === H; restflaeche === x; breite + 2 x restflaeche === bereich.breite', () => {
    expect(geradenHoehen.length).toBe(539)
    for (const h of geradenHoehen) {
      const stile = baueSplitStile(h)
      expect(stile.videoRahmen.breite % 4).toBe(0)
      expect(Number.isInteger(stile.videoRahmen.x)).toBe(true)
      expect(stile.videoRahmen.x % 2).toBe(0)
      expect(stile.videoRahmen.y).toBe(0)
      expect(stile.band.y).toBe(stile.videoBereich.höhe)
      expect(stile.band.höhe).toBe(h)
      expect(stile.restflaecheBreite).toBe(stile.videoRahmen.x)
      expect(stile.videoRahmen.breite + 2 * stile.restflaecheBreite).toBe(
        stile.videoBereich.breite,
      )
    }
  })

  it('nie aufgerundet: videoRahmen.breite <= videoBereich.hoehe x 16/9 (die Pruefung rechnet, die gepruefte Datei nicht)', () => {
    for (const h of geradenHoehen) {
      const stile = baueSplitStile(h)
      expect(stile.videoRahmen.breite).toBeLessThanOrEqual(
        (stile.videoBereich.höhe * 16) / 9,
      )
    }
  })

  it('die Bandhoehe ist ueberall RENDER_PROFILE.hoehe - band.y (Rueckgewinnung, ENTSCHIEDEN 2)', () => {
    for (const h of geradenHoehen) {
      const stile = baueSplitStile(h)
      expect(stile.band.höhe).toBe(RENDER_PROFILE.hoehe - stile.band.y)
    }
  })
})

describe('Totalitaet: unbrauchbare Hoehen werfen NICHT (der preview-player prueft nichts)', () => {
  it('NaN, -4 und 1080 liefern Werte statt eines Wurfs', () => {
    expect(() => baueSplitStile(Number.NaN)).not.toThrow()
    expect(() => baueSplitStile(-4)).not.toThrow()
    expect(() => baueSplitStile(1080)).not.toThrow()
    expect(Number.isNaN(baueSplitStile(Number.NaN).band.höhe)).toBe(true)
  })
})

describe('Quelldatei-Verbote (Grep-Probe, code ohne Kommentare)', () => {
  const quelle = readFileSync(
    new URL('../../src/renderer/preview-player/split-stile.ts', import.meta.url),
    'utf8',
  )
  const code = quelle
    .split('\n')
    .filter((z) => {
      const t = z.trim()
      return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
    })
    .join('\n')

  it('kein Math., kein Zahlenliteral ausser 0, kein Multiplizieren/Dividieren, GENAU EINE Subtraktion', () => {
    expect(code).not.toContain('Math.')
    const literale = code.match(/\d+/g) ?? []
    for (const literal of literale) {
      expect(Number(literal)).toBe(0)
    }
    // Zeichenketten (Import-Pfade wie '../../shared/...') tragen Schraegstriche
    // ohne arithmetische Bedeutung; die Probe zielt auf Operatoren in Code-Zeilen.
    const ohneStrings = code.replace(/'[^']*'/g, "''")
    expect(ohneStrings).not.toMatch(/\*/)
    expect(ohneStrings).not.toMatch(/\//)
    // GENAU EINE Subtraktion, und zwar RENDER_PROFILE.hoehe - <geometrie>.bandY:
    const subtraktionen = ohneStrings.match(/-/g) ?? []
    expect(subtraktionen).toHaveLength(1)
    expect(ohneStrings).toMatch(/RENDER_PROFILE\.hoehe - \w+\.bandY/)
  })

  it('kein JSX, kein react-Import (die Datei ist rein; ihre Tests laufen ohne Browser)', () => {
    expect(code).not.toContain('react')
    expect(code).not.toContain('<')
  })
})
