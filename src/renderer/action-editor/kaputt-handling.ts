/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #141.
// [action-editor] Fehlendes Aktions-Bild behandeln – drei Fix-Optionen auf Aktions-Ebene
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
// GERUEST-PRUEFSUMME: 96ec435fa28b6ff3
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
