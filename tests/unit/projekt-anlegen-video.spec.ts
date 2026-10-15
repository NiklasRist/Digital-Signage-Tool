// Issue #423 (Nachtrag 15.10.2026): Beim Anlegen ist der Video-Import PFLICHT und laeuft
// ZUERST - kein Haekchen. Ohne gewaehltes Video entsteht KEIN Projekt.
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

const anlegenDoppel = vi.hoisted(() => ({ legeProjektAn: vi.fn() }))

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
  // Name wird hier nicht geprueft (das tut anlegen-oeffnen selbst).
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

function baueEigenschaften(
  waehleVideoPfad: () => Promise<Ergebnis<{ pfade: string[] }, string>>,
  importiereVideoPfad: (id: string, pfad: string) => void,
): Record<string, unknown> {
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
    marken: { hole: () => ({ marken: [] }), lade: async () => null, aufGeaendert: () => () => undefined },
    waehleVideoPfad,
    importiereVideoPfad,
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

describe('projekt-verwaltung - Video-Import Pflicht beim Anlegen (#423)', () => {
  it('der Anlegen-Dialog hat KEIN „Video importieren"-Haekchen mehr', async () => {
    await act(async () => {
      wurzel.render(
        createElement(
          ProjektVerwaltungWurzel,
          baueEigenschaften(async () => ({ ok: true, wert: { pfade: [] } }), () => undefined) as never,
        ) as ReactElement,
      )
    })
    await klicke('verwaltung-anlegen')
    expect(behaelter.querySelector('[data-testid="dialog-anlegen-video"]')).toBeNull()
    expect(behaelter.querySelector('[data-testid="dialog-anlegen-bestätigen"]')).not.toBeNull()
  })

  it('OHNE gewaehltes Video entsteht KEIN Projekt (Video zuerst, Pflicht)', async () => {
    const importiereVideoPfad = vi.fn()
    await act(async () => {
      wurzel.render(
        createElement(
          ProjektVerwaltungWurzel,
          baueEigenschaften(async () => ({ ok: true, wert: { pfade: [] } }), importiereVideoPfad) as never,
        ) as ReactElement,
      )
    })
    await klicke('verwaltung-anlegen')
    await klicke('dialog-anlegen-bestätigen')

    expect(anlegenDoppel.legeProjektAn).not.toHaveBeenCalled()
    expect(importiereVideoPfad).not.toHaveBeenCalled()
  })

  it('MIT gewaehltem Video wird das Projekt angelegt UND der Pfad importiert', async () => {
    const importiereVideoPfad = vi.fn()
    await act(async () => {
      wurzel.render(
        createElement(
          ProjektVerwaltungWurzel,
          baueEigenschaften(async () => ({ ok: true, wert: { pfade: ['/tmp/v.mp4'] } }), importiereVideoPfad) as never,
        ) as ReactElement,
      )
    })
    await klicke('verwaltung-anlegen')
    await klicke('dialog-anlegen-bestätigen')

    expect(anlegenDoppel.legeProjektAn).toHaveBeenCalledTimes(1)
    expect(importiereVideoPfad).toHaveBeenCalledTimes(1)
    expect(importiereVideoPfad).toHaveBeenCalledWith('p-neu', '/tmp/v.mp4')
  })
})
