// Logik-Tests zu #207 – die aufgeklappte Liste (listen-zeilen.ts, node).
//
// Die Ableitung ist REIN: aus der Sicht werden die Zeilen in EXAKT der gelieferten
// Reihenfolge gebaut - ohne Sortieren, Filtern oder Kappen (TK 9.3.5, FA-16). Die
// Reihenfolge ist Vertrag von #64; ein zweiter Sortierweg hier waere der teuerste
// lokale Fehlgriff des Issues.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

import { baueListenInhalt } from '../../src/renderer/queue-panel/listen-zeilen'
import type { Auftrag, AuftragStatus } from '../../src/shared/contracts/auftrag'
import type { AuftragsSicht } from '../../src/renderer/queue-panel/auftrags-sicht'

function auftrag(teil: Partial<Auftrag> & { auftragId: string }): Auftrag {
  return {
    art: 'render',
    status: 'anstehend',
    label: `Render ${teil.auftragId}`,
    payload: { projektId: 'p-1', vorlagenId: 'v-1', ausgabeId: 'a-1' },
    fortschritt: null,
    versuche: 0,
    fehler: null,
    ergebnis: null,
    erstelltAm: '2026-01-01T00:00:00.000Z',
    ...teil,
  } as Auftrag
}

function geladen(...auftraege: Auftrag[]): AuftragsSicht {
  return { zustand: 'geladen', auftraege }
}

describe('baueListenInhalt – Reihenfolge und Vollstaendigkeit (DoD)', () => {
  it('liefert bei n Auftraegen genau n Zeilen in derselben Reihenfolge wie das Eingangs-Array (DoD)', () => {
    // Eine Reihenfolge, die weder nach erstelltAm noch nach status noch nach label
    // sortiert ist - dann belegt die Gleichheit die uebernommene Eingabeordnung.
    const sicht = geladen(
      auftrag({ auftragId: 'c', status: 'fehlgeschlagen', erstelltAm: '2026-03-01T00:00:00.000Z' }),
      auftrag({ auftragId: 'a', status: 'anstehend', erstelltAm: '2026-01-01T00:00:00.000Z' }),
      auftrag({ auftragId: 'b', status: 'laeuft', erstelltAm: '2026-02-01T00:00:00.000Z' }),
    )
    const inhalt = baueListenInhalt(sicht)

    expect(inhalt.zustand).toBe('zeilen')
    if (inhalt.zustand === 'zeilen') {
      expect(inhalt.zeilen).toHaveLength(3)
      expect(inhalt.zeilen.map((z) => z.auftragId)).toEqual(['c', 'a', 'b'])
    }
  })

  it('laesst die Status-Folge laeuft, anstehend, anstehend, fehlgeschlagen ungruppiert (DoD)', () => {
    const folge: AuftragStatus[] = ['laeuft', 'anstehend', 'anstehend', 'fehlgeschlagen']
    const sicht = geladen(...folge.map((status, i) => auftrag({ auftragId: `a${i}`, status })))
    const inhalt = baueListenInhalt(sicht)

    expect(inhalt.zustand).toBe('zeilen')
    if (inhalt.zustand === 'zeilen') {
      expect(inhalt.zeilen.map((z) => z.status)).toEqual(folge)
    }
  })

  it('laesst status erfolg und abgebrochen als Zeile stehen – nichts wird weggefiltert (DoD)', () => {
    const sicht = geladen(
      auftrag({ auftragId: 'e', status: 'erfolg' }),
      auftrag({ auftragId: 'a', status: 'abgebrochen' }),
    )
    const inhalt = baueListenInhalt(sicht)

    expect(inhalt.zustand).toBe('zeilen')
    if (inhalt.zustand === 'zeilen') {
      expect(inhalt.zeilen).toHaveLength(2)
      expect(inhalt.zeilen.map((z) => z.status)).toEqual(['erfolg', 'abgebrochen'])
    }
  })
})

