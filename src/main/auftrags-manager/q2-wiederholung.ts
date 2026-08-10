// GENERIERT aus dem Signaturblock von Issue #55.
// [auftrags-manager] Q2-Wiederholungsspeicher je Projekt führen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Auftrag } from '../../shared/contracts/auftrag'
import type { QueueFehlercode } from './schreibe-queue-json'   // = 'speicher_fehler' (#69)

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #69: leseQueueDatei<T>(pfad: string, fallback: T): Promise<Ergebnis<T, QueueFehlercode>>
//   #69: schreibeQueueDatei(pfad: string, inhalt: unknown): Promise<Ergebnis<void, QueueFehlercode>>
//   #69: const QUEUE_SCHEMA_VERSION = 1   // gilt fuer Q2, Q3 und Q4 – KEINE eigene Zahl erfinden
//   #49:   projektOrdner(projektId: string): string   // reine Berechnung, kann nicht fehlschlagen
// Dateipfad (verbindlich): path.join(projektOrdner(projektId), 'queue-retry.json')

export interface PendingDeletion {
  dateiname: string        // <uuid>.<ext>, OHNE Verzeichnisanteil (TK 9.4.8 Punkt 1)
  vermerktAm: string       // ISO-8601 UTC
}

export interface Q2Datei {
  schemaVersion: number    // beim Schreiben IMMER QUEUE_SCHEMA_VERSION aus #69
  auftraege: Auftrag[]
  pendingDeletions: PendingDeletion[]
}

export async function ladeQ2(projektId: string): Promise<Ergebnis<Q2Datei, QueueFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #55."
  );
}
// fehlende Datei -> leere, gueltige Q2Datei (Erstbenutzung ist kein Fehler)
// fuellt ausserdem den modul-internen Stand, den holeQ2Stand() zurueckgibt

// synchron, nur RAM
export function holeQ2Stand(): { projektId: string; datei: Q2Datei } | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #55."
  );
}
// liefert den zuletzt per ladeQ2 geladenen Stand OHNE Dateizugriff;
// null, solange in dieser Sitzung noch kein Projekt geladen wurde

export async function merkeFehlschlag(projektId: string, auftrag: Auftrag): Promise<Ergebnis<void, QueueFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #55."
  );
}
// legt den Eintrag an ODER aktualisiert den bestehenden mit gleicher auftragId – nie ein Duplikat
// aendert ERST den Stand im Speicher, DANN die Datei

export async function streicheAusQ2(projektId: string, auftragId: string): Promise<Ergebnis<void, QueueFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #55."
  );
}
// entfernt den Eintrag; pendingDeletions bleiben davon unberuehrt
// IDEMPOTENT: ohne Treffer { ok: true, wert: undefined } – NICHT nicht_gefunden
// aendert ERST den Stand im Speicher, DANN die Datei

export async function aenderePendingDeletions(
  projektId: string,
  aendere: (liste: PendingDeletion[]) => PendingDeletion[],
): Promise<Ergebnis<void, QueueFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #55."
  );
}
// die EINZIGE Schreib-Tuer fuer pendingDeletions – #66 benutzt ausschliesslich diese Funktion
// liest den gehaltenen Stand, wendet `aendere` NUR auf die Liste pendingDeletions an,
// laesst `auftraege` unveraendert, aktualisiert den Stand im Speicher und schreibt die Datei
// ueber den gemeinsamen Baustein (#69)
// aendert ERST den Stand im Speicher, DANN die Datei
