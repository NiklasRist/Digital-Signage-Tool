// [preview-player] #436 (TK v3.26 / 9.2.9): die Vorschau-Zerlegung eines unterbrochenen Videos
//
// Ein Video-Element mit Unterbrechungen ist im Render in `2n+1` Stuecke zerlegt (#435,
// `zerlegeVideo`): [Video-Teil][Aktion][Video-Teil]… Hier wird dieselbe Zerlegung
// WIEDERVERWENDET - nicht nachgebaut - und auf das FRAME-Raster gelegt. So zeigt die
// Vorschau an der Zeitstelle die Aktion (das Video pausiert) und laeuft danach an
// DERSELBEN Stelle weiter (TK 9.2.9, AD 4.5).
//
// Keine Frame-Rundung aus zweiter Hand: die Grenzen liegen in `sekundenZuFrame` (#213),
// dieselbe 30-fps-Rundung wie die Achse und der Render (9.2.6). Die Video-Teile
// teleskopieren deshalb exakt zur Frame-Dauer des ganzen Videos.
//
// Kein JSX, kein Browser, kein IPC - ohne Fenster pruefbar.

import type { Unterbrechung } from '../../shared/contracts/project'
import { zerlegeVideo } from '../composer/unterbrechungs-zerlegung'
import { sekundenZuFrame } from './zeitachse'

/** Ein VIDEO-Teil: die Rohgrenzen (Sekunden) und die Position darin, in Frames. */
export interface VideoTeil {
  /** Rohgrenze fuer das `<video>` (Sekunden) - unveraendert aus der Zerlegung. */
  trimStart: number
  /** Rohgrenze fuer das `<video>` (Sekunden). */
  trimEnde: number
  /** Frame INNERHALB dieses Teils - geht als `lokalerFrame` an `quellZeit` (#216). */
  lokalerFrame: number
  /** Bis hierher GESPIELTE Video-Frames (die Phasenlage des Werbebands, #435). */
  gespielteFrames: number
}

/**
 * Was an EINEM lokalen Frame eines Video-Elements zu zeigen ist.
 * Waehrend eines Einschubs wird der VIDEO-Teil DAVOR an seinem ENDE gezeigt (das Video
 * pausiert an der Zeitstelle); `einschub` nennt dann die laufende Aktion.
 */
export interface VideoTeilStand {
  video: VideoTeil
  /** `null` = ein Video-Teil; sonst laeuft hier der Einschub dieser Aktion. */
  einschub: { aktionRef: string } | null
}

/**
 * Loest den lokalen Frame eines Video-Elements in seinen Video-Teil oder Einschub auf.
 * Ohne Unterbrechungen ist das Ergebnis immer der ganze Ausschnitt (`lokalerFrame`
 * unveraendert). `null` ausserhalb des Elements (kommt ueber die Achse nicht vor).
 *
 * Die Eintraege werden NICHT sortiert und NICHT geprueft - das tut der Store
 * (`setzeUnterbrechungen`, 9.5.2: aufsteigend, ohne Ueberschneidung).
 */
export function loeseVideoTeil(
  trimStart: number,
  trimEnde: number,
  unterbrechungen: readonly Unterbrechung[],
  lokalerFrame: number,
): VideoTeilStand | null {
  let pos = 0
  let gespielt = 0
  // Der zuletzt durchlaufene Video-Teil - waehrend eines Einschubs zeigt das <video> ihn an
  // seinem Ende (die Pause an der Zeitstelle).
  let davor: VideoTeil | null = null

  for (const stueck of zerlegeVideo(trimStart, trimEnde, unterbrechungen)) {
    if (stueck.art === 'video') {
      const frames = sekundenZuFrame(stueck.trimEnde) - sekundenZuFrame(stueck.trimStart)
      if (lokalerFrame < pos + frames) {
        const teil = lokalerFrame - pos
        return {
          video: {
            trimStart: stueck.trimStart,
            trimEnde: stueck.trimEnde,
            lokalerFrame: teil,
            gespielteFrames: gespielt + teil,
          },
          einschub: null,
        }
      }
      pos += frames
      gespielt += frames
      davor = {
        trimStart: stueck.trimStart,
        trimEnde: stueck.trimEnde,
        lokalerFrame: frames,
        gespielteFrames: gespielt,
      }
    } else {
      const frames = sekundenZuFrame(stueck.dauer)
      if (lokalerFrame < pos + frames) {
        // Der Store verbietet eine Zeitstelle <= 0 (9.5.2), es gibt also immer einen Teil
        // davor. Fehlt er dennoch (unsinnige Daten), wird NICHTS gezeigt statt geraten.
        if (davor === null) return null
        return { video: davor, einschub: { aktionRef: stueck.aktionRef } }
      }
      pos += frames
    }
  }
  return null
}
