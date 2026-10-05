// Verhaltenstests zu #117 - die Zeichenroutine (zeichne-segment.ts, jsdom).
//
// getContext wird durch ein Aufzeichnungs-Doppel ersetzt; die drei Zonen-Funktionen,
// holeMotiv, holeLogo, sindSchriftenBereit und loeseFarbe durch Doppel. Gemessen
// wird die Ablauflogik: Flaeche, Vorfuellung, Bindungstabelle, wennLeer, Reihenfolge,
// Durchreichen der Aktion, die drei Wuerfe - und der Regressionstest gegen eine
// Paritaetspruefung der Bandhoehe (160 -> kein Wurf).
// @vitest-environment jsdom
import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'
import { SICHERHEITSABSTAND_PX } from '../../src/shared/contracts/konstanten'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Marke } from '../../src/shared/contracts/marke'
import type { Vorlage, Zone } from '../../src/shared/contracts/vorlage'
import type { Motiv } from '../../src/renderer/template-canvas/bild-laden'

vi.mock('../../src/renderer/template-canvas/farben', () => ({
  loeseFarbe: vi.fn((_m: Marke, r: string, _a: Aktion) => `farbe:${r}`),
}))
vi.mock('../../src/renderer/template-canvas/bild-laden', () => ({
  holeMotiv: vi.fn((schluessel: string) => ({ zustand: "geladen", bild: ATTRAPPE, breite: 10, höhe: 10, schluessel })),
}))
vi.mock('../../src/renderer/template-canvas/logo-laden', () => ({
  holeLogo: vi.fn(() => ({ zustand: "geladen", bild: ATTRAPPE, breite: 10, höhe: 10 })),
}))
vi.mock('../../src/renderer/template-canvas/schriften', () => ({
  sindSchriftenBereit: vi.fn(() => true),
}))
vi.mock('../../src/renderer/template-canvas/zone-text', () => ({
  ZEILENHOEHE_FAKTOR: 1.2,
  zeichneTextZone: vi.fn(),
}))
vi.mock('../../src/renderer/template-canvas/zone-bild', () => ({
  zeichneBildZone: vi.fn(),
}))
vi.mock('../../src/renderer/template-canvas/zone-deko', () => ({
  zeichneDekoZone: vi.fn(),
}))

import { loeseFarbe } from '../../src/renderer/template-canvas/farben'
import { holeMotiv } from '../../src/renderer/template-canvas/bild-laden'
import { holeLogo } from '../../src/renderer/template-canvas/logo-laden'
import { sindSchriftenBereit } from '../../src/renderer/template-canvas/schriften'
import { zeichneTextZone } from '../../src/renderer/template-canvas/zone-text'
import { zeichneBildZone } from '../../src/renderer/template-canvas/zone-bild'
import { zeichneDekoZone } from '../../src/renderer/template-canvas/zone-deko'
import { zeichneSegment } from '../../src/renderer/template-canvas/zeichne-segment'

// ---------------- Quelldatei-Verbote (Grep) ----------------

import { join } from 'node:path'

const QUELLE = readFileSync(
  join(process.cwd(), 'src/renderer/template-canvas/zeichne-segment.ts'),
  'utf8',
)
const CODEZEILEN = QUELLE.split('\n')
  .filter((z) => {
    const t = z.trim()
    return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
  })
  .join('\n')

describe('zeichne-segment – Verbote in der Quelldatei (Grep)', () => {
  it('kein await/async/devicePixelRatio/Zufall/Zeit/Cache/DOM-Stil/appendChild/Image/media', () => {
    for (const verbot of [
      'await ',
      'async ',
      'devicePixelRatio',
      'Math.random',
      'new Date',
      'Date.',
      'performance',
      'localStorage',
      'sessionStorage',
      'indexedDB',
      'caches',
      'canvas.style',
      'appendChild',
      'new Image',
      'media://',
      'status:',
    ]) {
      expect(CODEZEILEN).not.toContain(verbot)
    }
  })

  it('keine Profil-Literale 1920/1080 und keine Paritätsprüfung der Höhe', () => {
    expect(CODEZEILEN).not.toMatch(/\b1920\b/)
    expect(CODEZEILEN).not.toMatch(/\b1080\b/)
    expect(CODEZEILEN).not.toContain('% 2')
    expect(CODEZEILEN).not.toContain('Math.ceil')
    expect(CODEZEILEN).not.toContain('Math.floor')
  })

  it("liest aktion.akzentfarbe nicht, nennt keine Akzent-Rollen und indiziert marke.farben nicht", () => {
    expect(CODEZEILEN).not.toContain('akzentfarbe')
    expect(CODEZEILEN).not.toContain('akzentKraeftig')
    expect(CODEZEILEN).not.toContain('akzentTief')
    expect(CODEZEILEN).not.toContain('marke.farben')
  })
})

