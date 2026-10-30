// [renderer/gemeinsam] symbole.tsx - die Piktogramme der App-Leisten und ihr Knopf (#456).
//
// WARUM HIER UND NICHT IN EINEM BEREICH: Die Projektleiste gehoert `app-shell`, die
// Kopfzeile des Marken-Editors `marken-editor` - das sind ZWEI Renderer-Bereiche. Ein
// Direktimport zwischen ihnen waere ein zweiter Weg. `gemeinsam` ist laut `index.ts` der
// Ort ohne Eigentuemer, aus dem jedes Modul lesen darf. So gibt es EINE Quelle fuer diese
// fuenf Piktogramme.
//
// WARUM EIGENE SVGs UND KEINE BIBLIOTHEK: wie in `preview-player/symbole.tsx` (#443) -
// das Projekt fuehrt keine Icon-Abhaengigkeit. 16er-Raster, `currentColor`, `stroke`,
// damit die Symbole die Farbe der Leiste erben und mitskalieren. Die Zeichenraster-Zahl
// ist bewusst dieselbe wie dort.
//
// WARUM DER KNOPF `aria-label` UND `title` GEMEINSAM SETZT: Ein Symbol ohne Beschriftung
// ist fuer Screenreader ein LEERER Knopf und fuer den ersten Blick ein Platzhalter.
// Beides steht hier an EINER Stelle, damit kein Aufrufer es vergessen kann (dieselbe
// Begruendung wie in #443). Sichtbarer Text waere genau das, was #456 abgeschafft hat.
//
// NICHT WIEDERVERWENDET: `preview-player/symbole.tsx` ist die Bedienleiste UEBER DEM VIDEO
// (weisse Symbole, 28 px, eigener Hover). Sie bleibt unberuehrt; hier gilt `currentColor`
// und eine Groesse, die in eine 22-px-Leiste passt.

import { useState, type JSX, type ReactNode } from 'react'

/** Kantenlaenge des Zeichenrasters. Alle Pfade unten rechnen in diesem Raster. */
const RASTER = 16

/** Die Groesse, in der die Symbole in den App-Leisten stehen. */
const SYMBOL_PX = 16

function Piktogramm(p: { children: ReactNode }): JSX.Element {
  return (
    <svg
      width={SYMBOL_PX}
      height={SYMBOL_PX}
      viewBox={`0 0 ${RASTER} ${RASTER}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {p.children}
    </svg>
  )
}

/** Bearbeiten - der Einstieg in den Marken-Editor aus der Projektleiste. */
export function SymbolStift(): JSX.Element {
  return (
    <Piktogramm>
      <path d="M3 13 L3.6 10.4 L11.1 2.9 L13.1 4.9 L5.6 12.4 Z" />
      <path d="M10.2 3.8 L12.2 5.8" />
    </Piktogramm>
  )
}

/** Zurueck - derselbe Pfeil fuer „Zurueck zum Projekt" in Leiste und Kopfzeile. */
export function SymbolPfeilLinks(): JSX.Element {
  return (
    <Piktogramm>
      <path d="M12.6 8 H3.6" />
      <path d="M7.4 4 L3.4 8 L7.4 12" />
    </Piktogramm>
  )
}

/** Groesser machen - Ecken nach aussen. */
export function SymbolVergroessern(): JSX.Element {
  return (
    <Piktogramm>
      <path d="M2.6 6 V2.6 H6" />
      <path d="M10 2.6 H13.4 V6" />
      <path d="M13.4 10 V13.4 H10" />
      <path d="M6 13.4 H2.6 V10" />
    </Piktogramm>
  )
}

/** Kleiner machen - Ecken nach innen. */
export function SymbolVerkleinern(): JSX.Element {
  return (
    <Piktogramm>
      <path d="M6.2 2.6 V6.2 H2.6" />
      <path d="M9.8 2.6 V6.2 H13.4" />
      <path d="M13.4 9.8 H9.8 V13.4" />
      <path d="M2.6 9.8 H6.2 V13.4" />
    </Piktogramm>
  )
}

/** Loeschen - Papierkorb mit Deckel und zwei Rippen. */
export function SymbolPapierkorb(): JSX.Element {
  return (
    <Piktogramm>
      <path d="M2.8 4.4 H13.2" />
      <path d="M6.2 4.4 V2.8 H9.8 V4.4" />
      <path d="M4.3 4.4 L5 13 a0.7 0.7 0 0 0 0.7 0.6 h4.6 a0.7 0.7 0 0 0 0.7 -0.6 L11.7 4.4" />
      <path d="M6.8 6.6 V11.6" />
      <path d="M9.2 6.6 V11.6" />
    </Piktogramm>
  )
}

export interface SymbolKnopfProps {
  /** Stabiler Pruefanker (data-testid) - Tests und Treiber finden den Knopf nur darueber. */
  kennung: string
  /** Der zugaengliche Name UND der Tooltip. Er ist die EINZIGE Beschriftung. */
  beschriftung: string
  aufKlick(): void
  /** true/false = Umschalter (setzt `aria-pressed`); undefined = KEIN Umschalter. */
  gedrueckt?: boolean
  /** true = abgeschaltet. Nicht unsichtbar - ein fehlendes Symbol waere ein zweiter Zustand. */
  abgeschaltet?: boolean
  /** Kantenlaenge des Knopfes in px. Standard 20: passt in die 22-px-Projektleiste. */
  groesse?: number
  children: ReactNode
}

/**
 * Ein Knopf, dessen Inhalt nur ein Symbol ist. `beschriftung` ist Pflicht, weil sonst
 * weder Screenreader noch der erste Blick etwas lesen. Zeiger- und Tastaturzustand
 * liegen HIER - sonst muesste jeder Aufrufer sie nachbauen.
 */
export function SymbolKnopf(p: SymbolKnopfProps): JSX.Element {
  const [zeigt, setZeigt] = useState(false)
  const [fokus, setFokus] = useState(false)
  const ab = p.abgeschaltet === true
  const kante = p.groesse ?? 20

  return (
    <button
      type="button"
      data-testid={p.kennung}
      aria-label={p.beschriftung}
      title={p.beschriftung}
      aria-pressed={p.gedrueckt === undefined ? undefined : p.gedrueckt}
      disabled={ab}
      onClick={p.aufKlick}
      onMouseEnter={() => setZeigt(true)}
      onMouseLeave={() => setZeigt(false)}
      onFocus={() => setFokus(true)}
      onBlur={() => setFokus(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: kante,
        height: kante,
        padding: 0,
        border: 'none',
        borderRadius: 4,
        // Die Leisten sind hell (die App setzt keine Dunkel-Palette). Ein Hover mit
        // Schwarzanteil bleibt deshalb in BEIDEN Faellen sichtbar.
        background: zeigt && !ab ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
        color: 'inherit',
        cursor: ab ? 'default' : 'pointer',
        opacity: ab ? 0.4 : 1,
        outline: fokus ? '2px solid currentColor' : 'none',
        outlineOffset: -2,
      }}
    >
      {p.children}
    </button>
  )
}
