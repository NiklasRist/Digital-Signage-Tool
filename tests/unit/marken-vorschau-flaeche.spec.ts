// Verhaltenstest zu #303/#330 - die Live-Vorschau des Marken-Editors (A1, 22.10.2026):
// Vorbereitung mit stelleMarkenSchriftenBereit + bereiteLogoVor, danach GENAU EIN
// Zeichenaufruf ueber zeichneMarkenVorschau; feste Vorlage "Vollbild"; Canvas wird
// nur per CSS skaliert (native 1920x1080 bleiben).
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement } from 'react'

import type { Marke } from '../../src/shared/contracts/marke'
import type { Vorlage } from '../../src/shared/contracts/vorlage'

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const h = vi.hoisted(() => ({
  reihenfolge: [] as string[],
  stelleSchriftenBereit: vi.fn(async () => {
    h.reihenfolge.push('gebuendelt')
  }),
  stelleMarkenSchriftenBereit: vi.fn(async (_marke?: unknown) => {
    h.reihenfolge.push('schriften')
  }),
  bereiteLogoVor: vi.fn(async (_marke?: unknown) => {
    h.reihenfolge.push('logo')
  }),
  zeichneMarkenVorschau: vi.fn((_marke?: unknown, _vorlage?: unknown) => {
    h.reihenfolge.push('zeichnen')
    const canvas = document.createElement('canvas')
    canvas.width = 1920
    canvas.height = 1080
    return { canvas, breite: 1920, höhe: 1080 }
  }),
}))

vi.mock('../../src/renderer/template-canvas/schriften', () => ({
  stelleSchriftenBereit: h.stelleSchriftenBereit,
}))
vi.mock('../../src/renderer/template-canvas/marken-schriften', () => ({
  stelleMarkenSchriftenBereit: h.stelleMarkenSchriftenBereit,
}))
vi.mock('../../src/renderer/template-canvas/logo-laden', () => ({
  bereiteLogoVor: h.bereiteLogoVor,
}))
vi.mock('../../src/renderer/marken-editor/live-vorschau', () => ({
  zeichneMarkenVorschau: h.zeichneMarkenVorschau,
}))

const { MarkenVorschau, findeVorschauVorlage, VORSCHAU_VORLAGE_NAME } = await import(
  '../../src/renderer/marken-editor/vorschau-flaeche.tsx'
)

function marke(id: string): Marke {
  return {
    id,
    name: 'Probe',
    parent: null,
    eingebaut: false,
    farben: {} as never,
    schriften: {} as never,
    logo: null,
    sicherheit: { horizontal: 0, vertikal: 0 },
    slogan: { text: '', aktiv: false },
    herkunftJeFeld: {} as never,
  } as unknown as Marke
}

