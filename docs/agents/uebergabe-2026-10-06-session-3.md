# Übergabe – Session 06.10.2026 (dritte Fortsetzung)

> **Für die nächste Sitzung.** Lies zuerst `CLAUDE.md` (die Kette: AD → TK → Issues → Code),
> dann diese Datei. Vorphrase wie immer: Behaupte nichts, was du nicht geprüft hast.

## Wo das Projekt steht (gemessen, `python3 tools/bereitschaft.py`)

| Meilenstein | gebaut |
|---|---|
| M0 Grundgerüst | 15 / 15 |
| M1 Fundament | 50 / 50 |
| M2 Torwächter | 20 / 20 |
| M3 Medien | 21 / 21 |
| M4 Pixel | 26 / 26 |
| M5 Inhalte | 37 / 37 |
| M6 Render & Export | 37 / 37 |
| M7 Oberfläche | 70 / 71 (#215 entfallen, Phantom) |
| **M8 Marken** | **39 / 60** |

**5129 Tests grün (274 Dateien), Typecheck/Lint 0, Branch `main`, Arbeitsbaum sauber**
(nur Vorbefund-Artefakte: `marken.json` im Repo-Wurzelverzeichnis, `.e2e-echt-datenort/`,
`.e2e-flow-ist-datenort/` – untracked, VORBEFUND, nicht angefasst).

## Was in dieser Session gebaut und gemergt wurde (alle geschlossen)

| Issue | Was | Commit |
|---|---|---|
| #277 | marken.json atomar + serialisiert (PKette, kein D1-Lock; .bak, fsync) | `e62367c` |
| #280 | eingebaute Fitnessworld24-Marke als Anfangsbestand | `695e0d3` |
| #279 | `loeseMarkeAuf` – die eine Vererbungsstelle (+ Stempel) | `a7a0c31` |
| #283 | `leseMarke` – die eine aufgelöste Lesestelle | `b02d507` |
| #282 | `listeMarken` – alle Marken aufgelöst | `04dc674` |
| #284 | `erstelleMarke` + Kettensperre (logo: null, Auftraggeber 11.08.) | `06465dc` |
| #275 | Nutzungs-TYpen MarkenReferenz/Markennutzung in `marke.ts` ergänzt | `0513f16` |
| #286 | `pruefeMarkenReferenzen` – lesend über ALLE Projekte (drei Listen) | `0513f16` |
| #287 | `löscheMarke` – blockierend, eingebaut unlöschbar | `654c551` |
| #278 | Ereignis `marken:autoSpeichernStatus` – Sender-Schicht | `b0a2fb8` |
| #289 | `importiereMarkenDatei`/`entferneMarkenDatei` | `bf1904f` |
| #281 | `migriereProjektAufMarke` – reine Transformationsfunktion | `3343ab7` |
| #306 | `öffneMarkenDateiDialog` – nativer Dialog (Filter aus EINER Quelle) | `a39073c` |
| #328 | `erstelleProjektAblauf` – der Kanal ruft den Ablauf; schemaVersion bleibt 1 | `387af4c` |

## Etwas Entscheidungen vom User in dieser Session (alle mit Nachtrag im Issue belegt)

1. **#319 (a): JA** – `setzeMarke` ruft nach erfolgreichem `speichereAktion` genau
   `stelleMarkeBereit(markeId)` (Variante A). Die einzeilige Ergänzung in
   `marke-waehlen.ts` wird MIT dem Bau von #312 nachgezogen (kein 'lade halt nach'
   im Zeichenpfad).
2. **#319 (b): JA via #338** – eine unbekannte `aktion.markeId` zählt ALS kaputte
   Stelle; #338 bleibt der einzige Umsetzungsort (Bestätigungs-Nachtrag gelegt).
3. **#279, beide STOPP-Fragen: `unbekannter_fehler` (laut statt leise)** –
   verletzte Kettensperre → Fehler mit beidseitigen IDs; Loch beim Parent → Fehler mit
   Rollen-/Feldangabe. Der eigenständige Pfad prüft NICHT (verbindlicher
   Signaturkommentar).
