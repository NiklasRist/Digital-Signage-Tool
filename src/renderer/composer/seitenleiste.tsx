// [composer] Das Sidepanel - eine senkrechte Leiste und das Panel, das sie umschaltet.
//
// ENTSCHEIDUNG Niklas, 02.11.2026: „panel und rail sollten dasselbe sein … so eine vertikale
// Leiste wie in VS Code wo man zwischen verschiedenen sidepanels wechseln kann". Damit gibt es
// KEINE zweite Spalte und KEIN Overlay - die Rail IST das Panel.
//
// DREI ZUSTAENDE, mehr nicht:
//   1. Leiste allein  -> das Panel ist zu, die Buehne bekommt die Breite.
//   2. Leiste + Panel -> eine Ansicht ist offen.
//   3. Klick auf das AKTIVE Symbol -> das Panel geht zu (VS-Code-Verhalten).
//
// WARUM DIE BREITE NICHT GEZOGEN WIRD: Niklas hat das ausdruecklich verworfen
// („expandable und collapsable macht glaub gar keinen Sinn"). Die Breite wird EINMAL
// festgelegt und am Fenster gemessen; zwei Konstanten, keine Zustandsvariable.
//
// WARUM `aufWechsel` den GANZEN naechsten Zustand nimmt: Der Klick auf ein Symbol hat zwei
// moegliche Folgen (wechseln oder zuklappen). Rechnete der Aufrufer das nach, gaebe es die
// Regel an zwei Stellen. Hier steht sie EINMAL - der Aufrufer speichert nur.

import type { JSX, ReactNode } from 'react'

import {
  SymbolFilm,
  SymbolKnopf,
  SymbolListe,
  SymbolPfeilLinks,
  SymbolRegler,
} from '../gemeinsam/symbole.tsx'

/** Die drei Ansichten des Panels. Mehr gibt es nicht (Abschnitt 10 des Konzepts). */
export type PanelAnsicht = 'video' | 'aktionen' | 'eigenschaften'

export interface PanelLage {
  ansicht: PanelAnsicht
  offen: boolean
}

/** Breite der Leiste. Traegt drei Symbole in 28er-Knoepfen. */
export const LEISTE_BREITE = 36
/** Breite des Panels. Heute die Breite der alten Rail (240) - gemessen, nicht geschaetzt. */
export const PANEL_BREITE = 240

export interface SeitenleisteEigenschaften {
  /** Welche Ansicht offen ist und ob das Panel ueberhaupt offen ist. */
  lage: PanelLage
  /** Der naechste Zustand nach einem Klick - die Regel liegt in diesem Bauteil. */
  aufWechsel: (lage: PanelLage) => void
  /** Der Inhalt der offenen Ansicht. */
  children: ReactNode
}

const ANSICHTEN: ReadonlyArray<{ id: PanelAnsicht; beschriftung: string; symbol: JSX.Element }> = [
  { id: 'video', beschriftung: 'Video', symbol: <SymbolFilm /> },
  { id: 'aktionen', beschriftung: 'Aktionen', symbol: <SymbolListe /> },
  { id: 'eigenschaften', beschriftung: 'Eigenschaften', symbol: <SymbolRegler /> },
]

export function Seitenleiste(p: SeitenleisteEigenschaften): JSX.Element {
  // DIE EINE REGEL: Klick auf die offene Ansicht schliesst, jeder andere Klick oeffnet sie.
  const klick = (ziel: PanelAnsicht): void => {
    p.aufWechsel({ ansicht: ziel, offen: !(p.lage.offen && p.lage.ansicht === ziel) })
  }

  return (
    <div
      data-testid="sidepanel"
      data-offen={p.lage.offen ? 'ja' : 'nein'}
      data-ansicht={p.lage.ansicht}
      style={{ display: 'flex', flex: '0 0 auto', gap: 8, minHeight: 0 }}
    >
      <nav
        data-testid="sidepanel-leiste"
        aria-label="Seitenpanel"
        style={{
          flex: '0 0 auto',
          width: LEISTE_BREITE,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          padding: '6px 0',
          // Dieselbe Flaeche wie das Panel: Leiste und Panel sind EIN Bauteil.
          background: '#17171b',
          border: '1px solid #2c2c34',
          borderRadius: 8,
        }}
      >
        {ANSICHTEN.map((eintrag) => (
          <SymbolKnopf
            key={eintrag.id}
            kennung={`sidepanel-ansicht-${eintrag.id}`}
            beschriftung={eintrag.beschriftung}
            groesse={28}
            ton="dunkel"
            // `gedrueckt` ist nur gesetzt, wenn diese Ansicht offen ist - die Leiste zeigt
            // damit GENAU EINE aktive Ansicht, auch wenn das Panel zu ist.
            gedrueckt={p.lage.offen && p.lage.ansicht === eintrag.id}
            aufKlick={() => klick(eintrag.id)}
          >
            {eintrag.symbol}
          </SymbolKnopf>
        ))}
        {/* Der Zuklapp-Weg steht UNTEN und ist immer da: ohne ihn waere das Panel bei
            geschlossenem Zustand nicht mehr zu oeffnen (der Einstieg muss sichtbar bleiben). */}
        <span style={{ flex: '1 1 auto' }} />
        <SymbolKnopf
          kennung="sidepanel-zuklappen"
          beschriftung={p.lage.offen ? 'Panel zuklappen' : 'Panel aufklappen'}
          groesse={28}
          ton="dunkel"
          aufKlick={() => p.aufWechsel({ ansicht: p.lage.ansicht, offen: !p.lage.offen })}
        >
          <span
            style={{
              display: 'inline-flex',
              transform: p.lage.offen ? undefined : 'rotate(180deg)',
            }}
          >
            <SymbolPfeilLinks />
          </span>
        </SymbolKnopf>
      </nav>

      {p.lage.offen && (
        <div
          data-testid="composer-rail"
          style={{
            flex: '0 0 auto',
            width: PANEL_BREITE,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            // Eigene Flaeche mit Rand: ohne sie schwimmen Leiste und Buehne im selben
            // Schwarz (am Bild beurteilt, 01.11.2026).
            background: '#17171b',
            border: '1px solid #2c2c34',
            borderRadius: 8,
            padding: 8,
            // EIN Scrollbereich fuer das ganze Panel: sonst scrollt der Inhalt unter
            // seinem eigenen Kopf weg.
            overflowY: 'auto',
          }}
        >
          {p.children}
        </div>
      )}
    </div>
  )
}
