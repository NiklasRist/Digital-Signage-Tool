// Handgeschrieben zu Issue #212 - der zweite Baustein des Issues (die reine Rechnung steht
// in `buehne-skalierung.ts`, das Geruest-Werkzeug fasst je Issue nur die ERSTE Zieldatei an).
// DÜNN: Die Buehne ist ausschliesslich ein Rahmen. Sie zeigt keinen Inhalt an, den sie
// selbst aussucht, und zeichnet nichts - kein canvas, kein video, kein img (Verbot).

import type { JSX, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { Buehnenmaße } from './buehne-skalierung'
import { berechneBuehnenmaße } from './buehne-skalierung'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

export interface BuehneProps {
  /**
   * Der Inhalt der Bühne. Er positioniert sich mit `position: absolute` in ABSOLUTEN Pixeln des
   * 1920×1080-Rasters – die Bühne skaliert ihn als Ganzes.
   */
  children?: ReactNode
  /**
   * Nur für Tests und Sonderfälle: äußere Maße vorgeben, statt sie zu messen. Ist der Wert
   * gesetzt, wird NICHT gemessen.
   */
  maße?: Buehnenmaße
}

/**
 * Die Bühne ist ausschließlich ein Rahmen (TK 9.9.1, 9.10.3 Punkt 1): die innere Fläche ist
 * immer exakt RENDER_PROFILE.breite × RENDER_PROFILE.hoehe CSS-Pixel gross und wird per
 * `transform: scale(...)` auf den gemessenen äußeren Kasten verkleinert - nie ueber
 * width/height, nie in einer zweiten Zeichenauflösung (ENTSCHIEDEN 4).
 *
 * Zustand: genau die gemessenen Maße (Verbot „kein Zustand über den Rahmen hinaus").
 * `maße` ist gesetzt: dann wird NICHT gemessen (Signatur).
 */
export function Buehne(props: BuehneProps): JSX.Element {
  // Nur EIN UseState fuer die gemessenen Maße (Verbot: kein Zustand ueber den Rahmen hinaus).
  const [gemessen, setzeGemessen] = useState<Buehnenmaße | null>(null)
  const kasten = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // `maße` ist gesetzt: nicht messen (Signatur). Der Beobachter wird gar nicht erst
    // angemeldet - es gibt dann nichts abzumelden.
    if (props.maße) {
      return
    }
    const element = kasten.current
    if (!element) {
      return
    }

    // Der Größen-Beobachter des äußeren Kastens - DIE EINE Anmeldung dieser Datei
    // (Invariante 2). Steht er in der Laufzeitumgebung nicht zur Verfügung, bleibt die
    // Bühne bei skalierung: 0 und zeichnet nichts (Fehlerpfad) - kein Rückfall auf
    // window.innerWidth, kein Messen per Zeitgeber.
    const beobachter = new ResizeObserver((eintraege) => {
      const eintrag = eintraege[0]
      if (!eintrag) {
        return
      }
      // ENTSCHIEDEN 3: Beim ersten Rendervorgang steht die Größe noch nicht fest - dann
      // liefert `berechneBuehnenmaße` lauter Nullen (skalierung 0, unsichtbar).
      setzeGemessen(berechneBuehnenmaße(eintrag.contentRect.width, eintrag.contentRect.height))
    })
    beobachter.observe(element)

    // Invariante 2: Jedes Abonnement wird abgemeldet. Wer sich beim Aufbau anmeldet und
    // beim Abbau nicht abmeldet, haelt nach zwanzig Reiterwechseln zwanzig Beobachter.
    return () => {
      beobachter.disconnect()
    }
  }, [props.maße])

  const maße = props.maße ?? gemessen ?? NULLMAßE

  return (
    // Der äußere Kasten: misst, füllt den verfügbaren Platz, schwarz (ENTSCHIEDEN 5).
    // `overflow: hidden` gehört zur Skalierung (ENTSCHIEDEN 4).
    <div
      ref={kasten}
      data-testid="buehne-kasten"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        overflow: 'hidden',
      }}
    >
      {/* Die innere Fläche: exakt RENDER_PROFILE.breite × hoehe CSS-Pixel gross; die
          Verkleinerung steht in transform, NICHT in width/height (DoD). */}
      <div
        data-testid="buehne-flaeche"
        style={{
          position: 'absolute',
          left: `${maße.versatzX}px`,
          top: `${maße.versatzY}px`,
          width: `${RENDER_PROFILE.breite}px`,
          height: `${RENDER_PROFILE.hoehe}px`,
          transformOrigin: 'top left',
          transform: `scale(${maße.skalierung})`,
        }}
      >
        {props.children}
      </div>
    </div>
  )
}

/** Die Maße beim noch nicht gemessenen Zustand - skalierung 0, unsichtbar (ENTSCHIEDEN 3). */
const NULLMAßE: Buehnenmaße = { skalierung: 0, breite: 0, höhe: 0, versatzX: 0, versatzY: 0 }