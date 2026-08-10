// GENERIERT aus dem Signaturblock von Issue #14.
// [contracts] Typ Aktion definieren
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
// GERUEST-PRUEFSUMME: 6651925581150385

export interface Aktion {
  id: string
  titel: string                    // Pflicht
  beschreibung: string | null
  preis: string | null
  bildRef: string | null           // Referenz auf eine Asset-ID (NICHT eingebettet)
  cta: string | null
  standardDauer: number | null     // nur Vorgabe, s. TK 9.8.4
  vorlagenId: string
  akzentfarbe: string | null       // Rollen-Verweis in die Markenpalette, kein Hex;
                                   // null = kein Wert gewaehlt, dann gilt der Markenwert
}
