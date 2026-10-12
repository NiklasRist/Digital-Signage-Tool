// Verhaltenstests zu #342 - composer/index.tsx: die zwei Dialoge (#231/#232)
// sind eingehaengt und werden gerufen (jsdom).
//
// Geprueft wird NUR src/renderer/composer/index.tsx (+ diese Testdatei). Die
// Fachlichkeit in composer-montage.ts, render-dialog.ts/.tsx, export-dialog.ts/.tsx
// und ausgabe-liste.ts/.tsx laeuft ECHT; doppelt sind nur die schweren Ansichten
// (Wiedergabeliste, ElementBedienung, AssetGalerie), der IPC-Ruf und #134.
//
// Nachgewiesen werden die Kernbefunde von #342:
//   - „Rendern..." oeffnet das Render-Overlay; der Name ist FA-22-gemaess
//     vorbelegt (projekt.letzterAusgabeName, kein Ersatzname).
//   - Der Ausloeser ruft loeseRenderAus (#134) GENAU EINmal UEBER #231 -
//     die Wurzel ruft #134 selbst NICHT.
//   - Kaputte Stellen sperren den Render-Knopf (Freigabe aus #132).
//   - „Exportieren" an der Ausgabe-Liste (#230) oeffnet das Export-Overlay;
//     der Ausloeser ruft loeseExportAus (#134) GENAU EINmal UEBER #232.
//   - Abbrechen schliesst das Overlay, ohne #134 zu rufen.
// @vitest-environment jsdom
import { createElement, act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'

import type { Project } from '../../src/shared/contracts/project'

// ----------------------------------------------------------------------------
// Doppel (hoisted - die Factories laufen beim Modul-Import)
// ----------------------------------------------------------------------------

const d = vi.hoisted(() => ({
  renderAusRufe: [] as Array<Record<string, unknown>>,
  exportAusRufe: [] as Array<Record<string, unknown>>,
  rufeAufRufe: [] as string[],
  antwortFuerExportZiel: 'E:/Stick' as string | null,
  meldeReparaturStand: vi.fn(),
  meldeUebergabe: vi.fn(),
  bestandsDatei: {
    dateiname: 'sommer.mp4',
    dateigroesse: 1234,
    geaendertAm: '2026-10-09T12:00:00Z',
  },
}))

vi.mock('../../src/renderer/composer/liste-ansicht.tsx', () => ({
  Wiedergabeliste: () => createElement('div', { 'data-testid': 'wiedergabeliste-doppel' }),
}))
vi.mock('../../src/renderer/composer/element-zeile.tsx', () => ({
  ElementBedienung: () => createElement('div', { 'data-testid': 'element-bedienung-doppel' }),
}))
vi.mock('../../src/renderer/composer/asset-galerie', () => ({
  AssetGalerie: () => createElement('div', { 'data-testid': 'asset-galerie-doppel' }),
}))
vi.mock('../../src/renderer/composer/render-ausloesen', () => ({
  loeseRenderAus: vi.fn(async (...argumente: unknown[]) => {
    d.renderAusRufe.push(
      Object.fromEntries(['projekt', 'ausgabeName', 'marke', 'vorlagen'].map((n, i) => [n, argumente[i]])),
    )
    return { ok: true, wert: { auftragId: 'auftrag-render-1' } }
  }),
  loeseExportAus: vi.fn(async (...argumente: unknown[]) => {
    d.exportAusRufe.push(
      Object.fromEntries(['projektId', 'dateiname', 'zielPfad'].map((n, i) => [n, argumente[i]])),
    )
    return { ok: true, wert: { auftragId: 'auftrag-export-1' } }
  }),
}))
vi.mock('../../src/renderer/gemeinsam/marken-bereitstellung', () => ({
  holeBereiteMarke: vi.fn(() => ({ id: 'marke-eingebaut', name: 'Eingebaute Marke' })),
}))
vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: vi.fn(async (kanal: string) => {
    d.rufeAufRufe.push(kanal)
    if (kanal === 'project:listeAusgaben') {
      return { ok: true, wert: [d.bestandsDatei] }
    }
    if (kanal === 'export:wähleExportZiel') {
      return { ok: true, wert: { pfad: d.antwortFuerExportZiel } }
    }
    return { ok: true, wert: { auftragId: 'auftrag-x' } }
  }),
}))
vi.mock('../../src/renderer/ipc-client/pfad-fuer-datei', () => ({
  pfadFuerDatei: vi.fn(() => null),
}))

