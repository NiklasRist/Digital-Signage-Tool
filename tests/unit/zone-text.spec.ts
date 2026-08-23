// Verhaltenstests zu #114 (M4-19) - zeichneTextZone.
//
// Ohne Browser pruefbar (DoD): Aufzeichnungs-Doppel des Canvas-Kontexts (save/restore/
// beginPath/rect/clip/fillText, Setzungen von font/fillStyle/textAlign/textBaseline/
// shadow*). loeseSchrift/loeseFarbe (#112) und passeTextEin (#113) sind Doppel - die
// Kaskade selbst ist dort verbindlich und wird hier NICHT nachgebaut.

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Zone } from '../../src/shared/contracts/vorlage'
import type { Marke } from '../../src/shared/contracts/marke'
import type { Aktion } from '../../src/shared/contracts/aktion'

let schriftWurf: boolean = false
let farbeWurf: boolean = false
let kaskadeAntwort: { zeilen: string[]; größe: number; gekürzt: boolean } = {
  zeilen: ['Hallo Welt'],
  größe: 48,
  gekürzt: false,
}
let kaskadeWurf: boolean = false
const kaskadeEingaenge: unknown[] = []
const messerAufrufe: { text: string; größe: number; fontDabei: string }[] = []

vi.mock('../../src/renderer/template-canvas/farben', () => ({
  loeseSchrift: vi.fn(() => {
    if (schriftWurf) throw new Error('Rolle unbekannt')
    return { familie: 'Arimo', gewicht: 400, datei: '', herkunft: 'gebuendelt' }
  }),
  loeseFarbe: vi.fn((_m: unknown, _rolle: string) => {
    if (farbeWurf) throw new Error('Farbformat unzulaessig')
    return '#GEMESSEN'
  }),
}))
vi.mock('../../src/renderer/template-canvas/schriften', () => ({
  schriftKurzform: (s: { familie: string; gewicht: number }, groesse: number): string =>
    `${s.gewicht} ${groesse}px "${s.familie}"`,
}))
vi.mock('../../src/renderer/template-canvas/text-kaskade', async () => {
  const echt = await import('../../src/renderer/template-canvas/text-kaskade')
  return {
    ZEILENHOEHE_FAKTOR: echt.ZEILENHOEHE_FAKTOR,
    passeTextEin: (eingang: unknown, messeBreite: (t: string, g: number) => number): unknown => {
      kaskadeEingaenge.push(eingang)
      if (kaskadeWurf) throw new Error('unzulaessige Zonen-Parameter')
      const groesseMax = (eingang as { größeMax: number }).größeMax
      // Der ECHTE Ablauf misst ueber den uebergebenen Messer - hier einmal nachstellen:
      messeBreite((eingang as { text: string }).text, groesseMax)
      const fontDabei =
        (ctxAufzeichnung.setzungen.filter((s) => s.eigenschaft === 'font').at(-1)?.wert ??
          '') as string
      messerAufrufe.push({
        text: (eingang as { text: string }).text,
        größe: groesseMax,
        fontDabei,
      })
      return kaskadeAntwort
    },
  }
})

import { zeichneTextZone } from '../../src/renderer/template-canvas/zone-text'

// ---------------------------------------------------------------------------
// Aufzeichnungs-Doppel des Kontexts
// ---------------------------------------------------------------------------

interface Setzung {
  eigenschaft: string
  wert: unknown
}
interface Aufruf {
  name: string
  argumente: unknown[]
}

const ctxAufzeichnung: {
  setzungen: Setzung[]
  aufrufe: Aufruf[]
  texte: { text: string; x: number; y: number; maxWidthVorhanden: boolean }[]
} = { setzungen: [], aufrufe: [], texte: [] }

