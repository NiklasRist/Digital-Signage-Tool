# Übergabe 13.11.2026 — #470 abgeschlossen, TK 9.21 geschrieben, FA-28 gebaut

**Vorgeschichte:** [`uebergabe-2026-11-12-fa27-gebaut.md`](uebergabe-2026-11-12-fa27-gebaut.md)
(59. Sitzung: FA-27 gebaut, Abschnitt 9 trägt den Nachtrag zum Abschluss von #470).

---

## 1. Auftrag und Reihenfolge

Niklas: *„schau dir die übergabe an"*, dann *„470"* → *„471"* → *„das erste"* (Issues schneiden) →
*„ja"* (FA-28 bauen). Gelaufen ist die Kette in der Reihenfolge, in der sie im Projekt steht:
**Buchhaltung zuerst, dann Vertrag, dann Bau.**

---

## 2. #470 abgeschlossen (12.11.2026, 22:54)

- Abschlusskommentar mit der DoD Punkt für Punkt, danach `completed` geschlossen.
- Vorher **selbst nachgemessen**: Gate erneut **EXIT 0**, `4t` wiederholt (Loopback abgewiesen,
  **Assets 4 -> 4**), `npm run dist` Exit 0, Paket läuft nach 8 s, kein `.docx` im Issue-Commit.
- **Gegenprobe Loopback wiederholt:** `127`-Zeile entfernt → 3 von 9 Tests rot, byte-identisch
  zurück (SHA-256 `c2ce4b06…` vorher = nachher).
- **Korrektur:** Der in der Übergabe vom 12.11. genannte Wert `23f56fe7…` ist **nicht
  reproduzierbar** — `netz.ts` ist seit `93db638` unverändert. Steht in CLAUDE.md und im
  Nachtrag von `uebergabe-2026-11-12-fa27-gebaut.md` (Abschnitt 9).

---

## 3. TK v3.65 / 9.21 — Produktbild aufbereiten und freistellen (#471, `f21cf82`)

Sechs Fragen, je **eine** Antwort:

| Frage (AD 4.13) | Antwort |
|---|---|
| Wo liegen die Einstellungen? | `Aktion.bildAufbereitung` + `Aktion.freistellen`, optional → **keine Migration** |
| Materialisieren oder zeichnen? | **einmal je (Asset, Einstellungen)** beim Vorbereiten; ohne Einstellung ist der Schlüssel die Asset-ID → byte-gleich |
| Wie kommt das Modell ins Paket? | **Renderer**, ONNX Runtime Web (WASM), gebündelt, lazy; Zaun ≤ 25 MB / ≤ 2 s / ≤ 5 s; Ausfall = Zustand |
| Grenzen | `AUFBEREITUNG_GRENZEN` als **eine** Quelle, Tabelle mit Begründung je Wert |
| Undo / `unterschiede` | ein Reglerzug = **ein** Schritt, inhaltlicher Vergleich |
| Nicht-destruktiv | **drei** Belege (project.json, Datei-Hash, Byte-Gleichheit ohne Einstellungen) |

**Der Zuschnitt ist bewusst KEIN neues Feld** (9.21.2): `bildAusschnitt` leistet ihn seit 05.11.;
ein zweites Rechteck wären zwei Wahrheiten über dieselbe Absicht.

**Nebenbefund, mitgezogen:** Der **Bezug** im TK stand auf **AD v2.3** (AD ist v2.5) — dieselbe
Fehlerklasse wie am 11.11.; jetzt v2.5. `.docx` neu: **3122 Absätze**, 0 Backticks, 2 Bilder.

**Zitatabgleich:** 8827 Zitate aus 472 Issues, **A=1109, B=354** — unverändert zum 12.11.
**Die eigene Prüfung fand zuerst sieben Befunde in #471/#472** (fünf Paraphrasen, eine
zusammengezogene TK-Liste, zwei UI-Beschriftungen in Anführungszeichen); alle korrigiert, danach
**null** Befunde in den neuen Issues.

---

## 4. Die drei neuen Issues

| Issue | Typ | Inhalt |
|---|---|---|
| **#472** | `[bau]` FA-30 Produktseite finden | Signatur gegen TK 9.20; **zwei Lücken offen benannt**: `shops: string[]` drückt keinen Suchpfad aus (v1-Annahme `https://<host>/search?s={q}`), Notweg-Anbieter unbestimmt |
| **#473** | `[bau]` FA-28 Produktbild aufbereiten | Rechenvorschrift als Vertragsteil, eine Regelquelle, **eine** Nachschlagestelle |
| **#474** | `[bau]` FA-29 freistellen | setzt #473 voraus; `modell://` nach dem Muster von `marken://` (fetch auf `file://` ist blockiert), `onnxruntime-web` exakt gepinnt, Zaun wie 9.21.5 |

