// Verhaltenstests zu #115 (M4-20) - zeichneBildZone.
//
// Ohne Browser pruefbar (DoD): Aufzeichnungs-Doppel des Canvas-Kontexts; das Motiv ist
// ein von Hand gebautes Objekt (bild darf ein beliebiger Platzhalterwert sein, weil die
// Maesse aus motiv.breite/motiv.hoehe kommen). loeseFarbe/loeseSchrift (#112) sind
// Doppel mit steuerbaren Wuergern je Rolle.

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Zone } from '../../src/shared/contracts/vorlage'
import type { Marke } from '../../src/shared/contracts/marke'
import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Motiv } from '../../src/renderer/template-canvas/bild-laden'

let wurfBeiRolle: string | null = null
let schriftWurf: boolean = false

vi.mock('../../src/renderer/template-canvas/farben', () => ({
  loeseFarbe: vi.fn((_m: unknown, rolle: string) => {
    if (wurfBeiRolle === rolle) throw new Error(`Rolle ${rolle} unbekannt`)
    return `#FARBE-${rolle}`
  }),
  loeseSchrift: vi.fn(() => {
    if (schriftWurf) throw new Error('Schrift-Rolle unbekannt')
    return { familie: 'Arimo', gewicht: 400, datei: '', herkunft: 'gebuendelt' }
  }),
}))
vi.mock('../../src/renderer/template-canvas/schriften', () => ({
  schriftKurzform: (s: { familie: string; gewicht: number }, groesse: number): string =>
    `${s.gewicht} ${groesse}px "${s.familie}"`,
}))

import { zeichneBildZone } from '../../src/renderer/template-canvas/zone-bild'

interface Setzung {
  eigenschaft: string
  wert: unknown
}

function neuerCtx(zeigeDrawImageFehler = false) {
  const setzungen: Setzung[] = []
  const aufrufe: { name: string; argumente: unknown[] }[] = []
  const ziel = {} as Record<string, unknown>
  for (const eigenschaft of [
    'fillStyle',
    'strokeStyle',
    'textAlign',
    'textBaseline',
    'imageSmoothingEnabled',
    'imageSmoothingQuality',
  ]) {
    Object.defineProperty(ziel, eigenschaft, {
      set(wert: unknown) {
        setzungen.push({ eigenschaft, wert })
      },
      get: () => undefined,
    })
  }
  ;(ziel as Record<string, unknown>)['font'] = ''
  Object.defineProperty(ziel, 'font', {
    set(wert: string) {
      setzungen.push({ eigenschaft: 'font', wert })
    },
    get: () => '',
  })
  Object.defineProperty(ziel, 'lineWidth', {
    set(wert: unknown) {
      setzungen.push({ eigenschaft: 'lineWidth', wert })
    },
    get: () => undefined,
  })
  for (const name of ['beginPath', 'moveTo', 'lineTo', 'stroke']) {
    ;(ziel as Record<string, unknown>)[name] = (...argumente: unknown[]) => {
      aufrufe.push({ name, argumente })
    }
  }
  ;(ziel as Record<string, unknown>)['drawImage'] = (...argumente: unknown[]) => {
    if (zeigeDrawImageFehler) throw new Error('verwaistes Bildobjekt')
    aufrufe.push({ name: 'drawImage', argumente })
  }
  ;(ziel as Record<string, unknown>)['fillRect'] = (...argumente: unknown[]) => {
    aufrufe.push({ name: 'fillRect', argumente })
  }
  ;(ziel as Record<string, unknown>)['strokeRect'] = (...argumente: unknown[]) => {
    aufrufe.push({ name: 'strokeRect', argumente })
  }
  ;(ziel as Record<string, unknown>)['save'] = () => aufrufe.push({ name: 'save', argumente: [] })
  ;(ziel as Record<string, unknown>)['restore'] = () =>
    aufrufe.push({ name: 'restore', argumente: [] })
  ;(ziel as Record<string, unknown>)['fillText'] = (...argumente: unknown[]) => {
    aufrufe.push({ name: 'fillText', argumente })
  }
  return { ctx: ziel as unknown as CanvasRenderingContext2D, setzungen, aufrufe }
}

const RAHMEN = { x: 0, y: 0, breite: 960, höhe: 1080 }

