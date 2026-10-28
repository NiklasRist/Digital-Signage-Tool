# Übergabe 28.10.2026 – Mutations-Charge 12, nächster Schritt Charge 13

**Volltext der Methode und aller Einzelbefunde:**
[`docs/agents/mutation-pilot-2026-10-20.md`](mutation-pilot-2026-10-20.md), Abschnitt 24.
Vorherige Sitzung: [`uebergabe-2026-10-28-mutationen.md`](uebergabe-2026-10-28-mutationen.md).

## 1. Auftrag und Stand

Die Vorsitzung endete mit „Nächster Schritt: Charge 12". Diese Sitzung hat die Inventur
wiederholt und **fünf** Testdateien nach dem Rezept bearbeitet:

`bibliothek-ansicht`, `ausgabe-liste-ansicht`, `buehne`, `einblendung-stile-rechnung`,
`ausgabe-platzieren`.

**Gate am Ende:** `npm run pruefung` **Exit 0** – Unit **5.517 (340 Dateien)**,
Integration **49 (12 Dateien)**, Treiber **0 Befunde**. Typecheck/Lint 0 davor.

**Ausgangspunkt:** Suite 5.523. **Ende:** 5.517 – netto **−6** Tests, davon **9**
Quelltext-/Meta-Tests entfernt und **3** Verhaltens-Tests ergänzt.

## 2. Ergebnis der Ausgangsmessung

**30 Verhaltens-Mutationen**, **5 harmlose Refactorings**; **25 erkannt**, **5 grün**;
**0/5 Refactorings rot**; jede Mutation byte-identisch zurückgenommen
(`tools/mutationen.py`, Fallliste und Logs unter `$TMPDIR/charge12/`).

### Die vier geschlossenen Lücken

- **AL4 – Export bei mehreren Zeilen.** Der Export-Knopf gab `p.stand.dateien[0]`
  statt der eigenen Zeile; mit einer einzigen Testdatei unsichtbar. Neu: zwei Zeilen,
  der zweite Knopf muss die zweite Datei liefern.
- **BU4 – `transformOrigin`.** `'center'` statt `'top left'` verschiebt die skalierte
  Fläche sichtbar; jetzt im Raster-Test festgenagelt.
- **BU5 – die Bühnenfläche war nicht schwarz geprüft.** `#FFFFFF` blieb 9/9 grün;
  jetzt `rgb(0, 0, 0)` am äußeren Kasten.
- **AP3 – `EPERM` fehlte in der Wiederholungs-Wache.** `['EBUSY']` statt
  `['EBUSY', 'EPERM']` blieb 32/32 grün; neu: EPERM wiederholt viermal und endet in
  `speicher_fehler`.

### Als äquivalent belegt

**AL3** (`data-testid="ausgaben-fehler"` ohne Verbraucher), **ES4**
(`bandBreite: 1920` = Profilwert), **AP4** (`>=` statt `>` vor dem ersten Versuch),
**AP6** (`rm` ohne `force`, Fehler wird geschluckt).

### Zwei Fälle, die nur die Grep-Probe fing

- **ES1 (`bandHöhe: höhe`)** war nur über „GENAU EINE Subtraktion" rot; der
  Eigenschafts-Test kann ihn nicht sehen, weil `1080 − bandY` bei der echten
  `berechneBandGeometrie` immer `höhe` ist. **Ersatz:** eine Attrappe der geteilten
  Rechnung (`vi.doMock`, `bandY: 900` bei `H = 162`) verlangt `bandHöhe: 180` –
  Gegenprobe danach **erkannt**.
- **ES4** war ebenfalls nur über „kein Zahlenliteral" rot und bleibt nach dem
  Entfernen grün. Das ist die ehrliche Einzelquellen-Lücke, kein Testfehler.

## 3. Entfernt (9 Tests, 3 ergänzt)

| Datei | entfernt | Ersatz |
|---|---|---|
| `bibliothek-ansicht` | 2 (kein JSX/react/IPC; `kaputt` nicht selbst gerechnet) | Verhaltens-Test gegen `istAktionKaputt` trägt die Zusage |
| `ausgabe-liste-ansicht` | 2 (kein `rufeAuf`/`KANAELE`/Ladevorgang; kein `useState`/`useEffect`) | Architekturregel, Lint-Kandidat |
| `buehne` | 2 (keine Verbotsliste; nur ein Zustand) | Raster-/Beobachter-Tests |
| `einblendung-stile-rechnung` | 2 (`Math.`/Literal/genau eine Subtraktion; kein JSX/react) | Attrappen-Test (ES1) + Eigenschafts-Test |
| `ausgabe-platzieren` | 1 + 2 eingebettete `QUELLTEXT`-Zeilen | Zieldatei bleibt nach EXDEV die alte ⇒ kein `copyFile` |

## 4. Inventar nach Charge 12

| Maß | Wert |
|---|---|
| Testdateien mit `readFileSync` (`tests/unit`) | **83** (Start 140, vorher 87) |
| Dateien mit `describe(...DoD/Bauvorschrift/Quelltext/Grep...)` (breite Namenssuche) | **61** (vorher 64; die 56 der Vorsitzung stammen aus einer engeren Definition und sind nicht direkt vergleichbar) |

## 5. Nächster Schritt: Charge 13

1. Inventur wie oben, Kandidaten lesen.
2. Fünf Dateien auswählen, Rezept mit `tools/mutationen.py`.
3. Gate je Charge, Doku in `mutation-pilot-2026-10-20.md` (neuer Abschnitt),
   `CLAUDE.md`, Commit. **Push nur auf Anweisung.**

**Naheliegende Kandidaten (gelesen, aber nicht bearbeitet):**
`bibliothek-ansicht-ansicht` (291 Zeilen, 1 Grep-Block, 9 Verhaltens-Tests),
`asset-auswahl-anzeige` (279 Zeilen, 2 Grep-Tests, 8 Verhaltens-Tests),
`einblendung-ansicht-anzeige` (540 Zeilen, 2 große Grep-Blöcke, 13 Verhaltens-Tests).
Dazu die Einzelproben aus der Vorsitzung: `speicherstatus-*`,
`sicherheitsabstand-bearbeiten`, `vorschau-auswahl-rechnung`, `video-filmstreifen-blob`,
`split-anzeige`.

## 6. Commits und Push

Charge-12-Commit (Code + Tests) und Doku-Commit; die genauen Kennungen stehen in
`CLAUDE.md`.

**Nicht gepusht:** `main` liegt **25 Commits** vor `origin/main`. **Push nur auf
Anweisung.**

## 7. Ehrlich offen

- **Architektur-Verbote ohne Wächter:** „kein IPC im Renderer-Modul", „kein zweiter
  Schreibweg", „kein eigener Zustand", „kein Kanal-Literal", „kein JSX in reinen
  Modulen" sind mit den Proben entfallen. Die Piloten empfehlen dafür **Lint-Regeln**;
  gebaut ist keine.
- **Einzelquellen-Regeln** (`RENDER_PROFILE`, `SICHERHEITSABSTAND_PX`, Kanal-Registry,
  `bandBreite`) sind nur noch durch Werte gedeckt – ein Literal mit demselben Wert
  bleibt unsichtbar (belegt durch ES4).
- **`await`-Freiheit** zwischen Prüfung und Statuswechsel (`torwaechter`) ist weiter
  nur mittelbar über den Reihenfolge-Test gedeckt.
