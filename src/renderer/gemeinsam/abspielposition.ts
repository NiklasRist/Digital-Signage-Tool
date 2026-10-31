// [gemeinsam] Der EINE Abspielstand fuer Vorschau und Zeitleiste (#457)
//
// WARUM ES DIESEN SPEICHER GIBT: Die Vorschau-Uhr lebt im `preview-player`
// (`TransportStand`, transport.ts), die Zeitleiste im `composer`. Beide sind
// Geschwister unter `app-shell/inhalte.tsx`. Wuerde der Stand als React-Zustand
// nach oben gereicht, rendert der GANZE Composer 30-mal je Sekunde neu. Hier
// abonniert nur die Marke (`composer/abspiel-marke.tsx`); die Zeitleiste selbst
// bleibt stehen.
//
// KEIN ZWEITER TAKTGEBER: Diese Datei rechnet keine Zeit. Sie nimmt den Stand
// entgegen, den `vorschau.tsx` aus dem EINEN `TransportStand` veroeffentlicht
// (TK 9.9, ENTSCHIEDEN 7 in vorschau.tsx: genau ein requestAnimationFrame).
//
// WARUM `gemeinsam`: Der Ordner ist laut `index.ts` der Ort ohne Eigentuemer -
// keine der beiden Renderer-Fachlichkeiten darf die andere direkt importieren.

export interface Abspielstand {
  /** Position in Frames, ganzzahlig, >= 0. */
  frame: number
  /** true = die Vorschau-Uhr laeuft. */
  laeuft: boolean
}

let stand: Abspielstand = { frame: 0, laeuft: false }
const hoerer = new Set<(stand: Abspielstand) => void>()

/** Veroeffentlicht den Stand. Ungueltige Frames (nicht ganzzahlig, negativ) werden
 *  NICHT uebernommen - die Marke kennt nur Positionen, die es geben kann. */
export function setzeAbspielstand(neu: Abspielstand): void {
  if (!Number.isInteger(neu.frame) || neu.frame < 0) return
  if (neu.frame === stand.frame && neu.laeuft === stand.laeuft) return
  stand = { frame: neu.frame, laeuft: neu.laeuft }
  // Kopie der Liste: Ein Hoerer, der sich waehrend der Meldung abmeldet, darf die
  // Schleife nicht verkürzen (dieselbe Regel wie in auto-speichern.ts).
  for (const eintrag of [...hoerer]) {
    eintrag(stand)
  }
}

/** Der aktuelle Stand - stabile Referenz zwischen Aenderungen (useSyncExternalStore). */
export function holeAbspielstand(): Abspielstand {
  return stand
}

export function abonniereAbspielstand(eintrag: (stand: Abspielstand) => void): () => void {
  hoerer.add(eintrag)
  return () => {
    hoerer.delete(eintrag)
  }
}
