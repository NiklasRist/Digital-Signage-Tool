// Verhaltenstests zu #200 - die Anzeige (speicherstatus.tsx, jsdom).
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement } from 'react'

import type { SpeicherEreignis, Speicherlage } from '../../src/renderer/app-shell/speicherstatus-lage'
import { SpeicherHinweis, holeSpeicherlage } from '../../src/renderer/app-shell/speicherstatus.tsx'


// React 19: act(...)
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

// ---------------- Bausteine ----------------

type Abo = {
  hoerer: (ereignis: SpeicherEreignis) => void
  abgemeldet: ReturnType<typeof vi.fn<() => void>>
}

function baueAbo(): (hoerer: (ereignis: SpeicherEreignis) => void) => () => void {
  return (hoerer) => {
    const abgemeldet = vi.fn<() => void>(() => undefined)
    abos.push({ hoerer, abgemeldet })
    return abgemeldet
  }
}

const abos: Abo[] = []

let behaelter: HTMLDivElement | null = null
let wurzel: Root | null = null

function aboProjekt(): (hoerer: (e: SpeicherEreignis) => void) => () => void {
  return baueAbo()
}
function aboVorlagen(): (hoerer: (e: SpeicherEreignis) => void) => () => void {
  return baueAbo()
}
function aboWirft(): (hoerer: (e: SpeicherEreignis) => void) => () => void {
  return () => {
    throw new Error('Abo kaputt')
  }
}

beforeEach(() => {
  abos.splice(0)
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  wurzel = createRoot(behaelter)
})

afterEach(() => {
  act(() => {
    wurzel?.unmount()
  })
  behaelter?.remove()
  behaelter = null
  wurzel = null
})

function zeige(
  eigenschaften: Partial<Parameters<typeof SpeicherHinweis>[0]> = {},
): void {
  const voll: Parameters<typeof SpeicherHinweis>[0] = {
    abonniereProjekt: aboProjekt(),
    abonniereVorlagen: aboVorlagen(),
    ...eigenschaften,
  }
  const element = createElement(SpeicherHinweis, voll)
  act(() => {
    wurzel?.render(element as ReactElement)
  })
}

function sendeAn(stelle: number, ereignis: SpeicherEreignis): void {
  abos[stelle]?.hoerer(ereignis)
}

// ---------------- Tests ----------------

describe('SpeicherHinweis (#200) - Anfangszustand', () => {
  it('zeigt NICHTS: weder "gespeichert" noch "nicht gespeichert" im DOM', () => {
    zeige()
    expect(behaelter?.textContent ?? '').not.toContain('gespeichert')
    expect(behaelter?.querySelector('[data-testid=speicherhinweis]')).toBeNull()
  })

  it('ruft jede Abo-Funktion GENAU EINMAL beim Aufbau, Abmeldung beim Abbau', () => {
    zeige()
    expect(abos).toHaveLength(2)
    act(() => {
      wurzel?.unmount()
    })
    expect(abos[0]?.abgemeldet).toHaveBeenCalledTimes(1)
    expect(abos[1]?.abgemeldet).toHaveBeenCalledTimes(1)
  })

  it('wirft eine Abo-Funktion -> die andere wird trotzdem angemeldet, die Komponente rendert', () => {
    expect(() =>
      zeige({ abonniereProjekt: aboWirft(), abonniereVorlagen: aboVorlagen() }),
    ).not.toThrow()
    expect(abos).toHaveLength(1) // nur das Vorlagen-Abo
  })
})

describe('SpeicherHinweis (#200) - Ereignisfluss', () => {
  it('Fehler am projektabo -> dauerhafter Hinweis mit dem Code; die Vorlagen unberuehrt', () => {
    zeige()
    act(() => {
      sendeAn(0, { typ: 'fehler', code: 'speicher_fehler' })
    })
    const hinweis = behaelter?.querySelector('[data-testid=speicherhinweis]')
    expect(hinweis?.textContent).toContain('Änderungen nicht gespeichert')
    expect(hinweis?.textContent).toContain('das Projekt')
    expect(hinweis?.textContent).toContain('speicher_fehler')
  })

  it('gespeichert derselben Quelle -> der Hinweis verschwindet', () => {
    zeige()
    act(() => {
      sendeAn(0, { typ: 'fehler', code: 'x' })
    })
    expect(behaelter?.querySelector('[data-testid=speicherhinweis]')).not.toBeNull()
    act(() => {
      sendeAn(0, { typ: 'gespeichert' })
    })
    expect(behaelter?.querySelector('[data-testid=speicherhinweis]')).toBeNull()
  })

  it("gespeichert von der ANDEREN Quelle - der Hinweis bleibt", () => {
    zeige()
    act(() => {
      sendeAn(0, { typ: 'fehler', code: 'x' })
      sendeAn(1, { typ: 'gespeichert' })
    })
    expect(behaelter?.querySelector('[data-testid=speicherhinweis]')).not.toBeNull()
    expect(behaelter?.textContent).toContain('das Projekt')
  })

  it('zwei Fehler -> letzter Code', () => {
    zeige()
    act(() => {
      sendeAn(0, { typ: 'fehler', code: 'erster' })
      sendeAn(0, { typ: 'fehler', code: 'zweiter' })
    })
    expect(holeSpeicherlage().projekt.letzterFehlercode).toBe('zweiter')
  })

  it('beide Quellen -> EIN Satz, mit Komma getrennt, je Quelle Ort und Code', () => {
    // Die Aufzaehlung ist der sichtbare Text: Ort, Code, Komma. Ein anderes
    // Verbindungswort macht aus der Liste zwei Behauptungen.
    zeige()
    act(() => {
      sendeAn(0, { typ: 'fehler', code: 'p-code' })
      sendeAn(1, { typ: 'fehler', code: 'v-code' })
    })
    const text = behaelter?.querySelector('[data-testid=speicherhinweis]')?.textContent ?? ''
    expect(text).toContain('das Projekt (p-code), die Vorlagen (v-code).')
  })

  it('holeSpeicherlage bleibt mit dem Modul-Zustand synchron (Anzeige außerhalb möglich)', () => {
    // Der Modul-Zustand überlebt Tests (EIN Modul); ein Abo braucht einen Mount.
    zeige()
    expect(holeSpeicherlage().projekt.letzterFehlercode).not.toBe('sync_probe')
    act(() => {
      sendeAn(0, { typ: 'fehler', code: 'sync_probe' })
    })
    expect(holeSpeicherlage().projekt.zustand).toBe('nicht_gespeichert')
    expect(holeSpeicherlage().projekt.letzterFehlercode).toBe('sync_probe')
  })
})
