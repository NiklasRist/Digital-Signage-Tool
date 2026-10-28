// DoD zu #155 (Vorlagen-Übersicht). Geprüft wird VERHALTEN an den Nähten: Kanalnamen,
// Nutzlasten, Aufbau beider Listen, Durchreichen von Code und `daten`, die Hörer und der
// Lösch-Nutzungsstand. `rufeAuf` und `starteBearbeitung` sind Doppelgänger - kein Browser.
//
// Die letzten Tests sind Grep-Proben: Sie stehen WÖRTLICH in der DoD dieses Issues.
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Vorlage } from '../../src/shared/contracts/vorlage'

const doppel = vi.hoisted(() => ({
  aufrufe: [] as { kanal: string; nutzlast: unknown }[],
  bearbeitet: [] as string[],
  antworten: new Map<string, unknown>(),
  bearbeitungAntwort: null as unknown,
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: async (kanal: string, nutzlast?: unknown) => {
    doppel.aufrufe.push({ kanal, nutzlast })
    if (!doppel.antworten.has(kanal)) {
      return { ok: false, fehler: { code: 'unbekannter_fehler', meldung: `kein Doppel fuer ${kanal}` } }
    }
    return doppel.antworten.get(kanal)
  },
}))

vi.mock('../../src/renderer/vorlagen-editor/arbeitskopie', () => ({
  starteBearbeitung: async (id: string) => {
    doppel.bearbeitet.push(id)
    return doppel.bearbeitungAntwort
  },
}))

type UebersichtModul = typeof import('../../src/renderer/vorlagen-editor/vorlagen-uebersicht')
let m: UebersichtModul

beforeEach(async () => {
  doppel.aufrufe = []
  doppel.bearbeitet = []
  doppel.antworten = new Map()
  doppel.bearbeitungAntwort = { ok: true, wert: { vorlagenId: 'sitzung' } }
  vi.resetModules()
  m = await import('../../src/renderer/vorlagen-editor/vorlagen-uebersicht')
})

function vorlage(teil: Partial<Vorlage> & { id: string }): Vorlage {
  return {
    name: teil.id,
    art: 'vollflaeche',
    höhe: null,
    parent: null,
    eingebaut: false,
    zonen: [],
    ...teil,
  }
}

function antworte(kanal: string, antwort: unknown): void {
  doppel.antworten.set(kanal, antwort)
}

function setzeListen(nutzbare: Vorlage[], kopien: Vorlage[] = []): void {
  antworte('vorlagen:listeVorlagen', { ok: true, wert: nutzbare })
  antworte('vorlagen:listeArbeitskopien', { ok: true, wert: kopien })
}

function kanalAufrufe(kanal: string): { kanal: string; nutzlast: unknown }[] {
  return doppel.aufrufe.filter((aufruf) => aufruf.kanal === kanal)
}

