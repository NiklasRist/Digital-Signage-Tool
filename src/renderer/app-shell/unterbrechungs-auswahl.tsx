// Die Auswahlanzeige der Fix-Option "Einschub ersetzen" (Fall 4, TK 9.7.5 v3.27).
//
// Eigene Anzeige neben `aktions-auswahl` (Fall 2/3): Der Rueckweg arbeitet ueber
// `setzeUnterbrechungen` (#426) und indiziert `element.unterbrechungen` - ein
// ANDERES Array als das Band (`abschnittIndex`). Ein gemeinsamer `abschnittIndex`
// haette einen Unterbrechungs-Fix erlaubt, der versehentlich das Band umschreibt
// (#131: verschiedene Ebenen, verschiedene Indizes).
//
// Diese Datei bildet die neue Einschub-Liste NICHT selbst: Der Rueckweg bekommt
// Element, Index, neue Aktion und das UNVERAENDERTE Projekt - das Zusammensetzen
// gehoert in den composer (`schliesseUnterbrechungsFixAb`, wo dieselbe Rechnung
// fuer `unterbrechung_entfernen` liegt).
//
// Dokumentation der Auswahl: Der Rückweg wird GENAU einmal gerufen, die Auswahl
// ist bis zur Antwort gesperrt (Doppelklick wirkungslos); ok:false meldet den
// Code UNVERAENDERT und lässt die Auswahl offen; ein Wurf wird gefangen und als
// unbekannter_fehler gemeldet. Der Reparatur-Fortschritt wird hier NICHT
// nachgerechnet.

import { useRef, useState } from 'react'
import type { JSX } from 'react'

import type { Project } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

import type { FixWirkung } from '../composer/reparatur-optionen'
import { waehlbareAktionen } from './aktions-auswahl-filter'

export interface UnterbrechungsAuswahlEigenschaften {
  /** Aus { ziel: 'unterbrechungs-auswahl', elementId, unterbrechungIndex }. */
  elementId: string
  /** Position in `element.unterbrechungen`. */
  unterbrechungIndex: number
  /** Das geladene Projekt (aus der gemeinsamen Sicht, #197). Wird nur gelesen. */
  projekt: Project

  /** Rückweg aus #133: tauscht NUR die `aktionRef` dieses Einschubs (v3.27). */
  schliesseUnterbrechungsFixAb: (
    elementId: string,
    unterbrechungIndex: number,
    neueAktionId: string,
    projekt: Project,
  ) => Promise<Ergebnis<FixWirkung>>

  aufAbgeschlossen: (wirkung: FixWirkung) => void
  aufAbgebrochen: () => void
  aufFehler: (code: string, meldung: string) => void
}

export function UnterbrechungsAuswahl(
  eigenschaften: UnterbrechungsAuswahlEigenschaften,
): JSX.Element | null {
  const {
    elementId,
    unterbrechungIndex,
    projekt,
    schliesseUnterbrechungsFixAb,
    aufAbgeschlossen,
    aufAbgebrochen,
    aufFehler,
  } = eigenschaften

  const [ausgewaehlt, setzeAusgewaehlt] = useState<string | null>(null)
  const [gesperrt, setzeGesperrt] = useState(false)
  // Der SYNCHRONE Teil der Sperre (wie in `aktions-auswahl`): Ein zweiter Klick
  // vor der Antwort liefe sonst in eine alte Closure.
  const laeuft = useRef(false)

  const element = projekt.liste.find((e) => e.id === elementId)

  if (element === undefined) {
    aufFehler('nicht_gefunden', `Es gibt kein Listenelement mit der ID "${elementId}".`)
    return null
  }
  if (element.art !== 'video') {
    aufFehler('ungueltige_eingabe', 'Dieses Element ist kein Video; es kann keinen Einschub tragen.')
    return null
  }

  const einschub = (element.unterbrechungen ?? [])[unterbrechungIndex]
  if (einschub === undefined) {
    aufFehler(
      'nicht_gefunden',
      `Der Einschub ${unterbrechungIndex} existiert nicht mehr.`,
    )
    return null
  }

  const wahl = waehlbareAktionen(projekt.aktionen, projekt.assets, einschub.aktionRef)

  async function uebernehmen(): Promise<void> {
    if (laeuft.current || ausgewaehlt === null) {
      return
    }
    laeuft.current = true
    setzeGesperrt(true)
    try {
      const antwort = await schliesseUnterbrechungsFixAb(
        elementId,
        unterbrechungIndex,
        ausgewaehlt,
        projekt,
      )
      if (antwort.ok) {
        aufAbgeschlossen(antwort.wert)
      } else {
        laeuft.current = false
        setzeGesperrt(false)
        aufFehler(antwort.fehler.code, antwort.fehler.meldung)
      }
    } catch (ausnahme) {
      laeuft.current = false
      setzeGesperrt(false)
      aufFehler(
        'unbekannter_fehler',
        ausnahme instanceof Error ? ausnahme.message : String(ausnahme),
      )
    }
  }

  return (
    <div>
      <h2>Einschub ersetzen</h2>
      <p>Wähle eine brauchbare Aktion für den Einschub.</p>
      {wahl.length === 0 ? (
        <p>
          Es gibt keine brauchbare Aktion zum Ersetzen.
          Repariere zuerst das Bild einer Aktion (die erste Fix-Option).
        </p>
      ) : (
        <ul>
          {wahl.map((aktion) => (
            <li key={aktion.id}>
              <label>
                <input
                  type="radio"
                  name="ersatz-einschub-aktion"
                  checked={ausgewaehlt === aktion.id}
                  onChange={() => setzeAusgewaehlt(aktion.id)}
                />
                <span>{aktion.titel}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        disabled={ausgewaehlt === null || gesperrt}
        onClick={() => {
          void uebernehmen()
        }}
      >
        Übernehmen
      </button>
      <button type="button" disabled={gesperrt} onClick={aufAbgebrochen}>
        Abbrechen
      </button>
      <p style={{ fontSize: 10 }}>
        Ersetzen tauscht nur die Aktion DIESES Einschubs; Zeitstelle und Dauer bleiben
        unverändert.
      </p>
    </div>
  )
}
