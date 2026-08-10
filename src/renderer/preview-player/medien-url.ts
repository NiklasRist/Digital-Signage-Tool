// GENERIERT aus dem Signaturblock von Issue #215.
// [preview-player] Ein Bild-Element darstellen – contain auf Schwarz, Quelle über media://
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

/**
 * Baut die Lese-URL einer Projektdatei: `media://<projektId>/<dateiname>`.
 * Beide Bestandteile werden mit encodeURIComponent geschrieben (s. ENTSCHIEDEN 2).
 * Total: wirft nie, prueft nichts, kennt keine Fehlercodes.
 */
export function medienUrl(projektId: string, dateiname: string): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #215."
  );
}
