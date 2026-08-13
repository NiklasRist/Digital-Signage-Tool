import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { projektOrdner } from '../../src/main/project-store/pfade'

// Verhaltenstest zu #66 (pendingDeletions in Q2 fuehren).
//
// Gearbeitet wird mit dem ECHTEN #55 und dem ECHTEN #69 auf einer echten Platte in einem eigenen
// Temp-Ordner. Der Kern des Issues sitzt an der Naht: dass `auftraege` in derselben Datei
// unberuehrt bleibt und dass in einem Projekt ohne offene Loeschungen gar keine Datei entsteht -
// beides ist an einem Attrappen-#55 nicht zu sehen. Gemockt sind nur der Datenort und zwei
// ZAEHLER: die Schreib-Tuer von #55 und der tatsaechliche Dateischreibvorgang aus #69. Stimmen
// beide Zahlen ueberein, gibt es keinen zweiten Schreibweg.
const zustand = vi.hoisted(() => ({ datenOrt: '', tuerAufrufe: 0, schreibzugriffe: 0 }))

vi.mock('../../src/main/datenort', () => ({
  ermittleDatenOrt: () => zustand.datenOrt,
}))

vi.mock('../../src/main/auftrags-manager/q2-wiederholung', async () => {
  const echt =
    await vi.importActual<typeof import('../../src/main/auftrags-manager/q2-wiederholung')>(
      '../../src/main/auftrags-manager/q2-wiederholung',
    )
  return {
    ...echt,
    aenderePendingDeletions: (
      projektId: string,
      aendere: (liste: { dateiname: string; vermerktAm: string }[]) => {
        dateiname: string
        vermerktAm: string
      }[],
    ) => {
      zustand.tuerAufrufe += 1
      return echt.aenderePendingDeletions(projektId, aendere)
    },
  }
})

vi.mock('../../src/main/auftrags-manager/schreibe-queue-json', async () => {
  const echt =
    await vi.importActual<typeof import('../../src/main/auftrags-manager/schreibe-queue-json')>(
      '../../src/main/auftrags-manager/schreibe-queue-json',
    )
  return {
    ...echt,
    schreibeQueueDatei: (pfad: string, inhalt: unknown) => {
      zustand.schreibzugriffe += 1
      return echt.schreibeQueueDatei(pfad, inhalt)
    },
  }
})

type Modul = typeof import('../../src/main/auftrags-manager/pending-deletions')

/**
 * #55 haelt den zuletzt geladenen Q2-Stand im Speicher, und der ueberlebt hier `vi.resetModules`:
 * Zurueckgesetzt wird die Mock-Fabrik, das ueber `vi.importActual` geholte echte Modul dahinter
 * bleibt dasselbe. Ohne das Vergessen liest der naechste Test den Stand des vorigen aus dem RAM -
 * dann sieht `holePendingDeletions` eine praeparierte Datei gar nicht mehr an, und ein `merke`
 * haelt einen Eintrag fuer schon vorhanden, den es im neuen Temp-Ordner nicht gibt.
 */
async function frisch(): Promise<Modul> {
  vi.resetModules()
  const q2 = await import('../../src/main/auftrags-manager/q2-wiederholung')
  q2.vergissQ2Stand(PROJEKT)
  return import('../../src/main/auftrags-manager/pending-deletions')
}

const PROJEKT = '3f2a1c4e-0000-4000-8000-0123456789ab'
const DATEI_A = '11111111-2222-4333-8444-555555555555.mp4'
const DATEI_B = '66666666-7777-4888-8999-aaaaaaaaaaaa.jpg'

const q2Pfad = (projektId = PROJEKT): string =>
  path.join(projektOrdner(projektId), 'queue-retry.json')

const AUFTRAEGE = [
  {
    auftragId: 'a1',
    art: 'import',
    status: 'fehlgeschlagen',
    label: 'Import clip.mp4',
    payload: { projektId: PROJEKT, quellPfad: '/quelle/clip.mp4' },
    fortschritt: null,
    versuche: 1,
    fehler: { code: 'kopieren_fehlgeschlagen', meldung: 'Platte voll' },
    ergebnis: null,
    erstelltAm: '2026-08-13T10:00:00.000Z',
  },
]

