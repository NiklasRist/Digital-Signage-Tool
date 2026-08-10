// GENERIERT aus dem Signaturblock von Issue #235.
// [app-shell] Rückgängig und Wiederherstellen in der Projekt-Bearbeitung anwenden
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Project, Bearbeitungsstand } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { projektHistorie, leereProjektHistorie, type ProjektStand } from './undo-historien'

/**
 * Der Zugang zur gemeinsamen Projekt-Sicht. Wird als PARAMETER übergeben (Entscheidung E1,
 * #197) – diese Datei importiert KEINE Sicht aus einem anderen Renderer-Modul.
 */
export interface ProjektUndoZugang {
  /** Das aktuell geladene Projekt; null, wenn keins offen ist. Aus #197: projekt.hole().projekt */
  holeProjekt: () => Project | null
  /** Ersetzt das Projekt in der gemeinsamen Sicht (#121, über #197). */
  setzeProjekt: (projekt: Project) => void
}

/** Was ein Rückgängig/Wiederherstellen bewirkt hat. */
export type UndoWirkung =
  | { art: 'nichts_zu_tun' }
  | { art: 'angewendet'; projekt: Project }

/**
 * Legt den JETZIGEN Stand des geladenen Projekts als Schnappschuss ab.
 * VOR jeder Instant-Operation der Projekt-Bearbeitung aufzurufen (TK 9.13.2).
 * Ohne geladenes Projekt geschieht nichts.
 */
export function merkeVorAenderung(zugang: ProjektUndoZugang): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #235."
  );
}

/** Ob ein Rückgängig gerade angeboten werden darf (Stand vorhanden UND zum offenen Projekt). */
export function kannRueckgaengig(zugang: ProjektUndoZugang): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #235."
  );
}

/** Gegenstück für das Wiederherstellen. */
export function kannWiederherstellen(zugang: ProjektUndoZugang): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #235."
  );
}

/** Schreibt den vorherigen Schnappschuss über setzeBearbeitungsstand zurück. */
export async function macheRueckgaengig(
  zugang: ProjektUndoZugang,
): Promise<Ergebnis<UndoWirkung, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #235."
  );
}

/** Schreibt den zuvor zurückgenommenen Schnappschuss wieder vor. */
export async function stelleWiederHer(
  zugang: ProjektUndoZugang,
): Promise<Ergebnis<UndoWirkung, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #235."
  );
}
