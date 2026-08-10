// GENERIERT aus dem Signaturblock von Issue #132.
// [composer] Durch die Reparatur führen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Project } from '../../shared/contracts/project'
import type { KaputteStelle } from './kaputt-erkennung'

export interface ReparaturStand {
  aktiv: boolean
  offen: KaputteStelle[]      // in der Reihenfolge aus findeKaputteStellen
  gesamt: number              // N – wächst nie zurück, s. Ablauf 3
  behoben: number             // X = gesamt - offen.length
  zeigerIndex: number         // Position in `offen`, auf die die UI zeigt
  aktuelle: KaputteStelle | null   // offen[zeigerIndex] bzw. null, wenn nichts offen ist
}

/** Startet den geführten Modus für den aktuellen Projektstand. */
export function starteReparatur(projekt: Project): ReparaturStand {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #132."
  );
}

/** Rechnet nach jeder Änderung neu – aus DEM Projektstand, nicht aus vermuteten Wirkungen. */
export function aktualisiereReparatur(stand: ReparaturStand, projekt: Project): ReparaturStand {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #132."
  );
}

/** Manuelles Überspringen/Zurückgehen; klemmt auf den gültigen Bereich. */
export function springeZu(stand: ReparaturStand, index: number): ReparaturStand {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #132."
  );
}

/** Verlässt den geführten Modus, ohne etwas zu reparieren. Die Render-Sperre bleibt bestehen. */
export function beendeReparatur(stand: ReparaturStand): ReparaturStand {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #132."
  );
}

/** Die einzige Freigabe-Auskunft des composer. */
export function istRenderFreigegeben(projekt: Project): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #132."
  );
}
