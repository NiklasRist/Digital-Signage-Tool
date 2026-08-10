// GENERIERT aus dem Signaturblock von Issue #112.
// [template-canvas] Farb- und Schriftrollen der Marke auflösen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Marke, FarbRolle, SchriftRolle, Schrift } from '../../shared/contracts/marke'
import type { Aktion } from '../../shared/contracts/aktion'

export function loeseFarbe(marke: Marke, rolle: FarbRolle, aktion: Aktion): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #112."
  );
}
// Liefert einen Wert, der direkt an ctx.fillStyle / ctx.strokeStyle / einen Verlaufs-Stopp
// übergeben werden kann:
//   6-stelliges Hex  →  unverändert durchgereicht        ("#FF4040")
//   8-stelliges Hex  →  "rgba(r, g, b, a)"               ("#000000B3" → "rgba(0, 0, 0, 0.702)")
// AKZENT-ERSETZUNG (TK 9.10.9): Ist `rolle` eine der drei Akzent-Rollen 'akzent',
// 'akzentKraeftig', 'akzentTief' UND ist aktion.akzentfarbe gesetzt (nicht null), wird der Wert
// zu aktion.akzentfarbe aufgeloest statt zu `rolle`. Sonst gilt der Markenwert von `rolle`.
// Der dritte Parameter ist PFLICHT und nicht optional – s. Festlegung 8.
// Unbekannte Rolle: wirft. Unzulässiges Farbformat: wirft. NIEMALS eine Ersatzfarbe.

export function loeseSchrift(marke: Marke, rolle: SchriftRolle): Schrift {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #112."
  );
}
// Liefert den Schrift-Datensatz { familie, gewicht, datei } aus der Marke.
// Unbekannte Rolle: wirft. Die Canvas-Kurzform daraus bildet #110, nicht diese Datei.
