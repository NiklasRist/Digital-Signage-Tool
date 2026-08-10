// GENERIERT aus dem Signaturblock von Issue #75.
// [project-store] listeAusgaben implementieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProjectStoreFehlercode } from './assets'
export interface AusgabeDatei {
  dateiname: string       // MIT Endung, z. B. "sommeraktion.mp4"
  dateigroesse: number    // Bytes
  geaendertAm: string     // ISO-8601 UTC – zugleich der Renderzeitpunkt
}

export async function listeAusgaben(
  projektId: string,
): Promise<Ergebnis<AusgabeDatei[], ProjectStoreFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #75."
  );
}
// - liest NUR den Ordner ausgabeOrdner(projektId) (#49); kein project.json, kein Q3
// - KEIN mitD1Lock: diese Operation fasst project.json nicht an (TK 9.5.2)
// - Sortierung: absteigend nach geaendertAm (neueste zuerst)
// - fehlender Ordner => leere Liste, KEIN Fehler
