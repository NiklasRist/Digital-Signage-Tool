/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #71.
// [auftrags-manager] Die vier Queue-Kanäle und das Ereignis verdrahten
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
// GERUEST-PRUEFSUMME: 00030e1e282ac5c3
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

import type { BrowserWindow } from 'electron'

export function verdrahteQueueIPC(fenster: BrowserWindow): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #71."
  );
}
// 1. registriert die vier Kanäle über den Wrapper aus #23 (je mit eigener Validierungsfunktion)
// 2. meldet sich über aufQueueGeaendert (#65) als Hörer an und gibt jede Meldung auf dem
//    Ereigniskanal queue:geaendert an DAS EINE Fenster weiter (fenster.webContents.send(...))
//    – OHNE Hülle, OHNE Endzustand
// Vor jedem Senden wird fenster.isDestroyed() geprüft; ist es zerstört, wird still verworfen.
