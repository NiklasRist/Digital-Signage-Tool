// GENERIERT aus dem Signaturblock von Issue #200.
// [app-shell] Der dauerhafte Hinweis „nicht gespeichert"
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
// GERUEST-PRUEFSUMME: 0644db1b050844a0

// src/renderer/app-shell/speicherstatus-lage.ts   (rein, kein JSX, kein React, kein IPC)

/** Ereignisform des Auto-Speicherns, wie sie #47 im Main definiert (dort: `AutoSpeichernEreignis`).
 *  Sie trägt KEINE Ergebnis-Hülle – Ereignisse tragen keine (TK 9.1.1 Punkte 2 und 5).
 *  Der Kanal `vorlagen:autoSpeichernStatus` ist laut TK 9.12.1 „gleichartig" und nutzt dieselbe Form. */
export type SpeicherEreignis =
  | { typ: 'gespeichert' }
  | { typ: 'fehler'; code: string }

/** Welcher Speicher gemeldet hat. Zwei getrennte Quellen, zwei getrennte Anzeigen. */
export type Speicherquelle = 'projekt' | 'vorlagen'

/** DREI Werte – nicht zwei. 'unbekannt' ist der Anfangszustand und bedeutet: es ist noch keine
 *  Meldung eingetroffen. Er wird NIE als 'gespeichert' angezeigt. */
export type Anzeigezustand = 'unbekannt' | 'gespeichert' | 'nicht_gespeichert'

export interface Speicherlage {
  projekt: { zustand: Anzeigezustand; letzterFehlercode: string | null }
  vorlagen: { zustand: Anzeigezustand; letzterFehlercode: string | null }
}

/** Beide Quellen auf 'unbekannt', beide Codes null. */
export const ANFANGSLAGE: Speicherlage = {
  projekt: { zustand: 'unbekannt', letzterFehlercode: null },
  vorlagen: { zustand: 'unbekannt', letzterFehlercode: null },
};

/** Reine Übergangsfunktion. Liefert IMMER eine neue Lage; die Eingabe wird nie verändert. */
export function verarbeiteSpeicherEreignis(
  lage: Speicherlage,
  quelle: Speicherquelle,
  ereignis: SpeicherEreignis,
): Speicherlage {
  if (ereignis.typ === 'gespeichert') {
    return {
      ...lage,
      [quelle]: { zustand: 'gespeichert', letzterFehlercode: null },
    };
  }

  return {
    ...lage,
    [quelle]: { zustand: 'nicht_gespeichert', letzterFehlercode: ereignis.code },
  };
}

/** Zeigt die Oberfläche einen Hinweis? Genau dann, wenn mindestens eine Quelle
 *  'nicht_gespeichert' ist. 'unbekannt' zählt NICHT als Hinweis und NICHT als Entwarnung. */
export function zeigtHinweis(lage: Speicherlage): boolean {
  return (
    lage.projekt.zustand === 'nicht_gespeichert' ||
    lage.vorlagen.zustand === 'nicht_gespeichert'
  );
}

/** Die Quellen, die gerade 'nicht_gespeichert' sind – in der festen Reihenfolge projekt, vorlagen. */
export function betroffeneQuellen(lage: Speicherlage): Speicherquelle[] {
  const quellen: Speicherquelle[] = [];
  if (lage.projekt.zustand === 'nicht_gespeichert') {
    quellen.push('projekt');
  }
  if (lage.vorlagen.zustand === 'nicht_gespeichert') {
    quellen.push('vorlagen');
  }
  return quellen;
}
