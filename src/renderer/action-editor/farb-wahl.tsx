// [action-editor] EIN Farbwaehler fuer jedes Objekt (05.11.2026, Nacharbeit)
//
// WARUM ES DIESE DATEI GIBT: Niklas, 05.11.2026: „die farbauswahl so gestalten, dass sie
// objektunabhängig ist — aber objekte an sich haben die unabhängige farbauswahl". Bis hier
// hatte die GLOBALE Akzentfarbe einen Waehler mit Markenpalette und „Zuletzt verwendet",
// die ZONEN-Farben dagegen nur ein nacktes `<input type="color">`. Zwei Bedienungen fuer
// dieselbe Frage sind ein Fehler, den man beim naechsten Umbau nicht mehr findet.
//
// DIE TRENNUNG: Das BEDIENELEMENT ist objektunabhaengig (diese eine Datei), der WERT
// gehoert dem Objekt (jede Zone, die globale Akzentfarbe). Kein Zustand hier: `wert` kommt
// herein, `aufWahl` geht hinaus — der Entwurf bleibt die einzige Wahrheit.
//
// PLATZ: Die Palette steckt in einem zugeklappten `<details>`. Zehn Swatches je Zone waeren
// bei acht Zonen achtzig Kaestchen; die sieht niemand. Die ELEMENTE sind trotzdem im DOM
// (auch zugeklappt) — messbar und testbar, ohne einen Zustand zu fuehren.

import type { JSX } from 'react'

import { istHexFarbe } from '../../shared/gestaltung'

/** Ein Paletten-Eintrag: Rollenname als Beschriftung, Hex als Wert. */
export type PalettenFarbe = readonly [rolle: string, hex: string]

export interface FarbWahlEigenschaften {
  /** Fester Praefix ALLER data-testids dieses Waehlers, z. B. `aktion-zone-preis-flaeche`. */
  testid: string
  /** Was gefaerbt wird, z. B. „Schrift" oder „Fläche". */
  beschriftung: string
  /** Der EIGENE Wert des Objekts. null = keine eigene Wahl. */
  wert: string | null
  /** Der Wert, der ohne eigene Wahl gilt (Markenrolle). null = Marke nicht bereit. */
  markenWert: string | null
  palette: readonly PalettenFarbe[]
  letzteFarben: readonly string[]
  aufWahl: (farbe: string | null) => void
  aufFarbeMerken: (farbe: string) => void
}

/** Der Wert, den der Waehler anzeigt und im Kaestchen malt. */
function anzeigewert(wert: string | null, markenWert: string | null): string {
  if (wert !== null) return wert
  return markenWert ?? '#000000'
}

