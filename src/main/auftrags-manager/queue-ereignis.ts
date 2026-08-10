// GENERIERT aus dem Signaturblock von Issue #65.
// [auftrags-manager] Ereignis queue:geaendert senden
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Auftrag } from '../../shared/contracts/auftrag'

export async function sendeQueueGeaendert(): Promise<void> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #65."
  );
}
// Ermittelt den Stand über holeStand() (#64) und meldet ihn allen registrierten Hörern.
// Nutzlast ist Auftrag[] – derselbe zusammengeführte, deduplizierte und sortierte Stand.
// KEINE Ergebnis-Hülle, KEIN Endzustand.

export function aufQueueGeaendert(
  hoerer: (auftraege: Auftrag[]) => void,
): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #65."
  );
}
// registriert einen MAIN-INTERNEN Hörer; Rückgabewert ist die Abmelde-Funktion
