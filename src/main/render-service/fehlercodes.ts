// GENERIERT aus dem Signaturblock von Issue #171.
// [render-service] Fehlercode-Union des Moduls definieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

/**
 * Fachliche Fehlercodes des render-service – geschlossener Satz, TK 9.2.3.
 * Die drei generischen Codes (`ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`)
 * kommen über `Ergebnis<T, F>` automatisch dazu und werden hier NICHT wiederholt.
 */
export type RenderFehlercode =
  | 'medium_fehlt'
  | 'ungueltiges_element'
  | 'ffmpeg_fehler'
  | 'kein_platz'
  | 'speicher_fehler'

/**
 * Form der strukturierten Fehlerdaten (`Ergebnis.fehler.daten`) für die beiden Codes, die ein
 * einzelnes Element benennen: `medium_fehlt` und `ungueltiges_element` (TK 9.2.3).
 * Alle übrigen Codes setzen `daten` NICHT.
 */
export interface ElementFehlerdaten {
  elementId: string
}
