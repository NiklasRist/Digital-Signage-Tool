import path from 'node:path'

import { beforeEach, describe, expect, it, vi } from 'vitest'

// Verhaltenstest zu holeLoeschungenNach (#90).
//
// Alle drei Nachbarn sind Spione: Q2 (#66), die Pfad-Autoritaet (#49) und das Entfernen (#86).
// Die Aussage jedes Falls ist "wer wurde womit gerufen - und wer NICHT": Ein zu frueh
// gestrichener Vermerk heisst, dass die Datei fuer immer liegenbleibt; ein nie gestrichener
// heisst, dass der Lauf sie bei jedem Start erneut versucht.
//
// KEIN echtes Dateisystem: Diese Datei loescht nichts selbst, sie reicht einen Pfad an #86
// weiter. Ein Temp-Ordner wuerde nur die Attrappe von #86 pruefen.
//
// `medienOrdner` steht als Literal da und wird NICHT mit `path.join` gebaut: Der Rumpf von
// `vi.hoisted` laeuft vor jedem Import dieser Datei, `path` waere dort noch nicht initialisiert.
const zustand = vi.hoisted(() => ({
  medienOrdner: '/daten/projects/p-1/media',
  /** Antwort von holePendingDeletions (Standard: leere Liste). */
  vorgemerkt: { ok: true, wert: [] } as
    | { ok: true; wert: Array<{ dateiname: string; vermerktAm: string }> }
    | { ok: false; fehler: { code: string; meldung: string } },
  /** Dateinamen, fuer die loeseAssetPfad `ok: false` liefern soll. */
  pfadAbweisungen: new Set<string>(),
  /** Pfade, fuer die entferneDatei scheitern soll. */
  loeschFehler: new Set<string>(),
  /** Dateinamen, fuer die streichePendingDeletion scheitern soll. */
  streichFehler: new Set<string>(),
  holeAufrufe: [] as string[],
  pfadAufrufe: [] as Array<{ projektId: string; dateiname: string }>,
  entferneAufrufe: [] as string[],
  streichAufrufe: [] as Array<{ projektId: string; dateiname: string }>,
}))

vi.mock('../../src/main/auftrags-manager/pending-deletions', () => ({
  holePendingDeletions: async (projektId: string) => {
    zustand.holeAufrufe.push(projektId)
    return zustand.vorgemerkt
  },
  streichePendingDeletion: async (projektId: string, dateiname: string) => {
    zustand.streichAufrufe.push({ projektId, dateiname })
    if (zustand.streichFehler.has(dateiname)) {
      return { ok: false, fehler: { code: 'speicher_fehler', meldung: 'Platte voll' } }
    }
    return { ok: true, wert: undefined }
  },
}))

vi.mock('../../src/main/project-store/pfade', () => ({
  loeseAssetPfad: (projektId: string, dateiname: string) => {
    zustand.pfadAufrufe.push({ projektId, dateiname })
    if (zustand.pfadAbweisungen.has(dateiname)) {
      return {
        ok: false,
        fehler: {
          code: 'ungueltige_eingabe',
          meldung: 'Der Dateiname ist kein reiner Dateiname ohne Verzeichnisanteil.',
        },
      }
    }
    return { ok: true, wert: path.join(zustand.medienOrdner, dateiname) }
  },
}))

vi.mock('../../src/main/media-service/datei-entfernen', () => ({
  entferneDatei: async (pfad: string) => {
    zustand.entferneAufrufe.push(pfad)
    if (zustand.loeschFehler.has(pfad)) {
      return { ok: false, fehler: { code: 'datei_fehler', meldung: 'noch belegt' } }
    }
    return { ok: true, wert: undefined }
  },
}))

const { holeLoeschungenNach } = await import(
  '../../src/main/media-service/reconcile-loeschungen'
)

const PROJEKT = '3f2a1c4e-0000-4000-8000-0123456789ab'

function vermerke(...dateinamen: string[]): void {
  zustand.vorgemerkt = {
    ok: true,
    wert: dateinamen.map((dateiname) => ({
      dateiname,
      vermerktAm: '2026-08-12T09:00:00.000Z',
    })),
  }
}

function medienPfad(dateiname: string): string {
  return path.join(zustand.medienOrdner, dateiname)
}

beforeEach(() => {
  zustand.vorgemerkt = { ok: true, wert: [] }
  zustand.pfadAbweisungen = new Set()
  zustand.loeschFehler = new Set()
  zustand.streichFehler = new Set()
  zustand.holeAufrufe = []
  zustand.pfadAufrufe = []
  zustand.entferneAufrufe = []
  zustand.streichAufrufe = []
})

