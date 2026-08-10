// GENERIERT aus dem Signaturblock von Issue #39.
// [project-store] bearbeiteAktion implementieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Aktion } from '../../shared/contracts/aktion'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
export async function bearbeiteAktion(
  id: string,
  aktionsdaten: Partial<Omit<Aktion, 'id'>>,
): Promise<Ergebnis<Aktion>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #39."
  );
}
