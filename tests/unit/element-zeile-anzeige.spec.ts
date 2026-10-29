// Tests zu #249 (M7-56) - die Bedienelemente (element-zeile.tsx, jsdom).
// `begrenze` und `baueReglerModell` laufen ECHT (#125); ersetzt werden nur die
// beiden IPC-Wege `uebernehmeGrenzen` (#125) und `entferneElementAusListe` (#124).
// Die Ziehbewegung wird über echte Mausereignisse geführt (mousedown/mousemove/
// mouseup auf window, Position über einen gepatchten getBoundingClientRect).
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createElement, type ReactElement } from 'react'

import type { Asset } from '../../src/shared/contracts/asset'
import type { Listenelement } from '../../src/shared/contracts/project'
import type { Vorlage } from '../../src/shared/contracts/vorlage'
import type { Ergebnis } from '../../src/shared/contracts/ergebnis'

// ---------------- Doppel (hoisted, Pattern wie aktion-loeschen.spec.ts) ----------------

const doppel = vi.hoisted(() => ({
  uebernehme: [] as Array<{ element: unknown; anfang: number; ende: number }>,
  uebernehmeAntwort: null as unknown,
  entferne: [] as string[],
  entferneAntwort: null as unknown,
}))

vi.mock('../../src/renderer/composer/dauer-regler', async (importOriginal) => {
  const echt = await importOriginal<typeof import('../../src/renderer/composer/dauer-regler')>()
  return {
    ...echt,
    uebernehmeGrenzen: async (
      element: Listenelement,
      anfang: number,
      ende: number,
    ) => {
      doppel.uebernehme.push({ element, anfang, ende })
      return doppel.uebernehmeAntwort as Ergebnis<Listenelement>
    },
  }
})

vi.mock('../../src/renderer/composer/element-entfernen', async (importOriginal) => {
  const echt = await importOriginal<typeof import('../../src/renderer/composer/element-entfernen')>()
  return {
    ...echt,
    entferneElementAusListe: async (elementId: string) => {
      doppel.entferne.push(elementId)
      return doppel.entferneAntwort as Ergebnis<void>
    },
  }
})

import { ElementBedienung } from '../../src/renderer/composer/element-zeile.tsx'


// React 19: act(...)-Umgebung (Muster wie leiste-zeile.spec.ts).
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// ---------------- Bausteine ----------------

function element(ueber: Partial<Listenelement> = {}): Listenelement {
  const basis: Listenelement = {
    id: 'e-1',
    art: 'video',
    ref: 'a-1',
    dauer: null,
    trimStart: 2.5,
    trimEnde: 12.5,
    einblendung: null,
  }
  return { ...basis, ...ueber }
}

function asset(): Asset {
  return {
    id: 'a-1',
    typ: 'video',
    dateiname: 'aa.mp4',
    originalname: 'Aufwaermen.mp4',
    maße: { breite: 1920, höhe: 1080 },
    dauer: 30.7,
    importdatum: '2026-08-01T09:00:00Z',
    zustand: 'ok',
  }
}

const VORLAGEN: readonly Vorlage[] = [
  { id: 'band-1', name: 'Standardband', art: 'einblendung', höhe: 162, parent: null, eingebaut: false, zonen: [] },
]

function eigenschaften(
  elementwert: Listenelement,
  ueber: Partial<Parameters<typeof ElementBedienung>[0]> = {},
): Parameters<typeof ElementBedienung>[0] {
  return {
    element: elementwert,
    asset: elementwert.art === 'video' ? asset() : null,
    vorlagen: VORLAGEN,
    kaputteBandAbschnitte: [],
    aufEinblendungBearbeiten: vi.fn(),
    aufFehler: vi.fn(),
    sichtSchreiber: () => {},
    ...ueber,
  }
}

function rendere(props: Parameters<typeof ElementBedienung>[0]): {
  behaelter: HTMLDivElement
  fertig: () => void
} {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel: Root = createRoot(behaelter)
  act(() => {
    wurzel.render(createElement(ElementBedienung, props) as ReactElement)
  })
  return {
    behaelter,
    fertig: () => {
      act(() => {
        wurzel.unmount()
      })
      behaelter.remove()
    },
  }
}

