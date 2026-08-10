/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #175.
// [render-service] Segment- und Band-PNGs aus dem Auftrag nach T1 schreiben
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

/** Wo die geschriebenen PNGs liegen – beide Felder sind index-parallel zu `elemente`. */
export interface PngAblage {
  /** Je Listenindex der absolute Pfad des Segment-PNGs; `null` bei `video` und `bild`. */
  segmentPngs: ReadonlyArray<string | null>
  /** Je Listenindex die absoluten Pfade der Band-Abschnitte in Abschnittsreihenfolge; leeres Array ohne Einblendung. */
  bandPngs: ReadonlyArray<readonly string[]>
}

/**
 * Dateiname eines Segment-PNGs, allein aus dem Listenindex.
 * Der Namensbestandteil `Png` ist Pflicht – Begründung: ENTSCHIEDEN 10.
 */
export function segmentPngDateiname(elementIndex: number): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #175."
  );
}

/** Dateiname eines Band-Abschnitts, allein aus Listen- und Abschnittsindex. */
export function bandDateiname(elementIndex: number, abschnittIndex: number): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #175."
  );
}

/** Schreibt alle PNGs des Auftrags flach in den Arbeitsbereich. */
export async function legePngsAb(
  arbeitsbereich: string,
  elemente: readonly RenderItem[],
): Promise<Ergebnis<PngAblage, RenderFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #175."
  );
}
