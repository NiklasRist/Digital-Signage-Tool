/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #217.
// [preview-player] Ein Aktions-Segment darstellen – exakt dasselbe Canvas wie der finale Render
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
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
