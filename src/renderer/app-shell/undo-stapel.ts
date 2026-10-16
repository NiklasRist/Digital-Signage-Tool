// [app-shell] Der Schnappschuss-Stapel für Rückgängig und Wiederherstellen

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
  // ENTSCHIEDEN 7: Werte < 1 oder keine ganze Zahl (auch NaN) fallen still
  // auf UNDO_TIEFE zurueck - diese Datei hat keinen Fehlerausgang.
  const maximaleTiefe =
    typeof tiefe === 'number' && Number.isInteger(tiefe) && tiefe >= 1
      ? tiefe
      : UNDO_TIEFE

  // `zurueck` ist der Rueckgaengig-Zweig (ablegen stapelt VOR der Aenderung),
  // `vor` der Wiederherstellen-Zweig (leicht von vollzieheZurueck, ENTSCHIEDEN 2/8).
  const zurueck: T[] = []
  const vor: T[] = []

  return {
    ablegen(stand: T): void {
      zurueck.push(stand)
      // ENTSCHIEDEN 3: Liegt der Stapel ueber der Tiefe, faellt der AELTESTE
      // Stand vorne heraus - nie der juengste, den der Nutzer als naechstes
      // zuruecknehmen will.
      if (zurueck.length > maximaleTiefe) {
        zurueck.shift()
      }
      // ENTSCHIEDEN 2: Eine neue Aenderung verlaesst den alten Vorwaerts-Zweig.
      vor.length = 0
    },
    kannZurueck(): boolean {
      return zurueck.length > 0
    },
    kannVor(): boolean {
      return vor.length > 0
    },
    vorschauZurueck(): T | null {
      // Nur anschauen, nie veraendern (Fehlerpfad: leerer Zweig -> null).
      // SAFETY: der ternare Zweig hat zurueck.length > 0 belegt; der Cast benennt
      // diese belegte Elementform - der Wert wird nicht veraendert, nur gelesen.
      return zurueck.length === 0 ? null : (zurueck[zurueck.length - 1] as T)
    },
    vorschauVor(): T | null {
      // SAFETY: der ternare Zweig hat vor.length > 0 belegt; der Cast benennt diese
      // belegte Elementform - der Wert wird nicht veraendert, nur gelesen.
      return vor.length === 0 ? null : (vor[vor.length - 1] as T)
    },
    vollzieheZurueck(aktuell: T): void {
      // ENTSCHIEDEN 8: Bei leerem Zweig NICHTS tun - kein Wurf, und `aktuell`
      // wandert gerade NICHT in den Vorwaerts-Zweig.
      if (zurueck.length === 0) {
        return
      }
      zurueck.pop()
      vor.push(aktuell)
    },
    vollzieheVor(aktuell: T): void {
      // Fehlerpfad: leerer Wiederherstellen-Zweig ist wirkungslos, kein Wurf.
      if (vor.length === 0) {
        return
      }
      vor.pop()
      zurueck.push(aktuell)
    },
    leere(): void {
      zurueck.length = 0
      vor.length = 0
    },
    stand(): StapelStand {
      return { zurueck: zurueck.length, vor: vor.length }
    },
  }
}
