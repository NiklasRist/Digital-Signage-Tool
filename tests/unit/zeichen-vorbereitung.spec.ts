// Tests zu #313 - zeichen-vorbereitung.ts: die Bereitstellung der Menge
// "alle aktion.markeId plus standardMarkeId, entdoppelt", in der festen
// Reihenfolge Vorlagen -> Schriften -> Marken -> Motive. Alles-oder-nichts.
import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const doppel = vi.hoisted(() => ({
  spur: [] as string[],
  uebersichtWert: null as unknown,
  schriftenWirft: false,
  markenAntwort: { ok: true, wert: {} } as unknown,
  markenAufrufe: [] as string[],
  motiveAufrufe: [] as string[],
  uebersichtAufrufe: 0,
}))

vi.mock('../../src/renderer/gemeinsam/marken-bereitstellung', () => ({
  stelleMarkeBereit: async (markeId: string) => {
    doppel.markenAufrufe.push(markeId)
    doppel.spur.push(`stelleMarkeBereit/${markeId}`)
    return doppel.markenAntwort as never
  },
  holeBereiteMarke: () => null,
  leereMarkenBestand: () => {},
}))

vi.mock('../../src/renderer/template-canvas/schriften', () => ({
  stelleSchriftenBereit: async () => {
    doppel.spur.push('stelleSchriftenBereit')
    if (doppel.schriftenWirft) throw new Error('schriften weg')
  },
}))

vi.mock('../../src/renderer/template-canvas/bild-laden', () => ({
  bereiteMotiveVor: async (projektId: string, eintraege: unknown) => {
    doppel.motiveAufrufe.push(`${projektId} ${JSON.stringify(eintraege)}`)
    doppel.spur.push('bereiteMotiveVor')
  },
  leereMotivBestand: () => {},
  holeMotiv: () => ({ zustand: 'fehlt' }),
}))

vi.mock('../../src/renderer/vorlagen-editor/vorlagen-uebersicht', () => ({
  holeUebersicht: () => {
    if (doppel.uebersichtWert === null) doppel.uebersichtAufrufe += 1
    return doppel.uebersichtWert
  },
  ladeUebersicht: async () => {
    doppel.uebersichtAufrufe += 1
    doppel.spur.push('ladeUebersicht')
    return { ok: true, wert: doppel.uebersichtWert }
  },
  aufUebersichtGeaendert: () => () => {},
}))

import { bereiteZeichnenVor, verwirfMotivBestand } from '../../src/renderer/composer/zeichen-vorbereitung'

function baueProjekt(teil: Record<string, unknown> = {}): never {
  return {
    id: 'p-1', name: 'Probe', erstelltAm: '2026-10-06T00:00:00Z', geaendertAm: '2026-10-06T00:00:00Z',
    schemaVersion: 1,
    assets: [], aktionen: [], liste: [],
    letzterAusgabeName: null, standardSegmentdauer: 10, standardMarkeId: 'm-rahmen',
    ...teil,
  } as never
}

function aktion(markeId: string, mitBild = false): never {
  return {
    id: `a-${markeId}-${mitBild ? 'mit' : 'ohne'}`, titel: 'T', beschreibung: null, preis: null,
    bildRef: mitBild ? 'asset-1' : null,
    cta: null, standardDauer: null, vorlagenId: 'v-1', markeId, akzentfarbe: null,
  } as never
}

function asset(): never {
  return {
    id: 'asset-1', typ: 'bild', dateiname: 'motiv.png', originalname: 'motiv.png',
    maesse: { breite: 2, hoehe: 2 }, dauer: null, importdatum: '2026-10-06', zustand: 'ok',
  } as never
}

beforeEach(() => {
  doppel.spur = []
  doppel.markenAufrufe = []
  doppel.motiveAufrufe = []
  doppel.markenAntwort = { ok: true, wert: {} }
  doppel.schriftenWirft = false
  doppel.uebersichtWert = { nutzbare: [{ vorlage: { id: 'v-1' } }] }
  doppel.uebersichtAufrufe = 0
})

// ---------------- Menge und Reihenfolge (ENTSCHIEDEN 4) ----------------
// ---------------- Menge und Reihenfolge (ENTSCHIEDEN 4) ----------------

describe('Die bereitgestellte Menge und die Reihenfolge', () => {
  it('vier Aktionen aus ZWEI Marken plus abweichende Standardmarke: entdoppelt, plus die Standardmarke', async () => {
    const projekt = baueProjekt({
      aktionen: [aktion('m-1'), aktion('m-2'), aktion('m-1'), aktion('m-3')],
      standardMarkeId: 'm-rahmen',
    })
    const ergebnis = await bereiteZeichnenVor(projekt)
    expect(ergebnis.ok).toBe(true)
    expect(doppel.markenAufrufe).toHaveLength(4)
    expect(doppel.markenAufrufe.filter((id) => id === 'm-1')).toHaveLength(1)
    expect(doppel.markenAufrufe).toContain('m-2')
    expect(doppel.markenAufrufe).toContain('m-3')
    expect(doppel.markenAufrufe).toContain('m-rahmen')
  })
})

describe('Die Fehlwege', () => {
  it('eine Marke scheitert: UNVERAENDERTER Code, Motive ausgelassen, spätere Marken nicht versucht', async () => {
    const projekt = baueProjekt({
      aktionen: [aktion('m-1'), aktion('m-2')],
      standardMarkeId: 'm-rahmen',
    })
    doppel.markenAntwort = { ok: false, fehler: { code: 'marken_datei_fehlt', meldung: 'Datei weg.' } }
    const ergebnis = await bereiteZeichnenVor(projekt)
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('marken_datei_fehlt')
    expect(doppel.motiveAufrufe).toHaveLength(0)
    expect([...new Set(doppel.markenAufrufe)]).toEqual(['m-1'])
  })

  it('schriften scheitern (Wurf gefangen): Abruch VOR den Marken, Code schriften_fehlen', async () => {
    doppel.schriftenWirft = true
    const ergebnis = await bereiteZeichnenVor(baueProjekt({ aktionen: [aktion('m-1')] }))
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('schriften_fehlen')
    expect(doppel.markenAufrufe).toHaveLength(0)
    expect(doppel.motiveAufrufe).toHaveLength(0)
  })

  it('die Vorlagen-Uebersicht ist NULL: Abruch vor Schritt 2 unbekannter_fehler', async () => {
    doppel.uebersichtWert = null
    const ergebnis = await bereiteZeichnenVor(baueProjekt())
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
    expect(doppel.markenAufrufe).toHaveLength(0)
  })

  it('der Rueckgabewert traegt GENAU den Schluessel vorlagen', async () => {
    const ergebnis = await bereiteZeichnenVor(baueProjekt({ aktionen: [aktion('m-1')] }))
    expect(ergebnis.ok).toBe(true)
    const wert = (ergebnis as unknown as { ok: true; wert: Record<string, unknown> }).wert
    expect(Object.keys(wert)).toEqual(['vorlagen'])
  })
})
