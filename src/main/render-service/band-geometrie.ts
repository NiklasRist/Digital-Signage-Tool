/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #176.
// [render-service] Bandgeometrie aus Art und Höhe der Einblendung bestimmen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

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
