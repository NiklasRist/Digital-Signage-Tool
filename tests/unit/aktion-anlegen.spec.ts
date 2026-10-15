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

afterAll(() => {
  for (const geraet of GERAETE) {
    act(() => geraet.wurzel.unmount())
    geraet.behaelter.remove()
  }
})

describe('Aktion anlegen (#416)', () => {
  it('ohne Titel ist der Knopf gesperrt; mit Titel UND Vorlage ruft er aufAnlegen', () => {
    const aufAnlegen = vi.fn()
    const behaelter = montiere(
      createElement(AktionAnlegen, {
        vorlagen: [vorlage('vollbild', 'Vollbild'), vorlage('split', 'Split')],
        aufAnlegen,
      }),
    )
    const knopf = behaelter.querySelector('[data-testid="aktion-anlegen-knopf"]') as HTMLButtonElement
    expect(knopf.disabled).toBe(true)

    tippe(behaelter, 'aktion-anlegen-titel', 'Sommeraktion')
    expect(knopf.disabled).toBe(false)

    act(() => knopf.click())
    expect(aufAnlegen).toHaveBeenCalledTimes(1)
    expect(aufAnlegen.mock.calls[0]?.[0]).toEqual({ titel: 'Sommeraktion', vorlagenId: 'vollbild' })
  })

  it('die gewaehlte Vorlage wandert in die Eingabe', () => {
    const aufAnlegen = vi.fn()
    const behaelter = montiere(
      createElement(AktionAnlegen, {
        vorlagen: [vorlage('vollbild', 'Vollbild'), vorlage('split', 'Split')],
        aufAnlegen,
      }),
    )
    tippe(behaelter, 'aktion-anlegen-titel', 'Split-Aktion')
    waehle(behaelter, 'aktion-anlegen-vorlage', 'split')

    act(() => (behaelter.querySelector('[data-testid="aktion-anlegen-knopf"]') as HTMLButtonElement).click())
    expect(aufAnlegen.mock.calls[0]?.[0]).toEqual({ titel: 'Split-Aktion', vorlagenId: 'split' })
  })
})
