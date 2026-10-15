### Issue NA-05 (= #424): [app-shell] Undo/Redo-Pfeile im Editor sichtbar machen

## Ziel (in einem Satz)
Im aktiven Editor gibt es sichtbare **Rückgängig-/Wiederherstellen-Knöpfe** (Pfeile), deren An/Aus-Zustand
dem, was gerade möglich ist, entspricht – zusätzlich zu den bestehenden Tastenkürzeln.

## User-Wunsch (15.10.2026, wörtlich, User-Abnahme der Kernachse)
„außerdem braucht man pfeile in dem editor" (auf Rückfrage hin: die Pfeile sind **Undo/Redo**).

## Fund (am Code nachgelesen)
- Tastatur existiert: `src/renderer/app-shell/tastatur.ts` (Cmd/Strg+Z = rückgängig, Shift+ = wiederherstellen),
  verdrahtet in `src/renderer/App.tsx:241-254`.
- Die **Zustands-Anzeiger** `kannRueckgaengig` / `kannWiederherstellen` (`app-shell/undo-projekt.ts:66/76`)
  und `bereichFuerReiter` (`app-shell/undo-historien.ts:44`) haben **keinen sichtbaren Aufrufer** – wieder
  die Familie „fertige Funktion ohne Aufrufer".
- **Keine** `data-testid`-Knöpfe für Undo/Redo im Renderer (Grep leer). Nur die Tastatur löst es aus.

## Modul & Datei
- Modul: `app-shell` (Renderer), TK **9.13 / 9.14**
- Betrifft voraussichtlich:
  - `src/renderer/App.tsx` (Einbau der Knöpfe/Leiste)
  - ggf. neues dünnes Bauteil `src/renderer/app-shell/undo-leiste.tsx`
  - nutzt (nicht ändert): `undo-projekt.ts`, `undo-historien.ts`
- Vertrag: TK **9.14.2**, **9.13**

## Verbindliche Regeln (aus TK/AD – NICHT neu erfinden)
- **FA-21:** Undo/Redo wird **geboten** (beide Editoren); die Knöpfe sind der sichtbare Weg dazu.
- **Marken-Reiter: KEINE Historie** (TK 9.14.2) – dort sind die Bedienelemente **abgeschaltet**, nicht an
  den Stapel eines anderen Reiters gebunden. `bereichFuerReiter` liefert für `marken` und `projekte`
  `null`; das steuert die Abschaltung.
- Undo/Redo ist **Laufzeit**, nicht persistent; **Aufträge** (Import/Löschen/Render/Export) sind **nicht**
  rückgängig (TK 9.13.1).
- Der Reiterwechsel vermischt die Historien **nicht** (TK 9.14.2) – der Anzeiger folgt dem **aktiven** Reiter.

## Nicht selbst entscheiden – STOPP und fragen
- **Ort der Pfeile:** eine Leiste in der `app-shell` (in jedem fähigen Reiter sichtbar) oder je Editor
  getrennt? Vor dem Bauen festlegen.
- Sollen die Pfeile zusätzlich die **Tastenkürzel-Beschriftung** zeigen (⌘Z / ⇧⌘Z) oder nur Symbole?

## Definition of Done
- [ ] Sichtbare Rückgängig-/Wiederherstellen-Knöpfe im aktiven Editor (eigene `data-testid`).
- [ ] An/Aus folgt `bereichFuerReiter` + `kannRueckgaengig`/`kannWiederherstellen`; im Marken-Reiter
      abgeschaltet.
- [ ] Klick ruft genau die bestehenden Wege (`macheRueckgaengig` / `stelleWiederHer`) – kein zweiter
      Undo-Pfad.
- [ ] Tastenkürzel bleiben unverändert.
- [ ] Suite grün; Typecheck/Lint 0.
- [ ] Treiber-Messung am echten Fenster (Knopf -> Stand ändert sich; im Marken-Reiter aus).

## Abhängigkeiten
- Blockiert von: –
- Bezug: FA-21, TK 9.13, TK 9.14.2
