# Plan Mutations-Chargen 17–26 (28.10.2026)

**Stand beim Schreiben:** Charge 16 gebaut, Suite **5.479** (340 Dateien), Sperrklinke
`tools/eslint/quelltext-proben-ausnahmen.json` = **50 Dateien**, Gate `npm run pruefung`
**Exit 0**. Dieses Dokument plant die **restlichen zehn Chargen**; gebaut ist keine davon.

**Messgrundlage (28.10.2026):** jede der 50 Dateien hat **genau eine** Probe. Die Zuordnung
unten stammt aus einem Lauf über die Sperrklinken-Liste (Quellpfad je `readFileSync`-Aufruf,
Alias-aware). Die **Inhalte** der Ziele sind in dieser Sitzung **nicht** gelesen – die
Erwartungen sind aus Modulnähe und Probe-Art abgeleitet; jede Charge beginnt mit dem Lesen der
fünf Specs und Quellen.

**Stand nach Charge 18 (29.10.2026):** Chargen 17 und 18 gebaut – Suite **5.417**
(340 Dateien), Sperrklinke **40** Dateien, Gate `npm run pruefung` **Exit 0**. Offen sind die
Chargen **19–26** (acht).

**Stand nach Charge 19 (29.10.2026):** Chargen 17–19 gebaut – Suite **5.382** (340 Dateien,
−35 Probetests), Sperrklinke **35** Dateien, Gate `npm run pruefung` **Exit 0**. Offen sind
die Chargen **20–26** (sieben). In Charge 19 war die Probe bei **EV6** die einzige Waechterin
(Kanalname als Literal); nach dem Ausbau ist die **Form** ungedeckt, der **Wert** bleibt durch
einen Verhaltens-Test gedeckt (Gegenprobe EV8).

**Stand nach Charge 20 (29.10.2026):** Chargen 17–20 gebaut – Suite **5.357** (340 Dateien,
−25 Probetests netto), Sperrklinke **30** Dateien, Gate `npm run pruefung` **Exit 0**. Offen
sind die Chargen **21–26** (sechs). Charge 20 fand **eine echte Luecke** (A6, `unlesbar`-Zweig
in `listeAusgaben` ungetestet) und **drei aequivalente** Faelle; bei **L8** war wieder die
Probe die einzige Waechterin (inline `media`-Pfad, derselbe Wert).

**Stand nach Charge 21 (29.10.2026):** Chargen 17–21 gebaut – Suite **5.323** (340 Dateien,
−34 Probetests netto), Sperrklinke **25** Dateien, Gate `npm run pruefung` **Exit 0**. Offen
sind die Chargen **22–26** (fuenf). Charge 21 fand **eine echte Luecke** (L4, Fixture mit
leerer zweiter Liste) und **keinen** aequivalenten Fall; nach dem Ausbau blieben alle 30
Verhaltens-Mutationen rot.

**Stand nach Charge 22 (29.10.2026):** Chargen 17–22 gebaut – Suite **5.307** (340 Dateien,
−16 Probetests netto), Sperrklinke **20** Dateien, Gate `npm run pruefung` **Exit 0**. Offen
sind die Chargen **23–26** (vier). Charge 22 (erste Renderer-Charge mit `.tsx`) fand **zwei**
Test-Luecken (A4 Zugangs-Spiegel, B6 Meldungstabelle) und eine **Produkt-Luecke**:
`meldungZuBefunden` hat keinen `case 'markeId'` – die Meldung lautet dann
`" Es wurde nichts gespeichert."`. Gemeldet, nicht geaendert. Zwei Befunde gehören seitdem zum Rezept: Die Probe kann die
**einzige** Wächterin einer Zusage sein (Charge 17: drei Literale) – deshalb wird **nach dem
Ausbau erneut gemessen**. Und eine Meldung mit dem richtigen **Text** ist kein Beleg für den
richtigen Grund (Charge 18: `toContain` blieb bei `"Error: …"` grün; erst der exakte
Vergleich biss).

## Das Rezept (unverändert, verbindlich)

