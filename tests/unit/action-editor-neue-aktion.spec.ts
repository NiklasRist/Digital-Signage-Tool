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
  // Wert den Markenwert der Rolle `akzent`. 05.11.2026: die volle Palette fuer die
  // Farbauswahl (alle 13 Rollen).
  holeBereiteMarke: vi.fn(() => ({
    id: 'm1',
    farben: {
      akzent: '#ff4040',
      akzentKraeftig: '#df3131',
      akzentTief: '#971316',
      flaecheDunkel: '#2f2e2e',
      flaecheSehrDunkel: '#202020',
      flaecheHell: '#ffffff',
      flaecheAkzentZart: '#f5aeaf',
      textAufDunkel: '#ffffff',
      textAufHell: '#202020',
      textSekundaer: '#8f8f8f',
      linie: '#cccccc',
      scrimStart: '#000000',
      scrimEnde: '#000000',
    },
  })),
}))

// Der Kanal-Doppel: JEDER Schreibweg des Editors laeuft hier durch.
const doppel = vi.hoisted(() => ({
  aufrufe: [] as Array<{ kanal: string; nutzlast: unknown }>,
  antwort: { ok: true, wert: null } as unknown,
  /** 05.11.2026: Antworten je Kanal - die Farbhistorie liest `config:leseKonfig`. */
  antworten: {} as Record<string, unknown>,
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: async (kanal: string, nutzlast?: unknown) => {
    doppel.aufrufe.push({ kanal, nutzlast })
    return doppel.antworten[kanal] ?? doppel.antwort
  },
}))

// 05.11.2026: Der Bild-Import ist ein AUFTRAG - die Rückmeldung ist der Beleg, dass
// der Knopf etwas tut. Nur `starteBildImport` wird ersetzt; Prüfung und Filter der
// Bildwahl bleiben die echten Funktionen.
const importDoppel = vi.hoisted(() => ({
  antwort: { ok: true, wert: { auftragIds: [] as string[], abbruchGrund: null } } as unknown,
}))

vi.mock('../../src/renderer/action-editor/bild-zuweisen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/renderer/action-editor/bild-zuweisen')>()),
  starteBildImport: async () => importDoppel.antwort,
}))

