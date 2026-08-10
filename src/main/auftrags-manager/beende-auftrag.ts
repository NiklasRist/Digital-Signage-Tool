// GENERIERT aus dem Signaturblock von Issue #70.
// [auftrags-manager] Auftrag abschließen und die Schlange weiterdrehen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { HandlerErgebnis } from './dispatcher';

export async function beendeAuftrag(auftragId: string, ergebnis: HandlerErgebnis): Promise<void> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #70."
  );
}
