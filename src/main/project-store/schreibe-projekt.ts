// GENERIERT aus dem Signaturblock von Issue #46.
// [project-store] Atomares Schreiben von project.json mit .bak und schemaVersion
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export async function schreibeProjekt(projekt: Project): Promise<Ergebnis<void>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #46."
  );
}
// 1. projekt + aktuelle schemaVersion nach <Datenort>/projects/<projekt.id>/project.json.tmp schreiben
// 2. fs.rename project.json.tmp -> project.json (atomar, gleiche Partition)
// 3. VORHER (vor Schritt 1): bestehende project.json (falls vorhanden) nach project.json.bak
//    kopieren (fs.copyFile, KEIN Verschieben/Unlink der Quelle)
