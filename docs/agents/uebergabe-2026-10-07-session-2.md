# Übergabe – Session 07.10.2026 (nachm., die Bau-Serie „alle 10 M8-Issues")

> **Für die nächste Sitzung.** Lies zuerst `CLAUDE.md`, dann `uebergabe-2026-10-07-session.md` (vorm.), dann diese Datei. Vorphrase: Behaupte nichts, was du nicht geprüft hast.

## Wo das Projekt steht (auf `main` gemessen)

- **Vollsuite 294 Dateien / 5362 Tests grün, Typecheck 0, Lint 0.** `python3 tools/bereitschaft.py`: **M8 59/60, 1 baubereit (#327)**; M0–M6 vollständig; M7 70/71 (#215-Phantom wie gehabt).
- Zu `main` gemergt in dieser Serie (je Issue ein Branch, je ein Merge, alle Issues geschlossen):
  - **#297 + #298** (marken-editor Schriften/Logo) – Commits `db3213d`, `024b712`; Tests `tests/unit/schrift-logo-bearbeiten.spec.ts` (18 Tests).
  - **Reparatur-Commit `dcefc40`** VOR #297: In `src/renderer/gemeinsam/marken-bereitstellung.ts` (#312, bereits auf main) war ein ungenutzter `catch (ursache)`-Parameter (Lint-Fehler, bestand GEGEN die Übergabe-Aussage „Lint 0 auf main") und eine infizierte Kommentar-Faser („fehlenden Geschlecht serotonin Schrift-Datei"). Beides in zwei Zeilen mit `git diff` belegt korrigiert; Nachtrag an #312.
  - **#299** (`herkunft-anzeigen.ts`: der EINE Ort, der den Sentinel `{ geerbt: true }` sendet) – `cef182e`, Merge `0288165`; 13 Tests; die drei Texte von `baueHerkunftText` String-gleich geprüft.
  - **#300** (`marke-ableiten.ts`: Basen-Filter = `parent === null`; anlegen+öffnen in einem Zug) – `1057e2a`; 7 Tests.
  - **#302** (`loeschen-vorwarnung.ts`: eingebaute Marke ohne Prüfung, drei Listen, Standardmarken-Ausweg als abgeleitete Funktion) – `e8051ae`, Merge `f39dbbf`; 11 Tests.
  - **#326** (`datei-import.ts` als Dialog-Kapsel; Abbruch ist `{ ok: true, wert: null }` – kein Fehlercode) – Merge `3b5d7ed`; 11 Tests.
  - **#323** (`setze-standard-marke.ts` + `project-store-nachtrag-3.ts` + Kanal `project:setzeStandardMarke` + dreizehnte Verdrahtung) – `1af56c1`, Merge `adea10b`; 16+6 Tests; Vertrags-Tests nachgezogen (`bootstrap-verdrahtung.spec.ts`, drei Registry-Zahlentests: 20 auf 21 Einträge).
  - **#324** (`projekt-verwaltung/standardmarke.ts`/`.tsx`: Lage, Auswahl, Wechsel geladen/fremd, gesperrt statt ausgeblendet) – `66a30e4`, Merge `732dd7e`; 12+11 Tests (jsdom).
  - **#330** (`marken-editor/index.tsx`: die Wurzel, drei Spalten, 21 Bausteinrufe, Import über #326, Löschen mit Vorschau) – `36c100c`, Merge `42041e2`; 18 Tests (die zwölf Bausteine als Doppel).
  - **#336** (`beenden-ablauf.ts` + `beenden-dialog.tsx` + Kanalblock `beenden`: Veto, RENDERER-Dialog mit Empfehlung je Ursache, „Erneut versuchen" nur der Gescheiterten, „verwerfen" endgültig) – `cdfaecb`, Merge `efac728`; 4 Tests + 20 Nachzüge; die drei Beenden-Tests von #3 im Vertrags-Test wurden vom Main-Dialog (`dialog`-Protokollzeile) auf `send` + Rückkanal umgestellt (TK 9.5.4: „der Dialog im Renderer").
  - **#331** (Abschlussglied: SCHRITT 2 mit dem echten `erzwingeEinzelInstanz(ermittleDatenOrt(), beiZweitemStart)`; Startdialog bei `datenort_nicht_beschreibbar`; `FERTIGE_BOOTSTRAP` um #331 ergänzt) – `9526856` + Aufräum-Commit, Merge `e910b5c`.

## Was NICHT gebaut ist und warum (der Rest von „alle 10")

- **#309** war bereits vor der Serie gebaut und geschlossen (`69f9bf6`, Merge `316e0df`); das Messwerkzeug zählte ihn nur falsch als offen, weil `src/main/index.ts` den LUECKE-Marker trug - der ist seit #331 weg, `FERTIGE_BOOTSTRAP` wurde daraufhin ergänzt.
- **#327** ist die letzte offene M8-Issue und hängt an der Kette **#311 - #313 - #314 - #322** - mit deren eigenem Urteilszusammenhang:
  - **#311**: die drei Shell-Dateien (sichten.ts, inhalte-zugaenge.ts, bootstrap.ts) entfernen `Sichten.marke` und führen `marken: MarkenZugang` ein (der Kanal `config:leseMarke` entfällt ersatzlos, TK 9.5.6).
  - **#313**: die drei Modul-Wurzeln (#261/#250/#251), `inhalte.tsx`, #154 und der preview-player stellen von der EINEN Marke auf Marken je Aktion um - EINE zusammenhängende Änderung (siehe Issue selbst).
  - **#314**: ReiterId + REITER_REIHENFOLGE um `'marken'`, rahmen.tsx (fünf Knöpfe, „Marken"), undo-historien.ts (`bereichFuerReiter('marken') === null`), inhalte.tsx (`MarkenEditorWurzelProps` als DEFINIERENDE Quelle; ModulWurzeln um `markenEditor`; Belegung `marken: ({ sichtbar }) => <wurzeln.markenEditor ... />`).
  - **#322**: App.tsx montiert `MarkenEditorWurzel` (sechster Eintrag, Zahl „fünf" auf „sechs" NUR dort).

## Wichtige Festlegungen, die in der Serie entstanden sind

- **Umlaut-Kanalnamen (vorm. entschieden) bestätigt:** `KANAELE.marken.öffneMarkenDateiDialog` trägt den Umlaut im **Schlüssel** selbst (nicht nur im Kanalnamen). Neue Kanäle sind umlautfrei, weil die Operationsnamen es sind: `project:setzeStandardMarke`, `beenden:status`, `beenden:entscheidung`.
- **Zahlwörter nach dem gebauten Stand (#323-Nachtrag im Issue):** Registry-Block `project` = **21** Einträge; Verdrahtung Schritt 5 = **13** Anmeldungen ohne Fenster (Positionen 1 bis 12 unangetastet, #323 hinten), Schritt 7 = 4; **insgesamt 17** Registrierungen - nicht die 19/12/16 aus dem Issue-Text, denn der gebaute Stand aus #309/#334 war weiter als die Issue-Texte rechneten.
- **`KANAELE.beenden`** (2 Einträge) existiert seit #336. Der alte Main-Dialog (`dialog.showMessageBoxSync` in index.ts) bleibt als mit Kommentar dokumentierter toter Code stehen - **nicht** löschen (die Byte-gleich-Zusage von #3 gilt für den alten Körper).
- **Faserdisziplin blieb KOSTENPFLICHT:** Grep-Proben griffen zweifach im eigenen Kommentar (#300: „kein loescheMarke"; #324: Endungs-Literale im verbindlichen Dokumentationskopf) - Probe auf kommentar-bereinigten Code bzw. auf Import-Zeilen verschärft. Drei Nachtrags-Infizierungen (zweimal kyrillisch, einmal CJK) fielen jeweils VOR dem Posten im Sprach-Scan auf. Diese Übergabe wurde (wie schon die erste Fassung der Vormittags-Übergabe) mehrere Male verworfen und in geprüften Hälften neu geschrieben.
- **`tests/unit/bootstrap-verdrahtung.spec.ts` ist die Vertragsquelle** für Reihenfolge + Einmaligkeit der Anmeldungen: jede neue Anmeldung verlangt dort „Mock-Liste + Protokoll erweitern" (beide Nachzüge #323 und #331 nachweislich drin).
- **Kanal-Zählungen:** `KANAELE.project` = 21, `KANAELE.beenden` = 2; die drei Zähl-Tests (tests/unit/project-store-nachtrag.spec.ts, export-verdrahtung.spec.ts, vorlagen-nachtrag.spec.ts) sind auf 21 gezogen.

## Offene Meldungen aus der Serie

1. **#399 (NEU)** - die vier benannten Edits, die das #327-Bauteil verfügbar machen (ProjektMeta.standardMarkeId, Zeichen-Schlitz in der Projektzeile, sechstes Prop an der Modulwurzel, marken-Prop). Das Bauteil #324 ist komplett gebaut, hat aber noch keinen Aufrufer - genau und ausdrücklich so belegt (im Issue-Nachtrag).
2. **#327 selbst** (der letzte M8-Bau) - wartet auf die Kette #311 / #313 / #314 / #322.
3. **Flaky in `tests/unit/marken-dateien.spec.ts`** (Der Sentinel-Test fiel in 2 von 4 Vollsuiten aus; Einzellauf grün, Fehlermeldung nicht gefasst): Nachtrag an #289. Regel von dort: erst Meldung fassen, NICHT den Test verändern.
4. **`bereitschaft.py` misst unvollständig:** #314 zählt als `gebaut`, ist inhaltlich aber NICHT gebaut (reiter.ts kennt kein 'marken', inhalte.tsx kein `markenEditor`); das Werkzeug kann bei EDITs an bestehenden Dateien keinen fehlenden Editor-Zuschnitt bemerken. „Fertige Funktion ohne Aufrufer" ist weiterhin NICHT maschinell messbar - vor dem Bau nach #314 (bzw. #322/#327) mit `grep` prüfen, nicht dem Messwert trauen.
5. **Beim User (unverändert):** der TV-Test, das macOS-Artefakt (#7).
6. **#331-DoD-Punkte, die NUR am echten Fenster prüfbar sind (gemeldet, nicht belegbar hier):** `npm run dev` öffnet ohne Fehlerdialog; ein marken://-Asset lädt im Renderer.

## Wichtige Bau-Reihenfolge für die nächsten Sessions

1. **#311** (die drei Shell-Dateien) - die Basis für alles Weitere.
2. **#313** (drei Wurzeln + #154 + preview-player + inhalte.tsx-Prop) - zusammenhängend, nicht zerreißen.
3. **#314** (Reiter, rahmen, undo, Inhalte) - dann **#322** (App.tsx-Montage), dann das Einfassen des Speicherhinweises in **#327**, und **#399** (die vier Edits).
