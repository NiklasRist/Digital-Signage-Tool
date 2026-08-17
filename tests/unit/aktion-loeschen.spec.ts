// Verhaltenstests zu #142 - `berechneLoeschVorschau` und `loescheAktion` im
// action-editor.
//
// Diese Datei ist die VORSCHAU-Haelfte des Loeschens einer Aktion (TK 9.5.3):
// Segment-Listenelemente verschwinden ganz (Fall 1), Videos behalten ihr Band und
// verlieren nur die Abschnitte auf die Aktion (Fall 2), und wird ein Band dadurch
// leer, entfaellt die Einblendung ganz - das Videoelement bleibt. Die Vorschau ist
// rein und ohne Nebenwirkung; `loescheAktion` schickt nur die `aktionId` und reicht
// die Antwort des Main unveraendert weiter (kein Auspacken, kein Umformen).
//
// Das Doppel fuer `rufeAuf` ist absichtlich klein: Es notiert Kanal und Nutzlast
// und gibt zurueck, was die vorher gesetzte Antwort ist. Referenzgleichheit wird
// direkt am `wert`-Objekt gemessen - ob die Datei die Antwort unveraendert
// weiterreicht, laesst sich nur so nachweisen.
import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Bearbeitungsstand, Einblendung, Listenelement } from '../../src/shared/contracts/project'
import { KANAELE } from '../../src/shared/contracts/kanaele'

// ---------------------------------------------------------------------------
// Das Doppel fuer `rufeAuf` (#24). `vi.hoisted`, weil `vi.mock` vor den Importen
// laeuft.
// ---------------------------------------------------------------------------

const doppel = vi.hoisted(() => ({
  aufrufe: [] as Array<{ kanal: string; nutzlast: unknown }>,
  antwort: null as unknown,
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: async (kanal: string, nutzlast?: unknown) => {
    doppel.aufrufe.push({ kanal, nutzlast })
    return doppel.antwort
  },
}))

import { berechneLoeschVorschau, loescheAktion } from '../../src/renderer/action-editor/aktion-loeschen'

// ---------------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------------

function segment(id: string, aktionsId: string): Listenelement {
  return {
    id,
    art: 'segment',
    ref: aktionsId,
    dauer: 12,
    trimStart: null,
    trimEnde: null,
    einblendung: null,
  }
}

/** Video-Element. `bandAktionen` null = kein Band; sonst ein Band mit diesen Aktionen. */
function video(id: string, bandAktionen: string[] | null): Listenelement {
  const einblendung: Einblendung | null =
    bandAktionen === null
      ? null
      : {
          // Dauer 7.13 als krummer Wert (CLAUDE.md: ein Testwert, der zufaellig
          // glatt aufgeht, belegt nichts).
          bandVorlageId: 'band-standard',
          abschnitte: bandAktionen.map((aktionRef) => ({ aktionRef, dauer: 7.13 })),
        }
  return {
    id,
    art: 'video',
    ref: 'asset-video',
    dauer: null,
    trimStart: 0.5,
    trimEnde: 3.9,
    einblendung,
  }
}

function stand(): Bearbeitungsstand {
  return {
    aktionen: [],
    liste: [],
  }
}

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
    akzentfarbe: null,
  }
}

beforeEach(() => {
  doppel.aufrufe = []
  doppel.antwort = {
    ok: false,
    fehler: { code: 'unbekannter_fehler', meldung: 'nicht gesetzt' },
  }
})

// ---------------------------------------------------------------------------
// berechneLoeschVorschau - Fall 1 (Segment verschwindet ganz)
// ---------------------------------------------------------------------------

