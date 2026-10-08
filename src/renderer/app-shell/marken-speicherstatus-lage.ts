// Issue #327 (M8) - marken-speicherstatus-lage.ts: der REINE Zustandsautomat
// des Marken-Speicherstatus. Ohne JSX, ohne React, ohne IPC, ohne Browser.
//
// DIE DREI Anzeigezustaende sind die ganze Aussage (ENTSCHIEDEN 3): der
// Anfangszustand 'unbekannt' zeigt NICHTS und ist NIEMALS eine Entwarnung -
// "Ereignisse vor dem Aufbau des Fensters verfallen still - es wird NICHT
// gepuffert (bindend)" (TK 9.1.1). Aus dem Ausbleiben einer Fehlermeldung folgt
// NICHT, dass alles in Ordnung ist; wer 'gespeichert' zeigte, behauptete einen
// Beweis, den es nicht gibt.
// Die Uebergangsfunktion ist REIN: Immer eine neue Lage, die Eingabe nie verändert.
// Es gibt KEIN Zurueckfallen auf 'unbekannt' und KEINEN Timer (ENTSCHIEDEN 6).

/** Ereignisform, wie #278 im Main definiert (MarkenSpeichernEreignis) - KEINE
 *  Ergebnis-Huelle (TK 9.1.1 Punkte 2 und 5). code als string: die fachliche
 *  Union MarkenFehlercode liegt im Main und wird vom Renderer nicht importiert. */
export type MarkenSpeicherEreignis =
  | { typ: 'gespeichert' }
  | { typ: 'fehler'; code: string }

/** DREI Werte - nicht zwei. 'unbekannt' bedeutet: es ist noch keine Meldung
 *  eingetroffen. Er wird NIE als 'gespeichert' angezeigt. */
export type MarkenAnzeigezustand = 'unbekannt' | 'gespeichert' | 'nicht_gespeichert'

export interface MarkenSpeicherlage {
  zustand: MarkenAnzeigezustand
  letzterFehlercode: string | null
}

/** { zustand: 'unbekannt', letzterFehlercode: null } – der Wächter gegen die
 *  stille Falschaussage (ENTSCHIEDEN 3, dieselbe Regel wie #126 und #200). */
export const MARKEN_ANFANGSLAGE: MarkenSpeicherlage = {
  zustand: 'unbekannt',
  letzterFehlercode: null,
}

/** Reine Übergangsfunktion. Liefert IMMER eine neue Lage; die Eingabe wird nie verändert. */
export function verarbeiteMarkenSpeicherEreignis(
  lage: MarkenSpeicherlage,
  ereignis: MarkenSpeicherEreignis,
): MarkenSpeicherlage {
  if (ereignis.typ === 'gespeichert') {
    return { zustand: 'gespeichert', letzterFehlercode: null }
  }
  // error: der Code wird UNVERÄNDERT gemerkt (keine Übersetzung, ENTSCHIEDEN 5),
  // zwei Fehler nacheinander tragen den ZULETZT gemeldeten Code.
  return { zustand: 'nicht_gespeichert', letzterFehlercode: ereignis.code }
}

/** Zeigt die Oberfläche einen Hinweis? Genau dann, wenn der Zustand
 *  'nicht_gespeichert' ist. 'unbekannt' zählt NICHT als Hinweis und NICHT als
 *  Entwarnung. */
export function zeigtMarkenHinweis(lage: MarkenSpeicherlage): boolean {
  return lage.zustand === 'nicht_gespeichert'
}

/** Der sichtbare Text des Hinweises (ENTSCHIEDEN 4, vom User praezisiert
 *  23.08.): die AUTOMATIK-Speicherung ist gescheitert. EINE Stelle - der Text
 *  wird nirgends ein zweites Mal hingeschrieben. */
export const MARKEN_HINWEIS_TEXT =
  'Automatisches Speichern der Marken fehlgeschlagen – Änderungen sind noch nicht gesichert.'