function neuerCtx(): CanvasRenderingContext2D {
  ctxAufzeichnung.setzungen = []
  ctxAufzeichnung.aufrufe = []
  ctxAufzeichnung.texte = []
  let font = ''
  const ziel = {} as Record<string, unknown>
  Object.defineProperties(ziel, {
    font: {
      set(wert: string) {
        font = wert
        ctxAufzeichnung.setzungen.push({ eigenschaft: 'font', wert })
      },
      get: () => font,
    },
    fillStyle: {
      set(wert: unknown) {
        ctxAufzeichnung.setzungen.push({ eigenschaft: 'fillStyle', wert })
      },
    },
    textAlign: {
      set(wert: unknown) {
        ctxAufzeichnung.setzungen.push({ eigenschaft: 'textAlign', wert })
      },
    },
    textBaseline: {
      set(wert: unknown) {
        ctxAufzeichnung.setzungen.push({ eigenschaft: 'textBaseline', wert })
      },
    },
    shadowColor: {
      set(wert: unknown) {
        ctxAufzeichnung.setzungen.push({ eigenschaft: 'shadowColor', wert })
      },
    },
    shadowBlur: {
      set(wert: unknown) {
        ctxAufzeichnung.setzungen.push({ eigenschaft: 'shadowBlur', wert })
      },
    },
  })
  for (const name of ['save', 'restore', 'beginPath', 'rect', 'clip', 'measureText']) {
    ;(ziel as Record<string, unknown>)[name] = (...argumente: unknown[]) => {
      ctxAufzeichnung.aufrufe.push({ name, argumente })
      return name === 'measureText' ? { width: 10 * String(argumente[0]).length } : undefined
    }
  }
  ;(ziel as Record<string, unknown>)['fillText'] = (
    text: string,
    x: number,
    y: number,
    ...rest: unknown[]
  ) => {
    ctxAufzeichnung.texte.push({ text, x, y, maxWidthVorhanden: rest.length > 0 })
  }
  return ziel as unknown as CanvasRenderingContext2D
}

// ---------------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------------

const RAHMEN = { x: 96, y: 54, breite: 400, höhe: 120 }

function zone(partial: Partial<Zone['text']> & Partial<Zone> = {}): Zone {
  return {
    id: 'titel',
    rolle: 'frei',
    bindung: 'titel',
    rahmen: RAHMEN,
    ausrichtung: { horizontal: 'links', vertikal: 'oben' },
    wennLeer: 'leer',
    text: {
      schriftRolle: 'headlineElegant',
      farbRolle: 'textAufDunkel',
      größeMax: 72,
      größeMin: 24,
      maxZeilen: 3,
      ...(partial as object),
    },
    ...partial,
  } as unknown as Zone
}

function marke(): Marke {
  return { id: 'm1', schriften: {}, farben: {}, sicherheit: {} } as unknown as Marke
}
const aktion = {} as Aktion

