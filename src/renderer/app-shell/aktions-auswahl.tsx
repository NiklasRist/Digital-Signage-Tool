// Die Auswahlanzeige der Fix-Optionen "Aktion ersetzen" Fall 2/#203 und
// "Abschnitt ersetzen" Fall 3/TK 9.7.5.
//
// EINE Anzeige fuer BESFALL: Fall 2 (segment-Element, abschnittIndex null) und
// Fall 3 (Band-Abschnitt, abschnittIndex eine Zahl) unterscheiden sich allein im
// Rückweg. Kein direkter IPC; beide Rückwege (#133) kommen als Parameter herein.
//
// Diese Datei bildet das neue Band NICHT selbst (ENTSCHIEDEN 7): Der Abschnitts-
// Rueckweg bekommt Element, Index, neue Aktion und das UNVERAENDERTES Projekt -
// das Zusammensetzen des neuen Einblendung-Werts gehoert in den composer, wo dieselbe
// Rechnung bereits für abschnitt_entfernen liegt (bandVorlageId übernehmen, TK 9.2.8).
//
// Dokumentation der Auswahl: Genau einer der Rückwege wird GENAU einmal gerufen,
// die Auswahl ist bis zur Antwort gesperrt (Doppelklick wirkungslos); ok:false
// meldet den Code UNVERAENDERT und lasst die Auswahl offen; ein Wurf eines Rückwegs
// wird gefangen und als unbekannter_fehler gemeldet. Der Reparatur-Fortschritt
// wird hier NICHT nachgerechnet.

import { useRef, useState } from 'react'
import type { JSX } from 'react'

import type { Project } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { medienUrl } from '../../shared/medien-url'

import type { FixWirkung } from '../composer/reparatur-optionen'
import { waehlbareAktionen } from './aktions-auswahl-filter'

export interface AktionsAuswahlEigenschaften {
  /** Aus { ziel: 'aktions-auswahl', elementId, abschnittIndex }. */
  elementId: string
  /** null = Segment-Listenelement (Fall 2); Zahl = Band-Abschnitt dieses Index (Fall 3). */
  abschnittIndex: number | null
  /** Das geladene Projekt (aus der gemeinsamen Sicht, #197). Wird nur gelesen. */
  projekt: Project

  /** Rückweg für Fall 2 (abschnittIndex === null). Aus #133, als Parameter übergeben. */
  schliesseAktionsFixAb: (elementId: string, neueAktionId: string) => Promise<Ergebnis<FixWirkung>>
  /** Rückweg für Fall 3 (abschnittIndex ist eine Zahl). Setzt den Abschnitt im Band um.
   *  Zeichengleich aus #133 – dort heisst sie `schliesseAbschnittsFixAb` (mit „s") und nimmt
   *  VIER Parameter; `projekt` wird gebraucht, weil `setzeEinblendung` die GANZE Einblendung
   *  ersetzt und das uebrige Band dafuer bekannt sein muss. */
  schliesseAbschnittsFixAb: (
    elementId: string,
    abschnittIndex: number,
    neueAktionId: string,
    projekt: Project,
  ) => Promise<Ergebnis<FixWirkung>>

  aufAbgeschlossen: (wirkung: FixWirkung) => void
  aufAbgebrochen: () => void
  aufFehler: (code: string, meldung: string) => void
}

export function AktionsAuswahl(eigenschaften: AktionsAuswahlEigenschaften): JSX.Element {
  const {
    elementId,
    abschnittIndex,
    projekt,
    schliesseAktionsFixAb,
    schliesseAbschnittsFixAb,
    aufAbgeschlossen,
    aufAbgebrochen,
    aufFehler,
  } = eigenschaften

  const [ausgewaehlt, setzeAusgewaehlt] = useState<string | null>(null)
  const [gesperrt, setzeGesperrt] = useState(false)
  // Der SYNCHRONE Teil der Sperre: React kümmert sich um den disabled-Knopf erst
  // beim Re-Render; ein zweiter Klick vor der Antwort lief sonst in eine alte
  // Closure (gemessen, Test 'zweiter Klick vor der Antwort'). Der Ref zählt
  // synchron im selben Takt wie der Rückweg-Aufruf.
  const laeuft = useRef(false)

  const element = projekt.liste.find((e) => e.id === elementId)

  if (element === undefined) {
    aufFehler('nicht_gefunden', `Es gibt kein Listenelement mit der ID "${elementId}".`)
    return null as unknown as JSX.Element
  }

  // Die aktuell referenzierte Aktion - fuer die Ausschluss-Liste: Fall 2 aus
  // element.ref, Fall 3 aus dem Abschnitt.
  let aktuell: string | null = null
  if (abschnittIndex === null) {
    if (element.art !== 'segment') {
      // Fuer video/bild ist #202 zustaendig; die Shell darf die Referenz nicht
      // umsetzen, ohne den Typ zu kennen.
      aufFehler('ungueltige_eingabe', 'Dieses Element ist kein Segment; für seine Reparatur ist die Asset-Auswahl zuständig.')
      return null as unknown as JSX.Element
    }
    aktuell = element.ref
  } else {
    if (element.einblendung === null) {
      aufFehler('nicht_gefunden', 'Das Element trägt keine Einblendung; die kaputte Stelle ist inzwischen verschwunden.')
      return null as unknown as JSX.Element
    }
    const abschnitt = element.einblendung.abschnitte[abschnittIndex]
    if (abschnitt === undefined) {
      aufFehler('nicht_gefunden', `Der Band-Abschnitt ${abschnittIndex} existiert nicht mehr.`)
      return null as unknown as JSX.Element
    }
    aktuell = abschnitt.aktionRef
  }

  const wahl = waehlbareAktionen(projekt.aktionen, projekt.assets, aktuell)

  async function uebernehmen(): Promise<void> {
    if (laeuft.current || ausgewaehlt === null) {
      return
    }
    laeuft.current = true
    setzeGesperrt(true)
    try {
      const antwort =
        abschnittIndex === null
          ? await schliesseAktionsFixAb(elementId, ausgewaehlt)
          : await schliesseAbschnittsFixAb(elementId, abschnittIndex, ausgewaehlt, projekt)
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

  const bezeichnung = (aktionId: string): string =>
    projekt.aktionen.find((a) => a.id === aktionId)?.titel ?? aktionId

  return (
    <div>
      <h2>Aktion ersetzen</h2>
      <p>Wähle eine brauchbare Aktion als Ersatz.</p>
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
                  name="ersatz-aktion"
                  checked={ausgewaehlt === aktion.id}
                  onChange={() => setzeAusgewaehlt(aktion.id)}
                />
                {aktion.bildRef !== null ? (
                  (() => {
                    const asset = projekt.assets.find((eintrag) => eintrag.id === aktion.bildRef)
                    if (asset === undefined) return null as unknown as JSX.Element
                    return (
                      <img
                        src={medienUrl(projekt.id, asset.dateiname)}
                        alt={asset.originalname}
                        width={96}
                      />
                    )
                  })()
                ) : null}
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
        Ersetzen tut nur DIESE Stelle; die alte Aktion bleibt in der Bibliothek und
        bleibt an ihren übrigen Verwendungen kaputt.
      </p>
      {aktuell !== null && <span hidden>aktuell: {bezeichnung(aktuell)}</span>}
    </div>
  )
}
