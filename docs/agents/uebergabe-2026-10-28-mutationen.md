# Übergabe 28.10.2026 – Mutations-Chargen 1–11, nächster Schritt Charge 12

**Volltext der Methode und aller Einzelbefunde:**
[`docs/agents/mutation-pilot-2026-10-20.md`](mutation-pilot-2026-10-20.md), Abschnitte 13–23.
Vorherige Sitzung: [`uebergabe-2026-10-28-session-3.md`](uebergabe-2026-10-28-session-3.md).

## 1. Auftrag und Stand

Die dritte Sitzung endete mit „Nächster Schritt: Mutations-Chargen". Diese Sitzung hat
**elf Chargen** gebaut (55 Testdateien). Jede Charge: Mutationen je Quelldatei, Testlauf,
byte-identische Rücknahme, gefundene Lücken mit **Verhaltens-Tests** geschlossen,
Quelltext-/Meta-Proben nur mit Ersatz entfernt, Gate je Charge.

**Gate am Ende:** `npm run pruefung` **Exit 0** – Unit **5.523 (340 Dateien)**,
Integration **49 (12 Dateien)**, Treiber **0 Befunde**. Typecheck/Lint 0.

**Ausgangspunkt:** Suite 5.692 vor Charge 1. **Ende:** 5.523 – netto **−169** Tests,
davon **186 Quelltext-/Meta-Tests entfernt** und **17 Verhaltens-Tests ergänzt**.

## 2. Methode (verbindlich)

1. **Eine** semantische Änderung an der Quelldatei, nichts daneben.
2. Quelldatei vorher sichern, Prüfsumme merken.
3. Genau die zugehörige Spezifikation laufen lassen.
4. Datei aus der Sicherung zurücknehmen, Prüfsumme **byte-identisch** vergleichen.
5. Zusätzlich **harmlose Refactorings** (lokale Umbenennung, Kommentar): müssen grün bleiben.
6. Eine grüne Mutation ist entweder eine **echte Lücke** (Verhaltens-Test ergänzen) oder
   **äquivalent** (begründen, Wache stehen lassen) – **nie** stillschweigend übergehen.
7. Quelltext-Proben nur löschen, wenn ein Verhaltens-Test die Zusage trägt oder es eine
   Architekturregel ist (Lint-Kandidat). **Nie pauschal.**

**Werkzeug (neu):** [`tools/mutationen.py`](../../tools/mutationen.py) – nimmt eine
JSON-Fallliste, führt Schritt 1–4 aus und meldet `ERKANNT`/`GRUEN` samt roten Testnamen.

```bash
python3 tools/mutationen.py faelle.json
```

```json
[{"id": "M1", "file": "src/…", "spec": "tests/unit/….spec.ts",
  "edits": [["alt", "neu"]], "all": false}]
```

### Fallstricke, die diese Sitzung gekostet haben

- **Property-Namen sind Fallen.** `wechselZu` → `zielReiter`, `nutzlast` → `eingang`,
  `gruppe` → `treffergruppe` trafen Interface-Felder, Plural-Objekte (`anzeige.gruppen`)
  oder Importe. Kein harmloses Refactoring – nur **lokale** Namen oder Kommentare umbenennen.
- **`0 bestanden, 0 rot` heißt: die Suite lädt nicht.** Das ist weder „erkannt" noch
  „harmlos"; der Fall muss korrigiert und wiederholt werden.
- **Eine Meldung mit der richtigen Zahl ist kein Beleg für den richtigen Grund.** Der Test
  muss den Grund prüfen (`toContain("Vielfaches von 4")`), nicht nur die Zahl.
- **Grenzen brauchen Grenzfälle.** `>=` gegen `>` ist nur bei **exakt** `soll === grenze`
  sichtbar; `0×0` verdeckt den Nullfall, weil auch der Normalpfad Nullen liefert.
- **Selbstbezügliche Tests.** `expect(x).toBe(KONSTANTE)` bleibt grün, wenn die Konstante
  mutiert wird – die Zahl muss zusätzlich festgenagelt werden.

## 3. Bilanz der elf Chargen

| Charge | Dateien | Mutationen | Lücken | Quelltext-Tests entfernt | ergänzt | Suite danach |
|---|---|---|---|---|---|---|
| 1 | fehlertexte, liste-ansicht-anzeige, uebergabe-anzeige, speichern, element-hinzufuegen | 26 | 4 | 23 | 4 | 5.673 |
| 2 | liste-reorder, reiter, kontrast-warnung, akzentfarbe, zone-text | 26 | 1 | 29 | 1 | 5.645 |
| 3 | filter-split, reparatur-fuehrung, inspektor, bild-laden, zone-deko | 26 | 1 | 25 | 1 | 5.621 |
| 4 | zonen-canvas, zone-bild, video-anzeige, kontrast, export-dialog | 25 | 6 | 22 | 1 (+4 geschärft) | 5.600 |
| 5 | liste, ausgabe-liste, leiste-zeile, buehne-skalierung, nutzung-anzeigen | 25 | 4 | 14 | 3 | 5.589 |
| 6 | vorlage-waehlen, band-takt, undo-vorlage, aktions-auswahl-anzeige, vorlagen-nachtrag | 25 | 0 | 17 | 0 | 5.572 |
| 7 | start, sichten, projektzustand, pruefungen, project-store-nachtrag | 25 | 4 | 14 | 2 | 5.560 |
| 8 | kaputt-erkennung, validierung, torwaechter, eingebaute-vorlagen, beende-auftrag | 24 | 0 (2 äquiv.) | 13 | 1 | 5.548 |
| 9 | quelle, reparatur-fuehrung-shell, undo-aufzeichnung-vorlage, transport, vorlagen-uebersicht | 25 | 2 (1 äquiv.) | 9 (+1 Block) | 2 | 5.541 |
| 10 | liste-ansicht, listen-zeilen, leerzustand, leerzustand-regel, dauer-regler | 23 | 3 | 10 | 1 (+2 geschärft) | 5.532 |
| 11 | vorschau-anzeige, split-stile-rechnung, png-ablage, nutzung-anzeigen-ansicht, inhalte-reiter | 21 | 2 (2 äquiv.) | 10 | 1 (+2 geschärft) | 5.523 |

