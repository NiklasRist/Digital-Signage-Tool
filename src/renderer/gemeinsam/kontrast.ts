/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #292.
// [gemeinsam] Kontrast-Rechnung als geteilte Funktion
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
// GERUEST-PRUEFSUMME: 21f0bf366ced9a1b
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
 * WCAG-Kontrastverhältnis zwischen zwei Farben, im Bereich [1, 21]. Reine Funktion.
 * Nimmt BEIDE zulässigen Hex-Formen entgegen: 6-stellig `#RRGGBB` UND 8-stellig `#RRGGBBAA`
 * (Groß-/Kleinschreibung gleichgültig). Ein 8-stelliger Wert WIRFT NICHT; sein Alphakanal wird
 * für die Rechnung IGNORIERT - gerechnet wird auf den RGB-Anteilen.
 *
 * WARUM das Ignorieren hier vertretbar ist - dieser Absatz gehört in den Quelltext, nicht nur ins
 * Issue: Ein Kontrastverhältnis ist nur zwischen ZWEI DECKENDEN Farben definiert; was hinter einer
 * teiltransparenten Farbe liegt, ist ein beliebiges Foto. Die Rollen, die tatsächlich in diese
 * Funktion gehen, sind semantisch deckend (`akzent`, `textAufDunkel`, `textAufHell`,
 * `aktion.akzentfarbe`); die beiden Rollen der eingebauten Marke MIT Alpha - `scrimStart`
 * (`#00000000`) und `scrimEnde` (`#000000B3`) - sind Verlaufsfarben und erreichen die
 * Kontrastrechnung NIE. Und die Kontrastprüfung WARNT nur, sie sperrt nicht: FA-24 sagt wörtlich,
 * die Anwendung "warnt ... verhindert die Wahl aber nicht". Eine BENANNTE Näherung für eine
 * Warnung ist vertretbar; eine Ausnahme, die mitten in der Oberfläche fliegt, ist es nicht -
 * `marke.farben` DARF laut TK 9.11.2 achtstellig sein, und die Farb-Rollen sind über #296
 * bearbeitbar. Der Alphakanal wird deshalb IGNORIERT und NICHT gegen einen angenommenen
 * Hintergrund vorgemischt: Welcher Hintergrund "durchscheint", wüsste diese Funktion nicht, und
 * eine erfundene Annahme wäre eine unbenannte Näherung.
 */
export function kontrastVerhaeltnis(farbeA: string, farbeB: string): number {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #292."
  );
}

/**
 * Liefert kandidatA oder kandidatB - je nachdem, wer das HÖHERE kontrastVerhaeltnis zu `hintergrund`
 * erreicht. Bei exakter Gleichheit (selten, aber möglich bei symmetrischen Grauwerten) gewinnt
 * kandidatA. Braucht KEINEN Schwellenwert - eine reine Wahl zwischen zwei Optionen.
 * Zulässige Eingaben wie bei `kontrastVerhaeltnis`: 6- UND 8-stelliges Hex, Alpha ignoriert.
 * Der zurückgegebene Kandidat bleibt die ÜBERGEBENE Zeichenkette - auch ein 8-stelliger Wert wird
 * unverändert zurückgegeben und NICHT auf sechs Stellen gekürzt.
 */
export function waehleBesserenKontrast(hintergrund: string, kandidatA: string, kandidatB: string): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #292."
  );
}

/**
 * Liefert true, wenn kontrastVerhaeltnis(vordergrund, hintergrund) >= schwellenwert.
 * `schwellenwert` ist PFLICHT-Parameter, KEIN Vorgabewert und KEINE Konstante in dieser Datei.
 * Der Zahlenwert ist seit TK v3.10 entschieden (4,5:1, WCAG AA) und steht als KONTRAST_SCHWELLE
 * in src/shared/contracts/konstanten.ts (#320). Gelesen wird sie dort NICHT von hier, sondern
 * von der Editor-Wurzel (#330) - diese Funktion bleibt reine Rechnung ohne Vertragsimport.
 * Zulässige Eingaben wie bei `kontrastVerhaeltnis`: 6- UND 8-stelliges Hex, Alpha ignoriert.
 */
export function erreichtKontrastSchwelle(
  vordergrund: string, hintergrund: string, schwellenwert: number,
): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #292."
  );
}
