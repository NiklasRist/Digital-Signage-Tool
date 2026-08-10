// GENERIERT aus dem Signaturblock von Issue #78.
// [contracts] Typen ImportRequest und LöschRequest definieren
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
// GERUEST-PRUEFSUMME: 705b1d61d074500b

/** Nutzlast des Auftrags art: 'import' (TK 9.4.3). */
export interface ImportRequest {
  projektId: string
  quellPfad: string
}

/** Nutzlast des Auftrags art: 'loeschen' (TK 9.4.3). */
export interface LöschRequest {
  projektId: string
  assetId: string
}
