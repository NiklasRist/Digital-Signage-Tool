// GENERIERT aus dem Signaturblock von Issue #57.
// [auftrags-manager] Q4-Warteschlangenjournal rotierend führen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { JournalEintrag } from '../../shared/contracts/protokoll'
import type { QueueFehlercode } from './schreibe-queue-json'   // = 'speicher_fehler' (#69)

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #69: leseQueueDatei<T>(pfad: string, fallback: T): Promise<Ergebnis<T, QueueFehlercode>>
//   #69: schreibeQueueDatei(pfad: string, inhalt: unknown): Promise<Ergebnis<void, QueueFehlercode>>
//   #69: const QUEUE_SCHEMA_VERSION = 1   // gilt fuer Q2, Q3 und Q4 – KEINE eigene Zahl erfinden
//   #5:    ermittleDatenOrt(): string       // app-weiter Datenort der portablen App

const MAX_JOURNAL_EINTRAEGE = 1000   // modul-lokale Konstante, NICHT in die projektweiten
                                     // Konstanten (#21) auslagern – das waere eine fremde Datei

export async function haengeJournalEintragAn(eintrag: JournalEintrag): Promise<Ergebnis<void, QueueFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #57."
  );
}
// Dateiform: { schemaVersion: number; eintraege: JournalEintrag[] }
//            schemaVersion beim Schreiben IMMER QUEUE_SCHEMA_VERSION aus #69
// Ablauf: Datei lesen -> eintrag ans Ende haengen -> auf die letzten MAX_JOURNAL_EINTRAEGE
//         kuerzen (aelteste fallen weg) -> Datei komplett neu schreiben ueber #69.
//         Defekte (nicht parsebare) Datei: mit leerer Liste NEU beginnen und den Vorgang
//         vermerken – Ausnahme NUR fuer Q4, s. Invarianten.
// Ort: <Datenort>/warteschlangen-journal.json, Datenort ueber ermittleDatenOrt() (#5).
