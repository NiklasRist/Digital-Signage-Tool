// GENERIERT aus dem Signaturblock von Issue #186.
// [export-service] Nach .part kopieren, Größe verifizieren, fsync vor der Erfolgsmeldung
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ExportFehlercode } from './fehlercodes'

export async function kopiereNachPart(
  quellPfad: string,      // absolut, aus loeseExportQuelle (#185) – bereits geprüft
  partPfad: string,       // absolut, `<zielOrdner>/<dateiname>.part` – vom Aufrufer gebildet
  quellGroesse: number,   // Bytes, aus loeseExportQuelle (#185) – die Sollgröße
): Promise<Ergebnis<void, ExportFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #186."
  );
}
// Reihenfolge verbindlich: kopieren -> Größe vergleichen -> fsync -> ERST DANN Erfolg melden.
// Bei jedem Fehlschlag wird die angefangene .part-Datei best-effort entfernt (s. Ablauf).
// Diese Funktion fasst die eigentliche Zieldatei NICHT an – weder lesend noch schreibend.
