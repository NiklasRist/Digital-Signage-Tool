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
// LAGE der Ansicht; `zu` = geschlossen.
//
// 03.11.2026 (Entscheidung 29.4, Niklas: „wir machen 2"): Es gibt einen DRITTEN
// Zustand. „Neue Aktion" im Composer legt keine halbe Aktion mehr an, sondern öffnet
// den Editor im Modus `neu` - dort sitzen Vorschau, Bild, Vorlagen-Kacheln, Felder nach
// Vorlage und der Anlegen-Knopf. Das Inline-Formular der Bibliothek ist entfallen:
// EIN Weg statt zwei (Begründung: 29.4 in `docs/agents/uebergabe-2026-11-01-…`).

/** Wo die Aktionen-Ansicht steht. `zu` = geschlossen, `neu` = Anlegen, `aktion` = diese Aktion. */
export type AktionenAnsichtLage =
  | { readonly art: 'zu' }
  | { readonly art: 'neu' }
  | { readonly art: 'aktion'; readonly aktionId: string }

const ZU: AktionenAnsichtLage = { art: 'zu' }

let lage: AktionenAnsichtLage = ZU
const hoerer = new Set<(lage: AktionenAnsichtLage) => void>()

/** Öffnet die Ansicht für GENAU diese Aktion. Dieselbe Aktion erneut = keine Meldung. */
export function oeffneAktionenAnsicht(id: string): void {
  if (id.trim() === '') return
  if (lage.art === 'aktion' && lage.aktionId === id) return
  lage = { art: 'aktion', aktionId: id }
  melde()
}

/** Öffnet die Ansicht im Modus „neu" (Anlegen). Ist sie schon so offen: keine Meldung. */
export function oeffneNeueAktion(): void {
  if (lage.art === 'neu') return
  lage = { art: 'neu' }
  melde()
}

/** Schließt die Ansicht. Ist sie zu, geschieht NICHTS (kein Hörer wird gerufen). */
export function schliesseAktionenAnsicht(): void {
  if (lage.art === 'zu') return
  lage = ZU
  melde()
}

/** Die offene Lage - `{ art: 'zu' }`, solange die Ansicht zu ist. */
export function holeAktionenAnsicht(): AktionenAnsichtLage {
  return lage
}

export function aufAktionenAnsichtGeaendert(
  eintrag: (lage: AktionenAnsichtLage) => void,
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
    eintrag(lage)
  }
}
