/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #119.
// [template-canvas] Das gebündelte Marken-Logo laden und bereitstellen
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
// GERUEST-PRUEFSUMME: bd46030c5f53da46
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

import type { Marke } from '../../shared/contracts/marke'
import type { Motiv } from './bild-laden'

export async function bereiteLogoVor(marke: Marke): Promise<void> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #119."
  );
}
// Lädt marke.logo.datei aus dem Bundle des Renderers, dekodiert es mit await img.decode() und legt
// das Ergebnis im Modul-Bestand ab. Idempotent: merkt sich das EINE Promise und gibt es bei jedem
// weiteren Aufruf unverändert zurück; ein abgelehntes Promise wird NICHT gemerkt.
// Wirft NIE wegen eines Ladefehlers – ein nicht ladbares Logo landet als { zustand: 'fehlt' } im
// Bestand. Geworfen wird nur bei einem leeren marke.logo.datei (Programmierfehler).

export function holeLogo(): Motiv {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #119."
  );
}
// SYNCHRON, ohne Parameter. Liest ausschließlich den Bestand – lädt nichts, wartet auf nichts,
// erzeugt kein Image. Vor der ersten erfolgreichen Vorbereitung: { zustand: 'fehlt' }.
