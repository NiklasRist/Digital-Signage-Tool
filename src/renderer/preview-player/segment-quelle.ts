// GENERIERT aus dem Signaturblock von Issue #217.
// [preview-player] Ein Aktions-Segment darstellen – exakt dasselbe Canvas wie der finale Render
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Aktion } from '../../shared/contracts/aktion'
import type { Vorlage } from '../../shared/contracts/vorlage'

/** Was zum Zeichnen dieses Segments verfuegbar ist – und woran es sonst fehlt. */
export type Segmentquelle =
  | { zustand: 'bereit'; aktion: Aktion; vorlage: Vorlage }
  | { zustand: 'aktion_unbekannt'; aktionId: string }
  | { zustand: 'vorlage_unbekannt'; vorlagenId: string }
  | { zustand: 'schriften_fehlen' }

/**
 * Sucht Aktion und Vorlage heraus. REINE Funktion: liest nur die uebergebenen Listen, laedt nichts,
 * zeichnet nichts, wirft nie. Pruefreihenfolge s. ENTSCHIEDEN 2.
 * `schriftenBereit` ist das Ergebnis von sindSchriftenBereit() (#110) und wird HEREINGEREICHT,
 * damit diese Funktion ohne Browser pruefbar bleibt.
 */
export function findeSegmentquelle(
  aktionId: string,
  aktionen: readonly Aktion[],
  vorlagen: readonly Vorlage[],
  schriftenBereit: boolean,
): Segmentquelle {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #217."
  );
}
