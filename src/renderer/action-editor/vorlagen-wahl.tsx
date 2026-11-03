// [action-editor] Die Vorlagen-Auswahl MIT BILD (Entscheidung 03.11.2026)
//
// Vorher war das ein `<select>` mit Namen: „Ganzflaechig", „Zwei Spalten",
// „Band-Standard". Wer die Vorlagen nicht im Kopf hat, waehlte blind - und sah das
// Ergebnis erst nach dem Wechsel im grossen Vorschaubild.
//
// Jetzt steht je Vorlage ein Bild aus DEMSELBEN Zeichenweg wie die Vorschau
// (`vorlagen-bilder.ts`), darunter Name und Flaeche. Die Bilder entstehen EINMAL beim
// Oeffnen des Formulars (der Formularblock wird je Entwurf neu montiert) - sie sind
// Layout-Vorschauen, kein Live-Bild; das grosse Bild daneben bleibt live.
//
// Die Auswahl selbst ist ein Klick: `aufWahl` - im Modus „neu" in den Entwurf, im
// Modus „bestehend" ueber `feldVerlassen` in den Speicherweg. Diese Datei schreibt
// NICHTS und ruft KEIN IPC.

import { useEffect, useRef, useState, type JSX } from 'react'

import type { Vorlage } from '../../shared/contracts/vorlage'
import { holeBereiteMarke } from '../gemeinsam/marken-bereitstellung'
import type { AktionsEntwurf } from './aktion-bearbeiten'
import { zeichneVorlagenBild } from './vorlagen-bilder'

/** Anzeigebreite eines Vorlagenbildes in der 320-px-Formularspalte. */
const BILD_BREITE = 284

export interface VorlagenWahlEigenschaften {
  /** Die waehlbaren Vorlagen in Bestandsreihenfolge (keine Sortierung hier). */
  waehlbare: readonly Vorlage[]
  /** Die Kennung, die gerade gilt. */
  aktuell: string
  /** Der Entwurf - nur fuer die BILDER; er wird hier nicht veraendert. */
  entwurf: AktionsEntwurf
  /** Ein Klick auf eine Vorlage. */
  aufWahl: (vorlagenId: string) => void
}

/** „Ganzbild (1920 × 1080)" oder „Band (1920 × 162)" - EINE Beschriftung. */
function flaecheText(vorlage: Vorlage): string {
  return vorlage.höhe === null ? 'Ganzbild (1920 × 1080)' : `Band (1920 × ${String(vorlage.höhe)})`
}

export function VorlagenWahl(p: VorlagenWahlEigenschaften): JSX.Element {
  // Der Stand beim OEFFNEN. `useState` statt direkter Nutzung, damit ein spaeterer
  // Feldwechsel die Bilder nicht neu zeichnet (s. Kopf dieser Datei).
  const [inhalt] = useState<AktionsEntwurf>(p.entwurf)
  // NUR der BEREITSCHAFTS-Zustand ist eine Abhaengigkeit, nicht das Marken-OBJEKT:
  // Ein Objekt in den Abhaengigkeiten liesse den Effekt bei jedem Rendern erneut laufen
  // (jedes `holeBereiteMarke` kann eine neue Referenz liefern) und alle Vorlagenbilder
  // neu zeichnen - genau die Arbeit, die diese Datei vermeiden soll.
  const markeBereit = holeBereiteMarke(inhalt.markeId) !== null
  const liste = useRef<HTMLUListElement | null>(null)

  useEffect(() => {
    const marke = holeBereiteMarke(inhalt.markeId)
    const ziele = liste.current?.querySelectorAll<HTMLElement>('[data-testid="vorlagen-bild"]') ?? []
    p.waehlbare.forEach((vorlage, stelle) => {
      const ziel = ziele[stelle]
      if (ziel === undefined) return
      ziel.replaceChildren()
      if (marke === null) return
      const bild = zeichneVorlagenBild(inhalt, vorlage, marke, BILD_BREITE)
      if (bild !== null) ziel.append(bild)
    })
    // `markeBereit` haengt an der Vorbereitung: Wird die Marke spaeter bereitgestellt,
    // laeuft der Effekt erneut und die Bilder erscheinen - ohne eigene Wartezeit.
  }, [p.waehlbare, inhalt, markeBereit])

  return (
    <ul
      ref={liste}
      data-testid="aktion-vorlagen-wahl"
      style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}
    >
      {p.waehlbare.map((vorlage) => {
        const gewaehlt = vorlage.id === p.aktuell
        return (
          <li key={vorlage.id}>
            <button
              type="button"
              data-testid={`aktion-vorlage-${vorlage.id}`}
              data-gewaehlt={gewaehlt ? 'ja' : 'nein'}
              aria-pressed={gewaehlt}
              onClick={() => p.aufWahl(vorlage.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: 6,
                cursor: 'pointer',
                color: 'inherit',
                background: '#1b1b1b',
                border: gewaehlt ? '2px solid #FF4040' : '1px solid #444',
              }}
            >
              <span
                data-testid="vorlagen-bild"
                style={{ display: 'block', lineHeight: 0, background: '#000', minHeight: 12 }}
              />
              <span style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
                {vorlage.name} &ndash; {flaecheText(vorlage)}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
