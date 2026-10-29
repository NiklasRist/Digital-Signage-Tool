# Übergabe 29.10.2026 – Stand nach Charge 19

**Nächste Sitzung: Mutations-Charge 20.**
**Der Plan für alle restlichen Chargen: [`charge-17-26-plan.md`](charge-17-26-plan.md).**
Letzte gebaute Charge: [`uebergabe-2026-10-29-charge-19.md`](uebergabe-2026-10-29-charge-19.md).
Einzelbefunde: [`mutation-pilot-2026-10-20.md`](mutation-pilot-2026-10-20.md), Abschnitt 32.

## 1. Stand heute (nichts offen im Bau, Arbeitsbaum sauber nach dem Commit)

| | Wert |
|---|---|
| Gebaute Chargen | **19** – **95 Testdateien** (je fünf), dazu das Lint-Gate #447 |
| Suite | **5.382** Unit-Tests in **340** Dateien, **49** Integrationstests in 12 Dateien |
| Gate | `npm run pruefung` **Exit 0** (Typecheck + Lint + Build + Tests + Integration + Treiber) |
| Treiber | **0 Befunde**; der CDP-Abriss aus Charge 17 trat auch in Charge 19 **nicht** auf |
| Sperrklinke | **35** Dateien in `tools/eslint/quelltext-proben-ausnahmen.json` |
| Lint | 0 Fehler (Warnungen unverändert: 192 × `SAFETY` aus #448) |
| Push | **nicht gepusht** – `main` liegt vor `origin/main`; **Push nur auf Anweisung** |

## 2. Was Charge 19 ergeben hat (kurz)

- **27 Verhaltens-Mutationen, 5 Refactorings**; **27 erkannt**, **0 Lücken**, **0/5
  Refactorings rot**; jede Mutation byte-identisch zurückgenommen.
- **EV6** – `registriereHandler('export:wähleExportZiel', …)` statt der Registry-Konstante –
  war der einzige Fall, den **nur die Quelltextprobe** fing. Nach dem Ausbau grün, also
  **äquivalent**: derselbe Wert. **Gegenprobe EV8** (Literal mit falschem Wert,
  `export:waehleExportZiel`) ist **rot mit 11 Tests** – ein Tippfehler fällt weiter auf,
  ungeschützt ist allein die Schreibweise.
- **35 Quelltext-/Meta-Tests entfernt, 0 ergänzt, 0 gekürzt**; Suite 5.417 → **5.382**.
- Der **Registry-Block** in `export-verdrahtung.spec.ts` bleibt: Er prüft **Werte** von
  `kanaele.ts` (`export:wähleExportZiel`, `render:fortschritt` zeichengleich) und ist keine
  Quelle-Probe – dieselbe Bauart wie `media-protokoll-schema` in Charge 18.

## 3. Nächster Schritt: Charge 20

Fünf Dateien – Pfad-Autoritäten und Store-Listen:

| Spec | Quelle |
|---|---|
| `marken-store-pfade` | `src/main/marken-store/pfade.ts` |
| `ausgaben` | `src/main/project-store/ausgaben.ts` |
| `liste-projekte` | `src/main/project-store/liste-projekte.ts` |
| `oeffne-projektordner` | `src/main/project-store/oeffne-projektordner.ts` |
| `pfade` | `src/main/project-store/pfade.ts` |

**Erwartung:** Die Proben sagen meist „kein `path.join` mit Projekt-ID". Die
**Pfad-Autorität** ist Vertrag (TK 9.5.7) – hier müssen die **Verhaltens-Tests** die
Pfadbildung tragen, sonst wird die Probe zur einzigen Wächterin (Fall EV6). Bei `pfade`
reicht ein grünes Refactoring **nicht** als Beleg: dort ist die Pfadbildung selbst der
Inhalt.

**Ablauf (wie in den 19 Chargen davor):**

1. Die fünf Specs und Quellen lesen; Probe-Blöcke und ihre Zusagen notieren.
2. Je Datei 4–6 semantische Mutationen + 1 harmloses Refactoring als JSON nach
   `$TMPDIR/charge20/faelle.json`; **jeder Suchtext genau einmal** (vorher trocken zählen).
   Bewährt: Fälle aus **Zeilenbereichen** bauen und die Eindeutigkeit im Builder prüfen.
3. `python3 tools/mutationen.py $TMPDIR/charge20/faelle.json`.
4. Grüne Mutation: Lücke (Verhaltens-Test) oder äquivalent (begründen). **Gegenprobe je
   Lücke**; für „äquivalent" eine Gegenprobe mit **falschem** Wert (wie EV8).
5. Probe-Blöcke entfernen, Importe aufräumen (auch `fileURLToPath`/`readFileSync`).
6. **Erneut messen** – die zweite Messung nach dem Ausbau gehört seit Charge 17 zum Rezept.
   Fälle, die nur die Probe fing, werden hier grün und sind zu **begründen**, nicht
   wegzudrücken.
7. Die fünf Einträge aus der Sperrklinke streichen (**35 → 30**), `npx eslint .` muss grün
   sein.
8. `npm run pruefung`, dann `mutation-pilot` (Abschnitt 33), `CLAUDE.md`, Übergabe, Commit.
   Der Treiber hängt je Lauf einen „Nachlauf" an `docs/agents/oberflaeche-durchlauf.md` –
   das ist normal und wird mitcommittet.

## 4. Der Plan für danach

[`charge-17-26-plan.md`](charge-17-26-plan.md) führt die verbleibenden **35** Dateien in
**sieben** Chargen (20–26): Pfade/Stores (20), Render-Abbruch + Vorlagen-Store (21),
Renderer action-editor (22), app-shell-Filter (23), Montage/Zugänge (24), Composer (25),
Rest inkl. Vertragstest (26).

**Sonderfall in Charge 26:** `marke.spec.ts` liest `src/shared/contracts/marke.ts`. Wenn das
ein **Vertragstest** ist (Vollständigkeit der Marken-Felder, wie `fehlertexte`), **bleibt er**
und die Datei wird nur aus der Sperrklinke gestrichen. Vorher lesen, nicht nach dem Namen
urteilen – Charge 18 (`media-protokoll-schema`) und Charge 19 (Registry-Block) haben das
bereits praktiziert.

**Danach:** Sperrklinke steht auf 0 → die Regel von „Sperrklinke" auf „Verbot" stellen
(Ausnahmen-Datei leeren und löschen).

## 5. Die fünf Fallen (aus 19 Chargen, jede hat eine Sitzung gekostet)

1. **Falsche Spec** → alles grün. Die Zuordnung Quelle → Spec steht in jeder Zeile der
   Fallliste; bei `.ts`+`.tsx`-Paaren gibt es **zwei** Specs (Charge 13).
2. **`0 bestanden, 0 rot`** heißt: die Suite lädt nicht. Fall korrigieren, nicht als
   „erkannt" werten (Charge 14; Charge 17: ein Ausbau-Schnitt traf einen Helfer mit).
   Verwandt: Ein Edit, der eine **Methode** einführt, die das Test-Doppel nicht hat (etwa
   `fenster.on` statt `once`), lässt den Import scheitern – dann steht dort `0/0`.
3. **Zufällig deckende Fixtures** – jeder gültige Profilwert im Test war der Profilwert
   (Charge 17: `'30'`, `'high'`, `'mp4'`; Charge 18: `"media"`).
4. **Eine Meldung mit der richtigen Zahl/Text** ist kein Beleg für den richtigen Grund
   (ML7, Charge 3). **Charge 18:** `toContain("Absturz …")` blieb bei
   `"Error: Absturz …"` grün – erst der **exakte** Vergleich biss.
5. **Die Probe trägt die Zusage, nicht der Test.** Nach dem Ausbau erneut messen; sonst
   zählt eine Mutation als „erkannt", die nur der Quelltext-Vergleich gefangen hat.
   **Charge 19:** EV6 war genau dieser Fall – und die **Gegenprobe mit falschem Wert** (EV8)
   belegt, dass die Zusage danach noch von einem Verhaltens-Test getragen wird.

## 6. Ehrlich offen (in Charge 19 gewachsen)

- **Architekturregeln ohne Wächter**: Neu offen sind das `try/catch`-Verbot in beiden
  Anmeldungen, `whenReady`-Anhänge, Lock/Flush in `loesche-medium` und in `ziel-dialog`
  `existsSync`/`homedir`/`loeseAusgabePfad`/`BrowserWindow`/`ipcMain`. Gedeckt bleiben:
  Identität der Fachfunktionen (Wrapper-Lambdas werden rot), `setzeExportZiel` (Spion),
  `node:fs/promises` samt `statfs` (Spies), Selbstaufruf beim Import („registriert beim
  blossen Import nichts") und der Kanal-**Wert** (EV8).
  Lint-Kandidaten: dateibezogen „kein `node:fs`", „keine ffmpeg-Flaggen in Adaptern",
  „kein `sort`/`filter` in reinen Modulen", „kein `try/catch` in Anmelde-Dateien".
- **#448**: 192 Typ-Behauptungen in `src` ohne `SAFETY`-Begründung; Regel steht auf `warn`.
- **Treiber**: In Charge 17 waren vier Läufe rot (CDP-Abriss, Pilot Abschnitt 30), ohne
  Codeänderung; Chargen 18 und 19 liefen ohne Befund. Ursache weiter **unbenannt**;
  Kandidat `dumpio`/Frist/Retry.
- **Einzelquellen-Regeln** (`RENDER_PROFILE`, `SICHERHEITSABSTAND_PX`, Kanal-Registry,
  `FORMAT_WHITELIST`) sind nur durch Werte gedeckt – Charge 18 hat das für die Endungen
  belegt (DI7), Charge 19 für den Export-Kanal (EV8).
