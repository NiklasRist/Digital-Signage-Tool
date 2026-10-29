// #443 - zeit-anzeige.ts: die bildgenaue Position fuer den Zeiger-Tooltip.
//
// Sie steht NICHT in der Zeile der Leiste: Dort gilt #127 („ein Format je Zeile"),
// und beide Zahlen der Zeile - Position und Gesamtlaenge - kommen aus
// `formatiereLaenge`. Der Tooltip ist eine EIGENE Anzeige; dort ist die Frame-Stelle
// genau die Information, die man beim Suchen einer Schnittstelle braucht
// (30 fps, TK 9.2.6).
//
// Die Datei kennt keine Achse und keinen Stand: Sie formatiert eine Frame-Zahl.

import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

/**
 * „mm:ss:ff" - `ff` ist der Frame INNERHALB der Sekunde (0..fps-1).
 * Abgerundet; ein unbrauchbarer Eingang zeigt „00:00:00", weil die Signatur nur einen
 * string liefert und „00:00:00" am wenigsten behauptet (dieselbe Regel wie
 * `formatiereLaenge`, #127). Minuten wachsen ueber 99 hinaus, statt in Stunden
 * umzurechnen - die Achse ist in Minuten gedacht (30-Minuten-Warnung, TK 9.7).
 */
export function formatierePosition(frame: number): string {
  const fps = RENDER_PROFILE.fps
  const ganz = Number.isFinite(frame) && frame > 0 ? Math.floor(frame) : 0
  const sekunden = Math.floor(ganz / fps)
  const zwei = (wert: number): string => String(wert).padStart(2, '0')
  return `${zwei(Math.floor(sekunden / 60))}:${zwei(sekunden % 60)}:${zwei(ganz % fps)}`
}
