/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #122.
// [composer] Die Liste per Drag-and-drop ordnen
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
// GERUEST-PRUEFSUMME: 0204f0376bdc68d1
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

import type { Listenelement } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/** Reine Umsortierung: entfernt `aktivId` und fügt es an der Position von `ueberId` wieder ein.
 *  Gleiche Semantik wie `arrayMove` aus @dnd-kit/sortable – hier als EINE Quelle für beide Wege. */
export function berechneNeueReihenfolge(
  ids: string[],
  aktivId: string,
  ueberId: string,
): string[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #122."
  );
}

/** Optimistischer Reorder: Sicht sofort umstellen, dann `ordneNeu` bestätigen lassen.
 *  `ueberId` ist `string | null`, weil dnd-kit bei einem Drop ausserhalb der Liste
 *  `event.over === null` liefert (s. ENTSCHIEDEN 2 und Fehlerpfade). */
export async function ordneNeuOptimistisch(
  aktivId: string,
  ueberId: string | null,
): Promise<Ergebnis<void>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #122."
  );
}
