// Tests zur FOLGE eines Blocks (02.11.2026).
//
// Die Zusage: Die Eigenschaften sagen, was ein Block fuers GANZE bedeutet - Gesamtlaenge,
// Bandwiederholungen, Startstelle. Die Zahlen kommen aus den bestehenden Rechnungen
// (gesamtlaenge, zeitband, verwendungen); hier wird geprueft, dass sie richtig
// zusammengefuehrt werden und dass nichts erfunden wird, wenn etwas fehlt.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import type { Listenelement, Project } from '../../src/shared/contracts/project'
import { berechneFolge, folgeText } from '../../src/renderer/composer/eigenschaften'

function projekt(liste: Listenelement[]): Project {
  return {
    id: 'p1',
    name: 'Probe',
    erstelltAm: '2026-01-01T00:00:00.000Z',
    geaendertAm: '2026-01-01T00:00:00.000Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste,
    letzterAusgabeName: null,
    standardMarkeId: 'm1',
    standardSegmentdauer: 10,
  }
}

function video(id: string, aktionRef: string, videoSekunden: number): Listenelement {
  return {
    id,
    art: 'video',
    ref: 'asset-v',
    dauer: null,
    trimStart: 0,
    trimEnde: videoSekunden,
    einblendung: { bandVorlageId: 'band', abschnitte: [{ aktionRef, dauer: 5 }] },
    unterbrechungen: [],
  }
}

function segment(id: string, aktionRef: string, dauer: number): Listenelement {
  return { id, art: 'segment', ref: aktionRef, dauer, trimStart: null, trimEnde: null, einblendung: null }
}

describe('berechneFolge', () => {
  it('nennt die Gesamtlaenge des Projekts', () => {
    const p = projekt([segment('e1', 'a', 10), segment('e2', 'b', 5)])
    const folge = berechneFolge(p, p.liste[0]!)
    expect(folge.gesamtSekunden).toBe(15)
  })

  it('ein Segment im Band: Wiederholungen und Startstelle kommen aus den Verwendungen', () => {
    // Video 30 s, Folge 5 s -> 6 Durchlaeufe; die Aktion beginnt bei Sekunde 0.
    const p = projekt([video('v1', 'a', 30), segment('e1', 'a', 10)])
    const folge = berechneFolge(p, p.liste[1]!)
    expect(folge.bandWiederholungen).toBe(6)
    expect(folge.abSekunden).toBe(0)
  })

  it('ein Video traegt selbst kein Band - die Folge bleibt bei der Gesamtlaenge', () => {
    const p = projekt([video('v1', 'a', 30)])
    const folge = berechneFolge(p, p.liste[0]!)
    expect(folge.bandWiederholungen).toBeNull()
    expect(folge.abSekunden).toBeNull()
  })

  it('ein Segment, das NIRGENDS laeuft, bekommt keine erfundene Stelle', () => {
    const p = projekt([video('v1', 'a', 30), segment('e1', 'nie', 10)])
    const folge = berechneFolge(p, p.liste[1]!)
    expect(folge.bandWiederholungen).toBeNull()
    expect(folge.abSekunden).toBeNull()
  })
})

describe('folgeText', () => {
  it('nennt Gesamt, Band und Startstelle', () => {
    expect(folgeText({ gesamtSekunden: 42, bandWiederholungen: 3, abSekunden: 12 })).toBe(
      'Gesamt 0:42 · Band 3× · ab 0:12',
    )
  })

  it('ohne Wiederholung faellt die Zahl weg', () => {
    expect(folgeText({ gesamtSekunden: 42, bandWiederholungen: 1, abSekunden: 0 })).toBe(
      'Gesamt 0:42 · ab 0:00',
    )
  })

  it('ohne Gesamtlaenge steht ein Hinweis, keine erfundene Zahl', () => {
    expect(folgeText({ gesamtSekunden: null, bandWiederholungen: null, abSekunden: null })).toBe(
      'Gesamt unbekannt',
    )
  })
})
