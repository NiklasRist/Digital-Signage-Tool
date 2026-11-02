// Tests zu #414 - die Zeitleiste als Praesentation (Kanten-Sichtbarkeit je Zustand).
//
// Die DnD-Zustaende leben seit #414 auf der COMPOSER-WURZEL (EIN DndContext); die
// Zeitleiste kriegt sie als PROPS. Genau das macht den DoD-Teil "Zeitleiste zeigt
// beim Drag Kanten" hier im jsdom pruefbar: Ruhelage (keine Kanten), Neu-Drag
// (Kanten 0..N, aktive breiter), wartendes Einfuegen (Lade-Markierung).
//
// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, useRef, type JSX } from 'react'
import { DndContext } from '@dnd-kit/core'
import { afterAll, describe, expect, it, vi } from 'vitest'

import type { Project } from '../../src/shared/contracts/project'
import { Zeitleiste, baueZeitleistenZeilen } from '../../src/renderer/composer/zeitleiste.tsx'
import { abonniereSprung } from '../../src/renderer/gemeinsam/abspielsprung'

const GERAETE: Array<{ wurzel: Root; behaelter: HTMLDivElement }> = []

function projekt(anzahl: number): Project {
  const rahmen = projektLeer()
  rahmen.liste = Array.from({ length: anzahl }, (_, stelle) => ({
    id: `e${stelle}`,
    art: 'segment',
    ref: `k${stelle}`,
    dauer: 10,
    trimStart: null,
    trimEnde: null,
    einblendung: null,
  }))
  return rahmen
}

function projektLeer(): Project {
  return {
    id: 'p1',
    name: 'Probe',
    erstelltAm: '2026-10-14T00:00:00.000Z',
    geaendertAm: '2026-10-14T00:00:00.000Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
    standardMarkeId: 'marke-x',
    standardSegmentdauer: 10,
  }
}

interface ZeitleistenTestEigenschaften {
  projekt: Project | null
  neuZug: string | null
  aktiveKante: number | null
  laedtKante: number | null
  ausgewaehlteIds?: readonly string[]
  aufElementGewaehlt?: (elementId: string, modus: 'einzeln' | 'bereich' | 'umschalten') => void
}

/** Der Korb-Messraum (korbRef) ist Prop der Komponente (#414); der Test liest das DOM
 *  ueber data-testid und braucht den Ref-Wert selbst nicht. */
function ZeitleistenTest(richtung: ZeitleistenTestEigenschaften): JSX.Element {
  const leereRef = useRef<HTMLDivElement | null>(null)
  const kinder = createElement(Zeitleiste, {
    projekt: richtung.projekt,
    neuZug: richtung.neuZug,
    aktiveKante: richtung.aktiveKante,
    laedtKante: richtung.laedtKante,
    korbRef: leereRef,
    ausgewaehlteIds: richtung.ausgewaehlteIds,
    aufElementGewaehlt: richtung.aufElementGewaehlt,
  })
  return createElement(DndContext, null, kinder)
}

function montiere(richtung: ZeitleistenTestEigenschaften): HTMLDivElement {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel = createRoot(behaelter)
  GERAETE.push({ wurzel, behaelter })
  act(() => {
    wurzel.render(createElement(ZeitleistenTest, richtung))
  })
  return behaelter
}

function kante(behaelter: HTMLDivElement, nummer: number): HTMLElement | null {
  return behaelter.querySelector<HTMLElement>(`[data-testid="zeitleiste-kante-${nummer}"]`)
}

afterAll(() => {
  for (const geraet of GERAETE) {
    act(() => geraet.wurzel.unmount())
    geraet.behaelter.remove()
  }
})

