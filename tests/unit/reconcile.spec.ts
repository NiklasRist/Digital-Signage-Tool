import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Asset } from '../../src/shared/contracts/asset'

// Verhaltenstest zu reconcile (#91).
//
// Alle drei Schritte sind Attrappen. Diese Datei hat keine eigene Fachlogik - geprueft wird
// deshalb genau das, was sie beitraegt: WER wird WOMIT und in WELCHER Reihenfolge gerufen, wer
// NICHT mehr, und kommen die vier Zahlen unveraendert aus den Schritten heraus.
//
// `verlauf` haelt Start UND Ende jedes Schrittes fest. Nur so faellt ein nicht abgewartetes
// `await` auf: Ohne es stuende '88:start' vor '90:ende'.
const zustand = vi.hoisted(() => ({
  verlauf: [] as string[],
  loeschungenAufrufe: [] as string[],
  waisenAufrufe: [] as Array<{ projektId: string; namen: string[] }>,
  fehlendeAufrufe: [] as Array<{ projektId: string; assets: unknown }>,
  loeschungen: { ok: true, wert: { erledigt: 0, offen: 0 } } as unknown,
  waisen: { ok: true, wert: { entfernt: 0 } } as unknown,
  fehlende: { ok: true, wert: { markiert: 0 } } as unknown,
  /** Wirft statt zu antworten - fuer den Zweig "unerwartete Ausnahme". */
  waisenWirft: false,
}))

vi.mock('../../src/main/media-service/reconcile-loeschungen', () => ({
  holeLoeschungenNach: async (projektId: string) => {
    zustand.verlauf.push('90:start')
    zustand.loeschungenAufrufe.push(projektId)
    // Verzoegert ueber mehrere Ereignisrunden hinweg - ein Aufrufer, der die Zusage nicht
    // abwartet, startet Schritt 2 in dieser Luecke.
    await new Promise((fertig) => setTimeout(fertig, 0))
    zustand.verlauf.push('90:ende')
    return zustand.loeschungen
  },
}))

vi.mock('../../src/main/media-service/reconcile-waisen', () => ({
  entferneWaisen: async (projektId: string, bekannteDateinamen: Set<string>) => {
    zustand.verlauf.push('88:start')
    zustand.waisenAufrufe.push({ projektId, namen: [...bekannteDateinamen] })
    if (zustand.waisenWirft) {
      throw new Error('Die Platte hat sich verabschiedet.')
    }
    await new Promise((fertig) => setTimeout(fertig, 0))
    zustand.verlauf.push('88:ende')
    return zustand.waisen
  },
}))

vi.mock('../../src/main/media-service/reconcile-fehlt', () => ({
  markiereFehlende: async (projektId: string, assets: unknown) => {
    zustand.verlauf.push('89:start')
    zustand.fehlendeAufrufe.push({ projektId, assets })
    await new Promise((fertig) => setTimeout(fertig, 0))
    zustand.verlauf.push('89:ende')
    return zustand.fehlende
  },
}))

const { reconcile } = await import('../../src/main/media-service/reconcile')

function asset(id: string, dateiname: string): Asset {
  return {
    id,
    typ: 'video',
    dateiname,
    originalname: `${id}.mp4`,
    maße: { breite: 1920, höhe: 1080 },
    dauer: 10,
    importdatum: '2026-08-13T10:00:00.000Z',
    zustand: 'ok',
  }
}

/**
 * Die Signatur verlangt `string` und `Asset[]`; die Fehlertabelle des Issues nennt aber genau die
 * Faelle, die der Typechecker schon ausschliesst. Der Main "validiert jede eingehende Nutzlast"
 * (TK 9.1.1) - geprueft wird das ueber diese Tuer.
 */
const ruf = reconcile as unknown as (
  projektId: unknown,
  assets: unknown,
) => ReturnType<typeof reconcile>

const ASSETS = [asset('a-1', 'aaa.mp4'), asset('a-2', 'bbb.png')]

beforeEach(() => {
  zustand.verlauf = []
  zustand.loeschungenAufrufe = []
  zustand.waisenAufrufe = []
  zustand.fehlendeAufrufe = []
  zustand.loeschungen = { ok: true, wert: { erledigt: 0, offen: 0 } }
  zustand.waisen = { ok: true, wert: { entfernt: 0 } }
  zustand.fehlende = { ok: true, wert: { markiert: 0 } }
  zustand.waisenWirft = false
})

describe('reconcile - Reihenfolge und Abwarten', () => {
  it('ruft #90, dann #88, dann #89 und wartet jeden Schritt ab', async () => {
    await reconcile('p-1', ASSETS)

    expect(zustand.verlauf).toEqual([
      '90:start',
      '90:ende',
      '88:start',
      '88:ende',
      '89:start',
      '89:ende',
    ])
  })

  it('reicht dieselbe projektId an alle drei Schritte weiter', async () => {
    await reconcile('p-1', ASSETS)

    expect(zustand.loeschungenAufrufe).toEqual(['p-1'])
    expect(zustand.waisenAufrufe[0]?.projektId).toBe('p-1')
    expect(zustand.fehlendeAufrufe[0]?.projektId).toBe('p-1')
  })
})

