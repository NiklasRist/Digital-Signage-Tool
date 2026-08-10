/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #152.
// [project-store] setzeElementReferenz
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
