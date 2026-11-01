import type { JSX } from "react";

import type { Listenelement } from "../../shared/contracts/project";
import { berechneGesamtlaenge, formatiereLaenge } from "./gesamtlaenge";

export interface StatistikZeile {
  bezeichnung: string
  wert: string
}

export type StatistikAusgabe =
  | { zustand: 'keinProjekt' }
  | { zustand: 'fehler'; meldung: string }
  | { zustand: 'geladen'; zeilen: StatistikZeile[]; warnung: boolean }

/** Baut die Statistik-Zeilen aus der Liste. Rein rechnend, kein Zustand, kein Werfen. */
export function baueStatistik(liste: readonly Listenelement[]): StatistikAusgabe {
  const ergebnis = berechneGesamtlaenge([...liste])
  if (!ergebnis.ok) {
    return { zustand: 'fehler', meldung: ergebnis.fehler.meldung }
  }

  const { sekunden, warnung } = ergebnis.wert

  const videos = liste.filter((element) => element.art === 'video')
  const segmente = liste.filter((element) => element.art === 'segment')

  return {
    zustand: 'geladen',
    warnung,
    zeilen: [
      { bezeichnung: 'Gesamtdauer', wert: formatiereLaenge(sekunden) },
      { bezeichnung: 'Elemente', wert: String(liste.length) },
      { bezeichnung: 'Videos', wert: String(videos.length) },
      { bezeichnung: 'Aktions-Segmente', wert: String(segmente.length) },
      {
        bezeichnung: '30-Minuten-Warnung',
        wert: warnung ? 'überschritten' : 'unter der Schwelle',
      },
    ],
  }
}

/** Das Statistik-Panel im Reiter Zusammenstellen. */export function Statistik({ liste }: { liste: readonly Listenelement[] }): JSX.Element {
  const ausgabe = baueStatistik(liste)

  if (ausgabe.zustand === 'keinProjekt') {
    return <div data-testid="statistik-kein-projekt" />
  }
  if (ausgabe.zustand === 'fehler') {
    return (
      <div data-testid="statistik-fehler" style={{ fontSize: 12, color: '#e5634d' }}>
        {ausgabe.meldung}
      </div>
    )
  }

  return (
    <div
      data-testid="statistik"
      style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12, lineHeight: 1.35 }}
    >
      {/* 01.11.2026: Als ZEILEN statt als Fliesstext. Vorher stand hier eine
          Aneinanderreihung ("Gesamtdauer 0:12 Elemente 2 Videos 1 ..."), die in der
          schmalen Rail umbrach und wie ein Satz aussah. Jetzt: Bezeichnung links,
          Wert rechts, gleiche Kante. */}
      {ausgabe.zeilen.map((zeile) => (
        <div
          key={zeile.bezeichnung}
          style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}
        >
          <span
            style={{
              color: '#8f8f8f',
              flex: '1 1 auto',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={zeile.bezeichnung}
          >
            {zeile.bezeichnung}
          </span>
          <span
            data-testid={`statistik-${zeile.bezeichnung}`}
            style={{ flex: '0 0 auto', fontVariantNumeric: 'tabular-nums' }}
          >
            {zeile.wert}
          </span>
        </div>
      ))}
      {ausgabe.warnung && (
        <span data-testid="statistik-warnung" style={{ color: '#d9a441' }}>
          Die Wiedergabeliste überschreitet 30 Minuten.
        </span>
      )}
    </div>
  );
}
