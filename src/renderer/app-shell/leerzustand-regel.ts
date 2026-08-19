// GENERIERT aus dem Signaturblock von Issue #198.
// [app-shell] Leerzustände ohne offenes Projekt
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
// GERUEST-PRUEFSUMME: 9713d22735760241
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

// src/renderer/app-shell/leerzustand-regel.ts   (rein, kein JSX, kein React)
import type { ReiterId } from './reiter'

/**
 * Zeigt dieser Reiter ohne offenes Projekt einen Leerzustand-Hinweis?
 * true AUSSCHLIESSLICH für 'zusammenstellen' und 'aktionen', und nur wenn kein Projekt offen ist.
 * 'projekte' und 'vorlagen' liefern IMMER false – auch ohne Projekt (TK 9.14.2).
 */
export function zeigtLeerzustand(reiter: ReiterId, projektOffen: boolean): boolean {
  return !projektOffen && REITER_MIT_LEERZUSTAND.includes(reiter)
}

/** Die Reiter, die überhaupt je einen Leerzustand zeigen können. Genau zwei. */
export const REITER_MIT_LEERZUSTAND: readonly ReiterId[] = [
  'zusammenstellen',
  'aktionen',
]