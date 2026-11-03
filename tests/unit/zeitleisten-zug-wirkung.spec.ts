// Verhaltenstest zu #442 (29.10.2026) und zur Entscheidung vom 03.11.2026: Ein Drop auf
// den KOERPER eines Video-Blocks legt eine Unterbrechung an der Zeitstelle an - ODER,
// wenn die Aktion eine Band-Vorlage traegt, einen Abschnitt ans Werbeband. Der
// sequenzielle Weg (Kante zwischen zwei Bloecken) bleibt bestehen.
//
// WARUM DIE ENTSCHEIDUNG HIER STEHT: Bis 03.11.2026 legte der Drop IMMER eine
// Unterbrechung an, auch fuer eine Band-Aktion. Die wurde dann 1920 x 162 gezeichnet,
// waehrend der Render fuer ein Segment 1920 x 1080 verlangt - das Projekt war nicht
// renderbar. AD 4.5 sagt: die Unterbrechung ist ein "eigenes, VOLLFLAECHIGES Segment".
// Eine Band-Aktion ist das nicht. Klick und Drop benutzen seitdem DIESELBE Regel
// (`legeAktionInsVideo` im Zeitleisten-Zug).
//
// Der Test fuehrt den ECHTEN Zeitleisten-Zug (`verwendeZeitleistenZug`) in jsdom aus und
// beobachtet, welcher Schreibweg gerufen wird.
//
// @vitest-environment jsdom
import { act, createElement, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'

import type { Project } from '../../src/shared/contracts/project'
import type { Vorlage } from '../../src/shared/contracts/vorlage'
import { verwendeZeitleistenZug, type ZeitleistenZug } from '../../src/renderer/composer/verwende-zeitleisten-zug'

const d = vi.hoisted(() => ({
  setzeUnterbrechungen: vi.fn(),
  fuegeHinzu: vi.fn(),
  uebernehmeBand: vi.fn(),
}))

vi.mock('../../src/renderer/composer/unterbrechungs-bearbeiten', () => ({
  setzeElementUnterbrechungen: d.setzeUnterbrechungen,
}))

vi.mock('../../src/renderer/composer/element-hinzufuegen', () => ({
  fuegeElementHinzu: d.fuegeHinzu,
}))

vi.mock('../../src/renderer/composer/einblendung-bearbeiten', async (importOriginal) => {
  // Nur den SCHREIBWEG ersetzen, die reinen Regeln (`fuegeAbschnittAn`,
  // `waehlbareBandVorlagen`) bleiben ECHT - sonst pruefte der Test seine eigene Attrappe.
  const echt = await importOriginal<
    typeof import('../../src/renderer/composer/einblendung-bearbeiten')
  >()
  return { ...echt, uebernehmeBand: d.uebernehmeBand }
})

function vorlage(id: string, hoehe: number | null): Vorlage {
  return { id, name: id, höhe: hoehe, parent: null, eingebaut: false, zonen: [] }
}

/** Die Vorlagen des Projekts: eine Bandvorlage (162) und eine Ganzbildvorlage (null). */
const VORLAGEN: readonly Vorlage[] = [vorlage('band-standard', 162), vorlage('vollbild', null)]

/** Ein Projekt mit EINEM Video (0-300 s) und ZWEI Aktionen: `akt-band` (Bandvorlage)
 *  und `akt-voll` (Ganzbild). Nur so lassen sich die beiden Wege unterscheiden. */
function projekt(): Project {
  const basis = {
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer: 5,
    markeId: 'm1',
    akzentfarbe: null,
  }
  return {
    id: 'p1',
    name: 'Probe',
    erstelltAm: '2026-10-14T00:00:00.000Z',
    geaendertAm: '2026-10-14T00:00:00.000Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [
      { ...basis, id: 'akt-band', titel: 'Band-Aktion', vorlagenId: 'band-standard' },
      { ...basis, id: 'akt-voll', titel: 'Ganzbild-Aktion', vorlagenId: 'vollbild' },
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
    holeVorlagen: () => VORLAGEN,
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

/** Welche Aktion wird gezogen? `akt-band` (Bandvorlage) oder `akt-voll` (Ganzbild). */
let gezogeneAktion = 'akt-voll'

function starte(x: number): void {
  const ereignis = {
    active: { data: { current: { referenz: gezogeneAktion } } },
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
    active: { data: { current: { referenz: gezogeneAktion } } },
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
  d.uebernehmeBand.mockReset()
  d.uebernehmeBand.mockResolvedValue({ ok: true, wert: projekt().liste[0] })
  gezogeneAktion = 'akt-voll'
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

describe('Drop auf den Video-Block (#442, Entscheidung 03.11.2026)', () => {
  it('legt fuer eine GANZBILD-Aktion eine UNTERBRECHUNG an der Zeitstelle an', async () => {
    // x = 100 im Koerper; Koerperstart 12 px, 8 px/s -> 11 s.
    starte(100)
    ueber(0)
    await beende()
    expect(d.setzeUnterbrechungen).toHaveBeenCalledWith('video-1', [
      { zeitstelle: 11, aktionRef: 'akt-voll', dauer: 5 },
    ])
    expect(d.uebernehmeBand).not.toHaveBeenCalled()
  })

  it('legt fuer eine BAND-Aktion einen ABSCHNITT ans Band - keine Unterbrechung', async () => {
    // Der Kern der Entscheidung: Eine Band-Aktion (1920 x 162) ist kein vollflaechiges
    // Segment und darf deshalb keine Unterbrechung werden (AD 4.5).
    gezogeneAktion = 'akt-band'
    starte(100)
    ueber(0)
    await beende()
    expect(d.setzeUnterbrechungen).not.toHaveBeenCalled()
    expect(d.uebernehmeBand).toHaveBeenCalledTimes(1)
    const [videoId, entwurf] = d.uebernehmeBand.mock.calls[0] as [
      string,
      { bandVorlageId: string; abschnitte: Array<{ aktionRef: string; dauer: number }> },
    ]
    expect(videoId).toBe('video-1')
    expect(entwurf.bandVorlageId).toBe('band-standard')
    expect(entwurf.abschnitte).toEqual([{ aktionRef: 'akt-band', dauer: 5 }])
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
    expect(d.fuegeHinzu.mock.calls[0]?.[0]).toBe('akt-voll')
    expect(d.fuegeHinzu.mock.calls[0]?.[1]).toBe(0)
    expect(d.setzeUnterbrechungen).not.toHaveBeenCalled()
    expect(d.uebernehmeBand).not.toHaveBeenCalled()
  })
})

describe('„Ins Video" als KLICK (02.11.2026) - DIESELBE Regel wie der Drop', () => {
  it('nimmt eine GANZBILD-Aktion an der uebergebenen Zeitstelle als Unterbrechung auf', async () => {
    await act(async () => {
      zug?.legeAktionInsVideo('video-1', 'akt-voll', 42)
      await Promise.resolve()
    })
    expect(d.setzeUnterbrechungen).toHaveBeenCalledWith('video-1', [
      { zeitstelle: 42, aktionRef: 'akt-voll', dauer: 5 },
    ])
    // KEIN zweiter Weg: der Klick reiht nichts Sequenzielles ein.
    expect(d.fuegeHinzu).not.toHaveBeenCalled()
    expect(d.uebernehmeBand).not.toHaveBeenCalled()
  })

  it('legt eine BAND-Aktion als Abschnitt ab - auch ohne Zeitstelle', async () => {
    // Ein Band-Abschnitt braucht keine Zeitstelle (die Folge laeuft ab 0:00). Mit der
    // alten Regel waere hier "ohne Zeitstelle" gemeldet worden, statt zu schreiben.
    await act(async () => {
      zug?.legeAktionInsVideo('video-1', 'akt-band', null)
      await Promise.resolve()
    })
    expect(d.uebernehmeBand).toHaveBeenCalledTimes(1)
    expect(d.setzeUnterbrechungen).not.toHaveBeenCalled()
  })

  it('ohne Zeitstelle und ohne Band meldet der Weg - und schreibt nichts', async () => {
    await act(async () => {
      zug?.legeAktionInsVideo('video-1', 'akt-voll', null)
      await Promise.resolve()
    })
    expect(d.setzeUnterbrechungen).not.toHaveBeenCalled()
    expect(d.uebernehmeBand).not.toHaveBeenCalled()
  })
})
