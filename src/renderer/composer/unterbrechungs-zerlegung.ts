// #435 (TK v3.26 / 9.2.9): die REINE Zerlegung eines unterbrochenen Videos.
//
// Ein Video-Element mit `n` Unterbrechungen wird zu `2n+1` Stuecken:
//   [Video-Teil][Aktion][Video-Teil]…[Aktion][Video-Teil].
// Kein JSX, kein react, kein IPC, keine PNGs - hier steht NUR die Geometrie der Zerlegung
// (und die Phasen-Rotation des Werbebands). So ist sie ohne Browser pruefbar.
//
// DIE GRENZEN BLEIBEN ROH (Sekunden). Die Frame-Rundung liegt ausschliesslich im
// `render-service` (`frames.ts`, 9.2.6) - kein zweiter Rundungsweg. Weil die Teil-Grenzen
// aufeinanderfolgen, teleskopiert die Frame-Summe der Teile zur Frame-Dauer des ganzen
// Videos: `Σ(round(bᵢ₊₁·fps) − round(bᵢ·fps)) = round(trimEnde·fps) − round(trimStart·fps)`.

import type { Unterbrechung } from '../../shared/contracts/project'

export interface VideoStueck {
  art: 'video'
  trimStart: number
  trimEnde: number
  /** Die gespielte Videozeit bis zu diesem Teil - der Phasen-Versatz des Werbebands. */
  bandVersatzSekunden: number
}

export interface AktionsStueck {
  art: 'aktion'
  aktionRef: string
  dauer: number
}

export type Zerlegungsstueck = VideoStueck | AktionsStueck

/**
 * Zerlegt `[trimStart, trimEnde)` an den Zeitstellen der Unterbrechungen. Eine Zeitstelle
 * ist ab 0 der GESPIELTEN Videozeit gemeint, also bei `trimStart + zeitstelle` in der Quelle.
 *
 * Die Eintraege werden NICHT sortiert und NICHT geprueft - das tut der Store
 * (`setzeUnterbrechungen`, 9.5.2: aufsteigend, ohne Doppelstelle, innerhalb (0, Dauer)).
 * Eine unsinnige Reihenfolge faellt im `render-service` auf (`ungueltiges_element`, 9.2.3).
 */
export function zerlegeVideo(
  trimStart: number,
  trimEnde: number,
  unterbrechungen: readonly Unterbrechung[],
): Zerlegungsstueck[] {
  const stuecke: Zerlegungsstueck[] = []
  let quelle = trimStart
  for (const unterbrechung of unterbrechungen) {
    const grenze = trimStart + unterbrechung.zeitstelle
    if (grenze > quelle) {
      stuecke.push({
        art: 'video',
        trimStart: quelle,
        trimEnde: grenze,
        bandVersatzSekunden: quelle - trimStart,
      })
    }
    stuecke.push({ art: 'aktion', aktionRef: unterbrechung.aktionRef, dauer: unterbrechung.dauer })
    quelle = grenze
  }
  if (trimEnde > quelle) {
    stuecke.push({
      art: 'video',
      trimStart: quelle,
      trimEnde,
      bandVersatzSekunden: quelle - trimStart,
    })
  }
  return stuecke
}

/**
 * Dreht ein periodisch wiederholtes Band um `versatzSekunden` Phasen-Versatz (9.2.9:
 * "das Band laeuft auf der gespielten Videozeit weiter - waehrend eines Einschubs pausiert
 * es").
 *
 * Der `render-service` wiederholt die uebergebenen Abschnitte bis zur Clip-Laenge
 * (`baueBandspur`). Damit die Wiederholung an der richtigen PHASE beginnt, wird die Folge
 * auf den Versatz zugeschnitten: der Abschnitt, in den der Versatz faellt, wird geteilt -
 * sein Rest steht VORNE, sein Anfang HINTEN. Die Gesamtlaenge (die Periode) bleibt gleich,
 * die Wiederholung trifft also weiter dieselbe Phase.
 *
 * Die Abschnitts-Dauern werden NICHT gerundet (das tut der `render-service`, 9.2.8/9.2.6);
 * der Phasen-Versatz ist deshalb sekundengenau, nicht framegenau - fuer ein optisches
 * Overlay ausreichend. `png` bzw. andere Felder bleiben unveraendert am Abschnitt.
 */
export function rotiereBand<T extends { dauer: number }>(
  abschnitte: readonly T[],
  versatzSekunden: number,
): T[] {
  if (abschnitte.length === 0) return []
  const dauerVon = (abschnitt: T): number =>
    Number.isFinite(abschnitt.dauer) && abschnitt.dauer > 0 ? abschnitt.dauer : 0
  const gesamt = abschnitte.reduce((summe, abschnitt) => summe + dauerVon(abschnitt), 0)
  if (!(gesamt > 0)) return [...abschnitte]

  let phase = versatzSekunden % gesamt
  if (phase < 0) phase += gesamt
  if (phase <= 0) return [...abschnitte]

  let kum = 0
  for (let i = 0; i < abschnitte.length; i += 1) {
    const abschnitt = abschnitte[i]
    if (abschnitt === undefined) break
    const dauer = dauerVon(abschnitt)
    if (kum + dauer > phase) {
      const hinten = kum + dauer - phase // Rest dieses Abschnitts AB der Zeitstelle
      const vorne = phase - kum // Anfang dieses Abschnitts BIS zur Zeitstelle
      const ergebnis: T[] = [{ ...abschnitt, dauer: hinten }]
      for (let j = i + 1; j < abschnitte.length; j += 1) {
        const nachfolger = abschnitte[j]
        if (nachfolger !== undefined) ergebnis.push(nachfolger)
      }
      for (let j = 0; j < i; j += 1) {
        const vorheriger = abschnitte[j]
        if (vorheriger !== undefined) ergebnis.push(vorheriger)
      }
      if (vorne > 0) ergebnis.push({ ...abschnitt, dauer: vorne })
      return ergebnis
    }
    kum += dauer
  }
  return [...abschnitte]
}
