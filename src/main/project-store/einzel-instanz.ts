/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #51.
// [project-store] Einzel-Instanz-Sperre, gebunden an den Datenort
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

export function erzwingeEinzelInstanz(
  datenOrt: string,
  beiZweitemStart: () => void,
): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #51."
  );
}
// MUSS aufgerufen werden, BEVOR app.whenReady() abgewartet bzw. das erste BrowserWindow erzeugt
// wird (#3, src/main/index.ts).
// Rückgabe false: eine andere Instanz haelt die Sperre für DIESEN datenOrt bereits. Der Aufrufer
// MUSS unmittelbar app.quit() aufrufen und darf KEIN Fenster mehr erzeugen.
// Rückgabe true: diese Instanz haelt die Sperre. beiZweitemStart() wird aufgerufen, sobald ein
// weiterer Prozess mit demselben datenOrt zu starten versucht (Zeitpunkt: nach dieser Instanz).
