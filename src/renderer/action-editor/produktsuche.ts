// [action-editor] Die Produktseiten-Suche ausloesen (FA-30 / TK 9.20)
//
// Dieselbe Form wie `produktfoto-abruf.ts`: kein Kanal-Literal, alles ueber `KANAELE`
// (#25) und `rufeAuf` (#24). Die Suche ist ein AUFTRAG - `produkt:seiten-suchen` reiht
// ihn nur ein und antwortet mit der `auftragId`; die Treffer kommen ueber den Nachlauf
// (#199). Kein zweiter Kanal fuer die Treffer.

import { KANAELE } from '../../shared/contracts/kanaele'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProduktQuellen } from '../../shared/contracts/produktsuche'
import { normalisiereProduktQuellen } from '../../shared/produkt-quellen'
import type { AppKonfig } from '../../shared/contracts/app-konfig'
import { rufeAuf } from '../ipc-client/rufe-auf'

/** Reiht die Suche ein. `aktionId` ist leer, solange die Aktion nur ein Entwurf ist. */
export async function starteProduktsuche(
  projektId: string,
  aktionId: string,
  stichwort: string,
): Promise<Ergebnis<{ auftragId: string }>> {
  try {
    return await rufeAuf<{ auftragId: string }>(KANAELE.produkt['seiten-suchen'], {
      projektId,
      aktionId,
      stichwort,
    })
  } catch {
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: 'Der Such-Auftrag konnte nicht eingereiht werden.',
      },
    }
  }
}

/**
 * Liest die hinterlegten Quellen aus `config.json`.
 *
 * WARUM DER EDITOR DAS UEBERHAUPT LESEN DARF: 9.20.3 verlangt, dass das Feld OHNE Quelle
 * „es VOR dem Klick sagt". Dafuer muss die Oberflaeche wissen, ob gesucht werden KANN -
 * und das ist eine reine Leseoperation derselben app-weiten Konfiguration (derselbe Weg
 * wie die Farbhistorie, #196).
 *
 * Ein Lesefehler ergibt "keine Quelle": Der Editor sperrt dann den Knopf, statt einen
 * Auftrag einzureihen, der sicher scheitert.
 */
export async function ladeProduktQuellen(): Promise<ProduktQuellen> {
  try {
    const antwort: Ergebnis<AppKonfig> = await rufeAuf<AppKonfig>(KANAELE.config.leseKonfig)
    if (!antwort.ok) return normalisiereProduktQuellen(undefined)
    return normalisiereProduktQuellen(antwort.wert.produktQuellen)
  } catch {
    return normalisiereProduktQuellen(undefined)
  }
}
