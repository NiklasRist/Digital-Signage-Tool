// S3 des Composer-Umbaus (docs/agents/composer-umbau-plan.md, Naht N3).
//
// Das Export-Overlay (#232) als eigener Baustein: Rahmen + Anzeige. Es haelt
// KEINEN Zustand - die Wurzel reicht Bestand, Auswahl und Rueckrufe herein.
// Die Auswahl ist ein WERT der ComposerLage (#259); die Wirkungen (Datei-/Ziel-
// wahl, Ausloesen) baut die Wurzel und reicht sie als Rueckrufe.

import type { JSX } from 'react'

import type { AusgabeDatei } from './ausgabe-liste'
import type { Exportauswahl } from './export-dialog'
import { ExportDialogAnzeige } from './export-dialog.tsx'
import { OverlayRahmen } from './overlay-rahmen.tsx'

export interface ExportOverlayEigenschaften {
  /** Die waehlbaren Dateien - der Bestand aus M7-37. */
  ausgaben: readonly AusgabeDatei[]
  auswahl: Exportauswahl
  laeuft: boolean
  aufDateiWaehlen: (dateiname: string) => void
  aufZielWaehlen: () => void
  aufAusloesen: () => void
  aufAbbrechen: () => void
}

export function ExportOverlay(p: ExportOverlayEigenschaften): JSX.Element {
  return (
    <OverlayRahmen testid="composer-overlay">
      <ExportDialogAnzeige
        ausgaben={p.ausgaben}
        auswahl={p.auswahl}
        laeuft={p.laeuft}
        aufDateiWaehlen={p.aufDateiWaehlen}
        aufZielWaehlen={p.aufZielWaehlen}
        aufAusloesen={p.aufAusloesen}
        aufAbbrechen={p.aufAbbrechen}
      />
    </OverlayRahmen>
  )
}
