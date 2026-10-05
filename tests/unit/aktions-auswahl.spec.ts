// Reine Tests zu #203 - die Auswahlregel (aktions-auswahl-filter.ts).
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Asset } from '../../src/shared/contracts/asset'
import {
  istAktionBrauchbar,
  waehlbareAktionen,
} from '../../src/renderer/app-shell/aktions-auswahl-filter'

const QUELLE = readFileSync(
  new URL('../../src/renderer/app-shell/aktions-auswahl-filter.ts', import.meta.url),
  'utf8',
)

function asset(id: string, zustand: 'ok' | 'fehlt' = 'ok'): Asset {
  return {
    id,
    typ: 'bild',
    dateiname: `${id}.png`,
    originalname: `bild-${id}`,
    maße: { breite: 1920, höhe: 1080 },
    dauer: null,
    importdatum: '2026-08-01T10:00:00Z',
    zustand,
  }
}

function aktion(id: string, bildRef: string | null): Aktion {
  return {
    id,
    titel: `Aktion ${id}`,
    beschreibung: null,
    preis: null,
    bildRef,
    cta: null,
    standardDauer: null,
    vorlagenId: 'vollbild',
    markeId: 'm1',
    akzentfarbe: null,
  }
}

const assets = [asset('bild-ok'), asset('bild-fehlt', 'fehlt')]
const aktionen = [aktion('a-leer', null), aktion('a-ok', 'bild-ok'), aktion('a-kaputt', 'bild-fehlt'), aktion('a-unbekannt', 'none')]

describe('istAktionBrauchbar (#203)', () => {
  it('liefert true für bildRef: null (Aktion ohne Bild ist gültig)', () => {
    expect(istAktionBrauchbar(aktion('a-leer', null), assets)).toBe(true)
  })

  it("liefert true, wenn bildRef auf ein Asset mit zustand 'ok' zeigt", () => {
    expect(istAktionBrauchbar(aktion('a-ok', 'bild-ok'), assets)).toBe(true)
  })

  it("liefert false, wenn das Asset 'fehlt' hat", () => {
    expect(istAktionBrauchbar(aktion('a-kaputt', 'bild-fehlt'), assets)).toBe(false)
  })

  it('liefert false, wenn das Asset in assets gar nicht vorkommt', () => {
    expect(istAktionBrauchbar(aktion('a-unbekannt', 'none'), assets)).toBe(false)
  })

  it('prüft den Asset-Typ NICHT (das tut der action-editor beim Setzen)', () => {
    // Eine Aktion mit bildRef auf ein VIDEO-Asset: brauchbar laut dieser Regel.
    const video = { ...asset('vid'), typ: 'video' as const, dauer: 3 }
    expect(istAktionBrauchbar(aktion('a-video', 'vid'), [video])).toBe(true)
  })
})

describe('waehlbareAktionen (#203)', () => {
  it('nimmt die ausgeschlossen-Kennung heraus und kaputte Aktionen, in Bestandsreihenfolge, unveränderte Eingaben', () => {
    const originalAkt = [...aktionen]
    const originalAssets = [...assets]
    const ergebnis = waehlbareAktionen(aktionen, assets, 'a-ok')
    expect(ergebnis.map((a) => a.id)).toEqual(['a-leer'])
    expect(aktionen).toEqual(originalAkt)
    expect(assets).toEqual(originalAssets)
  })

  it('ausgeschlossen: null filtert nichts zusätzlich', () => {
    expect(
      waehlbareAktionen(aktionen, assets, null).map((a) => a.id),
    ).toEqual(['a-leer', 'a-ok'])
  })
})

describe('Quelldatei-Verbote (Grep)', () => {
  it('enthaelt kein JSX und keinen react-Import', () => {
    expect(QUELLE).not.toContain('react')
    expect(QUELLE).not.toMatch(/<[a-z]/)
  })
})
