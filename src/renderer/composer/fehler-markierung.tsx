import type { JSX } from "react";

import type { Marke } from "../../shared/contracts/marke";
import type { Project } from "../../shared/contracts/project";
import { findeKaputteStellen, haengtAmElement, type KaputteStelle } from "./kaputt-erkennung";

const FEHLERFARBE = '#e5634d'

/**
 * Ordnet Element-IDs ihre Markierung zu. Jede KaputteStelle - egal ob am Element selbst
 * oder an einem Band-Abschnitt - markiert das zugehoerige Listenelement rot: Es ist die
 * Zeile, an der der Nutzer ansetzen muss (TK 9.7.5, Reparatur-Ebene).
 */
export function ordneFehlerZu(
  projekt: Project,
  marken: readonly Marke[] | null,
): Map<string, KaputteStelle[]> {
  const jeElement = new Map<string, KaputteStelle[]>()
  for (const stelle of findeKaputteStellen(projekt, marken)) {
    // Die Marken-Stelle (#338) haengt an einer AKTION, nicht an einer Zeile - sie wird
    // hier uebersprungen, statt einer beliebigen Zeile zugeordnet zu werden.
    if (!haengtAmElement(stelle)) continue
    const bisher = jeElement.get(stelle.elementId)
    if (bisher === undefined) {
      jeElement.set(stelle.elementId, [stelle])
    } else {
      bisher.push(stelle)
    }
  }
  return jeElement
}

/** Die kaputten Stellen als Hinweiszeile über der Liste. */
export function FehlerMarkierung({ projekt, marken }: {
  projekt: Project
  marken: readonly Marke[] | null
}): JSX.Element | null {
  const stellen = findeKaputteStellen(projekt, marken)
  if (stellen.length === 0) return null

  return (
    <div data-testid="fehler-markierung" style={{ fontSize: 12, color: FEHLERFARBE }}>
      {stellen.length === 1 ? '1 kaputte Stelle' : `${stellen.length} kaputte Stellen`} – Rendern blockiert
    </div>
  );
}