describe('ladeUebersicht – Aufbau der Sicht', () => {
  it('ruft beide Kanäle ohne Nutzlast auf und behält die gelieferte Reihenfolge', async () => {
    setzeListen([
      vorlage({ id: 'z-eigen', name: 'Zeta' }),
      vorlage({ id: 'vollbild', name: 'Vollbild', eingebaut: true }),
      vorlage({ id: 'a-eigen', name: 'Alpha' }),
    ])

    const ergebnis = await m.ladeUebersicht()

    expect(ergebnis.ok).toBe(true)
    expect(doppel.aufrufe).toEqual([
      { kanal: 'vorlagen:listeVorlagen', nutzlast: undefined },
      { kanal: 'vorlagen:listeArbeitskopien', nutzlast: undefined },
    ])
    if (!ergebnis.ok) return
    expect(ergebnis.wert.nutzbare.map((e) => e.vorlage.id)).toEqual([
      'z-eigen',
      'vollbild',
      'a-eigen',
    ])
  })

  it('kennzeichnet eingebaute Vorlagen als unlöschbar und eigene als löschbar', async () => {
    setzeListen([
      vorlage({ id: 'vollbild', eingebaut: true }),
      vorlage({ id: 'eigene' }),
    ])

    const ergebnis = await m.ladeUebersicht()
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return

    const eingebaut = ergebnis.wert.nutzbare.find((e) => e.vorlage.id === 'vollbild')
    const eigene = ergebnis.wert.nutzbare.find((e) => e.vorlage.id === 'eigene')
    expect(eingebaut).toMatchObject({ eingebaut: true, loeschbar: false })
    expect(eigene).toMatchObject({ eingebaut: false, loeschbar: true })
  })

  it('ordnet eine Arbeitskopie ihrem Parent zu und lässt fremde Einträge bei null', async () => {
    setzeListen(
      [vorlage({ id: 'p1' }), vorlage({ id: 'p2' })],
      [vorlage({ id: 'k1', parent: 'p1' })],
    )

    const ergebnis = await m.ladeUebersicht()
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return

    expect(ergebnis.wert.nutzbare.find((e) => e.vorlage.id === 'p1')?.arbeitskopieId).toBe('k1')
    expect(ergebnis.wert.nutzbare.find((e) => e.vorlage.id === 'p2')?.arbeitskopieId).toBeNull()
  })

  it('führt eine Arbeitskopie ohne Parent als verwaist – und nirgends als Zuordnung', async () => {
    setzeListen(
      [vorlage({ id: 'p1' })],
      [vorlage({ id: 'waise', parent: 'geloescht' })],
    )

    const ergebnis = await m.ladeUebersicht()
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return

    expect(ergebnis.wert.verwaisteArbeitskopien.map((v) => v.id)).toEqual(['waise'])
    expect(ergebnis.wert.nutzbare.map((e) => e.arbeitskopieId)).toEqual([null])
  })

  it('verliert keinen Eintrag und zeigt keinen doppelt', async () => {
    setzeListen(
      [vorlage({ id: 'p1' }), vorlage({ id: 'p2' })],
      [vorlage({ id: 'k1', parent: 'p1' }), vorlage({ id: 'waise', parent: 'weg' })],
    )

    const ergebnis = await m.ladeUebersicht()
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return

    const gesehen = [
      ...ergebnis.wert.nutzbare.map((e) => e.vorlage.id),
      ...ergebnis.wert.verwaisteArbeitskopien.map((v) => v.id),
      ...ergebnis.wert.nutzbare.flatMap((e) => (e.arbeitskopieId === null ? [] : [e.arbeitskopieId])),
    ]
    expect(gesehen.sort()).toEqual(['k1', 'p1', 'p2', 'waise'])
    expect(new Set(gesehen).size).toBe(gesehen.length)
  })
})

describe('ladeUebersicht – Fehler und Hörer', () => {
  it('lässt bei einem Kanalfehler den vorherigen Stand stehen und meldet niemanden', async () => {
    setzeListen([vorlage({ id: 'p1' })])
    const erster = await m.ladeUebersicht()
    expect(erster.ok).toBe(true)
    const vorher = m.holeUebersicht()
    expect(vorher).not.toBeNull()

    const gehoert: number[] = []
    m.aufUebersichtGeaendert(() => gehoert.push(1))

    antworte('vorlagen:listeArbeitskopien', { ok: false, fehler: { code: 'speicher_fehler', meldung: 'kaputt' } })
    const zweiter = await m.ladeUebersicht()

    expect(zweiter).toEqual({ ok: false, fehler: { code: 'speicher_fehler', meldung: 'kaputt' } })
    expect(m.holeUebersicht()).toBe(vorher)
    expect(gehoert).toEqual([])
  })

  it('meldet nach erfolgreichem Laden jeden Hörer genau einmal; Abmelden wirkt', async () => {
    setzeListen([vorlage({ id: 'p1' })])
    const erste: unknown[] = []
    const zweite: number[] = []
    const abmelden = m.aufUebersichtGeaendert((u) => erste.push(u))
    m.aufUebersichtGeaendert(() => zweite.push(1))

    await m.ladeUebersicht()
    expect(erste).toHaveLength(1)
    expect(zweite).toHaveLength(1)

    abmelden()
    await m.ladeUebersicht()
    expect(erste).toHaveLength(1)
    expect(zweite).toHaveLength(2)
  })

  it('liefert bei holeUebersicht dieselbe Momentaufnahme, solange nichts neu geladen wurde', async () => {
    setzeListen([vorlage({ id: 'p1' })])
    await m.ladeUebersicht()

    expect(m.holeUebersicht()).toBe(m.holeUebersicht())
  })
})

