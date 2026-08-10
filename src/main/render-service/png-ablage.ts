// GENERIERT aus dem Signaturblock von Issue #175.
// [render-service] Segment- und Band-PNGs aus dem Auftrag nach T1 schreiben
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

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
