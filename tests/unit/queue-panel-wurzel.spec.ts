// Verhaltenstests zu #257 - die Modul-Wurzel des queue-panel (jsdom).
//
// Geprueft wird NUR src/renderer/queue-panel/index.tsx. Die sieben Bausteine
// (#205-#211) sind Doppel; die reine Fachlichkeit (#205/#208-Aufbau, Rueckfrage,
// Meldung) laeuft ECHT ueber leisten-montage.ts. Die Liste wird als Doppel
// gerendert, baut ihre Zeilen aber mit dem ECHTEN baueListenInhalt (#207).
//
// Wortlaut der DoD steht im Issue #257; die Testnamen nennen die zugehoerige
// ENTSCHIEDEN-Nummer, wo das Issue es verlangt.
// @vitest-environment jsdom

import { act, createElement, type JSX } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'

import type { Auftrag, AuftragArt, AuftragStatus } from '../../src/shared/contracts/auftrag'
import type { AuftragsSicht } from '../../src/renderer/queue-panel/auftrags-sicht'

const d = vi.hoisted(() => ({
  setzeSicht: null as null | ((sicht: unknown) => void),
  setzeFortschritt: null as null | ((stand: unknown) => void),
  leseRenderId: null as null | (() => string | null),
  sichtAufbauten: 0,
  fortschrittAufbauten: 0,
  sichtAbbauten: 0,
  fortschrittAbbauten: 0,
  leisteProps: [] as Array<Record<string, unknown>>,
  listeProps: [] as Array<Record<string, unknown>>,
  queueAufrufe: [] as string[],
  wiederholAufrufe: [] as string[],
  uebersetzeAufrufe: [] as Array<{ fehler: unknown; art: unknown }>,
  fortschrittText: '',
  queueAntwort: { ok: true } as Record<string, unknown>,
  wiederholAntwort: { ok: true } as Record<string, unknown>,
  wiederholWirft: null as null | string,
}))

vi.mock('../../src/renderer/queue-panel/auftrags-sicht', () => ({
  ANFANGS_SICHT: { zustand: 'unbekannt' },
  baueAuftragsSichtAuf: (setzeSicht: (sicht: unknown) => void) => {
    d.sichtAufbauten += 1
    d.setzeSicht = setzeSicht
    return () => {
      d.sichtAbbauten += 1
    }
  },
}))

vi.mock('../../src/renderer/queue-panel/fortschritt', () => ({
  ANFANGS_FORTSCHRITT: { zustand: 'unbekannt' },
  beschreibeFortschritt: () => d.fortschrittText,
  baueRenderFortschrittAuf: (
    lese: () => string | null,
    setze: (stand: unknown) => void,
  ) => {
    d.fortschrittAufbauten += 1
    d.leseRenderId = lese
    d.setzeFortschritt = setze
    return () => {
      d.fortschrittAbbauten += 1
    }
  },
}))

vi.mock('../../src/renderer/queue-panel/leiste-zeile', () => ({
  LeisteZeile: (props: Record<string, unknown>): JSX.Element => {
    d.leisteProps.push(props)
    return createElement('button', {
      'data-testid': 'klapp-schalter',
      onClick: props.aufKlappenUmschalten as () => void,
    }, 'klapp')
  },
}))

vi.mock('../../src/renderer/queue-panel/liste', async () => {
  const { baueListenInhalt } = await import('../../src/renderer/queue-panel/listen-zeilen')
  return {
    Liste: (props: Record<string, unknown>): JSX.Element => {
      d.listeProps.push(props)
      const inhalt = baueListenInhalt(props.sicht as AuftragsSicht)
      if (inhalt.zustand !== 'zeilen') {
        return createElement('div', { 'data-testid': 'liste-marke' })
      }
      const schalter = props.zeileSchalter as (zeile: unknown) => JSX.Element | null
      return createElement(
        'div',
        { 'data-testid': 'liste-marke' },
        inhalt.zeilen.map((zeile) => createElement(
          'div',
          { key: zeile.auftragId, 'data-testid': `zeile-${zeile.auftragId}` },
          createElement('span', null, zeile.label),
          schalter(zeile),
        )),
      )
    },
  }
})

