// GENERIERT aus dem Signaturblock von Issue #176.
// [render-service] Bandgeometrie aus Art und Höhe der Einblendung bestimmen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { RenderFehlercode } from './fehlercodes'
import { berechneBandGeometrie, type BandGeometrie } from '../../shared/band-geometrie'

/** Die beiden Kompositionsarten aus TK 9.2.8. Ein Band ist nie `vollflaeche`. */
export type Bandart = 'split' | 'einblendung'

/**
 * Prueft die mitgereiste Einblendung und liefert die Geometrie der GETEILTEN Rechenfunktion
 * unveraendert weiter. Einzige Autoritaet fuer die Regel „welche Bandhoehe ist zulaessig" –
 * die Regel „wo liegt was" gehoert seit TK v3.1 in den geteilten Bereich.
 *
 * Diese Datei rechnet NICHTS: kein Math.floor, keine 16/9, keine Vierer-Rundung, keine Versaetze.
 * Sie ruft berechneBandGeometrie(einblendung.höhe) und reicht das Ergebnis DURCH.
 */
export function bestimmeBandgeometrie(
  einblendung: { art: Bandart; höhe: number },
): Ergebnis<BandGeometrie, RenderFehlercode> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #176."
  );
}
