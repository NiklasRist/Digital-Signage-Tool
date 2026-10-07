// [app-shell] Beenden-Dialog (#336, TK 9.5.4): Empfehlung je Ursache, "Erneut versuchen"
// und der benannte Ausweg "Trotzdem schließen und Änderungen verwerfen" - NIE vorausgewählt.

import { useState } from 'react'
import type { JSX } from 'react'
import { KANAELE } from '../../shared/contracts/kanaele'
import { abonniere } from '../../renderer/ipc-client/ereignisse'
import { rufeAuf } from '../../renderer/ipc-client/rufe-auf'

export interface BeendenDialogEigenschaften {
  /** Der laufende Abonnier-Weg: Rueckgabe ist die Abmelde-Funktion (#151). */
  abo: typeof abonniere
  /** Der RUECKKANAL zum Main (beenden:entscheidung). Voreinstellung ist der echte Ruf. */
  entscheidung?: (wert: 'wiederholen' | 'verwerfen') => Promise<unknown>
}

interface BeendenStatus {
  berichte: readonly {
    speicher: string
    ok: boolean
    code?: string
    meldung?: string
  }[]
  empfehlung: string
}

export function BeendenDialog(eigenschaften: BeendenDialogEigenschaften): JSX.Element | null {
  const [status, setzeStatus] = useState<BeendenStatus | null>(null)
  const schickeEntscheidung =
    eigenschaften.entscheidung ??
    ((wert: 'wiederholen' | 'verwerfen'): Promise<unknown> => {
      return rufeAuf(KANAELE.beenden.entscheidung, { entscheidung: wert })
    })

  const abo = eigenschaften.abo
  const [abmelden] = useState(() =>
    // Ein Abonnement, genau einmal beim Aufbau; die Liste zeigt den letzten Stand.
    abo<BeendenStatus>(KANAELE.beenden.status, (nutzlast: BeendenStatus) => {
      setzeStatus(nutzlast)
    }),
  )

  const entlasse = (): void => {
    abmelden()
    setzeStatus(null)
  }

  if (status === null) {
    return null
  }
  const gescheiterte = status.berichte.filter((bericht) => !bericht.ok)
  return (
    <div data-testid="beenden-dialog">
      <h3>Aenderungen nicht gespeichert</h3>
      <p data-testid="beenden-empfehlung">{status.empfehlung}</p>
      <ul data-testid="beenden-liste">
        {gescheiterte.map((bericht) => (
          <li key={bericht.speicher}>
            {bericht.speicher}
            {bericht.code !== undefined ? ` (${bericht.code})` : ''}
          </li>
        ))}
      </ul>
      <button
        data-testid="beenden-wiederholen"
        onClick={(): void => {
          const erneut = (): void => entlasse()
          void schickeEntscheidung('wiederholen').then(erneut)
        }}
      >
        Erneut versuchen
      </button>
      {/* Nicht vorausgewählt; der Verlust ist BENANNT, nicht als Abbrechen getarnt. */}
      <button
        data-testid="beenden-verwerfen"
        onClick={(): void => {
          void schickeEntscheidung('verwerfen').then(() => entlasse())
        }}
      >
        Trotzdem schließen und Änderungen verwerfen
      </button>
    </div>
  )
}
