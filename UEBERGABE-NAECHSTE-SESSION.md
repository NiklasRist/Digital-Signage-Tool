# ÜBERGABE – nächste Session (Stand: 22.10.2026, spät, Commit `d1566ba`)

## ZUERST LESEN

1. [`CLAUDE.md`](CLAUDE.md) vollständig (der Abschnitt **STAND HEUTE** ganz oben gilt; der
   Dateiname ist historisch).
2. [`docs/agents/uebergabe-2026-10-22-session-2.md`](docs/agents/uebergabe-2026-10-22-session-2.md)
   – der volle Stand dieser Sitzung (Punkt 2 und 3).
3. `python3 tools/bereitschaft.py` (Fakten, keine Behauptungen; der Lauf braucht ~2–4 min).
4. [`docs/agents/treiber-matrix.md`](docs/agents/treiber-matrix.md) – was am echten Fenster
   gemessen ist und was nicht.

`AGENTS.md` ist nur ein Zeiger auf `CLAUDE.md`.

## STAND HEUTE (gemessen)

- **Zwei Commits, `main` 139 Commits vor `origin/main`, NICHT gepusht.**
  - `6746844` Live-Vorschau des Marken-Editors montiert (#303/#330) + B14–B16.
  - `d1566ba` Muss-Lücken FA-01/03/22/08/13 am Fenster gemessen + B17/B18.
- **Gate: `npm run pruefung` Exit 0** – **5.623 Unit-Tests (334 Dateien)**,
  **49 Integrationstests (12 Dateien)**, Treiber ohne Befund. Lint/Typecheck 0.
  (Ein erster Volllauf fiel am bekannten Flaky `einzel-instanz.spec.ts`; einzeln und im
  zweiten Volllauf grün.)
- **Treiber-Matrix: 10 gemessen, 11 teilweise, 0 Lücke, 3 manuell.**
  **Muss: 8 von 15 gemessen** (FA-01, FA-03, FA-05, FA-08, FA-17, FA-22, FA-23, FA-24).
- **`tools/bereitschaft.py`:** M0–M6 komplett, **M7 68/71** (3 „bereit": #215, #240, #255),
  **M8 60/60**. Die 3 M7-Treffer sind vor dem Anfassen gegen den gebauten Code zu prüfen –
  das Werkzeug sieht keine Vertragsdateien.
- **Backlog: 322 offene Issues** (davon weiterhin ~295 aus der alten M-Ära ≤ #380 und
  ~103 mit `braucht-entscheidung`).

## Was diese Sitzung gebaut und gemessen hat

### Punkt 2 – Live-Vorschau des Marken-Editors (A1, 22.10.2026)
- Drittes Prop `vorlagen: VorlagenZugang`; Baustein `marken-editor/vorschau-flaeche.tsx`.
- Fester Zeichenweg `zeichneMarkenVorschau` (#303) mit der Vorlage **„Vollbild"**.
- Vorbereitung: `stelleSchriftenBereit()` → `stelleMarkenSchriftenBereit(marke)` →
  `bereiteLogoVor(marke)`. Kein `stelleMarkeBereit`, kein `ZeichenZugang`, kein Projekt.
- Treiber 4m misst `Live-Vorschau GEMESSEN: Canvas 1920x1080`.

### Punkt 3 – Muss-Lücken (alle am echten Fenster)
| FA | Schritt | Beleg |
|---|---|---|
| FA-01 | 4b7 | Rückfrage vor dem Ersetzen, Abbrechen ohne Wirkung, Ersetzen → genau ein Video |
| FA-03 | 4g3 | Aktion bearbeiten → Titel im `project.json`, Aktionszahl unverändert |
| FA-22 | 4c2 | Vorbelegung, Ersetzen (mtime neu, eine Datei), zweite Ausgabe |
| FA-08 | 4f5 | `ffprobe 12,022 s` gegen Anzeige `12 s`, eine Datei, kein `.part` |
| FA-13 | 4n | Anlegen, Zone in Arbeitskopie, übernehmen, verwerfen, Cleanup |

### Fünf echte Befunde, alle behoben
1. **B14:** CSP erlaubte `marken:` nicht in `font-src`/`connect-src`.
2. **B15:** `MARKEN_SCHEMA` fehlte `corsEnabled` (Probe aus #290 damit entschieden).
3. **B16:** vererbte importierte Schrift/Logo baute die URL mit der Kind-Kennung → 404.
4. **B17:** „+ Textzone (titel)" bestellte eine ungültige Zonen-Sorte und tat nichts.
5. **B18:** Video-Ersetzen filterte nur die Sicht; im `project.json` standen danach zwei Videos.

## Offene Entscheidungen (beim Auftraggeber)

1. **FA-13/„Einblendung":** Soll sie über die Oberfläche anlegbar sein – und mit welcher
   Höhe/Deckkraft? `ANLEGBARE_ARTEN` bietet nur `vollflaeche`/`split`; der Store kennt
   `einblendung`. Deshalb bleibt FA-13 in der Matrix **teilweise**.
2. **#442-Diagnose:** Die Deutung ist entschieden (Aktion an einer Zeitstelle = Unterbrechung,
   TK 9.2.9); offen ist, warum der Weg beim Nutzer nicht greift. Das Label
   `braucht-entscheidung` an #442 ist veraltet (Backlog-Hygiene).
3. **Backlog-Abgleich (Charge 1):** 322 offene Issues; alte/gebaute schließen, BK-01…06
   (#354–#359, verworfene Zwei-Screens-Ära) als `not planned`, Banner-Familie behalten.
   Dazu `.gitignore` für Laufzeitartefakte (`marken.json`, `marken-assets/`, `.e2e-*-datenort/`).
4. **Mutations-Chargen** 138/92 Dateien offen; Q1.2 (wiederholte Begründungen) offen.

## Nächster Schritt

**Backlog-Abgleich (Charge 1)**, danach die in `CLAUDE.md` vereinbarte Reihenfolge:
Oberfläche 2.0 / Banner (zuerst AD/TK-Nachtrag), dann Aktions-Editor inline, #443
(Hover-Overlay), Videobearbeitung. **Kein Umbau ohne Plan.**

## Arbeitsweise (unverändert bindend)

- Die Wahrheit steht in den Dokumenten, nicht im Code: AD → TK → Issue (Signaturblock
  **nicht** ändern) → Code. Widerspricht ein Issue dem gebauten Code, **gewinnt der Code** –
  und der Widerspruch wird gemeldet, nicht still aufgelöst.
- Jede Behauptung belegen; jede Gegenprobe nachweislich zurücknehmen (Prüfsumme/`diff`).
  „Eine Probe ohne Beleg ist keine Probe."
- Für jedes Artefakt fragen: **wer erzeugt es?** „Fertige Funktion ohne Aufrufer" ist die
  häufigste Lücke dieses Projekts.
- Deutsch ist die Projektsprache – Code-Bezeichner, Kommentare, Commits, Issues.
- **Push nur auf Anweisung.**
