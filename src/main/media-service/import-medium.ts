// GENERIERT aus dem Signaturblock von Issue #85.
// [media-service] importMedium zusammensetzen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Auftrag } from '../../shared/contracts/auftrag';
import type { AusfuehrungsKontext, HandlerErgebnis } from '../auftrags-manager/dispatcher';
import type { ImportFehlercode } from './fehlercodes';

export async function importMedium(
  auftrag: Extract<Auftrag, { art: 'import' }>,
  kontext: AusfuehrungsKontext,
): Promise<HandlerErgebnis<ImportFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #85."
  );
}
