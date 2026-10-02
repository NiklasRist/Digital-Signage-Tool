import type { JSX } from "react";

import type { Listenelement } from "../../shared/contracts/project";
import { berechneGesamtlaenge, formatiereLaenge, WARNSCHWELLE_SEKUNDEN } from "./gesamtlaenge";

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
        bezeichnung: `30-Minuten-Warnung (Schwelle ${formatiereLaenge(WARNSCHWELLE_SEKUNDEN)})`,
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
    <div data-testid="statistik" style={{ fontSize: 12 }}>
      {ausgabe.zeilen.map((zeile) => (
        <div key={zeile.bezeichnung} style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: '#8f8f8f' }}>{zeile.bezeichnung}</span>
          <span data-testid={`statistik-${zeile.bezeichnung}`}>{zeile.wert}</span>
        </div>
      ))}
      {ausgabe.warnung && (
        <div data-testid="statistik-warnung" style={{ color: '#d9a441', marginTop: 4 }}>
          Die Wiedergabeliste überschreitet 30 Minuten.
        </div>
      )}
    </div>
  );
}
