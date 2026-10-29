// Tests zu #443 - transportleiste.tsx (die Anzeige, jsdom).
//
// Die Leiste RECHNET NICHT: Sie meldet Absichten und zeigt Werte. Die Regeln selbst
// liegen in bedienung.spec.ts, zeit-anzeige.spec.ts und transport.spec.ts; hier wird
// nur geprueft, dass die Leiste die richtigen Werte zeigt und die richtige Absicht
// meldet - inklusive der beiden Zeigerwege (Balken exakt, Range unsichtbar).
//
// Der Zeigerkasten wird gestellt: jsdom liefert fuer getBoundingClientRect nur Nullen,
// und ohne Breite gaebe es keinen Anteil zu rechnen.
// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { Transportleiste } from '../../src/renderer/preview-player/transportleiste'
import type { TransportleisteProps } from '../../src/renderer/preview-player/transportleiste'
import { baueTransport, spieleAb, springeZuFrame } from '../../src/renderer/preview-player/transport'
import type { TransportStand } from '../../src/renderer/preview-player/transport'
import { TON_STAND } from '../../src/renderer/preview-player/bedienung'
import type { Zeitachse } from '../../src/renderer/preview-player/zeitachse'
import { formatierePosition } from '../../src/renderer/preview-player/zeit-anzeige'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

/** Drei Elemente: [0,60), [60,120), [120,180) - 6 s bei 30 fps. */
function baueAchse(): Zeitachse {
  return {
    abschnitte: [
      { elementId: 'e0', index: 0, startFrame: 0, endeFrame: 60, frames: 60 },
      { elementId: 'e1', index: 1, startFrame: 60, endeFrame: 120, frames: 60 },
      { elementId: 'e2', index: 2, startFrame: 120, endeFrame: 180, frames: 60 },
    ],
    gesamtFrames: 180,
    gesamtSekunden: 6,
  }
}

function eigenschaften(teil: Partial<TransportleisteProps> = {}): TransportleisteProps {
  return {
    stand: baueTransport(),
    achse: baueAchse(),
    sichtbar: true,
    ton: TON_STAND,
    vollbildMoeglich: true,
    istVollbild: false,
    aufPlayPause: vi.fn(),
    aufSpringen: vi.fn(),
    aufSpringeUmSekunden: vi.fn(),
    aufElement: vi.fn(),
    aufTonUmschalten: vi.fn(),
    aufLautstaerke: vi.fn(),
    aufVollbild: vi.fn(),
    ...teil,
  }
}

function rendere(
  props: TransportleisteProps,
  huelle: (inhalt: ReactNode) => ReactNode = (inhalt) => inhalt,
): { behaelter: HTMLDivElement; wurzel: Root; fertig: () => void } {
  const ziel = document.createElement('div')
  document.body.appendChild(ziel)
  const wurzel: Root = createRoot(ziel)
  act(() => {
    wurzel.render(createElement('div', null, huelle(createElement(Transportleiste, props))))
  })
  return { behaelter: ziel, wurzel, fertig: () => act(() => wurzel.unmount()) }
}

function finde(behaelter: HTMLElement, pruefKennung: string): HTMLElement {
  const element = behaelter.querySelector(`[data-testid="${pruefKennung}"]`)
  expect(element, pruefKennung).not.toBeNull()
  return element as HTMLElement
}

