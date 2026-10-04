// Verhaltenstests zu #229 - die Anzeige (medium-loeschen.tsx, jsdom).
// Die reine Seite (medium-loeschen.ts) ist bereits gebaut; hier gilt die tsx-DoD.
// @vitest-environment jsdom
import { join } from 'node:path'
import { readFileSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement } from 'react'

import type { Project, Listenelement } from "../../src/shared/contracts/project";
import type { Asset } from "../../src/shared/contracts/asset";
import type { Aktion } from "../../src/shared/contracts/aktion";
import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
// @ts-expect-error - medium-loeschen.tsx statt des `.ts`-Zwillings
import { MediumLoeschen } from '../../src/renderer/composer/medium-loeschen.tsx'

// React 19: act(...)
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

// ---------------- Quelldatei-Verbote (Grep, nur auf DIESE Datei) ----------------

const QUELLE_TSX = readFileSync(
  join(process.cwd(), 'src/renderer/composer/medium-loeschen.tsx'),
  'utf8',
)
const CODEZEILEN = QUELLE_TSX.split('\n')
  .filter((z) => {
    const t = z.trim()
    return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
  })
  .join('\n')

describe('medium-loeschen.tsx – Verbote (Grep)', () => {
  it('ruft kein rufeAuf/KANAELE/document.querySelector und loest die LoeschLage NICHT selbst', () => {
    for (const verbot of ['rufeAuf', 'KANAELE', "project:", 'queue:', 'document-query-window.']) {
      expect(CODEZEILEN).not.toContain(verbot)
    }
    // Die Lage kommt herein; keine zweite Ausrechnung in der Anzeige.
    expect(CODEZEILEN).not.toContain('blockierer.length > 0 ?')
  })
})

// ---------------- Bausteine ----------------

function asset(id: string, originalname: string): Asset {
  return {
    id,
    typ: 'video',
    dateiname: `${id}.mp4`,
    originalname,
    maße: { breite: 1920, höhe: 1080 },
    dauer: 20.1,
    importdatum: '2026-08-01T10:00:00Z',
    zustand: 'ok',
  }
}

function aktion(id: string, bildRef: string | null): Aktion {
  return {
    id,
    titel: `Aktion ${id}`,
    beschreibung: null,
    preis: null,
    bildRef,
    cta: null,
    standardDauer: null,
    vorlagenId: 'vollbild',
    akzentfarbe: null,
  }
}

function projekt(liste: Listenelement[], assets: Asset[], akts: Aktion[] = []): Project {
  return {
    id: 'p-1',
    name: 'Probe-Projekt',
    erstelltAm: '2026-08-01T09:00:00Z',
    geaendertAm: '2026-08-01T09:00:00Z',
    schemaVersion: 1,
    assets,
    aktionen: akts,
    liste,
    letzterAusgabeName: null,
    standardSegmentdauer: 10,
  }
}

const ASSET_OK: Asset = asset('a-1', 'tanzkurs.mov')
const ASSET_ANDERES: Asset = asset('a-2', 'anderes.mov')

const videoMitRef = (id: string, ref: string): Listenelement => ({
  id,
  art: 'video',
  ref,
  dauer: null,
  trimStart: null,
  trimEnde: null,
  einblendung: null,
})

type Steuer = {
  loescheMedium: ReturnType<typeof vi.fn<
    (
      p: string,
      a: string,
      w: { gibVideoHandlesFrei: (assetId: string) => void },
    ) => Promise<Ergebnis<{ auftragId: string }, string>>>
  >
  gibVideoHandlesFrei: ReturnType<typeof vi.fn<(assetId: string) => void>>
  aufErledigt: ReturnType<typeof vi.fn<() => void>>
  aufAbgebrochen: ReturnType<typeof vi.fn<() => void>>
  aufFehler: ReturnType<typeof vi.fn<(code: string, meldung: string) => void>>
}

const steuer: Steuer = {
  loescheMedium: vi.fn<
    (
      p: string,
      a: string,
      w: { gibVideoHandlesFrei: (assetId: string) => void },
    ) => Promise<Ergebnis<{ auftragId: string }, string>>
  >(),
  gibVideoHandlesFrei: vi.fn<(assetId: string) => void>(),
  aufErledigt: vi.fn<() => void>(),
  aufAbgebrochen: vi.fn<() => void>(),
  aufFehler: vi.fn<(code: string, meldung: string) => void>(),
}

let behaelter: HTMLDivElement | null = null
let wurzel: Root | null = null

