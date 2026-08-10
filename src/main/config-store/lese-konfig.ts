// GENERIERT aus dem Signaturblock von Issue #26.
// [config-store] leseKonfig implementieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { AppKonfig } from '../../shared/contracts/app-konfig'   // #265
export async function leseKonfig(): Promise<Ergebnis<AppKonfig>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #26."
  );
}
// AppKonfig: { aktivesProjektId: string | null, letztesExportZiel: string | null,
//              uiVoreinstellungen: Record<string, unknown> }   // #265 - OHNE marke;
//              die Marke kommt ausschliesslich ueber leseMarke() (#29)
// existiert config.json nicht (erster Start) → liefert Ergebnis<AppKonfig> mit sinnvollen
// Defaults (aktivesProjektId: null, ...), OHNE Fehler
