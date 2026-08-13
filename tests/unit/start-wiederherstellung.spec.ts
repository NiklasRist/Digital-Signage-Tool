import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Auftrag } from '../../src/shared/contracts/auftrag'

// Verhaltenstests zu #67 (beim Oeffnen eines Projekts Q2 laden).
//
// GEARBEITET WIRD OHNE PLATTE - die DoD verlangt es woertlich ("mit gestelltem Rueckgabewert -
// kein echter Dateizugriff im Test"). Gestellt ist deshalb der unterste Baustein, `leseQueueDatei`
// aus #69; #55 laeuft ECHT darueber. Nur so ist "der Stand liegt danach in Q2" ueber die
// Lese-Operation aus #55 (`holeQ2Stand`) pruefbar und nicht bloss gegen eine Attrappe behauptet -
// und nur so kommt der durchgereichte `speicher_fehler` wirklich aus #55/#69.
//
// `ermittleDatenOrt` ist gestellt, weil #55 fuer die Pfadbildung darauf zugreift; geschrieben oder
// gelesen wird an diesem Ort nichts.
const zustand = vi.hoisted(() => ({
  /** Antwort des naechsten leseQueueDatei; `null` = "Datei fehlt" (der Fallback aus #69). */
  leseAntwort: null as null | { ok: true; wert: unknown } | { ok: false; fehler: { code: string; meldung: string } },
  lesePfade: [] as string[],
  schreibAufrufe: 0,
  /** Spion auf den Torwaechter (#59) - die DoD weist ueber ihn nach, dass nichts startet. */
  starteNaechsten: vi.fn(),
}))

vi.mock('../../src/main/datenort', () => ({
  ermittleDatenOrt: () => '/nirgendwo/datenort',
}))

vi.mock('../../src/main/auftrags-manager/schreibe-queue-json', async () => {
  const echt = await vi.importActual<
    typeof import('../../src/main/auftrags-manager/schreibe-queue-json')
  >('../../src/main/auftrags-manager/schreibe-queue-json')
  return {
    ...echt,
    leseQueueDatei: <T>(pfad: string, fallback: T) => {
      zustand.lesePfade.push(pfad)
      return Promise.resolve(zustand.leseAntwort ?? { ok: true, wert: fallback })
    },
    schreibeQueueDatei: () => {
      zustand.schreibAufrufe += 1
      return Promise.resolve({ ok: true, wert: undefined })
    },
  }
})

// #59 ist noch ein werfender Rumpf. Der Mock ERSETZT ihn - der Rumpf laeuft also nie, und der
// Nachweis "es wurde nichts gestartet" haengt nicht daran, ob der Torwaechter schon gebaut ist.
//
// EHRLICH GESAGT: Die Zusicherung ist heute strukturell erfuellt, weil die Funktion den
// Torwaechter gar nicht importiert. Sie steht trotzdem, und zwar als Regressionsschranke - genau
// so verlangt es die DoD: Wer hier eines Tages "die Wiederholungen gleich mit anschieben" will,
// faellt damit auf, statt beim Nutzer.
vi.mock('../../src/main/auftrags-manager/torwaechter', () => ({
  starteNaechsten: zustand.starteNaechsten,
}))

/**
 * #55 haelt den zuletzt geladenen Q2-Stand im Modulzustand, #54 die Q1-Liste. Ohne frischen Import
 * schleppte jeder Test den Stand des vorigen mit. Alle drei Module kommen aus DERSELBEN frischen
 * Registrierung - sonst saehe der Test eine andere Q2 als die, in die die Funktion geladen hat.
 */
async function frisch() {
  vi.resetModules()
  const [sut, q2, q1] = await Promise.all([
    import('../../src/main/auftrags-manager/start-wiederherstellung'),
    import('../../src/main/auftrags-manager/q2-wiederholung'),
    import('../../src/main/auftrags-manager/q1-warteschlange'),
  ])
  return { ...sut, ...q2, ...q1 }
}

const PROJEKT = '3f2a1c4e-0000-4000-8000-0123456789ab'

function fehlschlag(auftragId: string): Auftrag {
  return {
    auftragId,
    art: 'import',
    status: 'fehlgeschlagen',
    label: `Import ${auftragId}`,
    payload: { projektId: PROJEKT, quellPfad: '/quelle/clip.mp4' },
    fortschritt: null,
    versuche: 1,
    fehler: { code: 'kopieren_fehlgeschlagen', meldung: 'Platte voll.' },
    ergebnis: null,
    erstelltAm: '2026-08-13T10:00:00.000Z',
  }
}

const VERMERK = { dateiname: 'a1b2c3d4-0000-4000-8000-000000000001.mp4', vermerktAm: '2026-08-12T08:00:00.000Z' }

