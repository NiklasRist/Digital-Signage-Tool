// [action-editor] EIN Farbwaehler als Popup (05.11.2026, Nacharbeit 2)
//
// WARUM ES DIESE DATEI GIBT: Niklas, 05.11.2026: „die palette und der color selektor müssen
// parallel aktiv oder deaktiviert sein, wenn man auf die farbe klickt, und es soll alles ein
// Popup sein". Vorher stand das Farbfeld IMMER da und die Palette klappte darunter auf -
// zwei Zustaende fuer eine Handlung, und die Palette war zugeklappt praktisch unsichtbar.
//
// JETZT: Die Zeile ist ein KNOPF (Farbfeld + Name + Wert). Ein Klick oeffnet EIN Popup, in
// dem Farbfeld, Markenpalette, „Zuletzt verwendet" und „Markenwert" GLEICHZEITIG stehen.
// Alles, was mit dieser einen Farbe zu tun hat, ist zusammen offen oder zusammen zu.
//
// KEIN ZWEITER ZUSTANDSSPEICHER: Der Wert kommt herein (`wert`), die Wahl geht hinaus
// (`aufWahl`). Der Entwurf bleibt die einzige Wahrheit. Geoeffnet/geschlossen ist reine
// Anzeige und darf hier leben.

import { useEffect, useLayoutEffect, useRef, useState, type JSX } from 'react'

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

