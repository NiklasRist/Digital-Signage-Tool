// GENERIERT aus dem Signaturblock von Issue #128.
// [composer] Thumbnails im Renderer erzeugen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Project, Listenelement } from '../../shared/contracts/project'
import type { Marke } from '../../shared/contracts/marke'
import type { Vorlage } from '../../shared/contracts/vorlage'

export type Thumbnail =
  | { quelle: 'canvas'; canvas: HTMLCanvasElement; breite: number; höhe: number }
  | { quelle: 'url'; url: string }     // media://<projektId>/<dateiname>, direkt als <img src>
  | { quelle: 'fehlt' }                // Referenz zeigt ins Leere oder Frame nicht gewinnbar

export async function erzeugeThumbnail(
  element: Listenelement,
  projekt: Project,
  marke: Marke,
  vorlagen: readonly Vorlage[],
): Promise<Thumbnail> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #128."
  );
}
