/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #126.
// [composer] Optimistische Bedienung und die zwei Fehlerklassen
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
// GERUEST-PRUEFSUMME: 3af93178ee04837a
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

import type { Ergebnis } from '../../shared/contracts/ergebnis'

/** Ereignisform des Auto-Speicherns, wie sie #47 im Main definiert (dort:
 *  `AutoSpeichernEreignis`). Sie trägt KEINE Ergebnis-Hülle – Ereignisse tragen keine (TK 9.1.1). */
export type SpeicherEreignis =
  | { typ: 'gespeichert' }
  | { typ: 'fehler'; code: string }

/** DREI Werte - nicht zwei. `'unbekannt'` ist der Ausgangswert und bedeutet: es ist noch keine
 *  Meldung eingetroffen. Er wird NIE als „gespeichert" dargestellt (ENTSCHIEDEN 3). */
export interface Speicherzustand {
  zustand: 'unbekannt' | 'gespeichert' | 'nicht_gespeichert'
  //   'unbekannt'         = kein Ereignis empfangen -> die Oberflaeche zeigt NICHTS an
  //   'gespeichert'       = zuletzt gemeldet { typ: 'gespeichert' } -> kein Hinweis
  //   'nicht_gespeichert' = zuletzt gemeldet { typ: 'fehler' }      -> dauerhafter Hinweis
  letzterFehlercode: string | null
}

export interface InlineMeldung {
  code: string
  meldung: string
}

/** Klasse 1: optimistisch anwenden, bestätigen lassen, bei Ablehnung zurücknehmen. */
export async function fuehreOptimistischAus<T>(
  anwenden: () => void,
  zuruecknehmen: () => void,
  bestaetigen: () => Promise<Ergebnis<T>>,
): Promise<Ergebnis<T>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #126."
  );
}

/** Abonnement der Inline-Meldungen aus Klasse 1; Rückgabewert ist die Abmelde-Funktion. */
export function aufInlineMeldung(hoerer: (meldung: InlineMeldung) => void): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #126."
  );
}

/** Klasse 2: verbindet den Speicherstatus-Strom des Main. Die Abo-Funktion wird ÜBERGEBEN –
 *  der Aufrufer bildet sie aus `abonniere` (#151); diese Datei kennt keinen Kanalnamen. */
export function verbindeSpeicherstatus(
  abonniere: (hoerer: (ereignis: SpeicherEreignis) => void) => () => void,
): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #126."
  );
}

export function holeSpeicherzustand(): Speicherzustand {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #126."
  );
}

/** Abonnement des Speicherzustands; Rückgabewert ist die Abmelde-Funktion. */
export function aufSpeicherzustand(hoerer: (zustand: Speicherzustand) => void): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #126."
  );
}
