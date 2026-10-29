// Tests zu #443 - bedienung.ts: die reinen Regeln von Ton und Zeiger.
//
// Die Suite braucht KEINE Browser-Umgebung: Sie prueft Werte, keine Anzeige.
//
// Die tragende Entscheidung (29.10.2026): Der Ton der Vorschau startet STUMM.
// Ein Test, der das nicht prueft, liesse die wichtigste Zusage offen.

import { describe, expect, it } from 'vitest'

import {
  TON_STAND,
  frameBeiAnteil,
  schalteTonUm,
  setzeLautstaerke,
} from '../../src/renderer/preview-player/bedienung'
import type { Zeitachse } from '../../src/renderer/preview-player/zeitachse'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'

const fps = RENDER_PROFILE.fps

/** Eine Achse ohne Abschnitte - fuer den Zeiger genuegt die Gesamtlaenge. */
function achse(gesamtFrames: number): Zeitachse {
  return { abschnitte: [], gesamtFrames, gesamtSekunden: gesamtFrames / fps }
}

describe('#443 Ton: der Startwert', () => {
  it('stumm, Regler auf voll - die Ausgabe ist still (TK 9.2.4, AD R-06)', () => {
    expect(TON_STAND.stumm).toBe(true)
    expect(TON_STAND.lautstaerke).toBe(1)
  })
})

describe('#443 schalteTonUm', () => {
  it('aus stumm wird hoerbar; die Lautstaerke bleibt', () => {
    const ton = schalteTonUm({ stumm: true, lautstaerke: 0.4 })
    expect(ton).toEqual({ stumm: false, lautstaerke: 0.4 })
  })

  it('aus hoerbar wird stumm; die Lautstaerke bleibt stehen (der Regler springt nicht)', () => {
    const ton = schalteTonUm({ stumm: false, lautstaerke: 0.4 })
    expect(ton).toEqual({ stumm: true, lautstaerke: 0.4 })
  })

  it('stumm MIT Lautstaerke 0 wird beim Einschalten auf 1 gehoben - sonst waere der Schalter wirkungslos', () => {
    const ton = schalteTonUm({ stumm: true, lautstaerke: 0 })
    expect(ton).toEqual({ stumm: false, lautstaerke: 1 })
  })

  it('mutationiert die Eingabe nicht', () => {
    const vorher = { stumm: true, lautstaerke: 0.7 }
    const kopie = { ...vorher }
    schalteTonUm(vorher)
    expect(vorher).toEqual(kopie)
  })
})

describe('#443 setzeLautstaerke', () => {
  it('uebernimmt einen brauchbaren Wert und macht hoerbar', () => {
    expect(setzeLautstaerke({ stumm: true, lautstaerke: 1 }, 0.4)).toEqual({
      stumm: false,
      lautstaerke: 0.4,
    })
  })

  it('0 bedeutet STUMM - sonst behauptete der Knopf "Ton an" bei einem Regler, der nichts durchlaesst', () => {
    expect(setzeLautstaerke({ stumm: false, lautstaerke: 0.8 }, 0)).toEqual({
      stumm: true,
      lautstaerke: 0,
    })
  })

  it('klemmt auf [0, 1]', () => {
    expect(setzeLautstaerke({ stumm: false, lautstaerke: 0.5 }, 2).lautstaerke).toBe(1)
    expect(setzeLautstaerke({ stumm: false, lautstaerke: 0.5 }, -3)).toEqual({
      stumm: true,
      lautstaerke: 0,
    })
  })

  it('ein unbrauchbarer Wert laesst den Stand UNVERAENDERT (kein Ersatzwert)', () => {
    const stand = { stumm: false, lautstaerke: 0.6 }
    expect(setzeLautstaerke(stand, Number.NaN)).toBe(stand)
    expect(setzeLautstaerke(stand, Number.NEGATIVE_INFINITY)).toBe(stand)
  })
})

describe('#443 frameBeiAnteil (Zeiger -> Frame)', () => {
  it('Anfang, Mitte und Ende', () => {
    const a = achse(300)
    expect(frameBeiAnteil(0, a)).toBe(0)
    expect(frameBeiAnteil(0.5, a)).toBe(150)
    expect(frameBeiAnteil(1, a)).toBe(300)
  })

  it('rundet auf ganze Frames', () => {
    expect(frameBeiAnteil(1 / 3, achse(300))).toBe(100)
    expect(frameBeiAnteil(0.5, achse(7))).toBe(4) // 3.5 -> 4
  })

  it('klemmt ausserhalb des Balkens', () => {
    const a = achse(300)
    expect(frameBeiAnteil(-0.4, a)).toBe(0)
    expect(frameBeiAnteil(1.7, a)).toBe(300)
  })

  it('NaN wird 0; eine leere Achse bleibt 0', () => {
    expect(frameBeiAnteil(Number.NaN, achse(300))).toBe(0)
    expect(frameBeiAnteil(0.7, achse(0))).toBe(0)
  })
})
