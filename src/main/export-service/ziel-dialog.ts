/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #183.
// [export-service] Exportziel über einen Ordner-Dialog wählen
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
// GERUEST-PRUEFSUMME: 5a14f4147f6bec3a
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

import { dialog } from 'electron'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

export async function wähleExportZiel(): Promise<Ergebnis<{ pfad: string | null }>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #183."
  );
}
// - INSTANT-Operation, KEIN Auftrag: sie trägt die Ergebnis-Hülle und läuft NICHT über reiheEin
// - `pfad` = absoluter Pfad des GEWÄHLTEN ORDNERS (nicht der Zieldatei)
// - `pfad === null` bedeutet: der Nutzer hat den Dialog abgebrochen. Das ist ok:true, KEIN Fehler
// - Kein zweiter Fehlercode-Typparameter: diese Operation kann keinen FACHLICHEN Fehler erzeugen;
//   nur die generischen Codes aus Ergebnis<T> (Default-Typparameter) kommen infrage
