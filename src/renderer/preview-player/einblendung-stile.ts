// Issue #219 - einblendung-stile.ts: die reine Uebernahme der Bandposition.
//
// Seit TK v3.31 gibt es genau EINE Komposition: Das Band liegt DECKEND ueber dem
// vollflaechigen Video. Das Video wird nicht mehr eingepasst; die einzige Zahl, die
// diese Datei braucht, ist die obere Bandkante y = 1080 − H (TK 9.2.8).
//
// DIE SUBTRAKTION STEHT HIER UND NICHT IN EINER GETEILTEN FUNKTION: Mit dem
// gestrichenen Split-Screen ist `berechneBandGeometrie` entfallen (#450) - „eine
// Subtraktion ist keine Fachlichkeit". `baueEinblendungFilter` im Main bildet
// denselben Wert aus demselben Profil.
//
// Keine Pruefung, kein Fehlercode, keine Ergebnis-Huelle: „der preview-player
// prueft nichts und meldet keine Fehlercodes" (TK 9.9.2).

import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

/** Die Lage des ueberlagernden Bandes im 1920×1080-Raster der Buehne (#212). */
export interface EinblendungStile {
  /** Obere Kante des Bandes: 1080 − H (TK 9.2.8). */
  bandY: number
  /** Hoehe des Bandes: RENDER_PROFILE.hoehe − bandY. */
  bandHöhe: number
  /** Breite des Bandes: RENDER_PROFILE.breite. */
  bandBreite: number
}

/**
 * Die Bandkante aus Profil und Hoehe: y = 1080 − H (TK 9.2.8).
 * Total: wirft nie, traegt KEINE Ergebnis-Huelle und KEINEN Fehlercode - der
 * preview-player prueft nichts (TK 9.9.2).
 */
export function baueEinblendungStile(höhe: number): EinblendungStile {
  return {
    bandY: RENDER_PROFILE.hoehe - höhe,
    bandHöhe: höhe,
    bandBreite: RENDER_PROFILE.breite,
  }
}
