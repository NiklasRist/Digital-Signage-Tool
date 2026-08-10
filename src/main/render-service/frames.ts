/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #174.
// [render-service] Frame-Rundung und Gesamtdauer berechnen
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

import type { RenderItem } from '../../shared/contracts/render-request'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { RenderFehlercode } from './fehlercodes'

/** Frame-Grenzen eines Video-Ausschnitts. Behalten werden die Frames [startFrame, endFrame). */
export interface TrimFrames {
  startFrame: number
  endFrame: number
  frames: number        // endFrame - startFrame, immer >= 1
}

/** Sekunden auf das Frame-Raster des Ausgabe-Profils runden: round(sekunden × fps). */
export function zuFrames(sekunden: number): number {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #174."
  );
}

/** Frame-Anzahl zurück in Sekunden: frames / fps. */
export function zuSekunden(frames: number): number {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #174."
  );
}

/** Die beiden Trim-Grenzen eines Video-Elements auf dasselbe Raster runden. */
export function trimFrames(
  trimStart: number,
  trimEnde: number,
): Ergebnis<TrimFrames, RenderFehlercode> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #174."
  );
}

/** Frame-Dauer genau eines Elements: bei `video` aus dem Trim, bei `bild`/`segment` aus `dauer`. */
export function frameDauer(element: RenderItem): Ergebnis<number, RenderFehlercode> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #174."
  );
}

/** Summe der frame-gerundeten Elementdauern, in Frames. Leere Liste ergibt 0. */
export function gesamtFrames(elemente: readonly RenderItem[]): Ergebnis<number, RenderFehlercode> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #174."
  );
}

/** Dieselbe Summe in Sekunden – der Wert, der als `RenderResult.gesamtdauer` gemeldet wird. */
export function gesamtdauer(elemente: readonly RenderItem[]): Ergebnis<number, RenderFehlercode> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #174."
  );
}
