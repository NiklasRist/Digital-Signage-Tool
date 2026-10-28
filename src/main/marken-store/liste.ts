// [marken-store] listeMarken – der vollständige, aufgelöste Marken-Bestand

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Marke } from '../../shared/contracts/marke'
import type { MarkenFehlercode } from './fehlercodes'
import { ladeBestand } from './schreibe-marken'
import { loeseMarkeAuf } from './vererbung'
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