import { ActionEditorWurzel } from '../../src/renderer/action-editor/index.tsx'
import { BEISPIEL_INHALT } from '../../src/renderer/action-editor/beispiel-inhalt'
import { LETZTE_FARBEN_SCHLUESSEL } from '../../src/renderer/action-editor/letzte-farben'
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
  doppel.antworten = {}
  importDoppel.antwort = { ok: true, wert: { auftragIds: [], abbruchGrund: null } }
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
  /** 03.11.2026 (Entscheidung 29.4): Einstieg „+ Neue Aktion" aus dem Composer. */
  starteNeu = false,
): {
  behaelter: HTMLDivElement
  setzeProjekt: ReturnType<typeof vi.fn>
  /** 05.11.2026: Meldet einen BESTANDSWECHSEL von aussen - der Weg, den ein
   *  abgeschlossener Bild-Import geht. */
  meldeProjektAenderung: (neu: Project) => void
} {
  const setzeProjekt = vi.fn()
  // Der Zugang ist ein kleiner Speicher: `hole()` liest den AKTUELLEN Stand, und
  // `aufGeaendert` haelt die Hoerer. So laesst sich ein Import nachstellen, ohne
  // einen echten Kanal zu bemuehen.
  let aktuell = p
  const hoerer = new Set<() => void>()
  const behaelter = montiere(
    createElement(ActionEditorWurzel, {
      sichtbar: true,
      projekt: {
        hole: () => ({ projekt: aktuell, ladefehler: null }),
        setzeProjekt,
        lade: vi.fn(),
        setzeListe: vi.fn(),
        gleicheElementAb: vi.fn(),
        leere: vi.fn(),
        aufGeaendert: (hoererNeu: () => void) => {
          hoerer.add(hoererNeu)
          return () => {
            hoerer.delete(hoererNeu)
          }
        },
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
      starteNeu,
    } as unknown as Parameters<typeof ActionEditorWurzel>[0]),
  )
  return {
    behaelter,
    setzeProjekt,
    meldeProjektAenderung: (neu) => {
      aktuell = neu
      for (const eintrag of hoerer) eintrag()
    },
  }
}

async function klicke(behaelter: HTMLDivElement, testid: string): Promise<void> {
  const knopf = behaelter.querySelector(`[data-testid="${testid}"]`)
  if (knopf === null) throw new Error(`Knopf ${testid} fehlt`)
  // 04.11.2026: Ein Klick kann jetzt SCHREIBEN (der Editor ist ein Entwurf, „+ Neue
  // Aktion" und jeder Wechsel schreiben erst). Deshalb laeuft der Klick in `act` mit
  // ein paar Runden Zeit - sonst prueft der Test den Zustand von vorher.
  await act(async () => {
    ;(knopf as HTMLButtonElement).click()
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
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

/** 05.11.2026: Seit der Farbhistorie liest der Editor `config:leseKonfig`. Die Tests
 *  „kein Projekt-Schreibweg" meinen PROJEKT-Kanaele - nicht jeden IPC-Aufruf. */
function projektAufrufe(): Array<{ kanal: string; nutzlast: unknown }> {
  return doppel.aufrufe.filter((aufruf) => aufruf.kanal.startsWith('project:'))
}

describe('#445: „Neue Aktion" schreibt getippte Werte in den Entwurf', () => {
  it('der getippte Titel erreicht project:erstelleAktion (nicht "")', async () => {
    doppel.antwort = { ok: true, wert: aktion('neu-1', 'Durchlauf-Neu') }
    const { behaelter, setzeProjekt } = editor(projekt([]))

    await klicke(behaelter, 'aktion-neu')
    await verlasseFeld(behaelter, 'aktion-titel', 'Durchlauf-Neu')
    await klickeAnlegen(behaelter)

    // Kein Schreibweg im Modus "neu" ausser dem Anlegen - und der traegt den Titel.
    const projektKanaele = projektAufrufe()
    expect(projektKanaele).toHaveLength(1)
    const erster = projektKanaele[0]
    expect(erster?.kanal).toBe(KANAELE.project.erstelleAktion)
    const nutzlast = erster?.nutzlast as { aktionsdaten: { titel: string } }
    expect(nutzlast.aktionsdaten.titel).toBe('Durchlauf-Neu')
    // Der Erfolg geht in die gemeinsame Sicht (mitAktion -> setzeProjekt).
    expect(setzeProjekt).toHaveBeenCalledTimes(1)
  })

  it('ein leeres Titelfeld wird abgelehnt und der Befund steht AM FORMULAR', async () => {
    const { behaelter } = editor(projekt([]))

    await klicke(behaelter, 'aktion-neu')
    await klickeAnlegen(behaelter)

    // Kein Projekt-Schreibweg: die Pruefung greift VOR dem Kanal.
    expect(projektAufrufe()).toHaveLength(0)
    expect(befunde(behaelter).join(' ')).toContain('Der Titel fehlt')
  })

  it('ein abgelehntes Anlegen aus dem Main ist sichtbar, nicht nur console.warn', async () => {
    doppel.antwort = {
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'Die Datei ist gesperrt.' },
    }
    const { behaelter } = editor(projekt([]))

    await klicke(behaelter, 'aktion-neu')
    await verlasseFeld(behaelter, 'aktion-titel', 'Durchlauf-Neu')
    await klickeAnlegen(behaelter)

    const meldung = behaelter.querySelector('[data-testid="aktion-speicher-meldung"]')?.textContent ?? ''
    expect(meldung).toContain('Nicht angelegt')
    expect(meldung).toContain('Die Datei ist gesperrt.')
  })

  it('im Modus "neu" wird beim Verlassen KEIN project:bearbeiteAktion gesendet', async () => {
    const { behaelter } = editor(projekt([]))

    await klicke(behaelter, 'aktion-neu')
    await verlasseFeld(behaelter, 'aktion-titel', 'Nur getippt')
    await verlasseFeld(behaelter, 'aktion-cta', 'Jetzt anmelden')

    expect(projektAufrufe()).toHaveLength(0)
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

    await klicke(behaelter, 'aktion-neu')

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
    const knopf = Array.from(behaelter.querySelectorAll('[data-testid^="aktion-strip-"]')).find(
      (kandidat) => kandidat.textContent === 'Sommeraktion',
    )
    expect(knopf).toBeDefined()
    await act(async () => {
      ;(knopf as HTMLButtonElement).click()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(behaelter.querySelector<HTMLInputElement>('[data-testid="aktion-titel"]')?.value).toBe(
      'Sommeraktion',
    )

    // Ohne den Remount (key am Formularblock) stuenden hier weiter Titel und Dauer
    // der geoeffneten Aktion - der Entwurf waere leer, das Bild nicht.
    await klicke(behaelter, 'aktion-neu')
    expect(behaelter.querySelector<HTMLInputElement>('[data-testid="aktion-titel"]')?.value).toBe('')
    expect(behaelter.querySelector<HTMLInputElement>('[data-testid="aktion-dauer"]')?.value).toBe('10')
  })
})

// ---------------------------------------------------------------------------
// Einstieg „+ Neue Aktion" aus dem Composer (Entscheidung 29.4, 03.11.2026)
// ---------------------------------------------------------------------------

describe('starteNeu: der Editor oeffnet im Modus "neu"', () => {
  it('steht SOFORT im Anlege-Formular - ohne Klick auf „Neue Aktion"', async () => {
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: [vorlage('ganz', null)] })
    const { behaelter } = editor(projekt([]), [], null, true)
    await laufen()

    // Die Vorbelegung wartet auf die waehlbaren Vorlagen; danach steht der Entwurf.
    expect(behaelter.querySelector('[data-testid="aktion-formular-leer"]')).toBeNull()
    expect(behaelter.querySelector('[data-testid="aktion-anlegen-bestaetigen"]')).not.toBeNull()
    expect(behaelter.querySelector<HTMLInputElement>('[data-testid="aktion-titel"]')?.value).toBe('')
    // Vorbelegt ist die erste waehlbare Vorlage (dieselbe Regel wie der Knopf).
    const gewaehlt = behaelter.querySelector('[data-testid="aktion-vorlagen-wahl"] [data-gewaehlt="ja"]')
    expect(gewaehlt?.getAttribute('data-testid')).toBe('aktion-vorlage-ganz')
  })

  it('ohne starteNeu bleibt der Reiter [Aktionen] bei „Nichts gewählt."', async () => {
    const { behaelter } = editor(projekt([]))
    await laufen()

    expect(behaelter.querySelector('[data-testid="aktion-formular-leer"]')).not.toBeNull()
    expect(behaelter.querySelector('[data-testid="aktion-anlegen-bestaetigen"]')).toBeNull()
  })

  it('legt aus diesem Zustand heraus an - der Titel geht in den Entwurf', async () => {
    doppel.antwort = { ok: true, wert: aktion('neu-1', 'Aus dem Composer') }
    const { behaelter, setzeProjekt } = editor(projekt([]), [], null, true)
    await laufen()

    await verlasseFeld(behaelter, 'aktion-titel', 'Aus dem Composer')
    await klickeAnlegen(behaelter)

    const projektKanaele = projektAufrufe()
    expect(projektKanaele).toHaveLength(1)
    expect(projektKanaele[0]?.kanal).toBe(KANAELE.project.erstelleAktion)
    expect(setzeProjekt).toHaveBeenCalledTimes(1)
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
  it('die Vorschau zeichnet den ENTWURF - leere Felder mit Beispielinhalt', async () => {
    const vorlagen = [vorlage('ganz', null)]
    // Dieselben Vorlagen in BEIDEN Quellen: die Auswahl (ladeWaehlbareVorlagen) und der
    // Zeichenbestand (zeichnen.hole). Sonst faellt der Entwurf auf 'vollbild' zurueck und
    // es gibt nichts zu zeichnen.
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: vorlagen })
    const { behaelter } = editor(projekt([]), vorlagen)
    await laufen()

    // Der Zaehler startet NACH dem Aufbau: Der ERSTE Aufruf nach dem Klick ist die
    // grosse Vorschau (sie steht im Baum VOR dem Inspector mit den Vorlagen-Kacheln).
    // Ohne diese Trennung prueft der Test die Kachel statt der Buehne - eine gruene
    // Probe, die nichts ueber die Hauptvorschau sagt (05.11.2026, Gegenprobe).
    vi.mocked(zeichneVorschau).mockClear()
    await klicke(behaelter, 'aktion-neu')
    await laufen()

    // 05.11.2026: Die Flaeche ist NICHT mehr leer - leere Felder tragen das Beispiel.
    expect(zeichneVorschau).toHaveBeenCalled()
    const gezeichnet = vi.mocked(zeichneVorschau).mock.calls[0]?.[0]
    expect(gezeichnet?.vorlagenId).toBe('ganz')
    expect(gezeichnet?.titel).toBe(BEISPIEL_INHALT.titel)
    // Der ENTWURF bleibt leer: das Beispiel ist reine Vorschau, nicht gespeicherter Text.
    expect(behaelter.querySelector<HTMLInputElement>('[data-testid="aktion-titel"]')?.value).toBe('')
    expect(behaelter.querySelector('[data-testid="aktion-beispiel-hinweis"]')).not.toBeNull()
  })

  it('die Vorlagen-Auswahl zeigt je Vorlage ein Bild und wechselt die Vorlage per Klick', async () => {
    vi.mocked(zeichneVorschau).mockClear()
    const vorlagen = [vorlage('ganz', null), vorlage('band', 162)]
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: vorlagen })
    const { behaelter } = editor(projekt([]), vorlagen)
    await laufen()

    await klicke(behaelter, 'aktion-neu')
    await laufen()

    // Eine Kachel je Vorlage, jede mit einem eigenen Bildplatz (03.11.2026).
    const plaetze = behaelter.querySelectorAll('[data-testid="aktion-vorlagen-wahl"] [data-testid="vorlagen-bild"]')
    expect(plaetze).toHaveLength(2)
    expect(behaelter.querySelector('[data-testid="aktion-vorlage-vollbild"]')).toBeNull()
    // 05.11.2026: Die Kacheln zeigen ein ERGEBNIS, nicht die leere Flaeche - auch die
    // NICHT gewaehlte Vorlage traegt den Beispielinhalt.
    const bandKachel = vi.mocked(zeichneVorschau).mock.calls.find(
      (aufruf) => (aufruf[1] as Vorlage).id === 'band',
    )
    expect(bandKachel?.[0].titel).toBe(BEISPIEL_INHALT.titel)

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

    await klicke(behaelter, 'aktion-neu')
    await laufen()
    await waehleImFeld(behaelter, 'aktion-bild-wahl', 'a1')

    // Kein Projekt-Schreibweg im Modus „neu": der Entwurf traegt das Bild.
    expect(projektAufrufe()).toHaveLength(0)
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

    await klicke(behaelter, 'aktion-neu')
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

    await klicke(behaelter, 'aktion-neu')
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

// ---------------------------------------------------------------------------
// 05.11.2026: Der Editor folgt dem Projektbestand - ein Import kommt an
// ---------------------------------------------------------------------------
// Befund am Fenster: `project.json` hatte nach dem Import 5 Assets, die offene
// Bildliste weiter 4 Eintraege. Ursache: Der Editor abonnierte `projekt.aufGeaendert`
// nicht. Diese Pruefung ist der Waechter gegen den Rueckfall.

describe('Bestandswechsel von aussen (Bild-Import)', () => {
  function mitBildzone(): Vorlage {
    return vorlageMitZonen('ganz', null, [zone('bild')])
  }

  it('ein WAEHREND des Editors importiertes Bild erscheint in der Auswahl', async () => {
    const vorlagen = [mitBildzone()]
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: vorlagen })
    const start = projekt([])
    const { behaelter, meldeProjektAenderung } = editor(start, vorlagen)
    await laufen()
    await klicke(behaelter, 'aktion-neu')
    await laufen()

    // Nur der leere Eintrag "– kein Bild –".
    expect(behaelter.querySelectorAll('[data-testid="aktion-bild-wahl"] option')).toHaveLength(1)

    // Der Import ist fertig: das Projekt traegt ein neues Bild-Asset.
    act(() => {
      meldeProjektAenderung({ ...start, assets: [bildAsset('frisch-importiert')] })
    })
    await laufen()

    const werte = Array.from(
      behaelter.querySelectorAll<HTMLOptionElement>('[data-testid="aktion-bild-wahl"] option'),
    ).map((option) => option.value)
    expect(werte).toContain('frisch-importiert')
  })

  it('„Bild importieren" meldet den Auftrag sichtbar - nicht nur in der Konsole', async () => {
    const vorlagen = [mitBildzone()]
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: vorlagen })
    importDoppel.antwort = { ok: true, wert: { auftragIds: ['q1'], abbruchGrund: null } }
    const { behaelter } = editor(projekt([]), vorlagen)
    await laufen()
    await klicke(behaelter, 'aktion-neu')
    await laufen()

    await klicke(behaelter, 'aktion-bild-import')

    const hinweis = behaelter.querySelector('[data-testid="aktion-bild-hinweis"]')?.textContent ?? ''
    expect(hinweis).toContain('1 Bild wird importiert')
    expect(hinweis).toContain('erscheint gleich')
  })

  it('ein abgebrochener Import (kein Bild gewaehlt) sagt es, statt zu schweigen', async () => {
    const vorlagen = [mitBildzone()]
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: vorlagen })
    importDoppel.antwort = { ok: true, wert: { auftragIds: [], abbruchGrund: null } }
    const { behaelter } = editor(projekt([]), vorlagen)
    await laufen()
    await klicke(behaelter, 'aktion-neu')
    await laufen()

    await klicke(behaelter, 'aktion-bild-import')

    const hinweis = behaelter.querySelector('[data-testid="aktion-bild-hinweis"]')?.textContent ?? ''
    expect(hinweis).toContain('Kein Bild gewählt')
  })
})

