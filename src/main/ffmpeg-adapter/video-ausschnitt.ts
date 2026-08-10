/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #167.
// [ffmpeg-adapter] Video-Ausschnitt framegenau schneiden
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

import type { RenderProfile } from '../../shared/contracts/render-profile'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

export interface VideoAusschnittAuftrag {
  /** absoluter Pfad des Quellvideos in D2 – bereits vom `render-service` aufgelöst */
  quellPfad: string
  /** erstes zu behaltendes Frame (0-basiert), GANZZAHLIG. Die Rundung round(trimStart × 30)
   *  hat bereits der `render-service` erledigt (#174). Der Adapter rechnet NICHT um. */
  startFrame: number
  /** erstes NICHT mehr zu behaltendes Frame, GANZZAHLIG – halboffenes Intervall
   *  [startFrame, endFrame). Die Clip-Länge ist damit endFrame − startFrame Frames. */
  endFrame: number
  /** absoluter Pfad der Bandspur (#168) oder null, wenn das Element kein Werbeband trägt.
   *  Ist er gesetzt, wird die Bandspur EINGANG 1. */
  bandSpurPfad: string | null
  /** fertige Filterkette für `-filter_complex`: #163 ohne Band, #164 bei `split`,
   *  #165 bei `einblendung`. Diese Datei WÄHLT die Kette nicht aus – das tut #177. */
  filterkette: string
  /** absoluter Zielpfad des Zwischenclips, z. B. <T1>/seg_0007.mp4 */
  zielPfad: string
}

/**
 * Baut das vollständige Argument-Array für EINEN ffmpeg-Aufruf – ohne Binärpfad und ohne den
 * festen Vorspann, den #158 selbst voranstellt.
 * Startet KEINEN Prozess – das Ausführen übernimmt der Aufrufer (`render-service`, #177) über
 * `fuehreFfmpegAus` (#158). So bleibt die Argument-Bildung eine reine, vollständig testbare
 * Funktion, und der Prozessstart liegt an genau einer Stelle.
 */
export function baueVideoAusschnittArgumente(
  auftrag: VideoAusschnittAuftrag,
  profil: RenderProfile,
): Ergebnis<string[]> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #167."
  );
}
