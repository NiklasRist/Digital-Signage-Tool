// [project-store] Das aktive Projekt main-intern herausgeben

import type { Project } from '../../shared/contracts/project'

// DER HALTER. Entschieden am 12.08.2026: Der Zustand liegt hier, als Modul-Variable neben dem
// Lesezugang - nicht in einem eigenen Modul und nicht improvisiert in einer der Operationen.
//
// Genau EINE Variable, weil laut TK 9.5.1 immer nur EIN Projekt geladen ist. Sie haelt die
// LEBENDE Referenz, die die Instant-Operationen mutieren - keine Kopie. Eine Kopie waere die
// zweite Wahrheit, die dieses Issue ausdruecklich ausschliesst, und ein Flush schriebe dann
// moeglicherweise einen veralteten Stand, waehrend er zugleich den Timer abbricht, der die neue
// Aenderung geschrieben haette.
let aktiv: Project | null = null

export function holeAktivesProjekt(): Project | null {
  return aktiv
}

export function merkeAktivesProjekt(projekt: Project | null): void {
  aktiv = projekt
}
// Kein Lock, kein await, kein Wurf - in beiden Funktionen. Ein Lock hier waere der Deadlock, den
// das Issue ausfuehrlich beschreibt: Der Render- und der Export-Handler rufen sofortFlush bereits
// INNERHALB von mitD1Lock, und ein Getter, der dort seinerseits das Lock naehme, wartete auf ein
// Lock, das sein eigener Aufrufer haelt.
// Liefert das aktuell geöffnete Projekt als LEBENDEN Stand (dieselbe Objektreferenz, die die
// Instant-Operationen mutieren) – KEINE Kopie. Begründung unten, Abschnitt „Lebender Stand".
// Ist kein Projekt geöffnet: null.
// SYNCHRON (kein Promise). NIMMT KEIN LOCK. WIRFT NIE.
// MAIN-INTERN: kein IPC-Kanal, kein Eintrag in kanaele.ts, für den Renderer unerreichbar.
