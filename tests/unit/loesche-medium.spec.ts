import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { löscheMedium } from '../../src/main/media-service/loesche-medium'

import type { Asset } from '../../src/shared/contracts/asset'
import type { Auftrag } from '../../src/shared/contracts/auftrag'
import type { LöschRequest } from '../../src/shared/contracts/medien-request'
import type { AusfuehrungsKontext, HandlerErgebnis } from '../../src/main/auftrags-manager/dispatcher'
import type { LoeschFehlercode } from '../../src/main/media-service/fehlercodes'

// Alle vier Nachbarn sind Attrappen: kein echter project-store, keine echte Datei, keine echte
// queue-retry.json. Gemessen wird an den Spionen die REIHENFOLGE und was jeder zu sehen bekam -
// das ist die eigentliche Aussage von #87.
const zustand = vi.hoisted(() => ({
  /** Jeder fremde Aufruf, in Reihenfolge - der Zeuge fuer "D1 zuerst". */
  reihenfolge: [] as string[],
  entferneAssetArgumente: [] as Array<{ projektId: string; assetId: string }>,
  pfadArgumente: [] as Array<{ projektId: string; dateiname: string }>,
  entferneDateiArgumente: [] as string[],
  merkeArgumente: [] as Array<{ projektId: string; dateiname: string }>,
  entferneAssetAntwort: null as unknown,
  entferneAssetWirft: null as Error | null,
  pfadAntwort: null as unknown,
  entferneDateiAntwort: null as unknown,
  merkeAntwort: null as unknown,
}))

vi.mock('../../src/main/project-store/assets', () => ({
  entferneAsset: async (projektId: string, assetId: string) => {
    zustand.reihenfolge.push('entferneAsset')
    zustand.entferneAssetArgumente.push({ projektId, assetId })
    if (zustand.entferneAssetWirft !== null) {
      throw zustand.entferneAssetWirft
    }
    return zustand.entferneAssetAntwort
  },
}))

vi.mock('../../src/main/project-store/pfade', () => ({
  loeseAssetPfad: (projektId: string, dateiname: string) => {
    zustand.reihenfolge.push('loeseAssetPfad')
    zustand.pfadArgumente.push({ projektId, dateiname })
    return zustand.pfadAntwort
  },
}))

vi.mock('../../src/main/media-service/datei-entfernen', () => ({
  entferneDatei: async (pfad: string) => {
    zustand.reihenfolge.push('entferneDatei')
    zustand.entferneDateiArgumente.push(pfad)
    return zustand.entferneDateiAntwort
  },
}))

vi.mock('../../src/main/auftrags-manager/pending-deletions', () => ({
  merkePendingDeletion: async (projektId: string, dateiname: string) => {
    zustand.reihenfolge.push('merkePendingDeletion')
    zustand.merkeArgumente.push({ projektId, dateiname })
    return zustand.merkeAntwort
  },
}))

const PROJEKT = 'p-1'
const ASSET_ID = 'a-9'
const DATEINAME = 'a2f1b8c4-0000-4000-8000-000000000001.mp4'
const PFAD = path.join('C:', 'Daten', 'projects', PROJEKT, 'media', DATEINAME)

const ASSET: Asset = {
  id: ASSET_ID,
  typ: 'video',
  dateiname: DATEINAME,
  originalname: 'Werbung.mp4',
  maße: { breite: 1920, höhe: 1080 },
  dauer: 12.5,
  importdatum: '2026-08-01T09:00:00.000Z',
  zustand: 'ok',
}

const fortschritte: Array<number | null> = []
const kontext: AusfuehrungsKontext = {
  auftragId: 'auftrag-1',
  meldeFortschritt: (prozent) => {
    fortschritte.push(prozent)
  },
}

function auftragMit(payload: LöschRequest): Extract<Auftrag, { art: 'loeschen' }> {
  return {
    auftragId: 'auftrag-1',
    art: 'loeschen',
    status: 'laeuft',
    label: 'Medium löschen',
    payload,
    fortschritt: null,
    versuche: 1,
    fehler: null,
    ergebnis: null,
    erstelltAm: '2026-08-13T10:00:00.000Z',
  }
}

const auftrag = auftragMit({ projektId: PROJEKT, assetId: ASSET_ID })

