// #457 - der eine Abspielstand (gemeinsam/abspielposition).
//
// Geprueft wird die Zusage, auf der die Marke ruht: EINE Quelle, stabile Referenz
// zwischen Aenderungen, keine Meldung ohne Aenderung, keine unmoeglichen Frames.
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  abonniereAbspielstand,
  holeAbspielstand,
  setzeAbspielstand,
} from '../../src/renderer/gemeinsam/abspielposition'

beforeEach(() => {
  // Zurueck auf den Anfang; die Meldung ist fuer die Tests unten ohne Belang.
  setzeAbspielstand({ frame: 0, laeuft: false })
})

describe('setzeAbspielstand', () => {
  it('meldet den neuen Stand an alle Hoerer', () => {
    const a = vi.fn()
    const b = vi.fn()
    const abA = abonniereAbspielstand(a)
    const abB = abonniereAbspielstand(b)

    setzeAbspielstand({ frame: 42, laeuft: true })

    expect(a).toHaveBeenCalledWith({ frame: 42, laeuft: true })
    expect(b).toHaveBeenCalledWith({ frame: 42, laeuft: true })
    abA()
    abB()
  })

  it('meldet NICHT, wenn sich nichts aendert', () => {
    setzeAbspielstand({ frame: 12, laeuft: false })
    const hoerer = vi.fn()
    const ab = abonniereAbspielstand(hoerer)

    setzeAbspielstand({ frame: 12, laeuft: false })

    expect(hoerer).not.toHaveBeenCalled()
    ab()
  })

  it('meldet auch beim Wechsel nur von laeuft', () => {
    setzeAbspielstand({ frame: 12, laeuft: false })
    const hoerer = vi.fn()
    const ab = abonniereAbspielstand(hoerer)

    setzeAbspielstand({ frame: 12, laeuft: true })

    expect(hoerer).toHaveBeenCalledWith({ frame: 12, laeuft: true })
    ab()
  })

  it('uebernimmt keine negativen oder gebrochenen Frames', () => {
    setzeAbspielstand({ frame: 5, laeuft: false })
    const hoerer = vi.fn()
    const ab = abonniereAbspielstand(hoerer)

    setzeAbspielstand({ frame: -1, laeuft: true })
    setzeAbspielstand({ frame: 2.5, laeuft: true })

    expect(holeAbspielstand()).toEqual({ frame: 5, laeuft: false })
    expect(hoerer).not.toHaveBeenCalled()
    ab()
  })

  it('gibt zwischen Aenderungen DIESELBE Referenz zurueck (useSyncExternalStore)', () => {
    setzeAbspielstand({ frame: 7, laeuft: false })
    const eins = holeAbspielstand()
    const zwei = holeAbspielstand()
    expect(zwei).toBe(eins)

    setzeAbspielstand({ frame: 8, laeuft: false })
    expect(holeAbspielstand()).not.toBe(eins)
  })

  it('ein abgemeldeter Hoerer bekommt nichts mehr', () => {
    const hoerer = vi.fn()
    const ab = abonniereAbspielstand(hoerer)
    ab()

    setzeAbspielstand({ frame: 3, laeuft: false })

    expect(hoerer).not.toHaveBeenCalled()
  })

  it('ein Hoerer, der sich waehrend der Meldung abmeldet, kuerzt die Schleife nicht', () => {
    const zweiter = vi.fn()
    let abErster: (() => void) | null = null
    abErster = abonniereAbspielstand(() => {
      abErster?.()
    })
    const abZweiter = abonniereAbspielstand(zweiter)

    setzeAbspielstand({ frame: 4, laeuft: false })

    expect(zweiter).toHaveBeenCalledWith({ frame: 4, laeuft: false })
    abZweiter()
    abErster?.()
  })
})
