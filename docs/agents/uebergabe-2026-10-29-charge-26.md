# Übergabe 29.10.2026 – Stand nach Charge 25

**Nächste Sitzung: Mutations-Charge 26 – die letzte.**
**Der Plan für die restlichen Chargen: [`charge-17-26-plan.md`](charge-17-26-plan.md).**
Letzte gebaute Charge: [`uebergabe-2026-10-29-charge-25.md`](uebergabe-2026-10-29-charge-25.md).
Einzelbefunde: [`mutation-pilot-2026-10-20.md`](mutation-pilot-2026-10-20.md), Abschnitt 38.

## 1. Stand heute (nichts offen im Bau, Arbeitsbaum sauber nach dem Commit)

| | Wert |
|---|---|
| Gebaute Chargen | **25** – **125 Testdateien** (je fünf), dazu das Lint-Gate #447 |
| Suite | **5.306** Unit-Tests in **340** Dateien, **49** Integrationstests in 12 Dateien |
| Gate | `npm run pruefung` **Exit 0** (Typecheck + Lint + Build + Tests + Integration + Treiber) |
| Treiber | **0 Befunde**; der CDP-Abriss aus Charge 17 trat in 18–25 **nicht** auf |
| Sperrklinke | **5** Dateien in `tools/eslint/quelltext-proben-ausnahmen.json` |
| Lint | 0 Fehler (Warnungen unverändert: 192 × `SAFETY` aus #448) |
| Push | **nicht gepusht** – `main` liegt vor `origin/main`; **Push nur auf Anweisung** |

## 2. Was Charge 25 ergeben hat (kurz)

- **30 Verhaltens-Mutationen, 5 Refactorings**; erste Messung **17 erkannt**, **13 Lücken**
  geschlossen, **0 äquivalent**; **0/5 Refactorings rot**.
- **Die dreizehn Lücken:**
  - `medien-bibliothek`: **MB1** `ohnePfad` zählte nur eins (nur eine pfadlose Fixture);
    **MB5** die Reihenfolge der `auftragIds` war unsichtbar, weil beide Antworten `q-1`
    trugen (Fixture-Falle).
  - `element-zeile`: **EZ5** der Band-Text trug die Testzahl `2` statt der Anzahl.
  - `render-ausloesen`: **RA1** Sperre gegen Namens-VP nie zusammen geprüft; **RA2** die
    Standardmarke wurde für Videos **ohne** Band geholt; **RA6** Bandhöhe als Literal 162;
    **RA7** `projektId` als Literal `'p-1'`.
  - `render-dialog`: **RD4** DEL (U+007F) fehlte in der Steuerzeichen-Tabelle.
  - `optimistisch`: **OP3** keine Inline-Meldung bei Wurf aus `bestaetigen`; **OP4** die
    Hörerliste wurde live statt als Kopie durchlaufen; **OP5** ein werfender Inline-Hörer
    riss den Schritt; **OP6** die Abmelde-Sperre war ungeprüft; **OP7** das Null-Ereignis
    fuhr in `ereignis.typ`.
- **Nachmessung nach dem Ausbau: 30 von 30 rot** – keine Mutation hing an einer Probe.
- **Zusatzbefund, gemeldet:** `berichteDrop` (`medien-bibliothek.ts`) ist exportiert, aber
  **nirgends gerufen** – weder in `src` noch in Tests. Toter Export; nicht entfernt.

## 3. Nächster Schritt: Charge 26 (die letzte)

Fünf Dateien:

| Spec | Quelle |
|---|---|
| `slogan-bearbeiten` | `src/renderer/marken-editor/slogan-bearbeiten.ts` |
| `video-filmstreifen-blob` | `src/renderer/preview-player/video.tsx` |
| `vorschau-auswahl-rechnung` | `src/renderer/preview-player/vorschau-auswahl.ts` |
| `als-png` | `src/renderer/template-canvas/als-png.ts` |
| `marke` | `src/shared/contracts/marke.ts` |

**Sonderfall `marke.spec.ts`:** Die Datei liest den **Vertrag** (`src/shared/contracts/
marke.ts`). Wenn sie ein Vollständigkeits-/Vertragstest ist (wie `fehlertexte` in Charge 6),
**bleibt sie**; die Datei wird dann nur aus der Sperrklinke gestrichen, **ohne** Probe zu
entfernen. Vorher lesen, nicht nach dem Namen urteilen – Charge 18
(`media-protokoll-schema`) und Charge 19 (Registry-Block) haben das bereits praktiziert.

**Erwartung:** `video-filmstreifen-blob` ist eine `.tsx`-Datei ohne jsdom-Nähe? Vor dem
Entfernen prüfen, ob der Test die Zusage (Blob/Bild) wirklich trägt. `als-png` ist der
Canvas-Export – Proben dort oft „kein `toDataURL` im Produktpfad".

**Ablauf (wie in den 25 Chargen davor):**

1. Die fünf Specs und Quellen lesen; Probe-Blöcke und ihre Zusagen notieren. **Prüfen, ob
   der Verhaltens-Test die Funktion überhaupt aufruft, in der die Mutation sitzt.**
2. Je Datei 4–6 semantische Mutationen + 1 harmloses Refactoring als JSON nach
   `$TMPDIR/charge26/faelle.json`; **jeder Suchtext genau einmal**. Bewährt: Fälle aus
   **Zeilenbereichen** bauen und die Eindeutigkeit im Builder prüfen.
3. `python3 tools/mutationen.py $TMPDIR/charge26/faelle.json`.
   **`EDIT-PROBLEM: 0 Treffer` ist ein Messfehler, kein grünes Ergebnis** – Fall korrigieren,
   nicht werten.
4. Grüne Mutation: Lücke (Verhaltens-Test) oder äquivalent (begründen). **Gegenprobe je
   Lücke**; für „äquivalent" eine Gegenprobe mit **falschem** Wert. Eine Fixture-Lücke
   zusätzlich **gegen die Spec aus `git show HEAD:…`** messen — dann ist sie belegt.
5. Probe-Blöcke entfernen, Importe aufräumen (`readFileSync`, `fileURLToPath`, `join`).
6. **Erneut messen** — die zweite Messung nach dem Ausbau gehört seit Charge 17 zum Rezept.
7. Die Einträge aus der Sperrklinke streichen (**5 → 0**), `npx eslint .` muss grün sein.
8. `npm run pruefung`, dann `mutation-pilot` (Abschnitt 39), `CLAUDE.md`, Übergabe, Commit.
   Der Treiber hängt je Lauf einen „Nachlauf" an `docs/agents/oberflaeche-durchlauf.md` —
   normal, wird mitcommittet.

## 4. Der Plan für danach

Sperrklinke steht dann auf **0** → die Regel von „Sperrklinke" auf „Verbot" stellen:
`tools/eslint/quelltext-proben-ausnahmen.json` leeren und löschen, die ESLint-Regel
`lokal/quelltext-proben` auf `error` ohne Ausnahmen stellen. Das ist der Abschluss von #447.

**Weiter offen (nicht Teil der Chargen):**

- **Architekturregeln ohne Wächter** – Lint-Kandidaten: `import/no-restricted-paths` für
  `bootstrap.ts`, „kein `node:fs` in `video-ausschnitt.ts`", „keine ffmpeg-Flaggen in
  Adaptern", „kein `sort`/`filter` in reinen Modulen".
- **#448** – 192 Typ-Behauptungen in `src` ohne `SAFETY`-Kommentar (Regel steht auf `warn`).
- **`berichteDrop`** – toter Export in `medien-bibliothek.ts`; entweder anschließen oder
  entfernen (Produktentscheidung, nicht Teil der Mutationen).
- **Treiber-Einmal-Leser** – FA-13 ist seit Charge 15 mit Frist gemessen; weitere
  Einmal-Leser sind **nicht** systematisch geprüft.
- **Push** – `main` liegt vor `origin/main`; nur auf Anweisung.

## 5. Die zehn Fallen (aus 25 Chargen, jede hat eine Sitzung gekostet)

1. **Falsche Spec** → alles grün. Die Zuordnung Quelle → Spec steht in jeder Zeile der
   Fallliste; bei `.ts`+`.tsx`-Paaren gibt es **zwei** Specs (Charge 13).
2. **`0 bestanden, 0 rot`** heißt: die Suite lädt nicht — **oder** der Harness hat einen
   Aussetzer (Charge 23, K6). Fall **direkt** mit `--reporter=json` fahren, bevor du ihn
   wertest. Verwandt: ein Edit, der eine Methode einführt, die das Test-Doppel nicht hat
   (`fenster.on` statt `once`), lässt den Import scheitern.
3. **Zufällig deckende Fixtures** — jeder gültige Profilwert im Test war der Profilwert
   (Charge 17: `'30'`, `'high'`, `'mp4'`; 18: `"media"`; 21: L4; 23: V4; 24: UP2; **25:
   MB5, EZ5, RA6, RA7**). Vor dem Deuten einer grünen Mutation die Fixture ansehen.
4. **Eine Meldung mit der richtigen Zahl/Text** ist kein Beleg für den richtigen Grund
   (ML7, Charge 3). **Charge 18:** `toContain("Absturz …")` blieb bei `"Error: Absturz …"`
   grün — erst der **exakte** Vergleich biss. **Charge 24:** dieselbe Klasse bei UP11.
5. **Die Probe trägt die Zusage, nicht der Test.** Nach dem Ausbau erneut messen; sonst
   zählt eine Mutation als „erkannt", die nur der Quelltext-Vergleich gefangen hat.
   **Charge 19:** EV6. **Charge 20:** L8. **Charge 23:** `live-vorschau` hatte nicht einmal
   eine — nur toten Code. **Charge 24:** nach dem Ausbau blieben 27/27 rot. **Charge 25:**
   30/30.
6. **Grün kann ein Messfehler sein.** Sitzt die Mutation in einer Funktion, die der Test nie
   aufruft, ist sie grün (Charge 20: P7). **Charge 22:** A4 war zuerst ein
   Anführungszeichen-Tausch — ein harmloses Refactoring als „Angriff".
7. **Ein `all`-Rename trifft jede Zeichenkette** — auch Importpfade und fremde Bezeichner
   (Charge 21: `nutzlast` → `eingang` traf `nutzlast-pruefer`, Suite lud nicht).
8. **Eine Datei kann eine Funktion haben, die gar keinen Test hat.** In Charge 23 war
   `haengeVorschauEin` komplett ungeprüft, obwohl die Datei zwei getestete Funktionen hat.
   **Charge 25:** `berichteDrop` ist sogar ohne Aufrufer. Vor dem Messen die **exportierten
   Namen** gegen die `describe`-Blöcke **und** gegen `src` halten.
9. **`EDIT-PROBLEM: 0 Treffer` ist kein grünes Ergebnis** (Charge 24). Der Suchtext fand die
   Stelle nicht, weil Kommentarzeilen dazwischenlagen. Die Fallliste korrigieren und erneut
   fahren. Für eine Fixture-Lücke die **Spec aus `HEAD`** als Gegenprobe nehmen: grün dort,
   rot mit dem neuen Test.
10. **Zwei Antworten mit derselben Kennung machen Reihenfolge-Tests blind** (Charge 25, MB5).
    Wo die Reihenfolge zugesagt ist, müssen die Testdaten **unterscheidbar** sein.

## 6. Ehrlich offen (in Charge 25 gewachsen)

- **Abwesenheits-Zusagen ohne Wächter**: kein IPC/Timer in `optimistisch`, kein zweiter
  Main-Weg und keine zweite Formatquelle in `medien-bibliothek`, kein `toDataURL`/keine
  Hexzahl in `render-ausloesen`, kein JSX/IPC in `render-dialog`, kein `window.api`/kein
  Band-Bearbeiter in `element-zeile`. Dazu die älteren: kein `react`/JSX in den reinen
  Modulen, kein `rufeAuf`/`KANAELE`/`window.`/Timer in `bootstrap.ts`, keine feingranulare
  Operation in `undo-projekt`, genau ein Kanal in `element-entfernen`. Lint-Kandidat
  `import/no-restricted-paths`.
- **#448**: 192 Typ-Behauptungen in `src` ohne `SAFETY`-Begründung; Regel steht auf `warn`.
- **Treiber**: In Charge 17 waren vier Läufe rot (CDP-Abriss, Pilot Abschnitt 30), ohne
  Codeänderung; Chargen 18–25 liefen ohne Befund. Ursache weiter **unbenannt**.
- **Einzelquellen-Regeln** (`RENDER_PROFILE`, `SICHERHEITSABSTAND_PX`, Kanal-Registry,
  `FORMAT_WHITELIST`) sind nur durch Werte gedeckt — belegt in Charge 18 (DI7), 19 (EV8),
  20 (L8).
