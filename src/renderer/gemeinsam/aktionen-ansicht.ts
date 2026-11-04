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

/**
 * Der Waechter des Editors (04.11.2026).
 *
 * WARUM ER EXISTIERT: Seit dem Umbau haelt der Editor einen ENTWURF und schreibt erst
 * beim Abschluss. Der Rueckweg liegt aber nicht nur bei ihm: ein Reiterklick und das
 * Oeffnen einer anderen Ansicht rufen `schliesseAktionenAnsicht` von AUSSEN. Ohne
 * Waechter verschwaende dabei ein getippter Titel lautlos.
 *
 * Der Editor meldet sich hier an, solange er einen Entwurf fuehren kann. `false` heisst
 * „noch nicht schliessen" - der Editor schreibt im Hintergrund und ruft
 * `schliesseAktionenAnsicht` selbst erneut, sobald der Schreibvorgang durch ist.
 */
let waechter: (() => boolean) | null = null

/** Meldet den Waechter an (`null` meldet ihn ab). Es gibt genau einen Editor. */
export function setzeSchliessenWaechter(fn: (() => boolean) | null): void {
  waechter = fn
}

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

/** Schließt die Ansicht. Ist sie zu, geschieht NICHTS (kein Hörer wird gerufen).
 *  Ein angemeldeter Waechter darf das Schliessen AUFHALTEN (s. `setzeSchliessenWaechter`). */
export function schliesseAktionenAnsicht(): void {
  if (lage.art === 'zu') return
  if (waechter !== null && !waechter()) return
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
