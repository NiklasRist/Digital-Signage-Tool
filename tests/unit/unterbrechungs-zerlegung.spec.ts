import { describe, expect, it } from 'vitest'

import { zerlegeVideo, rotiereBand } from '../../src/renderer/composer/unterbrechungs-zerlegung'
import type { Unterbrechung } from '../../src/shared/contracts/project'

// #435 (TK v3.26 / 9.2.9): die reine Zerlegung eines unterbrochenen Videos und die
// Phasen-Rotation des Werbebands. Ohne DOM pruefbar.

function u(zeitstelle: number, aktionRef: string, dauer: number): Unterbrechung {
  return { zeitstelle, aktionRef, dauer }
}

describe('zerlegeVideo (#435)', () => {
  it('ohne Unterbrechungen bleibt EIN Video-Teil', () => {
    expect(zerlegeVideo(2, 12, [])).toEqual([
      { art: 'video', trimStart: 2, trimEnde: 12, bandVersatzSekunden: 0 },
    ])
  })

  it('eine Unterbrechung ergibt Video · Aktion · Video', () => {
    expect(zerlegeVideo(2, 12, [u(3, 'a', 5)])).toEqual([
      { art: 'video', trimStart: 2, trimEnde: 5, bandVersatzSekunden: 0 },
      { art: 'aktion', aktionRef: 'a', dauer: 5 },
      { art: 'video', trimStart: 5, trimEnde: 12, bandVersatzSekunden: 3 },
    ])
  })

  it('zwei Unterbrechungen ergeben fuenf Stuecke; die Bandphasen folgen der gespielten Zeit', () => {
    expect(zerlegeVideo(2, 12, [u(3, 'a', 5), u(7, 'b', 4)])).toEqual([
      { art: 'video', trimStart: 2, trimEnde: 5, bandVersatzSekunden: 0 },
      { art: 'aktion', aktionRef: 'a', dauer: 5 },
      { art: 'video', trimStart: 5, trimEnde: 9, bandVersatzSekunden: 3 },
      { art: 'aktion', aktionRef: 'b', dauer: 4 },
      { art: 'video', trimStart: 9, trimEnde: 12, bandVersatzSekunden: 7 },
    ])
  })
})

describe('rotiereBand (#435)', () => {
  const band = [{ dauer: 2 }, { dauer: 3 }] // total 5

  it('ohne Versatz unveraendert', () => {
    expect(rotiereBand(band, 0)).toEqual([{ dauer: 2 }, { dauer: 3 }])
  })

  it('genau auf einer Abschnittsgrenze wird nur gedreht', () => {
    expect(rotiereBand(band, 2)).toEqual([{ dauer: 3 }, { dauer: 2 }])
  })

  it('mitten im Abschnitt wird dieser geteilt - Rest vorne, Anfang hinten', () => {
    // Phase 1 in Abschnitt 0 (2 s): Rest 1 s vorne, dann Abschnitt 1 (3 s), dann Anfang 1 s.
    expect(rotiereBand(band, 1)).toEqual([{ dauer: 1 }, { dauer: 3 }, { dauer: 1 }])
  })

  it('nutzt die Periode: Versatz 6 wirkt wie 1', () => {
    expect(rotiereBand(band, 6)).toEqual(rotiereBand(band, 1))
  })

  it('ein leeres Band bleibt leer', () => {
    expect(rotiereBand([], 3)).toEqual([])
  })
})
