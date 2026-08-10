/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #108.
// [vorlagen-store] Verwaiste Arbeitskopien vom gelöschten Parent lösen
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

import type { Vorlage } from '../../shared/contracts/vorlage'

export function löseArbeitskopienVomParent(
  bestand: Vorlage[],
  parentId: string,
): Vorlage[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #108."
  );
}
// - SYNCHRON, rein: kein await, kein fs, kein Lesen, kein Schreiben, kein Ergebnis<T>
// - liefert ein NEUES Array gleicher Länge und gleicher Reihenfolge
// - jeder Eintrag mit parent === parentId wird durch ein NEUES Objekt mit parent: null ersetzt
// - jeder andere Eintrag wird UNVERÄNDERT durchgereicht (dieselbe Objekt-Referenz)
// - der Eintrag mit id === parentId bleibt unangetastet; ENTFERNT wird er von #107
// - mutiert weder das übergebene Array noch die darin enthaltenen Objekte
