// GENERIERT aus dem Signaturblock von Issue #87.
// [media-service] löscheMedium zusammensetzen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Auftrag } from '../../shared/contracts/auftrag';
import type { AusfuehrungsKontext, HandlerErgebnis } from '../auftrags-manager/dispatcher';
import type { LoeschFehlercode } from './fehlercodes';

export async function löscheMedium(
  auftrag: Extract<Auftrag, { art: 'loeschen' }>,
  kontext: AusfuehrungsKontext,
): Promise<HandlerErgebnis<LoeschFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #87."
  );
}
