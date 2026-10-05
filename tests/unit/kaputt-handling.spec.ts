// Verhaltenstests zu #141 - kaputt-handling.ts.
// speichereAktion (#136) als Doppel (der Fokus dieser Datei sind die Stellen
// und der Fix-Ablauf); der Schreibweg selbst ist #136.
import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Asset } from '../../src/shared/contracts/asset'
import type { Listenelement } from '../../src/shared/contracts/project'

const speicherDoppel = vi.hoisted(() => ({
  aufrufe: [] as Array<{ id: string; aenderungen: unknown }>,
  antwort: null as unknown,
}))

vi.mock('../../src/renderer/action-editor/aktion-bearbeiten', () => ({
  speichereAktion: async (id: string, aenderungen: unknown) => {
    speicherDoppel.aufrufe.push({ id, aenderungen })
    return speicherDoppel.antwort
  },
}))

import {
  anzahlStellen,
  behebeAktionsBild,
  betroffeneStellen,
} from '../../src/renderer/action-editor/kaputt-handling'

// Quelldatei-Verbote
const QUELLE = readFileSync(
  new URL('../../src/renderer/action-editor/kaputt-handling.ts', import.meta.url).pathname,
  'utf8',
)

describe('kaputt-handling – Quelldatei-Verbote (Grep)', () => {
  it('ruft kein rufeAuf/window.api/fs/zeichneSegment', () => {
    for (const verbot of ['rufeAuf', 'window.api', "node:fs", 'zeichneSegment']) {
      expect(QUELLE).not.toContain(verbot)
    }
  })
})

function asset(id: string, typ: 'video' | 'bild', zustand: 'ok' | 'fehlt' = 'ok'): Asset {
  return {
    id,
    typ,
    dateiname: `${id}.${typ === 'video' ? 'mp4' : 'png'}`,
    originalname: `medium-${id}`,
    maße: { breite: 1920, höhe: 1080 },
    dauer: typ === 'video' ? 12.5 : null,
    importdatum: '2026-08-01T10:00:00Z',
    zustand,
  }
}

function segment(id: string, ref: string): Listenelement {
  return { id, art: 'segment', ref, dauer: 10, trimStart: null, trimEnde: null, einblendung: null }
}

function video(id: string, bandAktionIds: string[]): Listenelement {
  return {
    id,
    art: 'video',
    ref: 'asset-video',
    dauer: null,
    trimStart: null,
    trimEnde: null,
    einblendung: {
      bandVorlageId: 'band-standard',
      abschnitte: bandAktionIds.map((aktionRef) => ({ aktionRef, dauer: 7.13 })),
    },
  }
}

const AKTION_OK = {
  ok: true as const,
  wert: {
    id: 'a-1',
    titel: 'Sommeraktion',
    beschreibung: null,
    preis: null,
    bildRef: 'b-neu',
    cta: null,
    standardDauer: null,
    vorlagenId: 'vollbild',
    markeId: 'm1',
    akzentfarbe: null,
  },
}

beforeEach(() => {
  speicherDoppel.aufrufe.splice(0)
  speicherDoppel.antwort = AKTION_OK
})

describe('betroffeneStellen (#141)', () => {
  it('findet ein segment-Element mit passender ref', () => {
    const stellen = betroffeneStellen('a-1', [segment('e1', 'a-1'), segment('e2', 'a-2')])
    expect(stellen.segmentElementIds).toEqual(['e1'])
    expect(stellen.bandAbschnitte).toEqual([])
  })

  it('findet einen Band-Abschnitt und meldet dessen INDEX', () => {
    const stellen = betroffeneStellen('a-1', [video('v1', ['a-2', 'a-1'])])
    expect(stellen.bandAbschnitte).toEqual([{ elementId: 'v1', index: 1 }])
  })

  it('FÜHRT ein Band dieselbe Aktion zweimal -> zwei Einträge mit verschiedenen Indizes', () => {
    const stellen = betroffeneStellen('a-1', [video('v1', ['a-1', 'a-2', 'a-1'])])
    expect(stellen.bandAbschnitte).toEqual([
      { elementId: 'v1', index: 0 },
      { elementId: 'v1', index: 2 },
    ])
  })

  it('ein video-Element, dessen ref zufällig gleich der aktionId ist, wird NICHT als Segment-Treffer gezählt', () => {
    // art 'video' mit der zufällig passenden ref: über ref NIE ein Treffer.
    const eigen = { ...segment('v-quirks', 'a-1'), art: 'video' as const, ref: 'a-1' }
    const stellen = betroffeneStellen('a-1', [eigen])
    expect(stellen.segmentElementIds).toEqual([])
    expect(stellen.bandAbschnitte).toEqual([])
  })
})

