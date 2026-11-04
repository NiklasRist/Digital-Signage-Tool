// FA-03-Nachlauf: Ein gescheitertes Speichern im Aktions-Editor war UNSICHTBAR
// (`einspeisen` verwarf `ok: false`, `feldVerlassen` kehrte still zurueck).
//
// SEIT DEM UMBau (04.11.2026) gilt EIN Speichermodell: Felder schreiben in den ENTWURF,
// geschrieben wird erst beim Abschluss („Fertig"). Geprueft wird hier beides - dass das
// Tippen NICHT schreibt, und dass ein abgelehnter Abschluss sichtbar ist.
// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type JSX } from 'react'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Project } from '../../src/shared/contracts/project'

// Die Vorschau- und Vorlagenwege laufen ins Leere - hier interessiert nur der Speicherweg.
vi.mock('../../src/renderer/action-editor/live-vorschau', () => ({
  bereiteVorschauVor: vi.fn(async () => ({ ok: true, wert: undefined })),
  bereiteMotivVorFuer: vi.fn(async () => undefined),
  haengeVorschauEin: vi.fn(),
  zeichneVorschau: vi.fn(),
}))

vi.mock('../../src/renderer/action-editor/vorlage-waehlen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/renderer/action-editor/vorlage-waehlen')>()),
  ladeWaehlbareVorlagen: vi.fn(async () => ({ ok: true, wert: [] })),
}))

vi.mock('../../src/renderer/gemeinsam/marken-bereitstellung', () => ({
  // Seit 03.11.2026 liest das Formular `farben.akzent` fuer den Farbwaehler.
  holeBereiteMarke: vi.fn(() => ({ id: 'm1', farben: { akzent: '#ff4040' } })),
}))

const speichereAktion = vi.fn()
vi.mock('../../src/renderer/action-editor/aktion-bearbeiten', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/renderer/action-editor/aktion-bearbeiten')>()),
  speichereAktion: (...args: unknown[]) => speichereAktion(...args),
}))

import { ActionEditorWurzel } from '../../src/renderer/action-editor/index.tsx'

const GERAETE: Array<{ wurzel: Root; behaelter: HTMLDivElement }> = []

function montiere(element: JSX.Element): HTMLDivElement {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel = createRoot(behaelter)
  GERAETE.push({ wurzel, behaelter })
  act(() => {
    wurzel.render(element)
  })
  return behaelter
}

beforeEach(() => {
  speichereAktion.mockReset()
})

afterAll(() => {
  for (const geraet of GERAETE) {
    act(() => geraet.wurzel.unmount())
    geraet.behaelter.remove()
  }
})

function aktion(id: string, titel: string): Aktion {
  return {
    id,
    titel,
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer: null,
    vorlagenId: 'vollbild',
    markeId: 'm1',
    akzentfarbe: null,
  }
}

function projekt(aktionen: Aktion[]): Project {
  return {
    id: 'p1',
    name: 'Testprojekt',
    erstelltAm: '2026-10-27T00:00:00.000Z',
    geaendertAm: '2026-10-27T00:00:00.000Z',
    schemaVersion: 1,
    standardSegmentdauer: 10,
    standardMarkeId: 'm1',
    letzterAusgabeName: null,
    assets: [],
    aktionen,
    liste: [],
  }
}

/** Die Wurzel mit dem uebergebenen Projektstand; `setzeProjekt` merkt den Aufruf. */
function editor(p: Project): { behaelter: HTMLDivElement; setzeProjekt: ReturnType<typeof vi.fn> } {
  const setzeProjekt = vi.fn()
  const behaelter = montiere(
    createElement(ActionEditorWurzel, {
      sichtbar: true,
      projekt: {
        hole: () => ({ projekt: p, ladefehler: null }),
        setzeProjekt,
        lade: vi.fn(),
        setzeListe: vi.fn(),
        gleicheElementAb: vi.fn(),
        leere: vi.fn(),
        aufGeaendert: vi.fn(() => () => {}),
      },
      zeichnen: { bereiteVor: vi.fn(), hole: vi.fn(() => null), verwirfMotivBestand: vi.fn() },
      vorlagen: { lade: vi.fn(), hole: vi.fn(() => null), aufGeaendert: vi.fn(() => () => {}) },
      marken: {
        lade: vi.fn(),
        hole: vi.fn(() => ({ marken: [] })),
        aufGeaendert: vi.fn(() => () => {}),
      },
      hervorgehobeneAktionId: null,
    } as unknown as Parameters<typeof ActionEditorWurzel>[0]),
  )
  return { behaelter, setzeProjekt }
}