const POPUP_BREITE = 250

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
  const [offen, setzeOffen] = useState(false)
  // NACHARBEIT 3 (05.11.2026): Niklas: „jz fehlt nur noch die freie farbwahl in dem popup".
  // Das native Farbfeld allein ist keine freie Wahl - man kann dort nichts eintippen und
  // nichts aus einer Vorlage einsetzen. Deshalb ein Hex-Feld daneben.
  const [hexEingabe, setzeHexEingabe] = useState('')
  const [hexFehler, setzeHexFehler] = useState<string | null>(null)
  const [lage, setzeLage] = useState<{ links: number; oben: number }>({ links: 0, oben: 0 })
  const knopf = useRef<HTMLButtonElement | null>(null)
  const popup = useRef<HTMLDivElement | null>(null)

  // Das Popup haengt an `position: fixed` und wird am KNOPF ausgerichtet. Das ist noetig,
  // weil die Inspector-Flaeche waagerecht und senkrecht scrollt (`overflow: auto`) - ein
  // absolut positioniertes Kind wuerde an ihrer Kante abgeschnitten.
  useEffect(() => {
    if (!offen) return
    const schliesseBeiKlick = (ereignis: MouseEvent): void => {
      const ziel = ereignis.target
      if (ziel instanceof Node && knopf.current?.contains(ziel) === true) return
      if (ziel instanceof Element && ziel.closest(`[data-testid="${testid}-popup"]`) !== null) return
      setzeOffen(false)
    }
    const schliesseBeiEscape = (ereignis: KeyboardEvent): void => {
      if (ereignis.key === 'Escape') setzeOffen(false)
    }
    document.addEventListener('mousedown', schliesseBeiKlick)
    document.addEventListener('keydown', schliesseBeiEscape)
    return () => {
      document.removeEventListener('mousedown', schliesseBeiKlick)
      document.removeEventListener('keydown', schliesseBeiEscape)
    }
  }, [offen, testid])

  // Der Hex-Text folgt dem GELTENDEN Wert (Palette-Klick, „Markenwert", Farbfeld).
  // Waehrend des Tippens aendert sich `angezeigt` nicht - die Eingabe bleibt also stehen.
  useEffect(() => {
    if (!offen) return
    setzeHexEingabe(angezeigt.toUpperCase())
  }, [angezeigt, offen])

  // NACHARBEIT 05.11.2026: Ein Popup, das aus einem Knopf am UNTEREN Fensterrand
  // aufgeht, stand bisher unterhalb des Bildschirms (gemessen: y=920 bei 900 px Hoehe).
  // Deshalb wird es nach dem ersten Zeichnen am Fenster gehalten.
  useLayoutEffect(() => {
    if (!offen) return
    const kasten = popup.current?.getBoundingClientRect()
    if (kasten === undefined) return
    const oben = Math.max(8, Math.min(lage.oben, window.innerHeight - kasten.height - 8))
    const links = Math.max(8, Math.min(lage.links, window.innerWidth - kasten.width - 8))
    if (oben !== lage.oben || links !== lage.links) setzeLage({ links, oben })
  }, [offen, lage])

  function oeffne(): void {
    const kasten = knopf.current?.getBoundingClientRect()
    if (kasten !== undefined) {
      // Rechtsbuendig am Knopf, aber nie ueber den Fensterrand hinaus.
      const links = Math.max(8, Math.min(kasten.right - POPUP_BREITE, window.innerWidth - POPUP_BREITE - 8))
      setzeLage({ links, oben: kasten.bottom + 4 })
    }
    setzeHexEingabe(angezeigt.toUpperCase())
    setzeHexFehler(null)
    setzeOffen(true)
  }

  /** Eintippen und Enter oder Fokusverlust uebernimmt den Wert. Ungueltig heisst: der
   *  Entwurf bleibt unberuehrt und das Feld springt auf den geltenden Wert zurueck. */
  function uebernehmeHex(): void {
    const hex = alsHex(hexEingabe)
    if (hex === null) {
      setzeHexFehler('Ungültig – erwartet wird #RRGGBB.')
      setzeHexEingabe(angezeigt.toUpperCase())
      return
    }
    setzeHexFehler(null)
    setzeHexEingabe(hex)
    waehle(hex)
  }

  /** `#abc`, `abc`, `#aabbcc` und `aabbcc` werden zu `#AABBCC`; alles andere ist ungueltig.
   *  Bewusst NUR Hex: Die Marken-Rollen sind Hex-Werte, und ein Farbname („rot") haette
   *  eine zweite Wahrheit neben `farben.ts` erzeugt. */
  function alsHex(wert: string): string | null {
    const roh = wert.trim().replace(/^#/, '')
    if (/^[0-9a-fA-F]{6}$/.test(roh)) return `#${roh.toUpperCase()}`
    if (/^[0-9a-fA-F]{3}$/.test(roh)) {
      const [r, g, b] = roh
      return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
    }
    return null
  }

  function waehle(farbe: string): void {
    if (markenWert !== null && farbe.toLowerCase() === markenWert.toLowerCase()) {
      // „genau der Markenwert" ist KEINE eigene Wahl - sonst stuende ein Wert in der
      // Aktion, der nichts bewirkt.
      aufWahl(null)
      return
    }
    aufWahl(farbe)
    aufFarbeMerken(farbe)
  }

  return (
    <div data-testid={testid} style={{ minWidth: 0 }}>
      <button
        ref={knopf}
        type="button"
        data-testid={`${testid}-oeffnen`}
        aria-expanded={offen}
        aria-label={`${beschriftung}: ${angezeigt}`}
        onClick={() => {
          if (offen) setzeOffen(false)
          else oeffne()
        }}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          minWidth: 0,
          fontSize: 11,
          padding: '2px 4px',
          textAlign: 'left',
          background: 'transparent',
          border: '1px solid #333',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            flex: '0 0 auto',
            width: 16,
            height: 16,
            borderRadius: 3,
            background: angezeigt,
            border: '1px solid #666',
          }}
        />
        <span style={{ flex: '0 1 auto', overflowWrap: 'anywhere' }}>
          {beschriftung}
        </span>
        <span style={{ flex: '0 1 auto', color: '#9aa4b2' }}>
          {angezeigt.toUpperCase()}
        </span>
        <span style={{ flex: '1 1 auto' }} />
        <span aria-hidden="true" style={{ flex: '0 0 auto', color: '#9aa4b2' }}>
          {offen ? '▴' : '▾'}
        </span>
      </button>

      {offen && (
        <div
          ref={popup}
          data-testid={`${testid}-popup`}
          role="dialog"
          aria-label={`Farbe ${beschriftung}`}
          style={{
            position: 'fixed',
            left: lage.links,
            top: lage.oben,
            width: POPUP_BREITE,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: 8,
            background: '#1b1b1b',
            border: '1px solid #555',
            borderRadius: 6,
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* DIE FREIE WAHL (Nacharbeit 3, 05.11.2026): Farbfeld UND Hex-Feld. Das
              Feld allein war keine freie Wahl - man konnte nichts eintippen und keinen
              Wert aus einer Vorlage einsetzen. Beide stehen gleichzeitig mit der Palette
              hier; es gibt keinen zweiten Zustand fuer dieselbe Handlung. */}
          <span style={{ fontSize: 11, color: '#9aa4b2' }}>Freie Farbe</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              key={`${testid}-${angezeigt}`}
              type="color"
              data-testid={`${testid}-farbe`}
              aria-label={`${beschriftung} frei wählen`}
              defaultValue={angezeigt}
              style={{ flex: '0 0 auto', width: 44, height: 28, padding: 0 }}
              // `onChange` ist im Popup richtig: Man sieht das Ergebnis sofort, und der
              // Popup-Zustand wird beim Ziehen nicht neu aufgebaut (anders als ein Feld,
              // das dauerhaft im Formular steht).
              onChange={(ereignis) => {
                waehle(ereignis.target.value)
              }}
            />
            <input
              type="text"
              data-testid={`${testid}-hex`}
              aria-label={`Farbe als Hex-Wert (${beschriftung})`}
              value={hexEingabe}
              placeholder="#RRGGBB"
              spellCheck={false}
              style={{
                flex: '1 1 auto',
                minWidth: 0,
                fontFamily: 'Menlo, Consolas, monospace',
                fontSize: 12,
              }}
              onChange={(ereignis) => {
                setzeHexEingabe(ereignis.target.value)
                setzeHexFehler(null)
              }}
              onKeyDown={(ereignis) => {
                if (ereignis.key === 'Enter') uebernehmeHex()
              }}
              onBlur={uebernehmeHex}
            />
            {wert !== null && (
              <button
                type="button"
                data-testid={`${testid}-marke`}
                onClick={() => {
                  aufWahl(null)
                }}
              >
                Markenwert
              </button>
            )}
          </div>
          {hexFehler !== null && (
            <span data-testid={`${testid}-hex-fehler`} style={{ fontSize: 11, color: '#e5634d' }}>
              {hexFehler}
            </span>
          )}

          {palette.length > 0 && (
            <>
              <span style={{ fontSize: 11, color: '#9aa4b2' }}>Markenpalette</span>
              <div
                data-testid={`${testid}-palette`}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}
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
                        waehle(hex)
                      }}
                      style={{
                        width: 24,
                        height: 24,
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
            </>
          )}

          <span style={{ fontSize: 11, color: '#9aa4b2' }}>Zuletzt verwendet</span>
          {letzteFarben.length === 0 ? (
            <span style={{ fontSize: 11, color: '#9aa4b2' }}>
              Noch keine eigene Farbe gewählt – die letzten 20 erscheinen hier.
            </span>
          ) : (
            <div
              data-testid={`${testid}-letzte`}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}
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
                      waehle(hex)
                    }}
                    style={{
                      width: 24,
                      height: 24,
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

          <button type="button" onClick={() => setzeOffen(false)}>
            Schließen
          </button>
        </div>
      )}
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
