// GENERIERT aus dem Signaturblock von Issue #209.
// [queue-panel] Entfernen und Abbrechen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Auftrag } from '../../shared/contracts/auftrag'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/** Was mit DIESEM Auftrag ueberhaupt moeglich ist – null heisst: keinen Schalter anbieten. */
export type QueueAktion = 'entfernen' | 'abbrechen'

/**
 * REIN. Die EINZIGE Auskunft darueber, ob und welcher Schalter an einer Zeile erscheint.
 *   status 'anstehend'                    -> 'entfernen'
 *   status 'laeuft' UND art 'render'      -> 'abbrechen'
 *   alles andere (auch laufender Import/  -> null
 *   Loeschen/Export, auch erfolg/
 *   fehlgeschlagen/abgebrochen)
 */
export function moeglicheAktion(auftrag: Auftrag): QueueAktion | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #209."
  );
}

/** REIN. Nur 'abbrechen' braucht eine Rueckfrage – Begruendung s. ENTSCHIEDEN 2. */
export function brauchtBestaetigung(aktion: QueueAktion): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #209."
  );
}

/** REIN. Der Text der Rueckfrage bzw. die Beschriftung des Schalters. */
export function beschriftung(aktion: QueueAktion): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #209."
  );
}
export function rueckfrageText(auftrag: Auftrag): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #209."
  );
}

/**
 * Fuehrt die Aktion aus. BEIDE Faelle laufen ueber DENSELBEN Kanal `queue:entferne` –
 * der Main unterscheidet anhand des Auftragszustands (TK 9.3.4). Es gibt hier bewusst
 * KEINE zweite Aufruffunktion fuer den Abbruch (s. ENTSCHIEDEN 1).
 */
export async function fuehreQueueAktionAus(auftragId: string): Promise<Ergebnis<void>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #209."
  );
}
