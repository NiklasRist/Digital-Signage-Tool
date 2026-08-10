// GENERIERT aus dem Signaturblock von Issue #125.
// [composer] Der einheitliche Dauer- und Trim-Regler
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Listenelement } from '../../shared/contracts/project'
import type { Asset } from '../../shared/contracts/asset'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/** Das eine Modell hinter dem einen Regler – für Video, Bild und Aktions-Segment gleich geformt. */
export interface ReglerModell {
  elementId: string
  griffe: 1 | 2            // Video: 2 (Anfang/Ende); Bild/Segment: 1 (nur die Länge)
  untergrenze: number      // Sekunden – kleinstmöglicher Wert für `anfang`
  obergrenze: number       // Sekunden – größtmöglicher Wert für `ende`
  anfang: number           // Sekunden – bei Bild/Segment immer 0
  ende: number             // Sekunden
  effektiveDauer: number   // Sekunden = ende − anfang (roh, s. „ENTSCHIEDEN" 3)
}

/** Baut das Modell aus dem Listenelement. `asset` ist das über `element.ref` referenzierte Asset –
 *  nur bei art 'video' nötig, sonst null. */
export function baueReglerModell(
  element: Listenelement,
  asset: Asset | null,
): Ergebnis<ReglerModell> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #125."
  );
}

/** Begrenzt ein gezogenes Griffpaar auf das Modell. Rein rechnend, kein IPC. */
export function begrenze(
  modell: ReglerModell,
  anfang: number,
  ende: number,
): { anfang: number; ende: number } {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #125."
  );
}

/** Übernimmt die neuen Grenzen – EIN Einstiegspunkt für alle Elementtypen. */
export async function uebernehmeGrenzen(
  element: Listenelement,
  anfang: number,
  ende: number,
): Promise<Ergebnis<Listenelement>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #125."
  );
}
