// GENERIERT aus dem Signaturblock von Issue #121.
// [composer] Projektzustand laden und als Sicht halten
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Project, Listenelement } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

export interface Projektsicht {
  projekt: Project | null          // null = noch kein Projekt geladen
  ladefehler: { code: string; meldung: string } | null
}

/** Lädt ein Projekt über den IPC-Vertrag und macht es zur aktuellen Sicht. */
export async function ladeProjekt(projektId: string): Promise<Ergebnis<Project>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #121."
  );
}

/** Momentaufnahme der Sicht. Der zurückgegebene Wert wird NIE verändert (s. Invarianten). */
export function holeSicht(): Projektsicht {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #121."
  );
}

/** Ersetzt die Liste der Sicht vollständig – benutzt für den optimistischen Schritt UND für den
 *  Rollback auf einen zuvor mit holeSicht() genommenen Stand. */
export function setzeListe(liste: Listenelement[]): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #121."
  );
}

/** Ersetzt genau ein Listenelement anhand seiner id durch den vom Store zurückgegebenen Stand. */
export function gleicheElementAb(element: Listenelement): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #121."
  );
}

/** Ersetzt das gesamte Projekt (nach dem Laden und nach Operationen, die ein Projekt liefern). */
export function setzeProjekt(projekt: Project): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #121."
  );
}

/** Setzt die Sicht in den Zustand „kein Projekt geladen" zurück: `projekt` und `ladefehler`
 *  werden `null`. Kein Eingang, kein Rückgabewert. Zu rufen, wo ein Projekt aufhört, offen zu
 *  sein, ohne dass ein anderes an seine Stelle tritt (TK 9.7.4). */
export function leereProjektSicht(): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #121."
  );
}

/** Abonnement für Sicht-Änderungen; Rückgabewert ist die Abmelde-Funktion. */
export function aufSichtGeaendert(hoerer: (sicht: Projektsicht) => void): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #121."
  );
}
