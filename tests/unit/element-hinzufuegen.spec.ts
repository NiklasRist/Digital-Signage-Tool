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
// die Betriebsart, für die das Datenmodell gebaut wurde) und die Position (#411) -
// inklusive der Klammer, die eine negative Stelle auf 0 zieht.
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

import { setzeListe as quelleSetzeListe } from '../../src/renderer/composer/projektzustand'
import { fuegeElementHinzu } from '../../src/renderer/composer/element-hinzufuegen'

// #415 (Variante a): der III. Param ist PFLICHT (Wrapped-Zugangs-`setzeListe`). Der
// Test-Schreiber laeuft ueber DASSELBE gemockte setzeListe (#121) - genau wie die
// Wrapped-Huelle es tut (Schnappschuss, dann Store). Wer vergisst einzubeziehen,
// faellt sichtbar aus den bestandigen Sicht-Regeln heraus.
const schreiber = (liste: Listenelement[]): void => {
  quelleSetzeListe(liste)
}

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
    standardMarkeId: "marke-test",
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

    await fuegeElementHinzu('a1', undefined, schreiber)

    expect(doppel.aufrufe).toHaveLength(1)
    expect(doppel.aufrufe[0]?.kanal).toBe(KANAELE.project.fügeElementHinzu)
    // Die SCHLÜSSELMENGE, nicht nur der Inhalt: Ein zusätzliches `dauer: 10` oder
    // `art: 'segment'` wäre genau die zweite Fachlogik neben #41, die das Issue
    // verbietet - und ein `toMatchObject` ginge daran vorbei.
    // #411: OHNE `position` bleibt die Schlüsselmenge [['referenz']] - die Nutzlast
    // wird KONDITIONAL gebaut, nicht als Shorthand mit `position: undefined`.
    expect(Object.keys(doppel.aufrufe[0]?.nutzlast as object)).toEqual(['referenz'])
    expect(doppel.aufrufe[0]?.nutzlast).toEqual({ referenz: 'a1' })
  })

  it('#411: MIT position trägt die Nutzlast GENAU die zwei Schlüssel referenz+position', async () => {
    doppel.antwort = { ok: true, wert: element('e1', 'a1') }

    await fuegeElementHinzu('a1', 2, schreiber)

    expect(Object.keys(doppel.aufrufe[0]?.nutzlast as object)).toEqual(['referenz', 'position'])
    expect(doppel.aufrufe[0]?.nutzlast).toEqual({ referenz: 'a1', position: 2 })
  })

  it('reicht die Referenz unverändert durch - kein Kürzen, kein Umformen', async () => {
    doppel.antwort = { ok: true, wert: element('e1', ' a1 ') }

    await fuegeElementHinzu(' a1 ', undefined, schreiber)

    expect(doppel.aufrufe[0]?.nutzlast).toEqual({ referenz: ' a1 ' })
  })
})

