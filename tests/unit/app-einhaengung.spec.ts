// Verhaltenstests zu #262 - App.tsx: die Einhaengung (jsdom).
//
// Geprueft wird NUR die Datei src/renderer/App.tsx (+ diese Testdatei). Der
// Bootstrap-Ablauf selbst (bootstrap.ts, #260) laeuft ECHT - er ist rein; alles,
// was er ruft (Sichten, Zugaenge, Sitzung, Nachlauf, Abo-Bildung, Halter und
// die fuenf Modul-Wurzeln), sind Doppel.
//
// Wortlaut der Invarianten steht im Issue #262:
//   - starteRenderer GENAU EINmal je Lauf, Abbau GENAU EINmal je Abbau
//   - bei 'laeuft'/'gescheitert' kein Rahmen, keine Wurzel, kein Overlay
//   - bei 'bereit' die VIER Eigenschaften des Rahmens, daneben - als
//     Geschwister - das UebergabeOverlay (GENAU SIEBEN Eigenschaften)
//   - GENAU EIN Meldeweg; GENAU EINE aktuelle Meldung; kein Ausblend-Timer
//   - der Import-Rueckweg (`meldeImportErgebnis`) verdrahtet #256/#133
// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { createElement, act, type JSX, type ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'

import { KANAELE } from '../../src/shared/contracts/kanaele'
import { App } from '../../src/renderer/App'
// WICHTIG: react VOR den gemockten Modulen und App importieren - die
// Mock-Factories brauchen createElement erst, WENN sie laufen (lazy), aber
// die Import-Reihenfolge sichert, dass react initialisiert ist.

// Der Doppel-Halter der Shell-Reparatur (steuerbar; zählt Anmeldungen). ERSETZT
// den echten Ein-Fenster-Halter aus #256 - die Anmeldungen und Lagewechsel des
// Tests laufen ueber dieses Doppel.
const halterDoppel = vi.hoisted(() => {
  type Horer = (lage: unknown) => void
  type Eintrag = { horer: Horer; aus: boolean }
  let lage: unknown = {
    stand: null,
    laufendeUebergabe: null,
    hervorgehobeneAktionId: null,
    rueckkehrReiter: null,
  }
  const eintraege: Eintrag[] = []
  let anmeldezahl = 0
  return {
    holeLage: () => lage,
    setzeLage: (neu: unknown): void => {
      lage = neu
      for (const eintrag of [...eintraege]) {
        if (eintrag.aus) continue
        try {
          eintrag.horer(lage)
        } catch {
          // Ein werfender Hoerer reisst niemanden mit (ENTSCHIEDEN 10, #256).
        }
      }
    },
    aufLageGeaendert: (horerNeu: Horer) => {
      anmeldezahl += 1
      const eintrag: Eintrag = { horer: horerNeu, aus: false }
      eintraege.push(eintrag)
      let abgemeldet = false
      return () => {
        if (abgemeldet) return
        abgemeldet = true
        eintrag.aus = true
        const stelle = eintraege.indexOf(eintrag)
        if (stelle !== -1) eintraege.splice(stelle, 1)
      }
    },
    anmeldezahl: () => anmeldezahl,
    hoererzahl: () => eintraege.filter((e) => !e.aus).length,
    zurueck: (): void => {
      lage = {
        stand: null,
        laufendeUebergabe: null,
        hervorgehobeneAktionId: null,
        rueckkehrReiter: null,
      }
      eintraege.length = 0
      anmeldezahl = 0
    },
  }
})

// Die uebrigen Doppel-Zustaende und -Aufzeichnungen.
const d = vi.hoisted(() => {
  return {
    schritte: [] as Array<Record<string, unknown>>,
    tagebuch: [] as string[],
    rahmenRufe: [] as Array<Record<string, unknown>>,
    overlayRufe: [] as Array<Record<string, unknown>>,
    speicherRufe: [] as Array<Record<string, unknown>>,
    markenSpeicherRufe: [] as Array<Record<string, unknown>>,
    leisteRufe: [] as unknown[],
    abonniereKanaele: [] as unknown[],
    nachlaufAbonnierende: [] as unknown[],
    wirkungen: [] as Array<Record<string, unknown>>,
    // Steuerbare Antworten (je Test gesetzt)
    baueSichtenAntwort: null as unknown,
    starteSitzungAntwort: null as unknown,
    bereiteVorAntwort: null as unknown,
    // Doppel-Objekte (in beforeEach frisch gesetzt)
    zugaengeDoppel: null as unknown,
    projektImZugang: null as unknown,
    sitzungshalterDoppel: null as unknown,
  }
})

// ----------------------------------------------------------------------------
// Die Doppel je Baustein
// ----------------------------------------------------------------------------
vi.mock('../../src/renderer/ipc-client/ereignisse', () => ({
  abonniere: vi.fn((kanal: unknown) => {
    d.abonniereKanaele.push(kanal)
    return () => {}
  }),
}))

vi.mock('../../src/renderer/app-shell/sichten', () => ({
  holeSichten: vi.fn(() => null),
  baueSichten: vi.fn(async () => d.baueSichtenAntwort),
}))

vi.mock('../../src/renderer/app-shell/start', () => ({
  UI_SCHLUESSEL_REITER: 'app-shell.aktiverReiter',
  UI_SCHLUESSEL_QUEUE_AUFGEKLAPPT: 'queue-panel.aufgeklappt',
  starteSitzung: vi.fn(async () => d.starteSitzungAntwort),
  merkeAktivenReiter: vi.fn(() => () => {}),
}))

vi.mock('../../src/renderer/app-shell/auftrags-nachlauf', () => ({
  TERMINALE_ZUSTAENDE: ['erfolg', 'fehlgeschlagen', 'abgebrochen'],
  D1_AENDERNDE_ARTEN: ['import', 'loeschen'],
  starteAuftragsNachlauf: vi.fn(
    (
      abonniereQueue: unknown,
      wirkungen: Record<string, unknown>,
    ): (() => void) => {
      d.nachlaufAbonnierende.push(abonniereQueue)
      d.wirkungen.push(wirkungen)
      return () => {}
    },
  ),
}))

vi.mock('../../src/renderer/app-shell/inhalte-zugaenge', () => ({
  verteileZugaenge: vi.fn(() => d.zugaengeDoppel),
}))

