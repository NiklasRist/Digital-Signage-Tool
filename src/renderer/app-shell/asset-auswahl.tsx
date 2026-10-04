// Die Auswahlanzeige der Fix-Option "Medium ersetzen" (#202, TK 9.7.5).
//
// Diese Datei ruft KEINEN Kanal. Der einzige Weg zum Main ist die UEBERGEBENE
// Funktion `schliesseMediumFixAb` (#133) - ein direkter IPC-Aufruf haette den
// Kanal zwei Aufrufer gegeben, und nur einer davon zieht die gemeinsame Sicht
// nach (#133 reicht das zurueckgegebene Listenelement an gleicheElementAb).
//
// Zustandslos gegenueber der Übergabe: Diese Anzeige haelt keinen Zustand, den
// ein Reiterwechsel verlieren koennte - ihre einzige Eingabe ist die markierte
// Zeile, und die ist nach dem Bestaetigen ohnehin verbraucht.
//
// Die drei Verbote aus dem Issue, in dieser Datei erneut bestraft:
//   - Keine Vorpruefung des Zielassets im Sinne einer Ablehnung. Der Filter
//     (asset-auswahl-filter.ts) bestimmt, was ANGEBOTEN wird; ob die Referenz
//     gueltig ist, entscheidet #152 im Main.
//   - Kein Import-Ausloesen: Der Import ist die andere Fix-Option (#204).
//   - Kein Nachrechnen des Reparatur-Fortschritts: hier wird nur gemeldet
//     (aufAbgeschlossen / aufAbgebrochen / aufFehler), der Aufrufer leitet weiter.

import { useRef, useState } from 'react'
import type { JSX } from 'react'

import type { Asset } from '../../shared/contracts/asset'
import type { Project } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { medienUrl } from '../../shared/medien-url'

import type { FixWirkung } from '../composer/reparatur-optionen'
import { benoetigterAssetTyp, waehlbareAssets } from './asset-auswahl-filter'

export interface AssetAuswahlEigenschaften {
  /** Das Element, dessen Referenz umgesetzt werden soll – aus { ziel: 'asset-auswahl', elementId }. */
  elementId: string
  /** Das geladene Projekt (aus der gemeinsamen Sicht, #197). Wird nur gelesen. */
  projekt: Project
  /** Der Rückweg aus #133. Wird als Parameter übergeben, nicht importiert (Entscheidung E1). */
  schliesseMediumFixAb: (elementId: string, neueAssetId: string) => Promise<Ergebnis<FixWirkung>>
  /** Der Nutzer hat gewählt und der Rückweg hat bestätigt. Der Aufrufer beendet die Übergabe. */
  aufAbgeschlossen: (wirkung: FixWirkung) => void
  /** Der Nutzer bricht ab. Der Aufrufer beendet die Übergabe, ohne dass etwas geschrieben wurde. */
  aufAbgebrochen: () => void
  /** Ein Fehler des Rückwegs. Diese Datei zeigt ihn nicht selbst an. */
  aufFehler: (code: string, meldung: string) => void
}

export function AssetAuswahl(eigenschaften: AssetAuswahlEigenschaften): JSX.Element {
  const {
    elementId,
    projekt,
    schliesseMediumFixAb,
    aufAbgeschlossen,
    aufAbgebrochen,
    aufFehler,
  } = eigenschaften

  const [ausgewaehlt, setAusgewaehlt] = useState<Asset | null>(null)
  const [gesperrt, setGesperrt] = useState(false)
  // Der SYNCHRONE Teil der Sperre (kommentiert in aktions-auswahl.tsx): Der
  // disabled-Knopf greift erst beim Re-Render; der Ref schliesst die Fensterlücke
  // zwischen zwei Klicks vor der Antwort.
  const laeuft = useRef(false)

  const element = projekt.liste.find((e) => e.id === elementId)

  if (element === undefined) {
    // Keine Liste, kein Aufruf des Rueckwegs; der Wurf eines useEffect wird
    // vermieden, indem die Meldung direkt beim Rendern an den Aufrufer gemeldet
    // wird (darf reine Aufrufer-Funktion sein und rendert nichts mehr von sich).
    meldeUndLeere(
      () => aufFehler('nicht_gefunden', `Es gibt kein Listenelement mit der ID "${elementId}".`),
    )
    return null as unknown as JSX.Element
  }

  const typ = benoetigterAssetTyp(element)
  if (typ === null) {
    // Ein segment-Element hat hier nichts zu suchen - fuer Segmente ist die
    // Aktions-Auswahl zuständig (#203). Ein stiller Rueckfall auf "dann zeige ich
    // eben Bilder" wuerde eine Aktions-ID durch eine Asset-ID ersetzen.
    meldeUndLeere(
      () =>
        aufFehler(
          'ungueltige_eingabe',
          'Das Element ist ein Segment; fuer dessen Reparatur ist die Aktions-Auswahl zuständig.',
        ),
    )
    return null as unknown as JSX.Element
  }

  const wahl = waehlbareAssets(projekt.assets, typ)

  async function uebernehmen(): Promise<void> {
    if (laeuft.current || ausgewaehlt === null) {
      return
    }
    laeuft.current = true
    // Genau EIN Aufruf; bis zur Antwort ist die Auswahl gesperrt. Ein zweiter
    // Klick wuerde einen zweiten Schreibvorgang auf dasselbe Element ausloesen.
    setGesperrt(true)
    try {
      const antwort = await schliesseMediumFixAb(elementId, ausgewaehlt.id)
      if (antwort.ok) {
        aufAbgeschlossen(antwort.wert)
      } else {
        // Unveraenderter Code; die Auswahl bleibt offen - der Nutzer kann es
        // erneut oder mit einem anderen Medium versuchen.
        laeuft.current = false
        setGesperrt(false)
        aufFehler(antwort.fehler.code, antwort.fehler.meldung)
      }
    } catch (ausnahme) {
      // Der Wurf verlaesst die Datei nicht.
      laeuft.current = false
      setGesperrt(false)
      aufFehler(
        'unbekannter_fehler',
        ausnahme instanceof Error ? ausnahme.message : String(ausnahme),
      )
    }
  }

  return (
    <div>
      <h2>Medium ersetzen</h2>
      <p>Wähle ein Ersatz-Medium für das fehlende Medium.</p>
      {wahl.length === 0 ? (
        <p>
          Es gibt kein {typ === 'video' ? 'Video' : 'Bild'}, das angeboten werden kann.
          Importiere zuerst ein Medium und wähle dann erneut "Medium ersetzen".
        </p>
      ) : (
        <ul>
          {wahl.map((asset) => (
            <li key={asset.id}>
              <label>
                <input
                  type="radio"
                  name="ersatz-asset"
                  checked={ausgewaehlt?.id === asset.id}
                  onChange={() => setAusgewaehlt(asset)}
                />
                {asset.typ === 'video' ? (
                  <video src={medienUrl(projekt.id, asset.dateiname)} width={96} />
                ) : (
                  <img
                    src={medienUrl(projekt.id, asset.dateiname)}
                    alt={asset.originalname}
                    width={96}
                  />
                )}
                <span>{asset.originalname}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <button type="button" disabled={ausgewaehlt === null || gesperrt} onClick={() => void uebernehmen()}>
        Übernehmen
      </button>
      <button type="button" disabled={gesperrt} onClick={aufAbgebrochen}>
        Abbrechen
      </button>
    </div>
  )
}

function meldeUndLeere(melde: () => void): void {
  melde()
}