// ---------------------------------------------------------------------------
// 05.11.2026: Ergebnis zuerst - Titel im Inhalt, Beispiel im Canvas, kein Auto-Platzieren
// ---------------------------------------------------------------------------

describe('Ergebnis zuerst', () => {
  it('der Titel steht im INHALT, nicht in der Kopfleiste', async () => {
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: [vorlage('ganz', null)] })
    const { behaelter } = editor(projekt([]), [vorlage('ganz', null)])
    await laufen()
    await klicke(behaelter, 'aktion-neu')
    await laufen()

    const feld = behaelter.querySelector('[data-testid="aktion-titel"]')
    expect(feld).not.toBeNull()
    expect(feld?.closest('[data-testid="aktion-formular"]')).not.toBeNull()
    expect(feld?.closest('[data-testid="aktion-editor-kopf"]')).toBeNull()
  })

  it('„Fertig & ins Video" ist ENTFALLEN - es gibt nur den einen Abschluss', async () => {
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: [vorlage('ganz', null)] })
    const { behaelter } = editor(projekt([]), [vorlage('ganz', null)])
    await laufen()
    await klicke(behaelter, 'aktion-neu')
    await laufen()

    expect(behaelter.querySelector('[data-testid="aktion-anlegen-und-ins-video"]')).toBeNull()
    expect(behaelter.querySelector('[data-testid="aktion-anlegen-bestaetigen"]')).not.toBeNull()
  })

  it('das erste Projektbild erscheint als Beispiel - ohne im Entwurf zu stehen', async () => {
    vi.mocked(zeichneVorschau).mockClear()
    const vorlagen = [vorlageMitZonen('ganz', null, [zone('bild')])]
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: vorlagen })
    const { behaelter } = editor({ ...projekt([]), assets: [bildAsset('a1')] }, vorlagen)
    await laufen()
    await klicke(behaelter, 'aktion-neu')
    await laufen()

    const gezeichnet = vi.mocked(zeichneVorschau).mock.calls.at(-1)?.[0]
    expect(gezeichnet?.bildRef).toBe('a1')
    // Das Select steht weiter auf „kein Bild" - das Beispiel ist nicht gewaehlt.
    expect(behaelter.querySelector<HTMLSelectElement>('[data-testid="aktion-bild-wahl"]')?.value).toBe('')
    expect(behaelter.querySelector('[data-testid="aktion-bild-beispiel"]')).not.toBeNull()
  })

  it('„– kein Bild –" nimmt das Beispielbild wieder aus der Vorschau', async () => {
    vi.mocked(zeichneVorschau).mockClear()
    const vorlagen = [vorlageMitZonen('ganz', null, [zone('bild')])]
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: vorlagen })
    const { behaelter } = editor({ ...projekt([]), assets: [bildAsset('a1')] }, vorlagen)
    await laufen()
    await klicke(behaelter, 'aktion-neu')
    await laufen()

    await waehleImFeld(behaelter, 'aktion-bild-wahl', 'a1')
    await waehleImFeld(behaelter, 'aktion-bild-wahl', '')

    const gezeichnet = vi.mocked(zeichneVorschau).mock.calls.at(-1)?.[0]
    expect(gezeichnet?.bildRef).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// 05.11.2026: Farbauswahl - Markenpalette plus die letzten 20 Farben
