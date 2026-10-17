# Plan: Composer-Wurzel arbeitsfähig machen

**Status:** S1–S5 GEBAUT und gemergt (S1–S3 `70007ef`; S4 `df08324`; S5 `fd68efb`). **Erstellt:** 16.10.2026.
**Art:** struktureller Bau, **verhaltensneutral** (kein Verhaltens-/Optikwechsel).
**Herkunft:** Befund „`composer/index.tsx` ist schwer zu bearbeiten" (Messung 16.10.2026).
**Abgelehnte Vorgängerarbeit:** **#432** (offen, wird geschlossen) – dort stand nur „groß →
Overlays rausziehen", **ohne Ursache, Zweck und Naht-Entscheidung**. Dieser Plan holt das nach.

---

## 1. Zweck (warum jetzt)

Als Nächstes stehen **#428** (Zeitleiste als Zeit-/Frame-Band, Modell offen) und **#426**
(kurze Unterbrechung) und danach die Band-Arbeit an. Jede davon landet heute in einer
**900-Zeilen-Funktion**. Ziel ist deshalb nicht „kürzer", sondern: **eine künftige
Composer-Änderung hat einen klaren, kleinen Ort.** Der Umbau bereitet genau diese Arbeiten vor.

## 2. Ausgangslage (gemessen 16.10.2026, `src/renderer/composer/index.tsx`)

| Maß | Wert |
|---|---|
| Datei gesamt | **1170 Zeilen** |
| `ComposerInterna` (Z. 227–1138) | **911 Zeilen in EINER Funktion** |
| deren `return` (Z. 669–1134) | **465 Zeilen ein JSX-Block** |
| Hooks in `ComposerInterna` | **22** (11 `useState`, 3 `useRef`, 6 `useEffect`, 2 `useSensor`) |
| `setzeLage((alt) => …` | **34×** |
| `melde(alt, …)` (Fehlermuster) | **15× wiederholt** |
| Overlay-Rahmen inline (`position:fixed … rgba(0,0,0,0.6)` + `#1f1f1f`-Panel) | **4× wortgleich** |

`ComposerInterna` macht drei Dinge in einem Rumpf:
1. **Zustand halten** (Sicht, DnD, Band, Import, Ersetzen-Frage, `lage`, Ausgaben),
2. **orchestrieren** (Import/Ersetzen, Band, Aktion anlegen/löschen, Reparatur, Render, Export,
   Drop, Kontextmenü),
3. **den ganzen Bildschirm rendern** (Bibliothek, Galerie, Zeitleiste, Ausgaben,
   Kontextmenü, vier Overlays).

**Toter Code, belegt (kein Aufrufer):** `Zeile` (Z. 1140–1170), `const gesamt` (Z. 480);
mit ihnen `frameDauer`, `berechneGesamtlaenge`, `SortableContext`, `useSortable`, `CSS`.
Verdeckt durch die **dateiweite** Abschaltzeile `/* eslint-disable no-unused-vars */` (Z. 1).

## 3. Ziel und Nicht-Ziele

