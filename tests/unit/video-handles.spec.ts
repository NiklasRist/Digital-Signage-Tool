// Verhaltenstests zu #246 - das Handle-Register in src/renderer/gemeinsam/video-handles.ts.
//
// Kern des Moduls: Jede Stelle, die ein <video> auf ein Medium oeffnet, meldet es an
// (meldeVideoHandleAn) und bekommt eine Abmelde-Funktion. gibVideoHandlesFrei gibt
// VOR dem Einreihen eines loeschen-Auftrags jeden angemeldeten Handle frei
// (src = "", dann load(); TK 9.4.6 "Vorbedingung Vorschau (Regel B)"). Die Probe
// arbeitet OHNE Browser: Handle-Attrappen sind schlichte Objekte { src, load: Spion }.
//
// Die Tests decken die Definition of Done ab - jede DoD-Zeile ist als benannter Test
// unten wiederzufinden. Der Kernnachweis steht in "Freigabe setzt src und ruft load".
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  gibVideoHandlesFrei,
  meldeVideoHandleAn,
  setzeVideoHandlesZurueck,
  zaehleVideoHandles,
} from '../../src/renderer/gemeinsam/video-handles'
import type { Medienhandle } from '../../src/renderer/gemeinsam/video-handles'

function attrappe(srcWert = 'irgendwo'): Medienhandle {
  return { src: srcWert, load: vi.fn() }
}

afterEach(() => {
  setzeVideoHandlesZurueck()
})

describe('zaehleVideoHandles', () => {
  it('liefert 0, solange nichts angemeldet ist', () => {
    expect(zaehleVideoHandles('a1')).toBe(0)
  })

  it('liefert 1 nach meldeVideoHandleAn("a1", h)', () => {
    meldeVideoHandleAn('a1', attrappe())
    expect(zaehleVideoHandles('a1')).toBe(1)
  })
})

describe('gibVideoHandlesFrei', () => {
  it('Freigabe setzt src und ruft load', () => {
    const ablauf: string[] = []
    const handle: Medienhandle = {
      get src() {
        return 'unbekannt'
      },
      set src(wert: string) {
        ablauf.push(`src=${wert}`)
      },
      load: vi.fn(() => {
        ablauf.push('load')
      }),
    }
    meldeVideoHandleAn('a1', handle)

    gibVideoHandlesFrei('a1')

    // src = '' MUSS VOR load() kommen - load() wuerde sonst die alte Quelle
    // erneut oeffnen (der Ablauf, woertlich aus dem Issue).
    expect(ablauf).toEqual(['src=', 'load'])
    expect(handle.load).toHaveBeenCalledTimes(1)
  })

  it('zaehlt nach der Freigabe auf 0 (ENTSCHIEDEN 6)', () => {
    meldeVideoHandleAn('a1', attrappe())
    gibVideoHandlesFrei('a1')
    expect(zaehleVideoHandles('a1')).toBe(0)
  })

  it('gibt drei Handles auf dasselbe Asset alle frei, in Anmeldereihenfolge', () => {
    const ablauf: string[] = []
    const h1: Medienhandle = { src: 'x', load: vi.fn(() => ablauf.push('h1')) }
    const h2: Medienhandle = { src: 'x', load: vi.fn(() => ablauf.push('h2')) }
    const h3: Medienhandle = { src: 'x', load: vi.fn(() => ablauf.push('h3')) }
    meldeVideoHandleAn('a1', h1)
    meldeVideoHandleAn('a1', h2)
    meldeVideoHandleAn('a1', h3)

    gibVideoHandlesFrei('a1')

    expect(ablauf).toEqual(['h1', 'h2', 'h3'])
    expect(h1.src).toBe('')
    expect(h2.src).toBe('')
    expect(h3.src).toBe('')
  })

  it('laesst einen unter a1 angemeldeten Handle bei Freigabe von a2 unberuehrt', () => {
    const loadSpion = vi.fn()
    const handle: Medienhandle = { src: 'bild.mp4', load: loadSpion }
    meldeVideoHandleAn('a1', handle)

    gibVideoHandlesFrei('a2')

    expect(zaehleVideoHandles('a1')).toBe(1)
    expect(loadSpion).not.toHaveBeenCalled()
    expect(handle.src).toBe('bild.mp4')
  })

  it('wirft bei unbekannter Kennung nicht und ruft nichts', () => {
    const loadSpion = vi.fn()
    meldeVideoHandleAn('a1', { src: 'bild.mp4', load: loadSpion })

    expect(() => gibVideoHandlesFrei('nicht-vorhanden')).not.toThrow()

    expect(loadSpion).not.toHaveBeenCalled()
    expect(zaehleVideoHandles('a1')).toBe(1)
  })

  it('laesst den Wurf eines load() unveraendert hinaus und meldet den Handle ab', () => {
    const kaputt: Medienhandle = { src: 'bild.mp4', load: vi.fn(() => { throw new Error('defekt') }) }
    meldeVideoHandleAn('a1', kaputt)

    expect(() => gibVideoHandlesFrei('a1')).toThrow('defekt')

    expect(zaehleVideoHandles('a1')).toBe(0)
  })

  it('meldet sich der erste Handle im eigenen load() ab, wird kein Handle uebersprungen', () => {
    // DoD: "Meldet sich ein Handle innerhalb seines eigenen load() ab, bricht die
    // laufende Freigabe nicht ab und ueberspringt keinen der uebrigen Handles" -
    // der Beleg fuer das Leeren VOR der Schleife (die Schleife laeuft ueber die
    // Kopie, nicht ueber die lebende Liste).
    const aufgerufen: string[] = []
    const h2: Medienhandle = { src: 'x', load: vi.fn(() => aufgerufen.push('h2')) }
    const h3: Medienhandle = { src: 'x', load: vi.fn(() => aufgerufen.push('h3')) }
    let abmelden1: () => void = () => {}
    const h1: Medienhandle = {
      src: 'x',
      load: vi.fn(() => {
        abmelden1()
        aufgerufen.push('h1')
      }),
    }
    abmelden1 = meldeVideoHandleAn('a1', h1)
    meldeVideoHandleAn('a1', h2)
    meldeVideoHandleAn('a1', h3)

    gibVideoHandlesFrei('a1')

    expect(aufgerufen).toEqual(['h1', 'h2', 'h3'])
    expect(zaehleVideoHandles('a1')).toBe(0)
  })

  it('erzeugt keine Endlosschleife, wenn aus load() heraus erneut freigegeben wird', () => {
    // DoD: "Wird gibVideoHandlesFrei aus einem load() heraus erneut fuer dasselbe
    // Asset gerufen, entsteht keine Endlosschleife und kein doppelter load()-Aufruf."
    const h1: Medienhandle = { src: 'x', load: vi.fn(() => gibVideoHandlesFrei('a1')) }
    const h2: Medienhandle = { src: 'x', load: vi.fn() }
    meldeVideoHandleAn('a1', h1)
    meldeVideoHandleAn('a1', h2)

    gibVideoHandlesFrei('a1')

    expect(h1.load).toHaveBeenCalledTimes(1)
    expect(h2.load).toHaveBeenCalledTimes(1)
  })

  it('ergibt bei zweifach angemeldetem Handle einen Eintrag und ruft load genau einmal', () => {
    // ENTSCHIEDEN 4: dasselbe Handle-Objekt zweimal fuer dieselbe assetId
    // ergibt einen Eintrag.
    const loadSpion = vi.fn()
    const h: Medienhandle = { src: 'x', load: loadSpion }
    meldeVideoHandleAn('a1', h)
    meldeVideoHandleAn('a1', h)

    expect(zaehleVideoHandles('a1')).toBe(1)

    gibVideoHandlesFrei('a1')

    expect(loadSpion).toHaveBeenCalledTimes(1)
  })

  it('laesst bei doppelt angemeldetem Handle fuer zwei Assets die zweite Anmeldung bestehen', () => {
    // ENTSCHIEDEN 5: dasselbe Element kann fuer mehrere Assets angemeldet sein.
    const h: Medienhandle = { src: 'x', load: vi.fn() }
    meldeVideoHandleAn('a1', h)
    meldeVideoHandleAn('a2', h)

    gibVideoHandlesFrei('a1')

    expect(zaehleVideoHandles('a1')).toBe(0)
    expect(zaehleVideoHandles('a2')).toBe(1)
  })
})