// Eine Attrappe als "Bild": Die Zeichnung liest nie am Bildobjekt selbst.
const ATTRAPPE = {} as unknown as ImageBitmap

// jsdom liefert ohne Canvas-Paket kein 2d-Kontext: Doppel auf dem Prototype,
// ein Aufzeichnungs-Kontext (`fillRect`, `fillStyle`, ...). Jeder Test bekommt
// seine eigene Instanz, damit die Aufrufliste sauber je Fall zählt.
type KontextAufzeichnung = {
  rufe: Array<{ methode: string; argumente: unknown[] }>
  fillStyles: string[]
}

let kontext: KontextAufzeichnung | null = null

function spanneKontextEin(liefertNull = false): void {
  kontext = { rufe: [], fillStyles: [] }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
    this: HTMLCanvasElement,
    typ: string,
  ) {
    kontext?.rufe.push({ methode: 'getContext', argumente: [typ] })
    if (liefertNull) return null
    return {
      set fillStyle(wert: string) {
        kontext?.fillStyles.push(wert)
      },
      get fillStyle() {
        return ''
      },
      fillRect: (x: number, y: number, w: number, h: number) => {
        kontext?.rufe.push({ methode: 'fillRect', argumente: [x, y, w, h] })
      },
    } as unknown as CanvasRenderingContext2D
  } as never)
}

beforeEach(() => {
  // Der Test kann Implementierungen ändern (Reihenfolge-Spur); die Basis-Mocks
  // werden vor JEDEM Test neu belegt - restoreAllMocks wuerde die Modul-Mocks oben
  // (die definierten Doubles) selbst zerstoeren, das bleibt weg.
  vi.mocked(sindSchriftenBereit).mockReturnValue(true)
  vi.mocked(holeMotiv).mockImplementation(
    (schluessel: string) => ({ zustand: "geladen", bild: ATTRAPPE, breite: 10, höhe: 10, schluessel }) as never,
  )
  vi.mocked(holeLogo).mockImplementation(() => ({ zustand: "geladen", bild: ATTRAPPE, breite: 10, höhe: 10 }) as never)
  vi.mocked(loeseFarbe).mockImplementation((_m: unknown, rolle: unknown, _a: unknown) => `farbe:${String(rolle)}` as never)
  // Zonen-Doubles: leere Implementierung (die Aufruf-Spur messen die Tests selbst).
  vi.mocked(zeichneTextZone).mockImplementation(() => undefined as never)
  vi.mocked(zeichneBildZone).mockImplementation(() => undefined as never)
  vi.mocked(zeichneDekoZone).mockImplementation(() => undefined as never)
  // Aufruflisten leer - die Tests messen NUR ihre eigenen Aufrufe.
  for (const doppel of [zeichneTextZone, zeichneBildZone, zeichneDekoZone, holeMotiv, holeLogo, loeseFarbe, sindSchriftenBereit]) {
    vi.mocked(doppel).mockClear()
  }
  spanneKontextEin()
})

// Bausteine

function aktion(bildRef: string | null = 'asset-1'): Aktion {
  return {
    id: 'a-1',
    titel: 'Sommeraktion',
    beschreibung: 'Beschreibungstext',
    preis: '9,90',
    bildRef,
    cta: 'Jetzt starten',
    standardDauer: null,
    vorlagenId: 'vollbild',
    akzentfarbe: null,
  }
}

function marke(): Marke {
  return {
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
      headlineElegant: { familie: 'P', gewicht: 700, datei: 'P.woff2' },
      headlinePlakativ: { familie: 'A', gewicht: 900, datei: 'A.woff2' },
      fliesstext: { familie: 'R', gewicht: 400, datei: 'R.woff2' },
      fliesstextFett: { familie: 'B', gewicht: 700, datei: 'B.woff2' },
    },
    logo: { datei: 'logo.png', seitenverhaeltnis: 3.5 },
    sicherheit: SICHERHEITSABSTAND_PX,
    radien: { pille: 40, karte: 10, klein: 2 },
    schatten: { versatzY: 4, weichzeichnen: 8, farbe: '#00000040' },
    slogan: { text: 'Fitnessworld24', aktiv: true },
  }
}

