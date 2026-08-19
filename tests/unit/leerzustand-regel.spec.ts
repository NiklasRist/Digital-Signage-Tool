// Logik-Tests zu #198 – die reine Leerzustand-Regel (leerzustand-regel.ts, node).
//
// Die Regel ist eine reine Funktion: true AUSSCHLIESSLICH fuer 'zusammenstellen'
// und 'aktionen' ohne offenes Projekt; 'projekte' und 'vorlagen' liefern IMMER false
// (TK 9.14.2). Sie enthaelt kein JSX und keinen react-Import (Grep-Probe unten) und
// laeuft daher ohne Browser-Umgebung.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

import { REITER_MIT_LEERZUSTAND, zeigtLeerzustand } from '../../src/renderer/app-shell/leerzustand-regel'
import type { ReiterId } from '../../src/renderer/app-shell/reiter'

const ALLE_REITER: readonly ReiterId[] = ['zusammenstellen', 'aktionen', 'vorlagen', 'projekte']

describe('zeigtLeerzustand', () => {
  it("liefert true fuer 'zusammenstellen' und 'aktionen' ohne offenes Projekt (DoD)", () => {
    expect(zeigtLeerzustand('zusammenstellen', false)).toBe(true)
    expect(zeigtLeerzustand('aktionen', false)).toBe(true)
  })

  it("liefert false fuer 'vorlagen' und 'projekte' ohne offenes Projekt - die Ausnahme aus TK 9.14.2 (eigener, benannter Test)", () => {
    expect(zeigtLeerzustand('vorlagen', false)).toBe(false)
    expect(zeigtLeerzustand('projekte', false)).toBe(false)
  })

  it('liefert fuer ALLE vier Reiter false, sobald ein Projekt offen ist (DoD)', () => {
    for (const reiter of ALLE_REITER) {
      expect(zeigtLeerzustand(reiter, true), reiter).toBe(false)
    }
  })
})

describe('REITER_MIT_LEERZUSTAND', () => {
  it('enthaelt genau ["zusammenstellen", "aktionen"] (DoD)', () => {
    expect(REITER_MIT_LEERZUSTAND).toEqual(['zusammenstellen', 'aktionen'])
  })
})

describe('DoD-Grep-Proben (Quelltext)', () => {
  const CODE = readFileSync('src/renderer/app-shell/leerzustand-regel.ts', 'utf8')

  it('enthaelt kein JSX und keinen react-Import; die Logik laeuft ohne Browser (DoD)', () => {
    // Grep-Proben muessen Prosa vom Code trennen: Der GENERIERT-Kopf nennt die Woerter
    // "JSX"/"react" selbst in Kommentaren. Geprueft wird der ausfuehrbare Code.
    const CODEZEILEN = CODE.split('\n')
      .filter((z) => {
        const t = z.trim()
        return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
      })
      .join('\n')

    expect(CODEZEILEN).not.toMatch(/react/)
    expect(CODEZEILEN).not.toMatch(/JSX/)
    expect(CODEZEILEN).not.toContain('useState')
    expect(CODEZEILEN).not.toContain('createElement')
  })

  it('enthaelt kein rufeAuf, kein abonniere, kein window. und keinen Fremd-Modul-Import (DoD)', () => {
    for (const verboten of [
      'rufeAuf',
      'abonniere',
      'window.',
      'composer/',
      'action-editor/',
      'vorlagen-editor/',
    ]) {
      expect(CODE, verboten).not.toContain(verboten)
    }
  })
})