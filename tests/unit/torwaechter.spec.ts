import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { HandlerErgebnis } from '../../src/main/auftrags-manager/dispatcher'
import type { Auftrag } from '../../src/shared/contracts/auftrag'
import type { JournalEintrag } from '../../src/shared/contracts/protokoll'

// Verhaltenstests zum Torwaechter (#59) - dem einzigen Sperr-Mechanismus des Systems.
//
// ECHT laufen Q1 (#54), die Uebergangstabelle (#58) und die Handler-Registry (#60):
// Ob wirklich nur EIN Auftrag in `laeuft` geraet, laesst sich nur am echten Q1 zeigen,
// und die DoD verlangt ausdruecklich einen ueber #60 registrierten Handler.
// GEMOCKT sind die drei Nachbarn, die an die Platte gehen (Q4, #57), den Stand ueber
// `holeStand` einsammeln (#65) oder den Abschluss besorgen (#70).
//
// `fuehreAus` (#60) wird nur UMHUELLT, nicht ersetzt: Die Absicherung des Torwaechters
// greift erst, wenn `fuehreAus` selbst wirft oder ablehnt - und das kann der echte
// Dispatcher nicht, weil er alles selbst faengt. Ohne diese Huelle waere der Fall
// unpruefbar.
const welt = vi.hoisted(() => {
  const zustand = {
    reihenfolge: [] as string[],
    journal: [] as JournalEintrag[],
    journalFehler: false,
    stoerung: null as 'wirft' | 'lehnt_ab' | null,
    // true = der Spion auf #70 tut, was #70 tut: raeumen und weiterdrehen.
    echterAbschluss: false,
    q1: null as typeof import('../../src/main/auftrags-manager/q1-warteschlange') | null,
    torwaechter: null as typeof import('../../src/main/auftrags-manager/torwaechter') | null,
    beobachte: null as ((stelle: string) => void) | null,
  }
  const merke = (stelle: string): void => {
    zustand.reihenfolge.push(stelle)
    zustand.beobachte?.(stelle)
  }

  return {
    zustand,
    merke,
    haengeJournalEintragAn: vi.fn(async (eintrag: JournalEintrag) => {
      merke('q4')
      if (zustand.journalFehler) {
        return { ok: false as const, fehler: { code: 'speicher_fehler', meldung: 'Platte voll' } }
      }
      zustand.journal.push(eintrag)
      return { ok: true as const, wert: undefined }
    }),
    sendeQueueGeaendert: vi.fn(async () => {
      merke('ereignis')
    }),
    beendeAuftrag: vi.fn(async (auftragId: string, _ergebnis: HandlerErgebnis) => {
      merke('beendeAuftrag')
      if (!zustand.echterAbschluss) {
        return
      }
      // Der Abschlussweg auf das Noetigste eingedampft (#70, Schritte 2, 5 und 7):
      // terminaler Status, Q1 raeumen, weiterdrehen. Nur so laesst sich pruefen, dass
      // die Schlange nach JEDEM Abschluss wirklich weiterlaeuft.
      const eintrag = zustand.q1?.findeQ1(auftragId)
      if (eintrag !== undefined) {
        eintrag.auftrag.status = 'erfolg'
        zustand.q1?.entferneAusQ1(auftragId)
      }
      zustand.torwaechter?.starteNaechsten()
    }),
  }
})

vi.mock('../../src/main/auftrags-manager/q4-journal', () => ({
  haengeJournalEintragAn: welt.haengeJournalEintragAn,
}))
vi.mock('../../src/main/auftrags-manager/queue-ereignis', () => ({
  sendeQueueGeaendert: welt.sendeQueueGeaendert,
}))
vi.mock('../../src/main/auftrags-manager/beende-auftrag', () => ({
  beendeAuftrag: welt.beendeAuftrag,
}))
vi.mock('../../src/main/auftrags-manager/dispatcher', async () => {
  const echt =
    await vi.importActual<typeof import('../../src/main/auftrags-manager/dispatcher')>(
      '../../src/main/auftrags-manager/dispatcher',
    )
  return {
    ...echt,
    fuehreAus: (auftrag: Auftrag, kontext: unknown) => {
      if (welt.zustand.stoerung === 'wirft') {
        throw new Error('fuehreAus hat synchron geworfen')
      }
      if (welt.zustand.stoerung === 'lehnt_ab') {
        return Promise.reject(new Error('fuehreAus hat abgelehnt'))
      }
      return echt.fuehreAus(auftrag, kontext as Parameters<typeof echt.fuehreAus>[1])
    },
  }
})

