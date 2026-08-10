// GENERIERT aus dem Signaturblock von Issue #157.
// [contracts] Typ RenderProgress in eine eigene Datei ziehen und schärfen
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
// GERUEST-PRUEFSUMME: 0bee9cb479a2fcc4

/**
 * Nutzlast des Ereignisses `render:fortschritt` (Main → Renderer, TK 9.2.7).
 * Ereignisse tragen KEINE Ergebnis-Hülle und KEINEN Endzustand (TK 9.1.1 Punkt 5).
 * Reine Laufzeitdaten – nichts davon wird persistiert.
 */
export interface RenderProgress {
  /** Lauf, auf den sich das Ereignis bezieht. Vom Renderer vergeben (TK 9.2.1). */
  renderId: string
  /** Phase des Laufs. */
  phase: 'normalisieren' | 'verketten'
  /** k von n – gesetzt in Phase 'normalisieren'; in 'verketten' null (ein Gesamtschritt). */
  elementIndex: number | null
  /** n – gesetzt in Phase 'normalisieren'; in 'verketten' null. */
  elementAnzahl: number | null
  /** aktuelles RenderItem zur UI-Markierung; laut TK optional -> null, wenn nicht zuordenbar. */
  elementId: string | null
  /** grober Gesamtfortschritt 0-100. Schaetzung, darf springen, nie <0, nie >100. */
  prozent: number
}
