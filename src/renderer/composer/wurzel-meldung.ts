// S2 des Composer-Umbaus (docs/agents/composer-umbau-plan.md, Naht N2).
//
// Der EINE Griff fuer die stehende Wurzel-Meldung. Die Wurzel setzte dieselbe
// Fehlermeldung zuvor 15x von Hand: `setzeLage((alt) => melde(alt, { code,
// meldung, warnung: true }))`. Dieser Melder kapselt genau das - eine Adresse,
// ein Verhalten (immer Warnung), kein zweiter Meldeweg.
//
// Er hat absichtlich die Form `(code, meldung) => void`: so passt er direkt auf
// die `aufFehler`/`meldeFehler`-Rueckrufe der Bausteine.

import type { Dispatch, SetStateAction } from 'react'

import { melde, type ComposerLage } from './composer-montage'

/** Bildet den Sicht-Schreiber auf einen Melder `(code, meldung) => void` ab. */
export function wurzelMelder(
  setzeLage: Dispatch<SetStateAction<ComposerLage>>,
): (code: string, meldung: string) => void {
  return (code, meldung) => {
    setzeLage((alt) => melde(alt, { code, meldung, warnung: true }))
  }
}
