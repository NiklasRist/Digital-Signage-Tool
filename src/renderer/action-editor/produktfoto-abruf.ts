// [action-editor] Die drei Produktfoto-Aufrufe (FA-27 / TK 9.19)
//
// Dieselbe Form wie `bild-zuweisen.ts`: kein Kanal-Literal, alles ueber `KANAELE` (#25)
// und `rufeAuf` (#24). Der Abruf selbst ist ein AUFTRAG - `produkt:abrufen` reiht ihn nur
// ein und antwortet mit der `auftragId`; das Ergebnis kommt ueber den Nachlauf (#199).

import { KANAELE } from '../../shared/contracts/kanaele'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type {
  ProduktWahlErgebnis,
  ProduktWahlRequest,
} from '../../shared/contracts/produktabruf'
import { rufeAuf } from '../ipc-client/rufe-auf'

/** Reiht den Abruf ein. `aktionId` ist leer, solange die Aktion nur ein Entwurf ist. */
export async function starteProduktfotoAbruf(
  projektId: string,
  aktionId: string,
  produktUrl: string,
): Promise<Ergebnis<{ auftragId: string }>> {
  try {
    return await rufeAuf<{ auftragId: string }>(KANAELE.produkt.abrufen, {
      projektId,
      aktionId,
      produktUrl,
    })
  } catch {
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: 'Der Abruf-Auftrag konnte nicht eingereiht werden.',
      },
    }
  }
}

/** Uebernimmt genau einen Kandidaten als Asset. */
export async function waehleProduktfoto(
  abrufId: string,
  kandidat: number,
): Promise<Ergebnis<ProduktWahlErgebnis>> {
  const anfrage: ProduktWahlRequest = { abrufId, kandidat }
  try {
    return await rufeAuf<ProduktWahlErgebnis>(KANAELE.produkt.waehlen, anfrage)
  } catch {
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: 'Das Bild konnte nicht übernommen werden.',
      },
    }
  }
}

/** Verwirft die Kandidaten eines Abrufs (z. B. „doch keine nehmen"). */
export async function verwirfProduktfoto(abrufId: string): Promise<void> {
  try {
    await rufeAuf<void>(KANAELE.produkt.verwerfen, { abrufId })
  } catch {
    // Verwerfen ist Hygiene; ein Fehlschlag laesst die Kandidaten nach 10 Minuten von
    // selbst verfallen (TK 9.19.2). Kein zweiter Meldeweg fuer eine Nichtigkeit.
  }
}
