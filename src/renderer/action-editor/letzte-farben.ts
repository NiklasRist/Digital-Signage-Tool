// [action-editor] Die letzten 20 verwendeten Farben (05.11.2026)
//
// WARUM ES DIESE DATEI GIBT (Niklas, 05.11.2026): „unter der freien farbauswahl [muss]
// eine auswahl an farben [stehen] und die letzten 20 verwendeten farben werden
// gespeichert." Der Farbwaehler allein verlangt, dass man den Hex-Wert kennt; die
// Markenpalette und die eigene Historie machen die Wahl zu einem Klick.
//
// GESPEICHERT WIRD APP-WEIT, nicht je Projekt: Eine Farbe, die in einer Aktion gefaellt,
// ist auch in der naechsten eine gute Wahl. Der Ort ist `config.json` unter
// `uiVoreinstellungen` - derselbe Weg wie der zuletzt aktive Reiter (#196).
//
// KEIN PROJEKT-SCHREIBWEG: Diese Datei aendert NUR die UI-Voreinstellung. Die Aktion
// selbst schreibt weiterhin der Entwurf beim Abschluss.

import type { AppKonfig } from '../../shared/contracts/app-konfig'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { istAkzentfarbe } from './akzentfarbe'

/** Der Schluessel in `AppKonfig.uiVoreinstellungen`. */
export const LETZTE_FARBEN_SCHLUESSEL = 'action-editor.letzteFarben'

/** Mehr als 20 sind nicht versprochen - und mehr waere eine Wand, keine Auswahl. */
export const LETZTE_FARBEN_MAX = 20

/**
 * Liest eine gespeicherte Liste: nur gueltige `#RRGGBB`, ohne Doppel (Gross/Klein
 * gleich), hoechstens 20. Ein kaputter Eintrag wird still verworfen - die Historie ist
 * eine Bequemlichkeit, kein Datenbestand, an dem die Oberflaeche scheitern darf.
 */
export function leseLetzteFarben(wert: unknown): string[] {
  if (!Array.isArray(wert)) return []
  const farben: string[] = []
  for (const eintrag of wert) {
    if (typeof eintrag !== 'string' || !istAkzentfarbe(eintrag)) continue
    if (farben.some((vorhanden) => vorhanden.toLowerCase() === eintrag.toLowerCase())) continue
    farben.push(eintrag)
    if (farben.length >= LETZTE_FARBEN_MAX) break
  }
  return farben
}

/** Setzt `farbe` an den Anfang, ohne Doppel, hoechstens 20. Ungueltiges aendert nichts. */
export function mitFarbe(bisher: readonly string[], farbe: string): string[] {
  if (!istAkzentfarbe(farbe)) return [...bisher]
  const ohne = bisher.filter((eintrag) => eintrag.toLowerCase() !== farbe.toLowerCase())
  return [farbe, ...ohne].slice(0, LETZTE_FARBEN_MAX)
}

/** Liest die Historie aus `config.json`. Ein Lesefehler ergibt eine leere Liste. */
export async function ladeLetzteFarben(): Promise<string[]> {
  try {
    const antwort: Ergebnis<AppKonfig> = await rufeAuf<AppKonfig>(KANAELE.config.leseKonfig)
    if (!antwort.ok) return []
    return leseLetzteFarben(antwort.wert.uiVoreinstellungen[LETZTE_FARBEN_SCHLUESSEL])
  } catch {
    return []
  }
}

/** Schreibt die Historie als UI-Voreinstellung. Ein Fehler wird gemeldet, nie geworfen. */
export async function speichereLetzteFarben(farben: readonly string[]): Promise<void> {
  try {
    const antwort = await rufeAuf<void>(KANAELE.config.setzeUIVoreinstellung, {
      schlüssel: LETZTE_FARBEN_SCHLUESSEL,
      wert: leseLetzteFarben(farben),
    })
    if (!antwort.ok) {
      console.warn(`[action-editor] Farbhistorie nicht gespeichert: ${antwort.fehler.code}`)
    }
  } catch (ursache) {
    console.warn('[action-editor] Farbhistorie nicht gespeichert:', ursache)
  }
}
