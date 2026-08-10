// GENERIERT aus dem Signaturblock von Issue #237.
// [project-store] Bearbeitungsstand zurückschreiben
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Project, Bearbeitungsstand } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/**
 * Ersetzt `aktionen` UND `liste` des geladenen Projekts ALS GANZES durch den Schnappschuss –
 * unter dem D1-Lock und VOLL validiert. Der einzige Rueckschreib-Weg fuer Undo/Redo.
 *
 * `assets` und `letzterAusgabeName` bleiben UNANGETASTET (TK 9.5.2, ENTSCHIEDEN 3).
 */
export async function setzeBearbeitungsstand(
  stand: Bearbeitungsstand,
): Promise<Ergebnis<Project>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #237."
  );
}
