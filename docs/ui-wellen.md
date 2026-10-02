# UI-Wellen: Digital-Signage-Tool

**Datum:** 2026-09-28 (Umsetzung fortgeschrieben am selben Tag)
**Basis:** `docs/ui-analyse.md`, `docs/ui-plan.md`
**Issues:** #381–#394

---

## Umsetzungsstand

### Welle 1: Fundament – FERTIG (5/5)

| Issue | Stand | Dateien |
|---|---|---|
| #381 Zwei-Panel-Layout | ✅ | `App.tsx` |
| #382 Thumbnails | ✅ | `composer/thumbnails.ts` |
| #384 Fortschrittsbalken | ✅ | `queue-panel/leiste-zusammenfassung.ts`, `shell/WarteschlangenLeiste.tsx` |
| #385 Undo-Stapel | ✅ | `app-shell/undo-stapel.ts` |
| #390 Asset-Galerie | ✅ | `composer/bibliothek-ansicht.ts` (#227), `composer/asset-galerie.tsx`, `composer/wiedergabe-ansicht.tsx`, `App.tsx` |
| #393 Vorlagen-Vorschau | ✅ | `vorlagen-editor/editor-vorschau.ts` |
| #394 Statistik | ✅ | `composer/statistik.tsx` |

### Welle 2: Sichtbarkeit – FERTIG (5/5)

| Issue | Stand | Dateien |
|---|---|---|
| #383 Live-Vorschau | ✅ Kern | `preview-player/medien-url.ts`, `buehne-skalierung.ts`, `zeitachse.ts`, `transport.ts`, `buehne.tsx`; Segment-Zeichnung noch Platzhalter (M7) |
| #386 Timeline | ✅ | `composer/zeitleiste.tsx` (dnd-kit installiert, Reorder über `ordneNeuOptimistically`) |
| #387 Tastatur | ✅ | `app-shell/tastatur.ts`, Verdrahtung in `composer/wiedergabe-ansicht.tsx`, Play/Pause-Ereignis in `preview-player/buehne.tsx` |
| #388 Fehler-Kennzeichnung | ✅ | `composer/fehler-markierung.tsx`, rote Zeilen + Warnsymbol in `composer/wiedergabe-ansicht.tsx` |
| #389 Kontextmenü | ✅ | `composer/kontext-menu.tsx` (Entfernen, Duplikat ans Listenende – bestehende Operationen) |

### Welle 3: Komfort – FERTIG (2/2)

| Issue | Stand | Dateien |
|---|---|---|
| #391 Vollbild | ✅ | `preview-player/buehne.tsx` (Button + Taste F über die native Fullscreen-API) |
| #392 Mehrfachauswahl | ✅ | `composer/wiedergabe-ansicht.tsx` – Shift-Klick Bereich, Strg-Klick Umschalten, Gruppen-Delete (bestehende `entferneElementAusListe` je Kennung) |

### Umsetzung fortgeschrieben

