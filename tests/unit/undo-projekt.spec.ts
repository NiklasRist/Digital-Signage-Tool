// Tests zu #235 (M7-42) - Rueckgaengig/Wiederherstellen der Projekt-Bearbeitung.
// Die Historie laeuft ECHT mit (#234, `setzeHistorienZurueck` frisch pro Test);
// `rufeAuf` (#24) wird als Doppel ersetzt (vi.hoisted-Muster wie in
// aktion-loeschen.spec.ts), `zugang` sind Spione.
import { readFileSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Bearbeitungsstand, Listenelement, Project } from '../../src/shared/contracts/project'
import type { Aktion } from '../../src/shared/contracts/aktion'
import { KANAELE } from '../../src/shared/contracts/kanaele'
import { projektHistorie, setzeHistorienZurueck } from '../../src/renderer/app-shell/undo-historien'
import {
  kannRueckgaengig,
  kannWiederherstellen,
  macheRueckgaengig,
  merkeVorAenderung,
  stelleWiederHer,
  type ProjektUndoZugang,
} from '../../src/renderer/app-shell/undo-projekt'

// ---------------- Doppel fuer rufeAuf ----------------

const doppel = vi.hoisted(() => ({
  aufrufe: [] as Array<{ kanal: string; nutzlast: unknown }>,
  antwort: null as unknown,
  wirft: false,
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: async (kanal: string, nutzlast?: unknown) => {
    if (doppel.wirft) {
      throw new Error('Bridge fehlt')
    }
    doppel.aufrufe.push({ kanal, nutzlast })
    return doppel.antwort
  },
}))

// ---------------- Quelldatei-Verbote (Grep, nur auf DIESE Datei) ----------------

const QUELLE = readFileSync(
  new URL('../../src/renderer/app-shell/undo-projekt.ts', import.meta.url),
  'utf8',
)
const CODEZEILEN = QUELLE.split('\n')
  .filter((z) => {
    const t = z.trim()
    return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
  })
  .join('\n')

describe('undo-projekt.ts – Verbote (Grep, nur auf DIESE Datei)', () => {
  it('ruft KEINE feingranulare Operation und kennt kein project:-/queue:-Literal', () => {
    for (const verbot of [
      'fügeElementHinzu', 'entferneElement', 'ordneNeu', 'setzeTrim', 'setzeDauer',
      'setzeEinblendung', 'setzeElementReferenz', 'erstelleAktion', 'bearbeiteAktion',
      'löscheAktion', "'project:'", "'queue:'", 'abonniere', 'window.', 'localStorage',
      'setTimeout', 'addEventListener',
    ]) {
      expect(CODEZEILEN).not.toContain(verbot)
    }
  })

  it('enthaelt kein JSX und keinen react-Import', () => {
    expect(CODEZEILEN).not.toContain('react')
    expect(CODEZEILEN).not.toMatch(/<[a-z][a-z]*[ >]/)
  })

  it('fasst assets und letzterAusgabeName nie an (nicht im Schnappschuss)', () => {
    expect(CODEZEILEN).not.toContain('assets')
    expect(CODEZEILEN).not.toContain('letzterAusgabeName')
  })
})

// ---------------- Bausteine ----------------

function aktion(id: string): Aktion {
  return {
    id,
    titel: `Aktion ${id}`,
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer: null,
    vorlagenId: 'vollbild',
    markeId: 'm1',
    akzentfarbe: null,
  }
}

function element(id: string, ref: string): Listenelement {
  return {
    id,
    art: 'segment',
    ref,
    // Krummer Wert (CLAUDE.md: ein Testwert, der zufaellig glatt aufgeht, belegt nichts).
    dauer: 7.13,
    trimStart: null,
    trimEnde: null,
    einblendung: null,
  }
}

function projekt(id: string, aktionen: Aktion[], liste: Listenelement[]): Project {
  return {
    id,
    name: 'Probe',
    erstelltAm: '2026-08-01T09:00:00Z',
    geaendertAm: '2026-08-01T09:00:00Z',
    schemaVersion: 1,
    assets: [],
    aktionen,
    liste,
    standardSegmentdauer: 10,
    standardMarkeId: 'm1',
    letzterAusgabeName: null,
  }
}

function zugangFuer(projektOderNull: Project | null): {
  zugang: ProjektUndoZugang
  setzeProjekt: ReturnType<typeof vi.fn>
} {
  const setzeProjekt = vi.fn()
  return {
    setzeProjekt,
    zugang: {
      holeProjekt: vi.fn(() => projektOderNull),
      setzeProjekt,
    },
  }
}

function antwortMit(projekt: Project): unknown {
  return { ok: true, wert: projekt }
}