1. Eine semantische Änderung an der Quelldatei, nichts daneben.
2. Quelldatei sichern, Prüfsumme merken.
3. **Die zugehörige** Spezifikation laufen lassen (`tools/mutationen.py`).
4. Byte-identisch zurücknehmen, Prüfsumme vergleichen.
5. Harmlose Refactorings müssen grün bleiben.
6. Grüne Mutation = **Lücke** (Verhaltens-Test) oder **äquivalent** (begründen) – nie übergehen.
7. Probe nur löschen, wenn ein Verhaltens-Test die Zusage trägt; danach die fünf Einträge aus
   der Sperrklinke streichen und den Lint-Lauf als Beleg nehmen.

**Die vier Fallen der bisherigen 16 Chargen** (jede hat eine Sitzung gekostet):
- **Falsche Spec** → alles grün (Charge 13: `einblendung-ansicht.ts` gegen die tsx-Spec).
- **`0 bestanden, 0 rot`** → Suite lädt nicht; Fall korrigieren, nicht werten (Charge 14: SV4).
- **Zufällig deckende Fixtures** → Lage gleich Modell, beide Marken mit derselben `id`, eine
  Testzeile statt zwei (EZ2, EN4, AL4).
- **Meldung mit der richtigen Zahl** ist kein Beleg für den richtigen Grund (ML7, Charge 3).

## Die zehn Chargen

