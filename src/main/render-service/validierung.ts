/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #173.
// [render-service] RenderRequest vollständig validieren, bevor irgendetwas geschieht
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
// GERUEST-PRUEFSUMME: 50751a24da2b2e64
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

import type { RenderRequest } from '../../shared/contracts/render-request'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { RenderFehlercode } from './fehlercodes'

/** Maße eines PNG-Puffers, aus dem IHDR-Kopf gelesen – ohne Dekodieren. */
export interface PngMasse {
  breite: number
  höhe: number
}

/** Liest Breite und Höhe aus den ersten 24 Bytes eines PNG. Dekodiert das Bild NICHT. */
export function liesPngMasse(png: Uint8Array): Ergebnis<PngMasse, RenderFehlercode> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #173."
  );
}

/**
 * Prüft die gesamte Anfrage. Wirkungsfrei: liest nichts, schreibt nichts, startet nichts.
 * Erfolg heisst „diese Anfrage darf ausgeführt werden", nicht „sie wird gelingen".
 */
export function pruefeRenderRequest(request: RenderRequest): Ergebnis<void, RenderFehlercode> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #173."
  );
}