4. **#328 Flush-Auslöser (Variante F1): NUR beim Beenden** – die Zeichenpfade lesen aus
   dem SPEICHER (#283 via `ladeBestand`); der Flush schützt nur die Datei. Erledigt
   auch die offene Frage aus #295 (Reiterwechsel im Marken-Reiter).
5. **#285 (B1): freier Fachwert** – KEINE zweite Hex-Formatquelle neben #339
   (Format check an der Zeichenschicht); `kanaele.ts`, `index.ts` unverändert.
6. **#328 schemaVersion bleibt 1** (Entschieden 23.08., s. Nachtrag #320) – die
   eingebaute Marke ist Seed nach #280.

## Wichtige Befunde und Regeln (aus dieser Session, teuer)

- **FASERN-GEFAHR (weitere Bestätigung): lange Writes ueber 150 Zeilen verursachen verwurste
  Kommentarfasern** (fremdsprachige Zeichen und verbastelte Woerter – drei Beispiele:
  ein verschobenes 'oeffne' in der Mitte des Satzes, ein CJK-Fragment als Kapitelverweis,
  ein 'MarkenEintrad' statt 'MarkenEintrag') – diesmal auch in GitHub-Kommentaren
  (alle drei dort via `--edit-last` bereinigt). Die Regel bleibt:
  Sprach-Scan (Codepoints > U+2100, PLUS CJK-Bereich) nach JEDEM Write / Posting;
  lange Writes in HAELFTEN mit `cat >>`-Heredoc 'EOF'.
- **`tools/geruest.py` braucht `milestone` im issues.json** – ein dump ohne das Feld
  produzierte lautlos 0 Rümpfe (keine Fehler Nachricht!). Immer
  `gh issue list --json number,title,body,labels,milestone` dumpen.
- **`importOriginal`-Cache in Vitest hält den Modulzustand fest** (auch nach
  `vi.resetModules`): Testfixture-Pruefungen mussten deshalb auf Subsequenz-Nachweis
  bzw. Umschalter-Welt umgestellt werden. Wer Häufungen baut: die Testumgebung sollte direkt die Zielfunktion über die
  echte Mark-Store Umgebung umgehen (kein Wrapper auf schreibe-marken).
- **DoD-Zählfehler mit gemelder Klausel:** #283s DoD nennt ZWOELF FarbRollen – der
  Vertrag (marke.ts, #52) definiert DREIZEHN; gegen den VERTRAG gebaut (13), Meldung
  gelegt.
- **Vor-Guard-Konflikt (transparent):** #52/#320s Guard in `tests/unit/marke.spec.ts`
  verbot die vier Nutzungs-Typen in `marke.ts` – #275 legt sie AUSDRÜCKLICH hier ab;
  Guard für `MarkenEintrag`/`Partial` eingeschränkt, MELDE im Nachtrag.

## Offene Punkte für die nächste Session (in dieser Reihenfolge)

1. **#304** ist jetzt baubereit – der letzte (geschlossene) Kanal-Ring des marken-stores
   (neun Instant-Kanäle plus das eine Ereignis, NACHTRAG-10.08-Fassung beachten);
   danach ist die naechste M8-Welle offen.
2. **Nachzug aus #319 (a)**: sobald #312 gebaut ist, die EINE Zeile in
   `marke-waehlen.ts` (Import + Aufruf nach dem erfolgreichen Speichern) nachziehen;
   dort den Ausbau-Baustein im Kommentar („lade halt nach" bleibt verboten) beachten.
3. **Benannte fremde Edits (vom Issue #328 aus benannt)** – Sache des Auftraggebers:
   der Issue-Text #33 (Signatur ohne den zweiten Parameter), der Issue-Text #76
   (Ausführungszeile), #320 (die offene Frage/Pflichtfeld-Vermerk), #224 (die unvollstandige
   Fehlercode-Liste).
4. **Werkzeug-Limits (unverändert):** `bereitschaft.py` zählt geschlossene Issues mit
   (#215 bleibt Phantom); `gh issue list --state all` heißt die Ursache.
5. **Beim User (unverändert):** TV-Test (FAT32/exFAT-Befund in #184/#186/#188),
   macOS-Artefakt (#7).
6. **Aufraeumen (unverändert):** die gemergten Branches `bau/m7-262` und
   `abbau/naht-inhalte-vorlauf` können geloescht werden.
