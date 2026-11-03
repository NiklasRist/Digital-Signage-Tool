// #445 - Im Modus „Neue Aktion" erreichten getippte Werte das Formular NIE:
// `feldVerlassen` kehrte bei `gewaehlt === null` vor jedem Schreibzugriff zurueck,
// `formular` blieb `leererEntwurf` mit `titel: ''`, und „Anlegen" schickte einen
// leeren Titel an `project:erstelleAktion`.
//
// Geprueft wird hier der Weg am echten Formular bis zum Kanal:
//   Neue Aktion -> Titel tippen -> Feld verlassen -> Anlegen -> `rufeAuf`.
// Die DoD-Zeile lautet: `project:erstelleAktion` traegt DIESEN Titel, nicht ''.
// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type JSX } from 'react'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Project } from '../../src/shared/contracts/project'
import { KANAELE } from '../../src/shared/contracts/kanaele'

// Die Vorschau- und Vorlagenwege laufen ins Leere - hier interessiert nur der Schreibweg.
vi.mock('../../src/renderer/action-editor/live-vorschau', () => ({
  bereiteVorschauVor: vi.fn(async () => ({ ok: true, wert: undefined })),
  bereiteMotivVorFuer: vi.fn(async () => undefined),
  haengeVorschauEin: vi.fn(),
  zeichneVorschau: vi.fn(),
}))

vi.mock('../../src/renderer/action-editor/vorlage-waehlen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/renderer/action-editor/vorlage-waehlen')>()),
  ladeWaehlbareVorlagen: vi.fn(async () => ({ ok: true, wert: [] })),
}))

vi.mock('../../src/renderer/gemeinsam/marken-bereitstellung', () => ({
  // Die Marke braucht seit 03.11.2026 ihre Farben: der Farbwaehler zeigt ohne eigenen
  // Wert den Markenwert der Rolle `akzent`.
  holeBereiteMarke: vi.fn(() => ({ id: 'm1', farben: { akzent: '#ff4040' } })),
}))

// Der Kanal-Doppel: JEDER Schreibweg des Editors laeuft hier durch.
const doppel = vi.hoisted(() => ({
  aufrufe: [] as Array<{ kanal: string; nutzlast: unknown }>,
  antwort: { ok: true, wert: null } as unknown,
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: async (kanal: string, nutzlast?: unknown) => {
    doppel.aufrufe.push({ kanal, nutzlast })
    return doppel.antwort
  },
}))

import { ActionEditorWurzel } from '../../src/renderer/action-editor/index.tsx'
import { ladeWaehlbareVorlagen } from '../../src/renderer/action-editor/vorlage-waehlen'
import { bereiteMotivVorFuer, zeichneVorschau } from '../../src/renderer/action-editor/live-vorschau'
import { merkeLetzteVorlage } from '../../src/renderer/gemeinsam/vorlage-vorbelegung'
import type { Asset } from '../../src/shared/contracts/asset'
import type { Vorlage, Zone } from '../../src/shared/contracts/vorlage'

const GERAETE: Array<{ wurzel: Root; behaelter: HTMLDivElement }> = []

function montiere(element: JSX.Element): HTMLDivElement {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel = createRoot(behaelter)
  GERAETE.push({ wurzel, behaelter })
  act(() => {
    wurzel.render(element)
  })
  return behaelter
}

beforeEach(() => {
  doppel.aufrufe.length = 0
  doppel.antwort = { ok: true, wert: null }
  // Der Vorlagen-Speicher ist Sitzungsspeicher - jede Pruefung startet ohne ihn.
  merkeLetzteVorlage(null)
  vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: [] })
})

afterAll(() => {
  for (const geraet of GERAETE) {
    act(() => geraet.wurzel.unmount())
    geraet.behaelter.remove()
  }
})

