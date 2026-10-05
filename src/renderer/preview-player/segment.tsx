// Issue #217 - segment.tsx: die Anzeige des Aktions-Segments in der Vorschau.
//
// Die Kernregel: „Aktions-Segment: exakt dasselbe `template-canvas`-Bild wie der
// finale Render -> pixelgleich" (TK 9.9.2). Sie ist hier nicht Sorgfalt, sondern
// BAUART: Das HTMLCanvasElement aus zeichneSegment wird per Verweis in einen
// Behaelter eingehaengt - nicht abgemalt, nicht via alsPng/toDataURL in ein <img>
// verwandelt, nicht in ein zweites Zielbild kopiert (TK 9.10.1: kein zweiter
// Zeichenpfad). Die Anzeigegroesse ist EXAKT die native des Canvas (breite/hoehe
// aus dem Rueckgabewert); die Verkleinern besorgt allein die Buehne (#212).
//
// Schriften (TK 9.10.3 Punkt 3): zeichneSegment WIRFT selbst, wenn die
// gebuendelten Marken-Schriften nicht bereit sind. ENTSCHIEDEN 4: Der Aufruf
// unterbleibt hier VORAB, statt den Wurf abzufangen - keine Ersatzschrift,
// kein Ersatztext, keine Ladeanzeige, die Flaeche bleibt durchsichtig.
//
// ENTSCHIEDEN 5: Gezeichnet wird nur, wenn sich aktion, vorlage oder marke
// aendern. Die Zeichenroutine ist synchron und deterministisch (TK 9.10.3
// Punkt 5); ein Neuzeichnen bei jedem Bildlauf wuerde bei Bandelementen
// dreissigmal pro Sekunde ein ganzes Segment zeichnen - Rechenlast ohne Info.
//
// DIE VIER-ARGUMENT-FORM: Der gebaute Vertrag (TK v3.18 / #294 / M8-21) verlangt
// den vierten, verpflichtenden Parameter rahmenMarke; gemeldet im Issue-Nachtrag. Fuer diesen
// Aufruf gilt rahmenMarke === marke (derselbe Wert, dieselbe Referenz).
// Der Hintergrund-Rahmen (Standardmarke) ist Sache der Band-Bausteine (#218/#219).

import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { Marke } from '../../shared/contracts/marke'
import { zeichneSegment } from '../template-canvas/zeichne-segment'
import { sindSchriftenBereit } from '../template-canvas/schriften'

export interface SegmentProps {
  aktion: Aktion
  vorlage: Vorlage
  marke: Marke
  /** Linke Kante im Raster der Buehne (1920 x 1080). Voreinstellung 0. */
  x?: number
  /**
   * Obere Kante im Raster. Voreinstellung 0.
   * Das Werbeband setzt hier bandY - die Groesse kommt NIE von hier, sondern aus dem Canvas.
   */
  y?: number
}

export function Segment(props: SegmentProps): JSX.Element {
  const { aktion, vorlage, marke, x = 0, y = 0 } = props
  const behaelter = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // ENTSCHIEDEN 4: keine Schriften, kein Aufruf. Die Flaeche bleibt leer und
    // durchsichtig; es wird nicht mit einer Fallback-Schrift gezeichnet.
    if (!sindSchriftenBereit()) {
      return
    }
    // DAS Zeichen. Kein zweiter Zeichenpfad in irgendeiner Form (Verbot):
    // Dieses Objekt ist genau die Referenz der Pixelquelle; nichts hier schreibt
    // canvas.width/canvas.height oder liest die Geraete-Pixel-Groesse.
    const bild = zeichneSegment(aktion, vorlage, marke, marke)
    const knoten = behaelter.current
    if (knoten === null) return
    // Der Behaelter enthaelt GENAU EIN Kind: das Canvas der Zeichenroutine.
    while (knoten.firstChild !== null) {
      knoten.removeChild(knoten.firstChild)
    }
    knoten.appendChild(bild.canvas)
    // Nur die CSS-Anzeigegroesse wird gesetzt, EXAKT auf die native Flaeche;
    // die Verkleinerung besorgt die Buehne, nicht dieses Bauteil.
    knoten.style.width = `${bild.breite}px`
    knoten.style.height = `${bild.höhe}px`
  }, [aktion, vorlage, marke])

  return (
    <div ref={behaelter} style={{ position: 'absolute', left: `${x}px`, top: `${y}px` }} />
  )
}
