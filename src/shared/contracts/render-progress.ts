// [contracts] Typ RenderProgress in eine eigene Datei ziehen und schärfen

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
