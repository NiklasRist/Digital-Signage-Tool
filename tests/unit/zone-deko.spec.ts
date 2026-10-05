// Verhaltenstests zu #116 - eine dekorative Zone zeichnen (zone-deko.ts).
//
// Aufzeichnungs-Doppel ohne Browser; createLinearGradient liefert ein Doppel, das
// seine addColorStop-Aufrufe mitschreibt. Die DoD-Punkte sind an den ECHTEN Daten
// der eingebauten Vorlagen (hintergrund, scrim, preis von Vollbild und Band)
// abgerechnet.
import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SICHERHEITSABSTAND_PX } from '../../src/shared/contracts/konstanten'
import { zeichneDekoZone } from '../../src/renderer/template-canvas/zone-deko'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { FarbRolle, Marke } from '../../src/shared/contracts/marke'
import type { Zone } from '../../src/shared/contracts/vorlage'

vi.mock('../../src/renderer/template-canvas/farben', async (importOriginal) => {
  const echt = await importOriginal<typeof import('../../src/renderer/template-canvas/farben')>()
  return {
    loeseFarbe: vi.fn(echt.loeseFarbe),
    loeseSchrift: vi.fn(echt.loeseSchrift),
  };
});

vi.mock('../../src/renderer/template-canvas/zone-text', () => ({
  ZEILENHOEHE_FAKTOR: 1.2,
  zeichneTextZone: vi.fn(),
}));

import { loeseFarbe } from '../../src/renderer/template-canvas/farben'
import { zeichneTextZone } from '../../src/renderer/template-canvas/zone-text'

// ---------------- Quelldatei-Verbote (Grep) ----------------

const QUELLE = readFileSync(
  new URL('../../src/renderer/template-canvas/zone-deko.ts', import.meta.url),
  'utf8',
)
const CODEZEILEN = QUELLE.split('\n')
  .filter((z) => {
    const t = z.trim()
    return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
  })
  .join('\n')

