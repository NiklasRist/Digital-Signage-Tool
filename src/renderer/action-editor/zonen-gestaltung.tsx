// [action-editor] ALLES zu EINEM Objekt an einer Stelle (05.11.2026, Nacharbeit)
//
// WARUM ES DIESE DATEI GIBT: Bis hierher lagen die Farben einer Zone im Schritt „Zonen",
// die globale Akzentfarbe in einem eigenen Schritt „Akzentfarbe" — und Niklas' Kritik war
// genau das: „was zusammen gehört muss zusammen gruppiert werden". Seit dieser Fassung hat
// jede Zone EINEN Block mit ALLEM, was zu ihr gehoert: Schriftfarbe, Flächenfarbe, Größe,
// Ausrichtung. Die Akzentfarbe der Aktion steht als erster Block derselben Gruppe darüber
// („Alle Objekte") — sie ist die Vorgabe, die jede Zone einzeln überschreiben kann.
//
// DIE QUELLE IST DIE VORLAGE, NICHT EINE LISTE HIER: Angezeigt wird je Zone, was die Zone
// selbst trägt - eine Schriftfarbe nur bei `zone.text`, eine Flächenfarbe nur bei
// `zone.deko.füllungFarbRolle`. Ein Verlauf (`deko.verlauf`) bekommt bewusst keinen Regler:
// zwei Stopps mit einer Farbe zu bedienen hiesse, den anderen zu raten. Dieselbe Regel
// wertet `template-canvas/farben.ts` aus - Anzeige und Wirkung können nicht auseinanderlaufen.
//
// DER WAHLER IST OBJEKTUNABHAENGIG (`farb-wahl.tsx`): ein Bedienelement für jede Farbe,
// der WERT bleibt beim Objekt. Kein Zustand hier außer dem Entwurf, den der Aufrufer hält.

import type { JSX } from 'react'

import type { Vorlage, Zone } from '../../shared/contracts/vorlage'
import type { Marke } from '../../shared/contracts/marke'
import type { AktionsInhalt, ZonenGestaltung } from '../../shared/contracts/aktion'
import { GESTALTUNG_GRENZEN } from '../../shared/gestaltung'
import { zonenText } from '../gemeinsam/zonen-texte'

import { FarbWahl, type PalettenFarbe } from './farb-wahl'

/** Die Farbe, die ohne eigene Wahl gilt: die Rollen-Farbe der bereiten Marke. */
function markenFarbe(marke: Marke | null, rolle: string | undefined): string | null {
  if (marke === null || rolle === undefined) return null
  // SAFETY: `rolle` kommt aus der Vorlage und ist laut Vertrag eine `FarbRolle`; ein
  // handeditierter Wert trifft die Marke nicht und liefert `undefined` - dann zeigt der
  // Waehler „kein Markenwert", statt eine erfundene Farbe zu behaupten.
  const wert = (marke.farben as Record<string, string>)[rolle]
  return typeof wert === 'string' ? wert : null
}

/** Kann an dieser Zone etwas eingestellt werden - und wenn ja, was? */
function einstellbar(zone: Zone): { text: boolean; flaeche: boolean } {
  return {
    text: zone.text !== undefined,
    flaeche: zone.deko?.füllungFarbRolle !== undefined,
  }
}

