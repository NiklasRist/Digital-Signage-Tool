// [ipc-gateway] Den Kanal der Produktseiten-Suche verdrahten (FA-30 / TK 9.20)
//
// `produkt:seiten-suchen` reiht die Suche ueber `reiheEin` ein - derselbe Weg wie jeder
// Import und wie der Produktfoto-Abruf (9.20, Signaturblock 3). Damit erbt der Auftrag
// Fortschritt, Fehlergrund und Wiederholen von 9.3; einen zweiten Weg gibt es nicht.
//
// KEIN ZWEITER SCHREIBKANAL: Die Wahl eines Treffers setzt `Aktion.produktUrl` im ENTWURF
// des Editors; geschrieben wird ueber den vorhandenen Weg (9.19.7). Die Kandidaten selbst
// reisen im Feld `Auftrag.ergebnis` - kein Speicher im Main, keine Bytes ueber IPC.

import { KANAELE } from '../../shared/contracts/kanaele'
import { reiheEin } from '../auftrags-manager/reihe-ein'
import { meldeAn } from './melde-an'
import { abgelehnt, istGefuellterText, istObjekt } from './nutzlast-pruefer'

import type { Ergebnis } from '../../shared/contracts/ergebnis'

export function verdrahteProduktsucheIPC(): void {
  meldeAn(
    // Der Schluessel traegt einen Bindestrich - deshalb die Klammerform.
    KANAELE.produkt['seiten-suchen'],
    (
      nutzlast: unknown,
    ): Ergebnis<{ projektId: string; aktionId: string; stichwort: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('produkt:seiten-suchen erwartet ein Objekt { projektId, aktionId, stichwort }.')
      }
      const projektId = nutzlast.projektId
      const aktionId = nutzlast.aktionId
      const stichwort = nutzlast.stichwort
      if (!istGefuellterText(projektId)) {
        return abgelehnt('produkt:seiten-suchen braucht eine nicht leere projektId.')
      }
      // LEER IST ERLAUBT: Im Modus „neu" existiert die Aktion noch nicht; der Editor
      // schickt dann einen leeren Text. Die Kennung ordnet nur die Antwort zu.
      if (typeof aktionId !== 'string') {
        return abgelehnt('produkt:seiten-suchen braucht eine aktionId (leer erlaubt).')
      }
      if (!istGefuellterText(stichwort)) {
        return abgelehnt('produkt:seiten-suchen braucht ein nicht leeres Stichwort.')
      }
      return { ok: true, wert: { projektId, aktionId, stichwort: stichwort.trim() } }
    },
    ({ projektId, aktionId, stichwort }) =>
      reiheEin('produktseite-suche', { projektId, aktionId, stichwort }),
  )
}
