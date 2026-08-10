// GENERIERT aus dem Signaturblock von Issue #23.
// [ipc] ipc-gateway Kanal-Wrapper mit Validierung und Ergebnis-Hülle bauen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export function registriereHandler<T, F extends string>(
  kanal: string,
  validiere: (nutzlast: unknown) => Ergebnis<unknown, 'ungueltige_eingabe'> | { ok: true; wert: unknown },
  ausfuehren: (validierteNutzlast: unknown) => Promise<Ergebnis<T, F>>,
): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #23."
  );
}
// registriert einen ipcMain.handle(kanal, ...)-Listener, der:
//   1. validiere() aufruft; bei ok:false → sofort Ergebnis<T,F> mit code 'ungueltige_eingabe' zurück,
//      OHNE ausfuehren() aufzurufen (keine Wirkung auf Daten)
//   2. ausfuehren() in try/catch aufruft; jede uncaught Exception → Ergebnis<T,F> mit
//      code 'unbekannter_fehler', Exception intern geloggt, KEIN Stacktrace im Rückgabewert
//   3. das Ergebnis von ausfuehren() unverändert zurückgibt
