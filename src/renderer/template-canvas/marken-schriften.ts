// Issue #291 – Importierte Schriften je Marke laden (TK 9.10.4, 9.15.3, 9.10.3 Punkt 3).
//
// Diese Datei kennt nur den Ladeweg und den Nachweis für Schriften mit
// herkunft: "importiert". Die vier gebündelten Marken-Schriften lädt weiterhin
// stelleSchriftenBereit() (#8/M4-16) beim App-Start – hier wird nichts angefasst.
// Es gibt keinen stillen Ersatz auf eine gebündelte Schrift: Schlägt das Laden
// fehl, bleibt der Zustand "nicht bereit" (Determinismus, TK 9.10.3).

import type { Marke, Schrift } from '../../shared/contracts/marke'

import { schriftKurzform } from './schriften'

// Bestand je markeId: nur erfolgreich gestartete Ladevorgänge stehen drin, ein
// abgelehntes Promise wird wieder entfernt – der nächste Aufruf versucht es erneut.
const bestand = new Map<string, Promise<void>>()

function importierteSchriften(marke: Marke): Schrift[] {
  return Object.values(marke.schriften).filter((schrift) => schrift.herkunft === 'importiert')
}

export async function stelleMarkenSchriftenBereit(marke: Marke): Promise<void> {
  const vorhandenes = bestand.get(marke.id)
  if (vorhandenes) return vorhandenes

  const laden = (async () => {
    for (const schrift of importierteSchriften(marke)) {
      const gesicht = new FontFace(
        schrift.familie,
        `url(marken://${marke.id}/${schrift.datei})`,
        { weight: String(schrift.gewicht) },
      )
      document.fonts.add(gesicht)
      await gesicht.load()
    }
  })()

  bestand.set(marke.id, laden)
  void laden.catch(() => {
    // Abgelehntes Promise nicht merken: nächster Aufruf lädt erneut.
    if (bestand.get(marke.id) === laden) bestand.delete(marke.id)
  })
  return laden
}

export function sindMarkenSchriftenBereit(marke: Marke): boolean {
  const schriften = importierteSchriften(marke)
  // Nichts zu prüfen – auch ohne vorherigen stelleMarkenSchriftenBereit-Aufruf true.
  if (schriften.length === 0) return true
  if (!bestand.has(marke.id)) return false
  return schriften.every((schrift) => document.fonts.check(schriftKurzform(schrift, 16)))
}

export function leereMarkenSchriftBestand(): void {
  bestand.clear()
}
