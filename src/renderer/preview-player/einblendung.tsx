// Issue #219 - einblendung.tsx: die Band-Simulation. Seit TK v3.31 die EINZIGE
// Komposition eines Video-Elements mit Band (9.2.8); die fruehere Split-Simulation
// ist mit dem gestrichenen Split-Screen entfallen (#452).
//
// DREI bindende Eigenschaften:
// 1. Das Video bleibt VOLLFLAECHIG - es bekommt deshalb weder rahmen noch
//    hintergrund (ENTSCHIEDEN 3); schwarze Balken liefert #216 selbst.
// 2. KEINE Markenfarbe auf der Flaeche - die Marke wird nur an Segment gereicht
//    (TK 9.2.4; `flaecheDunkel` ist mit der Split-Komposition entfallen).
// 3. Das Band liegt DECKEND ueber dem Video (TK 9.2.8, v3.31) - hinter dem Band
//    steht NICHTS: kein Hintergrund, keine Deckkraft, kein Filter (ENTSCHIEDEN 4).
//
// ENTSCHIEDEN 5: bandVorlage.hoehe === null bedeutet kein Band - vollflaechiges
// Video wie ohne Einblendung, kein Ersatzwert, keine Meldung.
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
  /** #443: true = kein Ton (Normalfall). Wird UNVERAENDERT an Video durchgereicht. */
  stumm: boolean
  /** #443: 0..1. Wird UNVERAENDERT an Video durchgereicht. */
  lautstaerke: number
  /** Die PROJEKT-Standardmarke (TK 9.15.4, #313). Wird nur an `Segment` gereicht
   *  (`rahmenMarke`); diese Flaeche traegt selbst KEINE Farbe (ENTSCHIEDEN 4). */
  rahmenMarke: Marke
  /** Die Marke der gerade sichtbaren Band-Aktion (`bandAktion.markeId`), bereits aufgeloest.
   *  `null`, wenn `bandAktion === null` ODER die Marke nicht bereitsteht - dann wird
   *  `Segment` NICHT gerendert. */
  abschnittMarke: Marke | null
  /** Die Band-Vorlage dieses Elements (art === 'einblendung'). Liefert die Bandhoehe H. */
  bandVorlage: Vorlage
  /** Die Aktion des GERADE sichtbaren Bandabschnitts; null = kein Abschnitt sichtbar. */
  bandAktion: Aktion | null
}

/** Fuellt die GANZE Buehne: 1920×1080 im Raster von #212. */
export function Einblendung(props: EinblendungProps): JSX.Element {
  // rahmenMarke bleibt Prop (Signatur), wird hier aber nicht gelesen: Einblendungen
  // tragen excavated selbst KEINE Farbe; Segment (#217) fuehrt das rahmenMarke-Prop
  // NICHT (built-Stand - gemeldet an #313) und reicht intern (marke, marke).
  const { abschnittMarke, bandVorlage, bandAktion } = props

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
          stumm={props.stumm}
          lautstaerke={props.lautstaerke}
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
        stumm={props.stumm}
        lautstaerke={props.lautstaerke}
      />
      {bandAktion !== null && abschnittMarke !== null ? (
        <Segment
          aktion={bandAktion}
          vorlage={bandVorlage}
          marke={abschnittMarke}
          x={0}
          y={stile.bandY}
        />
      ) : null}
    </div>
  )
}