/** Ein Klick mit Zeit: seit dem Umbau kann ein Klick SCHREIBEN (s. Kopf). */
async function klicke(behaelter: HTMLDivElement, testid: string): Promise<void> {
  const knopf = behaelter.querySelector(`[data-testid="${testid}"]`)
  if (knopf === null) throw new Error(`Knopf ${testid} fehlt`)
  await act(async () => {
    ;(knopf as HTMLButtonElement).click()
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

/** Klick auf die Kachel im Bildstreifen - der Weg, der die Auswahl setzt. */
async function waehleZeile(behaelter: HTMLDivElement): Promise<void> {
  const knopf = behaelter.querySelector('[data-testid="aktion-bibliothek"] [data-testid^="aktion-strip-"]')
  if (knopf === null) throw new Error('Aktionszeile fehlt')
  await act(async () => {
    ;(knopf as HTMLButtonElement).click()
    await Promise.resolve()
    await Promise.resolve()
  })
}

/** Feldwert setzen und das Feld VERLASSEN - Reacts onBlur haengt an `focusout`. */
async function verlasseFeld(behaelter: HTMLDivElement, wert: string): Promise<void> {
  const feld = behaelter.querySelector('[data-testid="aktion-titel"]') as HTMLInputElement | null
  if (feld === null) throw new Error('Titelfeld fehlt')
  const setzeWert = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  await act(async () => {
    setzeWert?.call(feld, wert)
    feld.dispatchEvent(new Event('input', { bubbles: true }))
    feld.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await Promise.resolve()
    await Promise.resolve()
  })
}

function meldung(behaelter: HTMLDivElement): string | null {
  return behaelter.querySelector('[data-testid="aktion-speicher-meldung"]')?.textContent ?? null
}

describe('Ein Modell: das Tippen schreibt NICHT, der Abschluss schreibt EINMAL', () => {
  it('ein Feld zu verlassen ruft speichereAktion NICHT - erst „Fertig"', async () => {
    speichereAktion.mockResolvedValue({ ok: true, wert: aktion('a1', 'Durchlauf-Aktion-bearbeitet') })
    const { behaelter } = editor(projekt([aktion('a1', 'Durchlauf-Aktion')]))
    await waehleZeile(behaelter)

    await verlasseFeld(behaelter, 'Durchlauf-Aktion-bearbeitet')
    // Der Entwurf traegt den neuen Titel (im Titelfeld sichtbar), geschrieben ist nichts.
    expect(behaelter.querySelector<HTMLInputElement>('[data-testid="aktion-titel"]')?.value).toBe(
      'Durchlauf-Aktion-bearbeitet',
    )
    expect(speichereAktion).toHaveBeenCalledTimes(0)

    await klicke(behaelter, 'aktion-anlegen-bestaetigen')
    expect(speichereAktion).toHaveBeenCalledTimes(1)
    // NUR das geaenderte Feld - kein vollstaendiger Satz, keine Nicht-Aenderung.
    expect(speichereAktion).toHaveBeenCalledWith('a1', { titel: 'Durchlauf-Aktion-bearbeitet' })
  })

  it('ohne Aenderung schreibt „Fertig" NICHTS (kein Undo-Schritt fuer nichts)', async () => {
    const { behaelter } = editor(projekt([aktion('a1', 'Durchlauf-Aktion')]))
    await waehleZeile(behaelter)

    await klicke(behaelter, 'aktion-anlegen-bestaetigen')
    expect(speichereAktion).toHaveBeenCalledTimes(0)
  })

  it('ein Fehler von speichereAktion erscheint als Meldung am Editor', async () => {
    speichereAktion.mockResolvedValue({
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'Die Datei ist gesperrt.' },
    })
    const { behaelter } = editor(projekt([aktion('a1', 'Durchlauf-Aktion')]))
    await waehleZeile(behaelter)

    await verlasseFeld(behaelter, 'Durchlauf-Aktion-bearbeitet')
    await klicke(behaelter, 'aktion-anlegen-bestaetigen')

    expect(meldung(behaelter)).toContain('Nicht gespeichert')
    expect(meldung(behaelter)).toContain('Die Datei ist gesperrt.')
  })

  it('ein erfolgreiches Speichern laesst KEINE Meldung stehen', async () => {
    speichereAktion.mockResolvedValue({ ok: true, wert: aktion('a1', 'Durchlauf-Aktion-bearbeitet') })
    const { behaelter } = editor(projekt([aktion('a1', 'Durchlauf-Aktion')]))
    await waehleZeile(behaelter)

    await verlasseFeld(behaelter, 'Durchlauf-Aktion-bearbeitet')
    await klicke(behaelter, 'aktion-anlegen-bestaetigen')

    expect(speichereAktion).toHaveBeenCalledTimes(1)
    expect(meldung(behaelter)).toBeNull()
  })

  it('ein leerer Titel wird AM ABSCHLUSS abgelehnt - kein Schreibweg', async () => {
    const { behaelter } = editor(projekt([aktion('a1', 'Sommeraktion')]))
    await waehleZeile(behaelter)

    await verlasseFeld(behaelter, '   ')
    await klicke(behaelter, 'aktion-anlegen-bestaetigen')

    expect(speichereAktion).toHaveBeenCalledTimes(0)
    expect(behaelter.querySelector('[data-testid="aktion-befund"]')?.textContent ?? '').toContain(
      'Der Titel fehlt',
    )
  })
})
