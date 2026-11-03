// [action-editor] Das kleine Bild einer Vorlage fuer die Auswahl (03.11.2026)
//
// WARUM ES DIESE DATEI GIBT: Die Vorlagen-Auswahl war eine Klappliste mit Namen -
// man musste wissen, wie „Ganzflaechig" oder „Band-Standard" aussieht. Hier entsteht
// je Vorlage EIN verkleinertes Bild aus DEMSELBEN Zeichenweg wie Vorschau und Render
// (`zeichneVorschau` -> `zeichneSegment`, TK 9.10.1): keine zweite Malroutine, keine
// Skizze aus Rechtecken, kein zweiter Begriff von „so sieht die Vorlage aus".
//
// GEZEICHNET WIRD MIT DEM STAND BEIM OEFFNEN: Das Bild ist eine LAYOUT-Vorschau,
// kein Live-Bild. Wer bei jeder Feld-Aenderung alle Vorlagen neu zeichnet, bezahlt je
// Vorlage ein 1920x1080-Canvas - fuer eine Auswahl ist das der falsche Preis. Das
// grosse Vorschaubild daneben zeigt weiterhin den aktuellen Entwurf.

import type { AktionsInhalt } from '../../shared/contracts/aktion'
import type { Marke } from '../../shared/contracts/marke'
import type { Vorlage } from '../../shared/contracts/vorlage'
import { zeichneVorschau } from './live-vorschau'

/**
 * Verkleinert ein gezeichnetes Segmentbild auf die Anzeigebreite.
 *
 * `null`, wenn es kein Bild oder keinen 2D-Kontext gibt (Test-Doubles ohne Canvas,
 * Breite/Hoehe 0). Die QUELLE bleibt unangetastet - sie wird nicht in ein Dokument
 * gehaengt und nicht veraendert; angezeigt wird nur die Kopie.
 */
export function verkleinereBild(
  bild: { canvas: HTMLCanvasElement },
  breite: number,
): HTMLCanvasElement | null {
  const quelle = bild.canvas
  if (!Number.isFinite(breite) || breite <= 0) return null
  if (quelle.width <= 0 || quelle.height <= 0) return null

  const hoehe = Math.max(1, Math.round((breite * quelle.height) / quelle.width))
  const klein = document.createElement('canvas')
  klein.width = breite
  klein.height = hoehe
  const kontext = klein.getContext('2d')
  if (kontext === null) return null
  kontext.drawImage(quelle, 0, 0, breite, hoehe)
  return klein
}

/**
 * Das Bild EINER Vorlage mit diesem Entwurf.
 *
 * `null`, wenn der Zeichenweg ablehnt (fehlende Schriften o. ae.) - die Auswahl zeigt
 * dann nur den Namen. Der Fehler wird gemeldet, nicht verschluckt; ein Wurf darf die
 * Auswahl nicht unbenutzbar machen.
 */
export function zeichneVorlagenBild(
  entwurf: AktionsInhalt,
  vorlage: Vorlage,
  marke: Marke,
  breite: number,
): HTMLCanvasElement | null {
  try {
    return verkleinereBild(zeichneVorschau(entwurf, vorlage, marke), breite)
  } catch (ursache) {
    console.warn('[vorlagen-wahl] Vorlagenbild nicht zeichenbar:', ursache)
    return null
  }
}
