// Tests zu #437 - unterbrechungs-aufnahme.ts (die reine Bedien-Fachlichkeit der
// Unterbrechungen). Krumme Werte, keine glatten Aufgaenge.
import { describe, expect, it } from 'vitest'

import {
  entferneUnterbrechung,
  fuegeUnterbrechungEin,
  istVollflaechigeAktion,
  spieleZeitBeiSequenzzeit,
  unterbrechungsMarken,
  verschiebeUnterbrechung,
  videoSekunden,
} from '../../src/renderer/composer/unterbrechungs-aufnahme'
import type { Listenelement, Unterbrechung } from '../../src/shared/contracts/project'
import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Vorlage } from '../../src/shared/contracts/vorlage'

function u(zeitstelle: number, aktionRef: string, dauer: number): Unterbrechung {
  return { zeitstelle, aktionRef, dauer }
}

function element(teil: Partial<Listenelement> = {}): Listenelement {
  return {
    id: 'e-1', art: 'video', ref: 'asset-1', dauer: null,
    trimStart: 2.53, trimEnde: 12.53, einblendung: null, unterbrechungen: [],
    ...teil,
  }
}

function aktion(vorlagenId: string): Aktion {
  return {
    id: 'a-1', titel: 'A', beschreibung: null, preis: null, bildRef: null,
    cta: null, standardDauer: null, vorlagenId, markeId: 'm1', akzentfarbe: null,
  }
}

function vorlage(id: string, art: 'vollflaeche' | 'split' | 'einblendung'): Vorlage {
  return { id, name: id, art, höhe: art === 'vollflaeche' ? null : 120, parent: null, eingebaut: true, zonen: [] }
}

describe('istVollflaechigeAktion (#437)', () => {
  const vorlagen = [vorlage('v-voll', 'vollflaeche'), vorlage('v-split', 'split'), vorlage('v-ein', 'einblendung')]
  it('vollflaeche -> true (Unterbrechung); split/einblendung -> false (Band)', () => {
    expect(istVollflaechigeAktion(aktion('v-voll'), vorlagen)).toBe(true)
    expect(istVollflaechigeAktion(aktion('v-split'), vorlagen)).toBe(false)
    expect(istVollflaechigeAktion(aktion('v-ein'), vorlagen)).toBe(false)
  })
  it('unbekannte Vorlage -> false (Band, bisheriges Verhalten)', () => {
    expect(istVollflaechigeAktion(aktion('gibt-es-nicht'), vorlagen)).toBe(false)
  })
})

describe('videoSekunden (#437)', () => {
  it('trimEnde - trimStart; unbrauchbare Werte -> null', () => {
    expect(videoSekunden(element())).toBeCloseTo(10, 10)
    expect(videoSekunden(element({ trimEnde: 2.53 }))).toBeNull()
    expect(videoSekunden(element({ trimStart: null }))).toBeNull()
    expect(videoSekunden(element({ trimStart: -1 }))).toBeNull()
  })
})

describe('unterbrechungsMarken (#437)', () => {
  it('startSekunden = zeitstelle + Summe der Dauern davor', () => {
    const e = element({ unterbrechungen: [u(2, 'a', 1.5), u(5, 'b', 2)] })
    expect(unterbrechungsMarken(e)).toEqual([
      { index: 0, aktionRef: 'a', startSekunden: 2, dauerSekunden: 1.5, zeitstelle: 2 },
      { index: 1, aktionRef: 'b', startSekunden: 6.5, dauerSekunden: 2, zeitstelle: 5 },
    ])
  })
  it('ohne Unterbrechungen leer; fehlendes Feld wie leer', () => {
    expect(unterbrechungsMarken(element())).toEqual([])
    expect(unterbrechungsMarken(element({ unterbrechungen: undefined }))).toEqual([])
  })
})

describe('spieleZeitBeiSequenzzeit (#437)', () => {
  const e = element({ unterbrechungen: [u(2, 'a', 1.5), u(5, 'b', 2)] })
  it('vor dem ersten Einschub: Wanduhr = Videozeit', () => {
    expect(spieleZeitBeiSequenzzeit(e, 1)).toBeCloseTo(1, 10)
  })
  it('IM Einschub steht das Video an der Zeitstelle still', () => {
    expect(spieleZeitBeiSequenzzeit(e, 2.7)).toBeCloseTo(2, 10)
    expect(spieleZeitBeiSequenzzeit(e, 3.5)).toBeCloseTo(2, 10)
    expect(spieleZeitBeiSequenzzeit(e, 6.5)).toBeCloseTo(5, 10)
  })
  it('dahinter wird die Summe der Dauern abgezogen', () => {
    expect(spieleZeitBeiSequenzzeit(e, 5)).toBeCloseTo(3.5, 10)
    expect(spieleZeitBeiSequenzzeit(e, 9)).toBeCloseTo(5.5, 10)
  })
  it('klemmt auf (0, Videoende) - nie 0 oder das Ende', () => {
    const rand = 1 / 30
    expect(spieleZeitBeiSequenzzeit(e, 0)).toBeCloseTo(rand, 10)
    expect(spieleZeitBeiSequenzzeit(e, 100)).toBeCloseTo(10 - rand, 10)
  })
  it('unbrauchbare Videozeit -> null', () => {
    expect(spieleZeitBeiSequenzzeit(element({ trimStart: null }), 3)).toBeNull()
  })
})