vi.mock('../../src/renderer/queue-panel/entfernen', async () => {
  const echt = await vi.importActual<typeof import('../../src/renderer/queue-panel/entfernen')>(
    '../../src/renderer/queue-panel/entfernen',
  )
  return {
    ...echt,
    fuehreQueueAktionAus: async (auftragId: string) => {
      d.queueAufrufe.push(auftragId)
      return d.queueAntwort
    },
  }
})

vi.mock('../../src/renderer/queue-panel/wiederholen', async () => {
  const echt = await vi.importActual<typeof import('../../src/renderer/queue-panel/wiederholen')>(
    '../../src/renderer/queue-panel/wiederholen',
  )
  return {
    ...echt,
    wiederholeAuftrag: async (auftragId: string) => {
      d.wiederholAufrufe.push(auftragId)
      if (d.wiederholWirft !== null) throw new Error(d.wiederholWirft)
      return d.wiederholAntwort
    },
  }
})

vi.mock('../../src/renderer/queue-panel/fehlertexte', () => ({
  uebersetzeFehler: (fehler: { code: string }, art: string | null) => {
    d.uebersetzeAufrufe.push({ fehler, art })
    return {
      titel: `TITEL:${fehler.code}`,
      erklaerung: 'ERKLAERUNG',
      handlung: `HANDLUNG:${fehler.code}`,
      betroffeneElementIds: [],
      reparaturElementId: null,
      wiederholenSinnvoll: false,
    }
  },
  BEKANNTE_FEHLERCODES: [],
}))

import { WarteschlangenLeiste } from '../../src/renderer/queue-panel'

// ---------------------------------------------------------------------------
// Messplatz
// ---------------------------------------------------------------------------

let behaelter: HTMLDivElement
let wurzel: Root | null

beforeEach(() => {
  d.setzeSicht = null
  d.setzeFortschritt = null
  d.leseRenderId = null
  d.sichtAufbauten = 0
  d.fortschrittAufbauten = 0
  d.sichtAbbauten = 0
  d.fortschrittAbbauten = 0
  d.leisteProps = []
  d.listeProps = []
  d.queueAufrufe = []
  d.wiederholAufrufe = []
  d.uebersetzeAufrufe = []
  d.fortschrittText = ''
  d.queueAntwort = { ok: true }
  d.wiederholAntwort = { ok: true }
  d.wiederholWirft = null
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  wurzel = createRoot(behaelter)
})

afterEach(() => {
  if (wurzel !== null) {
    act(() => wurzel?.unmount())
    wurzel = null
  }
  behaelter.remove()
})

function zeichne(): void {
  act(() => wurzel?.render(createElement(WarteschlangenLeiste)))
}

function sicht(auftraege: Auftrag[]): AuftragsSicht {
  return { zustand: 'geladen', auftraege }
}

function zustellen(neu: AuftragsSicht): void {
  act(() => d.setzeSicht?.(neu))
}

function baueAuftrag(
  auftragId: string,
  art: AuftragArt,
  status: AuftragStatus,
  zusatz: Record<string, unknown> = {},
): Auftrag {
  return {
    auftragId,
    art,
    status,
    label: `Auftrag ${auftragId}`,
    payload: {},
    fortschritt: null,
    versuche: 0,
    fehler: null,
    ergebnis: null,
    erstelltAm: '2026-10-20T10:00:00.000Z',
    ...zusatz,
  } as Auftrag
}

async function klicke(text: string): Promise<void> {
  const knopf = [...behaelter.querySelectorAll('button')]
    .find((k) => (k.textContent ?? '').trim() === text)
  expect(knopf, `Knopf "${text}" nicht gefunden`).toBeTruthy()
  await act(async () => {
    knopf?.click()
    await Promise.resolve()
    await Promise.resolve()
  })
}

async function klickeTestid(testid: string): Promise<void> {
  const knopf = behaelter.querySelector(`[data-testid="${testid}"]`) as HTMLButtonElement | null
  expect(knopf, `Knopf "${testid}" nicht gefunden`).toBeTruthy()
  await act(async () => {
    knopf?.click()
    await Promise.resolve()
    await Promise.resolve()
  })
}

function oeffne(): void {
  act(() => wurzel?.render(createElement(WarteschlangenLeiste)))
  const props = d.leisteProps.at(-1) as { aufKlappenUmschalten: () => void }
  act(() => props.aufKlappenUmschalten())
}

// ---------------------------------------------------------------------------
// Aufbau, Abbau, Klappzustand
// ---------------------------------------------------------------------------

