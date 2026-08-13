// Verhaltenstests zu #92 - die Anmeldung der beiden Medien-Auftragsarten beim Dispatcher.
//
// AUFBAU: Der Dispatcher (#60) ist ECHT, aber sein `registriereAuftragsHandler` liegt hinter
// einem durchreichenden Spion. Nur so lassen sich beide Aussagen in EINER Datei belegen: was
// genau angemeldet wurde (Spion) und dass ein Auftrag danach wirklich bei der Fachfunktion
// ankommt (echte Registry + echtes `fuehreAus`).
//
// Die beiden Fachfunktionen (#85/#87) sind Attrappen - sie wuerden sonst Platte und ffprobe
// anfassen. Fuer den Identitaetsvergleich aendert das nichts: Testdatei und Quelldatei bekommen
// dieselbe Attrappe, und ein umhuellendes Lambda in der Quelldatei liesse den Vergleich
// weiterhin scheitern. Genau darum geht es.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Auftrag } from '../../src/shared/contracts/auftrag'
import type {
  AusfuehrungsKontext,
  HandlerErgebnis,
  HandlerFuer,
} from '../../src/main/auftrags-manager/dispatcher'

const fach = vi.hoisted(() => ({
  importMedium: vi.fn(),
  löscheMedium: vi.fn(),
}))

vi.mock('../../src/main/media-service/import-medium', () => ({
  importMedium: fach.importMedium,
}))

vi.mock('../../src/main/media-service/loesche-medium', () => ({
  löscheMedium: fach.löscheMedium,
}))

const spion = vi.hoisted(() => ({ registriere: vi.fn() }))

vi.mock('../../src/main/auftrags-manager/dispatcher', async (importOriginal) => {
  const echt = await importOriginal<typeof import('../../src/main/auftrags-manager/dispatcher')>()
  // Der Spion REICHT DURCH: Die echte Registry wird wirklich gefuellt, sonst haette
  // `fuehreAus` weiter unten nichts nachzuschlagen.
  spion.registriere.mockImplementation((...argumente: unknown[]) => {
    ;(echt.registriereAuftragsHandler as unknown as (...a: unknown[]) => void)(...argumente)
  })
  return { ...echt, registriereAuftragsHandler: spion.registriere }
})

const { importMedium } = await import('../../src/main/media-service/import-medium')
const { löscheMedium } = await import('../../src/main/media-service/loesche-medium')
const { fuehreAus, kannAbbrechen } = await import('../../src/main/auftrags-manager/dispatcher')
const { registriereMedienHandler } = await import(
  '../../src/main/media-service/handler-registrierung'
)

// Der blosse Import darf nichts angemeldet haben - die Anmeldung ist kein Nebeneffekt des
// Ladens, sondern ein Aufruf aus #3 (Invariante des Issues).
const aufrufeVorAufruf = spion.registriere.mock.calls.length

registriereMedienHandler()

// Festgehalten, bevor irgendein beforeEach die Aufzeichnung leert: Diese Kopie beschreibt
// den EINEN Aufruf oben.
const aufrufe = spion.registriere.mock.calls.map((argumente) => [...argumente])
const arten = aufrufe.map((argumente) => argumente[0])

function baueImportAuftrag(): Extract<Auftrag, { art: 'import' }> {
  return {
    auftragId: 'a1',
    art: 'import',
    status: 'laeuft',
    label: 'Import',
    payload: { projektId: 'p1', quellPfad: 'C:\\medien\\clip.mp4' },
    fortschritt: null,
    versuche: 1,
    fehler: null,
    ergebnis: null,
    erstelltAm: '2026-08-13T10:00:00.000Z',
  }
}

function baueLoeschAuftrag(): Extract<Auftrag, { art: 'loeschen' }> {
  return {
    auftragId: 'a2',
    art: 'loeschen',
    status: 'laeuft',
    label: 'Löschen',
    payload: { projektId: 'p1', assetId: 'as1' },
    fortschritt: null,
    versuche: 1,
    fehler: null,
    ergebnis: null,
    erstelltAm: '2026-08-13T10:00:01.000Z',
  }
}

/** Ein Kontext, der jede Fortschrittsmeldung mitschreibt. */
function baueKontext(auftragId: string): AusfuehrungsKontext & { gemeldet: Array<number | null> } {
  const gemeldet: Array<number | null> = []
  return {
    auftragId,
    gemeldet,
    meldeFortschritt: (prozent) => {
      gemeldet.push(prozent)
    },
  }
}

beforeEach(() => {
  fach.importMedium.mockReset()
  fach.löscheMedium.mockReset()
})

describe('registriereMedienHandler (#92) - was angemeldet wird', () => {
  it('registriert beim blossen Import nichts', () => {
    expect(aufrufeVorAufruf).toBe(0)
  })

  it('meldet genau zwei Arten an, import und loeschen, in dieser Reihenfolge', () => {
    expect(arten).toEqual(['import', 'loeschen'])
  })

  it('meldet keine Art zweimal an', () => {
    expect(new Set(arten).size).toBe(arten.length)
  })

  it('uebergibt keinen dritten Parameter - beide Arten bleiben unabbrechbar (FA-18)', () => {
    for (const argumente of aufrufe) {
      expect(argumente).toHaveLength(2)
      expect(argumente[2]).toBeUndefined()
    }
    expect(kannAbbrechen('import')).toBe(false)
    expect(kannAbbrechen('loeschen')).toBe(false)
  })

  it('uebergibt fuer import die Funktion importMedium SELBST, kein Lambda', () => {
    expect(aufrufe[0]?.[1]).toBe(importMedium)
  })

  it('uebergibt fuer loeschen die Funktion löscheMedium SELBST, kein Lambda', () => {
    expect(aufrufe[1]?.[1]).toBe(löscheMedium)
  })
})

