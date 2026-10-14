// #412 - das Modell der Einfüge-Kanten für die Zeitleiste (Oberfläche 2.0, Kernachse).
//
// REIN, kein IPC, kein DOM: Die drei Regeln hier werden von der Zeitleiste gelesen, die
// Einfügung selbst läuft über fuegeElementHinzu (#123/#411, Main-vergebene UUID, nicht
// optimistisch, TK 9.7.3).
//
// Vertragsquelle: Issue #412 (Signatur-Block). Gemeldete Ergänzung: `leseKantenIndex`
// und `liestReferenz` sind zwei kleine Lese-Helfer NEBEN den verbindlichen zwei (in der
// Schliess-Meldung an #412 vermerkt) - sie machen die Drop-Entscheidung der Komponente
// ZERLEGBAR und damit testbar, ohne dass die zwei verbindlichen Funktionen dafuer
// verbogen werden.

/** Index 0..liste.length der Einfüge-Kante.
 *  Kante VOR Block i ist Index i, Kante NACH dem letzten Block ist Index liste.length. */
export function baueEinfugeKanten(laenge: number): number[] {
  // Eine unbekannt kurze Liste (negative oder nicht-ganzzahlige Laengen sind ein Anzeige-Fehler der
  // Komponente, nicht hier) liefert SOFORT nur die Kante vor dem ersten Block.
  if (!Number.isInteger(laenge) || laenge < 0) return [0]
  return Array.from({ length: laenge + 1 }, (_, stelle) => stelle)
}

/** Vermisst die gedrückte Einfüge-Kante waehrend des Drag-Overs (reine Messung, kein IPC).
 *  `breite(index)` liefert die Breite des Blockes an DIESEM Zeilen-Index; die Grenze der
 *  Kante k ist die Summe der Breiten der Blöcke davor (Kante 0 = 0, letzte Kante =
 *  Gesamtbreite). Gewaehlt wird die NAECHSTE Grenze; koennt sie der Zeiger nicht
 *  erreichen (x vor 0 oder hinter der Gesamtbreite), gibt es keine Kante: `null`. */
export function waehleKanteAus(
  kanten: readonly number[],
  xImKontext: number,
  breite: (index: number) => number,
): number | null {
  if (kanten.length === 0) return null
  // Keine Zahl (inkl. NaN von einer schiefgelaufenen Messung) -> keine Kante.
  if (!Number.isFinite(xImKontext)) return null

  // Grenzen sammeln: Kante k sitzt an der Summe der Blockbreiten 0..k-1.
  let laufend = 0
  const grenzen: number[] = [0]
  for (let stelle = 1; stelle < kanten.length; stelle += 1) {
    laufend += breite(stelle - 1)
    grenzen.push(laufend)
  }
  const gesamt = laufend

  // Ausserhalb (vor dem ersten Block/hinter dem letzten) -> nichts Gueltiges.
  if (xImKontext < 0 || xImKontext > gesamt) return null

  const erste = kanten[0]
  if (erste === undefined) return null
  let beste = erste
  let besterAbstand = Math.abs(xImKontext)

  for (let stelle = 1; stelle < kanten.length; stelle += 1) {
    const kandidat = kanten[stelle]
    const grenze = grenzen[stelle]
    if (kandidat === undefined || grenze === undefined) return null
    const abstand = Math.abs(xImKontext - grenze)
    if (abstand < besterAbstand) {
      beste = kandidat
      besterAbstand = abstand
    }
  }
  return beste
}

/** Liest die Kanten-Nummer aus einem Drop-Ziel-Identifizierer (`kante-3` -> 3). Alles
 *  andere - auch eine Zeilen-Id (Sortier-Drop) - ist KEINE Kante: `null`. */
export function leseKantenIndex(id: unknown): number | null {
  if (typeof id !== 'string') return null
  if (!id.startsWith('kante-')) return null
  const wert = Number(id.slice('kante-'.length))
  // "kante-" ohne Nummer, "kante-1ex" oder ein negativer Wert sind Kandidatenfehler,
  // keine Kante - die Sortierlogik (#122) bleibt bei so einem Drop unberuehrt.
  // Die Ziffern-Sperre (statt nur Number) verhindert die "leere Nummer = 0"-Falle.
  if (!/^\d+$/.test(id.slice('kante-'.length))) return null
  if (!Number.isInteger(wert) || wert < 0) return null
  return wert
}

/** Liest die Neu-Drag-Referenz aus den Drag-Daten (von #413: `{ referenz }`). Ohne
 *  Referenz ist der laufende Drag ein BESTANDSDrag - die Kanten bleiben unwirksam. */
export function liestReferenz(daten: unknown): string | null {
  if (typeof daten !== 'object' || daten === null) return null
  const referenz = (daten as { referenz?: unknown }).referenz
  if (typeof referenz !== 'string' || referenz.trim() === '') return null
  return referenz
}
