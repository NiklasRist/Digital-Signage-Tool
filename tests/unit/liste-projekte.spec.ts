import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { readFileSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Verhaltenstest zu #35 (listeProjekte).
//
// Gearbeitet wird auf einem ECHTEN Ordnerbaum unter os.tmpdir(): Die Funktion lebt von
// Ordner-Zeitstempeln, kaputten Dateien und fehlenden Unterordnern - ein gemocktes fs
// wuerde genau das wegabstrahieren. Gemockt sind nur der Datenort (damit der Testlauf
// nicht im Projektordner schreibt) und das D1-Lock (#32), weil ein Test belegen muss,
// dass der Scan INNERHALB des Locks laeuft.
const zustand = vi.hoisted(() => ({ datenOrt: '', imLock: false, lockAufrufe: 0 }))

vi.mock('../../src/main/datenort', () => ({
  ermittleDatenOrt: () => zustand.datenOrt,
}))

vi.mock('../../src/main/project-store/d1-lock', () => ({
  mitD1Lock: async <T>(aktion: () => Promise<T>): Promise<T> => {
    zustand.lockAufrufe += 1
    zustand.imLock = true
    try {
      return await aktion()
    } finally {
      zustand.imLock = false
    }
  },
}))

const { listeProjekte } = await import('../../src/main/project-store/liste-projekte')
const pfade = await import('../../src/main/project-store/pfade')

const ALT = Date.UTC(2026, 0, 1, 10, 0, 0)
const NEU = Date.UTC(2026, 0, 5, 10, 0, 0)

function projektJson(name: string, geaendertAm = new Date(ALT).toISOString()): string {
  return JSON.stringify({
    id: 'steht-absichtlich-anders-da',
    name,
    erstelltAm: '2025-12-24T08:00:00.000Z',
    geaendertAm,
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
  })
}

/** Legt einen Projektordner an; `inhalt`/`sicherung` = Rohtext der beiden Dateien. */
async function legeProjektAn(
  id: string,
  inhalt: string | null,
  sicherung: string | null = null,
): Promise<string> {
  const ordner = pfade.projektOrdner(id)
  await fsp.mkdir(ordner, { recursive: true })
  if (inhalt !== null) {
    await fsp.writeFile(path.join(ordner, 'project.json'), inhalt)
  }
  if (sicherung !== null) {
    await fsp.writeFile(path.join(ordner, 'project.json.bak'), sicherung)
  }
  return ordner
}

async function legeDateienAn(ordner: string, ...namen: string[]): Promise<void> {
  await fsp.mkdir(ordner, { recursive: true })
  for (const name of namen) {
    await fsp.writeFile(path.join(ordner, name), 'x')
  }
}

beforeEach(async () => {
  zustand.datenOrt = await fsp.mkdtemp(path.join(os.tmpdir(), 'projekte-'))
  zustand.lockAufrufe = 0
})

afterEach(async () => {
  await fsp.rm(zustand.datenOrt, { recursive: true, force: true })
})

describe('listeProjekte (#35)', () => {
  it('liefert die Metadaten eines intakten Projekts, mit dem Ordnernamen als id', async () => {
    await legeProjektAn('p1', projektJson('Sommeraktion'))

    const e = await listeProjekte()
    expect(e.ok).toBe(true)
    if (!e.ok) return
    expect(e.wert).toEqual([
      {
        id: 'p1',
        name: 'Sommeraktion',
        erstelltAm: '2025-12-24T08:00:00.000Z',
        geaendertAm: new Date(ALT).toISOString(),
        ordner: 'p1',
        beschaedigt: false,
        anzahlMedien: 0,
        anzahlAusgaben: 0,
      },
    ])
  })

  it('nimmt die Metadaten aus der .bak, wenn die project.json kaputt ist', async () => {
    await legeProjektAn('p1', '{ das ist kein JSON', projektJson('Gerettet'))

    const e = await listeProjekte()
    expect(e.ok).toBe(true)
    if (!e.ok) return
    expect(e.wert[0]?.name).toBe('Gerettet')
    expect(e.wert[0]?.beschaedigt).toBe(false)
  })

  it('kennzeichnet ein Projekt ohne lesbare project.json und .bak, statt es wegzulassen', async () => {
    const ordner = await legeProjektAn('kaputt', '{ kaputt', 'auch kaputt')
    await fsp.utimes(ordner, new Date(NEU), new Date(NEU))

    const e = await listeProjekte()
    expect(e.ok).toBe(true)
    if (!e.ok) return
    expect(e.wert).toHaveLength(1)
    expect(e.wert[0]?.beschaedigt).toBe(true)
    // Der Ordnername ist die Behelfs-Bezeichnung - das Einzige, womit der Nutzer den
    // Ordner wiederfindet.
    expect(e.wert[0]?.name).toBe('kaputt')
    expect(e.wert[0]?.geaendertAm).toBe(new Date(NEU).toISOString())
    expect(e.wert[0]?.erstelltAm).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/)
  })

  it('listet ein intaktes und ein beschaedigtes Projekt nebeneinander', async () => {
    await legeProjektAn('heil', projektJson('Heil'))
    await legeProjektAn('kaputt', null)

    const e = await listeProjekte()
    expect(e.ok).toBe(true)
    if (!e.ok) return
    expect(e.wert.map((p) => [p.id, p.beschaedigt]).sort()).toEqual([
      ['heil', false],
      ['kaputt', true],
    ])
  })

  it('sortiert das zuletzt geaenderte Projekt nach vorn', async () => {
    await legeProjektAn('alt', projektJson('Alt', new Date(ALT).toISOString()))
    await legeProjektAn('neu', projektJson('Neu', new Date(NEU).toISOString()))

    const e = await listeProjekte()
    expect(e.ok).toBe(true)
    if (!e.ok) return
    expect(e.wert.map((p) => p.id)).toEqual(['neu', 'alt'])
  })

  it('liefert bei fehlendem projects-Ordner eine leere Liste und legt ihn NICHT an', async () => {
    const e = await listeProjekte()
    expect(e).toEqual({ ok: true, wert: [] })
    await expect(fsp.stat(path.dirname(pfade.projektOrdner('x')))).rejects.toMatchObject({
      code: 'ENOENT',
    })
  })

  it('laesst lose Dateien in projects/ aus - ein Projekt ist ein Ordner', async () => {
    await legeProjektAn('p1', projektJson('Echt'))
    await fsp.writeFile(path.join(path.dirname(pfade.projektOrdner('x')), 'notiz.txt'), 'x')

    const e = await listeProjekte()
    expect(e.ok).toBe(true)
    if (!e.ok) return
    expect(e.wert.map((p) => p.id)).toEqual(['p1'])
  })
})

