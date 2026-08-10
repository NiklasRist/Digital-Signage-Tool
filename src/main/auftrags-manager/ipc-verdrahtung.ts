// GENERIERT aus dem Signaturblock von Issue #71.
// [auftrags-manager] Die vier Queue-Kanäle und das Ereignis verdrahten
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { BrowserWindow } from 'electron'

export function verdrahteQueueIPC(fenster: BrowserWindow): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #71."
  );
}
// 1. registriert die vier Kanäle über den Wrapper aus #23 (je mit eigener Validierungsfunktion)
// 2. meldet sich über aufQueueGeaendert (#65) als Hörer an und gibt jede Meldung auf dem
//    Ereigniskanal queue:geaendert an DAS EINE Fenster weiter (fenster.webContents.send(...))
//    – OHNE Hülle, OHNE Endzustand
// Vor jedem Senden wird fenster.isDestroyed() geprüft; ist es zerstört, wird still verworfen.
