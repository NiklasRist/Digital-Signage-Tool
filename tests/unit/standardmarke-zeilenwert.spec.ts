// Issue #410: Die Standardmarke-Zeile las ihren Wert aus dem LISTEN-Meta - und die
// Liste liest die DATEI, deren Schreibpfad beim GELADENEN Projekt entprellt laeuft
// (Zweig A, planeAutoSpeicherung). Der Wechsel bestätigt aber ein frisches Project
// (IPC-Antwort), das uebernimmProjekt in die gemeinsame LEGT - die Zeile liest es
// NICHT. Der Fix: Bei der OFFENEN Zeile kommt der Wert aus der Projekt-Sicht, bei
// fremden Zeilen bleibt es der Listen-Wert.
//
// Geprueft wird NUR die Datei src/renderer/projekt-verwaltung/index.tsx (+ dieser
// Test). liste.ts, beschaedigt und die Wirkungs-Bausteine sind DOPPEL.

// @vitest-environment jsdom
import { createElement, act, type ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'

import type { Projektsicht } from '../../src/renderer/composer/projektzustand'
import type { ProjektMeta } from '../../src/shared/contracts/projekt-meta'
import type { Project } from '../../src/shared/contracts/project'
import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import { ProjektVerwaltungWurzel } from '../../src/renderer/projekt-verwaltung'

// Die Bausteine der Ansicht sind GETEILT - hier nur ein Doppel der Liste (#222).
const listeDoppel = vi.hoisted(() => {
  const stand: { zustand: "geladen" | "unbekannt"; eintraege: readonly ProjektMeta[]; ladefehler: null | { code: string; meldung: string } } =
    { zustand: "geladen", eintraege: [] as readonly ProjektMeta[], ladefehler: null }
  const hoerer: Array<(l: unknown) => void> = []
  return {
    stand,
    hoerer,
    holeProjektliste: () => stand,
    ladeProjektliste: vi.fn(async (): Promise<Ergebnis<readonly ProjektMeta[], string>> => ({ ok: true, wert: [] })),
    aufProjektlisteGeaendert: (neu: (l: { zustand: "geladen" | "unbekannt"; eintraege: readonly ProjektMeta[]; ladefehler: null | { code: string; meldung: string } }) => void) => {
      hoerer.push(neu as (l: unknown) => void)
      return () => undefined
    },
  }
})

vi.mock(import('../../src/renderer/projekt-verwaltung/liste'), async (importOriginal) => {
  const ist = await importOriginal() as Record<string, unknown>
  return { ...ist,
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
  legeProjektAn: vi.fn(),
  oeffneProjekt: vi.fn(),
  pruefeProjektname: vi.fn(() => ({ art: 'ok' })),
}))
vi.mock('../../src/renderer/projekt-verwaltung/duplizieren', () => ({
  baueDuplizierHinweis: vi.fn(() => null),
  dupliziereProjekt: vi.fn(),
  pruefeDuplikatname: vi.fn(() => ({ art: 'ok' })),
  schlageDuplikatnamenVor: vi.fn(() => 'duplikat'),
}))
vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: vi.fn(async () => ({ ok: true, wert: {} })),
}))

const MARKE_A = '48208639-229d-4ae5-a23f-45afd7e414da'
const MARKE_B = 'ae1eed1f-2062-46fa-868a-53ec53407015'

function meta(id: string, name: string, markeId: string): ProjektMeta {
  return {
    id,
    name,
    erstelltAm: '2026-10-13T00:00:00.000Z',
    geaendertAm: '2026-10-13T00:00:00.000Z',
    ordner: id,
    beschaedigt: false,
    anzahlMedien: 0,
    anzahlAusgaben: 0,
    standardMarkeId: markeId,
  }
}

const OFFENES_PROJEKT = '978aa8fb-2222-3333-4444-555566667777'
const FREMDES_PROJEKT = 'aaaaaaaa-bbbb-cccc-dddd-eeeeffff0000'

function baueEigenschaften(sichtProjekt: Project | null): Record<string, unknown> {
  return {
    sichtbar: true,
    projekt: {
      hole: () => ({ projekt: sichtProjekt, ladefehler: null }) as Projektsicht,
      aufGeaendert: () => () => undefined,
      setzeProjekt: () => undefined,
    },
    zeichnen: { hole: () => null },
    leereProjektHistorie: () => undefined,
    wechsleZuZusammenstellen: () => undefined,
    starteVideoImport: () => undefined,
    marken: {
      hole: () => ({
        marken: [
          { id: MARKE_A, name: 'Fitnessworld24', eingebaut: true },
          { id: MARKE_B, name: 'DurchlaufMarke', eingebaut: false },
        ],
      }),
      lade: async () => null,
      aufGeaendert: () => () => undefined,
    },
  }
}

const GERAETE: Array<{ behaelter: HTMLElement; wurzel: Root }> = []

function rendere(eigenschaften: Record<string, unknown>): HTMLElement {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel: Root = createRoot(behaelter)
  act(() => {
    wurzel.render(createElement(ProjektVerwaltungWurzel, eigenschaften as never) as ReactElement)
  })
  GERAETE.push({ behaelter, wurzel })
  return behaelter
}

beforeEach(() => {
  listeDoppel.stand.eintraege = [
    meta(OFFENES_PROJEKT, 'Offen', MARKE_A), // die Liste traegt den ALTEN Wert
    meta(FREMDES_PROJEKT, 'Fremd', MARKE_A),
  ] as never
})

afterEach(() => {
  for (const geraet of GERAETE) {
    act(() => {
      geraet.wurzel.unmount()
    })
    geraet.behaelter.remove()
  }
  GERAETE.length = 0
})

describe('Standardmarke-Zeilen-Wert (#410)', () => {
  it('Die OFFENE Zeile zeigt den Wert der Projekt-Sicht (frisch nach dem Wechsel), trotz alter Liste', () => {
    // Der Wechsel bestätigte das frische Project (standardMarkeId = MARKE_B);
    // die Liste traegt NOCH den alten Wert (MARKE_A). Die Zeile MUSS die Sicht lesen.
    const eigenschaften = baueEigenschaften({
      id: OFFENES_PROJEKT,
      standardMarkeId: MARKE_B,
    } as unknown as Project)
    const behaelter = rendere(eigenschaften)
    const zeile = Array.from(behaelter.querySelectorAll('[data-testid^="projekt-"]'))
    const offeneZeile = zeile.find((z) => z.getAttribute('data-testid') === `projekt-${OFFENES_PROJEKT}`)
    expect(offeneZeile).toBeTruthy()
    const auswahl = offeneZeile?.querySelector('select[aria-label="Standardmarke"]')
    expect(auswahl !== null).toBe(true)
    expect((auswahl as unknown as HTMLSelectElement).value).toBe(MARKE_B)
  })

  it('Die FREMDE Zeile bleibt aud dem Listen-Wert (kein Sicht-Zugriff auf fremde Projekte)', () => {
    const eigenschaften = baueEigenschaften({
      id: OFFENES_PROJEKT,
      standardMarkeId: MARKE_B,
    } as unknown as Project)
    const behaelter = rendere(eigenschaften)
    const zeile = behaelter.querySelector(`[data-testid="projekt-${FREMDES_PROJEKT}"]`)
    expect(zeile).toBeTruthy()
    const auswahl = zeile?.querySelector('select[aria-label="Standardmarke"]')
    expect(auswahl !== null).toBe(true)
    expect((auswahl as unknown as HTMLSelectElement).value).toBe(MARKE_A)
  })
})