async function legeQ2An(inhalt: unknown): Promise<void> {
  await fsp.mkdir(projektOrdner(PROJEKT), { recursive: true })
  await fsp.writeFile(q2Pfad(), JSON.stringify(inhalt), 'utf8')
}

async function liesQ2(): Promise<{
  schemaVersion: number
  auftraege: unknown[]
  pendingDeletions: { dateiname: string; vermerktAm: string }[]
}> {
  return JSON.parse(await fsp.readFile(q2Pfad(), 'utf8'))
}

async function gibtEs(pfad: string): Promise<boolean> {
  try {
    await fsp.stat(pfad)
    return true
  } catch {
    return false
  }
}

beforeEach(async () => {
  zustand.datenOrt = await fsp.mkdtemp(path.join(os.tmpdir(), 'pending-deletions-'))
  zustand.tuerAufrufe = 0
  zustand.schreibzugriffe = 0
})

afterEach(async () => {
  await fsp.rm(zustand.datenOrt, { recursive: true, force: true })
})

describe('holePendingDeletions', () => {
  it('liefert ohne queue-retry.json eine leere Liste und legt keine Datei an', async () => {
    const { holePendingDeletions } = await frisch()

    const ergebnis = await holePendingDeletions(PROJEKT)

    expect(ergebnis).toEqual({ ok: true, wert: [] })
    expect(await gibtEs(q2Pfad())).toBe(false)
  })

  it('reicht eine unlesbare Datei als speicher_fehler durch, statt sie als leer auszugeben', async () => {
    await legeQ2An('kein objekt')
    const { holePendingDeletions } = await frisch()

    const ergebnis = await holePendingDeletions(PROJEKT)

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('speicher_fehler')
    }
  })

  it('weist eine leere Projekt-ID ab', async () => {
    const { holePendingDeletions } = await frisch()

    const ergebnis = await holePendingDeletions('')

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
    }
  })
})

describe('merkePendingDeletion', () => {
  it('legt genau einen Eintrag mit dateiname und vermerktAm an', async () => {
    const { merkePendingDeletion } = await frisch()

    expect(await merkePendingDeletion(PROJEKT, DATEI_A)).toEqual({ ok: true, wert: undefined })

    const datei = await liesQ2()
    expect(datei.pendingDeletions).toHaveLength(1)
    expect(datei.pendingDeletions[0]?.dateiname).toBe(DATEI_A)
    expect(Date.parse(datei.pendingDeletions[0]?.vermerktAm ?? '')).not.toBeNaN()
  })

  it('bleibt beim zweiten Aufruf bei einem Eintrag und laesst dessen vermerktAm stehen', async () => {
    const { merkePendingDeletion } = await frisch()

    await merkePendingDeletion(PROJEKT, DATEI_A)
    const vorher = (await liesQ2()).pendingDeletions[0]?.vermerktAm

    // Ohne Wartezeit waere ein Auffrischen des Zeitstempels nicht von "unveraendert" zu
    // unterscheiden: new Date().toISOString() haette in derselben Millisekunde denselben Wert.
    await new Promise((fertig) => setTimeout(fertig, 5))
    expect(await merkePendingDeletion(PROJEKT, DATEI_A)).toEqual({ ok: true, wert: undefined })

    const datei = await liesQ2()
    expect(datei.pendingDeletions).toHaveLength(1)
    expect(datei.pendingDeletions[0]?.vermerktAm).toBe(vorher)
  })
})

describe('streichePendingDeletion', () => {
  it('entfernt genau den benannten Eintrag und laesst die uebrigen stehen', async () => {
    const { merkePendingDeletion, streichePendingDeletion, holePendingDeletions } = await frisch()
    await merkePendingDeletion(PROJEKT, DATEI_A)
    await merkePendingDeletion(PROJEKT, DATEI_B)

    expect(await streichePendingDeletion(PROJEKT, DATEI_A)).toEqual({ ok: true, wert: undefined })

    expect(await holePendingDeletions(PROJEKT)).toEqual({
      ok: true,
      wert: [expect.objectContaining({ dateiname: DATEI_B })],
    })
    expect((await liesQ2()).pendingDeletions.map((e) => e.dateiname)).toEqual([DATEI_B])
  })

  it('ist ohne Treffer erfolgreich und laesst die Datei unveraendert', async () => {
    const { merkePendingDeletion, streichePendingDeletion } = await frisch()
    await merkePendingDeletion(PROJEKT, DATEI_A)
    const vorher = await fsp.readFile(q2Pfad(), 'utf8')

    expect(await streichePendingDeletion(PROJEKT, DATEI_B)).toEqual({ ok: true, wert: undefined })

    expect(await fsp.readFile(q2Pfad(), 'utf8')).toBe(vorher)
  })

  it('legt in einem Projekt ohne offene Loeschungen keine Datei an', async () => {
    const { streichePendingDeletion } = await frisch()

    expect(await streichePendingDeletion(PROJEKT, DATEI_A)).toEqual({ ok: true, wert: undefined })

    expect(await gibtEs(q2Pfad())).toBe(false)
  })
})

