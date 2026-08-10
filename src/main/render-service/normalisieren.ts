/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #177.
// [render-service] Ein Element normalisieren
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

import type { ChildProcess } from 'node:child_process'
import type { RenderItem } from '../../shared/contracts/render-request'
import type { RenderProfile } from '../../shared/contracts/render-profile'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { RenderFehlercode } from './fehlercodes'      // #171

/** Die in T1 abgelegten PNGs GENAU DIESES Elements (aus PngAblage, #175). */
export interface ElementPngs {
  /** Pfad des Segment-PNG; `null` bei `video` und `bild`. */
  segment: string | null
  /** Pfade der Band-Abschnitte in Abschnittsreihenfolge; leeres Array ohne Einblendung. */
  band: readonly string[]
}

export interface NormalisierKontext {
  projektId: string
  /** absoluter Pfad des T1-Ordners <Temp>/reel-XXXX (#172); existiert bereits */
  arbeitsbereich: string
  /** aus RenderRequest.profil; wird UNVERAENDERT durchgereicht */
  profil: RenderProfile
  /** Hexwert '#RRGGBB' der Farb-Rolle flaecheDunkel, vom Aufrufer aus leseMarke() (#29) */
  flaecheDunkel: string
  /** DIESELBE Abbruch-Quelle wie istAbgebrochen() (#179) – KEIN zweites Flag */
  abbruchSignal: AbortSignal
  /** = merkeProzess (#159), von renderReel hereingereicht */
  merkeProzess: (kindProzess: ChildProcess) => void
  /** = gibProzessFrei (#159), von renderReel hereingereicht */
  gibProzessFrei: (kindProzess: ChildProcess) => void
  /** grober Stand INNERHALB dieses Elements, 0..1 – geht an den Fortschritts-Sender (#178) */
  aufElementFortschritt: (anteilImElement: number) => void
}

/**
 * Prueft VOR dem ersten ffmpeg-Aufruf, dass jedes referenzierte Medium physisch vorhanden ist.
 * Wird von renderReel (#181) einmal ueber die GESAMTE Elementliste aufgerufen, bevor irgendein
 * ffmpeg- oder ffprobe-Prozess startet.
 */
export async function pruefeMedienVorhanden(
  elemente: readonly RenderItem[],
  projektId: string,
): Promise<Ergebnis<void, RenderFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #177."
  );
}

/**
 * Dateiname des Zwischenclips, allein aus dem Listenindex.
 * NICHT `segmentDateiname` nennen – Begründung: ENTSCHIEDEN unten.
 */
export function zwischenclipDateiname(elementIndex: number): string {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #177."
  );
}

/**
 * Normalisiert GENAU EIN Element zu genau einer Datei seg_NNNN.mp4 im Arbeitsbereich.
 * Erfolgsnutzlast ist der absolute Pfad dieser Datei.
 */
export async function normalisiereElement(
  element: RenderItem,
  index: number,                 // 0-basiert; bestimmt den Dateinamen
  pngs: ElementPngs,             // aus PngAblage.segmentPngs[index] / .bandPngs[index] (#175)
  kontext: NormalisierKontext,
): Promise<Ergebnis<string, RenderFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #177."
  );
}
