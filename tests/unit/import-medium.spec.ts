import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { importMedium } from '../../src/main/media-service/import-medium'

import type { Auftrag } from '../../src/shared/contracts/auftrag'
import type { ImportRequest } from '../../src/shared/contracts/medien-request'
import type { AusfuehrungsKontext, HandlerErgebnis } from '../../src/main/auftrags-manager/dispatcher'
import type { ImportFehlercode } from '../../src/main/media-service/fehlercodes'

// Alle sieben Nachbarn sind Attrappen: kein echtes ffprobe, kein echter project-store, keine echte
// Kopie. Gemessen wird an den Spionen die REIHENFOLGE, was jeder zu sehen bekam und was NACH einem
// Fehlschlag noch geschieht - das ist die eigentliche Aussage von #85.
const zustand = vi.hoisted(() => ({
  reihenfolge: [] as string[],
  formatArgumente: [] as string[],
  ordnerArgumente: [] as string[],
  pfadArgumente: [] as Array<{ projektId: string; dateiname: string }>,
  kopierArgumente: [] as Array<{ quellPfad: string; zielOrdner: string; dateiname: string }>,
  probeArgumente: [] as string[],
  auswertArgumente: [] as Array<{ roh: unknown; typ: string }>,
  endgueltigArgumente: [] as Array<{ partPfad: string; endPfad: string }>,
  hinzuArgumente: [] as Array<{ projektId: string; asset: unknown }>,
  entferneDateiArgumente: [] as string[],
  /** Kopier-Anteile, die die Attrappe von #84 melden soll (0..1). */
  anteile: [] as number[],
  ids: [] as string[],
  formatAntwort: null as unknown,
  kopierAntwort: null as unknown,
  probeAntwort: null as unknown,
  auswertAntwort: null as unknown,
  endgueltigAntwort: null as unknown,
  hinzuAntwort: null as unknown,
  entferneDateiAntwort: null as unknown,
  pfadAntwort: null as unknown,
  wirftIn: null as string | null,
}))

function vielleichtWerfen(stelle: string): void {
  if (zustand.wirftIn === stelle) {
    throw new Error(`Absturz in ${stelle}`)
  }
}

vi.mock('../../src/shared/contracts/id', () => ({
  erzeugeId: () => {
    zustand.reihenfolge.push('erzeugeId')
    const naechste = zustand.ids.shift()
    return naechste ?? 'KEINE-ID-MEHR'
  },
}))

vi.mock('../../src/main/media-service/format-pruefung', () => ({
  pruefeFormat: (dateiname: string) => {
    zustand.reihenfolge.push('pruefeFormat')
    zustand.formatArgumente.push(dateiname)
    return zustand.formatAntwort
  },
}))

vi.mock('../../src/main/project-store/pfade', () => ({
  medienOrdner: (projektId: string) => {
    zustand.reihenfolge.push('medienOrdner')
    zustand.ordnerArgumente.push(projektId)
    return ORDNER
  },
  loeseAssetPfad: (projektId: string, dateiname: string) => {
    zustand.reihenfolge.push('loeseAssetPfad')
    zustand.pfadArgumente.push({ projektId, dateiname })
    return zustand.pfadAntwort ?? { ok: true, wert: path.join(ORDNER, dateiname) }
  },
}))

vi.mock('../../src/main/media-service/import-datei', () => ({
  kopiereInsStaging: async (
    quellPfad: string,
    zielOrdner: string,
    dateiname: string,
    meldeFortschritt?: (anteil: number) => void,
  ) => {
    zustand.reihenfolge.push('kopiereInsStaging')
    zustand.kopierArgumente.push({ quellPfad, zielOrdner, dateiname })
    for (const anteil of zustand.anteile) {
      meldeFortschritt?.(anteil)
    }
    vielleichtWerfen('kopiereInsStaging')
    return zustand.kopierAntwort ?? { ok: true, wert: { partPfad: partPfadZu(dateiname) } }
  },
  macheEndgueltig: async (partPfad: string, endPfad: string) => {
    zustand.reihenfolge.push('macheEndgueltig')
    zustand.endgueltigArgumente.push({ partPfad, endPfad })
    vielleichtWerfen('macheEndgueltig')
    return zustand.endgueltigAntwort
  },
}))

