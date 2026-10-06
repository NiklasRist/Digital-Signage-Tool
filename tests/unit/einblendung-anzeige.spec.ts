// Tests zu #219 - einblendung.tsx (die Anzeige, jsdom).
//
// Video (#216) und Segment (#217) werden durch Stpies mit sichtbaren
// Stellvertretern ersetzt, damit die DOM-Reihenfolge pruefbar ist. Geprueft
// wird NUR, was Einblendung selbst tut: Video vollflaechig OHNE
// rahmen/hintergrund (ENTSCHIEDEN 3), Segment bei y = bandY und OHNE
// Groessenangabe, nichts hinter dem Band (ENTSCHIEDEN 4), die beiden
// Leerfaelle (ENTSCHIEDEN 5), und dass berechneBandGeometrie (#239) GENAU
// EINmal je Aufruf laeuft.
// @vitest-environment jsdom
import { join } from 'node:path'
import { readFileSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Vorlage } from '../../src/shared/contracts/vorlage'
import type { Marke } from '../../src/shared/contracts/marke'

const doppel = vi.hoisted(() => ({
  videoAufrufe: [] as Array<Record<string, unknown>>,
  segmentAufrufe: [] as Array<Record<string, unknown>>,
  geometrieAufrufe: [] as number[],
}))

vi.mock('../../src/renderer/preview-player/video', () => ({
  Video: (props: Record<string, unknown>) => {
    doppel.videoAufrufe.push(props)
    return createElement('div', { 'data-testid': 'stellvertreter-video' })
  },
}))

vi.mock('../../src/renderer/preview-player/segment', () => ({
  Segment: (props: Record<string, unknown>) => {
    doppel.segmentAufrufe.push(props)
    return createElement('div', { 'data-testid': 'stellvertreter-segment' })
  },
}))

// Die echte Rechnung bleibt stehen; nur der Aufruf wird GEZAEHLT.
vi.mock('../../src/shared/band-geometrie', async (importOriginal) => {
  const echt = await importOriginal<typeof import('../../src/shared/band-geometrie')>()
  return {
    ...echt,
    berechneBandGeometrie: (höhe: number) => {
      doppel.geometrieAufrufe.push(höhe)
      return echt.berechneBandGeometrie(höhe)
    },
  }
})

// React 19: act(...)-Umgebung (Muster wie video-anzeige.spec.ts).
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const { Einblendung } = await import('../../src/renderer/preview-player/einblendung.tsx')
type EinblendungProps = import(
  '../../src/renderer/preview-player/einblendung.tsx'
).EinblendungProps

const QUELLE_TSX = readFileSync(
  join(process.cwd(), 'src/renderer/preview-player/einblendung.tsx'),
  'utf8',
)
const QUELLE_TS = readFileSync(
  join(process.cwd(), 'src/renderer/preview-player/einblendung-stile.ts'),
  'utf8',
)

const codeOhneKommentare = (quelle: string): string =>
  quelle
    .split('\n')
    .filter((z) => {
      const t = z.trim()
      return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
    })
    .join('\n')

describe('Quelldatei-Verbote (Grep-Probe, auf beide Dateien)', () => {
  it('keine Hexzahl, keine Farbe, keine Deckkraft, kein Filter, keine Markenfarbe, kein Split-Import, kein IPC', () => {
    const code = codeOhneKommentare(QUELLE_TSX) + codeOhneKommentare(QUELLE_TS)
    for (const verbot of [
      '#', 'rgb(', 'flaecheDunkel', 'loeseFarbe', 'opacity', 'filter',
      'main/', 'split-stile', 'setInterval', 'requestAnimationFrame',
      'media://', 'rufeAuf', 'abonniere', 'window.api',
      'videoBreite', 'videoVersatz', 'rahmen',
    ]) {
      expect(code).not.toContain(verbot)
    }
  })
})

// ---------------- Bausteine ----------------

function baueAktion(): Aktion {
  return {
    id: 'a-1', titel: 'Sommeraktion', beschreibung: null, preis: null,
    bildRef: null, cta: null, standardDauer: null, vorlagenId: 'v-1',
    markeId: 'm1', akzentfarbe: null,
  }
}

function baueVorlage(höhe: number | null): Vorlage {
  return {
    id: 'v-2', name: 'Einblendung', art: 'einblendung', höhe,
    parent: null, eingebaut: true, zonen: [],
  }
}

function baueMarke(): Marke {
  return {
    id: 'm1', name: 'Probe', parent: null, eingebaut: true,
    farben: null as never, schriften: null as never, logo: null as never,
    sicherheit: { horizontal: 96, vertikal: 54 }, radien: null as never,
    schatten: null as never, slogan: null as never, herkunftJeFeld: null as never,
  }
}

function eigenschaften(teil: Partial<EinblendungProps> = {}): EinblendungProps {
  return {
    projektId: 'p-1',
    dateiname: 'probe.mp4',
    assetId: 'asset-1',
    trimStart: 3,
    trimEnde: 11,
    lokalerFrame: 60,
    laeuft: true,
    marke: baueMarke(),
    bandVorlage: baueVorlage(162),
    bandAktion: baueAktion(),
    ...teil,
  }
}

