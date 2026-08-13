import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { projektOrdner } from '../../src/main/project-store/pfade'

import type { Auftrag } from '../../src/shared/contracts/auftrag'

// Verhaltenstest zu #55 (Q2-Wiederholungsspeicher).
//
// Gearbeitet wird auf einer ECHTEN Platte in einem eigenen Temp-Ordner: Der Kern des Issues ist,
// dass ein Fehlschlag einen Neustart ueberlebt - und das laesst sich nur an einer wirklich
// geschriebenen Datei zeigen. Gemockt sind genau zwei Dinge: der Datenort (damit der Testlauf
// nicht im Projektordner herumschreibt) und die Lesefunktion aus #69, aber nur als ZAEHLER - die
// DoD verlangt den Nachweis, dass holeQ2Stand die Datei nicht anfasst.
const zustand = vi.hoisted(() => ({ datenOrt: '', lesezugriffe: 0 }))

vi.mock('../../src/main/datenort', () => ({
  ermittleDatenOrt: () => zustand.datenOrt,
}))

vi.mock('../../src/main/auftrags-manager/schreibe-queue-json', async () => {
  const echt = await vi.importActual<
    typeof import('../../src/main/auftrags-manager/schreibe-queue-json')
  >('../../src/main/auftrags-manager/schreibe-queue-json')
  return {
    ...echt,
    leseQueueDatei: <T>(pfad: string, fallback: T) => {
      zustand.lesezugriffe += 1
      return echt.leseQueueDatei<T>(pfad, fallback)
    },
  }
})

type Modul = typeof import('../../src/main/auftrags-manager/q2-wiederholung')

/**
 * Das Modul haelt den zuletzt geladenen Q2-Stand im Speicher. Ohne einen frischen Import
 * schleppte jeder Test den Stand des vorigen mit - und "holeQ2Stand liefert vor dem ersten
 * ladeQ2 null" waere nur im allerersten Test wahr.
 */
async function frisch(): Promise<Modul> {
  vi.resetModules()
  return import('../../src/main/auftrags-manager/q2-wiederholung')
}

const PROJEKT = '3f2a1c4e-0000-4000-8000-0123456789ab'
const ANDERES = '9b7d5e2a-0000-4000-8000-abcdef012345'

const q2Pfad = (projektId = PROJEKT): string =>
  path.join(projektOrdner(projektId), 'queue-retry.json')

function auftrag(auftragId: string, versuche: number, meldung: string): Auftrag {
  return {
    auftragId,
    art: 'import',
    status: 'fehlgeschlagen',
    label: `Import ${auftragId}`,
    payload: { projektId: PROJEKT, quellPfad: '/quelle/clip.mp4' },
    fortschritt: null,
    versuche,
    fehler: { code: 'kopieren_fehlgeschlagen', meldung },
    ergebnis: null,
    erstelltAm: '2026-08-13T10:00:00.000Z',
  }
}

const vermerk = (dateiname: string): { dateiname: string; vermerktAm: string } => ({
  dateiname,
  vermerktAm: '2026-08-12T08:00:00.000Z',
})

async function legeAn(roh: string, projektId = PROJEKT): Promise<void> {
  await fsp.mkdir(projektOrdner(projektId), { recursive: true })
  await fsp.writeFile(q2Pfad(projektId), roh, 'utf8')
}

async function rohText(projektId = PROJEKT): Promise<string> {
  return fsp.readFile(q2Pfad(projektId), 'utf8')
}

async function aufDerPlatte(projektId = PROJEKT): Promise<{
  schemaVersion: unknown
  auftraege: Auftrag[]
  pendingDeletions: { dateiname: string; vermerktAm: string }[]
}> {
  return JSON.parse(await rohText(projektId)) as {
    schemaVersion: unknown
    auftraege: Auftrag[]
    pendingDeletions: { dateiname: string; vermerktAm: string }[]
  }
}

beforeEach(async () => {
  zustand.datenOrt = await fsp.mkdtemp(path.join(os.tmpdir(), 'q2-'))
  zustand.lesezugriffe = 0
})

afterEach(async () => {
  await fsp.rm(zustand.datenOrt, { recursive: true, force: true })
})

describe('ladeQ2 (#55)', () => {
  it('liefert ohne vorhandene Datei eine leere, gueltige Q2 und legt dabei nichts an', async () => {
    const { ladeQ2 } = await frisch()

    const e = await ladeQ2(PROJEKT)

    expect(e).toEqual({
      ok: true,
      wert: { schemaVersion: 1, auftraege: [], pendingDeletions: [] },
    })
    await expect(fsp.access(q2Pfad())).rejects.toThrow()
  })

  it('reicht speicher_fehler durch, statt eine leere Q2 vorzutaeuschen', async () => {
    // Der Kern von FA-17: Eine kaputte Datei als "keine Fehlschlaege" auszugeben, liesse den
    // Nutzer glauben, alles sei durchgelaufen.
    await legeAn('{"auftraege": [{"auftragId"')

    const { ladeQ2, holeQ2Stand } = await frisch()
    const e = await ladeQ2(PROJEKT)

    expect(e.ok).toBe(false)
    if (!e.ok) expect(e.fehler.code).toBe('speicher_fehler')
    expect(holeQ2Stand()).toBeNull()
  })

  it('weist eine fremde schemaVersion ab und laesst die Datei unveraendert', async () => {
    const roh = JSON.stringify({ schemaVersion: 2, auftraege: [], pendingDeletions: [] })
    await legeAn(roh)

    const { ladeQ2 } = await frisch()
    const e = await ladeQ2(PROJEKT)

    expect(e.ok).toBe(false)
    if (!e.ok) expect(e.fehler.code).toBe('speicher_fehler')
    expect(await rohText()).toBe(roh)
  })
})

