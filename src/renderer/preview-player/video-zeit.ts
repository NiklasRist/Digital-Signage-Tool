// Issue #216 - video-zeit.ts: die REINE Zeitrechnung des Video-Elements.
//
// DIE EINBAHNSTRASSE (TK 9.9.3): Die Vorschau-Uhr (#214) steuert das Video,
// das Video steuert N I E die Uhr. Diese Datei liefert die zwei SOLL-Werte,
// aus denen video.tsx das Medienelement dirigiert - und sie uebersetzt
// Frames NUR ueber frameZuSekunden (#213),UEBER keine eigene Division.
// Ein eigener `/ 30` waere eine zweite Bildrate neben dem Ausgabe-Profil.

import { frameZuSekunden } from './zeitachse'

/**
 * Ab welcher Abweichung die Wiedergabeposition neu gesetzt wird. 0,25 s = ca. 7,5 Frames
 * bei 30 fps. Begrueendung ENTSCHEIDEN 2 - NICHT aendern, ohne zu fragen.
 */
export const SPRUNG_TOLERANZ_SEKUNDEN = 0.25

/** Die Position in der QUELLDATEI: trimStart + die lokale Position des Elements. */
export function quellZeit(trimStart: number, lokalerFrame: number): number {
  return trimStart + frameZuSekunden(lokalerFrame)
}

/**
 * true, wenn die Wiedergabeposition neu gesetzt werden muss: wenn `istZeit` unbrauchbar ist
 * (NaN/Infinity) oder mehr als SPRUNG_TOLERANZ_SEKUNDEN von `sollZeit` abweicht.
 * Total: wirft nie.
 */
export function brauchtSprung(istZeit: number, sollZeit: number): boolean {
  // Ein Vergleich mit NaN ist immer falsch - deshalb bewusst gegen
  // `Number.isFinite` entscheiden, NICHT gegen die Differenz: `(NaN - 5) < tol`
  // lieferte stillschweigend false, und das Video waere lautlos stehen geblieben.
  if (!Number.isFinite(istZeit) || !Number.isFinite(sollZeit)) return true
  const abweichung = istZeit >= sollZeit ? istZeit - sollZeit : sollZeit - istZeit
  return abweichung > SPRUNG_TOLERANZ_SEKUNDEN
}