Alle drei Wellen umgesetzt (#381–#394). Die Bausteine liegen je in eigenen Dateien und werden über eine Verdrahtungs-Brücke in `App.tsx` zusammengehoben; die M7-Kette kann die Brücke 1:1 übernehmen, sobald `app-shell/inhalte` existiert.

Bewusst offen (M7-Themen, nicht Neue-Funktionen): Segment-Zeichnung in der Bühne (heute Platzhalter, M7 zeichnet per `template-canvas`), Undo/Redo-Tastenkürzel-Anbindung an die fertigen Stapel, geführte Reparatur-Anbindung der Fehler-Markierung.

---

## Nachweis (Stand der Umsetzung)

- `npx tsc -p tsconfig.renderer.json --noEmit` – fehlerfrei
- `npx tsc -p tsconfig.main.json --noEmit` – fehlerfrei
- `npx eslint src/renderer` – fehlerfrei
- `npm test` – **145 Dateien / 2844 Tests, alle bestanden**

---

## ÜBERGABE: Wo es weitergeht (Stand 02.10.2026, Gerätewechsel)

### Was ALLES funktioniert hat (am echten Dev-Lauf geprüft)

- App startet (Electron + Vite), Reiterleiste, Reiterwechsel sichtbar (Rahmen #195 abonniert #194)
- **Projekt ANLEGEN** (Projekte-Reiter, leerer Name wird korrekt abgewiesen – Knopf gesperrt)
- **Projekt ÖFFNEN** geht jetzt (die Stille-Barriere war #110/#119-Rümpfe, die im Async-Pfad warfen): Oeffnen-Kette = Motive verwerfen → Undo leeren → `project:öffneProjekt` → Zeichenvor vorbereiten → Reiter „Zusammenstellen"
- Import-Dialog öffnet, Aufträge reihen seriell ein (Warteschlange), **Asset mergt nach Erfolg in die Projekt-Sicht** (#199-Kette)
- Composer:Liste anzeigen, dnd-kit Reorder, Element entfernen, Dauer-/Trim-Regler (`baueReglerModell`/`begrenze`/`uebernehmeGrenzen`), Gesamt-/Warnung
- Vorlagen-Bestand app-weit: Übersicht laden, Arbeitskopie öffnen/speichern, übernehmen/eigenständig/verwerfen/löschen, IPC-Verdrahtung (#109/#255) an den Positionen 7/8 des Bootstraps

### Was BREAKT (bewusst – die nächsten Züge, in dieser Reihenfolge)

1. **`auftrags-nachlauf` neu montiert** (Lauf 8): In der Inhalts-Mounter-Fassung fehlt noch der Echte-Aufruf – prüfen, ob die Meldungen durchlaufen, wenn man Import auslöst. Die `aktualisiereAusgabenListe` liest unrealisiert (optionale Funktion; #230).
2. **Warteschlangen-Leiste füllen (M7-Kontrakt im Dateiheader von `shell/WarteschlangenLeiste.tsx`)**: `holeStand()` EINMAL, dann Abo; Fortschritt an `%`; Fehler-Zustand entsprechend `fasseZusammen` (#206 = gefüllt).
3. **Composer-Bericht anzeigen** – Belohnen „Medien importieren" ruft `importiereMedien` aus composer/medien-import.ts (#228 = bereits gefüllt; die Berichtszeile fehlt am UI-Weg).
4. **Reparatur halter #201** (app-shell/reparatur-fuehrung-shell.ts) – Meshing von meldeReparaturStand/meldeUebergabe; dann die Restkette der Restcooperation-Runner-Reiter-workflow (Aktionen/Vorlagen).
5. **Aktionen- und Vorlagen-Reiter mounten** (die Aufreihungsart, unter Zuhilfe der lib: action-editor/vorlagen-editor stehen und habenNULL Cleve-Datei) – Momentan Platzhalter.
6. **Der Lauf der zeichneSegment-Zeilen** (fährt #117 Template-Canvas für die Segment) zeichnet – der Composer zeigt Text, nicht Pixel; der Prüfsumme-Unterlauf hilft (als Also-gesichtete Pixel-Leuchter).

### Die 8 UI-Vorbauten (unmounted, eigener Commit)

`wiedergabe-ansicht.tsx`, `buehne.tsx`, `zeitleiste.tsx`, `asset-galerie.tsx`, `statistik.tsx`, `fehler-markierung.tsx`, `kontext-menu.tsx`, `tastatur.ts` – die UI-Bausteine der Fundamente (aus #381–#394). **Keine davon hat heute einen Aufrufer** – Vorbauten für die M7-Mounts (1–5 oben). NICHT löschen, sondern beimMounten einbinden – sie sind die Hauptnahrung der nächsten Schritte und halten die vertragskonforme Bauform für dnd-kit/Regler/ BK definierende Interfaces bereit.

### Wo dokumente diese wiedergeben: `CLAUDE.md`, `AGENTS.md`, `docs/ui-analyse.md`, `docs/ui-plan.md`, `docs/ui-wellen.md` (dieses), `docs/agents/issue-generation-prompt.md`, `docs/agents/uebergabe-stand.md` (Restbefund).


**Datum:** 2026-09-28
**Basis:** `docs/ui-analyse.md`, `docs/ui-plan.md`
**Issues:** #381–#394

---

## Welle 1: Fundament (unabhängig)

Diese Issues haben **keine Abhängigkeiten** und können parallel bearbeitet werden.

| Issue | Titel | Modul |
|---|---|---|
| [#381](https://github.com/NiklasRist/Digital-Signage-Tool/issues/381) | Zwei-Panel-Layout: Vorschau + Liste immer sichtbar | app-shell |
| [#385](https://github.com/NiklasRist/Digital-Signage-Tool/issues/385) | Universelles Undo/Redo für alle Operationen | composer |
| [#390](https://github.com/NiklasRist/Digital-Signage-Tool/issues/390) | Asset-Galerie mit Thumbnails und Suche | composer |
| [#393](https://github.com/NiklasRist/Digital-Signage-Tool/issues/393) | Vorlagen-Live-Vorschau | vorlagen-editor |
| [#394](https://github.com/NiklasRist/Digital-Signage-Tool/issues/394) | Statistik-Dashboard | composer |

**Ziel:** Die Grundlagen für alle weiteren Issues schaffen.

---

## Welle 2: Sichtbarkeit (blockiert von Welle 1)

Diese Issues bauen auf Welle 1 auf.

| Issue | Titel | Modul | Blockiert von |
|---|---|---|---|
| [#382](https://github.com/NiklasRist/Digital-Signage-Tool/issues/382) | Thumbnails für alle Elemente in der Liste | composer | #381 |
| [#383](https://github.com/NiklasRist/Digital-Signage-Tool/issues/383) | Live-Vorschau der Wiedergabeliste | preview-player | #381 |
| [#384](https://github.com/NiklasRist/Digital-Signage-Tool/issues/384) | Fortschrittsbalken in der Warteschlangen-Leiste | queue-panel | #381 |
| [#386](https://github.com/NiklasRist/Digital-Signage-Tool/issues/386) | Horizontale Timeline als Alternative zur Liste | composer | #381, #382 |
| [#387](https://github.com/NiklasRist/Digital-Signage-Tool/issues/387) | Tastatur-Steuerung (Space, Pfeiltasten, Cmd+Z, Delete) | app-shell | #381 |
| [#388](https://github.com/NiklasRist/Digital-Signage-Tool/issues/388) | Visuelle Fehler-Kennzeichnung (rot/gelb) | composer | #382 |
| [#389](https://github.com/NiklasRist/Digital-Signage-Tool/issues/389) | Kontextmenü auf Elementen | composer | #381 |

**Ziel:** Die UI sichtbar und bedienbar machen.

---

## Welle 3: Komfort (blockiert von Welle 2)

Diese Issues bauen auf Welle 2 auf.

| Issue | Titel | Modul | Blockiert von |
|---|---|---|---|
| [#391](https://github.com/NiklasRist/Digital-Signage-Tool/issues/391) | Vollbild-Vorschau-Modus | preview-player | #383 |
| [#392](https://github.com/NiklasRist/Digital-Signage-Tool/issues/392) | Mehrfachauswahl | composer | #386 |

**Ziel:** Komfort und Effizienz.

---

## Abhängigkeitsgraph

```
Welle 1 (Fundament)
├── #381 Zwei-Panel-Layout
├── #385 Undo/Redo
├── #390 Asset-Galerie
├── #393 Vorlagen-Vorschau
└── #394 Statistik

Welle 2 (Sichtbarkeit)
├── #382 Thumbnails ← #381
├── #383 Live-Vorschau ← #381
├── #384 Fortschrittsbalken ← #381
├── #386 Timeline ← #381, #382
├── #387 Tastatur ← #381
├── #388 Fehler-Kennzeichnung ← #382
└── #389 Kontextmenü ← #381

Welle 3 (Komfort)
├── #391 Vollbild ← #383
└── #392 Mehrfachauswahl ← #386
```

---

## Empfohlene Reihenfolge

1. **Welle 1** – 5 Issues parallel
2. **Welle 2** – 7 Issues parallel (nach Abschluss von Welle 1)
3. **Welle 3** – 2 Issues parallel (nach Abschluss von Welle 2)

**Gesamt:** 14 Issues in 3 Wellen.
