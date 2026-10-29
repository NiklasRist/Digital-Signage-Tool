// Tests zu #442 - filmstreifen-speicher.ts (Ladezeit des Filmstreifens).
//
// Die Zusage: Ein bereits gezeichneter Streifen wird beim naechsten Aufbau nicht
// erneut aus dem Video gesucht; leere Ergebnisse werden NICHT gemerkt (ein Fehlschlag
// soll neu versucht werden), und der Speicher waechst nicht unbegrenzt.
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'

import {
  STREIFEN_SPEICHER_MAX,
  holeStreifen,
  leereStreifenSpeicher,
  merkeStreifen,
  streifenSchluessel,
} from '../../src/renderer/composer/filmstreifen-speicher'

function bild(): HTMLCanvasElement {
  return document.createElement('canvas')
}

beforeEach(() => {
  leereStreifenSpeicher()
})

describe('streifenSchluessel', () => {
  it('trennt Quelle, Ausschnitt und Bildzahl', () => {
    expect(streifenSchluessel('p1', 'a.mp4', 0, 10, 3)).toBe('p1|a.mp4|0|10|3')
    expect(streifenSchluessel('p1', 'a.mp4', 0, 10, 4)).not.toBe(streifenSchluessel('p1', 'a.mp4', 0, 10, 3))
  })
})

describe('merkeStreifen / holeStreifen', () => {
  it('liefert den gemerkten Streifen unveraendert zurueck', () => {
    const bilder = [bild(), bild()]
    merkeStreifen('p1|a.mp4|0|10|2', bilder)
    expect(holeStreifen('p1|a.mp4|0|10|2')).toEqual(bilder)
  })

  it('merkt ein leeres Ergebnis NICHT - der naechste Anlauf versucht es neu', () => {
    merkeStreifen('p1|a.mp4|0|10|1', [])
    expect(holeStreifen('p1|a.mp4|0|10|1')).toBeUndefined()
  })

  it('kopiert die Liste (kein Aliasing mit dem Aufrufer)', () => {
    const bilder = [bild()]
    merkeStreifen('k', bilder)
    bilder.push(bild())
    expect(holeStreifen('k')).toHaveLength(1)
  })

  it('haelt die Obergrenze ein und wirft den AELTESTEN Eintrag zuerst', () => {
    for (let i = 0; i < STREIFEN_SPEICHER_MAX; i += 1) {
      merkeStreifen(`k${String(i)}`, [bild()])
    }
    expect(holeStreifen('k0')).toBeDefined()
    merkeStreifen('neu', [bild()])
    expect(holeStreifen('k0')).toBeUndefined()
    expect(holeStreifen('k1')).toBeDefined()
    expect(holeStreifen('neu')).toBeDefined()
  })

  it('ein erneut gemerkter Eintrag gilt als der juengste', () => {
    for (let i = 0; i < STREIFEN_SPEICHER_MAX; i += 1) {
      merkeStreifen(`k${String(i)}`, [bild()])
    }
    merkeStreifen('k0', [bild(), bild()])
    merkeStreifen('neu', [bild()])
    // k0 wurde aufgefrischt, deshalb fliegt k1 statt k0.
    expect(holeStreifen('k0')).toHaveLength(2)
    expect(holeStreifen('k1')).toBeUndefined()
  })
})
