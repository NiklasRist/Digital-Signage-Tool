// Tests zur Ansicht „Eigenschaften" (02.11.2026).
//
// Zwei Zusagen: (1) Ohne Auswahl sagt die Ansicht, was zu tun ist - sie bleibt nicht leer.
// (2) Mit Auswahl zeigt sie Kopf, Position und die FOLGE und montiert die BESTEHENDE
// Bedienung (#249) - keine zweite. Dass der Regler wirklich schreibt, prueft weiterhin
// `element-zeile`; hier wird die Montage belegt.
// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type JSX } from 'react'
import { afterAll, describe, expect, it } from 'vitest'

import type { Listenelement, Project } from '../../src/shared/contracts/project'
import type { ListenZeileModell } from '../../src/renderer/composer/liste-ansicht'
import { EigenschaftenAnsicht } from '../../src/renderer/composer/eigenschaften-ansicht.tsx'

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

function projekt(liste: Listenelement[]): Project {
  return {
    id: 'p1',
    name: 'Probe',
    erstelltAm: '2026-01-01T00:00:00.000Z',
    geaendertAm: '2026-01-01T00:00:00.000Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste,
    letzterAusgabeName: null,
    standardMarkeId: 'm1',
    standardSegmentdauer: 10,
  }
}

const element: Listenelement = {
  id: 'e1',
  art: 'segment',
  ref: 'a1',
  dauer: 10,
  trimStart: null,
  trimEnde: null,
  einblendung: null,
}

const bedienung = (modell: ListenZeileModell): JSX.Element =>
  createElement('span', { 'data-testid': 'bedienung-probe' }, modell.bezeichnung)

afterAll(() => {
  for (const geraet of GERAETE) {
    act(() => geraet.wurzel.unmount())
    geraet.behaelter.remove()
  }
})

describe('EigenschaftenAnsicht', () => {
  it('ohne Auswahl sagt sie, was zu tun ist', () => {
    const behaelter = montiere(
      createElement(EigenschaftenAnsicht, {
        projekt: projekt([element]),
        ausgewaehlt: [],
        stellen: [],
        bedienung,
      }),
    )
    expect(behaelter.querySelector('[data-testid="eigenschaften-leer"]')).not.toBeNull()
    expect(behaelter.querySelector('[data-testid="eigenschaften"]')).toBeNull()
  })

  it('zeigt Kopf, Position, Folge und die BESTEHENDE Bedienung', () => {
    const behaelter = montiere(
      createElement(EigenschaftenAnsicht, {
        projekt: projekt([element]),
        ausgewaehlt: ['e1'],
        stellen: [],
        bedienung,
      }),
    )
    expect(behaelter.querySelector('[data-testid="eigenschaften"]')).not.toBeNull()
    expect(behaelter.querySelector('[data-testid="eigenschaften-position"]')?.textContent).toBe(
      'Block 1 von 1',
    )
    // Die Folge nennt die Gesamtlaenge des Projekts - nicht die Dauer des Blocks.
    expect(behaelter.querySelector('[data-testid="eigenschaften-folge"]')?.textContent).toContain(
      'Gesamt 0:10',
    )
    // Die Bedienung wird montiert und bekommt DAS Modell der Auswahl.
    expect(behaelter.querySelector('[data-testid="bedienung-probe"]')).not.toBeNull()
  })

  it('bei Mehrfachauswahl sagt sie, dass hier der erste steht', () => {
    const zweites: Listenelement = { ...element, id: 'e2', ref: 'a2' }
    const behaelter = montiere(
      createElement(EigenschaftenAnsicht, {
        projekt: projekt([element, zweites]),
        ausgewaehlt: ['e1', 'e2'],
        stellen: [],
        bedienung,
      }),
    )
    expect(behaelter.querySelector('[data-testid="eigenschaften-mehrfach"]')?.textContent).toContain(
      '2 Blöcke',
    )
  })

  it('ein Block, der nicht mehr existiert, sagt das statt zu werfen', () => {
    const behaelter = montiere(
      createElement(EigenschaftenAnsicht, {
        projekt: projekt([element]),
        ausgewaehlt: ['weg'],
        stellen: [],
        bedienung,
      }),
    )
    expect(behaelter.querySelector('[data-testid="eigenschaften-weg"]')).not.toBeNull()
  })
})
