// #421 (Nachzug) - das Bedien-Panel der gefuehrten Reparatur.
//
// Bis hierher zeigte der Composer nur den Fortschrittstext ("X von N behoben"); es gab
// KEINEN Weg, eine Fix-Option auszuloesen (`fuehreFixAus` hatte keinen Aufrufer). Dieses
// Bauteil schliesst die Luecke: es zeigt die AKTUELLE kaputte Stelle und je Fix-Option
// einen Knopf und ruft beim Klick einen Rueckruf. Die Ausfuehrung (IPC/Sicht) bleibt in
// der Wurzel - dieses Bauteil haelt keinen Zustand und ruft kein IPC.

import type { JSX } from 'react'

import type { ReparaturStand } from './reparatur-fuehrung'
import type { FixOptionId } from './reparatur-optionen'
import { optionenFuer } from './reparatur-optionen'

/** Anzeigetexte der Fix-Optionen (die Optionen selbst sind reine IDs). */
const BESCHRIFTUNG: Record<FixOptionId, string> = {
  medium_neu_verknuepfen: 'Medium neu importieren',
  medium_ersetzen: 'Anderes Medium wählen',
  element_entfernen: 'Element entfernen',
  aktionsbild_reparieren: 'Bild der Aktion reparieren',
  aktion_ersetzen: 'Andere Aktion wählen',
  abschnitt_ersetzen: 'Anderen Abschnitt wählen',
  abschnitt_entfernen: 'Abschnitt entfernen',
  unterbrechung_ersetzen: 'Andere Aktion für den Einschub wählen',
  unterbrechung_entfernen: 'Einschub entfernen',
}

export interface ReparaturPanelEigenschaften {
  stand: ReparaturStand
  /** Loest die Fix-Option aus - die Wurzel ruft `fuehreFixAus` und pflegt Sicht/Stand. */
  aufFix: (option: FixOptionId) => void
}

export function ReparaturPanel(p: ReparaturPanelEigenschaften): JSX.Element {
  const stelle = p.stand.aktuelle
  if (stelle === null) {
    return <div data-testid="reparatur-panel-leer" />
  }

  return (
    <div
      data-testid="reparatur-panel"
      style={{ border: '1px solid #f5d76e', padding: 6, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}
    >
      <div data-testid="reparatur-fortschritt">
        {`${p.stand.behoben} von ${p.stand.gesamt} behoben`}
      </div>
      <div data-testid="reparatur-stelle">
        {`Defekte Stelle: ${stelle.art} · ${stelle.grund}`}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {optionenFuer(stelle).map((option) => (
          <button
            key={option}
            type="button"
            data-testid={`reparatur-option-${option}`}
            onClick={() => p.aufFix(option)}
          >
            {BESCHRIFTUNG[option]}
          </button>
        ))}
      </div>
    </div>
  )
}
