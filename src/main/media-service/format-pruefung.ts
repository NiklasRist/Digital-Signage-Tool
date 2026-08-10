// GENERIERT aus dem Signaturblock von Issue #80.
// [media-service] Format gegen die Whitelist prüfen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import { FORMAT_WHITELIST } from '../../shared/contracts/asset'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ImportFehlercode } from './fehlercodes'

export function pruefeFormat(
  dateiname: string,
): Ergebnis<{ typ: 'video' | 'bild'; endung: string }, 'format_nicht_unterstuetzt'> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #80."
  );
}
