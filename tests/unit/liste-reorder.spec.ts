// Verhaltenstests zu #122 - `berechneNeueReihenfolge` und `ordneNeuOptimistisch`.
//
// Die teuerste Eigenschaft dieser Datei ist eine Abwesenheit: Es darf NIRGENDS eine
// zweite Quelle fuer die Reihenfolge entstehen (TK 9.11.3, kein `position`-Feld).
// Geprueft wird das zweifach - am Verhalten (die Elemente gehen objektgleich durch,
// kein Feld kommt hinzu; die Nutzlast traegt genau `reihenfolge`) und am Quelltext
// (kein Index wandert in ein Element oder in die Nutzlast).
//
// Die Doppel sind echte kleine Attrappen: Ein `setzeListe`, das nichts speichert,
// koennte "steht es noch richtig da?" gar nicht beantworten, und ein
// `fuehreOptimistischAus`, das nur durchreicht, verdeckte den Rollback-Pfad.
import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import type { Listenelement, Project } from '../../src/shared/contracts/project'
import { KANAELE } from '../../src/shared/contracts/kanaele'

// ---------------------------------------------------------------------------
// Die Doppel. `vi.hoisted`, weil `vi.mock` vor den Importen ausgefuehrt wird.
// ---------------------------------------------------------------------------

const doppel = vi.hoisted(() => ({
  aufrufe: [] as Array<{ kanal: string; nutzlast: unknown }>,
  antwort: null as unknown,
  /** Verzoegert die Antwort, bis der Test freigibt - fuer den Beleg, dass die Sicht
   *  VOR der Aufloesung des Versprechens schon umgestellt ist. */
  freigabe: null as null | (() => void),
  projekt: null as Project | null,
  gesetzteListen: [] as Listenelement[][],
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: async (kanal: string, nutzlast?: unknown) => {
    doppel.aufrufe.push({ kanal, nutzlast })
    if (doppel.freigabe !== null) {
      await new Promise<void>((aufloesen) => {
        doppel.freigabe = aufloesen
      })
    }
    return doppel.antwort
  },
}))

vi.mock('../../src/renderer/composer/projektzustand', () => ({
  holeSicht: () => ({ projekt: doppel.projekt, ladefehler: null }),
  setzeListe: (liste: Listenelement[]) => {
    doppel.gesetzteListen.push(liste)
    // Wie #121: NUR `liste` wird ersetzt, und zwar als KOPIE in einem NEUEN Projekt.
    if (doppel.projekt !== null) doppel.projekt = { ...doppel.projekt, liste: [...liste] }
  },
}))

// Das echte #126 wird NICHT nachgebaut, sondern in seiner vertraglichen Form
// gedoppelt: anwenden -> bestaetigen -> bei `ok: false` zuruecknehmen. Ein Doppel,
// das nie zuruecknimmt, liesse den Rollback-Test gruen laufen, ohne ihn zu pruefen.
vi.mock('../../src/renderer/composer/optimistisch', () => ({
  fuehreOptimistischAus: async <T,>(
    anwenden: () => void,
    zuruecknehmen: () => void,
    bestaetigen: () => Promise<Ergebnis<T>>,
  ): Promise<Ergebnis<T>> => {
    anwenden()
    const ergebnis = await bestaetigen()
    if (!ergebnis.ok) zuruecknehmen()
    return ergebnis
  },
}))

import {
  berechneNeueReihenfolge,
  ordneNeuOptimistisch,
} from '../../src/renderer/composer/liste-reorder'

// ---------------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------------

function element(id: string): Listenelement {
  return {
    id,
    art: 'segment',
    ref: `a-${id}`,
    dauer: 12,
    trimStart: null,
    trimEnde: null,
    einblendung: null,
  }
}

function projekt(liste: Listenelement[]): Project {
  return {
    id: 'p1',
    name: 'Testprojekt',
    erstelltAm: '2026-08-15T00:00:00.000Z',
    geaendertAm: '2026-08-15T00:00:00.000Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste,
    letzterAusgabeName: null,
    // Pflichtfeld seit TK v3.18 (#334)
    standardSegmentdauer: 10,
  }
}

function aktuelleIds(): string[] {
  return doppel.projekt === null ? [] : doppel.projekt.liste.map((e) => e.id)
}

/** Fuenf Elemente - gezogen wird in den Reihenfolge-Tests das MITTLERE. */
function fuenf(): Listenelement[] {
  return [element('e1'), element('e2'), element('e3'), element('e4'), element('e5')]
}

