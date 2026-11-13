// [action-editor] Der Schalter „Freistellen" (13.11.2026, FA-29 / TK 9.21.6)
//
// WARUM DER SCHALTER HIER STEHT: Er veraendert das FOTO, nicht die Vorlage - dieselbe
// Gruppierung wie Helligkeit, Kontrast und Schaerfe (9.21.6: „Gruppe Aufbereitung mit
// drei Reglern und EINEM Schalter Freistellen").
//
// DAS MODELL WIRD ERST BEIM ERSTEN EINSCHALTEN GELADEN (9.21.5) - nicht beim Start der
// App. Der erste Klick dauert deshalb laenger; solange laeuft ein Klartext, und der
// Schalter ist gesperrt, damit niemand zweimal klickt und zwei Ladevorgaenge startet.
//
// EIN AUSFALL IST EIN ZUSTAND, KEIN ABSTURZ (9.21.5): Fehlt das Modell oder laedt es
// nicht, steht EIN Klartext am Schalter, der Schalter ist gesperrt, das Feld bleibt auf
// „aus", und jede andere Funktion laeuft. Kein stiller Klick, keine Fehlermeldung im
// Nichts.
//
// WARUM DER KLARTEXT AUS `freistellen.ts` KOMMT: Er ist dieselbe Zusage, die der
// Renderweg prueft. Zwei Texte fuer denselben Zustand waeren zwei Wahrheiten.

import { useState } from 'react'

import type { JSX } from 'react'

import { FREISTELL_KLARTEXT, freistellAusfall, ladeFreistellModell } from '../template-canvas/freistellen'

export function FreistellSchalter({
  freistellen,
  rechnet,
  aufAendern,
}: {
  /** Der ENTWURF-Stand: nur `true` ist eingeschaltet. */
  freistellen: boolean | null | undefined
  /** Laeuft gerade eine Berechnung (Modell laden oder Bild rechnen)? */
  rechnet: boolean
  aufAendern: (wert: boolean) => void
}): JSX.Element {
  const eingeschaltet = freistellen === true
  const [laedt, setzeLaedt] = useState(false)
  const [ausfall, setzeAusfall] = useState<string | null>(() => freistellAusfall())

  async function schalte(an: boolean): Promise<void> {
    if (!an) {
      // Ausschalten ist immer moeglich - auch wenn das Modell fehlt. Der Weg zurueck
      // auf das Rechteck darf nie an einer gesperrten Taste haengen.
      aufAendern(false)
      return
    }
    if (ausfall !== null || laedt) return
    setzeLaedt(true)
    await ladeFreistellModell()
    setzeLaedt(false)
    const grund = freistellAusfall()
    if (grund !== null) {
      setzeAusfall(grund)
      return
    }
    // EIN Schalten ist EIN Zustandswechsel im Entwurf - und damit EIN Undo-Schritt
    // (9.21.6). Geschrieben wird erst beim Abschluss, wie bei jedem anderen Feld.
    aufAendern(true)
  }

  const gesperrt = ausfall !== null || laedt

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
        <input
          type="checkbox"
          data-testid="aktion-freistellen"
          aria-label="Hintergrund des Bildes freistellen"
          checked={eingeschaltet}
          disabled={gesperrt && !eingeschaltet}
          onChange={(ereignis) => {
            void schalte(ereignis.target.checked)
          }}
        />
        Freistellen
      </label>

      {laedt && (
        <span data-testid="aktion-freistellen-laedt" style={{ fontSize: 11, color: '#9aa4b2' }}>
          Modell wird geladen …
        </span>
      )}
      {!laedt && rechnet && eingeschaltet && (
        <span data-testid="aktion-freistellen-rechnet" style={{ fontSize: 11, color: '#9aa4b2' }}>
          Bild wird freigestellt …
        </span>
      )}
      {ausfall !== null && (
        <span
          data-testid="aktion-freistellen-hinweis"
          style={{ fontSize: 11, color: '#e0b341' }}
          title={ausfall}
        >
          {ausfall === '' ? FREISTELL_KLARTEXT : ausfall}
        </span>
      )}
      {ausfall === null && (
        <span style={{ fontSize: 11, color: '#9aa4b2' }}>
          Der Hintergrund wird durchsichtig – die Fläche der Vorlage scheint durch.
        </span>
      )}
    </div>
  )
}
