/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #161.
// [ffmpeg-adapter] Encoder-Argumente aus RENDER_PROFILE bilden
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

import type { RenderProfile } from '../../shared/contracts/render-profile'

/**
 * Bildet die VIDEO-Kodierargumente aus dem Profil.
 * NICHT enthalten: Eingaben (-i), Filterketten (-vf/-filter_complex), Tonspur,
 * Container-Flags und der Ausgabepfad. Die kommen von den jeweils zustaendigen Stellen.
 */
export function baueVideoKodierArgumente(profil: RenderProfile): string[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #161."
  );
}
