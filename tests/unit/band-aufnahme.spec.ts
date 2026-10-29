// Tests zu #425/#442 - band-aufnahme.ts (die REINE Fachlichkeit des Drops auf einen
// Video-Block, ohne JSX, ohne react, ohne IPC).
//
// Festgenagelt wird:
//  1. Startdauer = aktion.standardDauer ?? projekt.standardSegmentdauer ?? 10
//     (dieselbe Kette fuer Band-Abschnitte und Unterbrechungen).
//  2. Die Ziel-Erkennung: nur der KOERPER eines VIDEO-Blocks ist ein Drop-Ziel;
//     ein Segment-Koerper bleibt der sequenziellen Kante ueberlassen (Entscheidung 3).
//  3. Die Zeitstelle im Video-Koerper (#428) - sie traegt die Unterbrechung (#442).
//
// ENTSCHEIDUNG 29.10.2026 (#442): Ein Drop auf den Video-Koerper legt IMMER eine
// Unterbrechung an. Die frueheren Tests fuer die Band-Aufnahme per Drop
// (`bandAufnahmeAus`) und die Band-Teilung (`teileUndFuege`, #428B) sind mit dem Weg
// entfallen; Band-Abschnitte werden in der Band-Bearbeitung gepflegt (#253).
import { describe, expect, it } from 'vitest'

import { STANDARD_ANZEIGEDAUER_SEKUNDEN } from '../../src/shared/contracts/konstanten'
import { startdauerFuerBandabschnitt, bandZielAus, bandZeitImVideo } from '../../src/renderer/composer/band-aufnahme'

describe('startdauerFuerBandabschnitt', () => {
  it('nimmt die Aktions-Standarddauer, wenn sie gesetzt ist', () => {
    expect(startdauerFuerBandabschnitt(7, 30)).toBe(7)
  })

  it('faellt auf die Projekt-Standarddauer zurueck, wenn die Aktion keine hat', () => {
    expect(startdauerFuerBandabschnitt(null, 30)).toBe(30)
  })

  it('faellt auf STANDARD_ANZEIGEDAUER_SEKUNDEN zurueck, wenn BEIDE fehlen', () => {
    expect(startdauerFuerBandabschnitt(null, null)).toBe(STANDARD_ANZEIGEDAUER_SEKUNDEN)
  })

  it('behandelt 0, negative und nicht endliche Werte als "keine Vorgabe"', () => {
    expect(startdauerFuerBandabschnitt(0, 30)).toBe(30)
    expect(startdauerFuerBandabschnitt(-1, 30)).toBe(30)
    expect(startdauerFuerBandabschnitt(Number.NaN, 30)).toBe(30)
    expect(startdauerFuerBandabschnitt(Number.POSITIVE_INFINITY, 30)).toBe(30)
    expect(startdauerFuerBandabschnitt(0, 0)).toBe(STANDARD_ANZEIGEDAUER_SEKUNDEN)
  })
})

describe('bandZielAus', () => {
  // Layout: Blockweite + Vorschub 14 (Kante 10 + zwei Luecken 2+2).
  // Block0 (Video, 100): Koerper [12, 112]; Block1 (Segment, 40): Koerper [126, 226].
  const zeilen = [
    { elementId: 'el-video', art: 'video' as const },
    { elementId: 'el-seg', art: 'segment' as const },
  ]
  const breiten = [100, 40]

  it('KERNNACHWEIS: im Video-Koerper kommt die Video-Kennung', () => {
    expect(bandZielAus(zeilen, breiten, 12, 14)).toBe('el-video')
    expect(bandZielAus(zeilen, breiten, 60, 14)).toBe('el-video')
    expect(bandZielAus(zeilen, breiten, 112, 14)).toBe('el-video')
  })

  it('im Segment-Koerper kommt null - dort bleibt es beim sequenziellen Weg (Entscheidung 3)', () => {
    expect(bandZielAus(zeilen, breiten, 150, 14)).toBeNull()
    expect(bandZielAus(zeilen, breiten, 226, 14)).toBeNull()
  })

  it('in den Kanten-Luecken kommt null', () => {
    // vor Block0 (Kante 0) und zwischen Block0 und Block1 (Kante 1).
    expect(bandZielAus(zeilen, breiten, 5, 14)).toBeNull()
    expect(bandZielAus(zeilen, breiten, 119, 14)).toBeNull()
  })

  it('ausserhalb und bei unsinnigen Eingaben kommt null', () => {
    expect(bandZielAus(zeilen, breiten, -3, 14)).toBeNull()
    expect(bandZielAus(zeilen, breiten, 999, 14)).toBeNull()
    expect(bandZielAus(zeilen, breiten, Number.NaN, 14)).toBeNull()
    expect(bandZielAus(zeilen, [100], 60, 14)).toBeNull()
    expect(bandZielAus(zeilen, breiten, 60, -1)).toBeNull()
  })

  it('ein Segment an erster Stelle liefert ebenfalls null im Koerper', () => {
    const nurSegment = [{ elementId: 'el-seg', art: 'segment' as const }]
    expect(bandZielAus(nurSegment, [100], 60, 14)).toBeNull()
  })
})

// #428: die Zeitstelle im Video-Koerper (Sekunden ab Videoanfang) - sie traegt die
// Unterbrechung (#442).
describe('bandZeitImVideo (#428)', () => {
  const video = [{ elementId: 'vid', art: 'video' as const }]

  it('misst die Zeit ab dem Koerperstart (12 px Vorlauf, 8 px/s)', () => {
    // koerperStart = 0 + 12; (28 - 12) / 8 = 2 s
    expect(bandZeitImVideo(video, [80], 28, 14, 8)).toEqual({ elementId: 'vid', zeitSekunden: 2 })
  })

  it('null ausserhalb des Koerpers, auf einem Segment oder bei unbrauchbarem Mass', () => {
    expect(bandZeitImVideo(video, [80], -5, 14, 8)).toBeNull()
    expect(bandZeitImVideo(video, [80], 999, 14, 8)).toBeNull()
    expect(bandZeitImVideo([{ elementId: 's', art: 'segment' as const }], [80], 28, 14, 8)).toBeNull()
    expect(bandZeitImVideo(video, [80], 28, 14, 0)).toBeNull()
  })
})
