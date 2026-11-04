// Der Auftrag „diese Aktion ins Video" (04.11.2026): Der Aktions-Editor kann nicht
// platzieren - er stellt den Auftrag, der Composer fuehrt ihn aus. Geprueft wird der
// Speicher selbst: genau einmal, keine leere Kennung, Abmelden wirkt.

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  aufInsVideoAuftrag,
  holeInsVideoAuftrag,
  loescheInsVideoAuftrag,
  merkeInsVideoAuftrag,
} from '../../src/renderer/gemeinsam/aktion-ins-video'

beforeEach(() => {
  loescheInsVideoAuftrag()
})

describe('aktion-ins-video', () => {
  it('merkt sich die Kennung und meldet sie genau einmal', () => {
    const gehoert = vi.fn()
    const abmelden = aufInsVideoAuftrag(gehoert)
    merkeInsVideoAuftrag('a1')
    expect(holeInsVideoAuftrag()).toBe('a1')
    expect(gehoert).toHaveBeenCalledTimes(1)
    expect(gehoert).toHaveBeenCalledWith('a1')
    abmelden()
  })

  it('eine leere Kennung wird verworfen - sie kann nie treffen', () => {
    const gehoert = vi.fn()
    const abmelden = aufInsVideoAuftrag(gehoert)
    merkeInsVideoAuftrag('   ')
    expect(holeInsVideoAuftrag()).toBeNull()
    expect(gehoert).not.toHaveBeenCalled()
    abmelden()
  })

  it('loeschen nimmt den Auftrag zurueck, ohne einen Hoerer zu rufen', () => {
    const gehoert = vi.fn()
    const abmelden = aufInsVideoAuftrag(gehoert)
    merkeInsVideoAuftrag('a1')
    gehoert.mockClear()
    loescheInsVideoAuftrag()
    expect(holeInsVideoAuftrag()).toBeNull()
    expect(gehoert).not.toHaveBeenCalled()
    abmelden()
  })

  it('nach dem Abmelden kommt nichts mehr an', () => {
    const gehoert = vi.fn()
    aufInsVideoAuftrag(gehoert)()
    merkeInsVideoAuftrag('a1')
    expect(gehoert).not.toHaveBeenCalled()
    // Der Auftrag selbst liegt trotzdem - er ist nicht an den Hoerer gebunden.
    expect(holeInsVideoAuftrag()).toBe('a1')
  })
})
