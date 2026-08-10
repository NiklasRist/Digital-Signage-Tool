/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #140.
// [action-editor] Live-Vorschau der Aktion über die einzige Pixelquelle
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