// ---------------------------------------------------------------------------

describe('Farbauswahl', () => {
  function mitAkzent(): Vorlage {
    return vorlageMitZonen('ganz', null, [zone('titel'), AKZENT_ZONE])
  }

  it('zeigt die Markenpalette und ein Klick setzt die Akzentfarbe in den Entwurf', async () => {
    const vorlagen = [mitAkzent()]
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: vorlagen })
    const { behaelter } = editor(projekt([]), vorlagen)
    await laufen()
    await klicke(behaelter, 'aktion-neu')
    await laufen()

    const swatches = behaelter.querySelectorAll('[data-testid^="aktion-farbe-marke-"]')
    // 13 Rollen, aber doppelte Hex-Werte (Weiß, Schwarz, #202020) sind EIN Swatch.
    expect(swatches).toHaveLength(10)

    vi.mocked(zeichneVorschau).mockClear()
    act(() => {
      ;(swatches[1] as HTMLButtonElement).click()
    })
    await laufen()

    // Object.entries-Reihenfolge der Marke: akzent, akzentKraeftig, ...
    const gezeichnet = vi.mocked(zeichneVorschau).mock.calls.at(-1)?.[0]
    expect(gezeichnet?.akzentfarbe).toBe('#df3131')

    // Die Historie ist eine UI-Voreinstellung, kein Projekt-Schreibweg.
    const schreiben = doppel.aufrufe.filter(
      (aufruf) => aufruf.kanal === KANAELE.config.setzeUIVoreinstellung,
    )
    expect(schreiben.at(-1)?.nutzlast).toEqual({
      schlüssel: LETZTE_FARBEN_SCHLUESSEL,
      wert: ['#df3131'],
    })
  })

  it('lädt die letzten Farben und zeigt sie unter dem Wähler', async () => {
    doppel.antworten[KANAELE.config.leseKonfig] = {
      ok: true,
      wert: {
        aktivesProjektId: null,
        letztesExportZiel: null,
        uiVoreinstellungen: {
          [LETZTE_FARBEN_SCHLUESSEL]: ['#112233', '#aabbcc'],
        },
      },
    }
    const vorlagen = [mitAkzent()]
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: vorlagen })
    const { behaelter } = editor(projekt([]), vorlagen)
    await laufen()
    await klicke(behaelter, 'aktion-neu')
    await laufen()

    const letzte = behaelter.querySelector('[data-testid="aktion-farbe-letzte-#112233"]')
    expect(letzte).not.toBeNull()

    vi.mocked(zeichneVorschau).mockClear()
    act(() => {
      ;(letzte as HTMLButtonElement).click()
    })
    await laufen()

    const gezeichnet = vi.mocked(zeichneVorschau).mock.calls.at(-1)?.[0]
    expect(gezeichnet?.akzentfarbe).toBe('#112233')
  })

  it('ein Klick auf „Markenwert" nimmt den eigenen Wert zurück', async () => {
    const vorlagen = [mitAkzent()]
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: vorlagen })
    const { behaelter } = editor(projekt([]), vorlagen)
    await laufen()
    await klicke(behaelter, 'aktion-neu')
    await laufen()

    act(() => {
      ;(behaelter.querySelector('[data-testid="aktion-farbe-marke-akzent"]') as HTMLButtonElement).click()
    })
    await laufen()
    expect(behaelter.querySelector('[data-testid="aktion-akzent-marke"]')).not.toBeNull()

    act(() => {
      ;(behaelter.querySelector('[data-testid="aktion-akzent-marke"]') as HTMLButtonElement).click()
    })
    await laufen()

    const gezeichnet = vi.mocked(zeichneVorschau).mock.calls.at(-1)?.[0]
    expect(gezeichnet?.akzentfarbe).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// SEIT 05.11.2026 (TK 9.8.8): Gestaltung je Zone und Bildausschnitt im Inspector.