describe('Eingabepruefung', () => {
  it.each(['unterordner/datei.mp4', 'unterordner\\datei.mp4', '../datei.mp4', 'C:datei.mp4', ''])(
    'weist %j mit ungueltige_eingabe ab, ohne die Datei anzufassen',
    async (dateiname) => {
      const { merkePendingDeletion, streichePendingDeletion } = await frisch()

      for (const ergebnis of [
        await merkePendingDeletion(PROJEKT, dateiname),
        await streichePendingDeletion(PROJEKT, dateiname),
      ]) {
        expect(ergebnis.ok).toBe(false)
        if (!ergebnis.ok) {
          expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
        }
      }
      expect(await gibtEs(q2Pfad())).toBe(false)
      expect(zustand.tuerAufrufe).toBe(0)
    },
  )
})

describe('Naht zu #55', () => {
  it('laesst eine vorbelegte auftraege-Liste bei allen drei Funktionen unveraendert', async () => {
    await legeQ2An({ schemaVersion: 1, auftraege: AUFTRAEGE, pendingDeletions: [] })
    const { holePendingDeletions, merkePendingDeletion, streichePendingDeletion } = await frisch()

    await holePendingDeletions(PROJEKT)
    await merkePendingDeletion(PROJEKT, DATEI_A)
    await streichePendingDeletion(PROJEKT, DATEI_A)

    const datei = await liesQ2()
    expect(datei.auftraege).toEqual(AUFTRAEGE)
    expect(datei.pendingDeletions).toEqual([])
  })

  it('schreibt ausschliesslich ueber aenderePendingDeletions', async () => {
    const { holePendingDeletions, merkePendingDeletion, streichePendingDeletion } = await frisch()

    await merkePendingDeletion(PROJEKT, DATEI_A)
    await merkePendingDeletion(PROJEKT, DATEI_A)
    await merkePendingDeletion(PROJEKT, DATEI_B)
    await holePendingDeletions(PROJEKT)
    await streichePendingDeletion(PROJEKT, DATEI_A)
    await streichePendingDeletion(PROJEKT, DATEI_A)

    // Jeder Gang durch die Tuer von #55 schreibt genau einmal. Gleiche Zahlen heissen: kein
    // Schreibvorgang ist an #55 vorbeigelaufen - und die beiden Wiederholungen haben, weil sie
    // nichts zu aendern hatten, gar nicht erst geschrieben.
    expect(zustand.tuerAufrufe).toBe(3)
    expect(zustand.schreibzugriffe).toBe(3)
  })
})

describe('kein Aufraeumen', () => {
  it('behaelt 200 Eintraege und einen weit zurueckliegenden Vermerk', async () => {
    const alt = { dateiname: DATEI_A, vermerktAm: '2019-01-01T00:00:00.000Z' }
    const viele = [
      alt,
      ...Array.from({ length: 199 }, (_, i) => ({
        dateiname: `${String(i).padStart(8, '0')}-2222-4333-8444-555555555555.mp4`,
        vermerktAm: '2026-08-13T10:00:00.000Z',
      })),
    ]
    await legeQ2An({ schemaVersion: 1, auftraege: [], pendingDeletions: viele })
    const { holePendingDeletions, merkePendingDeletion } = await frisch()

    await merkePendingDeletion(PROJEKT, DATEI_B)

    const ergebnis = await holePendingDeletions(PROJEKT)
    expect(ergebnis.ok).toBe(true)
    if (ergebnis.ok) {
      expect(ergebnis.wert).toHaveLength(201)
      expect(ergebnis.wert[0]).toEqual(alt)
    }
  })
})
