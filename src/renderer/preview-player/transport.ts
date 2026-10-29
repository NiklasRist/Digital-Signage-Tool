// [preview-player] Transport – Abspielen, Pause, Springen und die Markierung des aktuellen Elements

import { RENDER_PROFILE } from '../../shared/contracts/render-profile'
import { findeAbschnitt, sekundenZuFrame, type Zeitachse } from './zeitachse'
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

/**
 * #443: Springt um `sekunden` vor (+) oder zurueck (-) - die +-5-s-Tasten der Leiste.
 * Die Umrechnung Sekunden -> Frames ist `sekundenZuFrame` (#213, EINE Rundung); danach
 * gilt `springeZuFrame` mit seiner Klemme auf [0, gesamtFrames].
 * `laeuft` bleibt unveraendert - ein Sprung haelt die Uhr nicht an und startet sie nicht.
 * Ein unbrauchbarer Wert (NaN, Infinity) laesst den Stand UNVERAENDERT: kein Sprung,
 * kein Ersatzwert (der Knopf tut dann nichts, statt an den Anfang zu springen).
 */
export function springeUmSekunden(stand: TransportStand, achse: Zeitachse, sekunden: number): TransportStand {
  if (!Number.isFinite(sekunden)) return stand
  return springeZuFrame(stand, achse, stand.frame + sekundenZuFrame(sekunden))
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
