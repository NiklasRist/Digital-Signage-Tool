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
})
