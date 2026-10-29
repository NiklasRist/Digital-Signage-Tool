// Tests zu #449 - marken-elemente.ts (Zonen der Vorschau-Vorlage -> anklickbare Elemente).
//
// Die Zusage: Der Editor erfindet seine Elemente NICHT, er liest sie aus der Vorlage;
// die Treffer-Reihenfolge ist "kleinste Flaeche zuerst"; und was die Vorschau nicht
// zeigt, wird als Rest gemeldet (die Palette unter der Vorschau).
import { describe, expect, it } from 'vitest'

import type { Vorlage } from '../../src/shared/contracts/vorlage'
import type { FarbRolle, SchriftRolle } from '../../src/shared/contracts/marke'
import {
  baueMarkenElemente,
  elementBeiPunkt,
  nichtGezeigteFarbRollen,
  nichtGezeigteSchriftRollen,
} from '../../src/renderer/marken-editor/marken-elemente'

/** Ausschnitt der eingebauten Vorlage „Vollbild" (TK 9.11.1) - nur die tragenden Zonen. */
function vollbild(): Vorlage {
  return {
    id: 'vollbild',
    name: 'Vollbild',
    art: 'vollflaeche',
    höhe: null,
    parent: null,
    eingebaut: true,
    zonen: [
      {
        id: 'hintergrund', rolle: 'fest', bindung: null,
        rahmen: { x: 0, y: 0, breite: 1920, höhe: 1080 },
        ausrichtung: { horizontal: 'links', vertikal: 'oben' }, wennLeer: 'leer',
        deko: { füllungFarbRolle: 'flaecheDunkel' },
      },
      {
        id: 'motiv', rolle: 'frei', bindung: 'bild',
        rahmen: { x: 0, y: 0, breite: 1920, höhe: 1080 },
        ausrichtung: { horizontal: 'mitte', vertikal: 'mitte' }, wennLeer: 'leer',
        bild: { einpassung: 'cover' },
      },
      {
        id: 'scrim', rolle: 'fest', bindung: null,
        rahmen: { x: 0, y: 432, breite: 1920, höhe: 648 },
        ausrichtung: { horizontal: 'links', vertikal: 'oben' }, wennLeer: 'leer',
        deko: { verlauf: { vonFarbRolle: 'scrimStart', bisFarbRolle: 'scrimEnde', richtung: 'unten' } },
      },
      {
        id: 'logo', rolle: 'fest', bindung: 'logo',
        rahmen: { x: 96, y: 54, breite: 420, höhe: 120 },
        ausrichtung: { horizontal: 'links', vertikal: 'mitte' }, wennLeer: 'leer',
        bild: { einpassung: 'contain' },
      },
      {
        id: 'ueberschrift', rolle: 'frei', bindung: 'titel',
        rahmen: { x: 96, y: 640, breite: 1150, höhe: 190 },
        ausrichtung: { horizontal: 'links', vertikal: 'unten' }, wennLeer: 'leer',
        text: { schriftRolle: 'headlinePlakativ', farbRolle: 'textAufDunkel', größeMax: 96, größeMin: 56, maxZeilen: 2 },
      },
      {
        id: 'preis', rolle: 'frei', bindung: 'preis',
        rahmen: { x: 1300, y: 660, breite: 524, höhe: 150 },
        ausrichtung: { horizontal: 'mitte', vertikal: 'mitte' }, wennLeer: 'ausblenden',
        text: { schriftRolle: 'headlinePlakativ', farbRolle: 'textAufDunkel', größeMax: 84, größeMin: 48, maxZeilen: 1 },
        deko: { füllungFarbRolle: 'akzent', radius: 40 },
      },
    ],
  }
}

describe('baueMarkenElemente (#449)', () => {
  it('liest die Elemente aus den Zonen - mit deutschen Titeln', () => {
    const elemente = baueMarkenElemente(vollbild())
    expect(elemente.map((e) => e.titel)).toEqual(['Hintergrund', 'Verlauf', 'Logo', 'Überschrift', 'Preis'])
    expect(elemente.map((e) => e.art)).toEqual(['farbe', 'verlauf', 'logo', 'text', 'text'])
  })

  it('das Motiv ist KEIN Element (das Bild kommt aus der Aktion)', () => {
    expect(baueMarkenElemente(vollbild()).some((e) => e.id === 'motiv')).toBe(false)
  })

  it('sammelt die Rollen je Element - beim Preis Textfarbe VOR der Fuellfarbe', () => {
    const preis = baueMarkenElemente(vollbild()).find((e) => e.id === 'preis')
    expect(preis?.farbRollen).toEqual(['textAufDunkel', 'akzent'])
    expect(preis?.schriftRollen).toEqual(['headlinePlakativ'])
  })

  it('der Verlauf traegt beide Rollen in Zeichenreihenfolge', () => {
    const scrim = baueMarkenElemente(vollbild()).find((e) => e.id === 'scrim')
    expect(scrim?.farbRollen).toEqual(['scrimStart', 'scrimEnde'])
  })

  it('die Flaeche ist Breite x Hoehe (Treffer-Reihenfolge)', () => {
    const elemente = baueMarkenElemente(vollbild())
    const logo = elemente.find((e) => e.id === 'logo')
    expect(logo?.flaeche).toBe(420 * 120)
  })
})

describe('elementBeiPunkt (#449)', () => {
  const elemente = baueMarkenElemente(vollbild())

  it('KLEINSTE Flaeche gewinnt: im Logo liegt Logo ueber Hintergrund und Motiv', () => {
    // Mitte des Logos (96..516, 54..174) in Anteilen.
    const treffer = elementBeiPunkt(elemente, (96 + 210) / 1920, (54 + 60) / 1080, 1920, 1080)
    expect(treffer?.id).toBe('logo')
  })

  it('im Scrim-Bereich ohne Text gewinnt der Verlauf gegen den Hintergrund', () => {
    const treffer = elementBeiPunkt(elemente, 0.5, 0.55, 1920, 1080)
    expect(treffer?.id).toBe('scrim')
  })

  it('oben ohne Zone gewinnt der Hintergrund (der Scrim beginnt erst bei y=432)', () => {
    const treffer = elementBeiPunkt(elemente, 0.5, 0.1, 1920, 1080)
    expect(treffer?.id).toBe('hintergrund')
  })

  it('ausserhalb und bei unsinnigen Eingaben: null', () => {
    expect(elementBeiPunkt(elemente, Number.NaN, 0.5, 1920, 1080)).toBeNull()
    expect(elementBeiPunkt(elemente, 0.5, 0.5, 0, 1080)).toBeNull()
  })
})

describe('nichtGezeigteRollen (#449)', () => {
  it('meldet die Rollen, die die Vorschau nicht zeigt - die Palette fuellt sie', () => {
    const elemente = baueMarkenElemente(vollbild())
    const alleFarben: FarbRolle[] = ['akzent', 'akzentKraeftig', 'flaecheDunkel', 'scrimStart', 'scrimEnde', 'linie']
    expect(nichtGezeigteFarbRollen(alleFarben, elemente)).toEqual(['akzentKraeftig', 'linie'])
    const alleSchriften: SchriftRolle[] = ['headlinePlakativ', 'fliesstext']
    expect(nichtGezeigteSchriftRollen(alleSchriften, elemente)).toEqual(['fliesstext'])
  })
})
