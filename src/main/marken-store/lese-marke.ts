// [marken-store] leseMarke(markeId) – die eine aufgelöste Marke

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Marke } from '../../shared/contracts/marke'
import type { MarkenFehlercode } from './fehlercodes'
import { ladeBestand } from './schreibe-marken'
import { loeseMarkeAuf } from './vererbung'
/** Liefert die AUFGELÖSTE Marke zu markeId. Kein Filtern, keine Vererbung außerhalb von loeseMarkeAuf. */
export async function leseMarke(markeId: string): Promise<Ergebnis<Marke, MarkenFehlercode>> {
  // SCHRITT 1: die Form - ohne jede Wirkung auf die Daten (TK 9.1.1 Punkt 6). Der Vergleich
  // ist EXAKT (kein toLowerCase, kein localeCompare, kein trim): UUIDs sind laut
  // crypto.randomUUID() immer klein geschrieben (TK 9.11.4); eine Toleranz nur fuer
  // Marken haette zwei verschieden geschriebene IDs auf denselben Eintrag abgebildet.
  if (typeof markeId !== 'string' || markeId.length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'leseMarke wurde ohne gueltige markeId aufgerufen (leer oder kein Text).',
      },
    }
  }

  // SCHRITT 2: Bestand laden; ein Fehler wird UNVERAENDERT durchgereicht.
  try {
    const geladen = await ladeBestand()
    if (!geladen.ok) {
      return geladen
    }

    // SCHRITT 3: exakte Suche nach der ID - kein zweiter Vererbungsschritt hier.
    const eintrag = geladen.wert.find((kandidat) => kandidat.id === markeId)
    if (eintrag === undefined) {
      return {
        ok: false,
        fehler: {
          code: 'marke_nicht_gefunden',
          meldung: `Es steht keine Marke mit der Kennung '${markeId}' im Bestand.`,
        },
      }
    }

    // SCHRITT 4: die AUFGLOESTE Marke kommt aus loeseMarkeAuf (#279) - dort entsteht auch
    // der Herkunfts-Stempel herkunftJeFeld; beide gehen hier UNVERAENDERT durch. Kein
    // Nachbessern, kein Weglassen, kein Feld-fuer-Feld-Vergleich (verboten, TK 9.15.2).
    return loeseMarkeAuf(eintrag, geladen.wert)
  } catch (ursache) {
    // Unerwartete Ausnahme: gefangen und als Huelle gemeldet, kein Wurf ueber die Grenze.
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: ursache instanceof Error ? ursache.message : String(ursache),
      },
    }
  }
}