describe('registriereMedienHandler (#92) - die Naht zum Dispatcher', () => {
  it('bringt einen Import-Auftrag samt Kontext bis in importMedium', async () => {
    const auftrag = baueImportAuftrag()
    const kontext = baueKontext('a1')
    const antwort: HandlerErgebnis<string> = { status: 'erfolg', ergebnis: { assetId: 'as9' } }
    fach.importMedium.mockResolvedValue(antwort)

    const ergebnis = await fuehreAus(auftrag, kontext)

    expect(fach.importMedium).toHaveBeenCalledTimes(1)
    expect(fach.löscheMedium).not.toHaveBeenCalled()
    // Der Auftrag geht UNVERAENDERT hinein - dasselbe Objekt, nichts ergaenzt.
    expect(fach.importMedium.mock.calls[0]?.[0]).toBe(auftrag)
    expect(fach.importMedium.mock.calls[0]?.[1].auftragId).toBe('a1')
    // ... und das Ergebnis unveraendert heraus: kein Neuaufbau, dasselbe Objekt.
    expect(ergebnis).toBe(antwort)
  })

  it('laesst den Fortschritt aus importMedium beim Aufrufer ankommen', async () => {
    // Seit dem 13.08.2026 meldet #85 waehrend des Kopierens wirklich Fortschritt (0..95).
    // Ohne diese Registrierung haette diese Kette keinen Anfang.
    const kontext = baueKontext('a1')
    fach.importMedium.mockImplementation(
      async (_auftrag: unknown, k: AusfuehrungsKontext): Promise<HandlerErgebnis<string>> => {
        k.meldeFortschritt(0)
        k.meldeFortschritt(42)
        k.meldeFortschritt(95)
        return { status: 'erfolg', ergebnis: null }
      },
    )

    await fuehreAus(baueImportAuftrag(), kontext)

    expect(kontext.gemeldet).toEqual([0, 42, 95])
  })

  it('bringt einen Loesch-Auftrag bis in löscheMedium', async () => {
    const auftrag = baueLoeschAuftrag()
    fach.löscheMedium.mockResolvedValue({ status: 'erfolg', ergebnis: { assetId: 'as1' } })

    await fuehreAus(auftrag, baueKontext('a2'))

    expect(fach.löscheMedium).toHaveBeenCalledTimes(1)
    expect(fach.importMedium).not.toHaveBeenCalled()
    expect(fach.löscheMedium.mock.calls[0]?.[0]).toBe(auftrag)
  })

  it('reicht Fachcode und fehler.daten unveraendert zurueck (FA-19 haengt an daten)', async () => {
    const fehlschlag: HandlerErgebnis<string> = {
      status: 'fehlgeschlagen',
      fehler: {
        code: 'asset_referenziert',
        meldung: 'Noch in Benutzung',
        daten: { referenzenIds: ['le1', 'le2'] },
      },
    }
    fach.löscheMedium.mockResolvedValue(fehlschlag)

    const ergebnis = await fuehreAus(baueLoeschAuftrag(), baueKontext('a2'))

    expect(ergebnis).toBe(fehlschlag)
  })
})

describe('registriereMedienHandler (#92) - keine Uebersetzungsschicht', () => {
  const quelle = readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../src/main/media-service/handler-registrierung.ts',
    ),
    'utf8',
  )

  // Die DoD-Grep-Proben gelten dem CODE, nicht der Begruendung daneben: Die Kommentare
  // dieser Datei benennen die verbotenen Konstrukte ausdruecklich.
  const code = quelle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')

  it.each(['try', 'catch', 'async', 'await', '=>'])('enthaelt kein %s', (wort) => {
    expect(code).not.toContain(wort)
  })

  it('registriert weder render noch export', () => {
    expect(code).not.toContain("'render'")
    expect(code).not.toContain("'export'")
  })

  it('fasst weder Dateisystem noch IPC an', () => {
    for (const verboten of ['node:fs', 'child_process', 'ffprobe', 'kanaele', 'registriereHandler']) {
      expect(code).not.toContain(verboten)
    }
  })

  it('verdrahtet sich nicht selbst - kein Aufruf als Nebeneffekt des Ladens', () => {
    expect(code).not.toContain('whenReady')
    // Ein Selbstaufruf am Modulende stuende ganz links, ohne Einrueckung.
    expect(code).not.toMatch(/^registriereMedienHandler\(\)/m)
  })

  it('liefert void und wirft nicht', () => {
    expect(registriereMedienHandler()).toBeUndefined()
  })
})

// TYP-TEST (DoD): Beide Fachfunktionen passen OHNE Umbau auf HandlerFuer<A> - der Beleg,
// dass kein Adapter noetig ist. Die Aussage liegt allein auf Typebene und wird von
// `npm run typecheck:tests` geprueft; vi.mock aendert die Typen nicht.
const _handlerImport: HandlerFuer<'import'> = importMedium
const _handlerLoeschen: HandlerFuer<'loeschen'> = löscheMedium
void _handlerImport
void _handlerLoeschen
