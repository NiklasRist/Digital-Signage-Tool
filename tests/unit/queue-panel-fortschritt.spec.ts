// Verhaltenstest zu #208 - der feine Render-Fortschritt des queue-panel
// (TK 9.2.7: Fortschritts- und Abbruch-Ereignisse, Quelle der Wahrheit).
//
// Der Name weicht von der Quell-Datei ab (`fortschritt.spec.ts` ist bereits durch
// #160 belegt, src/main/ffmpeg-adapter/fortschritt.ts) - dieselbe Aufloesung wie
// `queue-ereignis.spec.ts` neben `fortschritt.spec.ts` schon praktiziert.
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { RenderProgress } from '../../src/shared/contracts/render-progress'
import type { RenderFortschritt } from '../../src/renderer/queue-panel/fortschritt'
import { KANAELE } from '../../src/shared/contracts/kanaele'

// Attrappe fuer `abonniere` (#151): Die echte Funktion braucht `window.api` aus der
// Preload-Bruecke. Hier wird der Hoerer je Abo festgehalten und die Abmeldung als
// Spy geliefert. Dass nach der Abmeldung keine Ereignisse mehr zugestellt werden,
// ist mit der Attrappe absichtlich NICHT nachgestellt - diese Zusage muss DIESE Datei
// auf ihrer eigenen Seite absichern (Hoerer-Pruefung, s. letzter Test).
const attrappen = vi.hoisted(() => ({
  abonniere: vi.fn(),
}))

vi.mock('../../src/renderer/ipc-client/ereignisse', () => ({
  abonniere: attrappen.abonniere,
}))

const {
  ANFANGS_FORTSCHRITT,
  baueRenderFortschrittAuf,
  beschreibeFortschritt,
  uebernehmeFortschritt,
} = await import('../../src/renderer/queue-panel/fortschritt')

/** Ein Ereignis in der Form von TK 9.2.7 - Phase und Zahlen je Test waehlbar. */
function ereignis(
  renderId: string,
  phase: RenderProgress['phase'] = 'normalisieren',
  zahlen: { elementIndex?: number | null; elementAnzahl?: number | null } = {},
): RenderProgress {
  return {
    renderId,
    phase,
    elementIndex: zahlen.elementIndex ?? null,
    elementAnzahl: zahlen.elementAnzahl ?? null,
    elementId: null,
    prozent: 42,
  }
}

/** Doppel von `abonniere`: merkt den Hoerer und liefert die Abmeldung als Spy. */
function abonnementeDoppel() {
  let hoerer: ((nutzlast: RenderProgress) => void) | undefined
  const abmelden = vi.fn()

  attrappen.abonniere.mockImplementation(
    (_kanal: string, h: (nutzlast: RenderProgress) => void) => {
      hoerer = h
      return abmelden
    },
  )

  return {
    abmelden,
    sende(nutzlast: RenderProgress) {
      const h = hoerer
      if (h === undefined) {
        throw new Error('Test: auf dem Kanal hoert niemand')
      }
      h(nutzlast)
    },
  }
}

afterEach(() => {
  vi.resetAllMocks()
  vi.restoreAllMocks()
})

describe('uebernehmeFortschritt (#208)', () => {
  it('uebernimmt ein Ereignis mit passender renderId - mit DEM uebergebenen Objekt', () => {
    const e = ereignis('lauf-1')

    const stand = uebernehmeFortschritt(ANFANGS_FORTSCHRITT, e, 'lauf-1')

    expect(stand).toEqual({ zustand: 'gemeldet', ereignis: e })
    // toBe statt toEqual: Die Anzeige zeigt das Ereignis UNVERAENDERT, nicht eine Kopie.
    expect((stand as { ereignis: RenderProgress }).ereignis).toBe(e)
  })

  it('verwirft ein Ereignis mit fremder renderId - referenzgleich zu `bisher`, kein Zuruecksetzen', () => {
    const bisher: RenderFortschritt = {
      zustand: 'gemeldet',
      ereignis: ereignis('lauf-1'),
    }

    const stand = uebernehmeFortschritt(bisher, ereignis('lauf-2'), 'lauf-1')

    expect(Object.is(stand, bisher)).toBe(true)
    expect(stand).toEqual(bisher)
  })

  it('verwirft jedes Ereignis, wenn aktuelleRenderId null ist', () => {
    const bisher: RenderFortschritt = {
      zustand: 'gemeldet',
      ereignis: ereignis('lauf-1'),
    }

    expect(Object.is(uebernehmeFortschritt(bisher, ereignis('lauf-1'), null), bisher)).toBe(true)
    expect(
      Object.is(uebernehmeFortschritt(ANFANGS_FORTSCHRITT, ereignis('lauf-1'), null), ANFANGS_FORTSCHRITT),
    ).toBe(true)
  })

  it('laesst aktuell -> alt -> aktuell auf dem letzten Ereignis enden', () => {
    const a = ereignis('lauf-1') // aktuell
    const b = ereignis('lauf-2') // alt - reiht sich NACH A ein
    const c = ereignis('lauf-1') // wieder aktuell

    const nachA = uebernehmeFortschritt(ANFANGS_FORTSCHRITT, a, 'lauf-1')

    // B darf A weder loeschen noch auf `unbekannt` zuruecksetzen: Der Stand bleibt
    // der von A.
    const nachB = uebernehmeFortschritt(nachA, b, 'lauf-1')
    expect(Object.is(nachB, nachA)).toBe(true)
    expect(nachB).toEqual({ zustand: 'gemeldet', ereignis: a })
    expect(nachB).not.toEqual(ANFANGS_FORTSCHRITT)

    const nachC = uebernehmeFortschritt(nachB, c, 'lauf-1')
    expect(nachC).toEqual({ zustand: 'gemeldet', ereignis: c })
    expect((nachC as { ereignis: RenderProgress }).ereignis).toBe(c)
  })
})

