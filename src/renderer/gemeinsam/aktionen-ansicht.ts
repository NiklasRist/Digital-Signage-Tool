// [gemeinsam] Die Aktionen-Ansicht ÜBER der Reiterfläche (01.11.2026)
//
// WARUM ES DIESEN SPEICHER GIBT: Der Einstieg sitzt im `composer` (die Aktions-Zeile
// der Bibliothek), die Ansicht selbst gehört dem `app-shell` (sie liegt über der
// Reiterfläche, damit die besuchten Reiter montiert bleiben - TK 9.14.2). Der Rahmen
// hält seinen Zustand in einem eigenen Reducer und kennt keine Rückrufe von tief unten.
// Deshalb derselbe Weg wie bei `reiter.ts` und `abspielposition.ts`: EIN kleiner
// Speicher, den der Rahmen abonniert und der Composer schreibt.
//
// WARUM `gemeinsam`: Der Ordner ist laut `index.ts` der Ort ohne Eigentümer - keine der
// beiden Renderer-Fachlichkeiten darf die andere direkt importieren.
//
// WAS HIER NICHT PASSIERT: kein Zeichnen, kein Speichern, keine Aktions-Daten. Nur die
// Kennung der Aktion, die der Editor zeigen soll; `null` = Ansicht zu.

let aktionId: string | null = null
const hoerer = new Set<(aktionId: string | null) => void>()

/** Öffnet die Ansicht für GENAU diese Aktion. Dieselbe Aktion erneut = keine Meldung. */
export function oeffneAktionenAnsicht(id: string): void {
  if (id.trim() === '') return
  if (aktionId === id) return
  aktionId = id
  melde()
}

/** Schließt die Ansicht. Ist sie zu, geschieht NICHTS (kein Hörer wird gerufen). */
export function schliesseAktionenAnsicht(): void {
  if (aktionId === null) return
  aktionId = null
  melde()
}

/** Die offene Aktion - `null`, solange die Ansicht zu ist. */
export function holeAktionenAnsicht(): string | null {
  return aktionId
}

export function aufAktionenAnsichtGeaendert(
  eintrag: (aktionId: string | null) => void,
): () => void {
  hoerer.add(eintrag)
  return () => {
    hoerer.delete(eintrag)
  }
}

function melde(): void {
  // Kopie der Liste: Ein Hörer, der sich während der Meldung abmeldet, darf die
  // Schleife nicht verkürzen (dieselbe Regel wie in abspielposition.ts).
  for (const eintrag of [...hoerer]) {
    eintrag(aktionId)
  }
}
