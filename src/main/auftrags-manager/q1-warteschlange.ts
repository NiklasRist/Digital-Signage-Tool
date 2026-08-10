// GENERIERT aus dem Signaturblock von Issue #54.
// [auftrags-manager] Q1-Warteschlange im Arbeitsspeicher führen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Auftrag } from '../../shared/contracts/auftrag';

/** Interner Datensatz UM den Auftrag herum. Verlässt dieses Modul NICHT nach außen (IPC/UI). */
export interface Q1Eintrag {
  auftrag: Auftrag;
  begonnenAm: string | null;   // ISO-8601 UTC; null, solange der Auftrag anstehend ist
}

export function fuegeAnsEndeAn(auftrag: Auftrag): number {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #54."
  );
}   // liefert die Position in der Schlange
export function findeQ1(auftragId: string): Q1Eintrag | undefined {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #54."
  );
}
export function entferneAusQ1(auftragId: string): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #54."
  );
}
export function naechsterAnstehender(): Q1Eintrag | undefined {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #54."
  );
}
export function laufender(): Q1Eintrag | undefined {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #54."
  );
}
export function alleQ1(): Auftrag[] {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #54."
  );
}