describe('WarteschlangenLeiste - Aufbau und Abbau', () => {
  it('baut Sicht und Fortschritt genau einmal auf, auch wenn die Leiste eingeklappt ist (ENTSCHIEDEN 2)', () => {
    zeichne()

    expect(d.sichtAufbauten).toBe(1)
    expect(d.fortschrittAufbauten).toBe(1)
    expect(d.listeProps).toHaveLength(0)
  })

  it('zwei Klapp-Wechsel loesen kein weiteres baueAuftragsSichtAuf aus (ENTSCHIEDEN 2)', () => {
    zeichne()
    oeffne()
    oeffne()

    expect(d.sichtAufbauten).toBe(1)
    expect(d.listeProps.length).toBeGreaterThan(0)
  })

  it('meldet beim Abbau beide Abos je genau einmal ab; ein danach zugestellter Stand rendert nicht mehr (Invariante 2)', () => {
    zeichne()
    const vorher = d.leisteProps.length

    act(() => wurzel?.unmount())
    wurzel = null

    expect(d.sichtAbbauten).toBe(1)
    expect(d.fortschrittAbbauten).toBe(1)

    d.setzeSicht?.(sicht([baueAuftrag('a1', 'import', 'laeuft')]))
    expect(d.leisteProps.length).toBe(vorher)
  })

  it('startet eingeklappt: Liste null Mal, nach einem Klick genau einmal', async () => {
    zeichne()
    expect(d.listeProps).toHaveLength(0)

    await klickeTestid('klapp-schalter')
    expect(d.listeProps).toHaveLength(1)
  })

  it('LeisteZeile bekommt die Sicht toBe-gleich und den Klappzustand aus der Lage', () => {
    zeichne()
    const ersteSicht = sicht([baueAuftrag('a1', 'import', 'laeuft')])
    zustellen(ersteSicht)

    const davor = d.leisteProps.at(-1) as Record<string, unknown>
    expect(davor.sicht).toBe(ersteSicht)
    expect(davor.aufgeklappt).toBe(false)

    act(() => (davor.aufKlappenUmschalten as () => void)())
    const danach = d.leisteProps.at(-1) as Record<string, unknown>
    expect(danach.aufgeklappt).toBe(true)
  })

  it('Liste bekommt dieselbe Sicht toBe-gleich - nicht kopiert, nicht sortiert, nicht gefiltert (ENTSCHIEDEN 8)', () => {
    zeichne()
    // Absichtlich NICHT nach erstelltAm oder status sortiert.
    const auftraege = [
      baueAuftrag('z-letzter', 'export', 'fehlgeschlagen'),
      baueAuftrag('a-erster', 'render', 'laeuft'),
      baueAuftrag('m-mitte', 'import', 'anstehend'),
    ]
    const stand = sicht(auftraege)
    zustellen(stand)
    const props = d.leisteProps.at(-1) as { aufKlappenUmschalten: () => void }
    act(() => props.aufKlappenUmschalten())

    const liste = d.listeProps.at(-1) as Record<string, unknown>
    expect(liste.sicht).toBe(stand)
    expect(auftraege.map((a) => a.auftragId)).toEqual(['z-letzter', 'a-erster', 'm-mitte'])
  })

  it('leseAktuelleRenderId liest bei jedem Aufruf den AKTUELLEN Stand (r1, dann r2)', () => {
    zeichne()
    zustellen(sicht([
      baueAuftrag('r1-auftrag', 'render', 'laeuft', { payload: { renderId: 'r1' } }),
    ]))
    expect(d.leseRenderId?.()).toBe('r1')

    zustellen(sicht([
      baueAuftrag('r2-auftrag', 'render', 'laeuft', { payload: { renderId: 'r2' } }),
    ]))
    expect(d.leseRenderId?.()).toBe('r2')
  })
})

// ---------------------------------------------------------------------------
// Schalter, Rueckfrage, Meldung, Fortschritt
// ---------------------------------------------------------------------------

