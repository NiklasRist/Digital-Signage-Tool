// Issue #424 - die sichtbaren Undo/Redo-Pfeile der Shell (FA-21, TK 9.14.2).
//
// Sie sind seit dem 09.11.2026 der EINE Weg fuer BEIDE Historien: Projekt-Bearbeitung
// und Vorlagen-Editor. Der Rahmen reicht den WIRKSAMEN Bereich herein (er kennt die
// offenen Ansichten); diese Datei waehlt danach den Zugang, die Anzeige und die Tastatur.
//
// WARUM DIE TASTATUR HIER LIEGT: Vorher registrierte App.tsx Cmd+Z fest auf die
// Projekt-Historie. Im Vorlagen-Editor (Tab ODER Ansicht ueber der Reiterflaeche) haette
// das die falsche Historie zurueckgenommen. Tastatur und Pfeile muessen DENSELBEN Bereich
// sehen - sonst gibt es zwei Wahrheiten. Deshalb registriert diese Komponente beide.
//
// Im Marken- und Projekte-Reiter bleibt sie abgeschaltet (bereichFuerReiter/TK 9.15.2:
// "der Marken-Reiter hat in v1 KEINE Historie").

import { useCallback, useEffect, useState, type JSX } from 'react'

import type { ProjektZugang } from './sichten'
import type { Historienbereich } from './undo-historien'
import { registriereTastaturHandler } from './tastatur'
import { sitzungshalter } from './undo-aufzeichnung-vorlage'
import {
  kannRueckgaengig,
  kannWiederherstellen,
  macheRueckgaengig,
  stelleWiederHer,
  type ProjektUndoZugang,
} from './undo-projekt'
import {
  kannVorlageRueckgaengig,
  kannVorlageWiederherstellen,
  macheVorlageRueckgaengig,
  stelleVorlageWiederHer,
  type VorlagenUndoZugang,
} from './undo-vorlage'

export interface UndoPfeileProps {
  /** Der WIRKSAME Bereich: offene Ansicht vor Reiter (der Rahmen entscheidet). */
  bereich: Historienbereich | null
  /** Liefert den ROHEN Projektzugang (aus der Shell) oder null, solange kein Lauf steht. */
  holeProjektzugang: () => ProjektZugang | null
  /** Liefert den Zugang der Vorlagen-Arbeitskopie; fehlt er, bleibt der Bereich ohne Pfeile. */
  holeVorlagenzugang?: () => VorlagenUndoZugang | null
  /** Der EINE Meldeweg der Shell. */
  meldeFehler: (code: string, meldung: string) => void
}

export function UndoPfeile(p: UndoPfeileProps): JSX.Element {
  // Re-Render-Anlass: Jede Aenderung der jeweiligen Sicht. Schnappschuesse entstehen
  // bei Mutationen (die die Sicht aendern), ein Rueckgaengig aendert die Sicht ebenfalls.
  const [, setzeVersion] = useState(0)

  useEffect(() => {
    if (p.bereich !== 'projekt-bearbeitung') return
    const zug = p.holeProjektzugang()
    if (zug === null) return
    return zug.aufGeaendert(() => setzeVersion((stand) => stand + 1))
  }, [p.bereich, p.holeProjektzugang])

  useEffect(() => {
    if (p.bereich !== 'vorlagen-editor') return
    // DERSELBE Halter, den der Vorlagen-Editor benutzt (#245): kein zweiter Zustand.
    return sitzungshalter().aufSitzungGeaendert(() => setzeVersion((stand) => stand + 1))
  }, [p.bereich])

  const projektZugang: ProjektUndoZugang | null = (() => {
    if (p.bereich !== 'projekt-bearbeitung') return null
    const zug = p.holeProjektzugang()
    return zug === null
      ? null
      : { holeProjekt: () => zug.hole().projekt, setzeProjekt: zug.setzeProjekt }
  })()

  const vorlagenZugang: VorlagenUndoZugang | null =
    p.bereich === 'vorlagen-editor' ? p.holeVorlagenzugang?.() ?? null : null

  const kannZurueck = projektZugang !== null
    ? kannRueckgaengig(projektZugang)
    : vorlagenZugang !== null
      ? kannVorlageRueckgaengig(vorlagenZugang)
      : false
  const kannVor = projektZugang !== null
    ? kannWiederherstellen(projektZugang)
    : vorlagenZugang !== null
      ? kannVorlageWiederherstellen(vorlagenZugang)
      : false

  const tue = useCallback((richtung: 'zurueck' | 'vor'): void => {
    if (p.bereich === 'projekt-bearbeitung') {
      const zug = p.holeProjektzugang()
      if (zug === null) return
      const undoZugang: ProjektUndoZugang = {
        holeProjekt: () => zug.hole().projekt,
        setzeProjekt: zug.setzeProjekt,
      }
      const ruf = richtung === 'zurueck' ? macheRueckgaengig : stelleWiederHer
      void ruf(undoZugang).then((antwort) => {
        if (!antwort.ok) p.meldeFehler(antwort.fehler.code, antwort.fehler.meldung)
      })
      return
    }
    if (p.bereich === 'vorlagen-editor') {
      const zugang = p.holeVorlagenzugang?.()
      if (zugang === undefined || zugang === null) return
      const ruf = richtung === 'zurueck' ? macheVorlageRueckgaengig : stelleVorlageWiederHer
      void ruf(zugang).then((antwort) => {
        if (!antwort.ok) p.meldeFehler(antwort.fehler.code, antwort.fehler.meldung)
      })
    }
  }, [p.bereich, p.holeProjektzugang, p.holeVorlagenzugang, p.meldeFehler])

  // Cmd/Strg+Z und Shift+Cmd/Strg+Z laufen ueber DENSELBEN `tue`-Weg wie die Pfeile.
  // `tastatur.ts` laesst Cmd+Z in Textfeldern dem Feld (#431).
  useEffect(() => registriereTastaturHandler({
    rueckgaengig: () => tue('zurueck'),
    wiederherstellen: () => tue('vor'),
  }), [tue])

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
