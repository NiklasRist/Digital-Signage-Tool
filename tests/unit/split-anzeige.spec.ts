// Tests zu #218 - split.tsx (die Anzeige, jsdom).
//
// Video (#216) und Segment (#217) werden durch Spione ersetzt; geprueft wird
// NUR, was Split selbst tut: der Hintergrund flaecheDunkel (ENTSCHIEDEN 3/4),
// die Durchreichung der Video-Parameter samt rahmen/hintergrund (ENTSCHIEDEN 5),
// die Platzierung des Band-Segments bei y = band.y OHNE Groessenangabe, und die
// beiden Leerfaelle (bandAktion === null, hoehe === null - ENTSCHIEDEN 6).
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement } from 'react'

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
    return null
  },
}))

vi.mock('../../src/renderer/preview-player/segment', () => ({
  Segment: (props: Record<string, unknown>) => {
    doppel.segmentAufrufe.push(props)
    return null
  },
}))

// Die echte Rechnung bleibt stehen; nur der Aufruf wird GEZAEHLT (DoD:
// hoehe === null -> berechneBandGeometrie wird NICHT gerufen).
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

const { Split } = await import('../../src/renderer/preview-player/split.tsx')
type SplitProps = import('../../src/renderer/preview-player/split.tsx').SplitProps

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
    id: 'v-1', name: 'Split', art: 'split', höhe,
    parent: null, eingebaut: true, zonen: [],
  }
}

function baueMarke(): Marke {
  return {
    id: 'm1', name: 'Probe', parent: null, eingebaut: true,
    farben: {
      akzent: '#FF4040', akzentKraeftig: '#E03030', akzentTief: '#A02020',
      flaecheDunkel: '#2F2E2E', flaecheSehrDunkel: '#1F1E1E', flaecheHell: '#F5F5F5',
      flaecheAkzentZart: '#FDECEC', textAufDunkel: '#FFFFFF', textAufHell: '#222222',
      textSekundaer: '#666666', linie: '#CCCCCC', scrimStart: '#000000CC',
      scrimEnde: '#00000000',
    },
    schriften: null as never, logo: null as never,
    sicherheit: { horizontal: 96, vertikal: 54 }, radien: null as never,
    schatten: null as never, slogan: null as never, herkunftJeFeld: null as never,
  }
}

function eigenschaften(teil: Partial<SplitProps> = {}): SplitProps {
  return {
    projektId: 'p-1',
    dateiname: 'probe.mp4',
    assetId: 'asset-1',
    trimStart: 2,
    trimEnde: 12,
    lokalerFrame: 45,
    laeuft: true,
    stumm: true,
    lautstaerke: 1,
    rahmenMarke: baueMarke(),
    abschnittMarke: baueMarke(),
    bandVorlage: baueVorlage(162),
    bandAktion: baueAktion(),
    ...teil,
  }
}

