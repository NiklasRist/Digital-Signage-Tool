// GENERIERT aus dem Signaturblock von Issue #130.
// [composer] Wirkung der Abschnittsfolge anzeigen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export type BandVerhalten = 'leer' | 'exakt' | 'wiederholt' | 'abgeschnitten'

export interface BandAblaufplan {
  verhalten: BandVerhalten
  videoFrames: number            // frame-gerundete Länge des GETRIMMTEN Videos
  folgeFrames: number            // frame-gerundete Summe aller Abschnitts-Dauern (ein Durchlauf)
  volleDurchlaeufe: number       // vollständig gezeigte Durchläufe der Folge
  restFrames: number             // Frames des angebrochenen letzten Durchlaufs (0 = keiner)
  angeschnittenerIndex: number | null   // Index des Abschnitts, der am Videoende abbricht
  abschnittsFrames: number[]     // frame-gerundete Dauer je Abschnitt, gleiche Reihenfolge
  nullFrameIndizes: number[]     // Indizes der Abschnitte mit abschnittsFrames[i] === 0
}

export function planeBandAblauf(
  trimStartSek: number,
  trimEndeSek: number,
  abschnitte: ReadonlyArray<{ aktionRef: string; dauer: number }>,
): BandAblaufplan {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #130."
  );
}
