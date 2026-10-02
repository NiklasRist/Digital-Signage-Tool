# UI-Plan: Digital-Signage-Tool

**Datum:** 2026-09-28
**Basis:** `docs/ui-analyse.md`
**Status:** Issues angelegt (#381–#394)

---

## 1. Ausgangslage

Die UI ist ein Gerüst. Die Logik ist implementiert, aber nicht sichtbar. Die Hauptprobleme:

1. Reiterstruktur trennt den Nutzer von seiner Hauptarbeit
2. Keine Live-Vorschau
3. Abstrakte Bedienung (Trimmen per Regler)
4. Keine visuelle Rückmeldung

---

## 2. Meilensteine

### M9: Sichtbarkeit (kritisch)

| Issue | Titel | Status |
|---|---|---|
| [#381](https://github.com/NiklasRist/Digital-Signage-Tool/issues/381) | [app-shell] Zwei-Panel-Layout: Vorschau + Liste immer sichtbar | Offen |
| [#382](https://github.com/NiklasRist/Digital-Signage-Tool/issues/382) | [composer] Thumbnails für alle Elemente in der Liste | Offen |
| [#383](https://github.com/NiklasRist/Digital-Signage-Tool/issues/383) | [preview-player] Live-Vorschau der Wiedergabeliste | Offen |
| [#384](https://github.com/NiklasRist/Digital-Signage-Tool/issues/384) | [queue-panel] Fortschrittsbalken in der Warteschlangen-Leiste | Offen |
| [#385](https://github.com/NiklasRist/Digital-Signage-Tool/issues/385) | [composer] Universelles Undo/Redo für alle Operationen | Offen |

### M10: Bedienbarkeit (wichtig)

| Issue | Titel | Status |
|---|---|---|
| [#386](https://github.com/NiklasRist/Digital-Signage-Tool/issues/386) | [composer] Horizontale Timeline als Alternative zur Liste | Offen |
| [#387](https://github.com/NiklasRist/Digital-Signage-Tool/issues/387) | [app-shell] Tastatur-Steuerung (Space, Pfeiltasten, Cmd+Z, Delete) | Offen |
| [#388](https://github.com/NiklasRist/Digital-Signage-Tool/issues/388) | [composer] Visuelle Fehler-Kennzeichnung (rot/gelb) | Offen |
| [#389](https://github.com/NiklasRist/Digital-Signage-Tool/issues/389) | [composer] Kontextmenü auf Elementen | Offen |
| [#390](https://github.com/NiklasRist/Digital-Signage-Tool/issues/390) | [composer] Asset-Galerie mit Thumbnails und Suche | Offen |

### M11: Komfort (nice-to-have)

| Issue | Titel | Status |
|---|---|---|
| [#391](https://github.com/NiklasRist/Digital-Signage-Tool/issues/391) | [preview-player] Vollbild-Vorschau-Modus | Offen |
| [#392](https://github.com/NiklasRist/Digital-Signage-Tool/issues/392) | [composer] Mehrfachauswahl | Offen |
| [#393](https://github.com/NiklasRist/Digital-Signage-Tool/issues/393) | [vorlagen-editor] Vorlagen-Live-Vorschau | Offen |
| [#394](https://github.com/NiklasRist/Digital-Signage-Tool/issues/394) | [composer] Statistik-Dashboard | Offen |

---

## 3. Abhängigkeiten

```
#381 (Zwei-Panel-Layout)
├── #382 (Thumbnails)
├── #383 (Live-Vorschau)
└── #384 (Fortschrittsbalken)

#385 (Undo/Redo) – unabhängig

#386 (Timeline) – blockiert von #381
#387 (Tastatur) – blockiert von #381
#388 (Fehler-Kennzeichnung) – blockiert von #382
#389 (Kontextmenü) – blockiert von #381
#390 (Asset-Galerie) – unabhängig

#391 (Vollbild) – blockiert von #383
#392 (Mehrfachauswahl) – blockiert von #386
#393 (Vorlagen-Vorschau) – unabhängig
#394 (Statistik) – unabhängig
```

---

## 4. Reihenfolge

1. **M9** – Sichtbarkeit (kritisch)
2. **M10** – Bedienbarkeit (wichtig)
3. **M11** – Komfort (nice-to-have)

---

## 5. Erfolgskriterien

- [ ] Der Nutzer sieht Vorschau und Liste gleichzeitig
- [ ] Der Nutzer sieht Thumbnails aller Elemente
- [ ] Der Nutzer sieht den Render-Fortschritt
- [ ] Der Nutzer kann per Tastatur bedienen
- [ ] Der Nutzer sieht kaputte Elemente sofort (rot/gelb)
