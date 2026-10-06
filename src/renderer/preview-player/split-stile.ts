// Issue #218 - split-stile.ts: die reine Uebersetzung der Bandgeometrie in Rechtecke.
//
// Diese Datei RECHNET NICHTS: Alle Zahlen kommen aus berechneBandGeometrie (#239,
// DIE EINZIGE Quelle der Geometrie, TK 9.9.2: „mit derselben Funktion"). Die
// einzigen eigenen Ausdruecke sind Felduebernahmen und GENAU EINE Subtraktion -
// die Rueckgewinnung der Bandhoehe aus bandY (ENTSCHIEDEN 2), weil BandGeometrie
// die Hoehe nicht als eigenes Feld fuehrt. Ein `1080 - bandHoehe` waere eine
// zweite Wahrheit und wuerde bei einer Aenderung der geteilten Rechnung stehenbleiben.
//
// Keine Pruefung, kein Fehlercode, keine Ergebnis-Huelle: „der preview-player
// pruift nichts und meldet keine Fehlercodes" (TK 9.9.2). Das Urteil ueber eine
// unbrauchbare Hoehe faellt der render-service (ungueltiges_element).

import { berechneBandGeometrie, type BandGeometrie } from '../../shared/band-geometrie'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

/** Ein Rechteck in ABSOLUTEN Pixeln des 1920×1080-Rasters der Buehne (#212). */
export interface Rechteck {
  x: number
  y: number
  breite: number
  höhe: number
}

/** Die Split-Aufteilung als fertige Rechtecke – NUR umgestellt, NICHT gerechnet. */
export interface SplitStile {
  /** Der 16:9-Rahmen des eingepassten Videos: videoVersatzX/Y, videoBreite/videoHöhe. */
  videoRahmen: Rechteck
  /** Der ganze obere Bereich: 1920 × (1080 − H) bei y = 0. */
  videoBereich: Rechteck
  /** Das Band: 1920 × H bei y = bandY. */
  band: Rechteck
  /** Breite JEDER der beiden seitlichen Restflaechen – gleich videoVersatzX. */
  restflaecheBreite: number
}

/**
 * Ruft berechneBandGeometrie(bandHöhe) auf und stellt die sieben Felder in Rechtecke um.
 * RECHNET NICHTS SELBST: keine Division, keine Multiplikation, keine Rundung.
 * Die einzigen erlaubten eigenen Ausdruecke sind die Uebernahme von Feldwerten und
 * `RENDER_PROFILE.hoehe − geometrie.bandY` fuer die Bandhoehe (s. ENTSCHIEDEN 2).
 * Total: wirft nie, traegt KEINE Ergebnis-Huelle und KEINEN Fehlercode.
 */
export function baueSplitStile(bandHöhe: number): SplitStile {
  const geometrie: BandGeometrie = berechneBandGeometrie(bandHöhe)
  return {
    videoRahmen: {
      x: geometrie.videoVersatzX,
      y: geometrie.videoVersatzY,
      breite: geometrie.videoBreite,
      höhe: geometrie.videoHöhe,
    },
    videoBereich: {
      x: 0,
      y: 0,
      breite: geometrie.videoBereichBreite,
      höhe: geometrie.videoBereichHöhe,
    },
    band: {
      x: 0,
      y: geometrie.bandY,
      breite: geometrie.videoBereichBreite,
      // ENTSCHIEDEN 2: die Bandhoehe wird aus dem ERGEBNIS der geteilten Rechnung
      // zurueckgewonnen, nicht aus dem Parameter neu hergeleitet.
      höhe: RENDER_PROFILE.hoehe - geometrie.bandY,
    },
    restflaecheBreite: geometrie.videoVersatzX,
  }
}
