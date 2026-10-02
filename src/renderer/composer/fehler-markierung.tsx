import type { JSX } from "react";

import type { Project } from "../../shared/contracts/project";
import { findeKaputteStellen, type KaputteStelle } from "./kaputt-erkennung";

const FEHLERFARBE = '#e5634d'

/**
 * Ordnet Element-IDs ihre Markierung zu. Jede KaputteStelle - egal ob am Element selbst
 * oder an einem Band-Abschnitt - markiert das zugehoerige Listenelement rot: Es ist die
 * Zeile, an der der Nutzer ansetzen muss (TK 9.7.5, Reparatur-Ebene).
 */
export function ordneFehlerZu(projekt: Project): Map<string, KaputteStelle[]> {
  const jeElement = new Map<string, KaputteStelle[]>()
  for (const stelle of findeKaputteStellen(projekt)) {
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
export function FehlerMarkierung({ projekt }: { projekt: Project }): JSX.Element | null {
  const stellen = findeKaputteStellen(projekt)
  if (stellen.length === 0) return null

  return (
    <div data-testid="fehler-markierung" style={{ fontSize: 12, color: FEHLERFARBE }}>
      {stellen.length === 1 ? '1 kaputte Stelle' : `${stellen.length} kaputte Stellen`} – Rendern blockiert
    </div>
  );
}
