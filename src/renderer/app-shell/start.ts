/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #196.
// [app-shell] Start-Ablauf: die Sitzung wiederherstellen
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

import type { Project } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import {
  type ReiterId,
  istGueltigerReiter,
  wechsleReiter,
  aufReiterGeaendert,
  START_REITER_OHNE_PROJEKT,
  REITER_NACH_PROJEKT_OEFFNEN,
} from './reiter'

/** Der Schlüssel, unter dem der zuletzt aktive Reiter in AppKonfig.uiVoreinstellungen liegt. */
export const UI_SCHLUESSEL_REITER = 'app-shell.aktiverReiter'

/** Der Schlüssel, unter dem der Klappzustand der Warteschlangen-Leiste liegt. */
export const UI_SCHLUESSEL_QUEUE_AUFGEKLAPPT = 'queue-panel.aufgeklappt'

/** Warum kein Projekt wiederhergestellt wurde. Wird der Oberfläche gezeigt, nicht verschluckt. */
export type StartHinweis =
  | { art: 'kein_aktives_projekt' }                              // Erststart oder nie eines geöffnet
  | { art: 'konfig_unlesbar';  code: string; meldung: string }   // leseKonfig hat abgelehnt
  | { art: 'projekt_unlesbar'; projektId: string; code: string; meldung: string }

export type StartErgebnis =
  | { art: 'projekt-geladen'; projekt: Project; reiter: ReiterId }
  | { art: 'kein-projekt';    reiter: 'projekte'; hinweis: StartHinweis }

/**
 * Führt den Start-Ablauf EINMAL aus und setzt dabei den aktiven Reiter (über wechsleReiter).
 * Wirft NIE. Jeder Fehler wird zu `kein-projekt` mit benanntem Hinweis.
 */
export async function starteSitzung(): Promise<StartErgebnis> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #196."
  );
}

/**
 * Merkt den aktiven Reiter über den Neustart hinweg: abonniert Reiterwechsel und schreibt den
 * neuen Wert als UI-Voreinstellung. Rückgabewert ist die Abmelde-Funktion.
 * DIESE Datei ist die EINZIGE Stelle der Shell, die eine UI-Voreinstellung schreibt.
 */
export function merkeAktivenReiter(): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #196."
  );
}

/**
 * Liest den gemerkten Klappzustand der Warteschlangen-Leiste. Wirft NIE.
 * Fehlt der Wert, ist er kein `boolean` oder scheitert das Lesen, lautet die Antwort `false`
 * (eingeklappt) – s. ENTSCHIEDEN 7.
 */
export async function leseQueueAufgeklappt(): Promise<boolean> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #196."
  );
}

/**
 * Merkt den Klappzustand über den Neustart hinweg. Wirft NIE und liefert nichts zurück:
 * Ein gescheitertes Schreiben kostet eine Bequemlichkeit, keine Arbeit – das Ergebnis wird
 * trotzdem ausgewertet und intern vermerkt (kein unbehandeltes Promise).
 */
export function merkeQueueAufgeklappt(aufgeklappt: boolean): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #196."
  );
}
