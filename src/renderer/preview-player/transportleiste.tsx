// #443 - transportleiste.tsx: die Bedienung der Vorschau als Overlay ueber dem Bild
// (YouTube-Muster, Entscheidung 22.10.2026: Play/Pause, Scrubbing, Zeit, Ton,
// Vollbild, +-5 s; KEINE Geschwindigkeit, kein Autoplay).
//
// DIESES BAUTEIL RECHNET NICHTS UND HAELT NICHTS AUSSER DEM ZEIGER:
// Der Stand kommt als Parameter (#214: „Der Aufrufer haelt den Stand"), jeder Klick
// meldet eine ABSICHT zurueck. Die Uebergaenge liegen in `transport.ts` (#214),
// `bedienung.ts` (#443) und `zeit-anzeige.ts` (#443) - hier steht nur Anzeige.
//
// WARUM DER ZEIGER HIER STEHT: Er ist keine Fachlichkeit, sondern die Position des
// Mauszeigers in Pixeln; er ueberlebt keinen Umbau und wird nirgends gespeichert.
//
// WARUM DIE UNSICHTBARE RANGE-INPUT BLEIBT: Sie ist der Barrierefreiheits- und
// Tastaturweg (#387 kommt spaeter und findet hier ein echtes Ziel). Zeigerbedienung
// laeuft daneben auf dem Balken, weil die native Range den Klick auf die Spitze des
// Daumens bezieht - der Tooltip zeigte dann eine andere Zeit als der Sprung.
//
// DAS BILD IST DIE ARBEIT: Deshalb blendet die Leiste aus (die Vorschau entscheidet
// wann) - anders als bei YouTube bleibt sie auch in der Pause NICHT dauerhaft stehen.

import type { CSSProperties, JSX, PointerEvent as ReactPointerEvent } from 'react'
import { useRef, useState } from 'react'
import type { Zeitachse } from './zeitachse'
import { frameZuSekunden } from './zeitachse'
import type { TransportStand } from './transport'
import { markierterIndex } from './transport'
import type { TonStand } from './bedienung'
import { frameBeiAnteil } from './bedienung'
import { formatierePosition } from './zeit-anzeige'
import { formatiereLaenge } from '../composer/gesamtlaenge'
import {
  IconKnopf,
  SymbolPause,
  SymbolPlay,
  SymbolTonAn,
  SymbolTonAus,
  SymbolVollbildAn,
  SymbolVollbildAus,
  SymbolVor5,
  SymbolZurueck5,
} from './symbole'

export interface TransportleisteProps {
  stand: TransportStand
  achse: Zeitachse
  /** true = eingeblendet. WANN ausgeblendet wird, entscheidet die Vorschau (Hover/Autohide). */
  sichtbar: boolean
  ton: TonStand
  /** true, wenn die Umgebung Vollbild kann. false = der Knopf ist abgeschaltet, nicht unsichtbar. */
  vollbildMoeglich: boolean
  istVollbild: boolean
  aufPlayPause(): void
  /** Scrubbing: Ziel-Frame aus dem Balken (schon geklemmt von `frameBeiAnteil`). */
  aufSpringen(frame: number): void
  /** Die +-5-s-Tasten; die Klemme macht `springeUmSekunden` (#443). */
  aufSpringeUmSekunden(sekunden: number): void
  /** Sprung an den Anfang des Elements mit diesem Listen-Index (#214). */
  aufElement(index: number): void
  aufTonUmschalten(): void
  /** 0..1 - die Leiste rechnet Prozent -> Anteil, `setzeLautstaerke` klemmt (#443). */
  aufLautstaerke(wert: number): void
  aufVollbild(): void
}

const ZEILE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  minWidth: 0,
  // Umbruch statt Abschneiden: Bei schmalem Fenster verschwaende sonst der
  // Vollbild-Knopf hinter dem Rand - ein unsichtbarer Knopf ist schlimmer als zwei Zeilen.
  flexWrap: 'wrap',
}

/** Die Zeit steht in DEMSELBEN Formatierer (#127) - tabellarische Ziffern, damit sie nicht zappelt. */
const ZEIT: CSSProperties = { fontSize: 12, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }

/** Sprungweite der beiden Tasten; die Entscheidung vom 22.10.2026 nennt genau +-5 s. */
const SPRUNG_SEKUNDEN = 5

