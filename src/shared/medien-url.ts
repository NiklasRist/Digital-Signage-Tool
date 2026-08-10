// GENERIERT aus dem Signaturblock von Issue #258.
// [contracts] Die media-Adresse an genau einer Stelle bilden
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

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
