/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #188.
// [export-service] Den Export-Ablauf zusammensetzen und das Ziel merken
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

import type { Auftrag } from '../../shared/contracts/auftrag'
import type { AusfuehrungsKontext, HandlerErgebnis } from '../auftrags-manager/dispatcher'
import type { ExportFehlercode } from './fehlercodes'

export async function exportiereAusgabe(
  auftrag: Extract<Auftrag, { art: 'export' }>,
  kontext: AusfuehrungsKontext,
): Promise<HandlerErgebnis<ExportFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #188."
  );
}
// Erfolg:  { status: 'erfolg', ergebnis: { zielPfad, dateigroesse } }
//          zielPfad = VOLLSTÄNDIGER Pfad der geschriebenen ZIELDATEI (Zielordner + dateiname)
// Fehler:  { status: 'fehlgeschlagen', fehler: { code, meldung } }
// Diese Funktion liefert NIE { status: 'abgebrochen' } – ein Export ist nicht abbrechbar (FA-18)
// Sie wirft NIE.
