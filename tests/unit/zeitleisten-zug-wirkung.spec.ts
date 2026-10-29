// Verhaltenstest zu #442 (Entscheidung 29.10.2026): Ein Drop auf den KOERPER eines
// Video-Blocks legt IMMER eine Unterbrechung an der Zeitstelle an - nie mehr einen
// Band-Abschnitt. Der sequenzielle Weg (Kante zwischen zwei Bloecken) bleibt bestehen.
//
// Der Test fuehrt den ECHTEN Zeitleisten-Zug (`verwendeZeitleistenZug`) in jsdom aus und
// beobachtet, welcher Schreibweg gerufen wird. Er traegt damit die Zusage, die zuvor nur
// in Kommentaren stand: die Wirkung eines Video-Drops haengt nicht mehr an der Vorlage.
//
// @vitest-environment jsdom
import { act, createElement, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'

import type { Project } from '../../src/shared/contracts/project'
import { verwendeZeitleistenZug, type ZeitleistenZug } from '../../src/renderer/composer/verwende-zeitleisten-zug'

const d = vi.hoisted(() => ({
  setzeUnterbrechungen: vi.fn(),
  fuegeHinzu: vi.fn(),
}))

vi.mock('../../src/renderer/composer/unterbrechungs-bearbeiten', () => ({
  setzeElementUnterbrechungen: d.setzeUnterbrechungen,
}))

vi.mock('../../src/renderer/composer/element-hinzufuegen', () => ({
  fuegeElementHinzu: d.fuegeHinzu,
}))

/** Ein Projekt mit EINEM Video (0-300 s) und EINER Aktion mit BAND-Vorlage. */
function projekt(): Project {
  return {
    id: 'p1',
    name: 'Probe',
    erstelltAm: '2026-10-14T00:00:00.000Z',
    geaendertAm: '2026-10-14T00:00:00.000Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [
      {
        id: 'akt-1',
        titel: 'Aktion',
        beschreibung: null,
        preis: null,
        bildRef: null,
        cta: null,
        standardDauer: 5,
        markeId: 'm1',
        vorlagenId: 'band-standard',
        akzentfarbe: null,
      },
    ],
    liste: [
      {
        id: 'video-1',
        art: 'video',
        ref: 'a0',
        dauer: null,
        trimStart: 0,
        trimEnde: 300,
        einblendung: null,
        unterbrechungen: [],
      },
    ],
    letzterAusgabeName: null,
    standardMarkeId: 'm1',
    standardSegmentdauer: 10,
  }
}

let wurzel: Root | null = null
let behaelter: HTMLDivElement | null = null
let zug: ZeitleistenZug | null = null

function Harness(): ReactElement {
  const frisch = projekt()
  const aktuell = verwendeZeitleistenZug({
    projektId: frisch.id,
    liste: frisch.liste,
    pxProSekunde: 8,
    holeProjekt: () => frisch,
    setzeListe: () => undefined,
    melde: () => undefined,
  })
  zug = aktuell
  return createElement('div', { ref: aktuell.korbRef, 'data-testid': 'korb' })
}

/** Der Messraum der Zeitleiste - im echten Fenster ein Layout, in jsdom gesetzt. */
function setzeMessraum(): void {
  const korb = zug?.korbRef.current ?? null
  if (korb === null) throw new Error('korbRef ist nicht gesetzt')
  korb.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 800, bottom: 60, width: 800, height: 60, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
}

function starte(x: number): void {
  const ereignis = {
    active: { data: { current: { referenz: 'akt-1' } } },
    activatorEvent: { clientX: x },
  }
  act(() => zug?.amDragStart(ereignis as unknown as DragStartEvent))
}

function ueber(x: number): void {
  const ereignis = { over: { id: 'kante-0' }, delta: { x } }
  act(() => zug?.amUeber(ereignis as unknown as DragOverEvent))
}

async function beende(): Promise<void> {
  const ereignis = {
    active: { data: { current: { referenz: 'akt-1' } } },
    over: { id: 'kante-0' },
  }
  await act(async () => {
    zug?.amEnde(ereignis as unknown as DragEndEvent)
    await Promise.resolve()
  })
}

beforeEach(() => {
  d.setzeUnterbrechungen.mockReset()
  d.setzeUnterbrechungen.mockResolvedValue({ ok: true, wert: projekt().liste[0] })
  d.fuegeHinzu.mockReset()
  d.fuegeHinzu.mockResolvedValue({ ok: true })
  zug = null
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  wurzel = createRoot(behaelter)
  act(() => wurzel?.render(createElement(Harness)))
  setzeMessraum()
})

afterEach(() => {
  act(() => wurzel?.unmount())
  behaelter?.remove()
  wurzel = null
  behaelter = null
})

describe('Drop auf den Video-Block (#442)', () => {
  it('legt eine UNTERBRECHUNG an der Zeitstelle an - auch fuer eine Aktion mit Band-Vorlage', async () => {
    // x = 100 im Koerper; Koerperstart 12 px, 8 px/s -> 11 s.
    starte(100)
    ueber(0)
    await beende()
    expect(d.setzeUnterbrechungen).toHaveBeenCalledWith('video-1', [
      { zeitstelle: 11, aktionRef: 'akt-1', dauer: 5 },
    ])
  })

  it('schreibt bei einem Video-Drop KEINEN sequenziellen Weg', async () => {
    starte(100)
    ueber(0)
    await beende()
    expect(d.fuegeHinzu).not.toHaveBeenCalled()
  })

  it('vor dem Block bleibt der sequenzielle Weg erhalten (Kante statt Koerper)', async () => {
    // x = 5 liegt vor dem Koerper (der beginnt bei 12 px) -> Kante 0.
    starte(5)
    ueber(0)
    await beende()
    expect(d.fuegeHinzu).toHaveBeenCalledTimes(1)
    expect(d.fuegeHinzu.mock.calls[0]?.[0]).toBe('akt-1')
    expect(d.fuegeHinzu.mock.calls[0]?.[1]).toBe(0)
    expect(d.setzeUnterbrechungen).not.toHaveBeenCalled()
  })
})
