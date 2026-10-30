// [marken-editor] Die Marken-Auswahl als Klappliste mit Suche (#455).
//
// WARUM EINE EIGENE DATEI: Die Suche ueber den Bestand ist eine reine Rechnung ohne JSX,
// ohne IPC und ohne Zustand - dieselbe Trennung wie `filtereProjekte` in der
// Projektverwaltung. Sie ist damit ohne Fenster pruefbar.
//
// VERHALTEN (dieselben Regeln wie `filtereProjekte`, damit es nicht zwei Suchbegriffe gibt):
// leere Suche liefert den Bestand UNVERAENDERT (dieselbe Referenz), Gross/Klein zaehlt nicht,
// umschliessende Leerzeichen zaehlen nicht, Umlaute werden NICHT gefaltet ("ue" findet "ü"
// nicht - eine stille Zweitregel waere teurer als die ehrliche Luecke).

import type { Marke } from '../../shared/contracts/marke'

/** Filtert den Markenbestand nach Namen. Die Reihenfolge bleibt die des Bestands. */
export function filtereMarken(marken: readonly Marke[], suchtext: string): readonly Marke[] {
  const gesucht = suchtext.trim().toLocaleLowerCase()
  if (gesucht === '') {
    return marken
  }
  return marken.filter((marke) => marke.name.toLocaleLowerCase().includes(gesucht))
}
