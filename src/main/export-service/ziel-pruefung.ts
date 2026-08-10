/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #184.
// [export-service] Exportziel vorab prüfen: Erreichbarkeit, Dateisystem, freier Platz
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

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
