/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #258.
// [contracts] Die media-Adresse an genau einer Stelle bilden
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

/** Das Schema des Renderer-Lesezugriffs (TK 9.5.7). Steht hier EINMAL und nirgends sonst. */
export const MEDIEN_SCHEMA = 'media'

/**
 * Baut die Lese-URL einer Projektdatei: `media://<projektId>/<dateiname>` (TK 9.5.7).
 *
 * BEIDE Bestandteile werden mit `encodeURIComponent` geschrieben (s. ENTSCHIEDEN 1).
 * REIN und TOTAL: wirft nie, prueft nichts, kennt keine Fehlercodes, beruehrt kein Dateisystem
 * und loest KEINEN Pfad auf.
 */
export function medienUrl(projektId: string, dateiname: string): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #258."
  );
}
