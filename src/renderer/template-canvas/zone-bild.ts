// GENERIERT aus dem Signaturblock von Issue #115.
// [template-canvas] Eine Bildzone zeichnen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Zone } from '../../shared/contracts/vorlage'
import type { Marke } from '../../shared/contracts/marke'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Motiv } from './bild-laden'

export function zeichneBildZone(
  ctx: CanvasRenderingContext2D,
  zone: Zone,
  motiv: Motiv,
  marke: Marke,
  aktion: Aktion,
): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #115."
  );
}