describe('zone-deko – Verbote in der Quelldatei (Grep)', () => {
  it("liest aktion.akzentfarbe nicht und nennt keine Akzent-Rollen in einer Bedingung", () => {
    expect(CODEZEILEN).not.toContain('akzentfarbe')
    expect(CODEZEILEN).not.toMatch(/akzent(Kraeftig|Tief)?\s*(===|!==|==|!=)/)
  })

  it("enthaelt keine eigene Liste der Akzent-Rollen", () => {
    expect(CODEZEILEN).not.toContain("['akzent'")
  })

  it('enthaelt kein Farb-, rgb/rgba- und kein Radius-Literal', () => {
    expect(CODEZEILEN).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(CODEZEILEN).not.toMatch(/\brgba?\(/)
    expect(CODEZEILEN).not.toMatch(/radius\s*[:=]\s*\d/)
  })

  it('liest marke.radien nicht und enthaelt keine Zeit-/Zufalls-APIs', () => {
    expect(CODEZEILEN).not.toMatch(/\bradien\b/)
    expect(CODEZEILEN).not.toContain('await ')
    expect(CODEZEILEN).not.toContain('async ')
    expect(CODEZEILEN).not.toContain('Math.random')
    expect(CODEZEILEN).not.toContain('new Date')
    expect(CODEZEILEN).not.toContain('Date.')
    expect(CODEZEILEN).not.toContain('devicePixelRatio')
  })

  it('ruft fillText NICHT selbst auf (Textpfad ist #114)', () => {
    expect(CODEZEILEN).not.toContain('fillText')
  })
})

// ---------------- Aufzeichnungs-Doppel ----------------

type Ereignis = { art: string; name?: string; argumente?: unknown[]; wert?: unknown }

interface VerlaufDoppel {
  stopps: Array<[number, string]>
  name: string
}

function baueKontextDoppel(roundRectWirft = false): {
  kontext: CanvasRenderingContext2D
  ereignisse: Ereignis[]
  fillRufe: number
  verlaeufe: VerlaufDoppel[]
} {
  const ereignisse: Ereignis[] = []
  const verlaeufe: VerlaufDoppel[] = []
  const zaehler = { fill: 0 }

  const kontext = {
    set fillStyle(wert: unknown) {
      ereignisse.push({ art: 'set', name: 'fillStyle', wert })
    },
    get fillStyle() {
      return ''
    },
    set shadowColor(wert: string) {
      ereignisse.push({ art: 'set', name: 'shadowColor', wert })
    },
    get shadowColor() {
      return 'transparent'
    },
    set shadowBlur(wert: number) {
      ereignisse.push({ art: 'set', name: 'shadowBlur', wert })
    },
    get shadowBlur() {
      return 0
    },
    set shadowOffsetX(wert: number) {
      ereignisse.push({ art: 'set', name: 'shadowOffsetX', wert })
    },
    get shadowOffsetX() {
      return 0
    },
    set shadowOffsetY(wert: number) {
      ereignisse.push({ art: 'set', name: 'shadowOffsetY', wert })
    },
    get shadowOffsetY() {
      return 0
    },
    save() {
      ereignisse.push({ art: 'rufe', name: 'save' })
    },
    restore() {
      ereignisse.push({ art: 'rufe', name: 'restore' })
    },
    beginPath() {
      ereignisse.push({ art: 'rufe', name: 'beginPath' })
    },
    rect(...argumente: unknown[]) {
      ereignisse.push({ art: 'rufe', name: 'rect', argumente })
    },
    roundRect(...argumente: unknown[]) {
      if (roundRectWirft) throw new Error('roundRect fehlt')
      ereignisse.push({ art: 'rufe', name: 'roundRect', argumente })
    },
    fill() {
      zaehler.fill += 1
      ereignisse.push({ art: 'rufe', name: 'fill' })
    },
    createLinearGradient(...argumente: unknown[]) {
      ereignisse.push({ art: 'rufe', name: 'createLinearGradient', argumente })
      const doppel: VerlaufDoppel = { stopps: [], name: `verlauf-${verlaeufe.length}` }
      verlaeufe.push(doppel)
      return {
        addColorStop: (versatz: number, farbe: string) => {
          doppel.stopps.push([versatz, farbe])
        },
        name: doppel.name,
      } as unknown as CanvasGradient
    },
  } as unknown as CanvasRenderingContext2D & Record<string, unknown>

  return {
    kontext: kontext as CanvasRenderingContext2D,
    ereignisse,
    get fillRufe() {
      return zaehler.fill
    },
    verlaeufe,
  }
}

// ---------------- Bausteine ----------------

const FARBEN: Record<FarbRolle, string> = {
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
}

const marke = (): Marke => ({
  farben: FARBEN,
  schriften: {
    headlineElegant: { familie: 'Playfair Display', gewicht: 700, datei: 'P.woff2', herkunft: 'gebuendelt' },
    headlinePlakativ: { familie: 'Archivo Black', gewicht: 900, datei: 'A.woff2', herkunft: 'gebuendelt' },
    fliesstext: { familie: 'Arimo', gewicht: 400, datei: 'R.woff2', herkunft: 'gebuendelt' },
    fliesstextFett: { familie: 'Arimo', gewicht: 700, datei: 'B.woff2', herkunft: 'gebuendelt' },
  },
  logo: { datei: 'logo.png', seitenverhaeltnis: 3.5, herkunft: 'gebuendelt' },
  sicherheit: SICHERHEITSABSTAND_PX,
  radien: { pille: 40, karte: 10, klein: 2 },
  schatten: { versatzY: 4, weichzeichnen: 8, farbe: '#00000040' },
  slogan: { text: '', aktiv: false },
  id: 'm1',
  name: 'Probe',
  parent: null,
  eingebaut: false,
  herkunftJeFeld: null as never,
})

const OHNE_WAHL = aktion(null)
const MIT_WAHL = aktion('#971316')

function aktion(akzentfarbe: string | null): Aktion {
  return {
    id: 'a-1',
    titel: 'Probe',
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer: null,
    vorlagenId: 'vollbild',
    markeId: 'm1',
    akzentfarbe,
  }
}

function zone(rahmen: Zone['rahmen'], deko: Zone['deko'], bindung: Zone['bindung'] = null): Zone {
  return {
    id: 'probe',
    rolle: 'fest',
    bindung,
    rahmen,
    ausrichtung: { horizontal: 'links', vertikal: 'oben' },
    wennLeer: 'leer',
    deko,
  }
}

const HINTERGRUND: Zone['rahmen'] = { x: 0, y: 0, breite: 1920, höhe: 1080 }
const SCRIM: Zone['rahmen'] = { x: 0, y: 432, breite: 1920, höhe: 648 }

beforeEach(() => {
  vi.mocked(loeseFarbe).mockClear().mockImplementation((m: Marke, r: FarbRolle, a: Aktion) => {
    // Wie in farben.ts real: ein GESSETZTER Hex-Wert der Aktion ersetzt die drei
    // Akzent-Rollen (TK 9.10.9) - die Rollenliste steht nicht in dieser Datei.
    const istAkzentRolle = r === 'akzent' || r === 'akzentKraeftig' || r === 'akzentTief'
    if (istAkzentRolle && a.akzentfarbe !== null) {
      return a.akzentfarbe
    }
    const wert = m.farben[r]
    if (wert === undefined) throw new Error('unbekannte Rolle')
    return wert
  })
  vi.mocked(zeichneTextZone).mockClear()
})

// ---------------- Tests ----------------

describe('zeichneDekoZone (#116) - die echten eingebauten Zonen', () => {
  it("Zone hintergrund (0,0,1920,1080, Fuellung flaecheDunkel): genau EIN rect + fill, kein roundRect/Verlauf/Text", () => {
    const doppel = baueKontextDoppel()
    zeichneDekoZone(
      doppel.kontext,
      zone(HINTERGRUND, { füllungFarbRolle: 'flaecheDunkel' }),
      marke(),
      OHNE_WAHL,
    )
    const rect = doppel.ereignisse.filter((e) => e.art === 'rufe' && e.name === 'rect')
    expect(rect).toHaveLength(1)
    expect(rect[0]?.argumente).toEqual([0, 0, 1920, 1080])
    expect(doppel.ereignisse.some((e) => e.art === 'rufe' && e.name === 'roundRect')).toBe(false)
    expect(doppel.ereignisse.some((e) => e.art === 'rufe' && e.name === 'createLinearGradient')).toBe(false)
    expect(doppel.fillRufe).toBe(1)
    expect(vi.mocked(zeichneTextZone)).not.toHaveBeenCalled()
  })

  it("Zone scrim (0,432,1920,648, richtung unten): createLinearGradient(0,432,0,1080); Stopp 0 = scrimStart, Stopp 1 = scrimEnde", () => {
    const doppel = baueKontextDoppel()
    zeichneDekoZone(
      doppel.kontext,
      zone(SCRIM, {
        verlauf: { vonFarbRolle: 'scrimStart', bisFarbRolle: 'scrimEnde', richtung: 'unten' },
      }),
      marke(),
      OHNE_WAHL,
    )
    const ruf = doppel.ereignisse.find(
      (e) => e.art === 'rufe' && e.name === 'createLinearGradient',
    )
    expect(ruf?.argumente).toEqual([0, 432, 0, 1080])
    expect(doppel.verlaeufe[0]?.stopps).toEqual([
      [0, '#00000000'],
      [1, '#000000B3'],
    ])
  })

  it.each([
    ['oben', [0, 1080, 0, 432]],
    ['rechts', [0, 432, 1920, 432]],
    ['links', [1920, 432, 0, 432]],
  ] as const)('richtung %s entspricht der Tabelle des Issues', (richtung, erwartet) => {
    const doppel = baueKontextDoppel()
    zeichneDekoZone(
      doppel.kontext,
      zone(SCRIM, {
        verlauf: { vonFarbRolle: 'scrimStart', bisFarbRolle: 'scrimEnde', richtung },
      }),
      marke(),
      OHNE_WAHL,
    )
    const ruf = doppel.ereignisse.find(
      (e) => e.art === 'rufe' && e.name === 'createLinearGradient',
    )
    expect(ruf?.argumente).toEqual(erwartet)
  })

  it("Vollbild-preis (1300,660,524,150, radius 40): roundRect(…,40) UNGEDECKELT (min/2=75 > 40)", () => {
    const doppel = baueKontextDoppel()
    zeichneDekoZone(
      doppel.kontext,
      zone({ x: 1300, y: 660, breite: 524, höhe: 150 }, { füllungFarbRolle: 'akzent', radius: 40 }),
      marke(),
      OHNE_WAHL,
    )
    const runde = doppel.ereignisse.filter((e) => e.art === 'rufe' && e.name === 'roundRect')
    expect(runde).toHaveLength(1)
    expect(runde[0]?.argumente).toEqual([1300, 660, 524, 150, 40])
  })

  it("Band-preis (1330,18,240,72, radius 40): Deckelung GREIFT -> 36, NICHT 40", () => {
    const doppel = baueKontextDoppel()
    zeichneDekoZone(
      doppel.kontext,
      zone({ x: 1330, y: 18, breite: 240, höhe: 72 }, { füllungFarbRolle: 'akzent', radius: 40 }),
      marke(),
      OHNE_WAHL,
    )
    const runde = doppel.ereignisse.filter((e) => e.art === 'rufe' && e.name === 'roundRect')
    expect(runde).toHaveLength(1)
    expect(runde[0]?.argumente).toEqual([1330, 18, 240, 72, 36])
    expect(runde[0]?.argumente?.[4]).not.toBe(40)
  })
})

describe('zeichneDekoZone (#116) - Reihenfolge und Werthaltung', () => {
  it('Fuellung UND Verlauf -> zwei fill(), Verlauf als ZWEITER;addColorStop(0,von)/(1,bis)', () => {
    const doppel = baueKontextDoppel()
    zeichneDekoZone(
      doppel.kontext,
      zone(HINTERGRUND, {
        füllungFarbRolle: 'flaecheSehrDunkel',
        verlauf: { vonFarbRolle: 'scrimStart', bisFarbRolle: 'scrimEnde', richtung: 'unten' },
      }),
      marke(),
      OHNE_WAHL,
    )
    expect(doppel.fillRufe).toBe(2)
    const ersteFuellung = doppel.ereignisse.filter(
      (e) => e.art === 'set' && e.name === 'fillStyle',
    )
    expect((ersteFuellung[0]?.wert as string).indexOf('gradient') === -1).toBe(true)
    expect((ersteFuellung[1]?.wert as unknown as { name?: string }).name).toBe('verlauf-0')
  })

  it('loeseFarbe wird mit (marke, rolle, aktion) gerufen - an Fuellung UND beiden Stopp - die aktion ist DIESELBE Referenz', () => {
    const doppel = baueKontextDoppel()
    const m = marke()
    zeichneDekoZone(
      doppel.kontext,
      zone(HINTERGRUND, {
        füllungFarbRolle: 'akzent',
        verlauf: { vonFarbRolle: 'akzentKraeftig', bisFarbRolle: 'akzentTief', richtung: 'rechts' },
      }),
      m,
      MIT_WAHL,
    )
    const rufe = vi.mocked(loeseFarbe).mock.calls
    expect(rufe).toHaveLength(3) // Füllung + 2 Stopp
    for (const ruf of rufe) {
      expect(ruf[0]).toBe(m)
      expect(ruf[2]).toBe(MIT_WAHL)
    }
    expect(rufe.map((ruf) => ruf[1])).toEqual(['akzent', 'akzentKraeftig', 'akzentTief'])
  })

  it('die Füllung folgt der Akzent-Auswahl nur ueber loeseFarbe - die Datei wertet nichts selbst aus', () => {
    const doppel = baueKontextDoppel()
    zeichneDekoZone(
      doppel.kontext,
      zone(HINTERGRUND, { füllungFarbRolle: 'akzent' }),
      marke(),
      MIT_WAHL,
    )
    const fillStyle = doppel.ereignisse.find((e) => e.art === 'set' && e.name === 'fillStyle')
    expect(fillStyle?.wert).toBe('#971316') // durch loeseFarbe aufgeloest
  })
})

describe('zeichneDekoZone (#116) - statischer Text', () => {
  it('bindung null -> zeichneTextZone genau einmal mit dem statischen Text; kein eigenes fillText', () => {
    const doppel = baueKontextDoppel()
    const statisch = zone(
      HINTERGRUND,
      { statischerText: 'Fester Hinweis' },
      null,
    )
    statisch.text = {
      schriftRolle: 'fliesstext',
      farbRolle: 'textAufDunkel',
      größeMax: 40,
      größeMin: 16,
      maxZeilen: 2,
    }
    zeichneDekoZone(doppel.kontext, statisch, marke(), OHNE_WAHL)

    expect(vi.mocked(zeichneTextZone)).toHaveBeenCalledTimes(1)
    const ruf = vi.mocked(zeichneTextZone).mock.calls[0]
    expect(ruf?.[2]).toBe('Fester Hinweis')
    expect(doppel.ereignisse.some((e) => e.art === 'rufe' && e.name === 'fillText')).toBe(false)
  })

  it('bindung !== null -> statischer Text wird ignoriert', () => {
    const doppel = baueKontextDoppel()
    const gebundene = zone(
      { x: 0, y: 0, breite: 400, höhe: 100 },
      { füllungFarbRolle: 'akzent', statischerText: 'nicht zeichnen' },
      'preis',
    )
    gebundene.text = {
      schriftRolle: 'fliesstext',
      farbRolle: 'textAufDunkel',
      größeMax: 40,
      größeMin: 16,
      maxZeilen: 2,
    }
    zeichneDekoZone(doppel.kontext, gebundene, marke(), OHNE_WAHL)
    expect(vi.mocked(zeichneTextZone)).not.toHaveBeenCalled()
  })
})

describe('zeichneDekoZone (#116) - Fehlerpfade wirfen nicht', () => {
  it('loeseFarbe wirft fuer die Fuellung -> Verlauf trotzdem gezeichnet, kein Wurf, restore gelaufen', () => {
    vi.mocked(loeseFarbe).mockImplementation((_m: Marke, r: FarbRolle) => {
      if (r === 'akzent') throw new Error('unbekannte Rolle')
      return FARBEN[r]
    })
    const doppel = baueKontextDoppel()
    expect(() =>
      zeichneDekoZone(
        doppel.kontext,
        zone(HINTERGRUND, {
          füllungFarbRolle: 'akzent',
          verlauf: { vonFarbRolle: 'scrimStart', bisFarbRolle: 'scrimEnde', richtung: 'unten' },
        }),
        marke(),
        OHNE_WAHL,
      ),
    ).not.toThrow()
    expect(doppel.verlaeufe).toHaveLength(1)
    expect(doppel.ereignisse.filter((e) => e.art === 'rufe' && e.name === 'restore')).toHaveLength(1)
  })

  it('loeseFarbe wirft fuer EINE Verlauf-Rolle -> GANZER Verlauf aus, Fuellung trotzdem da', () => {
    vi.mocked(loeseFarbe).mockImplementation((_m: Marke, r: FarbRolle) => {
      if (r === 'scrimEnde') throw new Error('unbekannte Rolle')
      return FARBEN[r]
    })
    const doppel = baueKontextDoppel()
    expect(() =>
      zeichneDekoZone(
        doppel.kontext,
        zone(HINTERGRUND, {
          füllungFarbRolle: 'flaecheDunkel',
          verlauf: { vonFarbRolle: 'scrimStart', bisFarbRolle: 'scrimEnde', richtung: 'unten' },
        }),
        marke(),
        OHNE_WAHL,
      ),
    ).not.toThrow()
    // Der Verlauf wurde NICHT gefuellt: Der erste Stopp war verzeichnet, der
    // zweite Wurf brach den Aufruf ab - gefuellt wurde nur die Fuellung.
    expect(doppel.verlaeufe[0]?.stopps).toEqual([[0, '#00000000']])
    expect(doppel.fillRufe).toBe(1)
    expect(doppel.ereignisse.filter((e) => e.art === 'rufe' && e.name === 'restore')).toHaveLength(1)
  })

  it('roundRect wirft -> Zone wird RECHTECKIG gefuellt, Funktion kehrt normal zurueck', () => {
    const doppel = baueKontextDoppel(true)
    expect(() =>
      zeichneDekoZone(
        doppel.kontext,
        zone({ x: 0, y: 0, breite: 400, höhe: 100 }, { füllungFarbRolle: 'akzent', radius: 20 }),
        marke(),
        OHNE_WAHL,
      ),
    ).not.toThrow()
    expect(doppel.fillRufe).toBe(1) // gefangener Fall: rect statt roundRect
  })
})

describe('zeichneDekoZone (#116) - Abbruchbedingungen', () => {
  it('fehlendes deko -> nichts, kein save/restore', () => {
    const doppel = baueKontextDoppel()
    const ohn = zone(HINTERGRUND, undefined, null)
    expect(() => zeichneDekoZone(doppel.kontext, ohn, marke(), OHNE_WAHL)).not.toThrow()
    expect(doppel.ereignisse.filter((e) => e.art === 'rufe' && e.name === 'save')).toHaveLength(0)
    expect(doppel.ereignisse.filter((e) => e.art === 'rufe' && e.name === 'restore')).toHaveLength(0)
  })

  it('deko leer (nichts gewuenscht) -> save/restore laufen, aber kein fill', () => {
    const doppel = baueKontextDoppel()
    zeichneDekoZone(doppel.kontext, zone(HINTERGRUND, {}, null), marke(), OHNE_WAHL)
    expect(doppel.fillRufe).toBe(0)
    expect(doppel.ereignisse.filter((e) => e.art === 'rufe' && e.name === 'save')).toHaveLength(1)
    expect(doppel.ereignisse.filter((e) => e.art === 'rufe' && e.name === 'restore')).toHaveLength(1)
  })

  it('breite 0 -> nichts, kein save/restore', () => {
    const doppel = baueKontextDoppel()
    zeichneDekoZone(
      doppel.kontext,
      zone({ x: 0, y: 0, breite: 0, höhe: 1080 }, { füllungFarbRolle: 'akzent' }),
      marke(),
      OHNE_WAHL,
    )
    expect(doppel.fillRufe).toBe(0)
    expect(doppel.ereignisse.filter((e) => e.art === 'rufe' && e.name === 'save')).toHaveLength(0)
  })

  it('unbrauchbare Radien (NaN, negativ) -> rechteckig wie ohne radius', () => {
    const doppel = baueKontextDoppel()
    for (const radius of [Number.NaN, -10]) {
      zeichneDekoZone(
        doppel.kontext,
        zone({ x: 0, y: 0, breite: 400, höhe: 100 }, { füllungFarbRolle: 'akzent', radius }),
        marke(),
        OHNE_WAHL,
      )
    }
    const runde = doppel.ereignisse.filter((e) => e.art === 'rufe' && e.name === 'roundRect')
    expect(runde).toHaveLength(0)
    const rechtecke = doppel.ereignisse.filter((e) => e.art === 'rufe' && e.name === 'rect')
    expect(rechtecke).toHaveLength(2)
  })

  it('unbekannte verlaufs-Richtung -> ganzer Verlauf aus, kein Wurf', () => {
    const doppel = baueKontextDoppel()
    expect(() =>
      zeichneDekoZone(
        doppel.kontext,
        zone(
          SCRIM,
          {
            verlauf: {
              vonFarbRolle: 'scrimStart',
              bisFarbRolle: 'scrimEnde',
              // unbekannt zur Laufzeit: JSON, nicht TypeScript
              richtung: 'schraeg' as never,
            },
          },
          null,
        ),
        marke(),
        OHNE_WAHL,
      ),
    ).not.toThrow()
    expect(doppel.verlaeufe).toHaveLength(0)
  })
})

describe('zeichneDekoZone (#116) - Klammerung und Schatten', () => {
  it('genau ein save und ein restore; restore nach dem letzten Zeichenaufruf', () => {
    const doppel = baueKontextDoppel()
    zeichneDekoZone(
      doppel.kontext,
      zone(HINTERGRUND, {
        füllungFarbRolle: 'akzent',
        verlauf: { vonFarbRolle: 'scrimStart', bisFarbRolle: 'scrimEnde', richtung: 'unten' },
        statischerText: 'Hinweis',
      }, null),
      marke(),
      OHNE_WAHL,
    )
    const saves = doppel.ereignisse.filter((e) => e.art === 'rufe' && e.name === 'save')
    const restores = doppel.ereignisse.filter((e) => e.art === 'rufe' && e.name === 'restore')
    expect(saves).toHaveLength(1)
    expect(restores).toHaveLength(1)
    expect(saves[0]).not.toBe(restores[0])
  })

  it('Schatten neutralisiert, bevor die erste Form entsteht; kein spaeterer sichtbarer Schatten', () => {
    const doppel = baueKontextDoppel()
    zeichneDekoZone(
      doppel.kontext,
      zone(HINTERGRUND, { füllungFarbRolle: 'akzent' }),
      marke(),
      OHNE_WAHL,
    )
    const farben = doppel.ereignisse.filter((e) => e.art === 'set' && e.name === 'shadowColor')
    expect(farben).toHaveLength(1)
    expect((farben[0] as { wert: string }).wert).toBe('transparent')
    const ersterDraw = doppel.ereignisse.findIndex((e) => e.art === 'rufe' && e.name === 'fill')
    expect(
      doppel.ereignisse.findIndex((e) => e.art === 'set' && e.name === 'shadowColor'),
    ).toBeLessThan(ersterDraw)
  })
})

