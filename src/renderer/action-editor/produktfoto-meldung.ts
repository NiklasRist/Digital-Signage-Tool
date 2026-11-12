// [action-editor] Die letzte Meldung des Produktfoto-Abrufs (FA-27)
//
// WARUM ES DIESE DATEI GIBT: Der Abruf laeuft als Auftrag; sein Ergebnis kommt ueber
// `queue:geaendert` zurueck, und der EINZIGE Auswerter dieser Ereignisse ist der
// Auftrags-Nachlauf (#199) - der Editor abonniert die Warteschlange ausdruecklich NICHT.
// Der Nachlauf legt das Ergebnis deshalb hier ab; der Editor liest es bei jeder Meldung.
//
// KEIN ZWEITER AUSWERTER: Hier wird nichts gedeutet und nichts gespeichert - die Meldung
// ist ein Wert, der auf den naechsten Leser wartet.

import type { ProduktfotoKandidat } from '../../shared/contracts/produktabruf'

export type ProduktfotoMeldung =
  | {
      status: 'erfolg'
      /** Der Auftrag, den der Editor eingereiht hat - so ordnet sich die Meldung zu. */
      auftragId: string
      abrufId: string
      kandidaten: ProduktfotoKandidat[]
    }
  | {
      status: 'fehler'
      /** Der Auftrag, den der Editor eingereiht hat. */
      auftragId: string
    }

let letzte: ProduktfotoMeldung | null = null
const hoerer = new Set<() => void>()

export function meldeProduktfoto(meldung: ProduktfotoMeldung): void {
  letzte = meldung
  for (const benachrichtige of hoerer) {
    benachrichtige()
  }
}

export function holeProduktfotoMeldung(): ProduktfotoMeldung | null {
  return letzte
}

/** Nimmt die Meldung aus dem Speicher - der Editor hat sie verarbeitet. */
export function verbraucheProduktfoto(): void {
  letzte = null
}

export function abonniereProduktfoto(benachrichtige: () => void): () => void {
  hoerer.add(benachrichtige)
  return () => {
    hoerer.delete(benachrichtige)
  }
}
