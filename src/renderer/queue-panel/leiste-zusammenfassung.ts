/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #206.
// [queue-panel] Die eingeklappte Zeile
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
// GERUEST-PRUEFSUMME: 3ce27197f84965bf
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

import type { Auftrag } from '../../shared/contracts/auftrag'
import type { AuftragsSicht } from './auftrags-sicht'

/** Wie die Leiste optisch auftreten soll. `hervorgehoben` = es gibt mindestens einen Fehlschlag. */
export type LeistenTon = 'ruhig' | 'aktiv' | 'hervorgehoben' | 'unbekannt'

export interface LeistenZusammenfassung {
  /** Die eine Zeile, fertig zusammengesetzt. Nie leer. */
  text: string
  ton: LeistenTon
  /** Fortschritt des laufenden Auftrags, 0–100, oder null (unbestimmt bzw. nichts laeuft). */
  fortschritt: number | null
  /** Anzahl der anstehenden Auftraege (ohne den laufenden). */
  anstehend: number
  /** Anzahl der fehlgeschlagenen Auftraege. */
  fehlgeschlagen: number
  /** Der laufende Auftrag, falls einer laeuft – fuer das Label der Zeile. */
  laufender: Auftrag | null
}

export function fasseZusammen(sicht: AuftragsSicht): LeistenZusammenfassung {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #206."
  );
}
