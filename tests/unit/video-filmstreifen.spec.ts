// #433: die REINE Geometrie des Filmstreifens - Anzahl und Zeitpunkte der Einzelbilder.
// Die eigentliche Bildgewinnung (media:// + Canvas) ist nicht hier pruefbar; sie wird
// am echten Fenster gemessen (scripts/durchlauf.mjs, Schritt 4b4).

import { describe, expect, it } from 'vitest'

import { anzahlBilder, bildZeitpunkte } from '../../src/renderer/composer/video-filmstreifen'

describe('anzahlBilder (#433)', () => {
  it('mindestens 1, auch bei winziger oder unbrauchbarer Breite', () => {
    expect(anzahlBilder(0)).toBe(1)
    expect(anzahlBilder(-5)).toBe(1)
    expect(anzahlBilder(Number.NaN)).toBe(1)
    expect(anzahlBilder(39)).toBe(1)
  })

  it('ein Bild je 40 px Blockbreite', () => {
    expect(anzahlBilder(40)).toBe(1)
    expect(anzahlBilder(80)).toBe(2)
    expect(anzahlBilder(1280)).toBe(32)
  })

  it('beginnt bei 40 Bildern - kein unbegrenztes Dekodieren', () => {
    expect(anzahlBilder(40 * 100)).toBe(40)
  })
})

describe('bildZeitpunkte (#433)', () => {
  it('setzt jedes Bild in die Mitte seines Abschnitts', () => {
    expect(bildZeitpunkte(0, 10, 2)).toEqual([2.5, 7.5])
    expect(bildZeitpunkte(0, 10, 1)).toEqual([5])
  })

  it('folgt dem Trim: der Ausschnitt [2, 6) wird gleichmaessig geteilt', () => {
    expect(bildZeitpunkte(2, 6, 2)).toEqual([3, 5])
  })

  it('ohne gueltige Spanne keine Bilder', () => {
    expect(bildZeitpunkte(5, 5, 3)).toEqual([])
    expect(bildZeitpunkte(6, 2, 3)).toEqual([])
    expect(bildZeitpunkte(0, 10, 0)).toEqual([])
  })
})