beforeEach(() => {
  doppel.aufrufe = []
  doppel.gesetzteListen = []
  doppel.freigabe = null
  doppel.antwort = { ok: false, fehler: { code: 'unbekannter_fehler', meldung: 'nicht gesetzt' } }
  doppel.projekt = projekt(fuenf())
})

// ---------------------------------------------------------------------------
// berechneNeueReihenfolge - die reine Rechnung
// ---------------------------------------------------------------------------

describe('berechneNeueReihenfolge', () => {
  it('verschiebt nach hinten (DoD-Beispiel)', () => {
    expect(berechneNeueReihenfolge(['a', 'b', 'c', 'd'], 'a', 'c')).toEqual(['b', 'c', 'a', 'd'])
  })

  it('verschiebt nach vorn (DoD-Beispiel)', () => {
    expect(berechneNeueReihenfolge(['a', 'b', 'c', 'd'], 'd', 'a')).toEqual(['d', 'a', 'b', 'c'])
  })

  it('veraendert das uebergebene Array nicht und gibt ein NEUES zurueck', () => {
    const ids = ['a', 'b', 'c', 'd']
    const ergebnis = berechneNeueReihenfolge(ids, 'a', 'c')

    expect(ids).toEqual(['a', 'b', 'c', 'd'])
    expect(ergebnis).not.toBe(ids)
  })

  it('behaelt ueber viele Faelle exakt dieselbe ID-Menge - inkl. erstem und letztem Element', () => {
    const ids = ['a', 'b', 'c', 'd', 'e']
    const menge = [...ids].sort()

    for (const aktiv of ids) {
      for (const ueber of ids) {
        const ergebnis = berechneNeueReihenfolge(ids, aktiv, ueber)
        expect([...ergebnis].sort()).toEqual(menge)
        expect(ergebnis).toHaveLength(ids.length)
        // Keine Doppelung, kein `undefined`, keine Luecke.
        expect(new Set(ergebnis).size).toBe(ids.length)
      }
    }
  })

  it('erstes ganz nach hinten und letztes ganz nach vorn', () => {
    expect(berechneNeueReihenfolge(['a', 'b', 'c'], 'a', 'c')).toEqual(['b', 'c', 'a'])
    expect(berechneNeueReihenfolge(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b'])
  })

  it('gleiche IDs ergeben eine unveraenderte Kopie', () => {
    const ids = ['a', 'b', 'c']
    const ergebnis = berechneNeueReihenfolge(ids, 'b', 'b')

    expect(ergebnis).toEqual(ids)
    expect(ergebnis).not.toBe(ids)
  })

  it('eine unbekannte ID aendert nichts - es wird nichts "ans Ende" geraten', () => {
    expect(berechneNeueReihenfolge(['a', 'b', 'c'], 'x', 'b')).toEqual(['a', 'b', 'c'])
    expect(berechneNeueReihenfolge(['a', 'b', 'c'], 'a', 'x')).toEqual(['a', 'b', 'c'])
  })

  it('leere und einelementige Listen werfen nicht', () => {
    expect(berechneNeueReihenfolge([], 'a', 'b')).toEqual([])
    expect(berechneNeueReihenfolge(['a'], 'a', 'a')).toEqual(['a'])
  })

  it('sortiert nichts - eine bereits "unsortierte" Folge bleibt, wie sie ist', () => {
    // Alphabetisch waere ['a','b','c']; hier darf sich nur der gezogene Eintrag
    // bewegen (Verbot "keine Sortierung zur Sicherheit").
    expect(berechneNeueReihenfolge(['c', 'a', 'b'], 'b', 'a')).toEqual(['c', 'b', 'a'])
  })
})

// ---------------------------------------------------------------------------
// ordneNeuOptimistisch - der Aufruf hinaus
// ---------------------------------------------------------------------------

describe('ordneNeuOptimistisch - der Aufruf hinaus', () => {
  it('ruft genau einmal auf, auf dem Kanal des Vertrags, mit der Nutzlast { reihenfolge }', async () => {
    doppel.antwort = { ok: true, wert: undefined }

    await ordneNeuOptimistisch('e1', 'e3')

    expect(doppel.aufrufe).toHaveLength(1)
    expect(doppel.aufrufe[0]?.kanal).toBe(KANAELE.project.ordneNeu)
    // Die SCHLUESSELMENGE, nicht nur der Inhalt: Ein zusaetzliches Feld (etwa ein
    // Zielindex) waere die zweite Quelle fuer die Reihenfolge, die TK 9.11.3
    // ausschliesst - und die Form-Pruefung des ipc-gateway sieht sie nicht vor.
    expect(Object.keys(doppel.aufrufe[0]?.nutzlast as object)).toEqual(['reihenfolge'])
    expect(doppel.aufrufe[0]?.nutzlast).toEqual({ reihenfolge: ['e2', 'e3', 'e1', 'e4', 'e5'] })
  })

  it('sendet ALLE IDs des Projekts - auch bei einer langen Liste, von der die Oberflaeche nur einen Teil zeigt', async () => {
    // 40 Elemente; gezogen werden zwei, die in einem gefilterten Ausschnitt
    // ("nur kaputte") nebeneinander laegen. Die gesendete Folge muss trotzdem alle
    // 40 tragen, sonst lehnt `ordneNeu` (#43) mit `ungueltige_eingabe` ab.
    const viele = Array.from({ length: 40 }, (_, i) => element(`e${i}`))
    doppel.projekt = projekt(viele)
    doppel.antwort = { ok: true, wert: undefined }

    await ordneNeuOptimistisch('e5', 'e30')

    const nutzlast = doppel.aufrufe[0]?.nutzlast as { reihenfolge: string[] }
    expect(nutzlast.reihenfolge).toHaveLength(40)
    expect([...nutzlast.reihenfolge].sort()).toEqual(viele.map((e) => e.id).sort())
  })

  it('die gesendete Folge entspricht exakt der Folge in der Sicht', async () => {
    doppel.antwort = { ok: true, wert: undefined }

    await ordneNeuOptimistisch('e4', 'e2')

    const nutzlast = doppel.aufrufe[0]?.nutzlast as { reihenfolge: string[] }
    expect(nutzlast.reihenfolge).toEqual(aktuelleIds())
  })

  it('benutzt NUR diesen einen Kanal - ueber mehrere Zuege hinweg', async () => {
    doppel.antwort = { ok: true, wert: undefined }

    await ordneNeuOptimistisch('e1', 'e3')
    await ordneNeuOptimistisch('e5', 'e2')

    expect([...new Set(doppel.aufrufe.map((a) => a.kanal))]).toEqual([KANAELE.project.ordneNeu])
  })
})

// ---------------------------------------------------------------------------
// ordneNeuOptimistisch - der optimistische Schritt
// ---------------------------------------------------------------------------

describe('ordneNeuOptimistisch - Erfolg', () => {
  it('stellt die Sicht um und meldet ok', async () => {
    doppel.antwort = { ok: true, wert: undefined }

    const ergebnis = await ordneNeuOptimistisch('e1', 'e3')

    expect(ergebnis.ok).toBe(true)
    expect(aktuelleIds()).toEqual(['e2', 'e3', 'e1', 'e4', 'e5'])
  })

  it('die Sicht traegt die neue Reihenfolge BEVOR das rufeAuf-Versprechen aufgeloest ist', async () => {
    doppel.antwort = { ok: true, wert: undefined }
    doppel.freigabe = () => undefined // schaltet die Verzoegerung im Doppel scharf

    const laufend = ordneNeuOptimistisch('e1', 'e3')
    // Ein Mikrotask-Durchgang reicht: `anwenden` laeuft synchron vor dem `await`.
    await Promise.resolve()
    await Promise.resolve()

    expect(doppel.aufrufe).toHaveLength(1)
    expect(aktuelleIds()).toEqual(['e2', 'e3', 'e1', 'e4', 'e5'])

    doppel.freigabe?.()
    await laufend
    expect(aktuelleIds()).toEqual(['e2', 'e3', 'e1', 'e4', 'e5'])
  })

  it('reicht dieselben Element-Objekte durch - kein Nachbau, kein zusaetzliches Feld', async () => {
    const vorher = fuenf()
    doppel.projekt = projekt(vorher)
    doppel.antwort = { ok: true, wert: undefined }

    await ordneNeuOptimistisch('e1', 'e3')

    const neu = doppel.projekt?.liste ?? []
    // Objektgleich: Es wurde umgestellt, nicht umgeschrieben. Ein Element, dem
    // jemand eine Position mitgaebe, waere hier ein NEUES Objekt.
    expect(neu[2]).toBe(vorher[0])
    expect(neu[0]).toBe(vorher[1])
    for (const e of neu) {
      expect(Object.keys(e).sort()).toEqual(Object.keys(element('x')).sort())
    }
  })

  it('veraendert die Liste der Sicht nicht an Ort und Stelle', async () => {
    const vorher = fuenf()
    doppel.projekt = projekt(vorher)
    doppel.antwort = { ok: true, wert: undefined }

    await ordneNeuOptimistisch('e1', 'e3')

    expect(vorher.map((e) => e.id)).toEqual(['e1', 'e2', 'e3', 'e4', 'e5'])
    expect(doppel.gesetzteListen[0]).not.toBe(vorher)
  })
})

// ---------------------------------------------------------------------------
// ordneNeuOptimistisch - Fehlerpfade
// ---------------------------------------------------------------------------

describe('ordneNeuOptimistisch - Ablehnung durch den Main (Fehlerklasse 1)', () => {
  it('stellt die Liste exakt auf die Ausgangsfolge zurueck', async () => {
    const vorher = fuenf()
    doppel.projekt = projekt(vorher)
    doppel.antwort = {
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: 'Die Reihenfolge passt nicht.' },
    }

    const ergebnis = await ordneNeuOptimistisch('e1', 'e3')

    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: 'Die Reihenfolge passt nicht.' },
    })
    expect(aktuelleIds()).toEqual(['e1', 'e2', 'e3', 'e4', 'e5'])
    // Zwischendurch WAR umgestellt - der Rollback ist echt, nicht "es ist nie
    // etwas passiert".
    expect(doppel.gesetzteListen.map((l) => l.map((e) => e.id))).toEqual([
      ['e2', 'e3', 'e1', 'e4', 'e5'],
      ['e1', 'e2', 'e3', 'e4', 'e5'],
    ])
  })

  it('reicht auch einen fachlichen Code des Main unveraendert durch', async () => {
    doppel.antwort = { ok: false, fehler: { code: 'nicht_gefunden', meldung: 'Kein Projekt.' } }

    const ergebnis = await ordneNeuOptimistisch('e1', 'e3')

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('nicht_gefunden')
    expect(aktuelleIds()).toEqual(['e1', 'e2', 'e3', 'e4', 'e5'])
  })
})