describe('berechneLoeschVorschau - Fall 1: Segment-Listenelement', () => {
  it('meldet ein segment-Element mit passender ref in entfernteElementIds und NICHT in gekuerzteElementIds', () => {
    const liste = [segment('e1', 'a1'), segment('e2', 'a2'), video('e3', ['a1', 'a2', 'a9'])]

    const vorschau = berechneLoeschVorschau('a2', liste)

    expect(vorschau.entfernteElementIds).toEqual(['e2'])
    // DoD: das entfernte Segment steht in KEINER der beiden anderen Listen.
    expect(vorschau.gekuerzteElementIds).not.toContain('e2')
    expect(vorschau.baenderWerdenLeer).not.toContain('e2')
  })

  it('sammelt mehrere passende Segmente in Listenreihenfolge', () => {
    const liste = [segment('e1', 'a1'), segment('e2', 'a2'), segment('e3', 'a2'), segment('e4', 'a1')]

    const vorschau = berechneLoeschVorschau('a2', liste)

    expect(vorschau.entfernteElementIds).toEqual(['e2', 'e3'])
  })

  it('die Reihenfolge der Treffer folgt der Listenreihenfolge - keine Sortierung', () => {
    const liste = [segment('e1', 'a1'), segment('e2', 'a2'), segment('e3', 'a2'), segment('e4', 'a1')]

    const vorschau = berechneLoeschVorschau('a2', liste)

    // Der Lauf hat umgekehrt zur "Aktions-Reihenfolge" eingefuegt, aber die Liste
    // zaehlt: e2 steht vor e3.
    expect(vorschau.entfernteElementIds).toEqual(['e2', 'e3'])
  })
})

// ---------------------------------------------------------------------------
// berechneLoeschVorschau - Fall 2 (Video bleibt, Band wird gekuerzt)
// ---------------------------------------------------------------------------

describe('berechneLoeschVorschau - Fall 2: Video mit Band', () => {
  it('eine Aktion unter drei Abschnitten: gekuerzt, NICHT leer', () => {
    const liste = [video('e1', ['a1', 'a2', 'a9'])]

    const vorschau = berechneLoeschVorschau('a2', liste)

    expect(vorschau.gekuerzteElementIds).toEqual(['e1'])
    expect(vorschau.baenderWerdenLeer).toEqual([])
    expect(vorschau.entfernteElementIds).toEqual([])
  })

  it('nur diese Aktion im Band: in beiden Listen', () => {
    const liste = [video('e1', ['a2'])]

    const vorschau = berechneLoeschVorschau('a2', liste)

    expect(vorschau.gekuerzteElementIds).toEqual(['e1'])
    expect(vorschau.baenderWerdenLeer).toEqual(['e1'])
    expect(vorschau.entfernteElementIds).toEqual([])
  })

  it('die Aktion mehrfach gefuehrt: die ID trotzdem nur EINMAL in gekuerzteElementIds', () => {
    const liste = [video('e1', ['a2', 'a9', 'a2'])]

    const vorschau = berechneLoeschVorschau('a2', liste)

    expect(vorschau.gekuerzteElementIds).toEqual(['e1'])
    expect(vorschau.gekuerzteElementIds.filter((id) => id === 'e1')).toHaveLength(1)
  })

  it('ein Video ohne Einblendung erscheint in KEINER der drei Listen', () => {
    const liste = [video('e1', null)]

    const vorschau = berechneLoeschVorschau('a2', liste)

    expect(vorschau.entfernteElementIds).toEqual([])
    expect(vorschau.gekuerzteElementIds).toEqual([])
    expect(vorschau.baenderWerdenLeer).toEqual([])
  })

  it('ein Video, das die Aktion NIRGENDS im Band fuehrt, taucht nicht auf', () => {
    const liste = [video('e1', ['a9', 'a8'])]

    const vorschau = berechneLoeschVorschau('a2', liste)

    expect(vorschau.gekuerzteElementIds).toEqual([])
    expect(vorschau.baenderWerdenLeer).toEqual([])
  })

  it('segment UND video koennen gleichzeitig treffen - die Listen ergaenzen sich', () => {
    const liste = [segment('s1', 'a2'), video('v1', ['a2', 'a9'])]

    const vorschau = berechneLoeschVorschau('a2', liste)

    expect(vorschau.entfernteElementIds).toEqual(['s1'])
    expect(vorschau.gekuerzteElementIds).toEqual(['v1'])
    expect(vorschau.baenderWerdenLeer).toEqual([])
  })

  it('mehrere Videos, nur die betroffenen werden gemeldet', () => {
    const liste = [
      video('v1', ['a2', 'a9']),
      video('v2', ['a9']),
      video('v3', ['a2']),
    ]

    const vorschau = berechneLoeschVorschau('a2', liste)

    expect(vorschau.gekuerzteElementIds).toEqual(['v1', 'v3'])
    expect(vorschau.baenderWerdenLeer).toEqual(['v3'])
  })

  it('eine leere Liste ist gueltig - alle drei Listen leer', () => {
    const vorschau = berechneLoeschVorschau('a2', [])

    expect(vorschau).toEqual({ entfernteElementIds: [], gekuerzteElementIds: [], baenderWerdenLeer: [] })
  })

  it('eine Aktion, die nirgends verwendet wird, ist kein Fehler - alle drei Listen leer', () => {
    const liste = [segment('e1', 'a1'), video('v1', ['a1'])]

    const vorschau = berechneLoeschVorschau('a217', liste)

    expect(vorschau).toEqual({ entfernteElementIds: [], gekuerzteElementIds: [], baenderWerdenLeer: [] })
  })
})

