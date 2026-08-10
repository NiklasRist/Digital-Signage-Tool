/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #165.
// [ffmpeg-adapter] Filterkette für die Einblendung bauen
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
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/**
 * Baut den Wert für `-filter_complex` der Kompositionsart `einblendung` (TK 9.2.8 Art B).
 *
 * Label-Konvention des ganzen `ffmpeg-adapter` (identisch in #163, #164, #165):
 *   [0:v] = das Video          (immer Eingang 0)
 *   [1:v] = die Bandspur       (immer Eingang 1, wenn ein Band vorhanden ist)
 *   [v]   = das Ausgabelabel   (der Aufrufer mappt es mit `-map` `[v]`)
 * Die stille Tonspur (#162) ist IMMER der LETZTE Eingang – hier also Eingang 2 –, damit sich die
 * Indizes 0 und 1 nie verschieben.
 *
 * @param hoeheBand  Bandhöhe H in Pixeln, aus `RenderItemVideo.einblendung.höhe` (#17), beim
 *                   Einreihen aus der Band-Vorlage eingefroren. Hier wird NICHTS nachgeschlagen.
 * @param profil     RENDER_PROFILE (#18) – die Quelle aller übrigen Zahlen
 */
export function baueEinblendungFilter(
  hoeheBand: number,
  profil: RenderProfile,
): Ergebnis<string> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #165."
  );
}
