// Verhaltenstests zu #202 - die Auswahlanzeige (asset-auswahl.tsx, jsdom).
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement } from 'react'

import type { Asset } from '../../src/shared/contracts/asset'
import type { Project, Listenelement } from '../../src/shared/contracts/project'
import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import type { FixWirkung } from '../../src/renderer/composer/reparatur-optionen'
// Der Import mit `.tsx`-Endung ist zur Laufzeit gueltig (esbuild/vite). Das
// Test-tsconfig verbietet die Endung aber ohne `allowImportingTsExtensions`
// (TS5097) - deshalb der ts-expect-error wie im Projekt ueblich.
import { AssetAuswahl } from '../../src/renderer/app-shell/asset-auswahl.tsx'


// React 19: act(...) setzt dieses Flag selbst nur in bekannten Testumgebungen.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

// ---------------- Bausteine ----------------

function asset(id: string, typ: 'video' | 'bild', zustand: 'ok' | 'fehlt' = 'ok'): Asset {
  return {
    id,
    typ,
    dateiname: `${id}.mp4`,
    originalname: `medium-${id}`,
    maße: { breite: 1920, höhe: 1080 },
    dauer: typ === 'video' ? 12.5 : null,
    importdatum: '2026-08-01T10:00:00Z',
    zustand,
  }
}

function projekt(assets: Asset[], elemente: Listenelement[]): Project {
  return {
    id: 'p-1',
    name: 'Probe-Projekt',
    erstelltAm: '2026-08-01T09:00:00Z',
    geaendertAm: '2026-08-01T09:00:00Z',
    schemaVersion: 1,
    assets,
    aktionen: [],
    liste: elemente,
    letzterAusgabeName: null,
    standardMarkeId: 'm1',
    standardSegmentdauer: 10,
  }
}

const videoElement: Listenelement = {
  id: 'e-kaputt',
  art: 'video',
  ref: 'a-fehlt',
  dauer: 10,
  trimStart: null,
  trimEnde: null,
  einblendung: null,
}

type Steuer = {
  aufAbgeschlossen: ReturnType<typeof vi.fn<(wirkung: FixWirkung) => void>>
  aufAbgebrochen: ReturnType<typeof vi.fn<() => void>>
  aufFehler: ReturnType<typeof vi.fn<(code: string, meldung: string) => void>>
  rueckweg: ReturnType<
    typeof vi.fn<
      (
        elementId: string,
        neueAssetId: string,
      ) => Promise<Ergebnis<FixWirkung>>
    >
  >
}

const steuer: Steuer = {
  aufAbgeschlossen: vi.fn(),
  aufAbgebrochen: vi.fn(),
  aufFehler: vi.fn(),
  rueckweg: vi.fn(),
}

let behaelter: HTMLDivElement | null = null
let wurzel: Root | null = null

function zeige(
  eigenschaften: Partial<Parameters<typeof AssetAuswahl>[0]> = {},
  assets: Asset[] = [asset('a-ok', 'video'), asset('b-ok', 'video'), asset('c-fehlt', 'video', 'fehlt')],
): void {
  const eigenschaftenVoll: Parameters<typeof AssetAuswahl>[0] = {
    elementId: 'e-kaputt',
    projekt: projekt(assets, [videoElement]),
    schliesseMediumFixAb: steuer.rueckweg as unknown as Parameters<typeof AssetAuswahl>[0]['schliesseMediumFixAb'],
    aufAbgeschlossen: steuer.aufAbgeschlossen,
    aufAbgebrochen: steuer.aufAbgebrochen,
    aufFehler: steuer.aufFehler,
    ...eigenschaften,
  }
  const element = createElement(AssetAuswahl, eigenschaftenVoll)
  act(() => {
    wurzel?.render(element as ReactElement)
  })
}

