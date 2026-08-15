// Verhaltenstests zu #124 - `entferneElementAusListe` im composer.
//
// Die Datei sieht harmlos aus und sitzt an einer heiklen Stelle. Geprüft wird
// deshalb vor allem, was NICHT geschieht: keine zweite Löschung (Assets und
// Aktionen bleiben unangetastet, TK 9.5.3), keine Sonderbehandlung kaputter
// Elemente (der Reparatur-Modus geht genau hier durch, TK 9.7.5), kein lokales
// Streichen bei `nicht_gefunden`, kein zweiter Kanal.
//
// Die Doppel sind absichtlich echte kleine Attrappen: Ein `setzeListe`, das nichts
// speichert, könnte "steht es noch da?" gar nicht beantworten, und ein `holeSicht`,
// das immer dasselbe liefert, verdeckte den Fall, dass zwischen Aufruf und Antwort
// etwas an der Liste passiert ist.
import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Asset } from '../../src/shared/contracts/asset'
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
    // Wie #121: NUR `liste` wird ersetzt. Assets und Aktionen reicht das Doppel
    // unverändert durch - liefe die zu prüfende Datei über einen anderen Weg an
    // sie heran, fiele es hier auf.
    if (doppel.projekt !== null) doppel.projekt = { ...doppel.projekt, liste }
  },
}))

import { entferneElementAusListe } from '../../src/renderer/composer/element-entfernen'

// ---------------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------------

function element(id: string, ref: string): Listenelement {
  return { id, art: 'segment', ref, dauer: 12, trimStart: null, trimEnde: null, einblendung: null }
}

function asset(id: string, zustand: Asset['zustand']): Asset {
  return {
    id,
    typ: 'video',
    dateiname: `${id}.mp4`,
    originalname: `${id}.mp4`,
    maße: { breite: 1920, höhe: 1080 },
    dauer: 30,
    importdatum: '2026-08-15T00:00:00.000Z',
    zustand,
  }
}

function projekt(liste: Listenelement[], assets: Asset[] = [], aktionen: Aktion[] = []): Project {
  return {
    id: 'p1',
    name: 'Testprojekt',
    erstelltAm: '2026-08-15T00:00:00.000Z',
    geaendertAm: '2026-08-15T00:00:00.000Z',
    schemaVersion: 1,
    assets,
    aktionen,
    liste,
    letzterAusgabeName: null,
  }
}

function aktuelleListe(): Listenelement[] {
  return doppel.projekt === null ? [] : doppel.projekt.liste
}

/** Fünf Elemente - entfernt wird in den Reihenfolge-Tests das MITTLERE. */
function fuenf(): Listenelement[] {
  return [
    element('e1', 'a1'),
    element('e2', 'a2'),
    element('e3', 'a3'),
    element('e4', 'a4'),
    element('e5', 'a5'),
  ]
}

beforeEach(() => {
  doppel.aufrufe = []
  doppel.gesetzteListen = []
  doppel.antwort = { ok: false, fehler: { code: 'unbekannter_fehler', meldung: 'nicht gesetzt' } }
  doppel.projekt = projekt([])
})

// ---------------------------------------------------------------------------

