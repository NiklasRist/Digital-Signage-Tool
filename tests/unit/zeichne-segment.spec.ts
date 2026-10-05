// Verhaltenstests zu #117 (M4-23) - zeichneSegment.
//
// Ohne Browser pruefbar (DoD): document.createElement('canvas') und getContext('2d')
// werden durch Aufzeichnungs-Doppel ersetzt; die drei Zonen-Funktionen (#114/#115/#116)
// sowie holeMotiv, holeLogo, sindSchriftenBereit und loeseFarbe sind Doppel. Die
// Zonen-Funktionen sind standheute noch Ruempfe - hier werden sie GEMOCKT, weil #117
// nur deren VERTRAG kennt (dieselbe Einordnung wie im Issue-DoD vorgesehen).

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Vorlage, Zone } from '../../src/shared/contracts/vorlage'
import type { Marke } from '../../src/shared/contracts/marke'

// ---------------------------------------------------------------------------
// Aufzeichnungs-Doppel des Canvas
// ---------------------------------------------------------------------------

let canvasZaehler = 0
let contextAufrufe: { argumente: unknown[] }[] = []
let ctx2d: Record<string, unknown> | null

beforeEach(() => {
  canvasZaehler = 0
  contextAufrufe = []
  ctx2d = { fillRect: (..._a: unknown[]) => undefined }
  vi.stubGlobal('document', {
    createElement: (tag: string) => {
      if (tag !== 'canvas') throw new Error('nur canvas erwartet')
      canvasZaehler += 1
      return {
        width: 0,
        height: 0,
        getContext: (...argumente: unknown[]) => {
          contextAufrufe.push({ argumente })
          return ctx2d as unknown as CanvasRenderingContext2D
        },
      } as unknown as HTMLCanvasElement
    },
  })
})

// ---------------------------------------------------------------------------
// Doppel der fremden Module mit Aufruf-Aufzeichnung
// ---------------------------------------------------------------------------

const aufrufeMarkenSchriften: Marke[] = []
const aufrufeErsatz: unknown[][] = []

const aufrufe = {
  deko: [] as unknown[][],
  text: [] as unknown[][],
  bild: [] as unknown[][],
  holeMotiv: [] as unknown[],
  holeLogo: [] as unknown[],
  loeseFarbe: [] as unknown[][],
}

vi.mock('../../src/renderer/template-canvas/zone-deko', () => ({
  zeichneDekoZone: (...a: unknown[]) => void aufrufe.deko.push(a),
}))
vi.mock('../../src/renderer/template-canvas/zone-text', () => ({
  zeichneTextZone: (...a: unknown[]) => void aufrufe.text.push(a),
}))
vi.mock('../../src/renderer/template-canvas/zone-bild', () => ({
  zeichneBildZone: (...a: unknown[]) => void aufrufe.bild.push(a),
}))
vi.mock('../../src/renderer/template-canvas/bild-laden', () => ({
  holeMotiv: (schluessel: string) => {
    aufrufe.holeMotiv.push(schluessel)
    return motivAntwort
  },
}))
vi.mock('../../src/renderer/template-canvas/logo-laden', () => ({
  holeLogo: (...a: unknown[]) => {
    aufrufe.holeLogo.push(a)
    return logoAntwort
  },
}))
vi.mock('../../src/renderer/template-canvas/schriften', () => ({
  sindSchriftenBereit: () => schriftenBereit,
}))
vi.mock('../../src/renderer/template-canvas/marken-schriften', () => ({
  sindMarkenSchriftenBereit: (m: Marke) => {
    aufrufeMarkenSchriften.push(m)
    return markenSchriftenBereit
  },
}))
vi.mock('../../src/renderer/template-canvas/ersatz-logo', () => ({
  zeichneErsatzLogo: (...a: unknown[]) => void aufrufeErsatz.push(a),
}))
vi.mock('../../src/renderer/template-canvas/farben', () => ({
  loeseFarbe: (...a: unknown[]) => {
    aufrufe.loeseFarbe.push(a)
    return '#GEMESSEN'
  },
}))

import { zeichneSegment } from '../../src/renderer/template-canvas/zeichne-segment'

let schriftenBereit = true
let markenSchriftenBereit = true
let motivAntwort: unknown = { zustand: 'geladen', bild: {}, breite: 10, höhe: 10 }
let logoAntwort: unknown = { zustand: 'geladen', bild: {}, breite: 420, höhe: 120 }

