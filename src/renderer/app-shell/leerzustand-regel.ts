// [app-shell] Leerzustände ohne offenes Projekt
//
// src/renderer/app-shell/leerzustand-regel.ts   (rein, kein JSX, kein React)
import type { ReiterId } from './reiter'

/**
 * Zeigt dieser Reiter ohne offenes Projekt einen Leerzustand-Hinweis?
 * true AUSSCHLIESSLICH für 'zusammenstellen' und 'aktionen', und nur wenn kein Projekt offen ist.
 * 'projekte' und 'vorlagen' liefern IMMER false – auch ohne Projekt (TK 9.14.2).
 */
export function zeigtLeerzustand(reiter: ReiterId, projektOffen: boolean): boolean {
  return !projektOffen && REITER_MIT_LEERZUSTAND.includes(reiter)
}

/** Die Reiter, die überhaupt je einen Leerzustand zeigen können. Genau zwei. */
export const REITER_MIT_LEERZUSTAND: readonly ReiterId[] = [
  'zusammenstellen',
  'aktionen',
]