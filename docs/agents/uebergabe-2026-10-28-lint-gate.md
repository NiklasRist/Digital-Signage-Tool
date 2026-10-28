# Übergabe 28.10.2026 – Lint-Gate (#447), nächster Schritt Charge 13

**Issue:** [#447](https://github.com/NiklasRist/Digital-Signage-Tool/issues/447) (gebaut),
[#448](https://github.com/NiklasRist/Digital-Signage-Tool/issues/448) (neu, Schuld).
Vorherige Sitzung: [`uebergabe-2026-10-28-charge-12.md`](uebergabe-2026-10-28-charge-12.md).

## 1. Auftrag

Nach Charge 12 standen **71** Testdateien aus, die noch Quelltext lesen. Bei 5 Dateien je Charge
wären das ~14 Sitzungen – für einen mechanischen Vorgang, der die eigentliche Zusage („kein
Quelltext in Tests") nicht dauerhaft sichert. Diese Sitzung hat deshalb zuerst die **Schranke**
gebaut, dann kommt der Abbau.

## 2. Befund vor dem Bau (gemessen, nicht aus der Übergabe)

| Prüfung | Ergebnis |
|---|---|
| Ruft etwas `oxlint` auf? | **Nein** – `"lint": "eslint ."`, kein Skript, kein Workflow (`.github/workflows` fehlt) |
| Enthält `pruefung` Typecheck/Lint? | **Nein** – nur `build && test && test:integration && durchlauf` |
| Oxlint-Stand | **196 Fehler** (192 × `require-safety-comment-for-type-assertion` in `src`, 4 in Tests), 68 Warnungen |
| Aussage im Kopf von `oxlint.config.ts` | „src-Fälle sind ABGEARBEITET" – **seit dem 20.08.2026 falsch** |

Die anti-slop-Regeln waren also **dekoriert**, nicht durchgesetzt.

## 3. Was gebaut ist

1. **Verdrahtung** (`package.json`):
   - `lint` = `eslint . && oxlint -c oxlint.config.ts`
   - `pruefung` = `typecheck && lint && build && test && test:integration && durchlauf`
2. **Oxlint auf 0 Fehler:**
   - `no-object-parameters` (2×, `bootstrap-verdrahtung.spec.ts`): die beiden Mocks brauchen den
     Parameter nicht – entfernt.
   - `no-conditional-empty-object-spread` (2×, `marken-referenzpruefung.spec.ts`,
     `migriere-projekt-auf-marke.spec.ts`): erst das Basisobjekt bauen, dann die Eigenschaft
     ergänzen.
   - `require-safety-comment-for-type-assertion`: **`warn`**, mit der Zahl 192 im Kommentar und
     Verweis auf **#448**. Nicht abgeschaltet – die Funde bleiben sichtbar.
3. **Drei neue ESLint-Schranken** (`eslint.config.js`):
   - `no-restricted-imports` mit `patterns: ["**/main/**"]` für `src/renderer/**` (TK 9.1;
     #193 nannte genau diese Grenze als späteren Schritt). Heute 0 Verstöße.
   - `no-restricted-syntax` für `window.api` außerhalb `src/renderer/ipc-client/**` (Ausnahme
     als eigener, benannter Block). Heute 0 Verstöße (die Treffer im Code sind Kommentare).
   - **Sperrklinke** `lokal/quelltext-proben` (`tools/eslint/quelltext-proben.mjs`): meldet
     `readFileSync`, dessen Pfad auf `src/` zeigt, in `tests/unit/**` – außer für Dateien in
     `tools/eslint/quelltext-proben-ausnahmen.json` (**70** Dateien, kalibriert am Lauf).
     Erkennt direkte Literale, Templates, `new URL(...)` und einfache Konstanten
     (`const QUELLE = path.join(...)`).
4. **TS-Parser für `tests/**`:** Bis hierhin lief `eslint .` über Testdateien mit espree; jede
   Regel für `tests/` wäre an Typ-Syntax gescheitert. Der neue Block setzt **nur** den Parser,
   keine zusätzliche Regel.

## 4. Gegenproben (jede belegt, jede byte-identisch zurückgenommen)

| Probe | Ergebnis |
|---|---|
| `import '../../../main/render-service/ausgabe-platzieren'` in `src/renderer/composer/index.tsx` | Lint **rot** (1 Fehler) |
| `void window.api` daselbst | Lint **rot** (1 Fehler) |
| neue Datei `tests/unit/zz-probe.spec.ts` mit `readFileSync('src/main/index.ts')` | Lint **rot** (1 Fehler), Datei danach entfernt |
| `tests/unit/ziel-dialog.spec.ts` aus der Ausnahmen-Liste gestrichen | Lint **rot** (1 Fehler), Liste byte-identisch zurück |

## 5. Gate

`npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler (258 Warnungen), Unit **5.517
(340 Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**. Die Testzahlen sind
unverändert; **kein Produktcode in `src/` wurde angefasst.**

## 6. Was NICHT gebaut ist (gemeldet, nicht stillschweigend)

- **`rufeAuf`/`KANAELE` in „reinen Modulen"** ist keine ausdrückbare Regel: 46 `.ts`-Dateien im
  Renderer rufen legitim `rufeAuf`, `KANAELE` steht in 54 Dateien über neun Ordner. Eine
  gepflegte Liste „reine Module" wäre eine zweite Wahrheit. Die Zusage bleibt bei den
  Verhaltens-Tests.
- **Die 192 SAFETY-Kommentare** – eigenes Issue **#448**. Sie brauchen echte Invarianten, keine
  Floskel; ein Massenkommentar wäre schlimmer als der Ist-Zustand.

## 7. Nächster Schritt: Charge 13

1. Fünf Dateien nach dem Rezept (`tools/mutationen.py`).
2. **Neu:** die fünf Dateien aus `tools/eslint/quelltext-proben-ausnahmen.json` streichen – die
   Sperrklinke beweist damit, dass ihre Proben wirklich weg sind.
3. Gate, Doku, Commit. **Push nur auf Anweisung.**

**Kandidaten:** `bibliothek-ansicht-ansicht`, `asset-auswahl-anzeige`,
`einblendung-ansicht-anzeige` sowie die Einzelproben in `speicherstatus-*`,
`sicherheitsabstand-bearbeiten`, `vorschau-auswahl-rechnung`, `video-filmstreifen-blob`,
`split-anzeige`.
