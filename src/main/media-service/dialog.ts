// GENERIERT aus dem Signaturblock von Issue #81.
// [media-service] öffneMedienDialog implementieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import { dialog } from 'electron'
import { FORMAT_WHITELIST } from '../../shared/contracts/asset'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

export async function öffneMedienDialog(): Promise<Ergebnis<{ pfade: string[] }>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #81."
  );
}
