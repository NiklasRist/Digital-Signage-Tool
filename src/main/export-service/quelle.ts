/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #185.
// [export-service] Exportquelle über die Pfad-Autorität auflösen und prüfen
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

export interface ExportQuelle {
  quellPfad: string       // absoluter Pfad der Datei in projects/<id>/output/
  dateigroesse: number    // Bytes – Grundlage für Platzprüfung (#184) und Verifikation (#186)
}

export async function loeseExportQuelle(
  projektId: string,
  dateiname: string,      // MIT Endung, wie aus listeAusgaben (#75), z. B. "sommeraktion.mp4"
): Promise<Ergebnis<ExportQuelle, ExportFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #185."
  );
}
// - baut den Pfad AUSSCHLIESSLICH über loeseAusgabePfad (#49); KEIN eigenes path.join
// - fehlt die Datei → 'keine_ausgabe'
