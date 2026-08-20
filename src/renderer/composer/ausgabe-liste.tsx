// Handgeschrieben zu Issue #230 - der zweite Baustein des Issues (Logik und Zustand
// liegen in `ausgabe-liste.ts`, das Geruest-Werkzeug fasst je Issue nur die ERSTE
// Zieldatei an). DÜNN: Die Ansicht haelt den Stand NICHT selbst (Signatur) und
// exportiert NICHTS selbst - der Rueckruf fuehrt zu #232.

import type { JSX } from 'react'
import type { Ausgabenstand, AusgabeDatei } from './ausgabe-liste'
import { baueAusgabeZeilen } from './ausgabe-liste'

export interface AusgabeListenEigenschaften {
  /** Der gehaltene Stand aus `holeAusgaben()`; die Ansicht hält ihn NICHT selbst. */
  stand: Ausgabenstand
  /** Exportieren – der Rückruf führt zu #232; diese Ansicht exportiert NICHTS selbst. */
  aufExportieren: (datei: AusgabeDatei) => void
  /** Erneut laden – für den Fehlerfall und den Auffrisch-Knopf. */
  aufErneutLaden: () => void
}

/**
 * Die Ausgabe-Liste des composers (FA-22, TK 9.5.2). Zeigt je Datei Dateiname,
 * Groesse sowie Datum UND Uhrzeit - genau dort stehen Zeitpunkt und Fassung,
 * ausdruecklich NICHT im Dateinamen (Anforderungsdokument 4.7).
 *
 * `zustand: 'unbekannt'` bekommt einen EIGENEN Text - „noch nicht geladen" ist nie
 * dasselbe wie „geladen, aber leer" (noch nie gerendert, ENTSCHIEDEN 2). Ein
 * Ladefehler wird MIT dem Knopf „Erneut laden" gezeigt (Fehlerpfad).
 */
export function AusgabeListenansicht(p: AusgabeListenEigenschaften): JSX.Element {
  if (p.stand.zustand === 'unbekannt') {
    return (
      <div data-ton="unbekannt" data-testid="ausgaben-unbekannt">
        Noch nicht geladen
      </div>
    )
  }

  if (p.stand.ladefehler) {
    return (
      <div data-ton="hervorgehoben" data-testid="ausgaben-fehler">
        <span>Ausgabe-Liste nicht lesbar</span>
        <button type="button" onClick={p.aufErneutLaden}>
          Erneut laden
        </button>
      </div>
    )
  }

  if (p.stand.dateien.length === 0) {
    // Geladen und leer (noch nie gerendert) - KEIN Fehler und nie derselbe Text wie
    // bei `unbekannt`. Der Weg zum Rendern gehoert #231.
    return (
      <div data-ton="ruhig" data-testid="ausgaben-leer">
        Noch keine Ausgabedatei
      </div>
    )
  }

  const zeilenVonName = new Map(
    baueAusgabeZeilen(p.stand.dateien).map((zeile) => [zeile.dateiname, zeile]),
  )
  return (
    <ul data-testid="ausgaben-liste" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {p.stand.dateien.map((datei) => {
        const zeile = zeilenVonName.get(datei.dateiname)
        if (!zeile) {
          // Kann nicht eintreten (die Zeilen stammen aus genau diesen dateien).
          return null
        }
        return (
          <li key={datei.dateiname}>
            <span>{zeile.dateiname}</span>
            <span> · {zeile.groesseText}</span>
            <span> · {zeile.zeitpunktText}</span>
            {/* Der Export-Rueckruf bekommt die ORIGINAL-Datei aus dem Bestand, nicht die
                abgeleitete Zeile - sie traegt nur Texte. */}
            <button type="button" onClick={() => p.aufExportieren(datei)}>
              Exportieren
            </button>
          </li>
        )
      })}
    </ul>
  )
}