const text = (behaelter: HTMLElement, testId: string): string =>
  behaelter.querySelector(`[data-testid="${testId}"]`)?.textContent ?? ''

beforeEach(() => {
  doppel.uebernehme = []
  doppel.uebernehmeAntwort = { ok: true, wert: undefined }
  doppel.entferne = []
  doppel.entferneAntwort = { ok: true, wert: undefined }
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  delete (HTMLElement.prototype as { getBoundingClientRect?: unknown }).getBoundingClientRect
})

/** Patcht die Balkenbreite auf 1000 px bei left 0 (jsdom liefert sonst Nullen). */
function patcheBalkenBreite(): void {
  ;(HTMLElement.prototype as unknown as { getBoundingClientRect: () => DOMRect }).getBoundingClientRect =
    function (): DOMRect {
      return {
        x: 0, y: 0, top: 0, left: 0, right: 1000, bottom: 10, width: 1000, height: 10, toJSON: () => ({}),
      } as DOMRect
    }
}

// ---------------- Kernnachweis: Ziehen ohne Aufruf, Loslassen genau einmal ----------------

describe('Ziehbewegung (#249)', () => {
  function bewege(vonX: number, bisX: number): void {
    const griff = document.querySelector('[data-testid="element-griff-ende"]') as HTMLElement
    act(() => {
      griff.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })
    const schritte = 4
    for (let i = 1; i <= schritte; i += 1) {
      const x = vonX + ((bisX - vonX) * i) / schritte
      act(() => {
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: x }))
      })
    }
  }

  function lasseLos(): void {
    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'))
    })
  }

  it('waehrend einer mehrschrittigen Geste wird uebernehmeGrenzen NULL Mal gerufen; erst das Loslassen GENAU EINMAL', () => {
    patcheBalkenBreite()
    const e = element()
    const props = eigenschaften(e)
    const { behaelter, fertig } = rendere(props)

    // Balkenbreite 1000, Spanne 0..30.7: clientX 250 -> 7.675 s, 500 -> 15.35 s.
    bewege(250, 500)
    expect(doppel.uebernehme.length).toBe(0)
    // Die Anzeige folgt bereits waehrend des Ziehens: ende = 15.35, dauer = 12.85
    // (toFixed rundet die Gleitkommaversion von 12.85 auf 12,8).
    expect(text(behaelter, 'element-dauer')).toContain('12,8 s')

    lasseLos()
    expect(doppel.uebernehme.length).toBe(1)
    expect(doppel.uebernehme[0]?.anfang).toBe(2.5)
    expect(doppel.uebernehme[0]?.ende).toBeCloseTo(15.35, 6)
    fertig()
  })

  it('uebernehmeGrenzen wird mit DEM element aus den Eigenschaften gerufen (toBe)', () => {
    patcheBalkenBreite()
    const e = element()
    const { fertig } = rendere(eigenschaften(e))
    act(() => {
      const griff = document.querySelector('[data-testid="element-griff-ende"]') as HTMLElement
      griff.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 400 }))
    })
    lasseLos()
    expect(doppel.uebernehme[0]?.element).toBe(e)
    fertig()
  })

  it('Loslassen OHNE Bewegung ruft uebernehmeGrenzen NULL Mal', () => {
    patcheBalkenBreite()
    const { fertig } = rendere(eigenschaften(element()))
    act(() => {
      const griff = document.querySelector('[data-testid="element-griff-ende"]') as HTMLElement
      griff.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })
    lasseLos()
    expect(doppel.uebernehme.length).toBe(0)
    fertig()
  })

  it('abgelehntes uebernehmeGrenzen: aufFehler GENAU EINMAL mit UNVERÄNDERTEM Code, Anzeige zurueck auf dem Modell', async () => {
    patcheBalkenBreite()
    const e = element()
    const props = eigenschaften(e)
    const { behaelter, fertig } = rendere(props)
    const loeser: { loesen?: (wert: unknown) => void } = {}
    doppel.uebernehmeAntwort = new Promise((resolve) => {
      loeser.loesen = resolve
    })

    act(() => {
      const griff = document.querySelector('[data-testid="element-griff-ende"]') as HTMLElement
      griff.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 400 }))
    })
    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'))
    })
    // Solange die Zusage offene ist, gilt die gezogene Lage.
    expect(doppel.uebernehme.length).toBe(1)
    loeser.loesen?.({ ok: false, fehler: { code: 'ungueltige_eingabe', meldung: 'abgelehnt' } } as unknown)
    await act(async () => {
      await Promise.resolve()
    })
    expect(props.aufFehler).toHaveBeenCalledTimes(1)
    expect(props.aufFehler).toHaveBeenCalledWith('ungueltige_eingabe', 'abgelehnt')
    // Zurück auf der Ruhelage des Modells (12.5 - 2.5 = 10).
    expect(text(behaelter, 'element-dauer')).toContain('10,0 s')
    fertig()
  })

  it('Elementwechsel während der Geste: die Anzeige steht auf der Ruhelage des NEUEN Modells', () => {
    patcheBalkenBreite()
    const e = element()
    const { behaelter, fertig } = rendere(eigenschaften(e))
    act(() => {
      const griff = document.querySelector('[data-testid="element-griff-ende"]') as HTMLElement
      griff.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    })
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 700 }))
    })
    // Jetzt wechselt das Element unter der laufenden Geste: ein Segment (griffe 1,
    // dauer 20) - die Anzeige steht auf der Ruhelage des NEUEN Modells, der
    // Anfangsgriff darf nicht erscheinen.
    const neu = element({ id: 'e-2', art: 'segment', trimStart: null, trimEnde: null, dauer: 20 })
    const props2 = eigenschaften(neu)
    const zweites = rendere(props2)
    expect(text(zweites.behaelter, 'element-dauer')).toContain('20,0 s')
    expect(zweites.behaelter.querySelector('[data-testid="element-griff-anfang"]')).toBeNull()
    zweites.fertig()
    void behaelter
    fertig()
  })
})

