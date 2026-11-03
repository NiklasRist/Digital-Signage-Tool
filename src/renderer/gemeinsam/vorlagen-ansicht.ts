// [gemeinsam] Die VORLAGEN-Ansicht ÜBER der Reiterfläche (03.11.2026)
//
// WARUM ES DIESEN SPEICHER GIBT: Der Vorlagen-Editor war nur über den Reiter
// [Vorlagen] erreichbar - wer im Projekteditor eine Vorlage ändern wollte, musste
// den Reiter wechseln. Niklas, 03.11.2026: „man soll nur im projekteditor arbeiten
// müssen sonst ist der flow unlogisch". Der Einstieg sitzt jetzt in der Projektleiste,
// die Ansicht gehört dem `app-shell` (über der Reiterfläche, die besuchten Reiter
// bleiben montiert - TK 9.14.2).
//
// DERSELBE WEG wie `aktionen-ansicht.ts`: ein kleiner Speicher, den der Rahmen
// abonniert und die Projektleiste schreibt. Kein Zeichnen, kein Speichern, keine
// Vorlagen-Daten - nur „offen oder zu".
//
// WARUM `gemeinsam`: der Ordner ist laut `index.ts` der Ort ohne Eigentümer; weder
// `app-shell` noch ein Fachmodul soll den anderen direkt importieren.

let offen = false
const hoerer = new Set<(offen: boolean) => void>()

/** Öffnet die Ansicht. Ist sie schon offen, geschieht NICHTS (kein Hörer wird gerufen). */
export function oeffneVorlagenAnsicht(): void {
  if (offen) return
  offen = true
  melde()
}

/** Schließt die Ansicht. Ist sie zu, geschieht NICHTS. */
export function schliesseVorlagenAnsicht(): void {
  if (!offen) return
  offen = false
  melde()
}

/** true, solange die Ansicht über der Reiterfläche liegt. */
export function istVorlagenAnsichtOffen(): boolean {
  return offen
}

export function aufVorlagenAnsichtGeaendert(eintrag: (offen: boolean) => void): () => void {
  hoerer.add(eintrag)
  return () => {
    hoerer.delete(eintrag)
  }
}

function melde(): void {
  // Kopie der Liste: Ein Hörer, der sich während der Meldung abmeldet, darf die
  // Schleife nicht verkürzen (dieselbe Regel wie in abspielposition.ts).
  for (const eintrag of [...hoerer]) {
    eintrag(offen)
  }
}