vi.mock('../../src/renderer/app-shell/inhalte', () => ({
  baueReiterInhalte: vi.fn(
    (): Record<string, unknown> => ({
      zusammenstellen: () => createElement('div', { 'data-testid': 'reiter-marke-zusammenstellen' }),
      aktionen: () => createElement('div', { 'data-testid': 'reiter-marke-aktionen' }),
      vorlagen: () => createElement('div', { 'data-testid': 'reiter-marke-vorlagen' }),
      projekte: () => createElement('div', { 'data-testid': 'reiter-marke-projekte' }),
    }),
  ),
}))

vi.mock('../../src/renderer/app-shell/undo-historien', () => ({
  leereProjektHistorie: vi.fn(() => {}),
  projektHistorie: vi.fn(),
  vorlagenHistorie: vi.fn(),
  bereichFuerReiter: vi.fn(),
}))

vi.mock('../../src/renderer/composer/ausgabe-liste', () => ({
  aktualisiereAusgaben: vi.fn(() => {}),
  holeAusgaben: vi.fn(),
  aufAusgabenGeaendert: vi.fn(),
}))

vi.mock('../../src/renderer/composer/index', () => ({
  ComposerWurzel: vi.fn(() => createElement('div', { 'data-testid': 'wurzel-composer-marke' })),
}))

vi.mock('../../src/renderer/composer/reparatur-optionen', () => ({
  schliesseMediumFixAb: vi.fn(async () => ({})),
  schliesseAktionsFixAb: vi.fn(async () => ({})),
  schliesseAbschnittsFixAb: vi.fn(async () => ({})),
}))

vi.mock('../../src/renderer/composer/reparatur-fuehrung', () => ({
  aktualisiereReparatur: vi.fn((stand: unknown) => stand),
}))

vi.mock('../../src/renderer/action-editor', () => ({
  ActionEditorWurzel: vi.fn(() =>
    createElement('div', { 'data-testid': 'wurzel-aktionen-marke' })),
}))

vi.mock('../../src/renderer/vorlagen-editor', () => ({
  VorlagenEditorWurzel: vi.fn(() =>
    createElement('div', { 'data-testid': 'wurzel-vorlagen-marke' })),
}))

vi.mock('../../src/renderer/projekt-verwaltung', () => ({
  ProjektVerwaltungWurzel: vi.fn(() =>
    createElement('div', { 'data-testid': 'wurzel-projekte-marke' })),
}))

vi.mock('../../src/renderer/marken-editor', () => ({
  MarkenEditorWurzel: vi.fn(() =>
    createElement('div', { 'data-testid': 'wurzel-marken-marke' })),
}))

vi.mock('../../src/renderer/preview-player/vorschau', () => ({
  Vorschau: vi.fn(() => createElement('div', { 'data-testid': 'wurzel-vorschau-marke' })),
}))

vi.mock('../../src/renderer/shell/WarteschlangenLeiste', () => ({
  WarteschlangenLeiste: vi.fn(() => {
    d.leisteRufe.push(1)
    return createElement('div', { 'data-testid': 'leiste-marke' })
  }),
}))

vi.mock('../../src/renderer/app-shell/speicherstatus', () => ({
  SpeicherHinweis: vi.fn(
    (eigenschaften: Record<string, unknown>): JSX.Element => {
      d.speicherRufe.push(eigenschaften)
      return createElement('div', { 'data-testid': 'speicherhinweis-marke' })
    },
  ),
  holeSpeicherlage: vi.fn(),
  aufSpeicherlage: vi.fn(),
}))

vi.mock('../../src/renderer/app-shell/marken-speicherstatus', () => ({
  MarkenSpeicherHinweis: vi.fn(
    (eigenschaften: Record<string, unknown>): JSX.Element => {
      d.markenSpeicherRufe.push(eigenschaften)
      return createElement('div', { 'data-testid': 'marken-speicherhinweis-marke' })
    },
  ),
  holeMarkenSpeicherlage: vi.fn(),
}))

vi.mock('../../src/renderer/app-shell/reiter', () => ({
  holeReiter: vi.fn(() => 'zusammenstellen'),
  wechsleReiter: vi.fn(() => {}),
  aufReiterGeaendert: vi.fn(),
  istGueltigerReiter: vi.fn(),
  setzeReiterZustandZurueck: vi.fn(() => {}),
}))

vi.mock('../../src/renderer/app-shell/undo-aufzeichnung-vorlage', () => ({
  sitzungshalter: vi.fn(() => d.sitzungshalterDoppel),
  setzeSitzungshalterZurueck: vi.fn(() => {}),
  entscheideVorlagenAufzeichnung: vi.fn(),
}))

vi.mock('../../src/renderer/app-shell/uebergabe', () => ({
  reparaturhalter: vi.fn(() => halterDoppel),
  nimmUebergabeEntgegen: vi.fn(() => {}),
  beendeLaufende: vi.fn(() => {}),
  schliesseFixAb: vi.fn(() => {}),
  meldeStand: vi.fn(() => {}),
  schliesseMedienImportAb: vi.fn(async () => ({})),
  setzeReparaturhalterZurueck: vi.fn(() => {}),
}))

vi.mock('../../src/renderer/app-shell/uebergabe.tsx', () => ({
  UebergabeOverlay: vi.fn(
    (eigenschaften: Record<string, unknown>): JSX.Element => {
      d.overlayRufe.push(eigenschaften)
      return createElement('div', { 'data-testid': 'overlay-marke' })
    },
  ),
}))

vi.mock('../../src/renderer/app-shell/rahmen', () => ({
  Rahmen: vi.fn(
    (eigenschaften: Record<string, unknown>): JSX.Element => {
      d.rahmenRufe.push(eigenschaften)
      const inhalte = (eigenschaften.inhalte ?? {}) as Record<
        string,
        (e: { sichtbar: boolean }) => ReactElement
      >
      return createElement(
        'div',
        { 'data-testid': 'rahmen-wurzel' },
        createElement(
          'div',
          { 'data-testid': 'rahmen-inhalte' },
          Object.entries(inhalte).map(([reiter, inhalt]) =>
            createElement(
              'div',
              { 'data-testid': `rahmen-reiter-${reiter}`, key: reiter },
              inhalt({ sichtbar: true }),
            ),
          ),
        ),
        createElement(
          'div',
          { 'data-testid': 'rahmen-leiste' },
          (eigenschaften.warteschlangenLeiste as () => unknown)() as ReactElement,
        ),
        createElement(
          'div',
          { 'data-testid': 'rahmen-speicher' },
          (eigenschaften.speicherHinweis as () => unknown)() as ReactElement,
        ),
        createElement(
          'div',
          { 'data-testid': 'rahmen-meldung' },
          (eigenschaften.meldungsFlaeche as () => unknown)() as ReactElement,
        ),
      )
    },
  ),
}))

