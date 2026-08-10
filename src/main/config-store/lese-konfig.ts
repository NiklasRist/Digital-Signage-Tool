// GENERIERT aus dem Signaturblock von Issue #26.
// [config-store] leseKonfig implementieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: eb20b576cf2d80db

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
