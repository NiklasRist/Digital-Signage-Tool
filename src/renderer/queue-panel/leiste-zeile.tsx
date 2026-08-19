// Handgeschrieben zu Issue #206 - der zweite Baustein des Issues (die Logik steht in
// `leiste-zusammenfassung.ts`, das Geruest-Werkzeug fasst je Issue nur die ERSTE
// Zieldatei an). DÜNN: die Zeile rechnet nichts, zaehlt nichts und haelt keinen
// Zustand.

import type { JSX } from 'react'
import type { AuftragsSicht } from './auftrags-sicht'
import { fasseZusammen } from './leiste-zusammenfassung'

export interface LeisteZeileProps {
  sicht: AuftragsSicht
  aufgeklappt: boolean
  /** Klick auf die Zeile bzw. auf den Auf-/Zuklapp-Schalter. */
  aufKlappenUmschalten: () => void
}

/**
 * Die eingeklappte Zeile der Warteschlangen-Leiste (TK 9.14.1: „Render laeuft · 3 von
 * 7" ▸ aufklappbar). Sie ruft `fasseZusammen` EINMAL und stellt das Ergebnis dar.
 *
 * `aufgeklappt` wirkt NUR auf Richtung und Beschriftung des Klapp-Schalters; den
 * Klappzustand haelt diese Datei NICHT (Verbot des Issues) - er kommt als Parameter
 * herein und wird ueber `aufKlappenUmschalten` nach oben gemeldet. Bei einem
 * Fehlschlag klappt die Zeile nie von selbst auf, sondern hebt sich hervor
 * (ENTSCHIEDEN aus dem M7-Zuschnitt).
 *
 * Der Ton `hervorgehoben` bleibt hier ein DATENWERT (`data-ton`), damit die
 * Gestaltung spaeter ohne Aenderung an der Ableitung nachgezogen werden kann: Farbe,
 * Rahmen und Sinnbild sind eine offene Marken-Entscheidung des Issues und werden in
 * dieser Datei nicht getroffen.
 */
export function LeisteZeile(props: LeisteZeileProps): JSX.Element {
  const zusammenfassung = fasseZusammen(props.sicht)
  return (
    <div
      role="status"
      data-ton={zusammenfassung.ton}
      aria-label={zusammenfassung.laufender?.label}
      onClick={props.aufKlappenUmschalten}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 8px',
        cursor: 'pointer',
      }}
    >
      <span>{zusammenfassung.text}</span>
      <button
        type="button"
        aria-expanded={props.aufgeklappt}
        aria-label={
          props.aufgeklappt
            ? 'Warteschlange zuklappen'
            : 'Warteschlange aufklappen'
        }
        onClick={(ereignis) => {
          // Der Klick auf den Schalter soll den Klick auf die Zeile nicht doppelt
          // ausloesen (Klick auf die Zeile ist ebenso ein Klapp-Wunsch).
          ereignis.stopPropagation()
          props.aufKlappenUmschalten()
        }}
      >
        {props.aufgeklappt ? '▾' : '▸'}
      </button>
    </div>
  )
}