beforeEach(() => {
  zustand.reihenfolge.length = 0
  zustand.entferneAssetArgumente.length = 0
  zustand.pfadArgumente.length = 0
  zustand.entferneDateiArgumente.length = 0
  zustand.merkeArgumente.length = 0
  zustand.entferneAssetWirft = null
  zustand.entferneAssetAntwort = { ok: true, wert: ASSET }
  zustand.pfadAntwort = { ok: true, wert: PFAD }
  zustand.entferneDateiAntwort = { ok: true, wert: undefined }
  zustand.merkeAntwort = { ok: true, wert: undefined }
  fortschritte.length = 0
})

describe('löscheMedium – Erfolgslauf', () => {
  it('entfernt erst den D1-Eintrag, loest dann den Pfad auf und loescht zuletzt die Datei', async () => {
    await löscheMedium(auftrag, kontext)

    expect(zustand.reihenfolge).toEqual(['entferneAsset', 'loeseAssetPfad', 'entferneDatei'])
  })

  it('arbeitet mit dem dateiname des von entferneAsset zurueckgegebenen Assets', async () => {
    await löscheMedium(auftrag, kontext)

    expect(zustand.entferneAssetArgumente).toEqual([{ projektId: PROJEKT, assetId: ASSET_ID }])
    expect(zustand.pfadArgumente).toEqual([{ projektId: PROJEKT, dateiname: DATEINAME }])
    expect(zustand.entferneDateiArgumente).toEqual([PFAD])
  })

  it('liefert { assetId } aus der Nutzlast als Auftrags-Ergebnis', async () => {
    const ergebnis: HandlerErgebnis<LoeschFehlercode> = await löscheMedium(auftrag, kontext)

    expect(ergebnis).toEqual({ status: 'erfolg', ergebnis: { assetId: ASSET_ID } })
  })

  it('merkt nichts vor, wenn die Datei weg ist', async () => {
    await löscheMedium(auftrag, kontext)

    expect(zustand.merkeArgumente).toHaveLength(0)
  })

  it('meldet keinen Fortschritt', async () => {
    await löscheMedium(auftrag, kontext)

    expect(fortschritte).toHaveLength(0)
  })
})

describe('löscheMedium – Schritt 1 scheitert, die Datei bleibt unangetastet', () => {
  it('bricht bei asset_referenziert ohne jeden Dateizugriff ab', async () => {
    zustand.entferneAssetAntwort = {
      ok: false,
      fehler: {
        code: 'asset_referenziert',
        meldung: 'Das Medium wird noch von 2 Element(en) der Wiedergabeliste verwendet.',
        daten: { referenzenIds: ['e1', 'e2'] },
      },
    }

    const ergebnis = await löscheMedium(auftrag, kontext)

    expect(zustand.reihenfolge).toEqual(['entferneAsset'])
    expect(ergebnis.status).toBe('fehlgeschlagen')
    if (ergebnis.status !== 'fehlgeschlagen') return
    expect(ergebnis.fehler.code).toBe('asset_referenziert')
  })

  it('reicht die referenzenIds unveraendert in fehler.daten weiter, ohne sie in die Meldung zu schreiben', async () => {
    zustand.entferneAssetAntwort = {
      ok: false,
      fehler: {
        code: 'asset_referenziert',
        meldung: 'Das Medium wird noch von 2 Element(en) der Wiedergabeliste verwendet.',
        daten: { referenzenIds: ['e1', 'e2'] },
      },
    }

    const ergebnis = await löscheMedium(auftrag, kontext)

    if (ergebnis.status !== 'fehlgeschlagen') throw new Error('erwartet: fehlgeschlagen')
    expect(ergebnis.fehler.daten).toEqual({ referenzenIds: ['e1', 'e2'] })
    expect(ergebnis.fehler.meldung).not.toContain('e1')
    expect(ergebnis.fehler.meldung).not.toContain('e2')
  })

  it('loest bei asset_nicht_gefunden keinen Dateizugriff aus', async () => {
    zustand.entferneAssetAntwort = {
      ok: false,
      fehler: { code: 'asset_nicht_gefunden', meldung: 'Zu dieser Medien-ID steht kein Eintrag.' },
    }

    const ergebnis = await löscheMedium(auftrag, kontext)

    expect(zustand.reihenfolge).toEqual(['entferneAsset'])
    if (ergebnis.status !== 'fehlgeschlagen') throw new Error('erwartet: fehlgeschlagen')
    expect(ergebnis.fehler.code).toBe('asset_nicht_gefunden')
  })

  it('reicht speicher_fehler unveraendert durch und laesst die Datei liegen', async () => {
    zustand.entferneAssetAntwort = {
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'Die Platte ist voll.' },
    }

    const ergebnis = await löscheMedium(auftrag, kontext)

    expect(zustand.reihenfolge).toEqual(['entferneAsset'])
    if (ergebnis.status !== 'fehlgeschlagen') throw new Error('erwartet: fehlgeschlagen')
    expect(ergebnis.fehler.code).toBe('speicher_fehler')
  })

  // Dieser Test hielt bis zum 13.08.2026 einen VERLUST fest: `entferneAsset` (#73) liefert
  // `kein_projekt`, `LoeschFehlercode` (#79) kannte den Code nicht, also fiel er auf
  // `unbekannter_fehler`. Behoben in #79 - umgedreht statt geloescht, weil er die Zusage
  // bewacht, von der der gefuehrte Reparatur-Modus (FA-19) lebt: Der Aufrufer muss auf dem
  // CODE verzweigen koennen, nicht auf dem Meldungstext. Der Fall ist nicht theoretisch - der
  // Auftrag wird beim Einreihen eingefroren (TK 9.3.5) und kann laufen, nachdem der Nutzer das
  // Projekt gewechselt hat.
  it('reicht kein_projekt unveraendert durch', async () => {
    zustand.entferneAssetAntwort = {
      ok: false,
      fehler: { code: 'kein_projekt', meldung: 'Es ist kein Projekt geoeffnet.' },
    }

    const ergebnis = await löscheMedium(auftrag, kontext)

    expect(zustand.reihenfolge).toEqual(['entferneAsset'])
    if (ergebnis.status !== 'fehlgeschlagen') throw new Error('erwartet: fehlgeschlagen')
    expect(ergebnis.fehler.code).toBe('kein_projekt')
    expect(ergebnis.fehler.meldung).toBe('Es ist kein Projekt geoeffnet.')
  })
})

