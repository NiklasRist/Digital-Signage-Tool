// Tests zu #414 - die Zeitleiste als Praesentation (Kanten-Sichtbarkeit je Zustand).
//
// Die DnD-Zustaende leben seit #414 auf der COMPOSER-WURZEL (EIN DndContext); die
// Zeitleiste kriegt sie als PROPS. Genau das macht den DoD-Teil "Zeitleiste zeigt
// beim Drag Kanten" hier im jsdom pruefbar: Ruhelage (keine Kanten), Neu-Drag
// (Kanten 0..N, aktive breiter), wartendes Einfuegen (Lade-Markierung).
//
// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, useRef, type JSX } from 'react'
import { DndContext } from '@dnd-kit/core'
import { afterAll, describe, expect, it } from 'vitest'

import type { Project } from '../../src/shared/contracts/project'
import { Zeitleiste, baueZeitleistenZeilen } from '../../src/renderer/composer/zeitleiste.tsx'

const GERAETE: Array<{ wurzel: Root; behaelter: HTMLDivElement }> = []

function projekt(anzahl: number): Project {
  const rahmen = projektLeer()
  rahmen.liste = Array.from({ length: anzahl }, (_, stelle) => ({
    id: `e${stelle}`,
    art: 'segment',
    ref: `k${stelle}`,
    dauer: 10,
    trimStart: null,
    trimEnde: null,
    einblendung: null,
  }))
  return rahmen
}

function projektLeer(): Project {
  return {
    id: 'p1',
    name: 'Probe',
    erstelltAm: '2026-10-14T00:00:00.000Z',
    geaendertAm: '2026-10-14T00:00:00.000Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
    standardMarkeId: 'marke-x',
    standardSegmentdauer: 10,
  }
}

interface ZeitleistenTestEigenschaften {
  projekt: Project | null
  neuZug: string | null
  aktiveKante: number | null
  laedtKante: number | null
}

/** Der Korb-Messraum (korbRef) ist Prop der Komponente (#414); der Test liest das DOM
 *  ueber data-testid und braucht den Ref-Wert selbst nicht. */
function ZeitleistenTest(richtung: ZeitleistenTestEigenschaften): JSX.Element {
  const leereRef = useRef<HTMLDivElement | null>(null)
  const kinder = createElement(Zeitleiste, {
    projekt: richtung.projekt,
    neuZug: richtung.neuZug,
    aktiveKante: richtung.aktiveKante,
    laedtKante: richtung.laedtKante,
    korbRef: leereRef,
  })
  return createElement(DndContext, null, kinder)
}

function montiere(richtung: ZeitleistenTestEigenschaften): HTMLDivElement {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel = createRoot(behaelter)
  GERAETE.push({ wurzel, behaelter })
  act(() => {
    wurzel.render(createElement(ZeitleistenTest, richtung))
  })
  return behaelter
}

function kante(behaelter: HTMLDivElement, nummer: number): HTMLElement | null {
  return behaelter.querySelector<HTMLElement>(`[data-testid="zeitleiste-kante-${nummer}"]`)
}

afterAll(() => {
  for (const geraet of GERAETE) {
    act(() => geraet.wurzel.unmount())
    geraet.behaelter.remove()
  }
})

describe('Die Zeitleiste zeigt die Einfuege-Kanten (#414)', () => {
  it('Ruhelage: KEINE Kante, die Bloecke liegen aneinander', () => {
    const behaelter = montiere({ projekt: projekt(2), neuZug: null, aktiveKante: null, laedtKante: null })
    expect(kante(behaelter, 0)).toBeNull()
    expect(kante(behaelter, 1)).toBeNull()
    expect(behaelter.querySelector('[data-testid="zeitleiste-block-0"]')).not.toBeNull()
    expect(behaelter.querySelector('[data-testid="zeitleiste-block-1"]')).not.toBeNull()
  })

  it('Neu-Drag: Kanten 0..N erscheinen (Liste mit 2 -> 3 Kanten, inklusive Ende-Kante)', () => {
    const behaelter = montiere({ projekt: projekt(2), neuZug: 'a1', aktiveKante: null, laedtKante: null })
    expect(kante(behaelter, 0)).not.toBeNull()
    expect(kante(behaelter, 1)).not.toBeNull()
    expect(kante(behaelter, 2)).not.toBeNull()
  })

  it('Die aktive Kante ist breiter als die Ruhelage (der Spalt oeffnet sich)', () => {
    const behaelter = montiere({ projekt: projekt(2), neuZug: 'a1', aktiveKante: 1, laedtKante: null })
    const aktiv = kante(behaelter, 1)
    const ruhig = kante(behaelter, 0)
    expect(aktiv).not.toBeNull()
    expect(ruhig).not.toBeNull()
    const breiteAktiv = Number.parseInt(aktiv!.style.width, 10)
    const breiteRuhig = Number.parseInt(ruhig!.style.width, 10)
    expect(breiteAktiv).toBeGreaterThan(breiteRuhig)
  })

  it('Die wartende Kante traegt die Lade-Markierung (nicht optimistisch, TK 9.7.3)', () => {
    const behaelter = montiere({ projekt: projekt(2), neuZug: 'a1', aktiveKante: null, laedtKante: 1 })
    expect(kante(behaelter, 1)?.textContent).toBe('…')
    expect(kante(behaelter, 0)?.textContent).toBe('+')
  })

  it('Die Kanten-Kette folgt der Listenlaenge (Basis des MESSVORRATS an der Wurzel)', () => {
    const zeilen = baueZeitleistenZeilen(projekt(3).liste)
    expect(zeilen).toHaveLength(3)
    // 3 Bloeken + Ende-Kante = Kanten 0..3; die Nummern baut die Wurzel aus der
    // Listenlaenge (baueEinfugeKanten) - die Zahlen selbst deckt spalt-drop.spec.ts ab.
  })
})