vi.mock('../../src/main/media-service/ffprobe', () => ({
  leseRohMetadaten: async (dateiPfad: string) => {
    zustand.reihenfolge.push('leseRohMetadaten')
    zustand.probeArgumente.push(dateiPfad)
    vielleichtWerfen('leseRohMetadaten')
    return zustand.probeAntwort
  },
}))

vi.mock('../../src/main/media-service/metadaten', () => ({
  werteMetadatenAus: (roh: unknown, typ: string) => {
    zustand.reihenfolge.push('werteMetadatenAus')
    zustand.auswertArgumente.push({ roh, typ })
    return zustand.auswertAntwort
  },
}))

vi.mock('../../src/main/project-store/assets', () => ({
  fuegeAssetHinzu: async (projektId: string, asset: unknown) => {
    zustand.reihenfolge.push('fuegeAssetHinzu')
    zustand.hinzuArgumente.push({ projektId, asset })
    vielleichtWerfen('fuegeAssetHinzu')
    return zustand.hinzuAntwort ?? { ok: true, wert: asset }
  },
}))

vi.mock('../../src/main/media-service/datei-entfernen', () => ({
  entferneDatei: async (pfad: string) => {
    zustand.reihenfolge.push('entferneDatei')
    zustand.entferneDateiArgumente.push(pfad)
    return zustand.entferneDateiAntwort
  },
}))

const PROJEKT = 'p-1'
const ORDNER = path.join('C:', 'Daten', 'p-1', 'm')
const QUELLE = path.join('C:', 'Filme', 'Urlaub.mp4')
const UUID = 'a2f1b8c4-0000-4000-8000-000000000001'
const ROH = { streams: [{ codec_type: 'video', width: 1920, height: 1080 }] }

function partPfadZu(dateiname: string): string {
  return path.join(ORDNER, '.staging', `${dateiname}.part`)
}

const fortschritte: Array<number | null> = []
const kontext: AusfuehrungsKontext = {
  auftragId: 'auftrag-1',
  meldeFortschritt: (prozent) => {
    fortschritte.push(prozent)
  },
}

function auftragMit(payload: ImportRequest): Extract<Auftrag, { art: 'import' }> {
  return {
    auftragId: 'auftrag-1',
    art: 'import',
    status: 'laeuft',
    label: 'Medium importieren',
    payload,
    fortschritt: null,
    versuche: 1,
    fehler: null,
    ergebnis: null,
    erstelltAm: '2026-08-13T10:00:00.000Z',
  }
}

const auftrag = auftragMit({ projektId: PROJEKT, quellPfad: QUELLE })

function fehlerVon(ergebnis: HandlerErgebnis<ImportFehlercode>): {
  code: string
  meldung: string
  daten?: unknown
} {
  if (ergebnis.status !== 'fehlgeschlagen') throw new Error('erwartet: fehlgeschlagen')
  return ergebnis.fehler
}

beforeEach(() => {
  zustand.reihenfolge.length = 0
  zustand.formatArgumente.length = 0
  zustand.ordnerArgumente.length = 0
  zustand.pfadArgumente.length = 0
  zustand.kopierArgumente.length = 0
  zustand.probeArgumente.length = 0
  zustand.auswertArgumente.length = 0
  zustand.endgueltigArgumente.length = 0
  zustand.hinzuArgumente.length = 0
  zustand.entferneDateiArgumente.length = 0
  zustand.anteile.length = 0
  zustand.ids = [UUID]
  zustand.formatAntwort = { ok: true, wert: { typ: 'video', endung: 'mp4' } }
  zustand.pfadAntwort = null
  zustand.kopierAntwort = null
  zustand.probeAntwort = { ok: true, wert: ROH }
  zustand.auswertAntwort = { ok: true, wert: { maße: { breite: 1920, höhe: 1080 }, dauer: 12.345 } }
  zustand.endgueltigAntwort = { ok: true, wert: undefined }
  zustand.hinzuAntwort = null
  zustand.entferneDateiAntwort = { ok: true, wert: undefined }
  zustand.wirftIn = null
  fortschritte.length = 0
})

