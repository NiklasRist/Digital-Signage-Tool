# Übergabe 28.10.2026 – Mutations-Charge 16, nächster Schritt Charge 17

**Volltext:**
[`docs/agents/mutation-pilot-2026-10-20.md`](mutation-pilot-2026-10-20.md), Abschnitt 29.
Vorherige Sitzung: [`uebergabe-2026-10-28-charge-15.md`](uebergabe-2026-10-28-charge-15.md).

## 1. Auftrag und Stand

Fünf Dateien von der Sperrklinken-Liste (#447): `queue-panel-wurzel` (`leisten-montage.ts`),
`marken-uebersicht`, `marken-zugang`, `element-zeile`, `concat`.

**Gate am Ende:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.479
(340 Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**.

**Ausgangspunkt:** Suite 5.487, Sperrklinke 55. **Ende:** 5.479, **50**.

## 2. Messung

**23 Verhaltens-Mutationen**, **5 harmlose Refactorings**; **21 erkannt**, **2 Lücken**, **1
äquivalent**; **0/5 Refactorings rot**; jede Mutation byte-identisch zurückgenommen.

## 3. Die zwei Lücken

- **EZ2 – die Wache gegen nicht endliche Zieh-Werte war unsichtbar.** Der Test benutzte eine
  Lage, die **dem Modell entsprach**; der Rückfall von `begrenze` lieferte dieselben Werte, und
  `toEqual` blieb grün. Neu: bewegte Lage (ende 7.7 gegen Modell 12.5) und `toBe(lage)`.
- **EZ4 – `!(spanne > 0)` deckte auch NaN, `=== 0` nicht.** Neu: `obergrenze: NaN` ⇒ `anteil`
  liefert 0 statt NaN.

## 4. Als äquivalent belegt

- **QP3** – `schliesseRueckfrage` räumt die Meldung mit ab, aber der Zustand ist unerreichbar:
  `meldeLeistenFehler` setzt `rueckfrage: null`, und `schliesseRueckfrage` wird nur aus den
  Knöpfen der offenen Rückfrage gerufen.

## 5. Entfernt (8 Tests, 0 ergänzt – zwei geschärft)

| Datei | entfernt | Zusage |
|---|---|---|
| `queue-panel-wurzel` | 2 | `leisten-montage.ts` rein; `index.tsx` holt nichts selbst |
| `marken-uebersicht` | 2 | kein verbotenes Muster; kein zweiter Parameter |
| `marken-zugang` | 1 | kein Direktimport, kein Kanal, keine editor-internen Namen |
| `element-zeile` | 2 | Verbotsliste; keine Literale 10/45/30 |
| `concat` | 1 | kein Betriebsflag, kein Container-Literal |

**Sperrklinke:** 55 → **50**, ESLint grün.

**Ehrlich offen:** Diese Architekturregeln (kein `sort`/`filter`/`slice`, keine Direktimporte
zwischen Renderer-Bereichen, kein Timer) sind **ohne Wächter** – Lint-Kandidat. Die
Flaggen-Zusage in `concat` bleibt durch die Integrationstests mit echtem ffmpeg gedeckt.

## 6. Nächster Schritt: Charge 17

1. Fünf der verbleibenden **50**: `medien-bibliothek`, `kaputt-handling`, `bild-zuweisen`,
   `slogan-bearbeiten`, `video-filmstreifen-blob`.
2. Rezept mit `tools/mutationen.py`; **je Datei die richtige Spec**.
3. Fünf Einträge aus der Sperrklinken-Liste streichen, Lint belegen.
4. Gate, Doku, Commit. **Push nur auf Anweisung.**

## 7. Ehrlich offen

- **Architektur-Verbote** ohne Wächter (Lint-Kandidat), inklusive der ffmpeg-Flaggen (Charge 14).
- **#448**: 192 Typ-Behauptungen ohne `SAFETY`-Kommentar; Regel auf `warn`.
- **Einzelquellen-Regeln** nur durch Werte gedeckt.
- **Treiber:** Die FA-13-Sitzung ist seit Charge 15 mit Frist gemessen; weitere Einmal-Leser
  sind **nicht** systematisch geprüft.
