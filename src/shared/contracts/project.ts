// [contracts] Typen Project und Listenelement definieren

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
  // ERGAENZT durch #334 (Nachtrag 23.08.2026 zu #15, TK v3.16-v3.18):
  // FA-06: projektweite Standarddauer für Aktions-Segmente,
  //        je Aktion überschreibbar (Auflösungskette 9.8.4).
  //        Pflicht; Wertebereich wie setzeDauer (10–45 s, 9.11.4).
  //        Teil von schemaVersion 1, KEINE Migration (9.5.5);
  //        wechselbar über setzeStandardSegmentdauer (#334)
  standardSegmentdauer: number
  letzterAusgabeName: string | null   // FA-22: Vorbelegung des Render-Zielnamens; null = noch nie gerendert
  standardMarkeId: string        // NEU – FA-23: färbt Band-Hintergrund und Split-Restflächen und
                                 //   belegt neue Aktionen vor. Beim Anlegen die eingebaute Marke
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
  // #426 / TK v3.26 (9.2.9): der SEQUENZIELLE Einschub - das Gegenstueck zum parallelen
  // Band. Das Video bleibt EIN Element; der Render zerlegt es frame-genau in
  // Video-Teil · Aktion · Video-Teil. Nur bei `art: 'video'`; bei `segment` immer `[]`.
  //
  // OPTIONAL IM TYP (migrationsfrei, TK 9.5.5): Das Feld ist Teil von schemaVersion 1, aber
  // aeltere project.json kennen es nicht. Zwei Garantien halten es einfach: (1) JEDE
  // Erzeugungsstelle setzt `[]` (fuege-element-hinzu.ts); (2) das LADEN ergaenzt ein
  // fehlendes Feld auf `[]` (migriere-projekt.ts). Verbraucher duerfen `undefined` wie `[]`
  // lesen - "keine Unterbrechung".
  unterbrechungen?: Unterbrechung[]
}

/**
 * Eine Unterbrechung des Videos (#426, TK 9.2.9/9.11.3): das Video pausiert an der
 * `zeitstelle`, die Aktion `aktionRef` laeuft `dauer` Sekunden, danach laeuft das Video
 * an derselben Stelle weiter. `zeitstelle`/`dauer` werden ROH gespeichert (wie der Trim);
 * die Frame-Rundung passiert im render-service (9.2.6) - kein zweiter Rundungsweg.
 */
export interface Unterbrechung {
  zeitstelle: number   // Sekunden, ab 0 der getrimmten Video-Sicht
  aktionRef: string    // Aktion, die hier laeuft
  dauer: number        // Sekunden
}

export interface Einblendung {
  bandVorlageId: string
  abschnitte: Array<{ aktionRef: string; dauer: number }>
}

// Ausschnitt aus Project: genau die drei Felder, die Undo/Redo fuehrt (TK 9.5.2; das dritte
// Feld kam mit TK v3.18 / #334 dazu). KEINE eigene Datei - dieselben Felder, dieselben
// Elementtypen wie oben.
export interface Bearbeitungsstand {
  aktionen: Aktion[]          // die vollstaendige Aktionen-Bibliothek des Projekts
  liste:    Listenelement[]   // die vollstaendige Wiedergabeliste,
                              // Reihenfolge = Array-Reihenfolge (TK 9.11.3)
  standardSegmentdauer: number    // die projektweite Standarddauer (9.11.3), seit v3.18 im Schnappschuss
}