describe('importMedium – Erfolgslauf', () => {
  it('ruft die Bausteine in der verbindlichen Reihenfolge', async () => {
    await importMedium(auftrag, kontext)

    expect(zustand.reihenfolge).toEqual([
      'pruefeFormat',
      'erzeugeId',
      'medienOrdner',
      'loeseAssetPfad',
      'kopiereInsStaging',
      'leseRohMetadaten',
      'werteMetadatenAus',
      'macheEndgueltig',
      'fuegeAssetHinzu',
    ])
  })

  it('erzeugt genau eine UUID und benutzt sie fuer id und dateiname', async () => {
    const ergebnis = await importMedium(auftrag, kontext)

    expect(zustand.reihenfolge.filter((s) => s === 'erzeugeId')).toHaveLength(1)
    if (ergebnis.status !== 'erfolg') throw new Error('erwartet: erfolg')
    expect(ergebnis.ergebnis).toMatchObject({ id: UUID, dateiname: `${UUID}.mp4` })
  })

  it('uebergibt pruefeFormat den ganzen quellPfad, ohne eigenes basename', async () => {
    await importMedium(auftrag, kontext)

    expect(zustand.formatArgumente).toEqual([QUELLE])
  })

  it('probt die .part-Datei, nicht die Quelle und nicht den endgueltigen Pfad', async () => {
    await importMedium(auftrag, kontext)

    const part = partPfadZu(`${UUID}.mp4`)
    expect(zustand.probeArgumente).toEqual([part])
    expect(zustand.endgueltigArgumente).toEqual([
      { partPfad: part, endPfad: path.join(ORDNER, `${UUID}.mp4`) },
    ])
  })

  it('reicht die Rohausgabe unveraendert mit dem Typ aus pruefeFormat weiter', async () => {
    await importMedium(auftrag, kontext)

    expect(zustand.auswertArgumente).toEqual([{ roh: ROH, typ: 'video' }])
    expect(zustand.auswertArgumente[0]?.roh).toBe(ROH)
  })

  it('liefert genau das an fuegeAssetHinzu uebergebene Objekt als Auftrags-Ergebnis', async () => {
    const ergebnis = await importMedium(auftrag, kontext)

    if (ergebnis.status !== 'erfolg') throw new Error('erwartet: erfolg')
    expect(ergebnis.ergebnis).toBe(zustand.hinzuArgumente[0]?.asset)
    expect(ergebnis.ergebnis).toEqual({
      id: UUID,
      typ: 'video',
      dateiname: `${UUID}.mp4`,
      originalname: 'Urlaub.mp4',
      maße: { breite: 1920, höhe: 1080 },
      dauer: 12.345,
      importdatum: expect.any(String),
      zustand: 'ok',
    })
  })

  it('setzt zustand ok und ein gueltiges ISO-Datum', async () => {
    const vorher = Date.now()
    const ergebnis = await importMedium(auftrag, kontext)

    if (ergebnis.status !== 'erfolg') throw new Error('erwartet: erfolg')
    const asset = ergebnis.ergebnis as { importdatum: string; zustand: string }
    expect(asset.zustand).toBe('ok')
    expect(asset.importdatum).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(Date.parse(asset.importdatum)).toBeGreaterThanOrEqual(vorher)
  })

  it('schreibt bei einem Bild dauer null', async () => {
    zustand.formatAntwort = { ok: true, wert: { typ: 'bild', endung: 'png' } }
    zustand.auswertAntwort = { ok: true, wert: { maße: { breite: 800, höhe: 600 }, dauer: null } }

    const ergebnis = await importMedium(auftrag, kontext)

    if (ergebnis.status !== 'erfolg') throw new Error('erwartet: erfolg')
    expect(ergebnis.ergebnis).toMatchObject({ typ: 'bild', dauer: null, dateiname: `${UUID}.png` })
  })

  it('raeumt im Erfolgsfall nichts weg', async () => {
    await importMedium(auftrag, kontext)

    expect(zustand.entferneDateiArgumente).toHaveLength(0)
  })
})

