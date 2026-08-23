// Verhaltenstests zu #123 - `fuegeElementHinzu` im composer.
//
// Geprüft wird genau die Naht: WAS geht hinaus (die Nutzlast, exakt ein Feld), und
// WAS kommt in der Sicht an (das zurückgegebene Objekt, unverändert, am Ende).
// Beide Doppel sind hier absichtlich echte kleine Attrappen und keine leeren Spione:
// Ein `setzeListe`, das nichts speichert, könnte die Frage "steht es am Ende?" gar
// nicht beantworten, und ein `holeSicht`, das immer dasselbe liefert, verdeckte den
// Fall, dass zwischen Aufruf und Antwort etwas an der Liste passiert ist.
//
// Die teuersten Fälle stehen unten: dieselbe Aktion zweimal (die Mehrfachnutzung ist
// die Betriebsart, für die das Datenmodell gebaut wurde) und der Blick in den
// Quelltext auf die verbotenen Vorbelegungen - eine `dauer`, die der Renderer selbst
// setzt, fällt in keinem Verhaltenstest auf, solange das Doppel sie zurückgibt.
import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Listenelement, Project } from '../../src/shared/contracts/project'
import { KANAELE } from '../../src/shared/contracts/kanaele'

// ---------------------------------------------------------------------------
// Die Doppel. `vi.hoisted`, weil `vi.mock` vor den Importen ausgeführt wird.
// ---------------------------------------------------------------------------

const doppel = vi.hoisted(() => ({
  aufrufe: [] as Array<{ kanal: string; nutzlast: unknown }>,
  antwort: null as unknown,
  projekt: null as Project | null,
  gesetzteListen: [] as Listenelement[][],
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: async (kanal: string, nutzlast?: unknown) => {
    doppel.aufrufe.push({ kanal, nutzlast })
    return doppel.antwort
  },
}))

vi.mock('../../src/renderer/composer/projektzustand', () => ({
  holeSicht: () => ({ projekt: doppel.projekt, ladefehler: null }),
  setzeListe: (liste: Listenelement[]) => {
    doppel.gesetzteListen.push(liste)
    if (doppel.projekt !== null) doppel.projekt = { ...doppel.projekt, liste }
  },
}))

import { fuegeElementHinzu } from '../../src/renderer/composer/element-hinzufuegen'

// ---------------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------------

