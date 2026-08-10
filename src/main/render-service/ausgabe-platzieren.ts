// GENERIERT aus dem Signaturblock von Issue #180.
// [render-service] Fertige Datei verifizieren und atomar platzieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { RenderProfile } from '../../shared/contracts/render-profile'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { RenderFehlercode } from './fehlercodes'      // #171

export interface PlatzierenErgebnis {
  ausgabePfad: string      // absoluter Pfad der fertigen <name>.mp4
  dateigroesse: number     // Bytes
}

export async function verifiziereUndPlatziere(
  partPfad: string,               // absoluter Pfad projects/<id>/output/<name>.mp4.part
  zielPfad: string,               // absoluter Pfad projects/<id>/output/<name>.mp4 (aus #49)
  erwarteteGesamtdauer: number,   // Sekunden, framegerundet (#174)
  profil: RenderProfile,          // #18 – die Sollwerte der Pruefung
  ffprobePfad: string,            // von renderReel (#181) hereingereicht, s. u.
): Promise<Ergebnis<PlatzierenErgebnis, RenderFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #180."
  );
}
