// GENERIERT aus dem Signaturblock von Issue #191.
// [ipc-gateway] Den Export-Kanal und das Render-Fortschritts-Ereignis verdrahten
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

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