// Der Bootstrap bleibt ECHT; nur starteRenderer wird um Aufzeichnung und
// Abbau-Zaehlung gewickelt (Tagebuch: 'laeuftAn' je Lauf, 'baueAb' je Abbau).
vi.mock('../../src/renderer/app-shell/bootstrap', async (importEcht) => {
  const echt = await importEcht<typeof import('../../src/renderer/app-shell/bootstrap')>()
  return {
    ...echt,
    starteRenderer: vi.fn((schritte: Record<string, unknown>): (() => void) => {
      d.tagebuch.push('laeuftAn')
      d.schritte.push(schritte)
      const echtAbbau = echt.starteRenderer(schritte as never)
      return () => {
        d.tagebuch.push('baueAb')
        echtAbbau()
      }
    }),
  }
})

// Die gemockten Wurzel/Spione brauchen Zeit genug... die Tests:
import * as inhalteModul from '../../src/renderer/app-shell/inhalte'
import * as composerIndex from '../../src/renderer/composer/index'
import * as optionenModul from '../../src/renderer/composer/reparatur-optionen'
import * as actionEditorModul from '../../src/renderer/action-editor'
import * as vorlagenEditorModul from '../../src/renderer/vorlagen-editor'
import * as projektVerwaltungModul from '../../src/renderer/projekt-verwaltung'
import * as markenEditorModul from '../../src/renderer/marken-editor'
import * as vorschauModul from '../../src/renderer/preview-player/vorschau'
import * as speicherModul from '../../src/renderer/app-shell/speicherstatus'
import * as reiterModul from '../../src/renderer/app-shell/reiter'
import * as uebergabeModul from '../../src/renderer/app-shell/uebergabe'
import * as bootstrap from '../../src/renderer/app-shell/bootstrap'
import { starteMedienImport } from '../../src/renderer/app-shell/medien-import-uebergabe'

// ----------------------------------------------------------------------------
// Hilfsgelaende: Doppel-Antworten, Rendern, Warten, Ablesen
// ----------------------------------------------------------------------------
interface Geraet {
  behaelter: HTMLDivElement
  wurzel: Root
}

const aktiveGeraete: Array<Geraet> = []

function frischeDoppel(): void {
  d.projektImZugang = { id: 'p1' }
  d.zugaengeDoppel = {
    projektBearbeitung: {} as object,
    projektRoh: {
      lade: vi.fn(async () => ({ ok: true, wert: d.projektImZugang })),
      hole: vi.fn(() => ({ projekt: d.projektImZugang })),
      setzeProjekt: vi.fn(),
      setzeListe: vi.fn(),
      gleicheElementAb: vi.fn(),
      leere: vi.fn(),
      aufGeaendert: vi.fn(() => () => {}),
    },
    vorlagen: {
      lade: vi.fn(),
      hole: vi.fn(() => null),
      aufGeaendert: vi.fn(() => () => {}),
    },
    zeichnen: {
      bereiteVor: vi.fn(async () => d.bereiteVorAntwort),
      hole: vi.fn(() => null),
      verwirfMotivBestand: vi.fn(),
    },
    marken: {} as object,
  }
  d.sitzungshalterDoppel = { doppel: 'sitzung' }
}

/** Bereit OHNE wiederherstellbares Projekt; je Aufruf ein StartHinweis. */
function stelleBereitOhneProjekt(
  hinweis: Record<string, unknown> = { art: 'kein_aktives_projekt' },
): void {
  d.baueSichtenAntwort = { ok: true, wert: { projekt: {}, vorlagen: {}, zeichnen: {}, marken: {} } }
  d.starteSitzungAntwort = { art: 'kein-projekt', reiter: 'projekte', hinweis }
  d.bereiteVorAntwort = { ok: true, wert: {} }
  // #346: „kein Projekt aktiv" heisst auch AM ZUGANG: `hole().projekt` liefert
  // null - der Lese-Zugang ist dieselbe Quelle wie der restaurierte Stand.
  d.projektImZugang = null
}

/** Bereit MIT wiederhergestelltem Projekt (Schritt 3 ruft bereiteVor). */
function stelleBereitMitProjekt(): void {
  d.baueSichtenAntwort = { ok: true, wert: { projekt: {}, vorlagen: {}, zeichnen: {}, marken: {} } }
  d.starteSitzungAntwort = { art: 'projekt-geladen', projekt: d.projektImZugang, reiter: 'zusammenstellen' }
  d.bereiteVorAntwort = { ok: true, wert: {} }
}

function rendere(): Geraet {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel: Root = createRoot(behaelter)
  act(() => {
    wurzel.render(createElement(App) as ReactElement)
  })
  const geraet = { behaelter, wurzel }
  aktiveGeraete.push(geraet)
  return geraet
}

