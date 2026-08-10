// GENERIERT aus dem Signaturblock von Issue #185.
// [export-service] Exportquelle über die Pfad-Autorität auflösen und prüfen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

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