**Summe:** 55 Dateien, **271 Mutationen**, **27 echte Lücken** geschlossen,
**186 Quelltext-/Meta-Tests entfernt**, **17 Verhaltens-Tests ergänzt**.

### Bewusst stehen geblieben (keine Ballast-Proben)

- `fehlertexte.spec.ts` – „Vollständigkeit gegen den GEBAUTEN Main-Code": liest die drei
  Fehlercode-Unionen und prüft einen **Vertrag über zwei Module**, keine Codeform.
- `undo-vorlage.spec.ts` – der Spion-Test „Projekt-Historie bleibt unberührt (#234)" ist
  Verhalten, keine Quelltext-Probe.
- `project-store-nachtrag.spec.ts` und `vorlagen-nachtrag.spec.ts` – die
  „Kanal-Registry"-Tests importieren `KANAELE` und prüfen **Werte**.

### Als äquivalent belegt (Wachen bleiben stehen)

Z8, I3, K4, B5, Q2 (Charge 3/4/6/8/9), T5 (unerreichbar über die öffentliche Q1-Schnittstelle),
BA2 (Übergangstabelle weist vor dem Schreiben ab), VV3 (`schriftenBereit` nur im Zweig, in
dem er ohnehin `true` ist), IN2 (`ProjektStandReiter` nur für die zwei Leerzustand-Reiter).

## 4. Inventar nach Charge 11

| Maß | Wert |
|---|---|
| Testdateien mit `readFileSync` (`tests/unit`) | **87** (Start 140) |
| Testdateien mit Grep-/Bauvorschriften-`describe` (Namenssuche) | **56** |
| Describe-Blöcke, die **wirklich** eine Quelldatei lesen (verfeinert) | **67** |

Die Namenssuche ist eine **Obergrenze**, kein Befund: Sie trifft auch Verhaltens-Describes mit
„DoD" im Namen. Vor jeder Charge erst die Kandidaten lesen, dann fünf auswählen.

## 5. Nächster Schritt: Charge 12

1. Inventur wie oben (`grep -rl …`), Kandidaten lesen.
2. Fünf Dateien auswählen, Rezept mit `tools/mutationen.py`.
3. Gate je Charge, Doku in `mutation-pilot-2026-10-20.md` (neuer Abschnitt), `CLAUDE.md`,
   Commit. **Push nur auf Anweisung.**

**Naheliegende Kandidaten (nicht geprüft, nur nach Probezahl):**
`ausgabe-platzieren` (7 Proben, teils eingebettet; Quelle
`src/main/render-service/ausgabe-platzieren.ts`), `einblendung-ansicht-anzeige`,
`einblendung-stile-rechnung`, `asset-auswahl-anzeige`, `buehne`, `bibliothek-ansicht`,
`ausgabe-liste-ansicht`; dazu Einzelproben in `speicherstatus-*`,
`sicherheitsabstand-bearbeiten`, `vorschau-auswahl-rechnung`, `video-filmstreifen-blob`,
`split-anzeige`.

## 6. Commits und Push

Elf Chargen-Commits (je mit Doku-Commit):

`3eeb9a4`, `250f28d`, `a8e2e32`, `2e80e4c`, `9a804eb`, `82ce9b9`, `c0531b6`, `8ffa008`,
`1c339a8`, `b3fcb19`, `60a0a1f` – dazu die Doku-Commits bis `7845032` und diese Übergabe.

**Nicht gepusht:** `main` liegt **23 Commits** vor `origin/main`. **Push nur auf Anweisung.**

## 7. Ehrlich offen

- **Architektur-Verbote ohne Wächter:** „kein IPC im Renderer-Modul", „kein zweiter
  Schreibweg", „kein eigener Zustand", „kein Kanal-Literal", „kein Canvas-Export" sind mit den
  Proben entfallen. Die Piloten empfehlen dafür **Lint-Regeln**; gebaut ist keine.
- **Einzelquellen-Regeln** (`RENDER_PROFILE`, `SICHERHEITSABSTAND_PX`, Kanal-Registry) sind
  nur noch durch Verhalten gedeckt – ein Literal mit demselben Wert bliebe unsichtbar.
- **`await`-Freiheit** zwischen Prüfung und Statuswechsel (torwaechter) ist nur noch mittelbar
  über den Reihenfolge-Test gedeckt, nicht mehr statisch.