describe('löscheMedium – Schritt 2 und 3 scheitern, der Eintrag ist bereits weg', () => {
  it('meldet ungueltige_eingabe und merkt NICHTS vor, wenn der Pfad nicht aufloesbar ist', async () => {
    zustand.pfadAntwort = {
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: 'Kein reiner Dateiname.' },
    }

    const ergebnis = await löscheMedium(auftrag, kontext)

    expect(zustand.reihenfolge).toEqual(['entferneAsset', 'loeseAssetPfad'])
    expect(zustand.merkeArgumente).toHaveLength(0)
    if (ergebnis.status !== 'fehlgeschlagen') throw new Error('erwartet: fehlgeschlagen')
    expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })

  it('merkt bei datei_fehler genau einmal den DATEINAMEN vor und bleibt trotzdem fehlgeschlagen', async () => {
    zustand.entferneDateiAntwort = {
      ok: false,
      fehler: { code: 'datei_fehler', meldung: 'Die Datei war auch nach 5 Versuchen noch belegt.' },
    }

    const ergebnis = await löscheMedium(auftrag, kontext)

    expect(zustand.merkeArgumente).toEqual([{ projektId: PROJEKT, dateiname: DATEINAME }])
    expect(zustand.merkeArgumente[0]?.dateiname).not.toBe(PFAD)
    if (ergebnis.status !== 'fehlgeschlagen') throw new Error('erwartet: fehlgeschlagen')
    expect(ergebnis.fehler.code).toBe('datei_fehler')
    expect(ergebnis.fehler.meldung).toContain('belegt')
    expect(ergebnis.fehler.meldung).toContain('naechsten Oeffnen')
  })

  it('bleibt bei datei_fehler, auch wenn das Vormerken selbst scheitert', async () => {
    zustand.entferneDateiAntwort = {
      ok: false,
      fehler: { code: 'datei_fehler', meldung: 'Datei belegt.' },
    }
    zustand.merkeAntwort = {
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'queue-retry.json nicht schreibbar.' },
    }

    const ergebnis = await löscheMedium(auftrag, kontext)

    if (ergebnis.status !== 'fehlgeschlagen') throw new Error('erwartet: fehlgeschlagen')
    expect(ergebnis.fehler.code).toBe('datei_fehler')
    expect(ergebnis.fehler.meldung).toContain('nicht vorgemerkt werden')
  })

  it('merkt NICHTS vor, wenn entferneDatei ungueltige_eingabe meldet', async () => {
    zustand.entferneDateiAntwort = {
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: 'Es wurde kein Pfad uebergeben.' },
    }

    const ergebnis = await löscheMedium(auftrag, kontext)

    expect(zustand.merkeArgumente).toHaveLength(0)
    if (ergebnis.status !== 'fehlgeschlagen') throw new Error('erwartet: fehlgeschlagen')
    expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })
})

