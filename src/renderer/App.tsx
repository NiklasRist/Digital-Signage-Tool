import type { JSX } from 'react';

import { Rahmen, type ReiterInhalt } from './app-shell/rahmen';
import type { ReiterId } from './app-shell/reiter';
import { ReiterInhalt as PlatzhalterInhalt } from './shell/ReiterInhalt';
import { WarteschlangenLeiste } from './shell/WarteschlangenLeiste';

// Das Shell-Skelett (#10) - Anordnung, sonst nichts.
//
// Aufbau nach TK 9.14.1:
//   ┌─ [Zusammenstellen] [Aktionen] [Vorlagen] [Projekte] ─┐
//   │  Der gewaehlte Reiter nutzt die ganze Flaeche        │
//   ├──────────────────────────────────────────────────────┤
//   │  queue-panel als schmale Leiste                      │
//   └──────────────────────────────────────────────────────┘
//
// Seit #195 haengt diese Datei den Rahmen (#195) ein. Sie haelt selbst keinen
// Reiter-Zustand mehr (der lebt in #194, gelesen ueber holeReiter()/aufReiterGeaendert)
// und keinen zweiten Reiter-Zustand: Die Reiterknöpfe rufen wechsleReiter (#194).
// Die leeren Platzhalter aus #10 werden als `inhalte`-Eintraege uebergeben, solange
// die echten Module noch nicht eingehängt sind (#198, #222 bis #226). Die
// Platzhalter-Dateien unter src/renderer/shell/ aus #10 werden NICHT geloescht -
// das Aufraeumen von M0-Resten ist nicht Aufgabe von #195.
//
// KEIN IPC, kein ipc-client-Import, keine Fachlogik. Das ist keine Bequemlichkeit,
// sondern die Invariante "Die Shell rendert selbst keine Inhalte - sie ordnet an,
// wechselt und haelt die Warteschlangen-Leiste" (TK 9.14.2).

// Die leeren Platzhalter-Inhalte der vier Reiter (#10). Jede Funktion entspricht
// einer ReiterId; der `sichtbar`-Parameter des Rahmens wird hier bewusst ignoriert.
const PLATZHALTER: Record<ReiterId, ReiterInhalt> = {
  zusammenstellen: () => <PlatzhalterInhalt aktiv="zusammenstellen" />,
  aktionen: () => <PlatzhalterInhalt aktiv="aktionen" />,
  vorlagen: () => <PlatzhalterInhalt aktiv="vorlagen" />,
  projekte: () => <PlatzhalterInhalt aktiv="projekte" />,
};

export function App(): JSX.Element {
  return (
    <Rahmen
      inhalte={PLATZHALTER}
      warteschlangenLeiste={WarteschlangenLeiste}
    />
  );
}