describe('baueListenInhalt – Zustaende (DoD)', () => {
  it('bildet { zustand: "unbekannt" } NICHT auf leer ab (Invariante 1)', () => {
    expect(baueListenInhalt({ zustand: 'unbekannt' })).toEqual({ zustand: 'unbekannt' })
  })

  it('bildet geladen mit leerem Array auf leer ab (ENTSCHIEDEN)', () => {
    expect(baueListenInhalt(geladen())).toEqual({ zustand: 'leer' })
  })

  it('reicht einen fehler-Zustand mit unveraendertem Code durch (DoD)', () => {
    const sicht: AuftragsSicht = { zustand: 'fehler', code: 'unbekannter_fehler', meldung: 'kaputt' }
    expect(baueListenInhalt(sicht)).toEqual(sicht)
  })
})

describe('baueListenInhalt – Zeilenfelder (DoD)', () => {
  it('uebernimmt fehler byte-gleich aus dem Auftrag – nichts gebaut, daten erhalten (DoD)', () => {
    const fehler = { code: 'quelle_lesen_fehler', meldung: 'Datei weg', daten: { pfad: '/x' } }
    const sicht = geladen(auftrag({ auftragId: 'f', status: 'fehlgeschlagen', fehler }))
    const inhalt = baueListenInhalt(sicht)

    expect(inhalt.zustand).toBe('zeilen')
    if (inhalt.zustand === 'zeilen') {
      expect(inhalt.zeilen[0]?.fehler).toBe(fehler)
    }
  })

  it('laesst fortschritt: null unveraendert; klemmt -1 auf 0 und 200 auf 100 (DoD)', () => {
    const sicht = geladen(
      auftrag({ auftragId: 'n', fortschritt: null }),
      auftrag({ auftragId: 't', fortschritt: -1 }),
      auftrag({ auftragId: 'z', fortschritt: 200 }),
    )
    const inhalt = baueListenInhalt(sicht)

    expect(inhalt.zustand).toBe('zeilen')
    if (inhalt.zustand === 'zeilen') {
      expect(inhalt.zeilen.map((z) => z.fortschritt)).toEqual([null, 0, 100])
    }
  })

  it('uebersetzt die Status in zustandText (ENTSCHIEDEN)', () => {
    const sicht = geladen(
      auftrag({ auftragId: 'l', status: 'laeuft' }),
      auftrag({ auftragId: 'w', status: 'anstehend' }),
      auftrag({ auftragId: 'f', status: 'fehlgeschlagen' }),
      auftrag({ auftragId: 'e', status: 'erfolg' }),
      auftrag({ auftragId: 'a', status: 'abgebrochen' }),
    )
    const inhalt = baueListenInhalt(sicht)

    expect(inhalt.zustand).toBe('zeilen')
    if (inhalt.zustand === 'zeilen') {
      expect(inhalt.zeilen.map((z) => z.zustandText)).toEqual([
        'läuft',
        'wartet',
        'fehlgeschlagen',
        'fertig',
        'abgebrochen',
      ])
    }
  })

  it('liefert fuer jeden Status der Union einen zustandText und wirft nie (DoD)', () => {
    const statusFolge: AuftragStatus[] = [
      'anstehend',
      'laeuft',
      'erfolg',
      'fehlgeschlagen',
      'abgebrochen',
    ]
    const inhalt = baueListenInhalt(
      geladen(...statusFolge.map((status, i) => auftrag({ auftragId: `a${i}`, status }))),
    )

    expect(inhalt.zustand).toBe('zeilen')
    if (inhalt.zustand === 'zeilen') {
      // Die Reihenfolge bleibt die Eingabe-Reihenfolge; jeder Status hat einen Text.
      expect(inhalt.zeilen.map((z) => z.zustandText)).toEqual([
        'wartet',
        'läuft',
        'fertig',
        'fehlgeschlagen',
        'abgebrochen',
      ])
    }
  })
})

describe('DoD-Grep-Proben (Quelltext)', () => {
  const CODE = readFileSync('src/renderer/queue-panel/listen-zeilen.ts', 'utf8')

  it('enthaelt kein Sortieren, kein reverse, kein Filter, kein slice (DoD)', () => {
    for (const verboten of ['.sort(', '.reverse(', '.filter(', '.slice(']) {
      expect(CODE, verboten).not.toContain(verboten)
    }
  })

  it('enthaelt kein queue:-Literal, kein rufeAuf, kein abonniere, kein window.api (DoD)', () => {
    for (const verboten of ["'queue:", 'rufeAuf', 'abonniere', 'window.api']) {
      expect(CODE, verboten).not.toContain(verboten)
    }
  })
})