describe('ordneNeuOptimistisch - Zuege, die keine Operation werden', () => {
  it('ein Drop ausserhalb der Liste (ueberId === null) loest NULL Aufrufe aus', async () => {
    const ergebnis = await ordneNeuOptimistisch('e1', null)

    expect(doppel.aufrufe).toEqual([])
    expect(doppel.gesetzteListen).toEqual([])
    expect(ergebnis.ok).toBe(true)
    expect(aktuelleIds()).toEqual(['e1', 'e2', 'e3', 'e4', 'e5'])
  })

  it('ein Drop auf sich selbst loest NULL Aufrufe aus', async () => {
    const ergebnis = await ordneNeuOptimistisch('e3', 'e3')

    expect(doppel.aufrufe).toEqual([])
    expect(doppel.gesetzteListen).toEqual([])
    expect(ergebnis.ok).toBe(true)
  })

  it('undefined und ein leeres Ziel zaehlen wie ein Drop ausserhalb', async () => {
    const a = await ordneNeuOptimistisch('e1', undefined as unknown as null)
    const b = await ordneNeuOptimistisch('e1', '   ')

    expect(doppel.aufrufe).toEqual([])
    expect(a.ok).toBe(true)
    expect(b.ok).toBe(true)
  })
})

describe('ordneNeuOptimistisch - abgewiesene Eingaben', () => {
  it('ohne geladenes Projekt wird gar nicht erst gefragt', async () => {
    doppel.projekt = null

    const ergebnis = await ordneNeuOptimistisch('e1', 'e3')

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })

  it('eine unbekannte aktivId loest KEINEN Aufruf aus', async () => {
    const ergebnis = await ordneNeuOptimistisch('e9', 'e3')

    expect(doppel.aufrufe).toEqual([])
    expect(doppel.gesetzteListen).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })

  it('eine unbekannte ueberId loest KEINEN Aufruf aus', async () => {
    const ergebnis = await ordneNeuOptimistisch('e1', 'e9')

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })

  it('eine leere aktivId loest KEINEN Aufruf aus und wirft nicht', async () => {
    const ergebnis = await ordneNeuOptimistisch('', 'e3')

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
  })

  it('ein nicht-String als aktivId wirft nicht', async () => {
    const ergebnis = await ordneNeuOptimistisch(undefined as unknown as string, 'e3')

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Quelltext-Proben. Sie pruefen nicht Verhalten, sondern ABWESENHEIT - und genau
// die ist mit Doppeln nicht messbar.
// ---------------------------------------------------------------------------

// `\r\n` wird ZUERST vereinheitlicht (core.autocrlf=true; s. #123/#191).
const QUELLE = readFileSync('src/renderer/composer/liste-reorder.ts', 'utf8').replace(/\r\n/g, '\n')
// Gefiltert werden Zeilenkommentare UND die Zeilen der Doku-Bloecke. Die
// JSDoc-Erstzeilen (`/**`) gehoeren dazu: Sie stammen woertlich aus dem
// Signaturblock des Issues und sind unveraenderlich - eine Abwesenheits-Probe, die
// auf ihren Text trifft, misst das Issue, nicht den Rumpf.
const CODEZEILEN = QUELLE.split('\n').filter((zeile) => {
  const z = zeile.trimStart()
  return !z.startsWith('//') && !z.startsWith('*') && !z.startsWith('/*')
})
const CODE = CODEZEILEN.join('\n')

describe('liste-reorder - was die Datei NICHT enthaelt', () => {
  it('der Kommentar-Filter greift ueberhaupt', () => {
    expect(CODEZEILEN.length).toBeLessThan(QUELLE.split('\n').length)
    expect(CODE).not.toContain('TK 9.11.3')
    expect(CODE).toContain('export function berechneNeueReihenfolge')
    expect(CODE).toContain('export async function ordneNeuOptimistisch')
  })

  it('enthaelt kein Kanal-Literal, kein JSX, keinen react-Import, kein window.api, kein fs', () => {
    // Absichtlich auf der UNGEFILTERTEN Quelle: Die DoD verlangt die Zeichenketten
    // nirgends in der Datei, auch nicht in einer Begruendung.
    expect(QUELLE).not.toContain('project:')
    expect(CODE).not.toMatch(/from '(react|@dnd-kit\/[^']+)'/)
    expect(CODE).not.toContain('window.api')
    expect(CODE).not.toMatch(/from '(node:)?fs'/)
    // JSX: weder ein schliessendes noch ein selbstschliessendes Tag. Auf einen
    // Tag-ANFANG zu pruefen ginge nicht - `rufeAuf<void>` sieht genauso aus.
    expect(CODE).not.toContain('</')
    expect(CODE).not.toContain('/>')
  })

  it('ruft genau einen Kanal auf und kennt keinen zweiten', () => {
    expect(CODE.match(/rufeAuf\s*</g) ?? []).toHaveLength(1)
    expect(CODE.match(/KANAELE\./g) ?? []).toHaveLength(1)
    expect(CODE).toContain('KANAELE.project.ordneNeu')
  })

  it('schreibt keinen Index und kein Ordnungsfeld an ein Element (TK 9.11.3)', () => {
    // Die zentrale Abwesenheit dieses Issues. Weder ein Feld am Listenelement noch
    // ein Index in der Nutzlast - die Ordnung ist ausschliesslich die Array-Folge.
    expect(CODE).not.toMatch(/\bposition\b/i)
    expect(CODE).not.toMatch(/\b(index|reihenfolgeNr|sortIndex|rang|ord)\s*:/i)
    // Die Nutzlast traegt genau ein Feld.
    expect(CODE).toContain('{ reihenfolge: neueIds }')
    expect(CODE).not.toMatch(/zielIndex|vonIndex|nachIndex/)
  })

  it('baut keine eigene Rollback-Regel und keinen zweiten Speicher', () => {
    expect(CODE).toContain("from './optimistisch'")
    expect(CODE).toContain('fuehreOptimistischAus')
    // Kein Modul-Zustand: alle Bindungen liegen in den Funktionen.
    expect(CODE).not.toMatch(/^\s*(let|var)\s/m)
    expect(CODE).not.toMatch(/\bundo\b/i)
  })

  it('sortiert nirgends', () => {
    expect(CODE).not.toMatch(/\.sort\s*\(/)
    expect(CODE).not.toMatch(/\.reverse\s*\(/)
  })

  it('veraendert kein fremdes Array an Ort und Stelle', () => {
    // `splice` kommt vor - aber ausschliesslich auf der lokalen Kopie `kopie`.
    for (const treffer of CODE.match(/[A-Za-z_$][\w$]*\.splice\s*\(/g) ?? []) {
      expect(treffer).toMatch(/^kopie\.splice/)
    }
  })
})