function vollbild(): Vorlage {
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

function vorlagenZugang(nutzbar: Array<{ vorlage: Vorlage; eingebaut: boolean }> = [
  { vorlage: vollbild(), eingebaut: true },
]) {
  const uebersicht = {
    nutzbare: nutzbar.map((n) => ({
      ...n,
      arbeitskopieId: null,
      loeschbar: !n.eingebaut,
    })),
    verwaisteArbeitskopien: [],
  }
  return {
    lade: vi.fn(async () => ({ ok: true as const, wert: uebersicht })),
    hole: vi.fn(() => uebersicht),
    aufGeaendert: vi.fn(() => () => undefined),
  }
}

let behaelter: HTMLDivElement | null = null
let wurzel: Root | null = null

beforeEach(() => {
  h.reihenfolge.length = 0
  h.stelleSchriftenBereit.mockClear()
  h.stelleMarkenSchriftenBereit.mockClear()
  h.bereiteLogoVor.mockClear()
  h.zeichneMarkenVorschau.mockClear()
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
})

afterEach(() => {
  if (wurzel !== null && behaelter !== null) act(() => wurzel!.unmount())
  behaelter?.remove()
  behaelter = null
  wurzel = null
})

async function zeige(props: { marke: Marke | null; vorlagen: ReturnType<typeof vorlagenZugang> }): Promise<HTMLElement> {
  wurzel = createRoot(behaelter!)
  await act(async () => {
    wurzel!.render(createElement(MarkenVorschau, props as never) as ReactElement)
    await new Promise((fertig) => setTimeout(fertig, 0))
  })
  return behaelter as unknown as HTMLElement
}

describe('findeVorschauVorlage (feste Vorlage "Vollbild", A1)', () => {
  it('liefert die eingebaute Vorlage mit dem Anzeigenamen Vollbild', () => {
    expect(VORSCHAU_VORLAGE_NAME).toBe('Vollbild')
    expect(findeVorschauVorlage(vorlagenZugang() as never)?.id).toBe('vollbild')
  })

  it('ohne geladene Sicht: null (kein Nachladen, kein Ersatz)', () => {
    const zugang = { lade: vi.fn(), hole: vi.fn(() => null), aufGeaendert: vi.fn() }
    expect(findeVorschauVorlage(zugang as never)).toBeNull()
    expect(zugang.lade).not.toHaveBeenCalled()
  })

  it('eine eigene Vorlage gleichen Namens zaehlt NICHT', () => {
    const zugang = vorlagenZugang([{ vorlage: { ...vollbild(), id: 'eigene', eingebaut: false }, eingebaut: false }])
    expect(findeVorschauVorlage(zugang as never)).toBeNull()
  })
})

describe('MarkenVorschau', () => {
  it('bereitet Schriften und Logo VOR dem Zeichnen vor und ruft zeichneMarkenVorschau GENAU EINMAL', async () => {
    const markeProbe = marke('m1')
    const zugang = vorlagenZugang()
    const behaelterTest = await zeige({ marke: markeProbe, vorlagen: zugang as never })

    expect(h.reihenfolge).toEqual(['gebuendelt', 'schriften', 'logo', 'zeichnen'])
    expect(h.zeichneMarkenVorschau).toHaveBeenCalledTimes(1)
    expect(h.zeichneMarkenVorschau).toHaveBeenCalledWith(markeProbe, vollbild())
    const canvas = behaelterTest.querySelector('[data-testid="marken-vorschau-flaeche"] canvas')
    expect(canvas).not.toBeNull()
    // Native Groesse bleibt, Skalierung nur per CSS.
    expect((canvas as HTMLCanvasElement).width).toBe(1920)
    expect((canvas as HTMLCanvasElement).height).toBe(1080)
    expect((canvas as HTMLCanvasElement).style.width).toBe('100%')
    expect((canvas as HTMLCanvasElement).style.aspectRatio).toBe('1920 / 1080')
  })

  it('ohne geoeffnete Marke: keine Vorbereitung, kein Zeichnen, keine Flaeche mit Canvas', async () => {
    const zugang = vorlagenZugang()
    const behaelterTest = await zeige({ marke: null, vorlagen: zugang as never })
    expect(h.stelleSchriftenBereit).not.toHaveBeenCalled()
    expect(h.stelleMarkenSchriftenBereit).not.toHaveBeenCalled()
    expect(h.bereiteLogoVor).not.toHaveBeenCalled()
    expect(h.zeichneMarkenVorschau).not.toHaveBeenCalled()
    expect(behaelterTest.querySelector('canvas')).toBeNull()
  })

  it('fehlt "Vollbild", erscheint ein Hinweis und es wird NICHT gezeichnet', async () => {
    const zugang = vorlagenZugang([])
    const behaelterTest = await zeige({ marke: marke('m1'), vorlagen: zugang as never })
    expect(h.zeichneMarkenVorschau).not.toHaveBeenCalled()
    const hinweis = behaelterTest.querySelector('[data-testid="marken-vorschau-hinweis"]')
    expect(hinweis?.textContent).toContain('Vollbild')
  })

  it('ein Fehler der Vorbereitung wird als Hinweis gezeigt, nicht als Absturz', async () => {
    h.bereiteLogoVor.mockRejectedValueOnce(new Error('Logo kaputt'))
    const zugang = vorlagenZugang()
    const behaelterTest = await zeige({ marke: marke('m1'), vorlagen: zugang as never })
    expect(h.zeichneMarkenVorschau).not.toHaveBeenCalled()
    expect(behaelterTest.querySelector('[data-testid="marken-vorschau-hinweis"]')?.textContent)
      .toContain('Logo kaputt')
  })

  it('beim Wechsel der Marke wird mit der NEUEN Marke erneut vorbereitet und gezeichnet', async () => {
    const zugang = vorlagenZugang()
    const erste = marke('m1')
    const behaelterTest = await zeige({ marke: erste, vorlagen: zugang as never })
    const zweite = marke('m2')
    await act(async () => {
      wurzel!.render(createElement(MarkenVorschau, { marke: zweite, vorlagen: zugang } as never) as ReactElement)
      await new Promise((fertig) => setTimeout(fertig, 0))
    })
    expect(h.zeichneMarkenVorschau).toHaveBeenCalledTimes(2)
    expect(h.zeichneMarkenVorschau.mock.calls[1]![0]).toBe(zweite)
    expect(h.stelleMarkenSchriftenBereit).toHaveBeenLastCalledWith(zweite)
    expect(behaelterTest.querySelectorAll('canvas')).toHaveLength(1)
  })
})

describe('Quelldatei-Verbote (nur diese Datei)', () => {
  it('kein eigener Zeichenweg, keine eigene Vorbereitung ausser den zwei benannten Schritten', async () => {
    const fs = await import('node:fs/promises')
    const roh = await fs.readFile('src/renderer/marken-editor/vorschau-flaeche.tsx', 'utf8')
    // Wie bei den uebrigen Grep-Proben: Kommentare zaehlen nicht als Code.
    const text = roh.split('\n').filter((z) => {
      const t = z.trim()
      return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
    }).join('\n')
    expect(text).not.toMatch(/getContext|new Image|document\.fonts|zeichneSegment/)
    expect(text).not.toMatch(/stelleMarkeBereit|ZeichenZugang|Project/)
    expect(text).not.toMatch(/window\.api|rufeAuf|KANAELE/)
    // Genau ein Zeichenaufruf im Code:
    expect(text).toMatch(/zeichneMarkenVorschau\(/)
  })
})
