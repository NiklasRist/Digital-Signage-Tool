import { useState, type JSX } from "react";

import { REITER, type ReiterId } from "./shell/reiter";
import { ReiterInhalt } from "./shell/ReiterInhalt";
import { WarteschlangenLeiste } from "./shell/WarteschlangenLeiste";

// Das Shell-Skelett (#10) - Anordnung, sonst nichts.
//
// Aufbau nach TK 9.14.1:
//   ┌─ [Zusammenstellen] [Aktionen] [Vorlagen] [Projekte] ─┐
//   │  Der gewaehlte Reiter nutzt die ganze Flaeche        │
//   ├──────────────────────────────────────────────────────┤
//   │  queue-panel als schmale Leiste                      │
//   └──────────────────────────────────────────────────────┘
//
// KEIN IPC, kein ipc-client-Import, keine Fachlogik. Das ist keine Bequemlichkeit,
// sondern die Invariante "Die Shell rendert selbst keine Inhalte - sie ordnet an,
// wechselt und haelt die Warteschlangen-Leiste" (TK 9.14.2).
//
// Auch die spaeteren Regeln zum Reiterwechsel sind hier NICHT vorweggenommen: dass
// ohne offenes Projekt in "Projekte" gestartet wird, dass der Reparatur-Modus den
// Reiter wechselt und dass Undo/Redo je Reiter getrennte Stapel fuehrt (alle
// TK 9.14.2) - das sind M7-Themen auf denselben Dateien.

export function App(): JSX.Element {
  // Startreiter ist "zusammenstellen". Die spaetere Regel aus TK 9.14.2 ("beim Start
  // ohne wiederherstellbares Projekt landet der Nutzer im Reiter Projekte") braucht
  // die Kenntnis, ob ein Projekt offen ist - die gibt es hier nicht und sie wird auch
  // nicht erfunden.
  const [aktiv, setzeAktiv] = useState<ReiterId>("zusammenstellen");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <nav role="tablist" style={{ flex: "0 0 auto", display: "flex", gap: 4 }}>
        {REITER.map((reiter) => (
          <button
            key={reiter.id}
            type="button"
            role="tab"
            aria-selected={reiter.id === aktiv}
            data-testid={`reiter-${reiter.id}`}
            onClick={() => setzeAktiv(reiter.id)}
          >
            {reiter.beschriftung}
          </button>
        ))}
      </nav>

      <ReiterInhalt aktiv={aktiv} />

      {/* Ausserhalb des Reiter-Wechsels: in JEDEM Reiter sichtbar (TK 9.14.2). */}
      <WarteschlangenLeiste />
    </div>
  );
}
