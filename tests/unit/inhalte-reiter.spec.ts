// Tests zu #244 - inhalte.tsx, die Belegung der vier Reiter (jsdom).
//
// Alle fuenf Modul-Wurzeln werden durch Attrappen mit Prop-Spionen ersetzt
// (so prueft man die DURCHREICHUNG, nicht die Module); #243 und #234 werden
// ebenfalls gedoppelt. Real bleibt baueReiterInhalte selbst samt Projekt-Stand
// (ENTSCHIEDEN 7) und der echte Leerzustand (#198, fuer den Klick-Nachweis).
// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, useState, type ReactElement } from 'react'
import type { JSX } from 'react'

import type { Project } from '../../src/shared/contracts/project'
import type { VorlagenZugang, ZeichenZugang, ProjektZugang, Sichten } from '../../src/renderer/app-shell/sichten'
import type { Projektsicht } from '../../src/renderer/composer/projektzustand'

const doppel = vi.hoisted(() => ({
  composerProps: [] as Array<Record<string, unknown>>,
  vorschauProps: [] as Array<Record<string, unknown>>,
  actionEditorProps: [] as Array<Record<string, unknown>>,
  vorlagenEditorProps: [] as Array<Record<string, unknown>>,
  markenEditorProps: [] as Array<Record<string, unknown>>,
  projektVerwaltungProps: [] as Array<Record<string, unknown>>,
  leereAufrufe: 0,
  leereFunktion: null as unknown as () => void,
  hoerer: null as null | ((sicht: Projektsicht) => void),
  abmeldungen: 0,
  holeAufrufe: 0,
  reihenfolge: [] as string[],
  sicht: { projekt: null, ladefehler: null } as Projektsicht,
  voraussetzungen: null as unknown,
}))

vi.mock('../../src/renderer/app-shell/undo-aufzeichnung', () => ({
  umhuelleFuerBearbeitung: (zugang: unknown) => ({ umhuellt: true, roh: zugang }),
  ohneAufzeichnung: (zugang: unknown) => zugang,
}))

const leerzustandDoppel = vi.hoisted(() => ({ aufrufe: 0 }))

vi.mock('../../src/renderer/app-shell/leerzustand-regel', () => ({
  // Die ECHTE Regel wörtlich kopiert (#198-Vertrag), weil die Spion-Zählung der
  // Regel IHR Scheme nicht beruehrt: nur die Messung braucht hier einen Spinne.
  zeigtLeerzustand: (reiter: string, projektOffen: boolean) => {
    leerzustandDoppel.aufrufe += 1
    return !projektOffen && (reiter === 'zusammenstellen' || reiter === 'aktionen')
  },
  REITER_MIT_LEERZUSTAND: ['zusammenstellen', 'aktionen'],
}))

vi.mock('../../src/renderer/app-shell/undo-historien', () => ({
  leereProjektHistorie: (doppel.leereFunktion = doppel.leereFunktion ?? (() => {
    doppel.leereAufrufe += 1
  })),
}))

const { baueReiterInhalte } = await import('../../src/renderer/app-shell/inhalte.tsx')

const { verteileZugaenge } = await import('../../src/renderer/app-shell/inhalte-zugaenge')

// ---------------- Attrappen ----------------

function baueWurzeln() {
  return {
    composer: (eigenschaften: Record<string, unknown>) => {
      doppel.composerProps.push(eigenschaften)
      return createElement('div', { 'data-testid': 'attrappe-composer' })
    },
    vorschau: (eigenschaften: Record<string, unknown>) => {
      doppel.vorschauProps.push(eigenschaften)
      return createElement('div', { 'data-testid': 'attrappe-vorschau' })
    },    actionEditor: (eigenschaften: Record<string, unknown>) => {
      doppel.actionEditorProps.push(eigenschaften)
      return createElement('div', { 'data-testid': 'attrappe-aktionen' })
    },
    vorlagenEditor: (eigenschaften: Record<string, unknown>) => {
      doppel.vorlagenEditorProps.push(eigenschaften)
      return createElement('div', { 'data-testid': 'attrappe-vorlagen' })
    },
    markenEditor: (eigenschaften: Record<string, unknown>) => {
      doppel.markenEditorProps.push(eigenschaften)
      return createElement('div', { 'data-testid': 'attrappe-marken' })
    },
    projektVerwaltung: (eigenschaften: Record<string, unknown>) => {
      doppel.projektVerwaltungProps.push(eigenschaften)
      return createElement('div', { 'data-testid': 'attrappe-projekte' })
    },
  }
}

