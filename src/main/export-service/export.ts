// GENERIERT aus dem Signaturblock von Issue #188.
// [export-service] Den Export-Ablauf zusammensetzen und das Ziel merken
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Auftrag } from '../../shared/contracts/auftrag'
import type { AusfuehrungsKontext, HandlerErgebnis } from '../auftrags-manager/dispatcher'
import type { ExportFehlercode } from './fehlercodes'

export async function exportiereAusgabe(
  auftrag: Extract<Auftrag, { art: 'export' }>,
  kontext: AusfuehrungsKontext,
): Promise<HandlerErgebnis<ExportFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #188."
  );
}
// Erfolg:  { status: 'erfolg', ergebnis: { zielPfad, dateigroesse } }
//          zielPfad = VOLLSTÄNDIGER Pfad der geschriebenen ZIELDATEI (Zielordner + dateiname)
// Fehler:  { status: 'fehlgeschlagen', fehler: { code, meldung } }
// Diese Funktion liefert NIE { status: 'abgebrochen' } – ein Export ist nicht abbrechbar (FA-18)
// Sie wirft NIE.
