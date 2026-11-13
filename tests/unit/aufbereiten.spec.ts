// [template-canvas] Die Rechnung der Bildaufbereitung (13.11.2026, FA-28 / TK 9.21.4)
//
// Die Rechenvorschrift steht im Vertrag, nicht nur im Code:
//   helligkeit : v + h * 2.55
//   kontrast   : (v - 128) * (100 + k) / 100 + 128
//   schaerfe   : v + (s / 100) * (v - 3x3-Boxmittel), Radius 1 px
// Geprueft wird genau das - auf Bytes, ohne DOM. Dazu die Zusagen, die aus dem Vertrag
// folgen: neutral rechnet NICHT, Alpha bleibt unberuehrt, die Reihenfolge ist fest.

import { describe, expect, it } from 'vitest'

import { wendeAufbereitungAn } from '../../src/renderer/template-canvas/aufbereiten'

/** Ein Bild aus einer Liste von [r,g,b,a]-Pixeln. */
function bild(pixel: Array<[number, number, number, number]>): Uint8ClampedArray {
  const daten = new Uint8ClampedArray(pixel.length * 4)
  pixel.forEach(([r, g, b, a], i) => {
    daten[i * 4] = r
    daten[i * 4 + 1] = g
    daten[i * 4 + 2] = b
    daten[i * 4 + 3] = a
  })
  return daten
}

/** Ein gleichmaessiges Bild, `breite × hoehe` Pixel, jeder Kanal `wert`. */
function flaeche(
  breite: number,
  hoehe: number,
  wert: number,
  alpha = 255,
): Uint8ClampedArray {
  const pixel: Array<[number, number, number, number]> = []
  for (let i = 0; i < breite * hoehe; i += 1) pixel.push([wert, wert, wert, alpha])
  return bild(pixel)
}

function pixel(daten: Uint8ClampedArray, index: number): [number, number, number, number] {
  return [daten[index * 4] ?? 0, daten[index * 4 + 1] ?? 0, daten[index * 4 + 2] ?? 0, daten[index * 4 + 3] ?? 0]
}

describe('wendeAufbereitungAn - neutral rechnet NICHT', () => {
  it('laesst die Bytes unveraendert, wenn nichts eingestellt ist', () => {
    const daten = flaeche(4, 4, 77)
    const vorher = Uint8ClampedArray.from(daten)
    wendeAufbereitungAn(daten, 4, 4, null)
    wendeAufbereitungAn(daten, 4, 4, { helligkeit: 0, kontrast: 0, schaerfe: 0 })
    expect(daten).toEqual(vorher)
  })

  it('rechnet nicht bei unbrauchbaren Maßen oder falscher Laenge', () => {
    const daten = flaeche(2, 2, 77)
    const vorher = Uint8ClampedArray.from(daten)
    wendeAufbereitungAn(daten, 0, 2, { helligkeit: 50 })
    wendeAufbereitungAn(daten, 2, -1, { helligkeit: 50 })
    wendeAufbereitungAn(daten, 3, 3, { helligkeit: 50 })
    expect(daten).toEqual(vorher)
  })
})

describe('Helligkeit (v + h * 2.55)', () => {
  it('hebt an und senkt ab, mit Klemmung an den Enden', () => {
    const hell = flaeche(1, 1, 100)
    wendeAufbereitungAn(hell, 1, 1, { helligkeit: 100 })
    expect(pixel(hell, 0)).toEqual([255, 255, 255, 255])

    const dunkel = flaeche(1, 1, 100)
    wendeAufbereitungAn(dunkel, 1, 1, { helligkeit: -100 })
    expect(pixel(dunkel, 0)).toEqual([0, 0, 0, 255])

    const leicht = flaeche(1, 1, 100)
    wendeAufbereitungAn(leicht, 1, 1, { helligkeit: 20 })
    expect(pixel(leicht, 0)).toEqual([151, 151, 151, 255]) // 100 + 51
  })

  it('laesst Alpha unberuehrt', () => {
    const daten = flaeche(1, 1, 100, 42)
    wendeAufbereitungAn(daten, 1, 1, { helligkeit: 100 })
    expect(pixel(daten, 0)[3]).toBe(42)
  })
})

