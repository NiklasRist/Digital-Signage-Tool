// GENERIERT aus dem Signaturblock von Issue #92.
// [media-service] Handler für import und loeschen registrieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export function registriereMedienHandler(): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #92."
  );
}
// 1. trägt für art: 'import'   die Funktion importMedium (#85) DIREKT als Handler ein
// 2. trägt für art: 'loeschen' die Funktion löscheMedium (#87) DIREKT als Handler ein
// 3. registriert für BEIDE Arten KEINEN Abbrecher (dritter Parameter bleibt weg)
