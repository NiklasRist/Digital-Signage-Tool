// Issue #424 - die sichtbaren Undo/Redo-Pfeile der Shell (FA-21, TK 9.14.2).
//
// Die Anzeige-Zustaende (kannRueckgaengig/kannWiederherstellen, bereichFuerReiter) waren
// gebaut, hatten aber KEINEN UI-Aufrufer - nur die Tastatur (Cmd+Z, #350). Diese Leiste
// ist der sichtbare Weg; sie ruft DIESELBEN Wege wie die Tastatur (macheRueckgaengig /
// stelleWiederHer), keinen zweiten Undo-Pfad.
//
// Sie sitzt in der Reiterleiste des Rahmens und ueberlebt den Reiterwechsel. Im
// Marken- und Projekte-Reiter ist sie ABGESCHALTET (bereichFuerReiter liefert dort null,
// TK 9.14.2: "der Reiter Marken hat in v1 KEINE Historie").

import { useEffect, useState, type JSX } from 'react'

import type { ReiterId } from './reiter'
import type { ProjektZugang } from './sichten'
import { bereichFuerReiter } from './undo-historien'
import {
  kannRueckgaengig,
  kannWiederherstellen,
  macheRueckgaengig,
  stelleWiederHer,
  type ProjektUndoZugang,
} from './undo-projekt'

export interface UndoPfeileProps {
  /** Der gerade aktive Reiter (der Rahmen kennt ihn, nicht die App). */
  reiter: ReiterId
  /** Liefert den ROHEN Projektzugang (aus der Shell) oder null, solange kein Lauf steht. */
  holeProjektzugang: () => ProjektZugang | null
  /** Der EINE Meldeweg der Shell. */
  meldeFehler: (code: string, meldung: string) => void
}

export function UndoPfeile(p: UndoPfeileProps): JSX.Element {
  // Re-Render-Anlass: Jede Aenderung der gemeinsamen Sicht. Schnappschuesse entstehen
  // bei Mutationen (die die Sicht aendern), ein Rueckgaengig aendert die Sicht ebenfalls.
  const [, setzeVersion] = useState(0)

  useEffect(() => {
    const zug = p.holeProjektzugang()
    if (zug === null) return
    return zug.aufGeaendert(() => setzeVersion((stand) => stand + 1))
  }, [p.reiter, p.holeProjektzugang])

  const zug = p.holeProjektzugang()
  const undoZugang: ProjektUndoZugang | null =
    zug === null
      ? null
      : { holeProjekt: () => zug.hole().projekt, setzeProjekt: zug.setzeProjekt }

  const bereich = bereichFuerReiter(p.reiter)
  const aktiv = bereich === 'projekt-bearbeitung' && undoZugang !== null
  const kannZurueck = aktiv && undoZugang !== null && kannRueckgaengig(undoZugang)
  const kannVor = aktiv && undoZugang !== null && kannWiederherstellen(undoZugang)

  const tue = (richtung: 'zurueck' | 'vor'): void => {
    if (undoZugang === null) return
    const ruf = richtung === 'zurueck' ? macheRueckgaengig : stelleWiederHer
    void ruf(undoZugang).then((antwort) => {
      if (!antwort.ok) p.meldeFehler(antwort.fehler.code, antwort.fehler.meldung)
    })
  }

  return (
    <span style={{ display: 'flex', gap: 4, marginLeft: 8, alignItems: 'center' }}>
      <button
        type="button"
        data-testid="undo-pfeil"
        disabled={!kannZurueck}
        title="Rückgängig (Cmd/Strg+Z)"
        onClick={() => tue('zurueck')}
      >
        ↶
      </button>
      <button
        type="button"
        data-testid="redo-pfeil"
        disabled={!kannVor}
        title="Wiederherstellen (Shift+Cmd/Strg+Z)"
        onClick={() => tue('vor')}
      >
        ↷
      </button>
    </span>
  )
}
