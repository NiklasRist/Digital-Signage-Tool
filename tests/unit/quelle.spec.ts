import { readFileSync } from 'node:fs'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Ergebnis } from '../../src/shared/contracts/ergebnis'

// Verhaltenstest zu #185 (loeseExportQuelle).
//
// Gearbeitet wird auf einem ECHTEN Ordner unter os.tmpdir(): Die Funktion lebt von
// Existenz, Art und Groesse einer Datei, und ein durchgehend gemocktes fs wuerde genau
// das wegabstrahieren, was hier schiefgehen kann. Gemockt sind nur drei Dinge:
//  - der Datenort, damit der Testlauf nicht im Projektordner herumschreibt,
//  - `loeseAusgabePfad` und `ausgabeOrdner` (#49) als ZAEHLER um die echten Fassungen -
//    das Issue verlangt den Nachweis, WOMIT aufgeloest wird (Endung abgeschnitten) und
//    dass `ausgabeOrdner` NIE gerufen wird,
//  - `stat`, weil "kein fs-Aufruf" nur mit einem Zaehler belegbar ist und EACCES sich
//    im Test nicht herstellen laesst.
const zustand = vi.hoisted(() => ({
  datenOrt: '',
  pfadAufrufe: [] as Array<[string, string]>,
  pfadAntwort: null as { ok: false; fehler: { code: 'ungueltige_eingabe'; meldung: string } } | null,
  pfadWirft: false,
  ordnerAufrufe: 0,
  statAufrufe: [] as string[],
  statFehler: null as (Error & { code?: string }) | null,
}))

vi.mock('../../src/main/datenort', () => ({
  ermittleDatenOrt: () => zustand.datenOrt,
}))

vi.mock('../../src/main/project-store/pfade', async (echtLaden) => {
  const echt = await echtLaden<typeof import('../../src/main/project-store/pfade')>()
  return {
    ...echt,
    loeseAusgabePfad: (projektId: string, ausgabeName: string): Ergebnis<string> => {
      zustand.pfadAufrufe.push([projektId, ausgabeName])
      if (zustand.pfadWirft) {
        throw new Error('Pfad-Autoritaet gestolpert')
      }
      return zustand.pfadAntwort ?? echt.loeseAusgabePfad(projektId, ausgabeName)
    },
    // Zaehlt NUR Aufrufe aus quelle.ts: Das echte loeseAusgabePfad ruft in pfade.ts
    // seine eigene, modullokale Fassung - die geht an dieser Attrappe vorbei.
    ausgabeOrdner: (projektId: string) => {
      zustand.ordnerAufrufe += 1
      return echt.ausgabeOrdner(projektId)
    },
  }
})

vi.mock('node:fs/promises', async (echtLaden) => {
  const echt = await echtLaden<typeof import('node:fs/promises')>()
  return {
    ...echt,
    stat: vi.fn((pfad: string) => {
      zustand.statAufrufe.push(pfad)
      if (zustand.statFehler !== null) {
        return Promise.reject(zustand.statFehler)
      }
      return echt.stat(pfad)
    }),
  }
})

const { loeseExportQuelle } = await import('../../src/main/export-service/quelle')
const echtePfade =
  await vi.importActual<typeof import('../../src/main/project-store/pfade')>(
    '../../src/main/project-store/pfade',
  )

const PROJEKT = '3f2a1c4e-0000-4000-8000-0123456789ab'

const ordner = (): string => echtePfade.ausgabeOrdner(PROJEKT)

async function legeAn(name: string, groesse = 7): Promise<string> {
  const ziel = path.join(ordner(), name)
  await writeFile(ziel, 'x'.repeat(groesse))
  return ziel
}

beforeEach(async () => {
  zustand.datenOrt = await mkdtemp(path.join(os.tmpdir(), 'exportquelle-'))
  zustand.pfadAufrufe = []
  zustand.pfadAntwort = null
  zustand.pfadWirft = false
  zustand.ordnerAufrufe = 0
  zustand.statAufrufe = []
  zustand.statFehler = null
  await mkdir(ordner(), { recursive: true })
})

afterEach(async () => {
  await rm(zustand.datenOrt, { recursive: true, force: true })
})

describe('loeseExportQuelle (#185) - Formpruefung', () => {
  it.each([
    ['leere projektId', '', 'sommeraktion.mp4'],
    ['leerer dateiname', PROJEKT, ''],
    ['ohne Endung', PROJEKT, 'sommer'],
    ['fremde Endung', PROJEKT, 'sommer.mov'],
    ['halb geschriebene Datei', PROJEKT, 'sommer.mp4.part'],
    ['nur die Endung', PROJEKT, '.mp4'],
  ])('weist %s ohne jeden fs-Aufruf ab', async (_fall, projektId, dateiname) => {
    const e = await loeseExportQuelle(projektId, dateiname)

    expect(e.ok).toBe(false)
    if (e.ok) return
    expect(e.fehler.code).toBe('ungueltige_eingabe')
    expect(zustand.statAufrufe).toEqual([])
    expect(zustand.pfadAufrufe).toEqual([])
  })
})

