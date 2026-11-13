// [shared] Die Regeln der Bildaufbereitung – EINE Quelle fuer Main, Editor und Zeichnen
//
// WARUM ES DIESE DATEI GIBT (13.11.2026, FA-28 / TK 9.21): Ein Nutzer kann ein Produktfoto
// aufhellen, den Kontrast anheben und nachschaerfen. Diese Werte kommen aus einem Formular,
// gehen ueber IPC in `project.json` und werden beim Vorbereiten des Motivs gerechnet – drei
// Stellen, die dieselben Grenzen, dieselbe Reihenfolge und denselben Bestands-Schluessel
// kennen muessen. Eine zweite Zahlenliste im Formular waere beim naechsten Umbau still
// falsch; ein Wert, den das Formular erlaubt und der Speicher kappt, waere eine stille
// Datenloeschung. Dieselbe Haltung wie in `gestaltung.ts`.
//
// KEIN CANVAS, KEIN DOM, KEIN NODE, KEIN IPC: ausschliesslich Zahlen und Zeichenketten.
// Damit ist die Datei ohne Browser pruefbar (`tests/unit/aufbereitung.spec.ts`).
//
// DIE GRUNDREGEL: Fehlt ein Wert oder ist er unbrauchbar, gilt „unveraendert". Es gibt
// keinen Ersatzwert „irgendwas Helles" – und `0` heisst in JEDEM Feld dasselbe: nichts tun.

import type { BildAufbereitung } from './contracts/aktion'

/**
 * Die Grenzen der drei Regler (TK 9.21.3). Sie stehen hier und NICHT im Formular:
 *
 * - `helligkeit` −100…+100: `0` ist der unveraenderte Zustand; ±100 ist „ganz schwarz"
 *   bzw. „ganz weiss" (255 Stufen) und damit die natuerliche Grenze.
 * - `kontrast` −100…+100: `0` unveraendert; −100 flacht auf eine Flaeche ab, +100 reisst
 *   in Schwarz/Weiss.
 * - `schaerfe` 0…100: `0` heisst AUS – damit „kein Wert" und „Regler links" dasselbe
 *   bedeuten und ein Nullwert keinen Rechenweg eroeffnet.
 */
export const AUFBEREITUNG_GRENZEN = {
  helligkeit: { min: -100, max: 100 },
  kontrast: { min: -100, max: 100 },
  schaerfe: { min: 0, max: 100 },
} as const

/**
 * Die Reihenfolge der Schritte – EINE Quelle fuer Rechner und Tests (TK 9.21.4).
 *
 * WARUM SIE HIER STEHT UND NICHT IM RECHNER: Vorschau und Render rufen denselben Rechner,
 * aber ein Test, der die Reihenfolge prueft, soll nicht gegen eine Kopie laufen. FA-29
 * schiebt spaeter `freistellen` als ERSTEN Schritt davor, ohne die drei anderen anzufassen.
 */
export const AUFBEREITUNG_SCHRITTE = ['helligkeit', 'kontrast', 'schaerfe'] as const

export type AufbereitungsSchritt = (typeof AUFBEREITUNG_SCHRITTE)[number]

/** Eine Zahl auf eine Spanne begrenzen. Unbrauchbare Eingaben liefern `null`. */
function begrenze(wert: unknown, min: number, max: number): number | null {
  if (typeof wert !== 'number' || !Number.isFinite(wert)) return null
  return Math.min(max, Math.max(min, Math.round(wert)))
}

/**
 * Macht aus einem beliebigen Wert eine benutzbare Aufbereitung.
 *
 * - kein Objekt / kein brauchbarer Wert in einem Feld -> das Feld faellt weg
 * - Werte werden geklemmt und gerundet (dieselbe Regel wie in `gestaltung.ts`)
 * - `0` faellt weg: es bedeutet „nichts tun" und ist damit kein gespeicherter Zustand
 * - bleibt nichts uebrig -> `null` („die Aufbereitung ist aus")
 *
 * `null` ist damit exakt der Zustand vor dieser Fassung, und jede bestehende
 * `project.json` bleibt ohne Migration lesbar.
 */
