// [composer] #437: der EINE Schreibweg fuer die Unterbrechungen eines Video-Elements.
//
// Der Store-Ruf selbst liegt in `project-store/setze-unterbrechungen.ts` (#426). Hier steht
// nur die Uebersetzung in die Nutzlastform `{ elementId, unterbrechungen }` (wie
// `uebernehmeBand` fuer das Band) - KEINE Fachlogik, keine zweite Pruefung der Zeitstellen
// (die liegt beim Store, 9.5.2), kein Rollback (das entscheidet optimistisch.ts, 9.7.3).

import type { Listenelement, Unterbrechung } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

function fehler(meldung: string): Ergebnis<Listenelement> {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

/**
 * Setzt die Unterbrechungen eines Video-Elements. Die Liste wird ERSETZT (nicht ergaenzt) -
 * `[]` entfernt alle Einschuebe, das Videoelement bleibt (TK 9.5.3). EIN Undo-Schritt legt
 * die Huelle um die Sicht (#243), weil der Aufrufer das zurueckgegebene Element ueber
 * `setzeListe` schreibt.
 */
export async function setzeElementUnterbrechungen(
  elementId: string,
  unterbrechungen: readonly Unterbrechung[],
): Promise<Ergebnis<Listenelement>> {
  if (typeof elementId !== 'string' || elementId.trim() === '') {
    return fehler('setzeElementUnterbrechungen braucht die Kennung des Video-Elements.')
  }
  return rufeAuf<Listenelement>(KANAELE.project.setzeUnterbrechungen, {
    elementId,
    unterbrechungen: [...unterbrechungen],
  })
}
