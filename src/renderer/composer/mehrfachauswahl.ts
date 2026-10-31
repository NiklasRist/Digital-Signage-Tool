// [composer] Mehrfachauswahl - reine Auswahl-Logik (Issue #392)
//
// WARUM DIESE DATEI KEIN JSX ENTHAELT: Die Auswahl ist eine Rechnung ueber IDs in
// der Array-Reihenfolge der Liste (TK 9.11.3) - keine Darstellung. Die fruehere
// Signatur `Mehrfachauswahl({ liste })` trug die DoD nicht: Ein Bauteil ohne
// Schreibweg und ohne Einbettung waere eine fertige Funktion ohne Aufrufer.
// Entschieden am 31.10.2026 (mit Freigabe, im Issue nachgetragen):
//   Shift  = Bereich (Anker -> Ziel, einschliesslich, in Listenreihenfolge)
//   Cmd/Strg = umschalten
//   Klick  = nur dieses Element
// Gruppen-Entfernen ist EIN Undo-Schritt ueber `setzeListe` (Wurzel), nicht hier:
// Diese Datei liefert nur die gefilterte Liste. Gruppen-Verschieben ist NICHT Teil
// von #392 - es gibt keine Zielregel und keine Operation.

/** Die Auswahl: IDs in LISTENREIHENFOLGE plus der Anker fuer den Bereich. */
export interface Auswahl {
  ids: readonly string[]
  anker: string | null
}

/** Die drei Bedienarten eines Klicks. */
export type KlickModus = 'einzeln' | 'bereich' | 'umschalten'

export const LEERE_AUSWAHL: Auswahl = { ids: [], anker: null }

/** Darstellung der Auswahl - EINE Quelle fuer Liste und Zeitleiste (#392). */
export const AUSWAHLKANTE = '#4d9fff'
export const AUSWAHLFARBE = 'rgba(77, 159, 255, 0.18)'

/** Liest die Bedienart aus einem Mausereignis. Cmd (macOS) und Strg (Windows/Linux)
 *  wirken gleich - die App laeuft auf beiden Plattformen. */
export function klickModusAus(ereignis: {
  shiftKey: boolean
  metaKey: boolean
  ctrlKey: boolean
}): KlickModus {
  if (ereignis.shiftKey) return 'bereich'
  if (ereignis.metaKey || ereignis.ctrlKey) return 'umschalten'
  return 'einzeln'
}

/** Wendet einen Klick auf die Auswahl an. `reihenfolge` ist die Array-Reihenfolge der
 *  Liste - es gibt keine zweite Ordnung (TK 9.11.3, 9.7.4).
 *
 *  Eine ID, die nicht in `reihenfolge` liegt, laesst die Auswahl UNVERAENDERT: Sie
 *  kann nicht angezeigt werden, also darf sie auch nicht ausgewaehlt sein. */
export function klickAuswahl(
  auswahl: Auswahl,
  reihenfolge: readonly string[],
  id: string,
  modus: KlickModus,
): Auswahl {
  const stelle = reihenfolge.indexOf(id)
  if (stelle === -1) return auswahl

  if (modus === 'einzeln') {
    return { ids: [id], anker: id }
  }

  if (modus === 'umschalten') {
    const vorhanden = auswahl.ids.includes(id)
    if (vorhanden) {
      // Der Anker faellt nur, wenn er selbst abgewaehlt wurde - sonst bleibt der
      // Bereich ab dem zuletzt einfach geklickten Element bestehen.
      return {
        ids: auswahl.ids.filter((eintrag) => eintrag !== id),
        anker: auswahl.anker === id ? null : auswahl.anker,
      }
    }
    return { ids: sortiereNachReihenfolge([...auswahl.ids, id], reihenfolge), anker: id }
  }

  // Bereich: ohne gueltigen Anker ist Shift ein einfacher Klick.
  if (auswahl.anker === null || !reihenfolge.includes(auswahl.anker)) {
    return { ids: [id], anker: id }
  }
  const ankerStelle = reihenfolge.indexOf(auswahl.anker)
  const start = Math.min(ankerStelle, stelle)
  const ende = Math.max(ankerStelle, stelle)
  return { ids: reihenfolge.slice(start, ende + 1), anker: auswahl.anker }
}

/** Bereinigt die Auswahl nach einem Projektwechsel: Was nicht mehr in der Liste steht,
 *  ist nicht mehr ausgewaehlt. Die Reihenfolge der IDs folgt der Liste.
 *
 *  Gibt DIESELBE Referenz zurueck, wenn sich nichts aendert - so loest ein
 *  unveraenderter Projektstand keine React-Schleife aus. */
export function gleicheAuswahlAb(auswahl: Auswahl, reihenfolge: readonly string[]): Auswahl {
  const vorhanden = new Set(reihenfolge)
  const ids = reihenfolge.filter((id) => auswahl.ids.includes(id))
  const anker = auswahl.anker !== null && vorhanden.has(auswahl.anker) ? auswahl.anker : null
  // Verglichen wird Element fuer Element, nicht nur die Laenge: Eine Auswahl in
  // Klickreihenfolge hat dieselbe Laenge, ist aber nicht dieselbe Auswahl.
  const gleich = ids.length === auswahl.ids.length && ids.every((id, stelle) => id === auswahl.ids[stelle])
  if (gleich && anker === auswahl.anker) {
    return auswahl
  }
  return { ids, anker: ids.length === 0 ? null : anker }
}

export function istInAuswahl(auswahl: Auswahl, id: string): boolean {
  return auswahl.ids.includes(id)
}

/** Die Liste ohne die ausgewaehlten Elemente - Reihenfolge und Objektreferenzen der
 *  uebrigen Eintraege bleiben unangetastet (TK 9.7.4: keine versteckte Sortierung). */
export function entferneAusgewaehlte<T extends { id: string }>(
  liste: readonly T[],
  ids: readonly string[],
): T[] {
  const weg = new Set(ids)
  return liste.filter((eintrag) => !weg.has(eintrag.id))
}

function sortiereNachReihenfolge(ids: readonly string[], reihenfolge: readonly string[]): string[] {
  const rang = new Map(reihenfolge.map((id, stelle) => [id, stelle]))
  return [...ids].sort((a, b) => (rang.get(a) ?? 0) - (rang.get(b) ?? 0))
}
