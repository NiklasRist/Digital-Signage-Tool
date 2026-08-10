/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #139.
// [action-editor] Akzentfarbe wählen – feste Auswahl aus der Markenpalette
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

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
