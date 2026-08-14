// Verhaltenstests zu #239 - `berechneBandGeometrie` im geteilten Bereich.
//
// Hier zaehlen ZAHLEN. Die Erwartungswerte sind von Hand nachgerechnet, nicht aus
// der Umsetzung abgeschrieben:
//   videoBereichHöhe = 1080 - H
//   videoBreite      = groesstes Vielfaches von 4, das <= videoBereichHöhe * 16/9 ist
//   videoVersatzX    = (1920 - videoBreite) / 2
//
// DIE FALLE, gegen die dieser Testsatz gebaut ist: Die eingebaute Band-Vorlage
// (H = 162) geht zufaellig glatt auf - 918 x 16/9 = 1632 exakt, bereits durch 4
// teilbar. Ein Rundungsfehler waere an ihr UNSICHTBAR. Deshalb steht der
// Eigenschaftstest ueber dem GANZEN Hoehenbereich, und daneben stehen Hoehen, die
// nicht aufgehen (200, 204, 1000) sowie die beiden Grenzfaelle (1076, 1078).
import { describe, expect, it, vi } from 'vitest'

import { berechneBandGeometrie } from '../../src/shared/band-geometrie'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'

/** Von Hand nachgerechnet. Die Kommentare zeigen den ungerundeten Zwischenwert. */
const NACHGERECHNET = [
  // 918 * 16/9 = 1632,0  -> 1632 (bereits durch 4 teilbar; die eingebaute Vorlage)
  { höhe: 162, bereichHöhe: 918, breite: 1632, versatzX: 144 },
  // 880 * 16/9 = 1564,44 -> 1564
  { höhe: 200, bereichHöhe: 880, breite: 1564, versatzX: 178 },
  // 876 * 16/9 = 1557,33 -> blosses Abschneiden gaebe 1557 und x = 181,5; die
  //                         Vierer-Abrundung gibt 1556 und x = 182
  { höhe: 204, bereichHöhe: 876, breite: 1556, versatzX: 182 },
  //  80 * 16/9 =  142,22 -> 140
  { höhe: 1000, bereichHöhe: 80, breite: 140, versatzX: 890 },
  //   4 * 16/9 =    7,11 -> 4 (kleinste Breite, die noch ein Bild ergibt)
  { höhe: 1076, bereichHöhe: 4, breite: 4, versatzX: 958 },
  //   2 * 16/9 =    3,55 -> 0 (kein Bild mehr; das Urteil faellt der render-service)
  { höhe: 1078, bereichHöhe: 2, breite: 0, versatzX: 960 },
] as const

describe('nachgerechnete Einzelwerte', () => {
  it('liefert bei H = 162 die sieben Werte aus TK 9.2.8', () => {
    expect(berechneBandGeometrie(162)).toEqual({
      videoBereichBreite: 1920,
      videoBereichHöhe: 918,
      videoBreite: 1632,
      videoHöhe: 918,
      videoVersatzX: 144,
      videoVersatzY: 0,
      bandY: 918,
    })
  })

  for (const fall of NACHGERECHNET) {
    it(`trifft bei H = ${fall.höhe} Bereichshoehe, Breite und Versatz`, () => {
      const geo = berechneBandGeometrie(fall.höhe)
      expect({
        bereichHöhe: geo.videoBereichHöhe,
        breite: geo.videoBreite,
        versatzX: geo.videoVersatzX,
      }).toEqual({
        bereichHöhe: fall.bereichHöhe,
        breite: fall.breite,
        versatzX: fall.versatzX,
      })
    })
  }

  it('klemmt bei H = 1078 nicht: die Breite ist 0, kein Mindestwert', () => {
    // Die Rechnung ist korrekt, das Ergebnis unbrauchbar - und DASS es unbrauchbar
    // ist, stellt der render-service fest, nicht diese Funktion.
    expect(berechneBandGeometrie(1078).videoBreite).toBe(0)
  })
})

