// GENERIERT aus dem Signaturblock von Issue #58.
// [auftrags-manager] Zustandsübergänge der Aufträge prüfen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { AuftragStatus } from '../../shared/contracts/auftrag';
import type { Ergebnis } from '../../shared/contracts/ergebnis';

export function istUebergangErlaubt(von: AuftragStatus, nach: AuftragStatus): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #58."
  );
}

export function pruefeUebergang(von: AuftragStatus, nach: AuftragStatus): Ergebnis<void> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #58."
  );
}