// 02.11.2026 (Niklas: "Lineal ueber die volle Breite"): Die Grundlinie der Achse haengt
// an der ACHSE, nicht am Inhalt - sonst endet sie mit dem letzten Block und laesst rechts
// eine leere Flaeche (am Bild gesehen). Absolute Lage links/rechts 0 ist die Zusage:
// sie spannt den Kasten der Achse, egal wie breit der Inhalt ist. In jsdom gibt es kein
// Layout; die echte Breite misst der Treiber (Schritt 4f4).
describe('Das Lineal laeuft ueber die volle Breite', () => {
  it('die Grundlinie sitzt in der Achse und ist auf beide Kanten gespannt', () => {
    const behaelter = montiere({ projekt: projekt(1), neuZug: null, aktiveKante: null, laedtKante: null })
    const achse = behaelter.querySelector<HTMLElement>('[data-testid="zeitleiste-zeitachse"]')
    const lineal = behaelter.querySelector<HTMLElement>('[data-testid="zeitleiste-lineal"]')
    expect(achse).not.toBeNull()
    expect(lineal).not.toBeNull()
    // Die Linie ist ein KIND der Achse - nicht der Blockzeile, nicht des Inhalts.
    expect(lineal?.parentElement).toBe(achse)
    expect(lineal?.style.left).toBe('0px')
    expect(lineal?.style.right).toBe('0px')
    expect(lineal?.style.position).toBe('absolute')
    expect(lineal?.style.height).toBe('1px')
  })

  it('sie liegt ausserhalb des Flusses - kein Segment rueckt dadurch', () => {
    const behaelter = montiere({ projekt: projekt(2), neuZug: null, aktiveKante: null, laedtKante: null })
    const achse = behaelter.querySelector<HTMLElement>('[data-testid="zeitleiste-zeitachse"]')
    const kinder = Array.from(achse?.children ?? []) as HTMLElement[]
    // Nur die Linie ist absolut gesetzt; die zwei Segmente bleiben im Fluss und behalten
    // ihre Breite. Waere die Linie im Fluss, naehme sie einen Platz in der Flex-Zeile ein.
    const absolut = kinder.filter((kind) => kind.style.position === 'absolute')
    expect(absolut).toHaveLength(1)
    expect(absolut[0]?.getAttribute('data-testid')).toBe('zeitleiste-lineal')
    expect(kinder).toHaveLength(3)
  })
})

describe('Die Zeitleiste zeigt die Einfuege-Kanten (#414)', () => {
  it('Ruhelage: KEINE Kante, die Bloecke liegen aneinander', () => {
    const behaelter = montiere({ projekt: projekt(2), neuZug: null, aktiveKante: null, laedtKante: null })
    expect(kante(behaelter, 0)).toBeNull()
    expect(kante(behaelter, 1)).toBeNull()
    expect(behaelter.querySelector('[data-testid="zeitleiste-block-0"]')).not.toBeNull()
    expect(behaelter.querySelector('[data-testid="zeitleiste-block-1"]')).not.toBeNull()
  })

  it('#420: jeder Block traegt data-element-id (dieselbe Traeger-Konvention wie die #248-Liste)', () => {
    const behaelter = montiere({ projekt: projekt(2), neuZug: null, aktiveKante: null, laedtKante: null })
    // Der Rechtsklick-Selektor der Wurzel sucht `[data-element-id]` - ohne diese Angabe
    // bliebe das KontextMenue an der Zeitleiste wirkungslos (#420).
    expect(behaelter.querySelector('[data-testid="zeitleiste-block-0"]')?.getAttribute('data-element-id')).toBe('e0')
    expect(behaelter.querySelector('[data-testid="zeitleiste-block-1"]')?.getAttribute('data-element-id')).toBe('e1')
  })

  it('Neu-Drag: Kanten 0..N erscheinen (Liste mit 2 -> 3 Kanten, inklusive Ende-Kante)', () => {
    const behaelter = montiere({ projekt: projekt(2), neuZug: 'a1', aktiveKante: null, laedtKante: null })
    expect(kante(behaelter, 0)).not.toBeNull()
    expect(kante(behaelter, 1)).not.toBeNull()
    expect(kante(behaelter, 2)).not.toBeNull()
  })

  it('Die aktive Kante ist breiter als die Ruhelage (der Spalt oeffnet sich)', () => {
    const behaelter = montiere({ projekt: projekt(2), neuZug: 'a1', aktiveKante: 1, laedtKante: null })
    const aktiv = kante(behaelter, 1)
    const ruhig = kante(behaelter, 0)
    expect(aktiv).not.toBeNull()
    expect(ruhig).not.toBeNull()
    const breiteAktiv = Number.parseInt(aktiv!.style.width, 10)
    const breiteRuhig = Number.parseInt(ruhig!.style.width, 10)
    expect(breiteAktiv).toBeGreaterThan(breiteRuhig)
  })

  it('Die wartende Kante traegt die Lade-Markierung (nicht optimistisch, TK 9.7.3)', () => {
    const behaelter = montiere({ projekt: projekt(2), neuZug: 'a1', aktiveKante: null, laedtKante: 1 })
    expect(kante(behaelter, 1)?.textContent).toBe('…')
    expect(kante(behaelter, 0)?.textContent).toBe('+')
  })

  it('Die Kanten-Kette folgt der Listenlaenge (Basis des MESSVORRATS an der Wurzel)', () => {
    const zeilen = baueZeitleistenZeilen(projekt(3).liste)
    expect(zeilen).toHaveLength(3)
    // 3 Bloeken + Ende-Kante = Kanten 0..3; die Nummern baut die Wurzel aus der
    // Listenlaenge (baueEinfugeKanten) - die Zahlen selbst deckt spalt-drop.spec.ts ab.
  })
})