function zone(zonen: Partial<Zone> & Pick<Zone, 'id' | 'bindung'>): Zone {
  return {
    rolle: 'fest',
    rahmen: { x: 0, y: 0, breite: 100, höhe: 100 },
    ausrichtung: { horizontal: 'links', vertikal: 'oben' },
    wennLeer: 'leer',
    ...zonen,
  } as Zone
}

function vorlage(art: Vorlage['art'], zonen: Zone[], höhe: number | null = null): Vorlage {
  return {
    id: 'v-probe',
    name: 'Probe',
    art,
    höhe,
    parent: null,
    eingebaut: true,
    zonen,
  }
}

// ---------------- Tests ----------------

describe('zeichneSegment (#117) - die Fläche', () => {
  it.each([
    ['vollflaeche', RENDER_PROFILE.breite, RENDER_PROFILE.hoehe],
  ] as const)('art %s -> %s x %s, trägt dieselben Zahlen in breite/höhe', (art, breite, hoehe) => {
    const bild = zeichneSegment(aktion(), { ...vorlage(art, []) }, marke())
    expect(bild.canvas.width).toBe(breite)
    expect(bild.canvas.height).toBe(hoehe)
    expect(bild.breite).toBe(breite)
    expect(bild.höhe).toBe(hoehe)
  })

  it("split mit höhe 162 -> 1920 x 162; einblendung mit höhe 200 -> 1920 x 200", () => {
    const split = zeichneSegment(aktion(), vorlage('split', [], 162), marke())
    expect(split.canvas.width).toBe(1920)
    expect(split.canvas.height).toBe(162)

    const band = zeichneSegment(aktion(), vorlage('einblendung', [], 200), marke())
    expect(band.canvas.height).toBe(200)
  })

  it.each([null, 0, -10, Number.NaN, 1080])('split mit höhe %s -> Wurf, Meldung nennt die Vorlagen-ID', (hoeh) => {
    expect(() => zeichneSegment(aktion(), vorlage('split', [], hoeh as never), marke())).toThrow(/v-probe/)
  })

  it('UNGERADE Bandhöhe 161 -> KEIN Wurf, Canvas 1920 x 161, HOEHE ungerundet (Regression gegen die Paritätssperre)', () => {
    const bild = zeichneSegment(aktion(), vorlage('split', [], 161), marke())
    expect(bild.höhe).toBe(161)
    expect(bild.canvas.height).toBe(161)
    // einblendung mit 1: derselbe Grenzfall
    const band = zeichneSegment(aktion(), vorlage('einblendung', [], 1), marke())
    expect(band.höhe).toBe(1)
  })
})

describe('zeichneSegment (#117) - Schritt 0 und Schritt 2', () => {
  it("sindSchriftenBereit false -> Wurf, VOR dem Canvas (kein createElement('canvas'))", () => {
    vi.mocked(sindSchriftenBereit).mockReturnValue(false)
    const erzeuge = vi.spyOn(document, 'createElement')
    expect(() => zeichneSegment(aktion(), vorlage('vollflaeche', []), marke())).toThrow(/Schriften/)
    expect(erzeuge).not.toHaveBeenCalledWith('canvas')
  })

  it('getContext mit GENAU EINEM Argument', () => {
    kontext?.rufe.splice(0)
    zeichneSegment(aktion(), vorlage('vollflaeche', []), marke())
    const rufe = kontext?.rufe.filter((ruf) => ruf.methode === 'getContext') ?? []
    expect(rufe.length).toBeGreaterThan(0)
    for (const ruf of rufe) {
      expect(ruf.argumente).toHaveLength(1)
    }
  })

  it("getContext liefert null -> geworfener Error", () => {
    vi.restoreAllMocks()
    spanneKontextEin(true)
    expect(() => zeichneSegment(aktion(), vorlage('vollflaeche', []), marke())).toThrow(/getContext/)
  })
})

