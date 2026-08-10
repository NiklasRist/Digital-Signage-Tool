/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #132.
// [composer] Durch die Reparatur führen
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