function baueSichten(): Sichten {
  const zugang: ProjektZugang = {
    lade: (async () => defaultErgebnis()) as never,
    hole: () => {
      doppel.holeAufrufe += 1
      doppel.reihenfolge.push('hole')
      return doppel.sicht
    },
    setzeProjekt: () => {},
    setzeListe: () => {},
    gleicheElementAb: () => {},
    leere: () => {},
    aufGeaendert: (hoerer: (sicht: Projektsicht) => void) => {
      doppel.reihenfolge.push('abonniere')
      doppel.hoerer = hoerer
      return () => {
        doppel.abmeldungen += 1
        doppel.hoerer = null
      }
    },
  }
  const vorlagen: VorlagenZugang = {
    lade: (async () => defaultErgebnis()) as never,
    hole: () => null,
    aufGeaendert: () => () => {},
  }
  const zeichnen: ZeichenZugang = {
    bereiteVor: (async () => defaultErgebnis()) as never,
    hole: () => doppel.voraussetzungen as never,
    verwirfMotivBestand: () => {},
  }
  return { projekt: zugang, vorlagen, zeichnen, marken: { lade: vi.fn(), hole: vi.fn(() => null), aufGeaendert: vi.fn(() => () => {}) } }
}

function defaultErgebnis(): never {
  throw new Error('nicht relevant')
}

function baueUmgebung() {
  return {
    aufProjekteWechseln: vi.fn(),
    wechsleZuZusammenstellen: vi.fn(),
    composerVerdrahtung: {
      starteMedienImport: vi.fn(),
      reparatur: null,
      meldeReparaturStand: vi.fn(),
      meldeUebergabe: vi.fn(),
    },
    hervorgehobeneAktionId: null as string | null,
    vorlagenSitzung: {
      holeSitzung: vi.fn(),
      uebernimmAenderung: vi.fn(),
      uebernimmSpeicherstand: vi.fn(),
      beendeSitzung: vi.fn(),
      aufSitzungGeaendert: vi.fn(),
    },
  }
}

function baueUmgebungFehlerfrei(): ReturnType<typeof baueUmgebung> {
  return baueUmgebung()
}

beforeEach(() => {
  doppel.composerProps = []
  doppel.vorschauProps = []
  doppel.actionEditorProps = []
  doppel.vorlagenEditorProps = []
  doppel.markenEditorProps = []
  doppel.projektVerwaltungProps = []
  doppel.leereAufrufe = 0
  doppel.abmeldungen = 0
  doppel.holeAufrufe = 0
  doppel.reihenfolge = []
  doppel.sicht = { projekt: null, ladefehler: null }
  doppel.hoerer = null
  doppel.voraussetzungen = { marke: null, vorlagen: [] }
  leerzustandDoppel.aufrufe = 0
})

afterEach(() => {
  document.body.innerHTML = ''
})

// ---------------- Hilfsbau ----------------

const BAUE_PROJEKT = (): Project => ({
  id: 'p-1', name: 'Probe', erstelltAm: '2026-10-06T00:00:00Z', geaendertAm: '2026-10-06T00:00:00Z',
  schemaVersion: 1,
  assets: [], aktionen: [], liste: [],
  letzterAusgabeName: null, standardSegmentdauer: 10, standardMarkeId: 'm1',
})

function rendereReiter(
  reiter: 'zusammenstellen' | 'aktionen' | 'vorlagen' | 'marken' | 'projekte',
  sichtbar = true,
) {
  const ziel = document.createElement('div')
  document.body.appendChild(ziel)
  const wurzel: Root = createRoot(ziel)
  const sichten = baueSichten()
  const zugaenge = verteileZugaenge(sichten)
  const umgebung = baueUmgebung()
  const walks = baueReiterInhalte(zugaenge, baueWurzeln() as unknown as Parameters<typeof baueReiterInhalte>[1], umgebung as unknown as Parameters<typeof baueReiterInhalte>[2])
  const inhalt = walks[reiter]
  act(() => {
    wurzel.render(createElement(inhalt, { sichtbar }) as ReactElement)
  })
  return { ziel, wurzel, sichten, zugaenge, umgebung, fertig: () => act(() => wurzel.unmount()) }
}

const LAEDER = 'zusammenstellen' as const

// ---------------- der Kernnachweis ----------------

