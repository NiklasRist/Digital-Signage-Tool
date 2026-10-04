// Die Bestätigungs- und Blockade-Anzeige des Medium-Löschens (#229 / M7-31).
//
// Die Anzeige rechnet NICHT selbst: die Lage kommt von pruefeLoeschLage
// (medium-loeschen.ts) herein,, der Schreibweg über die ÜBERGEBENE Wirkungen.
// Sie zeigt DREI Zustände:
//   1. Blockade - WELCHE Elemente sperren (Position + Mediumname), statt eines
//      "geht nicht". Der Nutzer soll NICHT Elemente suchen löschen, um den
//      Blockierer zu finden.
//   2. Bestätigung - die einzige unumkehrbare-Handlung Zweite der Anwendung;
//      Asymmetrie bewusst: Medium BLOCKIERT, Aktionen warnen (betroffeneAktionen
//      als Hinweis, KEINE Sperre - siehe die Lösch-Asymmetrie 9.5.3).
//   3. Fehler des Rückwegs - Code unverändert, Meldung unverändert, kein throw.

import type { JSX } from 'react'

import type { Project } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

import { pruefeLoeschLage } from './medium-loeschen'
import type { LoeschWirkungen } from './medium-loeschen'

export interface MediumLoeschenEigenschaften {
  projekt: Project
  assetId: string
  /** Der Schreibweg des composer mit dem Handle-Freigabeweg vor dem Einreihen
   *  (aus LoeschWirkungen, medium-loeschen.ts). Wird genau einmal bei Bestätigung gerufen. */
  loescheMedium: (
    projektId: string,
    assetId: string,
    wirkungen: LoeschWirkungen,
  ) => Promise<Ergebnis<{ auftragId: string }, string>>
  /** Gibt die offen `<video>`-Handles auf dieses Asset frei (aus #246, übergeben). */
  gibVideoHandlesFrei: (assetId: string) => void
  aufErledigt: () => void
  aufAbgebrochen: () => void
  aufFehler: (code: string, meldung: string) => void
}

export function MediumLoeschen(p: MediumLoeschenEigenschaften): JSX.Element {
  const lage = pruefeLoeschLage(p.projekt, p.assetId)
  const blockiert = lage.blockierer.length > 0

  async function bestaetigeLoschen(): Promise<void> {
    if (blockiert) {
      return
    }
    const antwort = await p.loescheMedium(p.projekt.id, p.assetId, {
      gibVideoHandlesFrei: p.gibVideoHandlesFrei,
    })
    if (antwort.ok) {
      p.aufErledigt()
    } else {
      p.aufFehler(antwort.fehler.code, antwort.fehler.meldung)
    }
  }

  return (
    <div data-testid="medium-loeschen">
      {blockiert ? (
        <>
          <p data-testid="medium-loeschen-blockiert">{lage.text}</p>
          <ul>
            {lage.blockierer.map((stelle) => (
              <li key={stelle.elementId} data-testid={`medium-loeschen-block-Element-${stelle.position}`}>
                Position {stelle.position}: {stelle.bezeichnung}
              </li>
            ))}
          </ul>
          <button type="button" onClick={p.aufAbgebrochen}>
            Zurück
          </button>
        </>
      ) : (
        <>
          <p data-testid="medium-loeschen-bestätigung">{lage.text}</p>
          {lage.betroffeneAktionen.length > 0 && (
            <div data-testid="medium-loeschen-aktionen">
              <p>
                Dieses Medium ist außerdem das Bild folgender Aktionen - diese zeigen nach dem
                Löschen einen Platzhalter an:
              </p>
              <ul>
                {lage.betroffeneAktionen.map((aktion) => (
                  <li key={aktion.aktionId}>{aktion.titel}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            data-testid="medium-loeschen-bestaetiger"
            onClick={() => {
              void bestaetigeLoschen()
            }}
          >
            Endgültig löschen
          </button>
          <button type="button" onClick={p.aufAbgebrochen}>
            Abbrechen
          </button>
        </>
      )}
    </div>
  )
}
