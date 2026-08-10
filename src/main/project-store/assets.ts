// GENERIERT aus dem Signaturblock von Issue #72.
// [project-store] fuegeAssetHinzu implementieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Asset } from '../../shared/contracts/asset'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

// Fehlercode-Union des Moduls `project-store` – sie wird HIER deklariert (Begründung unten);
// #73 und #74 liegen in derselben Datei und verwenden sie, #75 (`ausgaben.ts`) importiert sie
// von hier. Diese Zeile ist Teil dieses Issues.
export type ProjectStoreFehlercode = 'speicher_fehler'

export async function fuegeAssetHinzu(
  projektId: string,
  asset: Asset,
): Promise<Ergebnis<Asset, ProjectStoreFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #72."
  );
}
// - läuft VOLLSTÄNDIG innerhalb von mitD1Lock(...) (#32) – diese Funktion nimmt das Lock SELBST;
//   der Aufrufer (media-service) darf sie NICHT zusätzlich in mitD1Lock einwickeln
// - hängt asset an Project.assets des aktiven Projekts an (Array-Ende)
// - ruft DANACH, im SELBEN Lock-Abschnitt, sofortFlush(projekt) (#47) auf: der Import ist ein
//   Auftrag, und ein Auftrag, der D1 verändert hat, schreibt am Ende sofort (TK 9.5.4, 9.4.5)
// - meldet Erfolg ERST, wenn der Flush gelungen ist; scheitert er -> speicher_fehler und das
//   Anhängen wird zurückgenommen (s. „ENTSCHIEDEN – Anhängen, Flush, Erfolg")
// - liefert bei Erfolg genau das übernommene Asset zurück
