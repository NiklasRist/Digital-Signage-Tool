# ÜBERGABE – nächste Session (Stand: 05.10.2026, abends, Commit `f30aba8`)

## ZUERST LESEN
- [`CLAUDE.md`](CLAUDE.md) vollständig (die Übergabe; der Dateiname ist historisch).
- [`AGENTS.md`](AGENTS.md) ist nur ein Zeiger darauf.
- Danach `python3 tools/bereitschaft.py` (Fakten, nicht Behauptungen).
- Die vorige Übergabe liegt als Archiv unter
  `docs/agents/uebergabe-2026-10-05-morgens.md` (Morgen, Commit `2fd574b`).

## STAND HEUTE (05.10.2026, abends) – gilt vor allen älteren Angaben in CLAUDE.md

### Gemessen (tools/bereitschaft.py, Commit `f30aba8`)
| Meilenstein | gebaut | baubereit | UNKLAR |
|---|---|---|---|
| M0–M6 | KOMPLETT | 0 | 0 |
| M7 Oberfläche | 59 von 71 | 5 | 1 (#231 – die DATEI ist gebaut, Werkzeug-Format s. u.) |
| M8 Marken | 21 von 60 | 4 | 0 (alle 4 faktisch blockiert, s. u.) |

- **Suite: 4632/4632 Tests grün**, Typecheck + Lint sauber, Branch `main`, Arbeitsbaum sauber.
  Untracked bleiben: `.e2e-echt-datenort/`, `.e2e-flow-ist-datenort/`, `marken.json` –
  Testartefakte, NICHT committen. `package-lock.json`-Drift ggf. mit `git checkout --` zurück.

### Was diese Session gebaut hat (alle auf main, je Issue EIN Commit, je ein Nachtrag auf GitHub)
- `e0e8e2b` **#232** Export-Auswahl + Zielordner-Dialog (#183), Einreihen über #134.
- `58d4f67` **#235** Undo/Redo der Projekt-Bearbeitung. **Vertragswiderspruch gemeldet und nach
  gebautem Code gelöst** (Nachtrag #235): `Bearbeitungsstand` verlangt seit #334/TK v3.18
  `standardSegmentdauer` im Schnappschuss – drei Felder statt der zwei im Issue-Text. Checkliste:
  Issue-Texte von M7-43/#236 und M7-44 im selben Punkt prüfen.
- `3381de1` **#249** Element-Zeile: EIN Regler, EINE Übernahme beim Loslassen (Kernnachweis),
  Band-Zugang (Fall 3 aus TK 9.7.5), Entfernen ohne Rückfrage. `formatiereReglerDauer` lebt HIER –
  die fehlende Datei war ein verborgener Baublocker für #248.
- `e76c302` **#248** Wiedergabeliste nach Issue + **Umverdrahtung des composers** (User-Entscheidung
  „Variante A"): Die ad-hoc-Liste in `composer/index.tsx` ist ersetzt; die verwaiste
  `wiedergabe-ansicht.tsx` ist entfernt. `allowImportingTsExtensions: true` in
  tsconfig.renderer.json und tsconfig.tests.json (dieselbe Klassenentscheidung wie der
  #110-Tausch index.ts gegen index.tsx). Meldungen: drei Nachträge auf #248.
- `c14cbe5` **#256** Übergabe-Overlays: Halter (`reparaturhalter`), Hinweg/Rückkehr über M7-08,
  Import-Rückweg `schliesseMedienImportAb` (ENTSCHIEDEN 12/13 – M7-06 meldet, M7-69 ruft).
- `01b7b03` **#335** Drag-and-drop-Import. **STOPP mit dem User geklärt: Variante A, KEIN zweiter
  Kanal** (Beleg im Nachtrag). `webUtils.getPathForFile` lebt in der Preload-Brücke (Electron 43
  kennt `file.path` nicht mehr), Wrapper `ipc-client/pfad-fuer-datei.ts`, Whitelist-Vorfilter
  gegen `FORMAT_WHITELIST` (#13) → Abweisung OHNE Auftrag; Einreihung exakt über
  `queue:reiheEin` mit `{art:'import'}` wie in #228; Bericht über `baueImportBericht` (#228).
- `a4feef5` **#274** Bootstrap 7/7: Schritt 5, Position 3 (#240) und 8 (#255); Schritt 7,
  Position 3 (#238). Rauchprobe `npm run dev` ohne Absturz. Schritt 2 (#51) bleibt unangetasteter
  Sonderfall (`StartBefund` statt des aus #3 zitierten `boolean`).
- `f30aba8` Messwerkzeug nachgezogen: `274` in `FERTIGE_BOOTSTRAP` (davor falsch „offen").

### Baubereit (5) – empfohlene Reihenfolge, Nummer nach map.json auflösen
1. **#217 (M7-24) segment.tsx**, dann **#218 (M7-25) split-stile.ts**, dann **#219 (M7-26)
   einblendung-stile.ts** – die drei preview-player-Rümpfe liegen in `src/renderer/preview-player/`.
   Dazu passt die Umhüllung **#242 (M7-49) vorschau-auswahl.ts** (Baustein, hält die Auswahl) vor
   ihrem Aufrufer.
2. **#243 (M7-50) undo-aufzeichnung.ts** – umhüllt die gemeinsame Projekt-Sicht und ruft
   `merkeVorAenderung` (#235). Ihr einziger Aufrufer ist die Übergabestelle der Shell (App.tsx,
   M7-69) – ohne ihn fertig gebaut und wirkungslos; wie immer per grep belegen.
3. **#253 (M7-61) einblendung-ansicht** und danach **#259 (M7-60) composer-montage**. Der
   Composer-Index wartet mit dem `bandHinweis`-Platzhalter: Wenn die Einblendungs-Ansicht steht,
   `aufEinblendungBearbeiten` im `composer/index.tsx` auf die echte Oberfläche BINDEN (dokumentierte
   Ausnahme wie bei #248, Nachtrag).
4. **#260 (M7-65) renderer-bootstrap**, dann **#262 (M7-69) App.tsx**. PFLICHT, weil die gemeldete
   Lücke genau dort hängt: `UebergabeOverlay` (#256) und die `bandHinweis`-Naht (#253) brauchen den
   Einsetzer. #262 holt `reparaturhalter()`, setzt das Overlay als GESCHWISTER von `<Rahmen>` (die
   Belegung steht genau in #256, ENTSCHIEDEN 11) und verdrahtet `meldeImportErgebnis` →
   `schliesseMedienImportAb`.
5. Danach die **#231-Werkzeugklarung**: die Datei ist gebaut (Commit ef191f9), das Werkzeug zeigt
   '? #231 None'. Vor dem Anfassen messen, WAS die Ausgabe verändert (Gegenprobe: Zeile in
   docs/agents/m7/M7-38.md abgleichen oder Werkzeug lockern; Ausgang der Probe mit Prüfsumme
   belegen und zurücknehmen).

### BEFUNDE, offen (melden, NICHT stillschweigend lösen)
1. **#215 = STOPP (User-Entscheidung):** "wird dieses Issue noch gebaut?" – Kernregel ist seit
   TK v3.16 entfallen; der .ts-Teil ist durch #258 gebaut.
2. **Einsetzer-Lücke (gemeldet auf #256):** `UebergabeOverlay` hat keinen Aufrufer, bis M7-69
   gebaut ist. Im selben Zug: `ElementBedienung` (#249) ist über `zeichneBedienung` im
   Composer-Index verdrahtet – bleibt so, bis #259 die Montage stellt.
3. **#231 zeigt als UNKLAR:** Werkzeug-Format gegen den wiederhergestellten Titel – siehe oben,
   Gegenprobe mit Prüfsumme.
4. **Buchhaltung nicht einheitlich:** Gebaute Issues bleiben auf GitHub gemischt offen/geschlossen
   (M0/M1 überwiegend offen, einige wie #184 geschlossen). Der Baustand zählt hier über das
   **Messwerkzeug**, nicht über GitHub-States – Eine Übereinkunft „wann wird ein Issue geschlossen?“
   ist eine USER-Entscheidung; die nächste Session fragt NICHT stillschweigend nach und schließt
   massenhaft nichts.
5. **Veralteter Planungsstand `docs/agents/m9/`** (M9-01 bis M9-14, ohne map.json): Enthält u. a.
   einen abweichenden Entwurf „#335 Universelles Undo/Redo", der dem ECHTEN #335 widerspricht.
   Nur gemeldet; was daraus wird (Planung fortsetzen oder verwerfen), ist dem User vorzulegen.
6. **Verwaiste Vorbauten (Commit `110b9a6`): `composer/kontext-menu.tsx`,
   `composer/fehler-markierung.tsx`, `composer/statistik.tsx`, `composer/zeitleiste.tsx` haben
   weiterhin KEinen Aufrufer. Wer sie braucht (Kandidat: #259 composer-montage), prüft und
   mountet oder entfernt – selbst melden, nicht still.
7. **TV-Test (Hardware) steht weiter beim User:** Firmware steht nur AM TV (Einstellungen →
   Support → „Über dieses TV"); physisch testbar nur: Autostart nach Stromausfall und
   „Repeat One"-Verlässlichkeit.

### M8-Blocker (unverändert)
`src/shared/contracts/marke.ts` trägt die nötigen Erweiterungen (`Marke.id`,
`Schrift.herkunft`, `Marke.logo.herkunft`, `parent`, `eingebaut`, `herkunftJeFeld`) NICHT –
**#291/#293/#303/#319 sind deshalb faktisch nicht baubar**, obwohl „baubereit" gemessen wird
(das Werkzeug sieht keine Vertragsdateien). Erst den Vertrag erweitern – Gegenstand des
Zitat-Abgleichs zu #52 – dann bauen.

### Arbeitsweise (unverändert bindend, aus CLAUDE.md)
- Issue-Text ist Quelle; Signaturblöcke NICHT ändern; Rumpf füllen; Gegenproben mit Beleg
  (Prüfsumme vor/nach); Stash-Gegenprobe bei Testfehlern; „fertige Funktion ohne Aufrufer" per
  grep prüfen; Nachträge ANHÄNGEN, nie ersetzen.
- EIN Issue pro Commit; die Commit-Nachricht je Issue von Hand ansehen (Commit-Nachricht) auf Tippfehler
  ansehen. `@ts-expect-error`-Direktiven für `.tsx`-Importe sind seit 05.10. in
  renderer/tests überflüssig (allowImportingTsExtensions aktiv) – keine NACHTRÄGE mehr dazu.
- jsdom-Tests: Muster aus `tests/unit/leiste-zeile.spec.ts` (createRoot + act),
  `vi.hoisted` für Mock-Doppel; vi.restoreAllMocks sparsam je `afterEach`.
- Deutsch ist die Projektsprache (Code, Kommentare, Commits).

### NÄCHSTER SCHRITT
`python3 tools/bereitschaft.py` → Start mit **#217 (M7-24)**, dann #218/#219, dann #242.
Ob die drei preview-player-Issues einzeln oder im Set gebaut werden (muss je ein eigener
Commit haben), ist für die nächste Session frei – EIN Issue pro Commit bleibt bindend.
