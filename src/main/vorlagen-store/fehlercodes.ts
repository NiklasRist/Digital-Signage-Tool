// GENERIERT aus dem Signaturblock von Issue #97.
// [vorlagen-store] Fehlercode-Union des Moduls definieren
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
// GERUEST-PRUEFSUMME: c2090ffb2b7664d5

/**
 * Fachliche Fehlercodes des vorlagen-store (TK 9.12.1).
 *
 * Die drei generischen Codes (ungueltige_eingabe, nicht_gefunden, unbekannter_fehler) stehen hier
 * BEWUSST NICHT – sie kommen ueber den zweiten Typparameter von Ergebnis (#22) automatisch dazu.
 * Eine Wiederholung erzeugte zwei Quellen fuer denselben Wert.
 */
export type VorlagenFehlercode =
  | 'vorlage_referenziert'
  | 'parent_eingebaut'
  | 'speicher_fehler'
