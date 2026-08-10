// GENERIERT aus dem Signaturblock von Issue #15.
// [contracts] Typen Project und Listenelement definieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export interface Project {
  id: string
  name: string
  erstelltAm: string             // ISO-8601 UTC
  geaendertAm: string            // ISO-8601 UTC
  schemaVersion: number
  assets: Asset[]
  aktionen: Aktion[]
  liste: Listenelement[]         // Reihenfolge = Array-Reihenfolge, KEIN position-Feld
  letzterAusgabeName: string | null   // FA-22: Vorbelegung des Render-Zielnamens; null = noch nie gerendert
}

export interface Listenelement {
  id: string
  art: 'video' | 'bild' | 'segment'
  ref: string                                    // Asset-ID (video|bild) oder Aktions-ID (segment)
  dauer: number | null                           // Sekunden – bild/segment
  trimStart: number | null                       // Sekunden – nur video
  trimEnde: number | null                        // Sekunden – nur video
  einblendung: Einblendung | null                // nur video
}

export interface Einblendung {
  bandVorlageId: string
  abschnitte: Array<{ aktionRef: string; dauer: number }>
}

// Ausschnitt aus Project: genau die zwei Felder, die Undo/Redo fuehrt (TK 9.5.2).
// KEINE eigene Datei - dieselben Felder, dieselben Elementtypen wie oben.
export interface Bearbeitungsstand {
  aktionen: Aktion[]          // die vollstaendige Aktionen-Bibliothek des Projekts
  liste:    Listenelement[]   // die vollstaendige Wiedergabeliste,
                              // Reihenfolge = Array-Reihenfolge (TK 9.11.3)
}
