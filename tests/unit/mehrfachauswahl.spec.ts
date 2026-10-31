// Verhaltenstests zu #392 - die reine Auswahl-Logik.
//
// Geprueft werden die drei Bedienarten (Klick, Shift, Cmd/Strg), die
// Reihenfolge-Invariante aus TK 9.11.3/9.7.4 und die Bereinigung nach einem
// Projektwechsel. Die Ansichten (Liste/Zeitleiste) haben eigene Tests; hier steht
// nur die Rechnung, damit ein Fehler in der Bereichslogik nicht hinter DOM liegt.
import { describe, expect, it } from 'vitest'

import {
  LEERE_AUSWAHL,
  entferneAusgewaehlte,
  gleicheAuswahlAb,
  istInAuswahl,
  klickAuswahl,
  klickModusAus,
  type Auswahl,
} from '../../src/renderer/composer/mehrfachauswahl'

const REIHE = ['a', 'b', 'c', 'd', 'e'] as const

function auswahl(ids: string[], anker: string | null): Auswahl {
  return { ids, anker }
}

describe('klickModusAus', () => {
  it('Shift ist Bereich, Cmd und Strg schalten um, sonst Einzelklick', () => {
    expect(klickModusAus({ shiftKey: true, metaKey: false, ctrlKey: false })).toBe('bereich')
    expect(klickModusAus({ shiftKey: false, metaKey: true, ctrlKey: false })).toBe('umschalten')
    expect(klickModusAus({ shiftKey: false, metaKey: false, ctrlKey: true })).toBe('umschalten')
    expect(klickModusAus({ shiftKey: false, metaKey: false, ctrlKey: false })).toBe('einzeln')
  })
})

describe('klickAuswahl - Einzelklick', () => {
  it('waehlt genau ein Element und setzt den Anker', () => {
    expect(klickAuswahl(auswahl(['a', 'b'], 'a'), REIHE, 'c', 'einzeln')).toEqual(auswahl(['c'], 'c'))
  })

  it('macht aus einer Mehrfachauswahl eine Einzelauswahl', () => {
    expect(klickAuswahl(auswahl(['a', 'b', 'c'], 'a'), REIHE, 'e', 'einzeln')).toEqual(auswahl(['e'], 'e'))
  })
})

describe('klickAuswahl - Umschalten (Cmd/Strg)', () => {
  it('fuegt hinzu und haelt die IDs in Listenreihenfolge', () => {
    const nachher = klickAuswahl(auswahl(['d'], 'd'), REIHE, 'b', 'umschalten')
    expect(nachher.ids).toEqual(['b', 'd'])
    expect(nachher.anker).toBe('b')
  })

  it('entfernt ein bereits ausgewaehltes Element', () => {
    expect(klickAuswahl(auswahl(['a', 'c'], 'a'), REIHE, 'c', 'umschalten')).toEqual(auswahl(['a'], 'a'))
  })

  it('loescht den Anker nur, wenn er selbst abgewaehlt wird', () => {
    expect(klickAuswahl(auswahl(['a', 'c'], 'a'), REIHE, 'a', 'umschalten')).toEqual(auswahl(['c'], null))
    expect(klickAuswahl(auswahl(['a', 'c'], 'a'), REIHE, 'c', 'umschalten')).toEqual(auswahl(['a'], 'a'))
  })
})

