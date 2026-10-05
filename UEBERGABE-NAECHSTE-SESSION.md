# ÜBERGABE – nächste Session (Stand: 05.10.2026, Commit `36b1755`)

## ZUERST LESEN
- [`CLAUDE.md`](CLAUDE.md) vollständig (die Übergabe; der Dateiname ist historisch).
- [`AGENTS.md`](AGENTS.md) ist nur ein Zeiger darauf.
- Danach `python3 tools/bereitschaft.py` (Hinweis: auf diesem Mac heißt es `python3`, nicht `python`).

## STAND HEUTE (05.10.2026) – gilt vor allen älteren Angaben in CLAUDE.md

### Gemessen (tools/bereitschaft.py, Commit 36b1755)
| Meilenstein | gebaut | baubereit | UNKLAR |
|---|---|---|---|
| M0 Grundgerüst | 15/15 | 0 | 0 |
| M1 Fundament | 50/50 | 0 | 0 |
| M2 Torwächter | 20/20 | 0 | 0 |
| M3 Medien | 21/21 | 0 | 0 |
| M4 Pixel | **26/26 KOMPLETT** | 0 | 0 |
| M5 Inhalte | **37/37 KOMPLETT** | 0 | 0 |
| M6 Render & Export | **37/37 KOMPLETT** | 0 | 0 |
| M7 Oberfläche | 52/71 | 8 | 1 (#231, s. u.) |
| M8 Marken | 21/60 | 4 | 0 |

- **Suite: 4466/4466 Tests grün**, Typecheck + Lint sauber, Branch `main`, Arbeitsbaum sauber
  (untracked: `.e2e-echt-datenort/`, `.e2e-flow-ist-datenort/`, `marken.json` – Testartefakte, NICHT
  committen; `package-lock.json`-Drift mit `git checkout --` zurücksetzen, Inhalt ist identisch).

### Was in den letzten Sessions gebaut wurde (alle auf main)
- **M4 komplett:** #114 Textzone, #115 Bildzone, #116 Deko-Zone, #117 zeichneSegment (die EINZIGE
  Pixelquelle; UNGERADE Bandhöhe wird bewusst gezeichnet – die Sperre sitzt im Editor/Store),
  #118 alsPng (Binärpuffer, KEIN Base64).
- **M5 komplett:** #134 Render/Export auslösen (Sperre → NamensvP → Items → reiheEin),
  #136 Aktion anlegen/bearbeiten + akzentfarbe.ts in der **#318-Fassung** (freier Hex-Wert,
  `kein_hex`, `leererEntwurf(vorlagenId, akzentfarbe: string|null)`, AKZENT_STANDARD = null),
  #138 Bild zuweisen, #140 Live-Vorschau, #141 Kaputt-Handling.
- **M7 (52/71):** #200 Speicherstatus (Anfangszustand 'unbekannt' zeigt NICHTS), #202 Asset-Auswahl,
  #203 Aktions-Auswahl (Fall 2/3 über EINE Anzeige; sync-Ref-Sperre gegen Doppelklick), #229 Medium
  löschen, #231 Render-Dialog, #250 ActionEditorWurzel, #251 VorlagenEditorWurzel, #252
  ProjektVerwaltungWurzel (+ nachgezogen: beschaedigt.tsx #223, loeschen.tsx #226).
- **Naht-Fixes in inhalte.tsx:** alle vier Reiter sind ECHT gemountet (Zusammenstellen=composer,
  Aktionen=ActionEditorWurzel, Vorlagen=VorlagenEditorWurzel, Projekte=ProjektVerwaltungWurzel);
  Import-Bericht + AssetGalerie im composer gemountet; meldeImportErgebnis verdrahtet.
- **Modul-Platzhalter index.ts gelöscht** bei action-editor, vorlagen-editor, projekt-verwaltung
  (der Modulpfad resolved über index.tsx).

### Baubereit JETZT (empfohlene Reihenfolge)
1. **#232** export-dialog (Zwilling von #231) – M7
2. **#235** undo-projekt (Rückgängig/Wiederherstellen) – M7
3. **#248** composer/liste-ansicht – M7 (ACHTUNG: der composer index.tsx zeigt bereits eine
   Ad-hoc-Liste; prüfen, ob #248 redundant geworden ist – gebauten Code gewinnen lassen und
   ggf. als Befund melden)
