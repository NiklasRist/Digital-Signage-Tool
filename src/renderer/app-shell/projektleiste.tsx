// [app-shell] Die Projektleiste über der Reiterfläche (#456, TK 9.14.1 Fassung v3.32).
//
// WARUM SIE EXISTIERT: Mit v3.32 ist der Reiter [Marken] entfallen. Marken werden immer FÜR
// ein Projekt bearbeitet - der Einstieg gehört deshalb an eine Stelle, die sagt, WELCHES
// Projekt gerade offen ist. Die Leiste steht über jedem Reiter, damit der Weg dorthin nicht
// vom gerade offenen Reiter abhängt.
//
// WAS SIE NICHT TUT: Sie rechnet nichts. Der Wechsel der Standardmarke geht über die
// BESTEHENDE Operation `wechsleStandardMarke` (projekt-verwaltung/standardmarke.ts) - kein
// zweiter Schreibweg. Sie zeigt drei Dinge: den Projektnamen, die Standardmarke als Auswahl
// und den Knopf [Marken].

import type { JSX } from 'react'

export interface ProjektleisteProps {
  projektName: string
  /** Die Standardmarke des Projekts (Project.standardMarkeId, TK 9.11.3). */
  standardMarkeId: string
  /** Der app-weite Bestand - nur lesend; geladen wird woanders (#305). */
  markenUebersicht: readonly { id: string; name: string }[]
  /** Wechselt die Standardmarke über `wechsleStandardMarke` (TK 9.14.3). */
  aufStandardMarke: (markeId: string) => void
  /** Öffnet den Marken-Editor (Ansicht über der Reiterfläche). */
  aufMarken: () => void
  /** true, solange der Editor offen ist - der Knopf zeigt das an. */
  markenOffen: boolean
}

export function Projektleiste(p: ProjektleisteProps): JSX.Element {
  return (
    <div
      data-testid="projektleiste"
      style={{
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        // #456: Die Leiste kostet Hoehe. Im Treiber-Fenster (800x572) schiebt jedes Pixel
        // die Zeitleiste des Composers aus dem Bild - am 30.10.2026 gemessen: mit einer
        // 30-px-Leiste fiel der Drop auf das Video aus. Sie bleibt deshalb so flach wie
        // moeglich; die Hoehe ist Teil ihres Vertrags, nicht Geschmack.
        padding: '0 8px',
        minHeight: 22,
        borderBottom: '1px solid #444',
        fontSize: 11,
      }}
    >
      <strong data-testid="projektleiste-name">{p.projektName}</strong>
      <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        Standardmarke
        <select
          data-testid="projektleiste-standardmarke"
          value={p.standardMarkeId}
          onChange={(e) => {
            // Der leere Wert waere „nichts gewaehlt" - kein Wechsel, kein Aufruf.
            if (e.target.value === '') return
            p.aufStandardMarke(e.target.value)
          }}
        >
          {p.markenUebersicht.map((marke) => (
            <option key={marke.id} value={marke.id}>
              {marke.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        data-testid="projektleiste-marken"
        aria-pressed={p.markenOffen}
        style={{ marginLeft: 'auto' }}
        onClick={p.aufMarken}
      >
        Marken
      </button>
    </div>
  )
}
