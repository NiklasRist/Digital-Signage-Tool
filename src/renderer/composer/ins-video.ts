// [composer] „Ins Video" - der KLICK statt des Drags (02.11.2026)
//
// ============================================================================
// WARUM ES DIESE DATEI GIBT
// ============================================================================
// Bei 800 px ist das Einfuegeziel der Zeitleiste wenige Pixel breit (Messlatte,
// Uebergabe Abschnitt 16). Ein Klick braucht keine Zielscheibe. Was er anlegt,
// entscheidet die FORM der Aktion:
//
//   Band-Aktion (Vorlage MIT Hoehe)      -> Abschnitt ans Werbeband des Videos.
//                                           Das Band wiederholt sich von selbst,
//                                           frame-genau (TK 9.2.8).
//   Ganzbild-Aktion (Vorlage OHNE Hoehe) -> Unterbrechung an der ABSPIELMARKE.
//                                           Das Video pausiert, die Aktion laeuft
//                                           (TK 9.2.9).
//
// ABLOESUNG, OFFEN BENANNT (Niklas, 02.11.2026): #442 legte fest, Band-Abschnitte
// entstuenden AUSSCHLIESSLICH in der Band-Bearbeitung des Elements. Fuer DIESEN
// Knopf gilt das nicht mehr - er ist der Aufwand-Senker, fuer den das Band
// ueberhaupt existiert. Die DROP-Regel bleibt unberuehrt: ein Drop auf den
// Video-Koerper legt weiter IMMER eine Unterbrechung an (`band-aufnahme.ts`).
//
// REIN: kein React, kein DOM, keine IPC, kein throw. Geschrieben wird
// ausschliesslich ueber die BESTEHENDEN Wege (`uebernehmeBand` fuer das Band,
// `setzeElementUnterbrechungen` fuer die Unterbrechung) - diese Datei baut nur
// Entwuerfe und rechnet Zeitstellen.

import type { Listenelement } from '../../shared/contracts/project'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Vorlage } from '../../shared/contracts/vorlage'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'
import { frameDauer } from './gesamtlaenge'
import { fuegeAbschnittAn, waehlbareBandVorlagen, type BandEntwurf } from './einblendung-bearbeiten'
import { spieleZeitBeiSequenzzeit, videoSekunden } from './unterbrechungs-aufnahme'

/** Die eingebaute Band-Vorlage - der Rueckfall, wenn am Video noch kein Band haengt. */
export const STANDARD_BAND_VORLAGE_ID = 'band-standard'

/**
 * Ist die Aktion ein BAND? `höhe !== null` ist seit TK v3.31 die EINZIGE Aussage ueber
 * die Flaeche (`null` = Ganzbild). Dieselbe Regel wie in `bibliothek-ansicht.tsx`
 * (dort fuer das Layout der Zeile) und in `einblendung-bearbeiten.ts`.
 *
 * Eine UNBEKANNTE Vorlage (geloescht, von Hand verbogen) gilt als Ganzbild -> der
 * Klick legt eine Unterbrechung an. Das ist die sichtbarere und leichter
 * rueckgaengig zu machende Wirkung; ein Bandabschnitt mit unbekannter Vorlage
 * waere ausserdem gar nicht darstellbar.
 *
 * WARUM DIESER ZWEIG BLEIBT, OBWOHL DIE OBERFLAECHE IHN NICHT MEHR ERZEUGT
 * (Entscheidung 03.11.2026 zu Befund 27.3): Der Aktions-Editor bietet nur
 * Ganzbild-Vorlagen an (`action-editor/vorlage-waehlen.ts`), und das fruehere
 * Inline-Formular der Bibliothek — der EINZIGE Weg, auf dem eine Aktion je eine
 * Band-Vorlage bekam (sein `<select>` war ungefiltert) — ist mit Entscheidung 29.4
 * entfallen. Der Zweig ist deshalb aber KEIN toter Code: Aeltere Projekte tragen
 * solche Aktionen (belegt: `projects/lallala`, Aktion „Fuss" mit `band-standard`).
 * Fuer sie ist der Band-Abschnitt die EINZIGE darstellbare Wirkung — als Unterbrechung
 * waeren sie 1920 x 162, und der Render weist jedes Segment ab, das nicht 1920 x 1080
 * ist (TK 9.5.2). Loeschen hiesse: ein bestehendes Projekt wird unrenderbar.
 * Das Band selbst gehoert zum VIDEO (`bandVorlageId`, TK 9.2.8) — ein Abschnitt wird
 * mit DESSEN Vorlage gezeichnet, nie mit der der Aktion.
 */
export function istBandAktion(aktion: Aktion, vorlagen: readonly Vorlage[]): boolean {
  const vorlage = vorlagen.find((kandidat) => kandidat.id === aktion.vorlagenId)
  return vorlage !== undefined && vorlage.höhe !== null
}

