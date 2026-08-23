// Verhaltenstests zu #293 - zeichneErsatzLogo in src/renderer/template-canvas/ersatz-logo.ts.
//
// Ohne Browser pruefbar (DoD): CanvasRenderingContext2D als Aufzeichnungs-Doppel
// (fillRect, fillText, measureText, font/fillStyle-Setzungen). loeseFarbe (M4-18) wird
// gespioniert - der Nachweis, dass NUR textAufDunkel/textAufHell angefragt werden und
// dass aktion.akzentfarbe die Flaeche nicht veraendert, laeuft ueber den Spy plus die
// aufgezeichneten Setzungen. waehleBesserenKontrast (#292) laeuft ECHT - seine Wahl ist
// selbst der Vertragsgegenstand.

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Zone } from '../../src/shared/contracts/vorlage'
import type { Marke } from '../../src/shared/contracts/marke'
import type { Aktion } from '../../src/shared/contracts/aktion'
import type { FarbRolle } from '../../src/shared/contracts/marke'

vi.mock('../../src/renderer/template-canvas/farben', async (importOriginal) => {
  const echt = await importOriginal<typeof import('../../src/renderer/template-canvas/farben')>()
  return {
    ...echt,
    loeseFarbe: vi.fn(echt.loeseFarbe),
  }
})

// schriftKurzform (#110) ist standheute noch ein Rumpf. Gemockt wird NUR der dort
// verbindlich dokumentierte Formatvertrag `${gewicht} ${groessePx}px "${familie}"` -
// dieselbe Einordnung wie in tests/unit/marken-schriften.spec.ts zu #291.
vi.mock('../../src/renderer/template-canvas/schriften', () => ({
  schriftKurzform: (schrift: { gewicht: number; familie: string }, größePx: number): string =>
    `${schrift.gewicht} ${größePx}px "${schrift.familie}"`,
}))

import { loeseFarbe } from '../../src/renderer/template-canvas/farben'
import { zeichneErsatzLogo } from '../../src/renderer/template-canvas/ersatz-logo'

// ---------------------------------------------------------------------------
// Aufzeichnungs-Doppel des Canvas-Kontexts
// ---------------------------------------------------------------------------

interface Setzung {
  eigenschaft: 'font' | 'fillStyle' | 'textAlign' | 'textBaseline'
  wert: string
}
interface TextAufruf {
  text: string
  x: number
  y: number
  font: string
}

function neuerCtx(messbareBreite?: (text: string, groessePx: number) => number) {
  // Ohne explizite Messfunktion: Breite proportional zur AKTUELLEN Schriftgroesse -
  // so verhaelt sich auch echtes measureText. Koeffizient 0.6 px/Zeichen/Groesse.
  const messe =
    messbareBreite ?? ((text: string, groessePx: number) => text.length * 0.6 * groessePx)
  const setzungen: Setzung[] = []
  const texte: TextAufruf[] = []
  let font = ''
  const rechtecke: { x: number; y: number; breite: number; hoehe: number; farbe: string }[] = []

  function aktuelleGroesse(): number {
    return Number(/(\d+)px/.exec(font)?.[1] ?? 16)
  }

  const ctx = {
    get font() {
      return font
    },
    set font(wert: string) {
      font = wert
      setzungen.push({ eigenschaft: 'font', wert })
    },
    set fillStyle(wert: string) {
      setzungen.push({ eigenschaft: 'fillStyle', wert })
    },
    set textAlign(wert: string) {
      setzungen.push({ eigenschaft: 'textAlign', wert })
    },
    set textBaseline(wert: string) {
      setzungen.push({ eigenschaft: 'textBaseline', wert })
    },
    measureText(text: string) {
      return { width: messe(text, aktuelleGroesse()) }
    },
    fillRect(x: number, y: number, breite: number, hoehe: number) {
      // die zuletzt gesetzte fillStyle IST die Rechteckfarbe (Canvas-Semantik)
      const fuellung = [...setzungen].reverse().find((s) => s.eigenschaft === 'fillStyle')
      rechtecke.push({ x, y, breite, hoehe, farbe: fuellung?.wert ?? '' })
    },
    fillText(text: string, x: number, y: number) {
      texte.push({ text, x, y, font })
    },
  } as unknown as CanvasRenderingContext2D

  return { ctx, setzungen, texte, rechtecke }
}

// ---------------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------------

