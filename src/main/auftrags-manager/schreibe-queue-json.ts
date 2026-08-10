// GENERIERT aus dem Signaturblock von Issue #69.
// [auftrags-manager] Queue-Dateien atomar und serialisiert lesen und schreiben
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'

// Die modul-eigene Fehlercode-Union der Auftragsverwaltungs-Speicher. #12 liefert NUR die drei
// generischen Codes (ungueltige_eingabe, nicht_gefunden, unbekannter_fehler); #22 fuegt Ergebnis
// den zweiten Typparameter F hinzu, ueber den jedes Modul seine EIGENE Union in seiner EIGENEN
// Datei einhaengt. speicher_fehler steht deshalb HIER und nicht in einem geteilten Typ;
// src/shared/contracts/ergebnis.ts wird dafuer NICHT angefasst (fremde Datei, Regel E).
export type QueueFehlercode = 'speicher_fehler'

// Schema-Version ALLER Queue-Dateien (Q2, Q3, Q4). Modul-lokal und hier deklariert, damit die
// drei Speicher nicht je eine eigene Zahl erfinden. NICHT die AKTUELLE_SCHEMA_VERSION aus #21
// verwenden – die gehoert zu project.json/config.json, eine Kopplung an D1-Migrationen ist
// unerwuenscht.
export const QUEUE_SCHEMA_VERSION = 1

export async function leseQueueDatei<T>(pfad: string, fallback: T): Promise<Ergebnis<T, QueueFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #69."
  );
}
// pfad existiert nicht        -> { ok: true, wert: fallback }
// pfad existiert und ist gueltiges JSON -> { ok: true, wert: <geparster Inhalt> }
// pfad existiert, ist NICHT parsebar, <pfad>.bak ist parsebar
//                             -> { ok: true, wert: <geparster Inhalt von <pfad>.bak> }
// pfad NICHT parsebar UND <pfad>.bak fehlt oder ist ebenfalls NICHT parsebar
//                             -> { ok: false, fehler: { code: 'speicher_fehler', … } }

export async function schreibeQueueDatei(pfad: string, inhalt: unknown): Promise<Ergebnis<void, QueueFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #69."
  );
}
// 1. bestehende Datei (falls vorhanden) nach <pfad>.bak kopieren (fs.copyFile, kein Verschieben)
// 2. inhalt als JSON nach <pfad>.tmp schreiben
// 3. <pfad>.tmp durch Rename-mit-Ersetzen auf <pfad> bringen (gleiche Partition)
// Schreibvorgaenge auf DENSELBEN pfad laufen streng nacheinander (verkettete Promise je Pfad);
// Schreibvorgaenge auf VERSCHIEDENE Pfade laufen unabhaengig und blockieren einander nicht.
