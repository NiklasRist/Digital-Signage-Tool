// Verhaltenstest zu #48 (migriereProjekt).
//
// AKTUELLE_SCHEMA_VERSION (#21) ist heute 1 - es gibt also gar keine aeltere Fassung, von der aus
// sich eine Kette beobachten liesse. Statt kuenstlicher Versionen unterhalb von 1 wird hier die
// KONSTANTE gemockt (Zielversion 3). Damit laufen die Tests genau den Fall durch, um den es
// fachlich geht: Eine spaetere App-Fassung oeffnet ein Projekt im Format 1 und hebt es ueber 2
// auf 3. Die Schritte selbst sind Test-Schritte - dieses Issue erfindet keine echte Migration.
import { describe, expect, it, vi } from 'vitest'

import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import type { Project } from '../../src/shared/contracts/project'
import type { MigrationsSchritt } from '../../src/main/project-store/migriere-projekt'

const zustand = vi.hoisted(() => ({ ZIEL: 3 }))

vi.mock('../../src/shared/contracts/konstanten', async () => {
  const echt =
    await vi.importActual<typeof import('../../src/shared/contracts/konstanten')>(
      '../../src/shared/contracts/konstanten',
    )
  return { ...echt, AKTUELLE_SCHEMA_VERSION: zustand.ZIEL }
})

const { MIGRATIONS_KETTE, migriereProjekt } = await import(
  '../../src/main/project-store/migriere-projekt'
)

/** Ein vollstaendiges Projekt nach TK 9.11.3 in der angegebenen Fassung. */
function projekt(
  version: number,
  zusatz: Record<string, unknown> = {},
): Record<string, unknown> & { schemaVersion: number } {
  return {
    id: 'p-1',
    name: 'Studio Nord',
    erstelltAm: '2026-01-01T00:00:00.000Z',
    geaendertAm: '2026-01-02T00:00:00.000Z',
    assets: [],
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
    ...zusatz,
    schemaVersion: version,
  }
}

/** Ein regelkonformer Schritt: uebernimmt alles per Spread, hinterlaesst seine Marke, +1. */
function schritt(marke: string): MigrationsSchritt {
  return (alt) => ({ ...alt, [marke]: true, schemaVersion: Number(alt.schemaVersion) + 1 })
}

function wert(ergebnis: Ergebnis<Project>): Record<string, unknown> {
  if (!ergebnis.ok) {
    throw new Error(`unerwarteter Fehler: ${ergebnis.fehler.meldung}`)
  }
  return ergebnis.wert as unknown as Record<string, unknown>
}

function code(ergebnis: Ergebnis<Project>): string {
  if (ergebnis.ok) {
    throw new Error('unerwarteter Erfolg - erwartet war ein Fehler')
  }
  return ergebnis.fehler.code
}

describe('migriereProjekt (#48)', () => {
  it('haelt MIGRATIONS_KETTE leer, solange es nur eine schemaVersion gibt', () => {
    expect(MIGRATIONS_KETTE.size).toBe(0)
  })

  it('hebt mit einem Schritt auf die aktuelle Version und verliert kein unbekanntes Feld', () => {
    const kette = new Map([[2, schritt('s2')]])

    const ergebnis = migriereProjekt(projekt(2, { unbekanntesFeld: 'behalten' }), kette)

    expect(wert(ergebnis).schemaVersion).toBe(3)
    // Der Schritt kennt dieses Feld nicht - es muss ihn trotzdem unveraendert ueberleben.
    expect(wert(ergebnis).unbekanntesFeld).toBe('behalten')
  })

  it('wendet die Kette Stufe fuer Stufe an, nicht nur den ersten Schritt', () => {
    const kette = new Map([
      [1, schritt('s1')],
      [2, schritt('s2')],
    ])

    const ergebnis = migriereProjekt(projekt(1), kette)

    expect(wert(ergebnis).schemaVersion).toBe(3)
    expect(wert(ergebnis).s1).toBe(true)
    expect(wert(ergebnis).s2).toBe(true)
  })

  it('bricht ab, wenn fuer eine durchlaufene Version kein Schritt existiert', () => {
    // Der Schritt 1->2 fehlt; ein stilles Durchwinken haette ein Projekt im Format 1 als
    // aktuelles Projekt in den Speicher gelegt.
    const kette = new Map([[2, schritt('s2')]])

    const ergebnis = migriereProjekt(projekt(1), kette)

    expect(code(ergebnis)).toBe('unbekannter_fehler')
  })

  it('weist einen Schritt zurueck, der zwei Versionen auf einmal nimmt', () => {
    // Landet sogar genau auf der Zielversion - und ist trotzdem falsch: Die Zwischenstufe wurde
    // nie durchlaufen, welche Felder dabei fehlen, weiss niemand.
    const kette = new Map<number, MigrationsSchritt>([
      [1, (alt) => ({ ...alt, schemaVersion: 3 })],
    ])

    const ergebnis = migriereProjekt(projekt(1), kette)

    expect(code(ergebnis)).toBe('unbekannter_fehler')
  })

  it('winkt eine NEUERE Fassung als die eigene nicht durch', () => {
    // Der gefaehrliche Fall: Ein aelteres Programm darf eine neuere Datei nicht als gueltig
    // annehmen (TK 9.5.5). Zustaendig ist #34 - hier darf sie nur nicht zusaetzlich durchrutschen.
    const rohdaten = projekt(9)

    const ergebnis = migriereProjekt(rohdaten, new Map())

    expect(code(ergebnis)).toBe('unbekannter_fehler')
    expect(rohdaten.schemaVersion).toBe(9)
  })

  it('laesst das Objekt des Aufrufers unberuehrt, auch wenn ein Schritt sein alt veraendert', () => {
    const rohdaten = projekt(2)
    const kette = new Map<number, MigrationsSchritt>([
      [
        2,
        (alt) => {
          alt.name = 'ueberschrieben'
          return { ...alt, schemaVersion: 3 }
        },
      ],
    ])

    const ergebnis = migriereProjekt(rohdaten, kette)

    expect(wert(ergebnis).name).toBe('ueberschrieben')
    expect(rohdaten.name).toBe('Studio Nord')
  })

  it('meldet eine unlesbare schemaVersion als ungueltige Eingabe', () => {
    const kaputt = { ...projekt(1), schemaVersion: 'eins' } as unknown as Record<string, unknown> & {
      schemaVersion: number
    }

    expect(code(migriereProjekt(kaputt, new Map()))).toBe('ungueltige_eingabe')
  })

  it('erkennt ein Pflichtfeld, das ein Schritt verloren hat', () => {
    // Mindest-Laufzeitpruefung: TypeScript merkt davon nichts, und ohne die Pruefung faellt der
    // Verlust erst auf, wenn im Render etwas fehlt.
    const kette = new Map<number, MigrationsSchritt>([
      [
        2,
        (alt) => {
          const { liste: _weg, ...rest } = alt
          return { ...rest, schemaVersion: 3 }
        },
      ],
    ])

    const ergebnis = migriereProjekt(projekt(2), kette)

    expect(code(ergebnis)).toBe('unbekannter_fehler')
    expect(ergebnis.ok ? '' : ergebnis.fehler.meldung).toContain('liste')
  })
})
