/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #242.
// [preview-player] Die Vorschau zusammensetzen, antreiben und in den Reiter einhängen
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

import type { Project } from '../../shared/contracts/project'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { KaputtGrund, KaputteStelle } from '../composer/kaputt-erkennung'
import type { Achsenabschnitt } from './zeitachse'
import { findeSegmentquelle } from './segment-quelle'
import { baueBandtakt, waehleAbschnitt } from './band-takt'

/**
 * Was auf der Buehne steht – als WERT, nicht als JSX. Genau eine Variante je Baustein aus
 * #215 bis #219 und #221, plus `leer` fuer „nichts zu zeigen".
 */
export type Vorschaubild =
  | { art: 'leer' }
  | { art: 'platzhalter'; grund: KaputtGrund; titel?: string }
  | { art: 'bild'; dateiname: string; titel?: string }
  | { art: 'video'; assetId: string; dateiname: string; trimStart: number; trimEnde: number }
  | { art: 'segment'; aktion: Aktion; vorlage: Vorlage }
  | {
      art: 'split'
      assetId: string
      dateiname: string
      trimStart: number
      trimEnde: number
      bandVorlage: Vorlage
      bandAktion: Aktion | null
    }
  | {
      art: 'einblendung'
      assetId: string
      dateiname: string
      trimStart: number
      trimEnde: number
      bandVorlage: Vorlage
      bandAktion: Aktion | null
    }
// `assetId` ist IMMER `asset.id` (#13) desselben Assets, aus dem auch `dateiname` stammt – NIE
// `element.ref` und NIE der Dateiname. Sie geht unveraendert in `VideoProps.assetId` (#216) und
// ist dort der SCHLUESSEL des Handle-Registers (#246). Ohne sie meldet sich das `<video>` der
// Vorschau nirgends an, und das Loeschen scheitert unter Windows am offenen Handle (TK 9.4.6).
// `art: 'bild'` traegt sie NICHT: TK 9.4.6 nennt ausdruecklich nur den `<video>`-Handle.

/**
 * Waehlt das Bild fuer GENAU EINEN Frame. REINE Funktion: liest nur ihre Argumente, laedt nichts,
 * zeichnet nichts, rechnet keine Dauer und keine Geometrie, wirft nie und traegt KEINE
 * Ergebnis-Huelle (TK 9.9.2: der preview-player prueft nichts und meldet keine Fehlercodes).
 */
export function waehleVorschaubild(
  projekt: Project,
  abschnitt: Achsenabschnitt | null,
  lokalerFrame: number,
  vorlagen: readonly Vorlage[],
  kaputteStellen: readonly KaputteStelle[],
  schriftenBereit: boolean,
): Vorschaubild {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #242."
  );
}

/**
 * Verstrichene Zeit zwischen zwei Bildtakten in Millisekunden.
 * `letzterMs === null` bedeutet „erster Takt nach einem Start" und liefert IMMER 0 – das ist die
 * Absicherung gegen den Sprung nach einer Pause (s. ENTSCHIEDEN 7).
 * Total: wirft nie. Nicht brauchbare Werte werden NICHT geglaettet – das erledigt `tick` (#214).
 */
export function taktDelta(jetztMs: number, letzterMs: number | null): number {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #242."
  );
}

/**
 * Ob der Bildtakt laufen soll: NUR wenn die Uhr laeuft UND der Reiter sichtbar ist.
 * Steht hier und nicht als Bedingung im JSX, damit die wichtigste Regel dieses Issues ohne
 * Browser pruefbar ist (s. ENTSCHIEDEN 7).
 */
export function taktSollLaufen(laeuft: boolean, sichtbar: boolean): boolean {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #242."
  );
}
