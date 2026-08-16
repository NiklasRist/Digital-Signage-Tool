// GENERIERT aus dem Signaturblock von Issue #15.
// [contracts] Typen Project und Listenelement definieren
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
// GERUEST-PRUEFSUMME: 307668d1be8fb780

import type { Aktion } from './aktion'
import type { Asset } from './asset'
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
  // Die Elementart `bild` ist mit TK v3.16 GESTRICHEN (TK 9.11.3): Ein fertig gestaltetes
  // Bild von aussen direkt in die Wiedergabeliste zu legen, ist kein Anwendungsfall - alle
  // Inhalte entstehen ueber den action-editor und tragen so den Markenrahmen. NICHT betroffen
  // ist `Asset.typ: 'video' | 'bild'` (#13): Bilder werden weiter importiert und verwaltet und
  // erreichen den Render als Motiv einer Aktion (`Aktion.bildRef`).
  art: 'video' | 'segment'
  ref: string                                    // Asset-ID (video) oder Aktions-ID (segment)
  dauer: number | null                           // Sekunden – nur segment
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
