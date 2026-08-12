import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { readFileSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Verhaltenstest zu #75 (listeAusgaben).
//
// Gearbeitet wird auf einem ECHTEN Ordner unter os.tmpdir(): Die Funktion lebt von
// Groessen und Zeitstempeln des Dateisystems, und ein gemocktes fs wuerde genau das
// wegabstrahieren, was hier schiefgehen kann. Der Datenort ist gemockt, damit der
// Testlauf nicht im Projektordner herumschreibt; `ausgabeOrdner` (#49) laeuft echt,
// wird aber gezaehlt (DoD: genau ein Aufruf, kein selbst gebauter Pfad).
const zustand = vi.hoisted(() => ({ datenOrt: '', ordnerAufrufe: [] as string[] }))

vi.mock('../../src/main/datenort', () => ({
  ermittleDatenOrt: () => zustand.datenOrt,
}))

vi.mock('../../src/main/project-store/pfade', async () => {
  const echt =
    await vi.importActual<typeof import('../../src/main/project-store/pfade')>(
      '../../src/main/project-store/pfade',
    )
  return {
    ...echt,
    ausgabeOrdner: (projektId: string) => {
      zustand.ordnerAufrufe.push(projektId)
      return echt.ausgabeOrdner(projektId)
    },
  }
})

const { listeAusgaben } = await import('../../src/main/project-store/ausgaben')
const echtePfade =
  await vi.importActual<typeof import('../../src/main/project-store/pfade')>(
    '../../src/main/project-store/pfade',
  )

const PROJEKT = '3f2a1c4e-0000-4000-8000-0123456789ab'
const T1 = Date.UTC(2026, 0, 1, 10, 0, 0)
const T2 = Date.UTC(2026, 0, 2, 10, 0, 0)

/** Der Ausgabeordner, ohne den Zaehler zu verfaelschen (echte Fassung von #49). */
const ordner = (): string => echtePfade.ausgabeOrdner(PROJEKT)

async function legeAn(name: string, groesse = 3, zeit = T1): Promise<void> {
  const ziel = path.join(ordner(), name)
  await fsp.writeFile(ziel, 'x'.repeat(groesse))
  await fsp.utimes(ziel, new Date(zeit), new Date(zeit))
}

beforeEach(async () => {
  zustand.datenOrt = await fsp.mkdtemp(path.join(os.tmpdir(), 'ausgaben-'))
  zustand.ordnerAufrufe = []
})

afterEach(async () => {
  await fsp.rm(zustand.datenOrt, { recursive: true, force: true })
})

describe('listeAusgaben (#75)', () => {
  it('liefert Name, Groesse und Aenderungszeit jeder fertigen MP4', async () => {
    await fsp.mkdir(ordner(), { recursive: true })
    await legeAn('sommeraktion.mp4', 7, T1)

    const e = await listeAusgaben(PROJEKT)
    expect(e.ok).toBe(true)
    if (!e.ok) return
    expect(e.wert).toEqual([
      {
        dateiname: 'sommeraktion.mp4',
        dateigroesse: 7,
        geaendertAm: new Date(T1).toISOString(),
      },
    ])
  })

  it('sortiert absteigend nach Zeit, bei Gleichstand aufsteigend nach Name', async () => {
    await fsp.mkdir(ordner(), { recursive: true })
    await legeAn('alt.mp4', 3, T1)
    await legeAn('neu-b.mp4', 3, T2)
    await legeAn('neu-a.mp4', 3, T2)

    const e = await listeAusgaben(PROJEKT)
    expect(e.ok).toBe(true)
    if (!e.ok) return
    expect(e.wert.map((d) => d.dateiname)).toEqual(['neu-a.mp4', 'neu-b.mp4', 'alt.mp4'])
  })

  it('laesst Arbeitsdateien, endungslose Dateien und Unterordner aus', async () => {
    await fsp.mkdir(ordner(), { recursive: true })
    // Der halb geschriebene Render ist der teuerste Fall: Auf dem USB-Stick waere das
    // ein Video, das mitten im Abspielen abbricht.
    await legeAn('reel.mp4.part')
    await legeAn('zwischen.tmp')
    await legeAn('ohneendung')
    await legeAn('.mp4')
    await legeAn('fertig.mp4')
    await fsp.mkdir(path.join(ordner(), 'ordner.mp4'))

    const e = await listeAusgaben(PROJEKT)
    expect(e.ok).toBe(true)
    if (!e.ok) return
    expect(e.wert.map((d) => d.dateiname)).toEqual(['fertig.mp4'])
  })

  it('laesst eine grossgeschriebene Endung weg', async () => {
    // Umgekehrt am 12.08.2026: Eine als datei.MP4 gelistete Datei waere nicht
    // exportierbar - loeseAusgabePfad (#49) haengt immer klein geschriebenes .mp4 an,
    // und auf macOS zeigt das ins Leere. Lieber nicht zeigen als beim Anklicken
    // scheitern lassen.
    //
    // Nur EINE Datei anlegen: Auf Windows ist das Dateisystem schreibungsblind, ein
    // zweites legeAn('datei.mp4') traefe dieselbe Datei und behielte den alten Namen.
    await fsp.mkdir(ordner(), { recursive: true })
    await legeAn('datei.MP4')

    const e = await listeAusgaben(PROJEKT)
    expect(e).toEqual({ ok: true, wert: [] })
  })

  it('liefert bei fehlendem Ordner eine leere Liste und legt ihn NICHT an', async () => {
    const e = await listeAusgaben(PROJEKT)
    expect(e).toEqual({ ok: true, wert: [] })
    await expect(fsp.stat(ordner())).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('liefert bei leerem Ordner eine leere Liste', async () => {
    await fsp.mkdir(ordner(), { recursive: true })
    expect(await listeAusgaben(PROJEKT)).toEqual({ ok: true, wert: [] })
  })

  it('holt den Ordnerpfad genau einmal von ausgabeOrdner und gibt keinen Pfad heraus', async () => {
    await fsp.mkdir(ordner(), { recursive: true })
    await legeAn('a.mp4')
    zustand.ordnerAufrufe = []

    const e = await listeAusgaben(PROJEKT)
    expect(zustand.ordnerAufrufe).toEqual([PROJEKT])
    expect(e.ok).toBe(true)
    if (!e.ok) return
    for (const datei of e.wert) {
      expect(datei.dateiname).not.toMatch(/[/\\]/)
    }
  })
})

describe('Fehlerpfade', () => {
  it.each(['', '..', 'a/b', 'a\\b'])(
    'weist die Projekt-ID %j ab, ohne den Datentraeger anzufassen',
    async (projektId) => {
      const e = await listeAusgaben(projektId)
      expect(e.ok).toBe(false)
      if (e.ok) return
      expect(e.fehler.code).toBe('ungueltige_eingabe')
      expect(zustand.ordnerAufrufe).toEqual([])
    },
  )

  it('meldet speicher_fehler, wenn der vorhandene Ordner nicht lesbar ist', async () => {
    // EACCES wird gestellt und nicht auf der Platte erzeugt: chmod ist unter Windows
    // wirkungslos, der Fall waere dort sonst ungetestet.
    await fsp.mkdir(ordner(), { recursive: true })
    const spion = vi
      .spyOn(fsp, 'readdir')
      .mockRejectedValue(Object.assign(new Error('kein Zutritt'), { code: 'EACCES' }))
    try {
      const e = await listeAusgaben(PROJEKT)
      expect(e.ok).toBe(false)
      if (e.ok) return
      // Nicht `unbekannter_fehler`: Der ist laut TK 9.1.1 fuer unerwartete Ausnahmen
      // reserviert, die das Gateway faengt.
      expect(e.fehler.code).toBe('speicher_fehler')
      expect(e.fehler.meldung).toContain(ordner())
    } finally {
      spion.mockRestore()
    }
  })

  it('laesst eine Datei aus, die zwischen readdir und stat verschwindet', async () => {
    await fsp.mkdir(ordner(), { recursive: true })
    await legeAn('bleibt.mp4')
    await legeAn('weg.mp4')

    const echteStat = fsp.stat
    const spion = vi.spyOn(fsp, 'stat').mockImplementation(((ziel: string) => {
      if (String(ziel).endsWith('weg.mp4')) {
        return Promise.reject(Object.assign(new Error('geloescht'), { code: 'ENOENT' }))
      }
      return echteStat(ziel)
    }) as unknown as typeof fsp.stat)
    try {
      const e = await listeAusgaben(PROJEKT)
      // Kein Fehler fuer die ganze Liste - die uebrigen Dateien sind ja da.
      expect(e.ok).toBe(true)
      if (!e.ok) return
      expect(e.wert.map((d) => d.dateiname)).toEqual(['bleibt.mp4'])
    } finally {
      spion.mockRestore()
    }
  })
})

describe('Grenzen der Datei', () => {
  // Ohne Kommentarzeilen, sonst schlagen die Verbots-Vermerke im Kopf der Datei an.
  const quelle = readFileSync(
    new URL('../../src/main/project-store/ausgaben.ts', import.meta.url),
    'utf8',
  )
    .split('\n')
    .filter((zeile) => !zeile.trimStart().startsWith('//') && !zeile.trimStart().startsWith('*'))
    .join('\n')

  it.each(['mitD1Lock', 'project.json', 'protokoll', 'planeAutoSpeicherung'])(
    'fasst %s nicht an',
    (verboten) => {
      expect(quelle).not.toContain(verboten)
    },
  )

  it('importiert ProjectStoreFehlercode, statt ihn neu zu deklarieren', () => {
    expect(quelle).toContain("import type { ProjectStoreFehlercode } from './assets'")
    expect(quelle).not.toMatch(/^\s*(export\s+)?type\s+ProjectStoreFehlercode/m)
  })
})