describe('Zaehlung aus dem Ordner', () => {
  it('zaehlt die Dateien in media/ ohne Unterordner und ohne Endungspruefung', async () => {
    await legeProjektAn('p1', projektJson('P1'))
    await legeDateienAn(pfade.medienOrdner('p1'), 'a.mp4', 'b.jpg', 'c.ohne-endung')
    await fsp.mkdir(path.join(pfade.medienOrdner('p1'), 'unterordner'))

    const e = await listeProjekte()
    expect(e.ok).toBe(true)
    if (!e.ok) return
    expect(e.wert[0]?.anzahlMedien).toBe(3)
  })

  it('zaehlt in output/ nur fertige .mp4, unabhaengig von der Schreibweise', async () => {
    await legeProjektAn('p1', projektJson('P1'))
    await legeDateienAn(pfade.ausgabeOrdner('p1'), 'a.mp4', 'B.MP4', 'c.mp4.part', 'd.tmp')
    await fsp.mkdir(path.join(pfade.ausgabeOrdner('p1'), 'ordner.mp4'))

    const e = await listeProjekte()
    expect(e.ok).toBe(true)
    if (!e.ok) return
    expect(e.wert[0]?.anzahlAusgaben).toBe(2)
  })

  it('zaehlt auch bei beschaedigt: true aus dem Ordner - der Beweis gegen project.json', async () => {
    // Genau hier ist "wie viele Medien?" die eigentliche Frage: Die project.json ist
    // unlesbar, aber die Arbeit des Nutzers liegt vollstaendig auf der Platte.
    await legeProjektAn('kaputt', '{ kaputt')
    await legeDateienAn(pfade.medienOrdner('kaputt'), 'a', 'b', 'c', 'd', 'e')

    const e = await listeProjekte()
    expect(e.ok).toBe(true)
    if (!e.ok) return
    expect(e.wert[0]).toMatchObject({ beschaedigt: true, anzahlMedien: 5, anzahlAusgaben: 0 })
  })
})

