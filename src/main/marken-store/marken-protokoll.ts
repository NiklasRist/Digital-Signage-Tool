/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #290.
// [marken-store] Lese-Protokoll marken:// für den Ordner marken-assets/
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
// GERUEST-PRUEFSUMME: 09bb15c90c84491a
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

import type { CustomScheme } from "electron";

/**
 * Die Schema-Beschreibung als DATEN, nicht als Aufruf. Der Bootstrap (#309) sammelt sie zusammen
 * mit MEDIA_SCHEMA (#9) und ruft protocol.registerSchemesAsPrivileged GENAU EINMAL auf.
 *
 * WARUM KEINE registriere...()-FUNKTION: registerSchemesAsPrivileged nimmt ein Array und darf laut
 * electron.d.ts "can be called only once" nur EINMAL gerufen werden. Zwei Registrierer - einer fuer
 * 'media', einer fuer 'marken' - haetten still entweder 'marken' unprivilegiert gelassen ODER
 * 'media' ausser Kraft gesetzt; dann fehlten in der Vorschau alle Projektmedien, ohne dass etwas
 * auf die Marken zeigt. Diese Datei ruft die Electron-API deshalb NICHT selbst auf.
 */
export const MARKEN_SCHEMA: CustomScheme = (() => {
  throw new Error(
    "Noch nicht umgesetzt - Wert gehoert zu Issue #290."
  );
})();
// scheme: 'marken'
// privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
//   - dieselben VIER wie beim gebauten 'media'-Schema (#9, src/main/media-protokoll.ts).
//     TK 9.15.3: "Gleiche Bauart und gleiche Schutzregeln wie `media://` (9.5.7)".
//   - `standard`  : laesst marken://<markeId>/<dateiname> nach den ueblichen URL-Regeln in Host
//                   und Pfad zerlegen - sonst gibt es kein verlaessliches Trennen von markeId
//                   und Dateiname, und genau die beiden braucht loeseMarkenDateiPfad (#288).
//   - `secure`    : das Schema gilt als sicherer Kontext; ohne das behandelt Chromium die Inhalte
//                   wie unsicheres Fremdmaterial und blockiert sie in der geladenen Seite.
//   - `supportFetchAPI`: der Renderer laedt Logo-Bytes und Schriften VOR dem Zeichnen (TK 9.10.3).
//   - `stream`    : fuer Logos und Schriften ohne praktische Wirkung (Teilbereichs-Anfragen
//                   braucht nur <video>); MITGEFUEHRT, damit beide Schemata zeichengleich
//                   beschrieben sind und niemand je Schema neu abwaegen muss.
// UEBER EINE MOEGLICHE FUENFTE EIGENSCHAFT s. STOPP - dort und NUR dort.

/**
 * Registriert den eigentlichen Anfrage-Handler. Wird NACH app.whenReady(), vor dem Laden des
 * Hauptfensters aufgerufen – dieselbe Reihenfolge wie beim bestehenden 'media'-Handler.
 */
export function registriereMarkenProtokollHandler(): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #290."
  );
}

/**
 * Electron protocol.handle-Signatur (Fetch-API-Typen). Löst NIE selbst Pfade auf – jede Auflösung
 * läuft über loeseMarkenDateiPfad() aus #288 (src/main/marken-store/pfade.ts). Liest NUR die Datei;
 * schreibt, löscht oder verändert nichts.
 */
export async function behandleMarkenAssetAnfrage(request: Request): Promise<Response> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #290."
  );
}
