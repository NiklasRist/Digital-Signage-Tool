# Übergabe 29.10.2026 – Stand nach Charge 20

**Nächste Sitzung: Mutations-Charge 21.**
**Der Plan für alle restlichen Chargen: [`charge-17-26-plan.md`](charge-17-26-plan.md).**
Letzte gebaute Charge: [`uebergabe-2026-10-29-charge-20.md`](uebergabe-2026-10-29-charge-20.md).
Einzelbefunde: [`mutation-pilot-2026-10-20.md`](mutation-pilot-2026-10-20.md), Abschnitt 33.

## 1. Stand heute (nichts offen im Bau, Arbeitsbaum sauber nach dem Commit)

| | Wert |
|---|---|
| Gebaute Chargen | **20** – **100 Testdateien** (je fünf), dazu das Lint-Gate #447 |
| Suite | **5.357** Unit-Tests in **340** Dateien, **49** Integrationstests in 12 Dateien |
| Gate | `npm run pruefung` **Exit 0** (Typecheck + Lint + Build + Tests + Integration + Treiber) |
| Treiber | **0 Befunde**; der CDP-Abriss aus Charge 17 trat in 18–20 **nicht** auf |
| Sperrklinke | **30** Dateien in `tools/eslint/quelltext-proben-ausnahmen.json` |
| Lint | 0 Fehler (Warnungen unverändert: 192 × `SAFETY` aus #448) |
| Push | **nicht gepusht** – `main` liegt vor `origin/main`; **Push nur auf Anweisung** |

## 2. Was Charge 20 ergeben hat (kurz)

- **31 Verhaltens-Mutationen, 5 Refactorings**; **28 erkannt**, **1 Lücke**, **3 äquivalent**;
  **0/5 Refactorings rot**; jede Mutation byte-identisch zurückgenommen.
- **A6 war eine echte Lücke:** In `listeAusgaben` war der Zweig „Datei ist da, aber `stat`
  scheitert (EACCES/EIO)" ungetestet — `continue` statt `speicher_fehler` blieb grün. Neu:
  ein Test, der genau das prüft.
- **Drei äquivalente Fälle**, alle mit Begründung im Pilot: **M2** (naives `startsWith` —
  der Kandidat stammt immer aus demselben Ordner), **A1** (`isFile()` im Filter — `stat`
  prüft nach), **L8** (`media` inline — derselbe Wert).
- **Messfehler, offen benannt:** **P7** lag zuerst in `projekteOrdner()`, einer Funktion, die
  der Spy-Test nicht aufrief — grün war ein **Fehler der Mutation**, kein Befund. Als
  P7b/P7c korrigiert (rot). Dabei fiel auf, dass `projekteOrdner()` in der Aufrufliste des
  fs-Spy fehlte; nachgetragen und mit P7c belegt.
- **26 Probetests entfernt, 1 Verhaltens-Test ergänzt**; Suite 5.382 → **5.357**.

## 3. Nächster Schritt: Charge 21

Fünf Dateien – Render-Abbruch und Vorlagen-Store:

| Spec | Quelle |
|---|---|
| `render-abbruch` | `src/main/render-service/abbruch.ts` |
| `normalisieren` | `src/main/render-service/normalisieren.ts` |
| `als-eigenstaendige` | `src/main/vorlagen-store/als-eigenstaendige.ts` |
| `vorlagen-ipc-verdrahtung` | `src/main/vorlagen-store/ipc-verdrahtung.ts` |
| `loesche-vorlage` | `src/main/vorlagen-store/loesche-vorlage.ts` |

**Erwartung:** Abbruch-Zustand und Vorlagen-Löschen sind verhaltensstark; die Proben dort
sind meist „kein zweiter Abbruchweg / keine zweite Kopie". `normalisieren` ist die größte
Datei der Charge (42 KB) — Spec und Quelle vollständig lesen, bevor Fälle entstehen.
**Achtung:** `verwerfe-arbeitskopie` liegt in Charge 22 und hängt mit `loesche-vorlage`
zusammen; die Specs getrennt lesen, nicht die falsche laufen lassen.

**Ablauf (wie in den 20 Chargen davor):**

1. Die fünf Specs und Quellen lesen; Probe-Blöcke und ihre Zusagen notieren. **Prüfen, ob
   der Verhaltens-Test die Funktion überhaupt aufruft, in der die Mutation sitzt.**
2. Je Datei 4–6 semantische Mutationen + 1 harmloses Refactoring als JSON nach
   `$TMPDIR/charge21/faelle.json`; **jeder Suchtext genau einmal**. Bewährt: Fälle aus
   **Zeilenbereichen** bauen und die Eindeutigkeit im Builder prüfen.
3. `python3 tools/mutationen.py $TMPDIR/charge21/faelle.json`.
4. Grüne Mutation: Lücke (Verhaltens-Test) oder äquivalent (begründen). **Gegenprobe je
   Lücke**; für „äquivalent" eine Gegenprobe mit **falschem** Wert (EV8, Charge 19).
5. Probe-Blöcke entfernen, Importe aufräumen (`readFileSync`, `fileURLToPath`).
6. **Erneut messen** – die zweite Messung nach dem Ausbau gehört seit Charge 17 zum Rezept.
   Fälle, die nur die Probe fing, werden hier grün und sind zu **begründen**.
7. Die fünf Einträge aus der Sperrklinke streichen (**30 → 25**), `npx eslint .` muss grün
   sein.
8. `npm run pruefung`, dann `mutation-pilot` (Abschnitt 34), `CLAUDE.md`, Übergabe, Commit.
   Der Treiber hängt je Lauf einen „Nachlauf" an `docs/agents/oberflaeche-durchlauf.md` –
   normal, wird mitcommittet.

## 4. Der Plan für danach

[`charge-17-26-plan.md`](charge-17-26-plan.md) führt die verbleibenden **30** Dateien in
**sechs** Chargen (21–26): Render-Abbruch + Vorlagen-Store (21), Renderer action-editor (22),
app-shell-Filter (23), Montage/Zugänge (24), Composer (25), Rest inkl. Vertragstest (26).

**Sonderfall in Charge 26:** `marke.spec.ts` liest `src/shared/contracts/marke.ts`. Wenn das
ein **Vertragstest** ist (Vollständigkeit der Marken-Felder, wie `fehlertexte`), **bleibt er**
und die Datei wird nur aus der Sperrklinke gestrichen. Vorher lesen, nicht nach dem Namen
urteilen — Charge 18 (`media-protokoll-schema`) und Charge 19 (Registry-Block) haben das
bereits praktiziert.

**Danach:** Sperrklinke steht auf 0 → die Regel von „Sperrklinke" auf „Verbot" stellen
(Ausnahmen-Datei leeren und löschen).

## 5. Die sechs Fallen (aus 20 Chargen, jede hat eine Sitzung gekostet)

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
   **Charge 19:** EV6. **Charge 20:** L8 (positive `toContain`-Probe).
6. **Grün kann ein Messfehler sein.** Sitzt die Mutation in einer Funktion, die der Test
   nie aufruft, ist sie grün, ohne dass etwas über die Zusage gesagt wäre (Charge 20: P7,
   `projekteOrdner()` fehlte in der Aufrufliste des Spys). Vor dem Bewerten prüfen: **ruft
   der Test diese Funktion?** Und: beobachtet der Spy **diese** Funktion (P7c mit
   `accessSync` war grün, weil `accessSync` nicht in der Beobachtungsliste steht)?

## 6. Ehrlich offen (in Charge 20 gewachsen)

- **Architekturregeln ohne Wächter**: Neu offen ist **„eine Pfad-Autorität"** (L8 — der
  inline gebaute `media`-Pfad hat denselben Wert) und in `oeffne-projektordner` die Abwesenheit
  von `path.join`/`BrowserWindow`/`webContents`/`showItemInFolder`/`openExternal`. Aus
  Charge 19: `try/catch`-Verbot in beiden Anmeldungen, `whenReady`, Lock/Flush in
  `loesche-medium`, `existsSync`/`homedir`/`loeseAusgabePfad`/`BrowserWindow`/`ipcMain` in
  `ziel-dialog`. Aus Charge 18: Pfadfreiheit des Protokolls, kein `fs`/IPC in Dialog und
  Handler-Paket, `new Date` genau einmal.
  Lint-Kandidaten: dateibezogen `no-restricted-imports`/`no-restricted-syntax`.
- **#448**: 192 Typ-Behauptungen in `src` ohne `SAFETY`-Begründung; Regel steht auf `warn`.
- **Treiber**: In Charge 17 waren vier Läufe rot (CDP-Abriss, Pilot Abschnitt 30), ohne
  Codeänderung; Chargen 18–20 liefen ohne Befund. Ursache weiter **unbenannt**;
  Kandidat `dumpio`/Frist/Retry.
- **Einzelquellen-Regeln** (`RENDER_PROFILE`, `SICHERHEITSABSTAND_PX`, Kanal-Registry,
  `FORMAT_WHITELIST`) sind nur durch Werte gedeckt – belegt in Charge 18 (DI7), 19 (EV8) und
  20 (L8).
