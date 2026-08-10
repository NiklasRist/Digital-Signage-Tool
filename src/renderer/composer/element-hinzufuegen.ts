// GENERIERT aus dem Signaturblock von Issue #123.
// [composer] Ein Element zur Wiedergabeliste hinzufügen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Listenelement } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/** Stellt den Eintrag mit dieser Referenz ans Ende der Liste. `referenz` ist ENTWEDER eine
 *  Asset-ID (Video/Bild) ODER eine Aktions-ID (Segment) – welche es ist, entscheidet der Main. */
export async function fuegeElementHinzu(referenz: string): Promise<Ergebnis<Listenelement>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #123."
  );
}
