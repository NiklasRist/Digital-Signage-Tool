// Tests zum Motiv in der Aktionszeile (02.11.2026).
//
// Zwei Zusagen: (1) Die Zulieferung fuer `bereiteMotiveVor` enthaelt jedes Bild GENAU EINMAL
// und nur, wenn es im Bestand liegt - sonst wartet das Laden auf etwas, das es nicht gibt.
// (2) Ohne Canvas (jsdom) gibt es KEIN Bild, aber keinen Wurf: eine Vorschau darf die
// Bibliothek nicht zum Absturz bringen.
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Asset } from '../../src/shared/contracts/asset'
import type { Marke } from '../../src/shared/contracts/marke'
import type { Project } from '../../src/shared/contracts/project'
import type { Vorlage } from '../../src/shared/contracts/vorlage'
import {
  baueMotivEintraege,
  holeMotiv,
  leereMotivSpeicher,
  motivImSpeicher,
  motivSchluessel,
} from '../../src/renderer/gemeinsam/aktions-motiv'

function aktion(id: string, bildRef: string | null): Aktion {
  return {
    id,
    titel: `Aktion ${id}`,
    beschreibung: null,
    preis: null,
    bildRef,
    cta: null,
    standardDauer: null,
    vorlagenId: 'v1',
    markeId: 'm1',
    akzentfarbe: null,
  }
}

function asset(id: string, zustand: 'ok' | 'fehlt' = 'ok'): Asset {
  return {
    id,
    typ: 'bild',
    dateiname: `${id}.png`,
    originalname: `Original ${id}.png`,
    maße: { breite: 100, höhe: 100 },
    dauer: null,
    importdatum: '2026-01-01T00:00:00.000Z',
    zustand,
  }
}

function projekt(aktionen: Aktion[], assets: Asset[]): Project {
  return {
    id: 'p1',
    name: 'Probe',
    erstelltAm: '2026-01-01T00:00:00.000Z',
    geaendertAm: '2026-01-01T00:00:00.000Z',
    schemaVersion: 1,
    assets,
    aktionen,
    liste: [],
    letzterAusgabeName: null,
    standardMarkeId: 'm1',
    standardSegmentdauer: 10,
  }
}

describe('baueMotivEintraege', () => {
  it('nennt jedes Bild GENAU EINMAL, auch wenn zwei Aktionen es nutzen', () => {
    const eintraege = baueMotivEintraege(
      projekt(
        [aktion('a1', 'bild-1'), aktion('a2', 'bild-1')],
        [asset('bild-1')],
      ),
    )
    expect(eintraege).toEqual([{ schluessel: 'bild-1', dateiname: 'bild-1.png' }])
  })

  it('laesst Aktionen ohne Bild und Bilder, die nicht mehr da sind, weg', () => {
    const eintraege = baueMotivEintraege(
      projekt(
        [aktion('a1', null), aktion('a2', 'weg'), aktion('a3', 'kaputt'), aktion('a4', 'gut')],
        [asset('kaputt', 'fehlt'), asset('gut')],
      ),
    )
    expect(eintraege).toEqual([{ schluessel: 'gut', dateiname: 'gut.png' }])
  })
})

describe('motivSchluessel', () => {
  const vorlage = { id: 'v1', name: 'Band', höhe: 162 } as Vorlage
  const marke = { id: 'm1', name: 'Marke' } as Marke

  it('aendert sich, wenn sich die AKTION aendert - sonst bliebe das alte Bild stehen', () => {
    const vorher = motivSchluessel(aktion('a1', 'bild-1'), vorlage, marke)
    const nachher = motivSchluessel({ ...aktion('a1', 'bild-1'), titel: 'Neuer Titel' }, vorlage, marke)
    expect(nachher).not.toBe(vorher)
  })

  it('aendert sich, wenn sich die MARKE aendert', () => {
    const vorher = motivSchluessel(aktion('a1', 'bild-1'), vorlage, marke)
    const nachher = motivSchluessel(aktion('a1', 'bild-1'), vorlage, { ...marke, name: 'Andere' })
    expect(nachher).not.toBe(vorher)
  })
})

describe('holeMotiv ohne Canvas (jsdom)', () => {
  it('liefert null statt zu werfen - kein Bild ist ein Zustand, kein Absturz', () => {
    const vorlage = { id: 'v1', name: 'Band', höhe: 162 } as Vorlage
    const marke = { id: 'm1', name: 'Marke' } as Marke
    leereMotivSpeicher()
    expect(holeMotiv(aktion('a1', 'bild-1'), vorlage, marke)).toBeNull()
    // Nichts gemerkt: ein gescheitertes Zeichnen darf den Speicher nicht fuellen.
    expect(motivImSpeicher(motivSchluessel(aktion('a1', 'bild-1'), vorlage, marke))).toBe(false)
  })
})
