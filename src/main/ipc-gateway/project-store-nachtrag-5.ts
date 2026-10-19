// [ipc-gateway] Den Kanal project:setzeUnterbrechungen verdrahten (#426)
//
// Muster ist src/main/ipc-gateway/project-store-nachtrag-4.ts (#334): genau EINE
// Verdrahtungsdatei fuer GENAU EINEN nachgetragenen project-Kanal, weil die Stammdateien
// (#76, #153) ihre Eintragszahl nicht ueberschreiten duerfen und #240/#323/#334 ihre
// eigenen Dateien haben.

import { KANAELE } from '../../shared/contracts/kanaele'                          // #25
import { setzeUnterbrechungen } from '../project-store/setze-unterbrechungen'      // #426
import { abgelehnt, istGefuellterText, istObjekt } from './nutzlast-pruefer'       // #332
// Die lokale Kopie ist mit #337 entfallen - EINE `meldeAn` (#333).
import { meldeAn } from './melde-an'                                               // #337

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Unterbrechung } from '../../shared/contracts/project'

export function verdrahteProjectStoreNachtrag5IPC(): void {
  // KEIN Schutz gegen einen zweiten Aufruf: #3 ruft genau einmal, und `ipcMain.handle`
  // wirft bei doppelter Anmeldung von sich aus. Kein Ereignis, keine Fensterreferenz, kein
  // Zustand, kein eigenes try/catch (das gehoert dem Wrapper #23), kein Lock (nimmt die
  // Operation selbst).

  meldeAn(
    KANAELE.project.setzeUnterbrechungen,
    // Der ausgeschriebene Rueckgabetyp legt `W` fest, bevor der zweite Rueckruf getippt wird.
    (
      nutzlast: unknown,
    ): Ergebnis<{ elementId: string; unterbrechungen: Unterbrechung[] }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('setzeUnterbrechungen erwartet ein Objekt { elementId, unterbrechungen }.')
      }
      const elementId = nutzlast.elementId
      if (!istGefuellterText(elementId)) {
        return abgelehnt('setzeUnterbrechungen braucht eine nicht leere elementId.')
      }
      // NUR die FORM wird geprueft: es muss eine Liste sein. Die Eintraege (Zeitstelle,
      // Aktion, Dauer, Reihenfolge) prueft ausschliesslich die Operation (#426) - eine
      // zweite, leicht abweichende Fachpruefung hier waere schlimmer als keine.
      const unterbrechungen = nutzlast.unterbrechungen
      if (!Array.isArray(unterbrechungen)) {
        return abgelehnt('setzeUnterbrechungen braucht ein Array unterbrechungen.')
      }
      // SAFETY: Form ist belegt (Array); die feldweise Pruefung liegt in #426.
      return {
        ok: true,
        wert: { elementId, unterbrechungen: unterbrechungen as Unterbrechung[] },
      }
    },
    ({ elementId, unterbrechungen }) => setzeUnterbrechungen(elementId, unterbrechungen),
  )
}
