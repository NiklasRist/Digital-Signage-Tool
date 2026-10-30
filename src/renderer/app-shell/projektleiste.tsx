// [app-shell] Die Projektleiste über der Reiterfläche (#456, TK 9.14.1 Fassung v3.32).
//
// WARUM SIE EXISTIERT: Mit v3.32 ist der Reiter [Marken] entfallen. Marken werden immer FÜR
// ein Projekt bearbeitet - der Einstieg gehört deshalb an eine Stelle, die sagt, WELCHES
// Projekt gerade offen ist. Die Leiste steht über jedem Reiter, damit der Weg dorthin nicht
// vom gerade offenen Reiter abhängt.
//
// WAS SIE NICHT TUT: Sie rechnet nichts. Der Wechsel der Standardmarke geht über die
// BESTEHENDE Operation `wechsleStandardMarke` (projekt-verwaltung/standardmarke.ts) - kein
// zweiter Schreibweg.
//
// ANORDNUNG (Entscheidung Niklas, 30.10.2026): „minimaler Text, Symbole für die Knöpfe,
// beide Stellen." Deshalb steht nur ein Wort neben der Klappliste, und der Einstieg ist ein
// STIFT direkt hinter ihr - nicht ein zweiter Markenname am anderen Ende der Zeile.
// Vorher stand der Name zweimal in derselben 22-px-Zeile (einmal in der Klappliste, einmal
// unterstrichen rechts), der Einstieg also getrennt von der Wahl, auf die er sich bezieht.
// Das TK 9.14.1 zeichnet die Reihenfolge ohnehin als Projektname · Marke · Einstieg.
//
// DER KNOPF IST EIN UMSCHALTER: Ist der Editor offen, zeigt dasselbe Feld einen Pfeil
// zurück („Zurück zum Projekt"). Ein zweiter Knopf wäre ein zweiter Zustand an einer
// zweiten Stelle; `aria-pressed` sagt Screenreadern, dass es derselbe Schalter ist.

import type { JSX } from 'react'
import { SymbolKnopf, SymbolPfeilLinks, SymbolStift } from '../gemeinsam/symbole'

export interface ProjektleisteProps {
  projektName: string
  /** Die Standardmarke des Projekts (Project.standardMarkeId, TK 9.11.3). */
  standardMarkeId: string
  /** Der app-weite Bestand - nur lesend; geladen wird woanders (#305). */
  markenUebersicht: readonly { id: string; name: string }[]
  /** Wechselt die Standardmarke über `wechsleStandardMarke` (TK 9.14.3). */
  aufStandardMarke: (markeId: string) => void
  /** Öffnet den Marken-Editor GENAU DIESER Marke (Ansicht über der Reiterfläche). */
  aufMarken: (markeId: string) => void
  /** true, solange der Editor offen ist - der Knopf zeigt das an. */
  markenOffen: boolean
}

export function Projektleiste(p: ProjektleisteProps): JSX.Element {
  const markenName = p.markenUebersicht.find((marke) => marke.id === p.standardMarkeId)?.name ?? null
  const beschriftung = p.markenOffen
    ? 'Zurück zum Projekt'
    : markenName === null
      ? 'Marke bearbeiten'
      : `Marke „${markenName}" bearbeiten`

  return (
    <div
      data-testid="projektleiste"
      style={{
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        // #456: Die Leiste kostet Hoehe. Im Treiber-Fenster (800x572) schiebt jedes Pixel
        // die Zeitleiste des Composers aus dem Bild - am 30.10.2026 gemessen: mit einer
        // 30-px-Leiste fiel der Drop auf das Video aus. Sie bleibt deshalb so flach wie
        // moeglich; die Hoehe ist Teil ihres Vertrags, nicht Geschmack.
        // Der Symbolknopf ist 20 px hoch und bringt sie NICHT ueber 22.
        padding: '0 8px',
        minHeight: 22,
        borderBottom: '1px solid #444',
        fontSize: 11,
      }}
    >
      <strong
        data-testid="projektleiste-name"
        title={p.projektName}
        style={{
          // Ein langer Projektname kuerzt, statt die Klappliste aus dem Fenster zu schieben.
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {p.projektName}
      </strong>
      {/* EIN Wort. „Standardmarke" stand hier ausgeschrieben und kostete nur Breite; es ist
          jetzt der zugaengliche Name der Klappliste. */}
      <span data-testid="projektleiste-marke-label" style={{ opacity: 0.7 }}>Marke</span>
      <select
        data-testid="projektleiste-standardmarke"
        aria-label="Standardmarke des Projekts"
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
      {/* #456: Die Wahl steht in der Klappliste, der Einstieg direkt daneben. Vorher hing er
          mit `marginLeft: auto` am anderen Ende der Zeile - die Wahl und ihre Folge waren
          getrennt. */}
      <SymbolKnopf
        kennung="projektleiste-marke-oeffnen"
        beschriftung={beschriftung}
        gedrueckt={p.markenOffen}
        abgeschaltet={p.standardMarkeId === ''}
        aufKlick={() => p.aufMarken(p.standardMarkeId)}
      >
        {p.markenOffen ? <SymbolPfeilLinks /> : <SymbolStift />}
      </SymbolKnopf>
    </div>
  )
}