describe('loeseExportQuelle (#185) - Aufloesung ueber die Pfad-Autoritaet', () => {
  it('uebergibt den Namen OHNE Endung an loeseAusgabePfad', async () => {
    await legeAn('sommeraktion.mp4')

    const e = await loeseExportQuelle(PROJEKT, 'sommeraktion.mp4')

    expect(zustand.pfadAufrufe).toEqual([[PROJEKT, 'sommeraktion']])
    expect(e.ok).toBe(true)
  })

  it('schneidet nur die Endung ab, nicht ab dem ersten Punkt', async () => {
    await legeAn('sommer.aktion.mp4')

    const e = await loeseExportQuelle(PROJEKT, 'sommer.aktion.mp4')

    expect(zustand.pfadAufrufe).toEqual([[PROJEKT, 'sommer.aktion']])
    expect(e.ok).toBe(true)
  })

  it('weist eine gross geschriebene Endung ab, ohne das Dateisystem zu fragen', async () => {
    // GEAENDERT am 14.08.2026. Hier stand die Gegenprobe: `FERIEN.MP4` wurde
    // AKZEPTIERT. Die Abnahme von #185 verlangte das mit der Begruendung,
    // listeAusgaben (#75) fuehre solche Dateien auf - was seit dem 12.08.2026 nicht
    // mehr stimmt. Aufgeloest zugunsten von #75: loeseAusgabePfad haengt immer ein
    // klein geschriebenes `.mp4` an, eine als `FERIEN.MP4` gefuehrte Datei waere auf
    // macOS nicht aufloesbar.
    //
    // Die Datei liegt absichtlich da: Der Test zeigt damit, dass die Ablehnung an der
    // SCHREIBWEISE haengt und nicht daran, dass nichts zu finden waere.
    await legeAn('FERIEN.mp4')

    const e = await loeseExportQuelle(PROJEKT, 'FERIEN.MP4')

    expect(e.ok).toBe(false)
    if (!e.ok) expect(e.fehler.code).toBe('ungueltige_eingabe')
    // Kein Griff auf die Pfad-Autoritaet und kein fs-Zugriff: Die Form entscheidet.
    expect(zustand.pfadAufrufe).toEqual([])
  })

  it('reicht ungueltige_eingabe der Pfad-Autoritaet durch und statet nicht', async () => {
    zustand.pfadAntwort = {
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: 'Der Ausgabename ist unzulaessig.' },
    }

    const e = await loeseExportQuelle(PROJEKT, '..\\..\\project.json.mp4')

    expect(e.ok).toBe(false)
    if (e.ok) return
    expect(e.fehler.code).toBe('ungueltige_eingabe')
    expect(e.fehler.meldung).toBe('Der Ausgabename ist unzulaessig.')
    expect(zustand.statAufrufe).toEqual([])
  })

  it('baut keinen Pfad selbst - kein path.join/resolve, kein ausgabeOrdner', async () => {
    await legeAn('sommeraktion.mp4')
    await loeseExportQuelle(PROJEKT, 'sommeraktion.mp4')

    expect(zustand.ordnerAufrufe).toBe(0)

    const quelltext = readFileSync(
      new URL('../../src/main/export-service/quelle.ts', import.meta.url),
      'utf8',
    )
    const code = quelltext
      .split('\n')
      .filter((zeile) => !zeile.trimStart().startsWith('//'))
      .join('\n')
    expect(code).not.toMatch(/path\.(join|resolve)/)
    expect(code).not.toMatch(/["']node:path["']/)
    expect(code).not.toMatch(/ausgabeOrdner/)
  })
})

describe('loeseExportQuelle (#185) - Zustand der Quelldatei', () => {
  it('liefert Pfad und echte Bytegroesse einer vorhandenen Datei', async () => {
    const ziel = await legeAn('sommeraktion.mp4', 4096)

    const e = await loeseExportQuelle(PROJEKT, 'sommeraktion.mp4')

    expect(e).toEqual({ ok: true, wert: { quellPfad: ziel, dateigroesse: 4096 } })
  })

  it('meldet eine fehlende Datei als keine_ausgabe, ohne den absoluten Pfad zu nennen', async () => {
    const e = await loeseExportQuelle(PROJEKT, 'sommeraktion.mp4')

    expect(e.ok).toBe(false)
    if (e.ok) return
    expect(e.fehler.code).toBe('keine_ausgabe')
    expect(e.fehler.meldung).toContain('sommeraktion.mp4')
    expect(e.fehler.meldung).not.toContain(zustand.datenOrt)
    expect(e.fehler.meldung).not.toContain(path.join(ordner(), 'sommeraktion.mp4'))
  })

  it('nimmt ein Verzeichnis nicht als Ausgabedatei an', async () => {
    await mkdir(path.join(ordner(), 'sommeraktion.mp4'))

    const e = await loeseExportQuelle(PROJEKT, 'sommeraktion.mp4')

    expect(e.ok).toBe(false)
    if (e.ok) return
    expect(e.fehler.code).toBe('keine_ausgabe')
  })

  it('meldet einen Zugriffsfehler als keine_ausgabe mit dem OS-Code in der Meldung', async () => {
    zustand.statFehler = Object.assign(new Error('stat EACCES'), { code: 'EACCES' })

    const e = await loeseExportQuelle(PROJEKT, 'sommeraktion.mp4')

    expect(e.ok).toBe(false)
    if (e.ok) return
    expect(e.fehler.code).toBe('keine_ausgabe')
    expect(e.fehler.meldung).toContain('EACCES')
  })

  it('wandelt eine unerwartete Ausnahme in unbekannter_fehler, statt zu werfen', async () => {
    zustand.pfadWirft = true

    const e = await loeseExportQuelle(PROJEKT, 'sommeraktion.mp4')

    expect(e.ok).toBe(false)
    if (e.ok) return
    expect(e.fehler.code).toBe('unbekannter_fehler')
    expect(e.fehler.meldung).not.toContain('at ')
  })
})