describe('beschreibeFortschritt (#208)', () => {
  it('liefert bei `unbekannt` die leere Zeichenkette', () => {
    expect(ANFANGS_FORTSCHRITT).toEqual({ zustand: 'unbekannt' })
    expect(beschreibeFortschritt(ANFANGS_FORTSCHRITT)).toBe('')
  })

  it('macht aus Index 2 von 7 genau "Element 3 von 7 wird vorbereitet"', () => {
    const stand: RenderFortschritt = {
      zustand: 'gemeldet',
      ereignis: ereignis('lauf-1', 'normalisieren', { elementIndex: 2, elementAnzahl: 7 }),
    }

    expect(beschreibeFortschritt(stand)).toBe('Element 3 von 7 wird vorbereitet')
  })

  it('nennt bei verketten genau "Wird zusammengefügt"', () => {
    const stand: RenderFortschritt = {
      zustand: 'gemeldet',
      ereignis: ereignis('lauf-1', 'verketten'),
    }

    expect(beschreibeFortschritt(stand)).toBe('Wird zusammengefuegt')
  })

  it('laesst einen fehlenden Wert die Zahlen ganz verschwinden', () => {
    expect(
      beschreibeFortschritt({
        zustand: 'gemeldet',
        ereignis: ereignis('lauf-1', 'normalisieren', { elementIndex: null, elementAnzahl: 7 }),
      }),
    ).toBe('Elemente werden vorbereitet')

    expect(
      beschreibeFortschritt({
        zustand: 'gemeldet',
        ereignis: ereignis('lauf-1', 'normalisieren', { elementIndex: 2, elementAnzahl: null }),
      }),
    ).toBe('Elemente werden vorbereitet')
  })

  it('kuttert nichts, wenn elementIndex >= elementAnzahl - die Anzeige urteilt nicht ueber den Sender', () => {
    const stand: RenderFortschritt = {
      zustand: 'gemeldet',
      ereignis: ereignis('lauf-1', 'normalisieren', { elementIndex: 7, elementAnzahl: 3 }),
    }

    expect(beschreibeFortschritt(stand)).toBe('Element 8 von 3 wird vorbereitet')
  })

  it('behandelt eine zur Laufzeit unbekannte Phase wie normalisieren ohne Zahlen und wirft nicht', () => {
    // `RenderProgress` laesst die Phase nur als Union zu; der Wert kann aber zur
    // Laufzeit von aussen anders ankommen (Nutzlast der Gegenseite). Deshalb der
    // Cast - geprueft wird das Laufzeitverhalten, nicht der Typ.
    const fremdePhase = {
      renderId: 'lauf-1',
      phase: 'sonderfall',
      elementIndex: 5,
      elementAnzahl: 9,
      elementId: null,
      prozent: 10,
    } as unknown as RenderProgress
    const stand: RenderFortschritt = { zustand: 'gemeldet', ereignis: fremdePhase }

    expect(() => beschreibeFortschritt(stand)).not.toThrow()
    expect(beschreibeFortschritt(stand)).toBe('Elemente werden vorbereitet')
  })
})

