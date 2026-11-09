// [action-editor] Die Gruppe „Effekte" (09.11.2026, FA-25 / TK 9.16.6)
//
// ZEHN EINZELNE SCHALTER, kein Paket: Wer nur „Ken Burns" will, soll nicht sieben andere
// mitnehmen. Alles geht in den ENTWURF; geschrieben wird beim Abschluss (9.8.6), hier
// gibt es keinen IPC-Aufruf.
//
// NORMALISIERT WIRD BEIM SCHREIBEN, nicht beim Zeichnen: Was hier entsteht, ist schon
// geklemmt (Staerke 0–100, Fenster 0,3–3 s und nicht laenger als das Segment). Sonst
// stuende in `project.json` ein Wert, den niemand so gemeint hat.

import type { JSX } from 'react'
import type { AktionsInhalt, EffektSatz } from '../../shared/contracts/aktion'
import { EFFEKT_GRENZEN, normalisiereEffekte } from '../../shared/effekte'

export interface EffektGruppeProps {
  entwurf: AktionsInhalt
  /** Dauer des Segments in Sekunden - die Fenster werden darauf geklemmt. */
  dauer: number
  /** Setzt den GANZEN Satz - der Entwurf ist die einzige Wahrheit (9.8.6). */
  aufAendern: (effekte: EffektSatz | null) => void
}

interface FensterZeile {
  name: 'kenBurns' | 'textEinblendung' | 'preisPop' | 'glanzSweep' | 'preisZaehlt' | 'bildReveal' | 'puls'
  titel: string
  ziel: string
  vorgabeBis: number
  braucht: 'preis' | 'bild' | null
}

const FENSTER: readonly FensterZeile[] = [
  { name: 'kenBurns', titel: 'Ken Burns', ziel: 'Bild', vorgabeBis: 1.5, braucht: 'bild' },
  { name: 'textEinblendung', titel: 'Text-Einblendung', ziel: 'Textzonen', vorgabeBis: 0.4, braucht: null },
  { name: 'preisPop', titel: 'Preis-Pop', ziel: 'Preis', vorgabeBis: 0.33, braucht: 'preis' },
  { name: 'glanzSweep', titel: 'Glanz-Sweep', ziel: 'Bild', vorgabeBis: 0.6, braucht: 'bild' },
  { name: 'preisZaehlt', titel: 'Preis zählt hoch', ziel: 'Preis', vorgabeBis: 1, braucht: 'preis' },
  { name: 'bildReveal', titel: 'Bild-Reveal', ziel: 'Bild', vorgabeBis: 0.5, braucht: 'bild' },
  { name: 'puls', titel: 'Puls', ziel: 'Knopf', vorgabeBis: 1.5, braucht: null },
]

const SCHLEIFEN: readonly { name: 'zoomAtmen' | 'drift' | 'parallax'; titel: string; ziel: string }[] = [
  { name: 'zoomAtmen', titel: 'Zoom-Atmen', ziel: 'Bild' },
  { name: 'drift', titel: 'Drift', ziel: 'Bild' },
  { name: 'parallax', titel: 'Parallax (nur mit Bewegung)', ziel: 'Hintergrund' },
]

