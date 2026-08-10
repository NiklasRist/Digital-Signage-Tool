/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #243.
// [app-shell] Schnappschüsse auslösen – die gemeinsame Projekt-Sicht umhüllen
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

import type { Project, Listenelement, Bearbeitungsstand } from '../../shared/contracts/project'
import type { ProjektZugang } from './sichten'
import type { ProjektUndoZugang } from './undo-projekt'
import { merkeVorAenderung } from './undo-projekt'
import { projektHistorie, type ProjektStand } from './undo-historien'

/** Warum die Huelle einen Schnappschuss abgelegt hat – oder warum nicht. */
export type Aufzeichnungsentscheidung =
  | 'ablegen'         // echte Aenderung -> merkeVorAenderung
  | 'ohne_wirkung'    // der eingehende Stand ist der jetzige -> nichts zu sichern
  | 'ruecknahme'      // Regel R1: der eingehende Stand IST der oberste Schnappschuss
  | 'doppelt'         // Regel R2: der jetzige Stand steht bereits oben auf dem Stapel
  | 'projektwechsel'  // ein ANDERES Projekt zieht ein -> nichts zu sichern

/**
 * Flache Referenzgleichheit beider Arrays: gleiche Laenge und Element fuer Element `===`.
 * KEIN tiefer Vergleich, KEIN JSON, KEIN structuredClone.
 * Total: wirft nie.
 */
export function standGleich(a: Bearbeitungsstand, b: Bearbeitungsstand): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #243."
  );
}

/**
 * Die ganze Entscheidungslogik dieses Issues – als REINE Funktion ohne Zustand, ohne Stapel und
 * ohne Sicht. Sie ist der Teil, der ohne Browser und ohne Testdoppel vollstaendig pruefbar ist.
 * Reihenfolge der Pruefungen ist Vertrag (s. „Der Ablauf").
 * Total: wirft nie.
 */
export function entscheideAufzeichnung(
  jetzt: ProjektStand,
  eingehend: ProjektStand,
  oberster: ProjektStand | null,
): Aufzeichnungsentscheidung {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #243."
  );
}

/**
 * Umhuellt den Zugang aus #197 fuer die BEARBEITENDEN Module (composer, action-editor).
 * Liefert ein NEUES Objekt; der uebergebene Zugang bleibt unveraendert und weiterhin nutzbar.
 * Mehrfaches Umhuellen desselben Zugangs liefert denselben Huellen-Zugang (s. ENTSCHIEDEN 7).
 */
export function umhuelleFuerBearbeitung(zugang: ProjektZugang): ProjektZugang {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #243."
  );
}

/**
 * Liefert den ROHEN Zugang zu einer Huelle. Ist `zugang` nicht umhuellt, liefert er ihn selbst.
 * Fuer alle Aufrufer, die die Sicht setzen, ohne dass ein Schnappschuss entstehen darf.
 */
export function ohneAufzeichnung(zugang: ProjektZugang): ProjektZugang {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #243."
  );
}

/**
 * Baut den Zugang, den #235 (Rueckgaengig/Wiederherstellen) erwartet – IMMER aus dem rohen
 * Zugang, auch wenn eine Huelle uebergeben wird. Das schliesst die Rueckkopplung
 * „Rueckgaengig erzeugt einen Schnappschuss" strukturell aus (s. ENTSCHIEDEN 3).
 */
export function baueUndoZugang(zugang: ProjektZugang): ProjektUndoZugang {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #243."
  );
}
