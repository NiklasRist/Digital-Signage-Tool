// Verhaltenstests zu #140 - live-vorschau.ts.
// Die Identität statt Determinismus: zeichneVorschau reichte zeichneSegment UNVERAENDERT
// weiter. Das Prüfen der Pixel wäre der falsche Weg - ein Pixel-Test prüfte #117 fremden
// Code und bliebe grün, wenn diese Datei heimlich ein zweites Canvas dazwischein- schiebe.
import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Asset } from '../../src/shared/contracts/asset';
import type { Marke } from '../../src/shared/contracts/marke'

vi.mock('../../src/renderer/template-canvas/schriften', () => ({ stelleSchriftenBereit: vi.fn(async () => undefined) }))
vi.mock('../../src/renderer/template-canvas/logo-laden', () => ({ bereiteLogoVor: vi.fn(async () => undefined) }))
vi.mock('../../src/renderer/template-canvas/bild-laden', () => ({ bereiteMotiveVor: vi.fn(async () => undefined) }))
const bibliothekDoppel = vi.hoisted(() => ({ findeBildAsset: vi.fn() }))
vi.mock('../../src/renderer/action-editor/bibliothek', () => ({ findeBildAsset: bibliothekDoppel.findeBildAsset }))
vi.mock('../../src/renderer/template-canvas/zeichne-segment', () => ({ zeichneSegment: vi.fn(() => ENTWURFSBILD) }))

import { stelleSchriftenBereit } from '../../src/renderer/template-canvas/schriften'
import { bereiteLogoVor } from '../../src/renderer/template-canvas/logo-laden'
import { bereiteMotiveVor } from '../../src/renderer/template-canvas/bild-laden'
import { findeBildAsset } from '../../src/renderer/action-editor/bibliothek'

import { zeichneSegment } from '../../src/renderer/template-canvas/zeichne-segment'
import { bereiteVorschauVor, zeichneVorschau } from '../../src/renderer/action-editor/live-vorschau'

// Quelldatei-Verbote
const QUELLE = readFileSync(
  new URL('../../src/renderer/action-editor/live-vorschau.ts', import.meta.url).pathname,
  'utf8',
)

const ENTWURFSBILD = { canvas: { style: {} }, breite: 1920, höhe: 1080 } as never

const AKTION = (): Aktion => ({
  id: 'a-1',
  titel: 'Sommeraktion',
  beschreibung: null,
  preis: null,
  bildRef: 'asset-1',
  cta: null,
  standardDauer: null,
  vorlagenId: 'vollbild',
  akzentfarbe: null,
})

const marke = (): Marke => ({
  farben: {} as Record<string, string>,
  schriften: {
    headlineElegant: { familie: 'P', gewicht: 700, datei: 'P.woff2' },
    headlinePlakativ: { familie: 'A', gewicht: 900, datei: 'A.woff2' },
    fliesstext: { familie: 'R', gewicht: 400, datei: 'R.woff2' },
    fliesstextFett: { familie: 'B', gewicht: 700, datei: 'B.woff2' },
  },
  logo: { datei: 'logo.png', seitenverhaeltnis: 3.5 },
  sicherheit: { horizontal: 96, vertikal: 54 },
  radien: { pille: 40, karte: 10, klein: 2 },
  schatten: { versatzY: 4, weichzeichnen: 8, farbe: '#00000040' },
  slogan: { text: 'x', aktiv: false },
})

beforeEach(() => {
  bibliothekDoppel.findeBildAsset.mockClear()
  bibliothekDoppel.findeBildAsset.mockImplementation(() => null)
})

describe("bereiteVorschauVor (#140)", () => {
  it("ruft Schriften, Logo und Motive in dieser Reihenfolge; die Motive per ASSET-ID", async () => {
    bibliothekDoppel.findeBildAsset.mockImplementationOnce(((ref: string) => ({ id: ref, typ: 'bild', dateiname: 'a.png', originalname: 'a', maße: { breite: 2, höhe: 2 }, dauer: null, importdatum: 'x', zustand: 'ok' })) as never)
    await bereiteVorschauVor('p-1', [AKTION()], [{ id: 'asset-1', typ: 'bild', dateiname: 'a.png', originalname: 'a', maße: { breite: 2, höhe: 2 }, dauer: null, importdatum: 'x', zustand: 'ok' } as Asset], marke())
    expect(vi.mocked(stelleSchriftenBereit)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(bereiteLogoVor)).toHaveBeenCalledWith(marke())
    expect(vi.mocked(bereiteMotiveVor)).toHaveBeenCalledWith('p-1', [
      { schluessel: 'asset-1', dateiname: 'a.png' },
    ])
  })

  it("bilRef null oder ein unresolviertes Asset -> kein Motiv-Eintrag", async () => {
    const ohneBild = { ...AKTION(), bildRef: null }
    await bereiteVorschauVor('p-1', [ohneBild], [], marke())
    expect(vi.mocked(bereiteMotiveVor)).toHaveBeenLastCalledWith('p-1', [])
  })
})

describe("zeichneVorschau (#140)", () => {
  it("ist EIN Weiterreichen: das zurückgegebene Objekt ist das von zeichneSegment (Identität, kein zweiter Pfad)", () => {
    const vorlage = { id: 'vollbild' } as never
    const bild = zeichneVorschau(AKTION(), vorlage, marke())
    expect(bild).toBe(ENTWURFSBILD)
    expect(vi.mocked(zeichneSegment)).toHaveBeenCalledWith(AKTION(), vorlage, marke())
  })
})
