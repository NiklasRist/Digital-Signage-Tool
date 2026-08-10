/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #50.
// [project-store] media://-Auflösung: den Protokoll-Stub aus #9 füllen
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
// GERUEST-PRUEFSUMME: 808d159786025952
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

// Wird von #9 als Handler an `protocol.handle('media', ...)` übergeben; die Registrierung selbst
// (VOR app.whenReady()/Fensterladen) bleibt Sache von #9 — diese Datei liefert NUR die
// Anfrage-Behandlung, KEINE Protokoll-Registrierung.

export async function behandleMediaAnfrage(request: Request): Promise<Response> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #50."
  );
}
// Electron protocol.handle-Signatur (Fetch-API-Typen). Löst NIE selbst Pfade auf — jede Auflösung
// läuft über loeseAssetPfad() aus #49 (src/main/project-store/pfade.ts). Liest NUR die Datei;
// schreibt, löscht oder verändert nichts.
