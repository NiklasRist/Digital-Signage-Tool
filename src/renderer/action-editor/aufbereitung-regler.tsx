// [action-editor] Aufbereitung des Motivs: Helligkeit, Kontrast, Schaerfe (13.11.2026, FA-28)
//
// WARUM DIE REGLER HIER STEHEN UND NICHT BEI DER VORLAGE: Sie veraendern das FOTO, nicht
// die Flaeche. Dieselbe Gruppierung wie beim Bildausschnitt (05.11.2026): was das Bild
// betrifft, steht beim Bild.
//
// WARUM DIE GRENZEN AUS `shared/aufbereitung.ts` KOMMEN: Das Formular darf keinen Wert
// anbieten, den der Speicher kappt - das waere eine stille Datenloeschung. Dieselbe Zahl
// gilt im Main, im Editor und beim Rechnen (TK 9.21.3).
//
// WARUM `0` UEBERALL „NICHTS TUN" HEISST: Helligkeit 0 und Kontrast 0 sind neutral,
// Schaerfe 0 ist aus. Stehen alle drei auf 0, faellt der ganze Wert weg (`null`) - es gibt
// keinen gespeicherten Zustand „alles auf 0", und ohne Einstellung ist das Segment
// byte-gleich zu vorher (TK 9.21.4).

import type { JSX } from 'react'
import type { BildAufbereitung } from '../../shared/contracts/aktion'
import { AUFBEREITUNG_GRENZEN, normalisiereAufbereitung } from '../../shared/aufbereitung'

/** Der Zustand ohne eigene Wahl – dieselbe Zahl in allen drei Reglern. */
const NEUTRAL = 0

export function AufbereitungRegler({
  aufbereitung,
  aufAendern,
}: {
  aufbereitung: BildAufbereitung | null | undefined
  aufAendern: (aufbereitung: BildAufbereitung | null) => void
}): JSX.Element {
  const sauber = normalisiereAufbereitung(aufbereitung)
  const helligkeit = sauber?.helligkeit ?? NEUTRAL
  const kontrast = sauber?.kontrast ?? NEUTRAL
  const schaerfe = sauber?.schaerfe ?? NEUTRAL
  const eigeneWahl = sauber !== null

  /** EINEN Wert setzen. Sind danach alle drei neutral, faellt der ganze Satz weg. */
  function setze(feld: 'helligkeit' | 'kontrast' | 'schaerfe', wert: number): void {
    aufAendern(
      normalisiereAufbereitung({
        helligkeit: feld === 'helligkeit' ? wert : helligkeit,
        kontrast: feld === 'kontrast' ? wert : kontrast,
        schaerfe: feld === 'schaerfe' ? wert : schaerfe,
      }),
    )
  }

  return (
    <div
      data-testid="aktion-aufbereitung"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        borderTop: '1px solid #333',
        paddingTop: 6,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600 }}>Aufbereitung</span>
      {/* Der Satz sagt die Zusage aus AD 4.13, damit niemand nach einem „Speichern" sucht:
          das Original bleibt, wie es ist. */}
      <span style={{ fontSize: 11, color: '#9aa4b2' }}>
        Gilt nur für das Bild der Aktion – das Original bleibt unverändert.
      </span>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
        Helligkeit
        <input
          type="range"
          data-testid="aktion-aufbereitung-helligkeit"
          aria-label="Helligkeit des Bildes"
          min={AUFBEREITUNG_GRENZEN.helligkeit.min}
          max={AUFBEREITUNG_GRENZEN.helligkeit.max}
          step={1}
          value={helligkeit}
          style={{ flex: '1 1 auto', minWidth: 0 }}
          onChange={(ereignis) => {
            setze('helligkeit', Number(ereignis.target.value))
          }}
        />
        <span style={{ color: '#9aa4b2', width: 42, textAlign: 'right' }}>
          {helligkeit > 0 ? `+${String(helligkeit)}` : String(helligkeit)}
        </span>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
        Kontrast
        <input
          type="range"
          data-testid="aktion-aufbereitung-kontrast"
          aria-label="Kontrast des Bildes"
          min={AUFBEREITUNG_GRENZEN.kontrast.min}
          max={AUFBEREITUNG_GRENZEN.kontrast.max}
          step={1}
          value={kontrast}
          style={{ flex: '1 1 auto', minWidth: 0 }}
          onChange={(ereignis) => {
            setze('kontrast', Number(ereignis.target.value))
          }}
        />
        <span style={{ color: '#9aa4b2', width: 42, textAlign: 'right' }}>
          {kontrast > 0 ? `+${String(kontrast)}` : String(kontrast)}
        </span>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
        Schärfe
        <input
          type="range"
          data-testid="aktion-aufbereitung-schaerfe"
          aria-label="Schärfe des Bildes"
          min={AUFBEREITUNG_GRENZEN.schaerfe.min}
          max={AUFBEREITUNG_GRENZEN.schaerfe.max}
          step={1}
          value={schaerfe}
          style={{ flex: '1 1 auto', minWidth: 0 }}
          onChange={(ereignis) => {
            setze('schaerfe', Number(ereignis.target.value))
          }}
        />
        <span style={{ color: '#9aa4b2', width: 42, textAlign: 'right' }}>{schaerfe}</span>
      </label>

      {eigeneWahl && (
        <button
          type="button"
          data-testid="aktion-aufbereitung-zuruecksetzen"
          onClick={() => {
            aufAendern(null)
          }}
        >
          Zurücksetzen
        </button>
      )}
    </div>
  )
}
