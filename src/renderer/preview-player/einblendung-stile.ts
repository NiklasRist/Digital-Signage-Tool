// Issue #219 - einblendung-stile.ts: die reine Uebernahme der Bandposition.
//
// Bei der Einblendung (Art B, TK 9.2.8) ist das Video VOLLFLAECHIG - es gibt
// nichts einzupassen. Der einzige bedeutungstragende Wert der geteilten
// Rechnung (#239) ist hier bandY; die uebrigen sechs Felder beschreiben die
// split-Aufteilung und werden hier NICHT gelesen (ENTSCHIEDEN 1).
//
// Die Bandhoehe wird aus bandY ZURUECKGEWONNEN (RENDER_PROFILE.hoehe − bandY,
// ENTSCHIEDEN 2), nie aus dem Eingabeparameter - sonst gaebe es zwei unabhaen-
// gige Quellen fuer dieselbe Groesse.
//
// Keine Pruefung, kein Fehlercode, keine Ergebnis-Huelle: „der preview-player
// prueft nichts und meldet keine Fehlercodes" (TK 9.9.2).

import { berechneBandGeometrie } from '../../shared/band-geometrie'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

/** Die Lage des ueberlagernden Bandes im 1920×1080-Raster der Buehne (#212). */
export interface EinblendungStile {
  /** Obere Kante des Bandes – UNVERAENDERT `bandY` aus der geteilten Rechnung. */
  bandY: number
  /** Hoehe des Bandes: RENDER_PROFILE.hoehe − bandY. */
  bandHöhe: number
  /** Breite des Bandes: RENDER_PROFILE.breite. */
  bandBreite: number
}

/**
 * Ruft berechneBandGeometrie(höhe) auf und liest daraus AUSSCHLIESSLICH `bandY`.
 * Die uebrigen sechs Felder gelten nur fuer die split-Komposition und werden hier NICHT gelesen.
 * RECHNET NICHTS SELBST ausser der einen Subtraktion fuer `bandHöhe`.
 * Total: wirft nie, traegt KEINE Ergebnis-Huelle und KEINEN Fehlercode.
 */
export function baueEinblendungStile(höhe: number): EinblendungStile {
  const geometrie = berechneBandGeometrie(höhe)
  return {
    bandY: geometrie.bandY,
    bandHöhe: RENDER_PROFILE.hoehe - geometrie.bandY,
    bandBreite: RENDER_PROFILE.breite,
  }
}
