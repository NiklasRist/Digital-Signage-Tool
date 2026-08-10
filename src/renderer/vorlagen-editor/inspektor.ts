/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #145.
// [vorlagen-editor] Der Zahlen-Inspektor für exakte Rahmenwerte
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
import type { Zone } from '../../shared/contracts/vorlage'
import {
  begrenzeAufFlaeche,
  MINDEST_ZONEN_KANTE_PX,
  type Flaeche,
} from './zonen-canvas'

/** Die vier bearbeitbaren Rahmenwerte. Achtung: `höhe` MIT Umlaut (so heisst das Feld in #95). */
export type RahmenFeld = 'x' | 'y' | 'breite' | 'höhe'

/**
 * Übernimmt eine getippte Zahl in genau ein Rahmenfeld.
 * Rastet NICHT ein – der eingegebene Wert wird nur auf die Fläche begrenzt.
 * Liefert eine NEUE Zone; die übergebene bleibt unverändert.
 */
export function setzeRahmenWert(
  zone: Zone,
  feld: RahmenFeld,
  eingabe: string,
  flaeche: Flaeche,
): Ergebnis<Zone> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #145."
  );
}
