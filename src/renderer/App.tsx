import type { JSX } from 'react';

import { inhalte } from './app-shell/inhalte';

// Das Shell-Skelett (#10) - Anordnung, sonst nichts.
//
// Aufbau nach TK 9.14.1:
//   [Zusammenstellen] [Aktionen] [Vorlagen] [Projekte]
//   Der gewaehlte Reiter nutzt die ganze Flaeche
//   queue-panel als schmale Leiste
//
// Seit #244 haengt diese Datei die MOUNT-KETTE ein: `inhalte` (app-shell/inhalte.tsx)
// baut einmal die Sichten (#197) und liefert die ECHTEN Reiterinhalte - composer am
// Reiter Zusammenstellen (#261), die Projektverwaltung am Reiter Projekte
// (#222-#226). Aktions- und Vorlagen-Reiter bleiben je EIGENE Mount-Arbeit (M5/M7).
//
// KEIN IPC, kein ipc-client-Import, keine Fachlogik. Die Invariante
// "Die Shell rendert selbst keine Inhalte - sie ordnet an, wechselt und haelt
// die Warteschlangen-Leiste" (TK 9.14.2) gilt weiter: inhalte.tsx haelt die
// Wirklichkeit, diese Datei nur die Naht.

export function App(): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {inhalte()}
    </div>
  );
}
