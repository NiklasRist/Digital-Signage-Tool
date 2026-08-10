// GENERIERT aus dem Signaturblock von Issue #83.
// [media-service] Metadaten auswerten: Maße, Rotation, Dauer
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ImportFehlercode } from './fehlercodes'

export function werteMetadatenAus(
  roh: unknown,
  typ: 'video' | 'bild',
): Ergebnis<{ maße: { breite: number; höhe: number }; dauer: number | null }, 'probe_fehler'> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #83."
  );
}
