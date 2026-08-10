// GENERIERT aus dem Signaturblock von Issue #79.
// [media-service] Fehlercode-Unionen des Moduls definieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

/** Fachliche Fehlercodes von importMedium (TK 9.4.9). */
export type ImportFehlercode =
  | 'datei_nicht_gefunden'
  | 'format_nicht_unterstuetzt'
  | 'probe_fehler'
  | 'kopier_fehler'
  | 'speicher_fehler'

/** Fachliche Fehlercodes von löscheMedium (TK 9.4.9). */
export type LoeschFehlercode =
  | 'asset_nicht_gefunden'
  | 'asset_referenziert'
  | 'datei_fehler'
  | 'speicher_fehler'

/** Fehlercodes des Aufräumlaufs (Reconcile, TK 9.4.7) – s. Begründung unten. */
export type ReconcileFehlercode = 'speicher_fehler' | 'datei_fehler'
