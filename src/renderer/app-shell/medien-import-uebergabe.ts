/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #204.
// [app-shell] Übergabe-Ziel Medien-Import
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
import { FORMAT_WHITELIST } from '../../shared/contracts/asset'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

/** Was der Aufruf bewirkt hat. NICHT, was aus den Aufträgen geworden ist. */
export interface ImportUebergabeErgebnis {
  /** Die Kennungen der eingereihten Aufträge, in der Reihenfolge der gewählten Pfade. */
  auftragIds: string[]
  /** Pfade, die wegen `nurTyp` übersprungen wurden – dem Nutzer zu nennen (s. ENTSCHIEDEN 2). */
  uebersprungen: string[]
  /** Pfade, deren Einreihen abgelehnt wurde, mit dem Code. Der Ablauf bricht dabei NICHT ab. */
  abgelehnt: Array<{ pfad: string; code: string; meldung: string }>
  /** true, wenn der Nutzer den Dialog abgebrochen oder nichts gewählt hat. Kein Fehler. */
  abgebrochen: boolean
}

/**
 * Öffnet den Medien-Dialog und reiht je gewähltem Pfad EINEN Import-Auftrag ein.
 * Wartet NICHT auf den Ausgang der Aufträge – der läuft über #199 zurück.
 *
 * `nurTyp`: null = beide Typen zulassen (Medien-Bibliothek). 'bild' = nur Bilder behalten
 * (Aktions-Bild); alles andere landet in `uebersprungen`. Der Dialog selbst filtert NICHT.
 */
export async function starteMedienImport(
  projektId: string,
  nurTyp: 'video' | 'bild' | null,
): Promise<Ergebnis<ImportUebergabeErgebnis, string>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #204."
  );
}

/** Ordnet einen Dateipfad anhand seiner Endung einem Medientyp zu – rein, ohne Dateisystem.
 *  Vergleich kleingeschrieben, Endung ohne führenden Punkt. null = keine bekannte Endung. */
export function typAusPfad(pfad: string): 'video' | 'bild' | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #204."
  );
}
