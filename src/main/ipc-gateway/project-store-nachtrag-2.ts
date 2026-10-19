// [ipc-gateway] Die beiden neuen project-store-Kanäle aus TK v3.1 verdrahten
//
// Die Nutlast-Pruefer (#332) und der Registrier-Wrapper (#23) an EINEM Ort - importiert,
// nicht kopiert; dieselbe Bauweise wie #153 (project-store-nachtrag).
import { abgelehnt, istGefuellterText, istObjekt } from './nutzlast-pruefer'
// Die lokale Kopie ist mit #337 entfallen - EINE `meldeAn` (#333).
import { meldeAn } from './melde-an'

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import type { Bearbeitungsstand } from '../../shared/contracts/project'
import { setzeBearbeitungsstand } from '../project-store/bearbeitungsstand'
import { öffneProjektordner } from '../project-store/oeffne-projektordner'

export function verdrahteProjectStoreNachtrag2IPC(): void {
  meldeAn(KANAELE.project.setzeBearbeitungsstand, (nutzlast: unknown): Ergebnis<Bearbeitungsstand, 'ungueltige_eingabe'> => {
    if (!istObjekt(nutzlast)) return abgelehnt('setzeBearbeitungsstand erwartet ein Objekt { stand }.')
    const stand = nutzlast.stand
    if (typeof stand !== 'object' || stand === null) {
      return abgelehnt('setzeBearbeitungsstand braucht einen Stand als Objekt.')
    }
    const roh = stand as { aktionen?: unknown; liste?: unknown }
    if (!Array.isArray(roh.aktionen) || !Array.isArray(roh.liste)) {
      return abgelehnt('Der Stand braucht aktionen und liste als Arrays.')
    }
    return { ok: true, wert: stand as Bearbeitungsstand }
  }, (stand) => setzeBearbeitungsstand(stand))

  meldeAn(
    KANAELE.project.öffneProjektordner,
    (nutzlast: unknown): Ergebnis<{ projektId: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('oeffneProjektordner erwartet ein Objekt { projektId }.')
      const projektId = nutzlast.projektId
      if (!istGefuellterText(projektId)) {
        return abgelehnt('oeffneProjektordner braucht eine nicht leere projektId.')
      }
      return { ok: true, wert: { projektId } }
    },
    ({ projektId }) => öffneProjektordner(projektId),
  )
}
// registriert die 2 unten aufgeführten Kanäle über den Wrapper aus #23 – je mit einer eigenen
// Validierungsfunktion. Kein Zustand, keine Fachlogik, kein Ereignis-Versand (s. STOPP).
