// #443 - symbole.tsx: die Piktogramme der Vorschau-Leiste und ihr Knopf.
//
// WARUM EIGENE SVGs UND KEINE BIBLIOTHEK: Das Projekt fuehrt keine Icon-Abhaengigkeit;
// acht Symbole rechtfertigen keine neue. Gezeichnet auf einem 16er-Raster, mit
// `currentColor` und `stroke`, damit sie die Farbe der Leiste erben und mitskalieren.
//
// WARUM +-5 DREIECK + ZAHL UND KEIN KREISPFEIL: Das YouTube-Muster (Kreispfeil mit
// Zahl darin) habe ich in 18, 20 und 24 px gerendert und angesehen - unter 24 px
// verschwindet die Zahl, es bleibt ein Kreis mit Punkt, und beide Richtungen sehen
// gleich aus. Dreieck + Zahl bleibt in allen drei Groessen lesbar; die Richtung
// traegt das Dreieck, die Weite die Zahl.
//
// WARUM ES EINEN EIGENEN KNOPF GIBT: Ein Symbol ohne Beschriftung braucht seinen
// zugaenglichen Namen (aria-label) und einen Tooltip - sonst ist es fuer
// Screenreader und fuer den ersten Blick ein leerer Knopf. Beides steht hier an
// EINER Stelle, damit kein Symbol sie vergessen kann.

import type { JSX, ReactNode } from 'react'
import { useState } from 'react'

/** Kantenlaenge des Zeichenrasters. Alle Pfade unten rechnen in diesem Raster. */
const RASTER = 16

/** Die Groesse, in der die Symbole in der Leiste stehen. */
const SYMBOL_PX = 20

function Symbol(p: { children: ReactNode }): JSX.Element {
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

export function SymbolPlay(): JSX.Element {
  return (
    <Symbol>
      <path d="M5.2 3.2 L13 8 L5.2 12.8 Z" fill="currentColor" stroke="none" />
    </Symbol>
  )
}

export function SymbolPause(): JSX.Element {
  return (
    <Symbol>
      <path d="M5.6 3.4 v9.2" strokeWidth={2.4} />
      <path d="M10.4 3.4 v9.2" strokeWidth={2.4} />
    </Symbol>
  )
}

/** Die Zahl im Symbol: Sie traegt die Weite, das Dreieck die Richtung. */
function Zahl(p: { x: number }): JSX.Element {
  return (
    <text
      x={p.x}
      y={10.6}
      textAnchor="middle"
      fontSize={7.6}
      fontWeight={700}
      fill="currentColor"
      stroke="none"
    >
      5
    </text>
  )
}

export function SymbolZurueck5(): JSX.Element {
  return (
    <Symbol>
      <path d="M5.4 4.6 L2.8 8 L5.4 11.4 Z" fill="currentColor" stroke="none" />
      <Zahl x={10.6} />
    </Symbol>
  )
}

export function SymbolVor5(): JSX.Element {
  return (
    <Symbol>
      <path d="M10.6 4.6 L13.2 8 L10.6 11.4 Z" fill="currentColor" stroke="none" />
      <Zahl x={5.4} />
    </Symbol>
  )
}

export function SymbolTonAn(): JSX.Element {
  return (
    <Symbol>
      <path d="M3.2 6.2 H5.4 L8.4 3.4 V12.6 L5.4 9.8 H3.2 Z" fill="currentColor" stroke="none" />
      <path d="M10.2 5.8 A3.2 3.2 0 0 1 10.2 10.2" />
      <path d="M12 4.2 A5.6 5.6 0 0 1 12 11.8" />
    </Symbol>
  )
}

export function SymbolTonAus(): JSX.Element {
  return (
    <Symbol>
      <path d="M3.2 6.2 H5.4 L8.4 3.4 V12.6 L5.4 9.8 H3.2 Z" fill="currentColor" stroke="none" />
      <path d="M10.4 5.8 L13.8 9.2" />
      <path d="M13.8 5.8 L10.4 9.2" />
    </Symbol>
  )
}

export function SymbolVollbildAn(): JSX.Element {
  return (
    <Symbol>
      <path d="M2.6 6 V2.6 H6" />
      <path d="M10 2.6 H13.4 V6" />
      <path d="M13.4 10 V13.4 H10" />
      <path d="M6 13.4 H2.6 V10" />
    </Symbol>
  )
}

export function SymbolVollbildAus(): JSX.Element {
  return (
    <Symbol>
      <path d="M6.2 2.6 V6.2 H2.6" />
      <path d="M9.8 2.6 V6.2 H13.4" />
      <path d="M13.4 9.8 H9.8 V13.4" />
      <path d="M2.6 9.8 H6.2 V13.4" />
    </Symbol>
  )
}

export interface IconKnopfProps {
  /** Stabiler Pruefanker (data-testid) - die Tests finden den Knopf nur darueber. */
  kennung: string
  /** Der zugaengliche Name UND der Tooltip. Er ist die EINZIGE Beschriftung. */
  beschriftung: string
  aufKlick(): void
  /** true = abgeschaltet (die Umgebung kann es nicht). Nicht unsichtbar: s. Aufrufer. */
  abgeschaltet?: boolean
  children: ReactNode
}

/**
 * Ein Knopf, dessen Inhalt nur ein Symbol ist. Der Name steht in `aria-label` und
 * `title`; sichtbar ist nichts davon, deshalb ist `beschriftung` Pflicht.
 * Zeiger- und Tastaturzustand liegen HIER - sonst muesste jeder Aufrufer sie
 * nachbauen.
 */
export function IconKnopf(p: IconKnopfProps): JSX.Element {
  const [zeigt, setZeigt] = useState(false)
  const [fokus, setFokus] = useState(false)
  const ab = p.abgeschaltet === true

  return (
    <button
      type="button"
      data-testid={p.kennung}
      aria-label={p.beschriftung}
      title={p.beschriftung}
      onClick={p.aufKlick}
      disabled={ab}
      onMouseEnter={() => setZeigt(true)}
      onMouseLeave={() => setZeigt(false)}
      onFocus={() => setFokus(true)}
      onBlur={() => setFokus(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        padding: 0,
        border: 'none',
        borderRadius: 4,
        background: zeigt && !ab ? 'rgba(255, 255, 255, 0.18)' : 'transparent',
        color: '#ffffff',
        cursor: ab ? 'default' : 'pointer',
        opacity: ab ? 0.45 : 1,
        outline: fokus ? '2px solid #ffffff' : 'none',
        outlineOffset: -2,
      }}
    >
      {p.children}
    </button>
  )
}
