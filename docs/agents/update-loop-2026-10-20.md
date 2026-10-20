# Update-Loop im Renderer: Befund und Fix (20.10.2026)

**Art:** Untersuchung mit Messung am echten Fenster, dann ein Fix. **Kein Umbau auf Verdacht.**
**Ausloeser:** `console.error: Maximum update depth exceeded` im Treiber-Lauf vom 20.10.2026
(Befund B5 der `docs/agents/treiber-matrix.md`).

---

## 1. Symptom

Der Treiber druckte waehrend des Laufs mehrfach:

```
[fenster error] Maximum update depth exceeded. This can happen when a component calls
setState inside useEffect, but useEffect either doesn't have a dependency array, or one
of the dependencies changes on every render.
```

Das Gate blieb **gruen**: `console.error` wird vom Treiber nur gedruckt, nicht gewertet.

## 2. Messung (keine Vermutung)

Drei temporaere Zaehler im Renderer, je ueber `console.error` sichtbar gemacht, danach
restlos entfernt (Pruefsumme der Datei wieder identisch):

| Zaehler | Ort | Lauf **vor** dem Fix |
|---|---|---|
| `reparatur-effect` | `composer/index.tsx`, nach der Referenz-Wache | **2.300** Durchlaeufe |
| `composer-init` | `useState`-Initialisierer des Composer | **> 1.900** Initialisierungen |
| `composer-mount` | Effekt `projekt.aufGeaendert` | **2.300** Durchlaeufe |

Zusatzmessung: Bei jedem Durchlauf war die Menge der kaputten Stellen **identisch**
(`stellenGleich true`). Es aenderte sich also nicht der Projektinhalt, sondern nur die
**Identitaet** des Projekt-Objekts bzw. die Komponenteninstanz.

**Damit war klar:** Der Reparatur-Effekt lief nicht wegen neuer Daten, sondern weil der
Composer bei jedem App-Rendern **neu gemountet** wurde. Die Referenz-Wache
(`standQuelle.current === inhalt`) lebt in der Instanz - ein frischer Mount hat eine frische
Wache und meldet erneut.

## 3. Ursache

`baueReiterInhalte` (`src/renderer/app-shell/inhalte.tsx`) wurde in `App.tsx` **bei jedem
Rendern** aufgerufen. Seine Rueckgabe sind Funktionen (`zusammenstellen`, `aktionen`, ...),
und `rahmen.tsx` benutzt genau diese Funktionen als **Komponententyp**:

```tsx
{createElement(eigenschaften.inhalte[reiter], { sichtbar: ... })}
```

Ein neuer Funktionswert = ein neuer Komponententyp = React **mountet** den aktiven Reiter
neu. Die Kette:

1. Composer-Effekt meldet den Reparatur-Stand (`meldeReparaturStand`).
2. App setzt `reparatur` (neues Objekt) und rendert.
3. `baueReiterInhalte` liefert neue Funktionen -> neuer Typ -> Composer mountet neu.
4. Frischer Mount: `standQuelle`/`standProjektId` sind leer -> Effekt rechnet und meldet.
5. Weiter bei 1.

**Zweiter, daran haengender Defekt:** Weil `standProjektId` beim Remount leer ist, hielt der
Effekt **jeden** Remount fuer einen Projektwechsel und rief `starteReparatur` statt
`aktualisiereReparatur`. Das setzt `behoben` auf 0 - der Fortschritt "X von N behoben"
konnte bei jeder App-Aktualisierung zurueckspringen. (Mechanisch aus dem Code; der Loop hat
einen stabilen Fortschritt vorher ohnehin verhindert.)

## 4. Fix

1. **`App.tsx`:** Die Reiterinhalte werden ueber `useMemo` **einmal je Zugaengen-Satz**
   gebaut. Die Zugaenge sind nach dem Bootstrap stabil (`lage.zugaenge`, `bereit`).
2. **`inhalte.tsx`:** Der dritte Parameter ist jetzt ein **Getter**
   `holeUmgebung: () => Reiterumgebung` statt eines Werts. Die zurueckgegebenen Funktionen
   lesen die Umgebung beim Rendern - so bleiben die Komponententypen stabil, ohne dass
   `composerVerdrahtung.reparatur` einfriert.
3. `App.tsx` haelt die aktuelle Umgebung in einer Referenz (`umgebungStand`), die bei jedem
   Rendern aktualisiert wird und vom Getter gelesen wird.

**Warum nicht nur die Meldung idempotent machen?** Das haette den Loop beendet, aber den
Remount bei jeder echten Reparatur-Aenderung gelassen - und damit den Fortschritt auf 0
gesetzt. Der Remount war die Ursache, nicht das Symptom.

## 5. Belege

- **Vorher:** 2.300 Effekt-Durchlaeufe, > 1.900 Composer-Initialisierungen, wiederholte
  `Maximum update depth`-Meldungen.
- **Nachher (gleicher Treiberlauf):** **12** Durchlaeufe des `aufGeaendert`-Effekts
  (1 Mount + Projektwechsel), **keine** `Maximum update depth`-Meldung.
- **`npm run pruefung` Exit 0:** Build, **5.702 Unit-Tests (333 Dateien)**, **49
  Integrationstests (12 Dateien)**, Treiber ohne `Befund`. Die Schritte **4h** (Render-Sperre,
  Reparatur, Undo) und **4j** (Warteschlange) bleiben gruen.
- **Gegenprobe mit Beleg:** Das `useMemo` umgangen (Aufruf wieder inline) -> **2 Tests rot**,
  darunter der neue Regressionstest; zurueckgenommen, Pruefsumme
  `df51cbe02d03e16632d56b114ec54f29a2b6b2fe6328de238fde882f65eb6d15` wieder identisch.

## 6. Neuer Waechter

`tests/unit/app-einhaengung.spec.ts`:

> **"ein App-Rendern baut die Reiterinhalte NICHT neu - sonst mountet der aktive Reiter neu"**

Ein reiner App-Zustandswechsel (Meldung setzen) darf `baueReiterInhalte` **nicht** erneut
rufen. Der Test faellt ohne das `useMemo`.

## 7. Ehrlich offen

1. **Das Gate bleibt blind gegen `console.error`.** Der Treiber sollte
   "Maximum update depth" (und vergleichbare React-Fehler) als `Befund` werten. Das ist
   **nicht** umgesetzt - es wuerde das Gate sofort rot machen, falls die Schleife
   zurueckkommt, und das ist eine eigene Entscheidung.
2. **Welcher Update-Zyklus Reacts Zaehler genau ausgeloest hat**, ist nicht bis auf den
   Aufruf bestimmt. Die Remount-Schleife ist gemessen und beseitigt; die Meldung ist danach
   im Treiberlauf **nicht** mehr aufgetreten.
3. **Weitere App-Rendern-Anlaesse** (Meldung, Reparatur) mounten den aktiven Reiter jetzt
   nicht mehr neu. Ob das vorher jemals sichtbar stoerte (z. B. ein offenes Overlay, das
   sich schloss), wurde nicht separat gemessen - der Remount war real, seine Folgen fuer
   einzelne Bedienwege sind nicht einzeln belegt.
