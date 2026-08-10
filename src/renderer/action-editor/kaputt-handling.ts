// GENERIERT aus dem Signaturblock von Issue #141.
// [action-editor] Fehlendes Aktions-Bild behandeln – drei Fix-Optionen auf Aktions-Ebene
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Aktion } from '../../shared/contracts/aktion'
import type { Asset } from '../../shared/contracts/asset'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Listenelement } from '../../shared/contracts/project'

/** Wo im Projekt wirkt sich der Zustand dieser Aktion aus? */
export interface BetroffeneStellen {
  segmentElementIds: string[]                                   // TK 9.7.5, Fall 2
  bandAbschnitte: Array<{ elementId: string; index: number }>   // TK 9.7.5, Fall 3
}

/** Die drei Wege aus TK 9.8.5. `ersetzen` deckt „neu verknüpfen/importieren" mit ab:
 *  beide Wege enden bei einer Asset-ID, sie stammt nur aus verschiedenen Quellen (#138). */
export type BildFix =
  | { art: 'ersetzen'; assetId: string }
  | { art: 'entfernen' }

/** Zählt alle Stellen, die diese Aktion verwenden – Listenelemente UND Band-Abschnitte. */
export function betroffeneStellen(aktionId: string, liste: Listenelement[]): BetroffeneStellen {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #141."
  );
}

/** Anzahl der Stellen, die ein Fix an dieser Aktion auf einen Schlag behebt. */
export function anzahlStellen(stellen: BetroffeneStellen): number {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #141."
  );
}

/** Wendet den Fix an. Schreibt über #136 und meldet die behobenen Stellen mit. */
export async function behebeAktionsBild(
  aktionId: string,
  fix: BildFix,
  liste: Listenelement[],
  assets: readonly Asset[],
): Promise<Ergebnis<{ aktion: Aktion; behobeneStellen: BetroffeneStellen }>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #141."
  );
}
