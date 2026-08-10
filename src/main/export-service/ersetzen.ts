/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #187.
// [export-service] Atomar ersetzen: Rename-mit-Ersetzen mit Retry und Backoff
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
import type { ExportFehlercode } from './fehlercodes'

/** Anzahl der Umbenennungs-Versuche insgesamt (erster Versuch eingeschlossen). */
export const ERSETZEN_VERSUCHE = 5
/** Wartezeiten in Millisekunden VOR dem 2., 3., 4. und 5. Versuch. */
export const ERSETZEN_BACKOFF_MS = [100, 200, 400, 800] as const

export async function ersetzeAtomar(
  partPfad: string,   // absolut, die fertig kopierte und gesyncte Arbeitsdatei (#186)
  zielPfad: string,   // absolut, der endgültige Name: <zielOrdner>/<dateiname>
): Promise<Ergebnis<void, ExportFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #187."
  );
}
// - EIN Aufruf von fs.promises.rename(partPfad, zielPfad) je Versuch – mehr nicht
// - die vorhandene Zieldatei wird NIE vorher gelöscht, geleert oder umbenannt
// - nur EBUSY/EPERM lösen eine Wiederholung aus; nach dem letzten Versuch: 'ziel_gesperrt'