describe('legeVorlageAn', () => {
  it('sendet alle drei Felder (höhe ausdrücklich null) und öffnet die zurückgegebene id', async () => {
    const neue = vorlage({ id: 'neu-1' })
    antworte('vorlagen:erstelleVorlage', { ok: true, wert: neue })

    const antwort = await m.legeVorlageAn('vollflaeche', null, '  Meine  ')

    expect(antwort.ok).toBe(true)
    expect(kanalAufrufe('vorlagen:erstelleVorlage')).toEqual([
      { kanal: 'vorlagen:erstelleVorlage', nutzlast: { art: 'vollflaeche', höhe: null, name: 'Meine' } },
    ])
    expect(doppel.bearbeitet).toEqual(['neu-1'])
  })

  it('weist nicht anlegbare Kombinationen ohne IPC-Aufruf ab', async () => {
    expect(await m.legeVorlageAn('einblendung', 120, 'X')).toMatchObject({ ok: false })
    expect(await m.legeVorlageAn('split', 200, 'X')).toMatchObject({ ok: false })
    expect(doppel.aufrufe).toEqual([])
  })

  it('weist einen leeren Namen ohne IPC-Aufruf ab', async () => {
    const antwort = await m.legeVorlageAn('vollflaeche', null, '   ')

    expect(antwort).toEqual({ ok: false, fehler: { code: 'ungueltige_eingabe', meldung: 'Name darf nicht leer sein' } })
    expect(doppel.aufrufe).toEqual([])
  })

  it('reicht einen Fehler von starteBearbeitung durch und löscht die angelegte Vorlage NICHT', async () => {
    antworte('vorlagen:erstelleVorlage', { ok: true, wert: vorlage({ id: 'neu-1' }) })
    doppel.bearbeitungAntwort = { ok: false, fehler: { code: 'nicht_gefunden', meldung: 'weg' } }

    const antwort = await m.legeVorlageAn('vollflaeche', null, 'X')

    expect(antwort).toEqual({ ok: false, fehler: { code: 'nicht_gefunden', meldung: 'weg' } })
    expect(kanalAufrufe('vorlagen:löscheVorlage')).toEqual([])
  })
})

describe('setzeBearbeitungFort', () => {
  it('setzt über den PARENT fort, nicht über die Arbeitskopie', async () => {
    await m.setzeBearbeitungFort(vorlage({ id: 'k1', parent: 'p1' }))

    expect(doppel.bearbeitet).toEqual(['p1'])
  })

  it('weist eine Vorlage ohne parent ohne Aufruf ab', async () => {
    const antwort = await m.setzeBearbeitungFort(vorlage({ id: 'p1', parent: null }))

    expect(antwort.ok).toBe(false)
    expect(doppel.bearbeitet).toEqual([])
  })
})

describe('entferneVorlage', () => {
  it('weist eine eingebaute Vorlage ohne IPC-Aufruf ab (Stand geladen)', async () => {
    setzeListen([vorlage({ id: 'vollbild', eingebaut: true })])
    await m.ladeUebersicht()
    doppel.aufrufe = []

    const antwort = await m.entferneVorlage('vollbild')

    expect(antwort).toMatchObject({ ok: false, fehler: { code: 'ungueltige_eingabe' } })
    expect(doppel.aufrufe).toEqual([])
  })

  it('reicht fehler.daten unverändert durch', async () => {
    const daten = {
      aktionen: [{ projektId: 'p1', projektName: 'Projekt 1', id: 'a1' }],
      listenelemente: [{ projektId: 'p2', projektName: 'Projekt 2', id: 'l1' }],
    }
    antworte('vorlagen:löscheVorlage', { ok: false, fehler: { code: 'vorlage_referenziert', meldung: 'benutzt', daten } })

    const antwort = await m.entferneVorlage('eigene')

    expect(antwort).toEqual({ ok: false, fehler: { code: 'vorlage_referenziert', meldung: 'benutzt', daten } })
  })

  it('liefert denselben Code ohne daten und wirft nicht', async () => {
    antworte('vorlagen:löscheVorlage', { ok: false, fehler: { code: 'vorlage_referenziert', meldung: 'benutzt' } })

    const antwort = await m.entferneVorlage('eigene')

    expect(antwort).toEqual({ ok: false, fehler: { code: 'vorlage_referenziert', meldung: 'benutzt' } })
  })
})

