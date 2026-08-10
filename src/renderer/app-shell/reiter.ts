// GENERIERT aus dem Signaturblock von Issue #194.
// [app-shell] Reiter-Zustand und Reiterwechsel
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

/** Die vier Modus-Reiter (TK 9.14.1). Werte wörtlich aus #10 übernommen – s. „Fremde Signaturen". */
export type ReiterId = 'zusammenstellen' | 'aktionen' | 'vorlagen' | 'projekte'

/** Anzeigereihenfolge der Reiterleiste, exakt wie in der Skizze TK 9.14.1. */
export const REITER_REIHENFOLGE: readonly ReiterId[] = (() => {
  throw new Error(
    "Noch nicht umgesetzt - Wert gehoert zu Issue #194."
  );
})();

/** Der Reiter, in dem die App startet, wenn kein Projekt wiederhergestellt werden konnte
 *  (TK 9.14.2/9.14.3): 'projekte'. */
export const START_REITER_OHNE_PROJEKT: ReiterId = (() => {
  throw new Error(
    "Noch nicht umgesetzt - Wert gehoert zu Issue #194."
  );
})();

/** Der Reiter, in den nach dem Öffnen eines Projekts gewechselt wird (TK 9.14.3): 'zusammenstellen'. */
export const REITER_NACH_PROJEKT_OEFFNEN: ReiterId = (() => {
  throw new Error(
    "Noch nicht umgesetzt - Wert gehoert zu Issue #194."
  );
})();

/** Der aktuell aktive Reiter. Vor dem ersten wechsleReiter(): START_REITER_OHNE_PROJEKT. */
export function holeReiter(): ReiterId {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #194."
  );
}

/** Setzt den aktiven Reiter und benachrichtigt alle Hörer. Ist `ziel` bereits aktiv, geschieht
 *  NICHTS – kein Hörer wird gerufen (s. ENTSCHIEDEN 3). */
export function wechsleReiter(ziel: ReiterId): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #194."
  );
}

/** Abonnement für Reiterwechsel; Rückgabewert ist die Abmelde-Funktion.
 *  Der Hörer wird beim Anmelden NICHT sofort mit dem aktuellen Wert gerufen (s. ENTSCHIEDEN 4). */
export function aufReiterGeaendert(hoerer: (aktiv: ReiterId) => void): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #194."
  );
}

/** Typwächter für Werte aus der Konfiguration (UI-Voreinstellung, `unknown`). */
export function istGueltigerReiter(wert: unknown): wert is ReiterId {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #194."
  );
}

/** NUR für Tests: setzt den Modul-Zustand auf den Anfangswert zurück und entfernt alle Hörer. */
export function setzeReiterZustandZurueck(): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #194."
  );
}
