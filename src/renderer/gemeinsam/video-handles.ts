// GENERIERT aus dem Signaturblock von Issue #246.
// [renderer-gemeinsam] Video-Handles vor dem Löschen freigeben
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

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
