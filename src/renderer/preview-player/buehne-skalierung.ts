// GENERIERT aus dem Signaturblock von Issue #212.
// [preview-player] Die Bühne – ein festes 1920×1080-Raster, das nur zur Darstellung skaliert wird
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

/** Wie das feste 1920×1080-Raster in einen äußeren Kasten gelegt wird. Reine Rechnung. */
export interface Buehnenmaße {
  /** Faktor, mit dem das Raster dargestellt wird. 0, wenn der äußere Kasten unbrauchbar ist. */
  skalierung: number
  /** Dargestellte Breite in CSS-Pixeln: RENDER_PROFILE.breite × skalierung. */
  breite: number
  /** Dargestellte Höhe in CSS-Pixeln: RENDER_PROFILE.hoehe × skalierung. */
  höhe: number
  /** Linker Rand zur Zentrierung im äußeren Kasten: (aussenBreite − breite) / 2. */
  versatzX: number
  /** Oberer Rand zur Zentrierung im äußeren Kasten: (aussenHöhe − höhe) / 2. */
  versatzY: number
}

/**
 * Total: wirft nie. Bei einem unbrauchbaren äußeren Kasten (0, negativ, NaN, Infinity) sind ALLE
 * fünf Felder 0 – das ist der „noch nicht gemessen"-Fall und kein Fehler.
 */
export function berechneBuehnenmaße(aussenBreite: number, aussenHöhe: number): Buehnenmaße {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #212."
  );
}
