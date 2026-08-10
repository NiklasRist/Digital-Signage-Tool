/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #66.
// [auftrags-manager] pendingDeletions in Q2 führen
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
import type { PendingDeletion } from './q2-wiederholung'      // Typ und Dateiform aus #55
import type { QueueFehlercode } from './schreibe-queue-json'  // = 'speicher_fehler' (#69)
                                                              // NUR als Typ – #69 wird aus dieser
                                                              // Datei NICHT aufgerufen

// Fremde Aufrufe – vollstaendige Signaturen. #55 ist der EINZIGE Kenner der Q2-Dateiform;
// der Zugriff auf queue-retry.json laeuft ausschliesslich ueber diese Funktionen:
//   #55: ladeQ2(projektId: string): Promise<Ergebnis<Q2Datei, QueueFehlercode>>
//   #55: holeQ2Stand(): { projektId: string; datei: Q2Datei } | null   // synchron, nur RAM
//   #55: interface Q2Datei { schemaVersion: number; auftraege: Auftrag[];
//                              pendingDeletions: PendingDeletion[] }
//   #55: interface PendingDeletion { dateiname: string; vermerktAm: string }
//   #55: aenderePendingDeletions(
//              projektId: string,
//              aendere: (liste: PendingDeletion[]) => PendingDeletion[],
//          ): Promise<Ergebnis<void, QueueFehlercode>>
//          // die EINZIGE Schreib-Tuer fuer pendingDeletions: wendet `aendere` nur auf diese Liste
//          // an, laesst `auftraege` unveraendert und schreibt die Datei

export async function holePendingDeletions(projektId: string): Promise<Ergebnis<PendingDeletion[], QueueFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #66."
  );
}

export async function merkePendingDeletion(projektId: string, dateiname: string): Promise<Ergebnis<void, QueueFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #66."
  );
}
// idempotent: derselbe dateiname erzeugt keinen zweiten Eintrag
// schreibt ausschliesslich ueber aenderePendingDeletions (#55)

export async function streichePendingDeletion(projektId: string, dateiname: string): Promise<Ergebnis<void, QueueFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #66."
  );
}
// IDEMPOTENT: ohne Treffer { ok: true, wert: undefined } – NICHT nicht_gefunden
// schreibt ausschliesslich ueber aenderePendingDeletions (#55)

// MAIN-INTERN: kein IPC-Kanal, keine Registrierung im ipc-gateway, kein Eintrag in kanaele.ts
