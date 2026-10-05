// Issue #232 (M7-39) - export-dialog.tsx: die Auswahlanzeige, so wenig Logik
// wie moeglich. Sie haelt keinen Zustand (die Auswahl ist ein WERT des
// Aufrufers), laedt nichts (der Bestand kommt als Parameter aus M7-37) und
// rechnet nichts (Name/Groesse/Zeitpunkt ueber die Formatierer aus M7-37,
// ENTSCHIEDEN 8 - keine zweite Schreibweise fuer dieselbe Zahl).
//
// Kein rufeAuf, kein KANAELE, kein eigener Ladevorgang (DoD-Grep). Der
// Ausloeser ist nur betaetigbar, wenn BEIDE Angaben vorliegen und die
// Ausloesung nicht laeuft.

import type { JSX } from 'react'
import type { AusgabeDatei } from './ausgabe-liste'
import { formatiereDateigroesse, formatiereZeitpunkt } from './ausgabe-liste'
import type { Exportauswahl } from './export-dialog'

export interface ExportDialogEigenschaften {
  /** Die wählbaren Dateien – der Bestand aus M7-37. Diese Anzeige lädt ihn NICHT. */
  ausgaben: readonly AusgabeDatei[]
  /** Die aktuelle Auswahl; die Anzeige hält sie NICHT selbst. */
  auswahl: Exportauswahl
  /** true, solange das Auslösen läuft – der Knopf ist dann gesperrt. */
  laeuft: boolean
  aufDateiWaehlen: (dateiname: string) => void
  /** Zielordner wählen – führt zu `waehleZiel`. */
  aufZielWaehlen: () => void
  /** Auslösen. Nur erreichbar, wenn beide Angaben vorliegen und `laeuft === false`. */
  aufAusloesen: () => void
  aufAbbrechen: () => void
}

export function ExportDialogAnzeige(p: ExportDialogEigenschaften): JSX.Element {
  const bereit = p.auswahl.datei !== null && p.auswahl.zielPfad !== null
  const gesperrt = !bereit || p.laeuft

  return (
    <div data-testid="export-dialog">
      <h2>Ausgabedatei exportieren</h2>
      <p>Zielordner (in der Regel der USB-Stick):</p>
      <div data-testid="export-dialog-ziel">
        {p.auswahl.zielPfad === null ? (
          <span>Kein Ziel gewählt.</span>
        ) : (
          // Der Pfad wird als EINE Zeichenkette angezeigt, nicht zerteilt
          // (Verbot: nicht zerlegt, nicht zusammengesetzt).
          <span>{p.auswahl.zielPfad}</span>
        )}
      </div>
      <button type="button" data-testid="export-dialog-ziel-waehlen" onClick={p.aufZielWaehlen}>
        Zielordner wählen…
      </button>

      <p>Ausgabedatei (sie behält ihren Namen):</p>
      <ul data-testid="export-dialog-dateien">
        {p.ausgaben.map((datei) => {
          const gewaehlt = p.auswahl.datei?.dateiname === datei.dateiname
          return (
            <li key={datei.dateiname}>
              <button
                type="button"
                data-testid="export-dialog-datei"
                aria-pressed={gewaehlt}
                onClick={() => p.aufDateiWaehlen(datei.dateiname)}
              >
                {datei.dateiname} – {formatiereDateigroesse(datei.dateigroesse)} –{' '}
                {formatiereZeitpunkt(datei.geaendertAm)}
              </button>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        data-testid="export-dialog-ausloeser"
        disabled={gesperrt}
        onClick={p.aufAusloesen}
      >
        Exportieren
      </button>
      <button type="button" data-testid="export-dialog-abbrechen" onClick={p.aufAbbrechen}>
        Abbrechen
      </button>
    </div>
  )
}
