// GENERIERT aus dem Signaturblock von Issue #35.
// [project-store] listeProjekte implementieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export interface ProjektMeta {
  id: string          // = Ordnername unter projects/
  name: string        // aus project.json; bei beschaedigt: true der ORDNERNAME als Behelf
  erstelltAm: string  // ISO-8601 UTC; bei beschaedigt: true aus den Ordner-Zeitstempeln
  geaendertAm: string // ISO-8601 UTC; bei beschaedigt: true aus den Ordner-Zeitstempeln
  ordner: string      // relativer Ordnername
  beschaedigt: boolean // true = weder project.json noch project.json.bak lesbar
  anzahlMedien: number   // Dateien in media/ - aus dem ORDNER gezaehlt, nicht aus project.json
  anzahlAusgaben: number // fertige .mp4 in output/ - Zaehlweise wie listeAusgaben (.part zaehlt nicht)
}
export async function listeProjekte(): Promise<Ergebnis<ProjektMeta[]>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #35."
  );
}