function zone(einpassung?: 'contain' | 'cover' | 'unbekannt'): Zone {
  return {
    id: 'motiv',
    rolle: 'frei',
    bindung: 'bild',
    rahmen: RAHMEN,
    ausrichtung: { horizontal: 'links', vertikal: 'oben' },
    wennLeer: 'leer',
    bild:
      einpassung === undefined || einpassung === 'unbekannt'
        ? ({ einpassung: einpassung ?? undefined } as unknown as Zone['bild'])
        : { einpassung },
  } as unknown as Zone
}

const marke = {} as Marke
const aktion = { id: 'a1' } as Aktion

function geladenesMotiv(breite: number, höhe: number): Motiv {
  return { zustand: 'geladen', bild: { platzhalter: true }, breite, höhe } as unknown as Motiv
}
const fehlendesMotiv: Motiv = { zustand: 'fehlt' }

describe('zeichneBildZone (#115)', () => {
  beforeEach(() => {
    wurfBeiRolle = null
    schriftWurf = false
  })

  describe('contain (5 Argumente)', () => {
    it("DoD-Zahlen: Rahmen 960x1080, Motiv 1600x1200 -> drawImage(bild, 0, 180, 960, 720)", () => {
      const { ctx, aufrufe } = neuerCtx()
      zeichneBildZone(ctx, zone('contain'), geladenesMotiv(1600, 1200), marke, aktion)
      expect(aufrufe.filter((a) => a.name === 'drawImage')).toHaveLength(1)
      const argumente = aufrufe.find((a) => a.name === 'drawImage')?.argumente ?? []
      expect(argumente).toHaveLength(5)
      expect(argumente[0]).toEqual({ platzhalter: true }) // das bild-Objekt selbst
      expect(argumente.slice(1)).toEqual([0, 180, 960, 720])
    })

    it('das Seitenverhaeltnis bleibt erhalten - auch bei krummen Massen (Toleranz 1e-9)', () => {
      const { ctx, aufrufe } = neuerCtx()
      zeichneBildZone(ctx, zone('contain'), geladenesMotiv(1601, 1200), marke, aktion)
      const [, zx, zy, zb, zh] = aufrufe.find((a) => a.name === 'drawImage')?.argumente ?? []
      expect(Math.abs((zb as number) / (zh as number) - 1601 / 1200)).toBeLessThan(1e-9)
      // zentriert im Rahmen:
      expect(zx).toBeCloseTo((RAHMEN.breite - (zb as number)) / 2, 9)
      expect(zy).toBeCloseTo((RAHMEN.höhe - (zh as number)) / 2, 9)
    })

    it('gleiche Seitenverhaeltnisse: contain und cover liefern dasselbe Ziel-Rechteck', () => {
      const vollbild = { ...RAHMEN, breite: 1920 }
      const zContain = { ...zone('contain'), rahmen: vollbild } as unknown as Zone
      const zCover = { ...zone('cover'), rahmen: vollbild } as unknown as Zone
      const contain = neuerCtx()
      zeichneBildZone(contain.ctx, zContain, geladenesMotiv(1920, 1080), marke, aktion)
      const cover = neuerCtx()
      zeichneBildZone(cover.ctx, zCover, geladenesMotiv(1920, 1080), marke, aktion)
      const aContain = contain.aufrufe.find((a) => a.name === 'drawImage')?.argumente ?? []
      const aCover = cover.aufrufe.find((a) => a.name === 'drawImage')?.argumente ?? []
      // contain: [bild, x, y, w, h] / cover: [bild, qx, qy, qw, qh, x, y, w, h]
      expect(aContain.slice(1)).toEqual([0, 0, 1920, 1080])
      expect(aCover.slice(5)).toEqual([0, 0, 1920, 1080])
      expect(aCover.slice(1, 5)).toEqual([0, 0, 1920, 1080]) // kein Beschnitt nötig
    })

    it.each([
      ['zone.bild fehlt', zone(undefined)],
      ['unbekannter Einpassungswert', zone('unbekannt')],
    ])('%s -> das contain-Ergebnis (schadenaermer Wert)', (_n, z) => {
      const referenz = neuerCtx()
      zeichneBildZone(referenz.ctx, zone('contain'), geladenesMotiv(1600, 1200), marke, aktion)
      const probe = neuerCtx()
      zeichneBildZone(probe.ctx, z, geladenesMotiv(1600, 1200), marke, aktion)
      expect(probe.aufrufe.filter((a) => a.name === 'drawImage')).toEqual(
        referenz.aufrufe.filter((a) => a.name === 'drawImage'),
      )
    })
  })

  describe('cover (9 Argumente, Quell-Rechteck)', () => {
    it("DoD-Zahlen: Rahmen 1920x1080, Motiv 1600x1200 -> (bild, 0, 150, 1600, 900, 0, 0, 1920, 1080)", () => {
      const vollbild = { ...RAHMEN, breite: 1920 }
      const z = { ...zone('cover'), rahmen: vollbild } as unknown as Zone
      const { ctx, aufrufe } = neuerCtx()
      zeichneBildZone(ctx, z, geladenesMotiv(1600, 1200), marke, aktion)
      const argumente = aufrufe.find((a) => a.name === 'drawImage')?.argumente ?? []
      expect(argumente).toHaveLength(9)
      expect(argumente).toEqual([
        { platzhalter: true },
        0,
        150,
        1600,
        900,
        0,
        0,
        1920,
        1080,
      ])
    })

    it('Beschnitt liegt MITTIG, nicht am linken Rand', () => {
      const halbes = { ...RAHMEN, breite: 960 }
      const z = { ...zone('cover'), rahmen: halbes } as unknown as Zone
      const { ctx, aufrufe } = neuerCtx()
      zeichneBildZone(ctx, z, geladenesMotiv(1920, 1080), marke, aktion)
      const argumente = aufrufe.find((a) => a.name === 'drawImage')?.argumente ?? []
      expect(argumente).toHaveLength(9)
      expect(argumente.slice(1, 5)).toEqual([480, 0, 960, 1080]) // quellX mittig
      expect(argumente.slice(5)).toEqual([0, 0, 960, 1080])
    })

    it('das Quell-Seitenverhaeltnis passt zum Ziel (Toleranz 1e-9)', () => {
      const vollbild = { ...RAHMEN, breite: 1920 }
      const z = { ...zone('cover'), rahmen: vollbild } as unknown as Zone
      const { ctx, aufrufe } = neuerCtx()
      zeichneBildZone(ctx, z, geladenesMotiv(1601, 1199), marke, aktion)
      const [, qx, qy, qb, qh] = aufrufe.find((a) => a.name === 'drawImage')?.argumente ?? []
      expect(Math.abs((qb as number) / (qh as number) - 1920 / 1080)).toBeLessThan(1e-9)
      void qx
      void qy
    })

    it('kein clip in der Datei (cover ueber das Quell-Rechteck)', () => {
      const { ctx, aufrufe } = neuerCtx()
      zeichneBildZone(ctx, zone('cover'), geladenesMotiv(1600, 1200), marke, aktion)
      expect(aufrufe.some((a) => a.name === 'clip')).toBe(false)
    })
  })

  describe('Interpolation und Kontext-Hygiene', () => {
    it('imageSmoothing wird explizit gesetzt, BEVOR das erste drawImage kommt', () => {
      const { ctx, setzungen, aufrufe } = neuerCtx()
      zeichneBildZone(ctx, zone('contain'), geladenesMotiv(1600, 1200), marke, aktion)
      const smoothingIndex = setzungen.findIndex(
        (s) => s.eigenschaft === 'imageSmoothingQuality',
      )
      const drawIndex = aufrufe.findIndex((a) => a.name === 'drawImage')
      expect(drawIndex).toBeGreaterThanOrEqual(0)
      expect(smoothingIndex).toBeGreaterThanOrEqual(0)
      expect(setzungen).toContainEqual({ eigenschaft: 'imageSmoothingEnabled', wert: true })
      expect(setzungen).toContainEqual({
        eigenschaft: 'imageSmoothingQuality',
        wert: 'high',
      })
    })

    it('genau EIN save und EIN restore auf jedem zeichnenden Pfad (auch Platzhalter/Fehlerzweig)', () => {
      const zaehle = (ergebnis: { aufrufe: { name: string }[] }, name: string) =>
        ergebnis.aufrufe.filter((a) => a.name === name).length

      const normal = neuerCtx()
      zeichneBildZone(normal.ctx, zone('contain'), geladenesMotiv(1600, 1200), marke, aktion)
      expect(zaehle(normal, 'save')).toBe(1)
      expect(zaehle(normal, 'restore')).toBe(1)

      const platzhalter = neuerCtx()
      zeichneBildZone(platzhalter.ctx, zone(), fehlendesMotiv, marke, aktion)
      expect(zaehle(platzhalter, 'save')).toBe(1)
      expect(zaehle(platzhalter, 'restore')).toBe(1)

      const fehler = neuerCtx(true)
      expect(() =>
        zeichneBildZone(fehler.ctx, zone('contain'), geladenesMotiv(1600, 1200), marke, aktion),
      ).not.toThrow()
      expect(zaehle(fehler, 'save')).toBe(1)
      expect(zaehle(fehler, 'restore')).toBe(1)
    })
  })

  describe('Platzhalter (Defektanzeige, TK 9.10.7)', () => {
    function platzhalterAufrufe() {
      const ergebnis = neuerCtx()
      zeichneBildZone(ergebnis.ctx, zone(), fehlendesMotiv, marke, aktion)
      return ergebnis
    }

    it('fehlt -> kein drawImage, aber Flaeche + strokeRect + Diagonalen + genau EIN fillText "Bild fehlt"', () => {
      const { aufrufe } = platzhalterAufrufe()
      expect(aufrufe.some((a) => a.name === 'drawImage')).toBe(false)
      expect(aufrufe.some((a) => a.name === 'fillRect')).toBe(true)
      expect(aufrufe.some((a) => a.name === 'strokeRect')).toBe(true)
      // zwei Diagonalen: 4 moveTo/lineTo-Punkte, EIN stroke
      expect(aufrufe.filter((a) => a.name === 'lineTo')).toHaveLength(2)
      expect(aufrufe.filter((a) => a.name === 'stroke')).toHaveLength(1)
      const texte = aufrufe.filter((a) => a.name === 'fillText')
      expect(texte).toHaveLength(1)
      expect(texte[0]?.argumente[0]).toBe('Bild fehlt')
    })

    it('Beschriftung exakt im Mittelpunkt, center/middle, ohne viertes Argument', () => {
      const { ctx, setzungen, aufrufe } = platzhalterAufrufe()
      void ctx
      expect(setzungen).toContainEqual({ eigenschaft: 'textAlign', wert: 'center' })
      expect(setzungen).toContainEqual({ eigenschaft: 'textBaseline', wert: 'middle' })
      const texte = aufrufe.filter((a) => a.name === 'fillText')
      expect(texte[0]?.argumente).toEqual([
        'Bild fehlt',
        RAHMEN.x + RAHMEN.breite / 2,
        RAHMEN.y + RAHMEN.höhe / 2,
      ])
    })

    it('Strich um 2 px nach innen versetzt, 4 px dick; Diagonalen von Ecke zu Ecke', () => {
      const { aufrufe, setzungen } = platzhalterAufrufe()
      const strokeRect = aufrufe.find((a) => a.name === 'strokeRect')?.argumente ?? []
      expect(strokeRect).toEqual([2, 2, RAHMEN.breite - 4, RAHMEN.höhe - 4])
      expect(setzungen).toContainEqual({ eigenschaft: 'lineWidth', wert: 4 })
      const moveTo = aufrufe.filter((a) => a.name === 'moveTo').map((a) => a.argumente)
      expect(moveTo).toContainEqual([RAHMEN.x, RAHMEN.y])
      expect(moveTo).toContainEqual([RAHMEN.breite, RAHMEN.y])
    })

    it('geladenes Motiv mit Breite 0 -> derselbe Platzhalter-Aufrufverlauf wie bei fehlt', () => {
      const referenz = platzhalterAufrufe()
      const probe = neuerCtx()
      zeichneBildZone(probe.ctx, zone(), geladenesMotiv(0, 100), marke, aktion)
      expect(probe.aufrufe.map((a) => a.name)).toEqual(
        referenz.aufrufe.map((a) => a.name),
      )
    })

    it('die Aktion erreicht loeseFarbe als drittes Argument - dieselbe Referenz', async () => {
      const { loeseFarbe } = await import('../../src/renderer/template-canvas/farben')
      const spy = vi.mocked(loeseFarbe)
      spy.mockClear()
      zeichneBildZone(neuerCtx().ctx, zone(), fehlendesMotiv, marke, aktion)
      for (const aufruf of spy.mock.calls) {
        expect(aufruf[0]).toBe(marke)
        expect(aufruf[2]).toBe(aktion)
      }
      expect(spy.mock.calls.length).toBeGreaterThanOrEqual(3) // Flaeche, Strich, Text
    })
  })

  describe('Abbruch- und Fehlerpfade', () => {
    it.each([{ ...RAHMEN, breite: 0 }, { ...RAHMEN, höhe: -3 }, { ...RAHMEN, breite: Number.NaN }])(
      'unbrauchbarer Rahmen %p: gar nichts, kein save/restore, keine Ausnahme',
      (rahmen) => {
        const { ctx, aufrufe } = neuerCtx()
        const z = { ...zone(), rahmen } as unknown as Zone
        expect(() =>
          zeichneBildZone(ctx, z, fehlendesMotiv, marke, aktion),
        ).not.toThrow()
        expect(aufrufe.filter((a) => a.name === 'save')).toHaveLength(0)
        expect(aufrufe.filter((a) => a.name === 'restore')).toHaveLength(0)
      },
    )

    it('wirft loeseFarbe fuer EINE Rolle, fehlt genau dieser Teilschritt, der Rest steht', () => {
      // flaecheDunkel (Flaeche): strokeRect + fillText bleiben
      wurfBeiRolle = 'flaecheDunkel'
      let e = neuerCtx()
      zeichneBildZone(e.ctx, zone(), fehlendesMotiv, marke, aktion)
      expect(e.aufrufe.some((a) => a.name === 'fillRect')).toBe(false)
      expect(e.aufrufe.some((a) => a.name === 'strokeRect')).toBe(true)
      expect(e.aufrufe.some((a) => a.name === 'fillText')).toBe(true)

      // akzent (Strich UND Diagonalen): fillRect + fillText bleiben
      wurfBeiRolle = 'akzent'
      e = neuerCtx()
      zeichneBildZone(e.ctx, zone(), fehlendesMotiv, marke, aktion)
      expect(e.aufrufe.some((a) => a.name === 'fillRect')).toBe(true)
      expect(e.aufrufe.some((a) => a.name === 'strokeRect')).toBe(false)
      expect(e.aufrufe.some((a) => a.name === 'stroke')).toBe(false)
      expect(e.aufrufe.some((a) => a.name === 'fillText')).toBe(true)

      // textAufDunkel (Beschriftung): Flaeche + Strich bleiben
      wurfBeiRolle = 'textAufDunkel'
      e = neuerCtx()
      zeichneBildZone(e.ctx, zone(), fehlendesMotiv, marke, aktion)
      expect(e.aufrufe.some((a) => a.name === 'fillRect')).toBe(true)
      expect(e.aufrufe.some((a) => a.name === 'strokeRect')).toBe(true)
      expect(e.aufrufe.some((a) => a.name === 'fillText')).toBe(false)
      wurfBeiRolle = null
    })

    it('loeseSchrift wirft -> Beschriftung entfaellt, Rest steht, keine Ausnahme nach aussen', () => {
      schriftWurf = true
      const { ctx, aufrufe } = neuerCtx()
      expect(() =>
        zeichneBildZone(ctx, zone(), fehlendesMotiv, marke, aktion),
      ).not.toThrow()
      expect(aufrufe.some((a) => a.name === 'fillRect')).toBe(true)
      expect(aufrufe.some((a) => a.name === 'fillText')).toBe(false)
    })
  })

  it('Determinismus: identische Eingaben -> identische Aufruffolge', () => {
    const lauf = () => {
      const ergebnis = neuerCtx()
      zeichneBildZone(ergebnis.ctx, zone('cover'), geladenesMotiv(1600, 1200), marke, aktion)
      return JSON.stringify({ s: ergebnis.setzungen, a: ergebnis.aufrufe })
    }
    expect(lauf()).toBe(lauf())
  })
})