// ---------------- EIN Bauteil für alle drei Elementarten ----------------

describe('dasselbe Bauteil fr alle drei Elementarten (#249, ENTSCHIEDEN 1)', () => {
  it('Video: zwei Griffe; Segment: ein Griff; beide zeigen dieselbe data-testid-Struktur für Regler und Entfernen; der Band-Zugang ist nur beim Video', () => {
    patcheBalkenBreite()
    const video = rendere(eigenschaften(element()))
    const videoSatz = ['element-regler', 'element-dauer', 'element-balken', 'element-griff-ende', 'element-entfernen']
    for (const testId of videoSatz) {
      expect(video.behaelter.querySelector(`[data-testid="${testId}"]`)).not.toBeNull()
    }
    expect(video.behaelter.querySelector('[data-testid="element-griff-anfang"]')).not.toBeNull()
    expect(video.behaelter.querySelector('[data-testid="element-band"]')).not.toBeNull()
    video.fertig()

    // Segment: art 'segment' (AD/TK v3.16: die Art bild ist gestrichen) -
    // baueReglerModell nimmt dauer als Länge, asset null.
    const segmentElement = element({ art: 'segment', dauer: 20, trimStart: null, trimEnde: null })
    const segment = rendere(eigenschaften(segmentElement))
    for (const testId of videoSatz) {
      expect(segment.behaelter.querySelector(`[data-testid="${testId}"]`)).not.toBeNull()
    }
    expect(segment.behaelter.querySelector('[data-testid="element-griff-anfang"]')).toBeNull()
    expect(segment.behaelter.querySelector('[data-testid="element-band"]')).toBeNull()
    segment.fertig()
  })
})

// ---------------- Regler nicht baubar (ENTSCHIEDEN 9) ----------------

describe('baueReglerModell lehnt ab (#249)', () => {
  it('kein Balken, aber Entfernen und Band-Zugang bleiben im DOM', () => {
    const vernichtet = element({ ref: 'fehlt' }) // Video ohne Asset -> nicht_gefunden
    const { behaelter, fertig } = rendere(eigenschaften(vernichtet, { asset: null }))
    expect(behaelter.querySelector('[data-testid="element-balken"]')).toBeNull()
    expect(behaelter.querySelector('[data-testid="element-entfernen"]')).not.toBeNull()
    expect(behaelter.querySelector('[data-testid="element-band"]')).not.toBeNull()
    fertig()
  })
})

