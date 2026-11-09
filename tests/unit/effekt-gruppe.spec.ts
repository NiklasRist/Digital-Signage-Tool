// [action-editor] Die Gruppe „Effekte" (09.11.2026, FA-25 / TK 9.16.6)
//
// Geprueft wird das BAUTEIL - die Rechnung selbst liegt in `tests/unit/effekte.spec.ts`.
// Vier Zusagen der Gruppe:
//   1. ZEHN EINZELNE SCHALTER: kein Effekt bringt einen anderen mit (AD 4.10).
//   2. Jeder Schreibvorgang geht als GANZER Satz in den Entwurf - hier gibt es keinen
//      IPC-Aufruf (TK 9.8.6).
//   3. Geschrieben wird NORMALISIERT: Staerke 0-100, Fenster 1-3 s und nie ueber das
//      Segmentende hinaus (dieselbe Quelle wie Vorschau und Render, TK 9.16.7).
//   4. Ein Effekt ohne Ziel bleibt sichtbar und SAGT es (TK 9.16.6).
// @vitest-environment jsdom
import { act } from 'react'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

import type { AktionsInhalt, EffektSatz } from '../../src/shared/contracts/aktion'
import { EffektGruppe } from '../../src/renderer/action-editor/effekt-gruppe'

const NAMEN = [
  'kenBurns',
  'textEinblendung',
  'preisPop',
  'glanzSweep',
  'preisZaehlt',
  'bildReveal',
  'puls',
  'zoomAtmen',
  'drift',
  'parallax',
] as const

const GERAETE: Array<{ wurzel: Root; behaelter: HTMLDivElement }> = []

interface Geraet {
  behaelter: HTMLDivElement
  /** Jeder Aufruf von `aufAendern` - der Entwurf bekommt den GANZEN Satz. */
  aenderungen: Array<EffektSatz | null>
}

/** Ein vollstaendiger Inhalt; Preis und Bild sind da, damit die Hinweise schweigen. */
function inhalt(teil: Partial<AktionsInhalt> = {}): AktionsInhalt {
  return {
    titel: 'Angebot',
    beschreibung: null,
    preis: '199',
    bildRef: 'asset-1',
    cta: null,
    standardDauer: null,
    vorlagenId: 'vollbild',
    markeId: 'm1',
    akzentfarbe: null,
    ...teil,
  }
}

