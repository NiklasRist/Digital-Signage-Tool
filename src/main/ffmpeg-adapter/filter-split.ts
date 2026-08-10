// GENERIERT aus dem Signaturblock von Issue #164.
// [ffmpeg-adapter] Filterkette für die Split-Geometrie bauen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { RenderProfile } from '../../shared/contracts/render-profile'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/**
 * Baut den Wert für `-filter_complex` der Kompositionsart `split` (TK 9.2.8 Art A).
 *
 * Label-Konvention des ganzen `ffmpeg-adapter` (identisch in #163, #164, #165):
 *   [0:v] = das Video          (immer Eingang 0)
 *   [1:v] = die Bandspur       (immer Eingang 1, wenn ein Band vorhanden ist)
 *   [v]   = das Ausgabelabel   (der Aufrufer mappt es mit `-map` `[v]`)
 * Die stille Tonspur (#162) ist IMMER der LETZTE Eingang – hier also Eingang 2 –, damit sich die
 * Indizes 0 und 1 nie verschieben.
 *
 * @param hoeheBand      Bandhöhe H in Pixeln. Kommt aus `RenderItemVideo.einblendung.höhe` (#17)
 *                       und ist dort beim EINREIHEN aus der Band-Vorlage eingefroren worden.
 *                       Hier wird NICHTS nachgeschlagen.
 * @param videoEingepasstBreite  Breite des eingepassten Videos in Pixeln – FERTIG GERECHNET von
 *                       `bestimmeBandgeometrie` (#176) nach TK 9.2.8: `(1080 − H) × 16/9`,
 *                       abgerundet auf das nächstkleinere Vielfache von 4. Diese Datei rundet
 *                       NICHT und leitet die Breite NICHT aus `hoeheBand` ab.
 * @param videoEingepasstX       linker Rand des eingepassten Videos – ebenfalls von #176:
 *                       `(profil.breite − videoEingepasstBreite) / 2`, durch die Vierer-Rundung
 *                       immer ganzzahlig und gerade.
 * @param fuellFarbe     die Fläche für die seitlichen Restflächen, als ffmpeg-Farbausdruck der
 *                       Form `0xRRGGBB`. Der Wert stammt aus der Farb-Rolle `flaecheDunkel` der
 *                       `Marke` und wird vom `render-service` über `leseMarke()` (#29) geholt und
 *                       hierher durchgereicht. Diese Datei enthält KEINE Hexzahl.
 * @param profil         RENDER_PROFILE (#18) – die Quelle aller übrigen Zahlen
 */
export function baueSplitFilter(
  hoeheBand: number,
  videoEingepasstBreite: number,
  videoEingepasstX: number,
  fuellFarbe: string,
  profil: RenderProfile,
): Ergebnis<string> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #164."
  );
}

/**
 * Rechnet einen Hexwert der `Marke` (`#RRGGBB` oder `#RRGGBBAA`) in die Farbschreibweise um, die
 * ffmpeg versteht (`0xRRGGBB`).
 * Exportiert, weil der Aufrufer die Umrechnung braucht: Der `render-service` (#177) holt
 * `flaecheDunkel` als Hexwert aus der Marke und muss ihn umrechnen, BEVOR er ihn als `fuellFarbe`
 * hereinreicht - diese Datei nimmt ausschliesslich die Form `0xRRGGBB` entgegen. #177 ist damit
 * der einzige Verbraucher; #165 (Einblendung) benutzt sie NICHT, weil dort die Balkenfarbe
 * schwarz nach 9.2.4 ist und keine Markenfarbe vorkommt.
 */
export function markenFarbeZuFfmpeg(hex: string): Ergebnis<string> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #164."
  );
}
