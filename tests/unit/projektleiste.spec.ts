// Tests zu #456 - die Projektleiste über der Reiterfläche (TK 9.14.1 v3.32).
//
// Die Zusagen:
//   1. Sie zeigt Projektname, Standardmarke und den Knopf [Marken].
//   2. Die Auswahl der Standardmarke meldet die Kennung - und zwar IMMER (auch die
//      bereits gewählte), weil der Wechsel selbst in `wechsleStandardMarke` entscheidet,
//      ob etwas zu tun ist. Der leere Wert löst KEINEN Aufruf aus.
//   3. Der Knopf [Marken] meldet den Klick und zeigt über aria-pressed, ob der Editor offen ist.
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement } from 'react'

import { Projektleiste, type ProjektleisteProps } from '../../src/renderer/app-shell/projektleiste'

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

let behaelter: HTMLDivElement | null = null
let wurzel: Root | null = null

afterEach(() => {
  if (wurzel !== null && behaelter !== null) act(() => wurzel!.unmount())
  behaelter?.remove()
  behaelter = null
  wurzel = null
})

function zeige(teil: Partial<ProjektleisteProps> = {}): HTMLElement {
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  wurzel = createRoot(behaelter)
  const props: ProjektleisteProps = {
    projektName: 'Fitnessworld24',
    standardMarkeId: 'm-1',
    markenUebersicht: [
      { id: 'm-1', name: 'Fitnessworld24' },
      { id: 'm-2', name: 'Partner' },
    ],
    aufStandardMarke: vi.fn(),
    aufMarken: vi.fn(),
    markenOffen: false,
    ...teil,
  }
  act(() => {
    wurzel!.render(createElement(Projektleiste, props) as ReactElement)
  })
  return behaelter as unknown as HTMLElement
}

describe('Projektleiste (#456)', () => {
  it('zeigt Projektname, die Standardmarke und den Knopf [Marken]', () => {
    const el = zeige()
    expect(el.querySelector('[data-testid="projektleiste-name"]')?.textContent).toBe('Fitnessworld24')
    const auswahl = el.querySelector<HTMLSelectElement>('[data-testid="projektleiste-standardmarke"]')!
    expect(auswahl.value).toBe('m-1')
    expect(Array.from(auswahl.options).map((o) => o.textContent)).toEqual(['Fitnessworld24', 'Partner'])
    expect(el.querySelector('[data-testid="projektleiste-marken"]')).not.toBeNull()
  })

  it('die Auswahl meldet die gewählte Kennung GENAU einmal', () => {
    const aufStandardMarke = vi.fn()
    const el = zeige({ aufStandardMarke })
    const auswahl = el.querySelector<HTMLSelectElement>('[data-testid="projektleiste-standardmarke"]')!
    act(() => {
      auswahl.value = 'm-2'
      auswahl.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(aufStandardMarke).toHaveBeenCalledTimes(1)
    expect(aufStandardMarke).toHaveBeenCalledWith('m-2')
  })

  it('der leere Wert loest KEINEN Wechsel aus', () => {
    const aufStandardMarke = vi.fn()
    const el = zeige({ aufStandardMarke })
    const auswahl = el.querySelector<HTMLSelectElement>('[data-testid="projektleiste-standardmarke"]')!
    act(() => {
      auswahl.value = ''
      auswahl.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(aufStandardMarke).not.toHaveBeenCalled()
  })

  it('[Marken] meldet den Klick und zeigt den offenen Zustand über aria-pressed', () => {
    const aufMarken = vi.fn()
    const zu = zeige({ aufMarken })
    act(() => {
      zu.querySelector<HTMLButtonElement>('[data-testid="projektleiste-marken"]')!.click()
    })
    expect(aufMarken).toHaveBeenCalledTimes(1)
    expect(
      zu.querySelector('[data-testid="projektleiste-marken"]')?.getAttribute('aria-pressed'),
    ).toBe('false')

    act(() => wurzel!.unmount())
    behaelter?.remove()
    const offen = zeige({ markenOffen: true })
    expect(
      offen.querySelector('[data-testid="projektleiste-marken"]')?.getAttribute('aria-pressed'),
    ).toBe('true')
  })
})
