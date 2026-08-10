// GENERIERT aus dem Signaturblock von Issue #122.
// [composer] Die Liste per Drag-and-drop ordnen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Listenelement } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/** Reine Umsortierung: entfernt `aktivId` und fügt es an der Position von `ueberId` wieder ein.
 *  Gleiche Semantik wie `arrayMove` aus @dnd-kit/sortable – hier als EINE Quelle für beide Wege. */
export function berechneNeueReihenfolge(
  ids: string[],
  aktivId: string,
  ueberId: string,
): string[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #122."
  );
}

/** Optimistischer Reorder: Sicht sofort umstellen, dann `ordneNeu` bestätigen lassen.
 *  `ueberId` ist `string | null`, weil dnd-kit bei einem Drop ausserhalb der Liste
 *  `event.over === null` liefert (s. ENTSCHIEDEN 2 und Fehlerpfade). */
export async function ordneNeuOptimistisch(
  aktivId: string,
  ueberId: string | null,
): Promise<Ergebnis<void>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #122."
  );
}
