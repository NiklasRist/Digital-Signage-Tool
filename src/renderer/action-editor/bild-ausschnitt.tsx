// [action-editor] Bildausschnitt: Zoom und Richtung (05.11.2026, Nacharbeit 2)
//
// WARUM DIE SCHIEBEREGLER WEG SIND: Niklas, 05.11.2026: „seitlich und hoch tief bei dem
// bildausschnitt sind fucking weird". Sie waren es aus zwei Gründen: Bei Zoom 100 % hat das
// Verschieben KEINE Wirkung (das Bild ist genau so groß wie die Zone), und zwei Prozent-
// Schieberegler sagen nicht, wohin das Bild eigentlich wandert.
//
// JETZT: ein Zoom-Regler und ein RICHTUNGSFELD mit neun Pfeilen. Ein Pfeil heisst „schieb
// das Bild dorthin" - dieselbe Handbewegung wie beim Ziehen eines Fotos. Das Feld ist
// gesperrt, solange nicht gezoomt ist, und sagt dann auch warum.
//
// Der Versatz bleibt im Datenmodell prozentual (`versatzX`/`versatzY`, ±50 % der
// Zonengroesse): Derselbe Wert wirkt in der 960 breiten Spalte und im Vollbild gleich weit.

import type { BildAusschnitt } from '../../shared/contracts/aktion'
import type { JSX } from 'react'
import { GESTALTUNG_GRENZEN } from '../../shared/gestaltung'

/** Der Wert, den die Vorlage ohne eigene Wahl zeichnet: Zoom 100 %, Mitte. */
const OHNE_WAHL = { zoom: GESTALTUNG_GRENZEN.zoom.min, versatzX: 0, versatzY: 0 } as const

/** Ein Klick auf einen Pfeil setzt den vollen Ausschlag - die Mitte ist 0. */
const AUSSCHLAG = GESTALTUNG_GRENZEN.versatz.max

type Waagerecht = 'links' | 'mitte' | 'rechts'
type Senkrecht = 'oben' | 'mitte' | 'unten'

const PFEILE: Record<Waagerecht, Record<Senkrecht, { zeichen: string; x: number; y: number }>> = {
  links: {
    oben: { zeichen: '↖', x: -AUSSCHLAG, y: -AUSSCHLAG },
    mitte: { zeichen: '←', x: -AUSSCHLAG, y: 0 },
    unten: { zeichen: '↙', x: -AUSSCHLAG, y: AUSSCHLAG },
  },
  mitte: {
    oben: { zeichen: '↑', x: 0, y: -AUSSCHLAG },
    mitte: { zeichen: '·', x: 0, y: 0 },
    unten: { zeichen: '↓', x: 0, y: AUSSCHLAG },
  },
  rechts: {
    oben: { zeichen: '↗', x: AUSSCHLAG, y: -AUSSCHLAG },
    mitte: { zeichen: '→', x: AUSSCHLAG, y: 0 },
    unten: { zeichen: '↘', x: AUSSCHLAG, y: AUSSCHLAG },
  },
}

const ZEILEN: readonly Senkrecht[] = ['oben', 'mitte', 'unten']
const SPALTEN: readonly Waagerecht[] = ['links', 'mitte', 'rechts']

export function BildAusschnittRegler({
  ausschnitt,
  aufAendern,
}: {
  ausschnitt: BildAusschnitt | null | undefined
  aufAendern: (ausschnitt: BildAusschnitt | null) => void
}): JSX.Element {
  const zoom = ausschnitt?.zoom ?? OHNE_WAHL.zoom
  const versatzX = ausschnitt?.versatzX ?? OHNE_WAHL.versatzX
  const versatzY = ausschnitt?.versatzY ?? OHNE_WAHL.versatzY
  const eigeneWahl = zoom !== OHNE_WAHL.zoom || versatzX !== 0 || versatzY !== 0
  // Ohne Zoom hat das Verschieben keine Wirkung - dann ist das Feld gesperrt und sagt es.
  const verschiebbar = zoom > OHNE_WAHL.zoom

  /** EINEN Wert setzen. Stehen danach alle drei auf dem Vorlagenwert, faellt der ganze
   *  Ausschnitt weg - „nichts eingestellt" ist kein gespeicherter Zustand. */
  function setze(feld: keyof BildAusschnitt, wert: number): void {
    const neu = { zoom, versatzX, versatzY, [feld]: wert }
    const istVorlage = neu.zoom === OHNE_WAHL.zoom && neu.versatzX === 0 && neu.versatzY === 0
    aufAendern(istVorlage ? null : neu)
  }

  return (
    <div data-testid="aktion-ausschnitt" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 600 }}>Bildausschnitt</span>
      {/* Der Satz steht hier, weil die Regler zuerst AUCH das Logo bewegten (Niklas,
          05.11.2026). Seit der Korrektur gilt der Ausschnitt nur noch fuer das Motiv der
          Aktion - der Satz sagt das, damit niemand es fuer einen Fehler haelt. */}
      <span style={{ fontSize: 11, color: '#9aa4b2' }}>
        Gilt nur für das Bild der Aktion – das Logo bleibt unverändert.
      </span>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
        Zoom
        <input
          type="range"
          data-testid="aktion-ausschnitt-zoom"
          aria-label="Zoom des Bildes"
          min={GESTALTUNG_GRENZEN.zoom.min}
          max={GESTALTUNG_GRENZEN.zoom.max}
          step={5}
          value={zoom}
          style={{ flex: '1 1 auto', minWidth: 0 }}
          onChange={(ereignis) => {
            const wert = Number(ereignis.target.value)
            // Zurueck auf 100 % heisst: es gibt keinen Ausschnitt mehr. Ein Versatz ohne
            // Zoom waere ein gespeicherter Wert ohne Wirkung.
            if (wert === OHNE_WAHL.zoom) {
              aufAendern(null)
              return
            }
            setze('zoom', wert)
          }}
        />
        <span style={{ color: '#9aa4b2' }}>{`${String(zoom)} %`}</span>
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 11, color: verschiebbar ? '#e6e6e6' : '#9aa4b2' }}>
          {verschiebbar ? 'Bild verschieben' : 'Bild verschieben – erst zoomen'}
        </span>
        <div
          data-testid="aktion-ausschnitt-richtung"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2,
            width: 108,
            opacity: verschiebbar ? 1 : 0.4,
          }}
        >
          {ZEILEN.map((zeile) =>
            SPALTEN.map((spalte) => {
              const pfeil = PFEILE[spalte][zeile]
              const aktiv = versatzX === pfeil.x && versatzY === pfeil.y
              return (
                <button
                  key={`${spalte}-${zeile}`}
                  type="button"
                  data-testid={`aktion-ausschnitt-richtung-${spalte}-${zeile}`}
                  aria-label={`Bild ${zeile} ${spalte} verschieben`}
                  aria-pressed={aktiv}
                  disabled={!verschiebbar}
                  onClick={() => {
                    aufAendern({ zoom, versatzX: pfeil.x, versatzY: pfeil.y })
                  }}
                  style={{
                    height: 24,
                    padding: 0,
                    border: aktiv ? '2px solid #6ea8fe' : '1px solid #444',
                    cursor: verschiebbar ? 'pointer' : 'not-allowed',
                  }}
                >
                  {pfeil.zeichen}
                </button>
              )
            }),
          )}
        </div>
      </div>

      {eigeneWahl && (
        <button
          type="button"
          data-testid="aktion-ausschnitt-zuruecksetzen"
          onClick={() => {
            aufAendern(null)
          }}
        >
          Wie die Vorlage
        </button>
      )}
    </div>
  )
}
