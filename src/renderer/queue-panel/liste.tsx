// Handgeschrieben zu Issue #207 - der zweite Baustein des Issues (die Logik steht in
// `listen-zeilen.ts`, das Geruest-Werkzeug fasst je Issue nur die ERSTE Zieldatei an).
// DÜNN: Die Liste rechnet nichts, sortiert nichts, haelt keinen Zustand und kennt
// keine IPC-Aufrufe. Die Bedien-Schalter kommen als Parameter herein (ENTSCHIEDEN des
// Issues) - wer sie einsetzt, ist die Modul-Wurzel des queue-panel (#257).

import type { JSX } from 'react'
import type { AuftragsSicht } from './auftrags-sicht'
import type { AuftragsZeile } from './listen-zeilen'
import { baueListenInhalt } from './listen-zeilen'

export interface ListeProps {
  sicht: AuftragsSicht
  /** Die Bedien-Schalter einer Zeile. Kommt von aussen, damit diese Datei keine IPC-Aufrufe kennt. */
  zeileSchalter: (zeile: AuftragsZeile) => JSX.Element | null
}

/**
 * Die aufgeklappte Liste der Warteschlangen-Leiste (TK 9.14.2, FA-16). Ruft
 * `baueListenInhalt` GENAU EINMAL und stellt das Ergebnis dar - alles Ableiten,
 * Entscheiden und Text-Zusammensetzen steht in listen-zeilen.ts.
 *
 * Der Ton bleibt ein DATENWERT (`data-ton`), damit die Gestaltung spaeter ohne
 * Aenderung an der Ableitung nachgezogen werden kann. `unbekannt` und `fehler`
 * bekommen eine EIGENE Darstellung und werden nie als leere Liste gezeigt
 * (Invariante 1 des Meilensteins).
 */
export function Liste(props: ListeProps): JSX.Element {
  const inhalt = baueListenInhalt(props.sicht)

  if (inhalt.zustand === 'unbekannt') {
    return <div data-ton="unbekannt">Warteschlange wird geladen …</div>
  }

  if (inhalt.zustand === 'fehler') {
    return <div data-ton="hervorgehoben">Warteschlange nicht lesbar</div>
  }

  if (inhalt.zustand === 'leer') {
    return <div data-ton="ruhig">Keine Aufträge</div>
  }

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {inhalt.zeilen.map((zeile) => (
        <li key={zeile.auftragId} data-testid={`auftrag-${zeile.auftragId}`}>
          <span>{zeile.label}</span>
          <span> · {zeile.zustandText}</span>
          {props.zeileSchalter(zeile)}
        </li>
      ))}
    </ul>
  )
}