describe('Kontrast ((v - 128) * (100 + k) / 100 + 128)', () => {
  it('-100 macht eine Flaeche, +100 verdoppelt den Abstand zur Mitte', () => {
    const flach = flaeche(1, 1, 200)
    wendeAufbereitungAn(flach, 1, 1, { kontrast: -100 })
    expect(pixel(flach, 0)).toEqual([128, 128, 128, 255])

    const stark = flaeche(1, 1, 100)
    wendeAufbereitungAn(stark, 1, 1, { kontrast: 100 })
    expect(pixel(stark, 0)).toEqual([72, 72, 72, 255]) // 100 - 28
  })

  it('laesst 128 in Ruhe - die Mitte bleibt die Mitte', () => {
    const mitte = flaeche(1, 1, 128)
    wendeAufbereitungAn(mitte, 1, 1, { kontrast: 70 })
    expect(pixel(mitte, 0)).toEqual([128, 128, 128, 255])
  })
})

describe('Schaerfe (Unsharp-Mask, 3x3, Radius 1)', () => {
  it('laesst eine gleichmaessige Flaeche unveraendert - die Differenz ist 0', () => {
    const daten = flaeche(3, 3, 90)
    const vorher = Uint8ClampedArray.from(daten)
    wendeAufbereitungAn(daten, 3, 3, { schaerfe: 100 })
    expect(daten).toEqual(vorher)
  })

  it('hebt eine helle Linie gegen ihre Nachbarn an', () => {
    // 3x3: Mitte hell (200), alles andere 100.
    const daten = bild([
      [100, 100, 100, 255], [100, 100, 100, 255], [100, 100, 100, 255],
      [100, 100, 100, 255], [200, 200, 200, 255], [100, 100, 100, 255],
      [100, 100, 100, 255], [100, 100, 100, 255], [100, 100, 100, 255],
    ])
    wendeAufbereitungAn(daten, 3, 3, { schaerfe: 100 })
    // Die Mitte wird heller (ihr 3×3-Mittel ist kleiner als 200). Die Ecke wird DUNKLER:
    // ihr Mittel enthaelt den hellen Nachbarn (8×100 + 200)/9 = 111, also 100 + (100-111) = 89.
    // Genau das ist die Unsharp-Mask: die Kante bekommt auf beiden Seiten mehr Abstand.
    expect(pixel(daten, 4)[0]).toBeGreaterThan(200)
    expect(pixel(daten, 0)[0]).toBe(89)
  })

  it('laesst Alpha unberuehrt', () => {
    const daten = bild([
      [100, 100, 100, 10], [100, 100, 100, 20], [100, 100, 100, 30],
      [100, 100, 100, 40], [200, 200, 200, 50], [100, 100, 100, 60],
      [100, 100, 100, 70], [100, 100, 100, 80], [100, 100, 100, 90],
    ])
    wendeAufbereitungAn(daten, 3, 3, { schaerfe: 100 })
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => pixel(daten, i)[3])).toEqual([
      10, 20, 30, 40, 50, 60, 70, 80, 90,
    ])
  })
})

describe('Die Reihenfolge ist fest (TK 9.21.4)', () => {
  it('rechnet Helligkeit VOR Kontrast', () => {
    // 150, Helligkeit -50 (auf 22,5 -> 23), dann Kontrast +50: (23-128)*1,5+128 < 0 -> 0.
    // Andersherum käme 34 heraus - der Test unterscheidet die beiden Wege.
    const daten = flaeche(1, 1, 150)
    wendeAufbereitungAn(daten, 1, 1, { helligkeit: -50, kontrast: 50 })
    expect(pixel(daten, 0)[0]).toBe(0)
  })

  it('rechnet die Schaerfe NACH den Tonwerten', () => {
    // Gleichmaessige Flaeche: nach Helligkeit/Kontrast ist sie IMMER noch gleichmaessig,
    // also darf die Schaerfe nichts mehr aendern. Waere sie zuerst dran, waere das Bild
    // nach dem Anheben ebenfalls flach - der Test belegt also nur, dass die Kette laeuft.
    const daten = flaeche(3, 3, 60)
    wendeAufbereitungAn(daten, 3, 3, { helligkeit: 20, kontrast: 10, schaerfe: 100 })
    expect(pixel(daten, 0)).toEqual(pixel(daten, 4))
  })
})
