// GENERIERT aus dem Signaturblock von Issue #239.
// [contracts] Bandgeometrie in den geteilten Bereich ziehen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import { RENDER_PROFILE } from './contracts/render-profile'

export interface BandGeometrie {
  /** Breite des Video-Bereichs – immer die Profilbreite (1920). */
  videoBereichBreite: number
  /** Hoehe des Video-Bereichs: 1080 − H. */
  videoBereichHöhe: number
  /**
   * Breite des tatsaechlich eingepassten Videos (16:9-Quelle):
   * `videoBereichHöhe × 16 / 9`, ABGERUNDET auf das naechstkleinere Vielfache von 4 (TK 9.2.8).
   */
  videoBreite: number
  /** Hoehe des eingepassten Videos – hoehenbegrenzt, also gleich `videoBereichHöhe`. */
  videoHöhe: number
  /** Linker Rand des eingepassten Videos: `(videoBereichBreite − videoBreite) / 2`. */
  videoVersatzX: number
  /** Oberer Rand des eingepassten Videos im Video-Bereich – immer 0 (hoehenbegrenzt). */
  videoVersatzY: number
  /** Obere Kante des Bandes im 1920×1080-Bild: 1080 − H. */
  bandY: number
}

/**
 * Die REINE Rechnung. Total: wirft nie, liefert immer eine vollstaendig belegte Geometrie,
 * traegt KEINE Ergebnis-Huelle und KEINEN Fehlercode.
 *
 * VORBEDINGUNG (wird hier NICHT geprueft – s. „Was hier NICHT passiert"):
 *   `höhe` ist ganzzahlig, gerade, > 0 und < RENDER_PROFILE.hoehe.
 * Die Pruefung dieser Vorbedingung und die Vergabe des Fehlercodes `ungueltiges_element`
 * bleiben im render-service (TK 9.2.8).
 */
export function berechneBandGeometrie(höhe: number): BandGeometrie {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #239."
  );
}
