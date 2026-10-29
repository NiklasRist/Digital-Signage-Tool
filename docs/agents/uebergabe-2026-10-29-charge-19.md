# Übergabe 29.10.2026 – Stand nach Charge 18

**Nächste Sitzung: Mutations-Charge 19.**
**Der Plan für alle restlichen Chargen: [`charge-17-26-plan.md`](charge-17-26-plan.md).**
Letzte gebaute Charge: [`uebergabe-2026-10-28-charge-18.md`](uebergabe-2026-10-28-charge-18.md).
Einzelbefunde: [`mutation-pilot-2026-10-20.md`](mutation-pilot-2026-10-20.md), Abschnitt 31.

## 1. Stand heute (nichts offen im Bau, Arbeitsbaum sauber)

| | Wert |
|---|---|
| Gebaute Chargen | **18** – **90 Testdateien** (je fünf), dazu das Lint-Gate #447 |
| Suite | **5.417** Unit-Tests in **340** Dateien, **49** Integrationstests in 12 Dateien |
| Gate | `npm run pruefung` **Exit 0** (Typecheck + Lint + Build + Tests + Integration + Treiber) |
| Treiber | **0 Befunde**; der CDP-Abriss aus Charge 17 trat in Charge 18 **nicht** auf |
| Sperrklinke | **40** Dateien in `tools/eslint/quelltext-proben-ausnahmen.json` |
| Lint | 0 Fehler (Warnungen unverändert: 192 × `SAFETY` aus #448) |
| Push | **nicht gepusht** – `main` liegt vor `origin/main`; **Push nur auf Anweisung** |

## 2. Nächster Schritt: Charge 19

Fünf Dateien – Handler-Anmeldungen und Verdrahtung:

| Spec | Quelle |
|---|---|
| `loesche-medium` | `src/main/media-service/loesche-medium.ts` |
| `export-handler-anmeldung` | `src/main/export-service/handler-anmeldung.ts` |
| `ziel-dialog` | `src/main/export-service/ziel-dialog.ts` |
| `export-verdrahtung` | `src/main/ipc-gateway/export-verdrahtung.ts` |
| `render-handler-anmeldung` | `src/main/render-service/handler-anmeldung.ts` |

**Erwartung:** Die Proben sind „kein Kanal-Literal, kein `ipcMain.handle` doppelt, keine
zweite Verdrahtung". Die Verhaltens-Tests decken das Senden; Lücken entstehen dort, wo ein
zusätzlicher Kanal oder ein zweiter `handle`-Aufruf nirgends verboten ist.

**Ablauf (wie in den 18 Chargen davor):**

1. Die fünf Specs und Quellen lesen; Probe-Blöcke und ihre Zusagen notieren.
2. Je Datei 4–6 semantische Mutationen + 1 harmloses Refactoring als JSON nach
   `$TMPDIR/charge19/faelle.json`; **jeder Suchtext genau einmal** (vorher trocken zählen).
3. `python3 tools/mutationen.py $TMPDIR/charge19/faelle.json`.
4. Grüne Mutation: Lücke (Verhaltens-Test) oder äquivalent (begründen). Gegenprobe je Lücke.
5. Probe-Blöcke entfernen, Importe aufräumen.
6. **Erneut messen** – die zweite Messung nach dem Ausbau gehört seit Charge 17 zum Rezept.
   In Charge 18 waren danach zwei Fälle grün, die **keine** Verhaltenslücke sind (abgeleitete
   Tests bzw. ohne Electron nicht beobachtbar) – solche Fälle **begründen**, nicht wegdrücken.
7. Die fünf Einträge aus der Sperrklinke streichen (**40 → 35**), `npx eslint .` muss grün sein.
8. `npm run pruefung`, dann `mutation-pilot` (Abschnitt 32), `CLAUDE.md`, Übergabe, Commit.

## 3. Der Plan für danach

[`charge-17-26-plan.md`](charge-17-26-plan.md) führt die verbleibenden **40** Dateien in
**acht** Chargen (19–26): Handler/Verdrahtung (19), Pfade/Stores (20), Render-Abbruch +
Vorlagen-Store (21), Renderer action-editor (22), app-shell-Filter (23), Montage/Zugänge (24),
Composer (25), Rest inkl. Vertragstest (26).

**Sonderfall in Charge 26:** `marke.spec.ts` liest `src/shared/contracts/marke.ts`. Wenn das
ein **Vertragstest** ist (Vollständigkeit der Marken-Felder, wie `fehlertexte`), **bleibt er**
und die Datei wird nur aus der Sperrklinke gestrichen. Vorher lesen, nicht nach dem Namen
urteilen. Charge 18 hat denselben Fall bereits praktiziert: `media-protokoll-schema` behielt
seinen **Werte**-Test und verließ nur die Sperrklinke.

**Danach:** Sperrklinke steht auf 0 → die Regel von „Sperrklinke" auf „Verbot" stellen
(Ausnahmen-Datei leeren und löschen).

## 4. Die fünf Fallen (aus 18 Chargen, jede hat eine Sitzung gekostet)

1. **Falsche Spec** → alles grün. Die Zuordnung Quelle → Spec steht in jeder Zeile der
   Fallliste; bei `.ts`+`.tsx`-Paaren gibt es **zwei** Specs (Charge 13).
2. **`0 bestanden, 0 rot`** heißt: die Suite lädt nicht. Fall korrigieren, nicht als
   „erkannt" werten (Charge 14; Charge 17: ein Ausbau-Schnitt traf einen Helfer mit).
3. **Zufällig deckende Fixtures** – jeder gültige Profilwert im Test war der Profilwert
   (Charge 17: `'30'`, `'high'`, `'mp4'`; Charge 18: `"media"`).
4. **Eine Meldung mit der richtigen Zahl/Text** ist kein Beleg für den richtigen Grund
   (ML7, Charge 3). **Charge 18:** `toContain("Absturz …")` blieb bei
   `"Error: Absturz …"` grün – erst der **exakte** Vergleich biss.
5. **Die Probe trägt die Zusage, nicht der Test.** Nach dem Ausbau erneut messen; sonst
   zählt eine Mutation als „erkannt", die nur der Quelltext-Vergleich gefangen hat.

## 5. Ehrlich offen (unverändert, in Charge 18 gewachsen)

- **Architekturregeln ohne Wächter**: Nach Charge 18 zusätzlich „Protokoll baut keine
  Pfade", „Dialog und Handler fassen kein `fs`/IPC an", „keine Übersetzungsschicht" (nur
  mittelbar über die Identitäts-Probe), „`new Date` genau einmal", „kein eigenes
  Lock/Flush im Import". Lint-Kandidaten: dateibezogen „kein `node:fs`", „keine
  ffmpeg-Flaggen in Adaptern", „kein `sort`/`filter` in reinen Modulen".
- **#448**: 192 Typ-Behauptungen in `src` ohne `SAFETY`-Begründung; Regel steht auf `warn`.
- **Treiber**: In Charge 17 waren vier Läufe rot (CDP-Abriss, Pilot Abschnitt 30), ohne
  Codeänderung; Charge 18 lief ohne Befund. Ursache weiter **unbenannt**; Kandidat
  `dumpio`/Frist/Retry.
- **Einzelquellen-Regeln** (`RENDER_PROFILE`, `SICHERHEITSABSTAND_PX`, Kanal-Registry,
  `FORMAT_WHITELIST`) sind nur durch Werte gedeckt – Charge 18 hat das für die Endungen
  belegt (DI7).
