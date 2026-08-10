/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #246.
// [renderer-gemeinsam] Video-Handles vor dem Löschen freigeben
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
// GERUEST-PRUEFSUMME: 753d7c7c71518ccb
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

/**

 * Das Wenige, was diese Datei von einem Medienelement braucht. Bewusst KEIN

 * `HTMLVideoElement` – so ist die Datei ohne Browser pruefbar, und es ist unmoeglich, hier

 * versehentlich mehr am Element anzufassen als die zwei Dinge, die TK 9.4.6 nennt.

 */

export interface Medienhandle {

  /** Wird auf '' gesetzt. */

  src: string

  /** Wird danach gerufen. */

  load: () => void

}



/**

 * Meldet ein `<video>` an, das auf dieses Asset zeigt.

 * Rueckgabewert ist die Abmelde-Funktion; sie ist idempotent und wirft nie.

 * Dasselbe Element zweimal anzumelden ergibt EINEN Eintrag (s. ENTSCHIEDEN 4).

 */

export function meldeVideoHandleAn(assetId: string, handle: Medienhandle): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #246."
  );
}



/**

 * Gibt JEDEN angemeldeten Handle auf dieses Asset frei: `src = ''`, danach `load()`.

 * Jeder freigegebene Handle wird dabei abgemeldet.

 * PFLICHT vor dem Einreihen eines `loeschen`-Auftrags (TK 9.4.6).

 * Diese Signatur ist von #229 vorgegeben: `(assetId: string) => void`.

 */

export function gibVideoHandlesFrei(assetId: string): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #246."
  );
}



/** Wie viele Handles fuer dieses Asset angemeldet sind. NUR fuer Tests und Fehlersuche. */

export function zaehleVideoHandles(assetId: string): number {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #246."
  );
}



/** NUR fuer Tests: entfernt alle Anmeldungen, OHNE etwas freizugeben. */

export function setzeVideoHandlesZurueck(): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #246."
  );
}