describe('zeichneSegment (#117) - die Grundfläche', () => {
  it('vollflaeche und split füllen vorab mit loeseFarbe(flaecheDunkel); einblendung füllt NICHT', () => {
    vi.mocked(loeseFarbe).mockClear()
    const a = aktion()
    zeichneSegment(a, vorlage('vollflaeche', []), marke())
    expect(vi.mocked(loeseFarbe).mock.calls.some((ruf) => ruf[1] === 'flaecheDunkel' && ruf[2] === a)).toBe(true)

    vi.mocked(loeseFarbe).mockClear()
    zeichneSegment(a, vorlage('einblendung', [], 200), marke())
    expect(vi.mocked(loeseFarbe).mock.calls.some((ruf) => ruf[1] === 'flaecheDunkel')).toBe(false)
  })

  it('die Grundfarbe bleibt der Markenwert, AUCH bei gesetzter Akzentfarbe (flaecheDunkel ist keine Akzent-Rolle)', () => {
    const mitWahlAktion = { ...aktion(), akzentfarbe: '#971316' }
    // Der Zeichnen-Aufruf bekommt DIE Aktion referenz-identisch.
    zeichneSegment(mitWahlAktion, vorlage('vollflaeche', []), marke())
    // loeseFarbe bekommt die aktion durchgereicht; die Ersetzung selbst entscheidet #112.
    const rufe = vi.mocked(loeseFarbe).mock.calls.filter((ruf) => ruf[1] === 'flaecheDunkel')
    expect(rufe.length).toBeGreaterThan(0)
    for (const ruf of rufe) {
      expect(ruf[2]).toBe(mitWahlAktion)
    }
  })
})

describe('zeichneSegment (#117) - Zonen in Array-Reihenfolge', () => {
  it('fünf "unsortierte" Zonen -> die Zonen-Funktionen laufen in GENAU dieser Reihenfolge; nichts wird sortiert', () => {
    const zonen = [
      zone({ id: 'z-cta', bindung: 'cta' }),
      zone({ id: 'z-titel', bindung: 'titel' }),
      zone({ id: 'z-deko', bindung: null }),
      zone({ id: 'z-bild', bindung: 'bild' }),
      zone({ id: 'z-preis', bindung: 'preis' }),
    ]
    // Reihenfolge aus den Mock-Reihenfolgen ableiten: ein Invocations-Mix-
    // Vergleich, der DIESE Reihenfolge gegenüber einer SORTIERTen unterscheidet.
    const reihenfolge: string[] = []
    const markiere = (name: string): void => {
      reihenfolge.push(name)
    }
    vi.mocked(zeichneTextZone).mockImplementation(((_ctx: CanvasRenderingContext2D, zone: Zone) => {
      markiere(zone.id)
    }) as never)
    vi.mocked(zeichneBildZone).mockImplementation(((_ctx: CanvasRenderingContext2D, zone: Zone) => {
      markiere(zone.id)
    }) as never)
    vi.mocked(zeichneDekoZone).mockImplementation(((_ctx: CanvasRenderingContext2D, zone: Zone) => {
      markiere(zone.id)
    }) as never)

    reihenfolge.length = 0
    zeichneSegment(aktion(), vorlage('vollflaeche', zonen), marke())
    // Jede gebundene Zone ruft Deko + Inhalt (zwei Einträge), z-deko nur Deko.
    // Die Array-Reihenfolge ist: cta, titel, deko, bild, preis – NICHT alphabetisch.
    expect(reihenfolge).toEqual([
      'z-cta', 'z-cta',
      'z-titel', 'z-titel',
      'z-deko',
      'z-bild', 'z-bild',
      'z-preis', 'z-preis',
    ])
  })
})

