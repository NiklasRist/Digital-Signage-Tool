// [marken-store] listeMarken – der vollständige, aufgelöste Marken-Bestand

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Marke } from '../../shared/contracts/marke'
import type { MarkenFehlercode } from './fehlercodes'
import { ladeBestand } from './schreibe-marken'
import { loeseMarkeAuf } from './vererbung'

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #277: interface MarkenEintrag {
//            id: string; name: string; parent: string | null; eingebaut: boolean
//            farben: Partial<Record<FarbRolle, string>>
//            schriften: Partial<Record<SchriftRolle, Schrift>>
//            logo?: { datei: string; herkunft: Herkunft; seitenverhaeltnis: number } | null
//            sicherheit?: { horizontal: number; vertikal: number }
//            radien?: { pille: number; karte: number; klein: number }
//            schatten?: { versatzY: number; weichzeichnen: number; farbe: string }
//            slogan?: { text: string; aktiv: boolean }
//          }
//          // RAW Speicherform in marken.json – NICHT der geteilte Typ `Marke`. Bei einer
//          // abgeleiteten Marke (parent !== null) fehlen absichtlich Felder (TK 9.11.2, Teilmenge).
//          ladeBestand(): Promise<Ergebnis<MarkenEintrag[], MarkenFehlercode>>
//          // vollstaendiger, ROHER Bestand als TIEFE Kopie, IN Bestandsreihenfolge
//   #279: loeseMarkeAuf(eintrag: MarkenEintrag, bestand: MarkenEintrag[]): Ergebnis<Marke, MarkenFehlercode>
//          // wendet die feldweise Vererbung an (eine Stufe, TK 9.11.2); sucht den Parent im
//          // uebergebenen bestand; fehlt der referenzierte Parent -> marke_nicht_gefunden
//   #276: type MarkenFehlercode =
//            'marke_referenziert' | 'marke_eingebaut' | 'marke_nicht_gefunden'
//            | 'marken_datei_fehlt' | 'speicher_fehler'

/** Alle Marken des Bestands, jede AUFGELÖST. Keine Filterung, keine Sortierung. */
export async function listeMarken(): Promise<Ergebnis<Marke[], MarkenFehlercode>> {
  try {
    // SCHRITT 1: Bestand laden; ein Fehler wird UNVERAENDERT durchgereicht - die leere
    // Liste ist hier NIEMALS ein Erfolg (kein stiller Fehlschlag, TK 9.1.1 Punkt 7).
    const geladen = await ladeBestand()
    if (!geladen.ok) {
      return geladen
    }

    const aufgeloest: Marke[] = []
    // SCHRITT 2: JEDER Eintrag, in BESTANDSREIHENFOLGE, je ein eigener Aufruf - kein
    // eigener Index-Verfassungsaufbau (die Signatur von #279 erwartet das Array, es gilt
    // unverändert).
    for (const eintrag of geladen.wert) {
      const ergebnis = loeseMarkeAuf(eintrag, geladen.wert)
      if (!ergebnis.ok) {
        // SCHRITT 3: ein scheiternder Eintrag BRICHT die gesamte Funktion ab - keine
        // Teilliste, kein Auslassen des betroffenen Eintrags (ENTSCHIEDEN; eine verkürzte
        // Liste sähe für den Nutzer wie eine vollständige aus).
        return ergebnis
      }
      aufgeloest.push(ergebnis.wert)
    }

    // SCHRITT 4: alle aufgelösten Marken, in Bestandsreihenfolge, je samt herkunftJeFeld -
    // der Stempel reist unverändert aus loeseMarkeAuf; hier wird nichts berechnet.
    return { ok: true, wert: aufgeloest }
  } catch (ursache) {
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: ursache instanceof Error ? ursache.message : String(ursache),
      },
    }
  }
}
