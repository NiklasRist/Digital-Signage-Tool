// Issue #219 - einblendung.tsx: die Einblendung-Simulation (Art B, TK 9.2.8).
//
// DREI Unterschiede zur Split-Komposition (#218), alle drei bindend:
// 1. Das Video bleibt VOLLFLAECHIG - es bekommt deshalb weder rahmen noch
//    hintergrund (ENTSCHIEDEN 3); schwarze Balken liefert #216 selbst.
// 2. KEINE Markenfarbe - flaecheDunkel ist die Ausnahme der Split-Komposition
//    und gilt hier nicht (TK 9.2.4; die Marke wird nur an Segment gereicht).
// 3. Das Band UEBERLAGERT das Video mit seinem Alphakanal - hinter dem Band
//    steht NICHTS: kein Hintergrund, keine Deckkraft, kein Filter (ENTSCHIEDEN 4).
//    Eine Fuellfarbe unter dem Band wuerde es undurchsichtig machen und
//    die Einblendung optisch zum Split machen.
//
// ENTSCHIEDEN 5: bandVorlage.hoehe === null bedeutet kein Band - kein Aufruf
// der Geometrie, vollflaechiges Video wie ohne Einblendung, kein Ersatzwert,
// keine Meldung.
//
// Die Zeitlogik (welcher Band-Abschnitt sichtbar ist) entscheidet #220; dieses
// Bauteil bekommt die fertige bandAktion.

import type { JSX } from 'react'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { Marke } from '../../shared/contracts/marke'
import { baueEinblendungStile } from './einblendung-stile'
import { Video } from './video'
import { Segment } from './segment'

export interface EinblendungProps {
  /** Kennung des offenen Projekts – wird an Video durchgereicht. */
  projektId: string
  /** Dateiname des Video-Assets – wird an Video durchgereicht. */
  dateiname: string
  /** `Asset.id` des Video-Assets – wird UNVERAENDERT an Video durchgereicht (#216,
   *  ENTSCHIEDEN 6: Registerschluessel fuer die Handle-Freigabe). NICHT hier auswerten. */
  assetId: string
  trimStart: number
  trimEnde: number
  /** Position INNERHALB dieses Elements, in Frames – wird an Video durchgereicht. */
  lokalerFrame: number
  laeuft: boolean
  /** Die app-weite Marke. Wird UNVERAENDERT an Segment durchgereicht, sonst nicht benutzt. */
  marke: Marke
  /** Die Band-Vorlage dieses Elements (art === 'einblendung'). Liefert die Bandhoehe H. */
  bandVorlage: Vorlage
  /** Die Aktion des GERADE sichtbaren Bandabschnitts; null = kein Abschnitt sichtbar. */
  bandAktion: Aktion | null
}

/** Fuellt die GANZE Buehne: 1920×1080 im Raster von #212. */
export function Einblendung(props: EinblendungProps): JSX.Element {
  const { bandVorlage, bandAktion, marke } = props

  // ENTSCHIEDEN 5: keine Bandhoehe, kein Band, keine Geometrie - vollflaechiges
  // Video, schwarz (Video ohne rahmen/hintergrund).
  if (bandVorlage.höhe === null) {
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
        <Video
          projektId={props.projektId}
          dateiname={props.dateiname}
          assetId={props.assetId}
          trimStart={props.trimStart}
          trimEnde={props.trimEnde}
          lokalerFrame={props.lokalerFrame}
          laeuft={props.laeuft}
        />
      </div>
    )
  }

  const stile = baueEinblendungStile(bandVorlage.höhe)

  return (
    // ENTSCHIEDEN 4: der Behaelter traegt KEINE Farbe und KEINE Deckkraft -
    // der Alphakanal des Band-Canvas wirkt unveraendert auf das Video.
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
      <Video
        projektId={props.projektId}
        dateiname={props.dateiname}
        assetId={props.assetId}
        trimStart={props.trimStart}
        trimEnde={props.trimEnde}
        lokalerFrame={props.lokalerFrame}
        laeuft={props.laeuft}
      />
      {bandAktion !== null ? (
        <Segment
          aktion={bandAktion}
          vorlage={bandVorlage}
          marke={marke}
          x={0}
          y={stile.bandY}
        />
      ) : null}
    </div>
  )
}