describe('entferneElementAusListe - der Aufruf hinaus', () => {
  it('ruft genau einmal auf, auf dem Kanal des Vertrags, mit der Nutzlast { elementId }', async () => {
    doppel.projekt = projekt(fuenf())
    doppel.antwort = { ok: true, wert: undefined }

    await entferneElementAusListe('e2')

    expect(doppel.aufrufe).toHaveLength(1)
    expect(doppel.aufrufe[0]?.kanal).toBe(KANAELE.project.entferneElement)
    // Die SCHLÜSSELMENGE, nicht nur der Inhalt: ein zusätzliches Feld wäre eine
    // Vorbelegung, die die Form-Prüfung des ipc-gateway nicht vorsieht.
    expect(Object.keys(doppel.aufrufe[0]?.nutzlast as object)).toEqual(['elementId'])
    expect(doppel.aufrufe[0]?.nutzlast).toEqual({ elementId: 'e2' })
  })

  it('benutzt NUR diesen einen Kanal - über alle Aufrufe hinweg', async () => {
    doppel.projekt = projekt(fuenf())
    doppel.antwort = { ok: true, wert: undefined }

    await entferneElementAusListe('e2')
    await entferneElementAusListe('e4')

    const kanaele = new Set(doppel.aufrufe.map((a) => a.kanal))
    expect([...kanaele]).toEqual([KANAELE.project.entferneElement])
  })

  it('reicht die Kennung unverändert durch - kein Kürzen, kein Umformen', async () => {
    doppel.antwort = { ok: true, wert: undefined }

    await entferneElementAusListe(' e2 ')

    expect(doppel.aufrufe[0]?.nutzlast).toEqual({ elementId: ' e2 ' })
  })
})

describe('entferneElementAusListe - Erfolg', () => {
  it('entfernt das mittlere Element und lässt die relative Reihenfolge unberührt', async () => {
    doppel.projekt = projekt(fuenf())
    doppel.antwort = { ok: true, wert: undefined }

    const ergebnis = await entferneElementAusListe('e3')

    expect(ergebnis.ok).toBe(true)
    expect(aktuelleListe().map((e) => e.id)).toEqual(['e1', 'e2', 'e4', 'e5'])
    // Kein Platzhalter, keine Lücke, kein `undefined` (TK 9.11.3).
    expect(aktuelleListe().every((e) => e !== undefined)).toBe(true)
    expect(aktuelleListe()).toHaveLength(4)
  })

  it('lässt die übrigen Elemente OBJEKTGLEICH stehen - keine Neubauten', async () => {
    const vorher = fuenf()
    doppel.projekt = projekt(vorher)
    doppel.antwort = { ok: true, wert: undefined }

    await entferneElementAusListe('e3')

    expect(aktuelleListe()[0]).toBe(vorher[0])
    expect(aktuelleListe()[2]).toBe(vorher[3])
  })

  it('verändert die vorhandene Liste nicht an Ort und Stelle', async () => {
    const vorher = fuenf()
    doppel.projekt = projekt(vorher)
    doppel.antwort = { ok: true, wert: undefined }

    await entferneElementAusListe('e3')

    expect(vorher).toHaveLength(5)
    expect(vorher.map((e) => e.id)).toEqual(['e1', 'e2', 'e3', 'e4', 'e5'])
    expect(doppel.gesetzteListen[0]).not.toBe(vorher)
  })

  it('fasst Project.assets und Project.aktionen NICHT an (TK 9.5.3)', async () => {
    const assets = [asset('a1', 'ok'), asset('a2', 'ok')]
    const aktionen: Aktion[] = []
    doppel.projekt = projekt(fuenf(), assets, aktionen)
    const assetsVorher = doppel.projekt.assets
    const aktionenVorher = doppel.projekt.aktionen
    doppel.antwort = { ok: true, wert: undefined }

    await entferneElementAusListe('e3')

    // Objektgleich UND inhaltsgleich: Ein "Aufräumen" hätte hier ein neues Array
    // gesetzt oder Einträge gestrichen.
    expect(doppel.projekt?.assets).toBe(assetsVorher)
    expect(doppel.projekt?.aktionen).toBe(aktionenVorher)
    expect(doppel.projekt?.assets).toEqual(assets)
    expect(doppel.projekt?.aktionen).toEqual(aktionen)
  })

  it('das letzte Element zu entfernen ist erlaubt - die leere Liste wird nicht vorab abgelehnt', async () => {
    doppel.projekt = projekt([element('e1', 'a1')])
    doppel.antwort = { ok: true, wert: undefined }

    const ergebnis = await entferneElementAusListe('e1')

    expect(doppel.aufrufe).toHaveLength(1)
    expect(ergebnis.ok).toBe(true)
    expect(aktuelleListe()).toEqual([])
  })

  it('liest den Stand der Sicht NACH der Antwort, nicht davor', async () => {
    // Zwischen Aufruf und Antwort hängt jemand anders ein Element an. Wer sich die
    // Liste vor dem `await` merkt, schreibt sie hier zurück und macht das
    // Hinzufügen rückgängig - lautlos.
    doppel.projekt = projekt([element('e1', 'a1'), element('e2', 'a2')])
    doppel.antwort = { ok: true, wert: undefined }

    const laufend = entferneElementAusListe('e1')
    doppel.projekt = projekt([element('e1', 'a1'), element('e2', 'a2'), element('e9', 'a9')])
    await laufend

    expect(aktuelleListe().map((e) => e.id)).toEqual(['e2', 'e9'])
  })

  it('meldet den Erfolg auch dann, wenn das Projekt inzwischen geschlossen wurde', async () => {
    doppel.projekt = projekt(fuenf())
    doppel.antwort = { ok: true, wert: undefined }

    const laufend = entferneElementAusListe('e3')
    doppel.projekt = null
    const ergebnis = await laufend

    expect(ergebnis.ok).toBe(true)
    expect(doppel.gesetzteListen).toEqual([])
  })
})

