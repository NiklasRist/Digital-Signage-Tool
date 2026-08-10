// GENERIERT aus dem Signaturblock von Issue #64.
// [auftrags-manager] holeStand implementieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Auftrag } from '../../shared/contracts/auftrag'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

export async function holeStand(): Promise<Ergebnis<Auftrag[]>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #64."
  );
}
