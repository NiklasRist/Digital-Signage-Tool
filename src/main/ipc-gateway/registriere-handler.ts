/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #23.
// [ipc] ipc-gateway Kanal-Wrapper mit Validierung und Ergebnis-Hülle bauen
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
// GERUEST-PRUEFSUMME: 7872b4d195da1ebe
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
export function registriereHandler<T, F extends string>(
  kanal: string,
  validiere: (nutzlast: unknown) => Ergebnis<unknown, 'ungueltige_eingabe'> | { ok: true; wert: unknown },
  ausfuehren: (validierteNutzlast: unknown) => Promise<Ergebnis<T, F>>,
): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #23."
  );
}
// registriert einen ipcMain.handle(kanal, ...)-Listener, der:
//   1. validiere() aufruft; bei ok:false → sofort Ergebnis<T,F> mit code 'ungueltige_eingabe' zurück,
//      OHNE ausfuehren() aufzurufen (keine Wirkung auf Daten)
//   2. ausfuehren() in try/catch aufruft; jede uncaught Exception → Ergebnis<T,F> mit
//      code 'unbekannter_fehler', Exception intern geloggt, KEIN Stacktrace im Rückgabewert
//   3. das Ergebnis von ausfuehren() unverändert zurückgibt
