// Tests zum Rueckverweis „wo laeuft diese Aktion?" (02.11.2026).
//
// Der Verweis ist die Zusage aus der Messlatte: „Regal, nicht Verwaltung" - man soll ohne
// Oeffnen wissen, wohin ein Werbemittel gehoert. Geprueft wird die Rechnung, NICHT die
// Anzeige: Startsekunde im Band, Wiederholungszahl (dieselbe wie der Block `x3`), die
// Unterbrechungsstellen und der Text.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import type { Listenelement } from '../../src/shared/contracts/project'
import {
  baueVerwendungen,
  formatiereSekunden,
  verwendungsText,
} from '../../src/renderer/composer/verwendungen'

function video(
  ueber: Partial<Listenelement> & { id: string },
  abschnitte: Array<{ aktionRef: string; dauer: number }>,
): Listenelement {
  return {
    art: 'video',
    ref: 'asset-v',
    dauer: null,
    trimStart: 0,
    trimEnde: 30,
    einblendung: abschnitte.length === 0 ? null : { bandVorlageId: 'band', abschnitte },
    unterbrechungen: [],
    ...ueber,
  }
}

function segment(id: string, aktionRef: string): Listenelement {
  return {
    id,
    art: 'segment',
    ref: aktionRef,
    dauer: 10,
    trimStart: null,
    trimEnde: null,
    einblendung: null,
  }
}

describe('baueVerwendungen', () => {
  it('die Startsekunde ist die Summe aller Abschnitte davor', () => {
    const liste = [
      video({ id: 'v1' }, [
        { aktionRef: 'a', dauer: 5 },
        { aktionRef: 'b', dauer: 7 },
        { aktionRef: 'c', dauer: 3 },
      ]),
    ]
    const ver = baueVerwendungen(liste)
    expect(ver.get('a')?.band?.abSekunden).toBe(0)
    expect(ver.get('b')?.band?.abSekunden).toBe(5)
    expect(ver.get('c')?.band?.abSekunden).toBe(12)
  })

  it('die Wiederholungszahl ist DIESELBE wie am Zeitblock (30 s Video, 15 s Folge -> 2x)', () => {
    const liste = [
      video({ id: 'v1' }, [
        { aktionRef: 'a', dauer: 15 },
        { aktionRef: 'b', dauer: 0 },
      ]),
    ]
    // Folge = 15 s, Video = 30 s -> ceil(30/15) = 2
    expect(baueVerwendungen(liste).get('a')?.band?.wiederholungen).toBe(2)
  })

  it('laeuft die Folge laenger als das Video, gibt es keine Wiederholung (1)', () => {
    const liste = [video({ id: 'v1' }, [{ aktionRef: 'a', dauer: 45 }])]
    expect(baueVerwendungen(liste).get('a')?.band?.wiederholungen).toBe(1)
  })

  it('dieselbe Aktion zweimal in der Folge: die Zeile nennt die ERSTE Stelle', () => {
    const liste = [
      video({ id: 'v1' }, [
        { aktionRef: 'x', dauer: 4 },
        { aktionRef: 'a', dauer: 5 },
        { aktionRef: 'a', dauer: 6 },
      ]),
    ]
    expect(baueVerwendungen(liste).get('a')?.band?.abSekunden).toBe(4)
  })

  it('Unterbrechungen werden gesammelt und AUFSTEIGEND sortiert', () => {
    const liste = [
      video(
        {
          id: 'v1',
          unterbrechungen: [
            { zeitstelle: 9, aktionRef: 'a', dauer: 3 },
            { zeitstelle: 2, aktionRef: 'a', dauer: 3 },
          ],
        },
        [],
      ),
    ]
    expect(baueVerwendungen(liste).get('a')?.unterbrechungen).toEqual([2, 9])
  })

  it('Segment-Elemente tragen keine Verwendung bei (nur Videos)', () => {
    const liste = [segment('e1', 'a')]
    expect(baueVerwendungen(liste).size).toBe(0)
  })

  it('ein Video ohne Band und ohne Unterbrechung erzeugt keinen Eintrag', () => {
    expect(baueVerwendungen([video({ id: 'v1' }, [])]).size).toBe(0)
  })
})

describe('verwendungsText', () => {
  it('nennt Band, Stelle und Wiederholung', () => {
    expect(
      verwendungsText({ band: { abSekunden: 12, wiederholungen: 3 }, unterbrechungen: [] }),
    ).toBe('Band ab 0:12 · 3×')
  })

  it('ohne Wiederholung faellt die Zahl weg - keine „1x"-Behauptung', () => {
    expect(
      verwendungsText({ band: { abSekunden: 0, wiederholungen: 1 }, unterbrechungen: [] }),
    ).toBe('Band ab 0:00')
  })

  it('Unterbrechungen stehen als eigene Stelle daneben', () => {
    expect(verwendungsText({ band: null, unterbrechungen: [4] })).toBe('Unterbrechung 0:04')
  })

  it('ohne Verwendung steht ein Hinweis, kein Nichts', () => {
    expect(verwendungsText(undefined)).toBe('noch nicht im Video')
    expect(verwendungsText({ band: null, unterbrechungen: [] })).toBe('noch nicht im Video')
  })

  it('formatiereSekunden rechnet in m:ss', () => {
    expect(formatiereSekunden(72)).toBe('1:12')
    expect(formatiereSekunden(5)).toBe('0:05')
  })
})
