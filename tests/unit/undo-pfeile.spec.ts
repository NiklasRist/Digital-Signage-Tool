// Issue #424 - die sichtbaren Undo/Redo-Pfeile (jsdom).
//
// Geprueft wird: im Projekte-/Marken-Reiter ABGESCHALTET (TK 9.14.2), im
// Zusammenstellen-Reiter an, sobald ein Schnappschuss vorliegt; ein Klick ruft den
// BESTEHENDEN Weg (macheRueckgaengig) - kein zweiter Undo-Pfad.
// @vitest-environment jsdom
import { createElement, act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'

import type { Project } from '../../src/shared/contracts/project'
import type { ProjektZugang } from '../../src/renderer/app-shell/sichten'
import { UndoPfeile } from '../../src/renderer/app-shell/undo-pfeile'
import { setzeHistorienZurueck } from '../../src/renderer/app-shell/undo-historien'
import { merkeVorAenderung } from '../../src/renderer/app-shell/undo-projekt'

// Der Undo-Weg schreibt ueber `project:setzeBearbeitungsstand` zurueck - hier ein Doppel,
// damit kein IPC noetig ist. Es liefert das angenommene Projekt zurueck.
vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: vi.fn(async () => ({
    ok: true,
    wert: {
      id: 'p-1', name: 'P', erstelltAm: '', geaendertAm: '', schemaVersion: 1,
      assets: [], aktionen: [], liste: [], letzterAusgabeName: null,
      standardMarkeId: 'm-1', standardSegmentdauer: 10,
    },
  })),
}))

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

function projekt(): Project {
  return {
    id: 'p-1',
    name: 'P',
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

function zugang(aktuell: Project, setzeProjekt: (p: Project) => void): ProjektZugang {
  return {
    hole: () => ({ projekt: aktuell, ladefehler: null }),
    setzeProjekt,
    setzeListe: () => undefined,
    gleicheElementAb: () => undefined,
    lade: async () => ({ ok: true, wert: aktuell }),
    leere: () => undefined,
    aufGeaendert: () => () => undefined,
  } as unknown as ProjektZugang
}

let behaelter: HTMLDivElement
let wurzel: Root

beforeEach(() => {
  setzeHistorienZurueck()
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  wurzel = createRoot(behaelter)
})

afterEach(() => {
  act(() => wurzel.unmount())
  behaelter.remove()
})

function zeichne(reiter: string, zug: ProjektZugang): void {
  act(() => {
    wurzel.render(
      createElement(UndoPfeile, {
        reiter: reiter as never,
        holeProjektzugang: () => zug,
        meldeFehler: () => undefined,
      }),
    )
  })
}

describe('UndoPfeile (#424)', () => {
  it('im Marken-Reiter sind beide Pfeile abgeschaltet (TK 9.14.2)', () => {
    const zug = zugang(projekt(), () => undefined)
    zeichne('marken', zug)
    expect(behaelter.querySelector<HTMLButtonElement>('[data-testid="undo-pfeil"]')?.disabled).toBe(true)
    expect(behaelter.querySelector<HTMLButtonElement>('[data-testid="redo-pfeil"]')?.disabled).toBe(true)
  })

  it('im Projekte-Reiter abgeschaltet (keine Historie)', () => {
    zeichne('projekte', zugang(projekt(), () => undefined))
    expect(behaelter.querySelector<HTMLButtonElement>('[data-testid="undo-pfeil"]')?.disabled).toBe(true)
  })

  it('im Zusammenstellen-Reiter ohne Schnappschuss abgeschaltet', () => {
    zeichne('zusammenstellen', zugang(projekt(), () => undefined))
    expect(behaelter.querySelector<HTMLButtonElement>('[data-testid="undo-pfeil"]')?.disabled).toBe(true)
  })

  it('mit Schnappschuss ist Rückgängig an; ein Klick ruft den bestehenden Weg', async () => {
    const p = projekt()
    const setzeProjekt = vi.fn()
    const zug = zugang(p, setzeProjekt)
    merkeVorAenderung({ holeProjekt: () => p, setzeProjekt })
    zeichne('zusammenstellen', zug)

    const undo = behaelter.querySelector<HTMLButtonElement>('[data-testid="undo-pfeil"]')
    expect(undo?.disabled).toBe(false)

    await act(async () => {
      undo?.click()
    })
    await act(async () => {})

    expect(setzeProjekt).toHaveBeenCalledTimes(1)
  })
})
