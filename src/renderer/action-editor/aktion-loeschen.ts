// GENERIERT aus dem Signaturblock von Issue #142.
// [action-editor] Aktion löschen – die Kaskade vorher sichtbar machen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Listenelement, Bearbeitungsstand } from '../../shared/contracts/project'

/** Was das Löschen bewirken wird – vor dem Absenden aus der Liste berechnet. */
export interface LoeschVorschau {
  entfernteElementIds: string[]      // Segment-Listenelemente: verschwinden ganz (Fall 1)
  gekuerzteElementIds: string[]      // Video-Elemente: nur Bandabschnitte fallen weg (Fall 2)
  baenderWerdenLeer: string[]        // Teilmenge von gekuerzteElementIds: einblendung entfällt ganz
}

/** Die Vorschau. Rein, synchron, ohne Nebenwirkung. */
export function berechneLoeschVorschau(aktionId: string, liste: Listenelement[]): LoeschVorschau {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #142."
  );
}

/** Führt das Löschen über den Kanal `project:löscheAktion` aus. */
export async function loescheAktion(aktionId: string): Promise<Ergebnis<{
  stand: Bearbeitungsstand
  entfernteElementIds: string[]
  geaenderteElementIds: string[]
}>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #142."
  );
}
