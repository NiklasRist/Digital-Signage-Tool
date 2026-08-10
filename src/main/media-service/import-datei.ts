// GENERIERT aus dem Signaturblock von Issue #84.
// [media-service] Quelldatei ins Staging kopieren und atomar umbenennen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis } from '../../shared/contracts/ergebnis';

/** Ordnername des Staging-Ordners INNERHALB des Medienordners. */
export const STAGING_ORDNER = '.staging';

/** Endung der Arbeitsdatei, solange sie noch nicht fertig ist. */
export const PART_ENDUNG = '.part';

export async function kopiereInsStaging(
  quellPfad: string,
  zielOrdner: string,
  dateiname: string,
): Promise<Ergebnis<{ partPfad: string }, 'datei_nicht_gefunden' | 'kopier_fehler'>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #84."
  );
}

export async function macheEndgueltig(
  partPfad: string,
  endPfad: string,
): Promise<Ergebnis<void, 'kopier_fehler'>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #84."
  );
}
