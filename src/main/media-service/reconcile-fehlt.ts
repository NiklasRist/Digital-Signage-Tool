// GENERIERT aus dem Signaturblock von Issue #89.
// [media-service] Aufräumen: fehlende Dateien als fehlt markieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Asset } from '../../shared/contracts/asset'
import type { ReconcileFehlercode } from './fehlercodes'

export async function markiereFehlende(
  projektId: string,
  assets: Asset[],
): Promise<Ergebnis<{ markiert: number }, ReconcileFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #89."
  );
}
