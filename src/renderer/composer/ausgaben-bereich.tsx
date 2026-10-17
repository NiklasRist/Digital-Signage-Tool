// S4 des Composer-Umbaus (docs/agents/composer-umbau-plan.md, Naht N4).
//
// Die Region UNTEN: die Ausgabe-Liste (#230). Gesteuerte Praesentation - dieses
// Bauteil haelt KEINEN Zustand und exportiert nichts selbst; `aufExportieren` fuehrt
// zu #232, `aufErneutLaden` zu #230, beide aus der Wurzel (Ownership, #259). Der
// Testid ist zeichengleich zum bisherigen Inline-Block (der Treiber misst ihn).

import type { JSX } from 'react'

import type { Ausgabenstand, AusgabeDatei } from './ausgabe-liste'
import { AusgabeListenansicht } from './ausgabe-liste.tsx'

export interface AusgabenBereichEigenschaften {
  stand: Ausgabenstand
  aufExportieren: (datei: AusgabeDatei) => void
  aufErneutLaden: () => void
}

export function AusgabenBereich(p: AusgabenBereichEigenschaften): JSX.Element {
  return (
    <div data-testid="composer-ausgaben" style={{ borderTop: '1px solid #444', paddingTop: 8 }}>
      <AusgabeListenansicht
        stand={p.stand}
        aufExportieren={p.aufExportieren}
        aufErneutLaden={p.aufErneutLaden}
      />
    </div>
  )
}
