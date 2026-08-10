/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #234.
// [app-shell] Zwei getrennte Undo-Historien, die ein Reiterwechsel nicht vermischt
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
// GERUEST-PRUEFSUMME: bdc18f180323cf82
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

import type { Bearbeitungsstand } from '../../shared/contracts/project'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { ReiterId } from './reiter'
import { erzeugeUndoStapel, type UndoStapel } from './undo-stapel'

/**
 * Ein Schnappschuss der Projekt-Bearbeitung – MIT der Kennung des Projekts, zu dem er gehört.
 * Der `Bearbeitungsstand` des geteilten Vertrags trägt sie nicht (er wird auf das GELADENE
 * Projekt angewendet); ohne sie wäre nicht feststellbar, ob ein Stand zum offenen Projekt passt.
 */
export interface ProjektStand {
  projektId: string
  stand: Bearbeitungsstand
}

/** Die beiden Historien-Bereiche aus TK 9.13.2. */
export type Historienbereich = 'projekt-bearbeitung' | 'vorlagen-editor'

/**
 * Welcher Bereich im gegebenen Reiter gilt – REINE Funktion, ohne Zugriff auf den Reiter-Zustand.
 * `null` = in diesem Reiter gibt es kein Rückgängig.
 */
export function bereichFuerReiter(reiter: ReiterId): Historienbereich | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #234."
  );
}

/** Die EINE Historie der Projekt-Bearbeitung (composer + action-editor). */
export function projektHistorie(): UndoStapel<ProjektStand> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #234."
  );
}

/** Die EINE Historie des Vorlagen-Editors. Schnappschuss ist die vollständige Arbeitskopie. */
export function vorlagenHistorie(): UndoStapel<Vorlage> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #234."
  );
}

/** Leert die Historie der Projekt-Bearbeitung (TK 9.13.3; außerdem bei Projektwechsel, 9.13.2). */
export function leereProjektHistorie(): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #234."
  );
}

/** Leert die Historie des Vorlagen-Editors (Editor-Schluss, TK 9.13.2). */
export function leereVorlagenHistorie(): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #234."
  );
}

/** NUR für Tests: ersetzt beide Historien durch frische, leere Stapel. */
export function setzeHistorienZurueck(): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #234."
  );
}
