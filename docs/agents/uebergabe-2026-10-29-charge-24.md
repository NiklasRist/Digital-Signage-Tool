# Übergabe 29.10.2026 – Stand nach Charge 23

**Nächste Sitzung: Mutations-Charge 24.**
**Der Plan für alle restlichen Chargen: [`charge-17-26-plan.md`](charge-17-26-plan.md).**
Letzte gebaute Charge: [`uebergabe-2026-10-29-charge-23.md`](uebergabe-2026-10-29-charge-23.md).
Einzelbefunde: [`mutation-pilot-2026-10-20.md`](mutation-pilot-2026-10-20.md), Abschnitt 36.

## 1. Stand heute (nichts offen im Bau, Arbeitsbaum sauber nach dem Commit)

| | Wert |
|---|---|
| Gebaute Chargen | **23** – **115 Testdateien** (je fünf), dazu das Lint-Gate #447 |
| Suite | **5.308** Unit-Tests in **340** Dateien, **49** Integrationstests in 12 Dateien |
| Gate | `npm run pruefung` **Exit 0** (Typecheck + Lint + Build + Tests + Integration + Treiber) |
| Treiber | **0 Befunde**; der CDP-Abriss aus Charge 17 trat in 18–23 **nicht** auf |
| Sperrklinke | **15** Dateien in `tools/eslint/quelltext-proben-ausnahmen.json` |
| Lint | 0 Fehler (Warnungen unverändert: 192 × `SAFETY` aus #448) |
| Push | **nicht gepusht** – `main` liegt vor `origin/main`; **Push nur auf Anweisung** |

## 2. Was Charge 23 ergeben hat (kurz)

- **29 Verhaltens-Mutationen, 5 Refactorings**; **26 erkannt**, **3 Lücken** geschlossen,
  **0 äquivalent**; **0/5 Refactorings rot**.
- **Alle drei Lücken in `live-vorschau`:**
  - **V5/V6** — `haengeVorschauEin` war **ungetestet**: `aspectRatio` vertauscht und das
    `parentElement`-Tor entfernt blieben grün. Neu: drei Tests.
  - **V4** — der Test „bildRef null **oder ein unresolviertes Asset**" führte nur
    `bildRef: null` vor; der `asset === null`-Zweig war unerreicht (Fixture-Falle).
- **`live-vorschau` hatte gar keine Probe:** `QUELLE` wurde gelesen und **nie benutzt** —
  toter Code. Die Datei verlässt die Sperrklinke allein deshalb.
- **Harness-Aussetzer, offen benannt:** **K6** meldete `0 bestanden, 0 rot`; die
  Direktausführung mit `--reporter=json` zeigt `numFailedTests: 2`. Bei `0/0` **nicht** auf
  die Tabelle hören, sondern den Fall direkt fahren.
- **Nachmessung nach dem Ausbau: 29 von 29 rot.**

## 3. Nächster Schritt: Charge 24

Fünf Dateien – Montage/Zugänge:

| Spec | Quelle |
|---|---|
| `inhalte-zugaenge-rechnung` | `src/renderer/app-shell/inhalte-zugaenge.ts` |
| `rahmen-montage` | `src/renderer/app-shell/rahmen-montage.ts` |
| `uebergabe` | `src/renderer/app-shell/uebergabe.ts` |
| `undo-projekt` | `src/renderer/app-shell/undo-projekt.ts` |
| `element-entfernen` | `src/renderer/composer/element-entfernen.ts` |

**Erwartung:** `inhalte-zugaenge` ist eine Rechnung (Zuordnung Sicht → Zugang) — dort tragen
die Verhaltens-Tests erfahrungsgemäß gut. `undo-projekt` liest vermutlich den
Projekt-Historien-Spion: **Der bleibt** (er prüft Verhalten); nur die Quelltext-Probe zählt.
Bei `uebergabe` ist die Zusage „genau eine Umgebung, keine zweite Wahrheit" — prüfen, ob der
Test Identität oder nur Form prüft.

**Ablauf (wie in den 23 Chargen davor):**

1. Die fünf Specs und Quellen lesen; Probe-Blöcke und ihre Zusagen notieren. **Prüfen, ob
   der Verhaltens-Test die Funktion überhaupt aufruft, in der die Mutation sitzt.**
2. Je Datei 4–6 semantische Mutationen + 1 harmloses Refactoring als JSON nach
   `$TMPDIR/charge24/faelle.json`; **jeder Suchtext genau einmal**. Bewährt: Fälle aus
   **Zeilenbereichen** bauen und die Eindeutigkeit im Builder prüfen.
3. `python3 tools/mutationen.py $TMPDIR/charge24/faelle.json`.
4. Grüne Mutation: Lücke (Verhaltens-Test) oder äquivalent (begründen). **Gegenprobe je
   Lücke**; für „äquivalent" eine Gegenprobe mit **falschem** Wert.
5. Probe-Blöcke entfernen, Importe aufräumen (`readFileSync`, `fileURLToPath`).
6. **Erneut messen** — die zweite Messung nach dem Ausbau gehört seit Charge 17 zum Rezept.
7. Die fünf Einträge aus der Sperrklinke streichen (**15 → 10**), `npx eslint .` muss grün
   sein.
8. `npm run pruefung`, dann `mutation-pilot` (Abschnitt 37), `CLAUDE.md`, Übergabe, Commit.
   Der Treiber hängt je Lauf einen „Nachlauf" an `docs/agents/oberflaeche-durchlauf.md` —
   normal, wird mitcommittet.

## 4. Der Plan für danach

[`charge-17-26-plan.md`](charge-17-26-plan.md) führt die verbleibenden **15** Dateien in
**drei** Chargen (24–26): Montage/Zugänge (24), Composer (25), Rest inkl. Vertragstest (26).

**Sonderfall in Charge 26:** `marke.spec.ts` liest `src/shared/contracts/marke.ts`. Wenn das
ein **Vertragstest** ist (Vollständigkeit der Marken-Felder, wie `fehlertexte`), **bleibt er**
und die Datei wird nur aus der Sperrklinke gestrichen. Vorher lesen, nicht nach dem Namen
urteilen — Charge 18 (`media-protokoll-schema`) und Charge 19 (Registry-Block) haben das
bereits praktiziert.

**Danach:** Sperrklinke steht auf 0 → die Regel von „Sperrklinke" auf „Verbot" stellen
(Ausnahmen-Datei leeren und löschen).

## 5. Die acht Fallen (aus 23 Chargen, jede hat eine Sitzung gekostet)

1. **Falsche Spec** → alles grün. Die Zuordnung Quelle → Spec steht in jeder Zeile der
   Fallliste; bei `.ts`+`.tsx`-Paaren gibt es **zwei** Specs (Charge 13).
2. **`0 bestanden, 0 rot`** heißt: die Suite lädt nicht — **oder** der Harness hat einen
   Aussetzer (Charge 23, K6). Fall **direkt** mit `--reporter=json` fahren, bevor du ihn
   wertest. Verwandt: ein Edit, der eine Methode einführt, die das Test-Doppel nicht hat
   (`fenster.on` statt `once`), lässt den Import scheitern.
3. **Zufällig deckende Fixtures** — jeder gültige Profilwert im Test war der Profilwert
   (Charge 17: `'30'`, `'high'`, `'mp4'`; 18: `"media"`; 21: L4; **23: V4**, der Testtitel
   nannte zwei Fälle, die Fixture hatte einen). Vor dem Deuten einer grünen Mutation die
   Fixture ansehen.
4. **Eine Meldung mit der richtigen Zahl/Text** ist kein Beleg für den richtigen Grund
   (ML7, Charge 3). **Charge 18:** `toContain("Absturz …")` blieb bei `"Error: Absturz …"`
   grün — erst der **exakte** Vergleich biss.
5. **Die Probe trägt die Zusage, nicht der Test.** Nach dem Ausbau erneut messen; sonst
   zählt eine Mutation als „erkannt", die nur der Quelltext-Vergleich gefangen hat.
   **Charge 19:** EV6. **Charge 20:** L8. **Charge 23:** `live-vorschau` hatte nicht einmal
   eine — nur toten Code.
6. **Grün kann ein Messfehler sein.** Sitzt die Mutation in einer Funktion, die der Test nie
   aufruft, ist sie grün (Charge 20: P7). **Charge 22:** A4 war zuerst ein
   Anführungszeichen-Tausch — ein harmloses Refactoring als „Angriff".
7. **Ein `all`-Rename trifft jede Zeichenkette** — auch Importpfade und fremde Bezeichner
   (Charge 21: `nutzlast` → `eingang` traf `nutzlast-pruefer`, Suite lud nicht).
8. **Eine Datei kann eine Funktion haben, die gar keinen Test hat.** In Charge 23 war
   `haengeVorschauEin` komplett ungeprüft, obwohl die Datei zwei getestete Funktionen hat.
   Vor dem Messen die **exportierten Namen** gegen die `describe`-Blöcke halten.

## 6. Ehrlich offen (in Charge 23 gewachsen)

- **Abwesenheits-Zusagen ohne Wächter**: kein `react`/JSX in den reinen Modulen, kein
  `rufeAuf`/`KANAELE`/`window.`/Timer und keine Importe aus fremden Renderer-Ordnern in
  `bootstrap.ts` — das ist die Architekturgrenze selbst. Lint-Kandidat
  `import/no-restricted-paths`. Aus Charge 22: kein `window.api`/`fs`/`throw` in den
  Renderer-Dateien, kein `setTimeout`/`reiheEin` in `App.tsx`. Aus Charge 21: kein
  `fs`/`kill`/`unlink` im Abbruch, kein zweites Lock. Aus Charge 20: „eine Pfad-Autorität".
- **#448**: 192 Typ-Behauptungen in `src` ohne `SAFETY`-Begründung; Regel steht auf `warn`.
- **Treiber**: In Charge 17 waren vier Läufe rot (CDP-Abriss, Pilot Abschnitt 30), ohne
  Codeänderung; Chargen 18–23 liefen ohne Befund. Ursache weiter **unbenannt**.
- **Einzelquellen-Regeln** (`RENDER_PROFILE`, `SICHERHEITSABSTAND_PX`, Kanal-Registry,
  `FORMAT_WHITELIST`) sind nur durch Werte gedeckt — belegt in Charge 18 (DI7), 19 (EV8),
  20 (L8).
