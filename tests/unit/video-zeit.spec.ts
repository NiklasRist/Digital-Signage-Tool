// Tests zu #216 - video-zeit.ts (die REINE Zeitrechnung, ohne Browser).
//
// Kern-Mass: die Zahlwerte der DoD-Tabelle und die SYMMETRIE von brauchtSprung
// (Eigenschafts-Test ueber mehrere Paare). Die Frame-Uebersetzung laeuft
// AUSCHLIESSLICH ueber frameZuSekunden (#213) - die Tests rechnen daher mit
// denselben Originalzahlen, die der DoD nennt (3 + 30 Frames = 4 s heisst:
// der DoD begruendet selbst die fps-Annahme der Zeitachse).
import { describe, expect, it } from 'vitest'

import {
  SPRUNG_TOLERANZ_SEKUNDEN,
  quellZeit,
  brauchtSprung,
} from '../../src/renderer/preview-player/video-zeit'

describe('quellZeit', () => {
  it('trimStart 3, lokaler Frame 0 -> 3', () => {
    expect(quellZeit(3, 0)).toBe(3)
  })

  it('trimStart 0, lokaler Frame 15 -> 0.5', () => {
    expect(quellZeit(0, 15)).toBe(0.5)
  })

  it('trimStart 3, lokaler Frame 30 -> 4 (derselbe Uebersetzer wie der Render)', () => {
    expect(quellZeit(3, 30)).toBe(4)
  })
})

describe('SPRUNG_TOLERANZ_SEKUNDEN', () => {
  it('steht fest bei 0.25 (ENTSCHIEDEN 2, benannte Konstante)', () => {
    expect(SPRUNG_TOLERANZ_SEKUNDEN).toBe(0.25)
  })
})

describe('brauchtSprung - die Grenze liegt BEI der Toleranz, nicht an ihr vorbei', () => {
  it('identity und Toleranz-Rand', () => {
    expect(brauchtSprung(5, 5)).toBe(false)
    expect(brauchtSprung(5, 5.2)).toBe(false)
    // GENAU die Toleranz (0,25) springt NICHT - die Grenze liegt einschliessend.
    expect(brauchtSprung(5, 5.25)).toBe(false)
    expect(brauchtSprung(5.25, 5)).toBe(false)
    expect(brauchtSprung(5, 5.3)).toBe(true)
  })

  it('unbrauchbare Werte brauchen einen Sprung (NaN und Infinity)', () => {
    expect(brauchtSprung(Number.NaN, 5)).toBe(true)
    expect(brauchtSprung(Number.POSITIVE_INFINITY, 5)).toBe(true)
    // Auch auf der SOLL-Seite: Ein NaN dort liesse die Differenz zu NaN werden,
    // und der Vergleich waere still falsch - das Video bliebe stehen.
    expect(brauchtSprung(5, Number.NaN)).toBe(true)
    expect(brauchtSprung(5, Number.POSITIVE_INFINITY)).toBe(true)
  })

  it('symmetrisch: (a, b) === (b, a) fuer VELE endliche Paare (Eigenschafts-Test)', () => {
    for (const a of [0, 3, 5.19, 5.31, 12.5]) {
      for (const b of [0.001, 5.221, 7, 12.501]) {
        expect(brauchtSprung(a, b)).toBe(brauchtSprung(b, a))
      }
    }
  })
})