describe('merkeFehlschlag (#55)', () => {
  it('aktualisiert den vorhandenen Eintrag, statt ihn zu verdoppeln', async () => {
    const { merkeFehlschlag } = await frisch()

    await merkeFehlschlag(PROJEKT, auftrag('a-1', 1, 'erster Versuch'))
    const e = await merkeFehlschlag(PROJEKT, auftrag('a-1', 2, 'zweiter Versuch'))

    expect(e).toEqual({ ok: true, wert: undefined })
    const datei = await aufDerPlatte()
    expect(datei.schemaVersion).toBe(1)
    expect(datei.auftraege).toHaveLength(1)
    expect(datei.auftraege[0]?.versuche).toBe(2)
    expect(datei.auftraege[0]?.fehler?.meldung).toBe('zweiter Versuch')
  })

  it('legt einen unbekannten Auftrag an und laesst vorgemerkte Loeschungen stehen', async () => {
    await legeAn(
      JSON.stringify({
        schemaVersion: 1,
        auftraege: [auftrag('a-1', 1, 'alt')],
        pendingDeletions: [vermerk('alt.mp4')],
      }),
    )

    const { merkeFehlschlag } = await frisch()
    await merkeFehlschlag(PROJEKT, auftrag('a-2', 1, 'neu'))

    const datei = await aufDerPlatte()
    expect(datei.auftraege.map((a) => a.auftragId)).toEqual(['a-1', 'a-2'])
    expect(datei.pendingDeletions).toEqual([vermerk('alt.mp4')])
  })

  it('laedt selbst, wenn der gehaltene Stand zu einem anderen Projekt gehoert', async () => {
    // Ohne diese Vorbedingung landete der Fehlschlag lautlos im Stand des fremden Projekts.
    const { ladeQ2, merkeFehlschlag, holeQ2Stand } = await frisch()
    await ladeQ2(ANDERES)

    await merkeFehlschlag(PROJEKT, auftrag('a-1', 1, 'gehoert zu PROJEKT'))

    expect(holeQ2Stand()?.projektId).toBe(PROJEKT)
    expect((await aufDerPlatte()).auftraege).toHaveLength(1)
    await expect(fsp.access(q2Pfad(ANDERES))).rejects.toThrow()
  })
})

describe('streicheAusQ2 (#55)', () => {
  it('meldet ohne Treffer Erfolg und fasst die Datei nicht an', async () => {
    // Einzeilig geschrieben: Ein Schreibvorgang wuerde die Datei eingerueckt und mit
    // Zeilenumbruch neu ablegen, der Vergleich faende ihn also.
    const roh = JSON.stringify({ schemaVersion: 1, auftraege: [], pendingDeletions: [] })
    await legeAn(roh)

    const { streicheAusQ2 } = await frisch()
    const e = await streicheAusQ2(PROJEKT, 'nie-dagewesen')

    expect(e).toEqual({ ok: true, wert: undefined })
    expect(await rohText()).toBe(roh)
  })

  it('entfernt den Eintrag und laesst die vorgemerkten Loeschungen stehen', async () => {
    await legeAn(
      JSON.stringify({
        schemaVersion: 1,
        auftraege: [auftrag('a-1', 1, 'alt'), auftrag('a-2', 1, 'alt')],
        pendingDeletions: [vermerk('alt.mp4')],
      }),
    )

    const { streicheAusQ2, holeQ2Stand } = await frisch()
    await streicheAusQ2(PROJEKT, 'a-1')

    const datei = await aufDerPlatte()
    expect(datei.auftraege.map((a) => a.auftragId)).toEqual(['a-2'])
    expect(datei.pendingDeletions).toEqual([vermerk('alt.mp4')])
    expect(holeQ2Stand()?.datei.auftraege).toHaveLength(1)
  })
})

