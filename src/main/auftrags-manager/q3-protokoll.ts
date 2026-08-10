// GENERIERT aus dem Signaturblock von Issue #56.
// [auftrags-manager] Q3-Ausführungsprotokoll anhängen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProtokollEintrag } from '../../shared/contracts/protokoll'
import type { QueueFehlercode } from './schreibe-queue-json'   // = 'speicher_fehler' (#69)

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #69: leseQueueDatei<T>(pfad: string, fallback: T): Promise<Ergebnis<T, QueueFehlercode>>
//   #69: schreibeQueueDatei(pfad: string, inhalt: unknown): Promise<Ergebnis<void, QueueFehlercode>>
//   #69: const QUEUE_SCHEMA_VERSION = 1   // gilt fuer Q2, Q3 und Q4 – KEINE eigene Zahl erfinden
//   #5:    ermittleDatenOrt(): string       // app-weiter Datenort der portablen App

export async function haengeProtokollEintragAn(eintrag: ProtokollEintrag): Promise<Ergebnis<void, QueueFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #56."
  );
}
// Dateiform: { schemaVersion: number; eintraege: ProtokollEintrag[] }
//            schemaVersion beim Schreiben IMMER QUEUE_SCHEMA_VERSION aus #69
// Ablauf: Datei lesen -> eintrag ans Ende von eintraege haengen -> Datei KOMPLETT neu schreiben,
//         atomar ueber schreibeQueueDatei (#69). Kein zeilenweises Anhaengen.
// Ort: <Datenort>/protokoll.json, Datenort ueber ermittleDatenOrt() (#5).
