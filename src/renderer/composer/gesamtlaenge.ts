/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #127.
// [composer] Gesamtlänge der Wiedergabeliste und die 30-Minuten-Warnung
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
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

import type { Listenelement } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

export interface Gesamtlaenge {
  frames: number        // Summe der frame-gerundeten Elementdauern, in Frames
  sekunden: number      // frames / RENDER_PROFILE.fps – exaktes Vielfaches von 1/fps
  warnung: boolean      // true, sobald WARNSCHWELLE_SEKUNDEN überschritten ist
}

/** Frames eines einzelnen Elements – dieselbe Rundungsregel wie der render-service (TK 9.2.6). */
export function frameDauer(element: Listenelement): Ergebnis<number> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #127."
  );
}

/** Summe über die ganze Liste. Eine leere Liste ergibt 0 Frames und ist KEIN Fehler. */
export function berechneGesamtlaenge(liste: Listenelement[]): Ergebnis<Gesamtlaenge> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #127."
  );
}

/** Anzeigeform der Länge: "M:SS" unter einer Stunde, sonst "H:MM:SS". */
export function formatiereLaenge(sekunden: number): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #127."
  );
}

/** Schwelle der Warnung aus TK 9.7 („Gesamtlänge + 30-Minuten-Warnung anzeigen"). */
export const WARNSCHWELLE_SEKUNDEN = 1800
