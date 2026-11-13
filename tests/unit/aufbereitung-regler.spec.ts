// [action-editor] Die Gruppe „Aufbereitung" (13.11.2026, FA-28 / TK 9.21.6)
//
// Geprueft wird das BAUTEIL - die Rechnung liegt in `tests/unit/aufbereiten.spec.ts`, die
// Regeln in `tests/unit/aufbereitung.spec.ts`. Zusagen der Gruppe:
//   1. DREI Regler, und ihre Grenzen sind die aus dem Vertrag (nicht Zahlen aus dem Formular).
//   2. Jeder Zug geht als GANZER Satz in den Entwurf, normalisiert - kein IPC hier.
//   3. Alle drei auf 0 heisst: KEIN gespeicherter Satz (`null`), der Zustand vorher.
//   4. „Zurücksetzen" erscheint nur, wenn es etwas zurueckzusetzen gibt.

// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

import type { BildAufbereitung } from '../../src/shared/contracts/aktion'
import { AufbereitungRegler } from '../../src/renderer/action-editor/aufbereitung-regler'

const GERAETE: Array<{ wurzel: Root; behaelter: HTMLDivElement }> = []

interface Geraet {
  behaelter: HTMLDivElement
  aenderungen: Array<BildAufbereitung | null>
}

function montiere(aufbereitung: BildAufbereitung | null): Geraet {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel = createRoot(behaelter)
  GERAETE.push({ wurzel, behaelter })
  const aenderungen: Array<BildAufbereitung | null> = []
  act(() => {
    wurzel.render(
      createElement(AufbereitungRegler, {
        aufbereitung,
        aufAendern: (wert) => {
          aenderungen.push(wert)
        },
      }),
    )
  })
  return { behaelter, aenderungen }
}

afterEach(() => {
  for (const geraet of GERAETE.splice(0)) {
    act(() => geraet.wurzel.unmount())
    geraet.behaelter.remove()
  }
})

function regler(behaelter: HTMLDivElement, feld: string): HTMLInputElement {
  const element = behaelter.querySelector<HTMLInputElement>(
    `[data-testid="aktion-aufbereitung-${feld}"]`,
  )
  if (element === null) throw new Error(`Regler ${feld} fehlt`)
  return element
}

/** Ein Reglerzug ist in React ein `input`-Ereignis; `act` sammelt das Neu-Rendern ein.
 *
 *  Der native Setter ist noetig: React haengt am Element einen eigenen `value`-Setter, der
 *  einen direkt gesetzten Wert als „unveraendert" verwirft - das Ereignis kaeme dann nie an. */
function ziehe(element: HTMLInputElement, wert: number): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  if (setter === undefined) throw new Error('value-Setter fehlt')
  act(() => {
    setter.call(element, String(wert))
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('AufbereitungRegler', () => {
  it('zeigt drei Regler mit den Grenzen aus dem Vertrag', () => {
    const { behaelter } = montiere(null)
    const helligkeit = regler(behaelter, 'helligkeit')
    const kontrast = regler(behaelter, 'kontrast')
    const schaerfe = regler(behaelter, 'schaerfe')

    expect([helligkeit.min, helligkeit.max]).toEqual(['-100', '100'])
    expect([kontrast.min, kontrast.max]).toEqual(['-100', '100'])
    expect([schaerfe.min, schaerfe.max]).toEqual(['0', '100'])
    // Ohne Einstellung stehen alle drei in der Mitte bzw. links.
    expect([helligkeit.value, kontrast.value, schaerfe.value]).toEqual(['0', '0', '0'])
  })

  it('schreibt den GANZEN Satz, normalisiert und gerundet', () => {
    const { behaelter, aenderungen } = montiere({ helligkeit: 10 })
    ziehe(regler(behaelter, 'kontrast'), 33)
    expect(aenderungen).toEqual([{ helligkeit: 10, kontrast: 33 }])
  })

  it('alle drei auf 0 heisst: null - kein gespeicherter Zustand', () => {
    const { behaelter, aenderungen } = montiere({ helligkeit: 10 })
    ziehe(regler(behaelter, 'helligkeit'), 0)
    expect(aenderungen).toEqual([null])
  })

  it('„Zurücksetzen" gibt es nur bei eigener Wahl - und es setzt auf null', () => {
    const ohne = montiere(null)
    expect(ohne.behaelter.querySelector('[data-testid="aktion-aufbereitung-zuruecksetzen"]')).toBeNull()

    const mit = montiere({ schaerfe: 20 })
    const knopf = mit.behaelter.querySelector<HTMLButtonElement>(
      '[data-testid="aktion-aufbereitung-zuruecksetzen"]',
    )
    expect(knopf).not.toBeNull()
    act(() => {
      knopf?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(mit.aenderungen).toEqual([null])
  })

  it('zeigt die Werte mit Vorzeichen an', () => {
    const { behaelter } = montiere({ helligkeit: 25, kontrast: -15, schaerfe: 40 })
    expect(behaelter.textContent).toContain('+25')
    expect(behaelter.textContent).toContain('-15')
    expect(behaelter.textContent).toContain('40')
  })
})
