// Verhaltenstests zu #231 (M7-38) - die Eingabeanzeige (render-dialog.tsx, jsdom).
// @vitest-environment jsdom
import { join } from 'node:path'
import { readFileSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement } from 'react'

import { RenderDialogAnzeige } from '../../src/renderer/composer/render-dialog.tsx'

import type { NamensBefund, Ueberschreiblage } from '../../src/renderer/composer/render-dialog'

// React 19: act(...) setzt dieses Flag selbst nur in bekannten Testumgebungen.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

// ---------------- Quelldatei-Verbote (Grep) ----------------

const QUELLE_TSX = readFileSync(
  join(process.cwd(), 'src/renderer/composer/render-dialog.tsx'),
  'utf8',
)

describe('render-dialog.tsx – Verbote (Grep)', () => {
  it('enthaelt KEINEN Bestaetigungsdialog (kein confirm, kein window) und keine Eigenpruefung', () => {
    expect(QUELLE_TSX).not.toContain('confirm')
    expect(QUELLE_TSX).not.toContain('window.')
    expect(QUELLE_TSX).not.toContain('pruefeAusgabeName')
    expect(QUELLE_TSX).not.toContain('pruefeUeberschreiben')
    expect(QUELLE_TSX).not.toContain('leaft')
  })
})

// ---------------- Bausteine ----------------

const LAGE_ERSATZ: Ueberschreiblage = {
  ersetzt: true,
  vorhandene: { dateiname: 'sommer.mp4', dateigroesse: 9, geaendertAm: '2026-08-04T14:12:00Z' },
  hinweis: 'Ersetzt die Fassung vom 4.8.2026, 14:12.',
}

type Steuer = {
  aufEingabe: ReturnType<typeof vi.fn<(wert: string) => void>>
  aufAusloesen: ReturnType<typeof vi.fn<() => void>>
  aufAbbrechen: ReturnType<typeof vi.fn<() => void>>
}

const steuer: Steuer = {
  aufEingabe: vi.fn<(wert: string) => void>(),
  aufAusloesen: vi.fn<() => void>(),
  aufAbbrechen: vi.fn<() => void>(),
}

let behaelter: HTMLDivElement | null = null
let wurzel: Root | null = null

function zeige(
  eigenschaften: Partial<Parameters<typeof RenderDialogAnzeige>[0]> = {},
): void {
  const voll: Parameters<typeof RenderDialogAnzeige>[0] = {
    eingabe: 'sommer',
    befund: 'ok' as NamensBefund,
    lage: { ersetzt: false, vorhandene: null, hinweis: '' },
    laeuft: false,
    aufEingabe: steuer.aufEingabe,
    aufAusloesen: steuer.aufAusloesen,
    aufAbbrechen: steuer.aufAbbrechen,
    ...eigenschaften,
  }
  const element = createElement(RenderDialogAnzeige, voll)
  act(() => {
    wurzel?.render(element as ReactElement)
  })
}

beforeEach(() => {
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  wurzel = createRoot(behaelter)
  steuer.aufEingabe.mockClear()
  steuer.aufAusloesen.mockClear()
  steuer.aufAbbrechen.mockClear()
})

afterEach(() => {
  act(() => {
    wurzel?.unmount()
  })
  behaelter?.remove()
  behaelter = null
  wurzel = null
})

function ausloeser(): HTMLButtonElement {
  return behaelter?.querySelector('[data-testid=render-dialog-ausloeser]') as HTMLButtonElement
}

// ---------------- Tests ----------------

describe('RenderDialogAnzeige (#231)', () => {
  it('befund ok + laeuft false -> Ausloeser betaetigbar und ruft aufAusloesen', () => {
    zeige()
    expect(ausloeser().disabled).toBe(false)
    act(() => {
      ausloeser().click()
    })
    expect(steuer.aufAusloesen).toHaveBeenCalledTimes(1)
  })

  it('efund != ok -> Ausloeser gesperrt, Befund-Text erscheint, das Eingabefeld haelt den Namen', () => {
    zeige({ befund: 'pfadtrenner' as NamensBefund })
    expect(ausloeser().disabled).toBe(true)
    expect(behaelter?.querySelector('[data-testid=render-dialog-befund]')?.textContent).toContain('Pfadtrenner')
    const feld = behaelter?.querySelector('[data-testid=render-dialog-name]') as HTMLInputElement
    expect(feld.value).toBe('sommer')
  })

  it('laeuft true -> Ausloeser gesperrt', () => {
    zeige({ laeuft: true })
    expect(ausloeser().disabled).toBe(true)
  })

  it('lage ersetzt -> der Hinweis steht als FESTSTELLUNG (keine Frage), kein Bestaetigungsdialog', () => {
    zeige({ lage: LAGE_ERSATZ })
    const hinweis = behaelter?.querySelector('[data-testid=render-dialog-hinweis]')?.textContent ?? ''
    expect(hinweis).toContain('Ersetzt die Fassung vom')
    expect(hinweis).not.toContain('?')
  })

  it('lage ohne Ersetzung -> kein Hinweis-Absatz', () => {
    zeige()
    expect(behaelter?.querySelector('[data-testid=render-dialog-hinweis]')).toBeNull()
  })

  it('Eingabe rendert zum aufEingabe - nichts wird bereinigt', async () => {
    zeige({ eingabe: 'a/b' })
    const feld = behaelter?.querySelector('[data-testid=render-dialog-name]') as HTMLInputElement
    await act(async () => {
      feld.focus()
    })
    await act(async () => {
      // React kennt der value-Tracker: Den Wert über den NATIVEN Setzer setzen,
      // sonst meldet das Feld kein onChange (kontrolliertes Element).
      const einSetzer = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )?.set
      einSetzer?.call(feld, 'sommer.mp4')
      feld.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(steuer.aufEingabe).toHaveBeenCalledWith('sommer.mp4') // UNBESCHNITTEN
  })

  it('Abbrechen ist immer erreichbar und ruft aufAbbrechen', () => {
    zeige({ laeuft: true })
    const knoepfe = Array.from(behaelter?.querySelectorAll('button') ?? [])
    const abbruch = knoepfe.find((k) => k.textContent === 'Abbrechen') as HTMLButtonElement
    expect(abbruch.disabled).toBe(false)
    act(() => {
      abbruch.click()
    })
    expect(steuer.aufAbbrechen).toHaveBeenCalledTimes(1)
    expect(steuer.aufAusloesen).not.toHaveBeenCalled()
  })
})
