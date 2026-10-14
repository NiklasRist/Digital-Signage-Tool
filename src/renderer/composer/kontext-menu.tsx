import { useEffect, useRef, type JSX } from "react";

import type { Listenelement, Project } from "../../shared/contracts/project";
import { entferneElementAusListe } from "./element-entfernen";
import { fuegeElementHinzu } from "./element-hinzufuegen";

export interface MenueAdresse {
  elementId: string
  x: number
  y: number
}

/** Die Aktionen des Menüs – ausschließlich bestehende Operationen der Bibliothek. */
export type MenueAktion = 'entfernen' | 'duplikat'

export function menueBezug(projekt: Project, elementId: string): { referenz: string } | null {
  const element = projekt.liste.find((eintrag) => eintrag.id === elementId)
  if (element === undefined) return null
  return { referenz: element.ref }
}

// ERGAENZT durch #415 (Variante a): Beide Aktionen laufen ueber den Wrapped-Zugangs-
// `setzeListe` (Pflichtparameter) - ohne ihn wuerden Duplikat/Entfernen NIE einen
// Undo-Schritt nehmen (Treiber-Beleg: #414-Schritt 4f, Cmd+Z-Befund).
export function fuehreMenueAktionAus(
  aktion: MenueAktion,
  elementId: string,
  referenz: string,
  sichtSchreiber: (liste: Listenelement[]) => void,
): void {
  if (aktion === 'entfernen') {
    void entferneElementAusListe(elementId, sichtSchreiber)
    return
  }
  // Duplikat: fuegeElementHinzu legt ein NEUES Element mit NEUER id ans ENDE der Liste
  // (Vertrag des project-store) - es ist keine Positions- oder Identitaetskopie.
  void fuegeElementHinzu(referenz, undefined, sichtSchreiber)
}

export function KontextMenue({
  projekt,
  adresse,
  schliesse,
  sichtSchreiber,
}: {
  projekt: Project
  adresse: MenueAdresse
  schliesse: () => void
  /** #415 (Variante a): der Sicht-Schreiber (Wrapped-Zugangs-`setzeListe`). */
  sichtSchreiber: (liste: Listenelement[]) => void
}): JSX.Element {
  const bezug = menueBezug(projekt, adresse.elementId)
  const menueReferenz = bezug === null ? null : bezug.referenz
  const kastenRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const druecke = (ereignis: MouseEvent): void => {
      const kasten = kastenRef.current
      if (kasten !== null && ereignis.target instanceof Node && kasten.contains(ereignis.target)) {
        return
      }
      schliesse()
    }
    document.addEventListener('mousedown', druecke)
    return () => document.removeEventListener('mousedown', druecke)
  }, [schliesse])

  if (menueReferenz === null) {
    // Gibt es das Element nicht in der Liste, gibt es nichts zu tun.
    return <div data-testid="kontext-menue-leer" />
  }

  const tue = (aktion: MenueAktion): void => {
    fuehreMenueAktionAus(aktion, adresse.elementId, menueReferenz, sichtSchreiber)
    schliesse()
  }

  return (
    <div
      ref={kastenRef}
      data-testid="kontext-menue"
      style={{
        position: 'fixed',
        left: adresse.x,
        top: adresse.y,
        zIndex: 1000,
        border: '1px solid #444',
        background: '#222',
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        fontSize: 12,
      }}
    >
      <button type="button" data-testid="menue-duplikat" onClick={() => tue('duplikat')}>
        Duplikat am Listenende anfuegen
      </button>
      <button type="button" data-testid="menue-entfernen" onClick={() => tue('entfernen')}>
        Element entfernen
      </button>
    </div>
  );
}
