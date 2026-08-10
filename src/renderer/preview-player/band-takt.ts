/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #220.
// [preview-player] Das Zeitverhalten des Werbebandes – wechseln, wiederholen, am Videoende abschneiden
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
// GERUEST-PRUEFSUMME: 25d32bbb324f14fb
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

import type { Einblendung } from '../../shared/contracts/project'
import { sekundenZuFrame } from './zeitachse'

/** Ein Abschnitt EINER Runde der Abschnittsfolge. Halboffen: [startFrame, endeFrame). */
export interface Bandabschnitt {
  /** Aktions-ID dieses Abschnitts (Einblendung.abschnitte[i].aktionRef). */
  aktionRef: string
  /** Position in Einblendung.abschnitte (0-basiert). */
  index: number
  /** Erster Frame dieses Abschnitts INNERHALB der Runde, einschliesslich. */
  startFrame: number
  /** Erster Frame des naechsten Abschnitts innerhalb der Runde, ausschliesslich. */
  endeFrame: number
  /** endeFrame − startFrame. Kann 0 sein (s. ENTSCHIEDEN 3). */
  frames: number
}

export interface Bandtakt {
  /** Die Abschnitte EINER Runde, in Array-Reihenfolge. */
  abschnitte: readonly Bandabschnitt[]
  /** Laenge EINER Runde in Frames. 0, wenn es keine Abschnitte mit Laenge gibt. */
  rundeFrames: number
}

/**
 * Baut den Takt EINER Runde. Total: wirft nie, prueft nichts, traegt KEINE Ergebnis-Huelle und
 * KEINEN Fehlercode (TK 9.9.2: der preview-player prueft nichts und meldet keine Fehlercodes).
 * Eine Einblendung OHNE Abschnitte ergibt einen leeren Takt mit rundeFrames = 0.
 */
export function baueBandtakt(einblendung: Einblendung): Bandtakt {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #220."
  );
}

/**
 * Welcher Abschnitt bei `lokalerFrame` sichtbar ist – WIEDERHOLT ueber die Runde,
 * ABGESCHNITTEN bei `elementFrames`.
 * null bedeutet: kein Abschnitt sichtbar (vor dem Anfang, ab dem Videoende, oder leerer Takt).
 * Total: wirft nie.
 */
export function waehleAbschnitt(
  takt: Bandtakt,
  lokalerFrame: number,
  elementFrames: number,
): Bandabschnitt | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #220."
  );
}