4. **#256** app-shell/uebergabe (Übergabe-Overlays) – M7
5. **#335** composer/medien-bibliothek (Drag-and-Drop) – M7
6. **#274** main/index.ts Bootstrap 7/7 – M7 (das große Verdrahtungsstück; vorher die
   Vorgänger-Kette #3 prüfen)
7. Danach die restlichen M7-Issues (#215-STOPP s. u., #217/#218/#219 preview-player, #238
   Speicher-Sender, #260 renderer-bootstrap …).

### BEFUNDE, die noch offen sind (melden, nicht stillschweigend lösen)
1. **#215 = STOPP:** Die Kernregel ist seit TK v3.16 entfallen (Elementart `bild` gestrichen).
   Das Issue verlangt ausdrücklich Klärung „ob dieses Issue noch gebaut wird" – **User-Entscheidung
   nötig**. `medien-url.ts` (der .ts-Teil von #215) ist bereits durch #258 gebaut.
2. **#291/#293/#303/#319 (M8) faktisch blockiert:** `src/shared/contracts/marke.ts` trägt die
   nötigen Erweiterungen (`Marke.id`, `Schrift.herkunft`, `Marke.logo.herkunft`, `parent`,
   `eingebaut`, `herkunftJeFeld`) noch NICHT. M8-01 vermerkt, sie seien „Gegenstand des separaten
   Zitat-Abgleichs zu #52". Erst den Vertrag erweitern (Issue dafür klären/anlegen), dann bauen.
   Der Messwerkzeug-Mangel (messt nur Dateien, nicht Verträge) macht „baubereit" hier falsch
   positiv.
3. **#251 gemeldete Lücken (im Issue VERMERK):** Live-Vorschau des Vorlagen-Editors zeigt nur
   BEISPIEL_AKTION (kein Projektzugang in VorlagenEditorWurzelProps); `p.zeichnen` unbenutzbar.
4. **#250 gemeldete Fragen:** Feld-Absenden beim Verlassen (gebaut); halbfertiger Entwurf wird
   beim Auswahlwechsel verworfen (gebaut) – beides zur Abnahme beim User.
5. **#231 zeigt als UNKLAR ('? #231 None'):** Der Body wurde aus docs/agents/m7/M7-38.md
   wiederhergestellt (er war zerstört); das Messwerkzeug kommt mit dem wiederhergestellten
   Format nicht klar. Die DATEI ist gebaut (Commit ef191f9) – prüfen, ob das Werkzeug-Format
   (Titelzeile der lokalen Datei vs. GitHub-Titel) angepasst werden muss.

### Arbeitsweise (unverändert bindend, aus CLAUDE.md)
- Issue-Text ist Quelle; Signaturblöcke NICHT ändern; Rumpf füllen; Gegenproben mit Beleg
  (Prüfsumme vor/nach); Stash-Gegenprobe bei Testfehlern; „fertige Funktion ohne Aufrufer" per
  grep prüfen; Nachträge an GitHub-Issues ANHÄNGEN, nie ersetzen (Vorfall #184/#186/#188 und
  NOCHMAL #231 am 04.10. – Body zerstört, aus lokaler Quelldatei wiederhergestellt).
- Lokale Issue-Quelldateien: docs/agents/m7/M7-XX.md (map.json), docs/agents/m8/…
- Tests: jsdom via `// @vitest-environment jsdom` + createRoot-Muster (siehe
  tests/unit/leiste-zeile.spec.ts); vi.hoisted für Mock-Doppeln; Mocks NICHT mit
  vi.restoreAllMocks zurücksetzen (Modul-Mocks zerstören), sondern je beforeEach neu belegen.
- Deutsch ist die Projektsprache (Code, Kommentare, Commits).

### NÄCHSTER SCHRITT
`python3 tools/bereitschaft.py` → mit **#232** beginnen (Zwilling von #231: Ausgabedatei wählen,
Export auslösen über loeseExportAus aus #134 – die ist jetzt gebaut).
