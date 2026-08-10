// GENERIERT aus dem Signaturblock von Issue #104.
// [vorlagen-store] alsEigenstaendige – Arbeitskopie von ihrem Parent lösen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export async function alsEigenstaendige(
  arbeitsId: string,
  name: string,
): Promise<Ergebnis<Vorlage, VorlagenFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #104."
  );
}
// - setzt am EINTRAG MIT id === arbeitsId: parent = null, name = <name>, eingebaut = false
// - behält dessen id, art, höhe und zonen unverändert
// - fasst den Parent-Datensatz NICHT an und liest ihn nicht einmal
// - legt KEINEN zusätzlichen Eintrag an und entfernt keinen
// - kein fs, kein Lock, kein IPC-Kanal (den meldet #109 an)