describe('löscheMedium – Nutzlast und Ausnahmen', () => {
  it.each([
    ['leere assetId', { projektId: PROJEKT, assetId: '' }],
    ['leere projektId', { projektId: '   ', assetId: ASSET_ID }],
  ])('weist %s ohne jede Wirkung ab', async (_fall, payload: LöschRequest) => {
    const ergebnis = await löscheMedium(auftragMit(payload), kontext)

    expect(zustand.reihenfolge).toHaveLength(0)
    if (ergebnis.status !== 'fehlgeschlagen') throw new Error('erwartet: fehlgeschlagen')
    expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })

  it('faengt eine geworfene Ausnahme als unbekannter_fehler, ohne Stacktrace in der Meldung', async () => {
    zustand.entferneAssetWirft = new Error('Lock kaputt')

    const ergebnis = await löscheMedium(auftrag, kontext)

    if (ergebnis.status !== 'fehlgeschlagen') throw new Error('erwartet: fehlgeschlagen')
    expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
    expect(ergebnis.fehler.meldung).toContain('Lock kaputt')
    expect(ergebnis.fehler.meldung).not.toContain('loesche-medium.ts')
    expect(ergebnis.fehler.meldung).not.toContain('    at ')
  })

  it('liefert nie den Status abgebrochen', async () => {
    zustand.entferneDateiAntwort = {
      ok: false,
      fehler: { code: 'datei_fehler', meldung: 'Datei belegt.' },
    }
    const ergebnisse = [
      await löscheMedium(auftrag, kontext),
      await löscheMedium(auftragMit({ projektId: '', assetId: '' }), kontext),
    ]

    expect(ergebnisse.map((e) => e.status)).toEqual(['fehlgeschlagen', 'fehlgeschlagen'])
  })
})

describe('löscheMedium – was die Datei nicht anfasst', () => {
  const quelle = readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../src/main/media-service/loesche-medium.ts',
    ),
    'utf8',
  )

  it.each(['node:fs', 'node:path', 'electron', 'child_process'])(
    'importiert %s nicht',
    (modul) => {
      expect(quelle).not.toMatch(new RegExp(`from ['"]${modul}`))
      expect(quelle).not.toMatch(new RegExp(`require\\(['"]${modul}`))
    },
  )

  it.each(['media', 'projects', 'project.json'])('enthaelt kein Literal %s', (wort) => {
    expect(quelle).not.toMatch(new RegExp(`['"\`]${wort.replace('.', '\\.')}['"\`]`))
  })

  it('fordert kein Lock an', () => {
    expect(quelle).not.toContain('mitD1Lock')
    expect(quelle).not.toContain('sofortFlush')
    expect(quelle).not.toContain('planeAutoSpeicherung')
  })
})

describe('löscheMedium – Fehlercode-Typ', () => {
  it('laesst die fachlichen und die generischen Codes zu, fremde nicht', () => {
    const zulaessig: Array<HandlerErgebnis<LoeschFehlercode>> = [
      { status: 'fehlgeschlagen', fehler: { code: 'asset_referenziert', meldung: '' } },
      { status: 'fehlgeschlagen', fehler: { code: 'speicher_fehler', meldung: '' } },
      { status: 'fehlgeschlagen', fehler: { code: 'unbekannter_fehler', meldung: '' } },
    ]
    const unzulaessig: HandlerErgebnis<LoeschFehlercode> = {
      status: 'fehlgeschlagen',
      // @ts-expect-error 'probe_fehler' gehoert zu ImportFehlercode, nicht zu LoeschFehlercode
      fehler: { code: 'probe_fehler', meldung: '' },
    }

    expect(zulaessig).toHaveLength(3)
    expect(unzulaessig.status).toBe('fehlgeschlagen')
  })
})
