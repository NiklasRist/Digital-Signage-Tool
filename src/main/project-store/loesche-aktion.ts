// GENERIERT aus dem Signaturblock von Issue #40.
// [project-store] löscheAktion mit chirurgischer Kaskade implementieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Bearbeitungsstand } from '../../shared/contracts/project'

export async function löscheAktion(id: string): Promise<Ergebnis<{
  stand: Bearbeitungsstand
  entfernteElementIds: string[]
  geaenderteElementIds: string[]
}>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #40."
  );
}
