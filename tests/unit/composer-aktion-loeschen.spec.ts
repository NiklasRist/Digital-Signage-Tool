// Verhaltenstest zu #430 - Aktion in der Composer-Bibliothek loeschen (jsdom).
//
// User-Entscheidung 16.10.2026: Loeschen in der Aktionszeile der Bibliothek, OHNE
// Rueckfrage (der Schritt ist in EINEM Zug rueckgaengig zu machen, TK 9.13.1).
// Gemessen wird: der Ruf geht ueber die Verdrahtung (Modulgrenze) und der
// zurueckgegebene Stand wird mit EINEM setzeProjekt in die Sicht gegeben.
// @vitest-environment jsdom
import { createElement, act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Listenelement, Project } from '../../src/shared/contracts/project'

const d = vi.hoisted(() => ({
  setzeListe: vi.fn(),
  setzeProjekt: vi.fn(),
  loescheAktion: vi.fn(),
}))

vi.mock('../../src/renderer/composer/liste-ansicht.tsx', () => ({
  Wiedergabeliste: () => createElement('div', { 'data-testid': 'wiedergabeliste-doppel' }),
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
  rufeAuf: vi.fn(async (kanal: string) =>
    kanal === 'project:listeAusgaben' ? { ok: true, wert: [] } : { ok: true, wert: { auftragId: 'a' } },
  ),
}))
vi.mock('../../src/renderer/ipc-client/pfad-fuer-datei', () => ({ pfadFuerDatei: vi.fn(() => null) }))
vi.mock('../../src/renderer/composer/element-hinzufuegen', () => ({ fuegeElementHinzu: vi.fn() }))

import { ComposerWurzel } from '../../src/renderer/composer/index'

function aktion(id: string): Aktion {
  return {
    id, titel: `Aktion ${id}`, beschreibung: null, preis: null, bildRef: null, cta: null,
    standardDauer: null, markeId: 'm1', vorlagenId: 'v', akzentfarbe: null,
  }
}

function videoElement(id: string): Listenelement {
  return { id, art: 'video', ref: 'asset-1', dauer: 10, trimStart: null, trimEnde: null, einblendung: null }
}

function baueProjekt(aktionen: Aktion[], liste: Listenelement[]): Project {
  return {
    id: 'p-1',
    name: 'Testprojekt',
    erstelltAm: '2026-10-15T00:00:00Z',
    geaendertAm: '2026-10-15T00:00:00Z',
    schemaVersion: 1,
    assets: [],
    aktionen,
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
      setzeProjekt: d.setzeProjekt,
      setzeListe: d.setzeListe,
      gleicheElementAb: vi.fn(),
      leere: vi.fn(),
      aufGeaendert: vi.fn(() => () => {}),
    },
    zeichnen: { bereiteVor: vi.fn(), hole: vi.fn(() => null), verwirfMotivBestand: vi.fn() },
    vorlagen: { lade: vi.fn(), hole: vi.fn(() => null), aufGeaendert: vi.fn(() => () => {}) },
    verdrahtung: {
      starteMedienImport: vi.fn(),
      legeAktionAn: vi.fn(),
      loescheAktion: d.loescheAktion,
      reparatur: null,
      meldeReparaturStand: vi.fn(),
      meldeUebergabe: vi.fn(),
    },
  }
}

let behaelter: HTMLDivElement
let wurzel: Root

beforeEach(() => {
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  wurzel = createRoot(behaelter)
  d.setzeListe.mockClear()
  d.setzeProjekt.mockClear()
  d.loescheAktion.mockReset()
})

afterEach(() => {
  act(() => wurzel.unmount())
  behaelter.remove()
})

describe('composer/index.tsx - Aktion loeschen (#430)', () => {
  it('der Loeschen-Knopf in der Bibliothek ruft die Verdrahtung und wendet den Stand in EINEM setzeProjekt an', async () => {
    const el = videoElement('el-v')
    const start = baueProjekt([aktion('a1')], [el])
    d.loescheAktion.mockResolvedValue({
      ok: true,
      wert: {
        stand: { aktionen: [], liste: [el], standardSegmentdauer: 10 },
        entfernteElementIds: [],
        geaenderteElementIds: [],
      },
    })

    await act(async () => {
      wurzel.render(createElement(ComposerWurzel, baueEigenschaften(start) as never))
    })

    const knopf = behaelter.querySelector<HTMLButtonElement>('[data-testid="aktion-loeschen-a1"]')
    expect(knopf).not.toBeNull()
    await act(async () => {
      knopf?.click()
    })
    await act(async () => {})

    expect(d.loescheAktion).toHaveBeenCalledTimes(1)
    expect(d.loescheAktion).toHaveBeenCalledWith('a1')
    // Der Main-Stand wird uebernommen - EIN setzeProjekt (EIN Undo-Schnitt ueber die Huelle).
    expect(d.setzeProjekt).toHaveBeenCalledTimes(1)
    const neu = d.setzeProjekt.mock.calls[0]?.[0] as Project
    expect(neu.aktionen).toEqual([])
    expect(neu.liste).toEqual([el])
  })

  it('ein Fehler der Verdrahtung geht in die Wurzel-Meldung, KEIN setzeProjekt', async () => {
    const start = baueProjekt([aktion('a1')], [videoElement('el-v')])
    d.loescheAktion.mockResolvedValue({ ok: false, fehler: { code: 'nicht_gefunden', meldung: 'weg' } })

    await act(async () => {
      wurzel.render(createElement(ComposerWurzel, baueEigenschaften(start) as never))
    })
    const knopf = behaelter.querySelector<HTMLButtonElement>('[data-testid="aktion-loeschen-a1"]')
    await act(async () => {
      knopf?.click()
    })
    await act(async () => {})

    expect(d.setzeProjekt).not.toHaveBeenCalled()
    expect(behaelter.querySelector('[data-testid="composer-wurzel-meldung"]')?.textContent).toContain('weg')
  })
})