describe('Eigenschaften ueber alle geraden Hoehen von 2 bis 1078', () => {
  it('haelt Vierer-Teilbarkeit, geraden Versatz und das 1920x1080-Raster ein', () => {
    for (let höhe = 2; höhe <= 1078; höhe += 2) {
      const geo = berechneBandGeometrie(höhe)
      const hinweis = `H = ${höhe}`

      // yuv420p verlangt gerade Breite UND geraden Versatz (TK 9.2.4/9.2.8).
      expect(`${hinweis}: ${geo.videoBreite % 4}`).toBe(`${hinweis}: 0`)
      expect(`${hinweis}: ${geo.videoVersatzX % 2}`).toBe(`${hinweis}: 0`)
      expect(Number.isInteger(geo.videoVersatzX)).toBe(true)

      // Nie aufgerundet - das braeche „contain ohne Beschnitt" ...
      expect(geo.videoBreite).toBeLessThanOrEqual((geo.videoBereichHöhe * 16) / 9)
      // ... und nie mehr als noetig weggerundet: es ist das GROESSTE Vielfache
      // von 4 darunter, der Verlust bleibt unter 4 px.
      expect(geo.videoBreite).toBeGreaterThan((geo.videoBereichHöhe * 16) / 9 - 4)

      // Alles bleibt im Bild, und das eingepasste Video sitzt mittig.
      expect(geo.videoBreite + 2 * geo.videoVersatzX).toBe(RENDER_PROFILE.breite)
      expect(geo.videoBreite).toBeGreaterThanOrEqual(0)
      expect(geo.videoVersatzY).toBe(0)

      // Video-Bereich und Band teilen sich das Bild ohne Luecke und ohne Ueberlapp.
      expect(geo.bandY).toBe(geo.videoBereichHöhe)
      expect(geo.videoHöhe).toBe(geo.videoBereichHöhe)
      expect(geo.bandY + höhe).toBe(RENDER_PROFILE.hoehe)
      expect(geo.videoBereichBreite).toBe(RENDER_PROFILE.breite)
    }
  })

  it('rundet bei der grossen Mehrheit der Hoehen ueberhaupt etwas weg', () => {
    // Haelt den Eigenschaftstest oben davon ab, unbemerkt leer zu laufen: Ginge die
    // Rechnung ueberall glatt auf, bewiese er nichts ueber die Abrundung. Von den
    // 539 geraden Hoehen gehen 59 glatt auf (genau die durch 18 teilbaren, darunter
    // die eingebaute Vorlage mit H = 162) - bei den uebrigen 480 wird gerundet.
    let gerundet = 0
    for (let höhe = 2; höhe <= 1078; höhe += 2) {
      const geo = berechneBandGeometrie(höhe)
      if (geo.videoBreite !== (geo.videoBereichHöhe * 16) / 9) gerundet += 1
    }
    expect(gerundet).toBe(480)
  })

  it('geht ueber blosses Abschneiden hinaus - sonst gaebe es halbe Pixel', () => {
    // Der eigentliche Grund fuer die Vierer-Regel: Abrunden auf eine GANZE Zahl
    // allein genuegt nicht. Bei H = 204 gaebe blosses Abschneiden 1557 und damit
    // x = 181,5 - keine ganze Zahl, erst recht keine gerade.
    const bereich = RENDER_PROFILE.hoehe - 204
    const abgeschnitten = Math.floor((bereich * 16) / 9)
    expect(abgeschnitten).toBe(1557)
    expect((RENDER_PROFILE.breite - abgeschnitten) / 2).toBe(181.5)
    expect(berechneBandGeometrie(204).videoBreite).toBe(1556)
    expect(berechneBandGeometrie(204).videoVersatzX).toBe(182)
  })
})

describe('total - fuer jede Eingabe eine Geometrie, nie eine Ausnahme', () => {
  // Die Vorbedingung (ganzzahlig, gerade, 0 < H < 1080) wird hier NICHT geprueft.
  // Verletzt sie jemand, kommen unbrauchbare Zahlen heraus - aber KEIN Wurf, kein
  // Ersatzwert, keine Korrektur. Das Urteil faellt der render-service.
  const ausserhalb = [163, 0, -2, 1080, 1082, 100.5, Number.NaN, Number.POSITIVE_INFINITY]

  for (const höhe of ausserhalb) {
    it(`wirft nicht bei H = ${String(höhe)}`, () => {
      expect(() => berechneBandGeometrie(höhe)).not.toThrow()
    })
  }

  it('korrigiert eine ungerade Hoehe nicht - die Bereichshoehe wird ungerade', () => {
    expect(berechneBandGeometrie(163).videoBereichHöhe).toBe(917)
    expect(berechneBandGeometrie(163).bandY).toBe(917)
  })
})

describe('Profilbezug', () => {
  it('nimmt Breite und Hoehe aus RENDER_PROFILE - ein abgewandeltes Profil verschiebt alles mit', async () => {
    // Belegt verhaltensnah, dass 1920 und 1080 nirgends als Zahl im Code stehen.
    vi.resetModules()
    vi.doMock('../../src/shared/contracts/render-profile', () => ({
      RENDER_PROFILE: {
        ...RENDER_PROFILE,
        breite: 1280,
        hoehe: 720,
      } as unknown as typeof RENDER_PROFILE,
    }))
    const { berechneBandGeometrie: mitKleinemProfil } = await import(
      '../../src/shared/band-geometrie'
    )

    // 720 - 72 = 648; 648 * 16/9 = 1152 (exakt, durch 4 teilbar); x = (1280 - 1152)/2 = 64.
    expect(mitKleinemProfil(72)).toEqual({
      videoBereichBreite: 1280,
      videoBereichHöhe: 648,
      videoBreite: 1152,
      videoHöhe: 648,
      videoVersatzX: 64,
      videoVersatzY: 0,
      bandY: 648,
    })
    // Dieselbe Eingabe unter dem echten Profil: andere Zahlen.
    expect(berechneBandGeometrie(72).videoBereichHöhe).toBe(1008)

    vi.doUnmock('../../src/shared/contracts/render-profile')
    vi.resetModules()
  })
})
