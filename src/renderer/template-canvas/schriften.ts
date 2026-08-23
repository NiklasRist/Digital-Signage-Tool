// [template-canvas] Marken-Schriften bereitstellen und den Canvas-Schriftwert bilden (#110).
//
// Diese Datei delegiert das Laden vollstaendig an #8 und bildet die EINE Kurzform fuer
// CanvasRenderingContext2D.font. Sie erzeugt selbst KEIN FontFace, ruft kein
// document.fonts.add() und schreibt kein @font-face - zwei Registrierungswege waeren
// zwei Wahrheiten darueber, welche Schrift geladen ist.
//
// GEMELDETE ABWEICHUNG (Vertragsfehler im Issue-Text, nicht hier still geloest): Der
// verbindliche Importpfad nennt '../assets/fonts' (src/renderer/assets/fonts/index.ts).
// Gebaut hat #8 die Funktion in '../styles/schriften' - gleiche Signatur, gleicher
// Inhalt, anderer Ordner. Der gebaute Code gewinnt; der Pfad im Issue #110 ist
// nachzuziehen. Keine eigene Ladefunktion als Behelf (das verbietet der STOPP-Block
// ausdruecklich).

import type { Schrift } from '../../shared/contracts/marke'

// Tatsaechlicher Ort von ladeMarkenSchriften() (#8) - s. Abweichungsvermerk oben.
import { ladeMarkenSchriften } from '../styles/schriften'

/**
 * Das EINE gemerkte Ladeversprechen. Idempotenz (#3/#291-Muster): Es gibt nie zwei
 * parallele Ladevorgaenge, egal wer zuerst ruft. Ein ABGELEHNTES Promise wird NICHT
 * gemerkt - nach einem einzigen (womöglich vorübergehenden) Fehlschlag bliebe sonst
 * die ganze Sitzung ohne Schriften, ohne Wiederholungsmöglichkeit.
 */
let vorgang: Promise<void> | null = null

export async function stelleSchriftenBereit(): Promise<void> {
  if (vorgang === null) {
    const laden = ladeMarkenSchriften()
    // Der Merker wird auf die UMHUELLTE Promise gesetzt; der Ruecksetz-Vergleich muss
    // deshalb gegen DIESELBE Umhuellung laufen (gegen `laden` verglichen greift er nie -
    // der Callback laeuft erst, als `vorgang` langes die Umhuellung zeigt).
    const umhuellt = laden.catch((fehler: unknown) => {
      if (vorgang === umhuellt) vorgang = null
      throw fehler
    })
    vorgang = umhuellt
  }
  return vorgang
}

/**
 * Synchron, reine Abfrage, startet selbst NIEMALS einen Ladevorgang: zeichneSegment
 * (#117) ist synchron und darf nicht awaiten; diese Datei liefert nur Auskunft.
 */
export function sindSchriftenBereit(): boolean {
  return vorgang !== null
}

/**
 * Liefert den Wert für CanvasRenderingContext2D.font, exakt:
 *   `${schrift.gewicht} ${größePx}px "${schrift.familie}"`
 *
 * Familienname IMMER in doppelten Anführungszeichen ("Playfair Display", "Archivo
 * Black" enthalten Leerzeichen - ohne sie behält der Canvas still die vorherige
 * Schrift). Keine Fallback-Familie: Das wäre genau der lautlose Ausweg, den TK 9.10.3
 * Punkt 3 verbietet. DENSSELBEN Wert zum Messen wie zum Zeichnen - dafür existiert
 * diese eine Stelle.
 */
export function schriftKurzform(schrift: Schrift, größePx: number): string {
  if (!Number.isInteger(größePx) || größePx <= 0 || !Number.isFinite(größePx)) {
    throw new Error('schriftKurzform: größePx muss eine endliche ganze Zahl > 0 sein.')
  }
  if (typeof schrift.familie !== 'string' || schrift.familie.trim() === '') {
    throw new Error('schriftKurzform: schrift.familie ist leer (Programmierfehler).')
  }
  if (!Number.isInteger(schrift.gewicht) || schrift.gewicht <= 0) {
    throw new Error('schriftKurzform: schrift.gewicht muss ganzzahlig > 0 sein.')
  }
  return `${schrift.gewicht} ${größePx}px "${schrift.familie}"`
}
