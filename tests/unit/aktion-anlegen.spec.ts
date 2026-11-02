// Tests zu #416 - das Inline-Formular „Aktion anlegen" (Titel + Vorlage).
// jsdom: Geprueft wird der Rueckruf-Vertrag (Eingabe und gewaehlte Vorlage); die
// OPERATION (project:erstelleAktion) und die Sicht-Pflege liegen in der Wurzel.
// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type JSX } from 'react'
import { afterAll, describe, expect, it, vi } from 'vitest'

import type { Vorlage } from '../../src/shared/contracts/vorlage'
import { AktionAnlegen } from '../../src/renderer/composer/aktion-anlegen.tsx'

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

function vorlage(id: string, name: string): Vorlage {
  return { id, name } as Vorlage
}

function tippe(behaelter: HTMLDivElement, testid: string, wert: string): void {
  const feld = behaelter.querySelector(`[data-testid="${testid}"]`) as HTMLInputElement
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  act(() => {
    setter?.call(feld, wert)
    feld.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

function waehle(behaelter: HTMLDivElement, testid: string, wert: string): void {
  const feld = behaelter.querySelector(`[data-testid="${testid}"]`) as HTMLSelectElement
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set
  act(() => {
    setter?.call(feld, wert)
    feld.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

/** 02.11.2026: Das Formular steht hinter "+ Neue Aktion" - wer es benutzt, oeffnet es erst. */
function oeffne(behaelter: HTMLDivElement): void {
  const knopf = behaelter.querySelector('[data-testid="aktion-anlegen-oeffnen"]') as HTMLButtonElement
  act(() => knopf.click())
}

afterAll(() => {
  for (const geraet of GERAETE) {
    act(() => geraet.wurzel.unmount())
    geraet.behaelter.remove()
  }
})

describe('Aktion anlegen (#416)', () => {
  it('steht zu, solange niemand anlegt - die Rail soll die Hoehe der Bibliothek lassen', () => {
    const behaelter = montiere(
      createElement(AktionAnlegen, { vorlagen: [vorlage('vollbild', 'Vollbild')], aufAnlegen: vi.fn() }),
    )
    expect(behaelter.querySelector('[data-testid="aktion-anlegen"]')).toBeNull()
    expect(behaelter.querySelector('[data-testid="aktion-anlegen-oeffnen"]')).not.toBeNull()
  })

  it('"+ Neue Aktion" oeffnet das Formular', () => {
    const behaelter = montiere(
      createElement(AktionAnlegen, { vorlagen: [vorlage('vollbild', 'Vollbild')], aufAnlegen: vi.fn() }),
    )
    oeffne(behaelter)
    expect(behaelter.querySelector('[data-testid="aktion-anlegen"]')).not.toBeNull()
    expect(behaelter.querySelector('[data-testid="aktion-anlegen-titel"]')).not.toBeNull()
  })

  it('"Abbrechen" schliesst und verwirft den Entwurf', () => {
    const aufAnlegen = vi.fn()
    const behaelter = montiere(
      createElement(AktionAnlegen, { vorlagen: [vorlage('vollbild', 'Vollbild')], aufAnlegen }),
    )
    oeffne(behaelter)
    tippe(behaelter, 'aktion-anlegen-titel', 'Verworfen')
    const abbrechen = behaelter.querySelector(
      '[data-testid="aktion-anlegen-abbrechen"]',
    ) as HTMLButtonElement
    act(() => abbrechen.click())
    expect(aufAnlegen).not.toHaveBeenCalled()
    expect(behaelter.querySelector('[data-testid="aktion-anlegen"]')).toBeNull()

    // Wieder geoeffnet steht der verworfene Titel NICHT mehr da.
    oeffne(behaelter)
    const feld = behaelter.querySelector('[data-testid="aktion-anlegen-titel"]') as HTMLInputElement
    expect(feld.value).toBe('')
  })

  it('ohne Titel ist der Knopf gesperrt; mit Titel UND Vorlage ruft er aufAnlegen', () => {
    const aufAnlegen = vi.fn()
    const behaelter = montiere(
      createElement(AktionAnlegen, {
        vorlagen: [vorlage('vollbild', 'Vollbild'), vorlage('split', 'Split')],
        aufAnlegen,
      }),
    )
    oeffne(behaelter)
    const knopf = behaelter.querySelector('[data-testid="aktion-anlegen-knopf"]') as HTMLButtonElement
    expect(knopf.disabled).toBe(true)

    tippe(behaelter, 'aktion-anlegen-titel', 'Sommeraktion')
    expect(knopf.disabled).toBe(false)

    act(() => knopf.click())
    expect(aufAnlegen).toHaveBeenCalledTimes(1)
    expect(aufAnlegen.mock.calls[0]?.[0]).toEqual({ titel: 'Sommeraktion', vorlagenId: 'vollbild' })
  })

  it('nach dem Anlegen ist das Formular zu und der Titel leer - keine Dublette per zweitem Klick', () => {
    const aufAnlegen = vi.fn()
    const behaelter = montiere(
      createElement(AktionAnlegen, { vorlagen: [vorlage('vollbild', 'Vollbild')], aufAnlegen }),
    )
    oeffne(behaelter)
    tippe(behaelter, 'aktion-anlegen-titel', 'Sommeraktion')
    const knopf = behaelter.querySelector('[data-testid="aktion-anlegen-knopf"]') as HTMLButtonElement
    act(() => knopf.click())

    expect(aufAnlegen).toHaveBeenCalledTimes(1)
    expect(behaelter.querySelector('[data-testid="aktion-anlegen"]')).toBeNull()
    oeffne(behaelter)
    const feld = behaelter.querySelector('[data-testid="aktion-anlegen-titel"]') as HTMLInputElement
    expect(feld.value).toBe('')
  })

  it('die gewaehlte Vorlage wandert in die Eingabe', () => {
    const aufAnlegen = vi.fn()
    const behaelter = montiere(
      createElement(AktionAnlegen, {
        vorlagen: [vorlage('vollbild', 'Vollbild'), vorlage('split', 'Split')],
        aufAnlegen,
      }),
    )
    oeffne(behaelter)
    tippe(behaelter, 'aktion-anlegen-titel', 'Split-Aktion')
    waehle(behaelter, 'aktion-anlegen-vorlage', 'split')

    act(() => (behaelter.querySelector('[data-testid="aktion-anlegen-knopf"]') as HTMLButtonElement).click())
    expect(aufAnlegen.mock.calls[0]?.[0]).toEqual({ titel: 'Split-Aktion', vorlagenId: 'split' })
  })
})
