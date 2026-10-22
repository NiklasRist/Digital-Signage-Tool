// [marken-editor] Die Live-Vorschau der dritten Spalte (TK 9.14.1 / 9.15.2, #303/#330).
//
// EIN Zeichenweg: gerufen wird ausschliesslich `zeichneMarkenVorschau` (#303), das
// seinerseits `zeichneSegment` ruft - dieselbe Routine wie das spaetere Segment
// (TK 9.10.1). Diese Datei zeichnet keinen Pixel selbst und baut die Marke NICHT
// mit CSS nach.
//
// Vorbereitung (ENTSCHIEDEN 22.10.2026, A1): `stelleMarkenSchriftenBereit(marke)`
// und `bereiteLogoVor(marke)` - KEIN `stelleMarkeBereit` (der marken-editor
// benutzt den Zwischenspeicher der Aktionen nicht, #312 ENTSCHIEDEN 5), KEIN
// `ZeichenZugang` (der verlangt ein Projekt, TK 9.14.2) und kein Projekt.
// VOR den importierten Schriften steht `stelleSchriftenBereit()` (#8) fuer die
// vier gebuendelten Rollen: Sie werden NICHT beim App-Start geladen, sondern
// von jedem zeichnenden Modul vor dem ersten Aufruf (action-editor #140,
// vorlagen-editor #155, composer #313). Ohne ihn faende `zeichneSegment` fuer
// eine Marke mit gebuendelten Schriften klanglos eine Ersatzschrift - genau der
// stille Markenbruch, den TK 9.10.3 als Vertragsbruch fuehrt.
//
// Feste Vorlage: „Vollbild" (A1). Kein Umschalter, keine zweite Auswahl.

import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import type { Marke } from '../../shared/contracts/marke'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { VorlagenZugang } from '../app-shell/sichten'
import { stelleSchriftenBereit } from '../template-canvas/schriften'
import { stelleMarkenSchriftenBereit } from '../template-canvas/marken-schriften'
import { bereiteLogoVor } from '../template-canvas/logo-laden'
import { zeichneMarkenVorschau } from './live-vorschau'

/** Die feste Vorschau-Vorlage (A1, 22.10.2026). Anzeigename der eingebauten Vorlage. */
export const VORSCHAU_VORLAGE_NAME = 'Vollbild'

/**
 * Sucht die eingebaute Vorlage „Vollbild" in der gemeinsamen Vorlagen-Sicht.
 * REIN: liest nur `hole()`, laedt nichts nach (die Sicht wird beim App-Aufbau
 * geladen, #155). null = nicht verfuegbar; der Aufrufer zeichnet dann NICHT.
 */
export function findeVorschauVorlage(vorlagen: VorlagenZugang): Vorlage | null {
  const uebersicht = vorlagen.hole()
  if (uebersicht === null) return null
  const eintrag = uebersicht.nutzbare.find(
    (kandidat) => kandidat.eingebaut && kandidat.vorlage.name === VORSCHAU_VORLAGE_NAME,
  )
  return eintrag === undefined ? null : eintrag.vorlage
}

/**
 * Haengt das gezeichnete Canvas ein und skaliert es AUSSCHLIESSLICH per CSS.
 * `canvas.width/height` bleiben die nativen 1920x1080 (TK 9.10.3 Punkt 2).
 */
function haengeEin(ziel: HTMLElement, bild: ReturnType<typeof zeichneMarkenVorschau>): void {
  bild.canvas.style.width = '100%'
  bild.canvas.style.maxWidth = '100%'
  bild.canvas.style.height = 'auto'
  bild.canvas.style.aspectRatio = `${bild.breite} / ${bild.höhe}`
  if (bild.canvas.parentElement !== ziel) {
    ziel.replaceChildren(bild.canvas)
  }
}

export interface MarkenVorschauProps {
  /** Die geoeffnete Marke oder null (keine offen). */
  marke: Marke | null
  vorlagen: VorlagenZugang
}

/**
 * Zeichnet die Vorschau der geoeffneten Marke. Die Vorbereitung laeuft bei jedem
 * Wechsel der Marke (und nach jedem gespeicherten Feld) erneut; `stelleMarkenSchriftenBereit`
 * und `bereiteLogoVor` merken sich ihre Vorgaenge je `markeId` und sind damit
 * wirkungsgleich bei Mehrfachaufruf.
 */
export function MarkenVorschau({ marke, vorlagen }: MarkenVorschauProps): JSX.Element {
  const flaeche = useRef<HTMLDivElement | null>(null)
  const [hinweis, setHinweis] = useState<string | null>(null)

  useEffect(() => {
    const ziel = flaeche.current
    if (ziel === null || marke === null) {
      if (ziel !== null) ziel.replaceChildren()
      setHinweis(null)
      return
    }
    const vorlage = findeVorschauVorlage(vorlagen)
    if (vorlage === null) {
      ziel.replaceChildren()
      setHinweis(`Die Vorlage „${VORSCHAU_VORLAGE_NAME}" ist nicht geladen.`)
      return
    }

    // Wechselt die Marke, waehrend die Vorbereitung noch laeuft, darf der alte
    // Lauf NICHT mehr zeichnen - sonst stuende die vorige Marke in der Spalte.
    let abgebrochen = false
    void (async () => {
      try {
        await stelleSchriftenBereit()
        await stelleMarkenSchriftenBereit(marke)
        await bereiteLogoVor(marke)
        if (abgebrochen || flaeche.current === null) return
        const bild = zeichneMarkenVorschau(marke, vorlage)
        haengeEin(flaeche.current, bild)
        setHinweis(null)
      } catch (ausnahme) {
        if (abgebrochen) return
        setHinweis(
          ausnahme instanceof Error
            ? `Vorschau nicht darstellbar: ${ausnahme.message}`
            : 'Vorschau nicht darstellbar.',
        )
      }
    })()

    return () => {
      abgebrochen = true
    }
  }, [marke, vorlagen])

  return (
    <div>
      <div
        ref={flaeche}
        data-testid="marken-vorschau-flaeche"
        style={{ border: '1px solid #444', minHeight: 120 }}
      />
      {hinweis !== null && <p data-testid="marken-vorschau-hinweis">{hinweis}</p>}
    </div>
  )
}
