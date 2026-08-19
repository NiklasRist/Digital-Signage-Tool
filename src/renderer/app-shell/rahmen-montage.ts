// Zu Issue #195 – die reine Montage-Regel des Rahmens (ohne Markup, ohne React).
//
// `rahmen.tsx` benutzt diese Regeln, um zu entscheiden, welcher Reiter im DOM
// aufgebaut wird und welcher nur versteckt bleibt: Besuchte Reiter bleiben montiert
// (TK 9.14.2 – „Ein Reiterwechsel verwirft nie Arbeit"), ein nie besuchter Reiter
// wird gar nicht erst aufgebaut (ENTSCHIEDEN 2 des Issues).
//
// Diese Datei ist bewusst von React entkoppelt: reine Werte rein, reine Werte raus,
// in jeder Umgebung pruefbar. Die DoD verlangt Tests ohne Browser-Umgebung.
//
// Diese Datei hat keinen GERUEST-Kopf: tools/geruest.py erzeugt aus dem Signaturblock
// von #195 nur die erste Zieldatei (rahmen.tsx); rahmen-montage.ts ist als zweite
// Datei des Issues von Hand entstanden.

import type { ReiterId } from './reiter'

/** Ergänzt den aktiven Reiter um die Menge der bereits besuchten. Reihenfolge =
 *  Besuchsreihenfolge, keine Dubletten. Liefert IMMER ein neues Array; die Eingabe
 *  wird nie verändert. */
export function ergaenzeBesuchte(
  besuchte: readonly ReiterId[],
  aktiv: ReiterId,
): ReiterId[] {
  // Auch im Dubletten-Fall ein frisches Array: „Liefert IMMER ein neues Array"
  // (Signatur, verbindlich) – der Aufrufer darf sich darauf verlassen, dass eine
  // Mutation hier nie die Eingabe trifft.
  return besuchte.includes(aktiv) ? [...besuchte] : [...besuchte, aktiv]
}

/** Wird dieser Reiter im DOM gehalten? true ab dem ersten Besuch, danach für immer. */
export function istMontiert(besuchte: readonly ReiterId[], reiter: ReiterId): boolean {
  return besuchte.includes(reiter)
}