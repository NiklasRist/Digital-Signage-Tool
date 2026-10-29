# Übergabe 29.10.2026 – Stand nach Charge 26 (alle zehn Chargen gebaut, Verbot aktiv)

**Es gibt keine weitere Mutations-Charge.** Chargen 17–26 sind gebaut; die Sperrklinke steht
auf **0** und ist durch ein **Verbot** ersetzt.
**Der Plan:** [`charge-17-26-plan.md`](charge-17-26-plan.md).
**Die letzte Charge:** [`uebergabe-2026-10-29-charge-26.md`](uebergabe-2026-10-29-charge-26.md).
Einzelbefunde: [`mutation-pilot-2026-10-20.md`](mutation-pilot-2026-10-20.md), Abschnitt 39.

## 1. Stand heute (Arbeitsbaum sauber nach dem Commit)

| | Wert |
|---|---|
| Gebaute Chargen | **26** – **126 Testdateien** (je fünf, Charge 26 mit Sonderfall `marke`) |
| Suite | **5.307** Unit-Tests in **340** Dateien, **49** Integrationstests in 12 Dateien |
| Gate | `npm run pruefung` **Exit 0** (Typecheck + Lint + Build + Tests + Integration + Treiber) |
| Treiber | **0 Befunde**; der CDP-Abriss aus Charge 17 trat in 18–26 **nicht** auf |
| Sperrklinke | **0** – `tools/eslint/quelltext-proben-ausnahmen.json` ist **geloescht** |
| Lint | 0 Fehler (Warnungen unverändert: 192 × `SAFETY` aus #448) |
| Push | **nicht gepusht** – `main` liegt vor `origin/main`; **Push nur auf Anweisung** |

## 2. Was Charge 26 ergeben hat (kurz)

- **24 Verhaltens-Mutationen, 4 Refactorings**; erste Messung **16 erkannt**, **8 Lücken**
  geschlossen, **0 äquivalent**; **0/4 Refactorings rot**.
- **Die acht Lücken:**
  - **SL1** – nur `''` war als leere markeId geprüft; `'   '` ging durch.
  - **SL6** – die `typeof`-Wache war ungeprüft (ein `undefined` hätte geworfen).
  - **VI4** – `play()` lief auch bei bereits spielendem Video.
  - **VI6** – die abgelehnte `play()`-Zusage war **nicht** gefangen; der vorhandene Test
    „keine unbehandelte Ablehnung" bemerkte den fehlenden `catch` nicht.
  - **VI8** – ein Dateiwechsel bei gleicher Projekt-ID lud die Quelle nicht neu.
  - **VA1** – der Identitäts-Nachweis war unsichtbar (die Fremd-ID-Fixture endete ohnehin
    in `leer`).
  - **AP1** – `||` gegen `&&` blieb grün, weil **beide** Maße abwichen.
  - **AP2** – Breite/Höhe vertauscht blieb grün, weil beide Fixtures quadratisch waren.
- **Zuordnungs-Befund (Falle 1):** `video-filmstreifen-blob.spec.ts` testet den
  **Filmstreifen**; die Probe darin las `preview-player/video.tsx`. Der echte
  Verhaltenstest dieser Quelle ist **`video-anzeige.spec.ts`** – gegen die
  Filmstreifen-Spec wären alle Mutationen grün gewesen.
- **Sonderfall `marke.spec.ts`:** Vertragstest bleibt (Unionen, `Record`-Vollständigkeit,
  Feldreihenfolge). Entfernt wurden nur die zwei Quelltext-Leser; die Datei verlässt die
  Sperrklinke, ohne dass ein Vertragstest verloren geht.
- **Nachmessung nach dem Ausbau: 24 von 24 rot**, 0/4 Refactorings rot.

## 3. Das Verbot (Abschluss von #447)

- Sperrklinke **5 → 0**; `npx eslint .` grün; **Ausnahmen-Datei gelöscht**.
- `tools/eslint/quelltext-proben.mjs` ist jetzt ein **Verbot**: jeder `readFileSync(...)`
  mit einem Pfad auf `src/` in `tests/unit` ist ein Fehler. Es gibt keine Liste mehr.
- **Gegenproben, alle belegt und zurückgenommen:**
  - `readFileSync('src/…')` → **rot**
  - `readFileSync(new URL('../../src/…', import.meta.url))` → **rot**
  - `fs.readFileSync('src/…')` → **rot**
  - `fs.readFileSync('tests/fixtures/…')` → **grün** (Fixture-Lesen bleibt erlaubt)
- **Dabei gefunden und geschlossen:** Die alte Regel prüfte nur den **Bezeichner**
  `readFileSync`; Member-Ausdrücke (`fs.readFileSync`, `(await import('node:fs')).readFileSync`)
  kamen an ihr vorbei. Der erweiterte Callee-Check fand eine **bisher unsichtbare Probe** in
  `marken-bereitstellung.spec.ts` (las `gemeinsam/marken-bereitstellung.ts`); der Block ist
  entfernt. **Die Sperrklinke war also nie vollständig – die Gegenprobe hat es gezeigt, nicht
  die Annahme.**

## 4. Was jetzt offen ist (keine Mutations-Charge mehr)

1. **#448** – 192 Typ-Behauptungen in `src` ohne `SAFETY`-Begründung; die Oxlint-Regel steht
   auf `warn`. Der nächste große Qualitätsposten.
2. **Abwesenheits-Zusagen als Lint-Regeln.** Die Proben sind weg, die Zusagen nicht. Kandidaten:
   `import/no-restricted-paths` für `bootstrap.ts`; dateibezogene Regeln für „kein
   `node:fs` in `video-ausschnitt.ts`", „keine ffmpeg-Flaggen in Adaptern", „kein
   `sort`/`filter` in reinen Modulen". Aus Charge 26 zusätzlich: kein Timer in
   `slogan-bearbeiten`, kein `mediaBlobUrl` in `video.tsx`, kein `Math.`/`RENDER_PROFILE` in
   `vorschau-auswahl`, kein `toDataURL`/`getContext` in `als-png`, kein Laufzeit-Code/
   `MarkenEintrag`/`Partial` in `marke.ts`, kein `fs`/`path`/`window.api`/`setTimeout` in
   `marken-bereitstellung`.
3. **`berichteDrop`** – toter Export in `medien-bibliothek.ts` (seit Charge 25 gemeldet):
   entweder anschließen oder entfernen. Produktentscheidung.
4. **Treiber** – In Charge 17 waren vier Läufe rot (CDP-Abriss, Pilot Abschnitt 30), ohne
   Codeänderung; Chargen 18–26 liefen ohne Befund. Ursache weiter **unbenannt**.
5. **Push** – `main` liegt vor `origin/main`; nur auf Anweisung.

## 5. Die Regeln für neue Tests (aus 26 Chargen)

1. **Keine Quelltext-Proben.** Das Verbot ist hart: `readFileSync` auf `src/` in
   `tests/unit` ist ein ESLint-Fehler. Zusagen, die nur „Abwesenheit" sind, gehören in eine
   Lint-Regel – nicht in einen Test, der Zeichenketten sucht.
2. **Eine Zusage braucht einen Verhaltenstest, der sie wirklich beobachtet.** Der
   `play()`-Fall in Charge 26 zeigt: Ein Test mit dem richtigen Titel („keine unbehandelte
   Ablehnung") kann den fehlenden `catch` trotzdem nicht sehen. Erst ein Thenable mit
   `catch`-Spion misst die Zusage.
3. **Fixtures dürfen die Zusage nicht zufällig erfüllen.** Quadratische Maße (AP2), beide
   Maße falsch (AP1), beide Antworten mit derselben Kennung (Charge 25, MB5), alle Projekte
   mit `p-1` (Charge 25, RA7) – vor dem Deuten einer grünen Mutation die Fixture ansehen.
4. **`0 bestanden, 0 rot` und `EDIT-PROBLEM: 0 Treffer` sind Messfehler**, kein grünes
   Ergebnis (Charge 23/24). Fall direkt mit `--reporter=json` fahren bzw. die Fallliste
   korrigieren.
5. **Falsche Spec → alles grün.** Bei `.ts`/`.tsx`-Paaren gibt es zwei Specs (Charge 13);
   Charge 26 zeigte dasselbe für einen **anders benannten** Test (`video-filmstreifen-blob`
   testet nicht `video.tsx`).
6. **Existiert die Zusage überhaupt noch?** Ein Export ohne Aufrufer (`berichteDrop`) und
   eine Funktion ohne Test (Charge 23, `haengeVorschauEin`) sind zwei verschiedene Befunde –
   beide gehören in die Übergabe.
7. **Grün kann ein Messfehler sein** – Mutation in einer nie aufgerufenen Funktion
   (Charge 20, P7) oder ein `all`-Rename, der Importpfade trifft (Charge 21).
8. **Eine Meldung mit dem richtigen Text ist kein Beleg für den richtigen Grund.** Exakte
   Vergleiche, wenn die Meldung die Zusage ist (Charge 18/IM8, Charge 24/UP11).