describe('zeichneSegment (#117) - die Bindungstabelle', () => {
  it.each([
    ['titel', 'titel'],
    ['beschreibung', 'beschreibung'],
    ['preis', 'preis'],
    ['cta', 'cta'],
    ['slogan', 'slogan'],
  ] as const)('bindung %s -> zeichneTextZone mit dem Wert aus Aktion bzw. Marke', (bindung, quelle) => {
    const z = zone({ id: 'z', bindung: bindung as never })
    const m = marke()
    const a = aktion()
    const gemerkt = a
    zeichneSegment(gemerkt, vorlage('vollflaeche', [z]), m)
    const rufe = vi.mocked(zeichneTextZone).mock.calls
    const ruf = rufe.find((ruf) => (ruf[1] as Zone).id === 'z')
    expect(ruf).toBeDefined()
    if (bindung === 'slogan') {
      expect(ruf?.[2]).toBe('Fitnessworld24')
    } else {
      expect(ruf?.[2]).toBe(gemerkt[bindung])
    }
  })

  it('slogan mit aktiv false -> wie leer behandelt (wennLeer leer: Deko steht, kein Text)', () => {
    const m = marke()
    m.slogan.aktiv = false
    const z = zone({ id: 'z-slogan', bindung: 'slogan' })
    zeichneSegment(aktion(), vorlage('vollflaeche', [z]), m)
    expect(vi.mocked(zeichneTextZone).mock.calls.some((ruf) => (ruf[1] as Zone).id === 'z-slogan')).toBe(false)
    expect(vi.mocked(zeichneDekoZone).mock.calls.some((ruf) => (ruf[1] as Zone).id === 'z-slogan')).toBe(true)
  })

  it("bindung 'bild' ruft holeMotiv mit GENAU aktion.bildRef; 'logo' ruft holeLogo OHNE Argument und holeMotiv NICHT", () => {
    vi.mocked(holeMotiv).mockClear()
    vi.mocked(holeLogo).mockClear()
    zeichneSegment(aktion('asset-X'), vorlage('vollflaeche', [zone({ id: 'z-bild', bindung: 'bild' })]), marke())
    expect(vi.mocked(holeMotiv)).toHaveBeenCalledWith('asset-X')

    vi.mocked(holeMotiv).mockClear()
    vi.mocked(holeLogo).mockClear()
    zeichneSegment(aktion(), vorlage('vollflaeche', [zone({ id: 'z-logo', bindung: 'logo' })]), marke())
    expect(vi.mocked(holeLogo)).toHaveBeenCalledWith()
    expect(vi.mocked(holeMotiv)).not.toHaveBeenCalled() // am logo.png-Dummy ebenso wenig
  })

  it("logo: marke.logo.datei geht NICHT an holeMotiv (kein Passhavarie)", () => {
    vi.mocked(holeMotiv).mockClear()
    zeichneSegment(aktion(), vorlage('vollflaeche', [zone({ id: 'z-logo', bindung: 'logo' })]), marke())
    expect(vi.mocked(holeMotiv)).not.toHaveBeenCalledWith('logo.png')
  })
})

describe('zeichneSegment (#117) - wennLeer', () => {
  it("preis null, wennLeer 'leer' -> zeichneDekoZone JA, zeichneTextZone NEIN (die Pille bleibt)", () => {
    const a = { ...aktion(), preis: null }
    const z = zone({ id: 'z-preis', bindung: 'preis' })
    zeichneSegment(a, vorlage('vollflaeche', [z]), marke())
    expect(vi.mocked(zeichneDekoZone).mock.calls.some((ruf) => (ruf[1] as Zone).id === 'z-preis')).toBe(true)
    expect(vi.mocked(zeichneTextZone).mock.calls.some((ruf) => (ruf[1] as Zone).id === 'z-preis')).toBe(false)
  })

  it("preis null, wennLeer 'ausblenden' -> WEDER Deko NOCH Text (keine leere rote Pille)", () => {
    const a = { ...aktion(), preis: null }
    const z = zone({ id: 'z-preis', bindung: 'preis', wennLeer: 'ausblenden' })
    zeichneSegment(a, vorlage('vollflaeche', [z]), marke())
    expect(vi.mocked(zeichneDekoZone).mock.calls.some((ruf) => (ruf[1] as Zone).id === 'z-preis')).toBe(false)
    expect(vi.mocked(zeichneTextZone).mock.calls.some((ruf) => (ruf[1] as Zone).id === 'z-preis')).toBe(false)
  })

  it("preis nur Leerzeichen wird wie null behandelt", () => {
    const a = { ...aktion(), preis: '   ' }
    const z = zone({ id: 'z-preis', bindung: 'preis', wennLeer: 'ausblenden' })
    zeichneSegment(a, vorlage('vollflaeche', [z]), marke())
    expect(vi.mocked(zeichneDekoZone).mock.calls.some((ruf) => (ruf[1] as Zone).id === 'z-preis')).toBe(false)
  })

  it('bildRef null -> KEIN holeMotiv und KEIN zeichneBildZone (kein Platzhalter: "kein Bild gewählt" != "Bild fehlt")', () => {
    vi.mocked(holeMotiv).mockClear()
    const a = { ...aktion(), bildRef: null }
    zeichneSegment(a, vorlage('vollflaeche', [zone({ id: 'z-bild', bindung: 'bild' })]), marke())
    expect(vi.mocked(holeMotiv)).not.toHaveBeenCalled()
    expect(vi.mocked(zeichneBildZone)).not.toHaveBeenCalled()
  })

  it("holeMotiv meldet 'fehlt' -> zeichneBildZone bekommt GENAU dieses Motiv (Platzhalter-Fall)", () => {
    vi.mocked(holeMotiv).mockReturnValue({ zustand: 'fehlt' })
    zeichneSegment(aktion('fehlt-asset'), vorlage('vollflaeche', [zone({ id: 'z-bild', bindung: 'bild' })]), marke())
    const ruf = vi.mocked(zeichneBildZone).mock.calls.at(-1)
    expect(ruf?.[2]).toEqual({ zustand: 'fehlt' })
    vi.mocked(holeMotiv).mockReturnValue({ zustand: "geladen", bild: ATTRAPPE, breite: 10, höhe: 10 })
  })

  it("holeLogo meldet 'fehlt' -> die Logo-Zone wird NICHT übersprungen (Markenrahmen Pflicht), zeichneBildZone bekommt 'fehlt'", () => {
    vi.mocked(holeLogo).mockReturnValue({ zustand: 'fehlt' })
    zeichneSegment(aktion(), vorlage('vollflaeche', [zone({ id: 'z-logo', bindung: 'logo' })]), marke())
    const ruf = vi.mocked(zeichneBildZone).mock.calls.at(-1)
    expect(ruf?.[2]).toEqual({ zustand: 'fehlt' })
    vi.mocked(holeLogo).mockReturnValue({ zustand: "geladen", bild: ATTRAPPE, breite: 10, höhe: 10 })
  })

  it('unbekannte Bindung -> NUR Deko, kein Text-/Bild-Aufruf', () => {
    const z = { ...zone({ id: 'z-x', bindung: 'titel' }), bindung: 'unbekannt' as never }
    zeichneSegment(aktion(), vorlage('vollflaeche', [z]), marke())
    expect(vi.mocked(zeichneDekoZone).mock.calls.some((ruf) => (ruf[1] as Zone).id === 'z-x')).toBe(true)
    expect(vi.mocked(zeichneTextZone).mock.calls.some((ruf) => (ruf[1] as Zone).id === 'z-x')).toBe(false)
    expect(vi.mocked(zeichneBildZone).mock.calls.some((ruf) => (ruf[1] as Zone).id === 'z-x')).toBe(false)
  })
})

