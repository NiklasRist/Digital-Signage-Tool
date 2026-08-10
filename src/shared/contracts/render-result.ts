// GENERIERT aus dem Signaturblock von Issue #19.
// [contracts] Typen RenderResult und RenderProgress definieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export type RenderResult =
  | { status: 'erfolg'; renderId: string; ausgabePfad: string; ausgabeName: string; gesamtdauer: number; dateigroesse: number }
  | { status: 'fehler'; renderId: string; fehlercode: string; fehlerhaftesElementId: string | null; meldung: string }
  | { status: 'abgebrochen'; renderId: string; abgebrochenBei: number | null }

// KEIN Feld `historieEintrag` und KEIN Typ `HistorieEintrag`. Beide sind mit TK v2.8 ersatzlos
// gestrichen (TK 9.2.3). Der Q3-Protokolleintrag wird ALLEIN von der Auftragsverwaltung gebaut;
// der render-service liefert nur, was NUR ER weiss: Pfad, Ausgabename, Groesse und Gesamtdauer.
// `ausgabeName` ist der tatsaechlich verwendete Name OHNE Endung (TK v3.2, 9.2.3). Er reist NUR
// in `Auftrag.ergebnis` und geht NICHT in `ProtokollEintrag.ausgabe` – dort steckt er im Pfad.

export interface RenderProgress {
  renderId: string
  phase: 'normalisieren' | 'verketten'
  elementIndex: number | null
  elementAnzahl: number | null
  elementId: string | null
  prozent: number                  // 0–100
}
