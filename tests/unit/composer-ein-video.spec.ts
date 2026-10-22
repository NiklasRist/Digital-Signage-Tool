// Verhaltenstests zu #422 - composer/index.tsx, die Wurzel (jsdom).
//
// User-Entscheidungen 15.10.2026: genau EIN Video pro Projekt; ein neu importiertes
// Video landet AUTOMATISCH ans Ende der Wiedergabeliste; liegt schon ein Video vor,
// fragt der Import VORHER nach und ERSETZT es dann: Das neue Element wird eingefuegt,
// das alte im BESTAND entfernt (nicht nur aus der Sicht gefiltert - am echten Fenster
// gemessen 22.10.2026, Treiber 4b7: sonst standen nach dem Neuoefnen ZWEI Videos in
// project.json).
//
// Doppelt sind die schweren Ansichten (Wiedergabeliste, ElementBedienung, AssetGalerie),
// der IPC-Ruf, der Einfuege-Baustein `fuegeElementHinzu` und `entferneElementAusListe`;
// die Wurzel-Logik laeuft echt.
// @vitest-environment jsdom
import { createElement, act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'

import type { Listenelement, Project } from '../../src/shared/contracts/project'

const d = vi.hoisted(() => ({
  sichtHoerer: null as null | ((sicht: { projekt: unknown; ladefehler: null }) => void),
  setzeListe: vi.fn(),
  starteMedienImport: vi.fn(),
  fuegeElementHinzu: vi.fn(),
  entferneElementAusListe: vi.fn(),
  // Was der Einfuege-Baustein als "aktuelle Liste" sieht und welches Element er liefert.
  quelle: [] as Listenelement[],
  neuesElement: { id: 'el-neu' } as unknown,
}))

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
  rufeAuf: vi.fn(async (kanal: string) =>
    kanal === 'project:listeAusgaben'
      ? { ok: true, wert: [] }
      : { ok: true, wert: { auftragId: 'a' } },
  ),
}))
vi.mock('../../src/renderer/ipc-client/pfad-fuer-datei', () => ({
  pfadFuerDatei: vi.fn(() => null),
}))
vi.mock('../../src/renderer/composer/element-hinzufuegen', () => ({
  fuegeElementHinzu: d.fuegeElementHinzu,
}))
vi.mock('../../src/renderer/composer/element-entfernen', () => ({
  entferneElementAusListe: d.entferneElementAusListe,
}))

function videoElement(id: string, ref: string): Listenelement {
  return { id, art: 'video', ref, dauer: 10, trimStart: null, trimEnde: null, einblendung: null }
}

function baueProjekt(ueber: Partial<Project> = {}): Project {
  return {
    id: 'p-1',
    name: 'Testprojekt',
    erstelltAm: '2026-10-15T00:00:00Z',
    geaendertAm: '2026-10-15T00:00:00Z',
    schemaVersion: 1,
    assets: [
      {
        id: 'asset-1', typ: 'video', dateiname: 'a.mp4', originalname: 'a.mp4',
        maße: { breite: 1920, höhe: 1080 }, dauer: 10, importdatum: '', zustand: 'ok',
      },
    ],
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
    standardMarkeId: 'marke-eingebaut',
    standardSegmentdauer: 10,
    ...ueber,
  } as Project
}

function baueEigenschaften(projekt: Project) {
  return {
    sichtbar: true,
    projekt: {
      lade: vi.fn(),
      hole: vi.fn(() => ({ projekt, ladefehler: null })),
      setzeProjekt: vi.fn(),
      setzeListe: d.setzeListe,
      gleicheElementAb: vi.fn(),
      leere: vi.fn(),
      aufGeaendert: vi.fn((hoerer: (s: { projekt: unknown; ladefehler: null }) => void) => {
        d.sichtHoerer = hoerer
        return () => {}
      }),
    },
    zeichnen: {
      bereiteVor: vi.fn(),
      hole: vi.fn(() => ({ vorlagen: [] })),
      verwirfMotivBestand: vi.fn(),
    },
    vorlagen: { lade: vi.fn(), hole: vi.fn(() => null), aufGeaendert: vi.fn(() => () => {}) },
    verdrahtung: {
      starteMedienImport: d.starteMedienImport,
      legeAktionAn: vi.fn(),
      reparatur: null,
      meldeReparaturStand: vi.fn(),
      meldeUebergabe: vi.fn(),
    },
  }
}

import { ComposerWurzel } from '../../src/renderer/composer/index'

let behaelter: HTMLDivElement
let wurzel: Root

async function zeichne(eigenschaften: ReturnType<typeof baueEigenschaften>): Promise<void> {
  await act(async () => {
    wurzel.render(createElement(ComposerWurzel, eigenschaften as never))
  })
  await act(async () => {})
}

