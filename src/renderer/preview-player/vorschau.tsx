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
// Geometrie #218/#219, Dauer #127). Die Bedienung zeigt Play/Pause, +-5 s,
// Position/Gesamt, Ton, Vollbild, Kapitelmarken und die Element-Nummern - keine
// Geschwindigkeit, kein Autoplay (Entscheidung 22.10.2026).
//
// #443 (Entscheidung 29.10.2026): Die Bedienung liegt als OVERLAY ueber dem Bild und
// blendet aus; die feste Leiste darunter ist entfallen - das Bild bekommt ihre Hoehe.
// Der TON ist ein Hoer-Behelf auf die QUELLE und startet STUMM; die Ausgabe bleibt
// still (TK 9.2.4, AD R-06), der Hinweis steht dauerhaft in der Leiste. Ton und
// Leiste sind Oberflaeche, keine Fachlichkeit: Die Regeln liegen in `bedienung.ts`
// und `transport.ts`, hier steht nur der Zustand (wie ENTSCHIEDEN 11).
//
// #426 (TK 9.2.9): Laeuft ein Einschub, bleibt dasselbe <video> MONTIERT (an der
// Zeitstelle pausiert) und die AKTION liegt als eigene Flaeche darueber - kein
// Neuaufbau, kein Neuladen des Mediums beim Wechsel Video <-> Einschub.

import type { JSX } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Project } from '../../shared/contracts/project'
import type { Zeichenvoraussetzungen } from '../composer/zeichen-vorbereitung'
import { holeBereiteMarke } from '../gemeinsam/marken-bereitstellung'
import { Buehne } from './buehne'
import { Video } from './video'
import { Segment } from './segment'
import { Einblendung } from './einblendung'
import { Platzhalter } from './platzhalter'
import { baueZeitachse, findeAbschnitt, lokalerFrame } from './zeitachse'
import {
  baueTransport,
  pausiere,
  spieleAb,
  springeUmSekunden,
  springeZuElement,
  springeZuFrame,
  tick,
} from './transport'
import { Transportleiste } from './transportleiste'
import { TON_STAND, schalteTonUm, setzeLautstaerke } from './bedienung'
import { findeKaputteStellen } from '../composer/kaputt-erkennung'
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

/** #443: Ruhe, nach der die Bedienleiste WAEHREND des Abspielens ausblendet. */
const AUSBLENDE_MS = 3000

