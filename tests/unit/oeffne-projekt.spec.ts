import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Project } from '../../src/shared/contracts/project'

// Verhaltenstest zu #34 (öffneProjekt).
//
// Gearbeitet wird auf einem ECHTEN Ordnerbaum unter os.tmpdir(): Die Funktion lebt von
// kaputten Dateien, fehlenden Ordnern und dem Rueckfall auf die .bak - ein gemocktes fs
// wuerde genau das wegabstrahieren. Gemockt sind der Datenort (damit der Lauf nicht im
// Projektordner schreibt), das D1-Lock (#32, damit ein Test das Lesen IM Lock belegen
// kann), der config-store (#27, dessen Fehlerfall sonst nicht herstellbar ist) und
// schreibeProjekt (#46) - Letzteres nur, um den Sofort-Flush zu zaehlen und auf Kommando
// scheitern zu lassen; sonst laeuft es echt.
const zustand = vi.hoisted(() => ({
  datenOrt: '',
  imLock: false,
  konfigFehler: false,
  konfigAufrufe: [] as (string | null)[],
  schreibFehler: false,
  geschrieben: [] as string[],
}))

vi.mock('../../src/main/datenort', () => ({
  ermittleDatenOrt: () => zustand.datenOrt,
}))

vi.mock('../../src/main/project-store/d1-lock', () => ({
  mitD1Lock: async <T>(aktion: () => Promise<T>): Promise<T> => {
    zustand.imLock = true
    try {
      return await aktion()
    } finally {
      zustand.imLock = false
    }
  },
}))

vi.mock('../../src/main/config-store/setze-aktives-projekt', () => ({
  setzeAktivesProjekt: (projektId: string | null) => {
    zustand.konfigAufrufe.push(projektId)
    return Promise.resolve(
      zustand.konfigFehler
        ? { ok: false, fehler: { code: 'speicher_fehler', meldung: 'Test: config.json gesperrt' } }
        : { ok: true, wert: undefined },
    )
  },
}))

vi.mock('../../src/main/project-store/schreibe-projekt', async () => {
  const echt = await vi.importActual<
    typeof import('../../src/main/project-store/schreibe-projekt')
  >('../../src/main/project-store/schreibe-projekt')
  return {
    schreibeProjekt: (projekt: Project) => {
      zustand.geschrieben.push(projekt.id)
      return zustand.schreibFehler
        ? Promise.resolve({
            ok: false,
            fehler: { code: 'speicher_fehler', meldung: 'Test: Platte voll' },
          })
        : echt.schreibeProjekt(projekt)
    },
  }
})

const { öffneProjekt } = await import('../../src/main/project-store/oeffne-projekt')
const { holeAktivesProjekt, merkeAktivesProjekt } = await import(
  '../../src/main/project-store/aktives-projekt'
)
const { verwirfGeplanteSpeicherung } = await import('../../src/main/project-store/auto-speichern')
const { projektOrdner } = await import('../../src/main/project-store/pfade')

function projektDaten(id: string, abweichung: Record<string, unknown> = {}): string {
  return JSON.stringify({
    id,
    name: `Projekt ${id}`,
    erstelltAm: '2026-08-01T08:00:00.000Z',
    geaendertAm: '2026-08-01T08:00:00.000Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
    ...abweichung,
  })
}

/** Legt einen Projektordner an; `inhalt`/`sicherung` = Rohtext der beiden Dateien. */
async function legeProjektAn(
  id: string,
  inhalt: string | null,
  sicherung: string | null = null,
): Promise<void> {
  const ordner = projektOrdner(id)
  await fsp.mkdir(ordner, { recursive: true })
  if (inhalt !== null) {
    await fsp.writeFile(path.join(ordner, 'project.json'), inhalt)
  }
  if (sicherung !== null) {
    await fsp.writeFile(path.join(ordner, 'project.json.bak'), sicherung)
  }
}

beforeEach(async () => {
  zustand.datenOrt = await fsp.mkdtemp(path.join(os.tmpdir(), 'signage-oeffne-'))
  zustand.konfigFehler = false
  zustand.konfigAufrufe = []
  zustand.schreibFehler = false
  zustand.geschrieben = []
  // Der Halter (#192) ist modulweit - jeder Test beginnt ohne offenes Projekt.
  merkeAktivesProjekt(null)
})

