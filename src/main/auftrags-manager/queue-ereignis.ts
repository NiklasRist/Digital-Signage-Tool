/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #65.
// [auftrags-manager] Ereignis queue:geaendert senden
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
// GERUEST-PRUEFSUMME: 66b95cafc28fc09b
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

import type { Auftrag } from '../../shared/contracts/auftrag'

export async function sendeQueueGeaendert(): Promise<void> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #65."
  );
}
// Ermittelt den Stand über holeStand() (#64) und meldet ihn allen registrierten Hörern.
// Nutzlast ist Auftrag[] – derselbe zusammengeführte, deduplizierte und sortierte Stand.
// KEINE Ergebnis-Hülle, KEIN Endzustand.

export function aufQueueGeaendert(
  hoerer: (auftraege: Auftrag[]) => void,
): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #65."
  );
}
// registriert einen MAIN-INTERNEN Hörer; Rückgabewert ist die Abmelde-Funktion