export function Transportleiste(p: TransportleisteProps): JSX.Element {
  const [zeiger, setZeiger] = useState<{ anteil: number; frame: number } | null>(null)
  // Die Range ist unsichtbar (Zeigerbedienung laeuft auf dem Balken). Damit sie kein
  // unsichtbares Tab-Ziel bleibt, zeigt ihr Fokus den Balken markiert an.
  const [tastaturFokus, setTastaturFokus] = useState(false)
  const zieht = useRef(false)

  const anteilJetzt =
    p.achse.gesamtFrames === 0
      ? 0
      : Math.min(Math.max(p.stand.frame / p.achse.gesamtFrames, 0), 1)

  const anteilAus = (ereignis: ReactPointerEvent<HTMLDivElement>): number => {
    const kasten = ereignis.currentTarget.getBoundingClientRect()
    if (kasten.width <= 0) return 0
    return (ereignis.clientX - kasten.left) / kasten.width
  }

  const merkeZeiger = (anteil: number): number => {
    const frame = frameBeiAnteil(anteil, p.achse)
    setZeiger({ anteil, frame })
    return frame
  }

  const lasseLos = (): void => {
    zieht.current = false
  }

  const markiert = markierterIndex(p.stand, p.achse)

  return (
    <div
      data-testid="vorschau-transport"
      data-sichtbar={p.sichtbar ? 'true' : 'false'}
      // Der Klick auf die Leiste darf NICHT das Bild treffen (Bildklick = Play/Pause).
      onClick={(ereignis) => ereignis.stopPropagation()}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: '14px 10px 6px',
        background:
          'linear-gradient(to top, rgba(0, 0, 0, 0.86), rgba(0, 0, 0, 0.45) 55%, rgba(0, 0, 0, 0))',
        color: '#ffffff',
        fontSize: 12,
        opacity: p.sichtbar ? 1 : 0,
        transition: 'opacity 150ms',
        pointerEvents: p.sichtbar ? 'auto' : 'none',
        zIndex: 2,
      }}
    >
      {/* Die Reihenfolge folgt der Frage, die man an den Player hat: links, was
          WIEDERGIBT (Play, Spruenge, Position) - rechts, WIE man es hoert und sieht
          (Ton, Vollbild). Die Weite der Spruenge traegt der Tooltip, nicht der Knopf. */}
      <div style={ZEILE}>
        <IconKnopf
          kennung="vorschau-play-pause"
          beschriftung={p.stand.laeuft ? 'Pause' : 'Play'}
          aufKlick={p.aufPlayPause}
        >
          {p.stand.laeuft ? <SymbolPause /> : <SymbolPlay />}
        </IconKnopf>
        <IconKnopf
          kennung="vorschau-zurueck-5"
          beschriftung={`${SPRUNG_SEKUNDEN} Sekunden zurueck`}
          aufKlick={() => p.aufSpringeUmSekunden(-SPRUNG_SEKUNDEN)}
        >
          <SymbolZurueck5 />
        </IconKnopf>
        <IconKnopf
          kennung="vorschau-vor-5"
          beschriftung={`${SPRUNG_SEKUNDEN} Sekunden vor`}
          aufKlick={() => p.aufSpringeUmSekunden(SPRUNG_SEKUNDEN)}
        >
          <SymbolVor5 />
        </IconKnopf>
        {/* #127: Position und Gesamtlaenge aus DEMSELBEN Formatierer - kein zweites Format
            in einer Zeile. Die bildgenaue Stelle steht im Tooltip (zeit-anzeige.ts). */}
        <span data-testid="vorschau-position" style={ZEIT}>
          {formatiereLaenge(frameZuSekunden(p.stand.frame))}
        </span>
        <span aria-hidden="true" style={ZEIT}>
          /
        </span>
        <span data-testid="vorschau-gesamt" style={ZEIT}>
          {formatiereLaenge(p.achse.gesamtSekunden)}
        </span>
        <span style={{ marginLeft: 'auto' }} />
        <IconKnopf
          kennung="vorschau-ton"
          beschriftung={p.ton.stumm ? 'Ton der Vorschau einschalten' : 'Ton der Vorschau ausschalten'}
          aufKlick={p.aufTonUmschalten}
        >
          {p.ton.stumm ? <SymbolTonAus /> : <SymbolTonAn />}
        </IconKnopf>
        <input
          data-testid="vorschau-lautstaerke"
          type="range"
          min={0}
          max={100}
          value={Math.round(p.ton.lautstaerke * 100)}
          onChange={(ereignis) => p.aufLautstaerke(Number(ereignis.target.value) / 100)}
          aria-label="Lautstaerke der Vorschau"
          style={{ width: 64 }}
        />
        <IconKnopf
          kennung="vorschau-vollbild"
          beschriftung={p.istVollbild ? 'Vollbild beenden' : 'Vollbild'}
          aufKlick={p.aufVollbild}
          abgeschaltet={!p.vollbildMoeglich}
        >
          {p.istVollbild ? <SymbolVollbildAus /> : <SymbolVollbildAn />}
        </IconKnopf>
      </div>

      {/* Der Balken: Zeigerbedienung LAEGT HIER (exakter Anteil); die Range darunter ist
          unsichtbar und dient nur Tastatur und Screenreader. */}
      <div
        data-testid="vorschau-balken"
        role="presentation"
        onPointerDown={(ereignis) => {
          zieht.current = true
          if (typeof ereignis.currentTarget.setPointerCapture === 'function') {
            try {
              ereignis.currentTarget.setPointerCapture(ereignis.pointerId)
            } catch {
              // Umgebungen ohne Zeigerfang (jsdom): Der Zug endet dann am Balkenrand.
            }
          }
          p.aufSpringen(merkeZeiger(anteilAus(ereignis)))
        }}
        onPointerMove={(ereignis) => {
          const frame = merkeZeiger(anteilAus(ereignis))
          if (zieht.current) p.aufSpringen(frame)
        }}
        onPointerUp={lasseLos}
        onPointerCancel={() => {
          lasseLos()
          setZeiger(null)
        }}
        onPointerLeave={() => {
          if (!zieht.current) setZeiger(null)
        }}
        style={{
          position: 'relative',
          height: 16,
          marginTop: 4,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          touchAction: 'none',
          outline: tastaturFokus ? '2px solid #ffffff' : 'none',
          outlineOffset: 2,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 4,
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: `${anteilJetzt * 100}%`,
            height: 4,
            background: '#ffffff',
            borderRadius: 2,
          }}
        />
        {/* Kapitelmarken = Elementgrenzen (#443): eine Orientierung, kein Ziel - die
            Ziele sind die Nummern darunter (groessere Trefferflaeche). */}
        {p.achse.abschnitte.slice(1).map((abschnitt) => (
          <div
            key={abschnitt.elementId}
            data-testid={`vorschau-kapitel-${abschnitt.index}`}
            style={{
              position: 'absolute',
              left: `${(abschnitt.startFrame / p.achse.gesamtFrames) * 100}%`,
              width: 1,
              height: 12,
              background: 'rgba(0, 0, 0, 0.6)',
            }}
          />
        ))}
        <div
          data-testid="vorschau-daumen"
          style={{
            position: 'absolute',
            left: `${anteilJetzt * 100}%`,
            width: 12,
            height: 12,
            marginLeft: -6,
            borderRadius: '50%',
            background: '#ffffff',
          }}
        />
        <input
          data-testid="vorschau-zeitleiste"
          type="range"
          min={0}
          max={p.achse.gesamtFrames}
          value={p.stand.frame}
          onChange={(ereignis) => p.aufSpringen(Number(ereignis.target.value))}
          onFocus={() => setTastaturFokus(true)}
          onBlur={() => setTastaturFokus(false)}
          aria-label="Position in der Vorschau"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            margin: 0,
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
        {zeiger !== null ? (
          <div
            data-testid="vorschau-zeiger"
            style={{
              position: 'absolute',
              left: `${zeiger.anteil * 100}%`,
              bottom: 20,
              transform: 'translateX(-50%)',
              padding: '2px 6px',
              borderRadius: 3,
              background: 'rgba(0, 0, 0, 0.85)',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {formatierePosition(zeiger.frame)}
          </div>
        ) : null}
      </div>

      {/* Die Element-Nummern bleiben erreichbar: Sie sind das SPRUNGZIEL, seit die feste
          Leiste unter dem Bild entfallen ist (Entscheidung 22.10.2026: Overlay).
          `flexWrap`: Ein Projekt mit 30 Elementen (Treiber-Schritt 4l) liefe sonst
          ueber die Buehnenbreite hinaus - die Leiste waechst lieber nach oben. */}
      <div
        data-testid="vorschau-elemente"
        style={{ ...ZEILE, gap: 4, marginTop: 2, flexWrap: 'wrap' }}
      >
        {p.achse.abschnitte.map((abschnitt) => (
          <button
            key={abschnitt.elementId}
            type="button"
            data-testid={`vorschau-element-${abschnitt.index}`}
            data-markiert={markiert === abschnitt.index ? 'true' : 'false'}
            onClick={() => p.aufElement(abschnitt.index)}
            style={{
              height: 20,
              minWidth: 20,
              padding: '0 4px',
              border: 'none',
              borderRadius: 4,
              fontSize: 10,
              cursor: 'pointer',
              // Nur das LAUFENDE Element traegt Farbe; die anderen sind leise, sonst
              // wird die Zeile eine Wand aus Kaesten und zieht mehr Blick als das Bild.
              background: markiert === abschnitt.index ? '#ffffff' : 'transparent',
              color: markiert === abschnitt.index ? '#000000' : '#ffffff',
              opacity: markiert === abschnitt.index ? 1 : 0.65,
            }}
          >
            {abschnitt.index}
          </button>
        ))}
        {/* Der Hinweis ist PFLICHT, nicht Schmuck: Die Ausgabe ist still (TK 9.2.4, AD R-06).
            Ohne ihn waere der Ton die Behauptung, das fertige Video habe Ton. Er steht
            hier, weil er KEIN Knopf ist - in der Knopfzeile wuerde er sie zerreissen. */}
        <span
          data-testid="vorschau-ton-hinweis"
          style={{ marginLeft: 'auto', opacity: 0.7, whiteSpace: 'nowrap', fontSize: 11 }}
        >
          Ausgabe bleibt stumm
        </span>
      </div>
    </div>
  )
}