describe('aenderePendingDeletions (#55)', () => {
  it('aendert nur die Vermerke; holeQ2Stand zeigt sie ohne weiteren Lesezugriff', async () => {
    await legeAn(
      JSON.stringify({
        schemaVersion: 1,
        auftraege: [auftrag('a-1', 1, 'alt')],
        pendingDeletions: [vermerk('alt.mp4')],
      }),
    )

    const { aenderePendingDeletions, holeQ2Stand } = await frisch()
    const e = await aenderePendingDeletions(PROJEKT, (liste) => [...liste, vermerk('neu.mp4')])
    const nachDemSchreiben = zustand.lesezugriffe

    expect(e).toEqual({ ok: true, wert: undefined })
    const stand = holeQ2Stand()
    expect(zustand.lesezugriffe).toBe(nachDemSchreiben)
    expect(stand?.datei.pendingDeletions.map((v) => v.dateiname)).toEqual(['alt.mp4', 'neu.mp4'])
    expect(stand?.datei.auftraege.map((a) => a.auftragId)).toEqual(['a-1'])

    const datei = await aufDerPlatte()
    expect(datei.pendingDeletions.map((v) => v.dateiname)).toEqual(['alt.mp4', 'neu.mp4'])
    expect(datei.auftraege.map((a) => a.auftragId)).toEqual(['a-1'])
  })

  it('weist eine Aenderungsfunktion ohne brauchbare Liste ab und aendert nichts', async () => {
    const roh = JSON.stringify({
      schemaVersion: 1,
      auftraege: [],
      pendingDeletions: [vermerk('alt.mp4')],
    })
    await legeAn(roh)

    const { aenderePendingDeletions, holeQ2Stand } = await frisch()
    const e = await aenderePendingDeletions(
      PROJEKT,
      () => 'keine Liste' as unknown as { dateiname: string; vermerktAm: string }[],
    )

    expect(e.ok).toBe(false)
    if (!e.ok) expect(e.fehler.code).toBe('ungueltige_eingabe')
    expect(await rohText()).toBe(roh)
    expect(holeQ2Stand()?.datei.pendingDeletions).toEqual([vermerk('alt.mp4')])
  })
})

describe('holeQ2Stand (#55)', () => {
  it('ist vor dem ersten ladeQ2 null und liest danach nicht nach', async () => {
    const { ladeQ2, holeQ2Stand } = await frisch()

    expect(holeQ2Stand()).toBeNull()
    expect(zustand.lesezugriffe).toBe(0)

    await ladeQ2(PROJEKT)
    const nachDemLaden = zustand.lesezugriffe

    expect(holeQ2Stand()).toEqual({
      projektId: PROJEKT,
      datei: { schemaVersion: 1, auftraege: [], pendingDeletions: [] },
    })
    expect(zustand.lesezugriffe).toBe(nachDemLaden)
  })

  it('gibt eine Kopie heraus - wer sie umsortiert, veraendert den Bestand nicht', async () => {
    const { merkeFehlschlag, holeQ2Stand } = await frisch()
    await merkeFehlschlag(PROJEKT, auftrag('a-1', 1, 'alt'))

    holeQ2Stand()?.datei.auftraege.pop()

    expect(holeQ2Stand()?.datei.auftraege).toHaveLength(1)
  })

  it('gibt die Auftrags-OBJEKTE dagegen unkopiert heraus - nur die Listen sind neu', async () => {
    // Die Kehrseite des Tests darueber, und sie ist eine Falle: Wer eines dieser Objekte
    // irgendwo einhaengt, wo es veraendert wird, veraendert den Q2-Eintrag. Genau darauf
    // ist #63 beim Bau gestossen - haette es den Eintrag direkt in Q1 gehaengt, saetzte der
    // Torwaechter status und versuche AM Q2-Eintrag, und der Fehlschlag waere verloren
    // (FA-17). Der Test steht hier und nicht dort, weil der Vertrag hier entsteht.
    //
    // ABSICHTLICH KEINE TIEFKOPIE: holeStand (#64) liefert diesen Stand bei jeder
    // Zustandsaenderung ans Panel und braucht die LEBENDEN Objekte, damit der Fortschritt
    // eines laufenden Auftrags aktuell bleibt. Wer das hier auf strukturiertes Klonen
    // umstellt, macht den Fortschrittsbalken still tot - deshalb dieser Test.
    const { merkeFehlschlag, holeQ2Stand } = await frisch()
    const eingereicht = auftrag('a-1', 1, 'alt')
    await merkeFehlschlag(PROJEKT, eingereicht)

    const erstesMal = holeQ2Stand()?.datei.auftraege[0]
    const zweitesMal = holeQ2Stand()?.datei.auftraege[0]

    expect(erstesMal).toBe(zweitesMal)
    expect(erstesMal).toBe(eingereicht)
  })
  it('vergisst den Stand des geloeschten Projekts', async () => {
    // Ohne vergissQ2Stand legte der naechste merkeFehlschlag die queue-retry.json im
    // geloeschten Ordner wieder an - schreibeQueueDatei macht mkdir -p. Dieselbe
    // Fehlerklasse wie A1, nur ueber die Warteschlange statt ueber D1.
    const { ladeQ2, holeQ2Stand, vergissQ2Stand } = await frisch()
    await ladeQ2(PROJEKT)

    vergissQ2Stand(PROJEKT)

    expect(holeQ2Stand()).toBeNull()
  })

  it('laesst den Stand eines ANDEREN Projekts unberuehrt', async () => {
    const { ladeQ2, holeQ2Stand, vergissQ2Stand } = await frisch()
    await ladeQ2(PROJEKT)

    vergissQ2Stand('ein-anderes-projekt')

    expect(holeQ2Stand()?.projektId).toBe(PROJEKT)
  })
})
