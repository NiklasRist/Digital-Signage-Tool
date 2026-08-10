/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #49.
// [project-store] Pfad-Autorität: Auflösung von Projekt- und Medienpfaden
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
// GERUEST-PRUEFSUMME: 849b17b64e3b8420
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

export function projektOrdner(projektId: string): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #49."
  );
}
// absoluter Pfad des Projektordners, z. B. `<Datenort>/projects/<projektId>` (TK Abschnitt 6);
// reine String-Operation, kein Dateisystemzugriff, keine Existenzprüfung

export function medienOrdner(projektId: string): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #49."
  );
}
// absoluter Pfad des Medienordners dieses Projekts, z. B.
// `<Datenort>/projects/<projektId>/media` (TK Abschnitt 6, TK 9.5.7);
// reine String-Operation, kein Dateisystemzugriff

export function loeseAssetPfad(projektId: string, dateiname: string): Ergebnis<string> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #49."
  );
}
// absoluter Pfad zur Asset-Datei; liefert NUR einen Pfad, wenn dieser nach Normalisierung
// nachweislich innerhalb von medienOrdner(projektId) liegt, sonst `ungueltige_eingabe`;
// reine String-/Pfad-Operation (kein `fs.*`-Aufruf, keine Existenzprüfung)

export function ausgabeOrdner(projektId: string): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #49."
  );
}
// absoluter Pfad des Ausgabeordners dieses Projekts, z. B.
// `<Datenort>/projects/<projektId>/output` (TK Abschnitt 6, TK 9.5.7);
// reine String-Operation, kein Dateisystemzugriff

export function loeseAusgabePfad(projektId: string, ausgabeName: string): Ergebnis<string> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #49."
  );
}
// absoluter Pfad `ausgabeOrdner(projektId)/<ausgabeName>.mp4`; liefert NUR einen Pfad, wenn
// `ausgabeName` die Namensvalidierung aus TK 9.2.6 besteht (s. Invarianten) UND das normalisierte
// Ergebnis nachweislich innerhalb von ausgabeOrdner(projektId) liegt, sonst `ungueltige_eingabe`;
// reine String-/Validierungs-Operation (kein `fs.*`-Aufruf, keine Existenzprüfung)