export function Vorschau(props: VorschauProps): JSX.Element {
  const [stand, setStand] = useState(() => baueTransport())
  const letzterMsRef = useRef<number | null>(null)
  const anlaufRef = useRef<number | null>(null)

  // #443: Ton und Leiste. Der Ton startet STUMM (Entscheidung 29.10.2026) - `TON_STAND`
  // ist die einzige Quelle dieses Anfangswerts.
  const [ton, setTon] = useState(TON_STAND)
  const [bedienungSichtbar, setBedienungSichtbar] = useState(true)
  const [istVollbild, setIstVollbild] = useState(false)
  const [vollbildMoeglich, setVollbildMoeglich] = useState(false)
  const wurzelRef = useRef<HTMLDivElement>(null)
  const ausblendeRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bildGedruecktRef = useRef(false)

  // ENTSCHIEDEN 1: die Achse kommt als WERT aus dem Einzigen Rechenort (#213).
  const achseErgebnis = useMemo(() => {
    if (props.projekt === null) return null
    return baueZeitachse(props.projekt.liste)
  }, [props.projekt])

  const kaputteStellen = useMemo(() => {
    if (props.projekt === null) return []
    // #338: Der Vorschau fehlt der Marken-Bestand - sie prueft die Marken-Referenzen
    // deshalb NICHT (null = unbekannt). Fuer das Zeichnen ist das folgenlos: Eine
    // fehlende Marke aendert die Pixel nicht, sondern nur die Zeichenbarkeit des
    // Segments, und die entscheidet der composer.
    return findeKaputteStellen(props.projekt, null)
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

  // #443: Die Leiste verschwindet nach kurzer Ruhe WAEHREND des Abspielens. Das ist
  // KEIN zweiter Taktgeber (ENTSCHIEDEN 7 verbietet einen zweiten Takt fuer die UHR):
  // Der Zeitgeber blendet nur die Bedienung aus und liest nie die Zeit.
  useEffect(() => {
    if (ausblendeRef.current !== null) {
      clearTimeout(ausblendeRef.current)
      ausblendeRef.current = null
    }
    if (!stand.laeuft) {
      // In der Pause wird wieder eingeblendet (der Knopf war ja gerade da); ob sie
      // stehen bleibt, entscheidet erst die Mausbewegung - das Bild ist die Arbeit.
      setBedienungSichtbar(true)
      return
    }
    ausblendeRef.current = setTimeout(() => {
      ausblendeRef.current = null
      setBedienungSichtbar(false)
    }, AUSBLENDE_MS)
    return () => {
      if (ausblendeRef.current !== null) {
        clearTimeout(ausblendeRef.current)
        ausblendeRef.current = null
      }
    }
  }, [stand.laeuft])

  // #443: Vollbild kann nur die UMGEBUNG sagen, nicht das Bauteil - jsdom kennt
  // `requestFullscreen` gar nicht, Electron kennt es. Fehlt es, ist der Knopf
  // ABGESCHALTET (nicht unsichtbar): Ein Knopf, der nichts tut, waere eine Luege.
  useEffect(() => {
    setVollbildMoeglich(typeof wurzelRef.current?.requestFullscreen === 'function')
  }, [])

  useEffect(() => {
    const wechsel = (): void => setIstVollbild(document.fullscreenElement === wurzelRef.current)
    document.addEventListener('fullscreenchange', wechsel)
    return () => document.removeEventListener('fullscreenchange', wechsel)
  }, [])

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

  // #443: Die Leiste meldet nur ABSICHTEN; zu Uebergaengen werden sie hier - dem
  // EINEN Ort des Stands (ENTSCHIEDEN 11). `achse` ist ab hier belegt (die Zweige
  // oberhalb kehren vorher zurueck).
  const spieleOderPausiere = (): void => {
    setStand((bisher) => (bisher.laeuft ? pausiere(bisher) : spieleAb(bisher, achse)))
  }

  const schalteVollbild = (): void => {
    const element = wurzelRef.current
    if (element === null) return
    if (document.fullscreenElement !== null) {
      if (typeof document.exitFullscreen !== 'function') return
      const struktur = document.exitFullscreen()
      if (struktur && typeof struktur.catch === 'function') struktur.catch(() => undefined)
      return
    }
    // Fehlt die Faehigkeit, ist der Knopf abgeschaltet (s. Effekt oben) - hier steht
    // nur der zweite Riegel fuer eine Umgebung, die sich anders verhaelt.
    if (typeof element.requestFullscreen !== 'function') return
    const struktur = element.requestFullscreen()
    if (struktur && typeof struktur.catch === 'function') struktur.catch(() => undefined)
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

  // #426 (TK 9.2.9): Laeuft hier ein Einschub, tritt die AKTION an die Stelle des Videos,
  // das an der Zeitstelle PAUSIERT ist. `lokalerBildFrame` ist dann der Frame im gezeigten
  // VIDEO-Teil, `videoLaeuft` falsch - so bleibt dasselbe <video> montiert und springt nicht.
  const videoartig =
    bild !== null && (bild.art === 'video' || bild.art === 'einblendung')
  const einschub = videoartig ? bild.zerlegung?.einschub ?? null : null
  const lokalerBildFrame = videoartig ? bild.zerlegung?.lokalerFrame ?? lokal : lokal
  const videoLaeuft = einschub === null ? stand.laeuft : false

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
            lokalerFrame={lokalerBildFrame}
            laeuft={videoLaeuft}
            stumm={ton.stumm}
            lautstaerke={ton.lautstaerke}
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
              lokalerFrame={lokalerBildFrame}
              laeuft={videoLaeuft}
              stumm={ton.stumm}
              lautstaerke={ton.lautstaerke}
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

  // #426: der Einschub selbst - eine vollflaechige Aktion ueber dem pausierten Video.
  // Die Marke kommt aus der AKTION (wie beim Segment), nicht aus der Standardmarke.
  let einschubBild = null
  if (einschub !== null && rahmenMarke !== null) {
    const marke = holeBereiteMarke(einschub.aktion.markeId)
    if (marke !== null) {
      einschubBild = (
        <div data-testid="preview-einschub" style={{ position: 'absolute', inset: 0 }}>
          <Segment aktion={einschub.aktion} vorlage={einschub.vorlage} marke={marke} />
        </div>
      )
    }
  }

  // #443: Die Leiste erscheint bei Mausbewegung und blendet nur WAEHREND des
  // Abspielens nach AUSBLENDE_MS aus. Verlaesst der Zeiger das Bild, ist sie sofort
  // weg - anders als bei YouTube: Dort ist das Video das Ergebnis, hier ist das BILD
  // die Arbeit, und eine stehende Leiste verdeckt sie. Der Zeitgeber ist KEIN
  // Taktgeber (ENTSCHIEDEN 7) - er liest die Zeit nicht, er blendet nur.
  const zeigeBedienung = (): void => {
    if (!bedienungSichtbar) setBedienungSichtbar(true)
    if (ausblendeRef.current !== null) {
      clearTimeout(ausblendeRef.current)
      ausblendeRef.current = null
    }
    if (stand.laeuft) {
      ausblendeRef.current = setTimeout(() => {
        ausblendeRef.current = null
        setBedienungSichtbar(false)
      }, AUSBLENDE_MS)
    }
  }

  const verlasseBild = (): void => {
    if (ausblendeRef.current !== null) {
      clearTimeout(ausblendeRef.current)
      ausblendeRef.current = null
    }
    setBedienungSichtbar(false)
  }

  return (
    // #419: Die Wurzel FUeLLT den ihr gegebenen Buehnenplatz (in #244 ist das BUEHNE_OBEN
    // mit 38 % Hoehe). Ohne definite Hoehe kollabierte die Buehne (height:100%) auf 0 -
    // das Video war da, aber unsichtbar. Deshalb: Flex-Spalte, die Bildflaeche waechst.
    <div
      ref={wurzelRef}
      data-testid="vorschau"
      onMouseMove={zeigeBedienung}
      onMouseLeave={verlasseBild}
      onPointerDown={(ereignis) => {
        // #443: Der Bildklick zaehlt nur, wenn der Druck AUF DEM BILD begann. Zieht man
        // am Balken und laesst ueber dem Bild los, feuert der Klick auf dem gemeinsamen
        // Vorfahren - ohne diese Merkung schaltete die Wiedergabe dabei um.
        // SAFETY: React liefert als target ein Element des Dokuments oder null; beide
        // Faelle behandelt die naechste Zeile, und `closest` gibt es auf jedem Element.
        const ziel = ereignis.target as Element | null
        bildGedruecktRef.current =
          ziel === null || ziel.closest('[data-testid="vorschau-transport"]') === null
      }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}
    >
      <div
        data-testid="vorschau-bildflaeche"
        onClick={() => {
          if (bildGedruecktRef.current) spieleOderPausiere()
        }}
        style={{ flex: '1 1 auto', minHeight: 0, position: 'relative' }}
      >
        <Buehne>
          {buehneninhalt}
          {einschubBild}
        </Buehne>
        <Transportleiste
          stand={stand}
          achse={achse}
          sichtbar={bedienungSichtbar}
          ton={ton}
          vollbildMoeglich={vollbildMoeglich}
          istVollbild={istVollbild}
          aufPlayPause={spieleOderPausiere}
          aufSpringen={(frame) => setStand((bisher) => springeZuFrame(bisher, achse, frame))}
          aufSpringeUmSekunden={(sekunden) =>
            setStand((bisher) => springeUmSekunden(bisher, achse, sekunden))
          }
          aufElement={(index) => setStand((bisher) => springeZuElement(bisher, achse, index))}
          aufTonUmschalten={() => setTon((bisher) => schalteTonUm(bisher))}
          aufLautstaerke={(wert) => setTon((bisher) => setzeLautstaerke(bisher, wert))}
          aufVollbild={schalteVollbild}
        />
      </div>
    </div>
  )
}
