/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #179.
// [render-service] Abbruch entgegennehmen
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

export interface LaufRegistrierung {
  /** true, sobald cancelRender fuer GENAU DIESEN Lauf gerufen wurde. */
  istAbgebrochen(): boolean
  /**
   * DASSELBE Abbruch-Kennzeichen in der Form, die der ffmpeg-adapter versteht
   * (FfmpegLauf.abbruchSignal, #158). KEIN zweites Flag - eine Quelle, zwei Formen.
   */
  readonly signal: AbortSignal
  /** Am terminalen Ausgang aufzurufen; hebt die Registrierung auf. Idempotent. */
  freigeben(): void
}

/**
 * Meldet den beginnenden Lauf an. renderReel (#181) ruft das als ersten Schritt auf und
 * `freigeben()` in seinem finally-Zweig.
 */
export function registriereLauf(renderId: string): LaufRegistrierung {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #179."
  );
}

/**
 * Abbruch-Signal. Kommt aus #68 (der Abbrecher des render-Auftrags) und damit letztlich aus
 * `entferne(auftragId)` im queue-panel. Kehrt SOFORT zurueck und wartet NICHT auf das Prozessende.
 */
export function cancelRender(renderId: string): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #179."
  );
}
