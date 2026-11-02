// Tests zum Sidepanel (02.11.2026): Leiste + Panel, drei Ansichten, zu-/aufklappen.
//
// Geprueft wird die EINE Regel des Bauteils: Klick auf die OFFENE Ansicht schliesst das
// Panel, jeder andere Klick oeffnet sie. Die Regel liegt hier, damit sie nicht an zwei
// Stellen nachgebaut wird (der Aufrufer speichert nur).
// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, useState, type JSX } from 'react'
import { afterAll, describe, expect, it, vi } from 'vitest'

import {
  Seitenleiste,
  type PanelLage,
} from '../../src/renderer/composer/seitenleiste.tsx'

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

/** Ein Aufrufer, der NICHTS rechnet - genau wie die Wurzel: er speichert nur. */
function Regler(p: { start: PanelLage; aufLage?: (lage: PanelLage) => void }): JSX.Element {
  const [lage, setzeLage] = useState<PanelLage>(p.start)
  return createElement(Seitenleiste, {
    lage,
    aufWechsel: (neu: PanelLage) => {
      p.aufLage?.(neu)
      setzeLage(neu)
    },
    children: createElement('p', { 'data-testid': 'panel-inhalt' }, lage.ansicht),
  })
}

function symbol(behaelter: HTMLDivElement, ansicht: string): HTMLButtonElement {
  const knopf = behaelter.querySelector<HTMLButtonElement>(
    `[data-testid="sidepanel-ansicht-${ansicht}"]`,
  )
  if (knopf === null) throw new Error(`Symbol ${ansicht} fehlt`)
  return knopf
}

afterAll(() => {
  for (const geraet of GERAETE) {
    act(() => geraet.wurzel.unmount())
    geraet.behaelter.remove()
  }
})

describe('Sidepanel: Leiste und Panel', () => {
  it('zeigt drei Ansichten und genau EINE gedrueckte', () => {
    const behaelter = montiere(createElement(Regler, { start: { ansicht: 'video', offen: true } }))
    expect(behaelter.querySelectorAll('[data-testid^="sidepanel-ansicht-"]')).toHaveLength(3)
    expect(symbol(behaelter, 'video').getAttribute('aria-pressed')).toBe('true')
    expect(symbol(behaelter, 'aktionen').getAttribute('aria-pressed')).toBe('false')
  })

  it('die gedrueckte Ansicht ist auch SICHTBAR markiert - nicht nur im aria-Zustand', () => {
    // Am Bild gesehen (02.11.2026): Der Inline-Hintergrund von SymbolKnopf ueberschrieb
    // die aria-pressed-Regel aus basis.css - die Leiste zeigte keine aktive Ansicht.
    const behaelter = montiere(createElement(Regler, { start: { ansicht: 'video', offen: true } }))
    expect(symbol(behaelter, 'video').style.getPropertyValue('background')).toContain('var(--akzent)')
    expect(symbol(behaelter, 'aktionen').style.getPropertyValue('background')).toBe('transparent')
  })

  it('ein Klick auf eine ANDERE Ansicht wechselt, das Panel bleibt offen', () => {
    const aufLage = vi.fn()
    const behaelter = montiere(
      createElement(Regler, { start: { ansicht: 'video', offen: true }, aufLage }),
    )
    act(() => symbol(behaelter, 'aktionen').click())
    expect(aufLage).toHaveBeenCalledWith({ ansicht: 'aktionen', offen: true })
    expect(behaelter.querySelector('[data-testid="panel-inhalt"]')?.textContent).toBe('aktionen')
  })

  it('ein Klick auf die OFFENE Ansicht klappt das Panel zu - die Leiste bleibt', () => {
    const aufLage = vi.fn()
    const behaelter = montiere(
      createElement(Regler, { start: { ansicht: 'video', offen: true }, aufLage }),
    )
    act(() => symbol(behaelter, 'video').click())
    expect(aufLage).toHaveBeenCalledWith({ ansicht: 'video', offen: false })
    // Zu: kein Panel, aber der Einstieg ist noch da (sonst kaeme man nicht zurueck).
    expect(behaelter.querySelector('[data-testid="composer-rail"]')).toBeNull()
    expect(behaelter.querySelector('[data-testid="sidepanel-leiste"]')).not.toBeNull()
  })

  it('zugeklappt oeffnet ein Klick auf irgendeine Ansicht wieder', () => {
    const aufLage = vi.fn()
    const behaelter = montiere(
      createElement(Regler, { start: { ansicht: 'aktionen', offen: false }, aufLage }),
    )
    act(() => symbol(behaelter, 'eigenschaften').click())
    expect(aufLage).toHaveBeenCalledWith({ ansicht: 'eigenschaften', offen: true })
  })

  it('der Zuklapp-Knopf schaltet um und benennt sich dabei', () => {
    const aufLage = vi.fn()
    const behaelter = montiere(
      createElement(Regler, { start: { ansicht: 'video', offen: true }, aufLage }),
    )
    const knopf = behaelter.querySelector<HTMLButtonElement>(
      '[data-testid="sidepanel-zuklappen"]',
    )
    expect(knopf?.getAttribute('aria-label')).toBe('Panel zuklappen')
    act(() => knopf?.click())
    expect(aufLage).toHaveBeenCalledWith({ ansicht: 'video', offen: false })
    expect(
      behaelter
        .querySelector('[data-testid="sidepanel-zuklappen"]')
        ?.getAttribute('aria-label'),
    ).toBe('Panel aufklappen')
  })
})
