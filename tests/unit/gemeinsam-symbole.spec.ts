// Verhaltenstest zu #456 - die geteilten Symbole und ihr Knopf (jsdom).
//
// Die Zusagen (EINE Stelle, damit kein Aufrufer sie vergessen kann):
//   1. Ein Symbolknopf hat IMMER einen zugaenglichen Namen - `aria-label` UND `title`.
//   2. `gedrueckt` setzt `aria-pressed`; ohne `gedrueckt` gibt es KEIN Attribut (der Knopf
//      ist dann kein Umschalter, und Screenreader sollen das auch nicht annehmen).
//   3. `abgeschaltet` sperrt den Knopf, macht ihn aber NICHT unsichtbar - ein verschwundener
//      Knopf waere ein zweiter Zustand.
//   4. Ein Klick meldet GENAU einmal.
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement } from 'react'

import { SymbolKnopf, SymbolStift } from '../../src/renderer/gemeinsam/symbole'

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

let behaelter: HTMLDivElement | null = null
let wurzel: Root | null = null

afterEach(() => {
  if (wurzel !== null && behaelter !== null) act(() => wurzel!.unmount())
  behaelter?.remove()
  behaelter = null
  wurzel = null
})

function zeige(teil: {
  beschriftung?: string
  gedrueckt?: boolean
  abgeschaltet?: boolean
  aufKlick?: () => void
} = {}): HTMLElement {
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  wurzel = createRoot(behaelter)
  act(() => {
    wurzel!.render(
      createElement(SymbolKnopf, {
        kennung: 'probe',
        beschriftung: teil.beschriftung ?? 'Probe',
        aufKlick: teil.aufKlick ?? (() => undefined),
        gedrueckt: teil.gedrueckt,
        abgeschaltet: teil.abgeschaltet,
        children: createElement(SymbolStift),
      }) as ReactElement,
    )
  })
  return behaelter as unknown as HTMLElement
}

describe('SymbolKnopf (#456)', () => {
  it('traegt den zugaenglichen Namen in aria-label UND title - sichtbar ist kein Text', () => {
    const el = zeige({ beschriftung: 'Marke bearbeiten' })
    const knopf = el.querySelector<HTMLButtonElement>('[data-testid="probe"]')!
    expect(knopf.getAttribute('aria-label')).toBe('Marke bearbeiten')
    expect(knopf.getAttribute('title')).toBe('Marke bearbeiten')
    expect(knopf.textContent).toBe('')
    // Das Symbol ist fuer Screenreader ausgeblendet - der Name steht am Knopf.
    expect(knopf.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('ohne gedrueckt gibt es KEIN aria-pressed; mit gedrueckt steht der Zustand da', () => {
    const ohne = zeige()
    expect(
      ohne.querySelector('[data-testid="probe"]')?.hasAttribute('aria-pressed'),
    ).toBe(false)
    const gedrueckt = zeige({ gedrueckt: true })
    expect(
      gedrueckt.querySelector('[data-testid="probe"]')?.getAttribute('aria-pressed'),
    ).toBe('true')
    const nichtGedrueckt = zeige({ gedrueckt: false })
    expect(
      nichtGedrueckt.querySelector('[data-testid="probe"]')?.getAttribute('aria-pressed'),
    ).toBe('false')
  })

  it('abgeschaltet sperrt den Knopf, entfernt ihn aber nicht', () => {
    const el = zeige({ abgeschaltet: true })
    const knopf = el.querySelector<HTMLButtonElement>('[data-testid="probe"]')!
    expect(knopf.disabled).toBe(true)
    expect(knopf.querySelector('svg')).not.toBeNull()
  })

  it('ein Klick meldet GENAU einmal', () => {
    const aufKlick = vi.fn()
    const el = zeige({ aufKlick })
    act(() => {
      el.querySelector<HTMLButtonElement>('[data-testid="probe"]')!.click()
    })
    expect(aufKlick).toHaveBeenCalledTimes(1)
  })
})
