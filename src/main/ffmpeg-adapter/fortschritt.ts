// GENERIERT aus dem Signaturblock von Issue #160.
// [ffmpeg-adapter] Fortschritt aus der ffmpeg-Ausgabe lesen und drosseln
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

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
