// #394 - Das Statistik-Dashboard war GEBAUT, aber NIRGENDS gerendert ("fertige
// Funktion ohne Aufrufer"). Dieser Test haelt den Montageweg: die Wurzel des
// Composers zeigt das Panel, und die Zahlen kommen aus `statistik.tsx` bzw. der
// EINEN Rechenstelle `gesamtlaenge.ts` (dieselbe frame-gerundete Summe wie der
// render-service, TK 9.7.4).
//
// Die schweren Ansichten sind doppelt (wie in composer-ein-video.spec.ts); die
// Wurzel-Logik und das Statistik-Panel laufen echt.
// @vitest-environment jsdom
import { createElement, act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'

import type { Listenelement, Project } from '../../src/shared/contracts/project'

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('../../src/renderer/composer/liste-ansicht.tsx', () => ({
  Wiedergabeliste: () => createElement('div', { 'data-testid': 'wiedergabeliste-doppel' }),
}))
vi.mock('../../src/renderer/composer/element-zeile.tsx', () => ({
  ElementBedienung: () => createElement('div', { 'data-testid': 'element-bedienung-doppel' }),
}))
vi.mock('../../src/renderer/composer/asset-galerie', () => ({
  AssetGalerie: () => createElement('div', { 'data-testid': 'asset-galerie-doppel' }),
}))
vi.mock('../../src/renderer/composer/render-ausloesen', () => ({
  loeseRenderAus: vi.fn(),
  loeseExportAus: vi.fn(),
}))
vi.mock('../../src/renderer/gemeinsam/marken-bereitstellung', () => ({
  holeBereiteMarke: vi.fn(() => null),
}))
vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: vi.fn(async () => ({ ok: true, wert: [] })),
}))
vi.mock('../../src/renderer/ipc-client/pfad-fuer-datei', () => ({
  pfadFuerDatei: vi.fn(() => null),
}))
vi.mock('../../src/renderer/composer/element-hinzufuegen', () => ({
  fuegeElementHinzu: vi.fn(),
}))
vi.mock('../../src/renderer/composer/element-entfernen', () => ({
  entferneElementAusListe: vi.fn(),
}))

import { ComposerWurzel } from '../../src/renderer/composer/index'

function baueProjekt(liste: Listenelement[]): Project {
  return {
    id: 'p-1',
    name: 'Testprojekt',
    erstelltAm: '2026-10-28T00:00:00Z',
    geaendertAm: '2026-10-28T00:00:00Z',
    schemaVersion: 1,
    assets: [
      {
        id: 'asset-1', typ: 'video', dateiname: 'a.mp4', originalname: 'a.mp4',
        maße: { breite: 1920, höhe: 1080 }, dauer: 60, importdatum: '', zustand: 'ok',
      },
    ],
    aktionen: [],
    liste,
    letzterAusgabeName: null,
    standardMarkeId: 'marke-eingebaut',
    standardSegmentdauer: 10,
  } as Project
}

function baueEigenschaften(projekt: Project) {
  return {
    sichtbar: true,
    projekt: {
      lade: vi.fn(),
      hole: vi.fn(() => ({ projekt, ladefehler: null })),
      setzeProjekt: vi.fn(),
      setzeListe: vi.fn(),
      gleicheElementAb: vi.fn(),
      leere: vi.fn(),
      aufGeaendert: vi.fn(() => () => {}),
    },
    zeichnen: {
      bereiteVor: vi.fn(),
      hole: vi.fn(() => ({ vorlagen: [] })),
      verwirfMotivBestand: vi.fn(),
    },
    vorlagen: { lade: vi.fn(), hole: vi.fn(() => null), aufGeaendert: vi.fn(() => () => {}) },
    marken: { lade: vi.fn(), hole: vi.fn(() => null), aufGeaendert: vi.fn(() => () => {}) },
    verdrahtung: {
      starteMedienImport: vi.fn(),
      legeAktionAn: vi.fn(),
      reparatur: null,
      meldeReparaturStand: vi.fn(),
      meldeUebergabe: vi.fn(),
    },
  }
}

let behaelter: HTMLDivElement
let wurzel: Root

async function zeichne(projekt: Project): Promise<void> {
  await act(async () => {
    wurzel.render(createElement(ComposerWurzel, baueEigenschaften(projekt) as never))
  })
  await act(async () => {})
}

function videoElement(id: string, dauer: number): Listenelement {
  // Bei `art: 'video'` liest die Rechnung NUR die Trim-Grenzen (TK 9.11.3).
  return { id, art: 'video', ref: 'asset-1', dauer, trimStart: 0, trimEnde: dauer, einblendung: null }
}

function segmentElement(id: string, dauer: number): Listenelement {
  return { id, art: 'segment', ref: 'a1', dauer, trimStart: null, trimEnde: null, einblendung: null }
}

beforeEach(() => {
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  wurzel = createRoot(behaelter)
})

afterEach(() => {
  act(() => {
    wurzel.unmount()
  })
  behaelter.remove()
})

describe('#394: das Statistik-Panel ist gemountet und zeigt die Zahlen', () => {
  it('Gesamtdauer, Anzahl und das Verhaeltnis Video/Segment stehen im Panel', async () => {
    // Krumme Werte: 12,51 s + 7,37 s = round(375,3) + round(221,1) = 596 Frames
    // = 19,8667 s -> Anzeige "0:19" (abgerundet, gesamtlaenge.ts).
    await zeichne(baueProjekt([videoElement('el-1', 12.51), segmentElement('el-2', 7.37)]))

    const panel = behaelter.querySelector('[data-testid="statistik"]')
    expect(panel).not.toBeNull()
    const text = panel?.textContent ?? ''
    expect(text).toContain('Gesamtdauer')
    expect(text).toContain('0:19')
    expect(text).toContain('Elemente')
    expect(text).toContain('Videos')
    expect(text).toContain('Aktions-Segmente')
    // Verhaeltnis: genau ein Video, genau ein Segment.
    expect(panel?.querySelector('[data-testid="statistik-Videos"]')?.textContent).toBe('1')
    expect(panel?.querySelector('[data-testid="statistik-Aktions-Segmente"]')?.textContent).toBe('1')
  })

  it('eine leere Liste zeigt Null-Werte statt zu fehlen', async () => {
    await zeichne(baueProjekt([]))

    const panel = behaelter.querySelector('[data-testid="statistik"]')
    expect(panel).not.toBeNull()
    expect(panel?.querySelector('[data-testid="statistik-Gesamtdauer"]')?.textContent).toBe('0:00')
    expect(panel?.querySelector('[data-testid="statistik-Elemente"]')?.textContent).toBe('0')
  })
})
