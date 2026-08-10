/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #88.
// [media-service] Aufräumen: verwaiste Dateien und .part-Leichen entfernen
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

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ReconcileFehlercode } from './fehlercodes'
import { STAGING_ORDNER } from './import-datei'
// ENTSCHIEDEN: importiert wird GENAU EINE Konstante – STAGING_ORDNER. `PART_ENDUNG` wird hier
// NICHT gebraucht und deshalb NICHT importiert (ein ungenutzter Import bricht den Typecheck).
// Begründung: Der Staging-Ordner wird KOMPLETT geleert – jede Datei darin ist per Konstruktion
// ein Importrest (s. Invarianten). Auf die Endung zu sehen, würde nichts hinzufügen und würde
// eine `.part`-Leiche mit abweichender Endung übersehen.
// Abgeschrieben wird der Wert trotzdem nicht: KEIN Literal '.staging' in dieser Datei.

export async function entferneWaisen(
  projektId: string,
  bekannteDateinamen: Set<string>,
): Promise<Ergebnis<{ entfernt: number }, ReconcileFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #88."
  );
}