/**
 * Die Band-Vorlage, mit der ein neuer Abschnitt laufen soll.
 *
 * EINE VORLAGE PRO EINBLENDUNG (TK 9.2.8): Haengt am Video schon ein Band, bleibt
 * dessen Vorlage - ein Wechsel mitten im Video liesse die Geometrie springen.
 * Ohne Band entscheidet die eingebaute `band-standard`; fehlt auch die, die ERSTE
 * waehlbare. `null` heisst: es gibt ueberhaupt keine Band-Vorlage im Projekt -
 * dann darf hier nichts erfunden werden (der Aufrufer meldet es).
 */
export function waehleBandVorlageId(
  video: Listenelement,
  vorlagen: readonly Vorlage[],
): string | null {
  if (video.einblendung !== null) return video.einblendung.bandVorlageId
  const wahlbar = waehlbareBandVorlagen(vorlagen)
  const standard = wahlbar.find((vorlage) => vorlage.id === STANDARD_BAND_VORLAGE_ID)
  if (standard !== undefined) return standard.id
  const erste = wahlbar[0]
  return erste === undefined ? null : erste.id
}

/**
 * Der Entwurf mit der Aktion AM ENDE der Folge - das ist die Abspielreihenfolge
 * (TK 9.2.8: "Reihenfolge = Abspielreihenfolge"). Ein bestehendes Band wird
 * UEBERNOMMEN, nicht ersetzt: Abschnitte, die schon laufen, bleiben stehen.
 *
 * Gebaut wird mit `fuegeAbschnittAn` - derselbe Weg wie in der Band-Bearbeitung,
 * keine zweite Anhaenge-Regel.
 */
export function entwurfMitNeuerAktion(
  video: Listenelement,
  bandVorlageId: string,
  aktionRef: string,
  dauer: number,
): BandEntwurf {
  const bestehend: BandEntwurf =
    video.einblendung === null
      ? { bandVorlageId, abschnitte: [] }
      : {
          bandVorlageId: video.einblendung.bandVorlageId,
          abschnitte: video.einblendung.abschnitte.map((abschnitt) => ({
            aktionRef: abschnitt.aktionRef,
            dauer: abschnitt.dauer,
          })),
        }
  return fuegeAbschnittAn(bestehend, aktionRef, dauer)
}

/**
 * Die Stelle im VIDEO, an der die Abspielmarke steht - in der GESPIELTEN Videozeit.
 *
 * DIE MARKE IST PROJEKTWEIT (Frames ueber die ganze Liste, `gemeinsam/abspielposition`).
 * Die Unterbrechung will aber die Zeit INNERHALB des Video-Blocks. Beides ist
 * dieselbe Rechnung in zwei Schritten:
 *   1. Projektframes -> Block und Sekunden im Block (Summe der `frameDauer` davor).
 *   2. Sekunden im Block -> Videozeit: `spieleZeitBeiSequenzzeit` rechnet die
 *      Unterbrechungen heraus und klemmt in das offene Intervall (0, Videodauer).
 *
 * `null` heisst: die Marke steht NICHT in einem Video (kein Projekt, kein Video,
 * eine kaputte Dauer, oder sie steht in einem eigenstaendigen Aktions-Block).
 * Dann wird nichts erfunden - der Aufrufer sagt, was zu tun ist.
 *
 * Das ENDE der Liste gehoert zum LETZTEN Block: wer bis ans Ende spielt, meint
 * dessen letztes Bild. Ein Ueberlauf wird deshalb auf `gesamt - 1` geklemmt.
 */
export function videostelleAusAbspielmarke(
  liste: readonly Listenelement[],
  markeFrames: number,
): { elementId: string; zeitSekunden: number } | null {
  if (!Number.isInteger(markeFrames) || markeFrames < 0) return null

  // Erst ALLE Dauern - ein kaputtes Element macht die ganze Rechnung unbrauchbar
  // (dieselbe Haltung wie `berechneGesamtlaenge`: keine "ungefaehre" Zahl).
  const dauern: number[] = []
  let gesamt = 0
  for (const element of liste) {
    const einzeln = frameDauer(element)
    if (!einzeln.ok) return null
    dauern.push(einzeln.wert)
    gesamt += einzeln.wert
  }
  if (gesamt <= 0) return null

  const ziel = Math.min(markeFrames, gesamt - 1)
  let kante = 0
  for (let stelle = 0; stelle < liste.length; stelle += 1) {
    const element = liste[stelle]
    const frames = dauern[stelle]
    if (element === undefined || frames === undefined) return null
    if (ziel < kante + frames) {
      // Nur ein VIDEO ist ein Ziel: In einen Aktions-Block laesst sich keine
      // Unterbrechung legen (die gehoert zum Video, TK 9.2.9).
      if (element.art !== 'video') return null
      if (videoSekunden(element) === null) return null
      const imBlock = (ziel - kante) / RENDER_PROFILE.fps
      const zeitSekunden = spieleZeitBeiSequenzzeit(element, imBlock)
      if (zeitSekunden === null) return null
      return { elementId: element.id, zeitSekunden }
    }
    kante += frames
  }
  return null
}