export function EffektGruppe({ entwurf, dauer, aufAendern }: EffektGruppeProps): JSX.Element {
  const satz: EffektSatz = entwurf.effekte ?? {}

  const schreibe = (next: EffektSatz): void => {
    aufAendern(normalisiereEffekte(next, dauer))
  }

  const istFenster = (name: string): name is FensterZeile['name'] =>
    FENSTER.some((eintrag) => eintrag.name === name)

  const umschalten = (
    name: FensterZeile['name'] | (typeof SCHLEIFEN)[number]['name'],
    an: boolean,
  ): void => {
    const next: EffektSatz = { ...satz }
    if (!an) {
      delete next[name]
    } else if (istFenster(name)) {
      const zeile = FENSTER.find((eintrag) => eintrag.name === name)
      const bis = zeile === undefined ? 1 : Math.min(zeile.vorgabeBis, dauer)
      next[name] = { staerke: 100, vonSekunden: 0, bisSekunden: bis }
    } else {
      next[name] = { staerke: 100 }
    }
    schreibe(next)
  }

  const aendereFenster = (name: FensterZeile['name'], feld: 'staerke' | 'vonSekunden' | 'bisSekunden', wert: number): void => {
    const next: EffektSatz = { ...satz }
    const bisher = next[name]
    if (bisher === undefined) return
    next[name] = { ...bisher, [feld]: wert }
    schreibe(next)
  }

  const aendereSchleife = (name: (typeof SCHLEIFEN)[number]['name'], staerke: number): void => {
    const next: EffektSatz = { ...satz }
    next[name] = { staerke }
    schreibe(next)
  }

  const hinweis = (braucht: FensterZeile['braucht']): string | null => {
    if (braucht === 'preis') {
      return entwurf.preis === null || entwurf.preis.trim() === ''
        ? 'Ohne Preis wirkungslos.'
        : null
    }
    if (braucht === 'bild') {
      return entwurf.bildRef === null ? 'Ohne Bild wirkungslos.' : null
    }
    return null
  }

  const zeile = (text: string, hinweisText: string | null): JSX.Element => (
    <span style={{ fontSize: 11, color: '#9aa4b2' }}>
      {text}
      {hinweisText === null ? '' : ` – ${hinweisText}`}
    </span>
  )

  return (
    <div data-testid="aktion-effekte" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p style={{ color: '#9aa4b2', fontSize: 11, margin: 0 }}>
        Wirkt nur im Ganzbild. Die Dauer ändert sich nie – nur das Bild.
      </p>

      {FENSTER.map((eintrag) => {
        const wert = satz[eintrag.name]
        const an = wert !== undefined && wert.staerke > 0
        return (
          <div key={eintrag.name} data-testid={`effekt-${eintrag.name}`} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <input type="checkbox" checked={an} onChange={(e) => umschalten(eintrag.name, e.target.checked)} />
              {eintrag.titel} <span style={{ color: '#9aa4b2' }}>({eintrag.ziel})</span>
            </label>
            {an && wert !== undefined && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', paddingLeft: 22 }}>
                <input
                  aria-label={`${eintrag.titel} Stärke`}
                  type="number"
                  min={EFFEKT_GRENZEN.staerke.min}
                  max={EFFEKT_GRENZEN.staerke.max}
                  value={wert.staerke}
                  onChange={(e) => aendereFenster(eintrag.name, 'staerke', Number(e.target.value))}
                  style={{ width: 56 }}
                />
                <span style={{ fontSize: 11, color: '#9aa4b2' }}>%</span>
                <input
                  aria-label={`${eintrag.titel} von`}
                  type="number"
                  step={0.1}
                  min={0}
                  max={dauer}
                  value={wert.vonSekunden}
                  onChange={(e) => aendereFenster(eintrag.name, 'vonSekunden', Number(e.target.value))}
                  style={{ width: 56 }}
                />
                <span style={{ fontSize: 11, color: '#9aa4b2' }}>bis</span>
                <input
                  aria-label={`${eintrag.titel} bis`}
                  type="number"
                  step={0.1}
                  min={0}
                  max={dauer}
                  value={wert.bisSekunden}
                  onChange={(e) => aendereFenster(eintrag.name, 'bisSekunden', Number(e.target.value))}
                  style={{ width: 56 }}
                />
                <span style={{ fontSize: 11, color: '#9aa4b2' }}>s</span>
              </div>
            )}
            {an && wert !== undefined && zeile('', hinweis(eintrag.braucht))}
          </div>
        )
      })}

      {SCHLEIFEN.map((eintrag) => {
        const wert = satz[eintrag.name]
        const an = wert !== undefined && wert.staerke > 0
        return (
          <div key={eintrag.name} data-testid={`effekt-${eintrag.name}`} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <input type="checkbox" checked={an} onChange={(e) => umschalten(eintrag.name, e.target.checked)} />
              {eintrag.titel} <span style={{ color: '#9aa4b2' }}>({eintrag.ziel})</span>
            </label>
            {an && wert !== undefined && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', paddingLeft: 22 }}>
                <input
                  aria-label={`${eintrag.titel} Stärke`}
                  type="number"
                  min={EFFEKT_GRENZEN.staerke.min}
                  max={EFFEKT_GRENZEN.staerke.max}
                  value={wert.staerke}
                  onChange={(e) => aendereSchleife(eintrag.name, Number(e.target.value))}
                  style={{ width: 56 }}
                />
                <span style={{ fontSize: 11, color: '#9aa4b2' }}>%</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