function rendere(props: SplitProps): { behaelter: HTMLDivElement; wurzel: Root; fertig: () => void } {
  const ziel = document.createElement('div')
  document.body.appendChild(ziel)
  const wurzel: Root = createRoot(ziel)
  act(() => {
    wurzel.render(createElement(Split, props) as ReactElement)
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

// ---------------- die Farbe ----------------

describe('Die Farbe der Restflaechen (ENTSCHIEDEN 3/4)', () => {
  it('der aeussere Behaelter traegt GENAU rahmenMarke.farben.flaecheDunkel als Hintergrund', () => {
    const marke = baueMarke()
    marke.farben.flaecheDunkel = '#ABCDEF'
    const { behaelter, fertig } = rendere(eigenschaften({ rahmenMarke: marke }))
    const buehne = behaelter.firstElementChild as HTMLElement
    expect(buehne.style.background).toBe('rgb(171, 205, 239)')
    fertig()
  })

  it('Video bekommt hintergrund = dieselbe flaecheDunkel (ENTSCHIEDEN 5)', () => {
    const marke = baueMarke()
    marke.farben.flaecheDunkel = '#123456'
    rendere(eigenschaften({ rahmenMarke: marke }))
    const aufruf = doppel.videoAufrufe[0] as { hintergrund?: string }
    expect(aufruf.hintergrund).toBe('#123456')
  })
})

// ---------------- die Durchreichung ----------------

describe('Die Durchreichung an Video (#216)', () => {
  it('die sieben Video-Parameter gehen UNVERAENDERT durch; der rahmen ist videoRahmen (H = 162)', () => {
    rendere(eigenschaften())
    expect(doppel.videoAufrufe).toHaveLength(1)
    const aufruf = doppel.videoAufrufe[0] as Record<string, unknown>
    expect(aufruf.projektId).toBe('p-1')
    expect(aufruf.dateiname).toBe('probe.mp4')
    expect(aufruf.assetId).toBe('asset-1')
    expect(aufruf.trimStart).toBe(2)
    expect(aufruf.trimEnde).toBe(12)
    expect(aufruf.lokalerFrame).toBe(45)
    expect(aufruf.laeuft).toBe(true)
    // H = 162 -> videoRahmen aus der geteilten Rechnung:
    expect(aufruf.rahmen).toEqual({ x: 144, y: 0, breite: 1632, höhe: 918 })
  })
})

describe('Das Band-Segment (#217)', () => {
  it('Segment bekommt x = 0, y = band.y, die bandVorlage, die bandAktion und die marke - und KEINE Groessenangabe', () => {
    rendere(eigenschaften())
    expect(doppel.segmentAufrufe).toHaveLength(1)
    const aufruf = doppel.segmentAufrufe[0] as Record<string, unknown>
    expect(aufruf.x).toBe(0)
    expect(aufruf.y).toBe(918)
    expect((aufruf.vorlage as Vorlage).höhe).toBe(162)
    expect((aufruf.aktion as Aktion).id).toBe('a-1')
    expect((aufruf.marke as Marke).id).toBe('m1')
    expect(aufruf.breite).toBeUndefined()
    expect(aufruf.höhe).toBeUndefined()
    expect(aufruf.rahmen).toBeUndefined()
  })

  it('bei bandAktion === null wird Segment NICHT gerendert; das Video bleibt im videoRahmen', () => {
    rendere(eigenschaften({ bandAktion: null }))
    expect(doppel.segmentAufrufe).toHaveLength(0)
    expect(doppel.videoAufrufe).toHaveLength(1)
    expect((doppel.videoAufrufe[0] as Record<string, unknown>).rahmen).toEqual({
      x: 144, y: 0, breite: 1632, höhe: 918,
    })
  })

  it('ABSCHNITT-Marke ohne Bereitschaft (bandAktion da, abschnittMarke null): Segment wird NICHT gerendert (#313, ENTSCHIEDEN 6)', () => {
    rendere(eigenschaften({ abschnittMarke: null }))
    expect(doppel.segmentAufrufe).toHaveLength(0)
    // das Video bleibt unberuehrt (in den videoRahmen):
    expect(doppel.videoAufrufe).toHaveLength(1)
  })

  it('rahmenMarke und abschnittMarke gehen als Prop-Doppel UNVERAENDERT (toBe) durch: marken-Referenz ist die uebergebene', () => {
    const rahmenMarke = baueMarke()
    const abschnittMarke = baueMarke()
    rendere(eigenschaften({ rahmenMarke, abschnittMarke }))
    expect(doppel.videoAufrufe).toHaveLength(1)
    const aufruf = doppel.segmentAufrufe[0] as Record<string, unknown>
    expect(aufruf.marke).toBe(abschnittMarke)
    expect(aufruf.marke).not.toBe(rahmenMarke)
  })
})

// ---------------- der Leerfall der Vorlage ----------------

describe('bandVorlage.hoehe === null: kein Band (ENTSCHIEDEN 6)', () => {
  it('berechneBandGeometrie wird NICHT gerufen: Video ohne rahmen und ohne hintergrund, kein Segment', () => {
    const { behaelter, fertig } = rendere(eigenschaften({ bandVorlage: baueVorlage(null) }))
    expect(doppel.geometrieAufrufe).toEqual([])
    expect(doppel.segmentAufrufe).toHaveLength(0)
    expect(doppel.videoAufrufe).toHaveLength(1)
    const aufruf = doppel.videoAufrufe[0] as Record<string, unknown>
    expect(aufruf.rahmen).toBeUndefined()
    expect(aufruf.hintergrund).toBeUndefined()
    // und NICHTS an der Buehne ist flaecheDunkel - der Behaelter traegt keine Farbe:
    const buehne = behaelter.firstElementChild as HTMLElement
    expect(buehne.style.background).toBe('')
    fertig()
  })

  it('zum Vergleich: mit Bandhoehe wird die Geometrie GENAU EINMAL je Aufruf gerufen', () => {
    rendere(eigenschaften())
    expect(doppel.geometrieAufrufe).toEqual([162])
  })
})

// ---------------- konstante Geometrie je Element ----------------

describe('Die Geometrie ist einmal je Element gebildet', () => {
  it('zwei Aufrufe mit derselben bandVorlage liefern denselben videoRahmen (kein Sprung mitten im Video)', () => {
    const vorlage = baueVorlage(204)
    rendere(eigenschaften({ bandVorlage: vorlage }))
    rendere(eigenschaften({ bandVorlage: baueVorlage(204) }))
    const erste = (doppel.videoAufrufe[0] as Record<string, unknown>).rahmen
    const zweite = (doppel.videoAufrufe[1] as Record<string, unknown>).rahmen
    expect(zweite).toEqual(erste)
    // H = 204 - der Fall, in dem die Vierer-Regel beisst:
    expect(erste).toEqual({ x: 182, y: 0, breite: 1556, höhe: 876 })
  })
})