describe('importMedium – Dateiname und Originalname', () => {
  it('erzeugt aus URLAUB.MP4 den kleingeschriebenen Namen <uuid>.mp4', async () => {
    const grossgeschrieben = path.join('C:', 'Filme', 'URLAUB.MP4')

    const ergebnis = await importMedium(
      auftragMit({ projektId: PROJEKT, quellPfad: grossgeschrieben }),
      kontext,
    )

    if (ergebnis.status !== 'erfolg') throw new Error('erwartet: erfolg')
    expect(ergebnis.ergebnis).toMatchObject({ dateiname: `${UUID}.mp4`, originalname: 'URLAUB.MP4' })
  })

  it('laesst einen Quellnamen mit .. weder in dateiname noch in den Kopier-Namen', async () => {
    const ergebnis = await importMedium(
      auftragMit({ projektId: PROJEKT, quellPfad: path.join('C:', 'x', '..', 'böse.mp4') }),
      kontext,
    )

    if (ergebnis.status !== 'erfolg') throw new Error('erwartet: erfolg')
    expect(ergebnis.ergebnis).toMatchObject({ dateiname: `${UUID}.mp4`, originalname: 'böse.mp4' })
    expect(zustand.kopierArgumente).toEqual([
      { quellPfad: path.join('C:', 'x', '..', 'böse.mp4'), zielOrdner: ORDNER, dateiname: `${UUID}.mp4` },
    ])
    expect(zustand.pfadArgumente).toEqual([{ projektId: PROJEKT, dateiname: `${UUID}.mp4` }])
  })
})

describe('importMedium – Fortschritt', () => {
  it('reicht den Kopier-Anteil als Gesamtfortschritt in Prozent weiter', async () => {
    zustand.anteile.push(0, 0.5, 1)

    await importMedium(auftrag, kontext)

    expect(fortschritte).toEqual([0, 48, 95])
  })

  it('behauptet waehrend der Kopie nie 100 Prozent', async () => {
    zustand.anteile.push(0.9, 0.99, 1)

    await importMedium(auftrag, kontext)

    expect(Math.max(...fortschritte.map((p) => p ?? 0))).toBeLessThan(100)
  })

  it('meldet ohne Kopier-Anteil gar nichts', async () => {
    await importMedium(auftrag, kontext)

    expect(fortschritte).toHaveLength(0)
  })

  it('macht aus einem unbrauchbaren Anteil null statt NaN', async () => {
    zustand.anteile.push(Number.NaN)

    await importMedium(auftrag, kontext)

    expect(fortschritte).toEqual([null])
  })
})

describe('importMedium – Fehlerpfade vor der Kopie, ohne jede Wirkung', () => {
  it.each([
    ['leere projektId', { projektId: '  ', quellPfad: QUELLE }],
    ['leeren quellPfad', { projektId: PROJEKT, quellPfad: '' }],
  ])('weist %s mit ungueltige_eingabe ab', async (_fall, payload: ImportRequest) => {
    const ergebnis = await importMedium(auftragMit(payload), kontext)

    expect(zustand.reihenfolge).toHaveLength(0)
    expect(fehlerVon(ergebnis).code).toBe('ungueltige_eingabe')
  })

  it('meldet format_nicht_unterstuetzt, ohne etwas anzulegen', async () => {
    zustand.formatAntwort = {
      ok: false,
      fehler: { code: 'format_nicht_unterstuetzt', meldung: 'Importierbar sind nur: mp4, jpg.' },
    }

    const ergebnis = await importMedium(auftrag, kontext)

    expect(zustand.reihenfolge).toEqual(['pruefeFormat'])
    expect(fehlerVon(ergebnis).code).toBe('format_nicht_unterstuetzt')
    expect(fehlerVon(ergebnis).meldung).toContain('mp4')
  })

  it('meldet ungueltige_eingabe, wenn loeseAssetPfad ablehnt, und kopiert nicht', async () => {
    zustand.pfadAntwort = {
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: 'Die Projekt-ID ist kein Pfadsegment.' },
    }

    const ergebnis = await importMedium(auftrag, kontext)

    expect(zustand.reihenfolge).toEqual(['pruefeFormat', 'erzeugeId', 'medienOrdner', 'loeseAssetPfad'])
    expect(fehlerVon(ergebnis).code).toBe('ungueltige_eingabe')
  })

  it.each(['datei_nicht_gefunden', 'kopier_fehler'])(
    'reicht %s aus der Kopie durch und raeumt NICHTS weg',
    async (code) => {
      zustand.kopierAntwort = { ok: false, fehler: { code, meldung: 'Quelle weg.' } }

      const ergebnis = await importMedium(auftrag, kontext)

      expect(zustand.entferneDateiArgumente).toHaveLength(0)
      expect(zustand.reihenfolge).not.toContain('leseRohMetadaten')
      expect(fehlerVon(ergebnis).code).toBe(code)
    },
  )
})

