// Reine Tests zu #202 - die Auswahlregel (asset-auswahl-filter.ts).
// Keine Browser-Umgebung noetig: Die Datei enthaelt kein JSX und keinen React-Import.
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import type { Asset } from '../../src/shared/contracts/asset'
import type { Listenelement } from '../../src/shared/contracts/project'
import {
  benoetigterAssetTyp,
  waehlbareAssets,
} from '../../src/renderer/app-shell/asset-auswahl-filter'

const QUELLE = readFileSync(
  new URL('../../src/renderer/app-shell/asset-auswahl-filter.ts', import.meta.url),
  'utf8',
)

function asset(id: string, typ: 'video' | 'bild', zustand: 'ok' | 'fehlt' = 'ok'): Asset {
  return {
    id,
    typ,
    dateiname: `${id}.mp4`,
    originalname: `medium-${id}`,
    maße: { breite: 1920, höhe: 1080 },
    dauer: typ === 'video' ? 12.5 : null,
    importdatum: '2026-08-01T10:00:00Z',
    zustand,
  }
}

function element(art: Listenelement['art'], ref = 'x'): Listenelement {
  return { id: 'e1', art, ref, dauer: null, trimStart: null, trimEnde: null, einblendung: null }
}

describe('benoetigterAssetTyp (#202)', () => {
  it("liefert 'video' für art: 'video'", () => {
    expect(benoetigterAssetTyp(element('video'))).toBe('video')
  })

  it("liefert null für art: 'segment' - dort ist die Referenz eine Aktions-ID (#203)", () => {
    expect(benoetigterAssetTyp(element('segment'))).toBeNull()
  })

  it("ordnet ein (nur runtime moegliches) art: 'bild' auf 'bild' - Bestandsdaten, die TypeScript nicht prueft", () => {
    // Die Vertragsdatei kennt 'bild' nicht mehr (TK v3.16); ein Bestandsdatensatz
    // kann den Namen aber noch tragen. Bestandsreihenfolge: same as before.
    const alt = { ...element('video'), art: 'bild' as unknown as Listenelement['art'] }
    expect(benoetigterAssetTyp(alt)).toBe('bild')
  })
})

describe('waehlbareAssets (#202)', () => {
  it("laesst Assets mit zustand: 'fehlt' WEG - auch wenn ihr Typ passt", () => {
    const eingabe = [asset('a-ok', 'video'), asset('a-fehlt', 'video', 'fehlt')]
    expect(waehlbareAssets(eingabe, 'video').map((a) => a.id)).toEqual(['a-ok'])
  })

  it("laesst Assets des ANDEREN Typs weg", () => {
    const eingabe = [asset('v1', 'video'), asset('b1', 'bild'), asset('v2', 'video')]
    expect(waehlbareAssets(eingabe, 'bild').map((a) => a.id)).toEqual(['b1'])
    expect(waehlbareAssets(eingabe, 'video').map((a) => a.id)).toEqual(['v1', 'v2'])
  })

  it('erhaelt die Bestandsreihenfolge (bewusst unsortiert) und veraendert die Eingabe nicht', () => {
    const eingabe = [asset('c3', 'bild'), asset('a1', 'bild'), asset('b2', 'bild')]
    const ergebnis = waehlbareAssets(eingabe, 'bild')
    expect(ergebnis.map((a) => a.id)).toEqual(['c3', 'a1', 'b2'])
    expect(eingabe.map((a) => a.id)).toEqual(['c3', 'a1', 'b2'])
  })

  it('leere Eingabe -> leeres Array, kein Wurf', () => {
    expect(waehlbareAssets([], 'video')).toEqual([])
  })
})

describe('Quelldatei-Verbote (Grep)', () => {
  it('enthaelt kein JSX und keinen react-Import', () => {
    expect(QUELLE).not.toContain('react')
    expect(QUELLE).not.toMatch(/<[A-Za-z]/)
  })
})