export function ZonenGestaltung({
  vorlage,
  entwurf,
  marke,
  palette,
  letzteFarben,
  aufAendern,
  aufFarbeMerken,
}: {
  vorlage: Vorlage | null
  entwurf: AktionsInhalt
  marke: Marke | null
  palette: readonly PalettenFarbe[]
  letzteFarben: readonly string[]
  /** Setzt den GANZEN Record - der Entwurf ist die einzige Wahrheit (s. Modulkopf). */
  aufAendern: (gestaltung: Record<string, ZonenGestaltung>) => void
  aufFarbeMerken: (farbe: string) => void
}): JSX.Element {
  const gestaltung = entwurf.zonenGestaltung ?? {}

  /** EIN Feld EINER Zone setzen oder entfernen. `null` entfernt die Angabe ganz -
   *  „Markenwert" ist kein gespeicherter Zustand, sondern die Abwesenheit einer Wahl. */
  function setze(zoneId: string, feld: keyof ZonenGestaltung, wert: string | number | null): void {
    const bisher = gestaltung[zoneId] ?? {}
    // SAFETY: `feld` ist ein Schluessel von `ZonenGestaltung` und `wert` traegt genau den
    // Typ dieses Feldes (der Aufrufer ist typisiert); `null` wird direkt danach entfernt.
    const neu = { ...bisher, [feld]: wert } as ZonenGestaltung
    if (wert === null) delete neu[feld]
    const naechster = { ...gestaltung }
    if (Object.keys(neu).length === 0) delete naechster[zoneId]
    else naechster[zoneId] = neu
    aufAendern(naechster)
  }

  if (vorlage === null) {
    return (
      <p style={{ color: '#9aa4b2', fontSize: 11, margin: 0 }}>
        Objekte erscheinen, sobald die Vorlage geladen ist.
      </p>
    )
  }

  const zonen = vorlage.zonen.filter((zone) => {
    const kann = einstellbar(zone)
    return kann.text || kann.flaeche
  })

  if (zonen.length === 0) {
    return (
      <p data-testid="aktion-zonen-leer" style={{ color: '#9aa4b2', fontSize: 11, margin: 0 }}>
        Diese Vorlage hat keine einstellbare Fläche.
      </p>
    )
  }

  return (
    <div data-testid="aktion-zonen" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {zonen.map((zone) => {
        const kann = einstellbar(zone)
        const name = zonenText(zone.id).name
        const eigen = gestaltung[zone.id] ?? {}
        const eigeneSchrift = typeof eigen.textfarbe === 'string' ? eigen.textfarbe : null
        const eigeneFlaeche = typeof eigen.flaechefarbe === 'string' ? eigen.flaechefarbe : null
        const groesse = eigen.groesseProzent ?? 100
        const ausrichtung = eigen.ausrichtung ?? zone.ausrichtung.horizontal
        const hatEigeneWahl = Object.keys(eigen).length > 0

        return (
          <div
            key={zone.id}
            data-testid={`aktion-zone-${zone.id}`}
            style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <strong style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name}
              </strong>
              <span style={{ flex: '1 1 auto' }} />
              {hatEigeneWahl && (
                <button
                  type="button"
                  data-testid={`aktion-zone-${zone.id}-zuruecksetzen`}
                  style={{ flex: '0 0 auto' }}
                  onClick={() => {
                    const naechster = { ...gestaltung }
                    delete naechster[zone.id]
                    aufAendern(naechster)
                  }}
                >
                  Zurücksetzen
                </button>
              )}
            </div>

            {kann.text && (
              <FarbWahl
                testid={`aktion-zone-${zone.id}-schrift`}
                beschriftung="Schrift"
                wert={eigeneSchrift}
                markenWert={markenFarbe(marke, zone.text?.farbRolle)}
                palette={palette}
                letzteFarben={letzteFarben}
                aufWahl={(farbe) => {
                  setze(zone.id, 'textfarbe', farbe)
                }}
                aufFarbeMerken={aufFarbeMerken}
              />
            )}

            {kann.flaeche && (
              <FarbWahl
                testid={`aktion-zone-${zone.id}-flaeche`}
                beschriftung="Fläche"
                wert={eigeneFlaeche}
                markenWert={markenFarbe(marke, zone.deko?.füllungFarbRolle)}
                palette={palette}
                letzteFarben={letzteFarben}
                aufWahl={(farbe) => {
                  setze(zone.id, 'flaechefarbe', farbe)
                }}
                aufFarbeMerken={aufFarbeMerken}
              />
            )}

            {kann.text && (
              <>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    minWidth: 0,
                  }}
                >
                  <span style={{ flex: '0 0 auto' }}>Größe</span>
                  <input
                    type="range"
                    data-testid={`aktion-zone-${zone.id}-groesse`}
                    aria-label={`Textgröße ${name}`}
                    min={GESTALTUNG_GRENZEN.groesseProzent.min}
                    max={GESTALTUNG_GRENZEN.groesseProzent.max}
                    step={5}
                    value={groesse}
                    // `minWidth: 0` ist der Grund, warum die Leiste NICHT waagerecht
                    // scrollt: Ein Flex-Kind schrumpft sonst nur bis zu seiner
                    // Inhaltsbreite, und die ist beim Schieberegler 129 px.
                    style={{ flex: '1 1 auto', minWidth: 0 }}
                    onChange={(ereignis) => {
                      const wert = Number(ereignis.target.value)
                      setze(zone.id, 'groesseProzent', wert === 100 ? null : wert)
                    }}
                  />
                  <span style={{ flex: '0 0 auto', color: '#9aa4b2' }}>{`${String(groesse)} %`}</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, minWidth: 0 }}>
                  <span style={{ flex: '0 0 auto' }}>Ausrichtung</span>
                  {(['links', 'mitte', 'rechts'] as const).map((wert) => (
                    <button
                      key={wert}
                      type="button"
                      data-testid={`aktion-zone-${zone.id}-ausrichtung-${wert}`}
                      aria-pressed={ausrichtung === wert}
                      style={{
                        flex: '1 1 0',
                        minWidth: 0,
                        fontWeight: ausrichtung === wert ? 700 : 400,
                        border: ausrichtung === wert ? '2px solid #6ea8fe' : '1px solid #444',
                      }}
                      onClick={() => {
                        setze(zone.id, 'ausrichtung', wert === zone.ausrichtung.horizontal ? null : wert)
                      }}
                    >
                      {wert === 'links' ? 'Links' : wert === 'mitte' ? 'Mitte' : 'Rechts'}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
