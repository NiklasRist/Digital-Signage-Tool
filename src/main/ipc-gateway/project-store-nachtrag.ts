// GENERIERT aus dem Signaturblock von Issue #153.
// [ipc-gateway] Die beiden neuen project-store-Kanäle verdrahten
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export function verdrahteProjectStoreNachtragIPC(): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #153."
  );
}
// registriert die 2 unten aufgeführten Kanäle über den Wrapper aus #23 – je mit einer eigenen
// Validierungsfunktion. Kein Zustand, keine Fachlogik, kein Ereignis-Versand (s. STOPP).
