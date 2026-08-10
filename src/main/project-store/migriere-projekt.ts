/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #48.
// [project-store] schemaVersion-Migration für project.json
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
// GERUEST-PRUEFSUMME: 55e15c6bca7063d6
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
import type { Project } from '../../shared/contracts/project'
export type MigrationsSchritt = (
  alt: Record<string, unknown>,
) => Record<string, unknown>
// alt: das Objekt VOR diesem Schritt (Schlüssel in MIGRATIONS_KETTE = seine schemaVersion).
// Rückgabe: das Objekt NACH diesem Schritt – schemaVersion darin um GENAU 1 höher als in `alt`.
// Verbindlich für jede künftige Implementierung eines Schritts: alle aus `alt` unbekannten Felder
// werden per Spread unverändert in die Rückgabe übernommen (nie stillschweigend weglassen);
// bekannte, in der alten Fassung fehlende Felder werden auf einen dokumentierten Vorgabewert
// gesetzt (nie einfach `undefined` lassen).

export const MIGRATIONS_KETTE: ReadonlyMap<number, MigrationsSchritt> = new Map([
  // Aktuell LEER: es gibt bislang nur EINE schemaVersion. Der erste Eintrag (Schlüssel = alte
  // Version, Wert = Schritt auf Version+1) entsteht erst mit der nächsten tatsächlichen
  // Formatänderung. Die Konstante für „die aktuelle Version" ist AKTUELLE_SCHEMA_VERSION aus
  // src/shared/contracts/konstanten.ts (#21) – hier NICHT lokal neu definieren.
])

export function migriereProjekt(
  rohdaten: Record<string, unknown> & { schemaVersion: number },
  kette: ReadonlyMap<number, MigrationsSchritt> = MIGRATIONS_KETTE,
): Ergebnis<Project> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #48."
  );
}
// wendet, beginnend bei rohdaten.schemaVersion, Schritte aus `kette` an, bis das Ergebnis die
// aktuelle schemaVersion erreicht (Kettenprinzip: 1→2, 2→3, … – nie ein Sprung in einem Schritt).
// `kette` hat einen Vorgabewert (MIGRATIONS_KETTE) und wird von öffneProjekt (#34) NIE explizit
// mitgegeben; der zweite Parameter existiert ausschließlich, damit Tests eine eigene, kleine Kette
// mit Test-Schritten einspeisen können, ohne eine fachlich noch nicht existierende Migration in
// MIGRATIONS_KETTE selbst erfinden zu müssen.