describe('entferneElementAusListe - der Reparatur-Weg (TK 9.7.5)', () => {
  it('entfernt ein kaputtes Element ohne jede Sonderbehandlung', async () => {
    // `ref` zeigt auf ein Asset mit `zustand: 'fehlt'` - genau der Fall, für den
    // FA-19 diese Datei als eine der drei Fix-Optionen benutzt.
    const kaputt = { ...element('e3', 'a3'), art: 'video' as const }
    doppel.projekt = projekt(
      [element('e1', 'a1'), kaputt, element('e5', 'a5')],
      [asset('a1', 'ok'), asset('a3', 'fehlt')],
    )
    doppel.antwort = { ok: true, wert: undefined }

    const ergebnis = await entferneElementAusListe('e3')

    expect(ergebnis.ok).toBe(true)
    // DERSELBE eine Aufruf, kein zusätzlicher Zweig, kein Vorab-Check.
    expect(doppel.aufrufe).toHaveLength(1)
    expect(doppel.aufrufe[0]?.nutzlast).toEqual({ elementId: 'e3' })
    expect(aktuelleListe().map((e) => e.id)).toEqual(['e1', 'e5'])
    // Das fehlende Asset bleibt im Bestand - entfernt wurde nur der Listeneintrag.
    expect(doppel.projekt?.assets.map((a) => a.id)).toEqual(['a1', 'a3'])
  })
})

describe('entferneElementAusListe - Fehlerpfade', () => {
  it('reicht nicht_gefunden unverändert durch und streicht NICHTS lokal', async () => {
    doppel.projekt = projekt(fuenf())
    doppel.antwort = {
      ok: false,
      fehler: { code: 'nicht_gefunden', meldung: 'Kein Element mit dieser id.' },
    }

    const ergebnis = await entferneElementAusListe('e3')

    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: 'nicht_gefunden', meldung: 'Kein Element mit dieser id.' },
    })
    expect(aktuelleListe().map((e) => e.id)).toEqual(['e1', 'e2', 'e3', 'e4', 'e5'])
    expect(doppel.gesetzteListen).toEqual([])
  })

  it('reicht auch einen fachlichen Code des Main unverändert durch', async () => {
    doppel.projekt = projekt(fuenf())
    doppel.antwort = { ok: false, fehler: { code: 'kein_projekt', meldung: 'Kein Projekt offen.' } }

    const ergebnis = await entferneElementAusListe('e3')

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('kein_projekt')
    expect(aktuelleListe()).toHaveLength(5)
    expect(doppel.gesetzteListen).toEqual([])
  })

  it('eine leere Kennung löst KEINEN Aufruf aus', async () => {
    doppel.projekt = projekt(fuenf())

    const ergebnis = await entferneElementAusListe('')

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(doppel.gesetzteListen).toEqual([])
  })

  it('nur Leerzeichen zählen wie leer - dieselbe Grenze wie die Nutzlast-Prüfung', async () => {
    const ergebnis = await entferneElementAusListe('   ')

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
  })

  it('ein nicht-String löst KEINEN Aufruf aus und wirft nicht', async () => {
    const ergebnis = await entferneElementAusListe(undefined as unknown as string)

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })

  it('ohne geladenes Projekt wird gar nicht erst gefragt', async () => {
    doppel.projekt = null

    const ergebnis = await entferneElementAusListe('e3')

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })
})

