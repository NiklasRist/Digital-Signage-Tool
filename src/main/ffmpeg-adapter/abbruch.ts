// GENERIERT aus dem Signaturblock von Issue #159.
// [ffmpeg-adapter] Laufenden ffmpeg-Prozess plattformsicher beenden
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { ChildProcess } from 'node:child_process'

/**
 * Merkt sich das Handle des laufenden ffmpeg-Prozesses. Es gibt genau EINEN Platz:
 * es laeuft nie mehr als ein ffmpeg gleichzeitig (serielle Ausfuehrung, TK 9.3.5).
 * Ein zweiter Aufruf, waehrend noch ein Handle liegt, ERSETZT es und meldet das intern
 * als Programmierfehler - er wirft NICHT.
 */
export function merkeProzess(kindProzess: ChildProcess): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #159."
  );
}

/**
 * Gibt den Platz wieder frei. Ist ein ANDERES als das gemerkte Handle uebergeben,
 * passiert nichts (ein spaet eintreffendes Ende eines alten Laufs darf den neuen
 * nicht abmelden).
 */
export function gibProzessFrei(kindProzess: ChildProcess): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #159."
  );
}

/**
 * Beendet den gemerkten Prozess plattformsicher.
 * Loest IMMER auf - auch wenn kein Prozess gemerkt ist, der Prozess schon tot ist
 * oder das Beenden selbst fehlschlaegt. Lehnt NIE ab und wirft NIE.
 */
export function beendeLaufendenProzess(): Promise<void> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #159."
  );
}
