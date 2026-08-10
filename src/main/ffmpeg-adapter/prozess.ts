// GENERIERT aus dem Signaturblock von Issue #158.
// [ffmpeg-adapter] Fehlercode-Union und Prozessstart fuehreFfmpegAus
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { ChildProcess } from 'node:child_process'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/**
 * Geschlossener Fehlercode-Satz des ffmpeg-adapter. Modul-lokal (nicht im geteilten Vertrag):
 * Die Enge sitzt dort, wo der Code ENTSTEHT.
 */
export type FfmpegFehlercode = 'ffmpeg_fehler' | 'ffmpeg_abgebrochen'

export interface FfmpegLauf {
  /** Die Argumente EINZELN, ohne Binärpfad und ohne die feste Vorspann-Liste (s. u.). */
  argumente: readonly string[]
  /** Wird je vollstaendiger Zeile auf stdout gerufen (Traeger von -progress). Ohne Deutung. */
  aufAusgabeZeile?: (zeile: string) => void
  /** Reicht das Prozess-Handle sofort nach dem Start heraus (fuer den Abbruch, #159). */
  aufProzessStart?: (kindProzess: ChildProcess) => void
  /** Signalisiert einen vom Nutzer gewollten Abbruch. Diese Datei KILLT NICHT - sie deutet nur. */
  abbruchSignal?: AbortSignal
}

export async function fuehreFfmpegAus(
  lauf: FfmpegLauf,
): Promise<Ergebnis<void, FfmpegFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #158."
  );
}