describe('Die Zeitleiste meldet die Auswahl (#392)', () => {
  it('Klick meldet die elementId mit der Bedienart aus dem Ereignis', () => {
    const rufe: Array<{ id: string; modus: string }> = []
    const behaelter = montiere({
      projekt: projekt(2),
      neuZug: null,
      aktiveKante: null,
      laedtKante: null,
      aufElementGewaehlt: (id, modus) => rufe.push({ id, modus }),
    })
    const block = behaelter.querySelector<HTMLElement>('[data-testid="zeitleiste-block-0"]')
    act(() => {
      block?.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }))
    })
    expect(rufe.at(-1)).toEqual({ id: 'e0', modus: 'bereich' })
    act(() => {
      block?.dispatchEvent(new MouseEvent('click', { bubbles: true, metaKey: true }))
    })
    expect(rufe.at(-1)).toEqual({ id: 'e0', modus: 'umschalten' })
  })

  it('ausgewaehlteIds markiert GENAU die genannten Bloecke', () => {
    const behaelter = montiere({
      projekt: projekt(2),
      neuZug: null,
      aktiveKante: null,
      laedtKante: null,
      ausgewaehlteIds: ['e1'],
    })
    const block0 = behaelter.querySelector<HTMLElement>('[data-testid="zeitleiste-block-0"]')
    const block1 = behaelter.querySelector<HTMLElement>('[data-testid="zeitleiste-block-1"]')
    expect(block0?.dataset.ausgewaehlt).toBe('nein')
    expect(block1?.dataset.ausgewaehlt).toBe('ja')
  })

  it('ohne aufElementGewaehlt bleibt der Block ohne Klick-Wirkung (Prop optional)', () => {
    const behaelter = montiere({ projekt: projekt(1), neuZug: null, aktiveKante: null, laedtKante: null })
    const block = behaelter.querySelector<HTMLElement>('[data-testid="zeitleiste-block-0"]')
    expect(() => {
      act(() => {
        block?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      })
    }).not.toThrow()
  })
})

// 01.11.2026 (Niklas: "die zeitleiste und videowiedergabe muessen gesynct werden"):
// Die Zeitachse ist die Sprung-Flaeche. Geprueft wird die Zuordnung Pixel -> Frame; sie
// ist DIE Umkehrung der Marken-Rechnung (x = frame/fps*pxProSekunde), sonst springt die
// Wiedergabe woandershin als der Zeiger stand.
describe('Klick auf die Zeitachse setzt die Wiedergabe (#457-Nachtrag)', () => {
  it(' 40 px bei 8 px/s ergeben Frame 150 (40 / 8 * 30 fps)', () => {
    const springe = vi.fn()
    const abmelden = abonniereSprung(springe)

    // jsdom liefert fuer jedes Element ein Null-Rechteck; der Klick rechnet ab `left`.
    const original = HTMLElement.prototype.getBoundingClientRect
    HTMLElement.prototype.getBoundingClientRect = function (): DOMRect {
      return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}) } as DOMRect
    }
    try {
      const behaelter = montiere({ projekt: projekt(1), neuZug: null, aktiveKante: null, laedtKante: null })
      const achse = behaelter.querySelector<HTMLElement>('[data-testid="zeitleiste-zeitachse"]')
      expect(achse).not.toBeNull()
      act(() => {
        achse?.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 40 }))
      })
      expect(springe).toHaveBeenCalledTimes(1)
      expect(springe).toHaveBeenCalledWith(150)
    } finally {
      HTMLElement.prototype.getBoundingClientRect = original
      abmelden()
    }
  })
})
