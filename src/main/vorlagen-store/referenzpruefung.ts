/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #106.
// [vorlagen-store] Referenzprüfung einer Vorlage über ALLE Projekte
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
import type { VorlagenFehlercode } from './fehlercodes'
import type { VorlagenReferenz, Vorlagennutzung } from '../../shared/contracts/vorlage'
// BEIDE Typen gehören #95 und werden hier NUR importiert, NIE neu deklariert: Sie reisen als
// fehler.daten über die IPC-Grenze (#107), und der Renderer darf nicht aus src/main/** importieren.

export async function pruefeVorlagenReferenzen(
  vorlagenId: string,
): Promise<Ergebnis<Vorlagennutzung, VorlagenFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #106."
  );
}
// - durchsucht ALLE von listeProjekte (#35) gemeldeten Projekte, nicht nur das geladene
// - erfasst BEIDE Referenzarten und liefert sie GETRENNT zurück
// - keine Treffer => beide Arrays leer (ok: true) – das ist KEIN Fehler
// - liest ausschliesslich; schreibt nichts, legt nichts an, repariert nichts
