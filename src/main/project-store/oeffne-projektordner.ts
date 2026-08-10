// GENERIERT aus dem Signaturblock von Issue #241.
// [project-store] Den Projektordner im Datei-Explorer des Betriebssystems öffnen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import { shell } from 'electron'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { projektOrdner } from './pfade'

/**
 * Öffnet `projects/<projektId>/` im Datei-Explorer des Betriebssystems (TK 9.5.2).
 * Instant-Aufruf: KEIN Auftrag, KEIN D1-Lock, KEIN Schreibvorgang.
 * Legt NICHTS an, repariert NICHTS und liest KEINE Projektdatei.
 * Wirft nie – jeder Weg endet in einem `Ergebnis<void>`.
 */
export async function öffneProjektordner(projektId: string): Promise<Ergebnis<void>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #241."
  );
}
