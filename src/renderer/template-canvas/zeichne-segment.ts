// GENERIERT aus dem Signaturblock von Issue #117.
// [template-canvas] Die Zeichenroutine: aus Aktion, Vorlage und Marke ein Segmentbild
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Aktion } from '../../shared/contracts/aktion'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { Marke } from '../../shared/contracts/marke'

export interface SegmentBild {
  canvas: HTMLCanvasElement
  breite: number
  höhe: number
}

export function zeichneSegment(aktion: Aktion, vorlage: Vorlage, marke: Marke): SegmentBild {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #117."
  );
}