describe('holeLoeschungenNach (#90) - der Regelfall', () => {
  it('meldet 0/0 ohne offene Loeschungen, ohne eine Datei anzufassen', async () => {
    const ergebnis = await holeLoeschungenNach(PROJEKT)

    expect(ergebnis).toEqual({ ok: true, wert: { erledigt: 0, offen: 0 } })
    expect(zustand.entferneAufrufe).toEqual([])
    expect(zustand.streichAufrufe).toEqual([])
  })

  it('loescht drei Vermerke und streicht sie mit dem Dateinamen, nicht mit dem Pfad', async () => {
    vermerke('a.mp4', 'b.mp4', 'c.png')

    const ergebnis = await holeLoeschungenNach(PROJEKT)

    expect(ergebnis).toEqual({ ok: true, wert: { erledigt: 3, offen: 0 } })
    expect(zustand.pfadAufrufe).toEqual([
      { projektId: PROJEKT, dateiname: 'a.mp4' },
      { projektId: PROJEKT, dateiname: 'b.mp4' },
      { projektId: PROJEKT, dateiname: 'c.png' },
    ])
    // Genau der von #49 gelieferte Pfad, ein Argument - kein selbst gebauter und kein zweiter.
    expect(zustand.entferneAufrufe).toEqual([
      medienPfad('a.mp4'),
      medienPfad('b.mp4'),
      medienPfad('c.png'),
    ])
    expect(zustand.streichAufrufe).toEqual([
      { projektId: PROJEKT, dateiname: 'a.mp4' },
      { projektId: PROJEKT, dateiname: 'b.mp4' },
      { projektId: PROJEKT, dateiname: 'c.png' },
    ])
  })

  it('streicht auch den Vermerk zu einer laengst verschwundenen Datei', async () => {
    // #86 meldet ENOENT als ERFOLG. Genau darauf beruht dieser Ablauf: Haette der Nutzer die
    // Datei selbst im Explorer entfernt, bliebe der Vermerk sonst fuer immer stehen.
    vermerke('schon-weg.mp4')

    const ergebnis = await holeLoeschungenNach(PROJEKT)

    expect(ergebnis).toEqual({ ok: true, wert: { erledigt: 1, offen: 0 } })
    expect(zustand.streichAufrufe).toEqual([{ projektId: PROJEKT, dateiname: 'schon-weg.mp4' }])
  })

  it('versucht jeden Eintrag genau einmal - keine Wiederholschleife im Lauf', async () => {
    vermerke('a.mp4', 'b.mp4')
    zustand.loeschFehler.add(medienPfad('a.mp4'))

    await holeLoeschungenNach(PROJEKT)

    expect(zustand.holeAufrufe).toEqual([PROJEKT])
    expect(zustand.entferneAufrufe).toEqual([medienPfad('a.mp4'), medienPfad('b.mp4')])
  })
})

describe('holeLoeschungenNach (#90) - wann ein Vermerk stehen bleibt', () => {
  it('zaehlt einen gescheiterten Loeschversuch als offen und streicht ihn NICHT', async () => {
    vermerke('a.mp4', 'belegt.mp4', 'c.mp4')
    zustand.loeschFehler.add(medienPfad('belegt.mp4'))

    const ergebnis = await holeLoeschungenNach(PROJEKT)

    expect(ergebnis).toEqual({ ok: true, wert: { erledigt: 2, offen: 1 } })
    expect(zustand.streichAufrufe.map((a) => a.dateiname)).toEqual(['a.mp4', 'c.mp4'])
  })

  it('ueberspringt einen unbrauchbaren Dateinamen, ohne #86 zu rufen, und macht weiter', async () => {
    vermerke('a.mp4', '../ausbruch.mp4', 'c.mp4')
    zustand.pfadAbweisungen.add('../ausbruch.mp4')

    const ergebnis = await holeLoeschungenNach(PROJEKT)

    expect(ergebnis).toEqual({ ok: true, wert: { erledigt: 2, offen: 1 } })
    expect(zustand.entferneAufrufe).toEqual([medienPfad('a.mp4'), medienPfad('c.mp4')])
    expect(zustand.streichAufrufe.map((a) => a.dateiname)).toEqual(['a.mp4', 'c.mp4'])
  })

  it('zaehlt als offen, wenn die Datei weg ist, das Streichen aber scheitert', async () => {
    // Der Vermerk steht danach noch in Q2 - `offen` beschreibt den Bestand, nicht den Versuch.
    vermerke('a.mp4')
    zustand.streichFehler.add('a.mp4')

    const ergebnis = await holeLoeschungenNach(PROJEKT)

    expect(ergebnis).toEqual({ ok: true, wert: { erledigt: 0, offen: 1 } })
    expect(zustand.entferneAufrufe).toEqual([medienPfad('a.mp4')])
  })
})

describe('holeLoeschungenNach (#90) - Abbruch und Eingangspruefung', () => {
  it('reicht speicher_fehler aus Q2 unveraendert durch und loescht nichts', async () => {
    // KEIN Rueckfall auf eine leere Liste: `{ erledigt: 0, offen: 0 }` hiesse "es gibt nichts",
    // waehrend in der Datei womoeglich zehn Eintraege stehen.
    zustand.vorgemerkt = {
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'queue-retry.json ist unlesbar.' },
    }

    const ergebnis = await holeLoeschungenNach(PROJEKT)

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('speicher_fehler')
    expect(ergebnis.fehler.meldung).toBe('queue-retry.json ist unlesbar.')
    expect(zustand.entferneAufrufe).toEqual([])
    expect(zustand.streichAufrufe).toEqual([])
  })

  it.each([
    ['', 'leer'],
    ['../x', 'Aufstieg'],
    ['a/b', 'Schraegstrich'],
    ['a\\b', 'Rueckwaerts-Schraegstrich'],
  ])('weist die Projekt-ID %s (%s) ab, ohne einen einzigen fremden Aufruf', async (id) => {
    vermerke('a.mp4')

    const ergebnis = await holeLoeschungenNach(id)

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(zustand.holeAufrufe).toEqual([])
    expect(zustand.pfadAufrufe).toEqual([])
    expect(zustand.entferneAufrufe).toEqual([])
  })

  it('meldet unbekannter_fehler statt zu werfen, wenn ein Vermerk kaputt ist', async () => {
    zustand.vorgemerkt = { ok: true, wert: [null] } as unknown as typeof zustand.vorgemerkt

    const ergebnis = await holeLoeschungenNach(PROJEKT)

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
  })
})