function element(id: string, ref: string): Listenelement {
  return { id, art: 'segment', ref, dauer: 12, trimStart: null, trimEnde: null, einblendung: null }
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

function aktuelleListe(): Listenelement[] {
  return doppel.projekt === null ? [] : doppel.projekt.liste
}

beforeEach(() => {
  doppel.aufrufe = []
  doppel.gesetzteListen = []
  doppel.antwort = { ok: false, fehler: { code: 'unbekannter_fehler', meldung: 'nicht gesetzt' } }
  doppel.projekt = projekt([])
})

// ---------------------------------------------------------------------------

describe('fuegeElementHinzu - der Aufruf hinaus', () => {
  it('ruft genau einmal auf, auf dem Kanal des Vertrags, mit der Nutzlast { referenz }', async () => {
    const neu = element('e1', 'a1')
    doppel.antwort = { ok: true, wert: neu }

    await fuegeElementHinzu('a1')

    expect(doppel.aufrufe).toHaveLength(1)
    expect(doppel.aufrufe[0]?.kanal).toBe(KANAELE.project.fügeElementHinzu)
    // Die SCHLÜSSELMENGE, nicht nur der Inhalt: Ein zusätzliches `dauer: 10` oder
    // `art: 'segment'` wäre genau die zweite Fachlogik neben #41, die das Issue
    // verbietet - und ein `toMatchObject` ginge daran vorbei.
    expect(Object.keys(doppel.aufrufe[0]?.nutzlast as object)).toEqual(['referenz'])
    expect(doppel.aufrufe[0]?.nutzlast).toEqual({ referenz: 'a1' })
  })

  it('reicht die Referenz unverändert durch - kein Kürzen, kein Umformen', async () => {
    doppel.antwort = { ok: true, wert: element('e1', ' a1 ') }

    await fuegeElementHinzu(' a1 ')

    expect(doppel.aufrufe[0]?.nutzlast).toEqual({ referenz: ' a1 ' })
  })
})

describe('fuegeElementHinzu - Erfolg', () => {
  it('hängt EXAKT das zurückgegebene Objekt ans Ende der Sicht', async () => {
    doppel.projekt = projekt([element('e0', 'a0')])
    const neu = element('e1', 'a1')
    doppel.antwort = { ok: true, wert: neu }

    const ergebnis = await fuegeElementHinzu('a1')

    expect(ergebnis).toEqual({ ok: true, wert: neu })
    expect(aktuelleListe()).toHaveLength(2)
    // Objektgleich, nicht nur inhaltsgleich: ein nachgebautes Element sähe im
    // Deep-Vergleich identisch aus und wäre trotzdem der verbotene zweite Weg.
    expect(aktuelleListe()[1]).toBe(neu)
    expect(aktuelleListe()[0]?.id).toBe('e0')
  })

  it('verändert die vorhandene Liste nicht an Ort und Stelle', async () => {
    const vorher = [element('e0', 'a0')]
    doppel.projekt = projekt(vorher)
    doppel.antwort = { ok: true, wert: element('e1', 'a1') }

    await fuegeElementHinzu('a1')

    expect(vorher).toHaveLength(1)
    expect(doppel.gesetzteListen[0]).not.toBe(vorher)
  })

  it('liest den Stand der Sicht NACH der Antwort, nicht davor', async () => {
    // Zwischen Aufruf und Antwort entfernt jemand anders ein Element. Wer sich die
    // Liste vor dem `await` merkt, schreibt sie hier zurück und macht das Entfernen
    // rückgängig - lautlos.
    doppel.projekt = projekt([element('e0', 'a0'), element('e9', 'a9')])
    const neu = element('e1', 'a1')
    doppel.antwort = { ok: true, wert: neu }

    const laufend = fuegeElementHinzu('a1')
    doppel.projekt = projekt([element('e0', 'a0')])
    await laufend

    expect(aktuelleListe().map((e) => e.id)).toEqual(['e0', 'e1'])
  })

  it('meldet den Erfolg auch dann, wenn das Projekt inzwischen geschlossen wurde', async () => {
    doppel.antwort = { ok: true, wert: element('e1', 'a1') }

    const laufend = fuegeElementHinzu('a1')
    doppel.projekt = null
    const ergebnis = await laufend

    expect(ergebnis.ok).toBe(true)
    expect(doppel.gesetzteListen).toEqual([])
  })

  it('dieselbe Aktions-Referenz zweimal ergibt ZWEI Elemente mit verschiedenen id', async () => {
    doppel.antwort = { ok: true, wert: element('e1', 'aktion-7') }
    await fuegeElementHinzu('aktion-7')
    doppel.antwort = { ok: true, wert: element('e2', 'aktion-7') }
    await fuegeElementHinzu('aktion-7')

    expect(aktuelleListe().map((e) => e.id)).toEqual(['e1', 'e2'])
    expect(aktuelleListe().map((e) => e.ref)).toEqual(['aktion-7', 'aktion-7'])
    expect(doppel.aufrufe).toHaveLength(2)
  })
})

describe('fuegeElementHinzu - Fehlerpfade', () => {
  it('reicht nicht_gefunden unverändert durch und lässt die Sicht in Ruhe', async () => {
    doppel.projekt = projekt([element('e0', 'a0')])
    doppel.antwort = {
      ok: false,
      fehler: { code: 'nicht_gefunden', meldung: 'Referenz kennt niemand.' },
    }

    const ergebnis = await fuegeElementHinzu('weg')

    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: 'nicht_gefunden', meldung: 'Referenz kennt niemand.' },
    })
    expect(aktuelleListe()).toHaveLength(1)
    expect(aktuelleListe()[0]?.id).toBe('e0')
    expect(doppel.gesetzteListen).toEqual([])
  })

  it('reicht auch einen fachlichen Code des Main unverändert durch', async () => {
    doppel.antwort = {
      ok: false,
      fehler: { code: 'kein_projekt', meldung: 'Kein Projekt offen.' },
    }

    const ergebnis = await fuegeElementHinzu('a1')

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('kein_projekt')
  })

  it('ein leerer Referenz-String löst KEINEN Aufruf aus', async () => {
    const ergebnis = await fuegeElementHinzu('')

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(doppel.gesetzteListen).toEqual([])
  })

  it('nur Leerzeichen zählen wie leer - dieselbe Grenze wie die Nutzlast-Prüfung', async () => {
    const ergebnis = await fuegeElementHinzu('   ')

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
  })

  it('ein nicht-String löst KEINEN Aufruf aus und wirft nicht', async () => {
    const ergebnis = await fuegeElementHinzu(undefined as unknown as string)

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })

  it('ohne geladenes Projekt wird gar nicht erst gefragt', async () => {
    doppel.projekt = null

    const ergebnis = await fuegeElementHinzu('a1')

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })
})

