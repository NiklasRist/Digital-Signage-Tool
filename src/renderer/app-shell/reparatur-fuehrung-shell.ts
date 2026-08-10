// GENERIERT aus dem Signaturblock von Issue #201.
// [app-shell] Den Reparatur-Modus über den Reiterwechsel führen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { ReparaturStand } from '../composer/reparatur-fuehrung'
import type { Uebergabe } from '../composer/reparatur-optionen'
import type { ReiterId } from './reiter'

/** Wohin die laufende Übergabe führt. Overlays bleiben im aktuellen Reiter. */
export type UebergabeZiel = Uebergabe | null

/** Der vollständige Reparatur-Zustand der Shell. Ein WERT – keine Funktion mutiert ihn. */
export interface ShellReparatur {
  /** Der Stand aus #132; null, solange nie gestartet wurde. */
  stand: ReparaturStand | null
  /** Die laufende Übergabe (Overlay oder Reiterwechsel); null, wenn keine läuft. */
  laufendeUebergabe: UebergabeZiel
  /** Die im action-editor hervorzuhebende Aktion; null, wenn dorthin nicht übergeben wurde. */
  hervorgehobeneAktionId: string | null
  /** Der Reiter, in den nach der Übergabe zurückgekehrt wird; null, wenn kein Wechsel stattfand. */
  rueckkehrReiter: ReiterId | null
}

/** Beide Quellen leer – kein Modus, keine Übergabe, keine Hervorhebung. */
export const LEERE_SHELL_REPARATUR: ShellReparatur = (() => {
  throw new Error(
    "Noch nicht umgesetzt - Wert gehoert zu Issue #201."
  );
})();

/** Ein Reiterwechsel, den der Aufrufer ausführen soll. null = im aktuellen Reiter bleiben. */
export interface FuehrungsSchritt {
  lage: ShellReparatur
  wechselZu: ReiterId | null
}

/** Nimmt eine Uebergabe aus #133 entgegen und sagt, ob dafür der Reiter zu wechseln ist. */
export function uebernimmUebergabe(
  lage: ShellReparatur,
  an: Uebergabe,
  aktiverReiter: ReiterId,
): FuehrungsSchritt {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #201."
  );
}

/** Beendet die laufende Übergabe (abgeschlossen ODER abgebrochen) und sagt, wohin
 *  zurückzukehren ist. */
export function beendeUebergabe(lage: ShellReparatur): FuehrungsSchritt {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #201."
  );
}

/** Übernimmt einen gerechneten Stand aus #132 – den ERSTEN (`starteReparatur`) wie jeden
 *  weiteren (`aktualisiereReparatur`). Der geführte Modus BEGINNT damit; eine eigene
 *  `starteFuehrung` gibt es nicht (ENTSCHIEDEN 8). */
export function uebernimmStand(lage: ShellReparatur, stand: ReparaturStand): ShellReparatur {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #201."
  );
}

/** Verlässt den geführten Modus. Die Render-Sperre bleibt bestehen (das entscheidet #132). */
export function beendeFuehrung(lage: ShellReparatur): ShellReparatur {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #201."
  );
}

/** Das Ziel einer Übergabe auf einen Reiter abbilden. null = kein Reiterwechsel nötig. */
export function reiterFuerUebergabe(an: Uebergabe): ReiterId | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #201."
  );
}
