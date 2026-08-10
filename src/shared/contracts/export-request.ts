// GENERIERT aus dem Signaturblock von Issue #156.
// [contracts] Typ ExportRequest definieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

/** Nutzlast des Auftrags art: 'export' (TK 9.6.1). */
export interface ExportRequest {
  /** Projekt-Kontext; zusammen mit `dateiname` die Quelle. */
  projektId: string
  /**
   * WELCHE Ausgabedatei kopiert wird – MIT Endung, z. B. "sommeraktion.mp4".
   * Aufgelöst zu projects/<projektId>/output/<dateiname>.
   */
  dateiname: string
  /**
   * Der gewählte ZIELORDNER (z. B. USB-Wurzel) – NICHT der Pfad der Zieldatei.
   * Der vollständige Pfad der geschriebenen Datei entsteht erst im Auftrags-ERGEBNIS
   * ({ zielPfad, dateigroesse }) und heisst dort ebenfalls `zielPfad` (TK 9.6.1).
   */
  zielPfad: string
}
