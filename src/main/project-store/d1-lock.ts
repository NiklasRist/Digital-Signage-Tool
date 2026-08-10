// GENERIERT aus dem Signaturblock von Issue #32.
// [project-store] D1-Schreib-Lock-Primitive bauen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export async function mitD1Lock<T>(aktion: () => Promise<T>): Promise<T> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #32."
  );
}
// führt aktion() garantiert seriell aus: ruft ein zweiter Aufrufer mitD1Lock() auf, während
// der erste noch läuft, wartet er, bis der erste fertig ist (FIFO-Warteschlange innerhalb
// des Prozesses, KEINE Datei-/OS-Sperre)