type Q1Modul = typeof import('../../src/main/auftrags-manager/q1-warteschlange')
type DispatcherModul = typeof import('../../src/main/auftrags-manager/dispatcher')
type Torwaechter = typeof import('../../src/main/auftrags-manager/torwaechter')

// Q1 ist fluechtiger Modulzustand ohne Leer-Funktion; ein frisches Modul je Test ist der
// einzige Weg zu einer leeren Warteschlange. Der Torwaechter muss aus demselben Lauf
// stammen, sonst haelt er einen anderen Q1 in der Hand als der Test.
async function frisch(): Promise<{
  q1: Q1Modul
  dispatcher: DispatcherModul
  starteNaechsten: Torwaechter['starteNaechsten']
}> {
  vi.resetModules()
  const q1 = await import('../../src/main/auftrags-manager/q1-warteschlange')
  const dispatcher = await import('../../src/main/auftrags-manager/dispatcher')
  const torwaechter = await import('../../src/main/auftrags-manager/torwaechter')
  welt.zustand.q1 = q1
  welt.zustand.torwaechter = torwaechter
  return { q1, dispatcher, starteNaechsten: torwaechter.starteNaechsten }
}

function importAuftrag(id: string): Auftrag {
  return {
    auftragId: id,
    art: 'import',
    status: 'anstehend',
    label: `Video ${id}`,
    payload: { projektId: 'p-1', quellPfad: 'C:/quelle/clip.mp4' },
    fortschritt: null,
    versuche: 0,
    fehler: null,
    ergebnis: null,
    erstelltAm: '2026-08-13T10:00:00.000Z',
  }
}

/** Ein Auftrag, der bereits laeuft - der Zustand, den der Torwaechter hinterlaesst. */
function laeuftBereits(q1: Q1Modul, auftrag: Auftrag): Auftrag {
  q1.fuegeAnsEndeAn(auftrag)
  auftrag.status = 'laeuft'
  auftrag.versuche = 1
  return auftrag
}

/** Ein Handler, der auf ein Signal des Tests wartet - fuer den Nebenlaeufigkeits-Nachweis. */
function tor(): { warte: Promise<void>; oeffne: () => void } {
  let oeffne = (): void => {}
  const warte = new Promise<void>((aufloesen) => {
    oeffne = () => {
      aufloesen()
    }
  })
  return { warte, oeffne }
}

/** Laesst alle anstehenden Microtasks (und ein setTimeout) durchlaufen. */
async function ruhe(): Promise<void> {
  await new Promise((aufloesen) => setTimeout(aufloesen, 0))
}

const QUELLE = readFileSync(
  new URL('../../src/main/auftrags-manager/torwaechter.ts', import.meta.url),
  'utf8',
)