describe('WarteschlangenLeiste - Schalter', () => {
  it('anstehender Auftrag traegt "entfernen" mit der Beschriftung aus #209', async () => {
    zeichne()
    zustellen(sicht([baueAuftrag('a1', 'import', 'anstehend')]))
    oeffne()

    expect(behaelter.textContent).toContain('Aus der Warteschlange nehmen')
  })

  it('laufender Render traegt "abbrechen" mit der Beschriftung aus #209', async () => {
    zeichne()
    zustellen(sicht([baueAuftrag('r1', 'render', 'laeuft', { payload: { renderId: 'r1' } })]))
    oeffne()

    expect(behaelter.textContent).toContain('Render abbrechen')
  })

  it('fehlgeschlagener Auftrag traegt WIEDERHOLEN_BESCHRIFTUNG aus #210', async () => {
    zeichne()
    zustellen(sicht([baueAuftrag('f1', 'render', 'fehlgeschlagen')]))
    oeffne()

    expect(behaelter.textContent).toContain('Erneut versuchen')
  })

  it('laufender Import traegt KEINEN Bedien-Schalter; ein Klick auf die Zeile ruft nichts', async () => {
    zeichne()
    zustellen(sicht([baueAuftrag('i1', 'import', 'laeuft')]))
    oeffne()

    expect(behaelter.querySelector('[data-testid="queue-schalter-i1"]')).toBeNull()

    const zeile = behaelter.querySelector('[data-testid="zeile-i1"]') as HTMLElement
    await act(async () => {
      zeile.click()
      await Promise.resolve()
    })
    expect(d.queueAufrufe).toEqual([])
    expect(d.wiederholAufrufe).toEqual([])
  })

  it('"entfernen" laeuft OHNE Rueckfrage und ruft fuehreQueueAktionAus genau einmal', async () => {
    zeichne()
    zustellen(sicht([baueAuftrag('a1', 'import', 'anstehend')]))
    oeffne()

    await klicke('Aus der Warteschlange nehmen')

    expect(d.queueAufrufe).toEqual(['a1'])
    expect(behaelter.querySelector('[data-testid="queue-panel-rueckfrage"]')).toBeNull()
  })

  it('"abbrechen" oeffnet die Rueckfrage und ruft ERST nach Bestaetigung (ENTSCHIEDEN 6)', async () => {
    zeichne()
    zustellen(sicht([baueAuftrag('r1', 'render', 'laeuft', { payload: { renderId: 'r1' } })]))
    oeffne()

    await klicke('Render abbrechen')

    expect(d.queueAufrufe).toEqual([])
    const dialog = behaelter.querySelector('[data-testid="queue-panel-rueckfrage"]')
    expect(dialog).not.toBeNull()
    // Der Text kommt aus #209 (rueckfrageText), nicht aus dieser Datei.
    expect(dialog?.textContent).toContain('abbrechen?')
    expect(dialog?.textContent).toContain('Auftrag r1')

    await klickeTestid('queue-panel-rueckfrage-bestaetigen')
    expect(d.queueAufrufe).toEqual(['r1'])
  })

  it('Abbruch der Rueckfrage ruft nichts und meldet nichts', async () => {
    zeichne()
    zustellen(sicht([baueAuftrag('r1', 'render', 'laeuft', { payload: { renderId: 'r1' } })]))
    oeffne()

    await klicke('Render abbrechen')
    await klickeTestid('queue-panel-rueckfrage-abbrechen')

    expect(d.queueAufrufe).toEqual([])
    expect(behaelter.querySelector('[data-testid="queue-panel-rueckfrage"]')).toBeNull()
    expect(behaelter.querySelector('[data-testid="queue-panel-meldung"]')).toBeNull()
  })

  it('"Erneut versuchen" ruft wiederholeAuftrag genau einmal und zeigt den Hinweis', async () => {
    zeichne()
    zustellen(sicht([baueAuftrag('f1', 'render', 'fehlgeschlagen')]))
    oeffne()

    await klicke('Erneut versuchen')

    expect(d.wiederholAufrufe).toEqual(['f1'])
    expect(behaelter.textContent).toContain('Der Auftrag wird ans Ende der Warteschlange gestellt')
  })

  it('eine Zeile mit Fehler zeigt titel und handlung aus uebersetzeFehler - mit toBe auf Fehler und art (ENTSCHIEDEN 5)', () => {
    zeichne()
    const fehler = { code: 'kein_platz', meldung: 'Der Datentraeger ist voll.' }
    zustellen(sicht([baueAuftrag('e1', 'export', 'anstehend', { fehler })]))
    oeffne()

    expect(d.uebersetzeAufrufe).toHaveLength(1)
    expect(d.uebersetzeAufrufe[0]?.fehler).toBe(fehler)
    expect(d.uebersetzeAufrufe[0]?.art).toBe('export')
    expect(behaelter.textContent).toContain('TITEL:kein_platz')
    expect(behaelter.textContent).toContain('HANDLUNG:kein_platz')
  })
})

