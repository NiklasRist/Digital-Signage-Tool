// GENERIERT aus dem Signaturblock von Issue #120.
// [project-store] setzeEinblendung implementieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export async function setzeEinblendung(
  elementId: string,
  einblendung: Einblendung | null,   // null = Band entfernen; Typ aus #15
): Promise<Ergebnis<Listenelement>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #120."
  );
}
// Einblendung { bandVorlageId: string; abschnitte: Array<{ aktionRef: string; dauer: number }> }  (#15)
// Die ÜBERGEBENE Einblendung ersetzt die vorhandene VOLLSTÄNDIG (Ganz-Ersetzen, s. „ENTSCHIEDEN").