// ---------------------------------------------------------------------------

/** Einen Regler (input type=range) bewegen - Reacts onChange haengt an `input`. */
async function setzeRegler(behaelter: HTMLDivElement, testid: string, wert: number): Promise<void> {
  const feld = behaelter.querySelector(`[data-testid="${testid}"]`) as HTMLInputElement | null
  if (feld === null) throw new Error(`Regler ${testid} fehlt`)
  const setzeWert = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  await act(async () => {
    setzeWert?.call(feld, String(wert))
    feld.dispatchEvent(new Event('input', { bubbles: true }))
    await Promise.resolve()
    await Promise.resolve()
  })
}

const GESTALTUNGS_VORLAGE = vorlageMitZonen('gestaltbar', null, [
  zone('titel', {
    id: 'ueberschrift',
    text: {
      schriftRolle: 'headlinePlakativ',
      farbRolle: 'textAufDunkel',
      größeMax: 96,
      größeMin: 56,
      maxZeilen: 2,
    },
  }),
  zone('preis', {
    id: 'preis',
    deko: { füllungFarbRolle: 'akzent', radius: 40 },
  }),
  zone('bild', { id: 'motiv', bild: { einpassung: 'cover' } }),
])

describe('Gestaltung je Zone (05.11.2026)', () => {
  it('zeigt nur Zonen, die Text oder Flaeche tragen - und je Zone die passenden Regler', async () => {
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: [GESTALTUNGS_VORLAGE] })
    const { behaelter } = editor(projekt([]), [GESTALTUNGS_VORLAGE])
    await laufen()
    await klicke(behaelter, 'aktion-neu')
    await laufen()

    const titelZone = behaelter.querySelector('[data-testid="aktion-zone-ueberschrift"]')
    expect(titelZone).not.toBeNull()
    // Die Titelzone hat Text: Schriftfarbe, Groesse, Ausrichtung.
    expect(behaelter.querySelector('[data-testid="aktion-zone-ueberschrift-textfarbe"]')).not.toBeNull()
    expect(behaelter.querySelector('[data-testid="aktion-zone-ueberschrift-groesse"]')).not.toBeNull()
    expect(behaelter.querySelector('[data-testid="aktion-zone-ueberschrift-ausrichtung-mitte"]')).not.toBeNull()
    // Sie hat KEINE Flaeche.
    expect(behaelter.querySelector('[data-testid="aktion-zone-ueberschrift-flaeche"]')).toBeNull()

    // Die Preiszone hat beides.
    expect(behaelter.querySelector('[data-testid="aktion-zone-preis-flaeche"]')).not.toBeNull()
  })

  it('eine Flaechenwahl landet im ENTWURF (kein Projekt-Kanal) und erreicht die Vorschau', async () => {
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: [GESTALTUNGS_VORLAGE] })
    const { behaelter } = editor(projekt([]), [GESTALTUNGS_VORLAGE])
    await laufen()
    await klicke(behaelter, 'aktion-neu')
    await laufen()

    await verlasseFeld(behaelter, 'aktion-zone-preis-flaeche', '#00ff00')

    expect(projektAufrufe()).toHaveLength(0)
    const gezeichnet = vi.mocked(zeichneVorschau).mock.calls.at(-1)?.[0]
    expect(gezeichnet?.zonenGestaltung?.preis?.flaechefarbe).toBe('#00ff00')
  })

  it('Groesse und Ausrichtung gehen in den Entwurf', async () => {
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: [GESTALTUNGS_VORLAGE] })
    const { behaelter } = editor(projekt([]), [GESTALTUNGS_VORLAGE])
    await laufen()
    await klicke(behaelter, 'aktion-neu')
    await laufen()

    await setzeRegler(behaelter, 'aktion-zone-ueberschrift-groesse', 150)
    await klicke(behaelter, 'aktion-zone-ueberschrift-ausrichtung-rechts')

    const gezeichnet = vi.mocked(zeichneVorschau).mock.calls.at(-1)?.[0]
    expect(gezeichnet?.zonenGestaltung?.ueberschrift).toMatchObject({
      groesseProzent: 150,
      ausrichtung: 'rechts',
    })
    expect(projektAufrufe()).toHaveLength(0)
  })

  it('„Zuruecksetzen" nimmt die Angaben der Zone wieder heraus', async () => {
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: [GESTALTUNGS_VORLAGE] })
    const { behaelter } = editor(projekt([]), [GESTALTUNGS_VORLAGE])
    await laufen()
    await klicke(behaelter, 'aktion-neu')
    await laufen()

    await verlasseFeld(behaelter, 'aktion-zone-preis-flaeche', '#00ff00')
    await klicke(behaelter, 'aktion-zone-preis-zuruecksetzen')

    const gezeichnet = vi.mocked(zeichneVorschau).mock.calls.at(-1)?.[0]
    expect(gezeichnet?.zonenGestaltung?.preis).toBeUndefined()
  })
})

