// GENERIERT aus dem Signaturblock von Issue #238.
// [ipc-gateway] Sender für die beiden Auto-Speichern-Meldungen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { BrowserWindow } from 'electron'

export function verdrahteSpeicherstatusIPC(fenster: BrowserWindow): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #238."
  );
}
// 1. meldet sich EINMAL ueber aufAutoSpeichernEreignis (#47) als Hoerer an und gibt jede
//    Meldung UNVERAENDERT auf dem Ereignis-Kanal `project:autoSpeichernStatus` an den
//    Renderer weiter – OHNE Huelle, OHNE Endzustand, OHNE Umformen oder Filtern
// 2. dasselbe fuer den vorlagen-store auf dem Kanal `vorlagen:autoSpeichernStatus`
//    – die main-interne Anmelde-Funktion dafuer ist `aufVorlagenSpeichernEreignis` (#98)
// Kein Zustand, keine Fachlogik, kein Aufrufkanal, keine Umformung der Nutzlast.
