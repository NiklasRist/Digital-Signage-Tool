// Tests zu #437 - die Unterbrechungs-Marken in der Zeitleiste und ihr Bild beim Drop.
//
// Die Marken liegen SEQUENZIELL im Video-Block (nach #435 verlaengern die Einschuebe das
// Element um ihre Dauer). Ein Klick auf eine Marke entfernt genau die Unterbrechung an
// ihrem Index; das Bild des Drop-Ziels unterscheidet Band (orange) und Unterbrechung
// (violett) anhand der VORLAGE der gezogenen Aktion.
//
// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, useRef, type JSX } from 'react'
import { DndContext } from '@dnd-kit/core'
import { afterAll, describe, expect, it, vi } from 'vitest'

import type { Project } from '../../src/shared/contracts/project'
import { Zeitleiste } from '../../src/renderer/composer/zeitleiste.tsx'

const GERAETE: Array<{ wurzel: Root; behaelter: HTMLDivElement }> = []

function projektMitEinschub(): Project {
  return {
    id: 'p1',
    name: 'Probe',
    erstelltAm: '2026-10-14T00:00:00.000Z',
    geaendertAm: '2026-10-14T00:00:00.000Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste: [
      {
        id: 'v0',
        art: 'video',
        ref: 'a0',
        dauer: null,
        trimStart: 0,
        trimEnde: 300,
        einblendung: null,
        unterbrechungen: [{ zeitstelle: 1, aktionRef: 'akt1', dauer: 2 }],
      },
    ],
    letzterAusgabeName: null,
    standardMarkeId: 'marke-x',
    standardSegmentdauer: 10,
  }
}

interface Eigenschaften {
  projekt: Project | null
  bandZiel?: string | null
  videoWirkung?: 'band' | 'unterbrechung'
  aufEntfernen?: (elementId: string, index: number) => void
}

function ZeitleistenTest(richtung: Eigenschaften): JSX.Element {
  const leereRef = useRef<HTMLDivElement | null>(null)
  const kinder = createElement(Zeitleiste, {
    projekt: richtung.projekt,
    neuZug: null,
    aktiveKante: null,
    laedtKante: null,
    korbRef: leereRef,
    bandZiel: richtung.bandZiel ?? null,
    videoWirkung: richtung.videoWirkung ?? 'band',
    aufUnterbrechungEntfernen: richtung.aufEntfernen,
  })
  return createElement(DndContext, null, kinder)
}

function montiere(richtung: Eigenschaften): HTMLDivElement {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel = createRoot(behaelter)
  GERAETE.push({ wurzel, behaelter })
  act(() => {
    wurzel.render(createElement(ZeitleistenTest, richtung))
  })
  return behaelter
}

afterAll(() => {
  for (const geraet of GERAETE) {
    act(() => geraet.wurzel.unmount())
    geraet.behaelter.remove()
  }
})

describe('Die Zeitleiste zeigt die Unterbrechungen (#437)', () => {
  it('eine Unterbrechung wird als Marke im Video-Block gezeichnet', () => {
    const behaelter = montiere({ projekt: projektMitEinschub() })
    const marke = behaelter.querySelector<HTMLElement>('[data-testid="zeitleiste-unterbrechung-0-0"]')
    expect(marke).not.toBeNull()
    // Die Marke traegt ihre Zeitstelle (gespielte Videozeit) fuer die Nachvollziehbarkeit.
    expect(marke?.getAttribute('data-zeitstelle')).toBe('1')
  })

  it('ein Klick auf die Marke meldet (elementId, index) an die Wurzel', () => {
    const aufEntfernen = vi.fn()
    const behaelter = montiere({ projekt: projektMitEinschub(), aufEntfernen })
    const marke = behaelter.querySelector<HTMLElement>('[data-testid="zeitleiste-unterbrechung-0-0"]')
    expect(marke).not.toBeNull()
    act(() => marke!.click())
    expect(aufEntfernen).toHaveBeenCalledWith('v0', 0)
  })

  it('das Drop-Ziel heisst "Unterbrechung", wenn eine vollflaechige Aktion gezogen wird', () => {
    const behaelter = montiere({
      projekt: projektMitEinschub(),
      bandZiel: 'v0',
      videoWirkung: 'unterbrechung',
    })
    const block = behaelter.querySelector<HTMLElement>('[data-testid="zeitleiste-block-0"]')
    expect(block?.getAttribute('data-band-ziel')).toBe('true')
    expect(block?.textContent).toContain('Unterbrechung')
  })

  it('das Drop-Ziel heisst "Band", wenn eine Band-Aktion gezogen wird', () => {
    const behaelter = montiere({
      projekt: projektMitEinschub(),
      bandZiel: 'v0',
      videoWirkung: 'band',
    })
    const block = behaelter.querySelector<HTMLElement>('[data-testid="zeitleiste-block-0"]')
    expect(block?.textContent).toContain('Band')
    expect(block?.textContent).not.toContain('Unterbrechung')
  })
})
