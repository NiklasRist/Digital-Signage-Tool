// gemeinsam/abspielsprung (#457-Nachtrag, 01.11.2026)
//
// Die Zeitleiste meldet einen Sprungwunsch, die Vorschau macht daraus die Position ihrer
// EINEN Uhr. Geprueft wird die Zusage dieser Naht: Ereignis (kein Zustand), keine
// Entdopplung, keine unmoeglichen Frames, Abmelden wirkt.
import { describe, expect, it, vi } from 'vitest'

import { abonniereSprung, fordereSprung } from '../../src/renderer/gemeinsam/abspielsprung'

describe('fordereSprung', () => {
  it('meldet JEDEN Sprung an alle Hoerer - auch denselben Frame zweimal', () => {
    const a = vi.fn()
    const b = vi.fn()
    const abA = abonniereSprung(a)
    const abB = abonniereSprung(b)

    fordereSprung(150)
    fordereSprung(150)

    expect(a.mock.calls).toEqual([[150], [150]])
    expect(b.mock.calls).toEqual([[150], [150]])
    abA()
    abB()
  })

  it('reicht keine unmoeglichen Frames durch (negativ, gebrochen, NaN, Infinity)', () => {
    const hoerer = vi.fn()
    const ab = abonniereSprung(hoerer)

    fordereSprung(-1)
    fordereSprung(1.5)
    fordereSprung(Number.NaN)
    fordereSprung(Number.POSITIVE_INFINITY)

    expect(hoerer).not.toHaveBeenCalled()
    ab()
  })

  it('Abmelden wirkt; ein Hoerer, der sich waehrend der Meldung abmeldet, kuerzt die Schleife nicht', () => {
    const zweiter = vi.fn()
    const abZweiter = abonniereSprung(zweiter)
    const erster = vi.fn(() => {
      abZweiter()
    })
    const abErster = abonniereSprung(erster)

    fordereSprung(7)

    // Der zweite Hoerer stand auf der Kopie der Liste und wird noch bedient.
    expect(zweiter).toHaveBeenCalledWith(7)
    abErster()
    zweiter.mockClear()
    fordereSprung(8)
    expect(zweiter).not.toHaveBeenCalled()
  })
})
