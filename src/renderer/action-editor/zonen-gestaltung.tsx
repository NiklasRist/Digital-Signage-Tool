// [action-editor] Farbe, Groesse und Ausrichtung je Zone (05.11.2026, TK 9.8.8)
//
// WARUM ES DIESE DATEI GIBT: Bis hierher liess sich an einer Aktion genau EINE Farbe
// einstellen (`akzentfarbe`), und sie wirkte nur dort, wo die VORLAGE eine Akzent-Rolle
// benutzt - in „Ganzflächig" also auf der Preis-Pille. Niklas, 05.11.2026: „man hat
// momentan einfach keine kontrolle". Diese Datei gibt die Kontrolle ueber die Zonen
// zurueck, die die Vorlage tatsaechlich zeichnet.
//
// DIE QUELLE IST DIE VORLAGE, NICHT EINE LISTE HIER: Angezeigt wird je Zone, was die
// Zone selbst traegt - eine Textfarbe nur bei `zone.text`, eine Flaechenfarbe nur bei
// `zone.deko.füllungFarbRolle`. Ein Verlauf (`deko.verlauf`) bekommt bewusst keinen
// Regler: zwei Stopps mit einer Farbe zu bedienen hiesse, den anderen zu raten.
// Dieselbe Regel wertet `template-canvas/farben.ts` aus - Anzeige und Wirkung koennen
// deshalb nicht auseinanderlaufen.
//
// WAS HIER NICHT PASSIERT: kein IPC, kein Speichern, kein eigener Zustand fuer den
// Entwurf. Jede Aenderung geht ueber `aufAendern` in den Entwurf der Wurzel; geschrieben
// wird beim Abschluss (ein Undo-Schritt je Vorgang, TK 9.13.1).

import type { Vorlage, Zone } from '../../shared/contracts/vorlage'
import type { Marke } from '../../shared/contracts/marke'
import type { AktionsInhalt, ZonenGestaltung } from '../../shared/contracts/aktion'
import type { JSX } from 'react'
import { GESTALTUNG_GRENZEN, istHexFarbe } from '../../shared/gestaltung'
import { zonenText } from '../gemeinsam/zonen-texte'

/** Die Farbe, die ohne eigene Wahl gilt: die Rollen-Farbe der bereiten Marke. */
function markenFarbe(marke: Marke | null, rolle: string | undefined): string {
  if (marke === null || rolle === undefined) return '#000000'
  // SAFETY: `rolle` kommt aus der Vorlage und ist laut Vertrag eine `FarbRolle`; ein
  // handeditierter Wert trifft die Marke nicht und faellt auf Schwarz zurueck - die
  // Vorschau zeigt dann den Wert, der ohne eigene Wahl auch gezeichnet wuerde.
  const wert = (marke.farben as Record<string, string>)[rolle]
  return typeof wert === 'string' && istHexFarbe(wert) ? wert : '#000000'
}

