/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #194.
// [app-shell] Reiter-Zustand und Reiterwechsel
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
// GERUEST-PRUEFSUMME: 7ece686bc4218b9f
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
