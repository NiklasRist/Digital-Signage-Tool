// [composer] Die FOLGE eines Blocks - was er zum Ganzen beitraegt.
//
// WARUM ES DIESE DATEI GIBT (02.11.2026, Messlatte): Die Eigenschaften zeigten bisher einen
// Regler und eine Zahl („10 s"). Wer wissen wollte, was das fuer das Video bedeutet, musste
// rechnen oder rendern. Hier steht die Folge: Gesamtlaenge, Bandwiederholungen, Startstelle.
//
// REIN: keine Anzeige, kein DOM. `eigenschaften-ansicht.tsx` zeigt nur, was hier steht.
// Es wird NICHTS neu erfunden: Gesamtlaenge, Bandspur und Verwendungen kommen aus den
// bestehenden Rechnungen (`gesamtlaenge.ts`, `zeitband.ts`, `verwendungen.ts`).

import type { Listenelement, Project } from '../../shared/contracts/project'
import { berechneGesamtlaenge, formatiereLaenge } from './gesamtlaenge'
import { baueVerwendungen, formatiereSekunden } from './verwendungen'

export interface Folge {
  /** Die Gesamtlaenge des Projekts in Sekunden; null = nicht bestimmbar. */
  gesamtSekunden: number | null
  /** Wie oft die Bandfolge ins Video passt (nur bei einer Aktion im Band). */
  bandWiederholungen: number | null
  /** Ab welcher Sekunde diese Aktion im Band laeuft. */
  abSekunden: number | null
}

/** Die Folge fuer EIN Element aus der Sicht des ganzen Projekts. */
export function berechneFolge(projekt: Project, element: Listenelement): Folge {
  const gesamt = berechneGesamtlaenge([...projekt.liste])
  const gesamtSekunden = gesamt.ok ? gesamt.wert.sekunden : null

  // Nur ein SEGMENT kann im Band laufen (`ref` ist dann die Aktions-ID).
  if (element.art !== 'segment') {
    return { gesamtSekunden, bandWiederholungen: null, abSekunden: null }
  }
  const verwendung = baueVerwendungen(projekt.liste).get(element.ref)
  if (verwendung === undefined || verwendung.band === null) {
    return { gesamtSekunden, bandWiederholungen: null, abSekunden: null }
  }
  return {
    gesamtSekunden,
    bandWiederholungen: verwendung.band.wiederholungen,
    abSekunden: verwendung.band.abSekunden,
  }
}

/**
 * Der Text der Folge. Er nennt nur, was gilt: fehlt die Gesamtlaenge, steht dort ein
 * Strich und keine erfundene Zahl.
 */
export function folgeText(folge: Folge): string {
  const teile: string[] = []
  teile.push(
    folge.gesamtSekunden === null
      ? 'Gesamt unbekannt'
      : `Gesamt ${formatiereLaenge(folge.gesamtSekunden)}`,
  )
  if (folge.bandWiederholungen !== null && folge.bandWiederholungen > 1) {
    teile.push(`Band ${folge.bandWiederholungen}×`)
  }
  if (folge.abSekunden !== null) {
    teile.push(`ab ${formatiereSekunden(folge.abSekunden)}`)
  }
  return teile.join(' · ')
}
