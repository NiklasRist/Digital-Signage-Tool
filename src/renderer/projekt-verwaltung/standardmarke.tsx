// [projekt-verwaltung] Das Auswahl-Bedienelement fuer die Standardmarke (#324, TK 9.14.3).
// Haelt NUR die Laufzeit-Sperre; der Wert kommt ausschliesslich aus der Lage (ENTSCHIEDEN 3).

import { useState } from 'react'
import type { JSX } from 'react'
import type { StandardmarkenLage } from './standardmarke'
import { istWechselNoetig } from './standardmarke'

export interface StandardmarkeEigenschaften {
  /** Die abgeleitete Lage dieser Zeile. Die Ansicht leitet nichts selbst ab. */
  lage: StandardmarkenLage
  /**
   * Wird bei einer Auswahl gerufen - und NUR, wenn sie den Wert tatsaechlich aendert
   * (`istWechselNoetig`). Solange das Versprechen offen ist, ist das Bedienelement gesperrt.
   */
  aufWechsel: (markeId: string) => Promise<unknown>
}

/** Die Beschriftung ist der Vertrag aus FA-23 / TK 9.14.3 - kein zweiter Begriff. */
export const STANDARDMARKE_BESCHRIFTUNG = 'Standardmarke'

export function StandardmarkeAuswahl(p: StandardmarkeEigenschaften): JSX.Element {
  const [laeuft, setzeLaeuft] = useState(false)

  const bemerke = (markeId: string): void => {
    // ENTSCHIEDEN 5: nichts gerufen, wenn der Wert gleich bleibt.
    if (p.lage.art === 'gesperrt') return
    const aktuellerWert =
      p.lage.art === 'bereit' ? p.lage.aktuelle.id : null
    if (!istWechselNoetig(aktuellerWert, markeId)) return
    // ENTSCHIEDEN 4: waehrend einer offenen Anfrage KEINE zweite Wahl; die Sperre
    // wird in JEDEM Fall geloest (auch bei Ablehnung) - finally.
    if (laeuft) return
    void (async () => {
      setzeLaeuft(true)
      try {
        await p.aufWechsel(markeId)
      } finally {
        setzeLaeuft(false)
      }
    })()
  }

  const waehle = (ereignis: { target: { value: string } }): void => {
    bemerke(ereignis.target.value)
  }

  // Die Optionen kommen aus der Lage, in Bestandsreihenfolge (ENTSCHIEDEN 6);
  // aus der Marke wird NUR id/name/eingebaut gelesen - nie Farben, Schriften, Logo.
  const optionen = (): readonly { id: string; name: string; eingebaut: boolean }[] | null => {
    if (p.lage.art === 'gesperrt') return null
    return p.lage.wahl
  }
  const ausgewaehlt =
    p.lage.art === 'bereit' ? p.lage.aktuelle.id : p.lage.art === 'unbekannte_marke' ? '' : ''

  switch (p.lage.art) {
    case 'gesperrt':
      // Gesperrt heisst SICHTBAR deaktiviert - nie ausgeblendet (TK 9.14.3).
      return (
        <label>
          {STANDARDMARKE_BESCHRIFTUNG}{' '}
          <select onChange={waehle} disabled aria-label={STANDARDMARKE_BESCHRIFTUNG} value="">
            <option value="">
              {p.lage.grund === 'beschaedigt'
                ? 'Projekt beschaedigt - Wechsel deaktiviert'
                : 'Marken-Bestand nicht geladen'}
            </option>
          </select>
        </label>
      )
    case 'unbekannte_marke':
      return (
        <label>
          {STANDARDMARKE_BESCHRIFTUNG} ({p.lage.markeId} unbekannt){' '}
          <select onChange={waehle} disabled={laeuft} aria-label={STANDARDMARKE_BESCHRIFTUNG} value="">
            {/* Der Platzhalter ist nicht waehlbar; die Auswahl bleibt BEDIENBAR
                (ENTSCHIEDEN 7): keine echte Marke ist gesetzt, value bleibt ''. */}
            <option disabled value="">
              (unbekannte Marke)
            </option>
            {(optionen() ?? []).map((wahl) => (
              <option key={wahl.id} value={wahl.id}>
                {wahl.eingebaut ? `${wahl.name} (eingebaut)` : wahl.name}
              </option>
            ))}
          </select>
        </label>
      )
    case 'bereit':
      return (
        <label>
          {STANDARDMARKE_BESCHRIFTUNG}{' '}
          <select
            onChange={waehle}
            disabled={laeuft}
            aria-label={STANDARDMARKE_BESCHRIFTUNG}
            value={ausgewaehlt}
          >
            {(optionen() ?? []).map((wahl) => (
              <option key={wahl.id} value={wahl.id}>
                {wahl.eingebaut ? `${wahl.name} (eingebaut)` : wahl.name}
              </option>
            ))}
          </select>
        </label>
      )
  }
}
