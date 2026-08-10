// GENERIERT aus dem Signaturblock von Issue #44.
// [project-store] setzeTrim implementieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Listenelement } from '../../shared/contracts/project'
export async function setzeTrim(
  elementId: string,
  trimStart: number,   // Sekunden, ROH – keine Frame-Rundung hier, s. Invarianten
  trimEnde: number,    // Sekunden, ROH
): Promise<Ergebnis<Listenelement>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #44."
  );
}
