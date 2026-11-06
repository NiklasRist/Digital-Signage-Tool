// Test zu 06.11.2026: Die Aktions-Boxen der Zeitleiste tragen ihr MOTIV, nicht nur
// ihre Farbe. Niklas: „die aktionen sind schon in der leiste ... nur als lila boxen".
//
// Geprueft wird die NAHT: Der Block holt das Motiv ueber dieselbe Quelle wie die
// Bibliothek (`holeMotiv`) und haengt es als Canvas ein. Das Zeichnen selbst ist in
// `aktions-motiv.spec.ts`/am Fenster belegt; hier wird `holeMotiv` durch ein
// aufgezeichnetes Canvas ersetzt, weil jsdom keinen 2d-Kontext hat.
// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, useRef, type JSX } from 'react'
import { DndContext } from '@dnd-kit/core'
import { afterAll, describe, expect, it, vi } from 'vitest'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Marke } from '../../src/shared/contracts/marke'
import type { Project } from '../../src/shared/contracts/project'
import type { Vorlage } from '../../src/shared/contracts/vorlage'

vi.mock('../../src/renderer/gemeinsam/aktions-motiv', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/renderer/gemeinsam/aktions-motiv')>()),
  holeMotiv: vi.fn(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 114
    canvas.height = 64
    return canvas
  }),
}))

import { holeMotiv } from '../../src/renderer/gemeinsam/aktions-motiv'
import { Zeitleiste } from '../../src/renderer/composer/zeitleiste.tsx'

const AKTION: Aktion = {
  id: 'a1',
  titel: 'Sommer-Aktion',
  beschreibung: null,
  preis: null,
  bildRef: null,
  cta: null,
  standardDauer: null,
  vorlagenId: 'v1',
  markeId: 'm1',
  akzentfarbe: null,
}

const VORLAGE: Vorlage = {
  id: 'v1',
  name: 'Probe',
  höhe: null,
  parent: null,
  eingebaut: true,
  zonen: [],
}

const HERKUNFT: Marke['herkunftJeFeld'] = {
  farben: {
    akzent: 'eigen',
    akzentKraeftig: 'eigen',
    akzentTief: 'eigen',
    flaecheDunkel: 'eigen',
    flaecheSehrDunkel: 'eigen',
    flaecheHell: 'eigen',
    flaecheAkzentZart: 'eigen',
    textAufDunkel: 'eigen',
    textAufHell: 'eigen',
    textSekundaer: 'eigen',
    linie: 'eigen',
    scrimStart: 'eigen',
    scrimEnde: 'eigen',
  },
  schriften: {
    headlineElegant: 'eigen',
    headlinePlakativ: 'eigen',
    fliesstext: 'eigen',
    fliesstextFett: 'eigen',
  },
  logo: 'keins',
  sicherheit: 'eigen',
  radien: 'eigen',
  schatten: 'eigen',
  slogan: 'eigen',
}

const MARKE: Marke = {
  id: 'm1',
  name: 'Probe',
  parent: null,
  eingebaut: false,
  farben: {
    akzent: '#FF4040',
    akzentKraeftig: '#DF3131',
    akzentTief: '#971316',
    flaecheDunkel: '#2F2E2E',
    flaecheSehrDunkel: '#4B090B',
    flaecheHell: '#FFFFFF',
    flaecheAkzentZart: '#F5AEAF',
    textAufDunkel: '#FFFFFF',
    textAufHell: '#202020',
    textSekundaer: '#8F8F8F',
    linie: '#CCCCCC',
    scrimStart: '#00000000',
    scrimEnde: '#000000B3',
  },
  schriften: {
    headlineElegant: { familie: 'Playfair Display', gewicht: 700, datei: 'P.woff2', herkunft: 'gebuendelt' },
    headlinePlakativ: { familie: 'Archivo Black', gewicht: 900, datei: 'A.woff2', herkunft: 'gebuendelt' },
    fliesstext: { familie: 'Arimo', gewicht: 400, datei: 'R.woff2', herkunft: 'gebuendelt' },
    fliesstextFett: { familie: 'Arimo', gewicht: 700, datei: 'B.woff2', herkunft: 'gebuendelt' },
  },
  logo: null,
  sicherheit: { horizontal: 96, vertikal: 54 },
  radien: { pille: 40, karte: 10, klein: 2 },
  schatten: { versatzY: 4, weichzeichnen: 8, farbe: '#00000040' },
  slogan: { text: '', aktiv: false },
  herkunftJeFeld: HERKUNFT,
}

function projekt(): Project {
  return {
    id: 'p1',
    name: 'Probe',
    erstelltAm: '2026-11-06T00:00:00.000Z',
    geaendertAm: '2026-11-06T00:00:00.000Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [AKTION],
    liste: [
      {
        id: 'e1',
        art: 'segment',
        ref: 'a1',
        dauer: 10,
        trimStart: null,
        trimEnde: null,
        einblendung: null,
      },
    ],
    letzterAusgabeName: null,
    standardMarkeId: 'm1',
    standardSegmentdauer: 10,
  }
}

const GERAETE: Array<{ wurzel: Root; behaelter: HTMLDivElement }> = []

function Test(): JSX.Element {
  const korb = useRef<HTMLDivElement | null>(null)
  return createElement(
    DndContext,
    null,
    createElement(Zeitleiste, {
      projekt: projekt(),
      neuZug: null,
      aktiveKante: null,
      laedtKante: null,
      korbRef: korb,
      vorlagen: [VORLAGE],
      holeMarke: () => MARKE,
    }),
  )
}

afterAll(() => {
  for (const geraet of GERAETE) {
    act(() => geraet.wurzel.unmount())
    geraet.behaelter.remove()
  }
})

describe('Aktions-Boxen zeigen ihr Motiv (06.11.2026)', () => {
  it('ein eigener Aktions-Block haengt ein Canvas mit dem Motiv ein', async () => {
    const behaelter = document.createElement('div')
    document.body.appendChild(behaelter)
    const wurzel = createRoot(behaelter)
    GERAETE.push({ wurzel, behaelter })
    await act(async () => {
      wurzel.render(createElement(Test))
      await Promise.resolve()
    })

    const block = behaelter.querySelector('[data-testid="zeitleiste-block-0"]')
    expect(block).not.toBeNull()
    expect(block?.querySelector('canvas')).not.toBeNull()
    // Die Naht: Der Block fragt dieselbe Quelle wie die Bibliothek.
    expect(vi.mocked(holeMotiv)).toHaveBeenCalled()
    const aufruf = vi.mocked(holeMotiv).mock.calls.at(-1)
    expect(aufruf?.[0]).toMatchObject({ id: 'a1' })
    expect(aufruf?.[1]).toMatchObject({ id: 'v1' })
    expect(aufruf?.[2]).toMatchObject({ id: 'm1' })
  })
})
