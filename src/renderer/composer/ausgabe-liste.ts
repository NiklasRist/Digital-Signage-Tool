/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #230.
// [composer] Die Ausgabe-Liste – Dateiname, Größe, Datum und Uhrzeit
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
// GERUEST-PRUEFSUMME: fed365c782f44acb
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
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import type { AusgabeDatei } from '../../shared/contracts/projekt-meta'

/**
 * Die Nutzlast von `project:listeAusgaben` (TK 9.5.2). Sie wird hier NICHT deklariert, sondern
 * aus dem GETEILTEN Vertrag (#247, `src/shared/contracts/projekt-meta.ts`) importiert und
 * UNVERAENDERT weiter-exportiert. Der Re-Export ist PFLICHT und keine Bequemlichkeit: DREI fremde
 * Stellen importieren `AusgabeDatei` aus `'./ausgabe-liste'` (#231 `render-dialog.ts`, #232
 * `export-dialog.ts` UND `export-dialog.tsx`). Ohne ihn brechen sie alle; mit ihm bleiben sie
 * Zeichen fuer Zeichen gueltig.
 * Die Feldliste steht unter „Fremde Signaturen" – schreibe sie NICHT hier ab.
 */
export type { AusgabeDatei }

/** Der gehaltene Bestand. `zustand: 'unbekannt'` heißt: es wurde noch nie erfolgreich geladen. */
export interface Ausgabenstand {
  zustand: 'unbekannt' | 'geladen'
  dateien: readonly AusgabeDatei[]
  /** Das Projekt, zu dem `dateien` gehört; null, solange nie geladen wurde. */
  projektId: string | null
  ladefehler: { code: string; meldung: string } | null
}

/** Der Ausgangswert: unbekannt, leer, ohne Projekt, ohne Fehler. */
export const LEERER_AUSGABENSTAND: Ausgabenstand = (() => {
  throw new Error(
    "Noch nicht umgesetzt - Wert gehoert zu Issue #230."
  );
})();

/** Holt den Bestand über `project:listeAusgaben` und macht ihn zum gehaltenen Stand. */
export async function ladeAusgaben(
  projektId: string,
): Promise<Ergebnis<readonly AusgabeDatei[], string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #230."
  );
}

/** Momentaufnahme des gehaltenen Standes. Der zurückgegebene Wert wird NIE verändert. */
export function holeAusgaben(): Ausgabenstand {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #230."
  );
}

/** Abonnement für Änderungen des gehaltenen Standes; Rückgabewert ist die Abmelde-Funktion. */
export function aufAusgabenGeaendert(hoerer: (stand: Ausgabenstand) => void): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #230."
  );
}

/**
 * Lädt den zuletzt geladenen Bestand erneut – die Form, die #199 als
 * `aktualisiereAusgabenListe?: () => void` erwartet. Ohne vorherigen Ladevorgang (also ohne
 * bekanntes Projekt) geschieht NICHTS (s. ENTSCHIEDEN 4).
 */
export function aktualisiereAusgaben(): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #230."
  );
}

/** Eine anzeigefertige Zeile – rein abgeleitet, ohne Zustand. */
export interface AusgabeZeile {
  dateiname: string
  groesseText: string      // z. B. "1,2 GB"
  zeitpunktText: string    // Datum UND Uhrzeit, lokale Zeitzone
}

/** Die Zeilen in der Reihenfolge, die der Main geliefert hat (s. ENTSCHIEDEN 3). */
export function baueAusgabeZeilen(dateien: readonly AusgabeDatei[]): AusgabeZeile[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #230."
  );
}

/** Bytes → lesbare Größe. Ein unbrauchbarer Wert ergibt '—', NIE 'NaN' und NIE '0 B'. */
export function formatiereDateigroesse(bytes: number): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #230."
  );
}

/** ISO-8601 UTC → Datum UND Uhrzeit in der lokalen Zeitzone.
 *  Ein unbrauchbarer Wert ergibt '—', NIE 'Invalid Date' und NIE den Rohwert. */
export function formatiereZeitpunkt(iso: string): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #230."
  );
}

/** Die Datei mit genau diesem Namen aus dem gehaltenen Stand; null, wenn es sie nicht gibt.
 *  Von #231 gebraucht, um vor dem Überschreiben das Datum der vorhandenen Fassung zu nennen. */
export function findeAusgabe(dateiname: string): AusgabeDatei | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #230."
  );
}
