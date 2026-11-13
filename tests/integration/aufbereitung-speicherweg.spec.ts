// Der Speicherweg der Bildaufbereitung (13.11.2026, FA-28 / TK 9.21.3): schreiben -> Datei
// -> neu laden -> lesen.
//
// WARUM INTEGRATION UND NICHT UNIT: Die DoD von #473 verlangt den SPEICHERWEG, nicht nur den
// Typ. Genau dieser Weg ist bei `Aktion.effekte` (#464) gerissen, ohne dass ein Typ- oder
// Unit-Test es merkte: Feld im Vertrag, im project-store verworfen. Hier laeuft der echte
// JSON-Weg ueber `schreibeProjekt` samt Auto-Speichern und die echte Migration beim
// Wiederoeffnen.
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterAll, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '' } }))

const { erstelleProjekt } = await import('../../src/main/project-store/erstelle-projekt')
const { erstelleAktion } = await import('../../src/main/project-store/erstelle-aktion')
const { bearbeiteAktion } = await import('../../src/main/project-store/bearbeite-aktion')
const { sofortFlush } = await import('../../src/main/project-store/auto-speichern')
const { migriereProjekt } = await import('../../src/main/project-store/migriere-projekt')

const urspruenglicherOrt = process.cwd()
const arbeitsordner = mkdtempSync(path.join(tmpdir(), 'signage-aufbereitung-'))
process.chdir(arbeitsordner)

afterAll(() => {
  process.chdir(urspruenglicherOrt)
  rmSync(arbeitsordner, { recursive: true, force: true })
})

/** Die Datei so lesen, wie `oeffneProjekt` sie liest: roh, dann durch die Migration. */
function neuLaden(projektId: string): Record<string, unknown> {
  const roh: unknown = JSON.parse(
    readFileSync(path.join(arbeitsordner, 'projects', projektId, 'project.json'), 'utf8'),
  )
  if (typeof roh !== 'object' || roh === null) throw new Error('project.json ist kein Objekt')
  const ergebnis = migriereProjekt(roh as Record<string, unknown> & { schemaVersion: number })
  if (!ergebnis.ok) throw new Error(`Migration: ${ergebnis.fehler.meldung}`)
  return ergebnis.wert as unknown as Record<string, unknown>
}

function aktionen(projekt: Record<string, unknown>): Array<Record<string, unknown>> {
  const liste = projekt['aktionen']
  if (!Array.isArray(liste)) throw new Error('aktionen fehlt')
  return liste as Array<Record<string, unknown>>
}

describe('bildAufbereitung ueber den Speicherweg (FA-28)', () => {
  it('schreibt die Werte, laedt sie wieder und laesst sie beim Bearbeiten setzen und leeren', async () => {
    const projekt = await erstelleProjekt('Aufbereitung', 'marke-1')
    if (!projekt.ok) throw new Error(projekt.fehler.meldung)

    const angelegt = await erstelleAktion({
      titel: 'Angebot',
      beschreibung: null,
      preis: '19,90 EUR',
      bildRef: null,
      cta: null,
      standardDauer: 10,
      vorlagenId: 'vollbild',
      markeId: 'marke-1',
      akzentfarbe: null,
      bildAufbereitung: { helligkeit: 250, kontrast: 12, schaerfe: 0 },
    })
    if (!angelegt.ok) throw new Error(angelegt.fehler.meldung)

    const geschrieben = await sofortFlush(projekt.wert)
    if (!geschrieben.ok) throw new Error(geschrieben.fehler.meldung)

    // Geklemmt, gerundet, Nullwert weg - und in der DATEI, nicht nur im Speicher.
    expect(aktionen(neuLaden(projekt.wert.id))[0]?.['bildAufbereitung']).toEqual({
      helligkeit: 100,
      kontrast: 12,
    })

    const geaendert = await bearbeiteAktion(angelegt.wert.id, {
      bildAufbereitung: { schaerfe: 40 },
    })
    if (!geaendert.ok) throw new Error(geaendert.fehler.meldung)
    await sofortFlush(projekt.wert)
    expect(aktionen(neuLaden(projekt.wert.id))[0]?.['bildAufbereitung']).toEqual({ schaerfe: 40 })

    const geleert = await bearbeiteAktion(angelegt.wert.id, { bildAufbereitung: null })
    if (!geleert.ok) throw new Error(geleert.fehler.meldung)
    await sofortFlush(projekt.wert)
    expect(aktionen(neuLaden(projekt.wert.id))[0]?.['bildAufbereitung']).toBeNull()
  })

  it('eine alte project.json ohne das Feld bleibt lesbar und bekommt keines', async () => {
    const projekt = await erstelleProjekt('Aufbereitung alt', 'marke-1')
    if (!projekt.ok) throw new Error(projekt.fehler.meldung)

    const angelegt = await erstelleAktion({
      titel: 'Alt',
      beschreibung: null,
      preis: null,
      bildRef: null,
      cta: null,
      standardDauer: 10,
      vorlagenId: 'vollbild',
      markeId: 'marke-1',
      akzentfarbe: null,
    })
    if (!angelegt.ok) throw new Error(angelegt.fehler.meldung)
    await sofortFlush(projekt.wert)

    const gelesen = aktionen(neuLaden(projekt.wert.id))[0] ?? {}
    // Das Feld steht als `null` in der Datei (so schreibt der Store es) - es gibt keine
    // Migration und keinen erfundenen Wert.
    expect(gelesen['bildAufbereitung']).toBeNull()
  })
})
