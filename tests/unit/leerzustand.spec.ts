// Anzeige-Tests zu #198 – der Leerzustand-Hinweis (leerzustand.tsx, jsdom).
//
// Die Anzeige ist ein einzelner, ruhiger Block: Ueberschrift, ein Satz, ein Knopf.
// Sie zeigt KEINEN Fehlercode und KEINE Fehlermeldung (TK 9.14.2 - "keine
// Fehlermeldung"), ist KEINE Warnung und wechselt selbst keinen Reiter: Der Knopf
// ruft `aufProjekteWechseln` genau einmal (ENTSCHIEDEN 2).
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement } from 'react'

import {
  Leerzustand,
  type LeerzustandEigenschaften,
} from '../../src/renderer/app-shell/leerzustand'

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

function eigenschaften(teil: Partial<LeerzustandEigenschaften> = {}): LeerzustandEigenschaften {
  return {
    reiter: 'zusammenstellen',
    aufProjekteWechseln: vi.fn(),
    ...teil,
  }
}

function rendere(eig: LeerzustandEigenschaften): { behaelter: HTMLDivElement; fertig: () => void } {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel: Root = createRoot(behaelter)
  act(() => {
    wurzel.render(createElement(Leerzustand, eig) as ReactElement)
  })
  return {
    behaelter,
    fertig: () => {
      act(() => {
        wurzel.unmount()
      })
      behaelter.remove()
    },
  }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('Leerzustand', () => {
  it('zeigt Ueberschrift, einen Satz und den Weg zum Reiter Projekte (DoD)', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ reiter: 'zusammenstellen' }))

    expect(behaelter.textContent).toContain('Zusammenstellen')
    expect(behaelter.textContent).toContain('Wiedergabeliste')
    expect(behaelter.textContent).toContain('Reiter Projekte')

    const knopf = behaelter.querySelector('button')
    expect(knopf).not.toBeNull()
    expect(knopf?.textContent).toContain('Projekte')

    fertig()
  })

  it('zeigt fuer den Reiter Aktionen den passenden Text', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ reiter: 'aktionen' }))

    expect(behaelter.textContent).toContain('Aktionen')
    expect(behaelter.textContent).toContain('Aktionen eines Projekts')

    fertig()
  })

  it('ruft aufProjekteWechseln genau einmal bei Klick (DoD, Test mit Spion)', () => {
    const aufProjekteWechseln = vi.fn()
    const { behaelter, fertig } = rendere(eigenschaften({ aufProjekteWechseln }))

    const knopf = behaelter.querySelector('button')
    act(() => {
      knopf?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(aufProjekteWechseln).toHaveBeenCalledTimes(1)

    fertig()
  })

  it('zeigt keinen Fehlercode und keine Fehlermeldung (DoD)', () => {
    const { behaelter, fertig } = rendere(eigenschaften())

    expect(behaelter.textContent).not.toContain('speicher_fehler')
    expect(behaelter.textContent).not.toContain('nicht_gefunden')
    expect(behaelter.textContent).not.toMatch(/Fehler/i)
    // Ruhiger Block: kein Warnsymbol, keine Ausrufezeichen-Zeile.
    expect(behaelter.textContent).not.toContain('!')

    fertig()
  })

  it('ist kein Async-Zustand: rendert ohne Projekt-Sicht und ohne Abo (ENTSCHIEDEN 4, 6)', () => {
    const { behaelter, fertig } = rendere(eigenschaften())

    expect(behaelter.querySelector('progress')).toBeNull()
    expect(behaelter.querySelector('dialog')).toBeNull()

    fertig()
  })
})

describe('DoD-Grep-Proben (Quelltext)', () => {
  const CODE = readFileSync('src/renderer/app-shell/leerzustand.tsx', 'utf8')

  it('enthaelt kein rufeAuf, kein abonniere, kein window. und keinen Fremd-Modul-Import (DoD)', () => {
    for (const verboten of [
      'rufeAuf',
      'abonniere',
      'window.',
      'composer/',
      'action-editor/',
      'vorlagen-editor/',
      'KANAELE',
    ]) {
      expect(CODE, verboten).not.toContain(verboten)
    }
  })

  it('ist die eine ausdruecklich vorgesehene Anzeige der Shell - kein Projekt-Datenimport', () => {
    // Der Hinweis nennt den Reiter Projekte (das ist Text); importiert wird aber
    // NICHTS aus der Projekt-Sicht - weder sichten.ts noch ein Project-Zugang.
    expect(CODE).not.toContain('sichten')
    expect(CODE).not.toContain('Project')
    expect(CODE).not.toContain('projektOffen')
  })
})