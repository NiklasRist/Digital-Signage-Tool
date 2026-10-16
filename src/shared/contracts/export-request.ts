// [contracts] Typ ExportRequest definieren

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
