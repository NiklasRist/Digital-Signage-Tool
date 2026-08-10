/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #135.
// [action-editor] Aktions-Bibliothek des Projekts anzeigen und kaputte Aktionen kennzeichnen
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

import type { Aktion } from '../../shared/contracts/aktion'
import type { Asset } from '../../shared/contracts/asset'

export interface BibliothekEintrag {
  aktion: Aktion
  kaputt: boolean            // true = bildRef gesetzt, aber kein nutzbares Asset dahinter
  bildAsset: Asset | null    // das aufgelöste Bild-Asset; null bei bildRef === null ODER bei kaputt
}

/** Löst `bildRef` gegen die Medien-Bibliothek des Projekts auf.
 *  null bei `bildRef === null`, bei unbekannter ID und bei `zustand === 'fehlt'`. */
export function findeBildAsset(bildRef: string | null, assets: Asset[]): Asset | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #135."
  );
}

/** true, wenn `bildRef` gesetzt ist, aber `findeBildAsset` nichts Nutzbares liefert. */
export function istAktionKaputt(aktion: Aktion, assets: Asset[]): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #135."
  );
}

/** Die anzeigbare Bibliothek – in der Reihenfolge von `Project.aktionen`, ohne Sortierung. */
export function baueBibliothek(aktionen: Aktion[], assets: Asset[]): BibliothekEintrag[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #135."
  );
}

/** Anzahl der Einträge mit `kaputt === true` – für den Zähler in der Oberfläche. */
export function zaehleKaputte(eintraege: BibliothekEintrag[]): number {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #135."
  );
}