const RAHMEN = { x: 40, y: 30, breite: 420, höhe: 120 }

function zone(): Zone {
  return {
    id: 'logo',
    rolle: 'markenRahmen',
    bindung: 'logo',
    rahmen: RAHMEN,
    ausrichtung: { horizontal: 'mitte', vertikal: 'mitte' },
    wennLeer: 'ausblenden',
  } as unknown as Zone
}

function marke(akzent = '#FF4040'): Marke {
  return {
    id: 'a7e4c2f0-91b3-4d8e-b201-000000000001',
    name: 'Fitnessworld24',
    logo: null,
    schriften: {},
    farben: {
      akzent,
      akzentKraeftig: '#D03030',
      akzentTief: '#A02020',
      flaecheDunkel: '#2F2E2E',
      flaecheSehrDunkel: '#1A1919',
      flaecheHell: '#F5F5F5',
      flaecheAkzentZart: '#FFE8E8',
      textAufDunkel: '#FFFFFF',
      textAufHell: '#202020',
      textSekundaer: '#B0B0B0',
      linie: '#606060',
      scrimStart: '#000000',
      scrimEnde: '#00000000',
    },
    herkunftJeFeld: {} as Marke['herkunftJeFeld'],
  } as unknown as Marke
}

function aktion(mitAkzentfarbe: string | null): Aktion {
  return {
    id: 'b7e4c2f0-91b3-4d8e-b201-000000000002',
    titel: 'Test',
    vorlagenId: 'vollbild',
    markeId: 'a7e4c2f0-91b3-4d8e-b201-000000000001',
    akzentfarbe: mitAkzentfarbe,
    standardDauer: null,
    dauer: 10,
    elemente: [],
  } as unknown as Aktion
}

