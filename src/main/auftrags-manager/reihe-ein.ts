// GENERIERT aus dem Signaturblock von Issue #61.
// [auftrags-manager] reiheEin implementieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Auftrag, AuftragArt } from '../../shared/contracts/auftrag'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

// Bindet die Nutzlast typsicher an die Auftragsart (Auftrag ist eine diskriminierte Union über
// `art`, #16): NutzlastVon<'render'> ist RenderRequest, NutzlastVon<'import'> ist ImportRequest usw.
export type NutzlastVon<A extends AuftragArt> = Extract<Auftrag, { art: A }>['payload']

export async function reiheEin<A extends AuftragArt>(
  art: A,
  payload: NutzlastVon<A>,
): Promise<Ergebnis<{ auftragId: string }>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #61."
  );
}
