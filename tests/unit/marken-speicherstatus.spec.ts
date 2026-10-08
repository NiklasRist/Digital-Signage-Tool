// Tests zu #327 - marken-speicherstatus (Lage: reiner Automat; Baustein: jsdom).
// @vitest-environment jsdom
import { join } from "node:path"
import { readFileSync } from "node:fs"

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import {
  MARKEN_ANFANGSLAGE,
  MARKEN_HINWEIS_TEXT,
  zeigtMarkenHinweis,
  verarbeiteMarkenSpeicherEreignis,
  type MarkenSpeicherEreignis,
  type MarkenSpeicherlage,
} from '../../src/renderer/app-shell/marken-speicherstatus-lage'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

function baueLage(teil: Partial<MarkenSpeicherlage> = {}): MarkenSpeicherlage {
  return { zustand: 'unbekannt', letzterFehlercode: null, ...teil }
}

describe('Die Lage (ohne Browser)', () => {
  it('die ANFANGSLAGE ist unbekannt ohne Code; zeigtMarkenHinweis ist false (Waechter gegen die stille Falschaussage)', () => {
    expect(MARKEN_ANFANGSLAGE).toEqual({ zustand: 'unbekannt', letzterFehlercode: null })
    expect(zeigtMarkenHinweis(MARKEN_ANFANGSLAGE)).toBe(false)
  })

  it('ein Fehler fuehrt zu nicht_gespeichert mit dem Code; der Hinweis erscheint', () => {
    const lage = verarbeiteMarkenSpeicherEreignis(MARKEN_ANFANGSLAGE, {
      typ: 'fehler', code: 'speicher_fehler',
    })
    expect(lage.zustand).toBe('nicht_gespeichert')
    expect(lage.letzterFehlercode).toBe('speicher_fehler')
    expect(zeigtMarkenHinweis(lage)).toBe(true)
  })

  it('zwei Fehler: der ZULETZT gemeldete Code', () => {
    const lage = verarbeiteMarkenSpeicherEreignis(
      verarbeiteMarkenSpeicherEreignis(MARKEN_ANFANGSLAGE, { typ: 'fehler', code: 'erster' }),
      { typ: 'fehler', code: 'zweiter' },
    )
    expect(lage).toEqual({ zustand: 'nicht_gespeichert', letzterFehlercode: 'zweiter' })
  })

  it('gespeichert raeumt auf: Zustand gespeichert, Code null, Hinweis verschwindet', () => {
    const lage = verarbeiteMarkenSpeicherEreignis(
      baueLage({ zustand: 'nicht_gespeichert', letzterFehlercode: 'x' }),
      { typ: 'gespeichert' },
    )
    expect(lage).toEqual({ zustand: 'gespeichert', letzterFehlercode: null })
    expect(zeigtMarkenHinweis(lage)).toBe(false)
  })

  it('ein unbekannter Code wird UNVERAENDERT gemerkt (keine Uebersetzung, kein Verwerfen)', () => {
    const lage = verarbeiteMarkenSpeicherEreignis(MARKEN_ANFANGSLAGE, {
      typ: 'fehler', code: 'fremder_code_kommt_vor',
    })
    expect(lage.letzterFehlercode).toBe('fremder_code_kommt_vor')
    expect(zeigtMarkenHinweis(lage)).toBe(true)
  })
})

