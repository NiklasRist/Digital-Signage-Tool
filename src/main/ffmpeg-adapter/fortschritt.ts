/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #160.
// [ffmpeg-adapter] Fortschritt aus der ffmpeg-Ausgabe lesen und drosseln
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
// GERUEST-PRUEFSUMME: 38df4b01c843f32f
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

export interface FortschrittsLeser {
  /**
   * Nimmt EINE Zeile der ffmpeg-Standardausgabe entgegen.
   * Liefert einen Prozentwert 0..100 (ganzzahlig), wenn jetzt ein Wert gemeldet werden soll,
   * sonst null (Zeile uninteressant ODER Drosselung greift).
   * `jetztMs` ist die Zeitquelle - sie wird HINEINGEREICHT, nicht in dieser Datei gelesen.
   */
  nimmZeile(zeile: string, jetztMs: number): number | null
}

/**
 * Erzeugt einen Leser fuer GENAU EINEN ffmpeg-Aufruf.
 * `erwarteteDauerSekunden` ist die Solldauer des Ergebnisses DIESES Aufrufs.
 * Ist sie <= 0, nicht endlich oder keine Zahl, liefert der Leser dauerhaft null -
 * er rechnet dann nicht, statt zu raten.
 */
export function erzeugeFortschrittsLeser(erwarteteDauerSekunden: number): FortschrittsLeser {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #160."
  );
}
