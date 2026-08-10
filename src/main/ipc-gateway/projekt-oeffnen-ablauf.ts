// GENERIERT aus dem Signaturblock von Issue #94.
// [ipc-gateway] Ablauf beim Öffnen eines Projekts koordinieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Project } from '../../shared/contracts/project'
import type { ProjectStoreFehlercode } from '../project-store/assets'
import type { ReconcileFehlercode } from '../media-service/fehlercodes'

export async function oeffneProjektAblauf(
  projektId: string,
): Promise<Ergebnis<Project, ProjectStoreFehlercode | ReconcileFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #94."
  );
}
