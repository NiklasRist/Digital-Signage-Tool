// #457 - die Abspielmarke (composer/abspiel-marke.tsx).
//
// Zwei reine Scroll-Regeln und die Anzeige: Die Marke steht an
// `frame / fps * pxProSekunde`, folgt dem Stand aus `gemeinsam/abspielposition`
// und scrollt NUR bei laufender Uhr, wenn sie aus dem Bild laeuft.
// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  setzeAbspielstand,
} from '../../src/renderer/gemeinsam/abspielposition'
import {
  AbspielMarke,
  sollMitscrollen,
  zielScrollLeft,
} from '../../src/renderer/composer/abspiel-marke'

const GERAETE: Array<{ wurzel: Root; behaelter: HTMLDivElement }> = []

function montiere(pxProSekunde: number, scrollRef: { current: { scrollLeft: number; clientWidth: number } | null }) {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel = createRoot(behaelter)
  GERAETE.push({ wurzel, behaelter })
  act(() => {
    wurzel.render(
      createElement(AbspielMarke, {
        pxProSekunde,
        scrollRef: scrollRef as unknown as React.RefObject<HTMLDivElement | null>,
      }),
    )
  })
  return behaelter
}

beforeEach(() => {
  setzeAbspielstand({ frame: 0, laeuft: false })
})

afterEach(() => {
  for (const geraet of GERAETE.splice(0)) {
    act(() => geraet.wurzel.unmount())
    geraet.behaelter.remove()
  }
})

describe('sollMitscrollen / zielScrollLeft', () => {
  it('links und rechts ausserhalb des Bereichs -> true, in der Mitte -> false', () => {
    expect(sollMitscrollen(5, 100, 400)).toBe(true)
    expect(sollMitscrollen(500, 100, 400)).toBe(true)
    expect(sollMitscrollen(300, 100, 400)).toBe(false)
  })

  it('ein Bereich der Breite 0 scrollt nie', () => {
    expect(sollMitscrollen(50, 0, 0)).toBe(false)
  })

  it('zielScrollLeft zentriert und wird nie negativ', () => {
    expect(zielScrollLeft(500, 200)).toBe(400)
    expect(zielScrollLeft(10, 200)).toBe(0)
  })
})

describe('AbspielMarke', () => {
  it('steht an frame / fps * pxProSekunde und traegt den Frame als Messwert', () => {
    const behaelter = montiere(8, { current: null })

    act(() => {
      setzeAbspielstand({ frame: 30, laeuft: false })
    })

    const marke = behaelter.querySelector<HTMLElement>('[data-testid="zeitleiste-playhead"]')
    expect(marke).not.toBeNull()
    // RENDER_PROFILE.fps ist 30: 30 Frames / 30 * 8 px = 8 px.
    expect(marke?.style.left).toBe('8px')
    expect(marke?.dataset.frame).toBe('30')
    expect(marke?.dataset.laeuft).toBe('nein')
  })

  it('scrollt bei laufender Uhr, wenn die Marke aus dem Bild laeuft', () => {
    const scroll = { current: { scrollLeft: 0, clientWidth: 100 } }
    const behaelter = montiere(8, scroll)
    void behaelter

    act(() => {
      // 600 Frames = 20 s * 8 px = 160 px; sichtbar ist 0..100.
      setzeAbspielstand({ frame: 600, laeuft: true })
    })

    expect(scroll.current.scrollLeft).toBe(110)
  })

  it('scrollt bei PAUSE nicht, auch wenn die Marke ausserhalb steht', () => {
    const scroll = { current: { scrollLeft: 0, clientWidth: 100 } }
    montiere(8, scroll)

    act(() => {
      setzeAbspielstand({ frame: 600, laeuft: false })
    })

    expect(scroll.current.scrollLeft).toBe(0)
  })

  it('scrollt nicht, wenn die Marke im Bild bleibt', () => {
    const scroll = { current: { scrollLeft: 0, clientWidth: 200 } }
    montiere(8, scroll)

    act(() => {
      setzeAbspielstand({ frame: 300, laeuft: true }) // 10 s * 8 = 80 px
    })

    expect(scroll.current.scrollLeft).toBe(0)
  })
})
