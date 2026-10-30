// Tests zu #217 - segment.tsx (die Anzeige, jsdom).
//
// Der Kern-Nachweis ist die BAUART: das Canvas ist OBJEKTGLEICH das aus
// zeichneSegment (kein zweiter Zeichenpfad, TK 9.10.1); die CSS-Groesse ist
// exakt dessen native Flaeche, und die nativen Masse bleiben unangefastet.
// Ersetzt werden nur die Zeichenroutine (#117) und die Schriften-Auskunft
// (#110); alles andere ist echt.
// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement } from 'react'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Vorlage } from '../../src/shared/contracts/vorlage'
import type { Marke } from '../../src/shared/contracts/marke'

const doppel = vi.hoisted(() => ({
  aufrufe: [] as Array<{
    argAktion: unknown
    argVorlage: unknown
    argMarke: unknown
    argRahmen: unknown
  }>,
  schriftenBereit: true,
  bild: null as { canvas: HTMLCanvasElement; breite: number; höhe: number } | null,
}))

vi.mock('../../src/renderer/template-canvas/zeichne-segment', () => ({
  zeichneSegment: (aktion: unknown, vorlage: unknown, marke: unknown, rahmenMarke: unknown) => {
    doppel.aufrufe.push({ argAktion: aktion, argVorlage: vorlage, argMarke: marke, argRahmen: rahmenMarke })
    if (doppel.bild === null) {
      // Ein ECHTES Canvas-Element: es wird eingehaengt, nicht abgemalt.
      doppel.bild = { canvas: document.createElement('canvas'), breite: 1920, höhe: 162 }
    }
    return doppel.bild
  },
}))

vi.mock('../../src/renderer/template-canvas/schriften', () => ({
  sindSchriftenBereit: () => doppel.schriftenBereit,
}))

// React 19: act(...)-Umgebung (Muster wie liste-ansicht-anzeige.spec.ts).
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const { Segment } = await import('../../src/renderer/preview-player/segment.tsx')

// ---------------- Bausteine ----------------

function baueAktion(): Aktion {
  return {
    id: 'a-1', titel: 'Sommeraktion', beschreibung: null, preis: null,
    bildRef: null, cta: null, standardDauer: null, vorlagenId: 'v-1',
    markeId: 'm1', akzentfarbe: null,
  }
}

