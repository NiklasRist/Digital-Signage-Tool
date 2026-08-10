// GENERIERT aus dem Signaturblock von Issue #214.
// [preview-player] Transport – Abspielen, Pause, Springen und die Markierung des aktuellen Elements
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import { RENDER_PROFILE } from '../../shared/contracts/render-profile'
import { findeAbschnitt, type Zeitachse } from './zeitachse'
// RENDER_PROFILE.fps braucht `tick` fuer `msProFrame` und die Schranke von `restMs`;
// findeAbschnitt braucht `markierterIndex`. Beides sind WERT-Importe, kein `import type`.
// Fuer eine Sekunden-Umrechnung gaebe es `frameZuSekunden`/`sekundenZuFrame` aus derselben
// Datei – sie werden HIER nicht gebraucht und deshalb auch nicht importiert (s. STOPP).

/**
 * Der vollstaendige Stand der Vorschau-Uhr. Ein WERT, keine Klasse und kein Modul-Zustand:
 * Jede Funktion liefert einen NEUEN Stand, keine mutiert ihre Eingabe.
 */
export interface TransportStand {
  /** true = die Uhr laeuft. Sagt NICHTS darueber, ob ein <video> gerade wirklich abspielt. */
  laeuft: boolean
  /** Aktuelle Position in Frames, ganzzahlig, immer 0 <= frame <= achse.gesamtFrames. */
  frame: number
  /**
   * Angesammelter Bruchteil eines Frames in Millisekunden, 0 <= restMs < 1000 / fps.
   * Nur `tick` schreibt ihn; jeder Sprung setzt ihn auf 0.
   */
  restMs: number
}

/** Der Anfangsstand: pausiert, bei Frame 0. */
export function baueTransport(): TransportStand {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #214."
  );
}

/** Startet die Uhr. Steht sie am Ende, beginnt sie wieder bei 0 (s. ENTSCHIEDEN 3). */
export function spieleAb(stand: TransportStand, achse: Zeitachse): TransportStand {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #214."
  );
}

/** Haelt die Uhr an und BEHAELT die Position – das ist das „merkt sich die Stelle". */
export function pausiere(stand: TransportStand): TransportStand {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #214."
  );
}

/** Springt an eine Frame-Position; klemmt auf [0, gesamtFrames]. `laeuft` bleibt unveraendert. */
export function springeZuFrame(stand: TransportStand, achse: Zeitachse, frame: number): TransportStand {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #214."
  );
}

/** Springt an den Anfang des Elements mit diesem Listen-Index; klemmt auf gueltige Indizes. */
export function springeZuElement(stand: TransportStand, achse: Zeitachse, index: number): TransportStand {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #214."
  );
}

/**
 * Laesst die Uhr um `vergangeneMs` weiterlaufen. Tut NICHTS, wenn `laeuft` false ist.
 * Erreicht sie das Ende, bleibt sie bei gesamtFrames stehen und `laeuft` wird false.
 */
export function tick(stand: TransportStand, achse: Zeitachse, vergangeneMs: number): TransportStand {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #214."
  );
}

/** Listen-Index des gerade laufenden Elements; null am Ende und bei leerer Achse. ABGELEITET. */
export function markierterIndex(stand: TransportStand, achse: Zeitachse): number | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #214."
  );
}