// ---------------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------------

function aktion(overrides: Partial<Aktion> = {}): Aktion {
  return {
    id: 'a1',
    titel: 'Sommer-Angebot',
    beschreibung: 'Alle Kurse',
    preis: '19,90 €',
    bildRef: null,
    cta: 'Jetzt melden',
    standardDauer: null,
    vorlagenId: 'vollbild',
    akzentfarbe: null,
    elemente: [],
    markeId: 'm1',
    ...overrides,
  } as unknown as Aktion
}

function zone(partial: Partial<Zone>): Zone {
  return {
    id: partial.id ?? `zone-${Math.random()}`,
    rolle: 'frei',
    bindung: null,
    rahmen: { x: 0, y: 0, breite: 100, höhe: 50 },
    ausrichtung: { horizontal: 'links', vertikal: 'mitte' },
    wennLeer: 'leer',
    ...partial,
  } as unknown as Zone
}

function vorlage(art: Vorlage['art'], zonen: Zone[], höhe: number | null = null): Vorlage {
  return {
    id: art === 'vollflaeche' ? 'vollbild' : `band-${String(höhe)}`,
    name: 'Testvorlage',
    art,
    höhe,
    parent: null,
    eingebaut: true,
    zonen,
  }
}

function marke(): Marke {
  return {
    id: 'm1',
    name: 'Fitnessworld24',
    farben: {},
    schriften: {},
    logo: { datei: 'logo.png', herkunft: 'gebuendelt', seitenverhaeltnis: 3.5 },
    slogan: { text: 'Fit werden', aktiv: true },
    herkunftJeFeld: {},
  } as unknown as Marke
}

function werfendeMarke(): Marke {
  return new Proxy({} as unknown as Marke, {
    get() {
      throw new Error('rahmenMarke durfte nicht gelesen werden')
    },
  })
}

function einblendung(mitHintergrund: boolean): Vorlage {
  const zonen: Zone[] = mitHintergrund
    ? [zone({ id: 'hintergrund', bindung: null })]
    : []
  return vorlage('einblendung', zonen, 200)
}