function rendere(props: EinblendungProps): { behaelter: HTMLDivElement; wurzel: Root; fertig: () => void } {
  const ziel = document.createElement('div')
  document.body.appendChild(ziel)
  const wurzel: Root = createRoot(ziel)
  act(() => {
    wurzel.render(createElement(Einblendung, props))
  })
  return { behaelter: ziel, wurzel, fertig: () => act(() => wurzel.unmount()) }
}

beforeEach(() => {
  doppel.videoAufrufe = []
  doppel.segmentAufrufe = []
  doppel.geometrieAufrufe = []
})

afterEach(() => {
  document.body.innerHTML = ''
})

// ---------------- das Video ----------------

describe('Das Video bleibt vollflaechig (ENTSCHIEDEN 3)', () => {
  it('Video bekommt die sieben Parameter UNVERAENDERT - aber WEDER rahmen NOCH hintergrund', () => {
    rendere(eigenschaften())
    expect(doppel.videoAufrufe).toHaveLength(1)
    const aufruf = doppel.videoAufrufe[0] as Record<string, unknown>
    expect(aufruf.projektId).toBe('p-1')
    expect(aufruf.dateiname).toBe('probe.mp4')
    expect(aufruf.assetId).toBe('asset-1')
    expect(aufruf.trimStart).toBe(3)
    expect(aufruf.trimEnde).toBe(11)
    expect(aufruf.lokalerFrame).toBe(60)
    expect(aufruf.laeuft).toBe(true)
    expect(aufruf.rahmen).toBeUndefined()
    expect(aufruf.hintergrund).toBeUndefined()
  })

  it('auch der Behaelter selbst traegt KEINE Farbe - die Ränder sind Sache von Video (schwarz) und niemand sonst', () => {
    const { behaelter, fertig } = rendere(eigenschaften())
    const buehne = behaelter.firstElementChild as HTMLElement
    expect(buehne.style.background).toBe('')
    fertig()
  })
})

// ---------------- das Band ----------------

describe('Das ueberlagernde Band (ENTSCHIEDEN 4)', () => {
  it('Segment bekommt x = 0, y = bandY (162 -> 918), die bandVorlage, die bandAktion und die marke - und KEINE Groessenangabe', () => {
    rendere(eigenschaften())
    expect(doppel.segmentAufrufe).toHaveLength(1)
    const aufruf = doppel.segmentAufrufe[0] as Record<string, unknown>
    expect(aufruf.x).toBe(0)
    expect(aufruf.y).toBe(918)
    expect((aufruf.vorlage as Vorlage).id).toBe('v-2')
    expect((aufruf.aktion as Aktion).id).toBe('a-1')
    expect((aufruf.marke as Marke).id).toBe('m1')
    expect(aufruf.breite).toBeUndefined()
    expect(aufruf.höhe).toBeUndefined()
    expect(aufruf.bandHöhe).toBeUndefined()
    expect(aufruf.bandBreite).toBeUndefined()
  })

  it('der Behaelter des Bandes traegt KEINEN Hintergrund und KEINE Deckkraft', () => {
    rendere(eigenschaften())
    const band = document.body.querySelector('[data-testid="stellvertreter-segment"]') as HTMLElement
    const behaelterBand = band.parentElement as HTMLElement
    expect(behaelterBand.style.background).toBe('')
    expect(behaelterBand.style.backgroundColor).toBe('')
    expect(behaelterBand.style.opacity).toBe('')
    expect(behaelterBand.style.filter).toBe('')
    expect(behaelterBand.style.backdropFilter).toBe('')
    expect(behaelterBand.style.mixBlendMode).toBe('')
  })

  it('das Band liegt im DOM NACH dem Video und damit DARUEBER', () => {
    rendere(eigenschaften())
    const video = document.body.querySelector('[data-testid="stellvertreter-video"]') as HTMLElement
    const band = document.body.querySelector('[data-testid="stellvertreter-segment"]') as HTMLElement
    expect(video.nextElementSibling).toBe(band)
  })

  it('die Geometrie GENAU EINmal je Aufruf, mit dem Uebergebenen; H = 204 -> bandY 876 aus der Rueckgewinnung', () => {
    rendere(eigenschaften({ bandVorlage: baueVorlage(204) }))
    expect(doppel.geometrieAufrufe).toEqual([204])
    const aufruf = doppel.segmentAufrufe[0] as Record<string, unknown>
    expect(aufruf.y).toBe(876)
  })

  it('bei bandAktion === null wird Segment NICHT gerendert; das Video bleibt vollflaechig', () => {
    rendere(eigenschaften({ bandAktion: null }))
    expect(doppel.segmentAufrufe).toHaveLength(0)
    expect(doppel.videoAufrufe).toHaveLength(1)
  })
})

// ---------------- der Leerfall der Vorlage ----------------

describe('bandVorlage.hoehe === null: kein Band (ENTSCHIEDEN 5)', () => {
  it('berechneBandGeometrie wird NICHT gerufen, Segment nicht gerendert, Video ohne rahmen/hintergrund', () => {
    rendere(eigenschaften({ bandVorlage: baueVorlage(null) }))
    expect(doppel.geometrieAufrufe).toEqual([])
    expect(doppel.segmentAufrufe).toHaveLength(0)
    expect(doppel.videoAufrufe).toHaveLength(1)
    const aufruf = doppel.videoAufrufe[0] as Record<string, unknown>
    expect(aufruf.rahmen).toBeUndefined()
    expect(aufruf.hintergrund).toBeUndefined()
  })
})