describe('Lösch-Nutzungsstand', () => {
  const NUTZUNG = Object.freeze({
    aktionen: [{ projektId: 'p1', projektName: 'Projekt 1', id: 'a1' }],
    listenelemente: [],
  })

  it('holt die Nutzung genau einmal, durchläuft laedt -> geladen und hält denselben Wert', async () => {
    antworte('vorlagen:pruefeVorlagenReferenzen', { ok: true, wert: NUTZUNG })
    const staende: string[] = []
    m.aufLoeschNutzungGeaendert((stand) => staende.push(stand.zustand))

    await m.starteLoeschbestaetigung('v1')

    expect(kanalAufrufe('vorlagen:pruefeVorlagenReferenzen')).toEqual([
      { kanal: 'vorlagen:pruefeVorlagenReferenzen', nutzlast: { vorlagenId: 'v1' } },
    ])
    expect(staende).toEqual(['laedt', 'geladen'])
    const stand = m.holeLoeschNutzung()
    expect(stand.zustand).toBe('geladen')
    expect(stand.nutzung).toBe(NUTZUNG)
  })

  it('löscht nichts – kein Aufruf am Lösch-Kanal', async () => {
    antworte('vorlagen:pruefeVorlagenReferenzen', { ok: true, wert: NUTZUNG })

    await m.starteLoeschbestaetigung('v1')

    expect(kanalAufrufe('vorlagen:löscheVorlage')).toEqual([])
  })

  it('macht aus einem Lesefehler einen Fehlerstand – und entferneVorlage läuft trotzdem', async () => {
    antworte('vorlagen:pruefeVorlagenReferenzen', { ok: false, fehler: { code: 'speicher_fehler', meldung: 'kaputt' } })
    await m.starteLoeschbestaetigung('v1')

    expect(m.holeLoeschNutzung()).toMatchObject({
      zustand: 'fehler',
      fehler: { code: 'speicher_fehler', meldung: 'kaputt' },
    })

    antworte('vorlagen:löscheVorlage', { ok: true, wert: undefined })
    const weg = await m.entferneVorlage('v1')
    expect(weg.ok).toBe(true)
    expect(kanalAufrufe('vorlagen:löscheVorlage')).toHaveLength(1)
  })

  it('fragt bei bereits geladenem Stand nicht erneut, bei anderer Vorlage schon', async () => {
    antworte('vorlagen:pruefeVorlagenReferenzen', { ok: true, wert: NUTZUNG })

    await m.starteLoeschbestaetigung('v1')
    await m.starteLoeschbestaetigung('v1')
    expect(kanalAufrufe('vorlagen:pruefeVorlagenReferenzen')).toHaveLength(1)

    await m.starteLoeschbestaetigung('v2')
    expect(kanalAufrufe('vorlagen:pruefeVorlagenReferenzen')).toHaveLength(2)
    expect(kanalAufrufe('vorlagen:pruefeVorlagenReferenzen')[1]?.nutzlast).toEqual({ vorlagenId: 'v2' })
  })

  it('beendeLoeschbestaetigung setzt zurück; ein zweiter Aufruf wirft nicht', async () => {
    antworte('vorlagen:pruefeVorlagenReferenzen', { ok: true, wert: NUTZUNG })
    await m.starteLoeschbestaetigung('v1')

    const LEER = { zustand: 'unbekannt', vorlagenId: null, nutzung: null, fehler: null }
    m.beendeLoeschbestaetigung()
    expect(m.holeLoeschNutzung()).toEqual(LEER)

    expect(() => m.beendeLoeschbestaetigung()).not.toThrow()
    expect(m.holeLoeschNutzung()).toEqual(LEER)
  })

  it('meldet jede Änderung genau einmal; Abmelden ist mehrfach aufrufbar', async () => {
    antworte('vorlagen:pruefeVorlagenReferenzen', { ok: true, wert: NUTZUNG })
    const staende: string[] = []
    const abmelden = m.aufLoeschNutzungGeaendert((stand) => staende.push(stand.zustand))

    await m.starteLoeschbestaetigung('v1')
    expect(staende).toEqual(['laedt', 'geladen'])

    abmelden()
    abmelden()
    m.beendeLoeschbestaetigung()
    expect(staende).toEqual(['laedt', 'geladen'])
  })

  it('verändert den gelieferten Stand nicht – ein eingefrorener Stand bleibt heil', async () => {
    antworte('vorlagen:pruefeVorlagenReferenzen', { ok: true, wert: NUTZUNG })
    await m.starteLoeschbestaetigung('v1')
    const stand = Object.freeze(m.holeLoeschNutzung())

    await expect(m.starteLoeschbestaetigung('v2')).resolves.toBeUndefined()
    expect(Object.isFrozen(stand)).toBe(true)
    expect(stand.vorlagenId).toBe('v1')
  })
})

describe('Grep-Proben der DoD (wörtlich aus #155)', () => {
  const CODE = readFileSync(
    path.join(process.cwd(), 'src', 'renderer', 'vorlagen-editor', 'vorlagen-uebersicht.ts'),
    'utf8',
  )

  it('bildet keinen Anzeigetext und keine Zahl', () => {
    expect(CODE).not.toContain('baueNutzungsAnzeige')
    expect(CODE).not.toContain('zaehleProjekte')
    expect(CODE).not.toContain('LEERE_NUTZUNG')
    expect(CODE).not.toContain('NutzungAnzeige')
  })

  it('enthaelt kein Kanal-Literal, keinen Main-Import, kein fs/path und kein sort', () => {
    expect(CODE).not.toContain("'vorlagen:")
    expect(CODE).not.toContain('"vorlagen:')
    expect(CODE).not.toContain('../../main/')
    expect(CODE).not.toContain('src/main/')
    expect(CODE).not.toContain("'node:fs'")
    expect(CODE).not.toContain('"node:fs"')
    expect(CODE).not.toContain("'node:path'")
    expect(CODE).not.toContain('.sort(')
  })
})
