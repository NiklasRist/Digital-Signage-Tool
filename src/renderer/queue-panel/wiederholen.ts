// GENERIERT aus dem Signaturblock von Issue #210.
// [queue-panel] Wiederholen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Auftrag } from '../../shared/contracts/auftrag'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/**
 * REIN. Die EINZIGE Auskunft darueber, ob an einer Zeile ein „Wiederholen"-Schalter erscheint.
 * Genau dann true, wenn status === 'fehlgeschlagen'. NICHT bei 'abgebrochen' (TK 9.3.3),
 * nicht bei 'erfolg', nicht bei 'anstehend', nicht bei 'laeuft'.
 */
export function darfWiederholen(auftrag: Auftrag): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #210."
  );
}

/** REIN. Beschriftung des Schalters. */
export const WIEDERHOLEN_BESCHRIFTUNG = 'Erneut versuchen'

/**
 * REIN. Der Hinweis, der beim Schalter steht bzw. nach dem Klick erscheint.
 * Nennt AUSDRUECKLICH, dass der Auftrag ans Ende der Warteschlange kommt (FA-17).
 */
export function wiederholenHinweis(auftrag: Auftrag): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #210."
  );
}

/** Reiht den fehlgeschlagenen Auftrag erneut ein. `ok` heisst „eingereiht", NICHT „fertig". */
export async function wiederholeAuftrag(auftragId: string): Promise<Ergebnis<void>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #210."
  );
}
