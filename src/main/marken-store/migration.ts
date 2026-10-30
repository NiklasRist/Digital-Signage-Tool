// [marken-store] Migration – bestehende Projekte auf die eingebaute Marke ausrichten

import type { Project } from '../../shared/contracts/project'

/**
 * REINE Funktion (kein I/O): Prueft ein bereits geladenes Project darauf, ob standardMarkeId bzw.
 * eine oder mehrere Aktion.markeId fehlen, und ergaenzt sie um eingebauteMarkeId. Aendert NICHTS an
 * Feldern, die bereits gesetzt sind (auch nicht, wenn sie auf eine andere, gueltige Marke zeigen –
 * ein Projekt, das bereits eine Marke gewaehlt hat, wird NICHT ueberschrieben).
 *
 * Gibt IMMER eine neue, unveraenderte oder ergaenzte Kopie zurueck; `geaendert` sagt dem Aufrufer,
 * ob ueberhaupt etwas zu schreiben ist (vermeidet unnoetige Schreibvorgaenge fuer bereits
 * migrierte Projekte).
 */
export function migriereProjektAufMarke(
  project: Project,
  eingebauteMarkeId: string,
): { project: Project; geaendert: boolean } {
  // REINE Funktion, idempotent: nur LEERE (fehlend/leer/kein String) Referenzen werden
  // ergaenzt; gesetzte (auch auf eine andere, beliebige ID) bleiben unangetastet. Das
  // Argument wird NICHT mutiert - es entsteht im Bedarfsfall eine neue, ergaenzte Kopie.
  let geaendert = false

  // SAFETY: `standardMarkeId` kann in einer ALTEN project.json fehlen; der Cast macht das
  // Feld als unknown LESBAR - die Pruefung auf "nicht leerer Text" folgt zwei Zeilen spaeter.
  const standardMarkeId = (project as unknown as Record<string, unknown>)["standardMarkeId"]
  let projektKopie: Project = project
  if (!(typeof standardMarkeId === 'string' && standardMarkeId.length > 0)) {
    projektKopie = {
      ...projektKopie,
      standardMarkeId: eingebauteMarkeId,
    }
    geaendert = true
  }

  let aktionenKopie = projektKopie.aktionen
  let aktionenGeaendert = false
  aktionenKopie = aktionenKopie.map((aktion) => {
    // SAFETY: wie oben - `markeId` kann in einer alten Datei fehlen; geprueft wird der
    // Wert unmittelbar danach, ein gesetzter Wert bleibt unangetastet.
    const markeId = (aktion as unknown as Record<string, unknown>)["markeId"]
    if (typeof markeId === 'string' && markeId.length > 0) {
      return aktion // bereits gesetzt - unangetastet (auch auf fremde ID)
    }
    aktionenGeaendert = true
    return {
      ...aktion,
      markeId: eingebauteMarkeId,
    }
  })
  if (aktionenGeaendert) {
    projektKopie = { ...projektKopie, aktionen: aktionenKopie }
    geaendert = true
  }

  return { project: projektKopie, geaendert }
}