/** Der Quelltext ohne Kommentare - sonst zaehlen die Erlaeuterungen als Code mit. */
function ohneKommentare(quelle: string): string {
  return quelle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

describe('starteNaechsten (#59)', () => {
  beforeEach(() => {
    welt.zustand.reihenfolge = []
    welt.zustand.journal = []
    welt.zustand.journalFehler = false
    welt.zustand.stoerung = null
    welt.zustand.echterAbschluss = false
    welt.zustand.beobachte = null
    welt.haengeJournalEintragAn.mockClear()
    welt.sendeQueueGeaendert.mockClear()
    welt.beendeAuftrag.mockClear()
  })

  it('startet nichts, solange ein Auftrag laeuft', async () => {
    const { q1, dispatcher, starteNaechsten } = await frisch()
    const handler = vi.fn(async () => ({ status: 'erfolg' as const, ergebnis: null }))
    dispatcher.registriereAuftragsHandler('import', handler)
    laeuftBereits(q1, importAuftrag('a-1'))
    const wartend = importAuftrag('a-2')
    q1.fuegeAnsEndeAn(wartend)

    starteNaechsten()

    expect(handler).not.toHaveBeenCalled()
    expect(wartend.status).toBe('anstehend')
    expect(wartend.versuche).toBe(0)
    expect(welt.zustand.reihenfolge).toEqual([])
  })

  it('startet bei zwei unmittelbar aufeinanderfolgenden Aufrufen genau einen Auftrag', async () => {
    const { q1, dispatcher, starteNaechsten } = await frisch()
    const handler = vi.fn(() => new Promise<HandlerErgebnis>(() => {}))
    dispatcher.registriereAuftragsHandler('import', handler)
    const erster = importAuftrag('a-1')
    const zweiter = importAuftrag('a-2')
    q1.fuegeAnsEndeAn(erster)
    q1.fuegeAnsEndeAn(zweiter)

    starteNaechsten()
    starteNaechsten()

    expect(handler).toHaveBeenCalledTimes(1)
    expect(erster.status).toBe('laeuft')
    expect(zweiter.status).toBe('anstehend')
  })

  it('startet keinen zweiten Auftrag, waehrend der erste an seinem await haengt', async () => {
    const { q1, dispatcher, starteNaechsten } = await frisch()
    const gatter = tor()
    const handler = vi.fn(async (): Promise<HandlerErgebnis> => {
      await gatter.warte
      return { status: 'erfolg', ergebnis: null }
    })
    dispatcher.registriereAuftragsHandler('import', handler)
    q1.fuegeAnsEndeAn(importAuftrag('a-1'))
    q1.fuegeAnsEndeAn(importAuftrag('a-2'))

    starteNaechsten()
    await ruhe()
    // Der Handler steckt jetzt in seinem await. Genau hier trifft der zweite Aufruf ein -
    // aus einem Ereignis, einem reiheEin oder einem beendeAuftrag.
    starteNaechsten()
    await ruhe()

    expect(handler).toHaveBeenCalledTimes(1)
    expect(q1.alleQ1().filter((a) => a.status === 'laeuft')).toHaveLength(1)
    expect(welt.beendeAuftrag).not.toHaveBeenCalled()

    gatter.oeffne()
    await ruhe()
    expect(welt.beendeAuftrag).toHaveBeenCalledTimes(1)
  })

  it('enthaelt zwischen der Pruefung und dem Statuswechsel kein await und kein then', () => {
    // Der teuerste Fehler dieses Issues laesst sich nicht durch Ausprobieren ausschliessen:
    // Ein `await` vor dem Statuswechsel oeffnet ein Zeitfenster, das nur unter echter
    // Nebenlaeufigkeit aufgeht. Deshalb hier die statische Probe am Quelltext.
    const quelle = ohneKommentare(QUELLE)
    const beginn = quelle.indexOf('export function starteNaechsten(): void {')
    const rumpf = quelle.slice(beginn, quelle.indexOf('\n}', beginn))

    expect(beginn).toBeGreaterThanOrEqual(0)
    expect(rumpf).toContain('laufender()')
    expect(rumpf).toContain("auftrag.status = 'laeuft'")
    expect(rumpf).not.toMatch(/\bawait\b/)
    expect(rumpf).not.toMatch(/\.then\(/)
  })

  it('tut nichts bei leerer Schlange und bei ausschliesslich terminalen Auftraegen', async () => {
    const { q1, dispatcher, starteNaechsten } = await frisch()
    const handler = vi.fn(async () => ({ status: 'erfolg' as const, ergebnis: null }))
    dispatcher.registriereAuftragsHandler('import', handler)

    starteNaechsten()

    const erledigt = importAuftrag('a-1')
    q1.fuegeAnsEndeAn(erledigt)
    erledigt.status = 'fehlgeschlagen'
    starteNaechsten()

    expect(handler).not.toHaveBeenCalled()
    expect(erledigt.status).toBe('fehlgeschlagen')
    expect(welt.zustand.reihenfolge).toEqual([])
  })

  it('startet den aeltesten anstehenden Auftrag (FIFO)', async () => {
    const { q1, dispatcher, starteNaechsten } = await frisch()
    const gestartet: string[] = []
    dispatcher.registriereAuftragsHandler('import', async (auftrag) => {
      gestartet.push(auftrag.auftragId)
      return { status: 'erfolg', ergebnis: null }
    })
    q1.fuegeAnsEndeAn(importAuftrag('a-1'))
    q1.fuegeAnsEndeAn(importAuftrag('a-2'))
    q1.fuegeAnsEndeAn(importAuftrag('a-3'))

    starteNaechsten()
    await ruhe()

    expect(gestartet).toEqual(['a-1'])
  })

  it('setzt Status, Startzeit und versuche - und nimmt die Zeit nur einmal', async () => {
    const { q1, dispatcher, starteNaechsten } = await frisch()
    dispatcher.registriereAuftragsHandler('import', () => new Promise<HandlerErgebnis>(() => {}))
    const auftrag = importAuftrag('a-1')
    q1.fuegeAnsEndeAn(auftrag)

    starteNaechsten()

    const eintrag = q1.findeQ1('a-1')
    expect(auftrag.status).toBe('laeuft')
    expect(auftrag.versuche).toBe(1)
    expect(eintrag?.begonnenAm).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    // Ein Wert, zwei Verwendungen: derselbe Vorgang darf in Q3 (ueber begonnenAm) und in
    // Q4 nicht mit zwei Zeiten stehen.
    expect(welt.zustand.journal[0]?.zeit).toBe(eintrag?.begonnenAm)
  })

  it('zaehlt versuche nur beim Start - nach Fehlschlag und Wiederholung steht 2, nicht 3', async () => {
    const { q1, dispatcher, starteNaechsten } = await frisch()
    dispatcher.registriereAuftragsHandler('import', () => new Promise<HandlerErgebnis>(() => {}))
    const auftrag = importAuftrag('a-1')
    q1.fuegeAnsEndeAn(auftrag)

    starteNaechsten()
    // Was #70 und #63 tun: terminaler Status, dann derselbe Eintrag zurueck in die
    // Schlange. `wiederhole` zaehlt dabei ausdruecklich NICHT mit.
    auftrag.status = 'fehlgeschlagen'
    auftrag.status = 'anstehend'
    starteNaechsten()

    expect(auftrag.versuche).toBe(2)
  })

  it('setzt fortschritt beim Start zurueck, statt den des vorigen Versuchs stehen zu lassen', async () => {
    // Ohne diese Zusage zeigt die Warteschlangen-Leiste nach einer Wiederholung (#63) so lange
    // den Fortschritt des VORIGEN Versuchs, bis der Fachdienst zum ersten Mal meldet - bei
    // einem Render etliche Sekunden. Der Balken spraenge von 80 % rueckwaerts oder stuende
    // still und saehe wie ein Haenger aus.
    const { q1, dispatcher, starteNaechsten } = await frisch()
    dispatcher.registriereAuftragsHandler('import', () => new Promise<HandlerErgebnis>(() => {}))
    const auftrag = importAuftrag('a-1')
    q1.fuegeAnsEndeAn(auftrag)

    starteNaechsten()
    auftrag.fortschritt = 0.8
    auftrag.status = 'fehlgeschlagen'
    auftrag.status = 'anstehend'
    starteNaechsten()

    expect(auftrag.fortschritt).toBeNull()
  })

  it('schreibt Journal und Ereignis erst NACH dem Statuswechsel', async () => {
    const { q1, dispatcher, starteNaechsten } = await frisch()
    dispatcher.registriereAuftragsHandler('import', async () => {
      welt.merke('handler')
      return { status: 'erfolg', ergebnis: null }
    })
    const auftrag = importAuftrag('a-1')
    q1.fuegeAnsEndeAn(auftrag)
    const gesehen: Array<[string, string, number]> = []
    welt.zustand.beobachte = (stelle) => {
      gesehen.push([stelle, auftrag.status, auftrag.versuche])
    }

    starteNaechsten()
    await ruhe()

    expect(welt.zustand.reihenfolge).toEqual(['q4', 'ereignis', 'handler', 'beendeAuftrag'])
    // Jede der vier Stellen sieht den Auftrag bereits als laufend und gezaehlt - der
    // Statuswechsel ist also vor allen dreien geschehen.
    expect(gesehen.every(([, status, versuche]) => status === 'laeuft' && versuche === 1)).toBe(true)
    expect(welt.zustand.journal[0]).toEqual({
      zeit: expect.any(String),
      auftragId: 'a-1',
      bewegung: 'gestartet',
      position: null,
    })
  })

  it('reicht das HandlerErgebnis unveraendert an beendeAuftrag weiter - genau einmal', async () => {
    const { q1, dispatcher, starteNaechsten } = await frisch()
    const ergebnis: HandlerErgebnis = { status: 'erfolg', ergebnis: { id: 'as-1' } }
    dispatcher.registriereAuftragsHandler('import', async () => ergebnis)
    q1.fuegeAnsEndeAn(importAuftrag('a-1'))

    starteNaechsten()
    await ruhe()

    expect(welt.beendeAuftrag).toHaveBeenCalledTimes(1)
    expect(welt.beendeAuftrag).toHaveBeenCalledWith('a-1', ergebnis)
    // Dieselbe Referenz, nicht nur derselbe Inhalt: nichts umgeformt, nichts ergaenzt.
    expect(welt.beendeAuftrag.mock.calls[0]?.[1]).toBe(ergebnis)
  })

  it('laesst den Auftrag weiterlaufen, wenn das Journal-Schreiben scheitert', async () => {
    const { q1, dispatcher, starteNaechsten } = await frisch()
    dispatcher.registriereAuftragsHandler('import', async () => ({
      status: 'erfolg',
      ergebnis: null,
    }))
    const auftrag = importAuftrag('a-1')
    q1.fuegeAnsEndeAn(auftrag)
    welt.zustand.journalFehler = true

    starteNaechsten()
    await ruhe()

    expect(auftrag.status).toBe('laeuft')
    expect(welt.beendeAuftrag).toHaveBeenCalledTimes(1)
  })

  it.each(['wirft', 'lehnt_ab'] as const)(
    'faengt fuehreAus ab, wenn es %s, und schliesst den Auftrag mit unbekannter_fehler ab',
    async (stoerung) => {
      const { q1, dispatcher, starteNaechsten } = await frisch()
      dispatcher.registriereAuftragsHandler('import', async () => ({
        status: 'erfolg',
        ergebnis: null,
      }))
      q1.fuegeAnsEndeAn(importAuftrag('a-1'))
      welt.zustand.stoerung = stoerung

      expect(starteNaechsten()).toBeUndefined()
      await ruhe()

      expect(welt.beendeAuftrag).toHaveBeenCalledTimes(1)
      const [id, ergebnis] = welt.beendeAuftrag.mock.calls[0] ?? []
      expect(id).toBe('a-1')
      expect(ergebnis?.status).toBe('fehlgeschlagen')
      const fehler = ergebnis?.status === 'fehlgeschlagen' ? ergebnis.fehler : null
      expect(fehler?.code).toBe('unbekannter_fehler')
      // Klartext statt Stacktrace: die Meldung der Ausnahme darf nicht durchsickern.
      expect(fehler?.meldung).not.toContain('fuehreAus hat')
    },
  )

  it('dreht nach jedem Abschluss weiter, bis die Schlange leer ist', async () => {
    const { q1, dispatcher, starteNaechsten } = await frisch()
    const gestartet: string[] = []
    dispatcher.registriereAuftragsHandler('import', async (auftrag) => {
      gestartet.push(auftrag.auftragId)
      return { status: 'erfolg', ergebnis: null }
    })
    q1.fuegeAnsEndeAn(importAuftrag('a-1'))
    q1.fuegeAnsEndeAn(importAuftrag('a-2'))
    q1.fuegeAnsEndeAn(importAuftrag('a-3'))
    welt.zustand.echterAbschluss = true

    starteNaechsten()
    await ruhe()

    // Jeder genau einmal und in Einreih-Reihenfolge: Bliebe das Weiterdrehen aus, staende
    // hier nur a-1; liefe irgendwo ein zweiter Start an, waere ein Eintrag doppelt.
    expect(gestartet).toEqual(['a-1', 'a-2', 'a-3'])
    expect(welt.beendeAuftrag).toHaveBeenCalledTimes(3)
    expect(q1.alleQ1()).toHaveLength(0)

    starteNaechsten()
    await ruhe()
    expect(gestartet).toHaveLength(3)
  })

  it('gibt dem Handler einen Kontext, dessen meldeFortschritt den Auftrag beschreibt', async () => {
    const { q1, dispatcher, starteNaechsten } = await frisch()
    dispatcher.registriereAuftragsHandler('import', async (_auftrag, kontext) => {
      kontext.meldeFortschritt(42)
      return { status: 'erfolg', ergebnis: null }
    })
    const auftrag = importAuftrag('a-1')
    q1.fuegeAnsEndeAn(auftrag)

    starteNaechsten()
    await ruhe()

    expect(auftrag.fortschritt).toBe(42)
  })

  it('enthaelt keinen Timer, kein Polling und keinen Selbstaufruf', () => {
    const quelle = ohneKommentare(QUELLE)

    expect(quelle).not.toMatch(/setInterval|setTimeout|setImmediate|queueMicrotask/)
    // Genau ein Vorkommen: die Deklaration selbst.
    expect(quelle.match(/starteNaechsten/g)).toHaveLength(1)
  })
})
