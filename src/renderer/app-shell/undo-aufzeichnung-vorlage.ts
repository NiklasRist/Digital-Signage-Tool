/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #245.
// [app-shell] Schnappschüsse im Vorlagen-Editor auslösen
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
// GERUEST-PRUEFSUMME: e02bccb67d8fa5ed
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

import type { Vorlage } from '../../shared/contracts/vorlage'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { EditorSitzung } from '../vorlagen-editor/arbeitskopie'   // NUR der Typ (import type)
import type { VorlagenUndoZugang } from './undo-vorlage'
import { merkeVorlageVorAenderung } from './undo-vorlage'
import { leereVorlagenHistorie } from './undo-historien'

/** Warum ein Schnappschuss abgelegt wurde – oder warum nicht. */
export type Vorlagenaufzeichnung =
  | 'ablegen'          // echte Aenderung an derselben Arbeitskopie -> merkeVorlageVorAenderung
  | 'sitzungsbeginn'   // vorher war keine Sitzung offen -> nichts zu sichern
  | 'sitzungswechsel'  // eine ANDERE arbeitsId zieht ein -> nichts zu sichern, Historie leeren
  | 'ohne_wirkung'     // dieselbe Arbeitskopie-Referenz -> es hat sich nichts geaendert

/**
 * Die ganze Entscheidungslogik dieses Issues – als REINE Funktion ohne Zustand, ohne Stapel und
 * ohne Sitzungshalter. Sie ist der Teil, der ohne Browser und ohne Testdoppel vollstaendig
 * pruefbar ist. Reihenfolge der Pruefungen ist Vertrag (s. „Der Ablauf").
 * Total: wirft nie.
 */
export function entscheideVorlagenAufzeichnung(
  jetzt: EditorSitzung | null,
  eingehend: EditorSitzung,
): Vorlagenaufzeichnung {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #245."
  );
}

/**
 * Der Sitzungshalter der Shell. Er ist die EINE Stelle, an der die laufende Editor-Sitzung liegt –
 * damit sie einen Reiterwechsel ueberlebt (TK 9.14.2) und damit es einen Ort gibt, an dem der
 * Schnappschuss entsteht.
 */
export interface Sitzungshalter {
  /** Die laufende Sitzung; null, wenn der Editor nicht geoeffnet ist. */
  holeSitzung: () => EditorSitzung | null
  /**
   * Eine BEARBEITUNG uebernehmen (Zone verschoben, Parameter geaendert, Zone hinzugefuegt …).
   * Legt vorher den bisherigen Stand auf die Vorlagen-Historie – das ist der Auslöser aus 9.13.2.
   */
  uebernimmAenderung: (sitzung: EditorSitzung) => void
  /**
   * Einen Stand uebernehmen, der KEINE Bearbeitung ist: den Nachhall von `sichereStand` und das
   * Ergebnis eines Rueckgaengig/Wiederherstellen. Legt NIE einen Schnappschuss ab.
   */
  uebernimmSpeicherstand: (sitzung: EditorSitzung) => void
  /**
   * Editor-Schluss: nach `uebernehmeInParent`, `alsEigenstaendige` oder `verwerfeArbeitskopie`.
   * Setzt die Sitzung auf null UND leert die Vorlagen-Historie (TK 9.13.2, s. ENTSCHIEDEN 5).
   */
  beendeSitzung: () => void
  /** Abonnement fuer Sitzungsaenderungen; Rueckgabewert ist die Abmelde-Funktion. */
  aufSitzungGeaendert: (hoerer: (sitzung: EditorSitzung | null) => void) => () => void
}

/** Der EINE Sitzungshalter des Fensters. Liefert bei jedem Aufruf DIESELBE Instanz. */
export function sitzungshalter(): Sitzungshalter {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #245."
  );
}

/**
 * Baut den Zugang, den #236 erwartet – der Setzer ist IMMER `uebernimmSpeicherstand`.
 * Das schliesst die Rueckkopplung „Rueckgaengig erzeugt einen Schnappschuss" strukturell aus.
 */
export function baueVorlagenUndoZugang(
  halter: Sitzungshalter,
  sichereStand: (
    sitzung: EditorSitzung,
    stand: Vorlage,
  ) => Promise<Ergebnis<EditorSitzung, string>>,
): VorlagenUndoZugang {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #245."
  );
}

/** NUR für Tests: ersetzt den Sitzungshalter durch einen frischen, leeren. */
export function setzeSitzungshalterZurueck(): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #245."
  );
}
