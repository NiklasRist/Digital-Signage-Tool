// Die Darstellung der beschädigten Zeile (#223 / M7-30, tsx-Teil).
//
// Enthält KEINEN „Öffnen"-Knopf – auch keinen deaktivierten Doppelklick-Weg und
// kein anklickbares Zeilen-Ganzes (ENTSCHIEDEN 3): Ein beschädigtes Projekt lässt
// sich nicht sinnvoll öffnen; es führt nicht in eine dann halbkaputte Sitzung.
// Löschen ist AUSDRÜCKLICH angeboten (ENTSCHIEDEN 4, M7-33/M7-59): Es ist der
// einzige Weg, einen unlesbaren Ordner wieder loszuwerden.

import type { JSX } from 'react'
import type { ProjektMeta } from './liste'

export interface BeschaedigteZeileEigenschaften {
  /** Der Eintrag aus dem Bestand (M7-29). Wird nur gelesen. */
  meta: ProjektMeta
  /** „Ordner öffnen" – die Ansicht ruft nur zurück; das Ergebnis zeigt der Aufrufer an. */
  aufOrdnerOeffnen: (projektId: string) => void
  /** Löschen ist auch für ein beschädigtes Projekt erlaubt (s. ENTSCHIEDEN 4) – M7-33. */
  aufLoeschen: (meta: ProjektMeta) => void
}

export function BeschaedigteZeile(p: BeschaedigteZeileEigenschaften): JSX.Element {
  return (
    <li data-testid={'beschaedigt-' + p.meta.id}>
      <span data-testid="beschaedigt-kennzeichen">Beschädigt</span>{' '}
      <span>{p.meta.name}</span>{' '}
      <span style={{ opacity: 0.7 }}>
        ({p.meta.anzahlMedien} Medien, {p.meta.anzahlAusgaben} Ausgaben)
      </span>{' '}
      <button type="button" data-testid="beschaedigt-ordner" onClick={() => p.aufOrdnerOeffnen(p.meta.id)}>
        Ordner öffnen
      </button>{' '}
      <button type="button" data-testid="beschaedigt-loeschen" onClick={() => p.aufLoeschen(p.meta)}>
        Löschen
      </button>
      {/* KEIN Öffnen-Knopf, KEIN Doppelklick, KEIN klickbares Zeilen-Ganzes (ENTSCHIEDEN 3). */}
    </li>
  )
}