function druecke(behaelter: HTMLElement, pruefKennung: string): void {
  act(() => {
    finde(behaelter, pruefKennung).dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

/** Stellt den Balkenkasten: left 100, Breite 200 - x=200 ist die Mitte. */
function stelleKasten(element: HTMLElement): void {
  element.getBoundingClientRect = () =>
    ({
      left: 100,
      top: 0,
      right: 300,
      bottom: 18,
      width: 200,
      height: 18,
      x: 100,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect
}

function zeigerEreignis(behaelter: HTMLElement, art: string, clientX: number): void {
  act(() => {
    // React bildet `onPointerLeave` aus `pointerout` + relatedTarget - ein direkt
    // abgeschicktes `pointerleave` erreicht den Handler NICHT.
    finde(behaelter, 'vorschau-balken').dispatchEvent(
      new MouseEvent(art === 'pointerleave' ? 'pointerout' : art, {
        bubbles: true,
        clientX,
        relatedTarget: art === 'pointerleave' ? document.body : null,
      }),
    )
  })
}

afterEach(() => {
  document.body.innerHTML = ''
})

// ---------------- Bedienung ----------------

describe('#443 Play/Pause und die Spruenge', () => {
  it('die Beschriftung folgt dem Stand; der Klick meldet die Absicht', () => {
    const aufPlayPause = vi.fn()
    const pausiert = rendere(eigenschaften({ aufPlayPause }))
    expect(finde(pausiert.behaelter, 'vorschau-play-pause').getAttribute('aria-label')).toBe('Play')
    druecke(pausiert.behaelter, 'vorschau-play-pause')
    expect(aufPlayPause).toHaveBeenCalledTimes(1)
    pausiert.fertig()

    const laeuft = rendere(
      eigenschaften({ stand: spieleAb(baueTransport(), baueAchse()), aufPlayPause }),
    )
    expect(finde(laeuft.behaelter, 'vorschau-play-pause').getAttribute('aria-label')).toBe('Pause')
    laeuft.fertig()
  })

  it('die beiden Tasten melden GENAU -5 und +5 Sekunden', () => {
    const aufSpringeUmSekunden = vi.fn()
    const { behaelter, fertig } = rendere(eigenschaften({ aufSpringeUmSekunden }))
    druecke(behaelter, 'vorschau-zurueck-5')
    druecke(behaelter, 'vorschau-vor-5')
    expect(aufSpringeUmSekunden.mock.calls).toEqual([[-5], [5]])
    fertig()
  })

  it('die Element-Nummern springen an den Anfang ihres Elements und die laufende ist markiert', () => {
    const aufElement = vi.fn()
    const stand: TransportStand = springeZuFrame(baueTransport(), baueAchse(), 70)
    const { behaelter, fertig } = rendere(eigenschaften({ stand, aufElement }))
    expect(finde(behaelter, 'vorschau-element-1').getAttribute('data-markiert')).toBe('true')
    expect(finde(behaelter, 'vorschau-element-0').getAttribute('data-markiert')).toBe('false')
    druecke(behaelter, 'vorschau-element-2')
    expect(aufElement).toHaveBeenCalledWith(2)
    fertig()
  })
})

// ---------------- Zeit und Kapitel ----------------

describe('#443 Zeit und Kapitel', () => {
  it('Position und Gesamtlaenge stehen in DEMSELBEN Format (#127)', () => {
    const stand = springeZuFrame(baueTransport(), baueAchse(), 90)
    const { behaelter, fertig } = rendere(eigenschaften({ stand }))
    expect(finde(behaelter, 'vorschau-position').textContent).toBe('0:03')
    expect(finde(behaelter, 'vorschau-gesamt').textContent).toBe('0:06')
    fertig()
  })

  it('eine Kapitelmarke je Elementgrenze - die erste Grenze (Frame 0) ist keine', () => {
    const { behaelter, fertig } = rendere(eigenschaften())
    expect(behaelter.querySelectorAll('[data-testid^="vorschau-kapitel-"]')).toHaveLength(2)
    expect(behaelter.querySelector('[data-testid="vorschau-kapitel-0"]')).toBeNull()
    fertig()
  })
})

// ---------------- Der Balken (Zeiger) ----------------

describe('#443 der Balken: Scrubbing und Tooltip', () => {
  it('ein Druck in der Mitte springt auf die Haelfte der Achse', () => {
    const aufSpringen = vi.fn()
    const { behaelter, fertig } = rendere(eigenschaften({ aufSpringen }))
    stelleKasten(finde(behaelter, 'vorschau-balken'))
    zeigerEreignis(behaelter, 'pointerdown', 200)
    expect(aufSpringen).toHaveBeenCalledWith(90)
    fertig()
  })

  it('Ziehen springt weiter mit; ohne Druck bewegt der Zeiger nur den Tooltip', () => {
    const aufSpringen = vi.fn()
    const { behaelter, fertig } = rendere(eigenschaften({ aufSpringen }))
    stelleKasten(finde(behaelter, 'vorschau-balken'))

    zeigerEreignis(behaelter, 'pointermove', 250)
    expect(aufSpringen).toHaveBeenCalledTimes(0)

    zeigerEreignis(behaelter, 'pointerdown', 200)
    zeigerEreignis(behaelter, 'pointermove', 250)
    expect(aufSpringen.mock.calls).toEqual([[90], [135]])
    fertig()
  })

  it('der Tooltip zeigt die bildgenaue Zeit und verschwindet beim Verlassen', () => {
    const { behaelter, fertig } = rendere(eigenschaften())
    stelleKasten(finde(behaelter, 'vorschau-balken'))
    zeigerEreignis(behaelter, 'pointermove', 200)
    expect(finde(behaelter, 'vorschau-zeiger').textContent).toBe(formatierePosition(90))
    zeigerEreignis(behaelter, 'pointerleave', 0)
    expect(behaelter.querySelector('[data-testid="vorschau-zeiger"]')).toBeNull()
    fertig()
  })

  it('die unsichtbare Range bleibt der Tastaturweg: ihr Wert ist der Frame, ihr Wechsel springt', () => {
    const aufSpringen = vi.fn()
    const { behaelter, fertig } = rendere(eigenschaften({ aufSpringen }))
    const schieber = finde(behaelter, 'vorschau-zeitleiste') as HTMLInputElement
    expect(schieber.value).toBe('0')
    expect(schieber.max).toBe('180')
    const setzen = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    act(() => {
      setzen?.call(schieber, '120')
      schieber.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(aufSpringen).toHaveBeenCalledWith(120)
    fertig()
  })
})

// ---------------- Ton und Vollbild ----------------

describe('#443 Ton', () => {
  it('der Knopf nennt die naechste Handlung und meldet sie', () => {
    const aufTonUmschalten = vi.fn()
    const stumm = rendere(eigenschaften({ aufTonUmschalten }))
    expect(finde(stumm.behaelter, 'vorschau-ton').getAttribute('aria-label')).toBe('Ton der Vorschau einschalten')
    druecke(stumm.behaelter, 'vorschau-ton')
    expect(aufTonUmschalten).toHaveBeenCalledTimes(1)
    stumm.fertig()

    const hoerbar = rendere(
      eigenschaften({ ton: { stumm: false, lautstaerke: 1 }, aufTonUmschalten }),
    )
    expect(finde(hoerbar.behaelter, 'vorschau-ton').getAttribute('aria-label')).toBe('Ton der Vorschau ausschalten')
    hoerbar.fertig()
  })

  it('der Regler meldet einen Anteil 0..1', () => {
    const aufLautstaerke = vi.fn()
    const { behaelter, fertig } = rendere(eigenschaften({ aufLautstaerke }))
    const regler = finde(behaelter, 'vorschau-lautstaerke') as HTMLInputElement
    const setzen = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    act(() => {
      setzen?.call(regler, '40')
      regler.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(aufLautstaerke).toHaveBeenCalledWith(0.4)
    fertig()
  })

  it('der Hinweis "Ausgabe bleibt stumm" steht IMMER da - auch bei eingeschaltetem Ton', () => {
    const stumm = rendere(eigenschaften())
    expect(finde(stumm.behaelter, 'vorschau-ton-hinweis').textContent).toBe('Ausgabe bleibt stumm')
    stumm.fertig()
    const laut = rendere(eigenschaften({ ton: { stumm: false, lautstaerke: 1 } }))
    expect(finde(laut.behaelter, 'vorschau-ton-hinweis').textContent).toBe('Ausgabe bleibt stumm')
    laut.fertig()
  })
})

describe('#443 Vollbild', () => {
  it('ist abgeschaltet, wenn die Umgebung es nicht kann - nicht unsichtbar', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ vollbildMoeglich: false }))
    expect((finde(behaelter, 'vorschau-vollbild') as HTMLButtonElement).disabled).toBe(true)
    fertig()
  })

  it('meldet die Absicht und benennt den Ausstieg', () => {
    const aufVollbild = vi.fn()
    const drin = rendere(eigenschaften({ istVollbild: true, aufVollbild }))
    expect(finde(drin.behaelter, 'vorschau-vollbild').getAttribute('aria-label')).toBe('Vollbild beenden')
    druecke(drin.behaelter, 'vorschau-vollbild')
    expect(aufVollbild).toHaveBeenCalledTimes(1)
    drin.fertig()
  })
})

// ---------------- Die Leiste stoppt den Klick ----------------

describe('#443 die Leiste ist kein Bildklick', () => {
  it('ein Klick auf die Leiste erreicht den Vorfahren NICHT (sonst schaltete Play doppelt)', () => {
    const aufVorfahre = vi.fn()
    const { behaelter, fertig } = rendere(eigenschaften(), (inhalt) =>
      createElement('div', { onClick: aufVorfahre }, inhalt),
    )
    druecke(behaelter, 'vorschau-play-pause')
    expect(aufVorfahre).toHaveBeenCalledTimes(0)
    fertig()
  })
})
