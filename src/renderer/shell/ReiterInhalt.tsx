import type { JSX } from "react";

import type { ReiterId } from "./reiter";

// Platzhalter-Inhalte der vier Reiter (#10).
//
// Sie sind ABSICHTLICH leer. Was hier spaeter hineingehaengt wird, steht in
// TK 9.14.1 und gehoert je eigenen Modulen:
//   zusammenstellen -> composer [P3] + preview-player [P5]   (M5 / M7)
//   aktionen        -> action-editor [P2] + Live-Vorschau    (M5 / M7)
//   vorlagen        -> vorlagen-editor                       (M5 / M7)
//   projekte        -> projekt-verwaltung                    (M7, TK 9.14.3)
//
// Warum hier nichts Fachliches vorweggenommen wird: Die Shell "rendert selbst keine
// Inhalte" (TK 9.14.2). Ein hier eingebauter Vorgriff - eine Warteschlangen-Anbindung,
// eine Reiterwechsel-Sperre, eine Projektliste - laege spaeter auf DERSELBEN Datei wie
// das zustaendige M7-Issue und muesste dort erst wieder herausgeloest werden.

const PLATZHALTER_TESTID: Record<ReiterId, string> = {
  zusammenstellen: "inhalt-zusammenstellen",
  aktionen: "inhalt-aktionen",
  vorlagen: "inhalt-vorlagen",
  projekte: "inhalt-projekte",
};

/**
 * Zeigt den (noch leeren) Inhaltsbereich des aktiven Reiters.
 *
 * Der `data-testid` je Reiter ist der einzige Inhalt: Ohne ihn liesse sich ein
 * Reiterwechsel nicht pruefen - vier leere `div` sind ununterscheidbar.
 */
export function ReiterInhalt({ aktiv }: { aktiv: ReiterId }): JSX.Element {
  return (
    <main
      style={{ flex: 1, minHeight: 0, overflow: "auto" }}
      data-testid={PLATZHALTER_TESTID[aktiv]}
    />
  );
}