// ---------------- Band-Zugang (ENTSCHIEDEN 6 / 6a) ----------------

describe('Band-Zugang (#249)', () => {
  it('erscheint nur bei bedienbar: true (Segment: kein Band) und ruft aufEinblendungBearbeiten GENAU EINMAL mit element.id', () => {
    patcheBalkenBreite()
    const { behaelter, fertig } = rendere(eigenschaften(element()))
    expect(behaelter.querySelector('[data-testid="element-band"]')).not.toBeNull()

    const segment = rendere(eigenschaften(element({ art: 'segment', dauer: 20, trimStart: null, trimEnde: null })))
    expect(segment.behaelter.querySelector('[data-testid="element-band"]')).toBeNull()
    segment.fertig()

    const props = eigenschaften(element())
    const band = rendere(props)
    act(() => {
      ;(band.behaelter.querySelector('[data-testid="element-band"]') as HTMLElement).click()
    })
    expect(props.aufEinblendungBearbeiten).toHaveBeenCalledTimes(1)
    expect(props.aufEinblendungBearbeiten).toHaveBeenCalledWith('e-1')
    band.fertig()
    fertig()
  })

  it('FALL 3 aus TK 9.7.5: kaputte Band-Abschnitte markieren den Zugang und nennen die ANZAHL - ohne Neuberechnung', () => {
    patcheBalkenBreite()
    const e = element({
      einblendung: { bandVorlageId: 'band-1', abschnitte: [{ aktionRef: 'a-1', dauer: 3.13 }] },
    })
    const { behaelter, fertig } = rendere(eigenschaften(e, { kaputteBandAbschnitte: [1, 4] }))
    const band = behaelter.querySelector('[data-testid="element-band"]') as HTMLElement
    expect(band.textContent).toContain('2')
    expect(band.textContent).toContain('kaputt')
    fertig()
    // Bei leerem Array: keine Kennzeichnung.
    const normal = rendere(eigenschaften(e))
    expect(text(normal.behaelter, 'element-band')).not.toContain('kaputt')
    normal.fertig()
  })

  it('nennt die ANZAHL aus den uebergebenen Indizes (drei Abschnitte -> 3, nicht die Testzahl 2)', () => {
    patcheBalkenBreite()
    const e = element({
      einblendung: { bandVorlageId: 'band-1', abschnitte: [{ aktionRef: 'a-1', dauer: 3.13 }] },
    })
    const { behaelter, fertig } = rendere(eigenschaften(e, { kaputteBandAbschnitte: [0, 2, 5] }))
    const band = behaelter.querySelector('[data-testid="element-band"]') as HTMLElement
    expect(band.textContent).toContain('3 kaputt')
    fertig()
  })
})

// ---------------- Entfernen (ENTSCHIEDEN 7) ----------------

describe('Entfernen (#249)', () => {
  it('ruft entferneElementAusListe GENAU EINMAL mit element.id; KEIN Bestaetigungsdialog im DOM', () => {
    patcheBalkenBreite()
    doppel.entferneAntwort = { ok: true, wert: undefined }
    const e = element()
    const { behaelter, fertig } = rendere(eigenschaften(e))
    act(() => {
      ;(behaelter.querySelector('[data-testid="element-entfernen"]') as HTMLElement).click()
    })
    expect(doppel.entferne).toEqual(['e-1'])
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    expect(document.querySelector('dialog')).toBeNull()
    fertig()
  })

  it('abgelehntes Entfernen: aufFehler GENAU EINMAL; die Zeile bleibt im DOM', async () => {
    patcheBalkenBreite()
    doppel.entferneAntwort = { ok: false, fehler: { code: 'nicht_gefunden', meldung: 'fehlt' } }
    const props = eigenschaften(element())
    const { behaelter, fertig } = rendere(props)
    await act(async () => {
      ;(behaelter.querySelector('[data-testid="element-entfernen"]') as HTMLElement).click()
      await Promise.resolve()
    })
    expect(props.aufFehler).toHaveBeenCalledTimes(1)
    expect(props.aufFehler).toHaveBeenCalledWith('nicht_gefunden', 'fehlt')
    expect(behaelter.querySelector('[data-testid="element-entfernen"]')).not.toBeNull()
    fertig()
  })
})
