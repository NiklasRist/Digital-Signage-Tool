// #433/#442 - der Streifen-Speicher des Filmstreifens (Ladezeit, User-Befund 29.10.2026).
//
// WARUM EIGENES MODUL: Der Speicher ist eine reine Zuordnung ohne DOM und ohne React -
// er laesst sich damit direkt pruefen. Die Zusage lautet: Ein bereits gezeichneter
// Streifen wird beim naechsten Aufbau NICHT erneut aus dem Video gesucht.
//
// WAS NICHT HIER LIEGT: die Blob-URL. Sie bleibt zeitlich begrenzt (#364) und wird nach
// jedem Lauf freigegeben - gemerkt werden nur die fertigen Einzelbilder (Canvasse von
// 40 x 64 px, ein Eintrag also wenige KB).

/** Wie viele Streifen gemerkt werden. Aeltere fliegen zuerst. */
export const STREIFEN_SPEICHER_MAX = 40

const speicher = new Map<string, HTMLCanvasElement[]>()

/** Der Schluessel eines Streifens: Quelle + Ausschnitt + Bildzahl. */
export function streifenSchluessel(
  projektId: string,
  dateiname: string,
  start: number,
  ende: number,
  anzahl: number,
): string {
  return `${projektId}|${dateiname}|${start}|${ende}|${anzahl}`
}

/** Der gemerkte Streifen oder `undefined`. */
export function holeStreifen(schluessel: string): HTMLCanvasElement[] | undefined {
  return speicher.get(schluessel)
}

/** Merkt einen Streifen. Leere Ergebnisse werden NICHT gemerkt - ein Fehlschlag soll
 *  beim naechsten Anlauf neu versucht werden. Der aelteste Eintrag fliegt bei voller
 *  Speichergrenze (Map haelt die Einfuegereihenfolge). */
export function merkeStreifen(schluessel: string, bilder: readonly HTMLCanvasElement[]): void {
  if (bilder.length === 0) return
  // Neu einsortieren: ein erneut genutzter Eintrag gilt als der juengste.
  speicher.delete(schluessel)
  speicher.set(schluessel, [...bilder])
  while (speicher.size > STREIFEN_SPEICHER_MAX) {
    const aeltester = speicher.keys().next().value
    if (aeltester === undefined) break
    speicher.delete(aeltester)
  }
}

/** Leert den Speicher (Tests; im Betrieb raeumt die Obergrenze). */
export function leereStreifenSpeicher(): void {
  speicher.clear()
}
