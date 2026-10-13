// Issue #409: Der Vorlagen-Editor-Auftritt wirft React #301 ("Too many re-renders"),
// weil der Nutzungs-Hinweis SEINEN Zustand im RENDERKOERPER setzt - beginneLaden liefert
// zustand 'laedt', giltFuer verlangt 'geladen', also setzte JEDE Renderphase erneut und
// React baute den ganzen Baum ab. Der Fix hebt das Laden in einen Effect (auf die
// parent-Zugehoerigkeit) und stellt alle Hooks VOR den Sitzungs-Rueckweg.
//
// Dieser Test begleitet den Bauschein am echten Renderer (jsdom): Das Montieren der
// Wurzel MIT offener Sitzung darf ohne React-Fehler durchlaufen und den Kopf zeigen.

// @vitest-environment jsdom
import { createElement, act, type ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'

import type { EditorSitzung } from '../../src/renderer/vorlagen-editor/arbeitskopie'
import type { VorlagenEditorWurzelProps } from '../../src/renderer/vorlagen-editor'
import type { VorlagenZugang, ZeichenZugang, MarkenZugang } from '../../src/renderer/app-shell/sichten'
import type { Sitzungshalter } from '../../src/renderer/app-shell/undo-aufzeichnung-vorlage'
import type { Vorlage } from '../../src/shared/contracts/vorlage'
import { VorlagenEditorWurzel } from '../../src/renderer/vorlagen-editor'

vi.mock('../../src/renderer/template-canvas/schriften', () => ({
  stelleSchriftenBereit: vi.fn(async () => undefined),
}))
vi.mock('../../src/renderer/gemeinsam/marken-bereitstellung', () => ({
  stelleMarkeBereit: vi.fn(async () => ({ ok: true, wert: undefined })),
  holeBereiteMarke: vi.fn(() => null),
}))
vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: vi.fn(async () => ({
    ok: true,
    wert: { aktionen: [], listenelemente: [] },
  })),
}))

function eigene(id: string): Vorlage {
  return {
    id,
    name: `Name ${id}`,
    art: 'vollflaeche',
    höhe: null,
    parent: null,
    eingebaut: false,
    zonen: [
      {
        id: `${id}-zone`,
        rolle: 'frei',
        bindung: 'titel',
        rahmen: { x: 96, y: 54, breite: 800, höhe: 200 },
        ausrichtung: { horizontal: 'links', vertikal: 'oben' },
        wennLeer: 'leer',
      },
    ],
  }
}

function sitzungFest(parentVorlage: Vorlage): EditorSitzung {
  const arbeitskopie: Vorlage = { ...parentVorlage, id: `${parentVorlage.id}-arbeits`, parent: parentVorlage.id }
  return {
    arbeitsId: arbeitskopie.id,
    arbeitskopie,
    parentId: parentVorlage.id,
    parentName: parentVorlage.name,
    parentEingebaut: false,
    ueberarbeitenErlaubt: true,
    ueberarbeitenGrund: null,
    festeZonenSoll: parentVorlage.zonen,
  }
}

function baueEigenschaften(sitzung: EditorSitzung | null): VorlagenEditorWurzelProps {
  return {
    sichtbar: true,
    vorlagen: {
      hole: () => null,
      lade: async () => null,
      aufGeaendert: () => () => undefined,
    } as unknown as VorlagenZugang,
    zeichnen: { hole: () => null } as unknown as ZeichenZugang,
    marken: {
      hole: () => ({
        marken: [{ id: 'marke-eingebaut', eingebaut: true, name: 'Eingebaut' }],
      }),
      aufGeaendert: () => () => undefined,
    } as unknown as MarkenZugang,
    sitzung: {
      holeSitzung: () => sitzung,
      uebernimmAenderung: () => undefined,
      uebernimmSpeicherstand: () => undefined,
      beendeSitzung: () => undefined,
      aufSitzungGeaendert: () => () => undefined,
    } as unknown as Sitzungshalter,
  }
}

const GERAETE: Array<{ behaelter: HTMLElement; wurzel: Root }> = []

function rendere(eigenschaften: VorlagenEditorWurzelProps): HTMLElement {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel: Root = createRoot(behaelter)
  act(() => {
    wurzel.render(createElement(VorlagenEditorWurzel, eigenschaften) as ReactElement)
  })
  GERAETE.push({ behaelter, wurzel })
  return behaelter
}

afterEach(() => {
  for (const geraet of GERAETE) {
    act(() => {
      geraet.wurzel.unmount()
    })
    geraet.behaelter.remove()
  }
  GERAETE.length = 0
})

describe('Vorlagen-Editor-Sitzung (#409)', () => {
  it('Der Editor-Auftritt montiert MIT offener Sitzung, ohne React #301, und zeigt den Kopf', () => {
    const parent = eigene('vorlage-test')
    const behaelter = rendere(baueEigenschaften(sitzungFest(parent)))
    // Vor dem Fix warf dieser Mount React #301 und nahm den ganzen Baum mit.
    const kopf = behaelter.querySelector('[data-testid="arbeitskopie-kopf"]')
    expect(kopf !== null).toBe(true)
    expect(kopf?.textContent ?? '').toContain('Name vorlage-test')
  })

  it('Ohne Sitzung zeigt die Wurzel die Uebersicht und wirft NICHT', () => {
    const behaelter = rendere(baueEigenschaften(null))
    expect(behaelter.querySelector('[data-testid="vorlagen-uebersicht"]') !== null).toBe(true)
  })
})
