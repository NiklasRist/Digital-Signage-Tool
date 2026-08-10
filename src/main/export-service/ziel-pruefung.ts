// GENERIERT aus dem Signaturblock von Issue #184.
// [export-service] Exportziel vorab prüfen: Erreichbarkeit, Dateisystem, freier Platz
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ExportFehlercode } from './fehlercodes'

export async function pruefeExportZiel(
  zielOrdner: string,
  benoetigteBytes: number,
): Promise<Ergebnis<void, ExportFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #184."
  );
}
// - `zielOrdner`: absoluter Pfad des vom Nutzer gewählten Ordners (aus ExportRequest.zielPfad)
// - `benoetigteBytes`: Größe der zu kopierenden Quelldatei in Bytes – ohne Abzug einer
//   vorhandenen Zieldatei gleichen Namens (Begründung s. o.)
// - Ergebnis<void>: das gelungene `ok` IST die Information; kein Prüfbericht, kein boolean
// - diese Funktion VERÄNDERT am Ziel nichts: sie legt keinen Ordner an, schreibt keine
//   Testdatei und löscht nichts
