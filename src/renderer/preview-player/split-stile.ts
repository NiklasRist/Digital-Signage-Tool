/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #218.
// [preview-player] Split-Simulation – Video oben, Werbeband darunter, Geometrie aus der geteilten Rechnung
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: b6aa167a9657c627
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

import { berechneBandGeometrie, type BandGeometrie } from '../../shared/band-geometrie'

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
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #218."
  );
}