**Ziel:** Nach dem Umbau enthält die Wurzel **nur noch** (a) die Zustandsdeklaration,
(b) die Verdrahtung (Aufrufe von Bausteinen über die Sicht, #243), und (c) einen `return`,
der **benannte Bausteine komponiert** – statt eines 465-Zeilen-Blocks.

**Nicht-Ziele (ausdrücklich):**
- **kein Verhaltenswechsel** – Testids und DOM bleiben zeichengleich,
- **keine Optik**, **keine Performance**,
- **keine Bugfixes** (die gehören in ein eigenes Issue), **kein Umbenennen**,
- **keine Zerlegung um der Zerlegung willen** (eine Zusammenfassung ist so richtig wie eine
  Trennung – entscheidend ist die Naht, s. §4).

## 4. Entscheidungen je Naht (der Kern, den #432 übersprungen hat)

**Grundsatz (Ownership).** Nach **#259** ist die `ComposerLage` der EINE Zustand des Composers,
die Projekt-Sicht kommt über den umhüllten Zugang (**#243**). Daraus folgt: **Zustand und
Schreibzugänge bleiben in der Wurzel.** Alles Ausgelagerte ist **gesteuerte** Präsentation: es
bekommt Werte + Rückrufe und hält **keinen eigenen Zustand**.

| Naht | Entscheidung | Begründung |
|---|---|---|
| **N1 Overlay-Rahmen** | EIN Baustein `composer/overlay-rahmen.tsx` (Backdrop + dunkles Panel) | Ersetzt 4 wortgleiche Kopien; reine Präsentation, kein Zustand |
| **N2 Fehlermeldung** | EIN Helfer (z. B. `verwendeWurzelMeldung`) kapselt `setzeLage` + `melde` | Ersetzt 15 Wiederholungen desselben Musters; eine Adresse |
| **N3 Overlays** | je eigene Komponente; die Wurzel reicht `lage`-Ausschnitt, Daten und **Wirkungen** (Muster `RenderDialogWirkungen`/`ExportDialogWirkungen`) | Handler, die `projekt`/`verdrahtung` brauchen, bleiben in der Wurzel → Zustands-Ownership eindeutig |
| **N4 Regionen** | Bibliothek-Dock, Galerie-Dropzone, Ausgaben-Sektion je als Baustein | `return` wird Komposition; die Zeitleiste ist schon ein Baustein (#414) |
| **N5 DnD-Orchestrierung** | eigener Hook `verwendeZeitleistenZug` hält `neuZug`/`aktiveKante`/`laedtKante`/`zeigerStartX` + die vier Handler | Die **Messung** liegt schon rein in `spalt-drop.ts`/`band-aufnahme.ts`; nur das Nebeneinander wandert |

## 5. Reihenfolge, Belege, Rücknahme

Jeder Schritt ist **einzeln** grün und endet mit Beleg:

- `npm run typecheck` → 0, `npm run lint` → 0,
- `npm test` grün (**Basis: 5523 Tests / 318 Dateien**),
- Treiber `npm run durchlauf`: Abschnitte **4f2/4f4/4g2/4g4 unverändert** (DOM/Testids zeichengleich),
- ein Commit je Schritt, Branch `bau/composer-umbau` von `main`.

**S0 – Bestandsaufnahme toter Code (NICHT löschen).** Der User hat entschieden: der Code
könnte nach dem **UI-Umbau** wieder gebraucht werden. Also **nur inventarisieren** (Liste +
`grep`-Beweis „kein Aufrufer") und hier festhalten. **Gelöscht wird erst in S6.**

**S1 – Overlay-Rahmen (N1).** **S2 – Meldungs-Helfer (N2).** **S3 – Overlays (N3)** einzeln.
**S4 – Regionen (N4)** [GEBAUT `df08324`]: Bibliothek-Dock (`bibliothek-dock.tsx`),
Galerie-Dropzone (`galerie-bereich.tsx`) und Ausgaben-Sektion (`ausgaben-bereich.tsx`)
sind eigene, gesteuerte Bausteine - die Wurzel reicht Werte + Rueckrufe herein.
**S5 – DnD-Hook (N5)** [GEBAUT `fd68efb`]: `verwende-zeitleisten-zug.ts` haelt
`neuZug`/`aktiveKante`/`laedtKante`/`bandZiel`/`bandZeit`/`korbRef` + die vier
DndContext-Handler (und den Projektwechsel-Reset des Band-Ziels). Beide belegt:
Typecheck/Lint 0, Suite 5550/322, Treiber ohne Befund (4f/4f2/4f4/4g2/4g4 unveraendert),
DOM/Testids zeichengleich; `index.tsx` 1123→957.
**S6 – erst nach dem UI-Umbau:** tatenlose Leichen bewerten (löschen **oder behalten**).

**Rücknahme je Schritt** über `git revert <commit>`; die Treiber-Messung ist die Gegenprobe.

## 6. Risiken und Werkzeuge

- **DOM/Testid-Regression** ist der Hauptrisiko-Punkt (der Treiber misst testids, Lektion #403).
  Gegenmittel: Treiber-Lauf **nach jedem** Schritt; „zeichengleich" ist die Abnahmebedingung.
- **`eslint-disable` (Z. 1):** Sie verdeckt künftigen toten Code. Gezielt ausnehmen geht erst
  ohne die Leichen – deshalb **offene Entscheidung** (s. §7), nicht stillschweigend lösen.
- **Reihenfolge relativ zu #428/#426:** Der Umbau darf dem neuen Zeitleisten-Modell nicht
  vorgreifen. Vorschlag: **S1–S3 vor #428**, **S4–S5 nach #428** (sonst Konflikt am `return`).

## 7. Offene Entscheidungen für die Abnahme

1. **Handler-Ort in den Overlays:** Wirkungen aus der Wurzel (Vorschlag) oder Handler in der
   Komponente?
2. **`eslint-disable`:** jetzt gezielt ausnehmen oder bis S6 lassen?
3. **Zeitpunkt:** S1–S3 vor **#428**, S4–S5 danach (Vorschlag) – oder alles am Stück?
4. **#432:** als **verworfen** schließen (Kommentar mit Verweis auf diesen Plan).
