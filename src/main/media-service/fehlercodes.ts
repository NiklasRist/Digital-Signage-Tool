// GENERIERT aus dem Signaturblock von Issue #79.
// [media-service] Fehlercode-Unionen des Moduls definieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: 1a46f21a96f02d1f

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
