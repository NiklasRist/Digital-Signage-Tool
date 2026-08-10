/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #131.
// [composer] Kaputte Stellen erkennen
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
// GERUEST-PRUEFSUMME: 236fcd8f1bd01114
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

import type { Project } from '../../shared/contracts/project'

export type KaputtGrund =
  | 'asset_fehlt'        // Asset existiert in D1, steht aber auf zustand: 'fehlt' (TK 9.4.7)
  | 'asset_unbekannt'    // die Asset-ID steht in keinem Project.assets-Eintrag
  | 'aktion_unbekannt'   // die Aktions-ID steht in keinem Project.aktionen-Eintrag

export type KaputteStelle =
  | { art: 'element_asset';  elementId: string; assetId: string;
      grund: 'asset_fehlt' | 'asset_unbekannt' }
  | { art: 'element_aktion'; elementId: string; aktionId: string; assetId: string | null;
      grund: KaputtGrund }
  | { art: 'band_abschnitt'; elementId: string; abschnittIndex: number; aktionId: string;
      assetId: string | null; grund: KaputtGrund }

/** Alle kaputten Stellen des Projekts, in stabiler Reihenfolge. Rein, ohne Seiteneffekt. */
export function findeKaputteStellen(projekt: Project): KaputteStelle[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #131."
  );
}

/** Alle Stellen, die EIN Fix an dieser Aktion mit behebt – Listenelemente UND Band-Abschnitte. */
export function stellenZuAktion(
  stellen: readonly KaputteStelle[],
  aktionId: string,
): KaputteStelle[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #131."
  );
}
