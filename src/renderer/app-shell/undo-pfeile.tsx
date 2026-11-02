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
    <span
      style={{
        display: 'flex',
        gap: 2,
        marginLeft: 8,
        paddingLeft: 8,
        alignItems: 'center',
        // Eigene Gruppe: eine feine Trennlinie loest die Pfeile von der Navigation.
        borderLeft: '1px solid #2c2c34',
      }}
    >
      <button
        type="button"
        data-testid="undo-pfeil"
        aria-label="Rückgängig"
        disabled={!kannZurueck}
        title="Rückgängig (Cmd/Strg+Z)"
        onClick={() => tue('zurueck')}
        style={{
          width: 28,
          height: 28,
          minHeight: 0,
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Symbole statt Textzeichen: "↶/↷" werden je nach Systemschrift
            unterschiedlich gross und schief gezeichnet (am Bild gesehen). */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6.5 3.5 3 7l3.5 3.5" />
          <path d="M3 7h6.5a3.5 3.5 0 0 1 0 7H8" />
        </svg>
      </button>
      <button
        type="button"
        data-testid="redo-pfeil"
        aria-label="Wiederherstellen"
        disabled={!kannVor}
        title="Wiederherstellen (Shift+Cmd/Strg+Z)"
        onClick={() => tue('vor')}
        style={{
          width: 28,
          height: 28,
          minHeight: 0,
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9.5 3.5 13 7l-3.5 3.5" />
          <path d="M13 7H6.5a3.5 3.5 0 0 0 0 7H8" />
        </svg>
      </button>
    </span>
  )
}
