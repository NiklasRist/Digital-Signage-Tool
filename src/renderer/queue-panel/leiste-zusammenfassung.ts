// GENERIERT aus dem Signaturblock von Issue #206.
// [queue-panel] Die eingeklappte Zeile
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

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
