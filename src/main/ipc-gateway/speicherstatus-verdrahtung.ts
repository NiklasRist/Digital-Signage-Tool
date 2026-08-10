/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #238.
// [ipc-gateway] Sender für die beiden Auto-Speichern-Meldungen
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
// GERUEST-PRUEFSUMME: b3bc78859077eb1f
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

export function verdrahteSpeicherstatusIPC(fenster: BrowserWindow): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #238."
  );
}
// 1. meldet sich EINMAL ueber aufAutoSpeichernEreignis (#47) als Hoerer an und gibt jede
//    Meldung UNVERAENDERT auf dem Ereignis-Kanal `project:autoSpeichernStatus` an den
//    Renderer weiter – OHNE Huelle, OHNE Endzustand, OHNE Umformen oder Filtern
// 2. dasselbe fuer den vorlagen-store auf dem Kanal `vorlagen:autoSpeichernStatus`
//    – die main-interne Anmelde-Funktion dafuer ist `aufVorlagenSpeichernEreignis` (#98)
// Kein Zustand, keine Fachlogik, kein Aufrufkanal, keine Umformung der Nutzlast.
