# Übergabe 29.10.2026 – Stand nach Charge 24

**Nächste Sitzung: Mutations-Charge 25.**
**Der Plan für alle restlichen Chargen: [`charge-17-26-plan.md`](charge-17-26-plan.md).**
Letzte gebaute Charge: [`uebergabe-2026-10-29-charge-24.md`](uebergabe-2026-10-29-charge-24.md).
Einzelbefunde: [`mutation-pilot-2026-10-20.md`](mutation-pilot-2026-10-20.md), Abschnitt 37.

## 1. Stand heute (nichts offen im Bau, Arbeitsbaum sauber nach dem Commit)

| | Wert |
|---|---|
| Gebaute Chargen | **24** – **120 Testdateien** (je fünf), dazu das Lint-Gate #447 |
| Suite | **5.301** Unit-Tests in **340** Dateien, **49** Integrationstests in 12 Dateien |
| Gate | `npm run pruefung` **Exit 0** (Typecheck + Lint + Build + Tests + Integration + Treiber) |
| Treiber | **0 Befunde**; der CDP-Abriss aus Charge 17 trat in 18–24 **nicht** auf |
| Sperrklinke | **10** Dateien in `tools/eslint/quelltext-proben-ausnahmen.json` |
| Lint | 0 Fehler (Warnungen unverändert: 192 × `SAFETY` aus #448) |
| Push | **nicht gepusht** – `main` liegt vor `origin/main`; **Push nur auf Anweisung** |

## 2. Was Charge 24 ergeben hat (kurz)

- **27 Verhaltens-Mutationen, 5 Refactorings**; erste Messung **22 erkannt**, **5 Lücken**
  geschlossen, **0 äquivalent**; **0/5 Refactorings rot**.
- **Die fünf Lücken:**
  - **UE18** — `meldeStand` auf `LEERE_SHELL_REPARATUR` verlor laufende Übergabe,
    Hervorhebung und Rückkehr-Reiter. Ein Stand **während** der Führung muss sie tragen.
  - **UE20** — `hoerer.push` → `unshift`: die **Anmeldereihenfolge** ist zugesagt
    (ENTSCHIEDEN 10), war aber ungeprüft.
  - **UP5** — `kannWiederherstellen` ignorierte die Projekt-Kennung; der Zwilling
    `kannRueckgaengig` hatte den Gegenfall, dieses Gegenstück nicht.
  - **UP11** — Wurfmeldung war nur über den Code geprüft. `String(error)` liefert
    `"Error: …"`; jetzt exakt `"Bridge fehlt"` (dieselbe Klasse wie IM8, Charge 18).
  - **UP2** — `standardSegmentdauer` als Literal **10**; alle Fixtures tragen 10
    (Fixture-Falle). Neu: ein Projekt mit **4.7**.
- **Messfehler, offen benannt:** UP2 lief zuerst als `EDIT-PROBLEM: 0 Treffer` — der
  Suchtext sprang über fünf Kommentarzeilen. Gegen die Spec aus **HEAD** gefahren:
  24 bestanden, 0 rot. Die Lücke war damit gemessen, nicht vermutet.
- **Nachmessung nach dem Ausbau: 27 von 27 rot** — keine Mutation hing an einer Probe.

## 3. Nächster Schritt: Charge 25

Fünf Dateien – Composer-Kern:

| Spec | Quelle |
|---|---|
| `element-zeile-anzeige` | `src/renderer/composer/element-zeile.tsx` |
| `medien-bibliothek` | `src/renderer/composer/medien-bibliothek.ts` |
| `optimistisch` | `src/renderer/composer/optimistisch.ts` |
| `render-ausloesen` | `src/renderer/composer/render-ausloesen.ts` |
| `render-dialog` | `src/renderer/composer/render-dialog.ts` |

**Erwartung:** `optimistisch` trägt die Undo-Zusage („erst Sicht, dann Aufruf, Rollback bei
Fehlschlag") — die Verhaltens-Tests prüfen die **Reihenfolge**; die Proben dort besonders
genau lesen. `element-zeile-anzeige` ist die einzige `.tsx`-Spec dieser Charge; vor dem
Entfernen prüfen, ob der Verhaltens-Test die Darstellung wirklich trägt (Charge 22/23).

**Ablauf (wie in den 24 Chargen davor):**

1. Die fünf Specs und Quellen lesen; Probe-Blöcke und ihre Zusagen notieren. **Prüfen, ob
   der Verhaltens-Test die Funktion überhaupt aufruft, in der die Mutation sitzt.**
2. Je Datei 4–6 semantische Mutationen + 1 harmloses Refactoring als JSON nach
   `$TMPDIR/charge25/faelle.json`; **jeder Suchtext genau einmal**. Bewährt: Fälle aus
   **Zeilenbereichen** bauen und die Eindeutigkeit im Builder prüfen.
3. `python3 tools/mutationen.py $TMPDIR/charge25/faelle.json`.
   **`EDIT-PROBLEM: 0 Treffer` ist ein Messfehler, kein grünes Ergebnis** — Fall korrigieren,
   nicht werten.
4. Grüne Mutation: Lücke (Verhaltens-Test) oder äquivalent (begründen). **Gegenprobe je
   Lücke**; für „äquivalent" eine Gegenprobe mit **falschem** Wert. Eine Fixture-Lücke
   zusätzlich **gegen die Spec aus `git show HEAD:…`** messen — dann ist sie belegt.
5. Probe-Blöcke entfernen, Importe aufräumen (`readFileSync`, `fileURLToPath`).
6. **Erneut messen** — die zweite Messung nach dem Ausbau gehört seit Charge 17 zum Rezept.
7. Die fünf Einträge aus der Sperrklinke streichen (**10 → 5**), `npx eslint .` muss grün
   sein.
8. `npm run pruefung`, dann `mutation-pilot` (Abschnitt 38), `CLAUDE.md`, Übergabe, Commit.
   Der Treiber hängt je Lauf einen „Nachlauf" an `docs/agents/oberflaeche-durchlauf.md` —
   normal, wird mitcommittet.

## 4. Der Plan für danach

[`charge-17-26-plan.md`](charge-17-26-plan.md) führt die verbleibenden **10** Dateien in
**zwei** Chargen (25–26): Composer (25), Rest inkl. Vertragstest (26).

**Sonderfall in Charge 26:** `marke.spec.ts` liest `src/shared/contracts/marke.ts`. Wenn das
ein **Vertragstest** ist (Vollständigkeit der Marken-Felder, wie `fehlertexte`), **bleibt er**
und die Datei wird nur aus der Sperrklinke gestrichen. Vorher lesen, nicht nach dem Namen
urteilen — Charge 18 (`media-protokoll-schema`) und Charge 19 (Registry-Block) haben das
bereits praktiziert.

**Danach:** Sperrklinke steht auf 0 → die Regel von „Sperrklinke" auf „Verbot" stellen
(Ausnahmen-Datei leeren und löschen).

## 5. Die neun Fallen (aus 24 Chargen, jede hat eine Sitzung gekostet)

1. **Falsche Spec** → alles grün. Die Zuordnung Quelle → Spec steht in jeder Zeile der
   Fallliste; bei `.ts`+`.tsx`-Paaren gibt es **zwei** Specs (Charge 13).
2. **`0 bestanden, 0 rot`** heißt: die Suite lädt nicht — **oder** der Harness hat einen
   Aussetzer (Charge 23, K6). Fall **direkt** mit `--reporter=json` fahren, bevor du ihn
   wertest. Verwandt: ein Edit, der eine Methode einführt, die das Test-Doppel nicht hat
   (`fenster.on` statt `once`), lässt den Import scheitern.
3. **Zufällig deckende Fixtures** — jeder gültige Profilwert im Test war der Profilwert
   (Charge 17: `'30'`, `'high'`, `'mp4'`; 18: `"media"`; 21: L4; 23: V4; **24: UP2**, alle
   Projekte tragen `standardSegmentdauer: 10`). Vor dem Deuten einer grünen Mutation die
   Fixture ansehen.
4. **Eine Meldung mit der richtigen Zahl/Text** ist kein Beleg für den richtigen Grund
   (ML7, Charge 3). **Charge 18:** `toContain("Absturz …")` blieb bei `"Error: Absturz …"`
   grün — erst der **exakte** Vergleich biss. **Charge 24:** dieselbe Klasse bei UP11.
5. **Die Probe trägt die Zusage, nicht der Test.** Nach dem Ausbau erneut messen; sonst
   zählt eine Mutation als „erkannt", die nur der Quelltext-Vergleich gefangen hat.
   **Charge 19:** EV6. **Charge 20:** L8. **Charge 23:** `live-vorschau` hatte nicht einmal
   eine — nur toten Code. **Charge 24:** nach dem Ausbau blieben 27/27 rot.
6. **Grün kann ein Messfehler sein.** Sitzt die Mutation in einer Funktion, die der Test nie
   aufruft, ist sie grün (Charge 20: P7). **Charge 22:** A4 war zuerst ein
   Anführungszeichen-Tausch — ein harmloses Refactoring als „Angriff".
7. **Ein `all`-Rename trifft jede Zeichenkette** — auch Importpfade und fremde Bezeichner
   (Charge 21: `nutzlast` → `eingang` traf `nutzlast-pruefer`, Suite lud nicht).
8. **Eine Datei kann eine Funktion haben, die gar keinen Test hat.** In Charge 23 war
   `haengeVorschauEin` komplett ungeprüft, obwohl die Datei zwei getestete Funktionen hat.
   Vor dem Messen die **exportierten Namen** gegen die `describe`-Blöcke halten.
9. **`EDIT-PROBLEM: 0 Treffer` ist kein grünes Ergebnis** (neu, Charge 24). Der Suchtext
   fand die Stelle nicht, weil Kommentarzeilen dazwischenlagen. Der Harness wertet den Fall
   nicht — die Fallliste korrigieren und erneut fahren. Für eine Fixture-Lücke die
   **Spec aus `HEAD`** als Gegenprobe nehmen: grün dort, rot mit dem neuen Test.

## 6. Ehrlich offen (in Charge 24 gewachsen)

- **Abwesenheits-Zusagen ohne Wächter**: kein `react`/JSX in den reinen Modulen, kein
  `rufeAuf`/`KANAELE`/`window.`/Timer und keine Importe aus fremden Renderer-Ordnern in
  `bootstrap.ts` — das ist die Architekturgrenze selbst. Aus Charge 24: kein IPC/Timer in
  `uebergabe`, keine feingranulare Operation und kein `assets`/`letzterAusgabeName` in
  `undo-projekt`, genau ein Kanal und kein `fs`/`window.api` in `element-entfernen`.
  Lint-Kandidat `import/no-restricted-paths`.
- **#448**: 192 Typ-Behauptungen in `src` ohne `SAFETY`-Begründung; Regel steht auf `warn`.
- **Treiber**: In Charge 17 waren vier Läufe rot (CDP-Abriss, Pilot Abschnitt 30), ohne
  Codeänderung; Chargen 18–24 liefen ohne Befund. Ursache weiter **unbenannt**.
- **Einzelquellen-Regeln** (`RENDER_PROFILE`, `SICHERHEITSABSTAND_PX`, Kanal-Registry,
  `FORMAT_WHITELIST`) sind nur durch Werte gedeckt — belegt in Charge 18 (DI7), 19 (EV8),
  20 (L8).
