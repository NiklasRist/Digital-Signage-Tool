// Tests zu #413/#417 - Drag-QUELLEN zur Zeitleiste.
//
// User-Weisung 15.10.2026 (#417): Ziehbar in die Zeitleiste sind NUR Aktionen
// (und spaeter Banner) - Bilder/Videos (Medien) sind KEINE Drag-Quelle. Der Drag
// fuer Medien ist ENTFERNT; der Klick-Weg bleibt.
//
// jsdom-Kontext: Jede Zeile/Karte wird IN einem echten DndContext (@dnd-kit/core)
// montiert - useDraggable verlangt einen Container. Geprueft wird der DRAGGABLE-Vertrag
// am DOM (role/aria vom dnd-kit); die Drag-DATEN ({ referenz }) sind statisch getypt und
// werden am echten Fenster gemessen (Treiber, Vorbild #407/#408): Modell in jsdom,
// echter Weg am Fenster.
// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type JSX } from 'react'
import { DndContext } from '@dnd-kit/core'
import { afterAll, describe, expect, it } from 'vitest'

import type { Asset } from '../../src/shared/contracts/asset'
import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Project } from '../../src/shared/contracts/project'
import { Bibliotheksansicht } from '../../src/renderer/composer/bibliothek-ansicht.tsx'

const GERAETE: Array<{ wurzel: Root; behaelter: HTMLDivElement }> = []

function montiere(element: JSX.Element): HTMLDivElement {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel = createRoot(behaelter)
  GERAETE.push({ wurzel, behaelter })
  act(() => {
    wurzel.render(createElement(DndContext, null, element))
  })
  return behaelter
}

function asset(id: string, typ: 'video' | 'bild'): Asset {
  return {
    id,
    typ,
    dateiname: `${id}.${typ === 'video' ? 'mp4' : 'png'}`,
    originalname: typ === 'video' ? 'Video A' : 'Bild B',
    maße: { breite: 1920, höhe: 1080 },
    dauer: typ === 'video' ? 10 : null,
    importdatum: '2026-10-14T00:00:00.000Z',
    zustand: 'ok',
    herkunft: { art: 'manuell' },
  }
}

function aktion(id: string): Aktion {
  return {
    id,
    titel: 'Training',
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer: null,
    vorlagenId: 'vollbild',
    markeId: 'marke-x',
    akzentfarbe: null,
  }
}

function projekt(ueber: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'Probe',
    erstelltAm: '2026-10-14T00:00:00.000Z',
    geaendertAm: '2026-10-14T00:00:00.000Z',
    schemaVersion: 1,
    assets: [asset('a-video', 'video'), asset('a-bild', 'bild')],
    aktionen: [aktion('k1')],
    liste: [],
    letzterAusgabeName: null,
    standardMarkeId: 'marke-x',
    standardSegmentdauer: 10,
    ...ueber,
  }
}

function bibliothek(): JSX.Element {
  return createElement(Bibliotheksansicht, {
    projekt: projekt(),
    aufImportieren: () => {},
    aufMediumLoeschen: () => {},
  })
}

afterAll(() => {
  for (const geraet of GERAETE) {
    act(() => geraet.wurzel.unmount())
    geraet.behaelter.remove()
  }
})

