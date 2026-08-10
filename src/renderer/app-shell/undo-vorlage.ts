/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #236.
// [app-shell] Rückgängig und Wiederherstellen im Vorlagen-Editor anwenden
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
// GERUEST-PRUEFSUMME: d9b156bb9b807e69
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
import { vorlagenHistorie, leereVorlagenHistorie } from './undo-historien'

/**
 * Der Zugang zur laufenden Editor-Sitzung. Wird als PARAMETER übergeben (Entscheidung E1,
 * #197) – diese Datei ruft NICHTS aus `vorlagen-editor` auf und kennt keinen Kanalnamen.
 */
export interface VorlagenUndoZugang {
  /** Die laufende Editor-Sitzung; null, wenn der Editor nicht geöffnet ist. */
  holeSitzung: () => EditorSitzung | null
  /** Ersetzt die laufende Sitzung durch den vom Store zurückgegebenen Stand. */
  setzeSitzung: (sitzung: EditorSitzung) => void
  /** Der EINE Speicherweg des Editors (#149/#143 `sichereStand`), der hinter
   *  `vorlagen:speichereArbeitskopie` (#102) sitzt. */
  sichereStand: (
    sitzung: EditorSitzung,
    stand: Vorlage,
  ) => Promise<Ergebnis<EditorSitzung, string>>
}

/** Was ein Rückgängig/Wiederherstellen bewirkt hat. */
export type UndoWirkungVorlage =
  | { art: 'nichts_zu_tun' }
  | { art: 'angewendet'; sitzung: EditorSitzung }

/**
 * Legt den JETZIGEN Stand der Arbeitskopie als Schnappschuss ab.
 * VOR jeder Zonen- oder Parameter-Änderung aufzurufen (TK 9.13.2).
 * Ohne offene Sitzung geschieht nichts.
 */
export function merkeVorlageVorAenderung(zugang: VorlagenUndoZugang): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #236."
  );
}

/** Ob ein Rückgängig gerade angeboten werden darf (Stand vorhanden UND zur offenen Arbeitskopie). */
export function kannVorlageRueckgaengig(zugang: VorlagenUndoZugang): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #236."
  );
}

/** Gegenstück für das Wiederherstellen. */
export function kannVorlageWiederherstellen(zugang: VorlagenUndoZugang): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #236."
  );
}

/** Schreibt den vorherigen Schnappschuss über den Speicherweg des Editors zurück. */
export async function macheVorlageRueckgaengig(
  zugang: VorlagenUndoZugang,
): Promise<Ergebnis<UndoWirkungVorlage, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #236."
  );
}

/** Schreibt den zuvor zurückgenommenen Schnappschuss wieder vor. */
export async function stelleVorlageWiederHer(
  zugang: VorlagenUndoZugang,
): Promise<Ergebnis<UndoWirkungVorlage, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #236."
  );
}