beforeEach(() => {
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  wurzel = createRoot(behaelter)
  steuer.aufAbgeschlossen.mockClear()
  steuer.aufAbgebrochen.mockClear()
  steuer.aufFehler.mockClear()
  steuer.rueckweg.mockClear()
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

describe('AssetAuswahl (#202) - Vorpruefungen ohne Liste', () => {
  it('unbekannte elementId -> aufFehler(nicht_gefunden), keine Liste, kein Rueckweg-Aufruf', () => {
    zeige({ elementId: 'gibt-es-nicht' })
    expect(steuer.aufFehler).toHaveBeenCalledWith('nicht_gefunden', expect.stringContaining('gibt-es-nicht'))
    expect(steuer.rueckweg).not.toHaveBeenCalled()
    expect(behaelter?.querySelectorAll('input[type=radio]')).toHaveLength(0)
  })

  it('segment-Element -> aufFehler(ungueltige_eingabe), keine Liste (#203 ist zustaendig)', () => {
    const segment: Listenelement = { ...videoElement, art: 'segment', ref: 'aktion-1' }
    zeige({ projekt: projekt([asset('a-ok', 'video')], [segment]) })
    expect(steuer.aufFehler).toHaveBeenCalledWith('ungueltige_eingabe', expect.any(String))
    expect(steuer.rueckweg).not.toHaveBeenCalled()
    expect(behaelter?.querySelectorAll('input[type=radio]')).toHaveLength(0)
  })

  it('kein passendes Asset mit zustand ok -> leere Auswahl mit Hinweis, KEIN Fehler, kein Import-Ausloesen', () => {
    zeige({ projekt: projekt([asset('c-fehlt', 'video', 'fehlt')], [videoElement]) })
    expect(steuer.aufFehler).not.toHaveBeenCalled()
    expect(behaelter?.textContent).toContain('Importiere')
  })
})

describe('AssetAuswahl (#202) - Bestaetigung', () => {
  it('Klick auf Uebernehmen ruft schliesseMediumFixAb GENAU EINMAL mit elementId und Asset-id', async () => {
    steuer.rueckweg.mockResolvedValue({ ok: true, wert: { art: 'erledigt' } })
    zeige()
    const radios = Array.from(behaelter?.querySelectorAll<HTMLInputElement>('input[type=radio]') ?? [])
    expect(radios).toHaveLength(2) // das fehlt-Asset ist weggefiltert
    await act(async () => {
      radios[0]?.click()
    })
    const knopf = behaelter?.querySelector('button') as HTMLButtonElement
    expect(knopf.textContent).toBe('Übernehmen')
    await act(async () => {
      knopf.click()
    })
    expect(steuer.rueckweg).toHaveBeenCalledTimes(1)
    expect(steuer.rueckweg).toHaveBeenCalledWith('e-kaputt', 'a-ok')
    expect(steuer.aufAbgeschlossen).toHaveBeenCalledWith({ art: 'erledigt' })
  })

  it('zweiter Klick VOR der Antwort loest keinen zweiten Aufruf aus', async () => {
    let loeseAuf: (wert: Ergebnis<FixWirkung>) => void = () => undefined
    steuer.rueckweg.mockImplementation(
      () =>
        new Promise((auf) => {
          loeseAuf = auf
        }),
    )
    zeige()
    const radios = Array.from(behaelter?.querySelectorAll<HTMLInputElement>('input[type=radio]') ?? [])
    await act(async () => {
      radios[0]?.click()
    })
    const knopf = behaelter?.querySelector('button') as HTMLButtonElement
    await act(async () => {
      knopf.click()
    })
    await act(async () => {
      knopf.click()
      knopf.click()
    })
    expect(steuer.rueckweg).toHaveBeenCalledTimes(1)
    await act(async () => {
      loeseAuf({ ok: true, wert: { art: "erledigt" } as FixWirkung })
    })
    expect(steuer.rueckweg).toHaveBeenCalledTimes(1)
  })

  it('ok: false -> aufFehler mit dem UNVERAENDERTEN Code, kein aufAbgeschlossen; Auswahl offen', async () => {
    steuer.rueckweg.mockResolvedValue({
      ok: false,
      fehler: { code: 'nicht_gefunden', meldung: 'vom Main', daten: undefined },
    })
    zeige()
    const radios = Array.from(behaelter?.querySelectorAll<HTMLInputElement>('input[type=radio]') ?? [])
    await act(async () => {
      radios[0]?.click()
    })
    const knopf = behaelter?.querySelector('button') as HTMLButtonElement
    await act(async () => {
      knopf.click()
    })
    expect(steuer.aufFehler).toHaveBeenCalledWith('nicht_gefunden', 'vom Main')
    expect(steuer.aufAbgeschlossen).not.toHaveBeenCalled()
    // Die Auswahl bleibt offen - erneut versuchbar.
    expect(behaelter?.querySelectorAll('input[type=radio]')).toHaveLength(2)
  })

  it('wirft schliesseMediumFixAb -> aufFehler(unbekannter_fehler), Wurf verlaesst die Komponente nicht', async () => {
    steuer.rueckweg.mockRejectedValue(new Error('verwaistes Ziel'))
    zeige()
    const radios = Array.from(behaelter?.querySelectorAll<HTMLInputElement>('input[type=radio]') ?? [])
    await act(async () => {
      radios[0]?.click()
    })
    const knopf = behaelter?.querySelector('button') as HTMLButtonElement
    await act(async () => {
      knopf.click()
    })
    expect(steuer.aufFehler).toHaveBeenCalledWith('unbekannter_fehler', expect.any(String))
    expect(steuer.aufAbgeschlossen).not.toHaveBeenCalled()
  })

  it('nach einem Wurf bleibt die Auswahl bedienbar - der naechste Klick ruft erneut', async () => {
    // Ein gescheiterter Rueckweg ist kein Dauerzustand: Bliebe die Sperre stehen,
    // waere das Medium nach EINEM Wurf fuer den Rest der Sitzung nicht ersetzbar.
    steuer.rueckweg.mockRejectedValueOnce(new Error('einmalig'))
    steuer.rueckweg.mockResolvedValueOnce({ ok: true, wert: { art: 'erledigt' } as FixWirkung })
    zeige()
    const radios = Array.from(behaelter?.querySelectorAll<HTMLInputElement>('input[type=radio]') ?? [])
    await act(async () => {
      radios[0]?.click()
    })
    const knopf = behaelter?.querySelector('button') as HTMLButtonElement
    await act(async () => {
      knopf.click()
    })
    expect(steuer.rueckweg).toHaveBeenCalledTimes(1)

    await act(async () => {
      knopf.click()
    })
    expect(steuer.rueckweg).toHaveBeenCalledTimes(2)
    expect(steuer.aufAbgeschlossen).toHaveBeenCalledWith({ art: 'erledigt' })
  })

  it('Abbruch -> aufAbgebrochen, es wurde nichts geschrieben', () => {
    zeige()
    const knoepfe = Array.from(behaelter?.querySelectorAll('button') ?? [])
    const abbruch = knoepfe.find((k) => k.textContent === 'Abbrechen') as HTMLButtonElement
    act(() => {
      abbruch.click()
    })
    expect(steuer.aufAbgebrochen).toHaveBeenCalledTimes(1)
    expect(steuer.rueckweg).not.toHaveBeenCalled()
  })
})

describe('AssetAuswahl (#202) - Vorschau-URLs', () => {
  it('enthaelt media://-URLs und NIE absolute Pfade', () => {
    steuer.rueckweg.mockResolvedValue({ ok: true, wert: { art: 'erledigt' } })
    zeige()
    const quellen = Array.from(behaelter?.querySelectorAll('[src]') ?? []).map((e) =>
      e.getAttribute('src'),
    )
    expect(quellen.length).toBeGreaterThan(0)
    for (const quelle of quellen) {
      expect(quelle).toMatch(/^media:\/\//)
      expect(quelle).not.toMatch(/^[A-Za-z]:\\|^\/(Users|home|mnt)\b/)
    }
  })
})
