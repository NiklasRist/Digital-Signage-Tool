// Unit-Test zu #195 – die reine Montage-Regel des Rahmens (rahmen-montage.ts).
//
// Die Datei ist bewusst OHNE React und OHNE Browser: Die DoD verlangt, dass ihre
// Tests ohne Browser-Umgebung laufen (vitest.config: environment "node").
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import type { ReiterId } from '../../src/renderer/app-shell/reiter'
import {
  ergaenzeBesuchte,
  istMontiert,
} from '../../src/renderer/app-shell/rahmen-montage'

describe('ergaenzeBesuchte (DoD)', () => {
  it("ergaenzeBesuchte([], 'projekte') liefert ['projekte'] (DoD)", () => {
    expect(ergaenzeBesuchte([] as ReiterId[], 'projekte')).toEqual(['projekte'])
  })

  it("ergaenzeBesuchte(['projekte'], 'projekte') liefert wieder ['projekte'] – keine Dublette (DoD)", () => {
    expect(ergaenzeBesuchte(['projekte'] as ReiterId[], 'projekte')).toEqual([
      'projekte',
    ])
  })

  it('ergänzt einen neuen Reiter in Besuchsreihenfolge (Reihenfolge = Besuchsreihenfolge)', () => {
    const besuchte: ReiterId[] = ['projekte', 'vorlagen']
    expect(ergaenzeBesuchte(besuchte, 'aktionen')).toEqual([
      'projekte',
      'vorlagen',
      'aktionen',
    ])
  })

  it('lässt die Eingabe-Arrays nach dem Aufruf unverändert (DoD vergleicht sie)', () => {
    const eingabe: ReiterId[] = ['projekte', 'aktionen']
    const kopie = [...eingabe]

    ergaenzeBesuchte(eingabe, 'vorlagen')
    expect(eingabe).toEqual(kopie)

    ergaenzeBesuchte(eingabe, 'aktionen')
    expect(eingabe).toEqual(kopie)
  })

  it('liefert IMMER ein neues Array – auch im Dubletten-Fall (Signatur: „Liefert IMMER ein neues Array")', () => {
    const eingabe: ReiterId[] = ['projekte']
    expect(ergaenzeBesuchte(eingabe, 'projekte')).not.toBe(eingabe)
    expect(ergaenzeBesuchte(eingabe, 'aktionen')).not.toBe(eingabe)
  })

  it('nimmt eine readonly-Eingabe entgegen und fasst sie nicht an', () => {
    const eingabe: readonly ReiterId[] = ['projekte']
    expect(ergaenzeBesuchte(eingabe, 'vorlagen')).toEqual(['projekte', 'vorlagen'])
    expect(eingabe).toEqual(['projekte'])
  })
})

describe('istMontiert (DoD)', () => {
  it('liefert true genau für besuchte Reiter (DoD)', () => {
    const besuchte: readonly ReiterId[] = ['projekte', 'vorlagen']

    expect(istMontiert(besuchte, 'projekte')).toBe(true)
    expect(istMontiert(besuchte, 'vorlagen')).toBe(true)
    expect(istMontiert(besuchte, 'zusammenstellen')).toBe(false)
    expect(istMontiert(besuchte, 'aktionen')).toBe(false)
  })

  it('liefert für eine leere Besuchsmenge überall false', () => {
    expect(istMontiert([], 'projekte')).toBe(false)
    expect(istMontiert([], 'aktionen')).toBe(false)
  })
})

describe('Bauvorschriften dieser Datei (DoD-Grep-Proben)', () => {
  const QUELLE = readFileSync(
    new URL('../../src/renderer/app-shell/rahmen-montage.ts', import.meta.url),
    'utf8',
  )

  // Nur der Code, ohne Kommentarzeilen – die Grep-Proben der DoD pruefen den Rumpf.
  const CODEZEILEN = QUELLE.split('\n')
    .filter((z) => {
      const t = z.trim()
      return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
    })
    .join('\n')

  it('enthält kein JSX und keinen react-Import (DoD)', () => {
    expect(QUELLE).not.toMatch(/\bJSX\b/)
    expect(CODEZEILEN).not.toContain('</')
    expect(CODEZEILEN).not.toContain('/>')
    expect(CODEZEILEN).not.toMatch(/from\s+['"]react['"]/)
  })
})