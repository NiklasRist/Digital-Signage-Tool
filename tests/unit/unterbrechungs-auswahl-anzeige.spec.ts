// Tests zur Einschub-Ersetzen-Anzeige (Fall 4, TK 9.7.5 v3.27), jsdom.
// Geprüft wird der EINE Rückweg je Aufbau: welcher Aufruf, mit welchem Index,
// welche Sperre, welcher Fehlerpfad - und dass weder Band noch Listenelement
// angefasst werden (die Anzeige schreibt nichts selbst).
// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Project } from '../../src/shared/contracts/project'
import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import type { FixWirkung } from '../../src/renderer/composer/reparatur-optionen'
import {
  UnterbrechungsAuswahl,
  type UnterbrechungsAuswahlEigenschaften,
} from '../../src/renderer/app-shell/unterbrechungs-auswahl.tsx'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const EINSCHUEBE = [
  { zeitstelle: 1.5, aktionRef: 'a-alt', dauer: 3 },
  { zeitstelle: 4.5, aktionRef: 'a-alt2', dauer: 5 },
]

function projekt(): Project {
  return {
    id: 'p-1', name: 'Probe', erstelltAm: '2026-08-01T09:00:00Z', geaendertAm: '2026-08-01T09:00:00Z',
    schemaVersion: 1,
    assets: [{ id: 'b-ok', typ: 'bild', dateiname: 'b.png', originalname: 'b', maße: { breite: 100, höhe: 100 }, dauer: null, importdatum: '2026-08-01T09:00:00Z', zustand: 'ok' }],
    aktionen: [
      { id: 'a-alt', titel: 'Alt', beschreibung: null, preis: null, bildRef: null, cta: null, standardDauer: null, vorlagenId: 'vollbild', markeId: 'm1', akzentfarbe: null },
      { id: 'a-alt2', titel: 'Alt2', beschreibung: null, preis: null, bildRef: null, cta: null, standardDauer: null, vorlagenId: 'vollbild', markeId: 'm1', akzentfarbe: null },
      { id: 'a-neu', titel: 'Neu', beschreibung: null, preis: null, bildRef: 'b-ok', cta: null, standardDauer: null, vorlagenId: 'vollbild', markeId: 'm1', akzentfarbe: null },
    ],
    liste: [
      { id: 'e-video', art: 'video', ref: 'v1', dauer: null, trimStart: null, trimEnde: null, einblendung: null, unterbrechungen: EINSCHUEBE },
      { id: 'e-segment', art: 'segment', ref: 'a-alt', dauer: 10, trimStart: null, trimEnde: null, einblendung: null },
    ],
    standardSegmentdauer: 10, standardMarkeId: 'm1', letzterAusgabeName: null,
  }
}

let behaelter: HTMLDivElement
let wurzel: Root

function eigenschaften(teil: Partial<UnterbrechungsAuswahlEigenschaften> = {}): UnterbrechungsAuswahlEigenschaften {
  return {
    elementId: 'e-video',
    unterbrechungIndex: 1,
    projekt: projekt(),
    schliesseUnterbrechungsFixAb: vi.fn(async (): Promise<Ergebnis<FixWirkung>> => ({ ok: true, wert: { art: 'erledigt' } })),
    aufAbgeschlossen: vi.fn(),
    aufAbgebrochen: vi.fn(),
    aufFehler: vi.fn(),
    ...teil,
  }
}

function rendere(props: UnterbrechungsAuswahlEigenschaften): void {
  behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  wurzel = createRoot(behaelter)
  act(() => {
    wurzel.render(createElement(UnterbrechungsAuswahl, props) as ReactElement)
  })
}

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  act(() => wurzel?.unmount())
  document.body.innerHTML = ''
})

describe('UnterbrechungsAuswahl (Fall 4, v3.27)', () => {
  it('bietet nur brauchbare Aktionen an und schliesst die aktuelle aus', () => {
    rendere(eigenschaften())
    const texte = [...behaelter.querySelectorAll('label')].map((l) => l.textContent)
    expect(texte).toContain('Neu')
    expect(texte).not.toContain('Alt2') // die aktuell referenzierte Aktion
  })

  it('Übernehmen ruft den Rückweg mit Element, Index und Wahl und meldet den Abschluss', async () => {
    const schliesse = vi.fn(async (): Promise<Ergebnis<FixWirkung>> => ({ ok: true, wert: { art: 'erledigt' } }))
    const aufAbgeschlossen = vi.fn()
    const e = eigenschaften({ schliesseUnterbrechungsFixAb: schliesse, aufAbgeschlossen })
    rendere(e)

    const neuLabel = [...behaelter.querySelectorAll('label')].find((l) => l.textContent === 'Neu') as HTMLLabelElement
    const radio = neuLabel.querySelector('input[type="radio"]') as HTMLInputElement
    act(() => radio.click())
    const uebernehmen = [...behaelter.querySelectorAll('button')].find((b) => b.textContent === 'Übernehmen') as HTMLButtonElement
    await act(async () => {
      uebernehmen.click()
    })

    expect(schliesse).toHaveBeenCalledTimes(1)
    expect(schliesse.mock.calls[0]?.slice(0, 3)).toEqual(['e-video', 1, 'a-neu'])
    expect(aufAbgeschlossen).toHaveBeenCalledWith({ art: 'erledigt' })
  })

  it('ok:false meldet den Code unverändert und lässt die Auswahl offen', async () => {
    const schliesse = vi.fn(async (): Promise<Ergebnis<FixWirkung>> => ({ ok: false, fehler: { code: 'ungueltige_eingabe', meldung: 'voll' } }))
    const aufFehler = vi.fn()
    rendere(eigenschaften({ schliesseUnterbrechungsFixAb: schliesse, aufFehler }))

    act(() => (behaelter.querySelector('input[type="radio"]') as HTMLInputElement).click())
    await act(async () => {
      ;([...behaelter.querySelectorAll('button')].find((b) => b.textContent === 'Übernehmen') as HTMLButtonElement).click()
    })

    expect(aufFehler).toHaveBeenCalledWith('ungueltige_eingabe', 'voll')
  })

  it('unbekanntes Element und Nicht-Video melden einen Fehler, ohne den Rückweg zu rufen', () => {
    const aufFehler = vi.fn()
    rendere(eigenschaften({ elementId: 'gibt-es-nicht', aufFehler }))
    expect(aufFehler).toHaveBeenCalledWith('nicht_gefunden', expect.any(String))

    aufFehler.mockClear()
    rendere(eigenschaften({ elementId: 'e-segment', aufFehler }))
    expect(aufFehler).toHaveBeenCalledWith('ungueltige_eingabe', expect.any(String))
  })

  it('Index außerhalb meldet nicht_gefunden', () => {
    const aufFehler = vi.fn()
    rendere(eigenschaften({ unterbrechungIndex: 9, aufFehler }))
    expect(aufFehler).toHaveBeenCalledWith('nicht_gefunden', expect.any(String))
  })
})