describe('Lock und Fehlerpfade', () => {
  it('scannt INNERHALB des D1-Locks, nicht daneben', async () => {
    await legeProjektAn('p1', projektJson('P1'))
    const beobachtet: boolean[] = []
    const echt = fsp.readdir
    const spion = vi.spyOn(fsp, 'readdir').mockImplementation(((...args: unknown[]) => {
      beobachtet.push(zustand.imLock)
      return (echt as (...a: unknown[]) => unknown)(...args)
    }) as unknown as typeof fsp.readdir)
    try {
      await listeProjekte()
    } finally {
      spion.mockRestore()
    }
    expect(beobachtet.length).toBeGreaterThan(0)
    expect(beobachtet.every(Boolean)).toBe(true)
    // Genau EIN Lock-Abschnitt fuer den ganzen Scan: Ein Lock je Projekt liesse das
    // Fenster zwischen zwei Eintraegen offen, gegen das es genommen wird.
    expect(zustand.lockAufrufe).toBe(1)
  })

  it('meldet speicher_fehler, wenn das projects-Verzeichnis selbst nicht lesbar ist', async () => {
    // EACCES wird gestellt und nicht auf der Platte erzeugt: chmod ist unter Windows
    // wirkungslos, der Fall waere dort sonst ungetestet.
    const spion = vi
      .spyOn(fsp, 'readdir')
      .mockRejectedValue(Object.assign(new Error('kein Zutritt'), { code: 'EACCES' }))
    try {
      const e = await listeProjekte()
      expect(e.ok).toBe(false)
      if (e.ok) return
      expect(e.fehler.code).toBe('speicher_fehler')
    } finally {
      spion.mockRestore()
    }
  })

  it('macht aus einem unlesbaren media/ keine Fehlermeldung, sondern eine 0', async () => {
    await legeProjektAn('p1', projektJson('P1'))
    await legeDateienAn(pfade.medienOrdner('p1'), 'a', 'b')
    const echt = fsp.readdir
    const spion = vi.spyOn(fsp, 'readdir').mockImplementation(((ziel: string, ...rest: unknown[]) => {
      if (String(ziel) === pfade.medienOrdner('p1')) {
        return Promise.reject(Object.assign(new Error('kein Zutritt'), { code: 'EACCES' }))
      }
      return (echt as (...a: unknown[]) => unknown)(ziel, ...rest)
    }) as unknown as typeof fsp.readdir)
    try {
      const e = await listeProjekte()
      expect(e.ok).toBe(true)
      if (!e.ok) return
      expect(e.wert[0]?.anzahlMedien).toBe(0)
    } finally {
      spion.mockRestore()
    }
  })
})

describe('Grenzen der Datei', () => {
  // Ohne Kommentare, sonst schlagen die Vermerke im Kopf und die Feldkommentare der
  // verbindlichen Signatur an ("Dateien in media/", "fertige .mp4 in output/").
  const quelle = readFileSync(
    new URL('../../src/main/project-store/liste-projekte.ts', import.meta.url),
    'utf8',
  )
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((zeile) => zeile.replace(/\/\/.*$/, ''))
    .join('\n')

  it.each(['media', 'output'])('bildet keinen %s-Pfad selbst', (literal) => {
    expect(quelle).not.toContain(literal)
  })

  it.each(['writeFile', 'rename', 'mkdir', 'unlink', 'rm('])('schreibt nicht (%s)', (verboten) => {
    expect(quelle).not.toContain(verboten)
  })

  it('holt die Ordnerpfade aus der Pfad-Autoritaet und nimmt das Lock', () => {
    expect(quelle).toContain('medienOrdner(')
    expect(quelle).toContain('ausgabeOrdner(')
    expect(quelle).toContain('mitD1Lock(')
  })
})
