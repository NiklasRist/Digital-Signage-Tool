// [gemeinsam] Der Sprungbefehl fuer die Zeitleiste (#457-Nachtrag, 01.11.2026)
//
// WARUM ES IHN GIBT: `abspielposition.ts` reicht den Stand in EINE Richtung - von der
// Vorschau-Uhr zur Marke in der Zeitleiste. Die Gegenrichtung fehlte: Ein Klick auf die
// Zeitachse bewegte das Video nicht. Niklas, 01.11.2026: "ausserdem muss die zeitleiste
// und videowiedergabe gesynct werden."
//
// Bauform wie `reiter.ts`/`aktionen-ansicht.ts`: ein kleiner Speicher ohne React, damit
// weder der `composer` noch der `preview-player` den anderen importieren muss (der
// Ordner `gemeinsam` ist der Ort ohne Eigentuemer).
//
// KEIN GESPEICHERTER ZUSTAND: Ein Sprung ist ein EREIGNIS, kein Stand. Deshalb gibt es
// hier keinen "letzten Sprung" zum Abholen und KEINE Entdopplung - zweimal dieselbe
// Zielstelle anzuspringen ist ein gueltiger Wunsch (z. B. nach einer Achsen-Aenderung).
// Wer den Stand BRAUCHT, liest ihn aus `abspielposition.ts`.

type Hoerer = (frame: number) => void

const hoerer = new Set<Hoerer>()

/** Meldet den Wunsch, die Wiedergabe auf diesen Frame zu setzen.
 *
 *  Ungueltige Frames werden NICHT durchgereicht: Die Marke und der Transport kennen nur
 *  ganzzahlige Positionen ab 0 - ein NaN aus einer kaputten Pixel-Rechnung wuerde sonst
 *  bis in `springeZuFrame` laufen und dort stillschweigend geklemmt. */
export function fordereSprung(frame: number): void {
  if (!Number.isInteger(frame) || frame < 0) return
  // Kopie der Liste: ein Hoerer, der sich waehrend der Meldung abmeldet, darf die
  // Schleife nicht verkuerzen (dieselbe Regel wie in `abspielposition.ts`).
  for (const eintrag of [...hoerer]) {
    eintrag(frame)
  }
}

/** Meldet einen Sprung-Wunsch an. Rueckgabe ist die Abmelde-Funktion. */
export function abonniereSprung(eintrag: Hoerer): () => void {
  hoerer.add(eintrag)
  return () => {
    hoerer.delete(eintrag)
  }
}
