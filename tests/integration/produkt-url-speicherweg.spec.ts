// Der Speicherweg von FA-27 (TK 9.19.7): schreiben -> Datei -> neu laden -> lesen.
//
// WARUM INTEGRATION UND NICHT UNIT: Die DoD von #470 verlangt ausdruecklich einen Test auf
// dem SPEICHERWEG, nicht nur auf dem Typ. Genau dieser Weg ist bei `Aktion.effekte` (#464)
// gerissen, ohne dass ein Typ- oder Unit-Test es merkte: Feld im Vertrag, im project-store
// verworfen. Hier laeuft deshalb der echte JSON-Weg ueber `schreibeProjekt` und die echte
// Migration beim Wiederoeffnen.
//
// Geprueft wird zusaetzlich, dass eine Datei im alten Format (schemaVersion 1, Asset ohne
// `herkunft`) beim Laden auf 2 gehoben wird und das Pflichtfeld bekommt.
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
const arbeitsordner = mkdtempSync(path.join(tmpdir(), 'signage-speicherweg-'))
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

describe('produktUrl ueber den Speicherweg (FA-27)', () => {
  it('schreibt die getrimmte Adresse, laedt sie wieder und laesst sie beim Bearbeiten setzen und leeren', async () => {
    const projekt = await erstelleProjekt('Speicherweg', 'marke-1')
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
      produktUrl: '   https://shop.example/produkt/42   ',
    })
    if (!angelegt.ok) throw new Error(angelegt.fehler.meldung)

    const geschrieben = await sofortFlush(projekt.wert)
    if (!geschrieben.ok) throw new Error(geschrieben.fehler.meldung)

    const datei = neuLaden(projekt.wert.id)
    expect(aktionen(datei)[0]?.['produktUrl']).toBe('https://shop.example/produkt/42')

    // Bearbeiten: ein neuer Wert ersetzt, `null` leert – in BEIDEN Faellen auf Platte.
    const geaendert = await bearbeiteAktion(angelegt.wert.id, {
      produktUrl: 'http://shop.example/neu',
    })
    if (!geaendert.ok) throw new Error(geaendert.fehler.meldung)
    await sofortFlush(projekt.wert)
    expect(aktionen(neuLaden(projekt.wert.id))[0]?.['produktUrl']).toBe('http://shop.example/neu')

    const geleert = await bearbeiteAktion(angelegt.wert.id, { produktUrl: null })
    if (!geleert.ok) throw new Error(geleert.fehler.meldung)
    await sofortFlush(projekt.wert)
    expect(aktionen(neuLaden(projekt.wert.id))[0]?.['produktUrl']).toBeNull()
  })

  it('verwirft eine Adresse, die kein http(s) ist, schon beim Anlegen (nicht erst beim Abruf)', async () => {
    const projekt = await erstelleProjekt('Speicherweg 2', 'marke-1')
    if (!projekt.ok) throw new Error(projekt.fehler.meldung)

    const angelegt = await erstelleAktion({
      titel: 'Angebot',
      beschreibung: null,
      preis: null,
      bildRef: null,
      cta: null,
      standardDauer: null,
      vorlagenId: 'vollbild',
      markeId: 'marke-1',
      akzentfarbe: null,
      produktUrl: 'file:///etc/passwd',
    })
    if (!angelegt.ok) throw new Error(angelegt.fehler.meldung)

    await sofortFlush(projekt.wert)
    const datei = neuLaden(projekt.wert.id)
    expect(aktionen(datei)[0]?.['produktUrl']).toBeNull()
  })

  it('hebt eine alte project.json (Version 1) beim Laden auf 2 und ergaenzt herkunft am Asset', () => {
    const alt = {
      id: 'p-alt',
      name: 'Bestand',
      erstelltAm: '2026-01-01T00:00:00.000Z',
      geaendertAm: '2026-01-02T00:00:00.000Z',
      schemaVersion: 1,
      assets: [
        {
          id: 'a-1',
          typ: 'bild',
          dateiname: 'a-1.png',
          originalname: 'alt.png',
          maße: { breite: 10, höhe: 10 },
          dauer: null,
          importdatum: '2026-01-01T00:00:00.000Z',
          zustand: 'ok',
        },
      ],
      aktionen: [],
      liste: [],
      letzterAusgabeName: null,
      standardMarkeId: 'marke-1',
      standardSegmentdauer: 10,
    }

    const ergebnis = migriereProjekt(alt)
    if (!ergebnis.ok) throw new Error(ergebnis.fehler.meldung)

    expect(ergebnis.wert.schemaVersion).toBe(2)
    expect(ergebnis.wert.assets[0]?.herkunft).toEqual({ art: 'manuell' })
  })
})
