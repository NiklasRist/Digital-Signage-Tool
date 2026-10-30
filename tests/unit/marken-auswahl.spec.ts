// Tests zu #455 - auswahl.ts: die Suche der Marken-Klappliste.
//
// Dieselben Regeln wie `filtereProjekte` (Projektverwaltung): leere Suche liefert den
// Bestand UNVERAENDERT, Gross/Klein zaehlt nicht, Umlaute werden nicht gefaltet.
import { describe, expect, it } from 'vitest'

import { filtereMarken } from '../../src/renderer/marken-editor/auswahl'
import type { Marke } from '../../src/shared/contracts/marke'

function marke(id: string, name: string): Marke {
  return { id, name } as unknown as Marke
}

const BESTAND = [marke('1', 'Fitnessworld24'), marke('2', 'Partner Müller'), marke('3', 'Sommer')]

describe('filtereMarken (#455)', () => {
  it('leere Suche liefert den Bestand UNVERAENDERT - dieselbe Referenz', () => {
    expect(filtereMarken(BESTAND, '')).toBe(BESTAND)
    expect(filtereMarken(BESTAND, '   ')).toBe(BESTAND)
  })

  it('sucht im Namen, Gross/Klein zaehlt nicht', () => {
    expect(filtereMarken(BESTAND, 'fitness').map((m) => m.id)).toEqual(['1'])
    expect(filtereMarken(BESTAND, 'PARTNER').map((m) => m.id)).toEqual(['2'])
  })

  it('umschliessende Leerzeichen zaehlen nicht', () => {
    expect(filtereMarken(BESTAND, '  sommer  ').map((m) => m.id)).toEqual(['3'])
  })

  it('Umlaute werden NICHT gefaltet - "ue" findet "ü" nicht (ehrliche Luecke)', () => {
    expect(filtereMarken(BESTAND, 'mueller')).toEqual([])
    expect(filtereMarken(BESTAND, 'müller').map((m) => m.id)).toEqual(['2'])
  })

  it('kein Treffer: leere Liste, kein Wurf', () => {
    expect(filtereMarken(BESTAND, 'zzz')).toEqual([])
  })

  it('die Reihenfolge bleibt die des Bestands', () => {
    expect(filtereMarken([...BESTAND].reverse(), 'e').map((m) => m.id)).toEqual(['3', '2', '1'])
  })
})
