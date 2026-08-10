// GENERIERT aus dem Signaturblock von Issue #134.
// [composer] Render und Export auslösen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Project } from '../../shared/contracts/project'
import type { Marke } from '../../shared/contracts/marke'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { RenderRequest, RenderItem } from '../../shared/contracts/render-request'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { KaputteStelle } from './kaputt-erkennung'

/** Fehlercodes, die in DIESER Datei entstehen – vor jedem IPC-Aufruf. */
export type AusloeseFehlercode = 'kaputte_elemente' | 'png_export_fehler'

export async function loeseRenderAus(
  projekt: Project,
  ausgabeName: string,
  marke: Marke,
  vorlagen: readonly Vorlage[],
): Promise<Ergebnis<{ auftragId: string }, AusloeseFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #134."
  );
}

export async function loeseExportAus(
  projektId: string,
  dateiname: string,
  zielPfad: string,
): Promise<Ergebnis<{ auftragId: string }>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #134."
  );
}
