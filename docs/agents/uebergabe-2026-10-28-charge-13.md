# Übergabe 28.10.2026 – Mutations-Charge 13, nächster Schritt Charge 14

**Volltext der Methode und aller Einzelbefunde:**
[`docs/agents/mutation-pilot-2026-10-20.md`](mutation-pilot-2026-10-20.md), Abschnitt 26.
Vorherige Sitzung: [`uebergabe-2026-10-28-lint-gate.md`](uebergabe-2026-10-28-lint-gate.md).

## 1. Auftrag und Stand

Fünf Dateien von der Sperrklinken-Liste (#447): `bibliothek-ansicht-ansicht`,
`asset-auswahl-anzeige`, `einblendung-ansicht-anzeige` (`.ts` + `.tsx`),
`sicherheitsabstand-bearbeiten`, `speicherstatus-lage`.

**Gate am Ende:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.516
(340 Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**.

**Ausgangspunkt:** Suite 5.517, Sperrklinke 70 Dateien. **Ende:** 5.516, **65** Dateien.

## 2. Messung

**26 Verhaltens-Mutationen**, **5 harmlose Refactorings**; **15 erkannt**, **9 grün**;
**0/5 Refactorings rot**; jede Mutation byte-identisch zurückgenommen
(`tools/mutationen.py`, Falllisten unter `$TMPDIR/charge13/`).

## 3. Die sieben geschlossenen Lücken

| Kennung | Befund | Neuer Test |
|---|---|---|
| **BI2** | Hinweis „N Medien fehlen" war nur im Fall > 0 geprüft; `>= 0` zeigt ihn immer | kein Hinweis, wenn nichts fehlt |
| **BI3** | Auswahl-Markierung (#418) war ungeprüft | zwei Videos, `data-ausgewaehlt` + Klick ⇒ `aufWaehlen(id)` |
| **BI4** | „· defekt" war ungeprüft | Text **und** Hinzufügen bleibt offen |
| **AS4** | nach einem Wurf blieb die Auswahl **dauerhaft gesperrt** | zweiter Klick nach Wurf ruft erneut und schließt ab |
| **EX1** | erste Zeile „nach oben" war klickbar | erste/letzte Zeile je ein gesperrter Pfeil |
| **EI6** | `'   '` als `bandVorlageId` galt als gültig | Leerzeichen ⇒ false |
| **SL3** | feste Reihenfolge `['projekt','vorlagen']` ungeprüft | beide Quellen ⇒ genau diese Reihenfolge |

## 4. Als äquivalent belegt

- **EI1** – `element.art !== 'video'` gegen `=== 'segment'`: der gebaute Vertrag kennt nur
  diese zwei Arten; die `!==`-Form ist die defensive Fassung für eine Bestandszeile `bild`.
- **AS3** – der `laeuft`-Ref neben `disabled`: in jsdom blockiert schon der gesperrte Knopf;
  der Ref schließt das Fenster zwischen Render und Klick im echten Fenster.

## 5. Harness-Korrektur (transparent)

Die sieben Mutationen an `einblendung-ansicht.ts` liefen zuerst gegen
`einblendung-ansicht-anzeige.spec.ts` – **alle sieben grün**. Die zugehörige Spezifikation ist
`einblendung-ansicht.spec.ts` (die tsx-Spec importiert nur die Ansicht). Nach der Korrektur:
**5 erkannt**, 2 grün. Kein Code-Befund, ein Messfehler.

## 6. Entfernt und die Sperrklinke

**7** Quelltext-/Meta-Tests entfernt, **6** Verhaltens-Tests ergänzt (netto −1):

- `bibliothek-ansicht-ansicht` 1, `asset-auswahl-anzeige` 2, `einblendung-ansicht-anzeige` 2,
  `sicherheitsabstand-bearbeiten` 1, `speicherstatus-lage` 1.

**Sperrklinke:** 70 → **65** Dateien. Der Lint-Lauf ist grün – die fünf Streichungen sind damit
belegt, nicht behauptet.

## 7. Nächster Schritt: Charge 14

1. Fünf Dateien von den verbleibenden **65** wählen (Kandidaten mit mehreren Proben:
   `einblendung-anzeige`, `marken-speicherstatus` (4 Proben), `speicherstatus-verdrahtung`,
   `split-anzeige`, `video-ausschnitt`).
2. Rezept mit `tools/mutationen.py`; **je Datei die richtige Spec** (Lehre aus dieser Charge).
3. Fünf Einträge aus `tools/eslint/quelltext-proben-ausnahmen.json` streichen, Lint belegen.
4. Gate, Doku, Commit. **Push nur auf Anweisung.**

## 8. Ehrlich offen

- **Architektur-Verbote** (kein IPC, kein zweiter Schreibweg, kein eigener Zustand) haben
  weiterhin keinen Wächter außer den drei Lint-Regeln aus #447; `rufeAuf`/`KANAELE` in „reinen
  Modulen" ist **nicht** ausdrückbar (46 bzw. 54 legitime Aufrufer) und bleibt bei den
  Verhaltens-Tests.
- **#448**: 192 Typ-Behauptungen in `src` ohne `SAFETY`-Kommentar; die Regel steht auf `warn`.
- **Einzelquellen-Regeln** sind nur durch Werte gedeckt (belegt in Charge 12 durch ES4).