export function FarbWahl({
  testid,
  beschriftung,
  wert,
  markenWert,
  palette,
  letzteFarben,
  aufWahl,
  aufFarbeMerken,
}: FarbWahlEigenschaften): JSX.Element {
  const angezeigt = anzeigewert(wert, markenWert)

  return (
    <div data-testid={testid} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, minWidth: 0 }}>
        <input
          // Der Key bindet das unkontrollierte Feld an den ANGEZEIGTEN Wert: Nach einem
          // „Markenwert" oder einem Klick auf einen Swatch muss das Kaestchen den neuen
          // Wert zeigen, auch wenn das Feld nie den Fokus hatte.
          key={`${testid}-${angezeigt}`}
          type="color"
          data-testid={`${testid}-farbe`}
          aria-label={beschriftung}
          defaultValue={angezeigt}
          style={{ flex: '0 0 auto', width: 28, height: 22, padding: 0 }}
          // `onBlur` und nicht `onChange`: Ein Zieh-Vorgang feuert viele Aenderungen, und
          // jede zeichnet die 1920x1080-Vorschau neu (dieselbe Ueberlegung wie 03.11.2026).
          onBlur={(ereignis) => {
            const farbe = ereignis.target.value
            if (markenWert !== null && farbe.toLowerCase() === markenWert.toLowerCase()) {
              // „genau der Markenwert" ist KEINE eigene Wahl - der Zustand waere sonst
              // gespeichert, ohne etwas zu bewirken.
              aufWahl(null)
              return
            }
            aufWahl(farbe)
            aufFarbeMerken(farbe)
          }}
        />
        <span style={{ flex: '0 1 auto', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {beschriftung}
        </span>
        <span style={{ flex: '0 1 auto', color: '#9aa4b2', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {angezeigt.toUpperCase()}
        </span>
        <span style={{ flex: '1 1 auto' }} />
        {wert !== null && (
          <button
            type="button"
            data-testid={`${testid}-marke`}
            style={{ flex: '0 0 auto' }}
            onClick={() => {
              aufWahl(null)
            }}
          >
            Markenwert
          </button>
        )}
      </div>

      {/* Zugeklappt, damit acht Zonen nicht achtzig Kaestchen zeigen. Die Elemente sind
          auch im zugeklappten Zustand im DOM - der Treiber misst sie ohne Aufklappen. */}
      <details style={{ marginLeft: 34 }}>
        <summary style={{ fontSize: 11, color: '#9aa4b2', cursor: 'pointer' }}>Palette</summary>

        {palette.length > 0 && (
          <div
            data-testid={`${testid}-palette`}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}
          >
            {palette.map(([rolle, hex]) => {
              const gewaehlt = wert !== null && wert.toLowerCase() === hex.toLowerCase()
              return (
                <button
                  key={rolle}
                  type="button"
                  data-testid={`${testid}-palette-${rolle}`}
                  title={`${rolle} ${hex}`}
                  aria-label={`${rolle} ${hex}`}
                  onClick={() => {
                    aufWahl(hex)
                    aufFarbeMerken(hex)
                  }}
                  style={{
                    width: 22,
                    height: 22,
                    padding: 0,
                    boxSizing: 'border-box',
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: hex,
                    border: gewaehlt ? '2px solid #6ea8fe' : '1px solid #444',
                  }}
                />
              )
            })}
          </div>
        )}

        <div style={{ marginTop: 6 }}>
          <span style={{ fontSize: 11, color: '#9aa4b2' }}>Zuletzt verwendet</span>
          {letzteFarben.length === 0 ? (
            <p style={{ fontSize: 11, color: '#9aa4b2', margin: '2px 0 0' }}>
              Noch keine eigene Farbe gewählt – die letzten 20 erscheinen hier.
            </p>
          ) : (
            <div
              data-testid={`${testid}-letzte`}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}
            >
              {letzteFarben.map((hex) => {
                const gewaehlt = wert !== null && wert.toLowerCase() === hex.toLowerCase()
                return (
                  <button
                    key={hex}
                    type="button"
                    data-testid={`${testid}-letzte-${hex}`}
                    title={`Zuletzt verwendet: ${hex}`}
                    aria-label={`Zuletzt verwendet: ${hex}`}
                    onClick={() => {
                      aufWahl(hex)
                      aufFarbeMerken(hex)
                    }}
                    style={{
                      width: 22,
                      height: 22,
                      padding: 0,
                      boxSizing: 'border-box',
                      borderRadius: 4,
                      cursor: 'pointer',
                      background: hex,
                      border: gewaehlt ? '2px solid #6ea8fe' : '1px solid #444',
                    }}
                  />
                )
              })}
            </div>
          )}
        </div>
      </details>
    </div>
  )
}

/**
 * Die Markenpalette als Swatch-Liste: alle Rollen der bereiten Marke, **doppelte Hex-Werte
 * als EIN Swatch** (eine Auswahl soll Farben zeigen, nicht Rollen). 8-stellige Werte fallen
 * heraus - der Vertrag der Zonen- und Akzentfarbe ist `#RRGGBB`; ein Klick darauf wuerde
 * erst beim Speichern abgelehnt.
 */
export function markenPalette(farben: Record<string, string> | undefined): PalettenFarbe[] {
  if (farben === undefined) return []
  return Object.entries(farben)
    .filter(([, hex]) => typeof hex === 'string' && istHexFarbe(hex))
    .filter(
      ([, hex], stelle, alle) =>
        alle.findIndex(([, vergleich]) => vergleich.toLowerCase() === hex.toLowerCase()) === stelle,
    )
}