describe('baueRenderFortschrittAuf (#208)', () => {
  it('abonniert den Kanal aus der Registry - kein Kanalname als String in der Datei', () => {
    abonnementeDoppel()

    baueRenderFortschrittAuf(() => 'lauf-1', vi.fn())

    expect(attrappen.abonniere).toHaveBeenCalledTimes(1)
    expect(attrappen.abonniere.mock.calls[0]?.[0]).toBe(KANAELE.render.fortschritt)
  })

  it('reicht ein uebernommenes Ereignis als gemeldeten Stand weiter - mit demselben Objekt', () => {
    const abos = abonnementeDoppel()
    const setzeFortschritt = vi.fn()
    const abbauen = baueRenderFortschrittAuf(() => 'lauf-1', setzeFortschritt)

    const e = ereignis('lauf-1')
    abos.sende(e)

    expect(setzeFortschritt).toHaveBeenCalledTimes(1)
    expect(setzeFortschritt).toHaveBeenCalledWith({ zustand: 'gemeldet', ereignis: e })
    const nutzlast = setzeFortschritt.mock.calls[0]?.[0] as
      | { ereignis: RenderProgress }
      | undefined
    expect(nutzlast?.ereignis).toBe(e)
    abbauen()
  })

  it('ruft leseAktuelleRenderId bei JEDEM Ereignis erneut - nicht einmalig beim Aufbau', () => {
    const abos = abonnementeDoppel()
    const aktuell = vi.fn(() => 'lauf-1')

    baueRenderFortschrittAuf(aktuell, vi.fn())

    // Schon der Aufbau darf die aktuellste renderId nicht einfrieren.
    expect(aktuell).not.toHaveBeenCalled()

    abos.sende(ereignis('lauf-1'))
    abos.sende(ereignis('lauf-1'))
    abos.sende(ereignis('lauf-1'))

    expect(aktuell).toHaveBeenCalledTimes(3)
  })

  it('ruft setzeFortschritt bei einem Ereignis mit fremder renderId nicht', () => {
    const abos = abonnementeDoppel()
    const setzeFortschritt = vi.fn()

    baueRenderFortschrittAuf(() => 'lauf-1', setzeFortschritt)
    abos.sende(ereignis('lauf-2'))

    expect(setzeFortschritt).not.toHaveBeenCalled()
  })

  it('ruft setzeFortschritt nicht, solange kein Render laeuft (leseAktuelleRenderId null)', () => {
    const abos = abonnementeDoppel()
    const setzeFortschritt = vi.fn()

    baueRenderFortschrittAuf(() => null, setzeFortschritt)
    abos.sende(ereignis('lauf-1'))
    abos.sende(ereignis('lauf-9'))

    expect(setzeFortschritt).not.toHaveBeenCalled()
  })

  it('faengt ein werfendes leseAktuelleRenderId ab und behandelt das Ereignis wie verworfen', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const abos = abonnementeDoppel()
    const setzeFortschritt = vi.fn()

    baueRenderFortschrittAuf(() => {
      throw new Error('Attrappe kaputt')
    }, setzeFortschritt)

    expect(() => abos.sende(ereignis('lauf-1'))).not.toThrow()
    expect(setzeFortschritt).not.toHaveBeenCalled()
  })

  it('faengt ein werfendes Abonnieren ab - ohne Wurf, Abmelde-Funktion aufrufbar und wirkungslos', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    attrappen.abonniere.mockImplementation(() => {
      throw new Error('Bruecke fehlt')
    })

    const abbauen = baueRenderFortschrittAuf(() => 'lauf-1', vi.fn())

    expect(() => abbauen()).not.toThrow()
    expect(() => abbauen()).not.toThrow()
  })

  it('meldet die Kanal-Abmeldung genau EINMAL ab; ein danach zugestelltes Ereignis setzt nichts', () => {
    const abos = abonnementeDoppel()
    const setzeFortschritt = vi.fn()
    const abbauen = baueRenderFortschrittAuf(() => 'lauf-1', setzeFortschritt)

    setzeFortschritt.mockClear()

    abbauen()
    // Zweiter und dritter Aufruf sind wirkungslos - React-Aufraeumfunktionen laufen
    // in der Entwicklung doppelt.
    expect(() => {
      abbauen()
      abbauen()
    }).not.toThrow()

    expect(abos.abmelden).toHaveBeenCalledTimes(1)

    // Die Attrappe stellt nach der Abmeldung weiterhin zu; die Zusage „danach kommt
    // nichts mehr" muss diese Datei selbst absichern.
    expect(() => abos.sende(ereignis('lauf-1'))).not.toThrow()
    expect(setzeFortschritt).not.toHaveBeenCalled()
  })
})