// Verhaltenstests zu #425 - Band-Aufnahme in der Composer-Wurzel (jsdom).
//
// Geprueft werden die zwei Dinge, die die DoD nennt und die sich in jsdom
// messen lassen: (1) die Band-Bearbeitung (#253) ist endlich MONTIERT - kein
// Platzhalter mehr; (2) das Uebernehmen korrigiert die Sicht in EINEM Schritt.
// Der ECHTE Drag auf den Video-Block wird am Fenster gemessen (Treiber), nicht
// in jsdom - Modell in jsdom, echter Weg am Fenster (Vorbild #407/#408/#413).
// @vitest-environment jsdom
import { createElement, act, createRef, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { DndContext } from '@dnd-kit/core'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Listenelement, Project } from '../../src/shared/contracts/project'
import type { Vorlage } from '../../src/shared/contracts/vorlage'
import type { BandEntwurf } from '../../src/renderer/composer/einblendung-bearbeiten'

const d = vi.hoisted(() => ({
  setzeListe: vi.fn(),
  uebernehmen: [] as Array<{ elementId: string; entwurf: BandEntwurf }>,
  antwort: null as unknown,
}))

// Die schweren Ansichten doppeln; die Wurzel-Logik laeuft echt. Die Wiedergabeliste
// zeichnet die Zeilen-Bedienung (sonst waere der Band-Knopf nicht erreichbar); die
// Zeilen-Bedienung selbst ist ein Knopf, der `aufEinblendungBearbeiten` ruft (#249).
vi.mock('../../src/renderer/composer/liste-ansicht.tsx', () => ({
  Wiedergabeliste: (p: { projekt: Project; zeichneBedienung: (m: { elementId: string; kaputteBandAbschnitte: number[] }) => ReactNode }) =>
    createElement(
      'div',
      { 'data-testid': 'wiedergabeliste-doppel' },
      ...p.projekt.liste.map((eintrag) =>
        createElement(
          'span',
          { key: eintrag.id },
          p.zeichneBedienung({ elementId: eintrag.id, kaputteBandAbschnitte: [] }),
        ),
      ),
    ),
}))
vi.mock('../../src/renderer/composer/element-zeile.tsx', () => ({
  ElementBedienung: (p: { element: Listenelement; aufEinblendungBearbeiten: (id: string) => void }) =>
    createElement('button', {
      'data-testid': `band-knopf-${p.element.id}`,
      onClick: () => p.aufEinblendungBearbeiten(p.element.id),
    }),
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
vi.mock('../../src/renderer/ipc-client/pfad-fuer-datei', () => ({
  pfadFuerDatei: vi.fn(() => null),
}))
vi.mock('../../src/renderer/composer/element-hinzufuegen', () => ({
  fuegeElementHinzu: vi.fn(),
}))
// uebernehmeBand ist die IPC-Naht (#129) - sie wird gedoppelt; alle uebrigen
// Entwurfs-Operationen bleiben echt (importOriginal).
vi.mock('../../src/renderer/composer/einblendung-bearbeiten', async (importOriginal) => {
  const echt = await importOriginal<typeof import('../../src/renderer/composer/einblendung-bearbeiten')>()
  return {
    ...echt,
    uebernehmeBand: vi.fn(async (elementId: string, entwurf: BandEntwurf) => {
      d.uebernehmen.push({ elementId, entwurf })
      return d.antwort as never
    }),
  }
})

import { ComposerWurzel } from '../../src/renderer/composer/index'
import { Zeitleiste } from '../../src/renderer/composer/zeitleiste.tsx'

function videoElement(id: string): Listenelement {
  return { id, art: 'video', ref: 'asset-1', dauer: 10, trimStart: null, trimEnde: null, einblendung: null }
}

function aktion(id: string, standardDauer: number | null = null): Aktion {
  return {
    id, titel: 'Training', beschreibung: null, preis: null, bildRef: null, cta: null,
    standardDauer, markeId: 'marke-x', vorlagenId: 'v', akzentfarbe: null,
  }
}

function bandVorlage(id: string): Vorlage {
  return { id, name: id, höhe: 162, parent: null, eingebaut: false, zonen: [] }
}

function baueProjekt(ueber: Partial<Project> = {}): Project {
  return {
    id: 'p-1',
    name: 'Testprojekt',
    erstelltAm: '2026-10-15T00:00:00Z',
    geaendertAm: '2026-10-15T00:00:00Z',
    schemaVersion: 1,
    assets: [
      { id: 'asset-1', typ: 'video', dateiname: 'a.mp4', originalname: 'a.mp4', maße: { breite: 1920, höhe: 1080 }, dauer: 10, importdatum: '', zustand: 'ok' },
    ],
    aktionen: [aktion('a1')],
    liste: [],
    letzterAusgabeName: null,
    standardMarkeId: 'marke-eingebaut',
    standardSegmentdauer: 10,
    ...ueber,
  } as Project
}

function baueEigenschaften(projekt: Project, bandVorlagen: Vorlage[] = [bandVorlage('band-a')]) {
  return {
    sichtbar: true,
    projekt: {
      lade: vi.fn(),
      hole: vi.fn(() => ({ projekt, ladefehler: null })),
      setzeProjekt: vi.fn(),
      setzeListe: d.setzeListe,
      gleicheElementAb: vi.fn(),
      leere: vi.fn(),
      aufGeaendert: vi.fn(() => () => {}),
    },
    zeichnen: { bereiteVor: vi.fn(), hole: vi.fn(() => ({ vorlagen: [] })), verwirfMotivBestand: vi.fn() },
    vorlagen: {
      lade: vi.fn(),
      hole: vi.fn(() => ({ nutzbare: bandVorlagen.map((vorlage) => ({ vorlage, genutzt: [] })) })),
      aufGeaendert: vi.fn(() => () => {}),
    },
    // #338: `hole() === null` heisst "Bestand nicht geladen" - die Kaputt-Erkennung
    // prueft dann KEINE Marken-Referenzen (das Verhalten dieser Tests bleibt damit gleich).
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

async function zeichne(eigenschaften: ReturnType<typeof baueEigenschaften>): Promise<void> {
  await act(async () => {
    wurzel.render(createElement(ComposerWurzel, eigenschaften as never))
  })
  await act(async () => {})
}

async function klicke(testId: string): Promise<void> {
  const knopf = behaelter.querySelector<HTMLElement>(`[data-testid="${testId}"]`)
  if (knopf === null) throw new Error(`"${testId}" nicht gefunden`)
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
  d.uebernehmen = []
  d.antwort = null
})

afterEach(() => {
  act(() => wurzel.unmount())
  behaelter.remove()
})

describe('composer/index.tsx - Band-Bearbeitung montiert (#425)', () => {
  it('der Band-Knopf oeffnet die Einblendung-Ansicht - kein Platzhalter-Hinweis mehr', async () => {
    await zeichne(baueEigenschaften(baueProjekt({ liste: [videoElement('el-v')] })))
    await act(async () => {
      behaelter.querySelector<HTMLElement>('[data-testid="composer-ansicht-liste"]')?.click()
    })
    await act(async () => {})

    await klicke('band-knopf-el-v')

    expect(behaelter.querySelector('[data-testid="einblendung-ansicht"]')).not.toBeNull()
    expect(behaelter.textContent).not.toContain('noch nicht angebunden')
    expect(behaelter.textContent).not.toContain('M7-61')
  })

  it('Uebernehmen korrigiert die Sicht in EINEM setzeListe mit dem neuen Element', async () => {
    await zeichne(baueEigenschaften(baueProjekt({ liste: [videoElement('el-v')] })))
    await act(async () => {
      behaelter.querySelector<HTMLElement>('[data-testid="composer-ansicht-liste"]')?.click()
    })
    await act(async () => {})
    await klicke('band-knopf-el-v')
    // Einen Abschnitt anhaengen (die vorgewaehlte Aktion ist die erste aus dem Bestand).
    await klicke('abschnitt-hinzufuegen')

    const neuesElement: Listenelement = {
      ...videoElement('el-v'),
      einblendung: { bandVorlageId: 'band-a', abschnitte: [{ aktionRef: 'a1', dauer: 10 }] },
    }
    d.antwort = { ok: true, wert: neuesElement }
    await klicke('einblendung-uebernehmen')

    expect(d.uebernehmen).toHaveLength(1)
    expect(d.uebernehmen[0]?.elementId).toBe('el-v')
    expect(d.uebernehmen[0]?.entwurf.abschnitte).toEqual([{ aktionRef: 'a1', dauer: 10 }])
    expect(d.setzeListe).toHaveBeenCalledTimes(1)
    const geschrieben = d.setzeListe.mock.calls[0]?.[0] as Listenelement[]
    expect(geschrieben).toHaveLength(1)
    expect(geschrieben[0]?.einblendung?.abschnitte).toEqual([{ aktionRef: 'a1', dauer: 10 }])
    // Die Ansicht schliesst sich nach dem Uebernehmen.
    expect(behaelter.querySelector('[data-testid="einblendung-ansicht"]')).toBeNull()
  })
})

describe('zeitleiste.tsx - Band-Ziel sichtbar (#425)', () => {
  it('der Video-Block traegt data-band-ziel=true, wenn er das Band-Ziel ist', () => {
    const projekt = baueProjekt({ liste: [videoElement('el-v')] })
    const ref = createRef<HTMLDivElement>()
    act(() => {
      wurzel.render(
        createElement(
          DndContext,
          null,
          createElement(Zeitleiste, {
            projekt,
            neuZug: 'a1',
            aktiveKante: null,
            laedtKante: null,
            korbRef: ref,
            bandZiel: 'el-v',
          }),
        ),
      )
    })

    const block = behaelter.querySelector('[data-testid="zeitleiste-block-0"]')
    expect(block?.getAttribute('data-band-ziel')).toBe('true')
  })

  it('ohne Band-Ziel traegt der Block data-band-ziel=false', () => {
    const projekt = baueProjekt({ liste: [videoElement('el-v')] })
    const ref = createRef<HTMLDivElement>()
    act(() => {
      wurzel.render(
        createElement(
          DndContext,
          null,
          createElement(Zeitleiste, {
            projekt,
            neuZug: 'a1',
            aktiveKante: null,
            laedtKante: null,
            korbRef: ref,
            bandZiel: null,
          }),
        ),
      )
    })

    const block = behaelter.querySelector('[data-testid="zeitleiste-block-0"]')
    expect(block?.getAttribute('data-band-ziel')).toBe('false')
  })
})
