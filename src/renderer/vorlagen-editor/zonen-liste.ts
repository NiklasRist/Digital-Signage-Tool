/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #146.
// [vorlagen-editor] Die Zonen-Liste als Zeichenreihenfolge führen
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
// GERUEST-PRUEFSUMME: 7cc2a29bb67cc3d2
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
import type { Vorlage, Zone } from '../../shared/contracts/vorlage'

/** Eine Zeile der Zonen-Liste. Die Reihenfolge der Zeilen IST die Zeichenreihenfolge. */
export interface ZonenListenEintrag {
  zone: Zone
  index: number       // Position in vorlage.zonen – identisch mit der Position in dieser Liste
  ebene: number       // index + 1; 1 = zuunterst, die höchste Zahl = zuoberst. NUR Anzeigetext.
  beweglich: boolean  // zone.rolle === 'frei' – nur diese Zeilen sind ziehbar
}

/** Baut die Liste. Reine Abbildung 1:1 auf vorlage.zonen – ohne jede Sortierung. */
export function baueZonenListe(vorlage: Vorlage): ZonenListenEintrag[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #146."
  );
}

/**
 * Verschiebt den Eintrag von `vonIndex` an die Position `nachIndex`.
 * Liefert ein NEUES Array; das übergebene bleibt unverändert.
 */
export function ordneZonenNeu(
  zonen: readonly Zone[],
  vonIndex: number,
  nachIndex: number,
): Ergebnis<Zone[]> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #146."
  );
}
