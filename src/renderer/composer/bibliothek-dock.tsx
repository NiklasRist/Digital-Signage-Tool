// S4 des Composer-Umbaus (docs/agents/composer-umbau-plan.md, Naht N4).
//
// Die LINKE Region: der Dock, der die Bibliotheksansicht (#227) traegt. Gesteuerte
// Praesentation - dieses Bauteil haelt KEINEN Zustand und schreibt nichts selbst;
// die Wurzel reicht Werte und Rueckrufe herein (Ownership, #259). Die Testids sind
// zeichengleich zum bisherigen Inline-Block (der Treiber misst sie, Lektion #403).

import type { JSX } from 'react'

import type { Listenelement, Project } from '../../shared/contracts/project'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { AktionAnlegenEingabe } from './aktion-anlegen.tsx'
import { Bibliotheksansicht } from './bibliothek-ansicht.tsx'

export interface BibliothekDockEigenschaften {
  projekt: Project
  /** #415 (Variante a): der Sicht-Schreiber (Wrapped-Zugangs-`setzeListe`, #244-Huelle). */
  sichtSchreiber: (liste: Listenelement[]) => void
  aufImportieren: () => void
  /** #418: das hervorgehobene Medium (nach dem Import standardmaessig das neue Video). */
  ausgewaehltesId: string | null
  aufWaehlen: (assetId: string) => void
  /** #416: die nutzbaren Vorlagen fuer das Inline-Anlegen einer Aktion. */
  vorlagen: readonly Vorlage[]
  aufAktionAnlegen: (eingabe: AktionAnlegenEingabe) => void
  aufAktionLoeschen: (aktionId: string) => void
  aufMediumLoeschen: (assetId: string) => void
  aufFehler: (code: string, meldung: string) => void
}

export function BibliothekDock(p: BibliothekDockEigenschaften): JSX.Element {
  return (
    <div
      data-testid="composer-bibliothek-dock"
      style={{ width: 300, flexShrink: 0, minWidth: 240, minHeight: 0, overflow: 'auto', borderRight: '1px solid #444', paddingRight: 8 }}
    >
      <Bibliotheksansicht
        projekt={p.projekt}
        sichtSchreiber={p.sichtSchreiber}
        aufImportieren={p.aufImportieren}
        ausgewaehltesId={p.ausgewaehltesId}
        aufWaehlen={p.aufWaehlen}
        vorlagen={p.vorlagen}
        aufAktionAnlegen={p.aufAktionAnlegen}
        aufAktionLoeschen={p.aufAktionLoeschen}
        aufMediumLoeschen={p.aufMediumLoeschen}
        aufFehler={p.aufFehler}
      />
    </div>
  )
}