| Charge | Dateien (Spec → Quelle) | Erwartung |
|---|---|---|
| **17** (gebaut) | `bandspur` → `ffmpeg-adapter/bandspur.ts`; `encoder-argumente` → `encoder-argumente.ts`; `filter-einblendung` → `filter-einblendung.ts`; `filter-vollbild` → `filter-vollbild.ts`; `standbild` → `standbild.ts` | Fünf Adapter-Dateien, alle „setzt seine Flags selbst / keine zweite Quelle". Verhaltens-Tests prüfen die Argument-Arrays; **erwartete Lücken**: fehlende Verbote für neue Flags. |
| **18** (gebaut) | `tonspur` → `ffmpeg-adapter/tonspur.ts`; `media-protokoll-schema` → `media-protokoll.ts`; `dialog` → `media-service/dialog.ts`; `handler-registrierung` → `media-service/handler-registrierung.ts`; `import-medium` → `media-service/import-medium.ts` | Tonspur + Media-Service. `media-protokoll-schema` prüft Privilegien (fünf, seit #364) – **Werte**, nicht Form: vor dem Entfernen genau lesen. |
| **19** (gebaut) | `loesche-medium` → `media-service/loesche-medium.ts`; `export-handler-anmeldung` → `export-service/handler-anmeldung.ts`; `ziel-dialog` → `export-service/ziel-dialog.ts`; `export-verdrahtung` → `ipc-gateway/export-verdrahtung.ts`; `render-handler-anmeldung` → `render-service/handler-anmeldung.ts` | Handler-Anmeldungen und Verdrahtung. Proben: „kein Kanal-Literal, kein `ipcMain.handle` doppelt". Verhaltens-Tests decken das Senden. |
| **20** (gebaut) | `marken-store-pfade` → `marken-store/pfade.ts`; `ausgaben` → `project-store/ausgaben.ts`; `liste-projekte` → `project-store/liste-projekte.ts`; `oeffne-projektordner` → `project-store/oeffne-projektordner.ts`; `pfade` → `project-store/pfade.ts` | Pfad-Autoritäten und Store-Listen. Proben oft „kein `path.join` mit Projekt-ID". Die **Pfad-Autorität** ist Vertrag (TK 9.5.7) – Verhaltens-Tests müssen die Pfadbildung tragen. |
| **21** (gebaut) | `render-abbruch` → `render-service/abbruch.ts`; `normalisieren` → `render-service/normalisieren.ts`; `als-eigenstaendige` → `vorlagen-store/als-eigenstaendige.ts`; `vorlagen-ipc-verdrahtung` → `vorlagen-store/ipc-verdrahtung.ts`; `loesche-vorlage` → `vorlagen-store/loesche-vorlage.ts` | Render-Abbruch und Vorlagen-Store. Achtung: `verwerfe-arbeitskopie` liegt in Charge 22 – die beiden hängen zusammen, Specs getrennt lesen. |
| **22** (gebaut) | `verwerfe-arbeitskopie` → `vorlagen-store/verwerfe-arbeitskopie.ts`; `app-einhaengung` → `App.tsx`; `aktion-bearbeiten` → `action-editor/aktion-bearbeiten.ts`; `aktion-loeschen` → `action-editor/aktion-loeschen.ts`; `bild-zuweisen` → `action-editor/bild-zuweisen.ts` | Erste Renderer-Charge mit tsx. `app-einhaengung` liest `App.tsx` – dort ist „kein zweiter Zustand" die Zusage; **vor dem Entfernen** prüfen, ob der Verhaltens-Test die Montage wirklich trägt. |
| **23** | `kaputt-handling` → `action-editor/kaputt-handling.ts`; `live-vorschau` → `action-editor/live-vorschau.ts`; `aktions-auswahl` → `app-shell/aktions-auswahl-filter.ts`; `asset-auswahl` → `app-shell/asset-auswahl-filter.ts`; `bootstrap-ablauf` → `app-shell/bootstrap.ts` | Zwei Filter-Paare + Bootstrap. Die Filter sind rein und gut verhaltensgetestet; `bootstrap-ablauf` ist der riskanteste (Startreihenfolge). |
| **24** | `inhalte-zugaenge-rechnung` → `app-shell/inhalte-zugaenge.ts`; `rahmen-montage` → `app-shell/rahmen-montage.ts`; `uebergabe` → `app-shell/uebergabe.ts`; `undo-projekt` → `app-shell/undo-projekt.ts`; `element-entfernen` → `composer/element-entfernen.ts` | Montage/Zugänge. `undo-projekt` liest evtl. den Projekt-Historien-Spion – der ist **bewusst geblieben** (Verhalten); nur die Quelltext-Probe zählt. |
| **25** | `element-zeile-anzeige` → `composer/element-zeile.tsx`; `medien-bibliothek` → `composer/medien-bibliothek.ts`; `optimistisch` → `composer/optimistisch.ts`; `render-ausloesen` → `composer/render-ausloesen.ts`; `render-dialog` → `composer/render-dialog.ts` | Composer-Kern. `optimistisch` trägt die Undo-Zusage – Verhaltens-Tests prüfen die Reihenfolge; Proben dort besonders genau lesen. |
| **26** | `slogan-bearbeiten` → `marken-editor/slogan-bearbeiten.ts`; `video-filmstreifen-blob` → `preview-player/video.tsx`; `vorschau-auswahl-rechnung` → `preview-player/vorschau-auswahl.ts`; `als-png` → `template-canvas/als-png.ts`; `marke` → `shared/contracts/marke.ts` | Letzte Charge. **`marke.spec.ts` ist der Sonderfall:** liest den Vertrag – wenn es ein Vollständigkeits-/Vertragstest ist (wie `fehlertexte`), **bleibt er** und die Datei wird aus der Sperrklinke gestrichen, ohne Probe zu entfernen. Vorher lesen, nicht nach Namen urteilen. |

## Erwartete Bilanz (Schätzung, keine Zusage)

- **50 Proben** → 50 Tests weniger, dazu je Charge 0–3 neue Verhaltens-Tests. Netto
  voraussichtlich **−40 bis −45** Testfälle: Suite **5.479 → ca. 5.435**.
- **Lücken:** in den ersten Chargen 2–4, gegen Ende weniger (die verhaltensstarken Dateien
  bleiben zuletzt). Realistisch **15–25** insgesamt.
- **Sperrklinke:** 50 → **0**. Dann kann die Regel von „Sperrklinke" auf „Verbot" gestellt
  werden (Ausnahmen-Datei leer, dann löschen).

## Was danach offen bleibt (nicht Teil der Chargen)

1. **Architekturregeln ohne Wächter** – die Proben sind weg, die Zusage nicht. Kandidaten für
   Lint: `readFileSync`-Verbot ist schon da (#447); es fehlen dateibezogene Regeln für
   „kein `node:fs` in `video-ausschnitt.ts`", „keine ffmpeg-Flaggen in Adaptern" und
   „kein `sort`/`filter` in reinen Modulen".
2. **#448** – 192 Typ-Behauptungen in `src` ohne `SAFETY`-Kommentar (Regel steht auf `warn`).
3. **Treiber-Einmal-Leser** – FA-13 ist seit Charge 15 mit Frist gemessen; weitere
   Einmal-Leser sind **nicht** systematisch geprüft.
4. **Push** – `main` liegt vor `origin/main`; nur auf Anweisung.