async function klicke(testId: string): Promise<void> {
  const knopf = behaelter.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`)
  if (knopf === null) throw new Error(`Knopf "${testId}" nicht gefunden`)
  await act(async () => {
    knopf.click()
  })
  await act(async () => {})
}

beforeEach(() => {
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  wurzel = createRoot(behaelter)
  d.setzeListe.mockClear()
  d.starteMedienImport.mockReset()
  d.starteMedienImport.mockResolvedValue({ ok: false, fehler: { code: 'x', meldung: 'y' } })
  d.entferneElementAusListe.mockReset()
  d.entferneElementAusListe.mockImplementation(
    async (_id: string, sichtSchreiber: (l: Listenelement[]) => void) => {
      sichtSchreiber([d.neuesElement as Listenelement])
      return { ok: true }
    },
  )
  d.fuegeElementHinzu.mockReset()
  d.fuegeElementHinzu.mockImplementation(
    async (_ref: string, _pos: number | undefined, sichtSchreiber: (l: Listenelement[]) => void) => {
      sichtSchreiber([...d.quelle, d.neuesElement as Listenelement])
      return { ok: true, wert: d.neuesElement }
    },
  )
  d.quelle = []
  d.neuesElement = { id: 'el-neu' }
  d.sichtHoerer = null
})

afterEach(() => {
  act(() => {
    wurzel.unmount()
  })
  behaelter.remove()
})

describe('composer/index.tsx - ein Video (#422)', () => {
  it('der Kopf-Knopf heisst "Video importieren"', async () => {
    await zeichne(baueEigenschaften(baueProjekt()))
    const knopf = behaelter.querySelector('[data-testid="composer-medien-import"]')
    expect(knopf?.textContent).toContain('Video importieren')
  })

  it('ohne Video startet der Import DIREKT (keine Rueckfrage)', async () => {
    await zeichne(baueEigenschaften(baueProjekt()))
    await klicke('composer-medien-import')

    expect(behaelter.querySelector('[data-testid="composer-ersetzen-frage"]')).toBeNull()
    expect(d.starteMedienImport).toHaveBeenCalledTimes(1)
  })

  it('mit Video zeigt der Import ERST die Rueckfrage - der Import laeuft noch NICHT', async () => {
    const mitVideo = baueProjekt({ liste: [videoElement('el-alt', 'asset-1')] })
    await zeichne(baueEigenschaften(mitVideo))
    await klicke('composer-medien-import')

    expect(behaelter.querySelector('[data-testid="composer-ersetzen-frage"]')).not.toBeNull()
    expect(d.starteMedienImport).not.toHaveBeenCalled()
  })

  it('"Abbrechen" schliesst die Rueckfrage ohne Import', async () => {
    const mitVideo = baueProjekt({ liste: [videoElement('el-alt', 'asset-1')] })
    await zeichne(baueEigenschaften(mitVideo))
    await klicke('composer-medien-import')
    await klicke('composer-ersetzen-nein')

    expect(behaelter.querySelector('[data-testid="composer-ersetzen-frage"]')).toBeNull()
    expect(d.starteMedienImport).not.toHaveBeenCalled()
  })

  it('"Video ersetzen" startet den Import genau einmal', async () => {
    const mitVideo = baueProjekt({ liste: [videoElement('el-alt', 'asset-1')] })
    await zeichne(baueEigenschaften(mitVideo))
    await klicke('composer-medien-import')
    await klicke('composer-ersetzen-ja')

    expect(behaelter.querySelector('[data-testid="composer-ersetzen-frage"]')).toBeNull()
    expect(d.starteMedienImport).toHaveBeenCalledTimes(1)
  })

  it('ein neu importiertes Video landet AUTOMATISCH in der Liste (ein Schreibvorgang)', async () => {
    await zeichne(baueEigenschaften(baueProjekt()))
    // Der Import legt ein neues Video-Asset an; die Wurzel sieht es ueber das Abo.
    d.quelle = []
    d.neuesElement = videoElement('el-neu', 'asset-neu')
    await act(async () => {
      d.sichtHoerer?.({
        projekt: baueProjekt({
          assets: [
            {
              id: 'asset-neu', typ: 'video', dateiname: 'neu.mp4', originalname: 'neu.mp4',
              maße: { breite: 1920, höhe: 1080 }, dauer: 8, importdatum: '', zustand: 'ok',
            },
          ],
        }),
        ladefehler: null,
      })
    })

    expect(d.fuegeElementHinzu).toHaveBeenCalledTimes(1)
    expect(d.fuegeElementHinzu.mock.calls[0]?.[0]).toBe('asset-neu')
    expect(d.setzeListe).toHaveBeenCalledTimes(1)
    expect((d.setzeListe.mock.calls[0]?.[0] as Listenelement[]).map((e) => e.id)).toEqual(['el-neu'])
  })

  it('ERSETZEN: das alte Video wird im BESTAND entfernt, das neue kommt dazu', async () => {
    await zeichne(baueEigenschaften(baueProjekt({ liste: [videoElement('el-alt', 'asset-1')] })))
    d.quelle = [videoElement('el-alt', 'asset-1')]
    d.neuesElement = videoElement('el-neu', 'asset-neu')
    await act(async () => {
      d.sichtHoerer?.({
        projekt: baueProjekt({
          assets: [
            {
              id: 'asset-neu', typ: 'video', dateiname: 'neu.mp4', originalname: 'neu.mp4',
              maße: { breite: 1920, höhe: 1080 }, dauer: 8, importdatum: '', zustand: 'ok',
            },
          ],
          liste: [videoElement('el-alt', 'asset-1')],
        }),
        ladefehler: null,
      })
    })

    // Das alte Element geht ueber den echten Entfernen-Baustein (schreibt D1) - nicht
    // nur ueber einen Sicht-Filter.
    expect(d.entferneElementAusListe).toHaveBeenCalledTimes(1)
    expect(d.entferneElementAusListe.mock.calls[0]?.[0]).toBe('el-alt')
    // Der Sicht-Schreiber des Entfernens liefert die neue Liste (hier die Attrappe).
    expect(d.setzeListe).toHaveBeenCalledTimes(1)
    expect((d.setzeListe.mock.calls[0]?.[0] as Listenelement[]).map((e) => e.id)).toEqual(['el-neu'])
  })
})
