/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #209.
// [queue-panel] Entfernen und Abbrechen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: 75615a18b8a2243e
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

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