/**
 * Hat diese Zone etwas, das man einstellen kann?
 * `grund` sagt, WOZU der Regler gehoert - die Beschriftung im Formular.
 */
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
  aufAendern,
}: {
  vorlage: Vorlage | null
  entwurf: AktionsInhalt
  marke: Marke | null
  /** Setzt den GANZEN Record - der Entwurf ist die einzige Wahrheit (s. Modulkopf). */
  aufAendern: (gestaltung: Record<string, ZonenGestaltung>) => void
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
        Zonen erscheinen, sobald die Vorlage geladen ist.
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
    <div data-testid="aktion-zonen" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {zonen.map((zone) => {
        const kann = einstellbar(zone)
        const name = zonenText(zone.id).name
        const eigen = gestaltung[zone.id] ?? {}
        const eigeneTextfarbe = typeof eigen.textfarbe === 'string' ? eigen.textfarbe : null
        const eigeneFlaeche = typeof eigen.flaechefarbe === 'string' ? eigen.flaechefarbe : null
        const groesse = eigen.groesseProzent ?? 100
        const ausrichtung = eigen.ausrichtung ?? zone.ausrichtung.horizontal
        const hatEigeneWahl =
          Object.keys(eigen).length > 0

        return (
          <div key={zone.id} data-testid={`aktion-zone-${zone.id}`} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <strong style={{ fontSize: 12 }}>{name}</strong>
              <span style={{ flex: '1 1 auto' }} />
              {hatEigeneWahl && (
                <button
                  type="button"
                  data-testid={`aktion-zone-${zone.id}-zuruecksetzen`}
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
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                Schrift
                <input
                  key={`textfarbe-${eigeneTextfarbe ?? markenFarbe(marke, zone.text?.farbRolle)}`}
                  type="color"
                  data-testid={`aktion-zone-${zone.id}-textfarbe`}
                  aria-label={`Schriftfarbe ${name}`}
                  defaultValue={eigeneTextfarbe ?? markenFarbe(marke, zone.text?.farbRolle)}
                  // Bewusst `onBlur` und nicht `onChange`: Ein Farbwaehler feuert beim
                  // Ziehen viele Aenderungen, und jede zeichnet die 1920x1080-Vorschau
                  // neu. Dieselbe Ueberlegung wie beim Akzentfeld (03.11.2026).
                  onBlur={(ereignis) => {
                    const farbe = ereignis.target.value
                    const markeWert = markenFarbe(marke, zone.text?.farbRolle)
                    setze(zone.id, 'textfarbe', farbe.toLowerCase() === markeWert.toLowerCase() ? null : farbe)
                  }}
                />
                {eigeneTextfarbe !== null && (
                  <button
                    type="button"
                    data-testid={`aktion-zone-${zone.id}-textfarbe-marke`}
                    onClick={() => {
                      setze(zone.id, 'textfarbe', null)
                    }}
                  >
                    Markenwert
                  </button>
                )}
              </label>
            )}

            {kann.flaeche && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                Fläche
                <input
                  key={`flaeche-${eigeneFlaeche ?? markenFarbe(marke, zone.deko?.füllungFarbRolle)}`}
                  type="color"
                  data-testid={`aktion-zone-${zone.id}-flaeche`}
                  aria-label={`Flächenfarbe ${name}`}
                  defaultValue={eigeneFlaeche ?? markenFarbe(marke, zone.deko?.füllungFarbRolle)}
                  onBlur={(ereignis) => {
                    const farbe = ereignis.target.value
                    const markeWert = markenFarbe(marke, zone.deko?.füllungFarbRolle)
                    setze(zone.id, 'flaechefarbe', farbe.toLowerCase() === markeWert.toLowerCase() ? null : farbe)
                  }}
                />
                {eigeneFlaeche !== null && (
                  <button
                    type="button"
                    data-testid={`aktion-zone-${zone.id}-flaeche-marke`}
                    onClick={() => {
                      setze(zone.id, 'flaechefarbe', null)
                    }}
                  >
                    Markenwert
                  </button>
                )}
              </label>
            )}

            {kann.text && (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  Größe
                  <input
                    type="range"
                    data-testid={`aktion-zone-${zone.id}-groesse`}
                    aria-label={`Textgröße ${name}`}
                    min={GESTALTUNG_GRENZEN.groesseProzent.min}
                    max={GESTALTUNG_GRENZEN.groesseProzent.max}
                    step={5}
                    value={groesse}
                    onChange={(ereignis) => {
                      const wert = Number(ereignis.target.value)
                      setze(zone.id, 'groesseProzent', wert === 100 ? null : wert)
                    }}
                  />
                  <span style={{ color: '#9aa4b2' }}>{`${String(groesse)} %`}</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                  <span>Ausrichtung</span>
                  {(['links', 'mitte', 'rechts'] as const).map((wert) => (
                    <button
                      key={wert}
                      type="button"
                      data-testid={`aktion-zone-${zone.id}-ausrichtung-${wert}`}
                      aria-pressed={ausrichtung === wert}
                      onClick={() => {
                        setze(zone.id, 'ausrichtung', wert === zone.ausrichtung.horizontal ? null : wert)
                      }}
                      style={{
                        fontWeight: ausrichtung === wert ? 700 : 400,
                        border: ausrichtung === wert ? '2px solid #6ea8fe' : '1px solid #444',
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