// ---------------------------------------------------------------------------
// berechneLoeschVorschau - Reinheit
// ---------------------------------------------------------------------------

describe('berechneLoeschVorschau - rein, synchron, ohne Nebenwirkung', () => {
  it('veraendert die uebergebene Liste nicht - tief gleich vor und nach dem Aufruf', () => {
    const liste = [segment('e1', 'a1'), segment('e2', 'a2'), video('v1', ['a2', 'a2'])]
    const vorher = structuredClone(liste)

    berechneLoeschVorschau('a2', liste)

    expect(liste).toEqual(vorher)
    expect(liste).toBeInstanceOf(Array)
    // Auch die Elemente selbst sind nicht angefasst.
    expect(liste[0]).toEqual(vorher[0])
    expect(liste[2]?.einblendung).toEqual(vorher[2]?.einblendung)
  })
})

// ---------------------------------------------------------------------------
// loescheAktion - der Aufruf hinaus
// ---------------------------------------------------------------------------

describe('loescheAktion - der Aufruf hinaus', () => {
  it('ruft rufeAuf mit dem Kanal aus KANAELE.project.löscheAktion', async () => {
    doppel.antwort = { ok: true, wert: { stand: stand(), entfernteElementIds: ['e1'], geaenderteElementIds: ['v1'] } }

    await loescheAktion('a2')

    expect(doppel.aufrufe).toHaveLength(1)
    expect(doppel.aufrufe[0]?.kanal).toBe(KANAELE.project.löscheAktion)
  })

  it('schickt die Nutzlast { id: aktionId } - exakt dieser Feldname', async () => {
    doppel.antwort = { ok: true, wert: { stand: stand(), entfernteElementIds: [], geaenderteElementIds: [] } }

    await loescheAktion('a217')

    expect(Object.keys(doppel.aufrufe[0]?.nutzlast as object)).toEqual(['id'])
    expect(doppel.aufrufe[0]?.nutzlast).toEqual({ id: 'a217' })
  })

  it('eine leere aktionId loest KEINEN IPC-Aufruf aus', async () => {
    const ergebnis = await loescheAktion('')

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })

  it('nur Leerzeichen zaehlen wie leer - dieselbe Grenze wie die Nutzlast-Pruefung', async () => {
    const ergebnis = await loescheAktion('   ')

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })

  it('ein nicht-String wirft nicht und loest keinen Aufruf aus', async () => {
    const ergebnis = await loescheAktion(undefined as unknown as string)

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })
})

// ---------------------------------------------------------------------------
// loescheAktion - Antwort wird UNAENDERERT weitergegeben
// ---------------------------------------------------------------------------