describe('Abmelde-Funktion', () => {
  it('entfernt genau ihren Eintrag: danach 0, und eine Freigabe ruft load nicht', () => {
    const loadSpion = vi.fn()
    const abmelden = meldeVideoHandleAn('a1', { src: 'x', load: loadSpion })

    abmelden()

    expect(zaehleVideoHandles('a1')).toBe(0)

    gibVideoHandlesFrei('a1')
    expect(loadSpion).not.toHaveBeenCalled()
  })

  it('wirft beim zweiten Aufruf nicht und laesst andere Anmeldungen unberuehrt', () => {
    const load1 = vi.fn()
    const load2 = vi.fn()
    const abmelden1 = meldeVideoHandleAn('a1', { src: 'x', load: load1 })
    meldeVideoHandleAn('a1', { src: 'x', load: load2 })

    abmelden1()
    expect(() => abmelden1()).not.toThrow()

    expect(zaehleVideoHandles('a1')).toBe(1)

    gibVideoHandlesFrei('a1')
    expect(load1).not.toHaveBeenCalled()
    expect(load2).toHaveBeenCalledTimes(1)
  })

  it('wirft nach einer Freigabe nicht', () => {
    const abmelden = meldeVideoHandleAn('a1', attrappe())

    gibVideoHandlesFrei('a1')

    expect(() => abmelden()).not.toThrow()
  })
})

describe('setzeVideoHandlesZurueck', () => {
  it('setzt alle Zaehler auf 0 und ruft kein load()', () => {
    const loadSpion = vi.fn()
    meldeVideoHandleAn('a1', { src: 'x', load: loadSpion })
    meldeVideoHandleAn('a2', { src: 'x', load: vi.fn() })

    setzeVideoHandlesZurueck()

    expect(zaehleVideoHandles('a1')).toBe(0)
    expect(zaehleVideoHandles('a2')).toBe(0)
    expect(loadSpion).not.toHaveBeenCalled()
  })
})