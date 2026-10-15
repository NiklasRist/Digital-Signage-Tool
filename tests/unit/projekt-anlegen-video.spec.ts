// Issue #423: Der Anlegen-Dialog kann optional ein Video importieren. Nach dem Anlegen
// (Projekt offen, Reiter Zusammenstellen) startet der Video-Import ueber denselben Weg
// wie der Composer-Knopf.
//
// Geprueft wird NUR src/renderer/projekt-verwaltung/index.tsx (+ dieser Test). liste,
// beschaedigt und die Wirkungs-Bausteine sind DOPPEL; `legeProjektAn` ist ein Doppel,
// damit kein IPC noetig ist.
// @vitest-environment jsdom
import { createElement, act, type ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'

import type { Projektsicht } from '../../src/renderer/composer/projektzustand'
import type { ProjektMeta } from '../../src/shared/contracts/projekt-meta'
import type { Project } from '../../src/shared/contracts/project'
import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import { ProjektVerwaltungWurzel } from '../../src/renderer/projekt-verwaltung'

const listeDoppel = vi.hoisted(() => {
  const stand: { zustand: 'geladen' | 'unbekannt'; eintraege: readonly ProjektMeta[]; ladefehler: null } = {
    zustand: 'geladen',
    eintraege: [],
    ladefehler: null,
  }
  return {
    stand,
    holeProjektliste: () => stand,
    ladeProjektliste: vi.fn(async (): Promise<Ergebnis<readonly ProjektMeta[], string>> => ({ ok: true, wert: [] })),
    aufProjektlisteGeaendert: () => () => undefined,
  }
})

const anlegenDoppel = vi.hoisted(() => ({
  legeProjektAn: vi.fn(),
}))

vi.mock(import('../../src/renderer/projekt-verwaltung/liste'), async (importOriginal) => {
  const ist = (await importOriginal()) as Record<string, unknown>
  return {
    ...ist,
    holeProjektliste: listeDoppel.holeProjektliste,
    ladeProjektliste: listeDoppel.ladeProjektliste,
    aufProjektlisteGeaendert: listeDoppel.aufProjektlisteGeaendert,
  }
})
vi.mock('../../src/renderer/projekt-verwaltung/beschaedigt', () => ({
  istOeffnenErlaubt: () => true,
  oeffneProjektordner: vi.fn(),
}))
vi.mock('../../src/renderer/projekt-verwaltung/anlegen-oeffnen', () => ({
  legeProjektAn: anlegenDoppel.legeProjektAn,
  oeffneProjekt: vi.fn(),
  // Name wird hier nicht geprueft (das tut anlegen-oeffnen selbst) - dieses Doppel
  // laesst den Anlege-Weg durchlaufen, damit #423 (der Import-Ruf) messbar ist.
  pruefeProjektname: (eingabe: string) => ({ ok: true, name: eingabe }),
}))
vi.mock('../../src/renderer/projekt-verwaltung/duplizieren', () => ({
  baueDuplizierHinweis: vi.fn(() => null),
  dupliziereProjekt: vi.fn(),
  pruefeDuplikatname: vi.fn(() => ({ ok: true, name: 'x' })),
  schlageDuplikatnamenVor: vi.fn(() => 'duplikat'),
}))
vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: vi.fn(async () => ({ ok: true, wert: {} })),
}))

function projekt(id: string): Project {
  return {
    id,
    name: 'Neu',
    erstelltAm: '2026-10-15T00:00:00.000Z',
    geaendertAm: '2026-10-15T00:00:00.000Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
    standardMarkeId: 'm-1',
    standardSegmentdauer: 10,
  } as Project
}

function baueEigenschaften(starteVideoImport: (id: string) => void): Record<string, unknown> {
  const sicht: Projektsicht = { projekt: null, ladefehler: null }
  return {
    sichtbar: true,
    projekt: {
      hole: () => sicht,
      aufGeaendert: () => () => undefined,
      setzeProjekt: () => undefined,
      setzeListe: () => undefined,
      lade: async () => ({ ok: true, wert: null }),
      leere: () => undefined,
    },
    zeichnen: { hole: () => null, verwirfMotivBestand: () => undefined, bereiteVor: async () => ({ ok: true, wert: null }) },
    leereProjektHistorie: () => undefined,
    wechsleZuZusammenstellen: () => undefined,
    marken: {
      hole: () => ({ marken: [] }),
      lade: async () => null,
      aufGeaendert: () => () => undefined,
    },
    starteVideoImport,
  }
}

let behaelter: HTMLDivElement
let wurzel: Root

beforeEach(() => {
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  wurzel = createRoot(behaelter)
  anlegenDoppel.legeProjektAn.mockReset()
  anlegenDoppel.legeProjektAn.mockImplementation(async () => ({ ok: true, wert: projekt('p-neu') }))
})

afterEach(() => {
  act(() => wurzel.unmount())
  behaelter.remove()
})

async function klicke(testId: string): Promise<void> {
  const el = behaelter.querySelector<HTMLElement>(`[data-testid="${testId}"]`)
  if (el === null) throw new Error(`Element "${testId}" nicht gefunden`)
  await act(async () => {
    el.click()
  })
  await act(async () => {})
}

describe('projekt-verwaltung - Video-Import beim Anlegen (#423)', () => {
  it('der Anlegen-Dialog bietet "Video importieren" (Häkchen)', async () => {
    const starteVideoImport = vi.fn()
    await act(async () => {
      wurzel.render(createElement(ProjektVerwaltungWurzel, baueEigenschaften(starteVideoImport) as never) as ReactElement)
    })
    await klicke('verwaltung-anlegen')
    expect(behaelter.querySelector('[data-testid="dialog-anlegen-video"]')).not.toBeNull()
  })

  it('ohne Häkchen wird KEIN Video-Import gestartet', async () => {
    const starteVideoImport = vi.fn()
    await act(async () => {
      wurzel.render(createElement(ProjektVerwaltungWurzel, baueEigenschaften(starteVideoImport) as never) as ReactElement)
    })
    await klicke('verwaltung-anlegen')
    await klicke('dialog-anlegen-bestätigen')

    expect(anlegenDoppel.legeProjektAn).toHaveBeenCalledTimes(1)
    expect(starteVideoImport).not.toHaveBeenCalled()
  })

  it('mit Häkchen startet der Video-Import mit der Kennung des NEUEN Projekts', async () => {
    const starteVideoImport = vi.fn()
    await act(async () => {
      wurzel.render(createElement(ProjektVerwaltungWurzel, baueEigenschaften(starteVideoImport) as never) as ReactElement)
    })
    await klicke('verwaltung-anlegen')
    await klicke('dialog-anlegen-video')
    await klicke('dialog-anlegen-bestätigen')

    expect(anlegenDoppel.legeProjektAn).toHaveBeenCalledTimes(1)
    expect(starteVideoImport).toHaveBeenCalledTimes(1)
    expect(starteVideoImport).toHaveBeenCalledWith('p-neu')
  })
})
