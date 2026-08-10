// GENERIERT aus dem Signaturblock von Issue #86.
// [media-service] Datei entfernen mit Retry und Backoff
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis';

export async function entferneDatei(pfad: string): Promise<Ergebnis<void, 'datei_fehler'>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #86."
  );
}