function montiere(entwurf: AktionsInhalt, dauer = 10): Geraet {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel = createRoot(behaelter)
  GERAETE.push({ wurzel, behaelter })
  const aenderungen: Array<EffektSatz | null> = []
  act(() => {
    wurzel.render(
      createElement(EffektGruppe, {
        entwurf,
        dauer,
        aufAendern: (satz) => {
          aenderungen.push(satz)
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

function kaestchen(behaelter: HTMLDivElement, name: string): HTMLInputElement {
  const feld = behaelter.querySelector<HTMLInputElement>(
    `[data-testid="effekt-${name}"] input[type="checkbox"]`,
  )
  if (feld === null) throw new Error(`Schalter ${name} fehlt`)
  return feld
}

async function schalte(behaelter: HTMLDivElement, name: string): Promise<void> {
  await act(async () => {
    kaestchen(behaelter, name).click()
    await Promise.resolve()
  })
}

/** Zahl tippen und das Feld melden lassen - Reacts onChange haengt am `input`-Ereignis. */
async function setzeZahl(
  behaelter: HTMLDivElement,
  ariaLabel: string,
  wert: number,
): Promise<void> {
  const feld = behaelter.querySelector<HTMLInputElement>(`input[aria-label="${ariaLabel}"]`)
  if (feld === null) throw new Error(`Feld ${ariaLabel} fehlt`)
  const setzeWert = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  await act(async () => {
    setzeWert?.call(feld, String(wert))
    feld.dispatchEvent(new Event('input', { bubbles: true }))
    await Promise.resolve()
  })
}

describe('Die Gruppe zeigt zehn einzelne Schalter', () => {
  it('sieben Fenster-Effekte und drei Schleifen, jeder mit eigener Zeile', () => {
    const { behaelter } = montiere(inhalt())

    const schalter = behaelter.querySelectorAll(
      '[data-testid="aktion-effekte"] input[type="checkbox"]',
    )
    expect(schalter).toHaveLength(10)
    for (const name of NAMEN) {
      expect(behaelter.querySelector(`[data-testid="effekt-${name}"]`), name).not.toBeNull()
    }

    // Der Satz, den die Gruppe ueber sich selbst sagt (TK 9.16.6).
    expect(behaelter.textContent).toContain('Wirkt nur im Ganzbild')
    expect(behaelter.textContent).toContain('Die Dauer ändert sich nie')
  })

  it('jeder Schalter schreibt NUR seinen Effekt - zehnmal einzeln geprueft', async () => {
    for (const name of NAMEN) {
      const { behaelter, aenderungen } = montiere(inhalt())
      await schalte(behaelter, name)

      expect(aenderungen, name).toHaveLength(1)
      // Genau ein Schluessel: kein Effekt bringt einen anderen mit.
      expect(Object.keys(aenderungen[0] ?? {}), name).toEqual([name])
    }
  })
})

describe('Einschalten schreibt die Vorgabe, normalisiert', () => {
  // Die Vorgaben aus AD 4.10. Vier davon liegen unter 1 s; TK 9.16.7 hebt ein Fenster
  // auf mindestens 1 s. Geschrieben wird die Grenze - die Zahl im Formular ist nur
  // ein Vorschlag, der durch dieselbe Normalisierung geht wie jede spaetere Aenderung.
  const FENSTER_VORGABEN = [
    ['kenBurns', 1.5],
    ['textEinblendung', 0.4],
    ['preisPop', 0.33],
    ['glanzSweep', 0.6],
    ['preisZaehlt', 1],
    ['bildReveal', 0.5],
    ['puls', 1.5],
  ] as const

  it('setzt Staerke 100 und das Vorgabe-Fenster, mindestens 1 s', async () => {
    for (const [name, vorgabe] of FENSTER_VORGABEN) {
      const { behaelter, aenderungen } = montiere(inhalt())
      await schalte(behaelter, name)

      expect(aenderungen[0], name).toEqual({
        [name]: { staerke: 100, vonSekunden: 0, bisSekunden: Math.max(1, vorgabe) },
      })
    }
  })

  it('die drei Schleifen haben kein Fenster - nur die Staerke', async () => {
    for (const name of ['zoomAtmen', 'drift', 'parallax'] as const) {
      const { behaelter, aenderungen } = montiere(inhalt())
      await schalte(behaelter, name)

      expect(aenderungen[0], name).toEqual({ [name]: { staerke: 100 } })
    }
  })

  it('klemmt das Fenster auf die Segmentdauer (hier 1 s)', async () => {
    const { behaelter, aenderungen } = montiere(inhalt(), 1)
    await schalte(behaelter, 'kenBurns')

    expect(aenderungen[0]).toEqual({
      kenBurns: { staerke: 100, vonSekunden: 0, bisSekunden: 1 },
    })
  })
})

describe('Ausschalten und Staerke 0', () => {
  it('entfernt genau den einen Effekt und laesst die anderen stehen', async () => {
    const { behaelter, aenderungen } = montiere(
      inhalt({
        effekte: {
          kenBurns: { staerke: 100, vonSekunden: 0, bisSekunden: 1.5 },
          zoomAtmen: { staerke: 80 },
        },
      }),
    )

    // Der erste Schalter steht auf AN - das ist die Anzeige des Entwurfs.
    expect(kaestchen(behaelter, 'kenBurns').checked).toBe(true)
    await schalte(behaelter, 'kenBurns')

    expect(aenderungen[0]).toEqual({ zoomAtmen: { staerke: 80 } })
  })

  it('der letzte ausgeschaltete Effekt ergibt null - der Zustand von vorher', async () => {
    const { behaelter, aenderungen } = montiere(
      inhalt({ effekte: { puls: { staerke: 100, vonSekunden: 0, bisSekunden: 1.5 } } }),
    )
    await schalte(behaelter, 'puls')

    expect(aenderungen[0]).toBeNull()
  })

  it('staerke 0 gilt als AUS: Kaestchen leer, keine Regler', () => {
    const { behaelter } = montiere(
      inhalt({ effekte: { puls: { staerke: 0, vonSekunden: 0, bisSekunden: 1.5 } } }),
    )

    expect(kaestchen(behaelter, 'puls').checked).toBe(false)
    expect(behaelter.querySelector('input[aria-label="Puls Stärke"]')).toBeNull()
  })
})

describe('Regler schreiben normalisiert', () => {
  const aktiv = (name: 'puls'): AktionsInhalt =>
    inhalt({
      effekte: {
        [name]: { staerke: 100, vonSekunden: 0, bisSekunden: 1.5 },
      },
    })

  it('klemmt die Staerke auf 0-100', async () => {
    const { behaelter, aenderungen } = montiere(aktiv('puls'))
    await setzeZahl(behaelter, 'Puls Stärke', 250)

    expect(aenderungen[0]).toEqual({
      puls: { staerke: 100, vonSekunden: 0, bisSekunden: 1.5 },
    })
  })

  it('eine Staerke von 0 schaltet den Effekt ab', async () => {
    const { behaelter, aenderungen } = montiere(aktiv('puls'))
    await setzeZahl(behaelter, 'Puls Stärke', 0)

    expect(aenderungen[0]).toBeNull()
  })

  it('hebt ein zu kurzes Fenster auf 1 s', async () => {
    const { behaelter, aenderungen } = montiere(aktiv('puls'))
    await setzeZahl(behaelter, 'Puls bis', 0.1)

    expect(aenderungen[0]).toEqual({
      puls: { staerke: 100, vonSekunden: 0, bisSekunden: 1 },
    })
  })

  it('kappt ein zu langes Fenster auf 3 s', async () => {
    const { behaelter, aenderungen } = montiere(aktiv('puls'))
    await setzeZahl(behaelter, 'Puls bis', 9)

    expect(aenderungen[0]).toEqual({
      puls: { staerke: 100, vonSekunden: 0, bisSekunden: 3 },
    })
  })

  it('wirft ein Fenster weg, das nach dem Segmentende beginnt', async () => {
    const { behaelter, aenderungen } = montiere(aktiv('puls'))
    await setzeZahl(behaelter, 'Puls von', 10)

    expect(aenderungen[0]).toBeNull()
  })
})

describe('Ein Effekt ohne Ziel bleibt sichtbar und sagt es', () => {
  const preisPop: EffektSatz = {
    preisPop: { staerke: 100, vonSekunden: 0, bisSekunden: 1 },
  }
  const kenBurns: EffektSatz = {
    kenBurns: { staerke: 100, vonSekunden: 0, bisSekunden: 1.5 },
  }

  it('Preis-Effekte ohne Preis', () => {
    const { behaelter } = montiere(inhalt({ preis: null, effekte: preisPop }))
    expect(behaelter.querySelector('[data-testid="effekt-preisPop"]')?.textContent).toContain(
      'Ohne Preis wirkungslos.',
    )

    // Leerzeichen sind kein Preis.
    const { behaelter: nurLeer } = montiere(inhalt({ preis: '   ', effekte: preisPop }))
    expect(nurLeer.querySelector('[data-testid="effekt-preisPop"]')?.textContent).toContain(
      'Ohne Preis wirkungslos.',
    )

    const { behaelter: mitPreis } = montiere(inhalt({ preis: '199', effekte: preisPop }))
    expect(mitPreis.querySelector('[data-testid="effekt-preisPop"]')?.textContent).not.toContain(
      'Ohne Preis wirkungslos.',
    )
  })

  it('Bild-Effekte ohne Bild', () => {
    const { behaelter } = montiere(inhalt({ bildRef: null, effekte: kenBurns }))
    expect(behaelter.querySelector('[data-testid="effekt-kenBurns"]')?.textContent).toContain(
      'Ohne Bild wirkungslos.',
    )

    const { behaelter: mitBild } = montiere(inhalt({ bildRef: 'asset-1', effekte: kenBurns }))
    expect(mitBild.querySelector('[data-testid="effekt-kenBurns"]')?.textContent).not.toContain(
      'Ohne Bild wirkungslos.',
    )
  })
})
