// GENERIERT aus dem Signaturblock von Issue #181.
// [render-service] renderReel zusammensetzen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { RenderRequest } from '../../shared/contracts/render-request'
import type { RenderResult, RenderProgress } from '../../shared/contracts/render-result'

export async function renderReel(
  request: RenderRequest,
  aufFortschritt: (fortschritt: RenderProgress) => void,
): Promise<RenderResult> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #181."
  );
}