describe('zeichneTextZone (#114)', () => {
  beforeEach(() => {
    schriftWurf = false
    farbeWurf = false
    kaskadeWurf = false
    kaskadeAntwort = { zeilen: ['Hallo Welt'], größe: 48, gekürzt: false }
    kaskadeEingaenge.length = 0
    messerAufrufe.length = 0
  })

  it('zeichnet die Kaskaden-Zeilen mit der gewaehlten Groesse an der richtigen Position', () => {
    kaskadeAntwort = { zeilen: ['Eine', 'Zwei'], größe: 40, gekürzt: false }
    const ctx = neuerCtx()
    zeichneTextZone(ctx, zone(), 'Eine Zwei', marke(), aktion)

    expect(ctxAufzeichnung.texte).toHaveLength(2)
    const zeilenhoehe = 40 * 1.2 // Faktor aus #113
    expect(ctxAufzeichnung.texte[0]).toMatchObject({ text: 'Eine', x: RAHMEN.x, y: RAHMEN.y })
    expect(ctxAufzeichnung.texte[1]).toMatchObject({
      text: 'Zwei',
      x: RAHMEN.x,
      y: RAHMEN.y + zeilenhoehe,
    })
    // Endgueltige Schrift = Kaskadengroesse, nicht die letzte Probiergroesse:
    expect(
      ctxAufzeichnung.setzungen.filter((s) => s.eigenschaft === 'font').at(-1)?.wert,
    ).toBe('400 40px "Arimo"')
  })

  it('kein fillText mit maxWidth-Argument (keine vierte Kaskadenstufe)', () => {
    const ctx = neuerCtx()
    zeichneTextZone(ctx, zone(), 'Text', marke(), aktion)
    expect(ctxAufzeichnung.texte[0]?.maxWidthVorhanden).toBe(false)
  })

  it('der Messer misst auf DEMSELBEN Kontext via schriftKurzform', () => {
    const ctx = neuerCtx()
    zeichneTextZone(ctx, zone(), 'Text', marke(), aktion)
    expect(messerAufrufe).toHaveLength(1)
    expect(messerAufrufe[0]?.fontDabei).toBe(`400 ${messerAufrufe[0]?.größe}px "Arimo"`)
  })

  it.each([
    ['mitte-links', 'mitte', 'oben'],
    ['rechts-unten', 'rechts', 'unten'],
  ])('Ausrichtung %s bestimmt x/y (%s)', (_n, horizontal, vertikal) => {
    const ctx = neuerCtx()
    zeichneTextZone(
      ctx,
      zone({ ausrichtung: { horizontal: horizontal as never, vertikal: vertikal as never } }),
      'T',
      marke(),
      aktion,
    )
    const erwartetX =
      horizontal === 'mitte' ? RAHMEN.x + RAHMEN.breite / 2 : RAHMEN.x + RAHMEN.breite
    const blockHoehe = kaskadeAntwort.zeilen.length * kaskadeAntwort.größe * 1.2
    const erwartetY = vertikal === 'unten' ? RAHMEN.y + RAHMEN.höhe - blockHoehe : RAHMEN.y
    expect(ctxAufzeichnung.setzungen).toContainEqual({
      eigenschaft: 'textAlign',
      wert: horizontal === 'mitte' ? 'center' : 'right',
    })
    expect(ctxAufzeichnung.texte[0]?.x).toBe(erwartetX)
    expect(Math.round((ctxAufzeichnung.texte[0]?.y ?? 0) * 1000)).toBe(
      Math.round(erwartetY * 1000),
    )
  })

  it('Beschnitt auf den Zonenrahmen: beginPath, rect, clip in dieser Reihenfolge', () => {
    const ctx = neuerCtx()
    zeichneTextZone(ctx, zone(), 'Text', marke(), aktion)
    const namen = ctxAufzeichnung.aufrufe.map((a) => a.name)
    expect(namen.indexOf('beginPath')).toBeGreaterThanOrEqual(0)
    expect(namen.indexOf('rect')).toBe(namen.indexOf('beginPath') + 1)
    expect(namen.indexOf('clip')).toBe(namen.indexOf('rect') + 1)
    expect(ctxAufzeichnung.aufrufe.find((a) => a.name === 'rect')?.argumente).toEqual([
      RAHMEN.x,
      RAHMEN.y,
      RAHMEN.breite,
      RAHMEN.höhe,
    ])
  })

  it('zu jedem save gehoert genau ein restore - auch bei jedem Abbruchpfad', () => {
    // Normalpfad
    let ctx = neuerCtx()
    zeichneTextZone(ctx, zone(), 'Text', marke(), aktion)
    const zaehle = (name: string) =>
      ctxAufzeichnung.aufrufe.filter((a) => a.name === name).length
    expect(zaehle('save')).toBe(1)
    expect(zaehle('restore')).toBe(1)

    // Abbruch: fehlende zone.text
    ctx = neuerCtx()
    const ohneText = zone() as Partial<Zone>
    delete ohneText.text
    zeichneTextZone(ctx, ohneText as Zone, 'Text', marke(), aktion)
    expect(zaehle('save')).toBe(0)

    // Abbruch: leerer Text -> nichts, nicht mal save
    ctx = neuerCtx()
    zeichneTextZone(ctx, zone(), '   ', marke(), aktion)
    expect(zaehle('save')).toBe(0)
    expect(ctxAufzeichnung.texte).toHaveLength(0)

    // Abbruch: Schrift wirft
    schriftWurf = true
    ctx = neuerCtx()
    zeichneTextZone(ctx, zone(), 'Text', marke(), aktion)
    expect(zaehle('save')).toBe(1)
    expect(zaehle('restore')).toBe(1)
    expect(ctxAufzeichnung.texte).toHaveLength(0)
    expect(
      ctxAufzeichnung.setzungen.some((s) => s.eigenschaft === 'fillStyle'),
    ).toBe(false) // keine Ersatzfarbe

    // Abbruch: Kaskade wirft
    schriftWurf = false
    kaskadeWurf = true
    ctx = neuerCtx()
    zeichneTextZone(ctx, zone(), 'Text', marke(), aktion)
    expect(zaehle('save')).toBe(1)
    expect(zaehle('restore')).toBe(1)
    expect(ctxAufzeichnung.texte).toHaveLength(0)

    // Abbruch: Farbe wirft
    kaskadeWurf = false
    farbeWurf = true
    ctx = neuerCtx()
    zeichneTextZone(ctx, zone(), 'Text', marke(), aktion)
    expect(zaehle('save')).toBe(1)
    expect(zaehle('restore')).toBe(1)
    expect(ctxAufzeichnung.texte).toHaveLength(0)
    schriftWurf = false
    farbeWurf = false
  })

  it("unbrauchbarer Rahmen (breite/hoehe <= 0 oder unendlich) zeichnet gar nichts", () => {
    for (const rahmen of [
      { ...RAHMEN, breite: 0 },
      { ...RAHMEN, höhe: -5 },
      { ...RAHMEN, breite: Number.NaN },
    ]) {
      const ctx = neuerCtx()
      zeichneTextZone(ctx, zone({ rahmen }), 'Text', marke(), aktion)
      expect(ctxAufzeichnung.texte).toHaveLength(0)
      expect(ctxAufzeichnung.aufrufe.filter((a) => a.name === 'save')).toHaveLength(0)
    }
  })

  it('die Aktion erreicht loeseFarbe als drittes Argument - dieselbe Referenz', async () => {
    const { loeseFarbe } = await import('../../src/renderer/template-canvas/farben')
    const a = {} as Aktion
    const m = marke()
    const ctx = neuerCtx()
    zeichneTextZone(ctx, zone(), 'Text', m, a)
    expect(vi.mocked(loeseFarbe)).toHaveBeenCalledWith(m, 'textAufDunkel', a)
  })

  it('die Kaskade bekommt genau die Zonenparameter', () => {
    const ctx = neuerCtx()
    zeichneTextZone(ctx, zone(), 'Der Text', marke(), aktion)
    expect(kaskadeEingaenge[0]).toEqual({
      text: 'Der Text',
      breite: RAHMEN.breite,
      höhe: RAHMEN.höhe,
      größeMax: 72,
      größeMin: 24,
      maxZeilen: 3,
    })
  })

  it('kein Schatten auf Text', () => {
    const ctx = neuerCtx()
    zeichneTextZone(ctx, zone(), 'Text', marke(), aktion)
    expect(ctxAufzeichnung.setzungen).toContainEqual({
      eigenschaft: 'shadowColor',
      wert: 'transparent',
    })
    expect(ctxAufzeichnung.setzungen).toContainEqual({ eigenschaft: 'shadowBlur', wert: 0 })
  })

  it('Determinismus: zwei identische Aufrufe -> identische Aufzeichnung', () => {
    const lauf = () => {
      const ctx = neuerCtx()
      zeichneTextZone(ctx, zone(), 'Der Text', marke(), aktion)
      return JSON.stringify({ z: ctxAufzeichnung.setzungen, t: ctxAufzeichnung.texte })
    }
    expect(lauf()).toBe(lauf())
  })
})
