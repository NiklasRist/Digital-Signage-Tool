// GENERIERT aus dem Signaturblock von Issue #247.
// [contracts] ProjektMeta und AusgabeDatei in den geteilten Vertrag ziehen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: b65c17ace0636d07

// src/shared/contracts/projekt-meta.ts   (NEUE Datei, enthaelt NUR diese beiden Typen)

/**
 * Die Nutzlast von `project:listeProjekte` (TK 9.5.2). Leichte Metadaten je Projekt –
 * KEIN geladenes Projekt, KEINE absoluten Pfade (TK 9.5.7).
 */
export interface ProjektMeta {
  id:             string       // = Ordnername unter projects/
  name:           string       // aus project.json; bei beschaedigt: true der ORDNERNAME als Behelf
  erstelltAm:     string       // ISO-8601 UTC; bei beschaedigt: true aus den Ordner-Zeitstempeln
  geaendertAm:    string       // ISO-8601 UTC; bei beschaedigt: true aus den Ordner-Zeitstempeln
  ordner:         string       // relativer Ordnername
  beschaedigt:    boolean      // true = weder project.json noch project.json.bak lesbar
  anzahlMedien:   number       // Dateien in media/ – aus dem ORDNER gezählt, nicht aus project.json
  anzahlAusgaben: number       // fertige .mp4 in output/ – Zählweise wie listeAusgaben (.part zählt nicht)
}

/**
 * Die Nutzlast von `project:listeAusgaben` (TK 9.5.2). Der Ist-Bestand des Ausgabeordners –
 * NUR fertige .mp4, KEINE Arbeitsdateien, KEIN absoluter Pfad.
 */
export interface AusgabeDatei {
  dateiname:    string   // MIT Endung, z. B. "sommeraktion.mp4"
  dateigroesse: number   // Bytes
  geaendertAm:  string   // ISO-8601 UTC – zugleich der Renderzeitpunkt (die Datei entsteht atomar, 9.2.6)
}
