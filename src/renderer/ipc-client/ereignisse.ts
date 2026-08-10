/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #151.
// [ipc-client] Ereignisse des Main-Prozesses abonnieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

/**
 * Abonniert ein Ereignis des Main-Prozesses.
 * Rückgabewert ist die Abmelde-Funktion (Muster wie die main-interne Registrierung in #47/#65).
 */
export function abonniere<T>(
  kanal: string,
  hoerer: (nutzlast: T) => void,
): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #151."
  );
}
// - `kanal` MUSS aus der Kanal-Namens-Registry (#25) stammen; in DIESER Datei steht kein
//   Kanalname und kein Kanal-String
// - delegiert an window.api.on(kanal, handler) aus der Preload-Bridge (#4) und castet NUR den
//   Typ (keine Laufzeit-Transformation): die Nutzlast erreicht den Hörer genau so, wie der Main
//   sie gesendet hat
// - packt NICHTS aus: Ereignisse tragen keine Ergebnis-Hülle und keinen Endzustand
//   (TK 9.1.1, Punkte 2 und 5). Es gibt daher auch keinen Fehlerkanal und kein Ergebnis<T>
// - bei der ZUSTELLUNG einer Meldung wird nie geworfen (ein werfender Hörer wird abgefangen);
//   der Sonderfall „Bridge nicht verfügbar" beim Anmelden ist NICHT hier entschieden – s. STOPP
// - Aufruf der zurückgegebenen Funktion beendet das Abo; weitere Aufrufe sind wirkungslos
