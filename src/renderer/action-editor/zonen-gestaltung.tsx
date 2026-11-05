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
// `zone.deko.füllungFarbRolle`. Eine Abdunkelung (`scrimStart`/`scrimEnde`) bekommt SEIT
// 05.11.2026 ihre beiden Stopps mit je Farbe und Deckkraft - der eine Regler von vorher
// hätte den anderen Stopp raten müssen. Dieselbe Regel wertet `template-canvas/farben.ts`
// aus - Anzeige und Wirkung können nicht auseinanderlaufen.
//
// DER WAHLER IST OBJEKTUNABHAENGIG (`farb-wahl.tsx`): ein Bedienelement für jede Farbe,
// der WERT bleibt beim Objekt. Kein Zustand hier außer dem Entwurf, den der Aufrufer hält.

import type { JSX } from 'react'

import type { Vorlage, Zone } from '../../shared/contracts/vorlage'
import type { FarbRolle, Marke } from '../../shared/contracts/marke'
import type {
  AktionsInhalt,
  ScrimGestaltung,
  ZonenGestaltung,
} from '../../shared/contracts/aktion'
import {
  GESTALTUNG_GRENZEN,
  SCHRIFT_ROLLEN,
  hexDeckkraftProzent,
  istScrimRolle,
  istScrimZone,
} from '../../shared/gestaltung'
import { zonenText } from '../gemeinsam/zonen-texte'
import { schriftRollenText } from '../marken-editor/rollen-texte'

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

/** Der Farbton ohne Alpha – der Waehler kennt nur `#RRGGBB` (TK 9.11.2). */
function ohneAlpha(hex: string | null): string | null {
  if (hex === null) return null
  return /^#[0-9a-fA-F]{8}$/.test(hex) ? hex.slice(0, 7) : hex
}

/** Die Deckkraft, die ohne eigene Wahl gilt (Alpha der Markenrolle, 6-stellig = 100). */
function markenDeckkraft(marke: Marke | null, rolle: FarbRolle | undefined): number {
  if (marke === null || rolle === undefined) return 100
  const wert = marke.farben[rolle]
  if (typeof wert !== 'string') return 100
  return hexDeckkraftProzent(wert) ?? 100
}

/**
 * Was lässt sich an dieser Zone einstellen? Die Quelle ist die VORLAGE.
 *
 * Scrim (05.11.2026): Eine Abdunkelungs-Zone bekommt ZWEI Stopps mit je Farbe und
 * Deckkraft. Ihre Fuellung ist kein gewoehnlicher Flaechen-Regler mehr – sonst stuenden
 * zwei Bedienelemente fuer dieselbe Flaeche nebeneinander. Welcher Stopp existiert, sagt
 * der Verlauf der Vorlage (`scrimStart` = Anfang, `scrimEnde` = Ende); eine deckende
 * Abdunkelung (Fuellung `scrimEnde`) hat genau einen Stopp.
 */