describe('reconcile - was die Schritte bekommen', () => {
  it('gibt #88 genau die dateiname-Werte der Liste, nicht mehr und nicht weniger', async () => {
    await reconcile('p-1', ASSETS)

    expect(zustand.waisenAufrufe[0]?.namen.sort()).toEqual(['aaa.mp4', 'bbb.png'])
  })

  it('gibt #89 dieselbe Liste, aus der die Menge fuer #88 entstand', async () => {
    await reconcile('p-1', ASSETS)

    expect(zustand.fehlendeAufrufe[0]?.assets).toBe(ASSETS)
  })

  it('laesst das uebergebene Array unveraendert - keine Sortierung, keine Mutation', async () => {
    const vorher = ASSETS.map((eintrag) => eintrag.dateiname)

    await reconcile('p-1', ASSETS)

    expect(ASSETS.map((eintrag) => eintrag.dateiname)).toEqual(vorher)
  })

  it('laesst bei leerer Liste alle drei Schritte laufen und uebergibt #88 eine leere Menge', async () => {
    const ergebnis = await reconcile('p-1', [])

    expect(zustand.waisenAufrufe[0]?.namen).toEqual([])
    expect(zustand.fehlendeAufrufe).toHaveLength(1)
    expect(ergebnis.ok).toBe(true)
  })
})

describe('reconcile - die vier Zahlen', () => {
  it('uebernimmt entfernt aus #88, markiert aus #89, erledigt und offen aus #90', async () => {
    zustand.loeschungen = { ok: true, wert: { erledigt: 3, offen: 7 } }
    zustand.waisen = { ok: true, wert: { entfernt: 11 } }
    zustand.fehlende = { ok: true, wert: { markiert: 5 } }

    const ergebnis = await reconcile('p-1', ASSETS)

    expect(ergebnis).toEqual({
      ok: true,
      wert: { entfernt: 11, markiert: 5, erledigt: 3, offen: 7 },
    })
  })

  it('rechnet offen nicht aus erledigt her - beide kommen roh aus #90', async () => {
    zustand.loeschungen = { ok: true, wert: { erledigt: 0, offen: 4 } }

    const ergebnis = await reconcile('p-1', ASSETS)

    expect(ergebnis.ok && ergebnis.wert.offen).toBe(4)
    expect(ergebnis.ok && ergebnis.wert.erledigt).toBe(0)
  })
})

describe('reconcile - der erste scheiternde Schritt beendet den Lauf', () => {
  it('bricht nach #90 ab und reicht Code und Meldung unveraendert durch', async () => {
    zustand.loeschungen = {
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'queue-retry.json unlesbar' },
    }

    const ergebnis = await reconcile('p-1', ASSETS)

    expect(zustand.waisenAufrufe).toHaveLength(0)
    expect(zustand.fehlendeAufrufe).toHaveLength(0)
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'queue-retry.json unlesbar' },
    })
  })

  it('bricht nach #88 ab, ohne #89 zu rufen', async () => {
    zustand.waisen = {
      ok: false,
      fehler: { code: 'datei_fehler', meldung: 'Medienordner nicht lesbar' },
    }

    const ergebnis = await reconcile('p-1', ASSETS)

    expect(zustand.fehlendeAufrufe).toHaveLength(0)
    expect(ergebnis.ok).toBe(false)
    expect(!ergebnis.ok && ergebnis.fehler.code).toBe('datei_fehler')
  })

  it('reicht den Fehler aus #89 unveraendert durch', async () => {
    zustand.fehlende = {
      ok: false,
      fehler: { code: 'kein_projekt', meldung: 'Es ist kein Projekt geoeffnet.' },
    }

    const ergebnis = await reconcile('p-1', ASSETS)

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe('kein_projekt')
  })

  it('reicht ein daten-Feld des Schritt-Fehlers mit heraus', async () => {
    const daten = { betroffen: ['el-1', 'el-2'] }
    zustand.fehlende = {
      ok: false,
      fehler: { code: 'nicht_gefunden', meldung: 'Asset unbekannt', daten },
    }

    const ergebnis = await reconcile('p-1', ASSETS)

    expect(!ergebnis.ok && ergebnis.fehler.daten).toBe(daten)
  })
})

describe('reconcile - ungueltige Eingaben starten keinen Schritt', () => {
  it.each([
    ['leere ID', ''],
    ['relativer Pfad', '../x'],
    ['Pfadtrenner', 'a/b'],
    ['Windows-Trenner', 'a\\b'],
  ])('weist %s ab', async (_name, projektId) => {
    const ergebnis = await ruf(projektId, ASSETS)

    expect(zustand.verlauf).toEqual([])
    expect(!ergebnis.ok && ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })

  it('weist ein assets ab, das kein Array ist', async () => {
    const ergebnis = await ruf('p-1', 'aaa.mp4')

    expect(zustand.verlauf).toEqual([])
    expect(!ergebnis.ok && ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })
})

describe('reconcile - unerwartete Ausnahme', () => {
  it('faengt einen werfenden Schritt und meldet unbekannter_fehler', async () => {
    zustand.waisenWirft = true

    const ergebnis = await reconcile('p-1', ASSETS)

    expect(!ergebnis.ok && ergebnis.fehler.code).toBe('unbekannter_fehler')
    expect(zustand.fehlendeAufrufe).toHaveLength(0)
  })
})
