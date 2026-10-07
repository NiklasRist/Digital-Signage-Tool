# Übergabe – Session 07.10.2026 (nachm., die Bau-Serie „alle 10 M8-Issues")

> **Für die nächste Sitzung.** Lies zuerst `CLAUDE.md`, dann `uebergabe-2026-10-07-session.md` (vorm.), dann diese Datei. Vorphrase: Behaupte nichts, was du nicht geprüft hast.

## Wo das Projekt steht (auf `main` gemessen, 07.10., ab.)

- **Vollsuite 294 Dateien / 5362 Tests grün, Typecheck 0, Lint 0.** `python3 tools/bereitschaft.py`: **M8 59/60, 1 baubereit (#327)**; M0–M6 vollständig; M7 70/71 (#215-Phantom wie gehabt).
- Zu `main` gemergt in dieser Serie (je Issue ein Branch, je ein Merge, alle Issues geschlossen):
  - **#297 + #298** (marken-editor Schriften/Logo) – Commits `db3213d`, `024b712` – Tests `tests/unit/schrift-logo-bearbeiten.spec.ts` (18 Tests).
  - **Reparatur-Commit `dcefc40`** VOR #297: In `src/renderer/gemeinsam/marken-bereitstellung.ts` (#312, bereits auf main) war ein ungenutzter `catch (ursache)`-Parameter (Lint-Fehler, bestand GEGEN die Übergabe-Aussage „Lint 0 auf main") und eine infizierte Kommentar-Faser („fehlenden Geschlecht serotonin Schrift-Datei"). Beides in zwei Zeilen mit `git diff` belegt korrigiert; Nachtrag an #312.
  - **#299** (`herkunft-anzeigen.ts`, der EINE Ort des Sentinel-Pfad `{{ geerbt: true }}`) – `cef182e`, Merge `0288165`; 13 Tests; die drei Texte von `baueHerkunftText` String-gleich geprüft.
  - **#300** (`marke-ableiten.ts`, Basen-Filter = parent === null; anlegen+öffnen in einem Zug) – `1057e2a`; 7 Tests.
  - **#302** (`loeschen-vorwarnung.ts`, eingefügt mit eingebaut ohne Prüfung, drei Listen, Standardmarken-Ausweg als abgeleitete Funktion) – `e8051ae`, Merge `f39dbbf`; 11 Tests.
  - **#326** (`datei-import.ts`, Dialog-Kapsel; Abbruch ist `ok: true, wert: null` – kein Fehlercode) – Merge `3b5d7ed`; 11 Tests.
  - **#323** (`setze-standard-marke.ts` + `project-store-nachtrag-3.ts` + Kanal `project:setzeStandardMarke` + dreizehnte Verdrahtung) – DSL `1af56c1`-Nachbar, Merge `adea10b`; 16+6 Tests; Vertrags-Tests (`bootstrap-verdrahtung.spec.ts`, drei Registry-Zahlentests: 20 auf 21 Einträge) nachgezogen.
  - **#324** (`projekt-verwaltung/standardmarke.ts`/`.tsx`: Lage, Auswahl, Wechsel geladen/fremd, gesperrt-nicht-ausgeblendet) – `66a30e4`, Merge `732dd7e`; 12+11 Tests (jsdom).
  - **#330** (`marken-editor/index.tsx`, die Wurzel: drei Spalten, 21 Bausteinrufe, Import über #326, Löschen mit Vorschau) – `36c100c`, Merge `42041e2`; 18 Tests (alle zwölf Bausteine als Doppel).
  - **#336** (`beenden-ablauf.ts` + `beenden-dialog.tsx` + Kanalblock `beenden`: Veto, RENDERER-Dialog mit Empfehlung je Ursache, „Erneut versuchen" nur der Gescheiterten, „verwerfen" endgültig) – `cdfaecb`, Merge `efac728`; 4 + 20 Nachzug-Tests; die drei Beenden-Tests von #3 im Vertrags-Test wurden vom Main-Dialog (`dialog`-Protokollzeile) auf `send` + Rückkanal umgestellt (der TK 9.5.4-Wunsch „Dialog im Renderer").
  - **#331** (Abschlussglied: SCHRITT 2 mit echtem `erzwingeEinzelInstanz(ermittleDatenOrt(), beiZweitemStart)`; Startdialog bei `datenort_nicht_beschreibbar`; `FERTIGE_BOOTSTRAP` um #331 ergänzt) – `9526856` + Aufräum-Commit, Merge `e910b5c`.

## Was NICHT gebaut ist und warum (der Rest von „alle 10")

- **#309** war bereits vor der Serie gebaut, geschlossen (`69f9bf6`/Merge `316e0df`); das Messwerkzeug zählte ihn nur bis zum #331-Nachzug als offen.
- **#327** ist die letzte offene M8-Issue und hängt an der Kette **#311 - #313 - #314 - #322** – mit deren eigenem Urteilszusammenhang:
  - **#311**: die drei Shell-Dateien (sichten.ts, inhalte-zugaenge.ts, bootstrap.ts) entfernen `Sichten.marke` und führen `marken: MarkenZugang` ein (§`config:leseMarke` entfällt, TK 9.5.6).
  - **#313**: die drei Modul-Wurzeln (#261/#250/#251), `inhalte.tsx`, #154 und preview-player stellen von der Einermarke auf Marken-je-Aktion um – EINE zusammenhängende Änderung (das Issue selbst).
  - **#314**: ReiterId + REITER_REIHENFOLGE um `'marken'`, rahmen.tsx (fünf Knöpfe, „Marken"), undo-historien.ts (`bereichFuerReiter('marken') === null`), Inhalte.tsx (`MarkenEditorWurzelProps` als DEFINIERENDE Quelle; ModulWurzeln um `markenEditor`; Belegung `marken: ({ sichtbar }) => <wurzeln.markenEditor …/>`).
  - **#322**: App.tsx montiert `MarkenEditorWurzel` (sechster Eintrag, Zahl „fünf" auf „sechs" nur dort).

## Wichtige Festlegungen, die in der Serie entstanden sind (an die Übergabe-Besitzer)

- **Umlaut-Kanalnamen (vorm. entschieden) bestätigt:** `KANAELE.marken.öffneMarkenDateiDialog` trägt den Umlaut im **Schlüssel** selbst. Neues Kanal-Gegenteil: `project:setzeStandardMarke`, `beenden:status`, `beenden:entscheidung` – Umlaut NUR dort, wo der Operationsname ihn hat (wie `setzeTrim`).
- **Zahlwörter nach dem gebauten Stand (#323-Nachtrag an das Issue):** Registry `project`-Block = **21** Einträge; Verdrahtung Schritt 5 = **13** Anmeldungen ohne Fenster (Positionen 1–12 unangetastet, #323 hinten), Schritt 7 = 4; **insgesamt 17** Registrierungen (nicht 19/12/16 wie im Issue-Text – der gebaute Stand von #309/#334 war weiter als die beiden Issues rechneten).
- **`KANAELE.beenden`** (2 Einträge) existiert seit #336; der Main-Dialog `dialog.showMessageBoxSync` bleibt als toter Code mit Kommentar-Dokumentation in `index.ts` – **nicht** löschen (Byte-gleich-Zusage von #3 anhand des alten Körpers).
- **Faserdisziplin ist KOSTENPFLICHT geblieben:** In dieser Serie wurden Geeque oberflächliche Suchen zweifach defekt (Igis- direkt im eigenen Kommentar getroffen bei #300 bzw. #301) und drei Infizierungen in Nachträgen (zweimal kyrillisch, einmal CJK) im Sprach-Scan VOR dem Posten gefangen. Weitere Post-Fasern im Vergleich zu #312 (Vergleich).
- **Test-Patrimonium:** `tests/unit/bootstrap-verdrahtung.spec.ts` ist die Vertragsquelle für Reihenfolge + Einmaligkeit AUF MAIN – bei jeder neu anmeldenden Issue ist die ANZAHL der Mock-Liste und das Protokoll nachzuziehen (beide Nachzüge #323 und #331 stehen dort drin).
- **Kanäle-Nachtrage:** `KANAELE.project` = 21, `KANAELE.beenden` = 2; die drei Zähl-Tests (tests/unit/project-store-nachtrag.spec.ts, export-verdrahtung.spec.ts, vorlagen-nachtrag.spec.ts) sind mit den Nummern konsistent (auf 21).

## Offene Meldungen (PSequence), die Übergabe-Serie involviert

1. **#399 (NEU, dieses Issue bezogen)** – die vier benannten Edits, die das #327-Bauteil verfügbar machen (ProjektMeta.standardMarkeId, Zeichen-Schlitz, sechstes Prop, marken-Prop) frei für den Auftraggeber vorgesehen; wurde per Kommando bereits angelegt.
2. **#312-Nachtrage** ( git beginnt mit `dcefc40`, vermeldet Lint-Befund auf MAIN entgegen „Lint 0 auf main" und die Faser)
3. **Bekannte Flaky in `tests/unit/marken-dateien.spec.ts`** — der 2 von 4 Vollsuiten ausgefallene Sentinel-Test; Nachtrag #289.
4. **`bereitschaft.py` blindstellen:** #314 zählt als `gebaut`, dürfte aber inhaltlich nicht gebaut sein (`reiter.ts` kennt noch kein 'marken'; inhalte.tsx kennt kein `markenEditor`); das Messwerkzeug bemerkt die Lücke, weil eine REGELTE Datei-secondary und keine "Fertige Funktion ohne Aufrufer"-Regel. **Wiederal niedrigste tools (bereitschaft.py) zählen geschlossene - (WAHR): Diese blind, diesmal #314 im Betracht einbezogen und als 58/60 gebaut gezählt, woran ein als apekt angelegter Detaillisten aktive ist.** Lincolnfält: Ein Issue-By-By-Check mit Datenbestand: WISDEN anliegend vor dem Bau nach #314 (oder #322/#327 zu Survival).
5. **Beim User (unverändert):** TV-Test, macOS-Artefakt (#7).

## Wichtige Bau-Reihenfolge für die nächsten Sessions

1. **#311** (Shell-Dateien) — die Basis für alles außerhalb.
2. **#313** (drei Wurzeln + #154 + preview + inhalte.tsx-Wurzel-Prop) — zusammenhängend.
3. **#314** — Reiter id, rahmen, undo, Inhalte; dann **#322** (App.tsx-Montage), dann das Einfassen des Hinweises in **#327**, und **#399** (die vier Edits).
