/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #155.
// [vorlagen-editor] Vorlagen-Übersicht
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
import type { Vorlage, VorlagenArt, Vorlagennutzung } from '../../shared/contracts/vorlage'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { starteBearbeitung, type EditorSitzung } from './arbeitskopie'
import {
  holeNutzung, LEERER_NUTZUNGSSTAND, beginneLaden, uebernimmNutzung, uebernimmFehler, giltFuer,
  type Nutzungsstand,
} from './nutzung-anzeigen'

/** Eine nutzbare Vorlage mit allem, was die Übersicht über sie anzeigt. */
export interface UebersichtsEintrag {
  vorlage: Vorlage                  // parent === null
  eingebaut: boolean                // === vorlage.eingebaut; eingebaute sind unlöschbar
  arbeitskopieId: string | null     // id der laufenden Arbeitskopie, sonst null
  loeschbar: boolean                // === !vorlage.eingebaut
}

export interface VorlagenUebersicht {
  nutzbare: readonly UebersichtsEintrag[]
  /** Arbeitskopien, deren `parent` auf keine nutzbare Vorlage zeigt (s. „ENTSCHIEDEN" 5). */
  verwaisteArbeitskopien: readonly Vorlage[]
}

/** Die Kombinationen aus `art` und `höhe`, die der Main heute anlegen kann (s. STOPP). */
export const ANLEGBARE_ARTEN: ReadonlyArray<{ art: VorlagenArt; höhe: number | null }> = (() => {
  throw new Error(
    "Noch nicht umgesetzt - Wert gehoert zu Issue #155."
  );
})();

/** Lädt beide Listen und macht sie zur gemeinsamen Vorlagen-Sicht. */
export async function ladeUebersicht(): Promise<Ergebnis<VorlagenUebersicht, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #155."
  );
}

/** Momentaufnahme der Sicht; null, solange nie geladen wurde. Wird NIE verändert. */
export function holeUebersicht(): VorlagenUebersicht | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #155."
  );
}

/** Abonnement für Änderungen der Sicht; Rückgabewert ist die Abmelde-Funktion. */
export function aufUebersichtGeaendert(hoerer: (u: VorlagenUebersicht) => void): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #155."
  );
}

/** „Neu anlegen": erstellt die Vorlage und öffnet sie sofort zur Bearbeitung. */
export async function legeVorlageAn(
  art: VorlagenArt,
  höhe: number | null,
  name: string,
): Promise<Ergebnis<EditorSitzung, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #155."
  );
}

/** „Bearbeiten": öffnet eine NUTZBARE Vorlage (parent === null). */
export async function bearbeiteVorlage(
  vorlagenId: string,
): Promise<Ergebnis<EditorSitzung, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #155."
  );
}

/** „Fortsetzen": setzt die Bearbeitung über den PARENT der Arbeitskopie fort. */
export async function setzeBearbeitungFort(
  arbeitskopie: Vorlage,
): Promise<Ergebnis<EditorSitzung, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #155."
  );
}

/**
 * „Löschen", SCHRITT 1 (TK 9.12.2): holt die Nutzung der Vorlage ueber `holeNutzung` (M7-62) und
 * legt sie im Loesch-Nutzungsstand ab, DAMIT die Oberflaeche sie anzeigt, BEVOR geloescht wird.
 * REIN LESEND: es wird NICHTS geloescht, NICHTS geaendert, KEIN Auftrag eingereiht.
 * Total: wirft nie; ein Fehler landet als `zustand: 'fehler'` im Stand (s. ENTSCHIEDEN 8).
 */
export async function starteLoeschbestaetigung(vorlagenId: string): Promise<void> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #155."
  );
}

/** Momentaufnahme des Loesch-Nutzungsstandes. Der zurueckgegebene Wert wird NIE veraendert. */
export function holeLoeschNutzung(): Nutzungsstand {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #155."
  );
}

/** Abonnement fuer Aenderungen des Loesch-Nutzungsstandes; Rueckgabe ist die Abmelde-Funktion. */
export function aufLoeschNutzungGeaendert(hoerer: (stand: Nutzungsstand) => void): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #155."
  );
}

/**
 * Beendet die Loesch-Bestaetigung – bei Abbruch WIE nach dem Loeschen. Setzt den Stand auf
 * `LEERER_NUTZUNGSSTAND` zurueck. Ohne laufende Bestaetigung wirkungslos; wirft nie.
 */
export function beendeLoeschbestaetigung(): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #155."
  );
}

/**
 * „Löschen", SCHRITT 2: nur für eigene Vorlagen. Scheitert die Löschung an Referenzen, trägt der
 * Fehler unter `daten` die vollständige `Vorlagennutzung` – die Oberfläche zeigt beide
 * Trefferlisten. Diese Funktion holt die Nutzung NICHT selbst (das tut Schritt 1) und prüft NICHT,
 * ob Schritt 1 gelaufen ist (s. ENTSCHIEDEN 8).
 */
export async function entferneVorlage(
  vorlagenId: string,
): Promise<Ergebnis<void, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #155."
  );
}
