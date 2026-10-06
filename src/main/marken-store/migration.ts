// GENERIERT aus dem Signaturblock von Issue #281.
// [marken-store] Migration – bestehende Projekte auf die eingebaute Marke ausrichten
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: c7b1118d8f6769a5

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
    const markeId = (aktion as unknown as Record<string, unknown>)["markeId"]
    if (typeof markeId === 'string' && markeId.length > 0) {
      return aktion // bereits gesetzt - unangetastet (auch auf fremde ID)
    }
    aktionenGeaendert = true
    return {
      ...aktion,
      markeId: eingebauteMarkeId,
    } as typeof aktion
  })
  if (aktionenGeaendert) {
    projektKopie = { ...projektKopie, aktionen: aktionenKopie }
    geaendert = true
  }

  return { project: projektKopie, geaendert }
}