// ----------------------------------------------------------------------------
// Fixturen
// ----------------------------------------------------------------------------

function baueProjekt(ueberschreibungen: Partial<Project> = {}): Project {
  return {
    id: 'p-1',
    name: 'Testprojekt',
    erstelltAm: '2026-10-09T00:00:00Z',
    geaendertAm: '2026-10-09T00:00:00Z',
    schemaVersion: 1,
    assets: [
      {
        id: 'asset-1', typ: 'video', dateiname: 'a.mp4', originalname: 'a.mp4',
        maße: { breite: 1920, höhe: 1080 }, dauer: 10, importdatum: '', zustand: 'ok',
      },
    ],
    aktionen: [],
    liste: [],
    letzterAusgabeName: 'sommer',
    standardMarkeId: 'marke-eingebaut',
    standardSegmentdauer: 10,
    ...ueberschreibungen,
  } as Project
}

function baueEigenschaften(projekt: Project | null) {
  const sicht = { projekt, ladefehler: null }
  return {
    sichtbar: true,
    projekt: {
      lade: vi.fn(),
      hole: vi.fn(() => sicht),
      setzeProjekt: vi.fn(),
      setzeListe: vi.fn(),
      gleicheElementAb: vi.fn(),
      leere: vi.fn(),
      aufGeaendert: vi.fn(() => () => {}),
    },
    zeichnen: {
      bereiteVor: vi.fn(),
      hole: vi.fn(() => ({ vorlagen: [] })),
      verwirfMotivBestand: vi.fn(),
    },
    vorlagen: {
      lade: vi.fn(),
      hole: vi.fn(() => null),
      aufGeaendert: vi.fn(() => () => {}),
    },
    verdrahtung: {
      starteMedienImport: vi.fn(),
      reparatur: null,
      meldeReparaturStand: d.meldeReparaturStand,
      meldeUebergabe: d.meldeUebergabe,
    },
  }
}

// ----------------------------------------------------------------------------
// Der Lauf
// ----------------------------------------------------------------------------

import { ComposerWurzel } from '../../src/renderer/composer/index'

let behaelter: HTMLDivElement
let wurzel: Root

async function zeichne(eigenschaften: ReturnType<typeof baueEigenschaften>): Promise<void> {
  await act(async () => {
    wurzel.render(createElement(ComposerWurzel, eigenschaften as never))
  })
}

async function klicke(knopf: HTMLButtonElement): Promise<void> {
  await act(async () => {
    knopf.click()
  })
  // Mikro-Auftraege (Promise-Ketten der Ausloesungen) laufen lassen.
  await act(async () => {})
}

