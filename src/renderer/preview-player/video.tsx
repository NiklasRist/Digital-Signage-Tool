// Issue #216 - video.tsx: die Anzeige des Video-Elements (natives <video>).
//
// DIE KERNREGEL (TK 9.9.2): „Video: natives <video> von trimStart bis trimEnde".
// Trim durch POSITIONIEREN, nicht durch Medienfragmente (ENTSCHIEDEN 3): Der
// Anfang kommt per currentTime, das Ende per Anhalten - beides steuert die
// Vorschau-Uhr (#214). Das Bauteil liest currentTime NUR um zu entscheiden,
// ob ein Sprung noetig ist, und schreibt es N I E irgendwo hin
// (ENTSCHIEDEN 1, TK 9.9.3 Einbahnstrasse).
//
// STUMM (TK 9.2.4): Die Ausgabedatei ist stumm; eine Vorschau mit Ton erweckt
// einen falschen Eindruck. muted ist gesetzt und bleibt gesetzt.
//
// HANDLE-REGISTER (#246): Das <video> ist der gefaehrlichste offene Handle im
// Renderer - TK 9.4.6 macht das Freigeben zur VORBEDINGUNG des Loeschens
// (Windows sperrt belegte Dateien). Deshalb meldet sich dieses Bauteil
// beim Einhaengen an und meldet sich beim Abbau ab. Die assetId ist der
// Registerschluessel und verlaesst dieses Bauteil NIE als URL-Teil.

import { useEffect, useRef } from 'react'
import type { JSX, CSSProperties } from 'react'
import { medienUrl } from './medien-url'
import { quellZeit, brauchtSprung } from './video-zeit'
import { meldeVideoHandleAn } from '../../renderer/gemeinsam/video-handles'

/** Ein Rechteck in ABSOLUTEN Pixeln des 1920×1080-Rasters der Buehne (#212). */
export interface VideoRahmen {
  x: number
  y: number
  breite: number
  höhe: number
}

export interface VideoProps {
  /** Kennung des offenen Projekts - nur fuer die media://-URL. */
  projektId: string
  /** Dateiname des Assets, ohne Verzeichnisanteil (Asset.dateiname, #13). */
  dateiname: string
  /**
   * `Asset.id` des Mediums (#13). Nicht fuer die URL - die baut sich aus `dateiname`.
   * Der SCHLUESSEL, unter dem sich dieses Bauteil beim Handle-Register (#246)
   * an- und wieder abmeldet (TK 9.4.6, „Vorbedingung Vorschau").
   */
  assetId: string
  /** Schnittanfang in Sekunden (Listenelement.trimStart). */
  trimStart: number
  /** Schnittende in Sekunden (Listenelement.trimEnde) - zum Anhalten am Ende. */
  trimEnde: number
  /** Position INNERHALB dieses Elements, in Frames (lokalerFrame aus #213). */
  lokalerFrame: number
  /** Der Stand der Vorschau-Uhr (TransportStand.laeuft aus #214). */
  laeuft: boolean
  /** Anzeigeflaeche im Raster. Fehlt sie, nimmt das Video die GANZE Buehne ein. */
  rahmen?: VideoRahmen
  /** Fuellfarbe der Einpassungsraender. Voreinstellung Schwarz (TK 9.2.4); #218 reicht
   *  die Farb-Rolle flaecheDunkel herein (ENTSCHIEDEN 4). */
  hintergrund?: string
}

export function Video(props: VideoProps): JSX.Element {
  const { projektId, dateiname, assetId, trimStart, trimEnde, lokalerFrame, laeuft, rahmen, hintergrund } = props
  const medien = useRef<HTMLVideoElement>(null)

  // DIE QUELLE nur, wenn sich projektId oder dateiname aendern (Fehlerpfade:
  // ein Neuladen bei jedem Rendervorgang setzt die Wiedergabe zuruck und
  // laesst das Bild schwarz aufblitzen).
  useEffect(() => {
    const element = medien.current
    if (element === null) return
    element.src = medienUrl(projektId, dateiname)
    element.load()
  }, [projektId, dateiname])

  // DAS HANDLE-REGISTER (#246): Anmeldung beim Aufbau, Abmeldung beim
  // Abbau, Neuanmeldung bei assetId-Wechsel - der Rueckgabewert ist die
  // Abmelde-Funktion und dient zugleich als Aufraeum-Funktion des Effekts.
  useEffect(
    () =>
      medien.current === null
        ? () => undefined
        : meldeVideoHandleAn(assetId, medien.current),
    [assetId],
  )

  // Das Steuerverhalten, EINMAL je Rendervorgang, in genau dieser Reihenfolge:
  useEffect(() => {
    const element = medien.current
    if (element === null) return
    const soll = quellZeit(trimStart, lokalerFrame)
    // ENTSCHIEDEN 5: am Ende anhalten, nicht springen. Das letzte Bild bleibt
    // stehen; der Wechsel zum naechsten Element entscheidet die Uhr.
    if (soll >= trimEnde) {
      element.pause()
      return
    }
    if (brauchtSprung(element.currentTime, soll)) {
      // Darf scheitern (Medium noch nicht bereit): es wird versucht und danach
      // nichts weiter unternommen - kein Klemmen, kein Ersatzwert (Fehlerpfade).
      element.currentTime = soll
    }
    if (laeuft && element.paused) {
      // play() liefert ein Promise, das abgelehnt werden kann, wenn das Element
      // zwischenzeitlich abgebaut ist - abfangen und VERWERFEN. Keine Meldung,
      // kein zweiter Versuch, keine unbehandelte Ablehnung. (Eine Umgebung,
      // die gar kein Promise liefert, bleibt ebenfalls ungestellt.)
      const struktur = element.play()
      if (struktur && typeof struktur.catch === 'function') {
        struktur.catch(() => undefined)
      }
    }
    if (!laeuft && !element.paused) {
      element.pause()
    }
  })

  const stil: CSSProperties = {
    position: 'absolute',
    left: rahmen?.x ?? 0,
    top: rahmen?.y ?? 0,
    width: rahmen?.breite ?? '100%',
    height: rahmen?.höhe ?? '100%',
    background: hintergrund ?? '#000000',
  }
  return (
    <div data-testid="preview-video" style={stil}>
      <video ref={medien} muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  )
}
