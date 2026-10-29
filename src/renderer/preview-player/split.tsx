// Issue #218 - split.tsx: die Split-Simulation (Anzeige, jsdom-frei hier, JSX).
//
// Aufteilung des fertigen Videos (TK 9.9.2, 9.2.8): verkleinertes Video oben,
// Werbeband darunter, seitliche Restflaechen in der Farb-Rolle flaecheDunkel.
// ALLE Zahlen stammen aus baueSplitStile (die geteilte Rechnung #239); dieses
// Bauteil rechnet nichts, prueft nichts und meldet keine Fehlercodes.
//
// ENTSCHIEDEN 4: Die Restflaechen entstehen als HINTERGRUND des aeusseren
// Behaelters - nicht als zwei gezeichnete Kaesten. Was links und rechts vom
// Video-Rahmen uebrig bleibt, ist damit automatisch flaecheDunkel.
//
// ENTSCHIEDEN 3/5: Die Farbe kommt AUSSCHLIESSLICH aus marke.farben.flaecheDunkel
// - nicht ueber loeseFarbe (#112), hier gibt es keine Aktion und keine Akzent-
// Rolle (TK 9.10.9); auch die Einpassungsraender INNERHALB des Video-Rahmens
// tragen flaecheDunkel (TK 9.2.8, Schritt 2).
//
// ENTSCHIEDEN 6: bandVorlage.hoehe === null bedeutet KEIN Band - kein Aufruf
// der Geometrie, das Video fuellt die Buehne mit SCHWARZEN Balken wie ein Video
// ohne Einblendung. Kein Ersatzwert, keine Meldung.
//
// Die Zeitlogik (welcher Band-Abschnitt sichtbar ist) entscheidet #220; dieses
// Bauteil bekommt die fertige bandAktion und rendert sie oder - bei null - gar
// kein Band-Canvas.

import type { JSX } from 'react'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { Marke } from '../../shared/contracts/marke'
import { baueSplitStile } from './split-stile'
import { Video } from './video'
import { Segment } from './segment'

export interface SplitProps {
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
  /** Die PROJEKT-Standardmarke (TK 9.15.4, #313). Quelle der Farb-Rolle `flaecheDunkel`
   *  fuer die Restflaechen. Wird als `rahmenMarke` an `Segment` (#310) gereicht. */
  rahmenMarke: Marke
  /** Die Marke der gerade sichtbaren Band-Aktion (`bandAktion.markeId`), bereits aufgeloest.
   *  `null`, wenn `bandAktion === null` ODER die Marke nicht bereitsteht - dann wird
   *  `Segment` NICHT gerendert. */
  abschnittMarke: Marke | null
  /** Die Band-Vorlage dieses Elements (art === 'split'). Liefert die Bandhoehe H. */
  bandVorlage: Vorlage
  /** Die Aktion des GERADE sichtbaren Bandabschnitts; null = kein Abschnitt sichtbar. */
  bandAktion: Aktion | null
}

/** Fuellt die GANZE Buehne: 1920×1080 im Raster von #212. */
export function Split(props: SplitProps): JSX.Element {
  const { rahmenMarke, abschnittMarke, bandVorlage, bandAktion } = props
  const dunkel = rahmenMarke.farben.flaecheDunkel

  // ENTSCHIEDEN 6: keine Bandhoehe, kein Band, keine Geometrie - das Video
  // fuellt die ganze Buehne, Schwarz liefert Video selbst (hintergrund fehlt).
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

  const stile = baueSplitStile(bandVorlage.höhe)

  return (
    <div
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', background: dunkel }}
    >
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
        rahmen={stile.videoRahmen}
        hintergrund={dunkel}
      />
      {bandAktion !== null && abschnittMarke !== null ? (
        <Segment
          aktion={bandAktion}
          vorlage={bandVorlage}
          marke={abschnittMarke}
          x={stile.band.x}
          y={stile.band.y}
        />
      ) : null}
    </div>
  )
}