describe('fuegeElementHinzu - Erfolg', () => {
  it('hängt EXAKT das zurückgegebene Objekt ans Ende der Sicht', async () => {
    doppel.projekt = projekt([element('e0', 'a0')])
    const neu = element('e1', 'a1')
    doppel.antwort = { ok: true, wert: neu }

    const ergebnis = await fuegeElementHinzu('a1', undefined, schreiber)

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

    await fuegeElementHinzu('a1', undefined, schreiber)

    expect(vorher).toHaveLength(1)
    expect(doppel.gesetzteListen[0]).not.toBe(vorher)
  })

  it('#411: fügt MIT position an DIESEM Sicht-Index ein, nicht ans Ende', async () => {
    doppel.projekt = projekt([element('e0', 'a0'), element('e1', 'a1'), element('e2', 'a2')])
    const neu = element('e-neu', 'a-neu')
    doppel.antwort = { ok: true, wert: neu }

    await fuegeElementHinzu('a-neu', 1, schreiber)

    const liste = aktuelleListe()
    expect(liste).toHaveLength(4)
    expect(liste[0]?.id).toBe('e0')
    // Objektgleich: das zurueckgegebene Element steht an Index 1, nichts nachgebaut.
    expect(liste[1]).toBe(neu)
    expect(liste[2]?.id).toBe('e1')
    expect(liste[3]?.id).toBe('e2')
    // GENAU EIN setzeListe pro Erfolg - der Undo-Schnappschuss (einer) kommt aus der
    // Huelle um dieser einzigen setzeListe (undo-aufzeichnung.spec.ts).
    expect(doppel.gesetzteListen).toHaveLength(1)
  })

  it('#411: eine NEGATIVE Position wird auf 0 geklemmt - kein Einschub vor dem letzten Element', async () => {
    // Die Klammer im Rumpf ist kein Zierrat: `slice(0, -1)` wuerde das Element VOR
    // dem letzten einsetzen, also an einer Stelle, die niemand angefordert hat.
    doppel.projekt = projekt([element('e0', 'a0'), element('e1', 'a1')])
    const neu = element('e-neu', 'a-neu')
    doppel.antwort = { ok: true, wert: neu }

    await fuegeElementHinzu('a-neu', -1, schreiber)

    expect(aktuelleListe().map((e) => e.id)).toEqual(['e-neu', 'e0', 'e1'])
  })

  it('liest den Stand der Sicht NACH der Antwort, nicht davor', async () => {
    // Zwischen Aufruf und Antwort entfernt jemand anders ein Element. Wer sich die
    // Liste vor dem `await` merkt, schreibt sie hier zurück und macht das Entfernen
    // rückgängig - lautlos.
    doppel.projekt = projekt([element('e0', 'a0'), element('e9', 'a9')])
    const neu = element('e1', 'a1')
    doppel.antwort = { ok: true, wert: neu }

    const laufend = fuegeElementHinzu('a1', undefined, schreiber)
    doppel.projekt = projekt([element('e0', 'a0')])
    await laufend

    expect(aktuelleListe().map((e) => e.id)).toEqual(['e0', 'e1'])
  })

  it('meldet den Erfolg auch dann, wenn das Projekt inzwischen geschlossen wurde', async () => {
    doppel.antwort = { ok: true, wert: element('e1', 'a1') }

    const laufend = fuegeElementHinzu('a1', undefined, schreiber)
    doppel.projekt = null
    const ergebnis = await laufend

    expect(ergebnis.ok).toBe(true)
    expect(doppel.gesetzteListen).toEqual([])
  })

  it('dieselbe Aktions-Referenz zweimal ergibt ZWEI Elemente mit verschiedenen id', async () => {
    doppel.antwort = { ok: true, wert: element('e1', 'aktion-7') }
    await fuegeElementHinzu('aktion-7', undefined, schreiber)
    doppel.antwort = { ok: true, wert: element('e2', 'aktion-7') }
    await fuegeElementHinzu('aktion-7', undefined, schreiber)

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

    const ergebnis = await fuegeElementHinzu('weg', undefined, schreiber)

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

    const ergebnis = await fuegeElementHinzu('a1', undefined, schreiber)

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('kein_projekt')
  })

  it('ein leerer Referenz-String löst KEINEN Aufruf aus', async () => {
    const ergebnis = await fuegeElementHinzu('', undefined, schreiber)

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(doppel.gesetzteListen).toEqual([])
  })

  it('nur Leerzeichen zählen wie leer - dieselbe Grenze wie die Nutzlast-Prüfung', async () => {
    const ergebnis = await fuegeElementHinzu('   ', undefined, schreiber)

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
  })

  it('ein nicht-String löst KEINEN Aufruf aus und wirft nicht', async () => {
    const ergebnis = await fuegeElementHinzu(undefined as unknown as string, undefined, schreiber)

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })

  it('ohne geladenes Projekt wird gar nicht erst gefragt', async () => {
    doppel.projekt = null

    const ergebnis = await fuegeElementHinzu('a1', undefined, schreiber)

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })
})
