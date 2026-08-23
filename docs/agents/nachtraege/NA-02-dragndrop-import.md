### Issue NA-02 (= #335): [composer] Medien-Import per Drag-and-drop aus dem Explorer – zweiter Importweg

## Ziel (in einem Satz)
Der Nutzer kann Videodateien aus dem Windows-Explorer (oder macOS-Finder) in die Medien-Bibliothek
ziehen und damit denselben Import-Auftrag auslösen, den der Datei-Dialog (#228) auch erzeugt.

## Modul & Datei
- Modul: `composer` [P3] (Renderer) – die Aufnahme des Drop-Ereignisses; der eigentliche Import
  bleibt unverändert die Auftrags-Kette über `media:öffneMedienDialog` … **Achtung, Vertrag:** Der
  bestehende Weg läuft über den Dialog im Main. Ein Drag-and-drop liefert bereits einen **Pfad**,
  keinen Dialog. Es ist zu entscheiden, ob der Main einen zweiten Kanal bekommt (z. B.
  `media:importierePfad`) oder ob `media-service` den Auftrag direkt aus dem Renderer-Pfad einreihen
  kann. **STOPP: Das ist beim Schreiben dieses Issues offen und vom User nicht entschieden – erst
  klären, dann bauen.**
- Betrifft voraussichtlich:
  - `src/renderer/composer/medien-bibliothek.ts` (#227-Umfeld) – Drop-Zone
  - ggf. `src/main/media-service/**` – zweiter Eingang
  - ggf. `src/shared/contracts/kanaele.ts` – neuer Kanal (Registry-Pflicht nach #25)

## Warum das im Gesamtsystem wichtig ist
Der User hat am 23.08.2026 entschieden (Entscheidungsdokument `docs/agents/entscheidungen-23-08.md`,
Zeile #228): Drag-and-drop kommt als zweiter Importweg dazu. Ohne eigenes Issue wäre das eine
"fertige UI-Stelle ohne Auftrag" – dieselbe Lückenklasse wie sechsmal zuvor.

## Verbindliche Regeln (aus dem bestehenden Import-Vertrag, NICHT neu erfinden)
- Der Import läuft als **Auftrag** durch den Torwächter (TK 9.3.4) – ein Drop darf KEINEN direkten
  media-service-Aufruf bauen.
- Mehrere gleichzeitig gezogene Dateien: nacheinander einreihen, je ein Auftrag; Teilerfolg melden.
  (Lokale Entscheidung, hier festgehalten.)
- Nicht unterstützte Dateitypen werden mit demselben Hinweis abgewiesen wie im Dialogweg
  (`FORMAT_WHITELIST`, #13).
- Kein zweiter Fortschritts-Mechanismus: derselbe `meldeFortschritt`-Weg wie #84/#85.

## Nicht selbst entscheiden – STOPP und fragen
- **Kanalfrage oben (Renderer-Pfad → Main):** zweiter Kanal oder Umbau des bestehenden? Vor dem Bau
  mit dem User klären.
- Darstellung während des Imports: dieselbe Zeile/Warteschlange wie beim Dialog-Import?

## Definition of Done
- [ ] Drop einer unterstützten Videodatei in die Medien-Bibliothek reiht einen Import-Auftrag ein,
      der zum identischen Ergebnis führt wie der Dialogweg (Asset in D1, Datei in D2)
- [ ] Drop mehrerer Dateien reiht nacheinander ein; Teilerfolg wird angezeigt
- [ ] Nicht-whitelisted Typen werden abgewiesen, ohne dass ein Auftrag entsteht
- [ ] Kein Import umgeht den Torwächter
- [ ] Typecheck/Lint/Tests grün

## Abhängigkeiten
- Blockiert von: #227 (Medien-Bibliothek steht), #84/#85 (Import-Auftrag)
- Bezug: AD FA-01, TK 9.3.4, `docs/agents/entscheidungen-23-08.md`