describe('Bildausschnitt (05.11.2026)', () => {
  it('Zoom und Versatz landen im Entwurf und in der Vorschau', async () => {
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: [GESTALTUNGS_VORLAGE] })
    const { behaelter } = editor(projekt([]), [GESTALTUNGS_VORLAGE])
    await laufen()
    await klicke(behaelter, 'aktion-neu')
    await laufen()

    await setzeRegler(behaelter, 'aktion-ausschnitt-zoom', 150)
    await setzeRegler(behaelter, 'aktion-ausschnitt-x', 20)

    const gezeichnet = vi.mocked(zeichneVorschau).mock.calls.at(-1)?.[0]
    expect(gezeichnet?.bildAusschnitt).toMatchObject({ zoom: 150, versatzX: 20, versatzY: 0 })
    expect(projektAufrufe()).toHaveLength(0)
  })

  it('„Wie die Vorlage" nimmt den Ausschnitt zurueck', async () => {
    vi.mocked(ladeWaehlbareVorlagen).mockResolvedValue({ ok: true, wert: [GESTALTUNGS_VORLAGE] })
    const { behaelter } = editor(projekt([]), [GESTALTUNGS_VORLAGE])
    await laufen()
    await klicke(behaelter, 'aktion-neu')
    await laufen()

    await setzeRegler(behaelter, 'aktion-ausschnitt-zoom', 200)
    await klicke(behaelter, 'aktion-ausschnitt-zuruecksetzen')

    const gezeichnet = vi.mocked(zeichneVorschau).mock.calls.at(-1)?.[0]
    expect(gezeichnet?.bildAusschnitt).toBeNull()
  })
})
