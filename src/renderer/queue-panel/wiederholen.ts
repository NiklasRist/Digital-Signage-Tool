// [queue-panel] Wiederholen

import type { Auftrag } from '../../shared/contracts/auftrag'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

/**
 * REIN. Die EINZIGE Auskunft darueber, ob an einer Zeile ein „Wiederholen"-Schalter erscheint.
 * Genau dann true, wenn status === 'fehlgeschlagen'. NICHT bei 'abgebrochen' (TK 9.3.3),
 * nicht bei 'erfolg', nicht bei 'anstehend', nicht bei 'laeuft'.
 */
export function darfWiederholen(auftrag: Auftrag): boolean {
  return auftrag.status === 'fehlgeschlagen'
}

/** REIN. Beschriftung des Schalters. */
export const WIEDERHOLEN_BESCHRIFTUNG = 'Erneut versuchen'

/**
 * REIN. Der Hinweis, der beim Schalter steht bzw. nach dem Klick erscheint.
 * Nennt AUSDRUECKLICH, dass der Auftrag ans Ende der Warteschlange kommt (FA-17).
 */
export function wiederholenHinweis(auftrag: Auftrag): string {
  // ENTSCHIEDEN 2 aus Issue #210 - der Text ist verbindlich. `versuche` wird nicht
  // hochgezaehlt: der Wert steigt erst beim tatsaechlichen Start im Main (TK 9.3.3).
  const hinweis =
    'Der Auftrag wird ans Ende der Warteschlange gestellt und startet, sobald er an der Reihe ist.'
  return auftrag.versuche >= 1
    ? `${auftrag.versuche}. Versuch bisher. ${hinweis}`
    : hinweis
}

/** Reiht den fehlgeschlagenen Auftrag erneut ein. `ok` heisst „eingereiht", NICHT „fertig". */
export async function wiederholeAuftrag(auftragId: string): Promise<Ergebnis<void>> {
  if (auftragId === '') {
    return {
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: 'auftragId darf nicht leer sein.' },
    }
  }
  try {
    return await rufeAuf<void>(KANAELE.queue.wiederhole, { auftragId })
  } catch (ursache) {
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: ursache instanceof Error ? ursache.message : String(ursache),
      },
    }
  }
}
