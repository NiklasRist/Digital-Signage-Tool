// Tests zur Suchleiste der Projektübersicht (User-Wunsch 29.10.2026, jsdom).
//
// Die Ansicht hält den Stand NICHT selbst: Der Suchtext kommt als Prop, jede Eingabe
// geht als Absicht zurück. Geprueft wird deshalb beides - was sie mit einem gegebenen
// Text zeigt, und dass sie das Tippen nur MELDET.
//
// Der Unterschied "kein Treffer" vs. "noch keine Projekte" ist der Kern: Beide zeigen
// keine Zeile, aber nur einer von beiden ist ein Ergebnis der Suche.
// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createElement, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import { Projektlisteansicht } from '../../src/renderer/projekt-verwaltung/liste-ansicht'
import type { ProjektlisteEigenschaften } from '../../src/renderer/projekt-verwaltung/liste-ansicht'
import type { ProjektMeta } from '../../src/renderer/projekt-verwaltung/liste'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

function baueMeta(teil: Partial<ProjektMeta> = {}): ProjektMeta {
  return {
    id: 'p1',
    name: 'Fitnessworld24 Herbst',
    erstelltAm: '2026-08-01T10:00:00.000Z',
    geaendertAm: '2026-08-02T11:30:00.000Z',
    ordner: 'p1',
    beschaedigt: false,
    anzahlMedien: 3,
    anzahlAusgaben: 1,
    standardMarkeId: null,
    ...teil,
  }
}

function baueListe(eintraege: readonly ProjektMeta[]): ProjektlisteEigenschaften['liste'] {
  return { zustand: 'geladen', eintraege, ladefehler: null }
}

function eigenschaften(teil: Partial<ProjektlisteEigenschaften> = {}): ProjektlisteEigenschaften {
  return {
    liste: baueListe([baueMeta(), baueMeta({ id: 'p2', name: 'Sommeraktion', ordner: 'p2' })]),
    offenesProjektId: null,
    aufOeffnen: vi.fn(),
    aufDuplizieren: vi.fn(),
    aufLoeschen: vi.fn(),
    aufErneutLaden: vi.fn(),
    zeichneBeschaedigteZeile: () => createElement('div', null, 'beschaedigt'),
    zeichneStandardmarke: () => createElement('span', null, 'marke'),
    suchtext: '',
    aufSuche: vi.fn(),
    ...teil,
  }
}

function rendere(props: ProjektlisteEigenschaften): {
  behaelter: HTMLDivElement
  wurzel: Root
  fertig: () => void
} {
  const ziel = document.createElement('div')
  document.body.appendChild(ziel)
  const wurzel: Root = createRoot(ziel)
  act(() => {
    wurzel.render(createElement(Projektlisteansicht, props) as ReactElement)
  })
  return { behaelter: ziel, wurzel, fertig: () => act(() => wurzel.unmount()) }
}

function finde(behaelter: HTMLElement, kennung: string): HTMLElement {
  const element = behaelter.querySelector(`[data-testid="${kennung}"]`)
  expect(element, kennung).not.toBeNull()
  return element as HTMLElement
}

function tippe(behaelter: HTMLElement, wert: string): void {
  const feld = finde(behaelter, 'projektliste-suche') as HTMLInputElement
  const setzen = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  act(() => {
    setzen?.call(feld, wert)
    feld.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Suchleiste (29.10.2026)', () => {
  it('steht über der Liste, sobald es Projekte gibt', () => {
    const { behaelter, fertig } = rendere(eigenschaften())
    expect(finde(behaelter, 'projektliste-suche')).not.toBeNull()
    expect(behaelter.querySelectorAll('[data-testid^="projekt-"]')).not.toHaveLength(0)
    fertig()
  })

  it('fehlt bei "Noch keine Projekte" - ein Suchfeld ohne Bestand wäre ein Bedienelement ohne Wirkung', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ liste: baueListe([]) }))
    expect(behaelter.querySelector('[data-testid="projektliste-suche"]')).toBeNull()
    expect(finde(behaelter, 'projektliste-leer')).not.toBeNull()
    fertig()
  })

  it('meldet jede Eingabe als Absicht zurück und filtert NICHT selbst', () => {
    const aufSuche = vi.fn()
    const { behaelter, fertig } = rendere(eigenschaften({ aufSuche }))
    tippe(behaelter, 'Sommer')
    expect(aufSuche).toHaveBeenCalledWith('Sommer')
    // Der Stand kommt als Prop - ohne neuen Prop bleibt die Liste unveraendert.
    expect(behaelter.querySelectorAll('li')).toHaveLength(2)
    fertig()
  })

  it('zeigt bei einem Treffer nur die passende Zeile', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ suchtext: 'sommer' }))
    const zeilen = behaelter.querySelectorAll('li')
    expect(zeilen).toHaveLength(1)
    expect(zeilen[0]?.getAttribute('data-testid')).toBe('projekt-p2')
    fertig()
  })

  it('"kein Treffer" ist ein EIGENER Zustand - nicht "Noch keine Projekte"', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ suchtext: 'gibtesnicht' }))
    expect(finde(behaelter, 'projektliste-kein-treffer').textContent).toContain('gibtesnicht')
    expect(behaelter.querySelector('[data-testid="projektliste-leer"]')).toBeNull()
    expect(behaelter.querySelectorAll('li')).toHaveLength(0)
    fertig()
  })

  it('ein leerer Suchtext zeigt wieder alle Zeilen', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ suchtext: '   ' }))
    expect(behaelter.querySelectorAll('li')).toHaveLength(2)
    fertig()
  })
})
