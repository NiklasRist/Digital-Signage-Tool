// [shared] Die Regeln der Bildaufbereitung (13.11.2026, FA-28 / TK 9.21)
//
// Geprueft wird die EINE Regelquelle: Grenzen, Normalisierung und der Bestands-Schluessel.
// Die Rechnung selbst liegt in `tests/unit/aufbereiten.spec.ts` - hier geht es um die
// Zusagen, die Main, Editor und Zeichnen gemeinsam brauchen:
//   1. Unbrauchbares wird geklemmt und gerundet, nie still verworfen.
//   2. `0` heisst in jedem Feld dasselbe: nichts tun - und wird nicht gespeichert.
//   3. Neutral heisst: der Schluessel ist die nackte Asset-ID (byte-gleich zu vorher).
//   4. Der Schluessel ist stabil: gleicher Wert -> gleicher Schluessel, anderer Wert ->
//      anderer Schluessel. Sonst zeigte die Vorschau ein Bild, das nicht zum Entwurf passt.

import { describe, expect, it } from 'vitest'

import {
  AUFBEREITUNG_GRENZEN,
  AUFBEREITUNG_SCHRITTE,
  istAufbereitungNeutral,
  motivSchluessel,
  normalisiereAufbereitung,
} from '../../src/shared/aufbereitung'

describe('normalisiereAufbereitung (FA-28)', () => {
  it('klemmt auf die Grenzen und rundet', () => {
    expect(normalisiereAufbereitung({ helligkeit: 250, kontrast: -250, schaerfe: 400 })).toEqual({
      helligkeit: 100,
      kontrast: -100,
      schaerfe: 100,
    })
    expect(normalisiereAufbereitung({ helligkeit: 12.6 })).toEqual({ helligkeit: 13 })
  })

  it('verwirft Unbrauchbares, statt es zu erfinden', () => {
    expect(normalisiereAufbereitung(null)).toBeNull()
    expect(normalisiereAufbereitung('30')).toBeNull()
    expect(normalisiereAufbereitung([30])).toBeNull()
    expect(normalisiereAufbereitung({ helligkeit: 'viel', kontrast: Number.NaN })).toBeNull()
  })

  it('0 ist kein gespeicherter Zustand - in JEDEM Feld', () => {
    expect(normalisiereAufbereitung({ helligkeit: 0, kontrast: 0, schaerfe: 0 })).toBeNull()
    // Ein einzelner Nullwert faellt weg, die anderen bleiben.
    expect(normalisiereAufbereitung({ helligkeit: 0, kontrast: 25 })).toEqual({ kontrast: 25 })
  })

  it('laesst nur die drei bekannten Felder stehen', () => {
    expect(
      normalisiereAufbereitung({ helligkeit: 10, unbekannt: 99, kontrast: null, schaerfe: 5 }),
    ).toEqual({ helligkeit: 10, schaerfe: 5 })
  })
})

describe('istAufbereitungNeutral (FA-28)', () => {
  it('sagt fuer fehlend, null und lauter Nullen dasselbe', () => {
    expect(istAufbereitungNeutral(undefined)).toBe(true)
    expect(istAufbereitungNeutral(null)).toBe(true)
    expect(istAufbereitungNeutral({})).toBe(true)
    expect(istAufbereitungNeutral({ helligkeit: 0, schaerfe: 0 })).toBe(true)
    expect(istAufbereitungNeutral({ schaerfe: 1 })).toBe(false)
  })
})

describe('motivSchluessel (FA-28, TK 9.21.4)', () => {
  it('ist ohne Aufbereitung GENAU die Asset-ID', () => {
    expect(motivSchluessel('asset-1')).toBe('asset-1')
    expect(motivSchluessel('asset-1', null)).toBe('asset-1')
    expect(motivSchluessel('asset-1', { helligkeit: 0, kontrast: 0, schaerfe: 0 })).toBe('asset-1')
  })

  it('traegt jeden gesetzten Wert im Schluessel', () => {
    expect(motivSchluessel('a', { helligkeit: 30 })).toBe('a#h30')
    expect(motivSchluessel('a', { helligkeit: -30, schaerfe: 10 })).toBe('a#h-30|s10')
    expect(motivSchluessel('a', { kontrast: 5 })).toBe('a#k5')
  })

  it('gibt fuer denselben Wert denselben und fuer einen anderen Wert einen anderen Schluessel', () => {
    const a = motivSchluessel('a', { helligkeit: 10, kontrast: 20 })
    const b = motivSchluessel('a', { kontrast: 20, helligkeit: 10 })
    const c = motivSchluessel('a', { helligkeit: 10, kontrast: 21 })
    expect(a).toBe(b)
    expect(a).not.toBe(c)
    // Aufbereitung an gegen Aufbereitung aus sind zwei Motive.
    expect(motivSchluessel('a', { helligkeit: 10 })).not.toBe(motivSchluessel('a'))
  })

  it('kennt den dritten Parameter schon (FA-29 setzt ihn)', () => {
    expect(motivSchluessel('a', null, true)).toBe('a#f')
    expect(motivSchluessel('a', { schaerfe: 5 }, true)).toBe('a#s5|f')
  })
})

describe('die Reihenfolge ist EINE Quelle (FA-28/FA-29, TK 9.21.4)', () => {
  it('nennt die vier Schritte in der festgelegten Folge', () => {
    // SEIT 13.11.2026 (FA-29): „Freistellen → Helligkeit → Kontrast → Schaerfe". Die
    // drei anderen stehen unveraendert dahinter - der Schritt kam VORNE dazu.
    expect(AUFBEREITUNG_SCHRITTE).toEqual(['freistellen', 'helligkeit', 'kontrast', 'schaerfe'])
  })

  it('haelt die Grenzen aus dem Vertrag', () => {
    expect(AUFBEREITUNG_GRENZEN).toEqual({
      helligkeit: { min: -100, max: 100 },
      kontrast: { min: -100, max: 100 },
      schaerfe: { min: 0, max: 100 },
    })
  })
})
