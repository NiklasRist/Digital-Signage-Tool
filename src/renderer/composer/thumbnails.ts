/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #128.
// [composer] Thumbnails im Renderer erzeugen
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

import type { Project, Listenelement } from '../../shared/contracts/project'
import type { Marke } from '../../shared/contracts/marke'
import type { Vorlage } from '../../shared/contracts/vorlage'

export type Thumbnail =
  | { quelle: 'canvas'; canvas: HTMLCanvasElement; breite: number; höhe: number }
  | { quelle: 'url'; url: string }     // media://<projektId>/<dateiname>, direkt als <img src>
  | { quelle: 'fehlt' }                // Referenz zeigt ins Leere oder Frame nicht gewinnbar

export async function erzeugeThumbnail(
  element: Listenelement,
  projekt: Project,
  marke: Marke,
  vorlagen: readonly Vorlage[],
): Promise<Thumbnail> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #128."
  );
}
