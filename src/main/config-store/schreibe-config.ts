// GENERIERT aus dem Signaturblock von Issue #31.
// [config-store] Atomares Schreiben von config.json mit Backup und schemaVersion
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export async function schreibeConfig(konfig: AppKonfig): Promise<Ergebnis<void>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #31."
  );
}
// 1. konfig + aktuelle schemaVersion nach <Datenort>/config.json.tmp schreiben
// 2. fs.rename config.json.tmp -> config.json (atomar, gleiche Partition)
// 3. VORHER (vor Schritt 1): bestehende config.json (falls vorhanden) nach config.json.bak kopieren