**Signatur-Korrektur in #473, offen benannt:** Die erste Fassung schrieb
`wendeAufbereitungAn(daten, aufbereitung)` — ohne Maße ist eine 3×3-Faltung nicht definiert, weil
eine reine Funktion über eine Pixelwand nicht weiß, wo eine Zeile endet. Das Issue trägt jetzt
`(daten, breite, hoehe, aufbereitung)`; die Regel „Signaturen ändert man im Issue" ist eingehalten.

---

## 5. FA-28 gebaut (`084b72b`, #473)

- **`src/shared/aufbereitung.ts`** (neu): `AUFBEREITUNG_GRENZEN`, `AUFBEREITUNG_SCHRITTE`,
  `normalisiereAufbereitung`, `istAufbereitungNeutral`, `motivSchluessel`.
- **`src/renderer/template-canvas/aufbereiten.ts`** (neu): **reine Byte-Rechnung**
  (`wendeAufbereitungAn`) und die Brücke zum Bild (`bereiteAuf`). **Kein `ctx.filter`** — GPU und
  CPU rechnen nicht garantiert gleich, und Vorschau und Render dürfen nicht auseinanderlaufen.
- **`bild-laden.ts`**: `MotivEintrag { bildRef, dateiname, aufbereitung? }`; gerechnet wird einmal je
  (Asset, Einstellungen); Bestand auf **6 Puffer / 256 MB** begrenzt, ältestes zuerst.
- **`zeichne-segment.ts`**: **eine** Nachschlagestelle `holeMotiv(motivSchluessel(...))`.
- **Editor**: Gruppe „Aufbereitung" mit drei Reglern und „Zurücksetzen"; `unterschiede` vergleicht
  inhaltlich (`gleicheGestaltung`).
- **Nicht destruktiv:** kein neues Asset, keine dritte `herkunft`-Variante, keine Migration.

**Fehler im eigenen Code, gefunden beim Durchlesen und behoben:** `legeAufbereitetesAb` trug denselben
Schlüssel bei jeder erneuten Vorbereitung ein zweites Mal ein. Die Obergrenze hätte doppelt gezählt
und beim Aufräumen **genau das gerade gezeigte Bild** verdrängt. Jetzt steht jeder Schlüssel einmal in
der Reihenfolge; **zwei Tests** decken es (acht Vorbereitungen → ein Eintrag; zwei Einstellungen →
zwei Einträge).

---

## 6. Beweise

- **Treiber `4u` (neu):** Vorschau gehasht — `586686025` → Helligkeit 60 → `3312352303` → zurück auf
  0 → **`586686025`**. Der letzte Wert ist zugleich der Beleg für „ohne Einstellungen byte-gleich".
- **Vier Gegenproben**, jede rot und **byte-identisch** zurück (SHA-256 vorher = nachher):
  `normalisiereAufbereitung` ohne Klemmung → 1 Test rot; `bereiteMotiveVor` ignoriert die Aufbereitung
  → 2 Tests rot; `motivSchluessel` ignoriert die Einstellungen → 3 Tests rot; `unterschiede` mit
  `!==` → 1 Test rot.
- **Gate (13.11., zweiter Volllauf nach der Korrektur):** Unit **5833/5833** (382 Dateien),
  Integration **61/61** (17), Typecheck 0, Lint 0, Build 0, Treiber **0 Befunde**, `npm run dist`
  **Exit 0**, Paket startet und läuft nach 8 s.
- **Matrix:** FA-28 von `Luecke` auf `teilweise` (Schritt `4u`); Zählung **12 gemessen, 12 teilweise,
  3 Lücken (FA-26, FA-29, FA-30)**, 3 manuell; 16 Muss, 13 Soll, 1 Kann.

---

## 7. Stand am Sitzungsende

- **15 Commits** vor `origin/main`, Arbeitsbaum sauber, **nicht gepusht**.
- **Offen:** **#473** ist gebaut, aber **nicht kommentiert/geschlossen** (GitHub-Schreiben nur auf
  Anweisung); **#472** (FA-30), **#474** (FA-29, setzt #473 voraus), **#466** (Referenzlauf,
  Phase 1 mit Stoppuhr), **#458** (überholt).
- **Ehrlich offen bei FA-28:** Kontrast und Schärfe sind **nicht einzeln** am Fenster gemessen (gleicher
  Weg, gleiche Nachschlagestelle); der **Renderweg** ist nicht am Fenster gemessen (70 s je Segment) —
  belegt ist er durch die gemeinsame Zeichenroutine und die Byte-Tests. Die **Rechenzeit** je Bild
  steht nicht im Abschluss, weil sie noch nicht gemessen wurde.
- **`bereitschaft.py`** meldet weiter „0 bereit": die neuen Issues haben keinen Meilenstein, M0–M10
  sind gebaut.
