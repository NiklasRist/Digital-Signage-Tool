/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #137.
// [action-editor] Vorlage zuweisen – nur nutzbare Vollflächen-Vorlagen
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
// GERUEST-PRUEFSUMME: dc37b31a56a1eaa3
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
import type { Vorlage } from '../../shared/contracts/vorlage'

/** Ist diese Vorlage im action-editor auswählbar? Nutzbar (parent === null) UND vollflächig. */
export function istWaehlbar(vorlage: Vorlage): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #137."
  );
}

/** Holt die nutzbaren Vorlagen vom vorlagen-store und behält nur die auswählbaren.
 *  Die Reihenfolge des Bestands bleibt erhalten.
 *  Fehlercode-Parameter ist `string` – Begründung unter „ENTSCHIEDEN" unmittelbar darunter. */
export async function ladeWaehlbareVorlagen(): Promise<Ergebnis<Vorlage[], string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #137."
  );
}

/** Die aktuell zugewiesene Vorlage einer Aktion in der Auswahlliste finden.
 *  null = die `vorlagenId` der Aktion ist nicht (mehr) auswählbar; die Oberfläche zeigt dann
 *  „unbekannte Vorlage" und verlangt eine bewusste Neuwahl. */
export function findeZugewiesene(vorlagenId: string, waehlbare: Vorlage[]): Vorlage | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #137."
  );
}
