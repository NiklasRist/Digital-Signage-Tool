// [action-editor] Die letzte Meldung der Produktseiten-Suche (FA-30)
//
// WARUM ES DIESE DATEI GIBT: Die Suche laeuft als Auftrag; ihr Ergebnis kommt ueber
// `queue:geaendert` zurueck, und der EINZIGE Auswerter dieser Ereignisse ist der
// Auftrags-Nachlauf (#199) - der Editor abonniert die Warteschlange ausdruecklich NICHT.
// Der Nachlauf legt das Ergebnis deshalb hier ab; der Editor liest es bei jeder Meldung.
//
// KEIN ZWEITER AUSWERTER: Hier wird nichts gedeutet und nichts gespeichert - die Meldung
// ist ein Wert, der auf den naechsten Leser wartet.

import type { ProduktSeiteTreffer } from '../../shared/contracts/produktsuche'

export type ProduktsucheMeldung =
  | {
      status: 'erfolg'
      /** Der Auftrag, den der Editor eingereiht hat - so ordnet sich die Meldung zu. */
      auftragId: string
      treffer: ProduktSeiteTreffer[]
    }
  | {
      status: 'fehler'
      /** Der Auftrag, den der Editor eingereiht hat. */
      auftragId: string
    }

let letzte: ProduktsucheMeldung | null = null
const hoerer = new Set<() => void>()

export function meldeProduktsuche(meldung: ProduktsucheMeldung): void {
  letzte = meldung
  for (const benachrichtige of hoerer) {
    benachrichtige()
  }
}

export function holeProduktsucheMeldung(): ProduktsucheMeldung | null {
  return letzte
}

/** Nimmt die Meldung aus dem Speicher - der Editor hat sie verarbeitet. */
export function verbraucheProduktsuche(): void {
  letzte = null
}

export function abonniereProduktsuche(benachrichtige: () => void): () => void {
  hoerer.add(benachrichtige)
  return () => {
    hoerer.delete(benachrichtige)
  }
}
