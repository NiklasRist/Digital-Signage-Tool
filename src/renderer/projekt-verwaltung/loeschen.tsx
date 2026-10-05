// Die Bestaetigungs-Anzeige des Projekt-Löschens (#226 / M7-33, tsx-Teil).
//
// DIE UNUMKEHRBARE TAT: Ein gelöschtes Projekt ordert kein Undo ("Aufträge sind
// grundsätzlich nicht undo-fähig", TK 9.13.1). Deshalb zeigt die Anzeige die Zahlen
// aus baueLoeschBestaetigung (Media+Ausgaben) und die Unumkehrbarkeit; sie baut
// NICHTS nach und zählt NICHTS nach.
// Abbrechen ist die VORAUSGEWÄHLTE Antwort (ENTSCHIEDEN 4); der Bestätigungsweg
// ist nur und nur dann erreichbar, wenn bestaetigung.ok === true erreichbar (ENTSCHIEDEN 2).

import type { JSX } from 'react'
import type { LoeschBestaetigung } from './loeschen'
import type { ProjektMeta } from './liste'

export interface LoeschBestaetigungEigenschaften {
  /** Der zu löschende Eintrag aus dem Bestand (M7-29). Wird nur gelesen. */
  meta: ProjektMeta
  /** Das Ergebnis von `baueLoeschBestaetigung(meta)` – die Ansicht baut es NICHT selbst. */
  bestaetigung: LoeschBestaetigung
  /** true, wenn das zu löschende Projekt gerade offen ist – die Anzeige sagt es zusätzlich. */
  istOffenesProjekt: boolean
  /** Endgültig löschen. Nur erreichbar, wenn `bestaetigung.ok === true`. */
  aufBestaetigen: () => void
  /** Abbrechen – die VORAUSGEWÄHLTE Antwort (s. ENTSCHIEDEN 4). */
  aufAbbrechen: () => void
}

export function LoeschBestaetigungsAnzeige(p: LoeschBestaetigungEigenschaften): JSX.Element {
  return (
    <div data-testid={'loesch-bestaetigung-' + p.meta.id}>
      <p data-testid="loesch-bestaetigung-text">{p.bestaetigung.text}</p>
      {p.istOffenesProjekt && (
        <p data-testid="loesch-bestaetigung-offen" style={{ color: '#d9a441' }}>
          Dies ist das gerade geöffnete Projekt - nach dem Löschen wird die Ansicht geleert.
        </p>
      )}
      {p.bestaetigung.ok ? (
        <button type="button" data-testid="loesch-bestaetigen" onClick={p.aufBestaetigen}>
          Endgültig löschen
        </button>
      ) : null}
      <button type="button" data-testid="loesch-abbrechen" onClick={p.aufAbbrechen}>
        Abbrechen
      </button>
    </div>
  )
}
