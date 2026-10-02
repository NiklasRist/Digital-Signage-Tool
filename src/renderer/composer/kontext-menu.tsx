import { useEffect, useRef, type JSX } from "react";

import type { Project } from "../../shared/contracts/project";
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

export function fuehreMenueAktionAus(aktion: MenueAktion, elementId: string, referenz: string): void {
  if (aktion === 'entfernen') {
    void entferneElementAusListe(elementId)
    return
  }
  // Duplikat: fügeElementHinzu legt ein NEUES Element mit NEUER id ans ENDE der Liste
  // (Vertrag des project-store) – es ist keine Positions- oder Identitätskopie.
  void fuegeElementHinzu(referenz)
}

export function KontextMenue({
  projekt,
  adresse,
  schliesse,
}: {
  projekt: Project
  adresse: MenueAdresse
  schliesse: () => void
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
    fuehreMenueAktionAus(aktion, adresse.elementId, menueReferenz)
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
