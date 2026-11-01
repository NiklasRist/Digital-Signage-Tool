// S4 des Composer-Umbaus (docs/agents/composer-umbau-plan.md, Naht N4).
//
// Die Region UNTEN: die Ausgabe-Liste (#230). Gesteuerte Praesentation - dieses
// Bauteil haelt KEINEN Zustand und exportiert nichts selbst; `aufExportieren` fuehrt
// zu #232, `aufErneutLaden` zu #230, beide aus der Wurzel (Ownership, #259). Der
// Testid ist zeichengleich zum bisherigen Inline-Block (der Treiber misst ihn).
//
// EINKLAPPBAR (Entscheidung Niklas, 01.11.2026): Die Ausgabe-Liste kostete der Buehne
// ~108 px Hoehe. Sie startet deshalb OFFEN, aber GEDECKELT (die Liste scrollt in sich);
// der Schalter klappt sie ganz zu. Offen bleiben musste sie, weil der Treiber den
// "Exportieren"-Knopf im Normalzustand sucht (Schritt 3, MANUELL-Abgleich).

import { useState, type JSX } from 'react'

import type { Ausgabenstand, AusgabeDatei } from './ausgabe-liste'
import { AusgabeListenansicht } from './ausgabe-liste.tsx'

export interface AusgabenBereichEigenschaften {
  stand: Ausgabenstand
  aufExportieren: (datei: AusgabeDatei) => void
  aufErneutLaden: () => void
}

/** Die gedeckelte Hoehe der Liste im offenen Zustand (px). */
const LISTE_MAX_HOEHE_PX = 40

export function AusgabenBereich(p: AusgabenBereichEigenschaften): JSX.Element {
  const [offen, setzeOffen] = useState(true)
  return (
    <div
      data-testid="composer-ausgaben"
      style={{ flex: '0 0 auto', borderTop: '1px solid #444', paddingTop: 4 }}
    >
      <button
        type="button"
        data-testid="ausgaben-schalter"
        aria-expanded={offen}
        onClick={() => setzeOffen((bisher) => !bisher)}
        style={{ fontSize: 12 }}
      >
        {offen ? '▾ Ausgaben' : '▸ Ausgaben'}
      </button>
      {offen && (
        <div style={{ maxHeight: LISTE_MAX_HOEHE_PX, overflowY: 'auto', marginTop: 4 }}>
          <AusgabeListenansicht
            stand={p.stand}
            aufExportieren={p.aufExportieren}
            aufErneutLaden={p.aufErneutLaden}
          />
        </div>
      )}
    </div>
  )
}
