// GENERIERT aus dem Signaturblock von Issue #166.
// [ffmpeg-adapter] Standbild-Element zu einem Zwischenclip machen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { RenderProfile } from '../../shared/contracts/render-profile'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

export interface StandbildAuftrag {
  /** absoluter Pfad des Standbilds (PNG in T1 oder importiertes Bild in D2) – bereits aufgelöst */
  bildPfad: string
  /** Anzahl der zu erzeugenden Frames, GANZZAHLIG. Die Rundung von Sekunden auf Frames hat
   *  bereits der `render-service` erledigt (#174). Der `ffmpeg-adapter` rechnet NICHT um. */
  frames: number
  /** fertige Filterkette für `-filter_complex`, gebaut von #163. Sie verbraucht `[0:v]` und
   *  liefert `[v]`. Diese Datei WÄHLT die Kette nicht aus und baut sie nicht selbst. */
  filterkette: string
  /** absoluter Zielpfad des Zwischenclips, z. B. <T1>/seg_0003.mp4 – bereits aufgelöst */
  zielPfad: string
}

/**
 * Baut das vollständige Argument-Array für EINEN ffmpeg-Aufruf – ohne Binärpfad und ohne den
 * festen Vorspann, den #158 selbst voranstellt.
 * Startet KEINEN Prozess: Das Ausführen übernimmt der Aufrufer (`render-service`, #177) über
 * `fuehreFfmpegAus` (#158). Begründung s. u. („Warum diese Datei nichts ausführt").
 */
export function baueStandbildArgumente(
  auftrag: StandbildAuftrag,
  profil: RenderProfile,
): Ergebnis<string[]> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #166."
  );
}
