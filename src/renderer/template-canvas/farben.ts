/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #112.
// [template-canvas] Farb- und Schriftrollen der Marke auflösen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: 58776af465089674
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
