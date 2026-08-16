import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProjektMeta } from '../../src/main/project-store/liste-projekte'

// Verhaltenstest zu #106 (pruefeVorlagenReferenzen).
//
// ECHTE Dateien in einem Temp-Ordner: Die Funktion lebt davon, ob eine project.json da,
// lesbar und gueltig ist. Gemockt sind nur die drei Nachbarn - `datenort`, damit die echte
// Pfad-Autoritaet (#49) in den Temp-Ordner zeigt, `liste-projekte` (#35), weil die Menge der
// gemeldeten Projekte der Eingang dieser Pruefung ist, und `node:fs/promises` als reiner
// Durchreicher, der jeden gelesenen Pfad mitschreibt (Zeuge fuer "einer je Projekt" und fuer
// "die Sicherungsdatei wird nicht angefasst").
const zustand = vi.hoisted(() => ({
  datenOrt: '',
  /** Antwort von listeProjekte. */
  projekte: { ok: true, wert: [] } as
    | { ok: true; wert: unknown[] }
    | { ok: false; fehler: { code: string; meldung: string } },
  listeAufrufe: 0,
  /** Jede projektId, mit der die Pfad-Autoritaet gerufen wurde. */
  ordnerAufrufe: [] as string[],
  /** Jeder Pfad, den readFile zu sehen bekam. */
  leseAufrufe: [] as string[],
}))

vi.mock('../../src/main/datenort', () => ({
  ermittleDatenOrt: () => zustand.datenOrt,
}))

vi.mock('../../src/main/project-store/liste-projekte', () => ({
  listeProjekte: async () => {
    zustand.listeAufrufe += 1
    return zustand.projekte
  },
}))

// Die Pfad-Autoritaet bleibt ECHT und wird nur belauscht: Der Test soll belegen, dass der
// Ordner ueber projektOrdner entsteht, nicht dass eine Attrappe zurueckgibt, was er erwartet.
vi.mock('../../src/main/project-store/pfade', async (originalImportieren) => {
  const echt = await originalImportieren<typeof import('../../src/main/project-store/pfade')>()
  return {
    ...echt,
    projektOrdner: (projektId: string) => {
      zustand.ordnerAufrufe.push(projektId)
      return echt.projektOrdner(projektId)
    },
  }
})

vi.mock('node:fs/promises', async (originalImportieren) => {
  const echt = await originalImportieren<typeof import('node:fs/promises')>()
  const readFile = async (ziel: string, kodierung: 'utf8') => {
    zustand.leseAufrufe.push(String(ziel))
    return echt.readFile(ziel, kodierung)
  }
  return { ...echt, readFile, default: { ...echt, readFile } }
})

const { pruefeVorlagenReferenzen } = await import(
  '../../src/main/vorlagen-store/referenzpruefung'
)
const pfade = await import('../../src/main/project-store/pfade')

const VORLAGE = 'band-standard'

function meta(id: string, beschaedigt = false): ProjektMeta {
  return {
    id,
    name: id,
    erstelltAm: '2026-01-01T00:00:00.000Z',
    geaendertAm: '2026-01-01T00:00:00.000Z',
    ordner: id,
    beschaedigt,
    anzahlMedien: 0,
    anzahlAusgaben: 0,
  }
}

/** Schreibt den Rohtext einer project.json; `null` = Ordner ohne Datei. */
async function legeProjektAn(id: string, inhalt: string | null): Promise<void> {
  const ordner = pfade.projektOrdner(id)
  await fsp.mkdir(ordner, { recursive: true })
  if (inhalt !== null) {
    await fsp.writeFile(path.join(ordner, 'project.json'), inhalt, 'utf8')
  }
}

function projekt(name: string, teile: Record<string, unknown> = {}): string {
  return JSON.stringify({
    id: 'im-feld-steht-etwas-anderes',
    name,
    erstelltAm: '2026-01-01T00:00:00.000Z',
    geaendertAm: '2026-01-01T00:00:00.000Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
    ...teile,
  })
}

function aktion(id: string, vorlagenId: string): Record<string, unknown> {
  return { id, titel: id, vorlagenId, bildRef: null }
}

function video(id: string, bandVorlageId: string | null): Record<string, unknown> {
  return {
    id,
    art: 'video',
    ref: 'asset-1',
    dauer: null,
    trimStart: null,
    trimEnde: null,
    einblendung:
      bandVorlageId === null
        ? null
        : { bandVorlageId, abschnitte: [{ aktionRef: 'aktion-1', dauer: 5 }] },
  }
}

/** Meldet die angelegten Projekte in der uebergebenen Reihenfolge. */
function melde(...eintraege: ProjektMeta[]): void {
  zustand.projekte = { ok: true, wert: eintraege }
}

