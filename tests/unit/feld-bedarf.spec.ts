// Welche Formularfelder eine Vorlage benutzt (03.11.2026)
//
// Die Faelle kommen aus den ECHTEN eingebauten Vorlagen: „Band-Standard" hat bewusst
// keine `beschreibung`-Zone (TK 9.11.1) - genau dort tippte man bisher ins Leere.
import { describe, expect, it } from 'vitest'

import type { Vorlage, Zone } from '../../src/shared/contracts/vorlage'
import { feldBedarf } from '../../src/renderer/action-editor/feld-bedarf'
import { eingebauteVorlagen } from '../../src/main/vorlagen-store/eingebaute-vorlagen'

function vorlage(id: string): Vorlage {
  const treffer = eingebauteVorlagen().find((eintrag) => eintrag.id === id)
  if (treffer === undefined) throw new Error(`eingebaute Vorlage ${id} fehlt`)
  return treffer
}

const HINTERGRUND: Zone = {
  id: 'hintergrund',
  rolle: 'fest',
  bindung: null,
  rahmen: { x: 0, y: 0, breite: 1920, höhe: 1080 },
  ausrichtung: { horizontal: 'links', vertikal: 'oben' },
  wennLeer: 'leer',
  deko: { füllungFarbRolle: 'flaecheDunkel' },
}

const TITEL: Zone = {
  id: 'ueberschrift',
  rolle: 'frei',
  bindung: 'titel',
  rahmen: { x: 96, y: 640, breite: 1150, höhe: 190 },
  ausrichtung: { horizontal: 'links', vertikal: 'unten' },
  wennLeer: 'leer',
  text: {
    schriftRolle: 'headlinePlakativ',
    farbRolle: 'textAufDunkel',
    größeMax: 96,
    größeMin: 56,
    maxZeilen: 2,
  },
}

describe('feldBedarf', () => {
  it('„Ganzflächig" benutzt alles', () => {
    expect(feldBedarf(vorlage('vollbild'))).toEqual({
      titel: true,
      beschreibung: true,
      preis: true,
      cta: true,
      bild: true,
      akzent: true,
    })
  })

  it('„Zwei Spalten" benutzt alles', () => {
    expect(feldBedarf(vorlage('split'))).toEqual({
      titel: true,
      beschreibung: true,
      preis: true,
      cta: true,
      bild: true,
      akzent: true,
    })
  })

  it('„Band-Standard" hat KEINE Beschreibung und KEIN Bild (TK 9.11.1)', () => {
    const bedarf = feldBedarf(vorlage('band-standard'))
    expect(bedarf.beschreibung).toBe(false)
    expect(bedarf.bild).toBe(false)
    // Der Rest bleibt: Titel, Preis, CTA und die Akzent-Pille des Preises.
    expect(bedarf.titel).toBe(true)
    expect(bedarf.preis).toBe(true)
    expect(bedarf.cta).toBe(true)
    expect(bedarf.akzent).toBe(true)
  })

  it('eine Vorlage ohne Akzent-Rolle braucht keinen Farbwaehler', () => {
    const ohneAkzent: Vorlage = {
      id: 'eigen',
      name: 'Eigen',
      höhe: null,
      parent: null,
      eingebaut: false,
      zonen: [HINTERGRUND, TITEL],
    }
    expect(feldBedarf(ohneAkzent).akzent).toBe(false)
  })

  it('der Titel bleibt IMMER - er ist Pflicht (TK 9.8.4)', () => {
    const ohneTitel: Vorlage = {
      id: 'eigen',
      name: 'Eigen',
      höhe: null,
      parent: null,
      eingebaut: false,
      zonen: [HINTERGRUND],
    }
    expect(feldBedarf(ohneTitel).titel).toBe(true)
    // Alles andere ist ohne Zone weg.
    expect(feldBedarf(ohneTitel).beschreibung).toBe(false)
    expect(feldBedarf(ohneTitel).preis).toBe(false)
    expect(feldBedarf(ohneTitel).cta).toBe(false)
    expect(feldBedarf(ohneTitel).bild).toBe(false)
    expect(feldBedarf(ohneTitel).akzent).toBe(false)
  })

  it('unbekannte Vorlage: NICHTS ausblenden', () => {
    expect(feldBedarf(null)).toEqual({
      titel: true,
      beschreibung: true,
      preis: true,
      cta: true,
      bild: true,
      akzent: true,
    })
  })
})