function aktion(id: string, titel: string): Aktion {
  return {
    id,
    titel,
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

function projekt(aktionen: Aktion[]): Project {
  return {
    id: 'p1',
    name: 'Testprojekt',
    erstelltAm: '2026-10-28T00:00:00.000Z',
    geaendertAm: '2026-10-28T00:00:00.000Z',
    schemaVersion: 1,
    standardSegmentdauer: 10,
    standardMarkeId: 'm1',
    letzterAusgabeName: null,
    assets: [],
    aktionen,
    liste: [],
  }
}

function editor(
  p: Project,
  zeichenVorlagen: readonly Vorlage[] = [],
  hervorgehoben: string | null = null,
): { behaelter: HTMLDivElement; setzeProjekt: ReturnType<typeof vi.fn> } {
  const setzeProjekt = vi.fn()
  const behaelter = montiere(
    createElement(ActionEditorWurzel, {
      sichtbar: true,
      projekt: {
        hole: () => ({ projekt: p, ladefehler: null }),
        setzeProjekt,
        lade: vi.fn(),
        setzeListe: vi.fn(),
        gleicheElementAb: vi.fn(),
        leere: vi.fn(),
        aufGeaendert: vi.fn(() => () => {}),
      },
      zeichnen: {
        bereiteVor: vi.fn(),
        hole: vi.fn(() => ({ vorlagen: zeichenVorlagen })),
        verwirfMotivBestand: vi.fn(),
      },
      vorlagen: { lade: vi.fn(), hole: vi.fn(() => null), aufGeaendert: vi.fn(() => () => {}) },
      marken: {
        lade: vi.fn(),
        hole: vi.fn(() => ({ marken: [] })),
        aufGeaendert: vi.fn(() => () => {}),
      },
      hervorgehobeneAktionId: hervorgehoben,
    } as unknown as Parameters<typeof ActionEditorWurzel>[0]),
  )
  return { behaelter, setzeProjekt }
}

function klicke(behaelter: HTMLDivElement, testid: string): void {
  const knopf = behaelter.querySelector(`[data-testid="${testid}"]`)
  if (knopf === null) throw new Error(`Knopf ${testid} fehlt`)
  act(() => {
    ;(knopf as HTMLButtonElement).click()
  })
}

/** Feldwert setzen und das Feld VERLASSEN - Reacts onBlur haengt an `focusout`. */
async function verlasseFeld(behaelter: HTMLDivElement, testid: string, wert: string): Promise<void> {
  const feld = behaelter.querySelector(`[data-testid="${testid}"]`) as HTMLInputElement | null
  if (feld === null) throw new Error(`Feld ${testid} fehlt`)
  const setzeWert = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  await act(async () => {
    setzeWert?.call(feld, wert)
    feld.dispatchEvent(new Event('input', { bubbles: true }))
    feld.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await Promise.resolve()
    await Promise.resolve()
  })
}

async function klickeAnlegen(behaelter: HTMLDivElement): Promise<void> {
  const knopf = behaelter.querySelector('[data-testid="aktion-anlegen-bestaetigen"]')
  if (knopf === null) throw new Error('Anlegen-Knopf fehlt')
  await act(async () => {
    ;(knopf as HTMLButtonElement).click()
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  })
}

function befunde(behaelter: HTMLDivElement): string[] {
  return Array.from(behaelter.querySelectorAll('[data-testid="aktion-befund"]')).map(
    (eintrag) => eintrag.textContent ?? '',
  )
}

describe('#445: „Neue Aktion" schreibt getippte Werte in den Entwurf', () => {
  it('der getippte Titel erreicht project:erstelleAktion (nicht "")', async () => {
    doppel.antwort = { ok: true, wert: aktion('neu-1', 'Durchlauf-Neu') }
    const { behaelter, setzeProjekt } = editor(projekt([]))

    klicke(behaelter, 'aktion-neu')
    await verlasseFeld(behaelter, 'aktion-titel', 'Durchlauf-Neu')
    await klickeAnlegen(behaelter)

    // Kein Schreibweg im Modus "neu" ausser dem Anlegen - und der traegt den Titel.
    expect(doppel.aufrufe).toHaveLength(1)
    const erster = doppel.aufrufe[0]
    expect(erster?.kanal).toBe(KANAELE.project.erstelleAktion)
    const nutzlast = erster?.nutzlast as { aktionsdaten: { titel: string } }
    expect(nutzlast.aktionsdaten.titel).toBe('Durchlauf-Neu')
    // Der Erfolg geht in die gemeinsame Sicht (mitAktion -> setzeProjekt).
    expect(setzeProjekt).toHaveBeenCalledTimes(1)
  })

  it('ein leeres Titelfeld wird abgelehnt und der Befund steht AM FORMULAR', async () => {
    const { behaelter } = editor(projekt([]))

    klicke(behaelter, 'aktion-neu')
    await klickeAnlegen(behaelter)

    // Kein IPC-Aufruf: die Pruefung greift VOR dem Kanal.
    expect(doppel.aufrufe).toHaveLength(0)
    expect(befunde(behaelter).join(' ')).toContain('Der Titel fehlt')
  })

  it('ein abgelehntes Anlegen aus dem Main ist sichtbar, nicht nur console.warn', async () => {
    doppel.antwort = {
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'Die Datei ist gesperrt.' },
    }
    const { behaelter } = editor(projekt([]))

    klicke(behaelter, 'aktion-neu')
    await verlasseFeld(behaelter, 'aktion-titel', 'Durchlauf-Neu')
    await klickeAnlegen(behaelter)

    const meldung = behaelter.querySelector('[data-testid="aktion-speicher-meldung"]')?.textContent ?? ''
    expect(meldung).toContain('Nicht angelegt')
    expect(meldung).toContain('Die Datei ist gesperrt.')
  })

  it('im Modus "neu" wird beim Verlassen KEIN project:bearbeiteAktion gesendet', async () => {
    const { behaelter } = editor(projekt([]))

    klicke(behaelter, 'aktion-neu')
    await verlasseFeld(behaelter, 'aktion-titel', 'Nur getippt')
    await verlasseFeld(behaelter, 'aktion-cta', 'Jetzt anmelden')

    expect(doppel.aufrufe).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Preset beim Anlegen (03.11.2026): zuletzt benutzte Vorlage + Projekt-Standarddauer
// ---------------------------------------------------------------------------

/** Laesst die Lade-Effekte des Editors laufen (Vorlagen-Auswahl). */
async function laufen(): Promise<void> {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

function vorlage(id: string, hoehe: number | null): {
  id: string
  name: string
  höhe: number | null
  parent: string | null
  eingebaut: boolean
  zonen: []
} {
  return { id, name: id, höhe: hoehe, parent: null, eingebaut: false, zonen: [] }
}

describe('Preset beim Anlegen', () => {
  it('vorbelegt die ZULETZT BENUTZTE Vorlage und die Projekt-Standarddauer', async () => {
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({
      ok: true,
      wert: [vorlage('ganz', null), vorlage('band', 162)],
    })
    merkeLetzteVorlage('band')
    const { behaelter } = editor({ ...projekt([]), standardSegmentdauer: 15 })
    await laufen()

    klicke(behaelter, 'aktion-neu')

    // Die Auswahl ist seit 03.11.2026 eine Liste MIT BILD: gewaehlt ist die Kachel,
    // die `data-gewaehlt="ja"` traegt.
    const gewaehlt = behaelter.querySelector('[data-testid="aktion-vorlagen-wahl"] [data-gewaehlt="ja"]')
    expect(gewaehlt?.getAttribute('data-testid')).toBe('aktion-vorlage-band')
    const dauer = behaelter.querySelector<HTMLInputElement>('[data-testid="aktion-dauer"]')
    // NICHT die Konstante 10: der Projektstandard (TK 9.8.4).
    expect(dauer?.value).toBe('15')
  })

  it('eine HERVORGEHOBENE Aktion steht SOFORT im Formular - kein zweiter Klick', async () => {
    // 03.11.2026: Der Klick auf „Bearbeiten" setzte nur die Auswahl, nicht das Formular.
    // Die Ansicht oeffnete mit markierter Zeile und „Nichts gewählt." daneben.
    const bestehend = { ...aktion('a1', 'Sommeraktion'), standardDauer: 30 }
    const { behaelter } = editor(projekt([bestehend]), [], 'a1')
    await laufen()

    const titel = behaelter.querySelector<HTMLInputElement>('[data-testid="aktion-titel"]')
    expect(titel).not.toBeNull()
    expect(titel?.value).toBe('Sommeraktion')
    expect(behaelter.querySelector('[data-testid="aktion-formular-leer"]')).toBeNull()
  })

  it('nach dem Oeffnen einer Aktion zeigt "Neue Aktion" NICHT deren Werte', async () => {
    const bestehend = { ...aktion('a1', 'Sommeraktion'), standardDauer: 30 }
    const { behaelter } = editor(projekt([bestehend]))
    await laufen()

    // Aktion oeffnen: der Bibliotheks-Knopf traegt den Titel.
    const knopf = Array.from(behaelter.querySelectorAll('button')).find(
      (kandidat) => kandidat.textContent === 'Sommeraktion',
    )
    expect(knopf).toBeDefined()
    act(() => {
      knopf?.click()
    })
    expect(behaelter.querySelector<HTMLInputElement>('[data-testid="aktion-titel"]')?.value).toBe(
      'Sommeraktion',
    )

    // Ohne den Remount (key am Formularblock) stuenden hier weiter Titel und Dauer
    // der geoeffneten Aktion - der Entwurf waere leer, das Bild nicht.
    klicke(behaelter, 'aktion-neu')
    expect(behaelter.querySelector<HTMLInputElement>('[data-testid="aktion-titel"]')?.value).toBe('')
    expect(behaelter.querySelector<HTMLInputElement>('[data-testid="aktion-dauer"]')?.value).toBe('10')
  })
})

// ---------------------------------------------------------------------------
// Anlegen mit Vorschau und Bild (03.11.2026)
// ---------------------------------------------------------------------------

function bildAsset(id: string): Asset {
  return {
    id,
    typ: 'bild',
    dateiname: `${id}.png`,
    originalname: `${id}.png`,
    maße: { breite: 400, höhe: 300 },
    dauer: null,
    importdatum: '2026-11-03T00:00:00.000Z',
    zustand: 'ok',
  }
}

/** Setzt den Wert eines <select> und meldet die Aenderung (React hoert auf `change`). */
async function waehleImFeld(behaelter: HTMLDivElement, testid: string, wert: string): Promise<void> {
  const feld = behaelter.querySelector<HTMLSelectElement>(`[data-testid="${testid}"]`)
  if (feld === null) throw new Error(`Feld ${testid} fehlt`)
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set?.call(feld, wert)
    feld.dispatchEvent(new Event('change', { bubbles: true }))
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('Anlegen mit Vorschau und Bild', () => {
  it('die Vorschau zeichnet den ENTWURF, nicht erst die gespeicherte Aktion', async () => {
    vi.mocked(zeichneVorschau).mockClear()
    const vorlagen = [vorlage('ganz', null)]
    // Dieselben Vorlagen in BEIDEN Quellen: die Auswahl (ladeWaehlbareVorlagen) und der
    // Zeichenbestand (zeichnen.hole). Sonst faellt der Entwurf auf 'vollbild' zurueck und
    // es gibt nichts zu zeichnen.
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: vorlagen })
    const { behaelter } = editor(projekt([]), vorlagen)
    await laufen()

    klicke(behaelter, 'aktion-neu')
    await laufen()

    // Ohne diese Aenderung blieb die Flaeche im Modus „neu" leer (`gewaehlt === null`).
    expect(zeichneVorschau).toHaveBeenCalled()
    const gezeichnet = vi.mocked(zeichneVorschau).mock.calls.at(-1)?.[0]
    expect(gezeichnet?.vorlagenId).toBe('ganz')
    expect(gezeichnet?.titel).toBe('')
  })

  it('die Vorlagen-Auswahl zeigt je Vorlage ein Bild und wechselt die Vorlage per Klick', async () => {
    vi.mocked(zeichneVorschau).mockClear()
    const vorlagen = [vorlage('ganz', null), vorlage('band', 162)]
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: vorlagen })
    const { behaelter } = editor(projekt([]), vorlagen)
    await laufen()

    klicke(behaelter, 'aktion-neu')
    await laufen()

    // Eine Kachel je Vorlage, jede mit einem eigenen Bildplatz (03.11.2026).
    const plaetze = behaelter.querySelectorAll('[data-testid="aktion-vorlagen-wahl"] [data-testid="vorlagen-bild"]')
    expect(plaetze).toHaveLength(2)
    expect(behaelter.querySelector('[data-testid="aktion-vorlage-vollbild"]')).toBeNull()

    act(() => {
      behaelter.querySelector<HTMLButtonElement>('[data-testid="aktion-vorlage-band"]')?.click()
    })
    await laufen()

    // Die Wahl steht im Entwurf, und die grosse Vorschau zeichnet MIT der neuen Vorlage.
    const gewaehlt = behaelter.querySelector('[data-testid="aktion-vorlagen-wahl"] [data-gewaehlt="ja"]')
    expect(gewaehlt?.getAttribute('data-testid')).toBe('aktion-vorlage-band')
    const gezeichnet = vi.mocked(zeichneVorschau).mock.calls.at(-1)?.[0]
    expect(gezeichnet?.vorlagenId).toBe('band')
  })

  it('im Modus „neu" wandert das gewaehlte Bild in den Entwurf - ohne IPC - und die Vorschau zeichnet es', async () => {
    vi.mocked(zeichneVorschau).mockClear()
    vi.mocked(bereiteMotivVorFuer).mockClear()
    // Die Vorlage muss eine BILD-Zone haben - sonst blendet das Formular das Bild
    // seit 03.11.2026 aus (feld-bedarf.ts), und dieser Test pruefte nichts.
    const vorlagen = [vorlageMitZonen('ganz', null, [zone('bild')])]
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: vorlagen })
    const { behaelter } = editor({ ...projekt([]), assets: [bildAsset('a1')] }, vorlagen)
    await laufen()

    klicke(behaelter, 'aktion-neu')
    await laufen()
    await waehleImFeld(behaelter, 'aktion-bild-wahl', 'a1')

    // Kein Schreibweg im Modus „neu": der Entwurf traegt das Bild.
    expect(doppel.aufrufe).toHaveLength(0)
    // Das Motiv wird VOR dem Zeichnen vorbereitet, sonst stuende der Platzhalter da.
    expect(bereiteMotivVorFuer).toHaveBeenCalledWith('p1', 'a1', [bildAsset('a1')])
    // Der LETZTE Zeichenaufruf ist die grosse Vorschau mit dem neuen Bild - nicht
    // eines der Vorlagenbilder (die entstehen einmal beim Oeffnen).
    const gezeichnet = vi.mocked(zeichneVorschau).mock.calls.at(-1)?.[0]
    expect(gezeichnet?.bildRef).toBe('a1')
  })
})

// ---------------------------------------------------------------------------
// Felder richten sich nach der Vorlage / echter Farbwaehler (03.11.2026)
// ---------------------------------------------------------------------------

const RAHMEN = { x: 0, y: 0, breite: 100, höhe: 50 }
const AUSRICHTUNG = { horizontal: 'links' as const, vertikal: 'oben' as const }

function zone(bindung: Zone['bindung'], extra: Partial<Zone> = {}): Zone {
  return {
    id: String(bindung ?? 'deko'),
    rolle: 'frei',
    bindung,
    rahmen: RAHMEN,
    ausrichtung: AUSRICHTUNG,
    wennLeer: 'leer',
    ...extra,
  }
}

const AKZENT_ZONE = zone(null, {
  id: 'preis-pille',
  deko: { füllungFarbRolle: 'akzent' },
})

function vorlageMitZonen(id: string, hoehe: number | null, zonen: Zone[]): Vorlage {
  return { id, name: id, höhe: hoehe, parent: null, eingebaut: false, zonen }
}

describe('Felder richten sich nach der Vorlage', () => {
  const mitBeschreibung = vorlageMitZonen('mit', null, [
    zone('titel'),
    zone('beschreibung'),
    AKZENT_ZONE,
  ])
  const ohneBeschreibung = vorlageMitZonen('ohne', 162, [zone('titel'), AKZENT_ZONE])

  it('eine Vorlage ohne Beschreibungs-Zone blendet das Feld aus - und beim Wechsel wieder ein', async () => {
    const vorlagen = [mitBeschreibung, ohneBeschreibung]
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: vorlagen })
    const { behaelter } = editor(projekt([]), vorlagen)
    await laufen()

    klicke(behaelter, 'aktion-neu')
    await laufen()
    // Die vorbelegte erste Vorlage bindet `beschreibung`.
    expect(behaelter.querySelector('[data-testid="aktion-beschreibung"]')).not.toBeNull()

    act(() => {
      behaelter.querySelector<HTMLButtonElement>('[data-testid="aktion-vorlage-ohne"]')?.click()
    })
    await laufen()
    // „ohne" hat keine Beschreibungs-Zone: das Feld verschwindet.
    expect(behaelter.querySelector('[data-testid="aktion-beschreibung"]')).toBeNull()

    act(() => {
      behaelter.querySelector<HTMLButtonElement>('[data-testid="aktion-vorlage-mit"]')?.click()
    })
    await laufen()
    expect(behaelter.querySelector('[data-testid="aktion-beschreibung"]')).not.toBeNull()
  })

  it('die Akzentfarbe ist ein Farbwaehler, kein Select mit einer Option', async () => {
    const vorlagen = [mitBeschreibung, ohneBeschreibung]
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: vorlagen })
    const { behaelter } = editor(projekt([]), vorlagen)
    await laufen()

    klicke(behaelter, 'aktion-neu')
    await laufen()

    const feld = behaelter.querySelector<HTMLInputElement>('[data-testid="aktion-akzent-farbe"]')
    expect(feld).not.toBeNull()
    expect(feld?.getAttribute('type')).toBe('color')
    // Ohne eigenen Wert zeigt der Waehler den Markenwert der Rolle `akzent`.
    expect(feld?.value.toLowerCase()).toBe('#ff4040')
    // Das alte Schein-Select ist weg.
    expect(behaelter.querySelector('[data-testid="aktion-akzent-vorschlag"]')).toBeNull()
  })
})