beforeEach(async () => {
  zustand.datenOrt = await fsp.mkdtemp(path.join(os.tmpdir(), 'ds-refpruefung-'))
  zustand.projekte = { ok: true, wert: [] }
  zustand.listeAufrufe = 0
  zustand.ordnerAufrufe = []
  zustand.leseAufrufe = []
})

afterEach(async () => {
  await fsp.rm(zustand.datenOrt, { recursive: true, force: true })
})

describe('pruefeVorlagenReferenzen', () => {
  it('findet eine Vorlage, die AUSSCHLIESSLICH als Band referenziert wird', async () => {
    await legeProjektAn(
      'p1',
      projekt('Studio Nord', {
        aktionen: [aktion('a1', 'vollbild')],
        liste: [video('l1', VORLAGE)],
      }),
    )
    melde(meta('p1'))

    const ergebnis = await pruefeVorlagenReferenzen(VORLAGE)

    expect(ergebnis).toEqual({
      ok: true,
      wert: {
        aktionen: [],
        listenelemente: [{ projektId: 'p1', projektName: 'Studio Nord', id: 'l1' }],
      },
    })
  })

  it('meldet einen Aktions-Treffer mit der Aktions-ID und laesst listenelemente leer', async () => {
    await legeProjektAn(
      'p1',
      projekt('Studio Nord', { aktionen: [aktion('a1', VORLAGE), aktion('a2', 'split')] }),
    )
    melde(meta('p1'))

    const ergebnis = await pruefeVorlagenReferenzen(VORLAGE)

    expect(ergebnis).toEqual({
      ok: true,
      wert: {
        aktionen: [{ projektId: 'p1', projektName: 'Studio Nord', id: 'a1' }],
        listenelemente: [],
      },
    })
  })

  it('liest ALLE gemeldeten Projekte und meldet die Treffer in Projekt- und Array-Reihenfolge', async () => {
    await legeProjektAn(
      'p1',
      projekt('Erstes', { aktionen: [aktion('a2', VORLAGE), aktion('a1', VORLAGE)] }),
    )
    await legeProjektAn('p2', projekt('Zweites'))
    await legeProjektAn(
      'p3',
      projekt('Drittes', { liste: [video('l9', VORLAGE), video('l8', 'split')] }),
    )
    melde(meta('p1'), meta('p2'), meta('p3'))
    const erwarteteDateien = ['p1', 'p2', 'p3'].map((id) =>
      path.join(pfade.projektOrdner(id), 'project.json'),
    )
    zustand.ordnerAufrufe = []

    const ergebnis = await pruefeVorlagenReferenzen(VORLAGE)

    expect(ergebnis).toEqual({
      ok: true,
      wert: {
        aktionen: [
          { projektId: 'p1', projektName: 'Erstes', id: 'a2' },
          { projektId: 'p1', projektName: 'Erstes', id: 'a1' },
        ],
        listenelemente: [{ projektId: 'p3', projektName: 'Drittes', id: 'l9' }],
      },
    })
    expect(zustand.ordnerAufrufe).toEqual(['p1', 'p2', 'p3'])
    expect(zustand.leseAufrufe).toEqual(erwarteteDateien)
  })

  it('ueberspringt ein als beschaedigt gemeldetes Projekt NICHT, sondern bricht ab', async () => {
    await legeProjektAn('p1', projekt('Heil', { aktionen: [aktion('a1', VORLAGE)] }))
    await legeProjektAn('p2', null)
    melde(meta('p1'), meta('p2', true))

    const ergebnis = await pruefeVorlagenReferenzen(VORLAGE)

    expect(ergebnis.ok).toBe(false)
    expect(ergebnis.ok === false && ergebnis.fehler.code).toBe('speicher_fehler')
    expect(ergebnis.ok === false && ergebnis.fehler.meldung).toContain('p2')
    expect(zustand.leseAufrufe).toContain(path.join(pfade.projektOrdner('p2'), 'project.json'))
  })

  it('liefert speicher_fehler statt eines Teilergebnisses, wenn eine project.json fehlt', async () => {
    await legeProjektAn('p1', null)
    await legeProjektAn('p2', projekt('Zweites', { aktionen: [aktion('a1', VORLAGE)] }))
    melde(meta('p1'), meta('p2'))

    const ergebnis = await pruefeVorlagenReferenzen(VORLAGE)

    expect(ergebnis.ok).toBe(false)
    expect(ergebnis.ok === false && ergebnis.fehler.code).toBe('speicher_fehler')
  })

  it('liefert speicher_fehler bei ungueltigem JSON und liest die Sicherungsdatei nicht', async () => {
    await legeProjektAn('p1', '{ das ist kein JSON')
    await fsp.writeFile(
      path.join(pfade.projektOrdner('p1'), 'project.json.bak'),
      projekt('Sicherung'),
      'utf8',
    )
    melde(meta('p1'))

    const ergebnis = await pruefeVorlagenReferenzen(VORLAGE)

    expect(ergebnis.ok === false && ergebnis.fehler.code).toBe('speicher_fehler')
    expect(zustand.leseAufrufe.some((pfad) => pfad.endsWith('.bak'))).toBe(false)
  })

  it('liefert speicher_fehler, wenn der Wurzelwert kein Objekt ist', async () => {
    await legeProjektAn('p1', '[]')
    melde(meta('p1'))

    const ergebnis = await pruefeVorlagenReferenzen(VORLAGE)

    expect(ergebnis.ok === false && ergebnis.fehler.code).toBe('speicher_fehler')
  })

  it('wertet fehlende Felder aktionen/liste als leer, ein Nicht-Array als speicher_fehler', async () => {
    await legeProjektAn(
      'p1',
      JSON.stringify({ id: 'p1', name: 'Ohne Felder', schemaVersion: 1, assets: [] }),
    )
    melde(meta('p1'))

    await expect(pruefeVorlagenReferenzen(VORLAGE)).resolves.toEqual({
      ok: true,
      wert: { aktionen: [], listenelemente: [] },
    })

    await legeProjektAn('p1', projekt('Kaputt', { liste: { keine: 'Liste' } }))
    const zweites = await pruefeVorlagenReferenzen(VORLAGE)
    expect(zweites.ok === false && zweites.fehler.code).toBe('speicher_fehler')
  })

  it('erzeugt keinen Treffer fuer einblendung: null, segment, ref und aktionRef', async () => {
    await legeProjektAn(
      'p1',
      projekt('Namensraeume', {
        liste: [
          video('l1', null),
          { id: 'l3', art: 'segment', ref: VORLAGE, dauer: 10, einblendung: null },
          {
            id: 'l4',
            art: 'video',
            ref: 'asset-1',
            einblendung: { bandVorlageId: 'split', abschnitte: [{ aktionRef: VORLAGE, dauer: 5 }] },
          },
          'kein Objekt',
        ],
        aktionen: [aktion('a1', 'vollbild'), 42],
      }),
    )
    melde(meta('p1'))

    await expect(pruefeVorlagenReferenzen(VORLAGE)).resolves.toEqual({
      ok: true,
      wert: { aktionen: [], listenelemente: [] },
    })
  })

  it('liefert fuer eine nirgends benutzte Vorlage zwei leere Listen', async () => {
    await legeProjektAn('p1', projekt('Erstes', { aktionen: [aktion('a1', 'vollbild')] }))
    melde(meta('p1'))

    await expect(pruefeVorlagenReferenzen('unbekannte-vorlage')).resolves.toEqual({
      ok: true,
      wert: { aktionen: [], listenelemente: [] },
    })
  })

  it('liefert ohne gemeldetes Projekt zwei leere Listen', async () => {
    melde()

    await expect(pruefeVorlagenReferenzen(VORLAGE)).resolves.toEqual({
      ok: true,
      wert: { aktionen: [], listenelemente: [] },
    })
    expect(zustand.leseAufrufe).toEqual([])
  })

  it('reicht den Fehlercode von listeProjekte unveraendert durch', async () => {
    zustand.projekte = {
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'Der Projektordner ist nicht lesbar.' },
    }

    const ergebnis = await pruefeVorlagenReferenzen(VORLAGE)

    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'Der Projektordner ist nicht lesbar.' },
    })
  })

  it.each([
    ['leerer String', ''],
    ['kein String', 42 as unknown as string],
  ])('weist %s mit ungueltige_eingabe ab, ohne etwas zu lesen', async (_fall, eingabe) => {
    melde(meta('p1'))

    const ergebnis = await pruefeVorlagenReferenzen(eingabe as string)

    expect(ergebnis.ok === false && ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(zustand.listeAufrufe).toBe(0)
    expect(zustand.leseAufrufe).toEqual([])
  })

  it('behandelt eine Vorlagen-ID ohne UUID-Form wie jede andere', async () => {
    await legeProjektAn('p1', projekt('Erstes', { aktionen: [aktion('a1', 'band-standard')] }))
    melde(meta('p1'))

    await expect(pruefeVorlagenReferenzen('band-standard')).resolves.toEqual({
      ok: true,
      wert: {
        aktionen: [{ projektId: 'p1', projektName: 'Erstes', id: 'a1' }],
        listenelemente: [],
      },
    })
  })

  it('meldet einen Treffer auch ohne brauchbare id und ohne Projektnamen', async () => {
    await legeProjektAn(
      'p1',
      JSON.stringify({ schemaVersion: 1, aktionen: [{ vorlagenId: VORLAGE }], liste: [] }),
    )
    melde(meta('p1'))

    await expect(pruefeVorlagenReferenzen(VORLAGE)).resolves.toEqual({
      ok: true,
      wert: {
        aktionen: [{ projektId: 'p1', projektName: '', id: '' }],
        listenelemente: [],
      },
    })
  })
})
