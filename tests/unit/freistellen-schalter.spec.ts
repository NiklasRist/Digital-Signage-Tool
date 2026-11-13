// [action-editor] Der Schalter „Freistellen" (13.11.2026, FA-29 / TK 9.21.6)
//
// Geprueft wird das BAUTEIL - das Modell und die Rechnung liegen in
// `tests/unit/freistellen.spec.ts` und am Fenster. Die Zusagen hier:
//   1. Der erste Klick LAEDT das Modell; erst danach geht `true` in den Entwurf.
//   2. Ein Ausfall sperrt den Schalter, zeigt EINEN Klartext und aendert NICHTS.
//   3. Ausschalten geht IMMER - der Weg zurueck darf nie an einer Sperre haengen.
//   4. Waehrend des Ladens laeuft ein Klartext (der erste Klick dauert).

// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const freiDoppel = vi.hoisted(() => ({
  ausfall: null as string | null,
  ladeAufrufe: 0,
  /** Wird beim Laden gesetzt - so laesst sich ein Fehlschlag NACH dem Laden nachstellen. */
  ausfallNachLaden: null as string | null,
  ladefertig: null as null | (() => void),
}))

vi.mock('../../src/renderer/template-canvas/freistellen', () => ({
  FREISTELL_KLARTEXT: 'Freistellen ist auf diesem Rechner nicht verfügbar.',
  freistellAusfall: () => freiDoppel.ausfall,
  ladeFreistellModell: async () => {
    freiDoppel.ladeAufrufe += 1
    if (freiDoppel.ladefertig !== null) await new Promise<void>((weiter) => {
      freiDoppel.ladefertig = () => {
        weiter()
      }
    })
    if (freiDoppel.ausfallNachLaden !== null) freiDoppel.ausfall = freiDoppel.ausfallNachLaden
  },
}))

import { FreistellSchalter } from '../../src/renderer/action-editor/freistellen-schalter'

const GERAETE: Array<{ wurzel: Root; behaelter: HTMLDivElement }> = []

interface Geraet {
  behaelter: HTMLDivElement
  aenderungen: boolean[]
}

function montiere(freistellen: boolean | null, rechnet = false): Geraet {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel = createRoot(behaelter)
  GERAETE.push({ wurzel, behaelter })
  const aenderungen: boolean[] = []
  act(() => {
    wurzel.render(
      createElement(FreistellSchalter, {
        freistellen,
        rechnet,
        aufAendern: (wert: boolean) => {
          aenderungen.push(wert)
        },
      }),
    )
  })
  return { behaelter, aenderungen }
}

/** Ein Klick auf die Checkbox. React hoert auf `change`. */
async function klicke(behaelter: HTMLDivElement): Promise<void> {
  const feld = behaelter.querySelector<HTMLInputElement>('[data-testid="aktion-freistellen"]')
  if (feld === null) throw new Error('Schalter fehlt')
  await act(async () => {
    feld.click()
  })
}

afterEach(() => {
  for (const geraet of GERAETE.splice(0)) {
    act(() => geraet.wurzel.unmount())
    geraet.behaelter.remove()
  }
})

beforeEach(() => {
  freiDoppel.ausfall = null
  freiDoppel.ausfallNachLaden = null
  freiDoppel.ladeAufrufe = 0
  freiDoppel.ladefertig = null
})

describe('FreistellSchalter', () => {
  it('laedt das Modell beim ersten Einschalten - und schaltet erst danach', async () => {
    const { behaelter, aenderungen } = montiere(null)
    expect(freiDoppel.ladeAufrufe).toBe(0)

    await klicke(behaelter)

    expect(freiDoppel.ladeAufrufe).toBe(1)
    expect(aenderungen).toEqual([true])
  })

  it('zeigt waehrend des Ladens einen Klartext - der Klick ist nicht verschluckt', async () => {
    freiDoppel.ladefertig = () => undefined
    const { behaelter } = montiere(null)

    // Nicht awaiten: der Ladevorgang haengt an `freiDoppel.ladefertig`.
    await act(async () => {
      behaelter.querySelector<HTMLInputElement>('[data-testid="aktion-freistellen"]')?.click()
    })

    expect(
      behaelter.querySelector('[data-testid="aktion-freistellen-laedt"]'),
    ).not.toBeNull()
  })

  it('ein Ausfall sperrt den Schalter und sagt warum', () => {
    freiDoppel.ausfall = 'Freistellen ist auf diesem Rechner nicht verfügbar.'
    const { behaelter, aenderungen } = montiere(null)

    const feld = behaelter.querySelector<HTMLInputElement>('[data-testid="aktion-freistellen"]')
    expect(feld?.disabled).toBe(true)
    expect(
      behaelter.querySelector('[data-testid="aktion-freistellen-hinweis"]')?.textContent,
    ).toBe('Freistellen ist auf diesem Rechner nicht verfügbar.')
    expect(aenderungen).toEqual([])
  })

  it('ein Fehlschlag NACH dem Laden schaltet nicht und bleibt sichtbar', async () => {
    freiDoppel.ausfallNachLaden = 'Freistellen ist auf diesem Rechner nicht verfügbar.'
    const { behaelter, aenderungen } = montiere(null)

    await klicke(behaelter)

    expect(freiDoppel.ladeAufrufe).toBe(1)
    expect(aenderungen).toEqual([])
    expect(
      behaelter.querySelector('[data-testid="aktion-freistellen-hinweis"]'),
    ).not.toBeNull()
  })

  it('Ausschalten geht IMMER - auch bei gemerktem Ausfall', () => {
    freiDoppel.ausfall = 'Freistellen ist auf diesem Rechner nicht verfügbar.'
    const { behaelter, aenderungen } = montiere(true)

    act(() => {
      behaelter.querySelector<HTMLInputElement>('[data-testid="aktion-freistellen"]')?.click()
    })

    expect(aenderungen).toEqual([false])
  })

  it('zeigt den Fortschritt der Berechnung, solange eingeschaltet gerechnet wird', () => {
    const { behaelter } = montiere(true, true)
    expect(behaelter.querySelector('[data-testid="aktion-freistellen-rechnet"]')).not.toBeNull()
  })
})