// ---------------------------------------------------------------------------
// Quelltext-Proben. Sie prüfen nicht Verhalten, sondern ABWESENHEIT - und genau die
// ist mit Doppeln nicht messbar: Ein Renderer, der `standardDauer` mitschickt, wäre
// in jedem Verhaltenstest oben unauffällig, solange das Doppel antwortet.
// ---------------------------------------------------------------------------

// `\r\n` wird ZUERST vereinheitlicht. Das Repo laeuft mit core.autocrlf=true; ein
// frischer Checkout liefert die Datei mit CRLF, ein hier geschriebener Stand mit LF.
// Ohne die Vereinheitlichung haengt jede zeilenweise Probe davon ab, wie die Datei
// gerade auf die Platte gekommen ist - der Test waere auf einem Rechner streng und
// auf dem naechsten lautlos wertlos (die Fehlerklasse aus #191).
const QUELLE = readFileSync('src/renderer/composer/element-hinzufuegen.ts', 'utf8').replace(
  /\r\n/g,
  '\n',
)
const CODEZEILEN = QUELLE.split('\n').filter(
  (zeile) => !zeile.trimStart().startsWith('//') && !zeile.trimStart().startsWith('*'),
)
const CODE = CODEZEILEN.join('\n')

describe('fuegeElementHinzu - keine zweite Fachlogik in der Datei', () => {
  it('der Kommentar-Filter greift ueberhaupt', () => {
    // Gegenprobe zum Filter selbst: Ein Filter, der nichts entfernt, macht jede
    // Abwesenheits-Probe darunter strenger als noetig - und einer, der zu viel
    // entfernt, macht sie wertlos. Beide Enden sind hier festgenagelt.
    expect(CODEZEILEN.length).toBeLessThan(QUELLE.split('\n').length)
    expect(CODE).not.toContain('TK 9.11.3')
    expect(CODE).toContain('export async function fuegeElementHinzu')
  })

  it('liest nirgends standardDauer', () => {
    // Absichtlich auf der UNGEFILTERTEN Quelle: Die DoD verlangt die Zeichenkette
    // nirgends in der Datei, auch nicht in einer Begruendung.
    expect(QUELLE).not.toContain('standardDauer')
  })

  it('enthält keine Dauer-Zahlen und kein art-Literal', () => {
    expect(CODE).not.toMatch(/\b(10|45)\b/)
    expect(CODE).not.toMatch(/'(video|bild|segment)'/)
  })

  it('enthält kein Kanal-Literal, kein window.api, kein fs', () => {
    expect(QUELLE).not.toContain('project:')
    expect(CODE).not.toContain('window.api')
    expect(CODE).not.toMatch(/from '(node:)?fs'/)
  })

  it('holt den Kanalnamen aus der Registry und ruft über den ipc-client', () => {
    expect(CODE).toContain('KANAELE.project.fügeElementHinzu')
    expect(CODE).toContain("from '../ipc-client/rufe-auf'")
  })
})
