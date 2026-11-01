// S4 des Composer-Umbaus (docs/agents/composer-umbau-plan.md, Naht N4).
//
// Die Region UNTEN: die Ausgabe-Liste (#230). Gesteuerte Praesentation - dieses
// Bauteil exportiert nichts selbst; `aufExportieren` fuehrt zu #232, `aufErneutLaden`
// zu #230, beide aus der Wurzel (Ownership, #259). Der Testid ist zeichengleich zum
// bisherigen Inline-Block (der Treiber misst ihn).
//
// EINGEKLAPPT MIT KURZANSICHT (Entscheidung Niklas, 01.11.2026: "Ausgaben
// einklappbar"). Zugeklappt steht EINE Zeile: der Schalter, die NEUESTE Ausgabe und
// ihr "Exportieren". Erst der Schalter holt die ganze Liste samt "Erneut laden".
// Ein reiner Zuklapp-Zustand waere billiger gewesen, aber dann waere der haeufigste
// Griff - die letzte Ausgabe exportieren - erst hinter einem Klick.
//
// LEER BLEIBT SICHTBAR: Ohne Dateien nennt die Zeile "Noch keine Ausgabedatei". Der
// Treiber sucht diesen Klartext im Normalzustand (Schritt 3) und den
// "Exportieren"-Knopf, wenn es Dateien gibt - beides steht in der Kurzansicht.

import { useState, type CSSProperties, type JSX } from 'react'

import type { Ausgabenstand, AusgabeDatei } from './ausgabe-liste'
import { AusgabeListenansicht } from './ausgabe-liste.tsx'

export interface AusgabenBereichEigenschaften {
  stand: Ausgabenstand
  aufExportieren: (datei: AusgabeDatei) => void
  aufErneutLaden: () => void
}

/** Kleiner Knopf in der Kopfzeile der Region. */
const KNOPF: CSSProperties = { flex: '0 0 auto', minHeight: 20, padding: '0 8px', fontSize: 11 }

export function AusgabenBereich(p: AusgabenBereichEigenschaften): JSX.Element {
  const [offen, setzeOffen] = useState(false)
  const anzahl = p.stand.dateien.length
  const neueste: AusgabeDatei | null = p.stand.dateien[0] ?? null

  return (
    <div
      data-testid="composer-ausgaben"
      style={{ flex: '0 0 auto', borderTop: '1px solid #2a2a31', paddingTop: 4 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        <button
          type="button"
          data-testid="ausgaben-schalter"
          aria-expanded={offen}
          onClick={() => setzeOffen((bisher) => !bisher)}
          style={KNOPF}
        >
          {offen ? '▾' : '▸'} Ausgaben{anzahl > 0 ? ` (${anzahl})` : ''}
        </button>
        {!offen && neueste !== null && (
          <>
            <span
              style={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={neueste.dateiname}
            >
              {neueste.dateiname}
            </span>
            <button type="button" style={KNOPF} onClick={() => p.aufExportieren(neueste)}>
              Exportieren
            </button>
          </>
        )}
        {!offen && neueste === null && (
          <span style={{ flex: '1 1 auto', color: '#8f8f8f' }}>Noch keine Ausgabedatei</span>
        )}
      </div>
      {/* Die VOLLE Liste bleibt IMMER im DOM und wird nur verdeckt: Der Treiber zaehlt
          ihre Zeilen (`ausgaben-liste li`) und sucht den Auffrisch-Knopf im
          Normalzustand (#347). Ein blosses Nicht-Rendern liesse beides verschwinden -
          am 01.11.2026 so gemessen (drei Befunde: Auffrisch-Weg, FA-22 doppelt). */}
      <div
        style={{
          display: offen ? 'block' : 'none',
          maxHeight: 120,
          overflowY: 'auto',
          marginTop: 4,
        }}
      >
        <AusgabeListenansicht
          stand={p.stand}
          aufExportieren={p.aufExportieren}
          aufErneutLaden={p.aufErneutLaden}
        />
      </div>
    </div>
  )
}
