// GENERIERT aus dem Signaturblock von Issue #222.
// [projekt-verwaltung] Die Projektliste laden, halten und anzeigen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import type { ProjektMeta } from '../../shared/contracts/projekt-meta'

/**
 * Die Nutzlast von `project:listeProjekte` (TK 9.5.2). Sie wird hier NICHT deklariert, sondern
 * aus dem GETEILTEN Vertrag (#247, `src/shared/contracts/projekt-meta.ts`) importiert und
 * UNVERAENDERT weiter-exportiert. Der Re-Export ist PFLICHT und keine Bequemlichkeit: SECHS
 * fremde Stellen importieren `ProjektMeta` aus `'./liste'` (#223 zweimal, #225, #226 zweimal,
 * #252). Ohne ihn brechen sie alle; mit ihm bleiben sie Zeichen fuer Zeichen gueltig.
 * Die Feldliste steht unter „Fremde Signaturen" – schreibe sie NICHT hier ab.
 */
export type { ProjektMeta }

/** Der gehaltene Bestand. `zustand: 'unbekannt'` heißt: es wurde noch nie erfolgreich geladen. */
export interface Projektliste {
  zustand: 'unbekannt' | 'geladen'
  eintraege: readonly ProjektMeta[]
  ladefehler: { code: string; meldung: string } | null
}

/** Der Ausgangswert: unbekannt, leer, ohne Fehler. */
export const LEERE_PROJEKTLISTE: Projektliste = (() => {
  throw new Error(
    "Noch nicht umgesetzt - Wert gehoert zu Issue #222."
  );
})();

/** Holt den Bestand über `project:listeProjekte` und macht ihn zum gehaltenen Stand. */
export async function ladeProjektliste(): Promise<Ergebnis<readonly ProjektMeta[], string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #222."
  );
}

/** Momentaufnahme des gehaltenen Standes. Der zurückgegebene Wert wird NIE verändert. */
export function holeProjektliste(): Projektliste {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #222."
  );
}

/** Abonnement für Änderungen des gehaltenen Standes; Rückgabewert ist die Abmelde-Funktion. */
export function aufProjektlisteGeaendert(hoerer: (liste: Projektliste) => void): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #222."
  );
}

/** Der Eintrag mit dieser Kennung aus dem gehaltenen Stand; null, wenn es ihn nicht gibt. */
export function findeProjekt(id: string): ProjektMeta | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #222."
  );
}

/** Eine anzeigefertige Zeile – rein abgeleitet, ohne Zustand. */
export interface ListenZeile {
  id: string
  bezeichnung: string        // = meta.name (bei beschaedigt: true ist das der Ordnername)
  erstelltAmText: string
  geaendertAmText: string
  ordner: string             // relativer Ordnername – NIE ein absoluter Pfad
  beschaedigt: boolean
  oeffnenErlaubt: boolean    // === !beschaedigt
}

/** Die anzeigbaren Zeilen, in der Reihenfolge, die der Main geliefert hat (s. ENTSCHIEDEN 4). */
export function baueListenZeilen(eintraege: readonly ProjektMeta[]): ListenZeile[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #222."
  );
}

/** ISO-8601 UTC → lesbarer Zeitpunkt in der lokalen Zeitzone (Datum UND Uhrzeit).
 *  Ein unbrauchbarer Wert ergibt den Ersatztext '—', NIE 'Invalid Date' und NIE den Rohwert. */
export function formatiereZeitpunkt(iso: string): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #222."
  );
}