function zeige(
  eigenschaften: Partial<Parameters<typeof MediumLoeschen>[0]> = {},
  liste: Listenelement[] = [videoMitRef('e1', 'a-1')],
  assets: Asset[] = [ASSET_OK, ASSET_ANDERES],
  akts: Aktion[] = [],
): void {
  const voll: Parameters<typeof MediumLoeschen>[0] = {
    projekt: projekt(liste, assets, akts),
    assetId: 'a-1',
    loescheMedium: steuer.loescheMedium,
    gibVideoHandlesFrei: steuer.gibVideoHandlesFrei,
    aufErledigt: steuer.aufErledigt,
    aufAbgebrochen: steuer.aufAbgebrochen,
    aufFehler: steuer.aufFehler,
    ...eigenschaften,
  }
  const element = createElement(MediumLoeschen, voll)
  act(() => {
    wurzel?.render(element as ReactElement)
  })
}

beforeEach(() => {
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  wurzel = createRoot(behaelter)
  for (const doppel of [
    steuer.loescheMedium,
    steuer.gibVideoHandlesFrei,
    steuer.aufErledigt,
    steuer.aufAbgebrochen,
    steuer.aufFehler,
  ]) {
    doppel.mockClear()
  }
  steuer.loescheMedium.mockResolvedValue({ ok: true, wert: { auftragId: 'q-1' } })
})

afterEach(() => {
  act(() => {
    wurzel?.unmount()
  })
  behaelter?.remove()
  behaelter = null
  wurzel = null
})

// ---------------- Tests ----------------

describe('MediumLoeschen (#229) - Blockade', () => {
  it('zeigt Jede blockierende Stelle mit Position und Bezeichnung - statt eines "geht nicht"', () => {
    zeige({}, [videoMitRef('e1', 'a-1'), videoMitRef('e2', 'a-1')])
    expect(behaelter?.textContent).toContain('Position 1')
    expect(behaelter?.textContent).toContain('Position 2')
    expect(behaelter?.textContent).toContain('tanzkurs.mov')
    // Der Bestätigungsknopf IST BEI Blockade NICHT VORHANDEN (nicht nur disabled).
    expect(behaelter?.querySelector('[data-testid=medium-loeschen-bestaetiger]')).toBeNull()
  })

  it('Blockade seitens AKTIONEN: bildRef = Warnung, keine Sperre (Lösch-Asymmetrie 9.5.3)', () => {
    zeige(
      {},
      [videoMitRef('e-anderes', 'a-2')],
      [ASSET_OK, ASSET_ANDERES],
      [aktion('a-1', 'a-1')],
    )
    // kein Blockierer -> Bestätigung da; die betroffene Aktion ist als Hinweis genannt.
    expect(behaelter?.querySelector('[data-testid=medium-loeschen-bestaetiger]')).not.toBeNull()
    expect(behaelter?.querySelector('[data-testid=medium-loeschen-aktionen]')?.textContent).toContain('Aktion a-1')
  })
})

describe('MediumLoeschen (#229) - Bestätigung', () => {
  it('Klick ruft loescheMedium GENAU EINMAL (projektId, assetId, wirkt über die Handles-Freigabe)', async () => {
    // Das Medium ist NICHT referenziert: Der andere Blockiker übernimmt die Liste.
    zeige({}, [videoMitRef('e-frei', 'a-2')])
    const knopf = behaelter?.querySelector('[data-testid=medium-loeschen-bestaetiger]') as HTMLButtonElement
    await act(async () => {
      knopf.click()
    })
    expect(steuer.loescheMedium).toHaveBeenCalledTimes(1)
    expect(steuer.loescheMedium).toHaveBeenCalledWith('p-1', 'a-1', {
      gibVideoHandlesFrei: steuer.gibVideoHandlesFrei,
    })
    expect(steuer.aufErledigt).toHaveBeenCalledTimes(1)
    expect(steuer.aufFehler).not.toHaveBeenCalled()
  })

  it('ok:false -> aufFehler mit UNVERAENDERTEN Code+Meldung, kein aufErledigt', async () => {
    steuer.loescheMedium.mockResolvedValue({
      ok: false,
      fehler: { code: 'asset_referenziert', meldung: 'vom Main', daten: { referenzenIds: ['e1'] } },
    })
    zeige({}, [videoMitRef('e-frei', 'a-2')])
    const knopf = behaelter?.querySelector('[data-testid=medium-loeschen-bestaetiger]') as HTMLButtonElement
    await act(async () => {
      knopf.click()
    })
    expect(steuer.aufFehler).toHaveBeenCalledWith('asset_referenziert', 'vom Main')
    expect(steuer.aufErledigt).not.toHaveBeenCalled()
  })

  it('Abbruch -> aufAbgebrochen, nichts geschrieben', () => {
    zeige({}, [videoMitRef('e-frei', 'a-2')])
    const knoepfe = Array.from(behaelter?.querySelectorAll('button') ?? [])
    const abbruch = knoepfe.find((k) => k.textContent === 'Abbrechen') as HTMLButtonElement
    act(() => {
      abbruch.click()
    })
    expect(steuer.aufAbgebrochen).toHaveBeenCalledTimes(1)
    expect(steuer.loescheMedium).not.toHaveBeenCalled()
  })
})
