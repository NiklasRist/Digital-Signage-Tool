# Übergabe 28.10.2026 – Stand nach Charge 17

**Nächste Sitzung: Mutations-Charge 18.**
**Der Plan für alle restlichen Chargen: [`charge-17-26-plan.md`](charge-17-26-plan.md).**
Letzte gebaute Charge: [`uebergabe-2026-10-28-charge-17.md`](uebergabe-2026-10-28-charge-17.md).
Einzelbefunde: [`mutation-pilot-2026-10-20.md`](mutation-pilot-2026-10-20.md), Abschnitt 30.

## 1. Stand heute (nichts offen im Bau, Arbeitsbaum sauber)

| | Wert |
|---|---|
| Gebaute Chargen | **17** – **85 Testdateien** (je fünf), dazu das Lint-Gate #447 |
| Suite | **5.450** Unit-Tests in **340** Dateien, **49** Integrationstests in 12 Dateien |
| Gate | `npm run pruefung` **Exit 0** (Typecheck + Lint + Build + Tests + Integration + Treiber) |
| Treiber | **0 Befunde**; FA-13-Sitzung seit Charge 15 mit 5-s-Frist gemessen |
| Sperrklinke | **45** Dateien in `tools/eslint/quelltext-proben-ausnahmen.json` |
| Lint | 0 Fehler (Warnungen unverändert: 192 × `SAFETY` aus #448) |
| Push | **nicht gepusht** – `main` liegt vor `origin/main`; **Push nur auf Anweisung** |

## 2. Nächster Schritt: Charge 18

Fünf Dateien – Tonspur und Media-Service:

| Spec | Quelle |
|---|---|
| `tonspur` | `src/main/ffmpeg-adapter/tonspur.ts` |
| `media-protokoll-schema` | `src/main/media-protokoll.ts` |
| `dialog` | `src/main/media-service/dialog.ts` |
| `handler-registrierung` | `src/main/media-service/handler-registrierung.ts` |
| `import-medium` | `src/main/media-service/import-medium.ts` |

**Sonderfall `media-protokoll-schema`:** Der Test prüft die **fünf Privilegien** des Schemas
(seit #364). Das sind **Werte**, keine Form – vor dem Entfernen genau lesen, ob ein
Verhaltens-Test sie trägt. Wenn er sie trägt, bleibt er trotzdem ein Sperrklinken-Fall,
weil er die Quelle liest.

**Ablauf (wie in den 17 Chargen davor):**

1. Die fünf Specs und Quellen lesen; Probe-Blöcke und ihre Zusagen notieren.
2. Je Datei 4–6 semantische Mutationen + 1 harmloses Refactoring als JSON nach
   `$TMPDIR/charge18/faelle.json`; **jeder Suchtext genau einmal** (vorher trocken zählen).
   Vorsicht bei Teilketten: `    '-an',` steckt auch in der 6-Leerzeichen-Fassung.
3. `python3 tools/mutationen.py $TMPDIR/charge18/faelle.json`.
4. Grüne Mutation: Lücke (Verhaltens-Test) oder äquivalent (begründen). Gegenprobe je Lücke.
5. Probe-Blöcke entfernen, Importe aufräumen.
6. **Erneut messen:** Nach dem Ausbau dieselbe Fallliste noch einmal laufen lassen. In
   Charge 17 waren drei Mutationen (EN2/EN3/EN4) **nur** von der Literal-Probe gefangen –
   sie wurden erst nach deren Entfernung sichtbar. Wer nur vor dem Ausbau misst, hält sie
   für erkannt. Dazu kommen Gegenproben für die neuen Wächter (in Charge 17: ST7/ST8).
7. Die fünf Einträge aus der Sperrklinke streichen (**45 → 40**), `npx eslint .` muss grün sein.
8. `npm run pruefung`, dann `mutation-pilot` (Abschnitt 31), `CLAUDE.md`, Übergabe, Commit.

**Erwartung:** `tonspur` ist wie die Adapter aus Charge 17 gebaut – Argument-Arrays tragen
die Zusage. `media-protokoll-schema` und die media-service-Dateien sind näher an Werten und
Verhalten; dort ist mit **weniger** Lücken zu rechnen als in Charge 17 (dort: 3 vor dem
Ausbau + 3 danach).

## 3. Der Plan für danach

[`charge-17-26-plan.md`](charge-17-26-plan.md) führt die verbleibenden **45** Dateien in
**neun** Chargen (18–26), nach Modul geschnitten: Tonspur + Media-Service (18),
Handler/Verdrahtung (19), Pfade/Stores (20), Render-Abbruch + Vorlagen-Store (21), Renderer
action-editor (22), app-shell-Filter (23), Montage/Zugänge (24), Composer (25), Rest inkl.
Vertragstest (26).

**Sonderfall in Charge 26:** `marke.spec.ts` liest `src/shared/contracts/marke.ts`. Wenn das
ein **Vertragstest** ist (Vollständigkeit der Marken-Felder, wie `fehlertexte`), **bleibt er**
und die Datei wird nur aus der Sperrklinke gestrichen. Vorher lesen, nicht nach dem Namen
urteilen.

**Danach:** Sperrklinke steht auf 0 → die Regel von „Sperrklinke" auf „Verbot" stellen
(Ausnahmen-Datei leeren und löschen).

## 4. Die fünf Fallen (aus 17 Chargen, jede hat eine Sitzung gekostet)

1. **Falsche Spec** → alles grün. Die Zuordnung Quelle → Spec steht in jeder Zeile der
   Fallliste; bei `.ts`+`.tsx`-Paaren gibt es **zwei** Specs (Charge 13).
2. **`0 bestanden, 0 rot`** heißt: die Suite lädt nicht. Fall korrigieren, nicht als
   „erkannt" werten (Charge 14: `fenster.on` im Doppel; Charge 17: ein Ausbau-Schnitt traf
   einen Helfer mit – erst der direkte Spec-Lauf zeigte es).
3. **Zufällig deckende Fixtures** – Lage gleich Modell, beide Marken dieselbe `id`, eine
   Testzeile statt zwei (EZ2, EN4, AL4). **Charge 17:** jeder gültige Profilwert im Test
   war der Profilwert – `'30'`, `'high'`, `'yuv420p'`, `'mp4'` blieben deshalb grün.
4. **Eine Meldung mit der richtigen Zahl** ist kein Beleg für den richtigen Grund (ML7,
   Charge 3, Charge 17: FE6 nur über die Zahl im Text gefangen).
5. **Die Probe trägt die Zusage, nicht der Test.** Nach dem Ausbau erneut messen; sonst
   zählt eine Mutation als „erkannt", die nur der Quelltext-Vergleich gefangen hat.

## 5. Ehrlich offen (unverändert, in Charge 17 gewachsen)

- **Architekturregeln ohne Wächter**: Nach Charge 17 sind zusätzlich „kein Fremdimport in
  `bandspur`", „nur Typ-Importe in den Filter-Adaptern", „keine Fachbegriffe", „kein
  Hardware-Encoder" und „Codec/Container als je eine Konstante" nur noch Kommentar.
  Lint-Kandidaten: dateibezogen „kein `node:fs`", „keine ffmpeg-Flaggen in Adaptern",
  „kein `sort`/`filter` in reinen Modulen".
- **#448**: 192 Typ-Behauptungen in `src` ohne `SAFETY`-Begründung; Regel steht auf `warn`.
- **Treiber**: FA-13 ist gemessen; weitere Einmal-Leser sind **nicht** systematisch geprüft.
  In Charge 17 waren vier Treiber-Läufe rot (CDP-Abriss, s. Pilot Abschnitt 30), ohne dass
  sich `src/` oder `scripts/` geändert hätte; der nächste Lauf war grün. **Kandidat für die
  Treiber-Härtung** (`dumpio`, Frist, ein Wiederholversuch).
- **Einzelquellen-Regeln** (`RENDER_PROFILE`, `SICHERHEITSABSTAND_PX`, Kanal-Registry) sind
  nur durch Werte gedeckt.