function knopfFuer(testId: string): HTMLButtonElement {
  const knopf = behaelter.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`)
  if (knopf === null) throw new Error(`Knopf "${testId}" nicht gefunden`)
  return knopf
}

beforeEach(() => {
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  wurzel = createRoot(behaelter)
  d.renderAusRufe.length = 0
  d.exportAusRufe.length = 0
  d.rufeAufRufe.length = 0
  d.antwortFuerExportZiel = 'E:/Stick'
  d.meldeReparaturStand.mockClear()
  d.meldeUebergabe.mockClear()
})

afterEach(() => {
  act(() => {
    wurzel.unmount()
  })
  behaelter.remove()
})

describe('composer/index.tsx - die zwei Dialoge sind eingehaengt (#342)', () => {
  it('„Rendern..." oeffnet das Render-Overlay mit dem vorbelegten Namen (FA-22)', async () => {
    await zeichne(baueEigenschaften(baueProjekt()))
    expect(behaelter.querySelector('[data-testid="render-dialog"]')).toBeNull()

    await klicke(knopfFuer('composer-render-oefnen'))

    expect(behaelter.querySelector('[data-testid="render-dialog"]')).not.toBeNull()
    const feld = behaelter.querySelector<HTMLInputElement>('[data-testid="render-dialog-name"]')
    expect(feld?.value).toBe('sommer')
  })

  it('bei letzterAusgabeName === null ist das Feld LEER - kein Ersatzname', async () => {
    await zeichne(baueEigenschaften(baueProjekt({ letzterAusgabeName: null })))
    await klicke(knopfFuer('composer-render-oefnen'))

    const feld = behaelter.querySelector<HTMLInputElement>('[data-testid="render-dialog-name"]')
    expect(feld?.value).toBe('')
    expect(knopfFuer('render-dialog-ausloeser').disabled).toBe(true)
  })

  it('kaputte Stellen sperren den Render-Knopf (Freigabe aus #132)', async () => {
    const kaputt = baueProjekt({
      liste: [
        { id: 'el-1', art: 'video', ref: 'asset-fehlt', dauer: 5, trimStart: null, trimEnde: null, einblendung: null },
      ],
    })
    await zeichne(baueEigenschaften(kaputt))

    expect(knopfFuer('composer-render-oefnen').disabled).toBe(true)
    expect(behaelter.querySelector('[data-testid="render-dialog"]')).toBeNull()
  })

  it('der Ausloeser ruft loeseRenderAus GENAU EINmal ueber #231; danach ist das Overlay zu', async () => {
    await zeichne(baueEigenschaften(baueProjekt()))
    await klicke(knopfFuer('composer-render-oefnen'))
    await klicke(knopfFuer('render-dialog-ausloeser'))

    expect(d.renderAusRufe).toHaveLength(1)
    expect(d.renderAusRufe[0]).toMatchObject({
      ausgabeName: 'sommer',
      marke: { id: 'marke-eingebaut' },
      vorlagen: [],
    })
    // eingereiht -> Overlay geschlossen.
    expect(behaelter.querySelector('[data-testid="render-dialog"]')).toBeNull()
  })

  it('voller Export-Weg: Liste geladen, Klick oeffnet, Auswahl + Ziel, Ausloeser ruft #134 GENAU EINmal', async () => {
    await zeichne(baueEigenschaften(baueProjekt()))
    await act(async () => {})

    // Die Ausgabe-Liste ist beim Aufbau geladen (M7-68, ENTSCHIEDEN 7) und zeigt
    // die Datei - die listeAusgaben-Antwort des Doppel ist angekommen.
    const ausgabenBereich = behaelter.querySelector('[data-testid="composer-ausgaben"]')
    expect(ausgabenBereich?.textContent).toContain('sommer.mp4')

    const zeilenKnopf = Array.from(
      ausgabenBereich?.querySelectorAll<HTMLButtonElement>('button') ?? [],
    ).find((k) => k.textContent === 'Exportieren')
    expect(zeilenKnopf).toBeDefined()
    await klicke(zeilenKnopf as HTMLButtonElement)

    expect(behaelter.querySelector('[data-testid="export-dialog"]')).not.toBeNull()
    // Die leere Auswahl sperrt den Ausloeser (#232).
    expect(knopfFuer('export-dialog-ausloeser').disabled).toBe(true)

    // Datei waehlen - Ziel fehlt noch, gesperrt bleibt er.
    await klicke(knopfFuer('export-dialog-datei'))
    expect(knopfFuer('export-dialog-ausloeser').disabled).toBe(true)

    // Ziel waehlen (rufeAuf-Doppel liefert 'E:/Stick').
    await klicke(knopfFuer('export-dialog-ziel-waehlen'))
    expect(knopfFuer('export-dialog-ausloeser').disabled).toBe(false)

    await klicke(knopfFuer('export-dialog-ausloeser'))
    expect(d.exportAusRufe).toHaveLength(1)
    expect(d.exportAusRufe[0]).toMatchObject({
      projektId: 'p-1',
      dateiname: 'sommer.mp4',
      zielPfad: 'E:/Stick',
    })
    expect(behaelter.querySelector('[data-testid="export-dialog"]')).toBeNull()
  })

  it('Abbrechen schliesst das Overlay, ohne #134 zu rufen', async () => {
    await zeichne(baueEigenschaften(baueProjekt()))
    await klicke(knopfFuer('composer-render-oefnen'))
    expect(behaelter.querySelector('[data-testid="render-dialog"]')).not.toBeNull()

    const abbrechen = Array.from(
      behaelter.querySelectorAll<HTMLButtonElement>('[data-testid="render-dialog"] button'),
    ).find((k) => k.textContent === 'Abbrechen')
    expect(abbrechen).toBeDefined()
    await klicke(abbrechen as HTMLButtonElement)

    expect(behaelter.querySelector('[data-testid="render-dialog"]')).toBeNull()
    expect(d.renderAusRufe).toHaveLength(0)
  })
})
