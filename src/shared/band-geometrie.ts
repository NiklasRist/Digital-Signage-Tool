/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #239.
// [contracts] Bandgeometrie in den geteilten Bereich ziehen
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
// GERUEST-PRUEFSUMME: 19493e1f1481d08c
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

import { RENDER_PROFILE } from './contracts/render-profile'

export interface BandGeometrie {
  /** Breite des Video-Bereichs – immer die Profilbreite (1920). */
  videoBereichBreite: number
  /** Hoehe des Video-Bereichs: 1080 − H. */
  videoBereichHöhe: number
  /**
   * Breite des tatsaechlich eingepassten Videos (16:9-Quelle):
   * `videoBereichHöhe × 16 / 9`, ABGERUNDET auf das naechstkleinere Vielfache von 4 (TK 9.2.8).
   */
  videoBreite: number
  /** Hoehe des eingepassten Videos – hoehenbegrenzt, also gleich `videoBereichHöhe`. */
  videoHöhe: number
  /** Linker Rand des eingepassten Videos: `(videoBereichBreite − videoBreite) / 2`. */
  videoVersatzX: number
  /** Oberer Rand des eingepassten Videos im Video-Bereich – immer 0 (hoehenbegrenzt). */
  videoVersatzY: number
  /** Obere Kante des Bandes im 1920×1080-Bild: 1080 − H. */
  bandY: number
}

/**
 * Die REINE Rechnung. Total: wirft nie, liefert immer eine vollstaendig belegte Geometrie,
 * traegt KEINE Ergebnis-Huelle und KEINEN Fehlercode.
 *
 * VORBEDINGUNG (wird hier NICHT geprueft – s. „Was hier NICHT passiert"):
 *   `höhe` ist ganzzahlig, gerade, > 0 und < RENDER_PROFILE.hoehe.
 * Die Pruefung dieser Vorbedingung und die Vergabe des Fehlercodes `ungueltiges_element`
 * bleiben im render-service (TK 9.2.8).
 */
export function berechneBandGeometrie(höhe: number): BandGeometrie {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #239."
  );
}