describe('loescheAktion - die Antwort wird unveraendert weitergereicht', () => {
  it('ein ok:true wird unveraendert zurueckgegeben - referenzgleich', async () => {
    const wert = {
      stand: { aktionen: [aktion('a9')], liste: [segment('e1', 'a1')] },
      entfernteElementIds: ['e1'],
      geaenderteElementIds: ['v1'],
    }
    doppel.antwort = { ok: true, wert }

    const ergebnis = await loescheAktion('a2')

    expect(ergebnis.ok).toBe(true)
    if (ergebnis.ok) {
      // Referenzgleich: kein Auspacken, kein Umformen, kein Nachrechnen.
      expect(ergebnis.wert).toBe(wert)
      expect(ergebnis.wert.stand).toBe(wert.stand)
      expect(ergebnis.wert.entfernteElementIds).toBe(wert.entfernteElementIds)
      expect(ergebnis.wert.geaenderteElementIds).toBe(wert.geaenderteElementIds)
    }
  })

  it('ein ok:false wird unveraendert zurueckgegeben - gleicher code, gleiche meldung, kein throw', async () => {
    doppel.antwort = {
      ok: false,
      fehler: { code: 'nicht_gefunden', meldung: 'Es gibt keine Aktion mit dieser id.' },
    }

    const ergebnis = await loescheAktion('a217')

    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: 'nicht_gefunden', meldung: 'Es gibt keine Aktion mit dieser id.' },
    })
  })

  it('reicht auch einen generischen Code mit daten unveraendert durch', async () => {
    const fehler = { code: 'unbekannter_fehler', meldung: 'Kaputt.', daten: { irgendetwas: true } }
    doppel.antwort = { ok: false, fehler }

    const ergebnis = await loescheAktion('a217')

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) {
      expect(ergebnis.fehler).toBe(fehler)
    }
  })
})

// ---------------------------------------------------------------------------
// Quelltext-Proben - Abwesenheit, nicht Verhalten (auch mit einem Doppel nicht
// messbar).
// ---------------------------------------------------------------------------

// `\r\n` wird ZUERST vereinheitlicht (core.autocrlf=true; s. #123/#191).
const QUELLE = readFileSync('src/renderer/action-editor/aktion-loeschen.ts', 'utf8').replace(/\r\n/g, '\n')
const CODEZEILEN = QUELLE.split('\n').filter(
  (zeile) => !zeile.trimStart().startsWith('//') && !zeile.trimStart().startsWith('*'),
)
const CODE = CODEZEILEN.join('\n')

describe('aktion-loeschen.ts - was die Datei NICHT enthaelt', () => {
  it('der Kommentar-Filter greift ueberhaupt', () => {
    expect(CODEZEILEN.length).toBeLessThan(QUELLE.split('\n').length)
    expect(CODE).not.toContain('TK 9.5.3')
    expect(CODE).toContain('export async function loescheAktion')
  })

  it('kein Kanal-Literal, kein window.api, kein fs', () => {
    // Absichtlich auf der UNGEFILTERTEN Quelle: Die DoD verlangt die Zeichenketten
    // nirgends in der Datei, auch nicht in einer Begruendung.
    expect(QUELLE).not.toContain('project:')
    expect(CODE).not.toContain('window.api')
    expect(CODE).not.toMatch(/from '(node:)?fs'/)
  })

  it('kein reiheEin - Medien bleiben unangetastet (TK 9.5.3)', () => {
    expect(CODE).not.toContain('reiheEin')
  })

  it('nutzt genau den einen Kanal aus der Registry und ruft KEINE Projekt-Mutation', () => {
    // Ein einziges `rufeAuf` im ganzen Rumpf; der Kanal kommt aus KANAELE.
    expect(CODE.match(/rufeAuf\s*</g) ?? []).toHaveLength(1)
    expect(CODE).toContain('KANAELE.project.löscheAktion')
    expect(CODE).not.toMatch(/KANAELE\.media\b/)
    // Die Kaskade wird hier nicht selbst ausgefuehrt.
    expect(CODE).not.toContain('entferneElement')
    expect(CODE).not.toContain('setzeEinblendung')
    expect(CODE).not.toContain('ordneNeu')
  })

  it('kein throw im Rumpf - die Antwort wird nicht "ausgepackt"', () => {
    expect(CODE).not.toMatch(/\bthrow\b/)
  })
})