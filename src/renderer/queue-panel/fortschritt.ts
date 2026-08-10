// GENERIERT aus dem Signaturblock von Issue #208.
// [queue-panel] Feiner Render-Fortschritt
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { RenderProgress } from '../../shared/contracts/render-progress'

/**
 * Der feine Render-Fortschritt. `unbekannt` ist der ANFANGSZUSTAND und bedeutet
 * „es ist noch kein Ereignis eingetroffen" – ausdruecklich NICHT „nichts laeuft"
 * und erst recht nicht „fertig".
 */
export type RenderFortschritt =
  | { zustand: 'unbekannt' }
  | { zustand: 'gemeldet'; ereignis: RenderProgress }

export const ANFANGS_FORTSCHRITT: RenderFortschritt = { zustand: 'unbekannt' }

/**
 * REIN. Entscheidet, ob ein eingetroffenes Ereignis uebernommen oder verworfen wird.
 * Verworfen wird, wenn `aktuelleRenderId` null ist oder nicht zur `renderId` des
 * Ereignisses passt. Verwerfen laesst den bisherigen Stand UNVERAENDERT stehen.
 */
export function uebernehmeFortschritt(
  bisher: RenderFortschritt,
  ereignis: RenderProgress,
  aktuelleRenderId: string | null,
): RenderFortschritt {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #208."
  );
}

/**
 * REIN. Die Anzeigeform: „Element 3 von 7 wird normalisiert" bzw. „Wird zusammengefuegt".
 * Bei `unbekannt` die leere Zeichenkette – der Aufrufer zeigt dann nichts an.
 */
export function beschreibeFortschritt(stand: RenderFortschritt): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #208."
  );
}

/**
 * Abonniert `render:fortschritt` und reicht jedes uebernommene Ereignis ueber
 * `setzeFortschritt` weiter. Kehrt SYNCHRON zurueck und liefert die Abmelde-Funktion.
 *
 * `leseAktuelleRenderId` wird bei JEDEM eingetroffenen Ereignis neu gerufen – der Wert
 * darf sich waehrend der Laufzeit aendern (neuer Render nach einem Abbruch).
 */
export function baueRenderFortschrittAuf(
  leseAktuelleRenderId: () => string | null,
  setzeFortschritt: (stand: RenderFortschritt) => void,
): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #208."
  );
}
