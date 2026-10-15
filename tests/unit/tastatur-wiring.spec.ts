// @vitest-environment jsdom
// Verhaltenstests zu #350 - tastatur.ts (E11): die Kuerzel werden registriert
// und abgebaut; unverdrahtete Tasten werden NICHT abgefangen.
//
// Die echten Kuelle (src/renderer/app-shell/tastatur.ts) laufen; die Vorgaben
// sind Spione.
import { describe, expect, it, vi } from 'vitest'

import { registriereTastaturHandler } from '../../src/renderer/app-shell/tastatur'

function taste(zusammensetzung: { key: string; ctrl?: boolean; meta?: boolean; shift?: boolean }): KeyboardEvent {
  const ereignis = new KeyboardEvent('keydown', {
    key: zusammensetzung.key,
    ctrlKey: zusammensetzung.ctrl ?? false,
    metaKey: zusammensetzung.meta ?? false,
    shiftKey: zusammensetzung.shift ?? false,
    cancelable: true,
  })
  document.dispatchEvent(ereignis)
  return ereignis
}

describe('tastatur (#350)', () => {
  it('Ctrl/Cmd+Z ruft rueckgaengig; Shift ruft wiederherstellen; beide verhindern die Standardwirkung', () => {
    const vorgaben = {
      rueckgaengig: vi.fn(),
      wiederherstellen: vi.fn(),
    }
    const abmelden = registriereTastaturHandler(vorgaben)

    const z = taste({ key: 'z', ctrl: true })
    expect(z.defaultPrevented).toBe(true)
    expect(vorgaben.rueckgaengig).toHaveBeenCalledTimes(1)
    expect(vorgaben.wiederherstellen).not.toHaveBeenCalled()

    const grossz = taste({ key: 'Z', meta: true, shift: true })
    expect(grossz.defaultPrevented).toBe(true)
    expect(vorgaben.wiederherstellen).toHaveBeenCalledTimes(1)

    abmelden()
  })

  it('ohne Vorgabe fuer Space wird Space NICHT abgefangen (kein preventDefault, kein Ruf)', () => {
    const vorgaben = { rueckgaengig: vi.fn() }
    const abmelden = registriereTastaturHandler(vorgaben)

    const leertaste = taste({ key: ' ' })
    expect(leertaste.defaultPrevented).toBe(false)
    expect(vorgaben.rueckgaengig).not.toHaveBeenCalled()

    abmelden()
  })

  it('der Abbau nimmt die Kuerzel zurueck - danach passieren die Knoepfe nichts mehr', () => {
    const vorgaben = { rueckgaengig: vi.fn() }
    const abmelden = registriereTastaturHandler(vorgaben)
    abmelden()

    taste({ key: 'z', ctrl: true })
    expect(vorgaben.rueckgaengig).not.toHaveBeenCalled()
  })

  it('Cmd+Z in einem Textfeld loest NICHT das Projekt-Undo aus (natives Feld-Undo, #431)', () => {
    const vorgaben = { rueckgaengig: vi.fn(), wiederherstellen: vi.fn() }
    const abmelden = registriereTastaturHandler(vorgaben)
    const feld = document.createElement('input')
    document.body.appendChild(feld)

    const ereignis = new KeyboardEvent('keydown', {
      key: 'z',
      metaKey: true,
      cancelable: true,
      bubbles: true,
    })
    feld.dispatchEvent(ereignis)

    // Kein Projekt-Undo und KEIN preventDefault - das Feld behaelt seine Tipp-Undo.
    expect(vorgaben.rueckgaengig).not.toHaveBeenCalled()
    expect(vorgaben.wiederherstellen).not.toHaveBeenCalled()
    expect(ereignis.defaultPrevented).toBe(false)

    feld.remove()
    abmelden()
  })
})