describe('importMedium – Fehlschlag nach der Kopie: die .part-Datei wird weggeraeumt', () => {
  const part = partPfadZu(`${UUID}.mp4`)

  it('entfernt die .part-Datei, wenn ffprobe scheitert, und benennt nicht um', async () => {
    zustand.probeAntwort = { ok: false, fehler: { code: 'probe_fehler', meldung: 'Timeout.' } }

    const ergebnis = await importMedium(auftrag, kontext)

    expect(zustand.entferneDateiArgumente).toEqual([part])
    expect(zustand.reihenfolge).not.toContain('macheEndgueltig')
    expect(zustand.reihenfolge).not.toContain('fuegeAssetHinzu')
    expect(fehlerVon(ergebnis).code).toBe('probe_fehler')
  })

  it('entfernt die .part-Datei, wenn die Metadaten unbrauchbar sind', async () => {
    zustand.auswertAntwort = { ok: false, fehler: { code: 'probe_fehler', meldung: 'Keine Masse.' } }

    const ergebnis = await importMedium(auftrag, kontext)

    expect(zustand.entferneDateiArgumente).toEqual([part])
    expect(zustand.reihenfolge).not.toContain('macheEndgueltig')
    expect(fehlerVon(ergebnis).code).toBe('probe_fehler')
  })

  it('entfernt die .part-Datei, wenn der Rename scheitert, und traegt nichts in D1 ein', async () => {
    zustand.endgueltigAntwort = {
      ok: false,
      fehler: { code: 'kopier_fehler', meldung: 'Nicht uebernommen.' },
    }

    const ergebnis = await importMedium(auftrag, kontext)

    expect(zustand.entferneDateiArgumente).toEqual([part])
    expect(zustand.reihenfolge).not.toContain('fuegeAssetHinzu')
    expect(fehlerVon(ergebnis).code).toBe('kopier_fehler')
  })

  it('meldet weiter den urspruenglichen Code, wenn das Wegraeumen selbst scheitert', async () => {
    zustand.probeAntwort = { ok: false, fehler: { code: 'probe_fehler', meldung: 'Timeout.' } }
    zustand.entferneDateiAntwort = {
      ok: false,
      fehler: { code: 'datei_fehler', meldung: 'Datei belegt.' },
    }

    const ergebnis = await importMedium(auftrag, kontext)

    expect(zustand.entferneDateiArgumente).toEqual([part])
    expect(fehlerVon(ergebnis).code).toBe('probe_fehler')
  })
})

describe('importMedium – Fehlschlag in D1: die fertige Datei bleibt als Waise liegen', () => {
  it.each(['speicher_fehler', 'kein_projekt', 'nicht_gefunden'])(
    'reicht %s unveraendert durch und raeumt nichts weg',
    async (code) => {
      zustand.hinzuAntwort = { ok: false, fehler: { code, meldung: 'Store meldet Fehler.' } }

      const ergebnis = await importMedium(auftrag, kontext)

      expect(zustand.entferneDateiArgumente).toHaveLength(0)
      expect(fehlerVon(ergebnis).code).toBe(code)
    },
  )

  it('meldet ungueltige_eingabe als Programmierfehler, ohne Datei zu loeschen', async () => {
    zustand.hinzuAntwort = {
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: 'Doppelte ID.' },
    }

    const ergebnis = await importMedium(auftrag, kontext)

    expect(zustand.entferneDateiArgumente).toHaveLength(0)
    expect(fehlerVon(ergebnis).code).toBe('ungueltige_eingabe')
    expect(fehlerVon(ergebnis).meldung).toContain('Programmierfehler')
  })

  it('deutet den unerreichbaren projekt_beschaeftigt als unbekannter_fehler, nennt ihn aber', async () => {
    zustand.hinzuAntwort = {
      ok: false,
      fehler: { code: 'projekt_beschaeftigt', meldung: 'Render laeuft.' },
    }

    const ergebnis = await importMedium(auftrag, kontext)

    expect(fehlerVon(ergebnis).code).toBe('unbekannter_fehler')
    expect(fehlerVon(ergebnis).meldung).toContain('projekt_beschaeftigt')
  })
})

