# Übergabe 28.10.2026 – Mutations-Charge 14, nächster Schritt Charge 15

**Volltext:**
[`docs/agents/mutation-pilot-2026-10-20.md`](mutation-pilot-2026-10-20.md), Abschnitt 27.
Vorherige Sitzung: [`uebergabe-2026-10-28-charge-13.md`](uebergabe-2026-10-28-charge-13.md).

## 1. Auftrag und Stand

Fünf Dateien von der Sperrklinken-Liste (#447): `einblendung-anzeige`,
`marken-speicherstatus` (Lage + Baustein), `speicherstatus-verdrahtung`, `split-anzeige`,
`video-ausschnitt`.

**Gate am Ende:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.490
(340 Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**.

**Ausgangspunkt:** Suite 5.516, Sperrklinke 65. **Ende:** 5.490, **60**.

## 2. Messung

**26 Verhaltens-Mutationen**, **5 harmlose Refactorings**; **23 erkannt**, **2 Lücken**, **1
Harness-Fall**; **0/5 Refactorings rot**; jede Mutation byte-identisch zurückgenommen
(`tools/mutationen.py`, Falllisten unter `$TMPDIR/charge14/`).

## 3. Die zwei Lücken

- **EN3 – `abschnittMarke === null` war ungeprüft.** `{bandAktion !== null ? …}` baute ein
  Segment mit `marke={null}`; kein Test sah es. Neu: Element mit `bandAktion`, aber ohne
  Abschnittsmarke ⇒ kein Segment.
- **EN4 – welche Marke das Segment bekommt, war unsichtbar.** `eigenschaften()` gab
  `rahmenMarke` und `abschnittMarke` **dieselbe** `id` ('m1'). `marke={props.rahmenMarke}`
  blieb deshalb grün. Neu: zwei unterscheidbare Marken, geprüft wird `'m-abschnitt'`.

## 4. Harness-Korrektur (transparent)

**SV4** (`fenster.once('closed')` → `fenster.on('close')`) meldete „0 bestanden, 0 rot": Das
Fenster-Doppel kennt nur `once`, `fenster.on` ist `undefined`, die **Suite lädt nicht**. Das ist
keine Erkennung. Ersetzt durch `once('close')` – der Doppel merkt sich den Ereignisnamen, der
Abbau-Test wird rot. **Lehre:** „0 bestanden, 0 rot" ist immer ein Fall für die Korrektur.
**VA-R** traf den Kommentartext nicht (0 Treffer) und lief mit der richtigen Zeile grün.

## 5. Entfernt (28 Testfälle, 2 ergänzt – netto −26)

| Datei | entfernt | wofür |
|---|---|---|
| `einblendung-anzeige` | 1 | Verbotsliste über beide Dateien |
| `marken-speicherstatus` | 1 | react/KANAELE/Timer; der Wortlaut-Test **bleibt** |
| `speicherstatus-verdrahtung` | 1 | Codeinspektion; Diff-Probe → **Wertprobe** (drei Kanäle paarweise verschieden) |
| `split-anzeige` | 2 | Verbotsliste; „Naht"-Probe (verglich zwei Konstanten mit sich selbst) |
| `video-ausschnitt` | 24 | 18 Flaggen (`it.each`), `copy`/`+faststart`/`setsar`, `toLocaleString`/`Intl`, `node:fs`/`child_process`, Gegenprobe, `-y` aus #158 |

**Geblieben:** `-shortest`-Naht aus #162 (Verhalten am echten Fragment), Wortlaut-Konstante,
Kanal-Werte.

**Ehrlich offen:** Die 18 Flaggen-Verbote und „kein `node:fs`" in `video-ausschnitt` sind jetzt
**ungeschützt**. Kandidat für eine **dateibezogene Lint-Regel** – dasselbe Muster wie #447, nur
pro Datei statt pro Ordner. Nicht stillschweigend: der Dateikopf nennt weiterhin, wer zuständig
ist, und die Integrationstests fahren echtes ffmpeg.

## 6. Nächster Schritt: Charge 15

1. Fünf der verbleibenden **60** Dateien wählen: `marken-vorschau`, `medium-loeschen-anzeige`,
   `segment-anzeige`, `render-dialog-anzeige`, `queue-panel-wurzel`, `speicherstatus-anzeige`.
2. Rezept mit `tools/mutationen.py`; **je Datei die richtige Spec**.
3. Fünf Einträge aus der Sperrklinken-Liste streichen, Lint belegen.
4. Gate, Doku, Commit. **Push nur auf Anweisung.**

## 7. Ehrlich offen

- **Architektur-Verbote** ohne Wächter (Lint-Kandidat), jetzt inklusive der ffmpeg-Flaggen.
- **#448**: 192 Typ-Behauptungen ohne `SAFETY`-Kommentar; Regel auf `warn`.
- **Einzelquellen-Regeln** nur durch Werte gedeckt.