const GEFUELLTE_DATEI = {
  schemaVersion: 1,
  auftraege: [fehlschlag('auftrag-1'), fehlschlag('auftrag-2')],
  pendingDeletions: [VERMERK],
}

beforeEach(() => {
  zustand.leseAntwort = null
  zustand.lesePfade = []
  zustand.schreibAufrufe = 0
  zustand.starteNaechsten.mockClear()
})

describe('stelleBeiProjektOeffnungHer (#67)', () => {
  it('uebernimmt zwei Fehlschlaege und eine offene Loeschung in Q2, ohne etwas einzureihen oder zu starten', async () => {
    const { stelleBeiProjektOeffnungHer, holeQ2Stand, alleQ1 } = await frisch()
    zustand.leseAntwort = { ok: true, wert: GEFUELLTE_DATEI }

    const e = await stelleBeiProjektOeffnungHer(PROJEKT)

    expect(e).toEqual({ ok: true, wert: undefined })
    expect(holeQ2Stand()).toEqual({ projektId: PROJEKT, datei: GEFUELLTE_DATEI })
    // Der Kern der Invariante aus TK 9.3.5: Die geladenen Fehlschlaege sind SICHTBAR, aber nicht
    // eingereiht - Wiederholen ist eine ausdrueckliche Nutzeraktion (FA-17).
    expect(alleQ1()).toEqual([])
    expect(zustand.starteNaechsten).not.toHaveBeenCalled()
  })

  it('meldet ohne vorhandene queue-retry.json Erfolg mit leerer Q2 und legt keine Datei an', async () => {
    const { stelleBeiProjektOeffnungHer, holeQ2Stand } = await frisch()

    const e = await stelleBeiProjektOeffnungHer(PROJEKT)

    expect(e).toEqual({ ok: true, wert: undefined })
    expect(holeQ2Stand()).toEqual({
      projektId: PROJEKT,
      datei: { schemaVersion: 1, auftraege: [], pendingDeletions: [] },
    })
    expect(zustand.schreibAufrufe).toBe(0)
  })

  it('reicht den Fehler des Q2-Ladens mit unveraendertem Code und unveraenderter Meldung durch', async () => {
    const { stelleBeiProjektOeffnungHer } = await frisch()
    const durchgereicht = {
      ok: false as const,
      fehler: { code: 'speicher_fehler', meldung: 'Die Wiederholungsdatei ist nicht lesbar.' },
    }
    zustand.leseAntwort = durchgereicht

    expect(await stelleBeiProjektOeffnungHer(PROJEKT)).toEqual(durchgereicht)
  })

  it('uebernimmt bei unbekannter schemaVersion nichts und schreibt die Datei nicht neu', async () => {
    const { stelleBeiProjektOeffnungHer, holeQ2Stand } = await frisch()
    zustand.leseAntwort = { ok: true, wert: { ...GEFUELLTE_DATEI, schemaVersion: 99 } }

    const e = await stelleBeiProjektOeffnungHer(PROJEKT)

    expect(e.ok).toBe(false)
    if (!e.ok) {
      expect(e.fehler.code).toBe('speicher_fehler')
    }
    // Nichts teilweise uebernommen und nichts ueberschrieben: Ein kaputtes Q2 enthaelt die
    // Nutzlasten fehlgeschlagener Auftraege, ein Neuschreiben loeschte sie endgueltig.
    expect(holeQ2Stand()).toBeNull()
    expect(zustand.schreibAufrufe).toBe(0)
  })

  it.each([
    ['leer', ''],
    ['mit Schraegstrich', 'projekt/1'],
    ['mit Rueckwaerts-Schraegstrich', 'projekt\\1'],
    ['mit ..', '../anderes'],
    ['kein String', undefined as unknown as string],
  ])('weist eine projektId %s mit ungueltige_eingabe ab, ohne zu laden', async (_fall, id) => {
    const { stelleBeiProjektOeffnungHer } = await frisch()

    const e = await stelleBeiProjektOeffnungHer(id)

    expect(e.ok).toBe(false)
    if (!e.ok) {
      expect(e.fehler.code).toBe('ungueltige_eingabe')
    }
    expect(zustand.lesePfade).toEqual([])
  })

  it('laesst einen vorhandenen Q2-Stand bei ungueltiger projektId unberuehrt', async () => {
    const { stelleBeiProjektOeffnungHer, holeQ2Stand } = await frisch()
    zustand.leseAntwort = { ok: true, wert: GEFUELLTE_DATEI }
    await stelleBeiProjektOeffnungHer(PROJEKT)

    await stelleBeiProjektOeffnungHer('')

    expect(holeQ2Stand()).toEqual({ projektId: PROJEKT, datei: GEFUELLTE_DATEI })
  })
})