describe('importMedium – Ausnahmen', () => {
  it('faengt eine Ausnahme vor der Kopie als unbekannter_fehler, ohne Stacktrace', async () => {
    zustand.wirftIn = 'kopiereInsStaging'

    const ergebnis = await importMedium(auftrag, kontext)

    expect(zustand.entferneDateiArgumente).toHaveLength(0)
    expect(fehlerVon(ergebnis).code).toBe('unbekannter_fehler')
    expect(fehlerVon(ergebnis).meldung).toContain('Absturz in kopiereInsStaging')
    expect(fehlerVon(ergebnis).meldung).not.toContain('    at ')
  })

  it('raeumt die .part-Datei weg, wenn nach der Kopie eine Ausnahme faellt', async () => {
    zustand.wirftIn = 'leseRohMetadaten'

    const ergebnis = await importMedium(auftrag, kontext)

    expect(zustand.entferneDateiArgumente).toEqual([partPfadZu(`${UUID}.mp4`)])
    expect(fehlerVon(ergebnis).code).toBe('unbekannter_fehler')
  })

  it('raeumt NICHTS weg, wenn die Ausnahme erst nach dem Rename faellt', async () => {
    zustand.wirftIn = 'fuegeAssetHinzu'

    const ergebnis = await importMedium(auftrag, kontext)

    expect(zustand.entferneDateiArgumente).toHaveLength(0)
    expect(fehlerVon(ergebnis).code).toBe('unbekannter_fehler')
  })

  it('liefert nie den Status abgebrochen', async () => {
    zustand.probeAntwort = { ok: false, fehler: { code: 'probe_fehler', meldung: 'Timeout.' } }
    const ergebnisse = [
      await importMedium(auftrag, kontext),
      await importMedium(auftragMit({ projektId: '', quellPfad: '' }), kontext),
    ]

    expect(ergebnisse.map((e) => e.status)).toEqual(['fehlgeschlagen', 'fehlgeschlagen'])
  })
})

describe('importMedium – was die Datei nicht anfasst', () => {
  const quelle = readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../src/main/media-service/import-medium.ts',
    ),
    'utf8',
  )

  it.each(['node:fs', 'node:fs/promises', 'electron', 'child_process', 'ffmpeg-static'])(
    'importiert %s nicht',
    (modul) => {
      expect(quelle).not.toMatch(new RegExp(`from ['"]${modul}`))
      expect(quelle).not.toMatch(new RegExp(`require\\(['"]${modul}`))
    },
  )

  it.each(['media', 'projects', 'project.json'])('enthaelt kein Literal %s', (wort) => {
    expect(quelle).not.toMatch(new RegExp(`['"\`]${wort.replace('.', '\\.')}['"\`]`))
  })

  it('fragt die Zeit genau einmal ab', () => {
    expect(quelle.match(/new Date\(/g)).toHaveLength(1)
  })

  it('fordert kein Lock an und stoesst keinen eigenen Flush an', () => {
    expect(quelle).not.toContain('mitD1Lock')
    expect(quelle).not.toContain('sofortFlush')
    expect(quelle).not.toContain('planeAutoSpeicherung')
  })
})

describe('importMedium – Fehlercode-Typ', () => {
  it('laesst die fachlichen und die generischen Codes zu, fremde nicht', () => {
    const zulaessig: Array<HandlerErgebnis<ImportFehlercode>> = [
      { status: 'fehlgeschlagen', fehler: { code: 'probe_fehler', meldung: '' } },
      { status: 'fehlgeschlagen', fehler: { code: 'kein_projekt', meldung: '' } },
      { status: 'fehlgeschlagen', fehler: { code: 'unbekannter_fehler', meldung: '' } },
    ]
    const unzulaessig: HandlerErgebnis<ImportFehlercode> = {
      status: 'fehlgeschlagen',
      // @ts-expect-error 'asset_referenziert' gehoert zu LoeschFehlercode, nicht zu ImportFehlercode
      fehler: { code: 'asset_referenziert', meldung: '' },
    }

    expect(zulaessig).toHaveLength(3)
    expect(unzulaessig.status).toBe('fehlgeschlagen')
  })
})
