/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #288.
// [marken-store] Pfad-Autorität für marken-assets/<markeId>/
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
// GERUEST-PRUEFSUMME: 1d58aa2fa766f924
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
import type { MarkenFehlercode } from './fehlercodes'
import { ermittleDatenOrt } from '../datenort'

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #5:    ermittleDatenOrt(): string
//          // absoluter Pfad zum app-weiten Datenort (enthaelt u. a. projects/, marken.json,
//          // vorlagen.json); reine Pfad-Berechnung ohne I/O
//   #276: type MarkenFehlercode =
//            'marke_referenziert' | 'marke_eingebaut' | 'marke_nicht_gefunden'
//            | 'marken_datei_fehlt' | 'speicher_fehler'

export function markenAssetsWurzel(): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #288."
  );
}
// absoluter Pfad des app-weiten Ordners, der die Marken-Unterordner enthält, z. B.
// `<Datenort>/marken-assets` (TK Abschnitt 6, TK 9.15.3); reine String-Operation, kein
// Dateisystemzugriff, keine Existenzprüfung

export function markenOrdner(markeId: string): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #288."
  );
}
// absoluter Pfad des Asset-Ordners EINER Marke, z. B. `<Datenort>/marken-assets/<markeId>`
// (TK 9.15.3: "marken-assets/<markeId>/"); reine String-Operation, kein Dateisystemzugriff

export function loeseMarkenDateiPfad(markeId: string, dateiname: string): Ergebnis<string, MarkenFehlercode> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #288."
  );
}
// absoluter Pfad zur importierten Datei; liefert NUR einen Pfad, wenn dieser nach Normalisierung
// nachweislich innerhalb von markenOrdner(markeId) liegt, sonst `ungueltige_eingabe`;
// reine String-/Pfad-Operation (kein `fs.*`-Aufruf, keine Existenzprüfung)