describe('anzahlStellen (#141)', () => {
  it('zählt Segment-Elemente UND Band-Abschnitte zusammen (2 + 3 = 5)', () => {
    const stellen = {
      segmentElementIds: ['e1', 'e2'],
      bandAbschnitte: [
        { elementId: 'v1', index: 0 },
        { elementId: 'v1', index: 1 },
        { elementId: 'v2', index: 0 },
      ],
    }
    expect(anzahlStellen(stellen)).toBe(5)
  })
})

describe('behebeAktionsBild (#141)', () => {
  const assets = [asset('b-ok', 'bild'), asset('b-fehlt', 'bild', 'fehlt'), asset('v-ok', 'video')]

  it("ersetzen mit gültigem Bild-Asset -> speichereAktion(aktionId, { bildRef: assetId })", async () => {
    await behebeAktionsBild('a-1', { art: 'ersetzen', assetId: 'b-ok' }, [], assets)
    expect(speicherDoppel.aufrufe).toEqual([{ id: 'a-1', aenderungen: { bildRef: 'b-ok' } }])
  })

  it.each([
    ['unbekannte ID', 'gibts-nicht', assets],
    ['fehlt-Asset', 'b-fehlt', assets],
    ['Video-Asset', 'v-ok', assets],
  ])('ersetzen mit %s -> ungueltige_eingabe, speichereAktion NICHT aufgerufen', async (_fall, assetId, bestand) => {
    const antwort = await behebeAktionsBild('a-1', { art: 'ersetzen', assetId }, [], bestand)
    expect(antwort.ok).toBe(false)
    void antwort
    expect(speicherDoppel.aufrufe).toHaveLength(0)
  })

  it("entfernen -> speichereAktion(aktionId, { bildRef: null }), auch mit LEEREM assets-Array", async () => {
    await behebeAktionsBild('a-1', { art: 'entfernen' }, [segment('e1', 'a-1')], [])
    expect(speicherDoppel.aufrufe).toEqual([{ id: 'a-1', aenderungen: { bildRef: null } }])
  })

  it('die behobenen Stellen werden VOR dem Schreiben ermittelt (Liste wird im Test danach verändert)', async () => {
    const liste = [segment('e1', 'a-1')]
    const antwort = await behebeAktionsBild('a-1', { art: 'entfernen' }, liste, [])
    // Die Liste wird NACH dem Aufruf verändert; das Ergebnis ist vom VORHER-Stand.
    liste.push(segment('e2', 'a-1'))
    if (antwort.ok) {
      expect(antwort.wert.behobeneStellen.segmentElementIds).toEqual(['e1'])
    }
  })

  it('ok:false des Main -> keine behobeneStellen im Ergebnis; Liste unverändert', async () => {
    speicherDoppel.antwort = {
      ok: false,
      fehler: { code: 'nicht_gefunden', meldung: 'Aktion unbekannt', daten: undefined },
    }
    const antwort = await behebeAktionsBild('fehlt', { art: 'entfernen' }, [segment('e1', 'fehlt')], [])
    expect(antwort).toEqual({
      ok: false,
      fehler: { code: 'nicht_gefunden', meldung: 'Aktion unbekannt', daten: undefined },
    })
  })
})
