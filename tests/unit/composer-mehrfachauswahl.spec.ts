// #392 - Mehrfachauswahl an der Composer-Wurzel (jsdom).
//
// Geprueft wird der Weg, den der Nutzer geht: zwei Bloecke in der Zeitleiste
// auswaehlen (Klick + Shift), die Auswahl-Leiste erscheint, "Entfernen" schickt
// GENAU EIN `setzeListe` mit der gefilterten Liste (ein Undo-Schritt). Die
// Auswahl-Logik selbst deckt mehrfachauswahl.spec.ts ab; hier geht es um die
// Verdrahtung und den EINEN Schreibweg.
//
// Die schweren Ansichten sind doppelt (Muster composer-statistik.spec.ts); die
// Zeitleiste und die Wurzel laufen echt.
// @vitest-environment jsdom
import { createElement, act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'

import type { Listenelement, Project } from '../../src/shared/contracts/project'

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('../../src/renderer/composer/liste-ansicht.tsx', () => ({
  Wiedergabeliste: () => createElement('div', { 'data-testid': 'wiedergabeliste-doppel' }),
}))
vi.mock('../../src/renderer/composer/element-zeile.tsx', () => ({
  ElementBedienung: () => createElement('div', { 'data-testid': 'element-bedienung-doppel' }),
}))
vi.mock('../../src/renderer/composer/render-ausloesen', () => ({
  loeseRenderAus: vi.fn(),
  loeseExportAus: vi.fn(),
}))
vi.mock('../../src/renderer/gemeinsam/marken-bereitstellung', () => ({
  holeBereiteMarke: vi.fn(() => null),
}))
vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: vi.fn(async () => ({ ok: true, wert: [] })),
}))
vi.mock('../../src/renderer/ipc-client/pfad-fuer-datei', () => ({
  pfadFuerDatei: vi.fn(() => null),
}))
vi.mock('../../src/renderer/composer/element-hinzufuegen', () => ({
  fuegeElementHinzu: vi.fn(),
}))
vi.mock('../../src/renderer/composer/element-entfernen', () => ({
  entferneElementAusListe: vi.fn(),
  entferneElementeAusListe: vi.fn(async () => ({ ok: true, wert: undefined })),
}))

import { entferneElementeAusListe } from '../../src/renderer/composer/element-entfernen'
import { ComposerWurzel } from '../../src/renderer/composer/index'

function segment(id: string): Listenelement {
  return { id, art: 'segment', ref: 'a1', dauer: 10, trimStart: null, trimEnde: null, einblendung: null }
}

function baueProjekt(liste: Listenelement[]): Project {
  return {
    id: 'p-1',
    name: 'Testprojekt',
    erstelltAm: '2026-10-31T00:00:00Z',
    geaendertAm: '2026-10-31T00:00:00Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste,
    letzterAusgabeName: null,
    standardMarkeId: 'marke-eingebaut',
    standardSegmentdauer: 10,
  } as Project
}

function baueEigenschaften(projekt: Project) {
  const zugang = {
    lade: vi.fn(),
    hole: vi.fn(() => ({ projekt, ladefehler: null })),
    setzeProjekt: vi.fn(),
    setzeListe: vi.fn(),
    gleicheElementAb: vi.fn(),
    leere: vi.fn(),
    aufGeaendert: vi.fn(() => () => {}),
  }
  return {
    sichtbar: true,
    projekt: zugang,
    zeichnen: {
      bereiteVor: vi.fn(),
      hole: vi.fn(() => ({ vorlagen: [] })),
      verwirfMotivBestand: vi.fn(),
    },
    vorlagen: { lade: vi.fn(), hole: vi.fn(() => null), aufGeaendert: vi.fn(() => () => {}) },
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

async function zeichne(projekt: Project): Promise<ReturnType<typeof baueEigenschaften>> {
  const eigenschaften = baueEigenschaften(projekt)
  await act(async () => {
    wurzel.render(createElement(ComposerWurzel, eigenschaften as never))
  })
  await act(async () => {})
  return eigenschaften
}

function block(index: number): HTMLElement | null {
  return behaelter.querySelector<HTMLElement>(`[data-testid="zeitleiste-block-${index}"]`)
}

function klicke(element: HTMLElement | null, zusatz: MouseEventInit = {}): void {
  act(() => {
    element?.dispatchEvent(new MouseEvent('click', { bubbles: true, ...zusatz }))
  })
}

beforeEach(() => {
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  wurzel = createRoot(behaelter)
})

afterEach(() => {
  act(() => {
    wurzel.unmount()
  })
  behaelter.remove()
})

describe('#392: Mehrfachauswahl an der Wurzel', () => {
  it('Klick + Shift-Klick waehlt den Bereich; "Entfernen" schreibt EINMAL die gefilterte Liste', async () => {
    const eigenschaften = await zeichne(baueProjekt([segment('e1'), segment('e2'), segment('e3')]))

    klicke(block(0))
    klicke(block(2), { shiftKey: true })

    const leiste = behaelter.querySelector('[data-testid="composer-auswahl"]')
    expect(leiste?.textContent).toBe('3 ausgewählt')
    expect(
      behaelter.querySelector('[data-testid="zeitleiste-block-1"]')?.getAttribute('data-ausgewaehlt'),
    ).toBe('ja')

    act(() => {
      ;(behaelter.querySelector('[data-testid="composer-auswahl-entfernen"]') as HTMLButtonElement).click()
    })

    // EIN Store-Aufruf, EIN Sicht-Schreiber - nicht `setzeListe` direkt (das schriebe
    // nur die Sicht, nicht project.json; am Treiber gemessen).
    expect(entferneElementeAusListe).toHaveBeenCalledTimes(1)
    expect(entferneElementeAusListe).toHaveBeenCalledWith(
      ['e1', 'e2', 'e3'],
      eigenschaften.projekt.setzeListe,
    )
    expect(eigenschaften.projekt.setzeListe).not.toHaveBeenCalled()
    // Die Auswahl ist nach dem Entfernen leer - die Leiste verschwindet.
    expect(behaelter.querySelector('[data-testid="composer-auswahl"]')).toBeNull()
  })

  it('Cmd-Klick schaltet um; nur EIN ausgewaehltes Element zeigt KEINE Leiste', async () => {
    await zeichne(baueProjekt([segment('e1'), segment('e2'), segment('e3')]))

    klicke(block(0))
    klicke(block(1), { metaKey: true })
    expect(behaelter.querySelector('[data-testid="composer-auswahl"]')?.textContent).toBe('2 ausgewählt')

    klicke(block(1), { metaKey: true })
    expect(behaelter.querySelector('[data-testid="composer-auswahl"]')).toBeNull()
    // Einzelklick bleibt: Block 0 ist weiter ausgewaehlt, Block 1 nicht.
    expect(block(0)?.getAttribute('data-ausgewaehlt')).toBe('ja')
    expect(block(1)?.getAttribute('data-ausgewaehlt')).toBe('nein')
  })

  it('Ctrl-Klick wirkt wie Cmd (Windows/Linux)', async () => {
    await zeichne(baueProjekt([segment('e1'), segment('e2')]))
    klicke(block(0))
    klicke(block(1), { ctrlKey: true })
    expect(behaelter.querySelector('[data-testid="composer-auswahl"]')?.textContent).toBe('2 ausgewählt')
  })
})
