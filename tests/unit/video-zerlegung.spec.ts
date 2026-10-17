// Tests zu #436 - video-zerlegung.ts (die Vorschau-Zerlegung eines unterbrochenen Videos).
//
// Krumme Werte (2.53 / 10.47 / 3.17 / 1.73): die Grenzen gehen NICHT glatt auf, so dass
// eine falsche Rundungsstelle auffaellt. fps = 30 (RENDER_PROFILE).
import { describe, expect, it } from 'vitest'

import { loeseVideoTeil } from '../../src/renderer/preview-player/video-zerlegung'
import { frameDauer } from '../../src/renderer/composer/gesamtlaenge'
import type { Listenelement, Unterbrechung } from '../../src/shared/contracts/project'

function u(zeitstelle: number, aktionRef: string, dauer: number): Unterbrechung {
  return { zeitstelle, aktionRef, dauer }
}

// round(10.47*30) - round(2.53*30) = 314 - 76 = 238 Video-Frames
// G1 = 2.53 + 3.17 (= 5.699999999999999); round(G1*30) = 171  -> erster Teil 171-76 = 95 Frames
// round(1.73*30) = round(51.9) = 52 Einschub-Frames
// zweiter Teil 314-171 = 143 Frames; Summe 95+52+143 = 290
const S = 2.53
const E = 10.47
const G1 = S + 3.17
const U = u(3.17, 'a-1', 1.73)

describe('loeseVideoTeil (#426)', () => {
  it('ohne Unterbrechungen: EIN Video-Teil ueber den ganzen Ausschnitt, lokalerFrame unveraendert', () => {
    expect(loeseVideoTeil(S, E, [], 5)).toEqual({
      video: { trimStart: S, trimEnde: E, lokalerFrame: 5, gespielteFrames: 5 },
      einschub: null,
    })
    expect(loeseVideoTeil(S, E, [], 0)?.einschub).toBeNull()
  })

  it('erster Video-Teil: von Frame 0 bis 94 (95 Frames)', () => {
    expect(loeseVideoTeil(S, E, [U], 0)).toEqual({
      video: { trimStart: S, trimEnde: G1, lokalerFrame: 0, gespielteFrames: 0 },
      einschub: null,
    })
    const letzter = loeseVideoTeil(S, E, [U], 94)
    expect(letzter?.einschub).toBeNull()
    expect(letzter?.video).toEqual({ trimStart: S, trimEnde: G1, lokalerFrame: 94, gespielteFrames: 94 })
  })

  it('Einschub: Frame 95 bis 146 - das Video steht am ENDE des vorigen Teils (Pause an der Zeitstelle)', () => {
    for (const frame of [95, 120, 146]) {
      const stand = loeseVideoTeil(S, E, [U], frame)
      expect(stand?.einschub).toEqual({ aktionRef: 'a-1' })
      expect(stand?.video).toEqual({ trimStart: S, trimEnde: G1, lokalerFrame: 95, gespielteFrames: 95 })
    }
  })

  it('zweiter Video-Teil: ab Frame 147 - gespielteFrames zaehlen die 95 Frames DAVOR, lokalerFrame startet bei 0', () => {
    expect(loeseVideoTeil(S, E, [U], 147)).toEqual({
      video: { trimStart: G1, trimEnde: E, lokalerFrame: 0, gespielteFrames: 95 },
      einschub: null,
    })
    // letzter Frame (289) -> lokalerFrame 142, gespielt 95+142 = 237
    expect(loeseVideoTeil(S, E, [U], 289)).toEqual({
      video: { trimStart: G1, trimEnde: E, lokalerFrame: 142, gespielteFrames: 237 },
      einschub: null,
    })
  })

  it('ausserhalb (Frame == Gesamtdauer) -> null', () => {
    expect(loeseVideoTeil(S, E, [U], 290)).toBeNull()
  })

  it('die Summe der Teile trifft die Elementdauer aus gesamtlaenge.ts GENAU (EINE Regel, zwei Orte)', () => {
    const element: Listenelement = {
      id: 'e-1', art: 'video', ref: 'asset-1', dauer: null,
      trimStart: S, trimEnde: E, einblendung: null, unterbrechungen: [U],
    }
    const gesamt = frameDauer(element)
    expect(gesamt.ok).toBe(true)
    // 290 = 95 + 52 + 143 - die Achse (#213) zaehlt dieselben Frames.
    if (gesamt.ok) expect(gesamt.wert).toBe(290)
  })

  it('zwei Unterbrechungen: drei Video-Teile und zwei Einschuebe', () => {
    const u2 = u(1.0, 'a-2', 1.0)
    const g0 = S + 1.0
    // Grenzen: 2.53 | g0 | G1 | 10.47
    // Frames:  video1 106-76=30 | a-2 30 | video2 171-106=65 | a-1 52 | video3 314-171=143
    expect(loeseVideoTeil(S, E, [u2, U], 29)?.einschub).toBeNull()
    expect(loeseVideoTeil(S, E, [u2, U], 30)?.einschub).toEqual({ aktionRef: 'a-2' })
    expect(loeseVideoTeil(S, E, [u2, U], 60)).toEqual({
      video: { trimStart: g0, trimEnde: G1, lokalerFrame: 0, gespielteFrames: 30 },
      einschub: null,
    })
    expect(loeseVideoTeil(S, E, [u2, U], 125)?.einschub).toEqual({ aktionRef: 'a-1' })
    // dritter Teil ab 177: lokalerFrame 0, gespielt 95 (30 + 65)
    expect(loeseVideoTeil(S, E, [u2, U], 177)).toEqual({
      video: { trimStart: G1, trimEnde: E, lokalerFrame: 0, gespielteFrames: 95 },
      einschub: null,
    })
  })
})
