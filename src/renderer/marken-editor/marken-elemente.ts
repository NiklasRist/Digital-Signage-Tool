// #449 - die ELEMENTE des Marken-Editors: aus den Zonen der Vorschau-Vorlage abgeleitet.
//
// WARUM AUS DEN ZONEN UND NICHT AUS EINER EIGENEN LISTE: Die Vorlage „Vollbild" (TK 9.11.1)
// beschreibt bereits, welche Flaeche welche Marken-Rolle benutzt (`text.schriftRolle`,
// `text.farbRolle`, `deko.fuellungFarbRolle`, `deko.verlauf`, `bindung: 'logo'`). Eine
// zweite Liste im Editor waere eine zweite Wahrheit und liefe beim naechsten Vorlagen-
// Umbau auseinander. Hier wird nur GELESEN.
//
// REIN: kein JSX, kein IPC, kein DOM. Die Anzeige rechnet die Rahmen in Prozent um.

import type { FarbRolle, SchriftRolle } from '../../shared/contracts/marke'
import type { Vorlage, Zone } from '../../shared/contracts/vorlage'

/** Ein Element im Editor - genau eine Zone, die Marken-Werte traegt. */
export interface MarkenElement {
  /** Zonen-Kennung der Vorlage (stabil ueber projektweite Aufrufe). */
  id: string
  /** Deutsche Beschriftung fuer die Box. */
  titel: string
  art: 'logo' | 'text' | 'verlauf' | 'farbe'
  /** Rahmen in Vorlagen-Pixeln (TK 9.11.1: absolute Pixel, nie Prozent). */
  rahmen: { x: number; y: number; breite: number; höhe: number }
  /** Farb-Rollen, die dieses Element benutzt - in Anzeige-Reihenfolge. */
  farbRollen: FarbRolle[]
  /** Schrift-Rollen, die dieses Element benutzt. */
  schriftRollen: SchriftRolle[]
  /** Flaeche in Quadratpixeln - die Treffer-Reihenfolge (kleinste zuerst). */
  flaeche: number
}

/** Deutsche Titel der bekannten Zonen; unbekannte Zonen tragen ihre Kennung. */
const TITEL: Record<string, string> = {
  logo: 'Logo',
  ueberschrift: 'Überschrift',
  beschreibung: 'Beschreibung',
  preis: 'Preis',
  cta: 'Button',
  scrim: 'Verlauf',
  hintergrund: 'Hintergrund',
  motiv: 'Motiv',
}

function flaeche(zone: Zone): number {
  return Math.max(0, zone.rahmen.breite) * Math.max(0, zone.rahmen.höhe)
}

/**
 * Die Elemente EINER Vorlage. Nicht aufgenommen werden Zonen ohne Marken-Werte
 * (`motiv`: das Bild kommt aus der Aktion, nicht aus der Marke).
 */
export function baueMarkenElemente(vorlage: Vorlage): MarkenElement[] {
  const elemente: MarkenElement[] = []
  for (const zone of vorlage.zonen) {
    const farbRollen: FarbRolle[] = []
    const schriftRollen: SchriftRolle[] = []
    let art: MarkenElement['art'] | null = null

    if (zone.bindung === 'logo') {
      art = 'logo'
    }
    if (zone.text !== undefined) {
      art = 'text'
      schriftRollen.push(zone.text.schriftRolle)
      farbRollen.push(zone.text.farbRolle)
    }
    if (zone.deko?.verlauf !== undefined) {
      art = 'verlauf'
      farbRollen.push(zone.deko.verlauf.vonFarbRolle, zone.deko.verlauf.bisFarbRolle)
    } else if (zone.deko?.füllungFarbRolle !== undefined) {
      // Die Fuellfarbe steht NACH der Textfarbe: bei `preis` ist der Text die Hauptsache,
      // die Pille die Flaeche darunter.
      if (!farbRollen.includes(zone.deko.füllungFarbRolle)) farbRollen.push(zone.deko.füllungFarbRolle)
      if (art === null) art = 'farbe'
    }
    if (zone.bindung === 'bild') {
      // Das Motiv traegt keine Marken-Werte (TK: Bild kommt aus der Aktion).
      continue
    }
    if (art === null) continue

    elemente.push({
      id: zone.id,
      titel: TITEL[zone.id] ?? zone.id,
      art,
      rahmen: { ...zone.rahmen },
      farbRollen,
      schriftRollen,
      flaeche: flaeche(zone),
    })
  }
  return elemente
}

/**
 * Das getroffene Element an einem Punkt der Vorlagenflaeche (`x`/`y` in 0..1).
 * KLEINSTE Flaeche zuerst: sonst faengt der Vollflaechen-Hintergrund jeden Klick ab.
 * `null`, wenn kein Element den Punkt enthaelt.
 */
export function elementBeiPunkt(
  elemente: readonly MarkenElement[],
  xAnteil: number,
  yAnteil: number,
  breite: number,
  hoehe: number,
): MarkenElement | null {
  if (!Number.isFinite(xAnteil) || !Number.isFinite(yAnteil)) return null
  if (!(breite > 0) || !(hoehe > 0)) return null
  const x = xAnteil * breite
  const y = yAnteil * hoehe
  const passend = elemente.filter(
    (element) =>
      x >= element.rahmen.x &&
      x <= element.rahmen.x + element.rahmen.breite &&
      y >= element.rahmen.y &&
      y <= element.rahmen.y + element.rahmen.höhe,
  )
  if (passend.length === 0) return null
  return [...passend].sort((a, b) => a.flaeche - b.flaeche)[0] ?? null
}

/**
 * Farb-Rollen, die KEIN Element der Vorschau zeigt. Sie waeren ohne eigene Flaeche im
 * Editor unerreichbar (die feste Vorlage „Vollbild" benutzt 7 von 13) - deshalb steht
 * die Palette unter der Vorschau.
 */
export function nichtGezeigteFarbRollen(
  alle: readonly FarbRolle[],
  elemente: readonly MarkenElement[],
): FarbRolle[] {
  const gezeigt = new Set(elemente.flatMap((element) => element.farbRollen))
  return alle.filter((rolle) => !gezeigt.has(rolle))
}

/** Schrift-Rollen, die kein Element der Vorschau zeigt (dieselbe Begruendung). */
export function nichtGezeigteSchriftRollen(
  alle: readonly SchriftRolle[],
  elemente: readonly MarkenElement[],
): SchriftRolle[] {
  const gezeigt = new Set(elemente.flatMap((element) => element.schriftRollen))
  return alle.filter((rolle) => !gezeigt.has(rolle))
}
