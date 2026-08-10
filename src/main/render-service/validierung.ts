// GENERIERT aus dem Signaturblock von Issue #173.
// [render-service] RenderRequest vollständig validieren, bevor irgendetwas geschieht
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { RenderRequest } from '../../shared/contracts/render-request'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { RenderFehlercode } from './fehlercodes'

/** Maße eines PNG-Puffers, aus dem IHDR-Kopf gelesen – ohne Dekodieren. */
export interface PngMasse {
  breite: number
  höhe: number
}

/** Liest Breite und Höhe aus den ersten 24 Bytes eines PNG. Dekodiert das Bild NICHT. */
export function liesPngMasse(png: Uint8Array): Ergebnis<PngMasse, RenderFehlercode> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #173."
  );
}

/**
 * Prüft die gesamte Anfrage. Wirkungsfrei: liest nichts, schreibt nichts, startet nichts.
 * Erfolg heisst „diese Anfrage darf ausgeführt werden", nicht „sie wird gelingen".
 */
export function pruefeRenderRequest(request: RenderRequest): Ergebnis<void, RenderFehlercode> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #173."
  );
}
