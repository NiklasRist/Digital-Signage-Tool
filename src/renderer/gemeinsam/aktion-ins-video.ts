// [gemeinsam] Der Auftrag „diese Aktion ins Video" (04.11.2026)
//
// WARUM ES DIESEN SPEICHER GIBT: Der Abschluss-Knopf des Aktions-Editors heißt
// „Fertig & ins Video" - der Editor kennt aber weder die Abspielmarke noch die
// Einfüge-Regel. beides gehoert dem `composer` (`composer/ins-video.ts`, `legeAktionInsVideo`
// im Zeitleisten-Zug). Ein direkter Import wäre ein Architekturbruch (der Editor darf den
// Composer nicht importieren), und die Platzierung im Editor nachzubauen wäre ein ZWEITER
// Schreibweg - genau die Sorte Doppelung, die dieses Projekt teuer bezahlt hat.
//
// DESHALB: Der Editor legt einen AUFTRAG ab und schließt sich. Der Composer hört zu und
// führt ihn aus - mit demselben Weg wie der Knopf „Ins Video" in der Bibliothek.
//
// WAS HIER NICHT PASSIERT: kein Platzieren, kein Schreiben, keine Projekt-Kenntnis.
// Nur eine Kennung, genau einmal.

let auftrag: string | null = null
const hoerer = new Set<(aktionId: string) => void>()

/** Legt den Auftrag ab. Eine leere Kennung wird verworfen (sie kann nie treffen). */
export function merkeInsVideoAuftrag(aktionId: string): void {
  if (aktionId.trim() === '') return
  auftrag = aktionId
  for (const eintrag of [...hoerer]) {
    eintrag(aktionId)
  }
}

/** Der offene Auftrag - `null`, solange keiner gestellt wurde. */
export function holeInsVideoAuftrag(): string | null {
  return auftrag
}

/** Nimmt den Auftrag zurück. Der Composer ruft das, BEVOR er ihn ausführt: ein Auftrag
 *  gilt genau einmal, auch wenn die Platzierung scheitert (die Meldung sagt es dann). */
export function loescheInsVideoAuftrag(): void {
  auftrag = null
}

/** Hört auf neue Aufträge. Der Rückgabewert ist die Abmelde-Funktion. */
export function aufInsVideoAuftrag(eintrag: (aktionId: string) => void): () => void {
  hoerer.add(eintrag)
  return () => {
    hoerer.delete(eintrag)
  }
}
