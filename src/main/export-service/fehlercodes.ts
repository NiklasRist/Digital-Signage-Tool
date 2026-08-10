// GENERIERT aus dem Signaturblock von Issue #182.
// [export-service] Fehlercode-Union des Moduls definieren
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
// GERUEST-PRUEFSUMME: 14e4aa8b8416d628

/**
 * Die fachlichen Fehlercodes des `export-service`.
 * Geschlossener Satz – wörtliche Abschrift der Tabelle TK 9.6.4.
 * Die drei generischen Codes (`ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`)
 * stehen hier ABSICHTLICH NICHT: Sie kommen über `Ergebnis<T, F>` bzw. `HandlerErgebnis<F>`
 * als `F | GenerischerFehlercode` automatisch dazu (#22, #60).
 */
export type ExportFehlercode =
  | 'keine_ausgabe'
  | 'ziel_nicht_verfügbar'
  | 'datei_zu_gross_fat32'
  | 'kein_platz'
  | 'ziel_gesperrt'
  | 'schreib_fehler'
  | 'speicher_fehler'
