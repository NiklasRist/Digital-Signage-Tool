/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #233.
// [app-shell] Der Schnappschuss-Stapel für Rückgängig und Wiederherstellen
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
// GERUEST-PRUEFSUMME: a783d377c57364f1
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