afterEach(async () => {
  await fsp.rm(zustand.datenOrt, { recursive: true, force: true })
})

describe('öffneProjekt (#34)', () => {
  it('laedt ein intaktes Projekt, merkt es als aktiv und vermerkt es im config-store', async () => {
    await legeProjektAn('p1', projektDaten('p1'))

    const e = await öffneProjekt('p1')

    expect(e.ok).toBe(true)
    if (!e.ok) return
    expect(e.wert).toMatchObject({ id: 'p1', name: 'Projekt p1', liste: [] })
    // Der Halter bekommt DIESELBE Referenz, die der Aufrufer erhaelt - keine Kopie (#192).
    expect(holeAktivesProjekt()).toBe(e.wert)
    expect(zustand.konfigAufrufe).toEqual(['p1'])
  })

  it('faellt auf project.json.bak zurueck, wenn project.json defekt ist', async () => {
    await legeProjektAn('p1', '{ das ist kein JSON', projektDaten('p1', { name: 'Gerettet' }))

    const e = await öffneProjekt('p1')

    expect(e.ok).toBe(true)
    if (!e.ok) return
    expect(e.wert.name).toBe('Gerettet')
    // Repariert wird nichts: die kaputte Datei bleibt liegen, wie sie ist.
    expect(await fsp.readFile(path.join(projektOrdner('p1'), 'project.json'), 'utf8')).toBe(
      '{ das ist kein JSON',
    )
  })

  it('faellt auch dann auf die .bak zurueck, wenn nur ein Pflichtfeld fehlt', async () => {
    // Strenger als listeProjekte (#35), das sich mit einem `name` begnuegt: Was hier geladen
    // wird, ist der lebende Stand, auf dem jede Instant-Operation arbeitet.
    const ohneListe = JSON.parse(projektDaten('p1')) as Record<string, unknown>
    delete ohneListe.liste
    await legeProjektAn('p1', JSON.stringify(ohneListe), projektDaten('p1', { name: 'Gerettet' }))

    const e = await öffneProjekt('p1')

    expect(e.ok).toBe(true)
    if (!e.ok) return
    expect(e.wert.name).toBe('Gerettet')
  })

  it('meldet einen Fehler, wenn beide Fassungen unbrauchbar sind, und laedt nichts', async () => {
    await legeProjektAn('p1', '{ kaputt', 'auch kaputt')

    const e = await öffneProjekt('p1')

    expect(e.ok).toBe(false)
    if (e.ok) return
    // Seit dem 12.08.2026 IST der Grund der Code - kein Anhang mehr in `daten`.
    expect(e.fehler.code).toBe('speicher_fehler')
    // Kein leerer Start: Der Halter bleibt unberuehrt (TK 9.5.4).
    expect(holeAktivesProjekt()).toBeNull()
    expect(zustand.konfigAufrufe).toEqual([])
  })

  it('meldet nicht_gefunden, wenn es den Projektordner nicht gibt', async () => {
    const e = await öffneProjekt('gibtesnicht')

    expect(e.ok).toBe(false)
    if (e.ok) return
    expect(e.fehler.code).toBe('nicht_gefunden')
  })

  it('laedt eine zu neue schemaVersion nicht - und weicht dafuer NICHT auf die .bak aus', async () => {
    await legeProjektAn(
      'p1',
      projektDaten('p1', { schemaVersion: 99 }),
      projektDaten('p1', { name: 'Alt' }),
    )

    const e = await öffneProjekt('p1')

    expect(e.ok).toBe(false)
    if (e.ok) return
    // Die Unterscheidung, die #48 an diese Datei zurueckgegeben hat: "zu neu" ist etwas anderes
    // als "Migration fehlt" - und eine aeltere .bak zu laden waere stiller Datenverlust.
    // Eigener Code, damit die Oberflaeche "zu neu" von "Speichern fehlgeschlagen"
    // unterscheiden kann - die eine Lage behebt ein Update, die andere Plattenplatz.
    expect(e.fehler.code).toBe('schema_zu_neu')
    expect(holeAktivesProjekt()).toBeNull()
  })

  it('nimmt die Kennung aus dem Ordnernamen, nicht aus der Datei', async () => {
    await legeProjektAn('p1', projektDaten('eine-voellig-andere-id'))

    const e = await öffneProjekt('p1')

    expect(e.ok).toBe(true)
    if (!e.ok) return
    // Sonst schriebe jedes Auto-Speichern (#46 bildet den Pfad aus projekt.id) in einen fremden
    // Ordner, waehrend die Medien dieses Projekts hier liegen bleiben.
    expect(e.wert.id).toBe('p1')
  })

  it('speichert das bisher offene Projekt, bevor es wechselt', async () => {
    await legeProjektAn('p1', projektDaten('p1'))
    await legeProjektAn('p2', projektDaten('p2'))
    await öffneProjekt('p1')

    const e = await öffneProjekt('p2')

    expect(e.ok).toBe(true)
    expect(zustand.geschrieben).toEqual(['p1'])
    expect(holeAktivesProjekt()?.id).toBe('p2')
  })

  it('wechselt nicht, wenn das offene Projekt nicht gespeichert werden kann', async () => {
    await legeProjektAn('p1', projektDaten('p1'))
    await legeProjektAn('p2', projektDaten('p2'))
    await öffneProjekt('p1')
    zustand.schreibFehler = true

    const e = await öffneProjekt('p2')

    expect(e.ok).toBe(false)
    if (e.ok) return
    // Seit dem 12.08.2026 IST der Grund der Code - kein Anhang mehr in `daten`.
    expect(e.fehler.code).toBe('speicher_fehler')
    // Sonst verloere der Beenden-Flush (#47) die Arbeit am alten Projekt lautlos: Er schreibt
    // nur das AKTIVE Projekt.
    expect(holeAktivesProjekt()?.id).toBe('p1')

    // Der gescheiterte Flush hat einen Wiederholtermin gestellt - er wird hier abgeraeumt,
    // damit er nicht in einen spaeteren Test hineinlaeuft.
    zustand.schreibFehler = false
    verwirfGeplanteSpeicherung('p1')
  })

  it('wechselt nicht, wenn der config-store den Vermerk nicht schreiben kann', async () => {
    await legeProjektAn('p1', projektDaten('p1'))
    zustand.konfigFehler = true

    const e = await öffneProjekt('p1')

    expect(e.ok).toBe(false)
    if (e.ok) return
    // Kein Halbzustand: ein Projekt im Speicher, dessen Kennung nirgends steht, faende der
    // naechste Start nicht wieder.
    expect(holeAktivesProjekt()).toBeNull()
  })

  it('gibt beim erneuten Oeffnen desselben Projekts dieselbe Referenz heraus', async () => {
    await legeProjektAn('p1', projektDaten('p1'))
    const erste = await öffneProjekt('p1')
    expect(erste.ok).toBe(true)
    if (!erste.ok) return
    erste.wert.name = 'Im Speicher umbenannt'

    const zweite = await öffneProjekt('p1')

    expect(zweite.ok).toBe(true)
    if (!zweite.ok) return
    // Ein zweites Objekt fuer dasselbe Projekt waere die von #192 ausgeschlossene zweite
    // Wahrheit - und die Umbenennung waere weg.
    expect(zweite.wert).toBe(erste.wert)
    expect(zweite.wert.name).toBe('Im Speicher umbenannt')
  })

  it('liest INNERHALB des D1-Locks', async () => {
    await legeProjektAn('p1', projektDaten('p1'))
    const beobachtet: boolean[] = []
    const echt = fsp.readFile
    const spion = vi.spyOn(fsp, 'readFile').mockImplementation(((...args: unknown[]) => {
      beobachtet.push(zustand.imLock)
      return (echt as (...a: unknown[]) => unknown)(...args)
    }) as unknown as typeof fsp.readFile)
    try {
      await öffneProjekt('p1')
    } finally {
      spion.mockRestore()
    }

    expect(beobachtet.length).toBeGreaterThan(0)
    expect(beobachtet.every(Boolean)).toBe(true)
  })

  it('weist eine Kennung ab, die kein einzelner Ordner unter projects/ ist', async () => {
    const e = await öffneProjekt('../..')

    expect(e.ok).toBe(false)
    if (e.ok) return
    expect(e.fehler.code).toBe('ungueltige_eingabe')
  })
})
