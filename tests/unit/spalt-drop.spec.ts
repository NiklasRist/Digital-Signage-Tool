// Tests zu #412 - das Kanten-Modell (spalt-drop.ts) und seine Regeln.
// Die zwei verbindlichen Funktionen (#412-Signatur) UND die zwei gemeldeten Lese-Helfer
// werden je ohne DOM geprueft (Grenzfaelle: leere Liste, ausserhalb, Zeilen-Id).

import { describe, expect, it } from 'vitest'

import {
  baueEinfugeKanten,
  leseKantenIndex,
  liestReferenz,
  waehleKanteAus,
} from '../../src/renderer/composer/spalt-drop'

describe('baueEinfugeKanten (#412, verbindlich)', () => {
  it('die leere Liste hat GENAU EINE Kante: vor dem ersten Block (Index 0)', () => {
    expect(baueEinfugeKanten(0)).toEqual([0])
  })

  it('drei Blöcke haengen VIER Kanten an: vor, zweimal zwischen, nach dem letzten', () => {
    expect(baueEinfugeKanten(3)).toEqual([0, 1, 2, 3])
  })

  it('eine nicht-ganzzahlige oder negative Laenge faellt auf die eine Kante zurueck', () => {
    expect(baueEinfugeKanten(-1)).toEqual([0])
    expect(baueEinfugeKanten(2.5)).toEqual([0])
  })
})

describe('waehleKanteAus (#412, verbindlich)', () => {
  const kanten = baueEinfugeKanten(3)
  const breite = (index: number): number => (index === 0 ? 100 : 50)

  it('Kante 0 wird am linken Rand gemessen', () => {
    expect(waehleKanteAus(kanten, 0, breite)).toBe(0)
  })

  it('ausserhalb (vor 0, hinter der Gesamtbreite) gibt es KEINE Kante', () => {
    expect(waehleKanteAus(kanten, -1, breite)).toBeNull()
    // Gesamtbreite = 100 + 50 + 50 = 200; 201 liegt dahinter.
    expect(waehleKanteAus(kanten, 200.5, breite)).toBeNull()
  })

  it('die exakte Grenze zwischen zwei Blocks waehlt die linke der beiden Kanten', () => {
    expect(waehleKanteAus(kanten, 100, breite)).toBe(1)
  })

  it('mittig im Block liegend waehlt die naechste Grenze (Stichentscheid: links) oder rechts', () => {
    // 125: Kante 1 (100) ist 25 entfernt, Kante 2 (150) ebenfalls - links gewinnt.
    expect(waehleKanteAus(kanten, 124, breite)).toBe(1)
    // 126: rechts naeher.
    expect(waehleKanteAus(kanten, 126, breite)).toBe(2)
  })

  it('die letzte Kante wird exakt am Ende erreicht', () => {
    expect(waehleKanteAus(kanten, 200, breite)).toBe(3)
  })

  it('leere Kantenliste oder keine Zahl gibt keine Kante', () => {
    expect(waehleKanteAus([], 10, breite)).toBeNull()
    expect(waehleKanteAus(kanten, Number.NaN, breite)).toBeNull()
  })
})

describe('leseKantenIndex (#412, gemeldeter Lese-Helfer)', () => {
  it('liest die Nummer nur aus echten Kanten-Ids, Zeilen-Ids oder Nicht-Ziffern NICHT', () => {
    expect(leseKantenIndex('kante-0')).toBe(0)
    expect(leseKantenIndex('kante-12')).toBe(12)
    expect(leseKantenIndex('e1')).toBeNull()
    expect(leseKantenIndex('kante-')).toBeNull()
    expect(leseKantenIndex('kante-x')).toBeNull()
    expect(leseKantenIndex('kante--1')).toBeNull()
    expect(leseKantenIndex(42)).toBeNull()
    expect(leseKantenIndex(undefined)).toBeNull()
  })
})

describe('liestReferenz (#412, gemeldeter Lese-Helfer)', () => {
  it('liest die Referenz aus Datum { referenz }', () => {
    expect(liestReferenz({ referenz: 'a1' })).toBe('a1')
  })

  it('kein Objekt, fehlendes oder leeres Referenzfeld ist KEIN Neu-Drag', () => {
    expect(liestReferenz(undefined)).toBeNull()
    expect(liestReferenz(null)).toBeNull()
    expect(liestReferenz('a1')).toBeNull()
    expect(liestReferenz({})).toBeNull()
    expect(liestReferenz({ referenz: '' })).toBeNull()
    expect(liestReferenz({ referenz: '   ' })).toBeNull()
    expect(liestReferenz({ referenz: 42 })).toBeNull()
  })
})
