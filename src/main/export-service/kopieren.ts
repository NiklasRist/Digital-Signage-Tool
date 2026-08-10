/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #186.
// [export-service] Nach .part kopieren, Größe verifizieren, fsync vor der Erfolgsmeldung
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
// GERUEST-PRUEFSUMME: 0b1787c5b69187e1
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

export async function kopiereNachPart(
  quellPfad: string,      // absolut, aus loeseExportQuelle (#185) – bereits geprüft
  partPfad: string,       // absolut, `<zielOrdner>/<dateiname>.part` – vom Aufrufer gebildet
  quellGroesse: number,   // Bytes, aus loeseExportQuelle (#185) – die Sollgröße
): Promise<Ergebnis<void, ExportFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #186."
  );
}
// Reihenfolge verbindlich: kopieren -> Größe vergleichen -> fsync -> ERST DANN Erfolg melden.
// Bei jedem Fehlschlag wird die angefangene .part-Datei best-effort entfernt (s. Ablauf).
// Diese Funktion fasst die eigentliche Zieldatei NICHT an – weder lesend noch schreibend.