describe('zeichneSegment (#117/#294)', () => {
  beforeEach(() => {
    for (const schlüssel of Object.keys(aufrufe)) {
      ;(aufrufe as Record<string, unknown[]>)[schlüssel] = []
    }
    schriftenBereit = true
    markenSchriftenBereit = true
    aufrufeMarkenSchriften.length = 0
    aufrufeErsatz.length = 0
    motivAntwort = { zustand: 'geladen', bild: {}, breite: 10, höhe: 10 }
    logoAntwort = { zustand: 'geladen', bild: {}, breite: 420, höhe: 120 }
  })

  describe('Flaeche (Ablauf 1/2)', () => {
    it('vollflaeche -> 1920 x 1080 aus RENDER_PROFILE, zurueckgemeldet in breite/höhe', () => {
      const ergebnis = zeichneSegment(aktion(), vorlage('vollflaeche', []), marke(), marke())
      expect(ergebnis.breite).toBe(1920)
      expect(ergebnis.höhe).toBe(1080)
      expect(ergebnis.canvas.width).toBe(1920)
      expect(ergebnis.canvas.height).toBe(1080)
    })

    it.each([
      ['split', 162],
      ['einblendung', 200],
    ] as const)('%s mit hoehe %i -> 1920 x %i', (art, hoehe) => {
      const ergebnis = zeichneSegment(aktion(), vorlage(art, [], hoehe), marke(), marke())
      expect(ergebnis.höhe).toBe(hoehe)
      expect(ergebnis.canvas.height).toBe(hoehe)
    })

    it.each([null, 0, -10, Number.NaN, 1080])(
      'split mit hoehe %p wirft, Meldung nennt die Vorlagen-ID',
      (hoehe) => {
        expect(() =>
          zeichneSegment(aktion(), vorlage('split', [], hoehe as number), marke(), marke()),
        ).toThrow(/band-/)
      },
    )

    it.each([
      ['split', 161],
      ['einblendung', 1],
    ] as const)('ungerade hoehe %i wird bewusst NICHT abgewiesen oder gerundet', (art, hoehe) => {
      const ergebnis = zeichneSegment(aktion(), vorlage(art, [], hoehe), marke(), marke())
      expect(ergebnis.höhe).toBe(hoehe) // nachweislich nicht gerundet
    })

    it('getContext wird mit genau einem Argument aufgerufen', () => {
      zeichneSegment(aktion(), vorlage('vollflaeche', []), marke(), marke())
      expect(contextAufrufe).toHaveLength(1)
      expect(contextAufrufe[0]?.argumente).toHaveLength(1)
    })

    it('getContext null -> Wurf', () => {
      ctx2d = null
      expect(() => zeichneSegment(aktion(), vorlage('vollflaeche', []), marke(), marke())).toThrow(
        /getContext/,
      )
    })
  })

  describe('Schrift-Pruefung (Ablauf 0)', () => {
    it('nicht bereite Schriften -> Wurf, BEVOR ein Canvas entsteht', () => {
      schriftenBereit = false
      expect(() => zeichneSegment(aktion(), vorlage('vollflaeche', []), marke(), marke())).toThrow(
        /nicht bereit/,
      )
      expect(canvasZaehler).toBe(0)
    })
  })

  describe('Grundflaeche (Ablauf 3)', () => {
    it('vollflaeche und split fuellen ueber loeseFarbe("flaecheDunkel"), einblendung nicht', () => {
      zeichneSegment(aktion(), vorlage('vollflaeche', []), marke(), marke())
      expect(aufrufe.loeseFarbe).toHaveLength(1)
      expect(aufrufe.loeseFarbe[0]?.[1]).toBe('flaecheDunkel')

      aufrufe.loeseFarbe.length = 0
      zeichneSegment(aktion(), vorlage('split', [], 162), marke(), marke())
      expect(aufrufe.loeseFarbe).toHaveLength(1)

      aufrufe.loeseFarbe.length = 0
      zeichneSegment(aktion(), vorlage('einblendung', [], 200), marke(), marke())
      expect(aufrufe.loeseFarbe).toHaveLength(0) // kein Vorfuellen bei Alpha
    })
  })

  describe('Zonen-Ablauf (Ablauf 4)', () => {
    it('Array-Reihenfolge bleibt erhalten - absichtlich unsortierte IDs werden nicht sortiert', () => {
      const zonen = [
        zone({ id: 'z-cta', bindung: 'cta' }),
        zone({ id: 'z-titel', bindung: 'titel' }),
        zone({ id: 'z-preis', bindung: 'preis' }),
      ]
      zeichneSegment(aktion(), vorlage('vollflaeche', zonen), marke(), marke())
      expect(aufrufe.text.map((a) => (a[1] as Zone).id)).toEqual(['z-cta', 'z-titel', 'z-preis'])
    })

    it.each(['titel', 'beschreibung', 'preis', 'cta'] as const)(
      'bindung %s zeichnet Text aus der AKTION',
      (bindung) => {
        const a = aktion()
        zeichneSegment(a, vorlage('vollflaeche', [zone({ bindung })]), marke(), marke())
        expect(aufrufe.text).toHaveLength(1)
        expect(aufrufe.holeMotiv).toHaveLength(0)
      },
    )

    it('slogan kommt aus der MARKE, nicht aus der Aktion', () => {
      const m = marke()
      zeichneSegment(
        aktion(),
        vorlage('vollflaeche', [zone({ bindung: 'slogan' })]),
        m,
        m,
      )
      expect(aufrufe.text).toHaveLength(1)
      expect(aufrufe.text[0]?.[2]).toBe('Fit werden') // marke.slogan.text
    })

    it('slogan inaktiv gilt als leerer Wert (wennLeer entscheidet)', () => {
      const m = marke()
      ;(m as { slogan: { aktiv: boolean } }).slogan.aktiv = false
      zeichneSegment(
        aktion(),
        vorlage('vollflaeche', [zone({ bindung: 'slogan', wennLeer: 'leer' })]),
        m,
        m,
      )
      expect(aufrufe.deko).toHaveLength(1)
      expect(aufrufe.text).toHaveLength(0)
    })

    it('bild reicht aktion.bildRef UNveraendert an holeMotiv durch', () => {
      const a = aktion({ bildRef: 'asset-id-42' })
      zeichneSegment(a, vorlage('vollflaeche', [zone({ bindung: 'bild' })]), marke(), marke())
      expect(aufrufe.holeMotiv).toEqual(['asset-id-42'])
      expect(aufrufe.bild).toHaveLength(1)
    })

    it('logo holt sein Motiv ueber holeLogo(markeId), nie ueber holeMotiv', () => {
      const m = marke()
      zeichneSegment(aktion(), vorlage('vollflaeche', [zone({ bindung: 'logo' })]), m, m)
      expect(aufrufe.holeLogo).toHaveLength(1)
      // GEMELDETER WIDERSPRUCH (#117 vs. gebauter Code): Der Issue-Text nennt
      // holeLogo() parameterlos; der gebaute Stand nach dem Edit an #119/#315 ist
      // holeLogo(markeId) und #294 weist die Umstellung DIESER Datei zu.
      expect(aufrufe.holeLogo[0]).toEqual([m.id])
      expect(aufrufe.holeMotiv).toHaveLength(0) // logo.datei geht NIE an holeMotiv
      expect(aufrufe.bild).toHaveLength(1)
    })

    it('die Aktion wird an alle Zonen-Funktionen und loeseFarbe als LETZTES Argument durchgereicht - dieselbe Referenz', () => {
      const a = aktion({
        bildRef: 'x',
      })
      const zonen = [
        zone({ bindung: 'titel', deko: {} }),
        zone({ bindung: 'bild', deko: {} }),
        zone({ id: 'nur-deko', bindung: null }),
      ]
      zeichneSegment(a, vorlage('vollflaeche', zonen), marke(), marke())

      for (const ruf of [...aufrufe.text, ...aufrufe.bild, ...aufrufe.deko]) {
        expect(ruf[ruf.length - 1]).toBe(a) // toBe, nicht toEqual
      }
      for (const ruf of aufrufe.loeseFarbe) {
        expect(ruf[ruf.length - 1]).toBe(a)
      }
    })

    it("preis: null + wennLeer 'leer' -> Deko bleibt stehen, kein Text", () => {
      zeichneSegment(
        aktion({ preis: null }),
        vorlage('vollflaeche', [zone({ bindung: 'preis', wennLeer: 'leer' })]),
        marke(),
        marke(),
      )
      expect(aufrufe.deko).toHaveLength(1)
      expect(aufrufe.text).toHaveLength(0)
    })

    it("preis: null + wennLeer 'ausblenden' -> weder Deko noch Text", () => {
      zeichneSegment(
        aktion({ preis: null }),
        vorlage('vollflaeche', [zone({ bindung: 'preis', wennLeer: 'ausblenden' })]),
        marke(),
        marke(),
      )
      expect(aufrufe.deko).toHaveLength(0)
      expect(aufrufe.text).toHaveLength(0)
    })

    it("preis: '   ' (nur Leerzeichen) gilt wie null", () => {
      zeichneSegment(
        aktion({ preis: '   ' }),
        vorlage('vollflaeche', [zone({ bindung: 'preis', wennLeer: 'ausblenden' })]),
        marke(),
        marke(),
      )
      expect(aufrufe.deko).toHaveLength(0)
    })

    it('bildRef: null -> KEIN holeMotiv, KEIN Platzhalter (Bild ist optional, FA-02)', () => {
      zeichneSegment(
        aktion({ bildRef: null }),
        vorlage('vollflaeche', [zone({ bindung: 'bild', wennLeer: 'leer' })]),
        marke(),
        marke(),
      )
      expect(aufrufe.holeMotiv).toHaveLength(0)
      expect(aufrufe.bild).toHaveLength(0)
    })

    it('fehlendes Motiv wird UNveraendert weitergegeben - die Zone wird nicht uebersprungen', () => {
      motivAntwort = { zustand: 'fehlt' }
      logoAntwort = { zustand: 'fehlt' }
      zeichneSegment(
        aktion({ bildRef: 'weg' }),
        vorlage('vollflaeche', [
          zone({ bindung: 'bild' }),
          zone({ id: 'logo-zone', bindung: 'logo' }),
        ]),
        marke(),
        marke(),
      )
      expect(aufrufe.bild).toHaveLength(2)
      expect(aufrufe.bild[0]?.[2]).toEqual({ zustand: 'fehlt' })
      expect(aufrufe.bild[1]?.[2]).toEqual({ zustand: 'fehlt' })
    })

    it('unbekannte Bindung -> nur Deko, kein Ratens', () => {
      const z = zone({})
      ;(z as { bindung: string }).bindung = 'irgendwas'
      zeichneSegment(aktion(), vorlage('vollflaeche', [z]), marke(), marke())
      expect(aufrufe.deko).toHaveLength(1)
      expect(aufrufe.text).toHaveLength(0)
      expect(aufrufe.bild).toHaveLength(0)
    })

    it('zonen: [] -> gueltiges SegmentBild ohne Ausnahme', () => {
      const ergebnis = zeichneSegment(aktion(), vorlage('vollflaeche', []), marke(), marke())
      expect(ergebnis.breite).toBe(1920)
    })

    it('Determinismus: zwei identische Aufrufe -> identische Aufruffolge', () => {
      const bauen = () => {
        for (const schlüssel of Object.keys(aufrufe)) {
          ;(aufrufe as Record<string, unknown[]>)[schlüssel] = []
        }
        zeichneSegment(
          aktion({ bildRef: 'b' }),
          vorlage('split', [
            zone({ id: 't', bindung: 'titel', deko: {} }),
            zone({ id: 'b', bindung: 'bild' }),
            zone({ id: 'l', bindung: 'logo' }),
          ], 162),
          marke(),
        marke(),
        )
        return JSON.stringify({ aufrufe, loeseFarbe: aufrufe.loeseFarbe.length })
      }
      expect(bauen()).toBe(bauen())
    })
  })

  describe('#294 - Rahmen-Marke (TK 9.15.4)', () => {
    it("art !== 'einblendung': rahmenMarke wird nachweislich NICHT gelesen", () => {
      expect(() =>
        zeichneSegment(aktion(), vorlage('vollflaeche', []), marke(), werfendeMarke()),
      ).not.toThrow()
      expect(() =>
        zeichneSegment(aktion(), vorlage('split', [], 162), marke(), werfendeMarke()),
      ).not.toThrow()
    })

    it("einblendung mit hintergrund-Zone: zeichneDekoZone bekommt dort rahmenMarke, sonst marke", () => {
      const inhalts = marke()
      const rahmen = marke()
      const zonen = [
        zone({ id: 'hintergrund', bindung: null }),
        zone({ id: 'titel-zone', bindung: 'titel' }),
      ]
      zeichneSegment(
        aktion(),
        vorlage('einblendung', zonen, 200),
        inhalts,
        rahmen,
      )
      expect(aufrufe.deko).toHaveLength(2)
      expect(aufrufe.deko[0]?.[2]).toBe(rahmen) // Hintergrund -> Rahmen-Marke
      expect(aufrufe.text).toHaveLength(1)
      expect(aufrufe.text[0]?.[3]).toBe(inhalts) // Inhalt -> Aktions-Marke
    })

    it("einblendung OHNE hintergrund-Zone: Verhalten wie M4-23, keine Rahmen-Nutzung", () => {
      expect(() =>
        zeichneSegment(
          aktion({ titel: 'x' }),
          einblendung(false),
          marke(),
          werfendeMarke(), // duerfte nicht gelesen werden
        ),
      ).not.toThrow()
      expect(aufrufe.deko).toHaveLength(0)
    })

    it("marke oder rahmenMarke null/undefined wirft (Programmierfehler)", () => {
      expect(() =>
        zeichneSegment(aktion(), vorlage('vollflaeche', []), undefined as unknown as Marke, marke()),
      ).toThrow(/rahmenMarke/)
      expect(() =>
        zeichneSegment(aktion(), vorlage('vollflaeche', []), marke(), null as unknown as Marke),
      ).toThrow(/rahmenMarke/)
    })
  })

  describe('#294 - Schrift-Pruefung der importierten Schriften', () => {
    it("prueft marke immer; rahmenMarke nur bei einblendung + unterschiedlich + hintergrund vorhanden (zwei Aufrufe)", () => {
      aufrufeMarkenSchriften.length = 0
      const inhalts = marke()
      const rahmen = marke()
      zeichneSegment(
        aktion(),
        vorlage('einblendung', [zone({ id: 'hintergrund', bindung: null })], 200),
        inhalts,
        rahmen,
      )
      expect(aufrufeMarkenSchriften).toHaveLength(2)
      expect(aufrufeMarkenSchriften[0]).toBe(inhalts)
      expect(aufrufeMarkenSchriften[1]).toBe(rahmen)
    })

    it.each([
      ["art !== 'einblendung'", () => vorlage('vollflaeche', [])],
      ['rahmenMarke === marke', () => vorlage('einblendung', [zone({ id: 'hintergrund', bindung: null })], 200)],
      ['keine hintergrund-Zone', () => vorlage('einblendung', [], 200)],
    ])('%s -> genau EINE Pruefung (nur marke), werfende rahmenMarke bleibt ungelesen', (_name, baue) => {
      aufrufeMarkenSchriften.length = 0
      const m = marke()
      const v = baue()
      const rahmen = v.art === 'einblendung' ? m : werfendeMarke()
      expect(() => zeichneSegment(aktion(), v, m, rahmen)).not.toThrow()
      expect(aufrufeMarkenSchriften).toHaveLength(1)
      expect(aufrufeMarkenSchriften[0]).toBe(m)
    })

    it("nicht bereite importierte Schriften der Inhalts-Marke -> Wurf VOR Canvas und Zonen-Funktionen", () => {
      markenSchriftenBereit = false
      const createElementSpy = vi.fn()
      vi.stubGlobal('document', { createElement: createElementSpy })
      expect(() =>
        zeichneSegment(aktion(), vorlage('vollflaeche', [zone({ bindung: 'titel' })]), marke(), marke()),
      ).toThrow(/nicht bereit/)
      expect(createElementSpy).not.toHaveBeenCalled()
      expect(aufrufe.text).toHaveLength(0)
    })

    it("nicht bereite importierte Schriften der Rahmen-Marke -> Wurf nennt die ID und kennzeichnet sie als Rahmen-Marke", () => {
      const inhalts = marke()
      const rahmen = marke()
      // Das Modul-Mock antwortet pauschal; ueber den Aufzeichnungs-Hook schalten wir
      // ab dem ZWEITEN Aufruf (also fuer die Rahmen-Marke) auf 'nicht bereit'.
      const originalPush = aufrufeMarkenSchriften.push.bind(aufrufeMarkenSchriften)
      let erster = true
      aufrufeMarkenSchriften.push = (m: Marke) => {
        if (!erster) markenSchriftenBereit = false
        erster = false
        return originalPush(m)
      }
      try {
        expect(() =>
          zeichneSegment(
            aktion(),
            vorlage('einblendung', [zone({ id: 'hintergrund', bindung: null })], 200),
            inhalts,
            rahmen,
          ),
        ).toThrow(/Rahmen-Marke/)
        expect(aufrufe.deko).toHaveLength(0) // geworfen VOR dem Zeichnen
      } finally {
        aufrufeMarkenSchriften.push = originalPush
        markenSchriftenBereit = true
      }
    })

  describe('#294 - Logo-Dispatch', () => {
    it("logo === null -> zeichneErsatzLogo genau einmal, kein zeichneBildZone, Zone nicht uebersprungen", () => {
      const m = marke()
      ;(m as { logo: unknown }).logo = null
      const logoZone = zone({ id: 'l', bindung: 'logo', wennLeer: 'ausblenden' })
      zeichneSegment(aktion(), vorlage('vollflaeche', [logoZone]), m, m)
      expect(aufrufeErsatz).toHaveLength(1)
      expect(aufrufe.bild).toHaveLength(0)
      expect((aufrufeErsatz[0]?.[1] as Zone).id).toBe('l')
    })

    it("logo !== null -> zeichneBildZone mit holeLogo(id), zeichneErsatzLogo nie", () => {
      const m = marke()
      zeichneSegment(aktion(), vorlage('vollflaeche', [zone({ id: 'l', bindung: 'logo' })]), m, m)
      expect(aufrufe.holeLogo).toEqual([[m.id]]) // genau EIN Argument: die id dieser Marke
      expect(aufrufe.bild).toHaveLength(1)
      expect(aufrufeErsatz).toHaveLength(0)
    })

    it("logo === null loest keinen Zugriff auf .datei aus (kein TypeError)", () => {
      const m = marke()
      ;(m as { logo: unknown }).logo = null
      expect(() =>
        zeichneSegment(aktion(), vorlage('vollflaeche', [zone({ id: 'l', bindung: 'logo' })]), m, m),
      ).not.toThrow()
      expect(aufrufeErsatz[0]?.[2]).toBe(m) // markeDieserZone, dieselbe Referenz
    })
  })
})

})