// ---------------------------------------------------------------------------
// Quelltext-Proben. Sie prüfen nicht Verhalten, sondern ABWESENHEIT - und genau die
// ist mit Doppeln nicht messbar.
// ---------------------------------------------------------------------------

// `\r\n` wird ZUERST vereinheitlicht (core.autocrlf=true; s. #123/#191).
const QUELLE = readFileSync('src/renderer/composer/element-entfernen.ts', 'utf8').replace(
  /\r\n/g,
  '\n',
)
const CODEZEILEN = QUELLE.split('\n').filter(
  (zeile) => !zeile.trimStart().startsWith('//') && !zeile.trimStart().startsWith('*'),
)
const CODE = CODEZEILEN.join('\n')

describe('entferneElementAusListe - was die Datei NICHT enthält', () => {
  it('der Kommentar-Filter greift überhaupt', () => {
    // Gegenprobe zum Filter selbst: Ein Filter, der nichts entfernt, macht jede
    // Abwesenheits-Probe darunter strenger als nötig - einer, der zu viel entfernt,
    // macht sie wertlos. Beide Enden sind hier festgenagelt.
    expect(CODEZEILEN.length).toBeLessThan(QUELLE.split('\n').length)
    expect(CODE).not.toContain('TK 9.5.3')
    expect(CODE).toContain('export async function entferneElementAusListe')
  })

  it('exportiert NICHT den Main-Namen entferneElement', () => {
    // Zwei gleichnamige Exporte auf beiden Seiten der Prozessgrenze laden dazu ein,
    // in einer Importzeile die falsche zu erwischen - und der Fehler fiele erst zur
    // Laufzeit auf, weil beide dieselbe Signatur haben.
    expect(CODE).not.toMatch(/export\s+(async\s+)?function\s+entferneElement\s*\(/)
    expect(CODE).not.toMatch(/export\s*\{[^}]*\bentferneElement\b[^}]*\}/)
  })

  it('enthält kein Kanal-Literal, kein window.api, kein fs', () => {
    // Absichtlich auf der UNGEFILTERTEN Quelle: Die DoD verlangt die Zeichenketten
    // nirgends in der Datei, auch nicht in einer Begründung.
    expect(QUELLE).not.toContain('project:')
    expect(QUELLE).not.toContain('media:')
    expect(CODE).not.toContain('window.api')
    expect(CODE).not.toMatch(/from '(node:)?fs'/)
  })

  it('ruft keinen zweiten Kanal und keine zweite Operation auf', () => {
    // Ein einziges `rufeAuf` im ganzen Rumpf, und ein einziger KANAELE-Zugriff.
    expect(CODE.match(/rufeAuf\s*</g) ?? []).toHaveLength(1)
    expect(CODE.match(/KANAELE\./g) ?? []).toHaveLength(1)
    expect(CODE).toContain('KANAELE.project.entferneElement')
    expect(CODE).not.toMatch(/KANAELE\.media\b/)
    expect(CODE).not.toContain('loescheAktion')
    expect(CODE).not.toContain('löscheAktion')
  })

  it('führt keinen eigenen Speicher und keinen Undo-Puffer', () => {
    expect(CODE).toContain("from './projektzustand'")
    // Kein Modul-Zustand: die einzigen Bindungen im Rumpf sind `antwort` und
    // `projekt`, beide `const` innerhalb der Funktion.
    expect(CODE).not.toMatch(/^\s*(let|var)\s/m)
    expect(CODE).not.toMatch(/\bundo\b/i)
  })
})
