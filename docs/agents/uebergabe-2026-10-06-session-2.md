# ÜBERGABE – nächste Session (Stand: 06.10.2026, Commit `1f77a3e` + dieser Doku-Commit)

## ZUERST LESEN
- [`CLAUDE.md`](../../CLAUDE.md) vollständig (die eigentliche Übergabe; der Dateiname ist historisch).
- [`AGENTS.md`](../../AGENTS.md) ist nur ein Zeiger darauf.
- Danach `python3 tools/bereitschaft.py` (Hinweis: auf diesem Mac heißt es `python3`, nicht `python`).

## STAND HEUTE (06.10.2026, Fortsetzung) – gilt vor allen älteren Angaben in CLAUDE.md

### Gemessen (`tools/bereitschaft.py`, Commit `1f77a3e`)
| Meilenstein | gebaut | baubereit | UNKLAR |
|---|---|---|---|
| M0 Grundgerüst | 15/15 | 0 | 0 |
| M1 Fundament | 50/50 | 0 | 0 |
| M2 Torwächter | 20/20 | 0 | 0 |
| M3 Medien | 21/21 | 0 | 0 |
| M4 Pixel | **26/26 KOMPLETT** | 0 | 0 |
| M5 Inhalte | **37/37 KOMPLETT** | 0 | 0 |
| M6 Render & Export | **37/37 KOMPLETT** | 0 | 0 |
| M7 Oberfläche | **70/71** (nur #215, entfallen) | 1 (#215) | 0 |
| M8 Marken | 25/60 | 0 | 0 |

- **Suite: 4988/4988 Tests grün** (260 Dateien), Typecheck (alle vier Konfigurationen) + Lint sauber,
  Branch `main`, Arbeitsbaum sauber.
- Untracked und NICHT committen: `.e2e-echt-datenort/`, `.e2e-flow-ist-datenort/`, `marken.json`
  (Test-/Laufzeitartefakte).
- **M7 ist inhaltlich VOLLSTÄNDIG.** Das Werkzeug zeigt `#215` weiter als „bereit", weil es
  geschlossene Issues nicht liest (`gh issue list --state all`); `#215` ist entfallen.

### Was in dieser Session (06.10. Fortsetzung) gebaut wurde (alle auf main)
- **#262 GESCHLOSSEN UND gemergt.** Code `feb5c8c` (aus der Vorsession), jsdom-DoD-Tests
  `tests/unit/app-einhaengung.spec.ts` (27 Prüfungen, `ab523c6`), Faser-Berichtigung `58f5bd4`
  ("Konfiguration unlesbar" statt "Configure unlesbar"; Parameter `meldungText` statt `hmldung`).
  - Der Knopf "Erneut versuchen" baut den ERSTEN Lauf ab und startet ERST DANN neu - im Test durch
    ein Tagebuch gemessen (`['laeuftAn', 'baueAb', 'laeuftAn']`).
  - Die DoD sprach von "SIEBEN" Eigenschaften des `UebergabeOverlay`, die Schnittstelle hat ACHT;
    im Issue-Nachtrag gemeldet, der Test belegt alle acht.
- **Rückbau der Übergangs-Naht `inhalte-vorlauf.tsx` (`62a5cfb`):** Datei gelöscht, Re-Export aus
  `inhalte.tsx` entfernt; App.tsx hängt jetzt an der echten Kette `starteRenderer` (#260) + #244.
- **`alt/sicherung-arbeitsstand` VERARBEITET und gelöscht (Tip `1a3bc5a`):** vor dem Löschen per
  `git diff` gegen `main` belegt, dass sich `src/renderer/preview-player/split-stile.ts` NUR in
  Kommentarzeilen unterscheidet (Laufzeitcode identisch) - die Übernahme ist vollständig, `main`
  ist die Obermenge.
- **Aufgeräumt:** Branches `bau/m7-262` und `abbau/naht-inhalte-vorlauf` (beide voll gemergt) gelöscht.
- **`CLAUDE.md`** auf den Stand gebracht (`1f77a3e`), inkl. neuer Regel gegen die
  Selbstverstärkungs-Gefahr (s. u.).

### Baubereit JETZT (empfohlene Reihenfolge)
1. **M8-Kette (größter Posten, 35 offen):** `bereitschaft.py` meldet 0 baubereit wegen des
   Zirkels **#277** (`schreibe-marken`, braucht `eingebauteMarke`) / **#280** (`anfangsbestand`,
   braucht den Typ `MarkenEintrag`). **VON HAND lösen:** vermutlich zuerst **#280** bauen (oder den
   Typ `MarkenEintrag` in #276 ziehen), dann importiert #277 ihn. Vor dem Bauen die Vertragslage in
   `src/shared/contracts/marke.ts` prüfen (s. Befund 2 der Vorsession).
2. Danach die übrigen M8-Issues in Abhängigkeitsreihenfolge (Marken-Editor, Vorlagen gegen Marken,
   `marken://`-Als-Bytes/#315 usw. - s. CLAUDE.md, M8-Abschnitte).

### Offene Punkte / Befunde (melden, nicht stillschweigend lösen)
1. **Offene Meldungen aus #319:** a) Muss `setzeMarke` `stelleMarkeBereit` (#312) rufen?
   b) Zählt eine unbekannte `aktion.markeId` als kaputte Stelle (#131)?
2. **Werkzeug-Limit:** `bereitschaft.py` zählt geschlossene Issues mit (`#215` bleibt sichtbar).
   Ursache: `gh issue list --state all`. Kein Codefehler.
3. **Beim User (unverändert):** TV-Test (FAT32/exFAT-Befund in #184/#186/#188), macOS-Artefakt (#7).
4. **Optional aufräumen:** ältere, längst gemergte Branches liegen noch herum
   (`bau/m0-01-grundgeruest`, `bau/m4-19-zone-text`, `bau/m4-20-zone-bild`, `bau/m4-23-zeichne-segment`,
   `bau/m7-218`, `bau/m7-219`, `bau/m7-244`, `bau/m8-01-vertraege` … `bau/m8-06-…`). Prüfen und löschen.

### Arbeitsweise (unverändert bindend, aus CLAUDE.md)
- Issue-Text ist Quelle; Signaturblöcke NICHT ändern; Rumpf füllen; Gegenproben mit Beleg
  (Prüfsumme/diff vor/nach). „Fertige Funktion ohne Aufrufer" per `grep` prüfen.
- Nachträge an GitHub-Issues ANHÄNGEN, nie ersetzen (Vorfälle #184/#186/#188 und #231).
- Branch ZUERST anlegen (`git checkout -b bau/m<n>-<nr>`), dann ändern/committen (heute erneut
  verletzt: Naht-Branch ohne Commit - s. CLAUDE.md).
- Tests: jsdom via `// @vitest-environment jsdom` + `createRoot`-Muster + `vi.hoisted` für Doppel
  (Vorbild: `tests/unit/rahmen.spec.ts`, `tests/unit/app-einhaengung.spec.ts`). Mocks NICHT mit
  `vi.restoreAllMocks` zurücksetzen; je `beforeEach` neu belegen.
- Deutsch ist die Projektsprache (Code, Kommentare, Commits, Issue-Texte).
- **Selbstverstärkungs-Gefahr (neu, 06.10.):** Gerät die eigene Ausgabe ins Ausschweifende/
  Unleserliche, SOFORT stoppen, nichts Destruktives (`rm`, `reset`) und den echten Zustand mit
  klaren Einzelbefehlen prüfen (`git status`, `git log -3`, `ls`).

### NÄCHSTER SCHRITT
`python3 tools/bereitschaft.py` -> **M8-Zirkel #280/#277 von Hand lösen** (vermutlich #280 zuerst),
danach die M8-Kette bauen.
