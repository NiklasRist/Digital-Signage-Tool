// Issue #424 / FA-21 - die sichtbaren Undo/Redo-Pfeile und die Tastatur (jsdom).
//
// Geprueft wird:
//   - ohne Bereich (Marken/Projekte) sind beide Pfeile AUS,
//   - Projekt-Bereich: an, sobald ein Schnappschuss vorliegt; Klick und Cmd+Z rufen
//     den BESTEHENDEN Projekt-Weg (macheRueckgaengig) - kein zweiter Undo-Pfad,
//   - Vorlagen-Bereich: an, sobald die Vorlagen-Historie einen Stand hat; Klick und
//     Cmd+Z rufen den VORLAGEN-Weg (macheVorlageRueckgaengig),
//   - in einem Textfeld bleibt Cmd+Z dem Feld (#431).
// @vitest-environment jsdom
import { createElement, act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'

import type { Project } from '../../src/shared/contracts/project'
import type { Vorlage } from '../../src/shared/contracts/vorlage'
import type { ProjektZugang } from '../../src/renderer/app-shell/sichten'
import type { VorlagenUndoZugang } from '../../src/renderer/app-shell/undo-vorlage'
import type { EditorSitzung } from '../../src/renderer/vorlagen-editor/arbeitskopie'
import { UndoPfeile } from '../../src/renderer/app-shell/undo-pfeile'
import {
  setzeHistorienZurueck,
  vorlagenHistorie,
} from '../../src/renderer/app-shell/undo-historien'
import { merkeVorAenderung } from '../../src/renderer/app-shell/undo-projekt'

// Der Projekt-Undo schreibt ueber `project:setzeBearbeitungsstand` zurueck - hier ein
// Doppel, damit kein IPC noetig ist. Es liefert das angenommene Projekt zurueck.
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

function vorlage(id: string): Vorlage {
  return {
    id,
    name: 'Arbeitskopie',
    höhe: null,
    parent: 'v-1',
    eingebaut: false,
    zonen: [],
  }
}

function sitzung(teil: Partial<EditorSitzung> = {}): EditorSitzung {
  return {
    arbeitsId: 'ak-1',
    arbeitskopie: vorlage('ak-1'),
    parentId: 'v-1',
    parentName: 'Vorlage',
    parentEingebaut: false,
    ueberarbeitenErlaubt: true,
    ueberarbeitenGrund: null,
    festeZonenSoll: [],
    ...teil,
  }
}

function vorlagenZugang(): {
  zugang: VorlagenUndoZugang
  setzeSitzung: ReturnType<typeof vi.fn>
  sichereStand: ReturnType<typeof vi.fn>
} {
  let aktuell = sitzung()
  const setzeSitzung = vi.fn((neu: EditorSitzung) => {
    aktuell = neu
  })
  const sichereStand = vi.fn(async (_s: EditorSitzung, stand: Vorlage) => ({
    ok: true as const,
    wert: sitzung({ arbeitskopie: stand }),
  }))
  return {
    zugang: {
      holeSitzung: () => aktuell,
      setzeSitzung,
      sichereStand,
    },
    setzeSitzung,
    sichereStand,
  }
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

function zeichne(
  bereich: 'projekt-bearbeitung' | 'vorlagen-editor' | null,
  zug: ProjektZugang | null,
  vorlagen?: VorlagenUndoZugang,
): void {
  act(() => {
    wurzel.render(
      createElement(UndoPfeile, {
        bereich,
        holeProjektzugang: () => zug,
        holeVorlagenzugang: vorlagen === undefined ? undefined : () => vorlagen,
        meldeFehler: () => undefined,
      }),
    )
  })
}

function pfeil(name: 'undo-pfeil' | 'redo-pfeil'): HTMLButtonElement {
  const knopf = behaelter.querySelector<HTMLButtonElement>(`[data-testid="${name}"]`)
  if (knopf === null) throw new Error(`${name} fehlt`)
  return knopf
}

async function klickePfeil(name: 'undo-pfeil' | 'redo-pfeil'): Promise<void> {
  await act(async () => {
    pfeil(name).click()
    await Promise.resolve()
    await Promise.resolve()
  })
}

async function taste(key: string, shift = false, ziel: EventTarget = document): Promise<void> {
  await act(async () => {
    ziel.dispatchEvent(
      new KeyboardEvent('keydown', {
        key,
        metaKey: true,
        shiftKey: shift,
        bubbles: true,
        cancelable: true,
      }),
    )
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('UndoPfeile (#424/FA-21)', () => {
  it('ohne wirksamen Bereich (Marken/Projekte) sind beide Pfeile abgeschaltet', () => {
    zeichne(null, zugang(projekt(), () => undefined))
    expect(pfeil('undo-pfeil').disabled).toBe(true)
    expect(pfeil('redo-pfeil').disabled).toBe(true)
  })

  it('Projekt-Bereich ohne Schnappschuss: abgeschaltet', () => {
    zeichne('projekt-bearbeitung', zugang(projekt(), () => undefined))
    expect(pfeil('undo-pfeil').disabled).toBe(true)
  })

  it('Projekt-Bereich mit Schnappschuss: Klick ruft den bestehenden Projekt-Weg', async () => {
    const p = projekt()
    const setzeProjekt = vi.fn()
    merkeVorAenderung({ holeProjekt: () => p, setzeProjekt })
    zeichne('projekt-bearbeitung', zugang(p, setzeProjekt))

    expect(pfeil('undo-pfeil').disabled).toBe(false)
    await klickePfeil('undo-pfeil')

    expect(setzeProjekt).toHaveBeenCalledTimes(1)
  })

  it('Projekt-Bereich: Cmd+Z ruft denselben Weg - ohne Klick', async () => {
    const p = projekt()
    const setzeProjekt = vi.fn()
    merkeVorAenderung({ holeProjekt: () => p, setzeProjekt })
    zeichne('projekt-bearbeitung', zugang(p, setzeProjekt))

    await taste('z')

    expect(setzeProjekt).toHaveBeenCalledTimes(1)
  })

  it('Vorlagen-Bereich ohne Historie: abgeschaltet', () => {
    zeichne('vorlagen-editor', zugang(projekt(), () => undefined), vorlagenZugang().zugang)
    expect(pfeil('undo-pfeil').disabled).toBe(true)
  })

  it('Vorlagen-Bereich mit Historie: Klick und Cmd+Z nehmen die Arbeitskopie zurueck', async () => {
    vorlagenHistorie().ablegen(vorlage('ak-1'))
    const fake = vorlagenZugang()
    zeichne('vorlagen-editor', null, fake.zugang)

    expect(pfeil('undo-pfeil').disabled).toBe(false)
    await klickePfeil('undo-pfeil')

    expect(fake.sichereStand).toHaveBeenCalledTimes(1)
    expect(fake.setzeSitzung).toHaveBeenCalledTimes(1)

    // Shift+Cmd+Z stellt den Stand wieder vor - derselbe Zugang, kein zweiter Stapel.
    await taste('z', true)

    expect(fake.sichereStand).toHaveBeenCalledTimes(2)
    expect(fake.setzeSitzung).toHaveBeenCalledTimes(2)
  })

  it('in einem Textfeld bleibt Cmd+Z dem Feld (#431)', async () => {
    const p = projekt()
    const setzeProjekt = vi.fn()
    merkeVorAenderung({ holeProjekt: () => p, setzeProjekt })
    zeichne('projekt-bearbeitung', zugang(p, setzeProjekt))

    const feld = document.createElement('input')
    document.body.appendChild(feld)
    await taste('z', false, feld)
    feld.remove()

    expect(setzeProjekt).not.toHaveBeenCalled()
  })
})
