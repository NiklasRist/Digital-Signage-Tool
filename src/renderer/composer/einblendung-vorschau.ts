/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #130.
// [composer] Wirkung der Abschnittsfolge anzeigen
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
// GERUEST-PRUEFSUMME: 516e26e705991a20
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
