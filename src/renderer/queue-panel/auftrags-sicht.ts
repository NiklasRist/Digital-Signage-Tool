/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #205.
// [queue-panel] Auftrags-Sicht: erst holen, dann abonnieren
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

import type { Auftrag } from '../../shared/contracts/auftrag'

/**
 * Der Zustand der Auftrags-Sicht. `unbekannt` ist der ANFANGSZUSTAND und bedeutet
 * „noch nicht geholt" – ausdruecklich NICHT „keine Auftraege".
 */
export type AuftragsSicht =
  | { zustand: 'unbekannt' }
  | { zustand: 'geladen'; auftraege: Auftrag[] }
  | { zustand: 'fehler'; code: string; meldung: string }

export const ANFANGS_SICHT: AuftragsSicht = { zustand: 'unbekannt' }

/**
 * Baut die Auftrags-Sicht auf: holt EINMAL den vollen Stand und abonniert ERST DANACH
 * `queue:geaendert`. Jeder neue Stand geht ueber `setzeSicht` hinaus.
 *
 * Kehrt SYNCHRON zurueck und liefert die Abbau-Funktion. Der Aufruf der Abbau-Funktion
 * meldet ein bereits bestehendes Abonnement ab und verhindert, dass ein noch laufendes
 * `holeStand` danach noch abonniert oder `setzeSicht` ruft.
 */
export function baueAuftragsSichtAuf(
  setzeSicht: (sicht: AuftragsSicht) => void,
): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #205."
  );
}