function baueVorlage(): Vorlage {
  return {
    id: 'v-1', name: 'Vollbild', höhe: null,
    parent: null, eingebaut: false, zonen: [],
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

interface Segmenteigenschaften {
  aktion: Aktion
  vorlage: Vorlage
  marke: Marke
  x?: number
  y?: number
}

function rendere(props: Segmenteigenschaften): { behaelter: HTMLDivElement; wurzel: Root; fertig: () => void } {
  const ziel = document.createElement('div')
  document.body.appendChild(ziel)
  const wurzel: Root = createRoot(ziel)
  act(() => {
    wurzel.render(createElement(Segment, props) as ReactElement)
  })
  return { behaelter: ziel, wurzel, fertig: () => act(() => wurzel.unmount()) }
}

const kinderVon = (ziel: HTMLElement): HTMLElement[] =>
  Array.from(ziel.querySelectorAll('canvas'))

beforeEach(() => {
  doppel.aufrufe = []
  doppel.schriftenBereit = true
  doppel.bild = null
})

afterEach(() => {
  document.body.innerHTML = ''
})

// ---------------- die Anzeige ----------------

describe('Segment: die BAUART (kein zweiter Zeichenpfad)', () => {
  it('ruft zeichneSegment mit GENAU (aktion, vorlage, marke, rahmenMarke = marke) auf', () => {
    const dieAktion = baueAktion()
    const dieVorlage = baueVorlage()
    const dieMarke = baueMarke()
    const { fertig } = rendere({ aktion: dieAktion, vorlage: dieVorlage, marke: dieMarke })
    expect(doppel.aufrufe).toHaveLength(1)
    const aufruf = doppel.aufrufe[0] as { argAktion: unknown; argVorlage: unknown; argMarke: unknown; argRahmen: unknown }
    expect(aufruf.argAktion).toBe(dieAktion)
    expect(aufruf.argVorlage).toBe(dieVorlage)
    // Der vierte Parameter: dieselbe REFERENZ wie marke (TK v3.18 / #294).
    expect(aufruf.argMarke).toBe(dieMarke)
    expect(aufruf.argRahmen).toBe(dieMarke)
    fertig()
  })

  it('das eingehaengte Canvas ist OBJEKTGLEICH dem Rueckgabewert - keine Kopie', () => {
    const { fertig } = rendere({ aktion: baueAktion(), vorlage: baueVorlage(), marke: baueMarke() })
    const bild = doppel.bild as { canvas: HTMLCanvasElement; breite: number; höhe: number }
    const befestigt = document.body.querySelector('canvas') as HTMLCanvasElement | null
    expect(befestigt).not.toBeNull()
    expect(befestigt).toBe(bild.canvas)
    fertig()
  })

  it('die CSS-Anzeigegroesse ist EXAKT die native Flaeche (Breite wie Hoehe aus dem Rueckgabewert)', () => {
    const { fertig } = rendere({ aktion: baueAktion(), vorlage: baueVorlage(), marke: baueMarke() })
    const befestigt = document.body.querySelector('canvas') as HTMLCanvasElement
    // Der Stil sitzt am ENTHALTER: die Groesse des Canvasb selbst ist UNBERUEHRT.
    const behaelter = befestigt.parentElement as HTMLElement
    expect(behaelter.style.width).toBe('1920px')
    expect(behaelter.style.height).toBe('162px')
    fertig()
  })

  it('die nativen Masse bleiben unangefastet: width/height so wie Vorher (jsdom legt 300/150 an)', () => {
    const { fertig } = rendere({ aktion: baueAktion(), vorlage: baueVorlage(), marke: baueMarke() })
    const befestigt = document.body.querySelector('canvas') as HTMLCanvasElement
    // jsdom normiert ein frisch erzeugtes Canvas auf 300/150. Der Vertrag lautet
    // N I E T GESCHRIEBEN - also pruefen wir genau dieses Vorher/Nachher-Verhalten.
    expect(befestigt.width).toBe(300)
    expect(befestigt.height).toBe(150)
    fertig()
  })
})

describe('Position (x/y) im Raster', () => {
  it('x/y erscheinen als Pixelangaben am Behaelter; ohne sie steht dort 0', () => {
    const paare: Array<[Segmenteigenschaften, string, string]> = [
      [{ aktion: baueAktion(), vorlage: baueVorlage(), marke: baueMarke(), x: 7, y: 918 }, '7px', '918px'],
      [{ aktion: baueAktion(), vorlage: baueVorlage(), marke: baueMarke() }, '0px', '0px'],
    ]
    for (const [props, xs, ys] of paare) {
      const { fertig } = rendere(props)
      const befestigt = document.body.querySelector('canvas') as HTMLCanvasElement
      const behaelter = befestigt.parentElement as HTMLElement
      expect(behaelter.style.left).toBe(xs)
      expect(behaelter.style.top).toBe(ys)
      fertig()
      document.body.innerHTML = ''
    }
  })
})

describe('die Schranken (ENTSCHIEDEN 4/5)', () => {
  it('ohne bereitueberschrifte Schriften wird zeichneSegment NICHT aufgerufen und die Flaeche leer gelassen', () => {
    doppel.schriftenBereit = false
    const { fertig } = rendere({ aktion: baueAktion(), vorlage: baueVorlage(), marke: baueMarke() })
    expect(doppel.aufrufe).toHaveLength(0)
    expect(document.body.querySelectorAll('canvas')).toHaveLength(0)
    fertig()
  })

  it('bei unveranderter aktion/vorlage/marke wird GENAU EINMAL gezeichnet; bei Wechsel der aktion GENAU EIN weiteres Mal', () => {
    const dieAktion = baueAktion()
    const dieVorlage = baueVorlage()
    const dieMarke = baueMarke()
    const { wurzel, fertig } = rendere({ aktion: dieAktion, vorlage: dieVorlage, marke: dieMarke })
    // zweimal dieselbe Darstellung - der Aufrufzahler bleibt.
    act(() => {
      wurzel.render(createElement(Segment, { aktion: dieAktion, vorlage: dieVorlage, marke: dieMarke }) as ReactElement)
    })
    act(() => {
      wurzel.render(createElement(Segment, { aktion: dieAktion, vorlage: dieVorlage, marke: dieMarke }) as ReactElement)
    })
    expect(doppel.aufrufe).toHaveLength(1)
    // Die neue Aktion: GENAU EIN Aufruf mehr.
    const neue = { ...dieAktion, titel: 'Winteraktion' }
    act(() => {
      wurzel.render(createElement(Segment, { aktion: neue, vorlage: dieVorlage, marke: dieMarke }) as ReactElement)
    })
    expect(doppel.aufrufe).toHaveLength(2)
    fertig()
  })

  it('zeichnet auch bei Wechsel der VORLAGE und der MARKE neu (der Effekt haengt an allen drei Eingaben)', () => {
    // Der Vertrag: neu gezeichnet wird, sobald sich aktion, vorlage ODER marke aendern.
    // Haengt der Effekt nur an der Aktion, bliebe die Flaeche nach einem Vorlagen- oder
    // Markenwechsel auf dem alten Bild stehen - sichtbar ohne jeden Fehler.
    const dieAktion = baueAktion()
    const dieVorlage = baueVorlage()
    const dieMarke = baueMarke()
    const { wurzel, fertig } = rendere({ aktion: dieAktion, vorlage: dieVorlage, marke: dieMarke })
    expect(doppel.aufrufe).toHaveLength(1)

    const andereVorlage = { ...baueVorlage(), id: 'v-2' }
    act(() => {
      wurzel.render(createElement(Segment, { aktion: dieAktion, vorlage: andereVorlage, marke: dieMarke }) as ReactElement)
    })
    expect(doppel.aufrufe).toHaveLength(2)

    const andereMarke = { ...baueMarke(), name: 'Zweite Marke' }
    act(() => {
      wurzel.render(createElement(Segment, { aktion: dieAktion, vorlage: andereVorlage, marke: andereMarke }) as ReactElement)
    })
    expect(doppel.aufrufe).toHaveLength(3)
    fertig()
  })

  it('der Behaelter enthaelt GENAU EIN Kind; nach einem Wechsel der aktion ist es das neue Canvas', () => {
    const dieAktion = baueAktion()
    const dieVorlage = baueVorlage()
    const dieMarke = baueMarke()
    const { wurzel, fertig } = rendere({ aktion: dieAktion, vorlage: dieVorlage, marke: dieMarke })
    const altesCanvas = doppel.bild as unknown as { canvas: HTMLCanvasElement; breite: number; höhe: number }
    expect(document.body.querySelectorAll('canvas')).toHaveLength(1)
    // Neuer Aufruf: doppel.bild muss NEU erzeugt werden - dazu zurucksetzen.
    doppel.bild = null
    const neue = { ...dieAktion, titel: 'Winteraktion' }
    act(() => {
      wurzel.render(createElement(Segment, { aktion: neue, vorlage: dieVorlage, marke: dieMarke }) as ReactElement)
    })
    const neuesBild = doppel.bild as unknown as { canvas: HTMLCanvasElement; breite: number; höhe: number }
    expect(neuesBild.canvas).not.toBe(altesCanvas.canvas)
    expect(document.body.querySelectorAll('canvas')).toHaveLength(1)
    expect(document.body.querySelector('canvas')).toBe(neuesBild.canvas)
    fertig()
  })
})
