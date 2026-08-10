/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #191.
// [ipc-gateway] Den Export-Kanal und das Render-Fortschritts-Ereignis verdrahten
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

import type { BrowserWindow } from 'electron'

export function verdrahteExportUndFortschrittIPC(fenster: BrowserWindow): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #191."
  );
}
// 1. registriert den Aufrufkanal `export:wähleExportZiel` über den Wrapper aus #23
//    (mit eigener Validierungsfunktion; die Operation hat keine Nutzlast)
// 2. meldet sich über aufRenderFortschritt (#178) als Hörer an und gibt jede Meldung auf dem
//    EREIGNIS-Kanal `render:fortschritt` an den Renderer weiter – OHNE Hülle, OHNE Endzustand
// Kein Zustand, keine Fachlogik, keine Umformung der Nutzlast.
