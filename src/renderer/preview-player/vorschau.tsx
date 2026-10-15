// Issue #242 - vorschau.tsx: die Vorschau zusammensetzen, antreiben und in den
// Reiter einhaengen (TK 9.9.1/9.9.2/9.9.3, 9.14.1/9.14.2).
//
// Der Ort: „Zusammenstellen = composer [P3] + preview-player [P5]" (TK 9.14.1).
// Diese Komponente ist der Inhalt des preview-player-Teils; WER sie in den
// Reiter einhaengt, ist eigene Verdrahtung (#260/#161) - sie ist hier NICHT.
//
// ENTSCHIEDEN 2: `voraussetzungen === null` heisst NICHTS ZEICHNEN - keine
// Buehne, kein Platzhalter, keine Ersatzgestaltung. Ein Zeichenversuch ohne
// Schriften/Motive lieferte Platzhalter statt Motiven. `schriftenBereit` ist
// deshalb GENAU `voraussetzungen !== null` (#154 schliesst fehlende Schriften
// bei Erfolg aus); `sindSchriftenBereit` (#110) wird hier bewusst NICHT
// gerufen - zwei Wege zu derselben Auskunft koennten auseinanderlaufen.
//
// ENTSCHIEDEN 7: GENAU EIN Taktgeber, requestAnimationFrame, angetrieben
// UEber taktSollLaufen (die reine Regel #242). Beim Start des Takts ist der
// Zeitstempel null, der erste Takt liefert also Delta 0 - die Pause loeckt
// sich nicht in der Uhr. Kein setInterval, kein setTimeout, kein timeupdate.
//
// ENTSCHIEDEN 11: Der Transportzustand liegt in dieser Komponente (useState);
// #195 haelt besuchte Reiter MONTIERT, also ueberlebt er den Reiterwechsel.
// #214 selbst haelt keinen Stand - „Der Aufrufer haelt den Stand".
//
// ENTSCHIEDEN 12: Aenderungen der Achse KLEMMEN die Position (springeZuFrame
// mit der alten Position), sie setzen nicht zurueck.
//
// ENTSCHIEDEN 1/13: Hier wird NICHTS gerechnet (Achse #213, Bandtakt #220,
// Geometrie #218/#219, Dauer #127); der Transport zeigt genau Play/Pause,
// Zeitleiste, Markierung, Gesamtdauer - keine Geschwindigkeit, kein Ton.

import type { JSX } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Project } from '../../shared/contracts/project'
import type { Zeichenvoraussetzungen } from '../composer/zeichen-vorbereitung'
import { holeBereiteMarke } from '../gemeinsam/marken-bereitstellung'
import { Buehne } from './buehne'
import { Video } from './video'
import { Segment } from './segment'
import { Split } from './split'
import { Einblendung } from './einblendung'
import { Platzhalter } from './platzhalter'
import { baueZeitachse, findeAbschnitt, lokalerFrame } from './zeitachse'
import {
  baueTransport,
  markierterIndex,
  pausiere,
  spieleAb,
  springeZuElement,
  springeZuFrame,
  tick,
} from './transport'
import { findeKaputteStellen } from '../composer/kaputt-erkennung'
import { formatiereLaenge } from '../composer/gesamtlaenge'
import { taktDelta, taktSollLaufen, waehleVorschaubild } from './vorschau-auswahl'

export interface VorschauProps {
  /** Das geladene Projekt; null = kein Projekt offen. Zustand kommt als PARAMETER (#197). */
  projekt: Project | null
  /**
   * Marke und Vorlagen, wie sie #154 hergestellt hat (aus #197: `zeichnen.hole()`).
   * null = noch nicht vorbereitet -> es wird NICHTS gezeichnet (s. ENTSCHIEDEN 2).
   */
  voraussetzungen: Zeichenvoraussetzungen | null
  /**
   * Ob der Reiter gerade sichtbar ist. Kommt aus `ReiterInhalt` (#195: `{ sichtbar: boolean }`).
   * Wechselt er auf false, wird PAUSIERT und die Stelle behalten (TK 9.14.2).
   */
  sichtbar: boolean
}

