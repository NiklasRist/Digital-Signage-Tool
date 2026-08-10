/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #163.
// [ffmpeg-adapter] Filterkette für die Vollbild-Normalisierung bauen
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
 * Baut den Wert für `-filter_complex`, der Eingang 0 auf das volle Ausgabe-Profil normalisiert.
 *
 * Ein-/Ausgabe-Label-Konvention des ganzen `ffmpeg-adapter` (gilt in #163, #164, #165 gleich):
 *   [0:v] = die Bild-/Videoquelle          (immer Eingang 0)
 *   [1:v] = die Bandspur                   (nur wenn ein Band vorhanden ist; hier NICHT benutzt)
 *   [v]   = das fertige Video-Ausgabelabel (immer; der Aufrufer mappt es mit `-map` `[v]`)
 * Die stille Tonspur (#162) ist IMMER der LETZTE Eingang, damit sich die Indizes 0 und 1 nie
 * verschieben.
 *
 * @param hintergrund  ffmpeg-Farbausdruck für Balken und Hintergrund; für die Vollbild-
 *                     Normalisierung ist das immer `'black'` (9.2.4). Der Parameter existiert,
 *                     damit #164 dieselbe Geometrie mit `flaecheDunkel` verwenden kann, ohne die
 *                     Kette zu kopieren.
 * @param profil       das feste Ausgabe-Profil, RENDER_PROFILE aus #18 – KEIN eigener Zahlenwert
 */
export function baueVollbildFilter(
  hintergrund: string,
  profil: RenderProfile,
): Ergebnis<string> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #163."
  );
}
