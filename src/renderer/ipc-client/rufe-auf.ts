// GENERIERT aus dem Signaturblock von Issue #24.
// [ipc] ipc-client typisierten Invoke-Wrapper bauen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export async function rufeAuf<T, F extends string = GenerischerFehlercode>(
  kanal: string,
  nutzlast?: unknown,
): Promise<Ergebnis<T, F>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #24."
  );
}
// delegiert an window.api.invoke(kanal, nutzlast) und castet NUR den Typ (keine Laufzeit-
// Transformation) – die Struktur, die der Main zurückgibt, MUSS bereits Ergebnis<T,F> sein
