// GENERIERT aus dem Signaturblock von Issue #219.
// [preview-player] Einblendungs-Simulation – Video vollflächig, Werbeband mit Alpha darüber
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

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
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #219."
  );
}
