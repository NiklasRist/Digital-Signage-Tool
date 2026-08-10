// GENERIERT aus dem Signaturblock von Issue #190.
// [export-service] Den Export-Handler bei der Auftragsverwaltung anmelden
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export function meldeExportHandlerAn(): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #190."
  );
}
// 1. trägt für art: 'export' die Funktion exportiereAusgabe (#188) DIREKT als Handler ein
// 2. registriert für diese Art KEINEN Abbrecher (dritter Parameter bleibt weg)
