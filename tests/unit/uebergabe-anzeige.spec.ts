// Tests zu #256 (M7-64) - die Anzeige (uebergabe.tsx, jsdom).
// Die beiden Overlays (M7-09, M7-10) werden als Attrappen ersetzt; die reine
// Seite (uebergabe.ts) läuft ECHT mit.
// @vitest-environment jsdom
import { join } from 'node:path'
import { readFileSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement, type ReactNode } from 'react'

import type { Uebergabe } from '../../src/renderer/composer/reparatur-optionen'
import type { Project } from '../../src/shared/contracts/project'
import { LEERE_SHELL_REPARATUR, type ShellReparatur } from '../../src/renderer/app-shell/reparatur-fuehrung-shell'

const doppel = vi.hoisted(() => ({
  assetAuswahl: [] as Array<Record<string, unknown>>,
  aktionsAuswahl: [] as Array<Record<string, unknown>>,
}))

vi.mock('../../src/renderer/app-shell/asset-auswahl', () => ({
  AssetAuswahl: (eigenschaften: Record<string, unknown>) => {
    doppel.assetAuswahl.push(eigenschaften)
    return null
  },
}))

vi.mock('../../src/renderer/app-shell/aktions-auswahl', () => ({
  AktionsAuswahl: (eigenschaften: Record<string, unknown>) => {
    doppel.aktionsAuswahl.push(eigenschaften)
    return null
  },
}))

import { UebergabeOverlay, type UebergabeOverlayEigenschaften } from '../../src/renderer/app-shell/uebergabe.tsx'


;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

// ---------------- Quelldatei-Verbote (Grep, nur auf DIESE Datei) ----------------

const QUELLE = readFileSync(join(process.cwd(), 'src/renderer/app-shell/uebergabe.tsx'), 'utf8')
const CODEZEILEN = QUELLE.split('\n')
  .filter((z) => {
    const t = z.trim()
    return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
  })
  .join('\n')

describe('uebergabe.tsx – Verbote (Grep, nur auf DIESE Datei)', () => {
  it('kein IPC, kein kanal, kein eigenes Handeln, kein eigener Zustand', () => {
    for (const verbot of [
      'rufeAuf', 'abonniere', 'KANAELE', 'window.api', "'queue:'", 'wechsleReiter',
      'reparaturhalter', 'useState', 'useEffect', 'nimmUebergabeEntgegen',
      'beendeLaufende', 'schliesseFixAb', 'fuehreMedienImportAus',
    ]) {
      expect(CODEZEILEN).not.toContain(verbot)
    }
  })
})

// ---------------- Bausteine ----------------

function projekt(): Project {
  return {
    id: 'p-1', name: 'Probe', erstelltAm: '2026-08-01T09:00:00Z', geaendertAm: '2026-08-01T09:00:00Z',
    schemaVersion: 1, assets: [], aktionen: [], liste: [], standardSegmentdauer: 10, standardMarkeId: "m1", letzterAusgabeName: null,
  }
}

function lageMit(uebergabe: Uebergabe | null): ShellReparatur {
  return { ...LEERE_SHELL_REPARATUR, laufendeUebergabe: uebergabe }
}

function eigenschaften(lage: ShellReparatur, pjct: Project | null = projekt(), teil: Partial<UebergabeOverlayEigenschaften> = {}): {
  props: UebergabeOverlayEigenschaften
  schliesseMediumFixAb: Mock
  schliesseAktionsFixAb: Mock
  schliesseAbschnittsFixAb: Mock
  aufAbgeschlossen: Mock
  aufAbgebrochen: Mock
  aufFehler: Mock
} {
  const schliesseMediumFixAb = vi.fn()
  const schliesseAktionsFixAb = vi.fn()
  const schliesseAbschnittsFixAb = vi.fn()
  const aufAbgeschlossen = vi.fn()
  const aufAbgebrochen = vi.fn()
  const aufFehler = vi.fn()
  return {
    schliesseMediumFixAb,
    schliesseAktionsFixAb,
    schliesseAbschnittsFixAb,
    aufAbgeschlossen,
    aufAbgebrochen,
    aufFehler,
    props: {
      lage,
      projekt: pjct,
      schliesseMediumFixAb,
      schliesseAktionsFixAb,
      schliesseAbschnittsFixAb,
      aufAbgeschlossen,
      aufAbgebrochen,
      aufFehler,
      ...teil,
    },
  }
}

function rendere(props: UebergabeOverlayEigenschaften): { behaelter: HTMLDivElement; fertig: () => void } {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel: Root = createRoot(behaelter)
  act(() => {
    wurzel.render(createElement(UebergabeOverlay, props) as ReactElement)
  })
  return { behaelter, fertig: () => act(() => wurzel.unmount()) }
}

