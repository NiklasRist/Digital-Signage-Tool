// Tests zu #425 - band-aufnahme.ts (die REINE Fachlichkeit der Band-Aufnahme,
// ohne JSX, ohne react, ohne IPC).
//
// Zwei User-Entscheidungen (15.10.2026) werden hier festgenagelt:
//  1. Startdauer = aktion.standardDauer ?? projekt.standardSegmentdauer ?? 10.
//  2. Band-Vorlage ohne vorhandene = die ERSTE waehlbare (#129) - keine zweite Ordnung.
// Dazu die Ziel-Erkennung: nur der KOERPER eines VIDEO-Blocks ist ein Band-Ziel;
// ein Segment-Koerper bleibt der sequenziellen Kante ueberlassen (Entscheidung 3).
import { describe, expect, it } from 'vitest'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Vorlage } from '../../src/shared/contracts/vorlage'
import type { Listenelement } from '../../src/shared/contracts/project'
import { STANDARD_ANZEIGEDAUER_SEKUNDEN } from '../../src/shared/contracts/konstanten'
import {
  startdauerFuerBandabschnitt,
  bandAufnahmeAus,
  bandZielAus,
  bandEinfuegeIndex,
  bandZeitImVideo,
} from '../../src/renderer/composer/band-aufnahme'

function vorlage(id: string, art: Vorlage['art'], parent: string | null): Vorlage {
  return { id, name: id, art, höhe: art === 'vollflaeche' ? null : 162, parent, eingebaut: false, zonen: [] }
}

function aktion(id: string, standardDauer: number | null): Aktion {
  return {
    id, titel: id, beschreibung: null, preis: null, bildRef: null, cta: null,
    standardDauer, markeId: 'm1', vorlagenId: 'v', akzentfarbe: null,
  }
}

function video(einblendung: Listenelement['einblendung'] = null): Listenelement {
  return { id: 'el-video', art: 'video', ref: 'asset-1', dauer: null, trimStart: 0, trimEnde: 12, einblendung }
}

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

describe('bandAufnahmeAus', () => {
  it('KERNNACHWEIS: ohne vorhandene Einblendung gilt die ERSTE waehlbare Band-Vorlage', () => {
    const vorlagen = [vorlage('voll', 'vollflaeche', null), vorlage('band-a', 'split', null), vorlage('band-b', 'einblendung', null)]
    const entwurf = bandAufnahmeAus(video(), 'a1', 7, vorlagen)
    expect(entwurf).not.toBeNull()
    expect(entwurf?.bandVorlageId).toBe('band-a')
    expect(entwurf?.abschnitte).toEqual([{ aktionRef: 'a1', dauer: 7 }])
  })

  it('behaelt die vorhandene Band-Vorlage bei und haengt an (kein Umschalten auf die erste)', () => {
    const vorlagen = [vorlage('band-a', 'split', null), vorlage('band-b', 'einblendung', null)]
    const element = video({ bandVorlageId: 'band-b', abschnitte: [{ aktionRef: 'alt', dauer: 5 }] })
    const entwurf = bandAufnahmeAus(element, 'a1', 7, vorlagen)
    expect(entwurf?.bandVorlageId).toBe('band-b')
    expect(entwurf?.abschnitte).toEqual([
      { aktionRef: 'alt', dauer: 5 },
      { aktionRef: 'a1', dauer: 7 },
    ])
  })

  it('null ohne waehlbare Band-Vorlage', () => {
    expect(bandAufnahmeAus(video(), 'a1', 7, [vorlage('voll', 'vollflaeche', null)])).toBeNull()
  })

  it('null fuer ein Segment-Element (das Band gibt es nur am Video, TK 9.2.8)', () => {
    const segment: Listenelement = { id: 'el-seg', art: 'segment', ref: 'a1', dauer: 8, trimStart: null, trimEnde: null, einblendung: null }
    expect(bandAufnahmeAus(segment, 'a1', 7, [vorlage('band-a', 'split', null)])).toBeNull()
  })

  it('laesst das Element und das Vorhandene unveraendert (Kopie, kein Aliasing)', () => {
    const vorhanden = { bandVorlageId: 'band-a', abschnitte: [{ aktionRef: 'alt', dauer: 5 }] }
    const element = Object.freeze(video(vorhanden))
    const entwurf = bandAufnahmeAus(element as Listenelement, 'a1', 7, [vorlage('band-a', 'split', null)])
    expect(entwurf?.abschnitte).not.toBe(vorhanden.abschnitte)
    expect(vorhanden.abschnitte).toEqual([{ aktionRef: 'alt', dauer: 5 }])
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

// #428: Zeitstelle -> Einfüge-Index. Das Band bleibt eine Rotation; die Zeit wählt
// nur die STELLE in der Folge (Entscheidung 1a). Zeitverhalten wörtlich nach TK 9.2.8.
describe('bandEinfuegeIndex (#428)', () => {
  const drei = [{ dauer: 10 }, { dauer: 10 }, { dauer: 10 }] // bandGesamt 30

  it('leerer Bestand ergibt die erste Stelle', () => {
    expect(bandEinfuegeIndex(7, [], 60)).toBe(0)
  })

  it('keine Wiederholung, wenn die Folge das Video fuellt: t faellt in seinen Abschnitt', () => {
    expect(bandEinfuegeIndex(0, drei, 30)).toBe(0) // 0–10
    expect(bandEinfuegeIndex(5, drei, 30)).toBe(0)
    expect(bandEinfuegeIndex(12, drei, 30)).toBe(1) // 10–20
    expect(bandEinfuegeIndex(25, drei, 30)).toBe(2) // 20–30
  })

  it('hinter dem letzten Abschnitt wird angehaengt', () => {
    expect(bandEinfuegeIndex(30, drei, 30)).toBe(3)
    expect(bandEinfuegeIndex(99, drei, 30)).toBe(3)
  })

  it('kuerzere Folge wiederholt sich (t mod bandGesamt, TK 9.2.8)', () => {
    const zwei = [{ dauer: 10 }, { dauer: 10 }] // bandGesamt 20, Video 50
    expect(bandEinfuegeIndex(5, zwei, 50)).toBe(0)
    expect(bandEinfuegeIndex(15, zwei, 50)).toBe(1)
    expect(bandEinfuegeIndex(25, zwei, 50)).toBe(0) // 25 % 20 = 5
    expect(bandEinfuegeIndex(35, zwei, 50)).toBe(1) // 35 % 20 = 15
  })

  it('unbrauchbare Zahlen fallen auf den Anfang', () => {
    expect(bandEinfuegeIndex(Number.NaN, drei, 30)).toBe(0)
    expect(bandEinfuegeIndex(-3, drei, 30)).toBe(0)
    expect(bandEinfuegeIndex(5, drei, Number.NaN)).toBe(0)
    expect(bandEinfuegeIndex(5, drei, 0)).toBe(0)
  })

  it('Abschnitte ohne brauchbare Dauer zaehlen nicht (bandGesamt 0 -> Anfang)', () => {
    const kaputt = [{ dauer: Number.NaN }, { dauer: -1 }]
    expect(bandEinfuegeIndex(5, kaputt, 30)).toBe(0)
  })
})

// #428: die Zeitstelle im Video-Koerper (Sekunden ab Videoanfang) fuer den zeitbasierten Drop.
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
