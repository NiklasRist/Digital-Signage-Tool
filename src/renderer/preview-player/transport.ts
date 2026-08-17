// GENERIERT aus dem Signaturblock von Issue #214.
// [preview-player] Transport – Abspielen, Pause, Springen und die Markierung des aktuellen Elements
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
// GERUEST-PRUEFSUMME: 6ca4ae7bb1ea58b6
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

import { RENDER_PROFILE } from '../../shared/contracts/render-profile'
import { findeAbschnitt, type Zeitachse } from './zeitachse'
// RENDER_PROFILE.fps braucht `tick` fuer `msProFrame` und die Schranke von `restMs`;
// findeAbschnitt braucht `markierterIndex`. Beides sind WERT-Importe, kein `import type`.
// Fuer eine Sekunden-Umrechnung gaebe es `frameZuSekunden`/`sekundenZuFrame` aus derselben
// Datei – sie werden HIER nicht gebraucht und deshalb auch nicht importiert (s. STOPP).

/**
 * Der vollstaendige Stand der Vorschau-Uhr. Ein WERT, keine Klasse und kein Modul-Zustand:
 * Jede Funktion liefert einen NEUEN Stand, keine mutiert ihre Eingabe.
 */
export interface TransportStand {
  /** true = die Uhr laeuft. Sagt NICHTS darueber, ob ein <video> gerade wirklich abspielt. */
  laeuft: boolean
  /** Aktuelle Position in Frames, ganzzahlig, immer 0 <= frame <= achse.gesamtFrames. */
  frame: number
  /**
   * Angesammelter Bruchteil eines Frames in Millisekunden, 0 <= restMs < 1000 / fps.
   * Nur `tick` schreibt ihn; jeder Sprung setzt ihn auf 0.
   */
  restMs: number
}

/** Der Anfangsstand: pausiert, bei Frame 0. */
export function baueTransport(): TransportStand {
  return { laeuft: false, frame: 0, restMs: 0 }
}

/** Startet die Uhr. Steht sie am Ende, beginnt sie wieder bei 0 (s. ENTSCHIEDEN 3). */
export function spieleAb(stand: TransportStand, achse: Zeitachse): TransportStand {
  // Die leere Achse zuerst: frame === gesamtFrames === 0 wuerde sonst ENTSCHIEDEN 3
  // ausloesen und laeuft: true liefern, obwohl es nichts abzuspielen gibt.
  if (achse.gesamtFrames === 0) return { laeuft: false, frame: 0, restMs: 0 }
  if (stand.frame >= achse.gesamtFrames) return { laeuft: true, frame: 0, restMs: 0 }
  return { laeuft: true, frame: stand.frame, restMs: stand.restMs }
}

/** Haelt die Uhr an und BEHAELT die Position – das ist das „merkt sich die Stelle". */
export function pausiere(stand: TransportStand): TransportStand {
  return { laeuft: false, frame: stand.frame, restMs: stand.restMs }
}

/** Springt an eine Frame-Position; klemmt auf [0, gesamtFrames]. `laeuft` bleibt unveraendert. */
export function springeZuFrame(stand: TransportStand, achse: Zeitachse, frame: number): TransportStand {
  const ziel = Number.isNaN(frame) ? 0 : Math.round(frame)
  const geklemmt = Math.min(Math.max(ziel, 0), achse.gesamtFrames)
  return { laeuft: stand.laeuft, frame: geklemmt, restMs: 0 }
}

/** Springt an den Anfang des Elements mit diesem Listen-Index; klemmt auf gueltige Indizes. */
export function springeZuElement(stand: TransportStand, achse: Zeitachse, index: number): TransportStand {
  if (achse.abschnitte.length === 0) return { laeuft: stand.laeuft, frame: 0, restMs: 0 }
  const ziel = Number.isNaN(index) ? 0 : Math.round(index)
  const geklemmt = Math.min(Math.max(ziel, 0), achse.abschnitte.length - 1)
  const abschnitt = achse.abschnitte[geklemmt]
  if (!abschnitt) return { laeuft: stand.laeuft, frame: 0, restMs: 0 }
  return { laeuft: stand.laeuft, frame: abschnitt.startFrame, restMs: 0 }
}

/**
 * Laesst die Uhr um `vergangeneMs` weiterlaufen. Tut NICHTS, wenn `laeuft` false ist.
 * Erreicht sie das Ende, bleibt sie bei gesamtFrames stehen und `laeuft` wird false.
 */
export function tick(stand: TransportStand, achse: Zeitachse, vergangeneMs: number): TransportStand {
  const msProFrame = 1000 / RENDER_PROFILE.fps
  // "Unbrauchbar" heisst: laeuft false, oder vergangeneMs <= 0, NaN, Infinity.
  // `Number.isFinite` fängt NaN und beide Unendlichkeiten, `vergangeneMs <= 0` den Rest.
  if (!stand.laeuft || !Number.isFinite(vergangeneMs) || vergangeneMs <= 0) return stand

  const gesamt = stand.restMs + vergangeneMs
  const ganzeFrames = Math.floor(gesamt / msProFrame)
  const neuerFrame = stand.frame + ganzeFrames
  const neuerRest = gesamt - ganzeFrames * msProFrame
  if (neuerFrame >= achse.gesamtFrames) {
    return { laeuft: false, frame: achse.gesamtFrames, restMs: 0 }
  }
  return { laeuft: true, frame: neuerFrame, restMs: neuerRest }
}

/** Listen-Index des gerade laufenden Elements; null am Ende und bei leerer Achse. ABGELEITET. */
export function markierterIndex(stand: TransportStand, achse: Zeitachse): number | null {
  const abschnitt = findeAbschnitt(achse, stand.frame)
  return abschnitt ? abschnitt.index : null
}
