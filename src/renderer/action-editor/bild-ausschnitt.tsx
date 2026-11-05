// [action-editor] Bildausschnitt: Zoom und Position des Motivs (05.11.2026, TK 9.8.8)
//
// WARUM ES DIESE DATEI GIBT: Bis hierher bestimmte allein die VORLAGE, wie das Bild in
// seiner Zone sitzt - „Ganzflächig" fuellt die Flaeche, „Zwei Spalten" zeigt das ganze
// Produkt. Ein Produktfoto, das im Original viel Rand hat, war damit nicht zu retten.
// Niklas, 05.11.2026: „man hat momentan einfach keine Kontrolle".
//
// DIE REGLER BEWEGEN DAS BILD, NICHT DIE ZONE: Der Rahmen bleibt, wo die Vorlage ihn
// hat; gezoomt und verschoben wird der INHALT. Deshalb kann kein Regler Inhalte in die
// Nachbarzone schieben - das Zeichnen beschneidet an der Zonengrenze
// (`template-canvas/zone-bild.ts`).
//
// Der Versatz ist in PROZENT der Zonengroesse angegeben, nicht in Pixeln: Derselbe Wert
// soll in der 960 breiten Spalte von „Zwei Spalten" und im 1920 breiten Vollbild gleich
// weit wirken. Die Grenzen stehen in `shared/gestaltung.ts` - dieselbe Quelle, die der
// Speicher prueft.

import type { BildAusschnitt } from '../../shared/contracts/aktion'
import type { JSX } from 'react'
import { GESTALTUNG_GRENZEN } from '../../shared/gestaltung'

/** Der Wert, den die Vorlage ohne eigene Wahl zeichnet: Zoom 100 %, Mitte. */
const OHNE_WAHL = { zoom: GESTALTUNG_GRENZEN.zoom.min, versatzX: 0, versatzY: 0 } as const

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

  /** EINEN Regler setzen. Stehen danach alle drei auf dem Vorlagenwert, faellt der
   *  ganze Ausschnitt weg - „nichts eingestellt" ist kein gespeicherter Zustand. */
  function setze(feld: keyof BildAusschnitt, wert: number): void {
    const neu: Required<BildAusschnitt> = {
      zoom,
      versatzX,
      versatzY,
      [feld]: wert,
    }
    const istVorlage =
      neu.zoom === OHNE_WAHL.zoom && neu.versatzX === 0 && neu.versatzY === 0
    aufAendern(istVorlage ? null : neu)
  }

  return (
    <div data-testid="aktion-ausschnitt" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 600 }}>Bildausschnitt</span>

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
          onChange={(ereignis) => {
            setze('zoom', Number(ereignis.target.value))
          }}
        />
        <span style={{ color: '#9aa4b2' }}>{`${String(zoom)} %`}</span>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
        Seitlich
        <input
          type="range"
          data-testid="aktion-ausschnitt-x"
          aria-label="Bild seitlich verschieben"
          min={GESTALTUNG_GRENZEN.versatz.min}
          max={GESTALTUNG_GRENZEN.versatz.max}
          step={5}
          value={versatzX}
          onChange={(ereignis) => {
            setze('versatzX', Number(ereignis.target.value))
          }}
        />
        <span style={{ color: '#9aa4b2' }}>{`${String(versatzX)} %`}</span>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
        Hoch/tief
        <input
          type="range"
          data-testid="aktion-ausschnitt-y"
          aria-label="Bild hoch oder tief verschieben"
          min={GESTALTUNG_GRENZEN.versatz.min}
          max={GESTALTUNG_GRENZEN.versatz.max}
          step={5}
          value={versatzY}
          onChange={(ereignis) => {
            setze('versatzY', Number(ereignis.target.value))
          }}
        />
        <span style={{ color: '#9aa4b2' }}>{`${String(versatzY)} %`}</span>
      </label>

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
