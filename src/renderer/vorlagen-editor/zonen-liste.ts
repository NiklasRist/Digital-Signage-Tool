// GENERIERT aus dem Signaturblock von Issue #146.
// [vorlagen-editor] Die Zonen-Liste als Zeichenreihenfolge führen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Vorlage, Zone } from '../../shared/contracts/vorlage'

/** Eine Zeile der Zonen-Liste. Die Reihenfolge der Zeilen IST die Zeichenreihenfolge. */
export interface ZonenListenEintrag {
  zone: Zone
  index: number       // Position in vorlage.zonen – identisch mit der Position in dieser Liste
  ebene: number       // index + 1; 1 = zuunterst, die höchste Zahl = zuoberst. NUR Anzeigetext.
  beweglich: boolean  // zone.rolle === 'frei' – nur diese Zeilen sind ziehbar
}

/** Baut die Liste. Reine Abbildung 1:1 auf vorlage.zonen – ohne jede Sortierung. */
export function baueZonenListe(vorlage: Vorlage): ZonenListenEintrag[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #146."
  );
}

/**
 * Verschiebt den Eintrag von `vonIndex` an die Position `nachIndex`.
 * Liefert ein NEUES Array; das übergebene bleibt unverändert.
 */
export function ordneZonenNeu(
  zonen: readonly Zone[],
  vonIndex: number,
  nachIndex: number,
): Ergebnis<Zone[]> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #146."
  );
}
