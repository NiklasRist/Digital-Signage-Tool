// GENERIERT aus dem Signaturblock von Issue #276.
// [marken-store] Fehlercode-Union des Moduls definieren
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
// GERUEST-PRUEFSUMME: 5e4af1e31fdbadbb

/**
 * Fachliche Fehlercodes des marken-store (TK 9.15.5).
 *
 * `ungueltige_eingabe` steht hier BEWUSST NICHT: Sie kommt über den zweiten Typparameter von
 * Ergebnis (#12/#22) automatisch dazu, ebenso `nicht_gefunden` und `unbekannter_fehler`. TK 9.15.5
 * fuehrt sie in der GLEICHEN Tabelle wie die vier folgenden Codes auf, aber das Modul definiert
 * ausdruecklich eine EIGENE, fachlich schaerfere Variante von "nicht gefunden"
 * (marke_nicht_gefunden statt des generischen nicht_gefunden) - beide existieren nebeneinander,
 * s. Invarianten. Eine Wiederholung der drei generischen Codes hier erzeugte zwei Quellen fuer
 * denselben Wert.
 */
export type MarkenFehlercode =
  | 'marke_referenziert'
  | 'marke_eingebaut'
  | 'marke_nicht_gefunden'
  | 'marken_datei_fehlt'
  | 'speicher_fehler'
