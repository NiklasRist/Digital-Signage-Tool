/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #207.
// [queue-panel] Die aufgeklappte Liste
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
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

import type { Auftrag, AuftragArt, AuftragStatus } from '../../shared/contracts/auftrag'
import type { AuftragsSicht } from './auftrags-sicht'

export interface AuftragsZeile {
  auftragId: string
  art: AuftragArt
  status: AuftragStatus
  /** UI-Klartext aus dem Main, unveraendert uebernommen (TK 9.3.1). */
  label: string
  /** Zustand in Klartext: „laeuft", „wartet", „fehlgeschlagen", „fertig", „abgebrochen". */
  zustandText: string
  /** 0–100 oder null (unbestimmt bzw. laeuft nicht). Kein Ersatzwert 0. */
  fortschritt: number | null
  /** Rohdaten des Fehlers, UNUEBERSETZT – die Uebersetzung macht #211. */
  fehler: { code: string; meldung: string; daten?: unknown } | null
  /** Anzahl bisher tatsaechlich gestarteter Ausfuehrungen (TK 9.3.1); 0 = nie gelaufen. */
  versuche: number
  /** Der vollstaendige Auftrag – fuer die Schalter aus #209/#210. */
  auftrag: Auftrag
}

export type ListenInhalt =
  | { zustand: 'unbekannt' }
  | { zustand: 'fehler'; code: string; meldung: string }
  | { zustand: 'leer' }
  | { zustand: 'zeilen'; zeilen: AuftragsZeile[] }

/** Rein. Baut aus der Sicht die Zeilen – in der gelieferten Reihenfolge, ohne zu sortieren. */
export function baueListenInhalt(sicht: AuftragsSicht): ListenInhalt {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #207."
  );
}
