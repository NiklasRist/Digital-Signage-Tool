// S3 des Composer-Umbaus (docs/agents/composer-umbau-plan.md, Naht N3).
//
// Das Render-Overlay (#231) als eigener Baustein: Rahmen + Anzeige. Es haelt
// KEINEN Zustand - die Wurzel reicht den Lage-Ausschnitt, den Ausgabe-Bestand
// (#230) und die Rueckrufe herein. Die reinen Befunde (Name, Ueberschreib-Lage)
// rechnet dieser Baustein aus seinen Eingaben, genau wie die Wurzel zuvor.

import type { JSX } from 'react'

import type { AusgabeDatei } from './ausgabe-liste'
import { OverlayRahmen } from './overlay-rahmen.tsx'
import { RenderDialogAnzeige } from './render-dialog.tsx'
import { pruefeAusgabeName, pruefeUeberschreiben } from './render-dialog'

export interface RenderOverlayEigenschaften {
  ausgabeName: string
  laeuft: boolean
  /** Der Ausgabe-Bestand - nur zum Erkennen der Ueberschreib-Lage (ENTSCHIEDEN 5). */
  ausgaben: readonly AusgabeDatei[]
  aufEingabe: (wert: string) => void
  aufAusloesen: () => void
  aufAbbrechen: () => void
}

export function RenderOverlay(p: RenderOverlayEigenschaften): JSX.Element {
  return (
    <OverlayRahmen testid="composer-overlay">
      <RenderDialogAnzeige
        eingabe={p.ausgabeName}
        befund={pruefeAusgabeName(p.ausgabeName)}
        lage={pruefeUeberschreiben(p.ausgabeName, p.ausgaben)}
        laeuft={p.laeuft}
        aufEingabe={p.aufEingabe}
        aufAusloesen={p.aufAusloesen}
        aufAbbrechen={p.aufAbbrechen}
      />
    </OverlayRahmen>
  )
}
