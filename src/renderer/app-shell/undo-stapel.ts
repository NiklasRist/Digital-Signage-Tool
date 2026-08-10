// GENERIERT aus dem Signaturblock von Issue #233.
// [app-shell] Der Schnappschuss-Stapel für Rückgängig und Wiederherstellen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

/** Die vom Vertrag vorgegebene Tiefe: TK 9.13.2 nennt „Größenordnung 50 Schritte". */
export const UNDO_TIEFE = 50

/** Wie viele Stände gerade zurück- bzw. vorwärtsführen. Nur für Anzeige und Tests. */
export interface StapelStand {
  zurueck: number
  vor: number
}

/**
 * Ein wertbasierter Schnappschuss-Stapel über einem beliebigen Datensatz T.
 * Kennt T nicht: kein Vergleich, keine Kopie, keine Serialisierung.
 */
export interface UndoStapel<T> {
  /** Legt den Stand VOR einer Änderung ab. Leert dabei den Wiederherstellen-Zweig. */
  ablegen(stand: T): void

  kannZurueck(): boolean
  kannVor(): boolean

  /** Der Stand, der bei einem Rückgängig gelten würde – OHNE den Stapel zu verändern.
   *  `null`, wenn nichts zurückführt. */
  vorschauZurueck(): T | null

  /** Der Stand, der bei einem Wiederherstellen gelten würde – OHNE den Stapel zu verändern.
   *  `null`, wenn nichts vorwärtsführt. */
  vorschauVor(): T | null

  /** Vollzieht das Rückgängig: NUR aufrufen, nachdem der Stand aus vorschauZurueck()
   *  erfolgreich angewendet wurde. `aktuell` ist der Stand, der dabei ersetzt wurde. */
  vollzieheZurueck(aktuell: T): void

  /** Gegenstück zu vollzieheZurueck für das Wiederherstellen. */
  vollzieheVor(aktuell: T): void

  /** Leert BEIDE Zweige. Nach TK 9.13.3 und bei Projektwechsel/Editor-Schluss (TK 9.13.2). */
  leere(): void

  stand(): StapelStand
}

/**
 * Erzeugt einen neuen, leeren Stapel. Jeder Aufruf liefert eine EIGENE Instanz –
 * diese Datei hält KEINEN Modul-Zustand (s. ENTSCHIEDEN 1).
 */
export function erzeugeUndoStapel<T>(tiefe?: number): UndoStapel<T> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #233."
  );
}
