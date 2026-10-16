// [app-shell] Leerzustände ohne offenes Projekt

import type { JSX } from 'react'
// Verbindlicher Signaturimport von #198. ENTSCHIEDEN 1 verengt `reiter` auf zwei Werte,
// deshalb wird `ReiterId` im Code nie benoetigt - der Import bleibt dennoch Teil des
// Vertrags und wird nicht entfernt (siehe GERUEST-Kopf, "die Importe ... SIND der Vertrag").
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ReiterId } from './reiter'

export interface LeerzustandEigenschaften {
  /** Für welchen Reiter der Hinweis gezeigt wird. Bestimmt nur den Text. */
  reiter: 'zusammenstellen' | 'aktionen'
  /** Der Weg zum Reiter Projekte. Wird vom Aufrufer als wechsleReiter('projekte') gebildet. */
  aufProjekteWechseln: () => void
}

const TEXTE: Record<LeerzustandEigenschaften['reiter'], { ueberschrift: string; satz: string }> = {
  zusammenstellen: {
    ueberschrift: 'Zusammenstellen',
    satz: 'Hier entsteht die Wiedergabeliste. Öffnen Sie ein Projekt im Reiter Projekte, um mit dem Zusammenstellen zu beginnen.',
  },
  aktionen: {
    ueberschrift: 'Aktionen',
    satz: 'Hier werden die Aktionen eines Projekts angelegt und bearbeitet. Öffnen Sie ein Projekt im Reiter Projekte, um loszulegen.',
  },
}

export function Leerzustand(eigenschaften: LeerzustandEigenschaften): JSX.Element {
  const texte = TEXTE[eigenschaften.reiter]
  return (
    <div
      role="status"
      style={{
        padding: '32px',
        maxWidth: '560px',
      }}
    >
      <h2>{texte.ueberschrift}</h2>
      <p>{texte.satz}</p>
      <button type="button" onClick={eigenschaften.aufProjekteWechseln}>
        Zum Reiter Projekte
      </button>
    </div>
  )
}