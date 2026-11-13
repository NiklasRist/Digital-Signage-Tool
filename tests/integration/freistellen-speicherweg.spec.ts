// Der Speicherweg des Freistellens (13.11.2026, FA-29 / TK 9.21.5): schreiben -> Datei ->
// neu laden -> lesen.
//
// WARUM INTEGRATION UND NICHT UNIT: Die DoD von #474 verlangt den SPEICHERWEG, nicht nur
// den Typ - und genau dieser Weg ist bei `Aktion.effekte` (#464) gerissen, ohne dass ein
// Typ- oder Unit-Test es merkte: Feld im Vertrag, im project-store verworfen. Hier laeuft
// der echte JSON-Weg ueber `sofortFlush` und die echte Migration beim Wiederoeffnen.
//
// DIE ZWEITE ZUSAGE: `freistellen` ist NICHT destruktiv (9.21.7). Die Mediendatei bleibt
// byte-gleich, und in `project.json` steht NUR das Feld - kein neues Asset, keine dritte
// `herkunft`-Variante.
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
const arbeitsordner = mkdtempSync(path.join(tmpdir(), 'signage-freistellen-'))
process.chdir(arbeitsordner)

afterAll(() => {
  process.chdir(urspruenglicherOrt)
  rmSync(arbeitsordner, { recursive: true, force: true })
})

function projektDatei(projektId: string): string {
  return path.join(arbeitsordner, 'projects', projektId, 'project.json')
}

/** Die Datei so lesen, wie `oeffneProjekt` sie liest: roh, dann durch die Migration. */
function neuLaden(projektId: string): Record<string, unknown> {
  const roh: unknown = JSON.parse(readFileSync(projektDatei(projektId), 'utf8'))
  if (typeof roh !== 'object' || roh === null) throw new Error('project.json ist kein Objekt')
  const ergebnis = migriereProjekt(roh as Record<string, unknown> & { schemaVersion: number })
  if (!ergebnis.ok) throw new Error(`Migration: ${ergebnis.fehler.meldung}`)
  return ergebnis.wert as unknown as Record<string, unknown>
}

function ersteAktion(projektId: string): Record<string, unknown> {
  const projekt = neuLaden(projektId)
  const liste = projekt['aktionen']
  if (!Array.isArray(liste)) throw new Error('aktionen fehlt')
  const erstes = (liste as Array<Record<string, unknown>>)[0]
  if (erstes === undefined) throw new Error('keine Aktion')
  return erstes
}

describe('freistellen ueber den Speicherweg (FA-29)', () => {
  it('setzt, laedt wieder und LEERT beim Ausschalten - nicht-destruktiv', async () => {
    const projekt = await erstelleProjekt('Freistellen', 'marke-1')
    if (!projekt.ok) throw new Error(projekt.fehler.meldung)

    // Eine echte Mediendatei, damit die Zusage „byte-gleich" pruefbar ist.
    const medienordner = path.join(arbeitsordner, 'projects', projekt.wert.id, 'medien')
    const { mkdirSync } = await import('node:fs')
    mkdirSync(medienordner, { recursive: true })
    const dateiname = '3f2a1b4c-1111-4111-8111-abcdefabcdef.png'
    const medienPfad = path.join(medienordner, dateiname)
    writeFileSync(medienPfad, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]))
    const vorher = createHash('sha256').update(readFileSync(medienPfad)).digest('hex')

    const angelegt = await erstelleAktion({
      titel: 'Angebot',
      beschreibung: null,
      preis: null,
      bildRef: 'asset-1',
      cta: null,
      standardDauer: 10,
      vorlagenId: 'vollbild',
      markeId: 'marke-1',
      akzentfarbe: null,
      freistellen: true,
    })
    if (!angelegt.ok) throw new Error(angelegt.fehler.meldung)

    const geschrieben = await sofortFlush(projekt.wert)
    if (!geschrieben.ok) throw new Error(geschrieben.fehler.meldung)

    // In der DATEI, nicht nur im Speicher.
    expect(ersteAktion(projekt.wert.id)['freistellen']).toBe(true)

    const geaendert = await bearbeiteAktion(angelegt.wert.id, { freistellen: false })
    if (!geaendert.ok) throw new Error(geaendert.fehler.meldung)
    await sofortFlush(projekt.wert)

    // Ausschalten heisst LEEREN (`null`) - nicht `false`: es gibt genau EINEN
    // eingeschalteten Zustand und fuer „aus" nur eine Schreibweise.
    expect(ersteAktion(projekt.wert.id)['freistellen']).toBeNull()

    // NICHT-DESTRUKTIV (9.21.7): Die Datei ist byte-gleich, und es gibt kein zweites Asset.
    const nachher = createHash('sha256').update(readFileSync(medienPfad)).digest('hex')
    expect(nachher).toBe(vorher)
    const projektstand = neuLaden(projekt.wert.id)
    const assets = projektstand['assets']
    if (!Array.isArray(assets)) throw new Error('assets fehlt')
    expect((assets as unknown[]).length).toBe(0)
  })

  it('schreibt ein `false` NICHT als `false` in die Datei', async () => {
    const projekt = await erstelleProjekt('Freistellen alt', 'marke-1')
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
      freistellen: false,
    })
    if (!angelegt.ok) throw new Error(angelegt.fehler.meldung)
    await sofortFlush(projekt.wert)

    expect(ersteAktion(projekt.wert.id)['freistellen']).toBeNull()
  })
})