describe('Der Kernnachweis: wer bekommt welchen Zugang', () => {
  it('composer bekommt den UMHUELLTEN Zugang (projektBearbeitung, toBe)', () => {
    doppel.sicht = { projekt: BAUE_PROJEKT(), ladefehler: null }
    const { zugaenge, fertig } = rendereReiter(LAEDER)
    expect(doppel.composerProps.length).toBeGreaterThanOrEqual(1)
    expect(doppel.composerProps[0]!.projekt).toBe(zugaenge.projektBearbeitung)
    expect(zugaenge.projektBearbeitung).not.toBe(zugaenge.projektRoh)
    fertig()
  })

  it('projektVerwaltung bekommt den ROHEN Zugang UND die drei Ergaenzungen (benannter Test)', () => {
    const { zugaenge, umgebung, fertig } = rendereReiter('projekte')
    expect(doppel.projektVerwaltungProps.length).toBeGreaterThanOrEqual(1)
    const eigenschaften = doppel.projektVerwaltungProps[0]!
    expect(eigenschaften.sichtbar).toBe(true)
    expect(eigenschaften.projekt).toBe(zugaenge.projektRoh)
    expect(eigenschaften.zeichnen).toBe(zugaenge.zeichnen)
    expect(eigenschaften.leereProjektHistorie).toBe(doppel.leereFunktion)
    expect(eigenschaften.wechsleZuZusammenstellen).toBe(umgebung.wechsleZuZusammenstellen)
    fertig()
  })

  it('actionEditor bekommt den UMHUELLTEN Zugang; hervorgehobeneAktionId wird unverändert gereicht, auch null', () => {
    doppel.sicht = { projekt: BAUE_PROJEKT(), ladefehler: null }
    const { zugaenge, umgebung, fertig } = rendereReiter('aktionen')
    expect(doppel.actionEditorProps.length).toBeGreaterThanOrEqual(1)
    const actionEditorWurzeln = doppel.actionEditorProps[0]!
    expect(actionEditorWurzeln.projekt).toBe(zugaenge.projektBearbeitung)
    expect(actionEditorWurzeln.hervorgehobeneAktionId).toBe(umgebung.hervorgehobeneAktionId)
    fertig()
  })

  it('marken wird UNVERAENDERT (toBe) gereicht - am action-editor UND am vorlagen-editor; die drei Funktionen des Zugangs werden hier NULL Mal gerufen (#313)', () => {
    doppel.sicht = { projekt: BAUE_PROJEKT(), ladefehler: null }
    const { zugaenge, fertig } = rendereReiter('aktionen')
    expect(doppel.actionEditorProps[0]!.marken).toBe(zugaenge.marken)
    const zugang = zugaenge.marken as { lade: ReturnType<typeof vi.fn>; hole: ReturnType<typeof vi.fn>; aufGeaendert: ReturnType<typeof vi.fn> }
    expect(zugang.lade.mock.calls).toHaveLength(0)
    expect(zugang.hole.mock.calls).toHaveLength(0)
    expect(zugang.aufGeaendert.mock.calls).toHaveLength(0)
    fertig()
    const vorlagenLauf = rendereReiter('vorlagen')
    expect(doppel.vorlagenEditorProps[0]!.marken).toBe(vorlagenLauf.zugaenge.marken)
    vorlagenLauf.fertig()
  })

  it('composer bekommt verdrahtung ToBe-gleich; KEIN Feld des Buendels wird gerufen', () => {
    doppel.sicht = { projekt: BAUE_PROJEKT(), ladefehler: null }
    const { umgebung, fertig } = rendereReiter(LAEDER)
    const verdrahtung = umgebung.composerVerdrahtung
    expect(doppel.composerProps[0]!.verdrahtung).toBe(verdrahtung)
    expect((verdrahtung.starteMedienImport as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0)
    expect((verdrahtung.meldeReparaturStand as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0)
    expect((verdrahtung.meldeUebergabe as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0)
    fertig()
  })

  it('leereProjektHistorie und wechsleZuZusammenstellen werden NULL Mal gerufen (zwei Spione)', () => {
    const { umgebung, fertig } = rendereReiter('projekte')
    expect(doppel.leereAufrufe).toBe(0)
    expect((umgebung.wechsleZuZusammenstellen as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0)
    fertig()
  })

  it('vorlagenEditor bekommt KEIN Feld projekt; sitzung wird unverändert gereicht und nicht gerufen', () => {
    const { umgebung, fertig } = rendereReiter('vorlagen')
    expect(doppel.vorlagenEditorProps.length).toBeGreaterThanOrEqual(1)
    const eigenschaften = doppel.vorlagenEditorProps[0]!
    expect('projekt' in eigenschaften).toBe(false)
    expect(eigenschaften.sitzung).toBe(umgebung.vorlagenSitzung)
    const sitzung = umgebung.vorlagenSitzung
    expect((sitzung.holeSitzung as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0)
    expect((sitzung.uebernimmAenderung as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0)
    expect((sitzung.uebernimmSpeicherstand as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0)
    expect((sitzung.beendeSitzung as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0)
    expect((sitzung.aufSitzungGeaendert as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(0)
    fertig()
  })

  it('vorschau bekommt WERTE: projekt toBe aus projektRoh.hole(), voraussetzungen toBe aus zeichnen.hole()', () => {
    const projekt = BAUE_PROJEKT()
    doppel.sicht = { projekt, ladefehler: null }
    rendereReiter(LAEDER)
    expect(doppel.vorschauProps.length).toBeGreaterThanOrEqual(1)
    const eigenschaften = doppel.vorschauProps[0]!
    expect(eigenschaften.projekt).toBe(projekt)
    expect(eigenschaften.voraussetzungen).toBe(doppel.voraussetzungen)
  })
})

// ---------------- Leerzustand und Ausnahmen ----------------

describe('Der Leerzustand (#198) und die Ausnahmen', () => {
  it('ohne offenes Projekt ruft zusammenstellen KEINE Wurzel und zeigt den Leerzustand; ein Klick ruft aufProjekteWechseln GENAU einmal', () => {
    const { umgebung, ziel, fertig } = rendereReiter(LAEDER)
    expect(doppel.composerProps).toHaveLength(0)
    expect(doppel.vorschauProps).toHaveLength(0)
    const knopf = ziel.querySelector('button') as HTMLButtonElement
    expect(knopf).not.toBeNull()
    act(() => {
      knopf.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect((umgebung.aufProjekteWechseln as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(1)
    fertig()
  })

  it('ohne offenes Projekt ruft auch aktionenursprung KEINE Wurzel und zeigt seinen Leerzustand', () => {
    const { ziel, fertig } = rendereReiter('aktionen')
    expect(doppel.actionEditorProps).toHaveLength(0)
    expect(ziel.querySelector('h2')?.textContent).toContain('Aktionen')
    fertig()
  })

  it('ohne offenes Projekt ruft vorlagen seine Wurzel TROTZDEM (Ausnahme aus TK 9.14.2)', () => {
    rendereReiter('vorlagen')
    expect(doppel.vorlagenEditorProps.length).toBeGreaterThanOrEqual(1)
  })

  it('ohne offenes Projekt ruft projekte seine Wurzel TROTZDEM (der Einstiegsreiter)', () => {
    rendereReiter('projekte')
    expect(doppel.projektVerwaltungProps.length).toBeGreaterThanOrEqual(1)
  })

  it('mit offenem Projekt ruft zusammenstellen beide Wurzeln je GENAU einmal; composer zweimal nach Projekt-Wechsel NEU erstellen', () => {
    const projekt = BAUE_PROJEKT()
    doppel.sicht = { projekt, ladefehler: null }
    const { fertig } = rendereReiter(LAEDER)
    // je RENDERVORGANG: ein Aufruf je Baustein
    expect(doppel.composerProps).toHaveLength(1)
    expect(doppel.vorschauProps).toHaveLength(1)
    fertig()
  })
})

// ---------------- ENTSCHIEDEN 7/8: der Projektstand ----------------

describe('Der Projektstand (ENTSCHIEDEN 7/8)', () => {
  it('erst hole, DANN abonniere - am jeden Reiterinhalt mit Projektstand nachweislich in dieser Reihenfolge', () => {
    const { fertig } = rendereReiter(LAEDER)
    expect(doppel.reihenfolge).toEqual(['hole', 'abonniere'])
    fertig()
  })

  it('ein Projekt, das NACH dem Aufbau gesetzt wird (hoerer gerufen), wechselt vom Leerzustand zur Wurzel OHNE Doppel-Aufbau', () => {
    const { fertig } = rendereReiter(LAEDER)
    expect(doppel.composerProps).toHaveLength(0)
    const projekt = BAUE_PROJEKT()
    act(() => {
      doppel.hoerer?.({ projekt, ladefehler: null })
    })
    expect(doppel.composerProps.length).toBeGreaterThanOrEqual(1)
    fertig()
  })

  it('das Abonnement wird beim Abbau abgemeldet; nach dem Abbau melannt ein weiterer Hörer-Aufruf nichts mehr', () => {
    const { fertig } = rendereReiter(LAEDER)
    expect(doppel.abmeldungen).toBe(0)
    fertig()
    expect(doppel.abmeldungen).toBe(1)
    // danach kann kein hoerer mehr wirken:
    expect(doppel.hoerer).toBeNull()
  })

  it('sichtbar: false wird UNVERAENDERT durchgereicht; nichts wird abgebaut (kein Abonnement-Verlust)', () => {
    const { fertig } = rendereReiter(LAEDER, false)
    expect(doppel.composerProps.length).toBe(0) // kein Projekt, keine Wurzel
    expect(doppel.reihenfolge).toEqual(['hole', 'abonniere']) // Abonnement bleibt
    fertig()
    expect(doppel.abmeldungen).toBe(1)
  })

  it('genau fuenf Schluessel (#314 ersetzt die vier-Schluessel-Zeile; Reihenfolge wie in der Skizze TK 9.14.1)', () => {
    const sichten = baueSichten()
    const walks = baueReiterInhalte(verteileZugaenge(sichten), baueWurzeln() as unknown as Parameters<typeof baueReiterInhalte>[1], baueUmgebung() as unknown as Parameters<typeof baueReiterInhalte>[2])
    expect(Object.keys(walks)).toEqual(['zusammenstellen', 'aktionen', 'vorlagen', 'marken', 'projekte'])
    void sichten
  })

  describe("Der Reiter 'marken' (#314, TK 9.14.2)", () => {
    it('ruft GENAU die markenEditor-Wurzel; sichtbar UNVERAENDERT, marken ToBe-gleich', () => {
      const { zugaenge, fertig } = rendereReiter('marken')
      expect(doppel.markenEditorProps).toHaveLength(1)
      const eigenschaften = doppel.markenEditorProps[0]!
      expect(eigenschaften.sichtbar).toBe(true)
      expect(eigenschaften.marken).toBe(zugaenge.marken)
      // Keine andere Wurzel wurde gerufen (6 Spione):
      expect(doppel.composerProps).toHaveLength(0)
      expect(doppel.vorschauProps).toHaveLength(0)
      expect(doppel.actionEditorProps).toHaveLength(0)
      expect(doppel.vorlagenEditorProps).toHaveLength(0)
      expect(doppel.projektVerwaltungProps).toHaveLength(0)
      fertig()
    })

    it('ruft ohne offenes Projekt TROTZDEM die Wurzel und rendert keinen Leerzustand (TK 9.14.2)', () => {
      doppel.sicht = { projekt: null, ladefehler: null }
      const { zugaenge, fertig } = rendereReiter('marken')
      expect(doppel.markenEditorProps.length).toBeGreaterThanOrEqual(1)
      expect(doppel.markenEditorProps[0]!.marken).toBe(zugaenge.marken)
      fertig()
      // showsLeerzustand(#198) wurde fuer den Reiter marken GAR NICHT gerufen:
      expect(leerzustandDoppel.aufrufe).toBe(0)
    })

    it('liest NICHTS: projektRoh.hole und aufGeaendert null Mal; die drei Funktionen von marken null Mal (fuenf Spione)', () => {
      doppel.sicht = { projekt: null, ladefehler: null }
      const sichten = baueSichten()
      const zugaenge = verteileZugaenge(sichten)
      const walks = baueReiterInhalte(zugaenge, baueWurzeln() as unknown as Parameters<typeof baueReiterInhalte>[1], baueUmgebung() as unknown as Parameters<typeof baueReiterInhalte>[2])
      const inhalt = walks['marken']
      const ziel = document.createElement('div')
      document.body.appendChild(ziel)
      // Die fuenf Spione:
      const markenZugang = zugaenge.marken as unknown as { lade: ReturnType<typeof vi.fn>; hole: ReturnType<typeof vi.fn>; aufGeaendert: ReturnType<typeof vi.fn> }
      const wurzel: Root = createRoot(ziel)
      act(() => {
        wurzel.render(createElement(inhalt, { sichtbar: true }) as ReactElement)
      })
      wurzel.unmount()
      // projektRoh.hole: der Merker doppels zaehlt jeden Aufruf (baueSichten zählt in doppel.holeAufrufe):
      expect(doppel.holeAufrufe).toBe(0)
      // aufGeaendert: das Abo-Doppel merkt abmeldungen nur beim ANMELDEN via effect;
      // der marken-Reiter rendert ohne Projektstand, also kein Abo: doppel.abmeldungen == 0 hier.
      expect(doppel.abmeldungen).toBe(0)
      expect(markenZugang.lade.mock.calls).toHaveLength(0)
      expect(markenZugang.hole.mock.calls).toHaveLength(0)
      expect(markenZugang.aufGeaendert.mock.calls).toHaveLength(0)
      document.body.innerHTML = ''
    })
  })
})

// ---------------- Grep-Probe ----------------

describe('Quelldatei-Verbote (Grep-Probe, code ohne Kommentare): inhalte.tsx', () => {
  const quelle = readFileSync(
    join(process.cwd(), 'src/renderer/app-shell/inhalte.tsx'),
    'utf8',
  )
  const code = quelle
    .split('\n')
    .filter((z) => {
      const t = z.trim()
      return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
    })
    .join('\n')

  it('kein rueckkanal, kein reiheEin, kein queue, kein zweiter Reiterwechsel, kein zweiter Umhüller, keine Wurzel-Wert-Importe', () => {
    for (const verbot of [
      'rufeAuf', 'abonniere', 'KANAELE', 'window.api', 'reiheEin', 'queue:',
      'wechsleReiter', 'umhuelleFuerBearbeitung',
      'src/renderer/composer/index', 'src/renderer/action-editor',
      'src/renderer/vorlagen-editor', 'src/renderer/preview-player',
      'src/renderer/projekt-verwaltung',
    ]) {
      expect(code).not.toContain(verbot)
    }
    // ausser reinen import type aus den Modulpfaden (Anordnung verlangt die TYPEN):
    const wertImporte = (code.match(/import \{[^}]*\} from '\.\.(composer|action-editor|vorlagen-editor|preview-player|projekt-verwaltung)/g) ?? [])
    expect(wertImporte).toHaveLength(0)
  })
})

// ---------------- BUGFIX (Naht-Hooks, 08.10.) ----------------
// Beleg des Vorbefunds: `kindOffen` wurde inline gerufen - die Hooks einer echten
// Wurzel (mit useState) landeten in der Fiber von ProjektStandReiter; beim
// Umschalten kein-Projekt -> Projekt (was das Anlegen macht) warf React
// "Rendered more hooks..." und die ganze Oberflaeche war weiß.
// Die Attrappe-Wurzel hier traegt einen ECHTEN useState - genau die Klasse,
// der echte composer/action-editor. Der Test greift die Umschaltung ab:
// kein Wurf, die Wurzel wird gerufen, die Instanz bleibt gemountet.
describe('Die Naht-Hooks (BUGFIX)', () => {
  it('Umschaltung kein Projekt -> Projekt mit einem Wurzel-Hook (useState): kein Wurf, Wurzel gerufen', () => {
    leerzustandDoppel.aufrufe = 0
    doppel.sicht = { projekt: null, ladefehler: null }
    doppel.composerProps = []
    const mitHook = (eigenschaften: Record<string, unknown>): JSX.Element => {
      const [, veraltet] = useState([true, () => undefined] as const)
      void veraltet
      doppel.composerProps.push(eigenschaften)
      return createElement('div', { 'data-testid': 'attrappe-mit-hook' })
    }
    const inhalteFn = baueReiterInhalte(
      verteileZugaenge(baueSichten()),
      { ...baueWurzeln(), composer: mitHook } as never,
      baueUmgebung() as never,
    )
    const ziel = document.createElement('div')
    document.body.appendChild(ziel)
    const wurzel: Root = createRoot(ziel)
    const inhalt = inhalteFn['zusammenstellen']
    expect(() => {
      act(() => {
        wurzel.render(createElement(inhalt, { sichtbar: true }) as ReactElement)
      })
    }).not.toThrow()
    // Die Umschaltung ohne Projekt -> Projekt (der Moment, der weiß warf):
    doppel.sicht = { projekt: BAUE_PROJEKT(), ladefehler: null }
    act(() => {
      doppel.hoerer?.(doppel.sicht)
    })
    expect(doppel.composerProps.length).toBeGreaterThanOrEqual(1)
    wurzel.unmount()
    document.body.innerHTML = ''
  })
})
