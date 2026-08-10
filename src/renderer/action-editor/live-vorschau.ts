// GENERIERT aus dem Signaturblock von Issue #140.
// [action-editor] Live-Vorschau der Aktion über die einzige Pixelquelle
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Aktion } from '../../shared/contracts/aktion'
import type { Asset } from '../../shared/contracts/asset'
import type { Marke } from '../../shared/contracts/marke'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { SegmentBild } from '../template-canvas/zeichne-segment'

/** Einmalige Vorbereitung, BEVOR gezeichnet wird: Schriften, Logo und alle Motive der
 *  Aktions-Bibliothek. Danach ist zeichneVorschau synchron aufrufbar.
 *  Wirkungsgleich bei Mehrfachaufruf: ein zweiter Aufruf mit denselben Eingaben führt zum
 *  gleichen Bestand (#111 überschreibt vorhandene Schlüssel und lädt neu – NICHT idempotent im
 *  Sinne von „tut beim zweiten Mal nichts"). Nach einem Projektwechsel oder einem abgeschlossenen
 *  Import erneut aufrufen. */
export async function bereiteVorschauVor(
  projektId: string,
  aktionen: Aktion[],
  assets: Asset[],
  marke: Marke,
): Promise<void> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #140."
  );
}

/** Die Vorschau: EIN Aufruf von zeichneSegment, sonst nichts. Synchron. */
export function zeichneVorschau(aktion: Aktion, vorlage: Vorlage, marke: Marke): SegmentBild {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #140."
  );
}

/** Hängt das Canvas in ein Anzeigeelement und skaliert es AUSSCHLIESSLICH per CSS.
 *  Verändert canvas.width/canvas.height NIEMALS. */
export function haengeVorschauEin(ziel: HTMLElement, bild: SegmentBild): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #140."
  );
}
