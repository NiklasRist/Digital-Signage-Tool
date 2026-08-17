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
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

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
  // FA-18: EIN anstehender Auftrag (jeder Art) kann entfernt, EIN laufender render
  // abgebrochen werden. Alles andere - auch ein laufender import/loeschen/export,
  // auch jeder beendete Zustand - erhaelt hier bewusst keinen Schalter; unbekannte
  // status-/art-Werte fallen in denselben null-Zweig (Fehlerpfad-Tabelle des Issues).
  if (auftrag.status === 'anstehend') {
    return 'entfernen'
  }
  if (auftrag.status === 'laeuft' && auftrag.art === 'render') {
    return 'abbrechen'
  }
  return null
}

/** REIN. Nur 'abbrechen' braucht eine Rueckfrage – Begruendung s. ENTSCHIEDEN 2. */
export function brauchtBestaetigung(aktion: QueueAktion): boolean {
  return aktion === 'abbrechen'
}

/** REIN. Der Text der Rueckfrage bzw. die Beschriftung des Schalters. */
export function beschriftung(aktion: QueueAktion): string {
  if (aktion === 'abbrechen') {
    return 'Render abbrechen'
  }
  return 'Aus der Warteschlange nehmen'
}
export function rueckfrageText(auftrag: Auftrag): string {
  // ENTSCHIEDEN 3: Einen Text gibt es nur beim Abbruch. Der Satz zur unveraenderten
  // Datei ist Vertrag (TK 9.2.3, 9.2.6), keine Beruhigungsfloskel.
  if (moeglicheAktion(auftrag) !== 'abbrechen') {
    return ''
  }
  return `„${auftrag.label}" abbrechen? Der bisherige Fortschritt geht verloren, und es entsteht keine Ausgabedatei. Eine vorhandene Datei gleichen Namens bleibt unverändert.`
}

/**
 * Fuehrt die Aktion aus. BEIDE Faelle laufen ueber DENSELBEN Kanal `queue:entferne` –
 * der Main unterscheidet anhand des Auftragszustands (TK 9.3.4). Es gibt hier bewusst
 * KEINE zweite Aufruffunktion fuer den Abbruch (s. ENTSCHIEDEN 1).
 */
export async function fuehreQueueAktionAus(auftragId: string): Promise<Ergebnis<void>> {
  // Eine leere Kennung erreicht den Main nicht: Das ist ein Programmfehler der
  // Oberflaeche, keine Frage an den Auftragszustand (Fehlerpfad-Tabelle des Issues).
  if (auftragId === '') {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'Die Auftrags-Id darf nicht leer sein.',
      },
    }
  }

  try {
    // ENTSCHIEDEN 1: BEIDE Faelle laufen ueber denselben Kanal `KANAELE.queue.entferne`;
    // der Main unterscheidet anhand des Auftragszustands (TK 9.3.4). `ok` heisst
    // „entfernt bzw. Abbruch angestossen", ausdruecklich NICHT „der Auftrag ist beendet"
    // (TK 9.3.4) - der neue Zustand kommt ueber das Kanal-Ereignis der Auftragssicht.
    return await rufeAuf<void>(KANAELE.queue.entferne, { auftragId })
  } catch (ursache) {
    // `rufeAuf` wirft, wenn die Preload-Bruecke fehlt (#24). Das wird zu einem
    // `unbekannter_fehler`-Ergebnis - kein stiller Fehlschlag, kein throw (TK 9.1.1 Punkt 7).
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: grundText(ursache),
      },
    }
  }
}

/** Lesbarer Grund fuer die Meldung - ohne Annahme darueber, was geworfen wurde. */
function grundText(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}