describe('fuegeUnterbrechungEin (#437)', () => {
  it('leere Liste -> EIN Eintrag', () => {
    expect(fuegeUnterbrechungEin([], 'a', 2, 4, 10)).toEqual({
      ok: true, unterbrechungen: [u(4, 'a', 2)],
    })
  })
  it('sortiert aufsteigend ein (bestehende bleiben)', () => {
    const r = fuegeUnterbrechungEin([u(6, 'x', 1)], 'a', 2, 2, 10)
    expect(r.ok && r.unterbrechungen.map((e) => e.zeitstelle)).toEqual([2, 6])
  })
  it('lehnt doppelte Stelle, 0, das Ende, Dauer 0 und fehlende Aktion ab', () => {
    const drin = [u(3, 'x', 1)]
    expect(fuegeUnterbrechungEin(drin, 'a', 1, 3, 10).ok).toBe(false)
    expect(fuegeUnterbrechungEin([], 'a', 1, 0, 10).ok).toBe(false)
    expect(fuegeUnterbrechungEin([], 'a', 1, 10, 10).ok).toBe(false)
    expect(fuegeUnterbrechungEin([], 'a', 0, 4, 10).ok).toBe(false)
    expect(fuegeUnterbrechungEin([], '  ', 1, 4, 10).ok).toBe(false)
  })
})

describe('entferneUnterbrechung (#437)', () => {
  it('entfernt genau den Index', () => {
    expect(entferneUnterbrechung([u(2, 'a', 1), u(5, 'b', 2)], 0)).toEqual([u(5, 'b', 2)])
  })
  it('ungueltiger Index -> unveraenderte Kopie', () => {
    const liste = [u(2, 'a', 1)]
    const r = entferneUnterbrechung(liste, 9)
    expect(r).toEqual(liste)
    expect(r).not.toBe(liste)
  })
})

describe('verschiebeUnterbrechung (#442)', () => {
  it('verschiebt genau einen Eintrag und sortiert nach Zeitstelle', () => {
    const r = verschiebeUnterbrechung([u(2, 'a', 1), u(6, 'b', 2)], 0, 7.5, 10)
    expect(r.ok && r.unterbrechungen.map((e) => [e.aktionRef, e.zeitstelle])).toEqual([
      ['b', 6],
      ['a', 7.5],
    ])
  })

  it('aendert NUR die Zeitstelle - Aktion und Dauer bleiben', () => {
    const r = verschiebeUnterbrechung([u(2, 'a', 1.5)], 0, 4, 10)
    expect(r.ok && r.unterbrechungen).toEqual([u(4, 'a', 1.5)])
  })

  it('klemmt in das offene Intervall (0, Videoende)', () => {
    const rand = 1 / 30
    const links = verschiebeUnterbrechung([u(2, 'a', 1)], 0, -5, 10)
    expect(links.ok && links.unterbrechungen[0]?.zeitstelle).toBeCloseTo(rand, 10)
    const rechts = verschiebeUnterbrechung([u(2, 'a', 1)], 0, 99, 10)
    expect(rechts.ok && rechts.unterbrechungen[0]?.zeitstelle).toBeCloseTo(10 - rand, 10)
  })

  it('darf an einem Nachbarn vorbei - die Liste wird neu sortiert', () => {
    const r = verschiebeUnterbrechung([u(2, 'a', 1), u(6, 'b', 1)], 0, 9, 10)
    expect(r.ok && r.unterbrechungen.map((e) => [e.aktionRef, e.zeitstelle])).toEqual([
      ['b', 6],
      ['a', 9],
    ])
  })

  it('klemmt in eine Luecke, statt eine doppelte Stelle zu erzeugen', () => {
    const rand = 1 / 30
    // Ziel 6.01 liegt dicht hinter b (6) und weit vor c (9) -> ein Frame Abstand.
    const r = verschiebeUnterbrechung([u(2, 'a', 1), u(6, 'b', 1), u(9, 'c', 1)], 0, 6.01, 10)
    expect(r.ok && r.unterbrechungen.map((e) => e.aktionRef)).toEqual(['b', 'a', 'c'])
    expect(r.ok && (r.unterbrechungen[1]?.zeitstelle ?? 0)).toBeCloseTo(6 + rand, 10)
  })

  it('ohne Platz zwischen zwei Nachbarn -> abgelehnt mit Meldung', () => {
    const rand = 1 / 30
    const bestand = [u(2, 'a', 1), u(2 + 1.5 * rand, 'c', 1), u(9, 'b', 1)]
    const r = verschiebeUnterbrechung(bestand, 2, 2.02, 10)
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.meldung.length > 0).toBe(true)
  })

  it('unbekannter Index, NaN-Zeitstelle und unbrauchbare Videodauer -> abgelehnt', () => {
    expect(verschiebeUnterbrechung([u(2, 'a', 1)], 5, 3, 10).ok).toBe(false)
    expect(verschiebeUnterbrechung([u(2, 'a', 1)], 0, Number.NaN, 10).ok).toBe(false)
    expect(verschiebeUnterbrechung([u(2, 'a', 1)], 0, 3, Number.NaN).ok).toBe(false)
  })
})
