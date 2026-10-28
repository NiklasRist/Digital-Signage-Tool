# Übergabe 28.10.2026 – dritte Sitzung: Q1.1-Rest (74 Blöcke), Q1.2 Batch 1

**Volltext zu den Abschnitten in `CLAUDE.md`.** Vorherige Sitzung:
[`uebergabe-2026-10-28-session-2.md`](uebergabe-2026-10-28-session-2.md).

## 1. Ausgangslage

Push am Sitzungsanfang: `fd563b4..d998802` → `origin/main`, 7 Commits, `main` = `origin/main`;
Remote meldet **72** Dependabot-Findings (34 high/25 moderate/13 low, nicht geprüft,
zurückgestellt). Danach Q1.1 und Q1.2 auf Anweisung.

## 2. Q1.1 – 74 „Fremde Aufrufe"-Blöcke entfernt

**Regel:** Die Blöcke sind Gerüst-Artefakte (`tools/geruest.py`, „vom Generator eingetragen")
und eine zweite Vertragsquelle. Entfernt wurde die **Signatur-Kopie**; eine echte lokale
Begründung blieb als Kurzkommentar, wenn sie nicht schon an anderer Stelle stand (z. B.
`assets.ts` STOPP-Block, `hole-stand.ts` `laufender()`, `migriere-projekt.ts` „KEIN SCHREIBEN",
`media-service` Reihenfolge-Zusagen, `project-store-verdrahtung.ts` Abweichungsvermerk).
Reine Wiederholungen (Adapter-Begründung, Import-Zyklus, `holeAktivesProjekt`-Beschreibung)
wurden auf **eine** Adresse gezogen.

**Belege je Modul:** `git diff` enthält **nur Kommentar- und Leerzeilen** (geprüft mit
`grep`-Filter je Batch); Typecheck **0**, Lint **0**. Inventar danach: **0 Blöcke**.

| Commit | Modul | Dateien | +/− |
|---|---|---|---|
| `7c35553` | auftrags-manager | 13 | +13/−184 |
| `4f46bf8` | project-store | 19 | +9/−325 |
| `f2becc6` | media-service | 9 | +2/−138 |
| `6faf703` | ipc-gateway | 8 | +11/−153 |
| `44d7fff` | marken-/vorlagen-/config-store | 21 | +4/−326 |
| `ec5ac2f` | ffmpeg-adapter, export-/render-service | 4 | +6/−61 |

**Summe Q1.1:** 74 Dateien, **+45/−1.187** (netto −1.142 Zeilen).

## 3. Q1.2 – neu vermessen (nach Q1.1)

| Maß | Wert |
|---|---|
| Kommentarzeilen mit Issue-Referenz in `src/**` | **3.348** (vorher 3.519) |
| Cluster mit Vorkommen in ≥ 5 Dateien | **188** (unverändert) |
| Wiederholte Prosa-Zeilen (≥ 60 Zeichen, ≥ 3 Dateien, ohne Trennlinien) | **70** Gruppen (vorher 70) |

**Befund:** Die **Top-10-Issue-Cluster** (#49 41 Dateien, #47 27, #46 25, #3 24, #23/#32 23,
#76/#243/#25/#34 22) sind nach Q1.1 überwiegend **Einzelnennungen in verschiedenen Kontexten**,
keine Duplikate. Die tatsächlichen Wiederholungen sind **Prosa-Gruppen** – und die größten
davon sind `SAFETY:`-Kommentare an Casts (12/11/8 Dateien), die der Kommentar-Plan
ausdrücklich **nicht** entfernt. `systemCode(ursache)` ist zudem 12× als **Code-Kopie**
vorhanden – das ist ein Q3-Fall, kein Q1.2-Fall.

## 4. Q1.2 Batch 1 (10 Dateien, `8ba9508`)

- **Schreib-Mechanik-Kopf** in fünf Stores (`project-`, `config-`, `marken-`, `vorlagen-store`,
  `auftrags-manager`): 5 Zeilen → 2 Zeilen, Adresse bleibt
  `docs/agents/schreib-mechanik-plan.md`.
- **`PFAD_TRENNER`-Doku** in fünf Dateien (`reconcile*`, `projekt-oeffnen-ablauf`): 4–5 Zeilen
  → **ein Satz** mit Quelle (#49/`pfade.ts` bzw. #34/#67/#91).
- Beleg: `git diff` nur Kommentarzeilen, Typecheck 0, Lint 0.
- Bilanz nach Batch 1: Prosa-Gruppen (≥ 3 Dateien) **70 → 67**; Issue-Kommentarzeilen
  **3.351 → 3.348** (Q1.1-Stand 3.351 vor Batch 1).

### Batch 2 (`adf6b3a`, 15 Dateien, +23/−81)

- **Rückgabetyp am `mitD1Lock`-Rückruf:** Die Erklärung steht jetzt **einmal** in
  `src/shared/contracts/ergebnis.ts` (`Ergebnis`-Doc, #12/#22). Die **zehn** Aufrufstellen
  (`assets`, `dupliziere-`, `loesche-projekt`, `oeffne-projekt`, `setze-dauer`, `bearbeite-`,
  `erstelle-aktion`, `erstelle-projekt`, `entferne-element`, `fuege-element-hinzu`) tragen nur
  noch eine Zeile mit Verweis.
- **Wartezeiten:** Die EPERM/EBUSY-Begründung steht **einmal** bei `mitWiederholung`
  (`gemeinsam/schreib-mechanik.ts`, #31). Vier Stores (`project-`, `config-`, `vorlagen-store`,
  `auftrags-manager`) tragen nur noch „Wartezeiten je Speicher, Zahl reist als Parameter".
  **Bewusst unberührt:** `media-service/datei-entfernen.ts` (eigener STOPP-Punkt-Vermerk) und
  `export-service/ersetzen.ts` (war schon eine Zeile).
- Beleg: `git diff` nur Kommentarzeilen, Typecheck 0, Lint 0; beide alten Formulierungen
  **0×** im Baum, „WARUM WIEDERHOLT WIRD" nur noch **1×** (bei `mitWiederholung`).

## 5. Gate (nach Q1.2 Batch 2)

`npm run pruefung` **Exit 0** – Unit **5.692 (340 Dateien)**, Integration **49 (12 Dateien)**,
Treiber **0 Befunde**. (Die Gate-Läufe nach Q1.1 und nach Batch 1 waren ebenfalls Exit 0 mit
denselben Zahlen.)

## 6. Offen / nächste Sitzung

- **Q1.2 für die zwei Adressen abgeschlossen.** Weitere Wiederholungen sind `SAFETY:`-Casts
  (Nicht-Ziel) oder `systemCode` als **Code**-Kopie (Q3-Kandidat, kein Kommentar-Umbau).
- **Nicht anfassen:** `SAFETY:`-Kommentare (Nicht-Ziel des Kommentar-Plans).
- **Weiter offen:** #394 (Platzierung), #446 (Ursache), Mutations-Chargen, #393.
- **GEPUSHT (28.10.2026, auf Anweisung):** `d998802..adf6b3a` → `origin/main` (9 Commits);
  dieser Dokumentations-Nachtrag folgt als eigener Commit.