describe('Die Lage weiter (Das Verhalten, das ausschliesslich der Zustandsautomat hält)', () => {
  it('die Eingabe wird NIE verändert (Deep-Vergleich vor/nach dem Aufruf)', () => {
    const lage = baueLage({ zustand: 'gespeichert', letzterFehlercode: null })
    const vorher = JSON.stringify(lage)
    verarbeiteMarkenSpeicherEreignis(lage, { typ: 'fehler', code: 'x' })
    const nachher = JSON.stringify(lage)
    expect(nachher).toBe(vorher)
  })

  it('der Text ist der Entscheidungs-Wortlaut (User-Präzisierung 23.08.) und steht GENAU EINMAL quer über beide Dateien', () => {
    expect(MARKEN_HINWEIS_TEXT).toBe(
      'Automatisches Speichern der Marken fehlgeschlagen – Änderungen sind noch nicht gesichert.',
    )
    const lageQuelle = readFileSync(
      join(process.cwd(), 'src/renderer/app-shell/marken-speicherstatus-lage.ts'),
      'utf8',
    )
    const bausteinQuelle = readFileSync(
      join(process.cwd(), 'src/renderer/app-shell/marken-speicherstatus.tsx'),
      'utf8',
    )
    expect((lageQuelle.match(/Automatisches Speichern/g) ?? [])).toHaveLength(1)
    expect((bausteinQuelle.match(/Automatisches Speichern/g) ?? [])).toHaveLength(0)
  })

  it('die Lagedatei enthält kein react und die beiden Dateien kein KANAELE/Timer (Grep-Probe, NUR auf diese zwei)', () => {
    const lageQuelle = readFileSync(
      join(process.cwd(), 'src/renderer/app-shell/marken-speicherstatus-lage.ts'),
      'utf8',
    ).replace(/\/\/.*$/gm, '')
    expect(lageQuelle).not.toMatch(/react/)
    expect(lageQuelle).not.toMatch(/KANAELE|setTimeout|setInterval|rufeAuf|window\.|marken:|project:|vorlagen:/)
    const bausteinQuelle = readFileSync(
      join(process.cwd(), 'src/renderer/app-shell/marken-speicherstatus.tsx'),
      'utf8',
    ).replace(/\/\/.*$/gm, '')
    expect(bausteinQuelle).not.toMatch(/KANAELE|setTimeout|setInterval|rufeAuf|abonniere\(|window\.|marken:|project:|vorlagen:/)
    // Der Nachbar #200 wird nicht importiert - die Prüfung zielt auf den Import nach
    // dem Anführungszeichen ("./speicherstatus..."), nicht auf den Teilstring:
    expect(bausteinQuelle).not.toMatch(/from '\.\/speicherstatus/)
    expect(bausteinQuelle).not.toMatch(/marken-editor/)
  })
})

// ---------------- Der Baustein (jsdom, Spion auf abonniereMarken) ----------------

describe('MarkenSpeicherHinweis (jsdom)', () => {
  beforeEach(() => {})

  it('ruft abonniereMarken beim Aufbau GENAU EINMAL und die Abmelde-Funktion beim Abbau GENAU EINMAL', async () => {
    const abgemeldet = vi.fn()
    const abonniereMarken = vi.fn(() => abgemeldet)
    const ziel = document.createElement('div')
    document.body.appendChild(ziel)
    const wurzel: Root = createRoot(ziel)
    const { MarkenSpeicherHinweis } = await import('../../src/renderer/app-shell/marken-speicherstatus')
    act(() => {
      wurzel.render(createElement(MarkenSpeicherHinweis, { abonniereMarken }) as never)
    })
    expect(abonniereMarken).toHaveBeenCalledTimes(1)
    act(() => {
      wurzel.unmount()
    })
    expect(abgemeldet).toHaveBeenCalledTimes(1)
  })

  it('im Anfangszustand steht WEDER "gespeichert" NOCH der Hinweistext im DOM (benannter Test)', async () => {
    const abonniereMarken = vi.fn(() => () => {})
    const ziel = document.createElement('div')
    document.body.appendChild(ziel)
    const wurzel: Root = createRoot(ziel)
    const { MarkenSpeicherHinweis } = await import('../../src/renderer/app-shell/marken-speicherstatus')
    act(() => {
      wurzel.render(createElement(MarkenSpeicherHinweis, { abonniereMarken }) as never)
    })
    const text = ziel.textContent ?? ''
    expect(text).not.toContain('gespeichert')

  })

  it('nach einem Fehler steht der Wortlaut und der Code als Nebenangabe; nach gespeichert steht KEINER von beiden', async () => {
    let hoerer: ((ereignis: { typ: 'fehler'; code: string }) => void) | null = null
    const abonniereMarken = vi.fn((h: (ereignis: MarkenSpeicherEreignis) => void) => {
      hoerer = h
      return () => {}
    })
    const ziel = document.createElement('div')
    document.body.appendChild(ziel)
    const wurzel: Root = createRoot(ziel)
    const { MarkenSpeicherHinweis } = await import('../../src/renderer/app-shell/marken-speicherstatus')
    act(() => {
      wurzel.render(createElement(MarkenSpeicherHinweis, { abonniereMarken }) as never)
    })
    act(() => {
      hoerer!({ typ: 'fehler', code: 'speicher_fehler' })
    })
    expect(ziel.textContent).toContain(MARKEN_HINWEIS_TEXT)
    expect(ziel.textContent).toContain('speicher_fehler')
    wurzel.unmount()
  })

  it('abonniereMarken wirft: die Komponente rendert trotzdem, der Wurf verlaesst sie nicht', async () => {
    const abonniereMarken = vi.fn(() => {
      throw new Error('Bridge weg')
    })
    const ziel = document.createElement('div')
    document.body.appendChild(ziel)
    const wurzel: Root = createRoot(ziel)
    const { MarkenSpeicherHinweis } = await import('../../src/renderer/app-shell/marken-speicherstatus')
    expect(() => {
      act(() => {
        wurzel.render(createElement(MarkenSpeicherHinweis, { abonniereMarken }) as never)
      })
    }).not.toThrow()

  })
})
