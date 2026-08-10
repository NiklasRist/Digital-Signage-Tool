// GENERIERT aus dem Signaturblock von Issue #152.
// [project-store] setzeElementReferenz
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Listenelement } from '../../shared/contracts/project'
export async function setzeElementReferenz(
  elementId: string,
  referenz: string,   // Ziel-ID; WELCHER Bestand gemeint ist, entscheidet die art des Elements:
                      //   art: 'video'   -> Asset-ID aus Project.assets, Asset.typ === 'video'
                      //   art: 'bild'    -> Asset-ID aus Project.assets, Asset.typ === 'bild'
                      //   art: 'segment' -> AKTIONS-ID aus Project.aktionen
): Promise<Ergebnis<Listenelement>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #152."
  );
}
// Alle drei Element-Arten werden bedient (s. ENTSCHIEDEN 1). Die art des Elements bleibt dabei
// IMMER unverändert – diese Operation wandelt kein Video in ein Segment und umgekehrt.
// NUR bei art: 'video' werden trimStart und trimEnde auf null gesetzt (s. ENTSCHIEDEN 2).
