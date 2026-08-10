/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #254.
// [vorlagen-editor] Die Nutzung einer Vorlage anzeigen
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
// GERUEST-PRUEFSUMME: f94d2e5af43b8f9a
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
import type { Vorlagennutzung, VorlagenReferenz } from '../../shared/contracts/vorlage'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

/** Beide Listen leer. NUR als Vergleichswert – NIE als Ersatz fuer ein fehlendes Ergebnis. */
export const LEERE_NUTZUNG: Vorlagennutzung = (() => {
  throw new Error(
    "Noch nicht umgesetzt - Wert gehoert zu Issue #254."
  );
})();

/**
 * Holt die Nutzung ueber `vorlagen:pruefeVorlagenReferenzen` (TK 9.12.1).
 * REIN LESEND: kein Lock, kein Auftrag, keine Wirkung. Eine leere Nutzung ist ein GUELTIGES
 * Ergebnis (`ok: true`), kein Fehler.
 * Das Ergebnis des Main wird UNVERAENDERT durchgereicht – kein Auspacken, kein Ersetzen eines
 * Fehlercodes, kein Umwandeln in einen Wurf.
 *
 * NUTZLAST (verbindlich): `rufeAuf(KANAELE.vorlagen.pruefeVorlagenReferenzen, { vorlagenId })` –
 * ein OBJEKT mit dem Feld `vorlagenId: string`, NICHT `{ id }` und NICHT der blosse String.
 * Begruendung und Melde-Klausel stehen unmittelbar unter diesem Block.
 */
export async function holeNutzung(
  vorlagenId: string,
): Promise<Ergebnis<Vorlagennutzung, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #254."
  );
}

/**
 * Liest eine `Vorlagennutzung` aus einem `fehler.daten`-Feld heraus (Code
 * `vorlage_referenziert`, TK 9.1.1/9.12.1). Passt die Form nicht, ist das Ergebnis `null` –
 * NIE ein Wurf und NIE eine erfundene leere Nutzung (s. ENTSCHIEDEN 4).
 */
export function leseVorlagennutzung(daten: unknown): Vorlagennutzung | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #254."
  );
}

/** Alle Treffer EINES Projekts, zusammengefasst fuer die aufklappbare Liste. */
export interface NutzungsGruppe {
  projektId: string
  /** `VorlagenReferenz.projektName` des ersten Treffers dieses Projekts. */
  projektName: string
  aktionen: readonly VorlagenReferenz[]
  listenelemente: readonly VorlagenReferenz[]
}

/** Die fertige Anzeige – rein abgeleitet, ohne Zustand. */
export interface NutzungsAnzeige {
  /** true NUR, wenn BEIDE Listen leer sind. Aus einer GELADENEN Nutzung, nie aus `null`. */
  frei: boolean
  anzahlAktionen: number
  anzahlListenelemente: number
  /** Verschiedene `projektId` ueber BEIDE Listen zusammen. */
  anzahlProjekte: number
  /** Der eine Satz: „wird von 7 Aktionen in 2 Projekten verwendet". */
  text: string
  /** Die Trefferliste, nach Projekt gruppiert. Leer, wenn `frei`. */
  gruppen: readonly NutzungsGruppe[]
}
export function baueNutzungsAnzeige(nutzung: Vorlagennutzung): NutzungsAnzeige {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #254."
  );
}

/** Verschiedene Projekte ueber BEIDE Listen. Rein; wirft nie. */
export function zaehleProjekte(nutzung: Vorlagennutzung): number {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #254."
  );
}

/** Der gehaltene Stand. `'unbekannt'` heisst NICHT `frei` (s. oben). */
export interface Nutzungsstand {
  zustand: 'unbekannt' | 'laedt' | 'geladen' | 'fehler'
  /** Die Vorlage, auf die sich der Stand bezieht; null, solange nie geladen wurde. */
  vorlagenId: string | null
  /** NUR bei `zustand: 'geladen'` gesetzt. */
  nutzung: Vorlagennutzung | null
  /** NUR bei `zustand: 'fehler'` gesetzt. */
  fehler: { code: string; meldung: string } | null
}

/** Unbekannt, ohne Vorlage, ohne Nutzung, ohne Fehler. */
export const LEERER_NUTZUNGSSTAND: Nutzungsstand = (() => {
  throw new Error(
    "Noch nicht umgesetzt - Wert gehoert zu Issue #254."
  );
})();

/** Jede dieser Funktionen liefert einen NEUEN Stand; der uebergebene bleibt unveraendert.
 *  Alle sind total: sie werfen nie. */
export function beginneLaden(stand: Nutzungsstand, vorlagenId: string): Nutzungsstand {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #254."
  );
}
export function uebernimmNutzung(
  stand: Nutzungsstand,
  vorlagenId: string,
  nutzung: Vorlagennutzung,
): Nutzungsstand {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #254."
  );
}
export function uebernimmFehler(
  stand: Nutzungsstand,
  vorlagenId: string,
  code: string,
  meldung: string,
): Nutzungsstand {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #254."
  );
}

/**
 * Gilt der Stand fuer DIESE Vorlage? false, sobald `vorlagenId` abweicht – ein Stand einer
 * anderen Vorlage darf NIE als Auskunft ueber diese durchgehen (s. ENTSCHIEDEN 5).
 */
export function giltFuer(stand: Nutzungsstand, vorlagenId: string): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #254."
  );
}
