/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #91.
// [media-service] Aufräum-Ablauf zusammensetzen
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
// GERUEST-PRUEFSUMME: c08c3ef276810477
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
import type { Asset } from '../../shared/contracts/asset'
import type { ReconcileFehlercode } from './fehlercodes'

// NACHGEZOGEN am 13.08.2026, von Hand und nicht vom Generator: Der Rueckgabewert traegt
// jetzt `offen` (Issue-Nachtrag zu #91). Beim Bau von #90 kam heraus, dass dessen zweite
// Zahl hier sonst STIRBT - `holeLoeschungenNach` liefert `{ erledigt, offen }`, und `offen`
// sind die Loeschungen, die auch diesmal nicht durchgingen. Ohne die Zahl versucht der Lauf
// es bei jedem Projektstart erneut, still und fuer immer.
//
// Diese Datei ist noch ein Rumpf; die Aenderung kostet daher keinen Code. Wer sie fuellt,
// reicht beide Zahlen aus #90 UNVERAENDERT durch und rechnet nichts neu.
export async function reconcile(
  projektId: string,
  assets: Asset[],
): Promise<
  Ergebnis<
    { entfernt: number; markiert: number; erledigt: number; offen: number },
    ReconcileFehlercode
  >
> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #91."
  );
}