export function normalisiereAufbereitung(roh: unknown): BildAufbereitung | null {
  if (typeof roh !== 'object' || roh === null || Array.isArray(roh)) return null
  // SAFETY: Die Zeile davor belegt ein nicht-null Nicht-Array-Objekt; der Cast macht die
  // Felder als `unknown` LESBAR - jedes wird unmittelbar darunter einzeln geprueft.
  const quelle = roh as Record<string, unknown>

  const ziel: BildAufbereitung = {}
  const helligkeit = begrenze(
    quelle.helligkeit,
    AUFBEREITUNG_GRENZEN.helligkeit.min,
    AUFBEREITUNG_GRENZEN.helligkeit.max,
  )
  if (helligkeit !== null && helligkeit !== 0) ziel.helligkeit = helligkeit

  const kontrast = begrenze(
    quelle.kontrast,
    AUFBEREITUNG_GRENZEN.kontrast.min,
    AUFBEREITUNG_GRENZEN.kontrast.max,
  )
  if (kontrast !== null && kontrast !== 0) ziel.kontrast = kontrast

  const schaerfe = begrenze(
    quelle.schaerfe,
    AUFBEREITUNG_GRENZEN.schaerfe.min,
    AUFBEREITUNG_GRENZEN.schaerfe.max,
  )
  if (schaerfe !== null && schaerfe !== 0) ziel.schaerfe = schaerfe

  return Object.keys(ziel).length === 0 ? null : ziel
}

/**
 * Ist nichts zu tun? `true` heisst: kein Rechenweg, kein zusaetzlicher Puffer, und der
 * Bestands-Schluessel ist die nackte Asset-ID (TK 9.21.4: byte-gleich zu vorher).
 *
 * Absichtlich ueber `normalisiereAufbereitung`: Ein von Hand auf `{helligkeit: 0}`
 * gesetzter Eintrag ist derselbe Zustand wie „kein Feld" – zwei Wahrheiten fuer
 * „unveraendert" waeren genau die Sorte Abweichung, die niemand bemerkt.
 */
export function istAufbereitungNeutral(wert: BildAufbereitung | null | undefined): boolean {
  return normalisiereAufbereitung(wert) === null
}

/**
 * Der Schluessel im Motiv-Bestand (TK 9.21.3/9.21.4).
 *
 * NEUTRAL -> GENAU die Asset-ID: kein Praefix, kein Zusatz. Damit findet das Zeichnen
 * ohne jede Einstellung denselben Eintrag wie vor FA-28, und das Segment bleibt
 * byte-gleich zu vorher.
 *
 * SONST -> `<assetId>#<teile>`, z. B. `abc#h30|s20`. Die Teile sind stabil, lesbar und
 * ohne JSON: derselbe Wert ergibt denselben Schluessel, ein anderer Wert einen anderen.
 * `freistellen` gehoert schon jetzt in die Signatur (TK 9.21.3) – FA-29 setzt den
 * Parameter, FA-28 reicht ihn nicht.
 */
export function motivSchluessel(
  bildRef: string,
  aufbereitung?: BildAufbereitung | null,
  freistellen?: boolean,
): string {
  const teile: string[] = []
  const sauber = normalisiereAufbereitung(aufbereitung)
  if (sauber !== null) {
    if (sauber.helligkeit !== undefined) teile.push(`h${String(sauber.helligkeit)}`)
    if (sauber.kontrast !== undefined) teile.push(`k${String(sauber.kontrast)}`)
    if (sauber.schaerfe !== undefined) teile.push(`s${String(sauber.schaerfe)}`)
  }
  if (freistellen === true) teile.push('f')
  if (teile.length === 0) return bildRef
  return `${bildRef}#${teile.join('|')}`
}