describe('Nur AKTIONEN sind ziehbar (#413/#417)', () => {
  it('Die Video-Zeile der Bibliothek ist KEINE Drag-Quelle; Bilder erscheinen hier nicht (#422)', () => {
    const behaelter = montiere(bibliothek())

    const videoZeile = behaelter.querySelector('[data-testid="medium-a-video"]')
    expect(videoZeile).not.toBeNull()
    expect(videoZeile?.getAttribute('aria-roledescription')).not.toBe('draggable')
    // #422: Bilder sind Motiv einer Aktion und stehen NICHT mehr in der Bibliothek.
    expect(behaelter.querySelector('[data-testid="medium-a-bild"]')).toBeNull()
  })

  it('JEDE Aktionszeile traegt den draggable-Vertrag am DOM', () => {
    const behaelter = montiere(bibliothek())

    const zeile = behaelter.querySelector('[data-testid="aktion-k1"]')
    expect(zeile).not.toBeNull()
    expect(zeile?.getAttribute('aria-roledescription')).toBe('draggable')
  })

  it('Der KLICK-Weg steht weiterhin NEBEN dem Ziehen - seit 02.11.2026 ist es "Ins Video"', () => {
    // Bis 02.11.2026 hing diese Zusage am Knopf "Zur Liste hinzufuegen". Der ist
    // entfallen (Aktion als eigener Block = Muell von frueher); der Klick-Weg in die
    // Liste ist damit NICHT verschwunden, sondern durch "Ins Video" ersetzt - und der
    // erscheint nur mit Rueckruf und vorhandenem Video (der Test reicht beides herein).
    const behaelter = montiere(
      createElement(Bibliotheksansicht, {
        projekt: projekt({
          liste: [
            {
              id: 'video-1',
              art: 'video',
              ref: 'a-video',
              dauer: null,
              trimStart: 0,
              trimEnde: 10,
              einblendung: null,
              unterbrechungen: [],
            },
          ],
        }),
        aufImportieren: () => {},
        aufMediumLoeschen: () => {},
        aufInsVideo: () => {},
      }),
    )

    const knopf = behaelter.querySelector('[data-testid="aktion-ins-video-k1"]')
    expect(knopf).not.toBeNull()
    // Und der alte Knopf ist WEG - nicht nur umbenannt.
    expect(behaelter.textContent).not.toContain('Zur Liste hinzufügen')
  })

  it('01.11.2026: die Aktionszeile meldet "Bearbeiten" mit IHRER Kennung - ohne Reiterwechsel', () => {
    const gemeldet: string[] = []
    const behaelter = montiere(
      createElement(Bibliotheksansicht, {
        projekt: projekt(),
        aufImportieren: () => {},
        aufMediumLoeschen: () => {},
        aufAktionBearbeiten: (id: string) => gemeldet.push(id),
      }),
    )

    const knopf = behaelter.querySelector<HTMLButtonElement>('[data-testid="aktion-bearbeiten-k1"]')
    expect(knopf).not.toBeNull()
    act(() => knopf!.click())
    expect(gemeldet).toEqual(['k1'])
  })

  it('OHNE Rueckruf gibt es KEINEN Bearbeiten-Knopf (die Ansicht erfindet keinen Weg)', () => {
    const behaelter = montiere(bibliothek())
    expect(behaelter.querySelector('[data-testid="aktion-bearbeiten-k1"]')).toBeNull()
  })
})

// 01.11.2026: Die Galerie ist als Flaeche entfallen (Aktionen in die Mitte) - ihre
// beiden Faelle (Drag-Vertrag, Auswahl-Hervorhebung) sind mit ihr weggefallen. Die
// Auswahl wird an der VIDEO-ZEILE der Bibliothek geprueft (naechster Block).

describe('Das ausgewaehlte Medium ist hervorgehoben (#418)', () => {
  it('die gewaehlte Video-Zeile der Bibliothek traegt data-ausgewaehlt=true (#418/#422)', () => {
    const behaelter = montiere(
      createElement(Bibliotheksansicht, {
        projekt: projekt(),
        aufImportieren: () => {},
        aufMediumLoeschen: () => {},
        ausgewaehltesId: 'a-video',
      }),
    )
    expect(
      behaelter.querySelector('[data-testid="medium-a-video"]')?.getAttribute('data-ausgewaehlt'),
    ).toBe('true')
    // #422: Das Bild steht nicht mehr in der Bibliothek.
    expect(behaelter.querySelector('[data-testid="medium-a-bild"]')).toBeNull()
  })
})
