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
import type { MarkenElement } from './marken-elemente'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

/**
 * Die drei festen Vorschauen des Editors (#455) - die VORLAGEN-IDs der eingebauten Vorlagen.
 * Der Anzeigename ist Praesentation; die Identitaet ist die `id` (TK 9.11.4).
 */
export const VORSCHAU_VORLAGEN: readonly { id: string; name: string }[] = [
  { id: 'vollbild', name: 'Ganzflächig' },
  { id: 'split', name: 'Zwei Spalten' },
  { id: 'band-standard', name: 'Band-Standard' },
]

/** Die Vorschau, mit der der Editor startet (A1, 22.10.2026: fest „Vollbild"). */
export const VORSCHAU_VORLAGE_ID = 'vollbild'

/**
 * Sucht eine eingebaute Vorlage ueber ihre ID in der gemeinsamen Vorlagen-Sicht.
 * REIN: liest nur `hole()`, laedt nichts nach (die Sicht wird beim App-Aufbau
 * geladen, #155). null = nicht verfuegbar; der Aufrufer zeichnet dann NICHT.
 */
export function findeVorlage(vorlagen: VorlagenZugang, id: string): Vorlage | null {
  const uebersicht = vorlagen.hole()
  if (uebersicht === null) return null
  const eintrag = uebersicht.nutzbare.find(
    (kandidat) => kandidat.eingebaut && kandidat.vorlage.id === id,
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
  /** #455: welche der drei festen Vorschauen gezeichnet wird (ID, nicht Name). */
  vorlageId?: string
  /** #449: die anklickbaren Elemente (Zonen der Vorlage) - Rechtecke ueber dem Canvas. */
  elemente?: readonly MarkenElement[]
  /** #449: das Element, dessen Werte gerade offen sind (Rahmen hervorgehoben). */
  offenesElement?: string | null
  /** #449: Klick auf ein Element (id) oder daneben (null). */
  aufElement?: (id: string | null) => void
}

/**
 * Eine Flaeche, die das GANZE Bild deckt, ist KEINE Klickflaeche (#455, Weg B).
 *
 * WARUM: Die Zone `hintergrund` reicht von 0,0 bis 1920,1080. Als Klickflaeche faengt sie
 * jeden Klick ab - dann gibt es kein „daneben", und die Auswahl liesse sich nur ueber × oder
 * ESC aufheben. Ihre Farbe bleibt erreichbar: sie steht in der Reihenfolge der Arbeit und im
 * Inspector. Die Regel haengt an der FLAECHE, nicht an der Kennung - eine eigene Vorlage mit
 * Vollflaechen-Zone verhaelt sich gleich.
 */
function decktGanzesBild(element: MarkenElement): boolean {
  return (
    element.rahmen.x <= 0 &&
    element.rahmen.y <= 0 &&
    element.rahmen.breite >= RENDER_PROFILE.breite &&
    element.rahmen.höhe >= RENDER_PROFILE.hoehe
  )
}

/**
 * Zeichnet die Vorschau der geoeffneten Marke. Die Vorbereitung laeuft bei jedem
 * Wechsel der Marke (und nach jedem gespeicherten Feld) erneut; `stelleMarkenSchriftenBereit`
 * und `bereiteLogoVor` merken sich ihre Vorgaenge je `markeId` und sind damit
 * wirkungsgleich bei Mehrfachaufruf.
 */
export function MarkenVorschau({
  marke,
  vorlagen,
  vorlageId = VORSCHAU_VORLAGE_ID,
  elemente = [],
  offenesElement = null,
  aufElement,
}: MarkenVorschauProps): JSX.Element {
  const flaeche = useRef<HTMLDivElement | null>(null)
  const [hinweis, setHinweis] = useState<string | null>(null)

  useEffect(() => {
    const ziel = flaeche.current
    if (ziel === null || marke === null) {
      if (ziel !== null) ziel.replaceChildren()
      setHinweis(null)
      return
    }
    const vorlage = findeVorlage(vorlagen, vorlageId)
    if (vorlage === null) {
      ziel.replaceChildren()
      setHinweis(`Die Vorschau-Vorlage (ID „${vorlageId}") ist nicht geladen.`)
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
  }, [marke, vorlagen, vorlageId])

  // GROESSTE Flaeche zuerst zeichnen, kleinste zuletzt: sonst liegt der
  // Vollflaechen-Hintergrund ueber dem Logo und faengt jeden Klick ab (#449).
  // Vollflaechen-Zonen sind GAR KEINE Klickflaeche (#455, Weg B) - sonst gaebe es kein
  // „Klick daneben", und die Auswahl liesse sich nur ueber × oder ESC aufheben.
  const klickflaechen = [...elemente].filter((element) => !decktGanzesBild(element)).sort((a, b) => b.flaeche - a.flaeche)
  return (
    <div
      style={{ position: 'relative' }}
      onClick={() => {
        // Klick neben ein Element schliesst die Box.
        aufElement?.(null)
      }}
    >
      <div
        ref={flaeche}
        data-testid="marken-vorschau-flaeche"
        style={{ border: '1px solid #444', minHeight: 120 }}
      />
      {marke !== null &&
        klickflaechen.map((element) => {
          const offen = offenesElement === element.id
          return (
            <button
              key={element.id}
              type="button"
              data-testid={`marken-element-${element.id}`}
              title={element.titel}
              aria-label={element.titel}
              onClick={(ereignis) => {
                ereignis.stopPropagation()
                aufElement?.(element.id)
              }}
              style={{
                position: 'absolute',
                left: `${(element.rahmen.x / 1920) * 100}%`,
                top: `${(element.rahmen.y / 1080) * 100}%`,
                width: `${(element.rahmen.breite / 1920) * 100}%`,
                height: `${(element.rahmen.höhe / 1080) * 100}%`,
                padding: 0,
                background: 'transparent',
                border: offen ? '2px solid #4da6ff' : '1px dashed rgba(255,255,255,0.35)',
                borderRadius: 3,
                cursor: 'pointer',
              }}
            />
          )
        })}
      {hinweis !== null && <p data-testid="marken-vorschau-hinweis">{hinweis}</p>}
    </div>
  )
}
