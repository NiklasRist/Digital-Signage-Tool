// Das GEWAEHLTE Produktfoto wird ein Asset wie jedes andere (FA-27 / TK 9.19.5).
//
// Integration, weil hier die echte Kette laeuft: .part schreiben -> ffprobe -> atomarer
// Rename -> `fuegeAssetHinzu` (Lock + Sofort-Flush) -> project.json. Ein Unit-Test mit
// gemocktem Store koennte genau den Fehler nicht finden, um den es geht: dass das
// Pflichtfeld `herkunft` auf dem Speicherweg verloren geht.
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '' } }))

const { erstelleProjekt } = await import('../../src/main/project-store/erstelle-projekt')
const { waehleKandidat } = await import('../../src/main/produktfoto/waehle-kandidat')
const { legeAbrufAb, holeAbruf, leereAbrufe } = await import(
  '../../src/main/produktfoto/kandidaten-speicher'
)
const { migriereProjekt } = await import('../../src/main/project-store/migriere-projekt')

const urspruenglicherOrt = process.cwd()
const arbeitsordner = mkdtempSync(path.join(tmpdir(), 'signage-produktfoto-'))
process.chdir(arbeitsordner)

// Ein echtes 1x1-PNG (67 Bytes). Kein Platzhalter: ffprobe muss es als Bild erkennen.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

function abruf(projektId: string, url = 'https://cdn.example/produkt.png'): string {
  return legeAbrufAb({
    projektId,
    aktionId: 'a-1',
    abgerufenAm: '2026-11-12T10:00:00.000Z',
    kandidaten: [{ url, typ: 'image/png', bytes: PNG }],
  })
}

function neuLaden(projektId: string): Record<string, unknown> {
  const roh: unknown = JSON.parse(
    readFileSync(path.join(arbeitsordner, 'projects', projektId, 'project.json'), 'utf8'),
  )
  if (typeof roh !== 'object' || roh === null) throw new Error('project.json ist kein Objekt')
  const ergebnis = migriereProjekt(roh as Record<string, unknown> & { schemaVersion: number })
  if (!ergebnis.ok) throw new Error(ergebnis.fehler.meldung)
  return ergebnis.wert as unknown as Record<string, unknown>
}

function assets(projekt: Record<string, unknown>): Array<Record<string, unknown>> {
  const liste = projekt['assets']
  if (!Array.isArray(liste)) throw new Error('assets fehlt')
  return liste as Array<Record<string, unknown>>
}

afterEach(() => {
  leereAbrufe()
})

afterAll(() => {
  process.chdir(urspruenglicherOrt)
  rmSync(arbeitsordner, { recursive: true, force: true })
})

describe('waehleKandidat (FA-27)', () => {
  it('schreibt genau ein Asset mit Pflicht-Herkunft und verwirft danach den Abruf', async () => {
    const projekt = await erstelleProjekt('Produktfoto', 'marke-1')
    if (!projekt.ok) throw new Error(projekt.fehler.meldung)
    const abrufId = abruf(projekt.wert.id)

    const wahl = await waehleKandidat(abrufId, 0)

    expect(wahl.ok).toBe(true)
    if (!wahl.ok) return
    expect(wahl.wert.bildRef).toBe(wahl.wert.assetId)

    const datei = neuLaden(projekt.wert.id)
    expect(assets(datei)).toHaveLength(1)
    expect(assets(datei)[0]).toMatchObject({
      id: wahl.wert.assetId,
      typ: 'bild',
      dateiname: `${wahl.wert.assetId}.png`,
      zustand: 'ok',
      herkunft: {
        art: 'abruf',
        url: 'https://cdn.example/produkt.png',
        abgerufenAm: '2026-11-12T10:00:00.000Z',
      },
    })
    // Die Maße stammen aus ffprobe, nicht aus dem Content-Type.
    expect(assets(datei)[0]?.['maße']).toEqual({ breite: 1, höhe: 1 })

    // Ein zweiter Klick auf denselben Abruf legt KEIN zweites Asset an.
    expect(holeAbruf(abrufId)).toBeNull()
    const zweite = await waehleKandidat(abrufId, 0)
    expect(zweite.ok).toBe(false)
    if (zweite.ok) return
    expect(zweite.fehler.code).toBe('nicht_gefunden')
    expect(assets(neuLaden(projekt.wert.id))).toHaveLength(1)
  })

  it('weist einen unbekannten Kandidaten-Index ab, ohne etwas anzulegen', async () => {
    const projekt = await erstelleProjekt('Produktfoto 2', 'marke-1')
    if (!projekt.ok) throw new Error(projekt.fehler.meldung)
    const abrufId = abruf(projekt.wert.id)

    const wahl = await waehleKandidat(abrufId, 3)

    expect(wahl.ok).toBe(false)
    if (wahl.ok) return
    expect(wahl.fehler.code).toBe('nicht_gefunden')
    expect(assets(neuLaden(projekt.wert.id))).toHaveLength(0)
  })
})