export function Vorschau(props: VorschauProps): JSX.Element {
  const [stand, setStand] = useState(() => baueTransport())
  const letzterMsRef = useRef<number | null>(null)
  const anlaufRef = useRef<number | null>(null)

  // ENTSCHIEDEN 1: die Achse kommt als WERT aus dem Einzigen Rechenort (#213).
  const achseErgebnis = useMemo(() => {
    if (props.projekt === null) return null
    return baueZeitachse(props.projekt.liste)
  }, [props.projekt])

  const kaputteStellen = useMemo(() => {
    if (props.projekt === null) return []
    return findeKaputteStellen(props.projekt)
  }, [props.projekt])

  const achse = achseErgebnis !== null && achseErgebnis.ok ? achseErgebnis.wert : null

  // ENTSCHIEDEN 12: klemmen, nicht zuruеcksetzen.
  useEffect(() => {
    if (achse === null) return
    setStand((bisher) => springeZuFrame(bisher, achse, bisher.frame))
  }, [achse])

  // ENTSCHIEDEN 7 / TK 9.14.2: unsichtbar -> pausieren, Stelle bleibt;
  // sichtbar wird NICHT automatisch wieder abgselaest.
  useEffect(() => {
    if (!props.sichtbar) {
      setStand((bisher) => pausiere(bisher))
    }
  }, [props.sichtbar])

  // DER Taktgeber. Laeuft GENAU DANN, wenn taktSollLaufen es sagt; der
  // Zeitstempel beginnt bei null, der erste Takt liefert Delta 0.
  useEffect(() => {
    const anfragen = requestAnimationFrame
    if (!taktSollLaufen(stand.laeuft, props.sichtbar) || achse === null) {
      if (anlaufRef.current !== null) {
        cancelAnimationFrame(anlaufRef.current)
        anlaufRef.current = null
      }
      return
    }
    letzterMsRef.current = null
    const schleife = (jetzt: number): void => {
      const delta = taktDelta(jetzt, letzterMsRef.current)
      letzterMsRef.current = jetzt
      setStand((bisher) => tick(bisher, achse, delta))
      anlaufRef.current = anfragen(schleife)
    }
    anlaufRef.current = anfragen(schleife)
    return () => {
      if (anlaufRef.current !== null) {
        cancelAnimationFrame(anlaufRef.current)
        anlaufRef.current = null
      }
      letzterMsRef.current = null
    }
  }, [stand.laeuft, props.sichtbar, achse])

  // ENTSCHIEDEN 10: ohne offenes Projekt NICHTS - kein Hinweis (#198).
  if (props.projekt === null) {
    return <div data-testid="vorschau-leer" />
  }

  // ENTSCHIEDEN 9: gescheiterte Achse - eine neutrale Zeile, KEINE Buehne,
  // kein Fehlercode, keine Teilvorschau.
  if (achseErgebnis === null || !achseErgebnis.ok) {
    return <div data-testid="vorschau-zeitachse-fehler">Die Liste erlaubt gerade keine Vorschau.</div>
  }
  // Erschliessung fuer den Typ: Hier ist achse fachlich immer belegt (beide
  // Zweige oberhalb kehren vorher zurueck).
  if (achse === null) {
    return <div data-testid="vorschau-leer" />
  }

  const abschnitt = findeAbschnitt(achse, stand.frame)
  const lokal = abschnitt !== null ? lokalerFrame(abschnitt, stand.frame) : 0

  // ENTSCHIEDEN 2: ohne Voraussetzungen kein Auswahlversuch und kein Zeichen -
  // die Buehne bleibt leer und der Transport bleibt bedienbar.
  const schriftenBereit = props.voraussetzungen !== null
  const bild =
    props.voraussetzungen === null
      ? null
      : waehleVorschaubild(
          props.projekt,
          abschnitt,
          lokal,
          props.voraussetzungen.vorlagen,
          kaputteStellen,
          schriftenBereit,
        )

  // Die Auflösung (TK 9.15.4): Rahmen STABIL aus der Project-Standardmarke, Inhalt
  // wechselt je Element (steht die Marke nicht bereit: NICHT zeichnen, #312).
  const rahmenMarke = holeBereiteMarke(props.projekt.standardMarkeId)

  let buehneninhalt = null
  if (bild !== null) {
    switch (bild.art) {
      case 'video':
        buehneninhalt = (
          <Video
            projektId={props.projekt.id}
            dateiname={bild.dateiname}
            assetId={bild.assetId}
            trimStart={bild.trimStart}
            trimEnde={bild.trimEnde}
            lokalerFrame={lokal}
            laeuft={stand.laeuft}
          />
        )
        break
      case 'segment':
        if (rahmenMarke !== null) {
          const marke = holeBereiteMarke(bild.aktion.markeId)
          if (marke !== null) {
            // ACHTUNG: SegmentProps fuehrt KEIN `rahmenMarke`-Prop (built-Stand #217/#310
            // weicht vom abgeschriebenen Vertrag ab - gemeldet an #313); es reicht
            // intern (marke, marke). Die abschnittMarke ist hier die Pflichtangabe.
            buehneninhalt = (
              <Segment
                aktion={bild.aktion}
                vorlage={bild.vorlage}
                marke={marke}
              />
            )
          }
        }
        break
      case 'split':
        if (rahmenMarke !== null) {
          const abschnittMarke = bild.bandAktion !== null ? holeBereiteMarke(bild.bandAktion.markeId) : null
          buehneninhalt = (
            <Split
              projektId={props.projekt.id}
              dateiname={bild.dateiname}
              assetId={bild.assetId}
              trimStart={bild.trimStart}
              trimEnde={bild.trimEnde}
              lokalerFrame={lokal}
              laeuft={stand.laeuft}
              rahmenMarke={rahmenMarke}
              abschnittMarke={abschnittMarke}
              bandVorlage={bild.bandVorlage}
              bandAktion={bild.bandAktion}
            />
          )
        }
        break
      case 'einblendung':
        if (rahmenMarke !== null) {
          const abschnittMarke = bild.bandAktion !== null ? holeBereiteMarke(bild.bandAktion.markeId) : null
          buehneninhalt = (
            <Einblendung
              projektId={props.projekt.id}
              dateiname={bild.dateiname}
              assetId={bild.assetId}
              trimStart={bild.trimStart}
              trimEnde={bild.trimEnde}
              lokalerFrame={lokal}
              laeuft={stand.laeuft}
              rahmenMarke={rahmenMarke}
              abschnittMarke={abschnittMarke}
              bandVorlage={bild.bandVorlage}
              bandAktion={bild.bandAktion}
            />
          )
        }
        break
      case 'platzhalter':
        // Der Platzhalter zeigt einen DEFEKT an und gehoert zum stabilen Rahmen:
        // er bekommt die RAHMEN-Marke, nicht die wechselnde (Signatur #242/#313).
        if (rahmenMarke !== null) {
          buehneninhalt = <Platzhalter grund={bild.grund} marke={rahmenMarke} titel={bild.titel} />
        }
        break
      default:
        // art: 'leer' - die Buehne bleibt leer, kein Text, kein Ersatzbild.
        buehneninhalt = null
    }
  }

  const markiert = markierterIndex(stand, achse)

  return (
    // #419: Die Wurzel FUeLLT den ihr gegebenen Buehnenplatz (in #244 ist das BUEHNE_OBEN
    // mit 38 % Hoehe). Ohne definite Hoehe kollabierte die Buehne (height:100%) auf 0 -
    // das Video war da, aber unsichtbar. Deshalb: Flex-Spalte, Buehne waechst, Transport
    // nimmt seine Eigenhoehe.
    <div
      data-testid="vorschau"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, gap: 4 }}
    >
      <div style={{ flex: '1 1 auto', minHeight: 0 }}>
        <Buehne>{buehneninhalt}</Buehne>
      </div>
      <div data-testid="vorschau-transport" style={{ flex: '0 0 auto' }}>
        <button
          data-testid="vorschau-play-pause"
          onClick={() => {
            setStand((bisher) => (bisher.laeuft ? pausiere(bisher) : spieleAb(bisher, achse)))
          }}
        >
          {stand.laeuft ? 'Pause' : 'Play'}
        </button>
        <input
          data-testid="vorschau-zeitleiste"
          type="range"
          min={0}
          max={achse.gesamtFrames}
          value={stand.frame}
          onChange={(ereignis) => {
            setStand((bisher) =>
              springeZuFrame(bisher, achse, Number(ereignis.target.value)),
            )
          }}
        />
        <span data-testid="vorschau-gesamt">{formatiereLaenge(achse.gesamtSekunden)}</span>
        <div data-testid="vorschau-elemente">
          {achse.abschnitte.map((stellenabschnitt) => (
            <button
              key={stellenabschnitt.elementId}
              data-testid={`vorschau-element-${stellenabschnitt.index}`}
              data-markiert={markiert === stellenabschnitt.index ? 'true' : 'false'}
              onClick={() => setStand((bisher) => springeZuElement(bisher, achse, stellenabschnitt.index))}
            >
              {stellenabschnitt.index}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
