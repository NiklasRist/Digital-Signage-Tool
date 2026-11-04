// [gemeinsam] Das Motiv einer Aktion als kleines Bild - für JEDE Liste von Aktionen.
//
// HERKUNFT (02.11.2026, Messlatte): In der Composer-Bibliothek standen nur TITEL. Zwei
// Aktionen waren ohne Oeffnen nicht unterscheidbar - in PowerPoint sieht man Folien,
// hier sah man Woerter. Seit dem Umbau des Aktions-Editors (04.11.2026) braucht auch
// dessen Bildstreifen ein Motiv; deshalb steht der Speicher hier und nicht mehr im
// `composer`. Der Ordner `gemeinsam` ist laut `index.ts` der Ort ohne Eigentuemer -
// eine der beiden Fachlichkeiten darf die andere nicht direkt importieren.
//
// ZWEI BEDINGUNGEN, DIE DIESE DATEI LOEST:
//   1. Das Motiv ist ein VOLLES Canvas (1920x1080 = 8,3 MB; Band 1920x162). Eine Liste mit
//      zwanzig Aktionen haette ~166 MB gezeichnet und gehalten. Hier wird EINMAL gezeichnet
//      und auf Zeilenhoehe verkleinert; gemerkt wird nur das kleine Bild.
//   2. Ohne Canvas (jsdom in den Tests) gibt es `getContext('2d') === null` - dann liefert
//      diese Datei `null` statt zu werfen. Kein Bild ist ein sichtbarer Zustand, ein Absturz
//      waere keiner.
//
// DER SCHLUESSEL SIND DIE EINGABEN, nicht die ID: Aendert der Nutzer Titel, Preis oder Farbe,
// ist es ein anderes Bild. Ein Schluessel nur aus `aktion.id` zeigte nach jeder Aenderung das
// alte Motiv - und niemand faende den Grund. Die HOEHE gehoert dazu: derselbe Entwurf in
// zwei Listen mit verschiedener Zeilenhoehe sind zwei Bilder.

import type { Aktion } from '../../shared/contracts/aktion'
import type { Marke } from '../../shared/contracts/marke'
import type { Project } from '../../shared/contracts/project'
import type { Vorlage } from '../../shared/contracts/vorlage'
import { zeichneSegment } from '../template-canvas/zeichne-segment'

/** Hoehe des kleinen Bildes in einer Bibliothekszeile. Die Breite folgt dem Seitenverhaeltnis. */
export const MOTIV_HOEHE = 40

/** Wie viele Motive gemerkt werden. Aeltere fliegen zuerst (Muster: filmstreifen-speicher). */
export const MOTIV_SPEICHER_MAX = 40

const speicher = new Map<string, HTMLCanvasElement>()

/** Der Schluessel: alles, was ins Bild eingeht - samt der Zielhoehe. */
export function motivSchluessel(
  aktion: Aktion,
  vorlage: Vorlage,
  marke: Marke,
  hoehe: number = MOTIV_HOEHE,
): string {
  return JSON.stringify([aktion, vorlage, marke, hoehe])
}

/** Nur fuer Tests und den Projektwechsel: verwirft alle gemerkten Motive. */
export function leereMotivSpeicher(): void {
  speicher.clear()
}

export function motivImSpeicher(schluessel: string): boolean {
  return speicher.has(schluessel)
}

function verkleinere(voll: HTMLCanvasElement, hoehe: number): HTMLCanvasElement | null {
  if (voll.width === 0 || voll.height === 0) return null
  const klein = document.createElement('canvas')
  klein.width = Math.max(1, Math.round((voll.width / voll.height) * hoehe))
  klein.height = hoehe
  const context = klein.getContext('2d')
  // jsdom kennt kein 2d-Canvas - dann gibt es kein Bild, aber keinen Wurf.
  if (context === null) return null
  context.drawImage(voll, 0, 0, klein.width, klein.height)
  return klein
}

/**
 * Das kleine Motiv einer Aktion - aus dem Speicher oder frisch gezeichnet.
 * `null` = kein Bild moeglich (Marke/Vorlage fehlt, Zeichnen nicht verfuegbar).
 */
export function holeMotiv(
  aktion: Aktion,
  vorlage: Vorlage,
  marke: Marke,
  hoehe: number = MOTIV_HOEHE,
): HTMLCanvasElement | null {
  const schluessel = motivSchluessel(aktion, vorlage, marke, hoehe)
  const vorhanden = speicher.get(schluessel)
  if (vorhanden !== undefined) return vorhanden

  let voll: { canvas: HTMLCanvasElement }
  try {
    voll = zeichneSegment(aktion, vorlage, marke, marke)
  } catch {
    // Fehlende Schriften, fehlende Marke, kein Canvas: kein Bild. Wer das als Wurf
    // weiterreichte, liesse die Bibliothek abstuerzen - fuer eine Vorschau.
    return null
  }
  const klein = verkleinere(voll.canvas, hoehe)
  if (klein === null) return null

  speicher.set(schluessel, klein)
  while (speicher.size > MOTIV_SPEICHER_MAX) {
    const aeltester = speicher.keys().next().value
    if (aeltester === undefined) break
    speicher.delete(aeltester)
  }
  return klein
}

/**
 * Welche Motive muessen GELADEN sein, bevor gezeichnet werden kann? Das ist die Zulieferung
 * fuer `bereiteMotiveVor` (template-canvas/bild-laden.ts): ohne sie fehlt das Bild IN der
 * Aktion, und das Motiv waere ein Rahmen ohne Inhalt.
 */
export function baueMotivEintraege(
  projekt: Project,
): Array<{ schluessel: string; dateiname: string }> {
  const eintraege: Array<{ schluessel: string; dateiname: string }> = []
  const gesehen = new Set<string>()
  for (const aktion of projekt.aktionen) {
    const bildRef = aktion.bildRef
    if (bildRef === null || gesehen.has(bildRef)) continue
    const asset = projekt.assets.find((kandidat) => kandidat.id === bildRef)
    if (asset === undefined || asset.zustand === 'fehlt') continue
    gesehen.add(bildRef)
    eintraege.push({ schluessel: bildRef, dateiname: asset.dateiname })
  }
  return eintraege
}