function einstellbar(zone: Zone): {
  text: boolean
  flaeche: boolean
  scrim: { von: boolean; bis: boolean }
} {
  const verlauf = zone.deko?.verlauf
  const scrim = {
    von: verlauf !== undefined && istScrimRolle(verlauf.vonFarbRolle),
    bis:
      (verlauf !== undefined && istScrimRolle(verlauf.bisFarbRolle)) ||
      istScrimRolle(zone.deko?.füllungFarbRolle),
  }
  return {
    text: zone.text !== undefined,
    // Eine Scrim-Fuellung wird ausschliesslich ueber den Abdunkelungs-Block bedient.
    flaeche: zone.deko?.füllungFarbRolle !== undefined && !scrim.bis,
    scrim,
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

  /** EIN Feld EINES Scrim-Stopps setzen oder entfernen. Dieselbe Haltung wie `setze`:
   *  `null` heisst „die Marke gilt" und wird nicht als Wert gespeichert. */
  function setzeScrim(
    zoneId: string,
    feld: keyof ScrimGestaltung,
    wert: string | number | null,
  ): void {
    const bisher = gestaltung[zoneId] ?? {}
    const bisherScrim = bisher.scrim ?? {}
    // SAFETY: `feld` ist ein Schluessel von `ScrimGestaltung` und `wert` traegt genau den
    // Typ dieses Feldes (der Aufrufer ist typisiert); `null` wird direkt danach entfernt.
    const neuerScrim = { ...bisherScrim, [feld]: wert } as ScrimGestaltung
    if (wert === null) delete neuerScrim[feld]
    const naechsteZone = { ...bisher }
    if (Object.keys(neuerScrim).length === 0) delete naechsteZone.scrim
    else naechsteZone.scrim = neuerScrim
    const naechster = { ...gestaltung }
    if (Object.keys(naechsteZone).length === 0) delete naechster[zoneId]
    else naechster[zoneId] = naechsteZone
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
    // `istScrimZone` fragt die VORLAGE (Rollen), nicht die Liste hier - dieselbe Quelle
    // wie der Zeichenweg. Welche Stopps es gibt, sagt danach `kann.scrim`.
    return kann.text || kann.flaeche || istScrimZone(zone)
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
        const schrift = eigen.schriftRolle ?? zone.text?.schriftRolle ?? 'fliesstext'
        const hatEigeneWahl = Object.keys(eigen).length > 0
        // Scrim: Der Verlauf der Vorlage sagt, welcher Stopp welche Rolle traegt; eine
        // deckende Abdunkelung hat nur den zweiten. Die Rolle liefert Farbton UND
        // Standard-Deckkraft (Alpha der Marke).
        const scrimVonRolle = zone.deko?.verlauf?.vonFarbRolle
        const scrimBisRolle =
          zone.deko?.verlauf?.bisFarbRolle ?? zone.deko?.füllungFarbRolle
        const scrimVonFarbe = eigen.scrim?.vonFarbe ?? null
        const scrimBisFarbe = eigen.scrim?.bisFarbe ?? null
        const scrimVonDeckkraft =
          eigen.scrim?.vonDeckkraft ?? markenDeckkraft(marke, scrimVonRolle)
        const scrimBisDeckkraft =
          eigen.scrim?.bisDeckkraft ?? markenDeckkraft(marke, scrimBisRolle)

        return (
          <div
            key={zone.id}
            data-testid={`aktion-zone-${zone.id}`}
            style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <strong style={{ fontSize: 12, overflowWrap: 'anywhere' }}>
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

            {/* ABDUNKELUNG (05.11.2026): Die beiden Stopps des Verlaufs, je mit Farbe
                und Deckkraft. Kein einzelner „Stärke"-Regler: Der muesste den anderen
                Stopp raten. Nur die Stopps, die die Vorlage wirklich traegt. */}
            {kann.scrim.von && scrimVonRolle !== undefined && (
              <ScrimStopp
                testid={`aktion-zone-${zone.id}-anfang`}
                beschriftung="Anfang"
                farbe={scrimVonFarbe}
                markenWert={ohneAlpha(markenFarbe(marke, scrimVonRolle))}
                deckkraft={scrimVonDeckkraft}
                palette={palette}
                letzteFarben={letzteFarben}
                aufFarbe={(farbe) => {
                  setzeScrim(zone.id, 'vonFarbe', farbe)
                }}
                aufDeckkraft={(prozent) => {
                  setzeScrim(
                    zone.id,
                    'vonDeckkraft',
                    prozent === markenDeckkraft(marke, scrimVonRolle) ? null : prozent,
                  )
                }}
                aufFarbeMerken={aufFarbeMerken}
              />
            )}
            {kann.scrim.bis && scrimBisRolle !== undefined && (
              <ScrimStopp
                testid={`aktion-zone-${zone.id}-ende`}
                beschriftung={zone.deko?.verlauf === undefined ? 'Farbe' : 'Ende'}
                farbe={scrimBisFarbe}
                markenWert={ohneAlpha(markenFarbe(marke, scrimBisRolle))}
                deckkraft={scrimBisDeckkraft}
                palette={palette}
                letzteFarben={letzteFarben}
                aufFarbe={(farbe) => {
                  setzeScrim(zone.id, 'bisFarbe', farbe)
                }}
                aufDeckkraft={(prozent) => {
                  setzeScrim(
                    zone.id,
                    'bisDeckkraft',
                    prozent === markenDeckkraft(marke, scrimBisRolle) ? null : prozent,
                  )
                }}
                aufFarbeMerken={aufFarbeMerken}
              />
            )}

            {kann.text && (
              <>
                {/* SEIT 05.11.2026 (Nacharbeit): Die Schrift fehlte ganz. Sie ist ein
                    ROLLEN-Verweis in die Marke - nie ein Font-Name. */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    minWidth: 0,
                  }}
                >
                  <span style={{ flex: '0 0 auto' }}>Schriftart</span>
                  <select
                    data-testid={`aktion-zone-${zone.id}-schriftart`}
                    aria-label={`Schriftart ${name}`}
                    value={schrift}
                    style={{ flex: '1 1 auto', minWidth: 0 }}
                    onChange={(ereignis) => {
                      const rolle = ereignis.target.value
                      setze(
                        zone.id,
                        'schriftRolle',
                        rolle === zone.text?.schriftRolle ? null : rolle,
                      )
                    }}
                  >
                    {SCHRIFT_ROLLEN.map((rolle) => (
                      <option key={rolle} value={rolle}>
                        {schriftRollenText(rolle).name}
                      </option>
                    ))}
                  </select>
                </label>

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

/**
 * EIN Stopp der Abdunkelung: Farbe (derselbe Waehler wie ueberall) und Deckkraft.
 *
 * Die Deckkraft steht als eigener Regler, weil `#RRGGBB` keinen Alpha-Wert traegt und
 * der System-Farbwaehler keinen kennt. Der Regler zeigt den GELTENDEN Wert: ohne eigene
 * Wahl den Alpha-Wert der Markenrolle, sonst die eigene Zahl.
 */
function ScrimStopp({
  testid,
  beschriftung,
  farbe,
  markenWert,
  deckkraft,
  palette,
  letzteFarben,
  aufFarbe,
  aufDeckkraft,
  aufFarbeMerken,
}: {
  testid: string
  beschriftung: string
  farbe: string | null
  markenWert: string | null
  deckkraft: number
  palette: readonly PalettenFarbe[]
  letzteFarben: readonly string[]
  aufFarbe: (farbe: string | null) => void
  aufDeckkraft: (prozent: number) => void
  aufFarbeMerken: (farbe: string) => void
}): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <FarbWahl
        testid={testid}
        beschriftung={beschriftung}
        wert={farbe}
        markenWert={markenWert}
        palette={palette}
        letzteFarben={letzteFarben}
        aufWahl={aufFarbe}
        aufFarbeMerken={aufFarbeMerken}
      />
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          minWidth: 0,
        }}
      >
        <span style={{ flex: '0 0 auto' }}>Deckkraft</span>
        <input
          type="range"
          data-testid={`${testid}-deckkraft`}
          aria-label={`Deckkraft ${beschriftung}`}
          min={GESTALTUNG_GRENZEN.deckkraft.min}
          max={GESTALTUNG_GRENZEN.deckkraft.max}
          step={5}
          value={deckkraft}
          style={{ flex: '1 1 auto', minWidth: 0 }}
          onChange={(ereignis) => {
            aufDeckkraft(Number(ereignis.target.value))
          }}
        />
        <span style={{ flex: '0 0 auto', color: '#9aa4b2' }}>{`${String(deckkraft)} %`}</span>
      </label>
    </div>
  )
}