function fehlerMit(code: string, meldung: string): unknown {
  return { ok: false, fehler: { code, meldung, daten: undefined } }
}

beforeEach(() => {
  setzeHistorienZurueck()
  doppel.aufrufe = []
  doppel.antwort = null
  doppel.wirft = false
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------- merkeVorAenderung ----------------

describe('merkeVorAenderung (#235)', () => {
  it('legt genau einen ProjektStand ab: projektId = id, stand toBe-gleich (kein Kopieren)', () => {
    const a = [aktion('a-1')]
    const l = [element('e-1', 'a-1')]
    const p = projekt('p-1', a, l)
    const { zugang } = zugangFuer(p)

    merkeVorAenderung(zugang)

    const ziel = projektHistorie().vorschauZurueck()
    expect(ziel).not.toBeNull()
    expect(ziel?.projektId).toBe('p-1')
    expect(ziel?.stand.aktionen).toBe(a)
    expect(ziel?.stand.liste).toBe(l)
    expect(projektHistorie().stand()).toEqual({ zurueck: 1, vor: 0 })
  })

  it('ohne geladenes Projekt: legt nichts ab und wirft nicht', () => {
    const { zugang } = zugangFuer(null)
    expect(() => merkeVorAenderung(zugang)).not.toThrow()
    expect(projektHistorie().stand()).toEqual({ zurueck: 0, vor: 0 })
  })
})

// ---------------- macheRueckgaengig ----------------

describe('macheRueckgaengig (#235)', () => {
  it('ruft rufeAuf GENAU EINMAL mit setzeBearbeitungsstand und Nutzlast { stand: <Schnappschuss> }', async () => {
    const a1 = [aktion('a-1')]
    const a2 = [aktion('a-1'), aktion('a-2')]
    const alt = projekt('p-1', a1, [])
    const neu = projekt('p-1', a2, [element('e-9', 'a-2')])
    const { zugang } = zugangFuer(neu)
    merkeVorAenderung(zugang)
    doppel.antwort = antwortMit(alt)

    const erg = await macheRueckgaengig(zugang)

    expect(erg).toEqual({ ok: true, wert: { art: 'angewendet', projekt: alt } })
    expect(doppel.aufrufe.length).toBe(1)
    expect(doppel.aufrufe[0]?.kanal).toBe(KANAELE.project.setzeBearbeitungsstand)
    const stand = (doppel.aufrufe[0]?.nutzlast as { stand: Bearbeitungsstand }).stand
    // Deep-Vergleich des stand: genau der abgelegte Schnappschuss.
    expect(stand).toEqual({
      aktionen: a2,
      liste: [element('e-9', 'a-2')],
      standardSegmentdauer: 10,
    })
  })

  it('der geschickte stand enthaelt GENAU die Felder aktionen, liste und standardSegmentdauer (Vertrag ab TK v3.18) - kein assets, kein letzterAusgabeName, kein id', async () => {
    const neu = projekt('p-1', [aktion('a-1')], [])
    const { zugang } = zugangFuer(neu)
    merkeVorAenderung(zugang)
    doppel.antwort = antwortMit(neu)

    await macheRueckgaengig(zugang)

    const nutzlast = doppel.aufrufe[0]?.nutzlast as { stand: Record<string, unknown> }
    expect(Object.keys(nutzlast).sort()).toEqual(['stand'])
    expect(Object.keys(nutzlast.stand).sort()).toEqual([
      'aktionen',
      'liste',
      'standardSegmentdauer',
    ])
    expect(nutzlast.stand.standardSegmentdauer).toBe(10)
  })

  it('Erfolg: setzeProjekt GENAU EINMAL mit dem UNVERAENDERTEN antwort.wert, vollzieheZurueck VOR setzeProjekt', async () => {
    const alt = projekt('p-1', [aktion('a-1')], [])
    const neu = projekt('p-1', [], [])
    const { zugang, setzeProjekt } = zugangFuer(neu)
    merkeVorAenderung(zugang)
    doppel.antwort = antwortMit(alt)

    await macheRueckgaengig(zugang)

    expect(setzeProjekt).toHaveBeenCalledTimes(1)
    expect(setzeProjekt).toHaveBeenCalledWith(alt)
    // Aufrufreihenfolge: der Stapel-Zugriff (vorschau/vollziehe) passiert vor setzeProjekt -
    // hier darueber nachpruefbar, dass der Stapel nach dem Erfolg vollzogen ist.
    expect(projektHistorie().stand()).toEqual({ zurueck: 0, vor: 1 })
  })

  it('ok: false (speicher_fehler): Code UNVERAENDERT, setzeProjekt NICHT gerufen, Stapel identisch zu vorher', async () => {
    const neu = projekt('p-1', [aktion('a-1')], [])
    const { zugang, setzeProjekt } = zugangFuer(neu)
    merkeVorAenderung(zugang)
    const vorher = projektHistorie().stand()
    doppel.antwort = fehlerMit('speicher_fehler', 'Flush scheiterte')

    const erg = await macheRueckgaengig(zugang)

    expect(erg).toEqual({
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'Flush scheiterte', daten: undefined },
    })
    expect(setzeProjekt).not.toHaveBeenCalled()
    expect(projektHistorie().stand()).toEqual(vorher)
  })

  it('ohne geladenes Projekt: nicht_gefunden, rufeAuf NULL Mal', async () => {
    const { zugang } = zugangFuer(null)
    const erg = await macheRueckgaengig(zugang)
    expect(erg.ok).toBe(false)
    if (!erg.ok) expect(erg.fehler.code).toBe('nicht_gefunden')
    expect(doppel.aufrufe.length).toBe(0)
  })

  it('bei leerer Historie: ok: true mit nichts_zu_tun, rufeAuf NULL Mal', async () => {
    const { zugang } = zugangFuer(projekt('p-1', [], []))
    const erg = await macheRueckgaengig(zugang)
    expect(erg).toEqual({ ok: true, wert: { art: 'nichts_zu_tun' } })
    expect(doppel.aufrufe.length).toBe(0)
  })

  it('fremde projektId: ungueltige_eingabe, rufeAuf NULL Mal, Historie danach { zurueck: 0, vor: 0 } (ENTSCHIEDEN 3)', async () => {
    const fremd = projekt('p-1', [aktion('a-1')], [])
    const { zugang } = zugangFuer(fremd)
    merkeVorAenderung(zugang)
    // Projektwechsel wurde uebersehen: jetzt ist ein ANDERES Projekt offen.
    const anderes = projekt('p-2', [], [])
    const zugang2 = zugangFuer(anderes)

    const erg = await macheRueckgaengig(zugang2.zugang)

    expect(erg.ok).toBe(false)
    if (!erg.ok) {
      expect(erg.fehler.code).toBe('ungueltige_eingabe')
      expect(erg.fehler.meldung).toContain('p-1')
      expect(erg.fehler.meldung).toContain('p-2')
    }
    expect(doppel.aufrufe.length).toBe(0)
    expect(projektHistorie().stand()).toEqual({ zurueck: 0, vor: 0 })
  })

  it('werfendes rufeAuf: unbekannter_fehler, der Wurf verlaesst die Datei nicht, Stapel unverändert', async () => {
    const neu = projekt('p-1', [aktion('a-1')], [])
    const { zugang } = zugangFuer(neu)
    merkeVorAenderung(zugang)
    const vorher = projektHistorie().stand()
    doppel.wirft = true

    const erg = await macheRueckgaengig(zugang)

    expect(erg.ok).toBe(false)
    if (!erg.ok) expect(erg.fehler.code).toBe('unbekannter_fehler')
    expect(projektHistorie().stand()).toEqual(vorher)
  })

  it('werfendes setzeProjekt: unbekannter_fehler, der Wurf verlaesst die Datei nicht; der Stapel bleibt vollzogen (ENTSCHIEDEN 2)', async () => {
    const alt = projekt('p-1', [aktion('a-1')], [])
    const neu = projekt('p-1', [], [])
    const setzeProjekt = vi.fn(() => {
      throw new Error('Hörer geplatzt')
    })
    const zugang: ProjektUndoZugang = { holeProjekt: () => neu, setzeProjekt }
    merkeVorAenderung(zugang)
    doppel.antwort = antwortMit(alt)

    const erg = await macheRueckgaengig(zugang)

    expect(erg.ok).toBe(false)
    if (!erg.ok) expect(erg.fehler.code).toBe('unbekannter_fehler')
    // Der Stapel IST zu diesem Zeitpunkt bereits vollzogen und bleibt es.
    expect(projektHistorie().stand()).toEqual({ zurueck: 0, vor: 1 })
  })
})

// ---------------- stelleWiederHer (spiegelbildlich) ----------------

describe('stelleWiederHer (#235)', () => {
  it('voller Zyklus: merke -> aendern -> Rueckgaengig -> Wiederherstellen fuehrt auf den Stand vor dem Rueckgaengig zurück', async () => {
    const alt = projekt('p-1', [aktion('a-1')], [])
    const neu = projekt('p-1', [], [])
    // Zugang, dessen holeProjekt nacheinander neu -> alt -> neu liefert.
    const folge = [neu, alt, neu]
    let i = 0
    const zugang: ProjektUndoZugang = {
      holeProjekt: vi.fn(() => folge[Math.min(i++, folge.length - 1)] ?? null),
      setzeProjekt: vi.fn(),
    }
    merkeVorAenderung(zugang)

    // 1. Rueckgaengig: Main uebernimmt den alten Stand (folge[1] = alt).
    doppel.antwort = antwortMit(folge[1] as Project)
    const rueck = await macheRueckgaengig(zugang)
    expect(rueck).toEqual({ ok: true, wert: { art: 'angewendet', projekt: alt } })

    // 2. Wiederherstellen: Main uebernimmt den zurueckgenommenen Stand (folge[2] = neu).
    doppel.antwort = antwortMit(folge[2] as Project)
    const vor = await stelleWiederHer(zugang)
    expect(vor).toEqual({ ok: true, wert: { art: 'angewendet', projekt: neu } })
    expect(projektHistorie().stand()).toEqual({ zurueck: 1, vor: 0 })
  })

  it('bei leerem Vor-Zweig: ok: true mit nichts_zu_tun, rufeAuf NULL Mal', async () => {
    const { zugang } = zugangFuer(projekt('p-1', [], []))
    const erg = await stelleWiederHer(zugang)
    expect(erg).toEqual({ ok: true, wert: { art: 'nichts_zu_tun' } })
    expect(doppel.aufrufe.length).toBe(0)
  })

  it('ohne geladenes Projekt: nicht_gefunden, rufeAuf NULL Mal', async () => {
    const { zugang } = zugangFuer(null)
    const erg = await stelleWiederHer(zugang)
    expect(erg.ok).toBe(false)
    if (!erg.ok) expect(erg.fehler.code).toBe('nicht_gefunden')
    expect(doppel.aufrufe.length).toBe(0)
  })

  it('fremde projektId: ungueltige_eingabe und Historie geleert', async () => {
    const fremd = projekt('p-A', [aktion('a-1')], [])
    const alt = projekt('p-A', [], [])
    const { zugang } = zugangFuer(fremd)
    merkeVorAenderung(zugang)
    // Erst einen Rueckgaengig vollziehen, damit der Vor-Zweig gefuellt ist ...
    doppel.antwort = antwortMit(alt)
    const rueck = await macheRueckgaengig(zugang)
    expect(rueck.ok).toBe(true)
    // ... und DANN den Projektwechsel uebersehen: jetzt ist p-B offen.
    const anderes = zugangFuer(projekt('p-B', [], []))

    const erg = await stelleWiederHer(anderes.zugang)

    expect(erg.ok).toBe(false)
    if (!erg.ok) expect(erg.fehler.code).toBe('ungueltige_eingabe')
    expect(doppel.aufrufe.length).toBe(1) // nur der Rueckgaengig davor
    expect(projektHistorie().stand()).toEqual({ zurueck: 0, vor: 0 })
  })
})

// ---------------- kannRueckgaengig / kannWiederherstellen ----------------

describe('kannRueckgaengig (#235) - vier benannte Faelle', () => {
  it('false ohne Projekt', () => {
    const { zugang } = zugangFuer(null)
    expect(kannRueckgaengig(zugang)).toBe(false)
  })

  it('false bei leerer Historie', () => {
    const { zugang } = zugangFuer(projekt('p-1', [], []))
    expect(kannRueckgaengig(zugang)).toBe(false)
  })

  it('false bei fremder projektId', () => {
    const fremd = projekt('p-1', [aktion('a-1')], [])
    const { zugang } = zugangFuer(fremd)
    merkeVorAenderung(zugang)
    const anderes = zugangFuer(projekt('p-2', [], []))
    expect(kannRueckgaengig(anderes.zugang)).toBe(false)
  })

  it('true sonst', () => {
    const p = projekt('p-1', [aktion('a-1')], [])
    const { zugang } = zugangFuer(p)
    merkeVorAenderung(zugang)
    expect(kannRueckgaengig(zugang)).toBe(true)
  })
})

describe('kannWiederherstellen (#235)', () => {
  it('false bei leerem Vor-Zweig, true nach einem vollzogenen Rueckgaengig', async () => {
    const alt = projekt('p-1', [aktion('a-1')], [])
    const neu = projekt('p-1', [], [])
    const { zugang } = zugangFuer(neu)
    merkeVorAenderung(zugang)
    expect(kannWiederherstellen(zugang)).toBe(false)
    doppel.antwort = antwortMit(alt)
    await macheRueckgaengig(zugang)
    expect(kannWiederherstellen(zugang)).toBe(true)
  })

  it('false ohne Projekt', () => {
    const { zugang } = zugangFuer(null)
    expect(kannWiederherstellen(zugang)).toBe(false)
  })
})