describe('WarteschlangenLeiste - Meldung und Fortschritt', () => {
  it('eine abgelehnte Bedienung erscheint als EINE Meldung mit unveraendertem Code; die zweite ersetzt sie (ENTSCHIEDEN 7)', async () => {
    zeichne()
    zustellen(sicht([baueAuftrag('a1', 'import', 'anstehend')]))
    oeffne()

    d.queueAntwort = { ok: false, fehler: { code: 'nicht_gefunden', meldung: 'Weg.' } }
    await klicke('Aus der Warteschlange nehmen')
    expect(behaelter.querySelectorAll('[data-testid="queue-panel-meldung"]')).toHaveLength(1)
    expect(behaelter.textContent).toContain('Weg.')

    d.queueAntwort = { ok: false, fehler: { code: 'unbekannter_fehler', meldung: 'Anders.' } }
    await klicke('Aus der Warteschlange nehmen')
    expect(behaelter.querySelectorAll('[data-testid="queue-panel-meldung"]')).toHaveLength(1)
    expect(behaelter.textContent).toContain('Anders.')
    expect(behaelter.textContent).not.toContain('Weg.')
  })

  it('ein werfendes wiederholeAuftrag verlaesst zeileSchalter nicht als Ausnahme', async () => {
    zeichne()
    zustellen(sicht([baueAuftrag('f1', 'render', 'fehlgeschlagen')]))
    oeffne()

    d.wiederholWirft = 'Bruecke weg'
    await klicke('Erneut versuchen')

    expect(behaelter.textContent).toContain('Bruecke weg')
  })

  it('beschreibeFortschritt mit unbekannt erzeugt KEINEN zusaetzlichen Text; bei laufendem Render wird gemeldet angezeigt', () => {
    zeichne()
    expect(behaelter.querySelector('[data-testid="queue-panel-fortschritt"]')).toBeNull()

    zustellen(sicht([
      baueAuftrag('r1', 'render', 'laeuft', { payload: { renderId: 'r1' } }),
    ]))
    d.fortschrittText = 'Element 2 von 3 wird vorbereitet'
    act(() => d.setzeFortschritt?.({ zustand: 'gemeldet' }))

    expect(behaelter.querySelector('[data-testid="queue-panel-fortschritt"]')?.textContent)
      .toBe('Element 2 von 3 wird vorbereitet')
  })

  it('nach dem Ende des Renders verschwindet der Fortschrittstext (kein "Wird zusammengefuegt" unter "leer")', () => {
    zeichne()
    zustellen(sicht([
      baueAuftrag('r1', 'render', 'laeuft', { payload: { renderId: 'r1' } }),
    ]))
    d.fortschrittText = 'Wird zusammengefuegt'
    act(() => d.setzeFortschritt?.({ zustand: 'gemeldet' }))
    expect(behaelter.querySelector('[data-testid="queue-panel-fortschritt"]')).not.toBeNull()

    zustellen(sicht([
      baueAuftrag('r1', 'render', 'erfolg', { payload: { renderId: 'r1' } }),
    ]))

    expect(behaelter.querySelector('[data-testid="queue-panel-fortschritt"]')).toBeNull()
  })

  it('ein fehlgeschlagener Stand klappt NICHT von selbst auf (ENTSCHIEDEN 4)', () => {
    zeichne()
    zustellen(sicht([baueAuftrag('f1', 'render', 'fehlgeschlagen')]))

    expect(d.listeProps).toHaveLength(0)
    expect(behaelter.querySelector('[data-testid="queue-panel-rueckfrage"]')).toBeNull()
  })

  it('"Schliessen" verwirft die Meldung', async () => {
    zeichne()
    zustellen(sicht([baueAuftrag('a1', 'import', 'anstehend')]))
    oeffne()
    d.queueAntwort = { ok: false, fehler: { code: 'nicht_gefunden', meldung: 'Weg.' } }
    await klicke('Aus der Warteschlange nehmen')

    await klicke('Schliessen')

    expect(behaelter.querySelector('[data-testid="queue-panel-meldung"]')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Grep-Proben (DoD)
// ---------------------------------------------------------------------------
