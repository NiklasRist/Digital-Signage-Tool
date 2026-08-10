// GENERIERT aus dem Signaturblock von Issue #221.
// [preview-player] Kaputte Stellen als Platzhalter zeigen – und nichts reparieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { KaputtGrund } from '../composer/kaputt-erkennung'

/** Der Wortlaut eines Platzhalters. Zwei Zeilen, mehr nicht. */
export interface PlatzhalterWortlaut {
  /** Kurze Benennung des Zustands, zwei bis drei Woerter. */
  ueberschrift: string
  /** Ein Satz: was fehlt – und wo es behoben wird. KEINE Handlungsaufforderung an dieser Stelle. */
  erklaerung: string
}

/**
 * Uebersetzt den Grund in Text. REINE Funktion, vollstaendig ueber die drei Gruende: jeder Grund
 * liefert einen Wortlaut, es gibt keinen Rueckfall und keinen leeren Text.
 * Total: wirft nie.
 */
export function platzhalterWortlaut(grund: KaputtGrund): PlatzhalterWortlaut {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #221."
  );
}
