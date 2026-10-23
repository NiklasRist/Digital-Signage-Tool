# ÜBERGABE – nächste Session (Stand: 23.10.2026, nach #310)

## ZUERST LESEN

1. [`CLAUDE.md`](CLAUDE.md) vollständig – der Abschnitt **STAND HEUTE (23.10.2026)** gilt.
2. [`docs/agents/uebergabe-2026-10-23-session.md`](docs/agents/uebergabe-2026-10-23-session.md)
   – FA-13-Nachtrag, Backlog-Abgleich, #310 und der Messweg-Befund dieser Sitzung.
3. `python3 tools/bereitschaft.py` (Fakten, keine Behauptungen; ~2–4 min).
4. [`docs/agents/treiber-matrix.md`](docs/agents/treiber-matrix.md) – was am echten Fenster
   gemessen ist und was nicht.

`AGENTS.md` ist nur ein Zeiger auf `CLAUDE.md`.

## STAND HEUTE (gemessen)

- **Gate: `npm run pruefung` Exit 0** – **5.627 Unit-Tests (334 Dateien)**,
  **49 Integrationstests (12 Dateien)**, Treiber ohne Befund; Lint/Typecheck 0.
- **Nicht gepusht.** Abstand zu `origin/main`: `git rev-list --count origin/main..main`.
- **FA-13 ist entschieden, der Code fehlt noch:** Einblendung ist über die Oberfläche
  **anlegbar**, **fest 162 px**, Hintergrund als **Scrim-Verlauf** (`scrimStart` → `scrimEnde`).
  **AD v1.9 / TK v3.28**, beide `.docx` neu erzeugt. `ANLEGBARE_ARTEN` hat weiterhin zwei
  Einträge; der Main lehnt `einblendung` mit `unbekannter_fehler` ab. **#100/#155 offen.**
- **Backlog: 322 → 28 offene Issues.** 6 BK-Issues (#354–#359) als `not planned`, 288
  gebaute/überholte mit Beleg-Kommentar als `completed`, 6 nach Prüfung wieder geöffnet
  (#100/#155/#303/#310/#316/#317); **#310 ist inzwischen gebaut und gemergt**.
- **#310 ist gebaut und gemergt** (`e3e8053`): `stelleMarkeBereit(projekt.standardMarkeId)`
  nur bei Bandspur, genau einmal je Aufruf; `marke_nicht_ladbar`; Band-Abschnitte rufen
  `zeichneSegment(..., marke, standardMarke)`. Tests 16/16; Gegenprobe (viertes Argument
  zurück auf `marke`) → 2 Tests rot, Rücknahme per SHA-256 byte-identisch.
- **Messweg-Korrektur (kein App-Fehler):** Der erste Gate-Lauf war rot (16 Befunde im
  Marken-Editor: Farbfelder landen nicht, abgeleitete Marke bleibt `geerbt`). Ursache war
  der **Treiber**: Reacts `onBlur` hängt an `focusout`; ein nacktes `blur()` feuert in einem
  nicht fokussierten Fenster nicht. Fix in `scripts/durchlauf.mjs` (`1075824`); danach
  **13/13 Farbrollen**, Akzent im Store, Eigenwert `eigen`, Gate Exit 0.
- **Treiber-Matrix:** 10 gemessen, 11 teilweise, **0 Lücke**, 3 manuell.
  **Muss: 8 von 15 gemessen** (FA-01, FA-03, FA-05, FA-08, FA-17, FA-22, FA-23, FA-24).
- **`tools/bereitschaft.py`:** M0–M6 komplett, M7 68/71, M8 60/60. Die drei früheren
  M7-Treffer (#215, #240, #255) sind inzwischen geprüft/geschlossen; das Werkzeug sieht
  Vertragsdateien nicht.

## DIE 28 OFFENEN ISSUES

- **M8-Kette (3):** **#316** (`flaecheDunkel` in den RenderRequest, Laufzeit-Lookup in
  `render-reel.ts` raus), **#317** (`config-store.leseMarke` + Kanal löschen), **#339**
  (sechster Prüfpunkt in `validierung.ts`). **In dieser Reihenfolge.**
- **FA-13 (2):** #100 (Main-Zweig `einblendung`/162 mit Scrim), #155 (`ANLEGBARE_ARTEN`
  dritter Eintrag).
- **Review (1):** #303 (Live-Vorschau; die Schließung ist eine eigene Review-Entscheidung).
- **Banner-Familie (12):** #365–#376 – erst nach AD/TK-Nachtrag.
- **Echte Lücken (2):** #338 (Marken-Referenzen in `findeKaputteStellen`; der neue Befund
  fällt im Reparatur-Modus in `default: []`), #364 (media://-Canvas-Tainting).
- **UI 2.0 / Komfort (6):** #383, #388, #391, #392, #393, #394.
- **Beim Auftraggeber (2):** #442 (Diagnose der Zeitstellen-Aktion), #443 (Videosteuerung).

## NÄCHSTER SCHRITT

1. **#316 → #317 → #339** bauen, je mit Tests und Gate:
   - **#316:** `RenderItemVideo.einblendung` bekommt das Pflichtfeld `flaecheDunkel`; der
     Renderer füllt es beim Einreihen aus der Standardmarke; `normalisieren.ts` liest es aus
     dem Element; `render-reel.ts` verliert `leseMarke()` und das Kontextfeld.
   - **#317:** `config-store/lese-marke.ts`, `KANAELE.config.leseMarke` und die
     Handler-Registrierung ersatzlos löschen.
   - **#339:** sechster Prüfpunkt in `pruefeEinblendung` (Hex-Form `#RRGGBB`/`#RRGGBBAA`).
2. **#338** nach der Entscheidung: **bestehende Optionen** (`aktion_ersetzen`/
   `element_entfernen`) anbieten, **kein** neuer Marken-Dialog in diesem Schritt;
   „Marke wählen“ ist ein Folge-Issue.
3. **FA-13 bauen:** #100 (Main-Zweig), dann #155, Tests, Treiber 4n erweitern.
4. **Banner:** AD/TK-Nachtrag, dann #365–#376.
5. **#394** bleibt für UI 2.0 liegen; **#303** ist Review; **#442** Diagnose; **#443** später.

## ARBEITSWEISE (unverändert bindend)

- Die Wahrheit steht in den Dokumenten, nicht im Code: AD → TK → Issue (Signaturblock
  **nicht** ändern) → Code. Widerspricht ein Issue dem gebauten Code, **gewinnt der Code** –
  und der Widerspruch wird gemeldet, nicht still aufgelöst.
- Jede Behauptung belegen; jede Gegenprobe nachweislich zurücknehmen (Prüfsumme/`diff`).
  „Eine Probe ohne Beleg ist keine Probe.“
- Für jedes Artefakt fragen: **wer erzeugt es?** „Fertige Funktion ohne Aufrufer“ ist die
  häufigste Lücke dieses Projekts.
- Deutsch ist die Projektsprache – Code-Bezeichner, Kommentare, Commits, Issues.
- **Push nur auf Anweisung.** Kein Umbau ohne Plan.