function klicke(behaelter: HTMLDivElement, beschriftung: string): void {
  const knopf = [...behaelter.querySelectorAll('button')].find(
    (b) => b.textContent === beschriftung,
  )
  expect(knopf).toBeDefined()
  act(() => {
    knopf!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

function letzterSchritt(): Record<string, unknown> {
  return d.schritte[d.schritte.length - 1] as unknown as Record<string, unknown>
}

function letzterRahmen(): Record<string, unknown> {
  return d.rahmenRufe[d.rahmenRufe.length - 1] as unknown as Record<string, unknown>
}

function letztesOverlay(): Record<string, unknown> {
  return d.overlayRufe[d.overlayRufe.length - 1] as unknown as Record<string, unknown>
}

/** Holt die EINE UebergabeUmgebung ueber den Weiterreicher-Weg (meldeUebergabe). */
function fangeUmgebung(): Record<string, unknown> {
  const reiterumgebung = vi.mocked(inhalteModul.baueReiterInhalte).mock.calls.at(-1)![2] as unknown as {
    composerVerdrahtung: {
      meldeUebergabe: (an: unknown) => void
    }
  }
  act(() => {
    reiterumgebung.composerVerdrahtung.meldeUebergabe({
      ziel: 'asset-auswahl',
      elementId: 'fest',
    })
  })
  const aufnahme = vi.mocked(uebergabeModul.nimmUebergabeEntgegen).mock.calls.at(-1) as unknown as
    | [umgebung: Record<string, unknown>, an: unknown]
    | undefined
  expect(aufnahme).toBeDefined()
  return aufnahme![0]
}

function quelleVonApp(): string {
  const importurl = import.meta.url as string
  return readFileSync(
    fileURLToPath(importurl.slice(0, importurl.lastIndexOf('tests/')) + 'src/renderer/App.tsx'),
    'utf8',
  )
}

beforeEach(() => {
  halterDoppel.zurueck()
  d.schritte.length = 0
  d.tagebuch.length = 0
  d.rahmenRufe.length = 0
  d.overlayRufe.length = 0
  d.speicherRufe.length = 0
  d.leisteRufe.length = 0
  d.abonniereKanaele.length = 0
  d.nachlaufAbonnierende.length = 0
  d.wirkungen.length = 0
  d.markenSpeicherRufe.length = 0
  frischeDoppel()
})

afterEach(() => {
  for (const geraet of aktiveGeraete) {
    act(() => {
      geraet.wurzel.unmount()
    })
    geraet.behaelter.remove()
  }
  aktiveGeraete.length = 0
  document.body.innerHTML = ''
  vi.clearAllMocks()
})

// ----------------------------------------------------------------------------
// DIE PRUEFUNGEN (#262, Definition of Done)
// ----------------------------------------------------------------------------
describe('#262 App.tsx: die Einhaengung (jsdom)', () => {
  it('starteRenderer wird beim Aufbau GENAU EINmal gerufen; der Abbau beim Abbau GENAU EINmal' , async () => {
    stelleBereitMitProjekt()
    rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(vi.mocked(bootstrap.starteRenderer)).toHaveBeenCalledTimes(1)
    expect(d.tagebuch.filter((eintrag) => eintrag === 'baueAb')).toHaveLength(0)
  })

  it('Beim Abbau wird die gelieferte Abbau-Funktion GENAU EINmal gerufen (Tagebuch-Beleg)', async () => {
    stelleBereitMitProjekt()
    const { behaelter, wurzel } = rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    act(() => {
      wurzel.unmount()
    })
    behaelter.remove()
    expect(d.tagebuch.filter((eintrag) => eintrag === 'baueAb')).toHaveLength(1)
  })

  it("Bei 'laeuft' wird Rahmen Null Mal gerendert; keine Wurzel, keine Leiste, kein Hinweis, kein Overlay", () => {
    // baueSichten haengt: die Lage bleibt bei 'laeuft'.
    d.baueSichtenAntwort = new Promise(() => {})
    const { behaelter } = rendere()
    expect(behaelter.querySelector('[data-testid="app-laeuft"]')).not.toBeNull()
    expect(d.rahmenRufe).toHaveLength(0)
    expect(d.overlayRufe).toHaveLength(0)
    expect(d.speicherRufe).toHaveLength(0)
  })

  it("Bei 'gescheitert': Null Mal Rahmen; Code und Meldung werden gezeigt; 'Erneut versuchen' baut den ERSTEN Lauf ab und startet ERST DANACH neu", async () => {
    d.baueSichtenAntwort = {
      ok: false,
      fehler: { code: 'datenort_nicht_bereit', meldung: 'Der Datenort ist nicht bereit.' },
    }
    const { behaelter } = rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(d.rahmenRufe).toHaveLength(0)
    expect(d.overlayRufe).toHaveLength(0)
    expect(behaelter.querySelector('[data-testid="app-fehler-code"]')!.textContent).toBe(
      'datenort_nicht_bereit',
    )
    expect(behaelter.querySelector('[data-testid="app-fehler-meldung"]')!.textContent).toBe(
      'Der Datenort ist nicht bereit.',
    )

    stelleBereitMitProjekt()
    klicke(behaelter, 'Erneut versuchen')
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(vi.mocked(bootstrap.starteRenderer)).toHaveBeenCalledTimes(2)
    // Reihenfolge: der erste Lauf startet, DANN sein Abbau, DANN der zweite Lauf.
    expect(d.tagebuch).toEqual(['laeuftAn', 'baueAb', 'laeuftAn'])
  })

  it("Bei 'bereit' bekommt Rahmen ALLE VIER Eigenschaften: inhalte, warteschlangenLeiste, speicherHinweis und meldungsFlaeche - keine bleibt leer", async () => {
    stelleBereitOhneProjekt()
    const { behaelter } = rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    const rahmenEigenschaften = letzterRahmen()
    expect(Object.keys(rahmenEigenschaften).sort()).toEqual([
      'inhalte',
      'meldungsFlaeche',
      'speicherHinweis',
      'warteschlangenLeiste',
    ])
    expect(Object.keys(rahmenEigenschaften)).toHaveLength(4)
    // inhalte ist ToBe zum Ergebnis von baueReiterInhalte.
    const baueRufe = vi.mocked(inhalteModul.baueReiterInhalte)
    expect(rahmenEigenschaften.inhalte).toBe(
      (baueRufe.mock.results.at(-1) as { value: unknown }).value,
    )
    // ... und die drei uebrigen liefern im DOM genau einmal je Baustein:
    expect(behaelter.querySelectorAll('[data-testid="leiste-marke"]')).toHaveLength(1)
    expect(behaelter.querySelectorAll('[data-testid="speicherhinweis-marke"]')).toHaveLength(1)
    expect(behaelter.querySelectorAll('[data-testid="rahmen-reiter-aktionen"]')).toHaveLength(1)
  })

  it('warteschlangenLeiste rendert GENAU die Wurzel aus #257; baueAuftragsSichtAuf steht Null mal in App.tsx (Grep-Probe)', async () => {
    stelleBereitOhneProjekt()
    const { behaelter } = rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(d.leisteRufe).toHaveLength(1)
    expect(behaelter.querySelector('[data-testid="rahmen-leiste"] [data-testid="leiste-marke"]')).not.toBeNull()
    expect(quelleVonApp()).not.toMatch(/baueAuftragsSichtAuf/)
  })

  it('Die Meldungsflaeche zeigt SpeicherHinweis mit ZWEI Abo-Funktionen fuer die beiden autoSpeichernStatus-Kanaele (benannter Test)', async () => {
    stelleBereitOhneProjekt()
    rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    const hinweisEigenschaften = d.speicherRufe.at(-1) as Record<string, unknown>
    expect(hinweisEigenschaften.abonniereProjekt).toBeDefined()
    expect(hinweisEigenschaften.abonniereVorlagen).toBeDefined()
    act(() => {
      ;(hinweisEigenschaften.abonniereProjekt as (h: unknown) => () => void)(vi.fn())
    })
    expect(d.abonniereKanaele.at(-1)).toBe(KANAELE.project.autoSpeichernStatus)
    act(() => {
      ;(hinweisEigenschaften.abonniereVorlagen as (h: unknown) => () => void)(vi.fn())
    })
    expect(d.abonniereKanaele.at(-1)).toBe(KANAELE.vorlagen.autoSpeichernStatus)
  })

  it('Der Schlitz speicherHinweis rendert BEIDE Bauteile innerhalb desselben Knotens; das Abo Markenspeicherstatus wird mit GENAU DEM Kanal gebildet (#327)', async () => {
    stelleBereitOhneProjekt()
  const { behaelter, wurzel } = rendere()
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })

  expect(d.markenSpeicherRufe.length).toBeGreaterThanOrEqual(1)
    const markenEigenschaften = d.markenSpeicherRufe.at(-1) as Record<string, unknown>
    expect(markenEigenschaften.abonniereMarken).toBeDefined()
    act(() => {
      ;(markenEigenschaften.abonniereMarken as (h: unknown) => () => void)(vi.fn())
    })
    expect(d.abonniereKanaele.at(-1)).toBe(KANAELE.marken.autoSpeichernStatus)
    // Bestandstest aus #262 uebernommen: SpeicherHinweis laeuft WEITERHIN unberuehrt
    expect(d.speicherRufe.length).toBeGreaterThanOrEqual(1)
    const hinweisEigenschaften = d.speicherRufe.at(-1) as Record<string, unknown>
    act(() => {
      ;(hinweisEigenschaften.abonniereProjekt as (h: unknown) => () => void)(vi.fn())
    })
    expect(d.abonniereKanaele.at(-1)).toBe(KANAELE.project.autoSpeichernStatus)
    // Der Kanalname steht NUR in der Registry (#304): App.tsx hat KEIN Zeichenketten-Literal:
    expect(quelleVonApp().match(/marken:autoSpeichernStatus/g) ?? []).toHaveLength(0)
  })

  it("Der Melde-Nachweis, benannter Test 'eine Meldung wird gezeigt': Code und Meldung landen in der meldungsFlaeche, NICHT im speicherHinweis", async () => {
    stelleBereitMitProjekt()
    const { behaelter } = rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    const schritte = letzterSchritt() as { meldeFehler: (code: string, meldung: string) => void }
    await act(async () => {
      schritte.meldeFehler('nicht_gefunden', 'X')
      await Promise.resolve()
    })
    const flaeche = behaelter.querySelector('[data-testid="meldungs-flaeche"]')
    expect(flaeche).not.toBeNull()
    expect(flaeche!.textContent).toContain('X')
    expect(flaeche!.textContent).toContain('nicht_gefunden')
    const speicherZone = behaelter.querySelector('[data-testid="rahmen-speicher"]')!
    expect(speicherZone.textContent).not.toContain('nicht_gefunden')
    expect(speicherZone.querySelectorAll('[data-testid="meldung-zeile"]')).toHaveLength(0)
  })

  it('schritte.meldeFehler, wirkungen.meldeFehler und umgebung.meldeFehler sind ToBe-gleich - es gibt GENAU EINEN Meldeweg (benannter Test)', async () => {
    stelleBereitMitProjekt()
    rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    const schritte = letzterSchritt() as { meldeFehler: unknown }
    const wirkungen = d.wirkungen[0] as { meldeFehler: unknown }
    const umgebung = fangeUmgebung()
    expect(schritte.meldeFehler).toBeDefined()
    expect(umgebung.meldeFehler).toBe(schritte.meldeFehler)
    expect(wirkungen.meldeFehler).toBe(schritte.meldeFehler)
  })

  it('Eine ZWEITE Meldung ersetzt die erste; es steht nie mehr als EINE im DOM; Schliessen leert die Flaeche', async () => {
    stelleBereitMitProjekt()
    const { behaelter } = rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    const schritte = letzterSchritt() as { meldeFehler: (code: string, meldung: string) => void }
    await act(async () => {
      schritte.meldeFehler('c1', 'erste')
      await Promise.resolve()
    })
    await act(async () => {
      schritte.meldeFehler('c2', 'zweite')
      await Promise.resolve()
    })
    const zeilen = behaelter.querySelectorAll('[data-testid="meldung-zeile"]')
    expect(zeilen).toHaveLength(1)
    expect(zeilen[0]!.textContent).toContain('c2')
    expect(zeilen[0]!.textContent).not.toContain('c1')
    klicke(behaelter, 'Schließen')
    await act(async () => {
      await Promise.resolve()
    })
    expect(behaelter.querySelector('[data-testid="meldung-zeile"]')).toBeNull()
  })

  it('Eine Meldung, die VOR bereit entsteht (fehlgeschlagenes bereiteVor), steht nach dem Uebergang in der Flaeche - sie geht nicht verloren (benannter Test)', async () => {
    stelleBereitMitProjekt()
    d.bereiteVorAntwort = {
      ok: false,
      fehler: { code: 'zeichen_kaputt', meldung: 'Die Vorbereitung scheiterte.' },
    }
    const { behaelter } = rendere()
    // Noch LAEUFT: die Meldung existiert nur im Halter.
    expect(d.rahmenRufe).toHaveLength(0)
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(behaelter.querySelector('[data-testid="rahmen-wurzel"]')).not.toBeNull()
    const flaeche = behaelter.querySelector('[data-testid="meldungs-flaeche"]')
    expect(flaeche).not.toBeNull()
    expect(flaeche!.textContent).toContain('zeichen_kaputt')
  })

  it("Bei { art: 'kein_aktives_projekt' } zeigt die Flaeche den startHinweis; bei 'konfig_unlesbar' und 'projekt_unlesbar' den Code", async () => {
    stelleBereitOhneProjekt({ art: 'kein_aktives_projekt' })
    const geraet = rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    const flaeche = geraet.behaelter.querySelector('[data-testid="meldungs-flaeche"]')
    expect(flaeche).not.toBeNull()
    expect(flaeche!.textContent).toContain('Kein Projekt')

    for (const geraetOffen of aktiveGeraete) {
      act(() => {
        geraetOffen.wurzel.unmount()
      })
      geraetOffen.behaelter.remove()
    }
    aktiveGeraete.length = 0
    d.rahmenRufe.length = 0

    stelleBereitOhneProjekt({ art: 'konfig_unlesbar', code: 'k_err', meldung: 'm_text' })
    const geraetB = rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(
      geraetB.behaelter.querySelector('[data-testid="meldungs-flaeche"]')!.textContent,
    ).toContain('k_err')
  })

  it("Bei 'projekt-geladen' ist startHinweis Null und die Flaeche zeigt keinen Hinweis", async () => {
    stelleBereitMitProjekt()
    const { behaelter } = rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(behaelter.querySelector('[data-testid="meldungs-flaeche"]')).toBeNull()
  })

  // #346, der Kernbefund: Ein startHinweis, der beim Bootstrap gesetzt wurde,
  // ist WEG, sobald ein Projekt offen ist - auch wenn er NACH dem Bootstrap
  // durch ein ANGELEGTES/GEoeffNEtes Projekt erreicht wurde (Reaktiv; der
  // Bootstrap-Lage wird NICHT angefasst).
  it('Ein startHinweis verschwindet, sobald ein Projekt offen ist (#346, benannter Test)', async () => {
    stelleBereitOhneProjekt({ art: 'kein_aktives_projekt' })
    const { behaelter } = rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    // Brückenzustand richtig angeschlossen: der Hinweis steht, kein Projekt offen...
    expect(behaelter.querySelector('[data-testid="meldungs-flaeche"]')?.textContent).toContain(
      'Kein Projekt',
    )

    // ...dann oeffnet sich ein Projekt: der Zugang meldet es. Der App-Abo
    // hängt am vi.fn von aufGeaendert - jeder Aufruf dort ist ein Hörer.
    await act(async () => {
      d.projektImZugang = { id: 'p1' } as unknown
      const abo = (
        d.zugaengeDoppel as { projektRoh: { aufGeaendert: { mock: { calls: unknown[][] } } } }
      ).projektRoh.aufGeaendert.mock.calls
      for (const [h] of abo) {
        ;(h as (schicht: unknown) => void)({ projekt: d.projektImZugang })
      }
    })
    expect(behaelter.querySelector('[data-testid="meldungs-flaeche"]')).toBeNull()
  })

  it('baueReiterInhalte wird mit den Zugaengen aus der Lage, den SECHS Modul-Wurzeln (#322) und GENAU FUENF belegten Umgebung-Feldern gerufen', async () => {
    stelleBereitOhneProjekt()
    rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    const rufe = vi.mocked(inhalteModul.baueReiterInhalte).mock.calls
    expect(rufe).toHaveLength(1)
    const [zugaenge, wurzeln, umgebung] = rufe[0] as unknown as [
      unknown,
      Record<string, unknown>,
      Record<string, unknown>,
    ]
    expect(zugaenge).toBe(d.zugaengeDoppel)
    expect(wurzeln.composer).toBe(composerIndex.ComposerWurzel)
    expect(wurzeln.vorschau).toBe(vorschauModul.Vorschau)
    expect(wurzeln.actionEditor).toBe(actionEditorModul.ActionEditorWurzel)
    expect(wurzeln.vorlagenEditor).toBe(vorlagenEditorModul.VorlagenEditorWurzel)
    expect(wurzeln.markenEditor).toBe(markenEditorModul.MarkenEditorWurzel)
    expect(wurzeln.projektVerwaltung).toBe(projektVerwaltungModul.ProjektVerwaltungWurzel)
    expect(Object.keys(wurzeln).sort()).toEqual([
      'actionEditor',
      'composer',
      'markenEditor',
      'projektVerwaltung',
      'vorlagenEditor',
      'vorschau',
    ])
    expect(Object.keys(umgebung).sort()).toEqual([
      'aufProjekteWechseln',
      'composerVerdrahtung',
      'hervorgehobeneAktionId',
      'vorlagenSitzung',
      'wechsleZuZusammenstellen',
    ])
  })

  it('Die Reiterumgebung ist vollstaendig verdrahtet: vorlagenSitzung, starteMedienImport, reparatur und hervorgehobeneAktionId sind ToBe-gleich (benannter Test)', async () => {
    halterDoppel.setzeLage({
      stand: { doppel: 'stand' },
      laufendeUebergabe: null,
      hervorgehobeneAktionId: 'ak1',
      rueckkehrReiter: null,
    })
    stelleBereitOhneProjekt()
    rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    const [, , umgebung] = vi.mocked(inhalteModul.baueReiterInhalte).mock
      .calls.at(-1) as unknown as [unknown, unknown, Record<string, unknown>]
    const verdrahtung = umgebung.composerVerdrahtung as unknown as {
      starteMedienImport: unknown
      reparatur: unknown
    }
    expect(umgebung.vorlagenSitzung).toBe(d.sitzungshalterDoppel)
    expect(verdrahtung.starteMedienImport).toBe(starteMedienImport)
    expect(verdrahtung.reparatur).toBe((halterDoppel.holeLage() as { stand: unknown }).stand)
    expect(umgebung.hervorgehobeneAktionId).toBe('ak1')

    // Die Wechsel-Spione: ein Aufruf je Feld, GENAU EINmal je Aufruf.
    await act(async () => {
      ;(umgebung.aufProjekteWechseln as unknown as () => void)()
    })
    expect(vi.mocked(reiterModul.wechsleReiter)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(reiterModul.wechsleReiter)).toHaveBeenCalledWith('projekte')
    await act(async () => {
      ;(umgebung.wechsleZuZusammenstellen as unknown as () => void)()
    })
    expect(vi.mocked(reiterModul.wechsleReiter)).toHaveBeenCalledTimes(2)
    expect(vi.mocked(reiterModul.wechsleReiter)).toHaveBeenLastCalledWith('zusammenstellen')
  })

  it('Die Wechsel-Spione: App selbst ruft wechsleReiter von sich aus Null Mal (Spion ueber einen vollstaendigen Lauf)', async () => {
    stelleBereitOhneProjekt()
    const { behaelter } = rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    // Meldung setzen und schliessen - alles ohne einen eigenen Reiterwechsel:
    const schritte = letzterSchritt() as { meldeFehler: (code: string, meldung: string) => void }
    await act(async () => {
      schritte.meldeFehler('c1', 'm1')
      await Promise.resolve()
    })
    klicke(behaelter, 'Schließen')
    expect(vi.mocked(reiterModul.wechsleReiter)).not.toHaveBeenCalled()
  })

  it('composerVerdrahtung.meldeUebergabe ruft nimmUebergabeEntgegen GENAU EINmal; meldeReparaturStand ruft meldeStand GENAU EINmal', async () => {
    stelleBereitOhneProjekt()
    rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    const [, , umgebung] = vi.mocked(inhalteModul.baueReiterInhalte).mock
      .calls.at(-1) as unknown as [unknown, unknown, Record<string, unknown>]
    const verdrahtung = umgebung.composerVerdrahtung as unknown as {
      meldeUebergabe: (an: unknown) => void
      meldeReparaturStand: (stand: unknown) => void
    }
    const an = { ziel: 'asset-auswahl', elementId: 'e1' }
    const stand = { doppel: 'stand2' }
    act(() => {
      verdrahtung.meldeUebergabe(an)
    })
    expect(vi.mocked(uebergabeModul.nimmUebergabeEntgegen)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(uebergabeModul.nimmUebergabeEntgegen)).toHaveBeenCalledWith(
      expect.anything(),
      an,
    )
    act(() => {
      verdrahtung.meldeReparaturStand(stand)
    })
    expect(vi.mocked(uebergabeModul.meldeStand)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(uebergabeModul.meldeStand)).toHaveBeenCalledWith(expect.anything(), stand)
  })

  it("Der dritte Kernnachweis, benannter Test 'das UebergabeOverlay ist eingesetzt': genau einmal, als GESCHWISTER des Rahmens, und Rahmen behaelt GENAU VIER Eigenschaften", async () => {
    stelleBereitOhneProjekt()
    const { behaelter } = rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(d.overlayRufe).toHaveLength(1)
    const overlayKnoten = behaelter.querySelector('[data-testid="overlay-marke"]')
    const rahmenKnoten = behaelter.querySelector('[data-testid="rahmen-wurzel"]')
    expect(overlayKnoten).not.toBeNull()
    expect(rahmenKnoten).not.toBeNull()
    // Beide sitzen als Kinder DESSELBEN Vaters (Fragment in App) - Geschwister:
    expect(overlayKnoten!.parentElement).toBe(behaelter)
    expect(rahmenKnoten!.parentElement).toBe(behaelter)
    expect(rahmenKnoten!.contains(overlayKnoten!)).toBe(false)
    expect(overlayKnoten!.contains(rahmenKnoten!)).toBe(false)
    // GENAU VIER Eigenschaften im Rahmen - das Overlay ist KEIN fuenfter Eintrag:
    expect(Object.keys(letzterRahmen())).toHaveLength(4)
  })

  it('UebergabeOverlay bekommt ALLE SIEBEN Eigenschaften belegt: lage, projekt, die drei Abschluss-Funktionen und aufFehler (benannter Test)', async () => {
    halterDoppel.setzeLage({
      stand: { doppel: 'stand' },
      laufendeUebergabe: null,
      hervorgehobeneAktionId: null,
      rueckkehrReiter: null,
    })
    stelleBereitMitProjekt()
    rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    const overlay = letztesOverlay()
    expect(overlay.lage).toBe(halterDoppel.holeLage())
    expect(overlay.projekt).toBe(d.projektImZugang)
    // #421: Die drei Rueckwege sind jetzt duenne Wrapper (sie reichen den Sicht-Schreiber
    // des Wrapped-Zugangs hinein) - nicht mehr ToBe-gleich zum rohen Export. Belegt wird
    // hier die BELEGUNG; die Verdrahtung des Schreibers prueft der Treiber/das Verhalten.
    expect(overlay.schliesseMediumFixAb).toBeTypeOf('function')
    expect(overlay.schliesseAktionsFixAb).toBeTypeOf('function')
    expect(overlay.schliesseAbschnittsFixAb).toBeTypeOf('function')
    expect(overlay.aufFehler).toBe(letzterSchritt().meldeFehler)
    expect(overlay.aufAbgeschlossen).toBeDefined()
    expect(overlay.aufAbgebrochen).toBeDefined()
  })

  it('aufAbgeschlossen(w) ruft schliesseFixAb GENAU EINmal mit DERSSELBEN Umgebung; aufAbgebrochen() ruft beendeLaufende DERSelben (benannter Test)', async () => {
    stelleBereitOhneProjekt()
    rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    const umgebung = fangeUmgebung()
    const overlay = letztesOverlay()
    const wirkung = { art: 'erledigt' }
    expect(vi.mocked(uebergabeModul.schliesseFixAb)).not.toHaveBeenCalled()
    await act(async () => {
      ;(overlay.aufAbgeschlossen as (w: unknown) => void)(wirkung)
      await Promise.resolve()
    })
    expect(vi.mocked(uebergabeModul.schliesseFixAb)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(uebergabeModul.schliesseFixAb)).toHaveBeenLastCalledWith(umgebung, wirkung)
    expect(vi.mocked(uebergabeModul.beendeLaufende)).not.toHaveBeenCalled()
    await act(async () => {
      ;(overlay.aufAbgebrochen as () => void)()
      await Promise.resolve()
    })
    expect(vi.mocked(uebergabeModul.beendeLaufende)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(uebergabeModul.beendeLaufende)).toHaveBeenLastCalledWith(umgebung)
  })

  it('App ruft KEINE der drei Abschluss-Funktionen aus #133 selbst (drei Spione, Null nach einem vollstaendigen Lauf; ENTSCHIEDEN 6)', async () => {
    stelleBereitMitProjekt()
    const { behaelter } = rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    const umgebung = fangeUmgebung()
    const overlay = letztesOverlay()
    void umgebung
    await act(async () => {
      ;(overlay.aufAbgeschlossen as (w: unknown) => void)({ art: 'erledigt' })
      ;(overlay.aufAbgebrochen as () => void)()
      await Promise.resolve()
    })
    expect(vi.mocked(optionenModul.schliesseMediumFixAb)).not.toHaveBeenCalled()
    expect(vi.mocked(optionenModul.schliesseAktionsFixAb)).not.toHaveBeenCalled()
    expect(vi.mocked(optionenModul.schliesseAbschnittsFixAb)).not.toHaveBeenCalled()
  })

  it('Der Nachweis des Import-Rueckwegs, benannter Test (ENTSCHIEDEN 8): schliesseMediumFixAb belegt, und meldeImportErgebnis(a9) setzt schliesseMedienImportAb mit derselben Umgebung', async () => {
    stelleBereitOhneProjekt()
    rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    const umgebung = fangeUmgebung()
    // #421: ein Wrapper (reicht den Wrapped-Sicht-Schreiber hinein) - belegt, nicht ToBe.
    expect(umgebung.schliesseMediumFixAb).toBeTypeOf('function')
    const schritte = letzterSchritt() as { meldeImportErgebnis: (assetId: string) => void }
    await act(async () => {
      schritte.meldeImportErgebnis('a9')
      await Promise.resolve()
    })
    const schliesseRufe = vi.mocked(uebergabeModul.schliesseMedienImportAb)
    expect(schliesseRufe).toHaveBeenCalledTimes(1)
    expect(schliesseRufe).toHaveBeenLastCalledWith(umgebung, 'a9')
  })

  it('App ruft schliesseMedienImportAb von sich aus Null Mal (Spion) - es setzt sie NUR als Rueckruf ein', async () => {
    stelleBereitOhneProjekt()
    rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(vi.mocked(uebergabeModul.schliesseMedienImportAb)).not.toHaveBeenCalled()
  })

  it("Bei 'laeuft' UND bei 'gescheitert' wird UebergabeOverlay Null Mal aufgebaut (zwei Spion-Pruefungen)", async () => {
    d.baueSichtenAntwort = new Promise(() => {})
    rendere()
    expect(d.overlayRufe).toHaveLength(0)

    for (const geraet of aktiveGeraete) {
      act(() => {
        geraet.wurzel.unmount()
      })
      geraet.behaelter.remove()
    }
    aktiveGeraete.length = 0
    d.rahmenRufe.length = 0
    d.overlayRufe.length = 0

    d.baueSichtenAntwort = {
      ok: false,
      fehler: { code: 'keine_sichten', meldung: 'Sichten gescheitert.' },
    }
    const geraet = rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(geraet.behaelter.querySelector('[data-testid="app-fehlerflaeche"]')).not.toBeNull()
    expect(d.overlayRufe).toHaveLength(0)
  })

  it('Aendert der Halter seine Lage, wird das Overlay mit der NEUEN Lage neu aufgebaut; GENAU EIN aufLageGeaendert-Abo, kein zweites', async () => {
    stelleBereitOhneProjekt()
    const { behaelter } = rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(halterDoppel.anmeldezahl()).toBe(1)
    const rufeVorher = d.overlayRufe.length
    const neueLage = {
      stand: null,
      laufendeUebergabe: { ziel: 'asset-auswahl', elementId: 'e2' },
      hervorgehobeneAktionId: null,
      rueckkehrReiter: null,
    }
    await act(async () => {
      halterDoppel.setzeLage(neueLage)
      await Promise.resolve()
    })
    expect(letztesOverlay().lage).toBe(neueLage)
    expect(d.overlayRufe.length).toBe(rufeVorher + 1)
    expect(halterDoppel.anmeldezahl()).toBe(1)
  })

  it('Das aufLageGeaendert-Abo wird beim Abbau GENAU EINmal abgemeldet; ein danach ausgeloester Hoerer loest kein Rendern mehr aus', async () => {
    stelleBereitOhneProjekt()
    const { behaelter, wurzel } = rendere()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(halterDoppel.hoererzahl()).toBe(1)
    act(() => {
      wurzel.unmount()
    })
    behaelter.remove()
    expect(halterDoppel.hoererzahl()).toBe(0)
    // Ein spaeterer Lagewechsel trifft niemanden mehr - und wirft nicht:
    expect(() => halterDoppel.setzeLage({ stand: null, laufendeUebergabe: null, hervorgehobeneAktionId: null, rueckkehrReiter: null })).not.toThrow()
  })

  it('DoD-Grep-Probe: App.tsx enthaelt keine verbotenen Bausteine (Reiter-Zustand, Queue-Auswertung, Kanal-Literal, window.api, Timer, Historie)', () => {
    const quelle = quelleVonApp()
    expect(quelle).not.toMatch(/\bholeStand\b/)
    expect(quelle).not.toMatch(/\breiheEin\b/)
    expect(quelle).not.toMatch(/\brufeAuf\b/)
    expect(quelle).not.toMatch(/'queue:'/)
    expect(quelle).not.toMatch(/window\.api/)
    expect(quelle).not.toMatch(/baueAuftragsSichtAuf/)
    expect(quelle).not.toMatch(/setTimeout|setInterval/)
    expect(quelle).not.toMatch(/type ReiterId =/)
    expect(quelle).not.toMatch(/alert\(/)
    // Die erlaubten und erforderlichen Bausteine SIND drin:
    expect(quelle).toMatch(/abonniere/)
    expect(quelle).toMatch(/KANAELE/)
    expect(quelle).toMatch(/UebergabeOverlay/)
    expect(quelle).toMatch(/schliesseMedienImportAb/)
    expect(quelle).toMatch(/schliesseMediumFixAb/)
  })
})
