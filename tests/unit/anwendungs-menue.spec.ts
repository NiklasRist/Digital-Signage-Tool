// Tests zu #431 - anwendungs-menue.ts: die Vorlage darf KEINE Menue-Rolle Undo/Redo und
// KEINEN Cmd+Z-Accelerator tragen. Genau die schlucken im echten macOS-Fenster das
// Renderer-`keydown` (#350) - der Treiber sieht es nicht, weil er die Taste per CDP sendet.
import { describe, expect, it } from 'vitest'
import type { MenuItemConstructorOptions } from 'electron'

import { menueVorlage } from '../../src/main/anwendungs-menue'

/** Alle Eintraege samt Untermenues, rekursiv. */
function alleEintraege(
  eintraege: readonly MenuItemConstructorOptions[],
): MenuItemConstructorOptions[] {
  const raus: MenuItemConstructorOptions[] = []
  for (const eintrag of eintraege) {
    raus.push(eintrag)
    if (Array.isArray(eintrag.submenu)) {
      raus.push(...alleEintraege(eintrag.submenu as MenuItemConstructorOptions[]))
    }
  }
  return raus
}

describe('menueVorlage (#431)', () => {
  it('KERNNACHWEIS: KEINE Undo/Redo-Rolle und KEIN Cmd+Z-Accelerator', () => {
    const alle = alleEintraege(menueVorlage())
    const rollen = alle.map((e) => (typeof e.role === 'string' ? e.role : ''))
    expect(rollen).not.toContain('undo')
    expect(rollen).not.toContain('redo')

    const acceleratoren = alle
      .map((e) => e.accelerator)
      .filter((a): a is string => typeof a === 'string')
      .map((a) => a.toLowerCase())
    // Kein Accelerator, der Z zusammen mit einer Steuertaste nennt.
    const zMitSteuer = acceleratoren.filter(
      (a) => a.includes('z') && (a.includes('cmd') || a.includes('command') || a.includes('control')),
    )
    expect(zMitSteuer).toEqual([])
  })

  it('die App-Rolle und eine Edit-Gruppe MIT Cut/Copy/Paste/Select All bleiben', () => {
    const alle = alleEintraege(menueVorlage())
    const rollen = alle.map((e) => e.role)
    expect(rollen).toContain('appMenu')
    expect(rollen).toContain('cut')
    expect(rollen).toContain('copy')
    expect(rollen).toContain('paste')
    expect(rollen).toContain('selectAll')
  })

  it('ist rein: derselbe Aufruf liefert zweimal dieselbe Form, ohne Nebenwirkung', () => {
    expect(menueVorlage()).toEqual(menueVorlage())
  })
})
