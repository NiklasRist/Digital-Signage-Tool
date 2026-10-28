// Tests zu #303 - marken-editor/live-vorschau.ts (die Live-Vorschau, ohne Browser).
//
// Der Kern-Nachweis ist der EINE Aufruf: zeichneMarkenVorschau ruft zeichneSegment
// GENAU EINMAL mit (baueVorschauAktion(marke, vorlage), vorlage, marke, marke)
// und liefert dessen Wert UNVERAENDERT - kein zweiter Zeichenpfad (TK 9.10.1).
import { describe, expect, it, vi } from 'vitest'

import type { Marke } from '../../src/shared/contracts/marke'
import type { Vorlage } from '../../src/shared/contracts/vorlage'

const doppel = vi.hoisted(() => ({
  bilder: [] as unknown[],
}))

vi.mock('../../src/renderer/template-canvas/zeichne-segment', () => ({
  zeichneSegment: (aktion: unknown, vorlage: unknown, marke: unknown, rahmenMarke: unknown) => {
    doppel.bilder.push({ aktion, vorlage, marke, rahmenMarke })
    return { canvas: 'probe' as unknown as HTMLCanvasElement, breite: 1920, höhe: 162, aufrufe: doppel.bilder.length }
  },
}))

const { baueVorschauAktion, zeichneMarkenVorschau } = await import(
  '../../src/renderer/marken-editor/live-vorschau'
)

function marke(id: string): Marke {
  return {
    id,
    name: 'Probe',
    parent: null,
    eingebaut: false,
    farben: null as never,
    schriften: null as never,
    logo: null as never,
    sicherheit: { horizontal: 96, vertikal: 54 },
    radien: null as never,
    schatten: null as never,
    slogan: null as never,
    herkunftJeFeld: null as never,
  }
}

function vorlage(): Vorlage {
  return {
    id: 'vollbild',
    name: 'Vollbild',
    art: 'vollflaeche',
    höhe: null,
    parent: null,
    eingebaut: true,
    zonen: [],
  }
}

describe('baueVorschauAktion (die synthetische Vorschau-Aktion)', () => {
  it('bildRef null, akzentfarbe null, markeId und vorlagenId aus den Uebergebenen, titel nicht leer', () => {
    const aktion = baueVorschauAktion(marke('m1'), vorlage())
    expect(aktion.bildRef).toBeNull()
    expect(aktion.akzentfarbe).toBeNull()
    expect(aktion.markeId).toBe('m1')
    expect(aktion.vorlagenId).toBe('vollbild')
    expect(aktion.titel.length).toBeGreaterThan(0)
  })

  it('zwei Marken: das Ergebnis unterscheidet sich NUR in markeId', () => {
    const e1 = baueVorschauAktion(marke('m1'), vorlage())
    const e2 = baueVorschauAktion(marke('m2'), vorlage())
    expect(e2.markeId).toBe('m2')
    const { markeId: _1, ...rest1 } = e1
    const { markeId: _2, ...rest2 } = e2
    expect(rest2).toEqual(rest1)
    expect(e1.bildRef).toBeNull()
    expect(e2.bildRef).toBeNull()
  })
})

describe('zeichneMarkenVorschau (KEIN zweiter Zeichenpfad)', () => {
  it('ruft zeichneSegment GENAU EINMAL mit (VorschauAktion, vorlage, marke, marke) und liefert dessen Wert', () => {
    const pruefMarke = marke('m1')
    const dieVorlage = vorlage()
    const bildInitial = doppel.bilder.length
    const ergebnis = zeichneMarkenVorschau(pruefMarke, dieVorlage)
    expect(doppel.bilder.length).toBe(bildInitial + 1)
    const aufruf = doppel.bilder[doppel.bilder.length - 1] as {
      aktion: { markeId: string }
      vorlage: unknown
      marke: unknown
      rahmenMarke: unknown
    }
    expect(aufruf.aktion.markeId).toBe('m1')
    expect(aufruf.marke).toBe(pruefMarke)
    expect(aufruf.vorlage).toBe(dieVorlage)
    expect(aufruf.rahmenMarke).toBe(aufruf.marke)
    expect(ergebnis).toEqual({ canvas: 'probe', breite: 1920, höhe: 162, aufrufe: doppel.bilder.length })
  })
})