describe('klickAuswahl - Bereich (Shift)', () => {
  it('waehlt vom Anker bis zum Ziel einschliesslich, vorwaerts', () => {
    expect(klickAuswahl(auswahl(['b'], 'b'), REIHE, 'd', 'bereich')).toEqual(auswahl(['b', 'c', 'd'], 'b'))
  })

  it('waehlt rueckwaerts in Listenreihenfolge', () => {
    expect(klickAuswahl(auswahl(['d'], 'd'), REIHE, 'b', 'bereich')).toEqual(auswahl(['b', 'c', 'd'], 'd'))
  })

  it('ohne Anker ist Shift ein Einzelklick', () => {
    expect(klickAuswahl(LEERE_AUSWAHL, REIHE, 'c', 'bereich')).toEqual(auswahl(['c'], 'c'))
  })

  it('mit verschwundenem Anker ist Shift ein Einzelklick', () => {
    expect(klickAuswahl(auswahl(['x'], 'x'), REIHE, 'c', 'bereich')).toEqual(auswahl(['c'], 'c'))
  })

  it('ersetzt eine bestehende Auswahl durch den neuen Bereich', () => {
    expect(klickAuswahl(auswahl(['a', 'e'], 'a'), REIHE, 'c', 'bereich')).toEqual(auswahl(['a', 'b', 'c'], 'a'))
  })

  it('Anker gleich Ziel bleibt eine Einzelauswahl', () => {
    expect(klickAuswahl(auswahl(['b'], 'b'), REIHE, 'b', 'bereich')).toEqual(auswahl(['b'], 'b'))
  })
})

describe('klickAuswahl - Grenzen', () => {
  it('eine unbekannte ID laesst die Auswahl unveraendert', () => {
    const vorher = auswahl(['a'], 'a')
    expect(klickAuswahl(vorher, REIHE, 'z', 'einzeln')).toBe(vorher)
    expect(klickAuswahl(vorher, REIHE, 'z', 'bereich')).toBe(vorher)
    expect(klickAuswahl(vorher, REIHE, 'z', 'umschalten')).toBe(vorher)
  })

  it('veraendert die Eingabe nicht', () => {
    const vorher = auswahl(['a'], 'a')
    klickAuswahl(vorher, REIHE, 'c', 'bereich')
    expect(vorher).toEqual(auswahl(['a'], 'a'))
  })
})

describe('gleicheAuswahlAb', () => {
  it('entfernt IDs, die nicht mehr in der Liste stehen', () => {
    expect(gleicheAuswahlAb(auswahl(['a', 'c', 'x'], 'x'), REIHE)).toEqual(auswahl(['a', 'c'], null))
  })

  it('haelt die Reihenfolge der Liste, nicht die Klickreihenfolge', () => {
    expect(gleicheAuswahlAb(auswahl(['d', 'b'], 'b'), REIHE)).toEqual(auswahl(['b', 'd'], 'b'))
  })

  it('gibt bei unveraenderter Auswahl DIESELBE Referenz zurueck', () => {
    const vorher = auswahl(['b', 'd'], 'b')
    expect(gleicheAuswahlAb(vorher, REIHE)).toBe(vorher)
  })

  it('ohne verbleibende IDs faellt auch der Anker', () => {
    expect(gleicheAuswahlAb(auswahl(['x'], 'x'), REIHE)).toEqual(auswahl([], null))
  })
})

describe('istInAuswahl', () => {
  it('prueft gegen die IDs', () => {
    expect(istInAuswahl(auswahl(['a', 'c'], 'a'), 'c')).toBe(true)
    expect(istInAuswahl(auswahl(['a', 'c'], 'a'), 'b')).toBe(false)
  })
})

describe('entferneAusgewaehlte', () => {
  it('entfernt nur die gewaehlten Eintraege und haelt die Reihenfolge', () => {
    const liste = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
    expect(entferneAusgewaehlte(liste, ['c', 'a']).map((e) => e.id)).toEqual(['b', 'd'])
  })

  it('laesst die Objektreferenzen der verbleibenden Eintraege unangetastet', () => {
    const b = { id: 'b' }
    const d = { id: 'd' }
    const liste = [{ id: 'a' }, b, { id: 'c' }, d]
    const rest = entferneAusgewaehlte(liste, ['a', 'c'])
    expect(rest[0]).toBe(b)
    expect(rest[1]).toBe(d)
  })

  it('ohne IDs bleibt die Liste inhaltlich gleich', () => {
    const liste = [{ id: 'a' }, { id: 'b' }]
    expect(entferneAusgewaehlte(liste, [])).toEqual(liste)
  })
})
