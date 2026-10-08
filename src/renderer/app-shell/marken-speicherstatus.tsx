// Issue #327 (M8) - marken-speicherstatus.tsx: die Anzeige des Marken-
// Speicherstatus UND die Verdrahtung des EINEN Abonnements.
//
// Die Lage wohnt als MODUL-Zustand in marken-speicherstatus-lage.ts (#327,
// ENTSCHIEDEN 8, wie #200) - der Zustand koennte auch ausserhalb der
// Reiterleiste gebraucht werden (Beenden-Ablauf, #336). Zur Komponente gehoert
// NUR die Uebersetzung Lage -> JSX und DAS Abonnement als Parameter.
//
// Kein Kanalname, kein KANAELE, kein rufeAuf, kein Fenster.api: Das Abo wird
// vom Aufrufer (App.tsx) aus abonniere (#151) gebildet und HIER nur gerufen -
// dieselbe Bauweise wie SpeicherHinweisEigenschaften in #200.
//  Farbe und Gestalt sind zur Abnahme offen; der
// Wortlaut lebt ausschliesslich in MARKEN_HINWEIS_TEXT.)

import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import {
  MARKEN_ANFANGSLAGE,
  MARKEN_HINWEIS_TEXT,
  zeigtMarkenHinweis,
  verarbeiteMarkenSpeicherEreignis,
  type MarkenSpeicherEreignis,
  type MarkenSpeicherlage,
} from './marken-speicherstatus-lage'

export interface MarkenSpeicherHinweisEigenschaften {
  abonniereMarken: (hoerer: (ereignis: MarkenSpeicherEreignis) => void) => () => void
}

/** Modul-Zustand: die aktuelle Marken-Speicherlage. Initial die ANFANGSLAGE. */
let lage: MarkenSpeicherlage = MARKEN_ANFANGSLAGE

/** Nur für Tests und für Anzeigen außerhalb der Reiterleiste: die aktuelle Lage. */
export function holeMarkenSpeicherlage(): MarkenSpeicherlage {
  return lage
}

export function MarkenSpeicherHinweis(
  eigenschaften: MarkenSpeicherHinweisEigenschaften,
): JSX.Element {
  // Genau EIN Abo beim Aufbau; die Abmelde-Funktion kehrt beim Abbau zurueck.
  // Das Anmelden allein ist KEINE Entwarnung (die Lage bleibt 'unbekannt').
  const [stand, setzeStand] = useState<MarkenSpeicherlage>(lage)
  useEffect(() => {
    let abgemeldet: (() => void) | null = null
    try {
      abgemeldet = eigenschaften.abonniereMarken((ereignis) => {
        const neu = verarbeiteMarkenSpeicherEreignis(lage, ereignis)
        lage = neu
        setzeStand(neu)
      })
    } catch (wurf) {
      // Werfendes Doppel wirft hier: der Wurf verlaesst die Komponente NICHT,
      // die Lage bleibt, die Anzeige rendert trotzdem (Fehlerpfad-Tabelle).
      console.warn('[marken-speicherstatus] abonniereMarken wirft:', wurf)
    }
    return () => {
      if (abgemeldet !== null) abgemeldet()
    }
  }, [eigenschaften])

  // EHRLICH zu 'unbekannt': NICHTS anzeigen - auch kein "gespeichert".
  if (!zeigtMarkenHinweis(stand)) {
    return <span data-testid="marken-speicherhinweis-leer" />
  }
  return (
    <span data-testid="marken-speicherhinweis" role="alert">
      {MARKEN_HINWEIS_TEXT}
      {stand.letzterFehlercode !== null ? ` (${stand.letzterFehlercode})` : ''}
    </span>
  )
}
