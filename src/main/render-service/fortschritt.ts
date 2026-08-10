// GENERIERT aus dem Signaturblock von Issue #178.
// [render-service] Fortschritts-Ereignisse bilden und senden
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { RenderProgress } from '../../shared/contracts/render-result'

/**
 * Meldet einen MAIN-INTERNEN Hoerer fuer RenderProgress-Ereignisse an; Rueckgabewert ist die
 * Abmelde-Funktion. Wird beim App-Start EINMAL von der Verdrahtung (#191) gerufen, die jede
 * Meldung auf dem EREIGNIS-Kanal `render:fortschritt` an den Renderer weitergibt.
 * Diese Datei kennt den Kanalnamen nicht und sendet nicht selbst (ENTSCHIEDEN unten).
 */
export function aufRenderFortschritt(
  hoerer: (fortschritt: RenderProgress) => void,
): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #178."
  );
}

export interface FortschrittSender {
  /** Beginn der Normalisierung von Element k (0-basiert). Wird NIE gedrosselt. */
  starteElement(elementIndex: number, elementId: string): void
  /** Grober Zwischenstand INNERHALB des laufenden Elements, 0..1. Wird gedrosselt. */
  meldeAnteil(anteilImElement: number): void
  /** Element k ist fertig normalisiert. Wird NIE gedrosselt. */
  beendeElement(elementIndex: number): void
  /** Uebergang in die Phase `verketten` (ein Gesamtschritt). Wird NIE gedrosselt. */
  starteVerketten(): void
  /** Nach dem terminalen RenderResult aufzurufen. Danach feuert dieser Sender NICHTS mehr. */
  schliesse(): void
}

export function erzeugeFortschrittSender(
  renderId: string,
  elementAnzahl: number,
  anAuftrag: (ereignis: RenderProgress) => void,   // der Rueckruf aus #68
): FortschrittSender {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #178."
  );
}
