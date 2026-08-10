/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #216.
// [preview-player] Ein Video-Element darstellen – nativ, von trimStart bis trimEnde, ohne Ton
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

import { frameZuSekunden } from './zeitachse'

/**
 * Ab welcher Abweichung die Wiedergabeposition neu gesetzt wird. 0,25 s ≈ 7,5 Frames bei 30 fps.
 * Begruendung s. ENTSCHIEDEN 2 – NICHT aendern, ohne zu fragen.
 */
export const SPRUNG_TOLERANZ_SEKUNDEN = 0.25

/** Die Position in der QUELLDATEI: trimStart + die lokale Position des Elements. */
export function quellZeit(trimStart: number, lokalerFrame: number): number {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #216."
  );
}

/**
 * true, wenn die Wiedergabeposition neu gesetzt werden muss: wenn `istZeit` unbrauchbar ist
 * (NaN/Infinity) oder mehr als SPRUNG_TOLERANZ_SEKUNDEN von `sollZeit` abweicht.
 * Total: wirft nie.
 */
export function brauchtSprung(istZeit: number, sollZeit: number): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #216."
  );
}
