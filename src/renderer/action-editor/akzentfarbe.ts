// GENERIERT aus dem Signaturblock von Issue #139.
// [action-editor] Akzentfarbe wählen – feste Auswahl aus der Markenpalette
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Aktion } from '../../shared/contracts/aktion'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { FarbRolle, Marke } from '../../shared/contracts/marke'

/** Die in v1 anwählbaren Akzent-Rollen, in Anzeigereihenfolge. Feste Liste, kein Farbwähler. */
export const AKZENT_ROLLEN = ['akzent', 'akzentKraeftig', 'akzentTief'] as const
export type AkzentRolle = (typeof AKZENT_ROLLEN)[number]

/** Die Auswahl für die Oberfläche: Rollenname + der Hex-Wert aus der Marke für das Farbfeld. */
export function akzentAuswahl(marke: Marke): Array<{ rolle: AkzentRolle; hex: string }> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #139."
  );
}

/** Ist dieser gespeicherte Wert eine der anwählbaren Rollen? */
export function istAkzentRolle(wert: string): wert is AkzentRolle {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #139."
  );
}

/** Die Vorbelegung für eine neue Aktion. */
export const AKZENT_STANDARD: AkzentRolle = 'akzent'

/** Setzt akzentfarbe auf eine Rolle. Schreibt über #136. */
export async function setzeAkzentfarbe(
  aktionId: string,
  rolle: AkzentRolle,
): Promise<Ergebnis<Aktion>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #139."
  );
}