function letzteFontSetzung(setzungen: Setzung[]): string {
  return [...setzungen].reverse().find((s) => s.eigenschaft === 'font')?.wert ?? ''
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('zeichneErsatzLogo (#293)', () => {
  beforeEach(() => {
    vi.mocked(loeseFarbe).mockClear()
  })

  it('fuellt zone.rahmen EXAKT mit marke.farben.akzent und zeichnet den Namen einzeilig', () => {
    const { ctx, rechtecke, texte, setzungen } = neuerCtx()
    zeichneErsatzLogo(ctx, zone(), marke(), aktion(null))

    expect(rechtecke).toEqual([
      { x: RAHMEN.x, y: RAHMEN.y, breite: RAHMEN.breite, hoehe: RAHMEN.höhe, farbe: '#FF4040' },
    ])
    expect(texte).toHaveLength(1)
    expect(texte[0]?.text).toBe('Fitnessworld24')
    // Schrift laut DoD ueber den ctx.font-Wert geprueft: Archivo Black 900.
    expect(letzteFontSetzung(setzungen)).toContain('"Archivo Black"')
    expect(letzteFontSetzung(setzungen)).toContain('900')
  })

  it('waehlt bei heller Akzentflaeche (#FFFFFF) textAufHell und bei dunkler (#202020) textAufDunkel', () => {
    const hell = neuerCtx()
    zeichneErsatzLogo(hell.ctx, zone(), marke('#FFFFFF'), aktion(null))
    const fuellungHell = hell.rechtecke[0]?.farbe
    const textHell = [...hell.setzungen]
      .filter((s) => s.eigenschaft === 'fillStyle')
      .map((s) => s.wert)
    expect(fuellungHell).toBe('#FFFFFF')
    expect(textHell).toContain('#202020') // textAufHell gewinnt gegen Weiss

    const dunkel = neuerCtx()
    zeichneErsatzLogo(dunkel.ctx, zone(), marke('#202020'), aktion(null))
    const textDunkel = [...dunkel.setzungen]
      .filter((s) => s.eigenschaft === 'fillStyle')
      .map((s) => s.wert)
    expect(textDunkel).toContain('#FFFFFF') // textAufDunkel gewinnt gegen Dunkelgrau
  })

  it('fragt loeseFarbe AUSSCHLIESSLICH mit textAufDunkel/textAufHell an - nie mit akzent', () => {
    const { ctx } = neuerCtx()
    zeichneErsatzLogo(ctx, zone(), marke(), aktion('#00FF00'))
    const rollen = vi.mocked(loeseFarbe).mock.calls.map((aufruf) => aufruf[1])
    expect(rollen).toHaveLength(2)
    expect(rollen).toContain('textAufDunkel')
    expect(rollen).toContain('textAufHell')
    expect(rollen).not.toContain('akzent')
  })

  it('liest aktion.akzentfarbe NICHT: gesetzte Akzentfarbe veraendert nichts am Bild', () => {
    const ohne = neuerCtx()
    zeichneErsatzLogo(ohne.ctx, zone(), marke(), aktion(null))
    const mit = neuerCtx()
    zeichneErsatzLogo(mit.ctx, zone(), marke(), aktion('#00FF00'))

    expect(mit.rechtecke).toEqual(ohne.rechtecke)
    expect(mit.texte.map((t) => [t.text, t.font])).toEqual(
      ohne.texte.map((t) => [t.text, t.font]),
    )
    expect(mit.setzungen.filter((s) => s.eigenschaft === 'fillStyle')).toEqual(
      ohne.setzungen.filter((s) => s.eigenschaft === 'fillStyle'),
    )
  })

  it('verkleinert einen zu langen Namen, statt ihn abzuschneiden: kleineres font, voller Text', () => {
    const langerName = 'Fitnessworld24 Premium Sportclub GmbH'
    const m = marke()
    m.name = langerName
    // Koeffizient so gewaehlt: bei Startgroesse viel zu breit, bei Mindestgroesse
    // knapp passend (37 Zeichen * 0.9 * 10 px = 333 <= 388) -> einzeilig nahe Minimum.
    const { ctx, texte, setzungen } = neuerCtx((text, groesse) => text.length * 0.9 * groesse)
    zeichneErsatzLogo(ctx, zone(), m, aktion(null))

    expect(texte).toHaveLength(1)
    expect(texte[0]?.text).toBe(langerName) // voller Name, kein Abschneiden
    const groesseStart = RAHMEN.höhe - 2 * 12
    const groesseEnde = Number(/(\d+)px/.exec(letzteFontSetzung(setzungen))?.[1])
    expect(groesseEnde).toBeLessThan(groesseStart)
    expect(groesseEnde).toBeGreaterThanOrEqual(10) // nicht unter die Mindestgroesse gefallen
  })

  it('bricht zweizeilig um, wenn der Name auch bei der Mindestgroesse nicht passt - weiterhin kein Abschneiden', () => {
    const sehrLang = 'Ein Ausgesprochen Langer Markenname Ohne Chance Auf Eine Zeile'
    const m = marke()
    m.name = sehrLang
    // measureText so, dass selbst 10 px pro Zeichen 12 px Breite brauchen - nie passend.
    const { ctx, texte } = neuerCtx((text) => text.length * 12)
    zeichneErsatzLogo(ctx, zone(), m, aktion(null))

    expect(texte).toHaveLength(2)
    expect(texte[0]?.text + ' ' + texte[1]?.text).toBe(sehrLang) // nichts verloren
    for (const t of texte) {
      expect(t.font).toContain('10px') // Mindestgroesse
    }
  })

  it('die Zeichenkette "…" kommt in dieser Datei nicht vor (Grep-Probe als Test ausgedrueckt)', async () => {
    const quelle = await import('node:fs/promises')
    const inhalt = await quelle.readFile(
      new URL('../../src/renderer/template-canvas/ersatz-logo.ts', import.meta.url),
      'utf8',
    )
    expect(inhalt.includes('\u2026')).toBe(false)
  })

  it('wirft bei leerem Marken-Namen (Programmierfehler)', () => {
    const { ctx } = neuerCtx()
    const m = marke()
    m.name = '   '
    expect(() => zeichneErsatzLogo(ctx, zone(), m, aktion(null))).toThrow(/name/)
  })

  it('respektiert den Innenabstand: Startgroesse ist die verfuegbare Hoehe, Zentrierung im Rahmen', () => {
    const { ctx, texte } = neuerCtx(() => 100) // größenunabhängig: jeder Name passt sofort
    zeichneErsatzLogo(ctx, zone(), marke(), aktion(null))

    const groesseStart = RAHMEN.höhe - 2 * 12 // 96 px
    expect(texte[0]?.font).toBe(`900 ${groesseStart}px "Archivo Black"`)
    expect(texte[0]?.x).toBe(RAHMEN.x + RAHMEN.breite / 2)
    expect(texte[0]?.y).toBe(RAHMEN.y + RAHMEN.höhe / 2)
  })
})
