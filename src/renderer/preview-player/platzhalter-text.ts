// [preview-player] Kaputte Stellen als Platzhalter zeigen – und nichts reparieren

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
  switch (grund) {
    case 'asset_fehlt':
      return {
        ueberschrift: 'Datei fehlt',
        erklaerung: 'Die Mediendatei dieses Elements liegt nicht mehr im Projekt. Beheben lässt sich das in der Zusammenstellung.',
      }
    case 'asset_unbekannt':
      return {
        ueberschrift: 'Medium unbekannt',
        erklaerung: 'Dieses Element verweist auf ein Medium, das es im Projekt nicht gibt. Beheben lässt sich das in der Zusammenstellung.',
      }
    case 'aktion_unbekannt':
      return {
        ueberschrift: 'Aktion unbekannt',
        erklaerung: 'Dieses Element verweist auf eine Aktion, die es im Projekt nicht gibt. Beheben lässt sich das in der Zusammenstellung.',
      }
  }
}