beforeEach(() => {
  doppel.assetAuswahl = []
  doppel.aktionsAuswahl = []
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

// ---------------- Die Kernprüfungen ----------------

describe('UebergabeOverlay (#256)', () => {
  it('ohne laufende Übergabe: null - KEINE der beiden Attrappen aufgebaut', () => {
    const { fertig } = rendere(eigenschaften(lageMit(null)).props)
    expect(doppel.assetAuswahl.length).toBe(0)
    expect(doppel.aktionsAuswahl.length).toBe(0)
    fertig()
  })

  it('asset-auswahl: NUR AssetAuswahl, mit elementId, projekt (toBe) und schliesseMediumFixAb (toBe)', () => {
    const p = projekt()
    const e = eigenschaften(lageMit({ ziel: 'asset-auswahl', elementId: 'e1' }), p)
    const { fertig } = rendere(e.props)
    expect(doppel.assetAuswahl.length).toBe(1)
    expect(doppel.aktionsAuswahl.length).toBe(0)
    expect(doppel.assetAuswahl[0]?.elementId).toBe('e1')
    expect(doppel.assetAuswahl[0]?.projekt).toBe(p)
    expect(doppel.assetAuswahl[0]?.schliesseMediumFixAb).toBe(e.schliesseMediumFixAb)
    fertig()
  })

  it('aktions-auswahl mit abschnittIndex: null -> NUR AktionsAuswahl mit null und BEIDEN Rckverbindungen (toBe)', () => {
    const p = projekt()
    const e = eigenschaften(lageMit({ ziel: 'aktions-auswahl', elementId: 'e1', abschnittIndex: null }), p)
    const { fertig } = rendere(e.props)
    expect(doppel.aktionsAuswahl.length).toBe(1)
    expect(doppel.assetAuswahl.length).toBe(0)
    expect(doppel.aktionsAuswahl[0]?.abschnittIndex).toBeNull()
    expect(doppel.aktionsAuswahl[0]?.schliesseAktionsFixAb).toBe(e.schliesseAktionsFixAb)
    expect(doppel.aktionsAuswahl[0]?.schliesseAbschnittsFixAb).toBe(e.schliesseAbschnittsFixAb)
    fertig()
  })

  it('abschnittIndex: 2 wird UNVERÄNDERT durchgereicht, NICHT in null umgewandelt', () => {
    const e = eigenschaften(lageMit({ ziel: 'aktions-auswahl', elementId: 'e1', abschnittIndex: 2 }))
    const { fertig } = rendere(e.props)
    expect(doppel.aktionsAuswahl[0]?.abschnittIndex).toBe(2)
    fertig()
  })

  it('action-editor und medien-import: null (zwei benannte Tests)', () => {
    const e1 = eigenschaften(lageMit({ ziel: 'action-editor', aktionId: 'a1' }))
    const { fertig: f1 } = rendere(e1.props)
    expect(doppel.assetAuswahl.length).toBe(0)
    expect(doppel.aktionsAuswahl.length).toBe(0)
    f1()

    const e2 = eigenschaften(lageMit({ ziel: 'medien-import', elementId: 'e1' }))
    const { fertig: f2 } = rendere(e2.props)
    expect(doppel.assetAuswahl.length).toBe(0)
    expect(doppel.aktionsAuswahl.length).toBe(0)
    f2()
  })

  it('Übergabe gesetzt und projekt null: null und NICHTS aufgebaut - kein Editorial-Projekt', () => {
    const e = eigenschaften(lageMit({ ziel: 'asset-auswahl', elementId: 'e1' }), null)
    const { fertig } = rendere(e.props)
    expect(doppel.assetAuswahl.length).toBe(0)
    expect(doppel.aktionsAuswahl.length).toBe(0)
    fertig()
  })

  it('die drei Phoenix-Rcksprünge erreichen das Overlay toBe-gleich; die Anzeige ruft KEINEN davon selbst', () => {
    const e = eigenschaften(lageMit({ ziel: 'aktions-auswahl', elementId: 'e1', abschnittIndex: null }))
    const { fertig } = rendere(e.props)
    expect(doppel.aktionsAuswahl[0]?.aufAbgeschlossen).toBe(e.aufAbgeschlossen)
    expect(doppel.aktionsAuswahl[0]?.aufAbgebrochen).toBe(e.aufAbgebrochen)
    expect(doppel.aktionsAuswahl[0]?.aufFehler).toBe(e.aufFehler)
    // ENTSCHIEDEN 7: drei Spione zählen null - die Anzeige handelt NICHT selbst.
    expect(e.aufAbgeschlossen).not.toHaveBeenCalled()
    expect(e.aufAbgebrochen).not.toHaveBeenCalled()
    expect(e.aufFehler).not.toHaveBeenCalled()
    fertig()
  })

  it('Die Anzeige hält KEINEN eigenen Zustand: kein react-Zustands-Hook in der Datei (Grep oben)', () => {
    // Grep-Probe deckt useState/useEffect ab.
    expect(CODEZEILEN).not.toContain('useState')
    expect(CODEZEILEN).not.toContain('useEffect')
  })
})