describe('zeichneSegment (#117) - Durchreichen und Determinismus', () => {
  it('alle Zonen-Funktionen bekommen die aktion als LETZTES Argument, toBe-identisch', () => {
    const a = aktion()
    zeichneSegment(a, vorlage('vollflaeche', [zone({ id: 'z-bild', bindung: 'bild' }), zone({ id: 'z-titel', bindung: 'titel' })]), marke())
    for (const ruf of vi.mocked(zeichneTextZone).mock.calls) {
      expect(ruf[4]).toBe(a)
    }
    for (const ruf of vi.mocked(zeichneBildZone).mock.calls) {
      expect(ruf[4]).toBe(a)
    }
    for (const ruf of vi.mocked(zeichneDekoZone).mock.calls) {
      expect(ruf[3]).toBe(a)
    }
  })

  it('zwei Aufrufe mit denselben Eingaben erzeugen dieselbe Aufruffolge', () => {
    const zonen = [zone({ id: 'z-a', bindung: 'titel' }), zone({ id: 'z-b', bindung: 'bild' })]
    const spuren = (): Array<[string, string | undefined]> => {
      const spur: Array<[string, string | undefined]> = []
      vi.mocked(zeichneTextZone).mockImplementation(((ctx: CanvasRenderingContext2D, z: Zone, text: string) => {
        spur.push(['text', text])
      }) as never)
      vi.mocked(zeichneDekoZone).mockImplementation(((ctx: CanvasRenderingContext2D, z: Zone) => {
        spur.push(['deko', z.id])
      }) as never)
      return spur
    }
    const erste = spuren()
    zeichneSegment(aktion(), vorlage('vollflaeche', zonen), marke())
    const zweite = spuren()
    zeichneSegment(aktion(), vorlage('vollflaeche', zonen), marke())
    expect(zweite).toEqual(erste)
  })

  it('zonen: [] -> gültiges SegmentBild, keine Ausnahme; vollflaeche bleibt vor gefüllt', () => {
    const bild = zeichneSegment(aktion(), vorlage('vollflaeche', []), marke())
    expect(bild.canvas.width).toBe(RENDER_PROFILE.breite)
  })
})
