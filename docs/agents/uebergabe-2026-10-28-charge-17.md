# Übergabe 28.10.2026 – Stand nach Charge 16, Plan für Chargen 17–26

**Nächste Sitzung: Mutations-Charge 17.**
**Der Plan für alle restlichen Chargen: [`charge-17-26-plan.md`](charge-17-26-plan.md).**
Letzte gebaute Charge: [`uebergabe-2026-10-28-charge-16.md`](uebergabe-2026-10-28-charge-16.md).

## 1. Stand heute (nichts offen im Bau, Arbeitsbaum sauber)

| | Wert |
|---|---|
| Gebaute Chargen | **16** – **80 Testdateien** (je fünf), dazu das Lint-Gate #447 |
| Suite | **5.479** Unit-Tests in **340** Dateien, **49** Integrationstests in 12 Dateien |
| Gate | `npm run pruefung` **Exit 0** (Typecheck + Lint + Build + Tests + Integration + Treiber) |
| Treiber | **0 Befunde**; FA-13-Sitzung seit Charge 15 mit 5-s-Frist gemessen (vorher 2/3 rot, danach 3/3 grün) |
| Sperrklinke | **50** Dateien in `tools/eslint/quelltext-proben-ausnahmen.json` |
| Lint | 0 Fehler, 258 Warnungen (192 × `SAFETY` aus #448) |
| Push | **nicht gepusht** – `main` liegt vor `origin/main`; **Push nur auf Anweisung** |

## 2. Nächster Schritt: Charge 17

Fünf Dateien, alle mit **genau einer** Probe:

| Spec | Quelle |
|---|---|
| `bandspur` | `src/main/ffmpeg-adapter/bandspur.ts` |
| `encoder-argumente` | `src/main/ffmpeg-adapter/encoder-argumente.ts` |
| `filter-einblendung` | `src/main/ffmpeg-adapter/filter-einblendung.ts` |
| `filter-vollbild` | `src/main/ffmpeg-adapter/filter-vollbild.ts` |
| `standbild` | `src/main/ffmpeg-adapter/standbild.ts` |

**Ablauf (wie in den 16 Chargen davor):**

1. Die fünf Specs und Quellen lesen; Probe-Blöcke und ihre Zusagen notieren.
2. Je Datei 4–6 semantische Mutationen + 1 harmloses Refactoring als JSON nach
   `$TMPDIR/charge17/faelle.json`; **jeder Suchtext genau einmal** (vorher trocken zählen).
3. `python3 tools/mutationen.py $TMPDIR/charge17/faelle.json`.
4. Grüne Mutation: Lücke (Verhaltens-Test) oder äquivalent (begründen). Gegenprobe je Lücke.
5. Fünf Probe-Blöcke entfernen, Importe aufräumen.
6. Die fünf Einträge aus der Sperrklinke streichen (**50 → 45**), `npx eslint .` muss grün sein.
7. `npm run pruefung`, dann `mutation-pilot` (Abschnitt 30), `CLAUDE.md`, Übergabe, Commit.

**Erwartung:** Die fünf Adapter-Proben sind „setzt seine Flags selbst / keine zweite Quelle".
Verhaltens-Tests prüfen die Argument-Arrays; Lücken entstehen dort, wo ein zusätzliches Flag
nirgends verboten ist. Rechne mit **2–4 Lücken**.

## 3. Der Plan für danach

[`charge-17-26-plan.md`](charge-17-26-plan.md) teilt die restlichen **50** Dateien in **zehn
Chargen à fünf** (17–26), nach Modul geschnitten: ffmpeg-Adapter (17), Tonspur + Media-Service
(18), Handler/Verdrahtung (19), Pfade/Stores (20), Render-Abbruch + Vorlagen-Store (21),
Renderer action-editor (22), app-shell-Filter (23), Montage/Zugänge (24), Composer (25),
Rest inkl. Vertragstest (26).

**Sonderfall in Charge 26:** `marke.spec.ts` liest `src/shared/contracts/marke.ts`. Wenn das ein
**Vertragstest** ist (Vollständigkeit der Marken-Felder, wie `fehlertexte`), **bleibt er** und die
Datei wird nur aus der Sperrklinke gestrichen. Vorher lesen, nicht nach dem Namen urteilen.

**Danach:** Sperrklinke steht auf 0 → die Regel von „Sperrklinke" auf „Verbot" stellen
(Ausnahmen-Datei leeren und löschen).

## 4. Die vier Fallen (aus 16 Chargen, jede hat eine Sitzung gekostet)

1. **Falsche Spec** → alles grün. Die Zuordnung Quelle → Spec steht in jeder Zeile der Fallliste;
   bei `.ts`+`.tsx`-Paaren gibt es **zwei** Specs (Charge 13: `einblendung-ansicht.spec.ts`
   vs. `einblendung-ansicht-anzeige.spec.ts`).
2. **`0 bestanden, 0 rot`** heißt: die Suite lädt nicht. Fall korrigieren, nicht als „erkannt"
   werten (Charge 14: `fenster.on` im Doppel).
3. **Zufällig deckende Fixtures** – Lage gleich Modell, beide Marken dieselbe `id`, eine
   Testzeile statt zwei (Charge 16: EZ2; Charge 13: EN4; Charge 12: AL4).
4. **Eine Meldung mit der richtigen Zahl** ist kein Beleg für den richtigen Grund (Charge 3,
   Charge 16: ML7).

## 5. Ehrlich offen (unverändert)

- **Architekturregeln ohne Wächter**: Die Proben fallen, die Zusagen bleiben nur im Kommentar.
  Lint-Kandidaten: dateibezogen „kein `node:fs`", „keine ffmpeg-Flaggen in Adaptern",
  „kein `sort`/`filter` in reinen Modulen".
- **#448**: 192 Typ-Behauptungen in `src` ohne `SAFETY`-Begründung; Regel steht auf `warn`.
- **Treiber**: weitere Einmal-Leser nicht systematisch geprüft.
- **Einzelquellen-Regeln** (`RENDER_PROFILE`, `SICHERHEITSABSTAND_PX`, Kanal-Registry) nur durch
  Werte gedeckt.
