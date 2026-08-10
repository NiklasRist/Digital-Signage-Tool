// GENERIERT aus dem Signaturblock von Issue #50.
// [project-store] media://-Auflösung: den Protokoll-Stub aus #9 füllen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

// Wird von #9 als Handler an `protocol.handle('media', ...)` übergeben; die Registrierung selbst
// (VOR app.whenReady()/Fensterladen) bleibt Sache von #9 — diese Datei liefert NUR die
// Anfrage-Behandlung, KEINE Protokoll-Registrierung.

export async function behandleMediaAnfrage(request: Request): Promise<Response> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #50."
  );
}
// Electron protocol.handle-Signatur (Fetch-API-Typen). Löst NIE selbst Pfade auf — jede Auflösung
// läuft über loeseAssetPfad() aus #49 (src/main/project-store/pfade.ts). Liest NUR die Datei;
// schreibt, löscht oder verändert nichts.
