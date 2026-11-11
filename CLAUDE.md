# PROJEKT-ÜBERGABE – Digital-Signage-Tool (Baller Gruppe)

## Deine Rolle & meine Arbeitsweise
- Du hilfst mir (Berufspraktikant bei der Baller Gruppe) bei Planung und später Entwicklung
  eines Digital-Signage-Tools. Im Anhang: zwei Dokumente, die den Stand festhalten.
- [ÜBERHOLT seit 04.08.2026, bleibt als Beleg stehen] „WIR SIND IN DER PLANUNGSPHASE. Kein Code,
  keine Task-Listen, bis ich ausdrücklich sage ‚wir sind nicht mehr im Plan'."
  ES WIRD GEBAUT. Der Satz galt bis zum 04.08.2026; seither entsteht Code. Wer ihn heute befolgt,
  weigert sich zu arbeiten. Der aktuelle Stand steht im Abschnitt „STAND HEUTE" direkt darunter.
- Arbeite Schritt für Schritt, ein Thema pro Schritt, und frag am Ende kurz nach Bestätigung,
  bevor du weitergehst. Keine Sprünge nach vorn.
- Ich hasse Ambiguität. Triff klare Annahmen, benenne sie offen und beseitige Unklarheiten aktiv.

## STAND HEUTE (11.11.2026, siebenundfünfzigste Sitzung: die Messlatte wird genommen, nicht gebaut)

**Volltext: [`docs/agents/uebergabe-2026-11-11-referenzlauf.md`](docs/agents/uebergabe-2026-11-11-referenzlauf.md).**

- **KORREKTUR (Niklas, 11.11.):** Die PowerPoint-Baseline wird **genommen, nicht gebaut**. *„nimm gute powerpoints als vorlage weil das gilt es zu übertreffen"*. Referenz sind **zwei** frei verfügbare, **markenfremde** Decks: PresentationGO **„Fitness Studio"** und SlidesCarnival **„Salerio"**. Markenfremdheit ist **gewollt** („das soll markenunabhängig sein"); „Markentreue" heißt dort „eigene Identität durchgehalten".
- **AD v2.1 / TK v3.61** (`2e6979f`): AD 12.1 sagte wörtlich „wird einmal echt **gebaut**" — das widersprach #466. Umgeschrieben; die Startzahl „PowerPoint ≤ 14/24" ist **vorläufig** und wird aus der ersten Messung **abgeleitet, nicht verteidigt** (gute Decks erreichen 17–20/24).
- **AD v2.2** (`613c03b`): **FA-27** Produktfoto-Abruf + 4.12. Niklas: *„ein wichtiges feature das funktioniert wenn es internet gibt"* — **NFA-06 bleibt Muss** und bekommt genau **eine** benannte Ausnahme. Issue **#469** schreibt es aus (Abruf im **Main**, als **Auftrag über `reiheEin`**).
- **#467 gebaut** (`6893b53`, TK **v3.59**): Das gebündelte Logo war ein **503-Byte-Platzhalter**, obwohl TK 9.15.1 (v3.11) wörtlich sagt, es werde **kein Logo mitgeliefert** und der Zweig „gebündelt" sei toter Code. **Nur `anfangsbestand.ts` wich ab** (`erstelle-marke.ts` war korrekt). Jetzt: echtes Logo, weißes Trägerfeld, 840 × 240, Verhältnis **unverändert 3,5** — keine Zone, keine Vorlage, kein Test angefasst. **Fensterbeleg:** weiß 82,2 % / orange 3,2 % gegen Platzhalter 0 % / 86,2 % schwarz.
- **#468 gebaut** (`06e6eab`): FA-26 fehlte in der Treiber-Matrix → Gate war seit AD v2.0 rot (vorbestehend, per `git stash`-Probe belegt). Die Zählung im Abschlussblock war **schon vorher falsch** (sagte 9 teilweise bei 10 Zeilen); neu gezählt: **12 gemessen, 10 teilweise, 1 Lücke, 3 manuell; 16 Muss, 10 Soll**. Gate wieder **5741/5741**.
- **#465 gebaut** (`9615d1d`, TK **v3.60**): **9.17 Varianten** (FA-26) + 9.18 Abnahme. Drei der fünf offenen Fragen beantwortete die AD selbst. Auslegung offen benannt: „mindestens 3 je Aktion" = **Fähigkeitszusage**, keine Vorbelegung. **Befund:** die Vorlagen-Löschsperre kennt zwei Referenzarten und warnt vor der vergessenen dritten — `varianten[].vorlagenId` ist sie; 9.12.1 auf **drei** gezogen.
- **Drei Zitatfehler** in TK 9.17 gefunden und behoben (eine Paraphrase war als „AD 4.11 wörtlich" ausgegeben). Danach **9 von 9** Zitaten per Skript geprüft.
- **Material für den Referenzlauf liegt bereit** (`17e0038`, `21c4115`): `docs/artikel/` mit acht Fotos und **`preise.md`** (Preis je Zeile mit Quelle), dazu `docs/artikel/referenzangebote/` mit den **fünf Angeboten** (Texte, Preise, Bilder). Spanne 0–19,95 € ist Absicht. **Zwei Artikel der alten Liste existieren nicht mehr** im Best-Body-Shop.
- **NICHT GEBAUT:** Projekt A/B. Aktionen in die Wiedergabeliste zu legen ist **Renderer-Logik ohne IPC-Kanal** — ein Skript würde Drag-and-drop nachspielen, und dann müsste die 5-Minuten-Zusage meine Klickroutine messen, nicht einen Menschen. Der Aufbau gehört in den Referenzlauf.
- **10 Commits** vor `origin/main`, Arbeitsbaum sauber, **nicht gepusht** — Push nur auf Anweisung. Gate: Unit 5741/5741, Typecheck 0, Lint 0, Build 0.
- **Offen:** #469 (TK v3.62), #466 (Referenzlauf), #458 (überholt); 71 Dependabot-Findings; `einzel-instanz` (#289) flaky.

## STAND HEUTE (10.11.2026, sechsundfünfzigste Sitzung: Leitforderung L-01 — das Produktversprechen) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-10-leitforderung.md`](docs/agents/uebergabe-2026-11-10-leitforderung.md).**

- **AD v2.0** (`docs/Anforderungsdokument_Digital-Signage-Tool.md`): **L-01** in 1.1 — der Output muss **schneller, einfacher und qualitativ besser** sein als eine gute PowerPoint mit Masterfolie. Messlatte: ein Angebot **inklusive Designarbeit ≤ 5 min**; Änderung **≤ 1 min ohne Renderzeit**; **manuelle Varianten** (≥ 3 je Aktion, Wechsel ≤ 1 Klick); **3 Band-Spots + 2 Unterbrecher in 15 min**, ein MP4, keine Naht; **15–30 min pro Projekt**; der Stick darf **mehrere MP4s** enthalten. Ein Projekt bleibt **ein Video** (FA-01/4.9 unverändert).
- **FA-26 Varianten (Muss, neu):** 4.11; eine Variante ist eine benannte Kombination aus Look, Effekt-Satz und optional Bildausschnitt/Akzentfarbe, **manuell** gewählt.
- **Abnahme:** 12.1 (Referenzaufgabe, Stoppuhr, PowerPoint-Baseline) + **14 Heuristik-Bogen** (12 Kriterien, 0/1/2; Tool ≥ 20/24, PowerPoint ≤ 14/24; Gewinn bei Bewegung/Differenzierung, kein Verlust bei TV-Lesbarkeit/Markentreue). Bewertung: Niklas, optional Familie/Freunde, Bögen einzeln.
- **AD `.docx`** im selben Commit: **500 Absätze**, 0 Backticks, ein Bild, `unzip -t` heil. **TK noch v3.58** — die Umsetzung von L-01/FA-26 ist **nicht** ausgeschrieben; das ist der nächste Doku-Schritt.
- **NICHT GEBAUT / NICHT GEMESSEN:** FA-26 fehlt; der 5-min-Flow inkl. Designarbeit und die 1-min-Änderung sind unbelegt. **Die Treiber-Matrix (12/9/3) misst die alten FA, nicht L-01.**
- **ISSUES:** **#465** (TK v3.59: L-01/FA-26 — Entscheidungs-Issue, keine Signatur) und **#466** (PowerPoint-Baseline + L-01-Referenzlauf — Mess-Issue, keine Signatur). #466 verweist auf #465. **#458** bleibt offen und überholt.
- **Nächster Schritt:** #466 (PowerPoint-Baseline bauen/stoppen/bewerten), dann #465 (TK v3.59), dann Bau-Issues für FA-26 und den 5-/1-Minuten-Flow.
- **NICHT GEPUSHT:** **3 Commits** vor `origin/main` (`e37338a` FA-21, `e11c40d` AD v2.0, dieser Übergabe-Commit). **Push nur auf Anweisung.**

## STAND HEUTE (09.11.2026, fünfundfünfzigste Sitzung: Effekte — vom Bildplan bis zum gemessenen Video) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-09-effekte-render.md`](docs/agents/uebergabe-2026-11-09-effekte-render.md).**
**Vorgeschichte (54. Sitzung, vormittags): [`docs/agents/uebergabe-2026-11-09-effekte.md`](docs/agents/uebergabe-2026-11-09-effekte.md).**

**Auftrag:** Niklas, 06.11.: *„es gibt so tolle Effekte um Bilder so wirken zu lassen wie als würden sie sich bewegen"*. Am 09.11. entschieden: **Option B** (Ken Burns, Text-Einblendung, Preis-Pop) **plus** Glanz-Sweep, hochzählender Preis, Bild-Reveal, Puls, Zoom-Atmen, Drift, Parallax — **einzeln schaltbar**, nicht als Paket.

- **DOKU:** AD **v1.14** (neuer Abschnitt **4.10**, **FA-25**, Akzeptanzkriterium 11, Glossar) und TK **v3.55** (neuer Abschnitt **9.16** mit acht Unterabschnitten). Fundstellen mitgezogen: 9.2.2 (`RenderItemSegment` trägt `png` **oder** `bildplan`), 9.8.2 (`Aktion.effekte`), 9.9.2, Modulübersicht, Stand der Verträge. `.docx` beider Dokumente im selben Commit neu erzeugt (AD 420 Absätze, TK 2653, 0 Backticks, TK mit DFD).
- **GEBAUT UND GESCHLOSSEN: #459–#463.**
  - **#459** `src/shared/effekte.ts` + `Aktion.effekte` — 29 Tests.
  - **#460** `src/shared/bildplan.ts` — 11 Tests. 10-s-Segment = **60 gezeichnete Frames** statt 300.
  - **#461** `zeichneSegment(..., zustand?)`; Zonen rechnen ihre eigenen Werte. Ohne Zustand **exakt** der alte Weg.
  - **#462** Vorschau in `requestAnimationFrame`, `preview-player` mit `bild`.
  - **#463** Gruppe „Effekte" im Inspector; `unterschiede` vergleicht **inhaltlich**.
- **FENSTERBELEG (`16439ec`, `scripts/beleg-effekt.mjs`):** `{"vorherGleich":true,"nachherGleich":false,"groesse":53751}` — **ohne** Effekt sind zwei Aufnahmen im Abstand von 0,5 s byte-gleich, **mit** „Zoom-Atmen" nicht. Die Gegenprobe ist der Kern.
- **#464 GEBAUT UND VERDRAHTET (`1e23754`, `7b19f03`):** `RenderItemSegment` trägt `png` **oder** `bildplan`; `bildfolge.ts` verkettet bildgenau (je Frame ein Eingang, je Lauf `concat` + `loop`, final `setpts=N/FRAME_RATE/TB`). **Der Renderer erzeugt den Plan**: `render-ausloesen.ts` zeichnet je **eindeutigem** Frame mit `effektZustand` — 10 s mit Schleife = **60 Zeichenvorgänge statt 300**. Beleg am echten Fenster (`scripts/beleg-effekt-render.mjs`): mit „Preis zählt" **300 Bilder, 10,02 s**, Preiszone Bild 0 vs. 30 = **2122 abweichende Bytes**; ohne Effekt **300 Bilder, 10,02 s, 2 Bytes** (Kodierrauschen). Integrationstest `bildfolge-echt`: 300 Bilder / 10,000 s; Gegenprobe ohne `setpts` **243**.
- **DoD-Abweichung, gemeldet:** `render-reel.ts` (sechste Produktivdatei) musste die Plan-Pfade durchreichen, sonst wäre der Weg unerreichbar.
- **BEFUND, BEHOBEN (09.11.2026):** Eine Aktion **mit Motiv** (`bildRef`) scheiterte an `alsPng` mit *„Tainted canvases may not be exported"* — das `<img>` lud `media://` direkt (`bild-laden.ts`). Das traf **jeden** Render mit Bildmotiv, nicht nur Effekte. **Behoben:** `bild-laden.ts` holt die Bytes jetzt über `mediaBlobUrl` (`gemeinsam/media-blob-url.ts`, #364) und bindet eine **Objekt-URL**; Blob-URLs sind same-origin und tainen nicht. **Beleg am Fenster:** mit „Zoom-Atmen" + Motiv **300 Bilder / 10,02 s**, Bildmitte Bild 0 vs. 30 = **14972** abweichende Bytes; ohne Effekt **0**. **Gegenprobe:** direktes `media://` im `<img>` → Render wird mit genau dieser Meldung abgelehnt; byte-identisch zurück (SHA-256 `ccccd824…`). TK **v3.56** (9.10.8 + 9.5.7-Bezug), `.docx` 2654 Absätze, 0 Backticks, zwei Bilder.
- **BEFUND, entschieden:** Die Zone `hintergrund` ist in **allen acht** Vorlagen eine Farbfläche — ein Zoom darauf wäre unsichtbar, Parallax hätte keine zweite Ebene. **Deshalb wirken Zoom-Atmen, Drift und Parallax auf das MOTIV**; Parallax nimmt die Hintergrundfläche als Gegenspieler (0,6×). AD 4.10 / TK 9.16.2 korrigiert und committet (`a423bb4`).
- **FA-25 IST GEMESSEN (Treiber-Schritt 4s, 09.11.2026):** Über die echte Oberfläche eine Aktion mit „Preis zählt" angelegt, an die Abspielmarke gelegt und **zweimal** gerendert. Mit und ohne Effekt **je 2100 Bilder / 70,022 s** (Dauer unverändert); Preiszone Bild 30 vs. 60: **2109** abweichende Bytes mit Effekt, **1 Byte** ohne. Die Matrix führt FA-25 als **gemessen** (12 gemessen, 0 Lücken).
- **BEFUND, BEHOBEN (vom Treiber aufgedeckt):** `Aktion.effekte` wurde im **`project-store` verworfen** — weder `erstelle-aktion.ts` noch `bearbeite-aktion.ts` übernahmen das Feld. Effekte ließen sich über die Oberfläche also **nie speichern**; nur das Beleg-Skript kam direkt an `project.json` vorbei. Beide Stellen übernehmen und normalisieren den Satz jetzt (Fenster auf `standardDauer ?? 10`, wie der Editor); 6 neue Tests. **Zweiter Befund (Treiberwerkzeug):** die Instrumentierung speicherte die volle `queue:geaendert`-Nutzlast (jeder RenderRequest mit allen PNGs) — nach zwei 70-s-Renders **292 MB** über CDP (`Too large write data is pending`), die Verbindung riss ab. Jetzt wird nur der Kanalname gespeichert.
- **GATE:** Typecheck 0, Lint 0, Build 0, Unit **5718/5718**, Integration 54/54, Treiber **0 Befunde**. `einzel-instanz` (#289) flaky. (Stand vor dem Komponententest; danach **5741/5741**, siehe nächste Zeilen.)
- **KOMPONENTENTEST NACHGEZOGEN (09.11.2026):** `tests/unit/effekt-gruppe.spec.ts` — **15 Fälle** in jsdom: zehn Einzelschalter (kein Effekt bringt einen anderen mit), Vorgaben beim Einschalten, Normalisierung (Stärke 0–100, Fenster 0,3–3 s, Segmentende, Stärke 0 = AUS), Hinweise ohne Preis/Bild. Drei Gegenproben, jede rot und byte-identisch zurück (SHA-256 `874e2267…`); **Unit 5734/5734** (373 Dateien).
- **FA-21 NACHGEZOGEN (09.11.2026):** Der Vorlagen-Editor hatte die Undo-Logik, aber **keinen Aufrufer** — `undo-vorlage.ts`/`baueVorlagenUndoZugang` wurden nur von Tests importiert, die Pfeile waren im Vorlagen-Bereich abgeschaltet, Cmd+Z lief fest auf das Projekt. Jetzt wählt die Shell den **wirksamen Bereich** (offene Ansicht vor Reiter); Pfeile und Cmd/Strg+Z laufen über `UndoPfeile` und nehmen im Vorlagen-Editor die Arbeitskopie zurück bzw. stellen sie wieder her. **11 Unit-Fälle** (7 für Pfeile/Tastatur, 4 für den wirksamen Bereich); Treiber-Schritt **4n** misst Zone → Undo-Pfeil → Shift+Cmd+Z ohne Befund. TK **v3.58** (9.14.2), `.docx` 2654 Absätze, 0 Backticks, zwei Bilder. **Unit 5741/5741**, Integration 54/54, Treiber **0 Befunde**.
- **ENTSCHIEDEN (Niklas, 09.11.2026: „ja dann a"): AD gewinnt.** Fenster sind ab **0,3 s** möglich (`EFFEKT_GRENZEN.fensterSekunden.min`); die vier Vorgaben 0,33 s (Preis-Pop), 0,4 s (Text), 0,5 s (Reveal) und 0,6 s (Glanz) gelten wörtlich. TK **v3.57** (9.16.7), `.docx` 2654 Absätze, 0 Backticks, zwei Bilder. **Unit 5734/5734**, Integration 54/54, Build 0. Gegenproben: min zurück auf 1 s → 4 Tests rot; Preis-Pop-Vorgabe 1 s → 1 Test rot; beide byte-identisch zurück (`425a760a…` / `d066fa41…`).
- **EHRLICH OFFEN:** 71 Dependabot-Findings (33 high, 25 moderate, 13 low); `einzel-instanz` (#289) flaky. `bereitschaft.py`: **0 UNKLAR** — geschlossene Issues zählen unabhängig von der Dateizeile als gebaut. #458 (Effekt-Entscheidung) ist noch offen und überholt — die Entscheidung ist mit #459–#464 gebaut.
- **NICHT GEPUSHT:** **1 Commit** vor `origin/main` (FA-21); die 28 Commits davor wurden am 09.11.2026 gepusht (`1569d36..1764274`). Mit `git log --oneline origin/main..HEAD` zählen. **Push nur auf Anweisung.**

## STAND HEUTE (06.11.2026, dreiundfünfzigste Sitzung: Die Zeitleiste zeigt Aktions-Motive, Auto-Scroll beim Ziehen)

**Volltext: [`docs/agents/uebergabe-2026-11-06-zeitleiste.md`](docs/agents/uebergabe-2026-11-06-zeitleiste.md).**

- **AUFTRAG (Niklas, 06.11.2026):** *„im projekteditor die aktionen in der frameleiste sein"* +
  *„beim drag and drop muss die zeileiste automatisch scrollable sein"*. Nach der Rückfrage:
  *„die aktionen sind schon in der leiste ... nur als lila boxen"*.
- **MOTIV:** Eigene Aktions-Blöcke und Unterbrechungen in der Zeitleiste zeigen jetzt das
  **gezeichnete Motiv** (`holeMotiv`, dieselbe Quelle wie die Bibliothek) statt einer Farbfläche.
  `object-fit: cover`, dunkler Verlauf für die Beschriftung, **lokales** Canvas (dieselbe Aktion
  kann in mehreren Blöcken stehen). Fehlt Vorlage/Marke, bleibt die Farbfläche. **Kein neues Feld,
  kein Schreibweg.**
- **AUTO-SCROLL:** `composer/zeit-autoscroll.ts` (rein, 7 Tests), Lauf über `useDndMonitor` +
  `requestAnimationFrame`; die **Kante der Zeitleiste** ist der Auslöser, nicht die Fensterkante.
  Fensterprobe (20:42): `scrollLeft` **0 → 140 → 3470** in 1,2 s (Bibliotheks-Zug); ohne die eigene
  Schreibzeile **2112 px** (dnd-kit allein). **Auch der eigene Unterbrechungs-Zug** (lila Aktions-
  Kästen, kein dnd-kit) scrollt: **0 → 28 → 1008**; der Versatz enthält den **Scroll-Weg**
  (`pointerDelta + scrollDelta`), sonst landete der Kasten an der alten Zeit.
- **GEGENPROBEN:** 4, jede rot und byte-identisch zurück (Regel immer 0 → 3 Tests; Motiv entfernt →
  Test; `scrollLeft` im dnd-kit-Lauf entfernt → Fensterprobe 2112 px; lokales Scrollen im
  Unterbrechungs-Zug entfernt → Fensterprobe 0 px).
- **GATE:** Typecheck 0, Lint 0, Build 0, Unit **5625/5625** (368), Integration 51/51, Treiber
  **0 Befunde** (1 Untersuchung: Mehrfachauswahl; 1 MANUELL: Export-Dialog).
- **DOKU:** TK **v3.54** (9.7.8), `.docx` **2541 Absätze**, `unzip -t` heil, 0 Backticks. AD v1.13
  unverändert.
- **Ehrlich offen:** Das Motiv ist bei 8 px/s klein (eine 10-s-Box ist 80 px breit, sichtbar ist der
  linke Teil); dnd-kit scrollt weiter mit (die Summe ist gemessen); kein Treiber-Schritt für die
  neuen Dinge (Unit + zwei Fensterproben + Sichtvergleich).
- **NACHTRAG (Niklas, 06.11.2026): Der Drop neben der Zeitleiste bleibt.** *„das sollst ganz normal
  einfügen weil die aktionen sind teil des videos"* — eingefügt wird **auf** der Zeitleiste (auch
  zwischen zwei Blöcken), und auch ein Loslassen **daneben** fügt am nächstgelegenen Ziel ein. Der
  frühere Nebenbefund ist damit **kein Fehler**: kein Bau, kein Sonderfall, TK/AD unverändert.
- **Nicht gepusht:** **6 Commits** vor `origin/main` **vor** diesem Übergabe-Commit (`d02e56b`,
  `73691fe`, `4f53b24`, `07da2a6`, `0e94615`, `f70b6e0`); mit diesem Commit **7**. Die Zahl wächst
  mit jedem Doku-Commit — mit `git log --oneline origin/main..HEAD` zählen. **Push nur auf
  Anweisung.**

## STAND HEUTE (05.11.2026, zweiundfünfzigste Sitzung: Kontrolle statt Formular — Zonen-Gestaltung, Bildausschnitt, sechs Looks, danach Nacharbeit an der Seitenleiste) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-05-zonen-gestaltung.md`](docs/agents/uebergabe-2026-11-05-zonen-gestaltung.md).**

- **AUFTRAG (Niklas, Sitzungsende der 51.):** *„man hat momentan einfach keine kontrolle"* +
  *„es fehlen noch mehr richtig krasse vorlagen"*, dazu *„mach bitte alles davon in der session
  größtenteils selbständig"*. **Alle vier Pakete der offenen Liste sind gebaut.**
- **NEUES DATENMODELL (TK v3.48, 9.8.2/9.8.8):** `Aktion.zonenGestaltung?` (Record, Schlüssel =
  `Zone.id`; `textfarbe`, `flaechefarbe`, `groesseProzent` 50–200, `ausrichtung`) und
  `Aktion.bildAusschnitt?` (`zoom` 100–300, `versatzX`/`versatzY` ±50 %). Beide **optional** —
  fehlt ein Wert, gilt die Vorlage. Grenzen und Normalisierung in **`shared/gestaltung.ts`**
  (eine Quelle für Main, Editor, Zeichnen).
- **ZEICHNEN:** `loeseFarbeInZone` (Reihenfolge **Zonenfarbe → Akzentfarbe → Marke**; gilt NUR für
  die Rolle, die die Zone selbst trägt — Flächenwahl färbt nicht die Schrift); Größe skaliert
  `größeMax` UND `größeMin`; Bildausschnitt beschneidet an der Zonengrenze, ohne eigene
  Einstellung bleibt der alte Weg unverändert.
- **EDITOR:** neuer Schritt **„Zonen"** (`zonen-gestaltung.tsx`), Bildausschnitt im Schritt
  **„Bild"** (`bild-ausschnitt.tsx`). Alles in den Entwurf, ein Schreibvorgang beim Abschluss;
  `unterschiede` vergleicht die verschachtelten Felder inhaltlich.
- **SECHS LOOKS:** `riesig`, `farbband`, `zentriert`, `ecke`, `kopf-fuss`, `grosser-preis` —
  ganz aus dem bestehenden Zonen-Modell. Folge: `flaecheSehrDunkel` und `textSekundaer` werden jetzt
  von eingebauten Vorlagen benutzt; ihre Rollen-Sätze waren falsch und sind korrigiert.
- **VERHALTEN GEAENDERT, offen benannt:** Nach einer `.bak`-Rettung wird **nicht** geschrieben, nur
  weil eingebaute Vorlagen fehlen — die defekte Datei bleibt liegen (9.12.1). Vorher überschrieb
  das Ergänzen die defekte Datei.
- **GEGENPROBEN:** 4, jede rot und **byte-identisch** zurückgenommen (SHA-256 vorher = nachher).
- **FENSTER-BELEG (`4g7`):** `{"zonenAnzahl":5,"textfarben":4,"flaechen":5,"groessenRegler":4,
  "zoomTyp":"range","vorlagenKacheln":8}`.
- **Gate:** Typecheck 0 (auch tests), ESLint/oxlint 0, Build 0, Unit **5573/5573** (366),
  Integration **51/51** (13), Treiber **0 Befunde** (1 Untersuchung: Mehrfachauswahl; 1 MANUELL:
  Export-Dialog).
- **Doku:** TK **v3.48** (9.8.2/9.8.8/9.10.9/9.11.1), `.docx` im selben Commit neu erzeugt
  (2388 Absätze, `unzip -t`, 0 Backticks). AD unverändert v1.13 (keine Anforderungsänderung).
- **Ehrlich offen:** senkrechte Ausrichtung nicht, kein eigener Bildrahmen; die sechs Looks sind
  **nicht am Fernseher** geprüft. `einzel-instanz` (#289) flaky. Der Scrim ist seit v3.53 in zwei
  Stopps einstellbar (9.8.10) — die frühere Lücke ist damit zu.
- **NACHARBEIT (Niklas, 05.11.2026, gleiche Sitzung):** *„die anordnung in der seitenleiste ist
  scheiße … was zusammen gehört muss zusammen gruppiert werden"*, *„warum kann man nach links und
  rechts scrollen"*, *„die farbauswahl objektunabhängig … objekte haben die unabhängige
  farbauswahl"*, *„die bildausschnitt regler können komische effekte auf das logo haben"*.
  **Alles vier ist gebaut (TK v3.49, 9.8.9):**
  - **Gruppiert:** fünf Gruppen; „Akzentfarbe" und „Zonen" sind **eine** Gruppe **„Gestaltung"** —
    oben „Alle Objekte" (Akzent), darunter je Objekt Farbe/Größe/Ausrichtung.
  - **Vorlagen-Galerie** ist eine zugeklappte Gruppe mit dem Namen in der Kopfzeile: **offen beim
    Anlegen**, **zu beim Bearbeiten** (sie war höher als der ganze Inspector).
  - **EIN Farbwähler** (`action-editor/farb-wahl.tsx`) für Akzent **und** jede Zone: Farbfeld,
    Markenpalette, „Zuletzt verwendet", „Markenwert" — die **Werte bleiben je Objekt**.
  - **Bildausschnitt trifft nur `bindung === 'bild'`** — das **Logo** wurde vorher mitgezoomt und
    beschnitten (echter Fehler).
  - **Kein Querscrollen:** `overflowX: 'hidden'`, `minWidth: 0`; der Treiber misst `formularQuer`
    (gemessen **0**). Inspector-Höhe 2124 → **1559 px**.
  - **Gate:** Unit **5579/5579**, Integration **51/51**, Treiber **0 Befunde**. TK **v3.49**,
    `.docx` 2420 Absätze, 0 Backticks. Zwei Gegenproben (Logo-Ausschnitt, Akzent in der Gruppe),
    jede rot und byte-identisch zurückgenommen.
- **NACHARBEIT 2 (Niklas, 05.11.2026, gleiche Sitzung):** Schriftarten-Auswahl fehlte, die zwei
  Prozent-Regler des Bildausschnitts waren unbrauchbar, Palette und Farbfeld sollten **zusammen** in
  einem Popup stehen, abgeschnittener Text störte. **Alles gebaut (TK v3.50, 9.8.9):**
  - **Schriftart je Objekt:** `zonenGestaltung.schriftRolle` (eine der vier Marken-Rollen; ROLLEN-Verweis,
    nie ein Font-Name). Feld steht bei den Textzonen.
  - **Farb-Popup:** Farbfeld, Markenpalette, „Zuletzt verwendet" und „Markenwert" **gleichzeitig** in
    einem Popup; am Fenster gehalten (stand vorher unter dem Bildschirm: y 920 → 683).
  - **Richtungsfeld statt Regler:** Zoom-Regler + 3×3-Pfeile („Bild verschieben"); ohne Zoom
    **gesperrt** mit Hinweis. Ein Pfeil setzt beide Achsen (−50/0/+50 %).
  - **Umbruch statt Abschneiden:** Aktionsname (Streifen + Bibliothek), Statistik, Dateiname,
    Zonenname, Farbzeile. Ausnahme: Zeitachse (Clipbreite ist die Aussage).
  - **Gate:** Unit **5590/5590**, Integration 51/51, Treiber 0 Befunde (`formularQuer 0`), TK **v3.50**,
    `.docx` 2444 Absätze, 0 Backticks. Zwei Gegenproben (Schriftart, Richtungsfeld), beide rot und
    byte-identisch zurückgenommen.
- **NACHARBEIT 3 (Niklas, 05.11.2026):** *„jz fehlt nur noch die freie farbwahl in dem popup"*.
  Im Popup steht unter **„Freie Farbe"** neben dem Farbfeld ein **Hex-Feld** (versteht `#RRGGBB`,
  `RRGGBB`, `#RGB`; normalisiert auf `#RRGGBB`). Ein unbrauchbarer Wert ändert **nichts** — das Feld
  springt zurück und sagt „Ungültig – erwartet wird #RRGGBB." Farbnamen werden nicht angenommen
  (zweiter Farbraum neben `farben.ts`). **TK v3.51**, `.docx` 2454 Absätze, Unit **5594/5594**,
  Treiber `hexFeld: true`. Gegenprobe: Hex-Übernahme entfernt → 2 Tests rot, byte-identisch zurück.
- **NACHARBEIT 4 (Niklas, 05.11.2026):** *„es ist nicht klar dass man eine freie farbe auswählen kann
  außer du kannst hex values"*. Ein Farbkästchen ist keine sichtbare Einladung. Im Popup steht jetzt
  ein **beschrifteter Knopf „Farbe wählen …"** (öffnet den System-Farbwähler), darunter
  **„oder Wert"** mit dem Hex-Feld. **TK v3.52**, `.docx` 2458 Absätze, Unit **5595/5595**,
  Treiber `freiKnopf: true`.
- **SCRIM (Niklas, 05.11.2026: „mach scrim") — GEBAUT (TK v3.53, 9.8.10):** Die Abdunkelung ist
  je Zone in **zwei Stopps** einstellbar — Farbe (`#RRGGBB`) **und** Deckkraft (0–100 %) je Stopp.
  Neues Feld `ZonenGestaltung.scrim?: ScrimGestaltung` (`vonFarbe`, `vonDeckkraft`, `bisFarbe`,
  `bisDeckkraft`); `scrimStart` = erster, `scrimEnde` = zweiter Stopp, eine **deckende** Abdunkelung
  (`scrimEnde` als Fläche, Look „Zentriert") nimmt die `bis`-Werte. Ohne Angabe gilt die Marke —
  Farbe und Alpha getrennt, `#B00B00B3` zeigt also **70 %**, nicht 100 %. `loeseFarbe` bekam den
  **optionalen vierten Parameter `zone`**; `loeseFarbeInZone` reicht ihn durch, damit Füllung **und**
  beide Verlaufs-Stopps denselben Weg nehmen. Editor: je Scrim-Zone „Anfang"/„Ende" mit Farbwähler
  und Deckkraft-Regler; der gewöhnliche Flächen-Regler entfällt dort. Grenzen in
  `shared/gestaltung.ts` (`GESTALTUNG_GRENZEN.deckkraft`, 8-stellige Zonenfarben fallen weg).
  Werkzeug `scripts/schau.mjs` nachgezogen: `--gestaltung` scrollt zum Schritt, und ohne gemerktes
  Projekt öffnet es die **erste** Projektzeile (vorher brach es bei `aktivesProjektId = null` ab).
  **Doku-Befund:** Die alte TK-`.docx` trug nur `logo.png` (197 KB); das `<svg>`-DFD-Bild fehlte —
  sie war ohne `--dfd` erzeugt. Neu mit `--dfd`: **2498 Absätze, zwei Bilder** (Logo + DFD, 221 KB).
- **GEGENPROBEN:** 3, jede rot und **byte-identisch** zurückgenommen (SHA-256 vorher = nachher):
  Deckkraft ignoriert → 3 Tests rot; Zone nicht an den Verlauf gereicht → Naht-Test rot;
  Scrim-Zeile aus dem Inspector gefiltert → 4 UI-Tests rot.
- **FENSTER-BELEG (`4g7`, 1440 × 900):** `{"zonenAnzahl":6,"textfarben":4,"flaechen":3,
  "groessenRegler":4,"schriftarten":4,"scrimFarben":2,"scrimDeckkraft":2,"zoomTyp":"range",
  "vorlagenKacheln":8,"formularQuer":0}` — beide Stopps sind am echten Inspector bedienbar.
- **BEFUND „PowerPoint" (Niklas, 05.11.2026: „das ding ist es sieht immer noch wie eine langweilige
  powerpoint aus"):** Am Bild geprüft — das **Beispielbild ist das erste Projekt-Asset**, hier ein
  **macOS-Systemeinstellungen-Screenshot** (512 × 599), kein Foto. Damit sieht jede Vorlage wie eine
  Folie aus. Dazu kommt die Grammatik der Looks: Textblock + Pillen + Rand, sechs Varianten derselben
  Grammatik; und die Vorschau ist ein **Standbild** eines Videos. **Mehr Regler lösen das nicht.**
  Vorschlag: (1) Beispielmotiv darf kein beliebiges Asset sein, (2) ein Look, der die Grammatik
  bricht (Überlappung/Beschnitt), (3) Bewegung. **Kein Bau ohne Entscheidung.**
- **EFFEKTE SIND EIN ISSUE:** **#458** (`braucht-entscheidung`, `risiko:pixelgleichheit`) —
  Entscheidungs-Issue, **keine Signatur**: AD/TK haben keinen Effekt-Abschnitt; Option A (keine),
  B (drei Effekte: Ken Burns, Text-Einblendung, Preis-Pop; empfohlen), C (Bibliothek, verworfen).
  Verworfen bleiben Band-Effekte und Übergänge (harter Schnitt, deckendes Band).
- **GEPUSHT (Niklas, 05.11.2026: „pushen und dann übergabe"):** `ca99b6f..a8e0359` nach
  `origin/main`, **65 Commits** in einem Zug. `git log --oneline origin/main..HEAD` steht danach auf
  **0**. Der Push meldete nebenbei **71 Dependabot-Findings** im Repository (33 high, 25 moderate,
  13 low) — unabhängig von dieser Arbeit, nicht angefasst.
- **Arbeitsbaum sauber.** Der Stand dieser Zeile ist der gepushte Stand.

## STAND HEUTE (05.11.2026, einundfünfzigste Sitzung: „Ergebnis zuerst" — der Editor zeigt ein Beispiel, der Titel steht im Inhalt) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-05-ergebnis-zuerst.md`](docs/agents/uebergabe-2026-11-05-ergebnis-zuerst.md).**

- **AUFTRAG (Niklas, 05.11.2026):** *„es ist unklar was möglich ist […] man hat zu wenig einfluss
  […] ein fertiges formular für eine langweilige powerpoint folie statt eine beeindruckende
  wirksame werbung."* Schritt 1 ist gebaut: **man sieht, was möglich ist.**
- **BEISPIELINHALT (`action-editor/beispiel-inhalt.ts`, neu):** Leere Felder werden **nur für die
  Vorschau** gefüllt (Titel, Beschreibung, Preis, Knopf); im Modus „neu" dazu das **erste nutzbare
  Projektbild**. Der Entwurf bleibt unberührt, das Beispiel wird **nie gespeichert**; „– kein
  Bild –" nimmt das Beispielbild zurück. Hinweis über dem Canvas; **Vorlagen-Kacheln** zeichnen
  dasselbe Ergebnis statt einer leeren Fläche.
- **TITEL** steht jetzt als erstes Feld in **„Inhalt"** (Kopfleiste nur Rückweg/Abschluss); die
  fünf Schritte tragen **keine Nummern** mehr, die Felder haben Beispiel-Platzhalter.
- **„FERTIG & INS VIDEO" IST ENTFALLEN:** zweiter Abschluss, `gemeinsam/aktion-ins-video.ts` und
  der Composer-Zuhörer sind gelöscht. Der Editor legt nur an; platziert wird per Drag oder
  „Ins Video". **Treiber `4g9` neu:** `{"zweiterKnopf":false,"aktion":true,"aktionen":"2 -> 3",
  "unterbrechungen":"0 -> 0","ansichtZu":true,"dauerMs":4044}`.
- **FENSTER-BELEG:** `{"beispielHinweis":true,"titelImFormular":true,"titelImKopf":false,
  "insVideoKnopf":false,"bildBeispiel":true,"vorlagenBilder":2,"canvas":950×534}`.
- **FARBAUSWAHL (Nachtrag 05.11.2026):** Unter dem freien Farbwähler steht die **Markenpalette**
  (13 Rollen, doppelte Hex-Werte als EIN Swatch, 8-stellige Scrim-Werte fallen heraus → 10) und
  **„Zuletzt verwendet"** mit den letzten **20** Farben. Die Historie liegt app-weit in `config.json`
  (`uiVoreinstellungen['action-editor.letzteFarben']`) — UI-Voreinstellung, kein
  Projekt-Schreibweg. Fenster: `markenFarben 10`, Klick auf „Akzent kräftig" → `#df3131`,
  Historie `["#DF3131"]`. **Treiber `4g7`** misst Palette + „Zuletzt verwendet". Tests:
  `letzte-farben.spec.ts` (7) + 3 UI-Fälle.
  **Offen:** Die Farbe wirkt nur als **Akzentfarbe** (Preis-Pille/Knopf); **Pro-Zone-Farben** fehlen.
- **Gegenproben:** 3, jede rot und byte-identisch zurückgenommen (Prüfsumme `3c1736c1…`). **Eine
  blieb zuerst grün**, weil der Test den letzten statt des ersten Zeichenaufrufs prüfte (Kachel
  statt Bühne) — Test geschärft, danach rot. **Lehre: eine grüne Probe sagt etwas über den Test.**
- **Doku:** TK **v3.46** (9.8.7 neu; 9.8.1/9.8.6 mit Nachtrag abgelöst), `.docx` im selben Commit
  neu erzeugt (2235 Absätze, `unzip -t`, 0 Backticks). `treiber-matrix.md` FA-02/`4g9` nachgezogen.
- **Gate:** Typecheck 0 (auch tests), ESLint/oxlint 0, Build 0, Unit **5511/5511** (365),
  Integration **51/51** (13), Treiber **0 Befunde** (1 Untersuchung: Mehrfachauswahl; 1 MANUELL:
  Export-Dialog). Treiber `4g7`: `{"markenFarben":10,"letzteFarben":true}`.
- **NÄCHSTER PUNKT (Niklas, Sitzungsende 05.11.2026):** *„man hat momentan einfach keine
  kontrolle"* + *„es fehlen noch mehr richtig krasse vorlagen"*. **Nichts davon ist gebaut.**
  Vier Pakete, **Reihenfolge nicht entschieden:** (1) **4–6 neue Vorlagen** (neue eingebaute
  Ganzbild-Looks), (2) **Pro-Zone-Farben** (Text/Fläche/Akzent/Scrim je Aktion — neues
  `Aktion`-Feld + Auflösung vor der Marke), (3) **Textgröße/Ausrichtung je Zone**, (4)
  **Bildausschnitt/Zoom**. Empfehlung: 1, dann 2+3, dann 4; Effekte bleiben geparkt. **Warum nur
  der Preis:** Die Vorlage entscheidet, welche Zonen `akzent` nutzen; Text/Fläche/Knopf kommen aus
  der Marke — das ist das Modell, keine UI-Lücke.
- **Ehrlich offen:** Das Beispielmotiv ist das erste Projektbild; ohne Bilder bleibt die Vorschau
  textlich. Die Beispieltexte sind Fitnessworld24-nah und änderbar.
- **Nicht gepusht** — Zahl mit `git log --oneline origin/main..HEAD` zählen.
  **Push nur auf Anweisung.**

## STAND HEUTE (05.11.2026, fünfzigste Sitzung: der Bild-Import kommt im offenen Aktions-Editor an) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-05-bild-import.md`](docs/agents/uebergabe-2026-11-05-bild-import.md).**

- **BEFUND (Niklas, 05.11.2026: „bilder gehen bei aktionen nicht"):** Auswahl, Vorschau und
  Speichern eines Bildes waren heil (an der gebauten App gemessen). Der Fehler lag davor:
  **„Bild importieren" im offenen Editor** ließ die Bildliste stehen — `project.json` hatte nach
  dem Import 5 Assets, die Liste weiter 4 Einträge. Ursache: Der Aktions-Editor abonnierte
  `projekt.aufGeaendert` **nicht** (der Vorlagen-Editor tut es).
- **BEHOBEN:** Projekt-Abo in `action-editor/index.tsx` (Zähler → Neu-Rendern; gelesen wird
  ohnehin frisch aus `hole()`) und eine **sichtbare Import-Rückmeldung** am Bild-Schritt
  („1 Bild wird importiert … erscheint gleich", „Kein Bild gewählt", Fehler; Knopf gesperrt).
- **FENSTER-BELEG:** vorher `Liste 4 | Assets 5`; nachher `Liste 5 (probe-neu.jpeg) | Assets 5`.
  Mit einer Kopie des Projekts gemessen, `config.json` zurückgesetzt, Kopie gelöscht.
- **Tests:** drei neue Fälle in `action-editor-neue-aktion.spec.ts`; der Projektzugang im Test
  ist jetzt ein kleiner Speicher mit `aufGeaendert`. **Zwei Gegenproben**, jede rot und
  byte-identisch zurückgenommen (Prüfsumme `95bcfec4…`).
- **Gate:** Typecheck 0 (auch tests), ESLint/oxlint 0, Build 0, Unit **5495/5495** (364),
  Integration **51/51** (13), Treiber **0 Befunde** (1 Untersuchung: Mehrfachauswahl;
  1 MANUELL: Export-Dialog).
- **NÄCHSTER PUNKT (Niklas, 05.11.2026, noch NICHT gebaut):** *„der aktionseditor ist nicht
  selbsterklärend genug und man versteht das potential von dem was man machen könnte nicht. es
  sieht einfach aus wie eine langweilige powerpoint folie"*. Das ist ein Gestaltungsauftrag —
  was der Editor zeigen muss, ist **nicht entschieden**; als Nächstes eine Skizze/Frage, kein Bau.
- **Nicht gepusht** — Zahl mit `git log --oneline origin/main..HEAD` zählen.
  **Push nur auf Anweisung.**

## STAND HEUTE (04.11.2026, neunundvierzigste Sitzung: der Aktions-Editor ist umgebaut — ein Speichermodell, Bildstreifen, „Fertig & ins Video") – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-04-aktionseditor.md`](docs/agents/uebergabe-2026-11-04-aktionseditor.md).**

- **AUFTRAG (Niklas):** *„der aktionseditor muss stark überarbeitet werden. und allgemein der gesamte
  core flow"*. Drei Entscheidungen, alle bestätigt: **ein Speichermodell**, **Bildstreifen**,
  **„Fertig & ins Video"**.
- **AUFBAU:** Kopfleiste (Zurück · **Titel** · Abschluss), **Bildstreifen 108 px** mit dem
  gezeichneten Motiv je Aktion, **Inspector 340 px** mit fünf Schritten (Vorlage, Inhalt, Bild,
  Farbe, Dauer — Vorlagen-Kacheln zu zweit). Die zweite Leiste in `App.tsx` ist **weg**.
- **EIN SPEICHERMODELL:** `entwurf` ist die einzige Wahrheit, jedes Feld schreibt **ohne IPC** in den
  Entwurf, die Vorschau zeichnet den **Entwurf**. Geschrieben wird **einmal** je Vorgang — beim
  Abschluss, beim Wechsel und beim Verlassen der Ansicht (`action-editor/aktions-entwurf.ts`).
  Ohne Änderung wird **nicht** geschrieben. **Ein Undo-Schritt je Bearbeitung.**
- **RÜCKWEG VON AUSSEN:** Reiterklick und Ansichtswechsel schließen die Ansicht von `rahmen.tsx`
  aus. Der Editor meldet dafür einen **Wächter** an (`setzeSchliessenWaechter` in
  `gemeinsam/aktionen-ansicht.ts`) — er schreibt erst, dann schließt er; scheitert das Schreiben,
  bleibt die Ansicht offen mit Meldung. **Kein stiller Verlust.**
- **„FERTIG & INS VIDEO":** Der Editor **platziert nicht selbst**, er stellt einen Auftrag in
  `gemeinsam/aktion-ins-video.ts`; der Composer führt ihn über `fuegeAktionInsVideo` aus
  (Ganzbild → Unterbrechung an der Abspielmarke). **Ablösung, offen benannt:** TK 9.8.1 sagte
  „platziert **nicht** in die Liste" — der Nachtrag steht in 9.8.6, der Editor beauftragt nur.
- **ENTFALLEN:** `weiseBildZu`/`entferneBild` (Prüfung als `pruefeBildWahl`), die Leiste in
  `App.tsx`, der Feld-für-Feld-Schreibweg. Das Motiv-Modul zog nach `gemeinsam/aktions-motiv.ts`
  (der Editor darf den Composer nicht importieren).
- **FENSTER-BELEG (neu, `4g9`):** `{"geklickt":true,"aktion":true,"unterbrechungen":"0 -> 1",
  "ansichtZu":true,"dauerMs":4273}` — zweiter Abschluss schreibt und platziert. `4g` misst jetzt,
  dass „Anlegen" die Ansicht **selbst** schließt (Titel nach 4019 ms); `4g3` schreibt über „Fertig".
- **Gate:** Typecheck 0 (auch tests), ESLint/oxlint 0, Build 0, Unit **5492/5492** (365 Dateien),
  Integration **51/51** (13), Treiber **0 Befunde** (1 Untersuchung: Mehrfachauswahl; 1 MANUELL:
  Export-Dialog).
- **Doku:** TK **v3.45** (9.8.6 neu, 9.5.6-Nachtrag zum Start), `.docx` im selben Commit neu erzeugt
  (2209 Absätze, `unzip -t`, 0 Backticks). `treiber-matrix.md` FA-02 um `4g9` ergänzt. AD unverändert v1.13.
- **BEFUND BEHOBEN — das gemerkte Projekt öffnete nicht (FA-15):** Der Main öffnete es,
  `bootstrap.ts` gab es über `setzeProjekt` weiter, und `composer/projektzustand.ts` **wies das ab**
  („setzeProjekt ohne geladenes Projekt"). Jetzt übernimmt der Bootstrap es über
  **`uebernimmGeoeffnetesProjekt`** — ein benannter Weg für „der Main hat geöffnet und aufgeräumt";
  die Sperre auf `setzeProjekt` bleibt. **Der Unit-Test war grün, weil sein Doppel jede Eingabe
  annahm** — jetzt gegen den echten Store geprüft (`projektzustand.spec.ts`, 2 Fälle).
- **Werkzeug `scripts/schau.mjs` (neu):** startet die gebaute App über CDP, öffnet Projekt und
  Editor, legt einen Screenshot ab; `--gross` setzt 1440 × 900 und gibt die Maße der drei Flächen
  aus. **Beleg:** `Projekt beim Start offen: true` (vorher mit derselben `config.json` leer);
  `{"buehne":{"w":952},"canvas":{"y":216,"h":534},"streifen":{"w":108},"inspector":{"w":340}}` —
  Canvas-Mitte 483, Bühnen-Mitte 484: **die Vorschau sitzt mittig**.
- **Ehrlich offen:** Der **Kern-Flow** ist **nicht** verstanden — Niklas hat meine Lesart
  („Vorschau im Video-Kontext") am 04.11.2026 **verworfen**. Was er meint, steht nicht fest; der
  nächste Schritt beginnt mit einer **Frage an ihn**, nicht mit einem Bau. Die Breiten der neuen
  Spalten sind bei 1440 × 900 gemessen (952 / 340 / 108), bei 800 × 572 sind „4. Farbe" und
  „5. Dauer" nur nach Scrollen sichtbar.
- **Nicht gepusht** — Zahl mit dem Befehl zählen (`git log --oneline origin/main..HEAD`).
  **Push nur auf Anweisung.**

## STAND HEUTE (03.11.2026, achtundvierzigste Sitzung: „Neue Aktion" öffnet den Editor — Entscheidung 29.4 ist GEBAUT) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md`](docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md), Abschnitt 30.**

- **ENTSCHEIDUNG 29.4 IST GEBAUT.** „+ Neue Aktion" im Composer legt **keine** halbe Aktion mehr
  an, sondern oeffnet den **Aktions-Editor im Modus „neu"** als Ansicht ueber der Reiterflaeche.
  Vorschau, Bild, Vorlagen-Kacheln, Felder nach Vorlage und „Anlegen" sitzen dort. **Ein Weg
  statt zwei.**
- **Der Speicher hat jetzt DREI Zustaende:** `AktionenAnsichtLage = zu | neu | aktion(id)` in
  `gemeinsam/aktionen-ansicht.ts` (`oeffneNeueAktion`). Der Rahmen-Slot `aktionenAnsicht` bekommt
  `aktionId: string | null` — **`null` heisst „neu"**. `App.tsx` reicht
  `starteNeu={schalt.aktionId === null}` an die `ActionEditorWurzel`.
- **`starteNeu` wird EINMAL je Montage ausgewertet** (`useRef`) und **wartet**, bis die
  waehlbaren Vorlagen geladen sind — sonst liefe die Vorbelegung (zuletzt benutzte Vorlage,
  Projekt-Standardmarke, Projekt-Standarddauer) leer. Der Anlege-Code liegt in
  `starteNeueAktion()`; Knopf im Editor und Composer-Einstieg benutzen ihn.
- **Entfallen:** `composer/aktion-anlegen.tsx`, `tests/unit/aktion-anlegen.spec.ts`,
  `aufAktionAnlegen`, `AktionAnlegenAuftrag`, `ComposerVerdrahtung.legeAktionAn`,
  `composer/index.tsx:legeAktionAnInline`. Die Bibliothek hat nur noch einen Knopf
  (`aktion-anlegen-oeffnen`, Text „+ Neue Aktion").
- **ZWEI MESSFALLEN, im eigenen Lauf bezahlt:** (1) Der **verdeckte Reiter [Aktionen] traegt
  DIESELBEN Testids** (`aktion-titel`, `aktion-anlegen-bestaetigen`) — ein ungefiltertes
  `document.querySelector` traf den verdeckten Reiter; `4g` grenzt jetzt auf
  `[data-testid="rahmen-ansicht-aktionen"]` ein. (2) Nach `4g4`s Undo stand die **Sicht** auf 1
  Aktion, die **Datei** noch auf 2 (4-s-Entprellung) — `4g3` wartet jetzt, bis die Datei den
  Sicht-Stand traegt. Der erste Lauf ist im Protokoll **markiert**, nicht geloescht.
- **FENSTER-BELEG (`4g`, neu geschrieben):** `{"ansicht":true,"reiterVerdeckt":true,
  "formularLeer":false,"anlegenKnopf":true,"titel":""}`; Titel nach **4271 ms** im
  `project.json`; Aktionen **1 → 2**; Rueckweg schliesst; Zeilen mit Verwendungstext und
  Motivbreiten **474 / 71 px**.
- **Gate EXIT 0:** Typecheck **0** (auch tests), ESLint/oxlint **0**, Build **0**,
  Unit **5477/5477** (362 Dateien), Integration **51/51** (13), Treiber **0 Befunde**
  (1 Untersuchung: Mehrfachauswahl; 1 MANUELL: Export-Dialog).
- **Doku:** TK **v3.42** (9.8.3), `.docx` im selben Commit neu erzeugt (2150 → 2161 Absaetze,
  `unzip -t`, 0 Backticks). `seitenpanel-konzept.md` („Anlegen mit Preset") und
  `treiber-matrix.md` (FA-02) nachgezogen. AD unveraendert v1.13.
- **Nicht gepusht:** **49 Commits** vor `origin/main` **vor** dieser Sitzung; mit dem Commit
  dieser Zeile **50**. Die Zahl waechst mit jedem Doku-Commit — mit dem Befehl zaehlen
  (`git log --oneline origin/main..HEAD`). **Push nur auf Anweisung.**
- **NACHTRAG: Befund 27.3 ENTSCHIEDEN (Niklas, 03.11.2026: „Nein — Band gehört zum Video").**
  Eine Aktion ist im UI **immer ein Ganzbild**; das Band ist Sache des **Videos**
  (`bandVorlageId`, TK 9.2.8) und wird im Band-Editor gewaehlt. **Der Band-Zweig in
  `istBandAktion` bleibt trotzdem** — er ist **kein toter Code**: Dein Projekt `lallala` traegt
  die Aktion „Fuss" mit `band-standard` (entstanden ueber das heute entfallene Inline-Formular,
  dessen Auswahlfeld **ungefiltert** war). Als Unterbrechung waere sie 1920 × 162 und **nicht
  renderbar** (TK 9.5.2). Die Kommentare in `composer/ins-video.ts` und
  `action-editor/vorlage-waehlen.ts` nennen die Entscheidung; TK **v3.43**, `.docx` synchron;
  Typecheck/Lint 0, die zwei beruehrten Spec-Dateien 33/33 gruen.
- **Weiter offen:** Effekte geparkt (nur Vollbild: Zoom/Drift, Pop), `einzel-instanz.spec.ts`
  (#289) flaky.

## STAND HEUTE (03.11.2026, siebenundvierzigste Sitzung: „Bearbeiten" führt sofort in die Aktion — und 211 Vorlagen-Reste gelöscht) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md`](docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md), Abschnitt 29.**

- **BESCHWERDE 1 (Niklas 03.11.): „wenn man eine aktion bearbeiten will dann sollte man direkt
  dahin geleitet werden".** Ursache: `uebernimmHervorhebung` setzte nur die **Lage**, nicht das
  **Formular** — die Ansicht kam mit markierter Zeile und „Nichts gewählt." rechts; erst ein
  zweiter Klick fuellte sie. **Behoben:** derselbe Effekt setzt auch den Entwurf. Treiber `4g6`
  prueft es jetzt (leerer Titel / „Nichts gewählt" waere ein Befund).
- **BESCHWERDE 2 („gefuehlt tausend bestehende Aktionen").** Gemessen: Das Projekt `lallala` hat
  **1** Aktion. Die „tausenden" waren **Vorlagen**: `vorlagen.json` hatte **214** Eintraege —
  3 eingebaute, **211 Driver-Reste**, **0 eigene**. Der Treiber loeschte seine Projekte, **nie
  seine Vorlagen** (die liegen app-weit). Jetzt raeumt er sie auf: **mehrstufig**, abgeleitete
  zuerst (eine Basis mit Arbeitskopie ist gesperrt — dieselbe Falle wie bei den Marken).
  `vorlagen.json` steht wieder auf **3**.
- **Gate:** Typecheck **0** (auch tests), ESLint/oxlint **0**, Build **0**, Unit **5477/5477**
  (363 Dateien), Integration **51/51** (13), Treiber **0 Befunde**.
- **ENTSCHEIDUNG 29.4 (Niklas, 03.11.2026): „wir machen 2" — NICHT GEBAUT.** „Neue Aktion"
  oeffnet kuenftig den **Aktions-Editor im Modus „neu"** (Vorschau, Bild, Vorlagen-Kacheln, Felder
  nach Vorlage, „Anlegen" sitzt dort); **das Inline-Formular im Composer entfaellt** — ein Weg
  statt zwei. Gruende: ein Weg statt zwei, eine Aktion ohne Produktbild ist halbfertig,
  Abbrechen hinterlaesst nichts, und die Vorschau steckt im Editor.
  **Beim Bauen beachten:** `gemeinsam/aktionen-ansicht.ts` braucht einen **dritten Zustand**
  (`neu | aktion(id) | zu`); der Editor kann „neu" laengst. Entfaellt: `composer/aktion-anlegen.tsx`
  samt Tests; Treiber `4q` (und der Anlege-Teil von `4g`) misst heute das Inline-Formular und muss
  auf den Editor-Weg. `vorlage-vorbelegung.ts` bleibt gueltig.
- **Weiter offen:** Befund 27.3 (Band-Vorlagen im Aktions-Editor, „ka"), Effekte geparkt (nur
  Vollbild: Zoom/Drift, Pop), `einzel-instanz.spec.ts` (#289) flaky.

## STAND HEUTE (03.11.2026, sechsundvierzigste Sitzung: nur im Projekteditor arbeiten — der Vorlagen-Editor liegt jetzt über dem Projekt) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md`](docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md), Abschnitt 28.**

- **ANSAGE (Niklas, 03.11.2026):** *„man soll nur im projekteditor arbeiten müssen sonst ist der
  flow unlogisch"*. Am Code gemessen war **eine** Stelle wirklich ein Zwang zum Reiterwechsel:
  der **Vorlagen-Editor** hing nur am Reiter [Vorlagen]. Aktions-Editor und Marken-Editor gingen
  schon ohne Wechsel.
- **GEBAUT:** `gemeinsam/vorlagen-ansicht.ts` (offen/zu, wie `aktionen-ansicht.ts`), ein vierter
  Rahmenschlitz `vorlagenAnsicht` (`rahmen-ansicht-vorlagen`), ein **zweiter Symbolknopf in der
  Projektleiste** (`projektleiste-vorlagen-oeffnen`, Umschalter mit Rueckweg). Die besuchten
  Reiter bleiben montiert und verdeckt (TK 9.14.2).
- **Es liegt immer nur EINE Ansicht** ueber der Reiterflaeche: Marken / Aktionen / Vorlagen
  schliessen einander aus; ein Reiterklick schliesst alle. **Derselbe Sitzungshalter** wie im
  Reiter - keine zweite Arbeitskopie.
- **NICHT gebaut (bewusst):** Die Reiter bleiben. [Vorlagen] ist die app-weite Bibliothek (ohne
  Projekt nutzbar), [Aktionen] ist jetzt **doppelt** (Reiter + Ansicht) - ob der Reiter entfaellt,
  ist eine eigene Entscheidung.
- **FENSTER-BELEG:** `4g8` (neu) misst `{"ansicht":true,"inhalt":true,"reiterVerdeckt":true}` —
  Ansicht ueber der Reiterflaeche, Rueckweg schliesst. Matrix: **FA-13**.
- **Gate:** Typecheck **0** (auch tests), ESLint/oxlint **0**, Build **0**, Unit **5476/5476**
  (363 Dateien, +5), Integration **51/51** (13), Treiber **0 Befunde** (1 Untersuchung, 1 MANUELL).
- **Doku:** TK **v3.41** (9.14.2), `.docx` im selben Commit neu erzeugt.
- **Offen:** **Befund 27.3** (Band-Vorlagen im Aktions-Editor) - Niklas: „ka", nicht dringend.
  **Effekte** bleiben geparkt (nur Vollbild: Zoom/Drift, Pop). `einzel-instanz.spec.ts` (#289) flaky.

## STAND HEUTE (03.11.2026, fünfundvierzigste Sitzung: Felder nach Vorlage, echte Akzentfarbe — und ein Befund) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md`](docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md), Abschnitt 27.**

- **SCHRITT C IST GEBAUT:** Das Aktionen-Formular zeigt nur, was die gewaehlte Vorlage
  **benutzt** (`action-editor/feld-bedarf.ts`, abgeleitet aus den **Zonendaten**): `beschreibung`,
  `preis`, `cta`, `bild` je nach `Zone.bindung`; die Akzentfarbe, wenn eine Zone eine
  **Akzent-Rolle** verwendet. Der **Titel bleibt immer** (Pflicht, TK 9.8.4); eine **unbekannte**
  Vorlage blendet **nichts** aus.
- **DIE AKZENTFARBE IST ECHT (#325):** `<input type="color">` mit eigenem Wert oder Markenwert,
  „Markenwert"-Knopf setzt zurueck auf `null`. Gespeichert wird beim **Verlassen** des Feldes -
  ein Farbwaehler feuert beim Ziehen viele Aenderungen, jede waere im Modus „bestehend" ein
  eigener Undo-Schritt (TK 9.13.1).
- **BEFUND, OFFEN (nicht gebaut, nicht geraten):** `istWaehlbar` bietet im Aktions-Editor nur
  **Ganzbild**-Vorlagen an (`parent === null && hoehe === null`). Eine Aktion kann ueber die
  Oberflaeche **nie** eine Band-Vorlage tragen - damit ist die Regel aus Abschnitt 22
  („Band-Aktion → Abschnitt") fuer **UI-erzeugte** Aktionen **nicht erreichbar**; jede gezogene
  Aktion wird zur Unterbrechung. Der Treiber `4f8` misst den Band-Fall nur, weil er die Aktion
  **per IPC** mit Band-Vorlage anlegt. **Entscheidung noetig:** gewollt (dann ist der
  `istBandAktion`-Zweig toter Code und sollte weg) **oder** Luecke (dann muss `istWaehlbar` sie
  anbieten).
- **FENSTER-BELEG:** `4g7` misst `{"typ":"color","altesSelect":false}`. Der **Negativ-Fall**
  (Beschreibungs-Feld verschwindet) ist am Fenster **nicht messbar** (Befund oben) - er ist im
  Unit-Test mit der **echten** Band-Vorlage belegt, nicht mit einer Attrappe.
- **Gate:** Typecheck **0** (auch tests), ESLint/oxlint **0**, Build **0**, Unit **5471/5471**
  (362 Dateien, +8), Integration **51/51** (13), Treiber **0 Befunde** (1 Untersuchung, 1 MANUELL).
- **Doku:** TK **v3.40** (9.8.3), `.docx` im selben Commit neu erzeugt.
- **Effekte bleiben geparkt** (nur Vollbild: Zoom/Drift, Pop). `einzel-instanz.spec.ts` (#289) flaky.

## STAND HEUTE (03.11.2026, vierundvierzigste Sitzung: die Vorlagen-Auswahl zeigt Bilder) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md`](docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md), Abschnitt 26.**

- **SCHRITT B IST GEBAUT:** Die Vorlagen-Auswahl ist eine **Kachel-Liste mit Bild** statt einer
  Klappliste mit Namen (`action-editor/vorlagen-wahl.tsx`, `vorlagen-bilder.ts`). Das Bild kommt
  aus **demselben** Zeichenweg wie Vorschau und Render (`zeichneVorschau` → `zeichneSegment`) —
  keine zweite Malroutine. Darunter Name und Flaeche („Ganzbild (1920 × 1080)" /
  „Band (1920 × 162)").
- **Die Bilder entstehen EINMAL beim Oeffnen** des Formulars: Layout-Vorschau, **kein** Live-Bild.
  Das grosse Vorschaubild daneben bleibt live. Grund: je Vorlage ein 1920×1080-Canvas bei jedem
  Feldwechsel waere der falsche Preis.
- **Ein Klick geht denselben Weg wie jedes andere Feld** (`feldVerlassen('vorlagenId', …)`) — im
  Modus „neu" in den Entwurf, sonst in den Speicherweg.
- **FEHLER, DER DABEI AUFFIEL (und behoben ist):** Der erste Entwurf hing das **Marken-Objekt** in
  die Effekt-Abhaengigkeiten. `holeBereiteMarke` kann je Aufruf eine neue Referenz liefern — dann
  wurden bei JEDEM Rendern alle Vorlagenbilder neu gezeichnet (im Unit-Test messbar: vier
  Zeichenaufrufe statt drei). Jetzt haengt der Effekt an einem **Bereitschafts-Flag**.
- **FENSTER-BELEG:** `4g7` misst `{"bild":true,"breite":1920,"hoehe":1080,
  "vorlage":"aktion-vorlage-vollbild","vorlagenBilder":6}` — sechs waehlbare Vorlagen, **sechs
  Bilder**. Der Schritt meldet seit diesem Bau einen Befund, wenn eine Vorlage ohne Bild bleibt.
- **Gate:** Typecheck **0** (auch tests), ESLint/oxlint **0**, Build **0**, Unit **5463/5463**
  (361 Dateien, +1), Integration **51/51** (13), Treiber **0 Befunde** (1 Untersuchung, 1 MANUELL).
- **Treiber-Matrix:** `4g7` ist **FA-02** zugeordnet (`treiber-matrix.spec.ts` hat die Luecke
  sofort gemeldet).
- **Doku:** TK **v3.39** (9.8.3), `.docx` im selben Commit neu erzeugt.
- **Offen:** **C** — Felder richten sich nach der Vorlage; Akzentfarbe als echter Farbwaehler
  (#325) **oder** Feld raus. **Effekte bleiben geparkt.** `einzel-instanz.spec.ts` (#289) flaky.

## STAND HEUTE (03.11.2026, dreiundvierzigste Sitzung: Anlegen ist ein Gestaltungsvorgang – „Neue Aktion" zeichnet den Entwurf) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md`](docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md), Abschnitt 25.**

- **DIE EFFEKTE SIND GEPARKT (Niklas, 03.11.2026):** *„die machen nur sinn wenn der rest der app
  funktioniert"*. Wenn sie kommen: **nur Vollbild** — Zoom/Drift aufs Produktbild, Pop für
  Preis/Text. **Nicht** das Band, **nicht** „Band faehrt ein/aus", **nicht** ein Uebergangs-Fade.
  Diese drei waren eine Erfindung aus einer Notiz (Abschnitt 16) und sind **verworfen**.
- **WAS AM ANLEGEN KAPUTT WAR (am Code gemessen, nicht geraten):** Im Modus „neu" zeichnete die
  Vorschau **nichts** (`VorschauFlaeche` hing an der gespeicherten Aktion), **kein Produktbild**
  war setzbar (die Bild-Auswahl brach bei `gewaehlt === null` ab), die **Akzentfarbe** ist ein
  totes Feld (genau eine Option), die **Vorlage** eine nackte Klappliste, und **alle Felder**
  stehen da, auch wenn die Vorlage keine Zone dafuer hat.
- **SCHRITT A IST GEBAUT:** `AktionsInhalt` (`Omit<Aktion,'id'>`) — alles zum **Zeichnen**, ohne
  Kennung; `template-canvas` fordert nur noch das (gemessen: `aktion.id` kommt dort nicht vor).
  Die Vorschau zeichnet den **Entwurf**, und das Bild ist **im Entwurf** waehlbar (kein IPC).
  **`bereiteMotivVorFuer`** bereitet das Motiv des Entwurfs vor — ohne das stuende der Platzhalter
  fuer ein gerade gewaehltes Produktfoto.
- **FENSTER-BELEG:** Treiber **`4g7` (neu)** misst `{"flaeche":true,"bild":true,"breite":1920,
  "hoehe":1080,"vorlage":"vollbild"}` — *„VORSCHAU BEIM ANLEGEN GEMESSEN: Canvas 1920 x 1080 im
  Modus 'neu'"*. Ein Unit-Test haette nur den Aufruf beweisen koennen (dort ist die Zeichenroutine
  gemattet).
- **Gate:** Typecheck **0** (auch tests), ESLint/oxlint **0**, Build **0**, Unit **5462/5462**
  (361 Dateien, +2), Integration **51/51** (13), Treiber **0 Befunde** (1 Untersuchung, 1 MANUELL).
- **Offen, in dieser Reihenfolge:** **B** Vorlagen-Auswahl **mit Bild**; **C** Felder richten sich
  nach der Vorlage + Akzentfarbe (echter Farbwaehler #325 **oder** Feld raus).
- **Doku:** TK **v3.38** (9.8.3), `.docx` im selben Commit neu erzeugt. `einzel-instanz.spec.ts`
  (#289) bleibt flaky. **Kein Issue offen.** `projects/lallala` bleibt (Nutzerdaten).

## STAND HEUTE (03.11.2026, zweiundvierzigste Sitzung: Preset beim Anlegen – und zwei Fehler, die es sichtbar machte) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md`](docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md), Abschnitt 24.**

- **ENTSCHEIDUNG (Niklas, 03.11.2026):** „Neue Aktion" oeffnet mit der **zuletzt benutzten
  Vorlage** vorbelegt (nicht „Band-Standard", nicht „erste waehlbare"); dazu
  **Projekt-Standardmarke** und **Projekt-Standarddauer**.
- **EINE Regel, zwei Wege:** `gemeinsam/vorlage-vorbelegung.ts` (`vorlageFuerNeueAktion`,
  `merkeLetzteVorlage`) — gelesen vom Aktions-Editor **und** vom Inline-Formular im Composer
  (#416); ein direkter Import zwischen den Bereichen waere ein Architekturbruch.
  Gemerkt wird beim Oeffnen, Anlegen und Speichern; **Sitzungsspeicher**, kein Feld in der
  `project.json`.
- **FEHLER 1, behoben:** `leererEntwurf` schrieb fest **10 s**. Damit koppelte **jede** neue Aktion
  den Projektstandard ab (ein geschriebener Wert heisst „eigene Dauer", TK 9.8.4). Jetzt ist
  `standardDauer` **Pflicht-Argument**, die Aufrufer reichen `Project.standardSegmentdauer` herein.
- **FEHLER 2, behoben (aelter als das Preset):** Die Formularfelder sind unkontrolliert
  (`defaultValue`); „Neue Aktion" zeigte nach dem Oeffnen einer anderen Aktion **deren** Werte
  (Entwurf leer, Bild nicht). Jetzt `key` am Formularblock (`neu-<Zaehler>` bzw. Aktions-ID) und
  die Vorlagen-Auswahl liest `formular.vorlagenId` statt `gewaehlt?.vorlagenId`.
- **Gate:** Typecheck **0** (auch `tsconfig.tests.json`), ESLint/oxlint **0**, Build **0**,
  Unit **5460/5460** (361 Dateien, +8), Integration **51/51** (13), Treiber **0 Befunde**
  (1 Untersuchung: Mehrfachauswahl; 1 MANUELL: Export-Dialog).
- **Ehrlich offen:** Das Preset ist **nicht am Fenster gemessen** — die Belege sind jsdom-Tests,
  es gibt keinen Treiber-Schritt dafuer. `einzel-instanz.spec.ts` (#289) flaky, unveraendert.
  **Kein Issue offen.** `projects/lallala` bleibt (Nutzerdaten).
- **Doku:** TK **v3.37** (9.8.3), `seitenpanel-konzept.md` auf GEBAUT gezogen, `.docx` neu erzeugt.
- **Naechster Schritt: OFFEN — ausdruecklich NICHT die Effekte.** Die Zeile „danach die Effekte
  (Band faehrt ein/aus, Motiv atmet, Uebergang)" steht seit Sitzung 20 in dieser Uebergabe; sie
  stammt aus einer **Notiz** in Abschnitt 16 von `uebergabe-2026-11-01-buchhaltung-383-394.md`
  („spaeter, aber Teil des Versprechens") und ist **nie entschieden** worden. **Niklas,
  03.11.2026: *„die effekte machen keinen sinn"*.** Was als naechstes gebaut wird, entscheidet er.

## STAND HEUTE (03.11.2026, einundvierzigste Sitzung: der Band-Abschnitt hat keine Dauer-Eingabe mehr, beide .docx wieder synchron) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md`](docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md), Abschnitt 23.**

- **ENTSCHEIDUNG (Niklas, 03.11.2026):** *„feste zeit weil es macht keinen sinn dafür eine zeit
  festzulegen"*. Die Dauer eines **Band-Abschnitts** ist **keine Eingabe** mehr; sie folgt der
  **Dauer-Kette** `aktion.standardDauer ?? projekt.standardSegmentdauer ?? 10` (AD v1.13 / TK v3.36).
  Zuvor war sie im Band-Editor je Abschnitt frei eintippbar.
- **EINE Funktion, zwei Verwendungen:** `dauerNachKette` (vorher `startdauerFuerBandabschnitt`,
  `composer/band-aufnahme.ts`) traegt die Startdauer der Unterbrechung **und** die feste Dauer des
  Band-Abschnitts. Der Name sagt jetzt, was sie ist.
- **Der Entwurf normalisiert beim Oeffnen** (`entwurfAus(element, vorlagenId, dauerFuer)`): JEDER
  Abschnitt bekommt die Kette, nicht die gespeicherte Zahl. **Folge, offen benannt:** ein Altprojekt
  mit von Hand gesetzten Zeiten gleicht sich beim ersten Oeffnen der Band-Bearbeitung an - eine
  **Verhaltensänderung**, gewollt.
- **Mitbehoben, sonst waere es eine zweite Wahrheit:** `schliesseAbschnittsFixAb`
  (Band-Abschnitt reparieren) behielt die Dauer des kaputten Abschnitts. Sie zieht jetzt die Kette
  der **neuen** Aktion; die unbeteiligten Abschnitte bleiben unangetastet.
- **Entfernt:** das Dauer-Eingabefeld, `setzeAbschnittsDauer` (kein toter Export), die zwei
  Eingabe-Tests. Der Knopf „hinzufuegen" nimmt die Kette statt der Konstante 10.
- **BEFUND, der die Doku betrifft:** Die beiden `.docx` waren **stehengeblieben** - AD auf **1.9**,
  TK auf **3.29**, waehrend die `.md` bei 1.12/3.35 stand. Neu erzeugt (Staging, `unzip -t`,
  0 Backticks, Absatz-Diff) und platziert. **Der Sprung in den Word-Dateien enthaelt deshalb auch
  die Aenderungen der letzten Sitzungen**, nicht nur diese. Der Dokustand ist wieder synchron;
  **wer sie kuenftig aendert, erzeugt sie im selben Commit neu.**
- **Zeile korrigiert:** `setze-unterbrechungen.ts` sagte im Kopf noch `dauer > 0`, geprueft werden
  8-45 s - Kommentar nachgezogen (Niklas: „8-45").
- **Gate:** Typecheck **0** (auch `tsconfig.tests.json`), ESLint/oxlint **0**, Build **0**,
  Unit **5452/5452** (360 Dateien), Integration **51/51** (13), Treiber **0 Befunde**
  (1 Untersuchung: Mehrfachauswahl; 1 MANUELL: nativer Export-Dialog).
- **Ehrlich offen:** `einzel-instanz.spec.ts` (#289) flaky, unveraendert. **Kein Issue offen.**
  `projects/lallala` bleibt (Nutzerdaten).
- **Nachgezogen (Niklas, 03.11.2026):** `system-design-context.md` 9h traegt die Dauer-Regel **und**
  jetzt einen Marker, dass der Split-Screen gestrichen ist (der Abschnitt beschrieb ihn noch).
  Die drei geschlossenen Issues **#129 / #249 / #253** sind kommentiert, ihre lokalen Volltexte
  tragen denselben Nachtrag.
- **Naechster Schritt:** Konzept Abschnitt 10 weiter - **Preset beim Anlegen** (Vorlage + Marke +
  Dauer vorbelegt), danach die **Effekte** (Band faehrt ein/aus, Motiv atmet, Uebergang).

## STAND HEUTE (03.11.2026, vierzigste Sitzung: der ENOSPC war ein Produktfehler, eine Dauer-Spanne, Widerspruch 1 gelöst) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md`](docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md), Abschnitt 22.**

- **GATE EXIT 0, vollständig — zum ersten Mal nach den Reparaturen:** Unit **5452/5452** (360 Dateien),
  Integration **51/51** (13), **Treiber 0 Befunde**, Typecheck **0** (auch `tsconfig.tests.json`, der
  Punkt, der in 21.5 ungeprüft war), ESLint/oxlint 0, Build 0. Einzige Untersuchung:
  Mehrfachauswahl (#392). Einziger MANUELL-Eintrag: nativer Export-Dialog.
  (`einzel-instanz.spec.ts` fiel in einem Lauf — der bekannte Flaky #289, einzeln **3/3 grün**.)
- **DER RENDER-BELEG IST ERBRACHT:** Treiber `4f8` rendert ein Projekt **mit** Unterbrechung:
  **Datei=true, ffprobe 12.022 s** bei Anzeige 0:12 (2 s Video + 10 s Einschub). Die Lücke aus
  Abschnitt 21.5 ist zu.
- **DER ENOSPC WAR EIN PRODUKTFEHLER, keine Umgebung (`fcbc758`):** Die Bandspur bekam
  `gesamtFrames = frames` (Teillänge), der **Ausgabe**-`-ss` = `(startFrame − 0,25)/fps` spult sie
  aber um `startFrame` vor. Blieb weniger als ein Bild, brach ffmpeg mit **Exit 228**
  („No space left on device" = 256 − 28) ab — bei 843 GB freiem Platz. Ohne Electron reproduziert;
  gemessen: Band **30** Bilder → 228, **31** → 0, **60** (= `startFrame + frames`) → 0.
  Jetzt `gesamtFrames = endFrame`. **Das betraf JEDES getrimmte Video mit Band**, nicht nur
  Unterbrechungen — die Unterbrechung hat nur zum ersten Mal `startFrame ≠ 0` erzeugt.
- **Folge, offen benannt:** Das Band ist am Elementanfang verankert und läuft über eine Unterbrechung
  hinweg **weiter**, statt an jedem Teil neu mit dem ersten Abschnitt zu beginnen. Gewollt, aber eine
  Verhaltensänderung (Befund B3 in `normalisieren.ts` neu geschrieben).
- **EINE DAUER-SPANNE FÜR ALLE SEGMENTE (`0f1d223`, AD v1.12 / TK v3.34):** Niklas, 03.11.2026:
  *„sonst nehmen wir einfach jede dauer größer als 8s und keine zwei typen"*. `DAUER_BEREICH.min`
  **10 → 8**; **kein** zweites Feld im Render-Auftrag. `setzeUnterbrechungen` prüft die Dauer jetzt
  gegen **dieselbe** Konstante — vorher stand dort nur `> 0` mit dem Vermerk „nicht entschieden";
  ein 5-s-Einschub wurde gespeichert und erst der **Render** wies ihn ab.
- **WIDERSPRUCH 1 GELÖST (`85adaf7`, TK v3.35):** Eine **Band-Aktion** wird beim Drop ein
  **Band-Abschnitt**, keine Unterbrechung — als vollflächiger Einschub war sie 1920 × 162 und damit
  **nicht renderbar**. AD 4.5 sagt ohnehin: die Unterbrechung ist ein „eigenes, **vollflächiges**
  Segment". Klick und Drop entscheiden jetzt an **einer** Stelle: `legeAktionInsVideo`
  (`verwende-zeitleisten-zug.ts`). Treiber: `4b6` Ganzbild → Unterbrechung, `4f2` Band → Abschnitt.
- **`4f7` war ein MESSFEHLER (`5203b42`):** Der Pause-Klick traf **Play**, weil das 2-s-Projekt nach
  1,5 s am Ende war; Frame 11 → 29 sind exakt 30 fps seit dem Neustart. Jetzt wird 400 ms nach dem
  Start pausiert, ein neuer Zweig prüft `laeuft="nein"`, ein Wiederholungsversuch ist erlaubt.
- **Treiber (`4c2cbce`):** `4b5`-Seed auf 8 s (die Untergrenze, damit sie mitgemessen wird), Frames
  120/275 statt 45/70; `4f2` greift die gesäte Aktion über die **Kennung** statt über die erste Zeile.
- **LEHREN, teuer bezahlt:** (1) **Vor jeder Fenstermessung `npm run build`** — ich habe es einmal
  verletzt und einen ganzen Lauf gegen das alte Bündel gemessen; der „Produktfehler" war meiner.
  (2) **Im Treiber Aktionen über die Kennung greifen**, nie über die erste Zeile: welche Aktion oben
  steht, hängt an den Schritten davor. (3) **Ein Projekt kann zu kurz für die Wartezeit sein** — das
  hat `4b5` in dieser Sitzung dreimal gekippt (Ende erreicht, `<video>` weg, `paused` null).
- **Gegenproben:** drei, jede rot und **byte-identisch** zurückgenommen (Prüfsummen im Commit):
  Band auf `frames` → `lauf.ok` falsch; `normalisieren.ts` auf `frames` → „expected 120 to be 150";
  Band-Zweig mit `false &&` → beide Band-Fälle rot. Dazu eine **Diagnose-Probe** (volles `argv` +
  voller `stderr` nach `SIGNAGE_FFMPEG_PROTOKOLL`), die den 228-Aufruf identifizierte und
  byte-identisch entfernt wurde.
- **Ehrlich offen:** `einzel-instanz.spec.ts` (#289) flaky; ein **Altprojekt** mit einer Unterbrechung
  unter 8 s (nur per API oder Handeditierung möglich — die Oberfläche bietet keine Dauer-Eingabe)
  wäre beim Verschieben dieses Einschubs blockiert; dafür ist **kein Sonderfall gebaut**.
  **Kein Issue offen.**
- **NICHT GEPUSHT:** **38 Commits** vor `origin/main` — Stand **dieses Doku-Commits**; die Zahl wächst
  mit jedem Doku-Commit: **mit dem Befehl zählen** (`git log --oneline origin/main..HEAD`).
  **Push nur auf Anweisung.**
- **Arbeitsbaum sauber.** `projects/lallala` bleibt (Nutzerdaten, nicht anfassen).
- **NÄCHSTER SCHRITT:** Konzept Abschnitt 10 weiter — **Preset beim Anlegen** (Vorlage + Marke + Dauer
  vorbelegt), danach die **Effekte** (Band fährt ein/aus, Motiv atmet, Übergang).

## STAND HEUTE (03.11.2026, neununddreissigste Sitzung: Unterbrechungen sind wieder renderbar, der Block-Weg ist weg) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md`](docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md), Abschnitt 21.**

- **DER RENDER-WIDERSPRUCH IST BEHOBEN (`6e09d4f`):** Jedes Projekt **mit einer Unterbrechung** war
  nicht renderbar — `render-ausloesen.ts` gab jedem Video-Teil **dieselbe** Element-Kennung,
  `validierung.ts` verlangt eindeutige. Jetzt trägt jeder Teil **`<elementId>#<n>`**, und
  **`elementIdAusItemKennung`** in `auftrags-manager/render-verzahnung.ts` bildet an der Grenze
  wieder aufs Element zurück (**eine** Stelle). Das unzerlegte Item behält die nackte Kennung.
- **BELEGT DURCH EINEN NAHT-TEST:** `render-ausloesen.spec.ts` schickt den von `loeseRenderAus`
  gebauten Auftrag durch **`pruefeRenderRequest`** des render-service — beide Seiten in einem Lauf,
  ohne ffmpeg. Der Fall war zuerst **rot** (alte Kennung) und ist jetzt grün.
- **„ZUR LISTE HINZUFÜGEN" IST WEG (Niklas, 02.11.2026: „Aktion als eigener Block … ist Müll von
  früher"):** Der Knopf ist entfernt, mit ihm die Props `aufFehler` und `sichtSchreiber` der
  Bibliothek. Eine Aktion gehört ins **Video** — Band-Abschnitt oder Unterbrechung, beides über
  „Ins Video". **Der Drag an eine Kante erzeugt weiterhin einen Block**; alte Projekte mit Blöcken
  müssen weiter rendern (4f5 prüft genau das).
- **TREIBER UMGEBAUT (`96861fc`):** `4f5`/`4f` legen ihr Zweit-Element über den **Store** an und
  entfernen es dort wieder (der Undo-Pfeil nimmt einen Store-Ruf **nicht** zurück — gemessen: zwei
  Blöcke blieben stehen); `4f3` misst die Pfeile an „Ins Video"; `4f7` misst „die Uhr läuft" nach
  **0,4 s** (ein 2-s-Projekt kann die Wiedergabe vorher beenden).
- **NICHT BELEGT — und das ist der offene Punkt:** Der Render-Beleg in `4f8` (Projekt **mit**
  Unterbrechung → Datei + ffprobe) kam **nicht bis zum Ende**. Der Auftrag **besteht die Prüfung**
  (der Fehler ist von `ungueltige_eingabe` zu `ffmpeg_fehler` gewandert), dann scheiterte ffmpeg an
  **„No space left on device"** — bei **843 GB freiem Platz**. Danach starben die Läufe ohnehin
  früher: **Fenster-Tod bei 4a2** (`detached Frame`), reproduzierbar, ohne Main-stderr.
- **UMGEBUNG, ehrlich benannt:** Nach einem Dutzend Electron-Läufen hängen `tsc`, `oxlint` und
  `vitest` sporadisch (Worker werden abgeschossen), während dieselben Befehle Minuten später in
  Sekunden durchlaufen. **Das volle Gate ist nach diesen Änderungen NICHT gelaufen.** Belegt sind:
  `eslint` **0**, `tsc` main/renderer **0**, die Naht-Probe grün — **nicht** belegt: die volle
  Unit-Zahl, Integration, Treiber.
- **ZWEI NEUE WIDERSPRÜCHE, offen (nicht behoben):** (1) Eine **Band-Aktion als Unterbrechung**
  (Drop auf den Video-Körper, 4f2) zeichnet ein PNG **1920 × 162**; der Render verlangt für
  `segment` **1920 × 1080** — auch das ist nicht renderbar. (2) Eine Unterbrechung mit **Dauer < 10 s**
  wird vom Render abgewiesen (Segmente 10–45 s, TK 9.5.2), der Store erlaubt jede Dauer > 0.
- **NÄCHSTER SCHRITT:** Maschine neu starten, `npm run pruefung` **einmal vollständig** laufen
  lassen; dann die zwei Widersprüche entscheiden (Band-Aktion als Unterbrechung verbieten **oder**
  vollflächig zeichnen; Dauer-Grenze für Einschübe festlegen).
- **NICHT GEPUSHT:** **31 Commits** vor `origin/main` — Stand **dieses Doku-Commits**. Die Zahl
  wächst mit jedem Doku-Commit: **mit dem Befehl zählen**, nicht abschreiben
  (`git log --oneline origin/main..HEAD`). **Push nur auf Anweisung.**
- **Arbeitsbaum sauber.** Aufgeräumt: drei leere Projekt-Reste abgebrochener Treiber-Läufe
  (`DurchlaufTest-*`) und `instanz.lock` — `projects/lallala` bleibt (Nutzerdaten, nicht anfassen).

## STAND HEUTE (02.11.2026, achtunddreissigste Sitzung: „Ins Video", Buchhaltung, ein Produktwiderspruch) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md`](docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md), Abschnitt 20**
(der Dateiname ist historisch — Abschnitt 20 ist vom 02.11. und liegt in DERSELBEN Datei, damit es
keine zweite Wahrheit gibt).

- **„INS VIDEO" IST GEBAUT (`0268bf5`):** ein Knopf je Aktionszeile, der die Aktion **per Klick** ins
  Video legt. Die Regel liegt **rein** in **`composer/ins-video.ts`**:
  **Band-Aktion** (Vorlage mit Höhe) -> **Abschnitt ans Ende der Bandfolge** (`uebernehmeBand`),
  **Ganzbild** (auch unbekannte Vorlage) -> **Unterbrechung an der Abspielmarke** (derselbe Weg wie
  ein Drop auf den Video-Körper, #442). Die Marke wird von projektweiten Frames über Block und
  `spieleZeitBeiSequenzzeit` in Videozeit gerechnet; steht sie nicht im Video, sagt das die Meldung.
- **ABLÖSUNG, OFFEN BENANNT (Niklas, 02.11.2026):** #442 legte fest, Band-Abschnitte entstünden
  **ausschließlich in der Band-Bearbeitung**. Für diesen Knopf gilt das nicht mehr. Die **Drop-Regel
  bleibt unberührt**.
- **AM FENSTER GEMESSEN (`6a73785`, Treiber `4f8`):** Marke Frame **30**; Ganzbild -> Unterbrechung
  `{zeitstelle: 1, dauer: 10}` (Store nach **4270 ms**, kein neues Listenelement); Band -> Abschnitte
  **1 -> 2**, Liste unverändert, Zeile **„Band ab 0:00"**; Höhen bei 800 × 572: Bühne **280**,
  Zeitachse **18**, „Rendern…" **27** px. Danach beide Wirkungen per Cmd+Z zurück.
- **MESSFALLE, teuer bezahlt:** `project.json` wird **entprellt** geschrieben (4 s,
  `auto-speichern.ts`). Eine Sofortablesung meldet „nichts passiert", obwohl der Klick gewirkt hat.
  Der Schritt **wartet** jetzt auf die Änderung (Frist 20 s) und protokolliert die Dauer.
- **DER WICHTIGSTE BEFUND — OFFEN, nicht behoben:** **Ein Projekt mit einer Unterbrechung lässt sich
  nicht rendern.** `render-ausloesen.ts:189` vergibt jedem Video-Teil **dieselbe** Element-Kennung
  (für den Reparatur-Modus), `validierung.ts:524` verlangt **eindeutige** Kennungen -> der Auftrag
  wird mit `ungueltige_eingabe` abgewiesen („Die Element-Kennung … kommt mehrfach vor"). Für den MVP
  **blockierend**, weil „Ins Video" bei Ganzbildern genau so eine Unterbrechung erzeugt.
  **Entscheidung nötig** (Teile dürfen dieselbe Kennung tragen *oder* sie bekommen eigene mit
  Rückabbildung) — berührt TK 9.2.1.
- **Gate EXIT 0:** Unit **5445/5445** (360 Dateien, +28), Integration **50/50** (13), **Treiber
  0 Befunde / 0 Untersuchungen**, Typecheck 0, ESLint **0 Fehler / 0 Warnungen**. Einziger
  Treiber-Eintrag: **MANUELL** (nativer Export-Dialog).
- **10 Gegenproben**, jede rot und byte-identisch zurückgenommen. **Eine blieb zuerst grün** (IV6):
  der Test führte nur ein Segment mit `trimStart: null` vor, da greift schon `videoSekunden` — die
  Prüfung war von der Fixture verdeckt. Neuer Fall (Segment mit von Hand gesetzten Trim-Werten),
  danach rot. **Lehre: eine grüne Probe ist eine Aussage über den Test, nicht über den Code.**
- **Nebenbefund, behoben:** `tests/unit/eigenschaften-ansicht.spec.ts` trug seit `93c3343` einen
  unbenutzten `vi`-Import; die Uebergabe behauptete „0 Warnungen", oxlint meldete eine. Entfernt.
- **Buchhaltung nachgezählt:** `origin/main..HEAD` war **24**, nicht 23 (der korrigierende Commit
  zählte sich selbst nicht). Mit den drei Commits dieser Sitzung (`0268bf5`, `6a73785`, dieser Doku)
  sind es **27**. Die Zahl steht jetzt **mit dem Befehl** da — sie wächst mit jedem Doku-Commit.
  **Push nur auf Anweisung.**
- **NÄCHSTER SCHRITT:** erst der Widerspruch oben (Entscheidung Niklas), dann Konzept Abschnitt 10
  weiter: **Preset beim Anlegen**, danach die **Effekte** (Band fährt ein/aus, Motiv atmet,
  Übergang).

## STAND HEUTE (02.11.2026, siebenunddreissigste Sitzung: Sidepanel gebaut, GATE GRÜN) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md`](docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md),
Abschnitte 12–19** (der Dateiname ist historisch — die Abschnitte 12–19 sind vom 02.11. und liegen
in DERSELBEN Datei, damit es keine zweite Wahrheit gibt).
**Konzept: [`docs/agents/seitenpanel-konzept.md`](docs/agents/seitenpanel-konzept.md).**

- **`npm run pruefung` EXIT 0 — zum ersten Mal:** Unit **5417/5417** (358 Dateien), Integration
  **50/50**, **Treiber 0 Befunde / 0 Untersuchungen**, Typecheck 0, ESLint 0 Fehler / 0 Warnungen.
  Einziger Treiber-Eintrag: **MANUELL** (nativer Export-Dialog, User-Entscheidung 13.10.2026).
- **DAS SIDEPANEL IST GEBAUT (Schritte 1–3).** Panel und Rail sind **dasselbe**: Leiste 36 px
  (Video · Aktionen · Eigenschaften, Zuklapp-Pfeil unten) + Panel 240 px, VS-Code-Muster.
  **Breite wird nicht gezogen.**
  - **Schritt 1 (`fff1d85`):** Leiste + Umschalten. Gemessen: Sidepanel **284** px, Bühne **476**;
    zugeklappt Hauptspalte **724**. **Befund am Bild:** Der gedrückte Zustand war unsichtbar —
    `SymbolKnopf` setzt den Hintergrund inline, das schlägt `basis.css`; galt für **jede** Leiste.
  - **Schritt 2 (`250f736`, `23be1f1`, `bcc1673`):** Aktionszeile mit **Motiv** (einmal zeichnen,
    auf Zeilenhöhe verkleinern, Cache max. 40) und **„läuft bei 0:12 · 3×"**. Band-Motive bekommen
    eine **eigene Zeile in voller Breite** (11,85 : 1), Ganzbilder stehen neben dem Titel.
  - **Schritt 3 (`93c3343`):** **Eigenschaften an die Auswahl gebunden** — Kopf, **Folge**
    („Gesamt 0:42 · Band 3× · ab 0:12") und die **bestehende** Bedienung `ElementBedienung` (#249).
- **DER #453-BEFUND IST BEHOBEN, nicht dokumentiert (`921f3a1`):** Der Band-Weg läuft jetzt über
  Block wählen → „Eigenschaften" → Band. Treiber: `wahl=ok`, Abschnitt im Store,
  `["Band ab 0:00"]`. **Auch die zwei Untersuchungen sind Messungen geworden:** Gesamtdauer
  `"0:12"` aus der Statistik; Dauer/Trim `"2,0 s" -> "1,1 s" -> Undo "2,0 s"`, **GEMESSEN**.
- **DIE MESSLATTE GILT WEITER (Abschnitt 16 + 16a/16b):** Das Werkzeug muss für Produktwerbung
  **besser** sein *und* **weniger Aufwand** kosten als PowerPoint; jedes Element muss **schneller
  oder sehr viel besser** sein, sonst fällt es durch. Was zählt, ist **das Ergebnis am Ende**.
- **REGELN, die diese Sitzung gekostet hat:** (1) **vor jeder Fenstermessung `npm run build`** —
  `npm run durchlauf` fährt `dist/`. (2) Der **Panel-Zustand überlebt kein Projekt-Neuöffnen**
  (fällt auf „Video") → der Treiber schaltet an jeder der 25 Composer-Stellen. (3) `$$` im
  **Ersatztext** von `String.replace` heißt „ein `$`" — hat `seite.$$` zu `seite.$` gemacht.
  (4) Ungültige Messläufe werden im Protokoll **markiert, nicht gelöscht**.
- **Flaky, benannt:** `einzel-instanz.spec.ts` (#289) fiel im ersten Gesamtlauf; einzeln 3× 7/7
  grün, im zweiten Gesamtlauf grün. **Nicht behoben.**
- **NÄCHSTER SCHRITT (Konzept Abschnitt 10):** die **Aufwand-Senker** — **„Ins Video" als Knopf**
  statt Drag und **Preset beim Anlegen**. Danach die **Effekte**: Band fährt ein/aus,
  Motiv atmet, Übergang statt hartem Schnitt.
- **Nicht gepusht (Stand `c362ef9`, selbst nachgezaehlt):** `git log --oneline
  origin/main..HEAD` = **24**. Die vorige Zahl (23) war um eins zu niedrig, weil der
  korrigierende Commit `c362ef9` sich selbst nicht mitzaehlte. **Die Zahl waechst mit jedem
  Doku-Commit** — nach dem Commit dieser Zeile sind es **25**; wer sie braucht, zaehlt mit
  dem Befehl, statt sie abzuschreiben. **Push nur auf Anweisung.**

## STAND HEUTE (01.11.2026, sechsunddreissigste Sitzung: Buchhaltung #383–#394, Aktionen-Auswahl, Loesch-Sperrgruende) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md`](docs/agents/uebergabe-2026-11-01-buchhaltung-383-394.md).**

- **#383, #388, #394 GESCHLOSSEN** (`completed`, je mit Beleg-Kommentar). Die DoD-Pruefung fand
  **drei echte Luecken**: „aktualisiert sich bei Aenderungen" war bei #383 in **keinem** Test
  belegt (neuer Fall in `vorschau-anzeige.spec.ts`); #388 hatte **kein Gelb** (die
  30-Minuten-Warnung trug das Rot der kaputten Zeilen - jetzt `#d9a441`); #394 war vollstaendig
  (montiert in `composer/index.tsx:827`, Treiber **4o**).
- **`fehler-markierung.tsx` GELOESCHT** (`a94ec2e`, Anweisung): Geruest aus `110b9a6` ohne
  Importeur. Die Markierung liegt in `liste-ansicht.tsx`/`element-zeile.tsx`.
- **#393 GESCHLOSSEN, nachgebessert (`72dea60`):** Der Vorlagen-Editor hat jetzt einen **LESENDEN
  Projektzugang** (`projektRoh`) und das Feld **„Vorschau mit Aktion"**; `BEISPIEL_AKTION` ist
  nur noch Rueckfall. Zwei bisher ungenutzte Funktionen bekamen ihren Aufrufer
  (`waehleVorschauAktion`, `bereiteVorschauVor`). **Abloesung, offen benannt:** die Regel
  „KEIN Projektzugang" (ENTSCHIEDEN 6) gilt fuer diesen Reiter nicht mehr.
- **DABEI GEFUNDENER FEHLER:** Der Vorbereitungs-Effekt hing nur an `arbeitsId` - die Wahl einer
  anderen **Marke** leerte die Vorschau fuer immer. Jetzt am Stand (Marke, Aktion, Projekt).
- **LOESCH-SPERRGRUENDE UNTER DER KOPFZEILE (`f13bc02`):** `loeschKnopf` bleibt im Kopf,
  `loeschSperrgruende` bekommt eine eigene Flaeche darunter; Test prueft die **Lage**.
- **FALLE:** `VorlagenEditorWurzelProps` existiert **zweimal** (`app-shell/inhalte.tsx` und
  `vorlagen-editor/index.tsx`) - wer ein Feld ergaenzt, muss **beide** anfassen. Attrappen
  muessen den **gespeicherten** Stand liefern; ein neues Objekt je `hole()` erzeugt eine
  Zeichen-Endlosschleife (gemessen).
- **Gate Exit 0** - Unit **5.358 (352 Dateien)**, Integration **50 (13)**, Treiber **0 Befunde**,
  Lint 0 Fehler / 65 Warnungen. **8 Gegenproben**, alle rot und byte-identisch zurueckgenommen.
- **Nicht gepusht:** **4 Commits** (`9bba122`, `a94ec2e`, `72dea60`, `f13bc02`) + Doku.
  **Push nur auf Anweisung.**
- **#374/#375 NEU GESCHNITTEN UND `not planned` GESCHLOSSEN (01.11.2026):** #374 setzt ein
  Hauptmenü und vier Dateien voraus, die es nicht gibt - der **Reiter „Aktionen"**
  (`action-editor/index.tsx`, Bibliothek + Live-Vorschau + Formular) erfuellt das Ziel; uebrig
  bleibt nur die **Navigationsfrage** (Overlay statt Reiter). #375 hat keine Voraussetzung mehr:
  `Aktion` kennt **kein `art`** (`shared/contracts/aktion.ts`), es gibt **keine** Badges
  (0 Treffer) und keine Banner-Aktionen (M9/TK v3.33). **Damit ist kein Issue mehr offen.**
- **PROJEKTEDITOR ENTRUEMPELT (`103811a`, Entscheidung Niklas 01.11.2026):** „Aktionen in die
  Mitte, Galerie raus." Der linke Bibliothek-Dock ist entfallen, die **Aktionen-Bibliothek** steht
  in der **Mitte**; die **Medien-Galerie** ist als Flaeche aus „Zusammenstellen" entfernt (Bilder
  gehoeren zum Aktions-Editor, das Video zum schmalen Import). Die Datei-Drop-Zone (#335) haengt
  jetzt an der Bibliothek. **Liste und Bibliothek schliessen sich aus** (bei 800x572 passen zwei
  Bloecke unter der Buehne nicht - Lehre aus #456). Treiber 4b/4b3/4k messen jetzt `medium-`
  statt `galerie-eintrag`. **`galerie-bereich.tsx`, `asset-galerie.tsx`, `bibliothek-dock.tsx`
  sind geloescht** (samt sechs Test-Mocks).
- **AKTIONS-EDITOR AUS DEM PROJEKTEDITOR (`dfd9e48`):** Jede Aktions-Zeile traegt
  **"Bearbeiten"**; der Klick oeffnet denselben `ActionEditorWurzel` als **Ansicht UEBER der
  Reiterflaeche** (Reiter bleiben montiert, nur verdeckt - TK 9.14.2); "Zurueck zum Projekt"
  oder ein Reiterklick schliesst sie. Neuer Speicher `gemeinsam/aktionen-ansicht.ts`, Slot
  `aktionenAnsicht` im Rahmen, umhüllter Zugang (`projektBearbeitung`) fuer den Undo-Schritt.
  **Treiber `4g6`** misst es am Fenster; Matrix FA-03 nachgezogen.
  **Messfalle:** Die Ansicht heisst `rahmen-ansicht-aktionen` - `rahmen-inhalt-aktionen` ist der
  Testid des AKTIONEN-REITERS (der erste Treiber-Lauf meldete deshalb falsch "Zurueck schliesst
  nicht").
- **Offen ohne Issue:** Bild-Import-Form im Aktions-Editor (Feld/Dialog/Drop); Layout-Frage
  Welle 1 („Video mittig" vs. „Buehne oben"); Beenden-Frist 15 s; #456-Signaturblock;
  71 Dependabot-Luecken. **Sicherheit ist nachrangig, solange der MVP nicht steht** (Ansage
  Niklas, 01.11.2026). **Alle Editoren und die UI muessen weiter extrem ueberarbeitet werden** -
  der Umbau ist begonnen, nicht abgeschlossen. **Naechster Schritt: eine Frage entscheiden,
  nicht auf Verdacht bauen.**

## STAND HEUTE (31.10.2026, fuenfunddreissigste Sitzung: Bedienfluss – #446, #392, #457) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-31-bedienfluss-446-392-457.md`](docs/agents/uebergabe-2026-10-31-bedienfluss-446-392-457.md).**

- **TK v3.33 (`c60b4b9`):** Die **Banner-Spur entfaellt**; #365-#373 und #376 sind `not planned`.
  Im Band laeuft eine **Aktion** (`abschnitte.aktionRef`, so in M9 gebaut).
- **#446 GESCHLOSSEN (Messweg):** 4g3/4q warten **20 s** statt 8 s bei 4-s-Entprellung.
  Probe: Titel **251 ms nach der Frist**; Gegenprobe mit derselben Probe gruen nach **8045 ms**.
- **#392 GESCHLOSSEN:** Mehrfachauswahl (Shift/Cmd), Gruppen-Entfernen **EIN** Undo-Schritt ueber
  die neue Store-Operation **`entferneElemente`** (Kanal `project:entferneElemente`).
  **Der Treiber fand:** `setzeListe` ist der Sicht-Schreiber und schreibt `project.json` **nicht**.
  Treiber `4g5` (2 -> 0, ein Cmd+Z -> 2), **9 Gegenproben**. Gruppen-Verschieben ist nicht Teil.
- **#457 GESCHLOSSEN:** Abspielmarke in der Zeitleiste (`gemeinsam/abspielposition`, nur die Marke
  abonniert); Mitscrollen nur bei Wiedergabe. Treiber `4f7` (0 -> 44 Frames, Pause 50 -> 50),
  **3 Gegenproben**. Die Veroeffentlichung aus `vorschau.tsx` ist nur am Fenster belegt.
- **INTEGRATIONSTEST REPARIERT (`70c66fa`):** `standbild-echt` hielt die Suite **912 s** offen
  (`spawnSync` + `-progress pipe:1`, Orphan ueberlebte SIGTERM); jetzt `spawn` mit Drain +
  SIGKILL-Netz + `pkill`: **15,8 s**. Ein erster Async-Umbau half nicht und wurde zurueckgenommen.
- **4f4-MESSFEHLER BEHOBEN:** Ohne eigene Dauer-Aenderung wird kein Undo mehr gedrueckt (vorher
  nahm der Pfeil den vorherigen Schritt zurueck, Liste 2 -> 1). Der Reglerzug selbst bleibt eine
  **Untersuchung**.
- **Gate Exit 0** - Unit **5.348 (352)**, Integration **50 (13)**, Treiber **0 Befunde**,
  Lint 0 Fehler / 65 Warnungen.
- **Gepusht:** `16e9b57..114d047`, **11 Commits**, `main == origin/main`.
- **Offen:** 6 Issues (#383, #388, #393, #394, #374, #375); Beenden-Frist 15 s;
  Loesch-Sperrgruende in der Marken-Kopfzeile; 71 Dependabot-Luecken. **Naechster Schritt:**
  Buchhaltung #383/#388/#393/#394 gegen die DoD pruefen, dann die Loesch-Sperrgruende.

## STAND HEUTE (30.10.2026, vierunddreissigste Sitzung: Marken-Ansicht und Streichung des Reiters) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-30-marken-ansicht-reiter.md`](docs/agents/uebergabe-2026-10-30-marken-ansicht-reiter.md).**
**Fortsetzung derselben Sitzung: [`docs/agents/uebergabe-2026-10-30-symbole-448.md`](docs/agents/uebergabe-2026-10-30-symbole-448.md)**
— Symbole (#456), #453-Treiber, acht geschlossene Issues, #448 (Regel wieder `error`).

- **#443 ABGENOMMEN UND GESCHLOSSEN** (Videosteuerung, Review ohne Befund).
- **#455 GEBAUT (`c15f135`):** Marken-Editor mit **Inspector** rechts, **Reihenfolge der Arbeit**
  (sechs Stufen), **Erklaerungsschicht** `rollen-texte.ts` (Name + ein Satz je Rolle, gemessen
  gekoppelt an `eingebauteVorlagen()`), **drei Vorschauen ueber die ID**, `[Gross]`, ESC und Klick
  ins Leere heben die Auswahl auf. Palette und Box entfallen. **`hintergrund` hat keine
  Klickflaeche mehr** (Weg B, entschieden) und ist ueber Stufe 2 erreichbar.
- **#449 NICHT nachgebessert:** ESC fehlte, „Klick daneben" war strukturell tot, Ableiten lag nicht
  in der Kopfzeile, der Treiber-Schritt fehlte. Die Form wird ersetzt — das Issue bleibt **offen**.
- **#456 GEBAUT (`ffa02dc` + `ac5e8fb` + `c13d288`) und AM FENSTER ABGENOMMEN (30.10.2026, „passt"):**
  **Reiter [Marken] entfaellt** (AD v1.11 / TK v3.32, `21b5f38`). Vier Reiter; die
  **Projektleiste** ueber jedem Reiter traegt Projektname, Standardmarke und den **Einstieg in den
  Editor** — **nachgebessert (`060abe1`) auf Anweisung: Symbole statt Textknopf**, der Stift steht
  direkt hinter der Klappliste, offen wird er zum Pfeil zurueck (Umschalter). Der Editor ist eine
  **Ansicht ueber der Reiterflaeche**; die besuchten Reiter bleiben montiert. Er zeigt „In diesem
  Projekt: N Aktionen". **Bestand bleibt app-weit**, keine Migration. Alle Projekte geloescht
  (Freigabe). **Abloesung, offen benannt:** Die Entscheidung vom selben Tag („der Markenname ist der
  Einstieg, kein eigener Knopf") gilt nicht mehr — der Einstieg ist der Stift.
- **SYMBOLE (`060abe1`, neuer Ort):** `src/renderer/gemeinsam/symbole.tsx` — fuenf Piktogramme +
  `SymbolKnopf` (16er-Raster, `currentColor`, `aria-label` UND `title`). `gemeinsam` ist laut
  `index.ts` der Ort ohne Eigentuemer; `preview-player/symbole.tsx` (#443) bleibt unberuehrt.
  **Bestaetigende Aktionen bleiben Text** („Löschen bestätigen").
- **BEFUND AUS DEM GATE — Merksatz:** Die Leiste kostet Hoehe. Bei 800x572 schob sie die Zeitleiste
  des Composers aus dem Bild (Drop aufs Video und Loeschen-Knopf fielen aus; Gegenprobe per
  `display:none` gruen). Behoben mit flacher Leiste (22 px) **und** `BUEHNE_OBEN.minHeight`
  **200 -> 160**. **Wer Hoehe ergaenzt, muss den Composer nachmessen.**
- **#453 GESCHLOSSEN (30.10.2026, `completed`):** Der STOPP-Punkt ist entschieden — die Flaechen
  heissen **„Ganzbild (1920 × 1080)"** und **„Band (1920 × 162)"** (`4321cea`, nur der Kommentar
  „noch nicht bestaetigt" nachgezogen). DoD Punkt fuer Punkt im Abschlusskommentar belegt.
- **#448 ERLEDIGT (30.10.2026, `c6f8756` + vier Vorgaenger):** **0 Fundstellen** fuer
  `anti-slop/require-safety-comment-for-type-assertion`, die Regel steht wieder auf **`error`**
  (in `tests/**` bleibt sie aus, Nicht-Ziel). 200 Stellen einzeln entschieden: Cast weg, wo der
  Typ traegt; sonst `SAFETY:` mit pruefbarer Invariante. Vier echte Loecher dabei gefunden
  (`formular as AktionsEntwurf` reichte `null` durch, `standardDauer` als Zahl durch
  `string | null`, `setzeBearbeitungFort` verlangte eine ganze `Vorlage`, fuenf Casts um
  Vertragsfelder in `thumbnails`). **Warnungen 258 -> 65** (andere Regeln). **Gegenprobe:** neue
  Datei mit `1 as number` -> `npm run lint` Exit 1, Datei entfernt.
- **M9-BUCHHALTUNG ERLEDIGT (30.10.2026):** **#450, #451, #452, #454 geschlossen** (`completed`), je
  mit Beleg-Kommentar. Damit ist M9 vollstaendig. **#450 traegt eine benannte Abweichung:** der
  DoD-Punkt „keine Datei ausserhalb der genannten geaendert" war unerfuellbar (M9 ist ein Atom,
  94 Dateien). `tools/bereitschaft.py` meldete #452 faelschlich als „bereit" (der Bau hat
  `preview-player/split.tsx` geloescht, das Werkzeug liest „Datei fehlt" als „nicht gebaut").
- **#449 GESCHLOSSEN (30.10.2026, `not planned`):** durch **#455** ersetzt und am Fenster
  abgenommen. Die hier beschriebene Form (kleine Box, Palette) ist verworfen, ihr Ziel erreicht.
  Zwei Abweichungen stehen im Abschlusskommentar: **`hintergrund` ohne Klickflaeche** (Weg B,
  erreichbar ueber Stufe 2) und **Palette -> „Weitere Rollen"** im Inspector.
- **#453-TREIBER-SCHRITT GEBAUT (`6295605`):** Der letzte offene DoD-Punkt von M9 ist gemessen — **4f**
  liest nach dem Kanten-Drop `project.json` und belegt `art: "segment"` an Position 2; **4f6** (neu)
  haengt eine Aktion ueber die **Bandliste** des Video-Elements an und belegt den **Abschnitt** in
  `einblendung.abschnitte` (Store), kein neues Listenelement, keine Unterbrechung. Der Schritt wartet
  bis 10 s auf den Store: die erste Fassung las nach 3,5 s und bekam `null` (Messfehler, kein
  Produktfehler). **Treiber-Matrix:** `4f6` gehoert zu FA-13 (`tests/unit/treiber-matrix.spec.ts`
  fand die Luecke sofort).
- **Gegenproben:** 11 in dieser Sitzung, jede rot und byte-identisch zurueckgenommen. Eine erste
  Fassung blieb gruen (Reiterklick deckte nur den Klickweg, nicht den programmatischen Wechsel).
  **Nachtrag `060abe1`: 6 weitere** (immer Stift statt Pfeil, `gedrueckt` entfernt, Markenname
  wieder als Text, Rueckweg als Textknopf, Loeschen als Textknopf, `title` entfernt) — alle rot.
  **Nachtrag `6295605`: 2 weitere** (Band-Haelfte als Produkt-Mutation, Zeitleisten-Haelfte als
  Messaufbau-Probe) — beide rot.
- **Gate:** `npm run pruefung` **Exit 0** — Unit **5.288 (347 Dateien)**, Integration **50 (13
  Dateien)**, Treiber **0 Befunde**, Lint 0 Fehler. (Der erste Lauf war durch `| tail` im Exit-Code
  maskiert; der zweite Lauf mit sauberem Exit belegt 0.)
- **Nicht gepusht:** **27 Commits** vor `origin/main`; diese Doku kommt als eigener Commit dazu. **Push nur auf Anweisung.**
- **#455 UND #456 GESCHLOSSEN (30.10.2026, `completed`):** #456 am Fenster abgenommen („passt"),
  #455 im Rahmen dieser Abnahme gesehen — die Abgrenzung steht so im Issue-Kommentar, damit sie
  nicht spaeter wie eine behauptete aussieht. **Damit ist der Marken-Umbau buchhalterisch fertig.**
- **#446 BEHOBEN (31.10.2026) - Messweg, kein Produktcode:** Der rote 4g3-Lauf ist durch die
  **8-s-Frist bei 4-s-Entprellung** erklaert (Probe: Titel stand **251 ms nach der Frist** im
  `project.json`, keine Fehlermeldung, Bibliothekszeile neu). Frist **8 s -> 20 s** in 4g3 und
  4q, Dauer bis zum Fund im Protokoll. Gegenprobe mit derselben SIGSTOP-Probe: gruen nach
  **8045 ms**. Gate Exit 0. Issue **#446 kommentiert und geschlossen** (`completed`).
- **#392 GEBAUT (`53ccaed`):** Mehrfachauswahl in **Liste und Zeitleiste** - **Shift = Bereich**,
  **Cmd/Strg = umschalten**; Gruppen-Entfernen ist **EIN Undo-Schritt** ueber die neue
  Store-Operation `entferneElemente` (Kanal `project:entferneElemente`, angemeldet im
  project-store-Nachtrag, weil #76 seiner Datei keinen fuenften Kanal erlaubt). **Der Treiber
  fand dabei einen echten Fehler:** `setzeListe` ist der Sicht-Schreiber und schrieb
  `project.json` **nicht** - die Gruppe verschwand aus der UI, die Datei blieb. Treiber-Schritt
  **4g5** misst Auswahl, Entfernen 2 -> 0 und **ein** Cmd+Z -> 2. **9 Gegenproben**, alle rot
  und byte-identisch zurueckgenommen. Gate Exit 0 - Unit **5.334 (350)**, Integration **50
  (13)**. **Gruppen-Verschieben ist nicht Teil des Issues** (keine Zielregel, Folge-Issue).
  **#392 kommentiert und geschlossen** (`completed`).
- **#457 GEBAUT (`cf37e7a`, Welle 3) UND GESCHLOSSEN:** Abspielmarke in der Zeitleiste. Der
  Stand kommt aus `gemeinsam/abspielposition` (die Vorschau veroeffentlicht ihn, **nur die
  Marke** abonniert); Mitscrollen nur bei laufender Uhr. Treiber **4f7**: 0 -> 44 Frames,
  0 -> 12 px; Pause 50 -> 50. **3 Gegenproben** (Position, Pause-Scroll, Zentrierung), alle rot
  und byte-identisch zurueckgenommen. **Gate Exit 0 - Unit 5.348 (352), Integration 50 (13).**
  **4f4-Messfehler behoben:** Ohne eigene Dauer-Aenderung wird kein Undo mehr gedrueckt -
  vorher nahm der Pfeil den vorherigen Schritt zurueck (Liste 2 -> 1), und 4f6 erbte den
  Schaden. `4f4` bleibt eine **Untersuchung** (der synthetische Reglerzug aendert die Dauer
  aktuell nicht).
- **INTEGRATIONSTEST REPARIERT (`70c66fa`):** `standbild-echt` (Gegenprobe ohne `-frames:v`)
  hielt die Suite offen - `spawnSync` leerte die `-progress`-Pipe nicht, der SIGTERM-Kill
  scheiterte, der Orphan lief weiter (912 s, Test-Timeout). Jetzt `spawn` mit Drain und
  SIGKILL-Netz plus `pkill` in `afterAll`: **15,8 s, Exit 0**.
- **Ehrlich offen:** Beenden-Frist 15 s; der Signaturblock in #456 nennt `projektId`, gebaut ist
  zusaetzlich `aktionen` (Widerspruch gemeldet, Text nicht nachgezogen); die
  **Loesch-Sperrgruende erscheinen mitten in der Marken-Kopfzeile** (aelter als #456, nicht
  angefasst).
- **Naechster Schritt (Ansage Niklas, 30.10.2026):** **UI 2.0**. #448 ist zu; #446 bleibt der
  einzige offene Punkt mit Fensterbedarf.
- **UI 2.0, WELLE 2 ENTSCHIEDEN (30.10.2026):** Im Band laeuft eine **Aktion**, kein eigenes
  Banner-Objekt. Die **Banner-Spur ist verworfen**; **#365-#373 und #376** sind `not planned`
  geschlossen (der Vertrag `abschnitte.aktionRef` aus M9 bleibt). **Welle 2 = Variante A
  (Bedienfluss):** #446, #392 und #457 sind **erledigt**; **naechste: Buchhaltung
  #383/#388/#393/#394, danach Loesch-Sperrgruende**. Grundlage:
  [`docs/agents/ui-2-0-welle-2-vorschlag.md`](docs/agents/ui-2-0-welle-2-vorschlag.md).
  **#374/#375 bleiben offen** (nicht banner-gebunden, Begruendung neu schreiben). **TK-Nachtrag
  v3.33 geschrieben (`c60b4b9`):** Banner-Spur entfaellt, `abschnitte.aktionRef` bleibt.
  **Offen:** die Layout-Frage aus Welle 1 („Video mittig" im Plan, gebaut ist „Buehne oben").

## STAND HEUTE (30.10.2026, dreiunddreissigste Sitzung: Zonen-Namen und M9) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-30-zonen-texte-m9.md`](docs/agents/uebergabe-2026-10-30-zonen-texte-m9.md).**

- **#454 GEBAUT (`1d4867a`):** Zonen-Namen aus EINER Quelle (`renderer/gemeinsam/zonen-texte.ts`);
  die Vorlagen-Liste zeigt `1. Hintergrund — …`, der Marken-Editor nutzt dieselbe Quelle.
  Sichtbare Folge: cta „Knopf", scrim „Abdunkelung", motiv „Bild der Aktion".
- **M9 GEBAUT (`e4a5549`, 94 Dateien): #450–#453 in EINEM Paket.** `VorlagenArt`,
  `Vorlage.art`, `einblendung.art` und `flaecheDunkel` sind entfallen;
  `shared/band-geometrie.ts`, `filter-split.ts`, `split.tsx`/`split-stile.ts` geloescht.
  Eingebaute Vorlagen heissen **Ganzflächig / Zwei Spalten / Band-Standard** (IDs unveraendert);
  `erstelleVorlage(höhe, name)`; Migration `vorlagen.json` v1 → v2: `art` weg, die beiden
  Ganzbilder ueber die ID umbenannt, **nichts geloescht**, einmal als v2 geschrieben.
- **BEFUND, DER DEN PLAN KIPPTE:** #450 ist NICHT allein baubar - gemessen **21
  Produktdateien, 38 Testdateien** brechen, und #452/#453 folgen typbedingt. M9 ist ein Atom;
  die Dateiliste in #450 („keine Datei ausserhalb") ist unerfuellbar. Steht im Commit und in
  der Uebergabe.
- **TREIBER-FUND:** Der Marken-Editor suchte seine Vorschau-Vorlage ueber den **Namen**
  `'Vollbild'`. Die Umbenennung schaltete die Vorschau STILL ab (sieben Befunde). Jetzt sucht
  er ueber die **ID** `vollbild` - Anzeigename ist Praesentation, die ID ist die Identitaet.
- **Gegenproben (byte-identisch zurueckgenommen):** falsches `y` -> Integrationstest rot;
  `migriereVon1` unveraendert -> Migrationstests rot; `fillRect` entfernt -> Deckend-Test rot
  (der Test wurde dafuer von einer Aufruf-Zaehlung auf die TATSAECHLICHE Fuellung umgestellt -
  die erste Fassung blieb bei dieser Mutation gruen); Hoehen-Abgleich entfernt -> Test rot.
- **Gate:** `npm run pruefung` **Exit 0** - Unit **5.236 (342 Dateien)**, Integration **50
  (13 Dateien, +1 neuer ffmpeg-Test)**, Treiber **0 Befunde**, Lint 0. Die Unit-Zahl SINKT:
  Split-, Geometrie- und `art`-Tests sind mit ihrem Gegenstand entfallen.
- **Nicht gepusht:** **17 Commits** vor `origin/main`; diese Uebergabe kommt als eigener
  Commit dazu. **Push nur auf Anweisung.**
- **Ehrlich offen:** #453-DoD ohne Treiber-Beleg (Zeitleiste = Segment, Bandliste = Abschnitt);
  die Flaechen-Beschriftungen sind der Vorschlag aus #453 und **unbestaetigt**;
  `waehleVorlagenFlaeche` aus #453 ist **NICHT gebaut** (waere ein zweiter Anlegeweg) -
  gebaut ist `istAnlegbareFlaeche` + `legeVorlageAn(höhe, name)`; #451 nennt `schema_fehler`,
  gebaut ist `speicher_fehler`; #443 und #449 warten auf Review am Fenster.
- **Naechster Schritt:** #443 und #449 am Fenster reviewen, danach den #453-Treiber-Schritt
  bauen.

## STAND HEUTE (30.10.2026, zweiunddreissigste Sitzung: Videosteuerung, Projekt-Suche, Umbau-Entscheidung) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-30-videosteuerung-suche-m9.md`](docs/agents/uebergabe-2026-10-30-videosteuerung-suche-m9.md).**

- **GESCHLOSSEN (auf Anweisung, 30.10.):** **#391** (Vollbild-Vorschau-Modus) – der Modus steckt in
  #443; ein eigenes `vollbild.tsx` waere ein **zweiter Player** (TK 9.14.1). Seine zwei offenen
  Punkte stehen als Notiz an #443. **#303** (Marken-Live-Vorschau). **#443 bleibt offen** bis zum
  Review, hat aber den Kommentar "so gebaut".
- **#443 GEBAUT (`5cc281a`):** Videosteuerung als **Overlay ueber dem Bild** statt fester Leiste
  darunter; **Symbole** statt Wortknoepfe (`symbole.tsx`, eigene SVGs); Play/Pause **und** Klick
  aufs Bild, +-5 s, Position/Gesamt, Balken mit Kapitelmarken und Tooltip `mm:ss:ff`, **Ton
  standardmaessig aus** (Hinweis "Ausgabe bleibt stumm"), Vollbild, Ausblenden nach 3 s.
  **Tastatur** bleibt eigener Schritt (#387).
- **PROJEKT-SUCHE GEBAUT (`5e6d0c1`):** `filtereProjekte` (Name **und** Ordner), Suchfeld ueber
  der Liste, eigener Leerzustand "Kein Projekt passt zu ..." - nicht "Noch keine Projekte".
  Treiber-Schritt 2 misst **3 -> 0 -> 3 Zeilen**.
- **ENTSCHIEDEN (AD v1.10 / TK v3.31, `627e530`):** **Split-Screen gestrichen.** Das Werbeband
  liegt **deckend ueber** dem vollflaechigen Video. Vorlagen tragen **keine Art** mehr - `hoehe`
  entscheidet (`null` = Ganzbild 1920x1080, `162` = Band). **Der Einfuegeweg entscheidet:**
  Zeitleiste = Ganzbild, Bandliste = Band. **Anzeigenamen:** "Ganzflaechig" (ID `vollbild`),
  "Zwei Spalten" (ID `split`) - die Vorlage "Split" ist ein **zweispaltiges Ganzbild**, NICHT die
  gestrichene Komposition. **Zonen-Namen:** Hintergrund, Bild der Aktion, Abdunkelung, Logo,
  Ueberschrift, Beschreibung, Preis, Knopf.
- **DIE DOKUMENTE FUEHREN DEN CODE:** Die App kennt `art`, `split.tsx` und die halbtransparente
  Einblendung noch. Bis M9 gebaut ist, ist **das TK die Wahrheit, nicht das Fenster**.
- **M9 "Ein Band, keine Art" (#450-#454):** #450 (contracts) blockiert #451 (Store + Migration),
  #452 (Vorschau), #453 (Einfuegewege); **#454** (Zonen-Namen) ist unabhaengig. Plan:
  [`docs/agents/umbau-v331-plan.md`](docs/agents/umbau-v331-plan.md).
- **FALLE FUER DIE NAECHSTE SITZUNG:** `tools/bereitschaft.py` meldet fuer M9 **"4 von 5 gebaut"** -
  es misst nur, ob die genannte **Datei existiert**. Wirklich baubar ist nur **#454**.
  **#450 ohne #451** macht die `vorlagen.json` auf der Platte unlesbar (sie traegt `art`).
- **Werkzeug nachgezogen (`a017657`):** `bereitschaft.py` liest den Issue-Zustand - geschlossene
  Issues zaehlen als erledigt und erscheinen **nie** als "bereit"; **M9** ist in der Ausgabe.
- **Gate:** `npm run pruefung` **Exit 0** - Unit **5.389 (347 Dateien)**, Integration **49
  (12 Dateien)**, Treiber **0 Befunde**, Lint 0 Fehler.
- **Nicht gepusht:** **12 Produkt-Commits** vor `origin/main`; die Uebergabe-Dokumente kommen als
  eigene Commits dazu. **Push nur auf Anweisung.**
- **Ehrlich offen:** Die Leiste deckt bei der kleinsten Buehnenhoehe (200 px) rund ein Drittel und
  verschwindet nur beim Abspielen; die Element-Nummern sind weiter **0-basiert**; die
  Mutations-Gegenproben fuer die #449-Tests fehlen weiterhin.
- **Naechster Schritt:** **#454** bauen (klein, sofort sichtbar), dann **#450 + #451** zusammen.

## STAND HEUTE (29.10.2026, einunddreissigste Sitzung: Produktarbeit #442 und #449) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-29-produktarbeit-442-449.md`](docs/agents/uebergabe-2026-10-29-produktarbeit-442-449.md).**

- **GEPUSHT (Sitzungsbeginn, auf Anweisung):** 21 Commits, `4888913..78cb459`; `main == origin/main`.
- **#442 GEBAUT UND GESCHLOSSEN (`e1bf975`, `21e1519`, `049649f`, `962502a`):** Ein Drop auf den
  **Koerper** eines Video-Blocks legt **immer** eine Unterbrechung an - die Vorlagen-Heuristik aus
  #437 (`vollflaeche` -> Unterbrechung, sonst Band) war die Ursache von "Aktionen zwischen Frames
  geht nicht". Die Unterbrechung ist ein **sichtbarer Kasten** (Video | Aktion | Video) mit
  Aktionstitel und eigenem **×**; der alte Kasten loeschte sich bei jedem Klick (daher "verschwindet
  beim Klicken"). Der Kasten ist **verschiebbar** und springt nach dem Loslassen nicht zurueck.
  **Band-Abschnitte entstehen nur noch in der Band-Bearbeitung** - der Band-Drop und der
  Zeit-Split `teileUndFuege` (#428B) sind entfallen.
- **#449 GEBAUT, OFFEN (Review ausstehend, `32b40b7`):** Marken-Editor ohne Feldliste. Elemente =
  **Zonen der Vorschau-Vorlage** (`marken-elemente.ts`), anklickbar; Klick oeffnet eine **kleine Box**
  mit genau den Werten des Elements. Palette unter der Vorschau fuer die 6 Farb-/2 Schriftrollen,
  die "Vollbild" nicht zeigt. Ein Speichern derselben Marke laesst die Box offen.
- **FILMSTREIFEN:** Bilder erscheinen einzeln, fertige Streifen werden gemerkt
  (`filmstreifen-speicher.ts`, Obergrenze 40), Zoom entprellt 120 ms. Blob-URL bleibt begrenzt (#364).
- **BEENDEN (`4be49ce`):** Fenster-Schliessen war NICHT defekt (gemessen, `exitCode 0`). Defekt war
  der **Dev-Abbruch**: `dev.mjs` behandelte SIGHUP nicht -> Electron-Waise. Vorher/nachher belegt.
  Der Flush-Dialog hat jetzt eine **15-s-Frist** (Zahl vom User noch nicht bestaetigt).
- **Gate:** `npm run pruefung` **Exit 0** - Typecheck 0, Lint 0 Fehler, Unit **5.325 (343 Dateien)**,
  Integration **49 (12 Dateien)**, Treiber **0 Befunde**.
- **Nicht gepusht:** **6 Commits** vor `origin/main`. **Push nur auf Anweisung.**
- **Befund ohne Bau:** `tools/bereitschaft.py` meldet **geschlossene** Issues als "bereit"
  (`--state all`, kein Zustandsfilter). **Prozesse nach Arbeitsverzeichnis filtern, nicht nach dem
  Programmnamen** - `Electron .` ist auch Kais Companion.
- **Ehrlich offen:** Mutations-Gegenproben fuer die neuen #449-Tests fehlen; kein Treiber-Schritt
  "Box oeffnet sich"; Filmstreifen unter dem Kasten wird nicht gekuerzt.
- **Naechster Schritt:** #449 reviewen, dann #303 abnehmen, dann #443 (Videosteuerung).

## STAND HEUTE (29.10.2026, dreissigste Sitzung: Mutations-Charge 26 und das Verbot) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-29-nach-charge-26.md`](docs/agents/uebergabe-2026-10-29-nach-charge-26.md).**
Einzelbefunde: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 39.

- **CHARGE 26 GEBAUT (die letzte):** `slogan-bearbeiten`, `video-filmstreifen-blob`
  (`preview-player/video.tsx`), `vorschau-auswahl-rechnung`, `als-png` und der Sonderfall
  `marke`. **24 Verhaltens-Mutationen**, **4 Refactorings**; erste Messung 16 erkannt,
  **8 Luecken** (SL1, SL6, VI4, VI6, VI8, VA1, AP1, AP2) geschlossen, **0 aequivalent**;
  **0/4 Refactorings rot**.
- **Sonderfall `marke.spec.ts`:** Vertragstest (Unionen, `Record`-Vollstaendigkeit,
  Feldreihenfolge) **bleibt**; entfernt wurden nur die zwei Quelltext-Leser. **Die
  Zuordnung `video-filmstreifen-blob` → `video.tsx` war falsch:** die Spec testet den
  Filmstreifen; die Mutationen liefen gegen `video-anzeige.spec.ts`.
- **DAS VERBOT (Abschluss #447):** Sperrklinke **5 → 0**, Ausnahmen-Datei geloescht, die
  Regel `lokal/quelltext-proben` ist ein **Verbot**. Gegenproben: Literal rot,
  `readFileSync(new URL(…src/…))` rot, `fs.readFileSync('src/…')` rot,
  `fs.readFileSync('tests/fixtures/…')` gruen.
- **Dabei gefunden:** Die alte Regel pruefte nur den **Bezeichner** `readFileSync`;
  `fs.readFileSync` kam vorbei. Der verschaerfte Callee-Check fand eine **bisher
  unsichtbare Probe** in `marken-bereitstellung.spec.ts` (entfernt).
- **Entfernt:** **7** Quelltext-Tests, **8** Verhaltens-Tests ergaenzt; Suite
  **5.306 → 5.307** (netto +1).
- **Nachmessung nach dem Ausbau:** **24 von 24 rot**, 0/4 Refactorings rot.
- **Ehrlich offen:** Die Abwesenheits-Zusagen der fuenf Dateien und der gefundenen Probe
  sind ohne Waechter; #448 (192 SAFETY); `berichteDrop` ist toter Export.
- **Gate:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.307 (340
  Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**.
- **Nicht gepusht:** `main` liegt vor `origin/main`; **Push nur auf Anweisung.**
- **Naechster Schritt:** keine Mutations-Charge mehr. Offen sind #448, die
  Abwesenheits-Zusagen als Lint-Regeln, `berichteDrop` (Produktentscheidung) und der Push.

## STAND HEUTE (29.10.2026, neunundzwanzigste Sitzung: Mutations-Charge 25) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-29-charge-26.md`](docs/agents/uebergabe-2026-10-29-charge-26.md).**
Einzelbefunde: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 38.

- **CHARGE 25 GEBAUT:** fuenf Testdateien – `element-zeile-anzeige`, `medien-bibliothek`,
  `optimistisch`, `render-ausloesen`, `render-dialog` (alle `composer/`). **30
  Verhaltens-Mutationen**, **5 Refactorings**; erste Messung 17 erkannt, **13 Luecken**
  geschlossen, **0 aequivalent**; **0/5 Refactorings rot**.
- **Die Luecken (13):** `medien-bibliothek` x2 (ohnePfad-Zaehlung, Reihenfolge der
  auftragIds bei gleicher Kennung), `element-zeile` x1 (Band-Text mit Testzahl 2),
  `render-ausloesen` x4 (Reihenfolge Sperre/Namens-VP, Marke fuer Videos ohne Band,
  Hoehe-Literal 162, `projektId`-Literal `p-1`), `render-dialog` x1 (DEL U+007F),
  `optimistisch` x5 (Inline-Meldung bei Wurf, Kopie der Hoererliste, try/catch,
  Abmelde-Sperre, Null-Ereignis).
- **Zusatzbefund:** `berichteDrop` ist exportiert, aber **nirgends gerufen** – toter Export;
  gemeldet, nicht entfernt (Produktcode ausserhalb der Charge).
- **Entfernt:** **8** Quelltext-Tests, **13** Verhaltens-Tests ergaenzt; Suite
  **5.301 → 5.306** (netto +5). **Sperrklinke:** 10 → **5** Dateien.
- **Nachmessung nach dem Ausbau:** **30 von 30 rot**, 0/5 Refactorings rot – keine Mutation
  hing an einer Probe.
- **Ehrlich offen:** Abwesenheits-Zusagen ohne Waechter (kein IPC/Timer in `optimistisch`,
  kein zweiter Main-Weg/keine zweite Formatquelle in `medien-bibliothek`, kein
  `toDataURL`/keine Hexzahl in `render-ausloesen`, kein JSX/IPC in `render-dialog`, kein
  `window.api`/kein Band-Bearbeiter in `element-zeile`). Lint-Kandidat; #448 (192 SAFETY).
- **Gate:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.306 (340
  Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**.
- **Nicht gepusht:** `main` liegt vor `origin/main`; **Push nur auf Anweisung.**
- **Naechster Schritt: Mutations-Charge 26 (die letzte)** – fuenf Dateien:
  `slogan-bearbeiten` (`marken-editor/`), `video-filmstreifen-blob` (`preview-player/`),
  `vorschau-auswahl-rechnung` (`preview-player/`), `als-png` (`template-canvas/`),
  `marke` (`shared/contracts/`). **Sonderfall `marke.spec.ts`:** erst lesen, ob es ein
  Vertragstest ist (dann bleibt er; nur aus der Sperrklinke streichen). Danach steht die
  Sperrklinke auf 0 und die Regel wird von „Sperrklinke" auf „Verbot" gestellt.

## STAND HEUTE (29.10.2026, achtundzwanzigste Sitzung: Mutations-Charge 24) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-29-charge-25.md`](docs/agents/uebergabe-2026-10-29-charge-25.md).**
Einzelbefunde: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 37.

- **CHARGE 24 GEBAUT:** fuenf Testdateien – `inhalte-zugaenge-rechnung`, `rahmen-montage`,
  `uebergabe`, `undo-projekt` (`app-shell/`), `element-entfernen` (`composer/`).
  **27 Verhaltens-Mutationen**, **5 Refactorings**; erste Messung 22 erkannt, **5 Luecken**
  (UE18, UE20, UP2, UP5, UP11) geschlossen, **0 aequivalent**; **0/5 Refactorings rot**.
- **Die Luecken:** **UE18** – `meldeStand` auf `LEERE_SHELL_REPARATUR` verlor laufende
  Uebergabe, Hervorhebung und Rueckkehr. **UE20** – `push` → `unshift`: die
  **Anmeldereihenfolge** der Hoerer war ungeprueft. **UP5** – `kannWiederherstellen` pruefte
  die Projekt-Kennung nicht (der Zwilling tat es). **UP11** – Wurfmeldung nur ueber den Code
  geprueft (`String(error)` = „Error: …", dieselbe Klasse wie IM8). **UP2** –
  `standardSegmentdauer` als Literal **10**, weil alle Fixtures 10 tragen (Fixture-Falle).
- **Messfehler, offen benannt:** UP2 lief zuerst als `EDIT-PROBLEM: 0 Treffer` (Suchtext
  sprang ueber fuenf Kommentarzeilen). Gegen die Spec aus HEAD gemessen: 24 bestanden –
  die Luecke war real, nicht vermutet.
- **Entfernt:** **11** Quelltext-Tests, **4** Verhaltens-Tests ergaenzt, **1** geschaerft;
  Suite **5.308 → 5.301** (netto −7). **Sperrklinke:** 15 → **10** Dateien.
- **Nachmessung nach dem Ausbau:** **27 von 27 rot**, 0/5 Refactorings rot – keine Mutation
  hing an einer Probe.
- **Ehrlich offen:** Abwesenheits-Zusagen ohne Waechter (kein JSX/react in den reinen
  Modulen, kein IPC/Timer in `uebergabe`, keine feingranulare Operation in `undo-projekt`,
  genau ein Kanal in `element-entfernen`). Lint-Kandidat; #448 (192 SAFETY) steht.
- **Gate:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.301 (340
  Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**.
- **Nicht gepusht:** `main` liegt vor `origin/main`; **Push nur auf Anweisung.**
- **Naechster Schritt: Mutations-Charge 25** – fuenf der verbleibenden **10**:
  `element-zeile-anzeige`, `medien-bibliothek`, `optimistisch`, `render-ausloesen`,
  `render-dialog` (alle `composer/`). `optimistisch` traegt die Undo-Zusage – die
  Reihenfolge pruefen, Proben genau lesen.

## STAND HEUTE (29.10.2026, siebenundzwanzigste Sitzung: Mutations-Charge 23) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-29-charge-24.md`](docs/agents/uebergabe-2026-10-29-charge-24.md).**
Einzelbefunde: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 36.

- **CHARGE 23 GEBAUT:** fuenf Testdateien – `kaputt-handling`, `live-vorschau`
  (`action-editor/`), `aktions-auswahl-filter`, `asset-auswahl-filter`, `bootstrap-ablauf`
  (`app-shell/`). **29 Verhaltens-Mutationen**, **5 Refactorings**; 26 erkannt, **3 Luecken**
  (V4, V5, V6) geschlossen, **0 aequivalent**; **0/5 Refactorings rot**.
- **Die Luecken (alle in `live-vorschau`):** `haengeVorschauEin` war **ungetestet**
  (`aspectRatio` vertauscht und `parentElement`-Tor entfernt blieben gruen); der Test
  „bildRef null **oder unresolviertes Asset**" fuehrte nur `bildRef: null` vor. Neu: vier
  Tests.
- **`live-vorschau` hatte gar keine Probe:** `QUELLE` wurde gelesen und **nie benutzt** –
  toter Code. Die Datei verlaesst die Sperrklinke allein deshalb.
- **Harness-Aussetzer, offen benannt:** **K6** meldete `0 bestanden, 0 rot`; die
  Direktausfuehrung mit `--reporter=json` zeigt **2 rote Tests** (`numFailedTests: 2`). Bei
  `0/0` nicht auf die Tabelle hoeren, sondern den Fall direkt fahren.
- **Entfernt:** **4** Quelltext-/Meta-Tests, **4** Verhaltens-Tests ergaenzt; Suite
  **5.308 → 5.308** (netto 0). **Sperrklinke:** 20 → **15** Dateien.
- **Ehrlich offen:** Abwesenheits-Zusagen ohne Waechter – kein `react`/JSX in den reinen
  Modulen, kein `rufeAuf`/`KANAELE`/`window.`/Timer und keine Importe aus fremden
  Renderer-Ordnern in `bootstrap.ts` (die Architekturgrenze selbst). Lint-Kandidat
  `import/no-restricted-paths`; #448 (192 SAFETY) steht.
- **Gate:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.308 (340
  Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**.
- **Nicht gepusht:** `main` liegt vor `origin/main`; **Push nur auf Anweisung.**
- **Naechster Schritt: Mutations-Charge 24** – fuenf der verbleibenden **15**:
  `inhalte-zugaenge-rechnung`, `rahmen-montage`, `uebergabe`, `undo-projekt` (`app-shell/`),
  `element-entfernen` (`composer/`). `undo-projekt` liest evtl. den Projekt-Historien-Spion –
  der ist **bewusst geblieben** (Verhalten); nur die Quelltext-Probe zaehlt.

## STAND HEUTE (29.10.2026, sechsundzwanzigste Sitzung: Mutations-Charge 22) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-29-charge-23.md`](docs/agents/uebergabe-2026-10-29-charge-23.md).**
Einzelbefunde: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 35.

- **CHARGE 22 GEBAUT:** fuenf Testdateien – `verwerfe-arbeitskopie` (`main/vorlagen-store/`),
  `app-einhaengung` (`renderer/App.tsx`), `aktion-bearbeiten`, `aktion-loeschen`,
  `bild-zuweisen` (`renderer/action-editor/`). Erste Renderer-Charge mit `.tsx`.
  **30 Verhaltens-Mutationen**, **5 Refactorings**; 28 erkannt, **2 Test-Luecken** (A4, B6)
  geschlossen, **0 aequivalent**; **0/5 Refactorings rot**.
- **A4 – Zugangs-Spiegel:** Ohne `zugaengeRef.current = neu.zugaenge` liefert `holeProjekt()`
  **fuer immer `null`**; kein Test bemerkte es. Neu: `holeProjekt()` liefert nach `bereit`
  das Projekt. **Zusatzbefund:** Der Fall war zuerst als Anfuehrungszeichen-Tausch gebaut
  (gruen, harmlos) – erst `if (false)` ist die echte Mutation.
- **B6 – Meldungstabelle:** `meldungZuBefunden` hatte keinen Test; ein geloeschter `case`
  blieb gruen. Neu: vier Faelle, je Feldname + Grund.
- **PRODUKT-LUECKE GESCHLOSSEN (mit Freigabe):** `meldungZuBefunden` hatte **keinen
  `case 'markeId'`**; `legeAktionAn({…, markeId: ''})` lieferte
  **`" Es wurde nichts gespeichert."`** – ohne Feldnamen, mit fuehrendem Leerzeichen.
  Jetzt: eigener `case`, ein Test, **und** der Rueckruf traegt den Rueckgabetyp `string` –
  ein vergessener Zweig bricht `tsc` mit **TS2366** (belegt).
- **Entfernt:** **21** Quelltext-/Meta-Tests, **5** Verhaltens-Tests ergaenzt; Suite
  **5.323 → 5.307** (340 Dateien). **Sperrklinke:** 25 → **20** Dateien.
- **Ehrlich offen:** Die Abwesenheits-Zusagen der Renderer-Dateien (kein `window.api`, kein
  Kanal-Literal, kein `fs`, kein `throw`, kein `setTimeout`/`reiheEin` in `App.tsx`) haben
  keinen Waechter mehr. Lint-Kandidat; #448 (192 SAFETY) steht.
- **Gate:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.307 (340
  Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**.
- **Nicht gepusht:** `main` liegt vor `origin/main`; **Push nur auf Anweisung.**
- **Naechster Schritt: Mutations-Charge 23** – fuenf der verbleibenden **20**:
  `kaputt-handling`, `live-vorschau` (`action-editor/`), `aktions-auswahl`,
  `asset-auswahl`, `bootstrap-ablauf` (`app-shell/`). Die zwei Filter sind rein und gut
  verhaltensgetestet; `bootstrap-ablauf` ist der riskanteste (Startreihenfolge).

## STAND HEUTE (29.10.2026, fuenfundzwanzigste Sitzung: Mutations-Charge 21) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-29-charge-22.md`](docs/agents/uebergabe-2026-10-29-charge-22.md).**
Einzelbefunde: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 34.

- **CHARGE 21 GEBAUT:** fuenf Testdateien – `render-abbruch`, `normalisieren`
  (939 Zeilen, `render-service/`), `als-eigenstaendige`, `vorlagen-ipc-verdrahtung`,
  `loesche-vorlage` (`vorlagen-store/`). **30 Verhaltens-Mutationen**, **5 Refactorings**;
  29 erkannt, **1 echte Luecke** (L4) geschlossen, **0 aequivalent**; **0/5 Refactorings
  rot**.
- **Die Luecke:** **L4** – `daten: { aktionen, listenelemente: [] }` in `löscheVorlage`
  blieb gruen, weil der einzige Tiefenvergleich eine Fixture mit **leerer** zweiter Liste
  nutzte (Fixture-Falle). Neu: ein Fall mit **zwei gefuellten** Listen.
- **Messaufbau-Befund:** Das harmlose Refactoring **V7** (`nutzlast` → `eingang`) traf den
  **Importpfad** `nutzlast-pruefer`; die Suite lud nicht (`0/0`). Ersetzt durch
  `ARTEN` → `VORLAGEN_ARTEN`. Neue Variante der Falle 2: **`all`-Renames treffen auch
  Modulpfade.**
- **Nachmessung nach dem Ausbau:** **30 von 30** rot, kein Fall kippt – hier war keine
  Probe die einzige Waechterin.
- **Entfernt:** **35** Quelltext-/Meta-Tests, **1** Verhaltens-Test ergaenzt; Suite
  **5.357 → 5.323** (340 Dateien). **Sperrklinke:** 30 → **25** Dateien.
- **Ehrlich offen:** Die **Abwesenheits**-Zusagen haben keinen Waechter mehr – kein
  `fs`/`kill`/`unlink` im Abbruch, kein zweites Lock, kein Marken-/`config-store`-Zugriff
  in `normalisieren`, kein `fs`/IPC in den drei Vorlagen-Dateien, `child_process` nur als
  Typ. Verhalten kann sie nicht tragen (Spione sehen nur Aufrufe, die es gibt).
  Lint-Kandidat `no-restricted-imports`; #448 (192 SAFETY) steht.
- **Gate:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.323 (340
  Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**.
- **Nicht gepusht:** `main` liegt vor `origin/main`; **Push nur auf Anweisung.**
- **Naechster Schritt: Mutations-Charge 22** – fuenf der verbleibenden **25**:
  `verwerfe-arbeitskopie` (`vorlagen-store/`), `app-einhaengung` (`App.tsx`),
  `aktion-bearbeiten`, `aktion-loeschen`, `bild-zuweisen` (`action-editor/`). Erste
  Renderer-Charge mit `.tsx`: bei `app-einhaengung` vor dem Entfernen pruefen, ob der
  Verhaltens-Test die Montage wirklich traegt.

## STAND HEUTE (29.10.2026, vierundzwanzigste Sitzung: Mutations-Charge 20) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-29-charge-21.md`](docs/agents/uebergabe-2026-10-29-charge-21.md).**
Einzelbefunde: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 33.

- **CHARGE 20 GEBAUT:** fuenf Testdateien – `marken-store-pfade` (`marken-store/pfade.ts`),
  `ausgaben`, `liste-projekte`, `oeffne-projektordner`, `pfade` (alle `project-store/`).
  **31 Verhaltens-Mutationen**, **5 Refactorings**; 28 erkannt, **1 echte Luecke** (A6)
  geschlossen, **3 aequivalent** (M2, A1, L8); **0/5 Refactorings rot**.
- **Die Luecke:** **A6** – der Zweig „Datei da, aber `stat` scheitert (EACCES/EIO)" in
  `listeAusgaben` war ungetestet; `continue` statt `speicher_fehler` blieb gruen. Neu: eine
  Datei, `stat` mit EACCES -> `speicher_fehler`, Meldung nennt den Ordner.
- **Aequivalent:** **M2** (naives `startsWith` statt `path.relative` – Kandidat stammt immer
  aus demselben Ordner, zweite Schranke unerreichbar), **A1** (`isFile()` im Filter – `stat`
  prueft nach), **L8** (`media` inline – derselbe Wert; die Zusage „eine Pfad-Autoritaet"
  ist damit **unbewacht**).
- **Messaufbau-Befund:** **P7** lag zuerst in `projekteOrdner()` – einer Funktion, die der
  Spy-Test nicht aufrief; grün war ein Messfehler. Als P7b/P7c korrigiert (rot) und
  `projekteOrdner()` in die Aufrufliste des fs-Spy nachgetragen.
- **Die fs-Probe trug nur den ungenutzten Import:** benutzter `fs`-Zugriff -> Spy (P7b/P7c
  rot), ungenutzter Import -> `no-unused-vars` (geprueft). Zusage bleibt gedeckt.
- **Entfernt:** **26** Quelltext-/Meta-Tests, **1** Verhaltens-Test ergaenzt; Suite
  **5.382 → 5.357** (340 Dateien). **Sperrklinke:** 35 → **30** Dateien.
- **Ehrlich offen:** „eine Pfad-Autoritaet" (L8) und in `oeffne-projektordner` die Verbote
  `path.join`/`BrowserWindow`/`webContents`/`showItemInFolder`/`openExternal`. Lint-Kandidat;
  #448 (192 SAFETY) steht.
- **Gate:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.357 (340
  Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**.
- **Nicht gepusht:** `main` liegt vor `origin/main`; **Push nur auf Anweisung.**
- **Naechster Schritt: Mutations-Charge 21** – fuenf der verbleibenden **30**:
  `render-abbruch`, `normalisieren`, `als-eigenstaendige`, `vorlagen-ipc-verdrahtung`,
  `loesche-vorlage` (Render-Abbruch und Vorlagen-Store;
  [`charge-17-26-plan.md`](docs/agents/charge-17-26-plan.md)). Achtung: `verwerfe-arbeitskopie`
  liegt in Charge 22 und haengt mit `loesche-vorlage` zusammen – Specs getrennt lesen.

## STAND HEUTE (29.10.2026, dreiundzwanzigste Sitzung: Mutations-Charge 19) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-29-charge-20.md`](docs/agents/uebergabe-2026-10-29-charge-20.md).**
Einzelbefunde: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 32.

- **CHARGE 19 GEBAUT:** fuenf Testdateien – `loesche-medium` (`media-service/`),
  `export-handler-anmeldung` und `ziel-dialog` (`export-service/`), `export-verdrahtung`
  (`ipc-gateway/`), `render-handler-anmeldung` (`render-service/`). **27
  Verhaltens-Mutationen**, **5 Refactorings**; **27 erkannt**, **0 Luecken**, **0/5
  Refactorings rot**; jede Mutation byte-identisch zurueckgenommen.
- **EV6 ist aequivalent, mit Gegenprobe belegt:** `registriereHandler('export:wähleExportZiel', …)`
  statt der Registry-Konstante wurde **nur von der Quelltextprobe** gefangen – der Wert ist
  derselbe. **EV8** (Literal mit falschem Wert) ist rot (11 Tests), also faellt ein Tippfehler
  weiter auf; ungeschuetzt ist allein die **Schreibweise**.
- **Nachmessung nach dem Ausbau (32 Faelle):** 26 von 27 erkannt (EV6 gruen), die fuenf
  Refactorings gruen.
- **Entfernt:** **35** Quelltext-/Meta-Tests, **0** ergaenzt, **0** gekuerzt; Suite
  **5.417 → 5.382** (340 Dateien, allein die Testzahl sinkt). **Sperrklinke:** 40 → **35**
  Dateien.
- **Ehrlich offen:** Ohne Waechter sind `try/catch`-Verbot in beiden Anmeldungen,
  `whenReady`-Anhaenge, Lock/Flush in `loesche-medium` sowie in `ziel-dialog`
  `existsSync`/`homedir`/`loeseAusgabePfad`/`BrowserWindow`/`ipcMain`. Gedeckt bleiben
  Identitaet der Fachfunktionen, `setzeExportZiel` (Spion), `node:fs/promises` samt `statfs`
  (Spies), Selbstaufruf beim Import und der Kanal-**Wert**. Lint-Kandidat; #448 (192 SAFETY)
  steht.
- **Gate:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.382 (340
  Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**.
- **Nicht gepusht:** `main` liegt vor `origin/main`; **Push nur auf Anweisung.**
- **Naechster Schritt: Mutations-Charge 20** – fuenf der verbleibenden **35**:
  `marken-store-pfade`, `ausgaben`, `liste-projekte`, `oeffne-projektordner`, `pfade`
  (Pfad-Autoritaeten und Store-Listen;
  [`charge-17-26-plan.md`](docs/agents/charge-17-26-plan.md)). Proben dort oft „kein
  `path.join` mit Projekt-ID" – die Pfad-Autoritaet (TK 9.5.7) muessen die
  Verhaltens-Tests tragen.

## STAND HEUTE (29.10.2026, zweiundzwanzigste Sitzung: Mutations-Charge 18) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-29-charge-19.md`](docs/agents/uebergabe-2026-10-29-charge-19.md).**
Einzelbefunde: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 31.

- **CHARGE 18 GEBAUT:** fuenf Testdateien – `tonspur` (`ffmpeg-adapter/`), `media-protokoll-schema`
  (`media-protokoll.ts`), `dialog`, `handler-registrierung`, `import-medium` (alle
  `media-service/`). **29 Verhaltens-Mutationen**, **5 Refactorings**; 27 erkannt, **1 echte
  Luecke** (IM8) geschlossen, **MP5 aequivalent**; **0/5 Refactorings rot**; jede Mutation
  byte-identisch zurueckgenommen.
- **Die Luecke:** **IM8** – `String(error)` liefert `"Error: <meldung>"`; „enthaelt den Text"
  und „kein Stacktrace" blieben beide gruen. Neu: die Meldung ist **exakt** geprueft.
- **Nachmessung nach dem Ausbau (37 Faelle):** 28 von 32 erkannt. Weitere gruene Stellen sind
  **keine Verhaltensluecken**: **TO7** (Encoder-Tabelle mit einem Schluessel, aequivalent),
  **DI7** (Endungs-Literal – gedeckt durch die aus der Whitelist **abgeleiteten**
  Filter-Tests), **MP6** (zweiter `protocol.`-Griff, ohne Electron nicht beobachtbar –
  Lint-Kandidat).
- **Besonderheit:** `media-protokoll-schema` **bleibt als Test** – der Werte-Test (scheme +
  **fuenf** Privilegien, #364) ist kein Quelltext-Test. Entfernt wurden nur die Grep-Teile;
  die Datei verlaesst die Sperrklinke, weil sie nichts mehr liest.
- **Entfernt:** **34** Quelltext-/Meta-Tests (16 davon generiert), **1** Verhaltens-Test
  ergaenzt, **1** gekuerzt; Suite **5.450 → 5.417** (netto −33). **Sperrklinke:** 45 → **40**
  Dateien.
- **Ehrlich offen:** Architekturregeln ohne Waechter – Pfadfreiheit des Protokolls, kein
  `fs`/IPC in Dialog und Handler, „keine Uebersetzungsschicht", `new Date` genau einmal,
  kein eigenes Lock/Flush im Import. Lint-Kandidat; #448 (192 SAFETY) steht.
- **Gate:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.417 (340
  Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**.
- **Nicht gepusht:** `main` liegt vor `origin/main`; **Push nur auf Anweisung.**
- **Naechster Schritt: Mutations-Charge 19** – fuenf der verbleibenden **40**: `loesche-medium`,
  `export-handler-anmeldung`, `ziel-dialog`, `export-verdrahtung`, `render-handler-anmeldung`.
  Proben dort: „kein Kanal-Literal, kein `ipcMain.handle` doppelt" – die Verhaltens-Tests
  decken das Senden.

## STAND HEUTE (28.10.2026, einundzwanzigste Sitzung: Mutations-Charge 17) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-28-charge-18.md`](docs/agents/uebergabe-2026-10-28-charge-18.md).**
Einzelbefunde: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 30.

- **CHARGE 17 GEBAUT:** fuenf Testdateien, alle `src/main/ffmpeg-adapter/` – `bandspur`,
  `encoder-argumente`, `filter-einblendung`, `filter-vollbild`, `standbild`.
  **30 Verhaltens-Mutationen**, **5 Refactorings**; 25 erkannt, **3 echte Luecken**
  (BA4, ST3, ST5) geschlossen; **0/5 Refactorings rot**; jede Mutation byte-identisch
  zurueckgenommen.
- **Die Luecken:** **BA4** – die Bildrate von Schritt 1 war ein Literal (`String(30)`),
  weil jede gueltige Profil-Bildrate im Test 30 ist; neu: Profil mit **25 fps**. **ST3** –
  `-framerate` als `'30'`; **ST5** – `-f` als `'mp4'`; beide jetzt ueber ein abgewandeltes
  Profil (`25`, `mov`). Dazu war die **Container-Wache** (leer, `-`-Praefix, kein Text)
  ungeprueft; ST7/ST8 belegen den neuen Test.
- **Erst nach dem Ausbau sichtbar:** **EN2/EN3/EN4** (Profil, Pixelformat, Transfer als
  Literale) wurden zuvor **nur** von der entfernten Literal-Probe gefangen. Nachmessung
  ueber alle 41 Faelle: **40 erkannt, EN7 aequivalent** (Tabelle hat genau einen Schluessel;
  ein zweites Format erzwingt der `Record`-Typ, nicht ein Laufzeit-Test).
- **Entfernt:** **33** Quelltext-/Meta-Tests (davon **23 generiert** im `standbild`-Block
  „Abgrenzung"), **4** Verhaltens-Tests ergaenzt, **3** gekuerzt; Suite **5.479 → 5.450**
  (netto −29). **Sperrklinke:** 50 → **45** Dateien.
- **Ehrlich offen:** Die entfernten Architekturregeln sind ohne Waechter – kein Fremdimport
  in `bandspur`, nur Typ-Importe in den Filter-Adaptern, keine Fachbegriffe, kein
  Hardware-Encoder, Codec/Container als je eine Konstante. Lint-Kandidat. #448 (192 SAFETY)
  steht; die ffmpeg-Flaggen sind jetzt allein durch die Argument-Arrays gedeckt.
  **Treiber:** vier Laeufe waren zwischenzeitlich rot (CDP-Abriss/Timeouts), ohne
  Codeaenderung und ohne benannte Ursache; der naechste Lauf war gruen (Pilot Abschnitt 30).
- **Gate:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.450 (340
  Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**.
- **Nicht gepusht:** `main` liegt vor `origin/main`; **Push nur auf Anweisung.**
- **Naechster Schritt: Mutations-Charge 18** – fuenf der verbleibenden **45**: `tonspur`,
  `media-protokoll-schema`, `dialog`, `handler-registrierung`, `import-medium`.
  **Achtung:** `media-protokoll-schema` prueft die **fuenf Privilegien** (seit #364) –
  **Werte**, nicht Form: vor dem Entfernen genau lesen.

## STAND HEUTE (28.10.2026, zwanzigste Sitzung: Mutations-Charge 16) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-28-charge-16.md`](docs/agents/uebergabe-2026-10-28-charge-16.md).**
Einzelbefunde: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 29.

- **CHARGE 16 GEBAUT:** fuenf Testdateien – `queue-panel-wurzel`, `marken-uebersicht`,
  `marken-zugang`, `element-zeile`, `concat`. **23 Verhaltens-Mutationen**, **5 Refactorings**;
  21 erkannt, **2 echte Luecken** geschlossen, **QP3 aequivalent**; **0/5 Refactorings rot**;
  jede Mutation byte-identisch zurueckgenommen.
- **Die Luecken:** **EZ2** – der Test nahm eine Lage, die dem **Modell** entsprach; der Rueckfall
  von `begrenze` sah genauso aus, die Wache gegen NaN/Infinity war unsichtbar. Neu: bewegte Lage
  (ende 7.7) und `toBe(lage)`. **EZ4** – `!(spanne > 0)` deckte auch NaN, `=== 0` nicht; neu:
  `obergrenze: NaN` ⇒ `anteil` liefert 0.
- **Aequivalent:** **QP3** – `schliesseRueckfrage` raeumt die Meldung mit ab, aber Meldung und
  Rueckfrage sind nie gleichzeitig gesetzt (`meldeLeistenFehler` nullt die Rueckfrage).
- **Entfernt:** **8** Quelltext-/Meta-Tests, **0** ergaenzt, **2** geschaerft; Suite **5.487 →
  5.479** (netto −8). **Sperrklinke:** 55 → **50** Dateien.
- **Ehrlich offen:** Architektur-Verbote ohne Waechter (kein `sort`/`filter`/`slice`, keine
  Direktimporte zwischen Renderer-Bereichen, kein Timer) – Lint-Kandidat. #448 (192 SAFETY) steht.
- **Gate:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.479 (340
  Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**.
- **Nicht gepusht:** `main` liegt vor `origin/main`; **Push nur auf Anweisung.**
- **Naechster Schritt: Mutations-Charge 17** – fuenf der verbleibenden **50**:
  `bandspur`, `encoder-argumente`, `filter-einblendung`, `filter-vollbild`, `standbild`
  (alle `src/main/ffmpeg-adapter/`). **Der Plan fuer alle restlichen Chargen 17–26 steht in
  [`docs/agents/charge-17-26-plan.md`](docs/agents/charge-17-26-plan.md)**; die Uebergabe fuer
  die naechste Sitzung in
  [`docs/agents/uebergabe-2026-10-28-charge-17.md`](docs/agents/uebergabe-2026-10-28-charge-17.md).
  Sonderfall in Charge 26: `marke.spec.ts` liest den Vertrag – **vorher lesen**, ob es ein
  Vertragstest ist (dann bleibt er).

## STAND HEUTE (28.10.2026, neunzehnte Sitzung: Mutations-Charge 15) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-28-charge-15.md`](docs/agents/uebergabe-2026-10-28-charge-15.md).**
Einzelbefunde: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 28.

- **CHARGE 15 GEBAUT:** fuenf Testdateien – `marken-vorschau`, `medium-loeschen-anzeige`,
  `segment-anzeige`, `render-dialog-anzeige`, `speicherstatus-anzeige`. **25 Verhaltens-Mutationen**,
  **5 Refactorings**; 20 erkannt, **4 echte Luecken** geschlossen, **ML2 aequivalent**; **0/5
  Refactorings rot**; jede Mutation byte-identisch zurueckgenommen.
- **Die Luecken:** **ML5** – der Aktions-Absatz erschien auch **ohne** betroffene Aktionen.
  **ML7** – „Position 1/2" wurde nur aus `lage.text` gelesen, die **Listenzeile** war ungeprueft.
  **SG5** – der Zeichen-Effekt hing nur an `[aktion]`: Wechsel von **Vorlage oder Marke** liess
  das alte Bild stehen. **SS2** – `join(' und ')` statt `', '` blieb gruen.
- **TREIBER-BEFUND, GEMESSEN UND KORRIGIERT:** Der erste Gate-Lauf war **rot**
  (`Vorlagen (FA-13) :: nach dem Uebernehmen ist die Sitzung beendet`). Produktcode war
  nachweislich unveraendert (`git diff -- src/` leer). Vor der Korrektur **2 von 3 Laeufen rot**,
  danach **3 von 3 gruen**. Ursache: der Schritt las den DOM **einmal** direkt nach dem
  Store-Schreiben. **Korrektur in `scripts/durchlauf.mjs`:** Warten auf das Verschwinden des
  `arbeitskopie-kopf` mit **5 s Frist**. Messkorrektur, keine Produktaenderung.
- **Entfernt:** **6** Quelltext-/Meta-Tests, **3** Verhaltens-Tests ergaenzt; Suite **5.490 →
  5.487** (netto −3).
- **Sperrklinke:** 60 → **55** Dateien; ESLint gruen.
- **Gate:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.487 (340
  Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**.
- **Ehrlich offen:** Architektur-Verbote ohne Waechter (Lint-Kandidat); #448 (192 SAFETY).
- **Nicht gepusht:** `main` liegt vor `origin/main`; **Push nur auf Anweisung.**
- **Naechster Schritt: Mutations-Charge 16** – fuenf der verbleibenden **55**; Kandidaten:
  `queue-panel-wurzel` (556 Zeilen, mehrere Proben), `marken-uebersicht`, `marken-zugang`,
  `element-zeile`, `concat`.

## STAND HEUTE (28.10.2026, achtzehnte Sitzung: Mutations-Charge 14) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-28-charge-14.md`](docs/agents/uebergabe-2026-10-28-charge-14.md).**
Einzelbefunde: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 27.

- **CHARGE 14 GEBAUT:** fuenf Testdateien – `einblendung-anzeige`, `marken-speicherstatus`,
  `speicherstatus-verdrahtung`, `split-anzeige`, `video-ausschnitt`. **26 Verhaltens-Mutationen**,
  **5 Refactorings**; 23 erkannt, **2 echte Luecken** geschlossen (EN3, EN4); **0/5 Refactorings
  rot**; jede Mutation byte-identisch zurueckgenommen.
- **Die Luecken:** **EN3** – `abschnittMarke === null` war ungeprueft (Segment mit
  `marke={null}`). **EN4** – beide Marken im Test hatten dieselbe `id`, deshalb blieb
  `marke={props.rahmenMarke}` gruen; neu: zwei unterscheidbare Marken, das Segment traegt die
  **Abschnitts**marke.
- **Harness-Korrektur:** SV4 (`once('closed')` → `on('close')`) meldete „0 bestanden, 0 rot" –
  das Fenster-Doppel kennt nur `once`, die Suite lud nicht. Mit `once('close')` **erkannt**.
- **Entfernt:** **28** Testfaelle, **2** ergaenzt; Suite **5.516 → 5.490** (netto −26; die 18
  Flaggen-Proben in `video-ausschnitt` zaehlten einzeln). In `speicherstatus-verdrahtung` ist die
  Quelltext-Diff-Probe durch eine **Wertprobe** ersetzt (drei Kanaele paarweise verschieden).
- **Sperrklinke:** 65 → **60** Dateien; ESLint gruen, damit sind die Streichungen belegt.
- **Ehrlich offen:** Die 18 Flaggen-Verbote und „kein `node:fs`" in `video-ausschnitt` sind jetzt
  **ungeschuetzt** – Kandidat fuer eine dateibezogene Lint-Regel (wie #447 fuer den Renderer).
  Ebenso weiter offen: #448 (192 SAFETY-Kommentare).
- **Gate:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.490 (340
  Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**.
- **Nicht gepusht:** `main` liegt vor `origin/main`; **Push nur auf Anweisung.**
- **Naechster Schritt: Mutations-Charge 15** – fuenf der verbleibenden **60**; Kandidaten mit
  mehreren Proben: `marken-vorschau`, `medium-loeschen-anzeige`, `segment-anzeige`,
  `render-dialog-anzeige`, `queue-panel-wurzel`, `speicherstatus-anzeige`.

## STAND HEUTE (28.10.2026, siebzehnte Sitzung: Mutations-Charge 13) – historisiert durch den Abschnitt darueber

**Volltext: [`docs/agents/uebergabe-2026-10-28-charge-13.md`](docs/agents/uebergabe-2026-10-28-charge-13.md).**
Einzelbefunde: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 26.

- **CHARGE 13 GEBAUT:** fuenf Testdateien – `bibliothek-ansicht-ansicht`, `asset-auswahl-anzeige`,
  `einblendung-ansicht-anzeige` (`einblendung-ansicht.ts` + `.tsx`), `sicherheitsabstand-bearbeiten`,
  `speicherstatus-lage`. **26 Verhaltens-Mutationen**, **5 Refactorings**; 15 erkannt,
  **7 echte Luecken** geschlossen, **EI1/AS3 aequivalent**; **0/5 Refactorings rot**; jede
  Mutation byte-identisch zurueckgenommen.
- **Die Luecken:** **BI2** – der Hinweis „N Medien fehlen" war nur im Fall > 0 geprueft (immer
  sichtbar bei `>= 0`). **BI3/BI4** – Auswahl-Markierung (#418) und „· defekt" waren ungeprueft.
  **AS4** – nach einem Wurf blieb die Auswahl **dauerhaft gesperrt** (zwei Ruecksetzungen im
  `catch` fehlten im Test). **EX1** – erste Zeile „nach oben" war klickbar. **EI6** – eine
  Vorlagen-ID aus Leerzeichen galt als gueltig. **SL3** – die feste Reihenfolge
  `['projekt', 'vorlagen']` war ungeprueft.
- **Harness-Korrektur (transparent):** die sieben Mutationen an `einblendung-ansicht.ts` liefen
  zuerst gegen die **tsx**-Spec (`einblendung-ansicht-anzeige.spec.ts`) – alle 7 gruen. Die
  zugehoerige Spec ist `einblendung-ansicht.spec.ts`; nach der Korrektur 5 erkannt.
- **Entfernt:** **7** Quelltext-/Meta-Tests, **6** Verhaltens-Tests ergaenzt; Suite **5.517 →
  5.516** (netto −1). **Sperrklinke:** 70 → **65** Dateien.
- **Gate:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.516 (340
  Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**.
- **Ehrlich offen:** Architektur-Verbote ohne Waechter (Lint-Kandidat); Einzelquellen-Regeln nur
  durch Werte gedeckt; #448 (192 SAFETY-Kommentare) steht.
- **Nicht gepusht:** `main` liegt **29 Commits** vor `origin/main`; **Push nur auf Anweisung.**
- **Naechster Schritt: Mutations-Charge 14** – fuenf Dateien von den verbleibenden **65**;
  Kandidaten mit mehreren Proben: `einblendung-anzeige`, `marken-speicherstatus`,
  `speicherstatus-verdrahtung`, `split-anzeige`, `video-ausschnitt`, `einblendung-ansicht-anzeige`
  ist erledigt. Je Charge die fuenf Dateien aus der Sperrklinken-Liste streichen.

## STAND HEUTE (28.10.2026, sechzehnte Sitzung: Lint-Gate #447) – historisiert durch den Abschnitt darueber

**Volltext dieser Übergabe: [`docs/agents/uebergabe-2026-10-28-lint-gate.md`](docs/agents/uebergabe-2026-10-28-lint-gate.md).**
Issue: **#447** (gebaut), **#448** (neu, Schuld).

- **LINT-GATE GEBAUT (#447):** `npm run lint` = `eslint . && oxlint -c oxlint.config.ts`;
  `npm run pruefung` = `typecheck && lint && build && test && test:integration && durchlauf`.
  Vorher enthielt das Gate **weder Typecheck noch Lint**.
- **BEFUND VOR DEM BAU (gemessen):** `oxlint.config.ts` existierte mit den anti-slop-Regeln,
  aber **nichts rief Oxlint auf** – kein Skript, kein Workflow. Oxlint stand bei **196 Fehlern**
  (192 × `SAFETY`-Kommentar in `src`), die Kopfzeile des Konfigfiles behauptete „src-Fälle sind
  abgearbeitet". Diese Aussage ist **falsch**; sie steht jetzt richtig im File.
- **Oxlint auf 0 Fehler:** vier Test-Funde repariert (2 × `no-object-parameters` in
  `bootstrap-verdrahtung`, 2 × `no-conditional-empty-object-spread` in
  `marken-referenzpruefung`/`migriere-projekt-auf-marke`). Die 192 SAFETY-Funde gehen **nicht**
  in diesem Issue: die Regel steht auf `warn`, die Zahl steht im Kommentar, die Arbeit ist
  **#448**. Lauf heute: **0 Fehler, 258 Warnungen**.
- **Drei neue Schranken:** (1) `src/renderer/**` importiert nichts aus `src/main/**` (TK 9.1);
  (2) `window.api` nur in `src/renderer/ipc-client/**`; (3) **Sperrklinke** `lokal/quelltext-proben`:
  `readFileSync` auf `src/` in `tests/unit` ist nur in den **70** gelisteten Dateien erlaubt
  (`tools/eslint/quelltext-proben-ausnahmen.json`). Die Liste **darf nur schrumpfen** – jede
  Mutations-Charge streicht ihre fünf Dateien.
- **Vier Gegenproben, alle belegt und byte-identisch zurueckgenommen:** Renderer-Import aus
  `main` ⇒ rot; `window.api` in `composer/index.tsx` ⇒ rot; neue Probe in ungelisteter Datei ⇒
  rot; gelistete Datei aus der Liste gestrichen ⇒ rot.
- **Gate:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.517 (340
  Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**. Die Testzahlen sind
  unveraendert: dieser Bau aendert **keinen** Produktcode in `src/`.
- **Nicht gebaut, gemeldet:** `no-restricted-syntax` fuer `rufeAuf`/`KANAELE` in „reinen
  Modulen" ist **nicht** sauber ausdrueckbar – 46 `.ts`-Dateien im Renderer rufen legitim
  `rufeAuf`, `KANAELE` steht in 54 Dateien ueber neun Ordner. Eine Liste „reine Module" waere
  eine zweite Wahrheit; die Zusage bleibt bei den Verhaltens-Tests.
- **Nicht gepusht:** `main` liegt vor `origin/main`; **Push nur auf Anweisung.**
- **Naechster Schritt: Mutations-Charge 13** – fuenf Dateien; **neu im Rezept:** die fünf
  Dateien danach aus `tools/eslint/quelltext-proben-ausnahmen.json` streichen (die Sperrklinke
  beweist dann, dass ihre Proben wirklich weg sind).

## STAND HEUTE (28.10.2026, fünfzehnte Sitzung: Mutations-Charge 12) – historisiert durch den Abschnitt darueber

**Volltext dieser Übergabe: [`docs/agents/uebergabe-2026-10-28-charge-12.md`](docs/agents/uebergabe-2026-10-28-charge-12.md).**
Die Einzelbefunde stehen in [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 24.

- **CHARGE 12 GEBAUT:** fünf Testdateien – `bibliothek-ansicht`, `ausgabe-liste-ansicht`,
  `buehne`, `einblendung-stile-rechnung`, `ausgabe-platzieren`. **30 Verhaltens-Mutationen**,
  **5 Refactorings**; 25 erkannt, **4 echte Luecken** geschlossen (**AL4, BU4, BU5, AP3**),
  **AL3/ES4/AP4/AP6 aequivalent**; **0/5 Refactorings rot**; jede Mutation byte-identisch
  zurueckgenommen.
- **Die Luecken:** **AL4** – der Export-Knopf gab bei mehreren Zeilen `dateien[0]` statt der
  eigenen Datei (mit einer Testzeile unsichtbar); neu: zwei Zeilen, zweiter Knopf ⇒ zweite
  Datei. **BU4/BU5** – `transformOrigin: 'center'` und `backgroundColor: '#FFFFFF'` blieben
  gruen; jetzt im Raster-Test festgenagelt. **AP3** – `EPERM` fehlte in der
  Wiederholungs-Wache (`['EBUSY']` war 32/32 gruen); neu: EPERM wiederholt viermal und endet
  in `speicher_fehler`.
- **Zwei Faelle fing NUR die Grep-Probe:** **ES1** (`bandHöhe: höhe`) – bei der echten
  `berechneBandGeometrie` ist `1080 − bandY` immer `höhe`; **Ersatz** ist eine Attrappe der
  geteilten Rechnung (`vi.doMock`, `bandY: 900` bei `H = 162` ⇒ `bandHöhe: 180`), Gegenprobe
  erkannt. **ES4** (`bandBreite: 1920` statt `RENDER_PROFILE.breite`) bleibt nach dem
  Entfernen gruen = ehrliche Einzelquellen-Luecke.
- **Entfernt:** **9** Quelltext-/Meta-Tests, **3** Verhaltens-Tests ergaenzt; Suite
  **5.523 → 5.517** (netto −6). Die zwei eingebetteten `QUELLTEXT`-Zeilen in
  `ausgabe-platzieren` („kein `copyFile`/`createReadStream`") sind durch die Zieldatei
  ersetzt: nach EXDEV liegt dort noch „alt", ein `copyFile` laege als „bytes".
- **Gate:** `npm run pruefung` **Exit 0** – Unit **5.517 (340 Dateien)**, Integration **49
  (12 Dateien)**, Treiber **0 Befunde**; Typecheck/Lint 0 davor.
- **Inventar nach Charge 12:** **83** Testdateien mit `readFileSync` (vorher 87), **61** mit
  Grep-/Bauvorschriften-`describe` (breite Namenssuche; die 56 der Vorcharge stammen aus einer
  engeren Definition und sind nicht direkt vergleichbar).
- **Ehrlich offen:** Architektur-Verbote (kein IPC, kein zweiter Schreibweg, kein eigener
  Zustand, kein Kanal-Literal, kein JSX in reinen Modulen) haben **keinen Waechter** bis zu
  einer Lint-Regel; Einzelquellen-Regeln sind nur noch durch Werte gedeckt (belegt durch ES4).
- **Nicht gepusht:** `main` liegt **25 Commits** vor `origin/main`; **Push nur auf Anweisung.**
- **Naechster Schritt: Mutations-Charge 13** – Inventur, dann fuenf Dateien; naheliegende
  Kandidaten: `bibliothek-ansicht-ansicht`, `asset-auswahl-anzeige`,
  `einblendung-ansicht-anzeige` sowie die Einzelproben in `speicherstatus-*`,
  `sicherheitsabstand-bearbeiten`, `vorschau-auswahl-rechnung`, `video-filmstreifen-blob`,
  `split-anzeige`.

## STAND HEUTE (28.10.2026, Übergabe nach Mutations-Chargen 1–11) – historisiert durch den Abschnitt darueber

**Volltext dieser Übergabe: [`docs/agents/uebergabe-2026-10-28-mutationen.md`](docs/agents/uebergabe-2026-10-28-mutationen.md).**
Die Einzelbefunde stehen in [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitte 13–23.

- **ELF MUTATIONS-CHARGEN GEBAUT (28.10.2026):** **55 Testdateien**, **271 Mutationen**,
  **27 echte Lücken** mit Verhaltens-Tests geschlossen, **186 Quelltext-/Meta-Tests entfernt**,
  **17 Verhaltens-Tests ergaenzt**. Suite **5.692 → 5.523** (340 Dateien).
- **Gate am Ende:** `npm run pruefung` **Exit 0** – Unit **5.523 (340 Dateien)**,
  Integration **49 (12 Dateien)**, Treiber **0 Befunde**; Typecheck/Lint 0.
- **Werkzeug neu im Repo:** `tools/mutationen.py` (JSON-Fallliste, Mutation, Testlauf,
  byte-identische Ruecknahme mit Pruefsumme). Aufruf:
  `python3 tools/mutationen.py faelle.json`.
- **Methode unveraendert:** Datei fuer Datei, **nie pauschal**; eine gruene Mutation ist
  entweder eine Luecke (Verhaltens-Test) oder **aequivalent** (begruenden, Wache stehen
  lassen). Drei Refactoring-Versuche brachen die Suite (Property-Namen/Plural/Importe) und
  wurden verworfen – **nur lokale Namen oder Kommentare** umbenennen.
- **Inventar nach Charge 11:** **87** Testdateien mit `readFileSync` (Start 140), **56** mit
  Grep-/Bauvorschriften-`describe` (Namenssuche, Obergrenze), **67** Describe-Bloecke, die
  wirklich eine Quelldatei lesen.
- **Bewusst stehen geblieben:** die Union-Vollstaendigkeit in `fehlertexte`, der
  Projekt-Historie-Spion in `undo-vorlage`, die Kanal-Registry-Tests in
  `project-store-nachtrag`/`vorlagen-nachtrag` (Werte, kein Quelltext).
- **Ehrlich offen:** Architektur-Verbote (kein IPC, kein zweiter Schreibweg, kein eigener
  Zustand, kein Kanal-Literal) haben **keinen Waechter** bis zu einer Lint-Regel;
  Einzelquellen-Regeln sind nur noch durch Verhalten gedeckt.
- **Nicht gepusht:** `main` liegt **23 Commits** vor `origin/main`; **Push nur auf Anweisung.**
- **Naechster Schritt: Mutations-Charge 12** – Inventur, dann fuenf Dateien nach dem Rezept;
  naheliegende Kandidaten: `ausgabe-platzieren` (7 Proben, teils eingebettet),
  `einblendung-ansicht-anzeige`, `einblendung-stile-rechnung`, `asset-auswahl-anzeige`,
  `buehne`, `bibliothek-ansicht`, `ausgabe-liste-ansicht`.

## STAND HEUTE (28.10.2026, vierzehnte Sitzung: Mutations-Charge 11) – historisiert durch den Abschnitt darueber

**Volltext der Charge: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 23.**

- **Charge 11 GEBAUT (`60a0a1f`):** fuenf Testdateien – `vorschau-anzeige`, `split-stile-rechnung`,
  `png-ablage`, `nutzung-anzeigen-ansicht`, `inhalte-reiter`. **21 Verhaltens-Mutationen**,
  **5 Refactorings**; 17 erkannt, **NA4/IN4** als Luecken geschlossen, **VV3/IN2 aequivalent**;
  **0/5 Refactorings rot**; jede Mutation byte-identisch zurueckgenommen.
- **Die Luecken:** **NA4** – die Umschalter-Beschriftung im aufgeklappten Zustand war
  ungeprueft (jetzt exakt „Trefferliste ausblenden"). **IN4** – `hervorgehobeneAktionId`
  war nur mit `null` geprueft (`null === null` ist auch bei einer Konstante gruen); jetzt mit
  gesetztem Wert.
- **Aequivalent:** **VV3** – `schriftenBereit = true` wirkt nur im Zweig, in dem der Wert
  ohnehin `true` ist. **IN2** – `ProjektStandReiter` wird nur fuer `zusammenstellen`/`aktionen`
  benutzt, dort ist der Leerzustand ohne Projekt immer richtig.
- **Transparent:** Drei Refactoring-Versuche (`stand`, `gruppe`, `geometrie`) brachen die
  Suiten (trafen `setStand`-nahe Bezeichner, `anzeige.gruppen`, Importnamen) – ersetzt durch
  Kommentar-Umformulierungen.
- **Entfernt:** **10** Quelltext-/Meta-Tests (2 + 2 + 2 + 2 + 2), **1** Verhaltenstest
  ergaenzt, **2** geschaerft; Suite **5.532 → 5.523** (netto −9).
- **Gate:** `npm run pruefung` **Exit 0** – Unit **5.523 (340 Dateien)**, Integration **49
  (12 Dateien)**, Treiber **0 Befunde**; Typecheck/Lint 0 davor.
- **Inventar neu:** **87** Testdateien mit `readFileSync` (vorher 91), **56** mit
  Grep-/Bauvorschriften-`describe` (vorher 61); verfeinert lesen **67** Describe-Bloecke
  wirklich eine Quelldatei.
- **Ehrlich offen:** Die entfernten Architektur-Verbote haben keinen Waechter bis zu einer
  Lint-Regel.
- **Nicht gepusht:** `60a0a1f` liegt lokal; **Push nur auf Anweisung.** **Naechster Schritt:
  Charge 12** – Inventur, dann fuenf Dateien.

## STAND HEUTE (28.10.2026, dreizehnte Sitzung: Mutations-Charge 10) – historisiert durch den Abschnitt darueber

**Volltext der Charge: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 22.**

- **Charge 10 GEBAUT (`b3fcb19`):** fuenf Testdateien – `liste-ansicht`, `listen-zeilen`,
  `leerzustand`, `leerzustand-regel`, `dauer-regler`. **23 Verhaltens-Mutationen**,
  **5 Refactorings**; 19 erkannt, **drei Darstellungs-Luecken** (LE3, LE4, LZ3) geschlossen;
  **0/5 Refactorings rot**; jede Mutation byte-identisch zurueckgenommen.
- **Die Luecken:** **LE3** – `role="status"` war ungeprueft. **LE4** – die
  Knopf-Beschriftung war nur „enthaelt Projekte" (jetzt exakt „Zum Reiter Projekte").
  **LZ3** – ein Status ausserhalb der Union war ungeprueft; neu: Rohwert statt
  Ersatztext („quatsch" ⇒ „quatsch").
- **Harness-Korrektur:** `LZ4` liess einen Kommentar im Suchtext aus (kein Befund);
  nachgeholt, die vorhandene Leerlisten-Probe fing die Mutation.
- **Entfernt:** **10** Quelltext-/Meta-Tests (2 + 2 + 2 + 2 + 2), **1** Verhaltenstest
  ergaenzt, **2** geschaerft; Suite **5.541 → 5.532** (netto −9).
- **Gate:** `npm run pruefung` **Exit 0** – Unit **5.532 (340 Dateien)**, Integration **49
  (12 Dateien)**, Treiber **0 Befunde**; Typecheck/Lint 0 davor.
- **Inventar neu:** **91** Testdateien mit `readFileSync` (vorher 96), **61** mit
  Grep-/Bauvorschriften-`describe` (vorher 66); verfeinert lesen **72** Describe-Bloecke
  wirklich eine Quelldatei.
- **Ehrlich offen:** Die entfernten Architektur-Verbote haben keinen Waechter bis zu einer
  Lint-Regel; die „ein Format je Zeile"-Regel ist nur noch durch Verhalten gedeckt.
- **Nicht gepusht:** `b3fcb19` liegt lokal; **Push nur auf Anweisung.** **Naechster Schritt:
  Charge 11** – Inventur, dann fuenf Dateien.

## STAND HEUTE (28.10.2026, zwoelfte Sitzung: Mutations-Charge 9) – historisiert durch den Abschnitt darueber

**Volltext der Charge: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 21.**

- **Charge 9 GEBAUT (`1c339a8`):** fuenf Testdateien – `quelle`, `reparatur-fuehrung-shell`,
  `undo-aufzeichnung-vorlage`, `transport`, `vorlagen-uebersicht`. **25 Verhaltens-Mutationen**,
  **5 Refactorings**; 23 erkannt, **T4/VU1** als Luecken geschlossen, **Q2 aequivalent**;
  **0/5 Refactorings rot** (RR verworfen, s. u.); jede Mutation byte-identisch zurueckgenommen.
- **Die Luecken:** **T4** – die Tick-Grenze war nur mit Ueberschuss geprueft (1000 ms auf eine
  20-Frame-Achse = 30 Frames); neu: frame 19 + GENAU eine Frame-Dauer ⇒ frame 20, `laeuft: false`.
  **VU1** – nur der Fehler der ZWEITEN Liste war geprueft; `listeVorlagen` scheitert nun belegt
  mit `ok: false` statt Absturz beim `map`.
- **Aequivalent:** **Q2** – nach `endsWith(".mp4")` ist `length <= 4` gleichbedeutend mit `=== 4`.
- **Transparent:** Der Refactoring-Versuch `wechselZu` → `zielReiter` benannte die PROPERTY
  `FuehrungsSchritt.wechselZu` um (9 Tests rot) – kein harmloses Refactoring; ersetzt durch
  `neueLage` → `naechsteLage`, gruen.
- **Entfernt:** **9** Quelltext-/Meta-Tests + **1** eingebetteter Quelltext-Block, **2**
  Verhaltenstests ergaenzt; Suite **5.548 → 5.541** (netto −7).
- **Gate:** `npm run pruefung` **Exit 0** – Unit **5.541 (340 Dateien)**, Integration **49
  (12 Dateien)**, Treiber **0 Befunde**; Typecheck/Lint 0 davor.
- **Inventar neu:** **96** Testdateien mit `readFileSync` (vorher 101), **66** mit
  Grep-/Bauvorschriften-`describe` (vorher 69); verfeinert lesen **77** Describe-Bloecke
  wirklich eine Quelldatei.
- **Ehrlich offen:** Die entfernten Architektur-Verbote haben keinen Waechter bis zu einer
  Lint-Regel.
- **Nicht gepusht:** `1c339a8` liegt lokal; **Push nur auf Anweisung.** **Naechster Schritt:
  Charge 10** – Inventur, dann fuenf Dateien.

## STAND HEUTE (28.10.2026, elfte Sitzung: Mutations-Charge 8) – historisiert durch den Abschnitt darueber

**Volltext der Charge: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 20.**

- **Charge 8 GEBAUT (`8ffa008`):** fuenf Testdateien – `kaputt-erkennung`, `validierung`,
  `torwaechter`, `eingebaute-vorlagen`, `beende-auftrag`. **24 Verhaltens-Mutationen**,
  **5 Refactorings**; **22 erkannt, 2 aequivalent, keine Luecke**; **0/5 Refactorings rot**;
  jede Mutation byte-identisch zurueckgenommen.
- **Aequivalent:** **T5** – der abgelehnte Uebergang ist ueber die oeffentliche Q1-Schnittstelle
  nicht erreichbar (`naechsterAnstehender` liefert nur `anstehend`, der Uebergang ist erlaubt).
  **BA2** – ein unbekannter Handler-Status wird ohnehin von der Uebergangstabelle abgewiesen,
  BEVOR `status` geschrieben wird; die Wache verbessert nur die Meldung.
- **Trotzdem ergaenzt:** ein Test „Ausgang ohne bekannten Status veraendert nichts" – er
  dokumentiert die Zusage, faengt die aequivalente Mutation aber nicht.
- **Harness-Korrekturen (keine Code-Befunde):** `T3`/`EV3`/`EV6` trafen mehrere Stellen;
  mit eindeutigem Kontext nachgeholt, `EV6` entfiel (24 statt 25 Mutationen).
- **Entfernt:** **13** Quelltext-/Meta-Tests (4 + 4 + 2 + 2 + 1), **1** Verhaltenstest
  ergaenzt; Suite **5.560 → 5.548** (netto −12).
- **Gate:** `npm run pruefung` **Exit 0** – Unit **5.548 (340 Dateien)**, Integration **49
  (12 Dateien)**, Treiber **0 Befunde**; Typecheck/Lint 0 davor.
- **Inventar neu:** **101** Testdateien mit `readFileSync` (vorher 106), **69** mit
  Grep-/Bauvorschriften-`describe` (vorher 70); verfeinert lesen **82** Describe-Bloecke
  wirklich eine Quelldatei.
- **Ehrlich offen:** Die entfernten Architektur-Verbote haben keinen Waechter bis zu einer
  Lint-Regel; die `await`-Freiheit zwischen Pruefung und Statuswechsel ist nur noch mittelbar
  gedeckt.
- **Nicht gepusht:** `8ffa008` liegt lokal; **Push nur auf Anweisung.** **Naechster Schritt:
  Charge 9** – Inventur, dann fuenf Dateien.

## STAND HEUTE (28.10.2026, zehnte Sitzung: Mutations-Charge 7) – historisiert durch den Abschnitt darueber

**Volltext der Charge: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 19.**

- **Charge 7 GEBAUT (`c0531b6`):** fuenf Testdateien – `start`, `sichten`, `projektzustand`,
  `pruefungen`, `project-store-nachtrag`. **25 Verhaltens-Mutationen**, **5 Refactorings**;
  21 erkannt, **vier Zustands-Luecken** (ST5, S2, S3, S4) mit Verhaltens-Tests geschlossen;
  **0/5 Refactorings rot**; jede Mutation byte-identisch zurueckgenommen.
- **Die Luecken:** **ST5** – der Rueckgabewert `reiter` war geprueft, der tatsaechliche
  `wechsleReiter`-Aufruf nicht (jetzt `holeReiter()`). **S2** – der Abbruch bei gescheiterter
  Vorlagen-Uebersicht war ungeprueft. **S3/S4** – der Zeichnen-Stand (`hole()` nach
  `bereiteVor`, Zuruecksetzen beim Verwerfen) hatte keinen Test; neu mit gemockter
  `zeichen-vorbereitung`.
- **Transparent:** Der erste Refactoring-Versuch in `project-store-nachtrag` (alle
  `nutzlast` → `eingang`) brach die Suite beim Sammeln ab (0 Tests) – **kein** harmloses
  Refactoring; ersetzt durch eine Kommentar-Umformulierung, die gruen blieb.
- **Entfernt:** **14** Quelltext-/Meta-Tests (3 + 3 + 3 + 2 + 3), **2** Verhaltenstests
  ergaenzt; Suite **5.572 → 5.560** (netto −12). Der Registry-Test in
  `project-store-nachtrag` ist **geblieben** (prueft Werte).
- **Gate:** `npm run pruefung` **Exit 0** – Unit **5.560 (340 Dateien)**, Integration **49
  (12 Dateien)**, Treiber **0 Befunde**; Typecheck/Lint 0 davor.
- **Inventar neu:** **106** Testdateien mit `readFileSync` (vorher 111), **70** mit
  Grep-/Bauvorschriften-`describe` (vorher 74); verfeinert lesen **89** Describe-Bloecke
  wirklich eine Quelldatei.
- **Ehrlich offen:** Die entfernten Architektur-Verbote haben keinen Waechter bis zu einer
  Lint-Regel.
- **Nicht gepusht:** `c0531b6` liegt lokal; **Push nur auf Anweisung.** **Naechster Schritt:
  Charge 8** – Inventur, dann fuenf Dateien.

## STAND HEUTE (28.10.2026, neunte Sitzung: Mutations-Charge 6) – historisiert durch den Abschnitt darueber

**Volltext der Charge: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 18.**

- **Charge 6 GEBAUT (`82ce9b9`):** fuenf Testdateien – `vorlage-waehlen`, `band-takt`,
  `undo-vorlage`, `aktions-auswahl-anzeige`, `vorlagen-nachtrag`. **25 Verhaltens-Mutationen**,
  **5 Refactorings**; **24 erkannt, 1 aequivalent, keine Luecke** – der erste Durchgang ohne
  Nachbesserung seit Beginn der Chargen; **0/5 Refactorings rot**; jede Mutation
  byte-identisch zurueckgenommen.
- **Aequivalent:** **B5** – die Endlichkeitspruefung fuer `lokalerFrame` ist redundant
  (`NaN % rundeFrames` ist NaN, `Infinity` faengt `>= elementFrames`, Negative faengt `< 0`);
  bleibt als defensive Absicherung.
- **Entfernt:** **17** Quelltext-/Meta-Tests (4 + 4 + 3 + 3 + 3), **0** ergaenzt; Suite
  **5.589 → 5.572** (netto −17). **Geblieben:** der Spion-Test „Projekt-Historie bleibt
  unberuehrt (#234)" und der Registry-Test „Kanal-Registry nach #255" – beide pruefen
  Verhalten bzw. Werte, keinen Quelltext.
- **Gate:** `npm run pruefung` **Exit 0** – Unit **5.572 (340 Dateien)**, Integration **49
  (12 Dateien)**, Treiber **0 Befunde**; Typecheck/Lint 0 davor.
- **Inventar neu:** **111** Testdateien mit `readFileSync` (vorher 116), **74** mit
  Grep-/Bauvorschriften-`describe` (vorher 79); verfeinert lesen **95** Describe-Bloecke
  wirklich eine Quelldatei.
- **Ehrlich offen:** Die entfernten Architektur-Verbote haben keinen Waechter bis zu einer
  Lint-Regel.
- **Nicht gepusht:** `82ce9b9` liegt lokal; **Push nur auf Anweisung.** **Naechster Schritt:
  Charge 7** – Inventur, dann fuenf Dateien.

## STAND HEUTE (28.10.2026, achte Sitzung: Mutations-Charge 5) – historisiert durch den Abschnitt darueber

**Volltext der Charge: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 17.**

- **Charge 5 GEBAUT (`9a804eb`):** fuenf Testdateien – `liste`, `ausgabe-liste`,
  `leiste-zeile`, `buehne-skalierung`, `nutzung-anzeigen`. **25 Verhaltens-Mutationen**,
  **5 Refactorings**; 21 erkannt, **vier Fixture-Luecken** (Z3, Z4, B4, N3) mit
  Verhaltens-Tests geschlossen, **0/5 Refactorings rot**; jede Mutation byte-identisch
  zurueckgenommen.
- **Das Muster:** Drei der vier Luecken waren **zufaellig deckende Fixtures** – ein
  0×0-Kasten (bei dem auch der Normalpfad Nullen liefert), ein Projekt in BEIDEN Listen
  (der zweite Zaehl-Durchlauf war unsichtbar), ein einzelner laufender Auftrag („der
  ERSTE gewinnt" ungeprueft). Dazu die ungepruefte Fortschritts-Klammer (150/-10).
- **Gegenproben:** Z3, Z4, B4, N3 nach den Korrekturen **alle erkannt**.
- **Entfernt:** **14** Quelltext-/Meta-Tests (3 + 2 + 3 + 3 + 3), **3** Verhaltenstests
  ergaenzt; Suite **5.600 → 5.589** (netto −11).
- **Gate:** `npm run pruefung` **Exit 0** – Unit **5.589 (340 Dateien)**, Integration **49
  (12 Dateien)**, Treiber **0 Befunde**; Typecheck/Lint 0 davor.
- **Inventar neu:** **116** Testdateien mit `readFileSync` (vorher 121), **79** mit
  Grep-/Bauvorschriften-`describe` (vorher 84); verfeinert lesen **101** Describe-Bloecke
  wirklich eine Quelldatei.
- **Ehrlich offen:** Die entfernten Architektur-Verbote haben keinen Waechter bis zu einer
  Lint-Regel; die Re-Export-Regel (`ProjektMeta`/`AusgabeDatei`) ist nur noch durch die
  importierenden Stellen gedeckt.
- **Nicht gepusht:** `9a804eb` liegt lokal; **Push nur auf Anweisung.** **Naechster Schritt:
  Charge 6** – Inventur, dann fuenf Dateien.

## STAND HEUTE (28.10.2026, siebte Sitzung: Mutations-Charge 4) – historisiert durch den Abschnitt darueber

**Volltext der Charge: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 16.**

- **Charge 4 GEBAUT (`2e80e4c`):** fuenf Testdateien – `zonen-canvas`, `zone-bild`,
  `video-anzeige`, `kontrast`, `export-dialog`; dazu zwei Gegenproben gegen `video-zeit.spec.ts`.
  **25 Verhaltens-Mutationen**, **5 Refactorings**; 18 erkannt, **6 echte Luecken** (ZC6, ZC7,
  V1, E1, VZ1, VZ2), **K4 aequivalent**; **0/5 Refactorings rot**; jede Mutation byte-identisch
  zurueckgenommen.
- **Das Muster:** Fuenf der sechs Luecken waren **selbstbezuegliche oder randlose Tests** – die
  Mindestkante wurde gegen ihre eigene Konstante geprueft (0 blieb gruen), der
  Gross-/Kleinschreibungs-Test suchte einen Namen, den der Bestand gar nicht enthielt, die
  End- und Toleranzgrenzen lagen neben dem Rand, NaN war nur auf der Ist-Seite geprueft.
  Alle sechs mit Verhaltens-Tests geschlossen (Zahl 8 fest, Gleichstand 45/155, `soll =
  trimEnde`, echter Fallvariante, 5 ↔ 5,25, NaN als Soll).
- **Aequivalent:** **K4** – die [1, 21]-Klammer ist fuer gueltige Hex-Werte redundant (die
  WCAG-Formel liefert den Bereich selbst); bleibt als defensive Absicherung.
- **Gegenproben:** ZC6/ZC7/V1/E1/VZ1/VZ2 nach den Korrekturen **alle erkannt**, K4 erneut
  gruen – damit als aequivalent belegt.
- **Entfernt:** **22** Quelltext-/Meta-Tests (6 + 4 + 3 + 5 + 4), **1** Verhaltenstest ergaenzt,
  **4** geschaerft; Suite **5.621 → 5.600** (netto −21).
- **Gate:** `npm run pruefung` **Exit 0** – Unit **5.600 (340 Dateien)**, Integration **49
  (12 Dateien)**, Treiber **0 Befunde**; Typecheck/Lint 0 davor.
- **Inventar neu:** **121** Testdateien mit `readFileSync` (vorher 126), **84** mit
  Grep-/Bauvorschriften-`describe` (vorher 88); verfeinert lesen **106** Describe-Bloecke
  wirklich eine Quelldatei.
- **Ehrlich offen:** Die entfernten Architektur- und Kommentar-Proben haben keinen Waechter
  bis zu einer Lint-Regel; die Einzelquellen-Regeln (RENDER_PROFILE, SICHERHEITSABSTAND,
  Kanal-Registry) sind nur noch durch Verhalten gedeckt.
- **Nicht gepusht:** `2e80e4c` liegt lokal; **Push nur auf Anweisung.** **Naechster Schritt:
  Charge 5** – Inventur, dann fuenf Dateien.

## STAND HEUTE (28.10.2026, sechste Sitzung: Mutations-Charge 3) – historisiert durch den Abschnitt darueber

**Volltext der Charge: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 15.**

- **Charge 3 GEBAUT (`a8e2e32`):** fuenf Testdateien – `filter-split`, `reparatur-fuehrung`,
  `inspektor`, `bild-laden`, `zone-deko`. **25 Verhaltens-Mutationen**, **5 harmlose
  Refactorings**; 23 erkannt, **F2 gruen** (echte Luecke), **I3 gruen** (aequivalent),
  **0/5 Refactorings rot**; jede Mutation byte-identisch zurueckgenommen.
- **Die Luecke:** Die Vierer-Regel war nur als „gerade" geprueft – der bestehende Test nutzt
  1557 (ungerade), eine **gerade** Breite ohne 4er-Teilbarkeit (1558) kam durch. Der erste
  neue Test prueft nur die Zahl in der Meldung und blieb gruen, weil die spaetere
  „nicht mittig"-Meldung dieselbe Zahl traegt; erst `toContain("Vielfaches von 4")` beisst.
  **Lehre: eine Meldung mit der richtigen Zahl ist kein Beleg fuer den richtigen Grund.**
- **Aequivalent:** **I3** – die Zwischenklammer fuer `x` ist redundant, weil
  `begrenzeAufFlaeche` den fertigen Rahmen ohnehin in die Flaeche klemmt. Bleibt als
  defensive Absicherung stehen (Klasse Z8 aus Pilot 2).
- **Entfernt:** **25** Quelltext-/Meta-Tests (je 5 in den fuenf Dateien), **1** Verhaltenstest
  ergaenzt; Suite **5.645 → 5.621** (netto −24). Die „41 Tests" bei `filter-split` waren ein
  Artefakt der Blockzaehlung – der Describe hat vier Tests, die Proben sassen verteilt.
- **Gate:** `npm run pruefung` **Exit 0** – Unit **5.621 (340 Dateien)**, Integration **49
  (12 Dateien)**, Treiber **0 Befunde**; Typecheck/Lint 0 davor.
- **Inventar neu:** **126** Testdateien mit `readFileSync` (vorher 131), **88** mit
  Grep-/Bauvorschriften-`describe` (vorher 91); verfeinert lesen **110** Describe-Bloecke
  wirklich eine Quelldatei.
- **Ehrlich offen:** Die entfernten Architektur-Verbote haben weiterhin **keinen Waechter**
  bis zu einer Lint-Regel.
- **Nicht gepusht:** `a8e2e32` liegt lokal; **Push nur auf Anweisung.** **Naechster Schritt:
  Charge 4** – Inventur, dann fuenf Dateien; Kandidaten sind `zonen-canvas`,
  `video-anzeige` und die Marken-Editor-Nachbarn von `akzentfarbe`.

## STAND HEUTE (28.10.2026, fuenfte Sitzung: Mutations-Charge 2) – historisiert durch den Abschnitt darueber

**Volltext der Charge: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 14.**

- **Charge 2 GEBAUT (`250f28d`):** fuenf Testdateien – `liste-reorder`, `reiter`,
  `kontrast-warnung`, `akzentfarbe`, `zone-text`. **26 Verhaltens-Mutationen**, **5 harmlose
  Refactorings**; im ersten Lauf 24 erkannt, **A2 gruen** (echte Luecke), **R2** traf die
  Zeichenkette des Harness nicht (kein Code-Befund, nachgeholt). Endstand **26/26 erkannt**,
  **0/5 Refactorings rot**; jede Mutation byte-identisch zurueckgenommen.
- **Die Luecke:** `istAkzentfarbe` prueft `/^#[0-9a-fA-F]{6}$/`; ohne `^` akzeptierte die
  Funktion auch `x#FF4040`, und kein Test fiel. Neu steht `x#FF4040` in der
  Ablehnungstabelle – die Pruefung ist GANZSTRINGIG.
- **Gegenproben:** **A2** und **R2** (die im Kommentar verbotene „Korrektur um eins")
  erkannt; **Z6** (`fillStyle = "#202020"` statt `loeseFarbe`) und **R7** (`return
  kopie.sort()`) belegen, dass die entfernten Grep-Proben „kein Farb-Literal" und
  „sortiert nirgends" durch Verhaltenstests ersetzt sind.
- **Entfernt:** **29** Quelltext-/Meta-Tests (7 + 5 + 6 + 4 + 7), **1** Fall ergaenzt,
  **1** Test geschaerft; Suite **5.673 → 5.645** (netto −28).
- **Gate:** `npm run pruefung` **Exit 0** – Unit **5.645 (340 Dateien)**, Integration **49
  (12 Dateien)**, Treiber **0 Befunde**; Typecheck/Lint 0 davor.
- **Inventar neu:** **131** Testdateien mit `readFileSync` (vorher 136), **91** mit
  Grep-/Bauvorschriften-`describe` (vorher 95); verfeinert lesen **116** Describe-Bloecke
  wirklich eine Quelldatei.
- **Ehrlich offen:** Die entfernten Architektur-Verbote (kein IPC, kein eigener Zustand,
  kein zweiter Import, kein try/catch) haben weiterhin **keinen Waechter**, bis eine
  Lint-Regel steht. Das Schwellenwert-Literal ist verhaltensseitig abgedeckt
  („verschiedene Werte" kann ein eingebauter Wert nicht bestehen).
- **Nicht gepusht:** `250f28d` liegt lokal; **Push nur auf Anweisung.** **Naechster
  Schritt: Charge 3** – Inventur, dann fuenf Dateien; die naechsten Kandidaten sind
  `filter-split` (41 Tests in einem quelltextlesenden Block) und `reparatur-fuehrung` (23),
  der Name allein ist aber kein Befund.

## STAND HEUTE (28.10.2026, vierte Sitzung: Mutations-Charge 1) – historisiert durch den Abschnitt darueber

**Volltext der Charge: [`docs/agents/mutation-pilot-2026-10-20.md`](docs/agents/mutation-pilot-2026-10-20.md), Abschnitt 13.**

- **Charge 1 GEBAUT (`3eeb9a4`):** fuenf Testdateien – `fehlertexte`, `liste-ansicht-anzeige`,
  `uebergabe-anzeige`, `speichern`, `element-hinzufuegen`. **26 Verhaltens-Mutationen** und
  **5 harmlose Refactorings**; **22 erkannt**, vier gruen = echte Luecken, **0/5 Refactorings
  rot**. Jede Mutation vor dem Lauf gesichert und nach dem Lauf **byte-identisch** zurueckgenommen
  (Pruefsumme je Datei; Harness ausserhalb des Repos).
- **Vier Luecken geschlossen:** **L2** – der Abbruch-Merker der Thumbnails war ungeprueft (der
  Test endete mit `toBeDefined`/`void`); jetzt erscheint das zweite Bild und das veraltete erste
  ersetzt es nicht. **L3** – `data-kaputt` war nie geprueft; ein reiner `band_abschnitt`-Defekt
  markiert die Zeile jetzt belegt. **S2** – die Sperren-Zahl zaehlte Warnungen mit; neu: eine
  Sperre + eine Warnung ⇒ „1 Sperre(n)". **E3** – die Positions-Klammer war ungeprueft; `-1`
  fuegt jetzt belegt an Index 0 ein (fuer `> laenge` ist die Klammer aequivalent zu `slice`).
- **Gegenproben:** fuenf Mutationen, **alle erkannt** – L2/L3/S2/E3 erneut und **F6**
  (`TABELLE.get(fehler.code.toLowerCase())`) als Beleg, dass der neue Exakt-Vergleichs-Test die
  entfernte `toLowerCase`-Grep-Probe ersetzt.
- **Entfernt:** **23** Quelltext-/Meta-Tests (9 + 1 + 2 + 6 + 5), **4** Verhaltens-Tests
  ergaenzt, **1** umgeschrieben; Suite **5.692 → 5.673** (netto −19). **Bewusst geblieben:**
  der Block „Vollstaendigkeit gegen den GEBAUTEN Main-Code" in `fehlertexte` – er liest die drei
  Fehlercode-Unionen aus `src/main/**` und prueft einen Vertrag ueber zwei Module, keine Codeform.
- **Gate:** `npm run pruefung` **Exit 0** – Unit **5.673 (340 Dateien)**, Integration **49
  (12 Dateien)**, Treiber **0 Befunde**; Typecheck/Lint 0 davor.
- **Inventar neu (28.10.):** **136** Testdateien mit `readFileSync` (vorher 140 in `tests/unit`;
  3 in `tests/integration` unveraendert), **95** mit Grep-/Bauvorschriften-`describe` (vorher 98).
  Die 136 sind **keine Zielliste** – `fehlertexte` bleibt trotz `readFileSync`.
- **Ehrlich offen:** Die entfernten Architektur-Verbote (kein IPC, kein zweiter Schreibweg, kein
  eigener Zustand, kein Kanal-Literal, kein Canvas-Export) haben **keinen Waechter**, bis eine
  Lint-Regel steht – bewusst **kein** Schein-Test als Ersatz.
- **Nicht gepusht:** `3eeb9a4` liegt lokal; **Push nur auf Anweisung.** **Naechster Schritt:
  Charge 2** – erst Inventur der 95 Describe-Bloecke, dann fuenf Dateien nach demselben Rezept.

## STAND HEUTE (28.10.2026, dritte Sitzung: Q1.1-Rest 74 Blöcke, Q1.2 Batch 1) – historisiert durch den Abschnitt darueber

**Volltext dieser Sitzung: [`docs/agents/uebergabe-2026-10-28-session-3.md`](docs/agents/uebergabe-2026-10-28-session-3.md).**

- **Q1.1-Rest GEBAUT:** alle **74** „Fremde Aufrufe – vollständige Signaturen"-Blöcke aus `src`
  entfernt (Gerüst-Artefakt, zweite Vertragsquelle). Signatur-Kopien weg; echte lokale
  Begründungen blieben als Kurzkommentar, wo sie nicht schon an anderer Stelle standen.
  Sechs Modul-Commits (`7c35553`, `4f46bf8`, `f2becc6`, `6faf703`, `44d7fff`, `ec5ac2f`),
  **74 Dateien, +45/−1.187**; je Commit `git diff` nur Kommentar-/Leerzeilen, Typecheck/Lint 0;
  Inventar danach **0 Blöcke**.
- **Q1.2 NEU VERMESSEN:** nach Q1.1 **3.348** Kommentarzeilen mit Issue-Referenz, **188**
  Cluster ≥ 5 Dateien, **70** Prosa-Gruppen ≥ 3 Dateien. **Befund:** Die Top-10-Issue-Cluster
  sind überwiegend Einzelnennungen, keine Duplikate; die größten echten Wiederholungen sind
  `SAFETY:`-Casts (12/11/8 Dateien, laut Plan **nicht** entfernen) und `systemCode` (12× als
  **Code**-Kopie – Q3-Fall, kein Q1.2).
- **Q1.2 Batch 1 GEBAUT (`8ba9508`):** Schreib-Mechanik-Kopf in fünf Stores (5 → 2 Zeilen,
  Adresse `docs/agents/schreib-mechanik-plan.md`) und `PFAD_TRENNER`-Doku in fünf Dateien
  (4–5 Zeilen → ein Satz mit Quelle). **10 Dateien, +15/−31**; Prosa-Gruppen 70 → 67;
  Typecheck/Lint 0.
- **Q1.2 Batch 2 GEBAUT (`adf6b3a`):** Rückgabetyp-Erklärung einmal in
  `shared/contracts/ergebnis.ts` (#12/#22), **zehn** Aufrufstellen nur noch Verweis;
  EPERM/EBUSY-Begründung einmal bei `mitWiederholung` (#31), **vier** Stores nur noch
  „Wartezeiten je Speicher". **15 Dateien, +23/−81**; beide alten Formulierungen **0×**,
  „WARUM WIEDERHOLT WIRD" **1×**; Typecheck/Lint 0. `datei-entfernen.ts` (STOPP-Vermerk) und
  `export-service/ersetzen.ts` bewusst unberührt.
- **Gate:** `npm run pruefung` **Exit 0** (nach Batch 2) – Unit **5.692 (340 Dateien)**,
  Integration **49 (12 Dateien)**, Treiber **0 Befunde**.
- **Nächster Schritt: Mutations-Chargen.** Verbleibend **138** Testdateien mit `readFileSync`,
  **92** mit Grep-/Bauvorschriften-`describe` (Stand 20.10.,
  `docs/agents/mutation-pilot-2026-10-20.md`). Rezept wie die vier Piloten: Charge für Charge,
  jede Mutation mit Prüfsumme gesichert und byte-identisch zurückgenommen, harmlose
  Refactorings müssen grün bleiben, Gate je Charge – **nie pauschal**. Belegt: 18 Dateien,
  **130** Mutationen (124 erkannt/6 äquivalent), **0/20** Refactorings rot, **109**
  Quelltext-/Meta-Tests entfernt, 7 echte Lücken geschlossen. Die Verhaltens-Tests tragen;
  der Ballast ist die Quelltext-/Meta-Probe.
- **Offen daneben:** Q1.2 ist für die zwei Adressen abgeschlossen; weitere Wiederholungen sind
  `SAFETY:`-Casts (Nicht-Ziel) oder `systemCode` als **Code**-Kopie (Q3-Fall). #394, #446, #393.
- **GEPUSHT (28.10.2026, vierter Push, auf Anweisung):** `d998802..adf6b3a` → `origin/main`,
  **9 Commits** (Q1.1-Rest, Q1.2 Batch 1/2, Session-3-Übergabe), danach `adf6b3a..94a7fa2`
  (Doku-Nachtrag). Remote meldet unverändert **72** Dependabot-Findings (34 high/25
  moderate/13 low) – nicht geprüft, weiter zurückgestellt.
- **Nicht gepusht:** dieser Nachtrag („Nächster Schritt: Mutations-Chargen") – `main` liegt
  wieder **einen Commit** vor `origin/main`. **Push nur auf Anweisung.**

## STAND HEUTE (28.10.2026, zweite Sitzung: Push, Treiber 4o/4p/4q/4r, #446 zehn Läufe, FA-13 #100/#155) – historisiert durch den Abschnitt darueber

**Volltext dieser Sitzung: [`docs/agents/uebergabe-2026-10-28-session-2.md`](docs/agents/uebergabe-2026-10-28-session-2.md).**

- **#445 GEBAUT:** Im Modus „Neue Aktion" schreibt `feldVerlassen` den getippten Wert jetzt in
  den **Entwurf** (vorher kehrte es bei `gewaehlt === null` still zurueck); der Anlegen-Knopf
  sitzt in `FormularFelder`, prüft vor dem Kanal mit `pruefeEntwurf` und zeigt den Befund
  **am Formular** (`BefundAnzeige` bzw. `Nicht angelegt: <Meldung>` statt nur `console.warn`).
  4 jsdom-Tests (`tests/unit/action-editor-neue-aktion.spec.ts`); Gegenprobe (Rückschreiben
  entfernt) → **2 Tests rot**, Rücknahme byte-identisch (`c9e3055…`). **Nicht** am Fenster
  gemessen. Der bestehende Speichermeldungs-Spec (`ea2c3ea`) bleibt grün.
- **#394 GEBAUT (Montage):** `Statistik` hatte **keinen Aufrufer**. Sie hängt jetzt als **flache
  Leiste** in der Kopfzeile des Composers (neben "Video importieren"), nicht als eigenes Panel
  über der Zeitleiste - ein Panel kostete die Höhe, die die Zeitleiste zum Ziehen braucht.
  Dafür ist die Darstellung in `statistik.tsx` auf eine Zeile umgestellt (`flex` + `wrap`).
  2 jsdom-Tests (`tests/unit/composer-statistik.spec.ts`, krumme Werte 12,51 s + 7,37 s →
  `0:19`); Gegenprobe (Montage entfernt) → **2 Tests rot**, byte-identisch.
  **Widerspruch gemeldet:** Die DoD-Zeile „Keine Datei außerhalb von `statistik.tsx`" ist für
  eine Montage unerfüllbar (eine Datei kann sich nicht selbst rendern) - geändert wurden
  `composer/index.tsx` und `statistik.tsx`. Der Bau nimmt `readonly Listenelement[]` (breiter
  als die Signatur im Issue); gebauter Code gewinnt.
  **OFFEN (Auftraggeber, 28.10.2026): die Platzierung.** Aktuell flache Leiste in der
  Kopfzeile; Alternativen laut Issue-STOPP: eigenes Panel oder Teil der Liste. Ein Umzug ist
  ein einzelner JSX-Block - **nicht** entschieden, hier festgehalten.
- **#364 GEBAUT:** `src/renderer/gemeinsam/media-blob-url.ts` (`mediaBlobUrl` /
  `gibMediaBlobUrlFrei`, wirft nie, Fehler → `''` + `console.warn`); `video-filmstreifen.tsx`
  bindet die **Blob-URL** und gibt sie im `finally` frei (auch beim Fehlschlag); die **Bühne**
  (`preview-player/video.tsx`) bleibt bei `media://` - Grep-Test. 8 jsdom-Tests.
  **Zwei Änderungen außerhalb der Issue-Dateiliste, gemessen begründet:** `fetch('media://…')`
  erreicht den Handler **nur** mit `corsEnabled: true` am Schema (wie B15 bei `marken://`) und
  `media:` in `connect-src` (wie B14) - beides gesetzt (`media-protokoll.ts`, `index.ts`),
  `media-protokoll-schema.spec.ts` auf **fünf** Privilegien. Gegenprobe: `corsEnabled: false`
  und die Freigabe durch `void objektUrl` ersetzt → **2 Tests rot**, Rücknahme byte-identisch
  (`52b3228…`, `9755635…`). **TK 9.5.7** hat den Nachtrag
  (**v3.29 / 28.10.2026**, `.docx` mit `--dfd` neu erzeugt); `zitate-pruefen.py`:
  **0 veraltete** Zitate. **Ehrlich offen:** der Pixel-Beleg am echten Fenster fehlt - die im
  Issue genannte Datei `tests/integration/e2e-echtes-video.spec.ts` **existiert nicht** (auch
  nicht in der Git-Historie), und jsdom hat keinen Videodecoder. Belegt ist der Bindungsweg,
  nicht "kein SecurityError" am echten Fenster.
- **Treiber-Matrix:** Der **Kopf** stand auf 21.10., der Inhalt trug längst die 22.10.-Messungen
  (4b7/4c2/4f5/4g3/4n, 10 gemessen / 11 teilweise / 0 Lücke / 3 manuell, Muss 8 von 15).
  Kopf auf 28.10. gezogen, Beleg-Absatz ergänzt; `treiber-matrix.spec.ts` grün, seit 22.10.
  kein neuer Szenario-Schritt.
- **#446 angelegt** (FA-03 als Issue, wie in der Backlog-Analyse gefordert): Befund 26.10.
  (3 von 4 Läufen), Abgrenzung zu #445, DoD über zehn grüne Läufe bzw. belegte Ursache.
- **#446 GEMESSEN (28.10.2026, Nachlauf):** **zehn aufeinanderfolgende Treiber-Läufe**
  (10:17–10:56 UTC) alle **Exit 0**, 4g3 jedes Mal `gefunden=true`, **keine Befunde**; dazu die
  zwei Gate-Läufe vom Vormittag (12 Läufe ohne roten 4g3). Die DoD-Zeile „zehn aufeinanderfolgende
  Läufe grün" ist damit erfüllt – die **Ursache** des 26.10.-Befunds ist **nicht benannt** (es gab
  keinen roten Lauf mit den neuen Protokollwerten). Logs: `$TMPDIR/fa03/`; alle zehn Läufe
  protokolliert in `docs/agents/oberflaeche-durchlauf.md`. Die Schritte **4o/4p/4q** liefen mit.
- **Drei neue Treiber-Schritte (`4f990b5`):** **4o** Statistik-Leiste (#394: Gesamtdauer `0:02`,
  1/1/0 gegen `project.json`), **4p** Canvas-Pixel (#364: `getImageData` auf 6 Kacheln ohne
  SecurityError, 74–82 Farben je Kachel, Bühne bleibt `media://`), **4q** „Neue Aktion" (#445:
  Aktion 1→2 mit getipptem Titel, leerer Titel am Formular abgelehnt). Matrix-Kopf auf 28.10.
  gezogen. **Beleg-Kommentare an #445/#394/#364 gesetzt** (28.10.2026); **#445 und #364 geschlossen**
  (DoD erfüllt, bei #364 sinngemäß statt über die nicht existierende E2E-Datei), **#394/#446 offen**.
- **FA-13 GEBAUT (28.10.2026, #100/#155):** `erstelleVorlage` legt auch die **Einblendung** an –
  `art: 'einblendung'`, `höhe: 162`, feste Zonen `hintergrund` + `logo` aus `band-standard`;
  `hintergrund` trägt den **Scrim-Verlauf** `scrimStart → scrimEnde` (unten) statt
  `flaecheDunkel` (TK 9.11.1, Entscheidung 23.10.). `ANLEGBARE_ARTEN` hat den dritten Eintrag
  („Neu: einblendung (162)"); andere Bandhöhen bleiben `unbekannter_fehler` (Logo-Regel fehlt).
  **#155-DoD nachgeholt:** `vorlagen-uebersicht.spec.ts` (26 Tests) und
  `vorlagen-anlegen-einblendung.spec.ts` (4) – dabei eine echte Lücke geschlossen:
  `entferneVorlage` wies eingebaute Vorlagen **per IPC** ab, jetzt vorher gegen die geladene
  Übersicht (DoD: „rufeAuf null Mal"). Treiber **4r** legt eine Einblendung am Fenster an
  (Zonen, Scrim, Logo 96/20/240/69). Gegenproben 3/1/2/1, byte-identisch (`4a46ed…`, `82ea7a…`).
  Matrix FA-13 bleibt **teilweise** (freie Zonen verschieben/bemaßen ungemessen).
- **Gate:** `npm run pruefung` **Exit 0** – Unit **5.692 (340 Dateien)**, Integration **49
  (12 Dateien)**, Treiber **0 Befunde**, Typecheck/Lint 0 (Nachtrag nach FA-13 und den drei
  Treiber-Schritten 4o/4p/4q; der erste Lauf davor: 5.659/338). Die zwei Läufe **vor** dem
  5.659er-Stand waren rot mit **denselben drei** Treiber-Befunden (Band-Aufnahme 4f2 ×2, Aktion löschen 4g4) - und der
  Lauf **08:56 heute**, also **vor** diesen Änderungen, zeigt sie ebenfalls. Sie sind damit
  **nicht** von dieser Sitzung verursacht; im grünen Lauf sind `bandZiel=true` und
  `Aktion loeschen: 1 -> 0 -> Undo 1` belegt. (Die erste Montage von #394 als eigenes Panel
  über der Zeitleiste ist trotzdem verworfen - sie kostete genau die Höhe, an der die
  Zieh-Schritte hängen.)
- **GEPUSHT (28.10.2026, auf Anweisung):** `a53e64d..fd563b4` → `origin/main`, **180 Commits**,
  431 Dateien (+17.368/−7.685); `main` = `origin/main`, Arbeitsbaum sauber. Der Gate-Lauf **zum
  Push-Zeitpunkt** lag **vor** den drei Doku-Commits; danach nachgeprüft wurde nur `treiber-matrix.spec.ts`
  (**3/3 grün**), **kein** voller Gate-Lauf. Das Remote meldet beim Push **45 Dependabot-Findings**
  (22 high/16 moderate/7 low) – **nicht geprüft**, auf Anweisung zurückgestellt („Funktionen vor
  Sicherheit"). Auf GitHub wurden die Beleg-Kommentare an **#445/#394/#364** gesetzt (28.10.2026).
  **Danach geschlossen:** **#445**, **#364**, **#100** und **#155** (je mit Beleg-Kommentar,
  `completed`); **#394** bleibt offen (Platzierung), **#446** bleibt offen (Ursache unbenannt;
  Kommentar mit den zehn Läufen gesetzt). **26 offene Issues → 22.** Kein Label geändert.
- **Q1.2 vermessen (28.10.2026, nicht gebaut):** **3.519** Kommentarzeilen mit Issue-Referenz
  in 373 Dateien; **188** Cluster in ≥ 5 Dateien (308 Dateien); **197** wiederholte
  Prosa-Gruppen. Größte Cluster: #49 (42 Dateien), #47 (29), #32 (27), #46 (25), #21 (24).
  **Nebenbefund:** **74 Dateien** tragen noch einen Block „Fremde Aufrufe – vollständige
  Signaturen" – ein **Q1.1-Rest** und eine zweite Vertragsquelle, mechanisch entfernbar.
- **Nächster Schritt (Vorschlag):** zuerst diese **74 Blöcke** als eigene Charge (Gate je Modul),
  danach Q1.2 bewusst nur über die **Top-10-Cluster**, mit Bilanz nach dem ersten Batch.
  Alternativen, die allein gehen: Mutations-Chargen, **#393** (Vorlagen-Live-Vorschau).
- **GEPUSHT (28.10.2026, dritter Push, auf Anweisung):** `fd563b4..d998802` → `origin/main`,
  **7 Commits**; `main` = `origin/main`, Arbeitsbaum sauber. Vor dem Push geprüft: die drei
  Commits nach dem grünen Gate-Lauf (5.692 Unit-Tests) ändern **nur** `CLAUDE.md` und
  `docs/agents/uebergabe-2026-10-28-session-2.md` – der gepushte Code ist der Stand des
  Gate-Laufs, **kein** neuer voller Gate-Lauf. Das Remote meldet jetzt **72**
  Dependabot-Findings (34 high/25 moderate/13 low; beim Push davor 45) – **nicht geprüft**,
  weiter zurückgestellt („Funktionen vor Sicherheit").

## STAND HEUTE (28.10.2026, vier Bau-Issues geschlossen, FA-03 messbar, Backlog-Analyse) – historisiert durch den Abschnitt darueber

**Volltext dieser Sitzung: [`docs/agents/uebergabe-2026-10-28-session.md`](docs/agents/uebergabe-2026-10-28-session.md).**

- **Die M8-Kette der 23.10.-Übergabe ist DURCH:** **#316** (`8cbb5f9`, Merge `500c591`) –
  `einblendung.flaecheDunkel` als Pflichtfeld, kein Marken-Zugriff im `render-service`;
  **#317** (`4671f8d`, Merge `500c591`) – `config-store.leseMarke` samt Kanal **gelöscht**;
  **#339** (`4cd6336`, Merge `861632e`) – sechster Prüfpunkt, `flaecheDunkel` nur auf Form;
  **#338** (`a2cbf3d`, `4bd3289`, Merge `8154082`) – fünfte kaputte Art `aktion_marke`.
  Alle vier mit Beleg-Kommentar als `completed` geschlossen.
- **Gate: `npm run pruefung` Exit 0** – **5.645 Unit-Tests (334 Dateien)**, **49
  Integrationstests (12 Dateien)**, Treiber **0 Befunde**. Je Issue eine Gegenprobe belegt und
  byte-identisch zurückgenommen (#316 3/4, #317 7/4, #339 1, #338 4, FA-03 1). Dokumente
  unverändert (AD v1.9 / TK v3.28); `AGENTS.md` auf diesen Stand gezogen (`10adaba`).
- **Gemeldete Widersprüche:** bei #316/#317 fremde Fixtures/Specs mechanisch mitgezogen; bei
  #339 **kein** TK-Nachtrag (DoD verbietet Dateien außerhalb); bei #338 war die DoD-Zeile
  „keine Datei außerhalb der #131-Datei" **nicht haltbar** (13 Produktions-, 8 Testdateien), und
  `naht-typen-313.spec.ts` prüfte bis dahin das **Gegenteil** („composer trägt KEIN
  `marken`-Feld") – Probe mit Begründung umgedreht.
- **Messweg 4g3: die Gegenprobe hat NICHT gebissen** (`9bb8093`). Der FA-03-Befund vom 26.10.
  (3 von 4 Läufen rot) ließ sich durch `focusout` **nicht** erklären – ein Lauf gegen den alten
  Stand war am 27.10. ebenfalls grün. Die Änderung bleibt als Angleichung an #310, **nicht als
  Ursache belegt**; neu loggt 4g3 Fensterfokus, Feldfokus und aktives Element.
- **FA-03-Nachlauf: ein gescheitertes Speichern war unsichtbar – behoben** (`ea2c3ea`, Merge
  `fe27f5e`). `einspeisen` verwarf `{ ok: false }` vollständig (der Typ trug nicht einmal
  `fehler`); `feldVerlassen` kehrte still zurück, wenn die Auswahl auf eine verschwundene Aktion
  zeigte. Jetzt: `Nicht gespeichert: <Meldung des Mains>`. **FA-03 ist damit nicht gelöst,
  sondern messbar** – 4g3 protokolliert bei Fehlschlag Titelfeld, Zeilen, Formular- und
  Wurzel-Meldung.
- **Nebenbefund als #445 angelegt:** Im Modus „Neue Aktion" erreichen getippte Werte das Formular
  nie (`gewaehlt === null` → `feldVerlassen` kehrt vor dem Schreiben zurück; `formular.titel`
  bleibt `''`). Code-belegt, **nicht** am Fenster gemessen.
- **Backlog-Analyse (28.10., 25 offene Issues):** baubar ohne Rückfrage sind **#445**,
  **#394** (Dashboard ohne Aufrufer – montieren oder löschen), **#364** (Tainting), das
  Nachziehen der **Treiber-Matrix** (steht auf 21.10.), ein **FA-03-Issue** sowie Q1.2 und die
  Mutations-Chargen. **Nur der Auftraggeber** kann: **FA-13** freigeben (#100/#155 – die einzige
  zugesagte Funktion ohne Code), **#303** abnehmen, **#442** reproduzieren, **#443** und
  **#394** entscheiden, **FA-11/FA-12** optisch abnehmen, **pushen**.
- **Banner-Familie #365–#376 (12 Issues) ist blockiert**, bis der AD/TK-Nachtrag steht –
  #366/#367/#371 sind `braucht-entscheidung`. Ohne Nachtrag endet sie wie die Zwei-Screens-Ära.
- **Nächster Schritt (Vorschlag):** erst #445, #394, Matrix, FA-03-Issue (alle klein, machen den
  Backlog ehrlich), dann **FA-13** (#100/#155). **Push nur auf Anweisung** – `main` liegt vor
  `origin/main`, nichts gepusht.

## STAND HEUTE (27.10.2026, #316/#317/#338/#339 gebaut, gemergt, belegt – Gate Exit 0) – historisiert durch den Abschnitt darueber

- **Die M8-Kette aus der 23.10.-Übergabe ist DURCH.** Alle drei gebaut, auf `main` gemergt und
  mit Beleg-Kommentar als `completed` geschlossen:
  - **#316** (`8cbb5f9`, Test `86b4745`, Kommentar-Nachzug `c6becb1`): `einblendung.flaecheDunkel`
    ist **Pflichtfeld** im `RenderRequest`; `baueBand` füllt es zeichengleich aus
    `standardMarke.farben.flaecheDunkel` (Bindung aus #310, nicht der Parameter `marke`).
    `NormalisierKontext.flaecheDunkel` und `leseMarke()` im `render-service` entfallen – der
    `render-service` hat **keinen** Marken-Zugriff mehr. Merge `500c591`.
  - **#317** (`4671f8d`): `config-store/lese-marke.ts` samt Spec **gelöscht** (ENTSCHIEDEN 2:
    löschen statt leeren), `KANAELE.config` auf **vier** Einträge, Verdrahtung entlastet;
    `verdrahteConfigStoreIPC` behält Name und Signatur, `main/index.ts` unberührt. Merge `500c591`.
  - **#339** (`4cd6336`): **sechster** Prüfpunkt in `pruefeRenderRequest` – `flaecheDunkel` als
    `#RRGGBB`/`#RRGGBBAA`, **nur Form** (Muster ohne `g`-Flag, kein `lastIndex`-Zustand),
    Ablehnung über `ungueltiges_element` mit `daten.elementId`, gleicher Weg wie die fünf
    bestehenden Punkte. Merge `861632e`. **Kein Dokument-Nachtrag** – begründet: die DoD
    verbietet Änderungen außerhalb der #173-Datei (+ Test), und die TK führt für
    `ungueltiges_element` eine Beispielliste, keine abschließende Prüfpunkt-Zählung.
- **#338 ist ebenfalls gebaut und gemergt** (`a2cbf3d`, Beschriftung `4bd3289`, Merge
  `8154082`): `findeKaputteStellen` prüft die **fünfte** Art `aktion_marke` – eine
  `aktion.markeId` ohne Marke im Bestand ist **je Aktion genau eine** Stelle, **ohne**
  `elementId` (der Defekt hängt an der Aktion, nicht an der Zeile), hinten in der Liste.
  `null` als Bestand heißt „nicht geladen" und schaltet die Prüfung ab (`[]` hätte jede
  Aktion kaputt gemacht). **Der Shell-Vertrag `rechneStandNeu(stand, projekt)` blieb
  unverändert** – `App.tsx` liest den Bestand frisch aus dem ref.
  **Zwei gemeldete Widersprüche:** (a) Die DoD-Zeile „keine Datei außerhalb der
  #131-Datei" war nicht haltbar – ohne Prop und 9 Aufrufstellen hätte die Prüfung nie
  gelaufen; 13 Produktions- und 8 Testdateien geändert. (b) `naht-typen-313.spec.ts`
  prüfte bis dahin das **Gegenteil** („der composer trägt KEIN `marken`-Feld", #313
  ENTSCHIEDEN 2); die Probe ist mit Begründung umgedreht. Reparatur: nur
  `aktionsbild_reparieren` (öffnet den action-editor), Beschriftung dort „Marke der
  Aktion wählen"; ein eigener Marken-Wähler bleibt Folge-Issue.
- **FA-03-Nachlauf: ein gescheitertes Speichern war unsichtbar – behoben** (`ea2c3ea`, Merge
  `fe27f5e`). Nicht der Messweg war die Ursache, sondern der Code: `einspeisen` verwarf
  `{ ok: false }` **vollständig** (der Typ trug nicht einmal `fehler`), und `feldVerlassen`
  kehrte still zurück, wenn die Auswahl auf eine verschwundene Aktion zeigte. Jetzt zeigt das
  Formular `Nicht gespeichert: <Meldung des Mains>`; Erfolg löscht sie. 2 jsdom-Tests,
  Gegenprobe 1 Test rot, byte-identisch. **Der Treiber-Schritt 4g3 protokolliert bei einem
  Fehlschlag jetzt Titelfeld, Bibliothekszeilen, Formular- und Wurzel-Meldung** – der
  26.10.-Befund war unzuordenbar, weil keine dieser vier Angaben gemessen wurde.
  **FA-03 ist damit nicht „gelöst", sondern messbar** – der nächste rote Lauf nennt den Zweig.
- **Offener Nebenbefund als #445 angelegt:** Im Modus „Neue Aktion" erreichen getippte Werte
  das Formular nie (`gewaehlt === null` → `feldVerlassen` kehrt vor dem Schreiben zurück;
  `formular.titel` bleibt `''`, „Anlegen" scheitert). Code-belegt, **nicht** am Fenster gemessen;
  der stille Rückweg im Modus `bestehend` ist mit `ea2c3ea` zu.
- **Gate: `npm run pruefung` Exit 0** – **5.645 Unit-Tests (334 Dateien)**, **49
  Integrationstests (12 Dateien)**, Treiber **0 Befunde**. Je Issue eine Gegenprobe belegt und
  byte-identisch zurückgenommen (#316 3 bzw. 4 Tests rot, #317 7 bzw. 4, #339 1, #338 4,
  FA-03 1); Prüfsummen
  und Zahlen stehen in den Issue-Kommentaren. Dokumente unverändert (AD v1.9 / TK v3.28).
- **Messweg 4g3 nachgezogen – die Gegenprobe hat NICHT gebissen** (`9bb8093`). Der Schritt
  „Aktion bearbeiten" (FA-03) scheiterte am **26.10.** in drei von vier Läufen („Titel im
  project.json: ["Durchlauf-Aktion"]"); Verdacht war derselbe `blur()`-statt-`focusout`-Fehler
  wie am 23.10. (#310). Ein voller Lauf gegen den **alten** Stand war am 27.10. aber ebenfalls
  grün (`gefunden=true`, 0 Befunde, Prüfsumme `54eb697a…`). Die Änderung ist damit **nicht als
  Ursache belegt**; sie bleibt als Angleichung an die zwei Stellen vom 23.10. drin. Neu loggt
  der Schritt `Fensterfokus`, `Feld hatte Fokus` und das aktive Element danach (Gate-Lauf:
  `true / true / BODY`). **FA-03 bleibt unerklärt intermittierend – offener Punkt.**
- **`python3 tools/bereitschaft.py` (27.10.2026):** M0–M6 komplett, **M7 68/71** (bereit:
  #215, #240, #255 – vor dem Anfassen gegen den gebauten Code prüfen), **M8 59/60**, dort wird
  **#317 als „bereit" geführt**. Das ist eine **Werkzeuggrenze**, kein Baufehler: #317 bestand
  im **Löschen** der Datei, das Werkzeug misst „Datei existiert ohne Gerüst-Rumpf" und kann
  einen Lösch-Bauzustand grundsätzlich nicht sehen.
- **25 offene Issues** (Stand 28.10.2026): echte Lücke **#364** (media://-Tainting), neuer
  Befund **#445** („Neue Aktion" speichert nichts);
  M8-Nachlauf **#303** (Live-Vorschau); **#394**
  (Statistik-Dashboard gebaut, aber nirgends gerendert – „fertige Funktion ohne Aufrufer");
  Banner-Familie **#365–#376** (12); UI-2.0-Kandidaten **#383/#388/#391/#392/#393**; beim
  Auftraggeber **#442/#443**; aus der alten Ära **#100/#155** (FA-13).
- **Nächster Schritt:** **FA-13** (#100/#155 – `ANLEGBARE_ARTEN` um `einblendung` mit fester
  Bandhöhe 162 erweitern, AD v1.9/TK v3.28), dann **#364** oder **#303**. Ein Folge-Issue
  „eigener Marken-Wähler für eine kaputte Marken-Stelle" ist **nicht** angelegt. **Push nur auf Anweisung** – `main` liegt vor `origin/main`,
  **nichts gepusht** (Abstand bewusst nicht als feste Zahl geführt).

## STAND HEUTE (23.10.2026, FA-13 entschieden: Einblendung anlegbar, Bandhöhe fest 162) – historisiert durch den Abschnitt darueber

- **FA-13 ist entschieden (Auftraggeber, 23.10.2026):** Eigene Vorlagen der Art **Einblendung** sind
  über die Oberfläche **anlegbar**, mit **fester Bandhöhe 162 px**. Der Hintergrund ist ein
  **Scrim-Verlauf** `scrimStart` → `scrimEnde` (durchsichtig → 70 % Schwarz), **nicht** die deckende
  `flaecheDunkel`-Füllung. Feste Zonen: `hintergrund` + `logo` aus „Band-Standard"; es gibt keine
  eingebaute Einblendungs-Vorlage. Ein Deckkraft-Feld gibt es nicht – die Deckkraft folgt der
  Vorlagenart (TK 9.10.2).
- **Bewusste Anforderungsänderung, dokumentiert:** „Höhere Bänder sind über eigene Vorlagen möglich"
  (AD 4.5) und „Bandhöhe setzen" (TK 9.12.2) sind **zurückgenommen** – angelegt wird nur 162 px.
  Grund: Der Markenrahmen ist auf 162 px zugeschnitten; eine freie Höhe bräuchte eine Logo-Regel,
  die der Vertrag nicht festlegt (TK 9.11.1 Punkt 3: kein automatisches Umlayouten).
- **Dokumente synchron:** **AD v1.9 / TK v3.28**, Datum 23.10.2026, beide `.docx` neu erzeugt
  (`generate-docx.js`, ZIP geprüft, neuer Text im XML belegt). TK-Bezug auf AD v1.9 gezogen
  (stand vorher fälschlich auf v1.6).
- **Code-Stand:** **noch nicht gebaut.** `ANLEGBARE_ARTEN` hat weiterhin zwei Einträge; der
  Main-Zweig in `erstelle-vorlage.ts` lehnt `einblendung` mit `unbekannter_fehler` ab. Die
  Treiber-Matrix führt FA-13 deshalb weiter als **teilweise**.
- **`python3 tools/bereitschaft.py` (23.10.2026):** M0–M6 komplett, **M7 68/71** (3 „bereit":
  #215, #240, #255 – vor dem Anfassen gegen den gebauten Code prüfen), **M8 60/60**. Deckt sich
  mit der Übergabe vom 22.10.
- **Backlog-Abgleich (Charge 1) durchgeführt (23.10.2026):** von **322 offenen Issues** auf
  **28** – **6 BK-Issues (#354–#359)** als `not planned` (verworfene Zwei-Screens-Ära), **288**
  gebaute/überholte Issues mit Beleg-Kommentar als `completed` geschlossen, **6 nach Prüfung
  wieder geöffnet** (#100/#155/#303/#310/#316/#317); #310 ist inzwischen gebaut. Grundlage war eine Messung (Signatur im Code
  definiert + genannte Datei ohne Gerüst-Rumpf + Commit-Nennung + Aufrufer-Grep), keine bloße
  Altersschätzung. **Grenze der Messung:** Sie erkennt weder einen offenen Teilzweig (#100/#155)
  noch eine fehlende Einzel-Edit in einer sonst gebauten Datei (#316/#317) – die DoD muss gegen
  den Code gelesen werden. Details:
  [`docs/agents/uebergabe-2026-10-23-session.md`](docs/agents/uebergabe-2026-10-23-session.md).
- **Drei Befunde aus dem Abgleich, die offen bleiben:** **#394** (Statistik-Dashboard gebaut, aber
  nirgends gerendert – „fertige Funktion ohne Aufrufer"), **#338** (findeKaputteStellen ohne
  Marken-Referenzprüfung; der neue Befund fällt im Reparatur-Modus in `default: []` – Entscheidung:
  bestehende Optionen, „Marke wählen" als Folge-Issue), **#316/#317/#339** (M8-Kette: `flaecheDunkel` fehlt im RenderRequest, der
  `render-service` liest die Marke weiter zur Laufzeit, die Formprüfung fehlt). `.gitignore` deckt
  die Laufzeitartefakte bereits seit 22.10. ab; #442-Label `braucht-entscheidung` entfernt.
- **#310 ist gebaut und gemergt** (`e3e8053`): `stelleMarkeBereit(projekt.standardMarkeId)` nur bei
  Bandspur, genau einmal je Aufruf; `marke_nicht_ladbar`; Band-Abschnitte zeichnen mit der
  Standardmarke als viertem Argument. **Der erste Gate-Lauf war rot (16 Befunde im Marken-Editor);
  die Diagnose zeigte einen Messfehler, keinen App-Fehler:** Reacts `onBlur` hängt an `focusout`,
  der Treiber nutzte `blur()`, das in einem nicht fokussierten Fenster nicht feuert. Der Fix im
  Treiber (4m/4m2 dispatcht `focusout`) ist belegt; `npm run pruefung` **Exit 0** (5.627
  Unit-Tests, 49 Integrationstests, Treiber ohne Befund). Gegenprobe #310: 2 Tests rot, Rücknahme
  byte-identisch.
- **Die 28 offenen Issues:** M8-Kette #316/#317/#339, FA-13-Bau #100/#155, Review #303,
  Banner-Familie #365–#376 (12), echte Lücken #338/#364, UI-2.0-Kandidaten
  #383/#388/#391/#392/#393/#394, beim Auftraggeber #442/#443.
- **Nächster Schritt:** **#316** (`flaecheDunkel` in den Request, Laufzeit-Lookup raus), dann
  **#317** (`config-store.leseMarke` + Kanal löschen), dann **#339** (Formprüfung), je mit Tests
  und Gate. Danach #338 mit den bestehenden Optionen, dann **FA-13** (#100/#155).
  **Push nur auf Anweisung.**

## STAND HEUTE (22.10.2026, zweite Sitzung: Live-Vorschau montiert, Muss-Luecken gemessen, B14–B18) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-22-session-2.md`](docs/agents/uebergabe-2026-10-22-session-2.md) – LIES DIESE DATEI ZUERST.**

- **Reihenfolge Punkt 2 ist erledigt: die Live-Vorschau des Marken-Editors ist MONTIERT**
  (A1, #303/#330). Drittes Prop `vorlagen: VorlagenZugang`, neuer Baustein
  `marken-editor/vorschau-flaeche.tsx`, fester Zeichenweg `zeichneMarkenVorschau` mit der
  Vorlage **„Vollbild"**. Vorbereitung: `stelleSchriftenBereit()` →
  `stelleMarkenSchriftenBereit(marke)` → `bereiteLogoVor(marke)`; **kein** `stelleMarkeBereit`,
  **kein** `ZeichenZugang`, kein Projekt. Treiber **4m** misst
  `Live-Vorschau GEMESSEN: Canvas 1920x1080`.
- **Drei echte Befunde, die erst die Vorschau sichtbar machte – alle behoben:**
  1. **B14:** Die CSP erlaubte `marken:` weder in `font-src` noch in `connect-src` –
     importierte Schriften/Logos wurden blockiert. Jetzt `marken:` in beiden (Dev + Prod).
  2. **B15:** `MARKEN_SCHEMA` fehlte `corsEnabled`; Chromium blockierte danach JEDEN
     `fetch(marken://…)` per CORS. Die in #290 als Experiment gefuehrte Probe ist damit
     entschieden; `corsEnabled: true` steht im Schema.
  3. **B16:** Eine **abgeleitete** Marke mit importierter Schrift baute die URL mit der
     **Kind-Kennung** → 404 (die Datei liegt beim Parent, TK 9.15.3). Beide Ladewege waehlen
     die Quell-Kennung jetzt ueber `herkunftJeFeld` (`geerbt` → Parent); der Bestand bleibt
     unter der eigenen id. Kein Kopieren, keine zweite Wertquelle.
- **Messweg verbessert:** Fenster-Konsole-Befunde tragen die **Quell-URL**; 4m2 listet
  `marken-assets/<id>` auf. Beides hat B16 erst zuordenbar gemacht.
- **Gate:** `npm run pruefung` **Exit 0**; `lint`/`typecheck` 0. Details in der Session-Datei.
- **Widerspruch gemeldet:** #330 traegt seit 23.08. den Nachtrag „`stelleMarkeBereit`"; A1
  (22.10.) sagt das Gegenteil. Es gilt A1 (juenger, Auftraggeber).
- **Reihenfolge Punkt 3 ist ebenfalls gebaut und gemessen** (Treiber 4b7, 4c2, 4f5, 4g3, 4n):
  FA-01 (Ersetzen mit Rueckfrage, genau ein Video), FA-03 (Aktion bearbeiten), FA-22
  (Vorbelegung/Ersetzen/zweite Ausgabe), FA-08 (`ffprobe 12,022 s` gegen Anzeige `12 s`),
  FA-13 (Vorlage anlegen/Zone/uebernehmen/verwerfen). **Matrix: 10 gemessen, 11 teilweise,
  0 Luecke, 3 manuell; Muss: 8 von 15.**
- **Zwei weitere echte Befunde dabei behoben:**
  - **B17:** „+ Textzone (titel)" bestellte eine nicht existierende Sorte (`text-formatiert`)
    und tat NICHTS; jetzt `{ sorte: 'text', bindung: 'titel' }`, Verhaltenstest.
  - **B18:** Video-Ersetzen filterte nur die SICHT; im `project.json` standen danach ZWEI
    Video-Elemente. Jetzt wird das alte Element ueber `entferneElementAusListe` im Bestand
    entfernt.
- **Offene DESIGNENTSCHEIDUNG (User):** FA-13 – soll „Einblendung" ueber die Oberflaeche
  anlegbar sein, und mit welcher Hoehe/Deckkraft? `ANLEGBARE_ARTEN` bietet nur `vollflaeche`
  und `split`; der Store kennt `einblendung`. Deshalb bleibt FA-13 **teilweise**.
- **Noch offen:** Issue-Kommentare zu #303/#330 und #290 sind gesetzt; die #442-Diagnose
  (Ursache am Nutzerpfad) bleibt offen, das Label `braucht-entscheidung` ist veraltet.
- **Naechster Schritt:** **Backlog-Abgleich (Charge 1)** – 322 offene Issues, alte/gebaute
  schliessen, BK-01…06 als `not planned`, `.gitignore` fuer Laufzeitartefakte. Danach
  Oberflaeche 2.0/Banner (erst AD/TK-Nachtrag). **Push nur auf Anweisung.**
  Die kurze Einstiegsdatei ist [`UEBERGABE-NAECHSTE-SESSION.md`](UEBERGABE-NAECHSTE-SESSION.md).

## STAND HEUTE (22.10.2026, frueher: FA-24 am echten Fenster, B9/B10, Treiber-Flakiness) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-22-session.md`](docs/agents/uebergabe-2026-10-22-session.md) – LIES DIESE DATEI ZUERST.**

- **FA-24 ist gemessen – die Matrix hat KEINE Luecke mehr.** Treiber-Schritte **4m/4m2**
  (Branches `bau/treiber-fa24` und `bau/treiber-fa24-rest`): Marke ueber die Oberflaeche **anlegen und oeffnen**,
  **Akzentfarbe frei** setzen (Wert im Bestand V2), **Kontrast-Warnung** am Grenzwert
  ("4.13:1 … mindestens 4.50:1") **ohne Sperre**, **Ableiten** mit `abgeleitet` und
  Herkunftszeilen. **4m2:** **alle dreizehn Farbrollen** (13/13 im Bestand), **Slogan** und
  **Sicherheitsabstand** schreiben, **Wachstums-Hinweis**, **Bearbeiten einer abgeleiteten
  Marke** (eigen -> geerbt), **Import-Pipeline** fuer Schrift/Logo mit echten Dateien
  (`herkunft: importiert`), **Logo entfernen**. Matrix jetzt **6 gemessen, 15 teilweise,
  0 Luecke, 3 manuell**; **Muss: 4 von 15** (FA-05/17/23/24). **MANUELL** bleibt nur der native
  Dateidialog beim Import (wie FA-09/Export).
- **Drei echte Produktbefunde, behoben und gegengeprobt:**
  1. **B9 – Stand des ERSTEN Aufbaus:** Nach dem Oeffnen einer Marke mit 96/54 px standen im
     Abstands-Feld **0/0**; ein Klick auf "Abstand uebernehmen" haette den Sicherheitsabstand
     (TK 9.11.4) still zerstoert. `slogan`/`sicherheit` sind Momentaufnahmen und werden jetzt
     im Abo auf die geoeffnete Marke gezogen.
  2. **B10 – alter Farbwert nach dem Wechsel:** Nach dem Bearbeiten von Marke A zeigte das
     Akzentfeld bei Marke B weiter `#808080` (unkontrolliertes `defaultValue`, React benutzt
     dasselbe DOM-Element). Der naechste `onBlur` haette den Wert in B geschrieben. Jetzt
     traegt `marken-offen` `key=<markeId>` und wird beim Wechsel neu aufgebaut.
  3. **B12 – Logo entfernen lieferte das gebuendelte Fremdlogo:** Nach Import + Entfernen
     stand bei einer eigenstaendigen Marke das **Baller-Logo** im Bestand, obwohl der Hinweis
     den Markennamen verspricht. **Entschieden (#440, 22.10.):** eigenstaendig -> `null`
     (Ersatz-Logo), eingebaut -> gebuendelt; Schriften bleiben gebuendelt (Pflichtfeld).
  Gegenproben: je **1 Test rot** (bzw. 2 bei B9), Ruecknahme byte-identisch
  (Pruefsummen `8fbcda44…c123e6`, `b5305feb…dc13e`).
- **Treiber-Flakiness beendet** (eigener Commit): `scripts/durchlauf.mjs` startete Electron
  **zweimal** (spawn + puppeteer.launch); die Einzelinstanz liess einen gewinnen, verlor der
  gesteuerte Prozess, starb der Frame mitten im Lauf ("detached Frame", stummer Haenger –
  am 22.10. dreimal an verschiedenen Stellen). Jetzt **EIN** Start, dazu Hoerer fuer
  Fenster-Crash und Fenster-zu. Danach `npm run durchlauf` **Exit 0**.
- **Drei Messweg-Korrekturen** (kein App-Fehler): 4a0 zaehlte die Knoepfe "Neue Marke"/
  "Ableiten" als Marken (3/4 statt 1/2); getippte Zeichen im kontrollierten Namensfeld wurden
  verschluckt (jetzt nativer Setter + `input`); das Aufraeumen loescht abgeleitete Marken
  **vor** ihrer Basis.
- **#441 behoben (B13):** `löscheMarke` räumt jetzt `marken-assets/<markeId>/` mit ab
  (rekursiv, best effort, erst nach dem Bestands-Schreiben; ein Dateifehler macht das
  Löschen nicht rückgängig). Drei Verhaltensproben, Gegenprobe beißt; Treiber 4m2 belegt
  `Ordner nach dem Loeschen: false`.
- **Gate:** `npm run pruefung` **Exit 0** – **5.609 Unit-Tests (333 Dateien)**,
  **49 Integrationstests (12 Dateien)**, Treiber ohne Befund **und ohne Untersuchung**;
  Typecheck/Lint 0.
- **Ehrlich offen:**
  - **Backlog:** **322 offene Issues**, davon **295 aus der alten M-Aera (≤ #380)** und **103**
    mit `braucht-entscheidung` - ueberwiegend gebauter Code oder die **verworfene**
    Zwei-Screens-Aera. Vor dem naechsten Bauabschnitt **abgleichen** (Charge 1 der Reihenfolge).
  - **Live-Vorschau** des Marken-Editors ist gebaut, aber **nicht montiert**; der Weg ist
    **entschieden** (siehe unten).
  - **Mutations-Chargen** 138/92 offen.
- **Nicht gepusht.**
- **B5 geschlossen (Gate-Blindstelle):** `scripts/durchlauf.mjs` wertet jedes eindeutige
  `console.error` aus dem Fenster als **Befund** ("Fenster-Konsole") - „Maximum update depth"
  kann nicht mehr durch ein gruenes Gate laufen. `console.warn` bleibt Log-Hinweis.
  Gegenprobe: eingebautes `console.error("SEMPEL-B5")` -> **Exit 2**, Rücknahme
  byte-identisch (`a4adeb90…c928cff1c`), Lauf wieder Exit 0.
- **#433 abgenommen (User, 22.10.2026):** Filmstreifen am echten Fenster bestaetigt, keine
  Aenderung an Dichte/Hoehe/Standard-Zoom. Treiber 4b4 (1 -> 6 Bilder bei 128 px/s) und die
  Sichtpruefung sind die Belege; #433 geschlossen.
- **Entscheidungen (Auftraggeber, 22.10.2026):**
  1. **Live-Vorschau (#303):** `vorlagen: VorlagenZugang` als drittes Prop + **eigene
     Vorbereitung** mit `stelleMarkenSchriftenBereit(marke)`/`bereiteLogoVor(marke)`; **kein**
     `stelleMarkeBereit`, **kein** `ZeichenZugang`, kein Projekt. Feste Vorlage „Vollbild".
  2. **#442:** gemeint ist eine **Aktion an einer Zeitstelle im Video** (Unterbrechung, TK 9.2.9),
     kein neues Modell. Offen ist die Diagnose, warum der Weg beim User nicht greift (4b6 belegt
     den vollflaechigen Weg; Band-Aktionen gehen in den Band-Weg, #437).
  3. **#443:** **Kern-Set** (Play/Pause, Scrubbing, Zeit, Lautstaerke/Stumm, Vollbild, ±5 s) als
     **Hover-Overlay** (YouTube-Muster); Geschwindigkeit/Tastatur spaeter.
  4. **Banner:** verbindlich ist die **BA-Familie #365+** (`BannerSchild`), **erst nach
     AD/TK-Nachtrag**. **Aktions-Editor inline** im Projekteditor; **Videobearbeitung im
     selben Editor** (nachrangig).
  Hinterlegt an #303/#442/#443/#365 und in `docs/agents/oberflaeche-2-0-plan.md`.
- **Reihenfolge (vereinbart):**
  1. **Backlog-Abgleich** (alte/built Issues schliessen, BK-01…06 verwerfen, `.gitignore` fuer
     Laufzeitartefakte).
  2. **Live-Vorschau Marken-Editor** (A1).
  3. **Muss-Luecken:** FA-01/03 (+ #442-Diagnose), FA-22, FA-13, FA-08.
  4. **Oberflaeche 2.0 / Banner:** AD/TK-Nachtrag, dann #365-#373/#371, Aktions-Editor inline,
     #443, Videobearbeitung.
  5. **Qualitaet:** Q1.2, Mutationschargen; **Push nur auf Anweisung**.
- **Naechster Schritt:** **Backlog-Abgleich** starten (Charge 1), dann die Live-Vorschau montieren.

## STAND HEUTE (21.10.2026: FA-17/18/23 am echten Fenster, drei Produktbefunde, UI-Ausrichtung) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-21-session.md`](docs/agents/uebergabe-2026-10-21-session.md) – LIES DIESE DATEI ZUERST.**

- **FA-17/18 sind jetzt am echten Fenster gemessen** (Treiber-Schritte **4k/4l**,
  Branch `bau/treiber-fa17-18`). **4k:** Import einer fehlenden Datei -> Zeile
  `fehlgeschlagen` mit Klartext-Grund und "Erneut versuchen"; Datei nachgereicht, Retry ->
  Auftrag aus Q1/Q2 weg, **Asset in D1**. **4l:** 30-Elemente-Render laeuft, ein dahinter
  eingereihter Import steht `wartet` und wird entfernt (Render laeuft weiter); danach
  "Render abbrechen" mit Rueckfrage -> Zeile weg, Stand leer, **keine Ausgabedatei**.
- **FA-23 ist ebenfalls gemessen** (Schritte **4a0/4a/4a2**): zweite Marke ueber die echte
  Oberflaeche angelegt, Standardmarke am echten `<select>` **gezielt** gewechselt und in
  `project:listeProjekte` belegt; Loeschversuch der genutzten Marke **gesperrt** mit
  Projekt-Grund und Ausweg, nach dem Zurueckstellen **geloescht**. Der Schritt-5-Aufraeumen
  loescht `DurchlaufMarke-*` (auch Reste abgebrochener Laeufe).
  Matrix: **5 gemessen** (FA-05/17/18/19/23), 15 teilweise, **1 Luecke** (FA-24), 3 manuell.
- **Drei echte Produktbefunde gefunden und behoben:**
  1. **Terminale Zeile blieb in der Leiste** (25 s nach Erfolg, 30 s nach Abbruch):
     `beende-auftrag.ts` meldete `queue:geaendert` nur VOR dem Q1-Entfernen; der im
     Kommentar vorausgesetzte "zweite Push" existierte nie. Jetzt zweiter Push nach
     `entferneAusQ1`; Verhaltens-Test prueft die Reihenfolge und dass die zweite Meldung
     den Auftrag nicht mehr traegt.
  2. **"Erneut versuchen" erreichte die Sicht nicht:** `auftrags-nachlauf.ts` merkte sich
     die `auftragId` - ein Wiederholungsversuch behaelt sie (TK 9.3.3), nur `versuche`
     steigt. Der spaetere Erfolg fiel unter den Tisch (Galerie blieb bei 2, D1 hatte 3).
     Jetzt Merker-Schluessel `auftragId:versuche`.
  3. **Der "Ausweg" aus der Marken-Loeschsperre war eine Sackgasse:** Besuchte Reiter
     bleiben montiert (TK 9.14.2); die `loeschvorschau` im `marken-editor` wurde beim
     Oeffnen einer Marke nie zurueckgesetzt. Nach dem Zurueckstellen der Standardmarke
     blieb die Blockade stehen, ohne Loesch-Knopf. Jetzt setzt der Hoerer auf die
     geoeffnete Marke die Vorschau zurueck.
- **UI-Ausrichtung fuer „Oberfläche 2.0" (21.10.2026, User bestaetigt; noch keine
  AD/TK-Anforderung):** Im Projekteditor liegt der Fokus auf **Aktionsverwaltung, Einfuegen,
  dem Erstellen guter Aktionen und der Banner-Spur**; evtl. Videobearbeitung. **Eine eigene
  Bilder-/Videoverwaltung entfaellt als Flaeche** - Bilder und Videos sind Teil der Aktion.
  **Bestaetigt:** „Banner" = Banner-Spur / `BannerSchild` (BA-Familie #365+); das eine
  Projektvideo behaelt seinen schmalen Import/Ersetzen-Weg (FA-01/#422). Begruendung des
  Users: „so macht die ui keinen sinn". **Zuordnung:** Abschnitt 6 in
  [`docs/agents/oberflaeche-2-0-plan.md`](docs/agents/oberflaeche-2-0-plan.md); Volltext in
  [`docs/agents/ui-ausrichtung-projekteditor-2026-10-21.md`](docs/agents/ui-ausrichtung-projekteditor-2026-10-21.md).
  Ein Umbau braucht erst Entscheidung + AD/TK-Nachtrag + Issue (kein Umbau ohne Plan).
- **Alle drei Gegenproben** beißen und sind byte-identisch zurueckgenommen (Pruefsummen in
  der Session-Datei).
- **Gate:** `npm run pruefung` ohne `Befund` - **5.602 Unit-Tests (333 Dateien)**, **49
  Integrationstests (12 Dateien)**, Typecheck/Lint 0.
- **Ehrlich offen:** Gate wertet `console.error` nicht (B5); **FA-24** ist die letzte
  Matrix-Luecke; Fehlschlag eines **Renders** und Entfernen waehrend eines Abbruchs sind
  ungemessen; **#433** optische Abnahme beim User; Mutations-Chargen 138/92 offen.
- **Branches `bau/treiber-fa17-18` und `bau/treiber-fa23`** wurden nach `main` gemergt
  (Merges `17b3175`, `d19a12a`); `main` steht **119 Commits vor `origin/main`**.
  **Nicht gepusht.**
- Naechster Schritt: **FA-24** (Marken-Editor) oder die **Gate-Blindstelle** entscheiden.

## STAND HEUTE (20.10.2026: Matrix, #257, Update-Loop, Mutationstests) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-20-session.md`](docs/agents/uebergabe-2026-10-20-session.md) – LIES DIESE DATEI ZUERST.**

- **Treiber-Matrix gebaut** (`docs/agents/treiber-matrix.md`, Waechter
  `tests/unit/treiber-matrix.spec.ts`): alle **24 FA** gegen die Treiber-Schritte gemappt,
  Status nur fuer das echte Fenster. Befund: **1 von 15 Muss** war vollstaendig gemessen
  (FA-05). Der Waechter prueft Vollstaendigkeit (jede FA genau eine Zeile, jede genannte
  Kennung existiert, jeder `schritt-4*` ist zugeordnet) - **nicht** die Wahrheit der
  Statusspalte.
- **#257 GEBAUT, gemergt und geschlossen** (`056d21b`, Merge `3189564`):
  `queue-panel/index.tsx` ist die Modul-Wurzel (Sicht genau einmal, danach Fortschritt;
  Klappzustand, Rueckfrage, eine Meldung; Schalter aus #209/#210, Fehlertext aus #211).
  Der **leere Platzhalter** `warteschlangen-leiste.tsx` ist geloescht, `App.tsx` importiert
  `./queue-panel` (Abweichung von der Issue-Dateiliste im Issue-Kommentar gemeldet).
  Treiber-Schritt **4j** misst: Leiste da, eingeklappt, geholter Stand, ueberlebt den
  Reiterwechsel, klappt auf (1 Auftragszeile). **FA-16 ist damit teilweise gemessen**;
  FA-17/18 sind erreichbar, aber noch ohne Treiber-Szenario.
- **Update-Loop gefunden und behoben** (`docs/agents/update-loop-2026-10-20.md`,
  `189b274`, Merge `ca403c7`): `baueReiterInhalte` wurde bei jedem App-Rendern gerufen;
  seine Rueckgabe-Funktionen sind die Komponententypen im Rahmen - jeder App-Render
  **mountete den aktiven Reiter neu** (gemessen: **2.300** Effekt-Durchlaeufe, > 1.900
  Composer-Initialisierungen), der Reparatur-Effekt meldete erneut. Jetzt sind die
  Reiterinhalte je Zugaengen-Satz memoisiert und die Umgebung reist als **Getter**.
  Nachher: **12** Effekt-Durchlaeufe, **keine** `Maximum update depth`-Meldung. Neuer
  Waechter in `app-einhaengung.spec.ts` (App-Rendern baut die Inhalte nicht neu).
- **Gate:** `npm run pruefung` **Exit 0** - **5.600 Unit-Tests (333 Dateien)**, **49
  Integrationstests (12 Dateien)**, Treiber ohne Befund. Typecheck/Lint 0.
- **Mutations-Piloten** (`docs/agents/mutation-pilot-2026-10-20.md`): **vier Runden, 18
  Dateien** gegen **130 Verhaltens-Mutationen** und **20 harmlose Refactorings**. **124**
  Mutationen erkannt, **6** nachweislich aequivalent; **0/20** Refactorings rot. **Sieben
  echte Luecken** gefunden und geschlossen (u. a. `aktuelleStelle` mit `zeigerIndex > 0`,
  `aktuelleRenderId` mit laufendem Import vor Render, Undo-Tiefe 1, `aria-selected`,
  Mindestkante 8 px, Referenz statt Kopie bei `loeseSchrift`). **109 Quelltext-/Meta-Tests
  entfernt**, **7 Verhaltens-Tests ergaenzt**. Suite **5.600 Tests**. Befund: Die
  Behavior-Tests der 18 Dateien sind **nicht** Ballast; der belegte Ballast ist die
  Kategorie Quelltext-/Signatur-Probe (verbleibend: **138** Dateien mit `readFileSync`,
  **92** mit Grep-/Bauvorschriften-`describe`).
- **Ehrlich offen:**
  - **Gate-Blindstelle:** Der Treiber wertet `console.error` nicht; "Maximum update depth"
    waere trotz grünem Lauf sichtbar gewesen. Ein Befund-Rang dafuer ist **nicht** gebaut.
  - **FA-17/18** (Fehlschlag provozieren, Wiederholen, Entfernen/Abbruch) brauchen ein
    eigenes Treiber-Szenario; ein dauerhaft fehlgeschlagener Auftrag bleibt in Q2.
  - **#433** optische Abnahme steht weiter beim User.
- `main` **105 Commits vor `origin/main`**; **nicht gepusht**.
- Naechster Schritt: **#433** beim User oder das **FA-17/18-Treiber-Szenario**.

## STAND HEUTE (19.10.2026, dritte Sitzung: Q3 GEBAUT UND GEMERGT) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-19-session-3.md`](docs/agents/uebergabe-2026-10-19-session-3.md) – LIES DIESE DATEI ZUERST.**

- **Q3 (Prozess-Fragmentierung) ist komplett gebaut und gemergt** – Programm
  `docs/agents/codequalitaet-programm.md` (Stand dort nachgetragen):
  - **Q3/A:** EINE `meldeAn` (`melde-an.ts`), **sechs** lokale Kopien entfernt – **#337 geschlossen**
    (`f91c2b3` / Merge `495bc0c`). Gemessene Abweichung zu #337: sechs statt drei Kopien, Pfade
    unter `ipc-gateway/` statt `project-store/` (gebauter Code gewinnt).
  - **Q3/C:** **15** Platzhalter-`index.ts` gelöscht; `renderer/shell/` aufgelöst
    (`WarteschlangenLeiste` → `queue-panel/warteschlangen-leiste.tsx`), `406b1f4`.
  - **Q3/B:** fünf `project-store-nachtrag*.ts` → **eine** Datei; `vorlagen-nachtrag.ts` in
    `vorlagen-store/ipc-verdrahtung.ts` (`14c3075`+`484eea2`, Merges `aa12d3c`+`f84ee2a`).
    **Die Einstiegspunkte bleiben** – die Positionen 1–14 in `main/index.ts` sind Vertrag aus #3.
    Befund: die alte Begründung „Eintragszahl darf nicht überschritten werden" ist **nirgends
    geprüft**, sie stand nur in Kommentaren.
- **#433 bleibt offen** – optische Abnahme am echten Fenster steht weiter aus (User konnte noch
  nicht testen). Der Dev-Lauf wurde sauber beendet, kein Waisenprozess.
- **Q4-Audit GEBAUT** (`docs/agents/q4-test-audit.md`): Baseline (331 Dateien, 4.607 `it`,
  559 `vi.mock`, 132 Dateien ohne Mock), Methode und **alle 20 Verdachtsfälle gelesen –
  20 × `halten`**. Fazit: **keine Deleting-Welle**; das Problem war das **Gate**, nicht die
  Tests. `npm test` lief nur `tests/unit/**`.
- **Q4-Gate GEBAUT:** `npm run pruefung` = `build` → `test` (Unit) → `test:integration` →
  `durchlauf`. Der Treiber setzt jetzt auch bei einem Fund der Schwere **`Befund`** Exitcode 2
  (`Untersuchung`/`MANUEL` bleiben Hinweise). **Ein vollständiger Lauf ist grün:**
  5672/331 + 49/12 + Treiber ohne Befund.
- **Drei echte Befunde beim ersten Gate-Lauf behoben (nicht kosmetisch):**
  1. `standardmarke.tsx` ließ eine abgelehnte `aufWechsel`-Zusage als **unbehandelte
     Rejection** entkommen (fix: `catch` im `finally`-Muster) – das blockierte das Gate.
  2. `marken-dateien.spec.ts` racing mit der entprellten Auto-Speicherung (`ENOTEMPTY` im
     `afterEach`); fix: `flushBestand()` + `maxRetries` vor dem Aufräumen.
  3. Zwei Integrationstests widersprachen dem gebauten Code bzw. der Plattform:
     `dateisystem-erkennung-echt` erwartete auf macOS `null` (gebaut ist `diskutil` →
     `'anderes'`), `standbild-echt` maß die Frist über `signal` (ffmpeg fängt SIGTERM) –
     jetzt über `dauerMs`.
- **Belege:** Typecheck/Lint 0, `npm run pruefung` **Exit 0** (Build + Unit + Integration +
  Treiber). Der frühere `standardmarke-anzeige`-„error" ist damit **weg**.
- **S6 (Leichen bewertet und entfernt) GEBAUT und gemergt** (`55d840a`, Merge `3eeccf6`):
  In `composer/index.tsx` standen die S0-Leichen unverändert – `Zeile` (34 Zeilen),
  `const gesamt` und **fünf** weitere Importe, alle nur durch die dateiweite
  `eslint-disable`-Zeile verdeckt. Alle hatten **keinen Aufrufer** (Grep je Name) → gelöscht,
  **Abschaltzeile weg**. Datei **985 → 948**. Beleg: Lint 0 **ohne** Abschaltzeile,
  `npm run pruefung` **Exit 0**. Der Composer-Umbau S1–S6 ist damit **abgeschlossen**
  (`docs/agents/composer-umbau-plan.md`).
- **Q4-3 begonnen** (`0292fe7`, Merge `9d84872`): Die erste Zusage, die bisher nur der
  Unit-Test hielt, misst jetzt der **Treiber Schritt 4h** am echten Fenster: **FA-19 /
  TK 9.7.5 – „Render erst frei, wenn alles behoben"**. Beleg: `Render-Sperre GEMESSEN:
  Knopf gesperrt, Fortschritt "0 von N behoben"`. `npm run pruefung` **Exit 0**.
  - **Vierter Fall (#438) am Fenster belegt** (Treiber-Schritt **4i**): Bild-Asset aus 4b3,
    Aktion mit Bild, Einschub per `setzeUnterbrechungen`, Bilddatei löschen, Projekt über die
    Liste neu öffnen. Beleg: `Vierter Fall GEMESSEN: unterbrechung · asset_fehlt – Render
    gesperrt, 0 von 1 behoben`.
  - **Dabei einen echten UI-Fehler gefunden und behoben:** Der Reparatur-Stand wurde nur
    **gestartet**, nie neu gerechnet – nach Projektwechsel/Aufräumen stand die **alte** Stelle
    im Panel. Jetzt rechnet `composer/index.tsx` bei jedem neuen Projektstand einmal neu
    (Referenz-Wache gegen Schleifen).
  - **Offen:** eine **Treiber-Matrix „Anforderung → Szenario"**, damit Lücken sichtbar werden.
- `main` **86 Commits vor `origin/main`**; **nicht gepusht**.
- Nächster Schritt: **Treiber-Matrix** oder **#433**. **#433** bleibt beim User.

## STAND HEUTE (19.10.2026, zweite Sitzung: #438 GEBAUT UND GEMERGT, #426-Familie geschlossen) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-19-session-2.md`](docs/agents/uebergabe-2026-10-19-session-2.md) – LIES DIESE DATEI ZUERST.**

- **#438 (Kaputt-Erkennung, vierter Fall) GEBAUT und gemergt** (`d2ebbbc`, Merge `bfbf1df`):
  `findeKaputteStellen` erkennt auch eine **Unterbrechung**, deren Aktion fehlt bzw. deren
  Aktionsbild ein `fehlt`-Asset ist – als eigene vierte Stelle, die den Render sperrt
  (`istRenderFreigegeben` = false). **Zuerst** wurde **TK 9.7.5 von „drei" auf „vier"**
  fortgeschrieben, Kopf auf **TK v3.27 / 19.10.2026**, `.docx` neu erzeugt. Neuer Typ
  `unterbrechung`, neue Fix-Optionen `unterbrechung_ersetzen`/`unterbrechung_entfernen`,
  neues Uebergabe-Ziel `unterbrechungs-auswahl` (eigene Anzeige `app-shell/unterbrechungs-auswahl.tsx`).
  **Ueber die Issue-Dateiliste hinaus** verdrahtet (sonst Sackgasse) – im Issue-Beleg benannt.
- **Gegenprobe #438:** `unterbrechungen`-Zweig entfernt → **9 Tests rot**; Ruecknahme
  byte-identisch (Pruefsumme `a030205391d23c865ebf70ea54acbd070285b939036d5c0eca1ed66aced40b1d`).
- **Volllauf 5672 Tests gruen (331 Dateien)**, Typecheck/Lint 0 (der eine gemeldete „error"
  ist der bekannte `standardmarke-anzeige`-Vorbefund, kein Test rot).
- **Auf GitHub geschlossen:** **#436**, **#437**, **#438** und das **Eltern-Issue #426**
  (alle vier Bau-Issues #434–#437 sind durch). Beleg-Kommentare je Issue.
- **Ehrlich offen:** `kaputteUnterbrechungen` (Feld in `liste-ansicht.ts`) wird noch von
  keiner Komponente angezeigt – Markierung im Video-Block ist ein eigener optischer Schritt.
- `main` **64 Commits vor `origin/main`**; **nicht gepusht**.
- Naechste Sitzung: **#433 optisch abnehmen**; im Programm **Q3/Q4/Q1.2**, danach **S6**.

## STAND HEUTE (19.10.2026, #436/#437 Unterbrechungen GEBAUT UND GEMERGT, #438 Luecke) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-19-session.md`](docs/agents/uebergabe-2026-10-19-session.md) – LIES DIESE DATEI ZUERST.**

- **#436 (Vorschau) GEBAUT und gemergt** (`e326926`, Merge `04cd903`): An der Zeitstelle steht
  die Aktion ueber dem **pausierten** `<video>`, danach laeuft das Video an derselben Stelle
  weiter (TK v3.26 / 9.2.9). Treiber-Schritt **4b5**.
- **#437 (Composer-Bedienung) GEBAUT und gemergt** (`9d02952`, Merge `db457a3`): Die **Vorlage
  der Aktion** entscheidet den Drop (`vollflaeche` → Unterbrechung, sonst Band); Marken im
  Video-Block; Entfernen per Klick, je **EIN Undo-Schritt**. Treiber-Schritt **4b6**. Der
  `#4f`-Seed nutzt jetzt `band-standard` (sonst waere der Body-Drop eine Unterbrechung).
- **`main` traegt beides; NICHT gepusht.** `main` steht jetzt **61 Commits vor `origin/main`**
  (Push nur auf Anweisung). Beide Merge-Commits wurden nach dem Merge erneut geprueft:
  Typecheck/Lint 0, Suite **5636 gruen (330 Dateien)**, Treiber 4b5/4b6 ohne Befund.
- **Belege:** Treiber 4b5 (`Einschub @53 … -> danach @85`) und 4b6 (`Marken 0->1 …
  1 -> 0 -> 1 -> 0`) am echten Fenster. Gegenproben je Issue mit Pruefsumme
  zurueckgenommen (Details in der Session-Datei).
- **#438 NEU angelegt** (Unterbrechungen in der Kaputt-Erkennung, **vierter Fall**):
  **blockiert, bis TK 9.7.5 von „drei" auf „vier"** fortgeschrieben ist – der Nachtrag
  steht vollstaendig im Issue. Ohne ihn wuerde der Render mit einem Platzhalter im
  Einschub freigegeben (TK 9.10.7 / FA-19).
- **#426 bleibt Eltern-Issue offen**; die vier Bau-Issues #434–#437 sind gebaut und gemergt.
  **#436/#437 sind auf GitHub noch offen** (Schliessen mit Beleg steht aus).
- Naechste Session: **#438** (nach dem TK-9.7.5-Nachtrag), **#433 optisch abnehmen**; im
  Programm **Q3/Q4/Q1.2**; danach **S6**.

## STAND HEUTE (17.10.2026, Composer S4/S5, #433 Filmstreifen, #426/#434/#435 Unterbrechung) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-17-session.md`](docs/agents/uebergabe-2026-10-17-session.md) – LIES DIESE DATEI ZUERST.**

- **Composer-Umbau S4/S5 GEBAUT und gemergt** (Merge `2ede5d4`; Plan `docs/agents/composer-umbau-plan.md`).
  **S4:** die drei Regionen als eigene, gesteuerte Bausteine (`bibliothek-dock.tsx`,
  `galerie-bereich.tsx`, `ausgaben-bereich.tsx`). **S5:** der DnD-Zug im Hook
  `verwende-zeitleisten-zug.ts` (`neuZug`/`aktiveKante`/`laedtKante`/`bandZiel`/`bandZeit`/`korbRef`
  + die vier Handler + Projektwechsel-Reset). Verhaltensneutral: DOM/Testids zeichengleich, Treiber
  ohne Befund. `index.tsx` **1123→957**. **S6** (Leichen bewerten) bleibt bis nach dem UI-Umbau.
- **#433 GEBAUT und gemergt** (Merge `517c5cc`; Plan `docs/agents/433-frames-plan.md`): Der
  **Video-Block der Zeitleiste zeigt einen Filmstreifen aus echten Einzelbildern** des Videos.
  User-Entscheidung: „literally die frames … die einzelnen Bilder"; Standard-Zoom bleibt. Die
  Anzahl folgt der Blockbreite (Zoom): Treiber 4b4 **1 Bild @ Standard → 6 Bilder @ 128 px/s**.
  Baustein `video-filmstreifen.tsx` nutzt `fangeBild`/`warteAufMetadaten` aus `thumbnails.ts`
  (keine zweite Bildquelle). **OFFEN: optische User-Abnahme am echten Fenster** (Issue bleibt offen).
- Zaehler: Suite **5602 gruen (327 Dateien)**, Typecheck/Lint 0. Alles **lokal auf `main`**,
  **nicht gepusht**.
- **#426 (Aktion unterbricht das Video) ENTSCHIEDEN; #434/#435 GEBAUT, #436/#437 offen.** User-Entscheidung
  **17.10.2026: Modell A – Einschub am Video-Element** (`Listenelement.unterbrechungen`,
  `[{ zeitstelle, aktionRef, dauer }]`; das Video bleibt EIN Element; sequenzielles Gegenstueck zum
  parallelen Band). **AD v1.8 / TK v3.26** (9.2.9 Render-Zerlegung, 9.5.2 `setzeUnterbrechungen`,
  9.5.3 Kaskade, 9.7.7 Bedienung, 9.11.3 Modell), `.docx` synchron, Plan
  `docs/agents/426-unterbrechung-plan.md`, Merge `080ee4e`. **Bau-Issues #434 (Modell+Store,
  GEBAUT+gemergt `e772993`) und #435 (Render-Zerlegung, GEBAUT+gemergt `c8ba86f`)**, dazu #436
  (Vorschau) und #437 (Composer-Bedienung) geschnitten; #426 bleibt als Eltern offen.
- Naechste Session: **#436 bauen** (Vorschau – Pause an der Zeitstelle), dann **#437** (Bedienung);
  **#433 optisch abnehmen**; im Programm **Q3/Q4/Q1.2**.

## STAND HEUTE (16.10.2026, Composer-Umbau + Programm Codequalitaet) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-16-session.md`](docs/agents/uebergabe-2026-10-16-session.md) – LIES DIESE DATEI ZUERST.**
**WICHTIG OFFEN:** Die **Frames-Anzeige** der Zeitleiste erfuellt den User noch nicht („geht immer
noch nicht") – NICHT diagnostiziert; **Issue #433** (`braucht-entscheidung`) angelegt; am echten
Fenster klaeren.

**Neuer Plan-Zug – nach der #432-Lehre: kein Umbau ohne Plan.** Der Befund „`composer/index.tsx`
ist schwer zu bearbeiten" wurde gemessen und in zwei Plaene gefasst:
- **[`docs/agents/composer-umbau-plan.md`](docs/agents/composer-umbau-plan.md) – S1–S3 gebaut,
  treiber-gemessen, nach `main` gemergt** (Merge `70007ef`, Branch `bau/composer-umbau`). **S1:** EIN
  Overlay-Rahmen (`overlay-rahmen.tsx`) statt vier Kopien. **S2:** EIN Wurzel-Melder
  (`wurzel-meldung.ts`), 15 Wiederholungen weg. **S3:** die vier Overlays
  (`render-/export-/medium-loeschen-/band-overlay.tsx`) als eigene Bausteine; die Wurzel reicht nur
  Lage + Daten + Rueckrufe herein. **S4/S5 erst NACH #428** (sonst Konflikt an der
  Zeitleisten-/DnD-Stelle). Ehrlich: `index.tsx` 1170→1113, composer-Modul **+6 Dateien** – der
  Gewinn ist Ort-Klarheit, nicht Zeilen.
- **[`docs/agents/codequalitaet-programm.md`](docs/agents/codequalitaet-programm.md)** – vier Straenge
  Q1–Q4; Reihenfolge **Q2→Q1→Q3→Q4**. **Q2/A (Atomar-Schreib-Kern) GEBAUT, gemergt** (Merge `c6c77af`,
  Plan `docs/agents/schreib-mechanik-plan.md`, Branch geloescht): die domain-freie Mechanik
  (`mitWiederholung`/`taugtAlsSicherung`/`istCode`/`text`) liegt in
  `src/main/gemeinsam/schreib-mechanik.ts`; die fuenf `schreibe-*`-Dateien nutzen sie. **Weg 2:** nur die
  **Mechanik** geteilt – die **Zahl** `WARTEZEITEN_MS` und die **Serialisierung** bleiben je Store
  (TK 9.5.4); die begrenzte Umkehr der „BEWUSST NICHT"-Entscheidung ist im Modul-Kopf begruendet und als
  Nachtrag an #31/#47/#98/#71 gemeldet. `schreibe-*` **2917→2600** Zeilen, src netto **−235**.
  **S7 (Nachtrag Q2/A) GEBAUT, gemergt** (Merge `76b52ef`): `text`/`istCode` sind generische
  Systemfehler-Helfer und liegen jetzt neutral in `src/main/gemeinsam/systemfehler.ts`; **24
  byte-gleiche Kopien** in `main/` entfernt (netto −108 Zeilen; `ffmpeg-adapter/uniformitaet.ts`
  ausgenommen – andere Sache).
- **Q1 (Kommentare) GEBAUT, gemergt** (Merge `c648fc3`, Branch geloescht;
  `docs/agents/kommentar-regeln.md` + `kommentar-plan.md`): der generierte **Geruest-Kopf ist aus
  allen 241 Dateien** entfernt (**netto −4157 Zeilen**; `[modul]`-Zweckzeile und Hand-Begruendungen
  blieben). Guard `tests/unit/kommentar-guard.spec.ts`; **9 DoD-Grep-Proben** auf den neuen Vertrag
  gezogen (User-Entscheidung – die DoD wurde NICHT still umgeschrieben). Gegenprobe:
  `git diff -- src` hatte **0 Nicht-Kommentar-Zeilen**. **Q1.2** (wiederholte Begruendungen) offen.
- **#432 als verworfen geschlossen** (`not planned`); der Branch ist geloescht.

Zaehler: Suite **5550 gruen (322 Dateien)**, Typecheck/Lint 0, Treiber ohne Befund
(4f/4f2/4f4/4g2/4g4 unveraendert). Alles **lokal auf `main`**, **nicht gepusht**.
**#428 GEBAUT, gemergt** (Merges `063b135` + `f7583c4`; Plan `docs/agents/428-zeitband-plan.md`):
Die Zeitleiste zeigt eine **Frame-Achse mit Zoom** (px/s; bei hohem Zoom einzelne Frames) und Labels
in `mm:ss:ff` (`zeitband.ts`, rein) sowie die **Band-Abschnitte** im Video-Block an ihren Zeitstellen.
Ein Drop auf dem Video fuegt **an der Zeitstelle** ein: liegt sie mitten in einem Abschnitt, wird
dieser **framegenau geteilt** und die neue Aktion dazwischengesetzt (`teileUndFuege`/
`bandAufnahmeMitTeilung`) – das Band bleibt eine **durchgehende Rotation** (FA-20), **kein Luecke,
kein Modellfeld, keine Render-Aenderung**.
Naechste Session: **#433 loesen** (Frames-Anzeige, offenes Beduerfnis des Users), dann **S4/S5** des
Composer-Umbaus; im Programm offen **Q3**, **Q4** und **Q1.2**.

## STAND HEUTE (16.10.2026, Abnahme-Session) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-15-session-3.md`](docs/agents/uebergabe-2026-10-15-session-3.md) – LIES DIESE DATEI ZUERST.**
Kurz (Fortsetzung): **User-abgenommen am 16.10.: #429 (Dauer/Trim + Undo) und #430 (Aktion löschen)**,
zusätzlich #422/#423/#424. In dieser Sitzung gebaut, treiber-gemessen und geschlossen: **#425, #427,
#429, #430, #431**. **#430** – Aktion in der Composer-Bibliothek **löschen** (ohne Rückfrage, EIN Undo-Schritt; Treiber 4g4: 1→0→Undo 1). **#429** –
Dauer/Trim legen jetzt einen **Undo-Schnappschuss** an (Treiber 4f4: 2,0→1,9→Undo→2,0 in EINEM Schritt);
`uebernehmeGrenzen` (#125) bekam dafür den **Sicht-Schreiber** als vierten Parameter. **#431** – eigenes
Anwendungsmenü ohne Undo/Redo-Acceleratoren (Cmd+Z erreichte den Renderer nicht; Ursache von „Cmd+Z tat
nichts"). **#427** – Beenden nach Fenster-Schliessen (kein Waisenprozess). **#425** – Band-Aufnahme am
Video. **Nur angelegt, NICHT gebaut:** **#428** (Zeitleiste als Zeit-/Frame-Band) und **#426**
(kurze Unterbrechung). Suite **5523 Tests gruen (318 Dateien)**, Typecheck/Lint 0. Alles **lokal auf
`main`**, **nicht gepusht**. Naechste Session: **#428/#426 entscheiden**.

## STAND HEUTE (15.10.2026, nachts) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-15-session-3.md`](docs/agents/uebergabe-2026-10-15-session-3.md) – LIES DIESE DATEI ZUERST.**
Kurz: Aus der Abnahme **#422–#424** (422/423 abgenommen) kamen weitere Befunde. **#431 GEBAUT +
gemessen + geschlossen** – Cmd+Z wurde vom **Electron-Standardmenue** geschluckt (Rolle „undo",
Cmd+Z-Accelerator); jetzt ein eigenes Menue ohne Undo/Redo-Acceleratoren + Fokus-Waechter in #350,
Merge `05d1850`, TK v3.24 / 9.14.2. **#429** (Dauer/Trim erzeugen **keinen** Undo-Schnappschuss –
Vertragsbruch zu TK 9.13.1) und **#430** (Aktions-Loeschen fehlt in der Composer-Bibliothek) und
**#428** (Zeitleiste als Zeit-/Frame-Band) sind **angelegt, NICHT gebaut**. Suite **5516 gruen
(316 Dateien)**, Typecheck/Lint 0. Alles **lokal auf `main`**, **nicht gepusht**.
Naechste Session: **#429 bauen** (User-Wunsch), **#424-Abnahme** (Cmd+Z ist jetzt pruefbar),
dann **#430/#428 entscheiden**.

## STAND HEUTE (15.10.2026, spaetabends) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-15-session-3.md`](docs/agents/uebergabe-2026-10-15-session-3.md) – LIES DIESE DATEI ZUERST.**
Kurz: **#425 gebaut + treiber-gemessen** (Band-Aufnahme am Video, TK v3.23 / 9.7.7). **#422/#423
User-abgenommen (ok)**; bei der Abnahme meldete der User zwei Befunde: **#427** (die App beendet
sich nach dem Fenster-Schliessen nicht – Waisenprozess blockierte den Neustart) ist **GEBAUT und
am echten Fenster gemessen** (Gegenprobe beisst; Merge `0ce2d17`); **#428** (neue Anforderung:
„Zeitleiste soll Frames/Zeitstellen zeigen, Aktion an einer Zeitstelle im Video ablegen") ist
**nur angelegt** (`braucht-entscheidung`, Modell offen). #425+#427 geschlossen.
Suite **5512 Tests gruen (315 Dateien)**, Typecheck/Lint 0. Alles **lokal auf `main`**, **nicht
gepusht**. Naechste Session: **#424-Abnahme** (konnte der User noch nicht testen), dann
**#428 entscheiden**, dann **#426** und Welle 2 / #371.

## STAND HEUTE (15.10.2026, abends) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-15-session-3.md`](docs/agents/uebergabe-2026-10-15-session-3.md) – LIES DIESE DATEI ZUERST.**
Kurz: **#425 ist GEBAUT und treiber-gemessen** (Band-Aufnahme am Video). Vor dem Bauen wurden die
drei STOPP-Punkte des Issues mit dem User entschieden: (1) Startdauer = Dauer-Kette
`aktion.standardDauer ?? projekt.standardSegmentdauer ?? 10`; (2) Band-Vorlage ohne vorhandene =
die erste waehlbare (#129); (3) Drop auf ein Aktions-Segment = sequenziell davor/danach (kein
Ablehnen) – nur der **Koerper eines VIDEO-Blocks** ist Band-Ziel. `einblendung-ansicht.tsx`
(#253/M7-60) ist jetzt **montiert** (war „fertige Funktion ohne Aufrufer"). Neu:
`composer/band-aufnahme.ts` (rein), `zeitleiste.tsx` mit sichtbarem Band-Ziel (`data-band-ziel`).
Treiber 4f2: `bandZiel=true; Bloecke 2->2; Abschnitte=[{aktionRef, dauer:10}]; Band-Zeilen=1;
Undo Cmd+Z -> 0`. TK **v3.23** / 9.7.7, `.docx` neu. Suite **5509 Tests gruen (315 Dateien)**,
Typecheck/Lint 0. Branch `bau/425-band-anbinden` (noch **nicht gepusht**).
Naechste Session: **User-Abnahme #422–#424**, dann **#426 entscheiden**, dann Welle 2 / #371.

## STAND HEUTE (15.10.2026, nachmittags) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-15-session-2.md`](docs/agents/uebergabe-2026-10-15-session-2.md) – LIES DIESE DATEI ZUERST.**
Kurz: Die **User-Abnahme der Kernachse** (#416–#421) brachte eine Anforderungsaenderung, die entschieden
UND gebaut ist: **Ein Projekt – ein Video**. **#422** (Bibliothek „Video", „Video importieren",
Auto-Uebernahme ans Listenende, Ersetzen mit Bestätigung; das Video wird **nicht gelöscht**), **#423**
(Anlegen: **Video zuerst, Pflicht** – ohne Video kein Projekt; Haeckchen entfernt), **#424** (sichtbare
Undo/Redo-Pfeile in der Reiterleiste). AD **v1.7** / TK **v3.22**. Nur DOKUMENTIERT: **#425** (Band/FA-20
anbinden – `EinblendungAnsicht` war „fertige Funktion ohne Aufrufer") und **#426** („Aktion unterbricht
das Video kurz" – neue Anforderung, Modell/Render zu entwerfen). Suite **5491 Tests gruen (313 Dateien)**,
Typecheck/Lint 0, **alles gepusht**. Naechste Session: **User-Abnahme #422–#424**, dann **#425 bauen**
und **#426 entscheiden**.

## STAND HEUTE (15.10.2026, vormittags) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-15.md`](docs/agents/uebergabe-2026-10-15.md) – LIES DIESE DATEI ZUERST.**
Kurz: **Die SECHS Kernachse-Nachzuege sind ALLE gebaut UND treiber-gemessen** (#416, #417,
#418, #419, #420, #421) – je ein Branch + Merge auf `main`. Damit ist die Kernachse
inhaltlich fertig; es fehlt nur noch die **User-Abnahme** (Regel: Treiber-Beleg ist keine
User-Abnahme). Wichtigste Messungen: #417 Aktion 2 -> 3 Bloecke an Position 2 (Undo 1
Schritt), #419 Buehne 768x151 mit Video 268x151, #418 `data-ausgewaehlt=true` nach dem
Import, #420 Kontextmenue an der Zeitleiste (Duplikat/Entfernen), #416 Inline-Anlegen
Aktionen 1 -> 2, #421 Reparatur 2 -> 1 (Cmd+Z 1 Schritt). Zusatzbefund+behoben: `fuehreFixAus`
hatte KEINEN Aufrufer (die Fix-Knoepfe fehlten) – neues `composer/reparatur-panel.tsx`.
Suite **5477 Tests gruen (310 Dateien)**, Typecheck/Lint 0, 55 Commits ungesendet.
Naechste Session: **User-Abnahme der Kernachse**, dann Welle 2 (Banner-Spur) und die
#371-Klaerung.

## STAND HEUTE (14.10.2026, spaet) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-14-session-2.md`](docs/agents/uebergabe-2026-10-14-session-2.md) – LIES DIESE DATEI ZUERST.**
Kurz: Die **Oberflaeche-2.0-Welle 1** ist gebaut und Treiber-gemessen (#411 position-Vertrag,
#412 Spalten-Drop + Kanten, #413 Drag-Quellen, #414 Videostage oben/Composer unten,
#415 Undo-Naht Variante a - **am echten Fenster GEMESSEN: Spalt-Drop 2 -> 3 Bloecke,
Cmd+Z 3 -> 2 in EINEM Schritt**). Suite 5462 Tests gruen (308 Dateien), Typecheck/Lint 0.
**Aber: der User hat 14.10. Befunde gemeldet, die zur KONVERTIERUNG fuehrten** (User-Weisung:
teilerfuellte Issues werden NICHT als fertig gemeldet, sondern die Reste als eigene
Nachzugs-Issues mit Herkunfts-Kommentar gefuehrt): **#416** (Aktion anlegen), **#417**
(Drag zwischen Frames fuer den Menschen bedienbar), **#418** (Import = EIN Video,
standardmaessig ausgewaehlt), **#419** (Videostage/Play), **#420** (KontextMenue an der
Zeitleiste), **#421** (Reparatur-Kette). **Die Kernachse gilt ERST, wenn alle sechs
erledigt sind.** Basis-Abgleich: `docs/agents/basis-abgleich-2026-10-14.md`.
Datenaufraeum: 74 Durchlauf-Testprojekte geloescht (Backup im opencode-Temp), der Treiber
raeumt je Lauf hinter sich (solange die App nicht fertig ist). 40 Commits ungesendet.
Regel neu: Treiber-Beleg ist keine User-Abnahme.
Nächste Session: die SECHS Nachzuege (Vorschlag: **#417 → #419 → #420 → #418 → #416 →
#421**), dann User-Abnahme der Kernachse, dann Welle 2 (Banner-Spur) und die #371-Klaerung.

## STAND HEUTE (14.10.2026, vormittags) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-14-session.md`](docs/agents/uebergabe-2026-10-14-session.md) – LIES DIESE DATEI ZUERST.**
Kurz: Die Familie „fertige Funktion ohne Aufrufer" ist ABGEARBEITET - vier Issues geschlossen
und gemergt: **#407** (Bibliotheksansicht #227 + Loesch-Anzeige #229 in der Composer-Wurzel
montiert; das Issue-Body-Hypothese wurde korrigiert: der Roh-IPC-Weg ist VERTRAG, die Luecke
waren die zwei unmontierten Ansichten), **#409** (Vorlagen-Editor wirft nicht mehr React #301:
Nutzungs-Laden aus dem Renderkoerper in einen Effect, Hooks vor dem Rueckweg), **#410**
(Standardmarke-Zeile liest den Wert der OFFENEN Zeile aus der Projekt-Sicht statt des
entprellten Listen-Stands), **#408** (KontextMenue montiert - ComposerLage traegt menueAdresse,
#259-Nachtrag angehaengt; Duplikat 1->2 UND Entfernen 2->1 am echten Fenster gemessen).
Treiber: Render-Lauf am echten Dialog belegt (#347 im echten Fenster), Export bleibt MANUELL
(nativer Dialog, User-Entscheidung 13.10.), Vorlagen-Editor-Sitzung belegt. Suite 5431 Tests
gruen (305 Dateien), Typecheck/Lint 0. Kein offener App-Befund. Nächste Session: **#371/#274
pruefen**, dann das Design „Oberfläche 2.0". Beim User: ca. 22 Commits ungesendet (Push nur
auf Anweisung); optische Abnahme #327; #289-Flaky (diesmal nicht aufgetreten, beobachten).

## STAND HEUTE (12.10.2026) – gilt vor allem Aelteren weiter unten

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-12-session.md`](docs/agents/uebergabe-2026-10-12-session.md) – LIES DIESE DATEI ZUERST.**
Kurz: SECHS E2E-Luecken geschlossen und gemergt - #342 (Dialoge montiert, `ComposerLage`
als einziger Zustand), #347 (Ausgaben-Auffrisch im Nachlauf + Auffrisch-Knopf im
Normalfall), #346 (Start-Hinweis wird reaktiv weggenommen), #340 (der ECHTE
media://-Handler ist am Fenster MESSBAR belegt: 200 statt 404), #350 (Strg/Cmd+Z
Undo/Redo), #352 (Formular-Befunde werden als Bediener-Sätze am Feld gezeigt).
Suite 5421 Tests grün, Typecheck/Lint 0. NEU **#407**
(direkte D1-Mutationen bringen die Liste nicht auf den Stand). Nächste Session:
**#404-Rest** - jetzt baubar, weil #342/#347 weg sind; dann **#407**, dann das
Schließen der BK-Issues #354-#359 (User-Freigabe liegt vor), dann #371/#274-Prüfung.
Beim User: ca. 196 Commits ungesendet (Push nur auf Anweisung); optische Abnahme
#327; #289-Flaky fiel zweimal in drei Vollläufen (einzeln immer grün, beobachten).

Basis-Abgleich #340-#353: DAMIT SIND ALLE SECHS offenen Lücken der Familie „fertige
Funktion ohne Aufrufer" geschlossen (#340/#342/#346/#347/#350/#352) - die Arbeit
des Treibers geht jetzt in die Tiefe (Render-Lauf, Export, Editor-Sitzung).

---

## STAND HEUTE (09.10.2026, spaet) – gilt vor ALLEM weiter unten

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-09-session.md`](docs/agents/uebergabe-2026-10-09-session.md) - LIES DIESE DATEI ZUERST.**
Kurz: Aufgeräumt (#7, #401, #402, #403 geschlossen; TV-Test entfallen), der DURCHLAUFS-TREIBER
ist gebaut (`npm run durchlauf`, Commit `7f9c096`/`ff90c7f`) und hat den Rest bereits zweimal
gemessen (#347/#342 im echten Fenster bestaetigt; Seed-Import mit gelebten Ereignis-Kanal).
Basis-Abgleich #340-#353: 7 geschlossen, 6 offen (Lueckenklasse). Reflog-Ära (Zwei-Screens,
29.-30.08.) ist ALS VERWORFEN entschieden. Nächste Session: #342 zuerst, dann #404-Rest,
dann #340/#347/#346/#350/#352.

Diese Session hat AUFGERAEMT und das Fundament des Durchlaufs 2.0 gelegt. Kurz, alles belegt in
den Issues:

- **User-Entscheidungen:** Der TV-Test ist ENTFALLEN (Nachtraege an #184/#186/#188 angehaengt);
  das macOS-Artefakt **#7 wurde GEBILDT UND GEMESSEN und geschlossen** (mac-Zielformat `dir`,
  `.app` am echten Mac gestartet, Binaries aus `app.asar.unpacked` belegt, Merge `b1f1534`);
  Zielformat `dir` ist diesmal als Issue-Kommentar in #7 belegt.
- **Zweierlei Versehentliches entdeckt und User-Klaerung:** Der Reflog zeigt eine verworfene
  ArbeitsaeAera (Bedienkonzept „Zwei Screens" AD v1.7/TK v3.21, „Banner & Aktionen" v1.8/v3.22,
  26.-30.08. E2E- und Redesign-Linie). **User-Entscheidung: der Reset war GEWOLLT** -
  die zugehoerigen lokalen Commits (f01def5, Stash) bleiben nur als Nachschlagequelle; die
  E2E-Nutzerfluss-Spec dort ist Vorbild fuer den Treiber.
- **Basis-Abgleich der 13 E2E-befund-Issues #340-#353 gegen heutiges main:** 7 GESCHLOSSEN
  mit Beleg (#341, #343, #344 deckt den #70-Fix, #345, #348, #349, #353; #353 mit der Restnotiz
  "Ersetzen nur via Führung"), 6 OFFEN mit Praezisierung (#340 media://-Stub, #342 Dialoge
  gebaut aber unmountet, #346 Hinweis ohne Ruecksetzweg, #347 Render/Export fritzt Ausgaben
  nicht auf, #350 tastatur.ts komplett ohne Aufrufer, #352 Roh-Codes am Feld).
- **#401** angelegt: die 4 unhandled errors aus marken-editor-wurzel.spec.ts (Test-Narben, vier
  Attrappen ohne mockResolvedValue); Verfahrensfehler (verbastelter erster Body) im Issue
  transparent benannt und berichtigt.
- **#289-Flaky** nachgetragen (dreimal im Volllauf gefallen, einzeln gruene Messung).
- **Durchlauf-Treiber gebaut und geliefert im Erstlauf:** `scripts/durchlauf.mjs` + `npm run durchlauf`
  (puppeteer-core steuert das gebaute Fenster, raeumt instanz.lock, sammelt Ereignisse und
  Fenster-Fehler, schreibt das Fundsprotokoll `docs/agents/oberflaeche-durchlauf.md`),
  Commit `7f9c096`, Lint/Typecheck 0.
- **Erstlauf-Ergebnis (alles im Protokoll):** (a) 5 Reiter im Fenster = RICHTIG (app-shell/
  reiter.ts, TK v3.6/#314); ein tod Altgeruest (`shell/reiter.ts` + ReiterInhalt.tsx +
  WarteschlangenLeiste.tsx, 4-Reiter-Vertrag ohne Aufrufer) verursachte den Scheinwiderspruch
  - **#402**. (b) **#347 und #342 im echten Fenster bestaetigt** (kein Auffrisch-Knopf; keine
  Dialoge im DOM). (c) Nach Projekt-Anlegen fehlt der Name in der Liste - **#403**
  (Ursache ungeklaert, Treiber-Rauschen inklusive). (d) Gegenprobe zum Treiber fehlte die
  Kennung `vorlagen-editor-kopf` im DOM - Arbeit im **#404** (Treiber-Ausbau).
- **#402 ERLEDIGT und gemergt** (d1abaa6): die zwei toten Dateien
  (shell/reiter.ts, shell/ReiterInhalt.tsx) geloescht (63 Zeilen), WarteschlangenLeiste
  ALIVE belegt (App.tsx:59 + mock Korrektur im Issue); Typecheck/Lint 0, 5399 Tests gruen.
- **#403 ENTWERTET und geschlossen** (d217936): Treiber-Rauschen - drei gemessene
  Messfehler (innerText liest keine versteckten Elemente; der Anlege-Ablauf wechselt
  nach Zusammenstellen; Zeilen messen erst NACH Rueckwechsel). Die App arbeitete
  korrekt; Treiber mit korrigiertem Messweise committet.
- **#401 ERLEDIGT und gemergt** (5ff1bb6): die vier Narben tragen je mockResolvedValue
  (Muster des Nachbarn); Spec meldet Errors 0 bei 18/18, der Volllauf nur noch den
  dokumentierten Vorbefund-Rejection (Error: weg, standardmarke-anzeige.spec.ts:150,
  #324-Testthema - bleibt stehen, gehoert zu #324).
- **#404 TEIL 1 ERLEDIGT und gemergt** (ff90c7f/bde004c): Seed-Import gebaut und
  gemessen - Testvideo aus dem gebuendelten ffmpeg, `queue:reiheEin` im echten
  Fenster, 2 queue:geaendert-Ereignisse nach 0 ms, Galerie da, Eintrag 1;
  Vorlagen-Kennung auf `vorlagen-uebersicht` (Erster-Falschbefund zurueckgenommen).
  REST von #404: Render-Lauf (blockiert durch #342), Editor-Sitzung der Vorlagen,
  Hobel der Standardmarke-Auswahl je Zeile in Objekten.
- **Neue Issues fuer die naechsten Sessions (Reihenfolge-Suggestion):** #404 (Treiber-Ausbau zu den neun Schritten),
  dann die offenen #340/#342/#346/#347/#350/#352 (alle "fertige Funktion ohne Aufrufer"-Familie),
  dann #401, der Rest basiert auf dem Treiber-Protokoll.

---

## STAND HEUTE (08.10.2026, spät abends) – gilt vor ALLEN älteren Angaben weiter unten

**Der volle Stand dieser Abendsitzung steht in [`docs/agents/uebergabe-2026-10-08-session-2.md`](docs/agents/uebergabe-2026-10-08-session-2.md) – LIES DIESE DATEI ZUERST.** Kurz:

- **Die Projektphase hat gedreht:** Die Logik ist komplett (M0–M8, 5399 Tests, Typecheck/Lint 0); JETZT läuft der Übergang „verdrahtet → benutzt im echten Fenster". Nächste Session: der **gesteuerte Oberflächen-Durchlauf 2.0** (Nicht-Design! Das Design kommt danach als eigener Schnitt „Oberfläche 2.0" – rot = Markenfarbe, Logo bleibt, Referenz Canva/Clipchamp-Look), je Fund nach dem Muster **Messen → Ursache → Fix → Gegenprobe → Issue-Nachtrag**.
- **Heute im echten Fenster gefunden und behoben (beide Vorbilder):** **#400** (Weiß-Screen beim Projekt anlegen: `kindOffen` inline gerufen → „Rendered more hooks"; jetzt als echtes Element `ProjektKindWurzel` montiert) und der **#70-Nachtrag** (Import-UI blieb alt bis zum Projektneuöffnen: die Push sah den terminalen Auftrag nie; Reihenfolge jetzt Q3 → Q2 → **Ereignis** → Q1-Entfernen → weiterdrehen). Erstere arbeitete mit `ELECTRON_ENABLE_LOGGING=1` + SEMPEL-Markern an vier Nahtstellen (danach SOFORT entfernt).
- Diagnose-Kettenstandards: **vor jedem Start `instanz.lock`/`instanz.signal` räumen** (sonst beendet sich die App lautlos mit Code 0); JEDEM Fix eine Gegenprobe auf dem fix-losen Stand; COMMT first, dann Checkout-Roundtrips.

- **(Vortag) M8: 59/60, 1 baubereit (#327)** – seitdem abgeschlossen: die Kette #311-#313-#314-#322-#327 plus #399; siehe `uebergabe-2026-10-08-session.md`.

- **M8: 59/60, 1 baubereit (#327)** (gemessen `python3 tools/bereitschaft.py`); 5362 Tests grün, 294 Dateien, Typecheck/Lint 0, Branch `main`.
- **Gebaut und gemergt seit der Vorsession:** #297, #298, #299, #300, #302, #323, #324, #326, #330, #336, #331. #309 war bereits geschlossen. Diff belegt: Reparatur-Commit `dcefc40` (Lint-Fehler + Faser in marken-bereitstellung.ts).
- **AM ARBEITSBAUM:** Sauber (nur die drei bekannten Vorbefund-Artefakte untracked). Neue Übergabe: `docs/agents/uebergabe-2026-10-07-session-2.md`.
- **Nächste Kette:** #311 - #313 - #314 - #322 - #327, und #399 (die vier benannten Edits aus #324).
- **Regeln der Serie:** Registry `project` = 21 Einträge, Verdrahtung = 13/4/17 (gebauter Code statt Issue-Text); `bootstrap-verdrahtung.spec.ts` ist die Vertragsquelle der Reihenfolge. Lint-Befund auf `main` widerspricht der vorm. Übergabe ("Lint 0"): siehe #312-Nachtrag.

- **M8: 44/60, 6 baubereit** (gemessen `python3 tools/bereitschaft.py`); 5235 Tests grün, 283 Dateien,
  Typecheck/Lint 0, Branch `main`.
- **Diese Session geschlossen:** #304 (marken-Kanäle), #321+#309 (MEDIA_SCHEMA + Bootstrap),
  #312 (marken-bereitstellung), #319a-Nachzug (setzeMarke stellt bereit), #295 (marken-uebersicht),
  #305 (marken-zugang), #296/#307/#308 (Farben/Slogan/Sicherheitsabstand).
- **AM ARBEITSBAUM UNCOMMITTET (Zweig `bau/m8-297-298`):** die zwei Quelldateien für #297/#298
  stehen; die zugehörige Testdatei ist NUR Gerüst (kein `it`-Block) – die Suite schlägt sie
  deshalb fehl, NUR wenn sie untracked liegt; `main` ist grün. Erste Aktion der Fortsetzung:
  Testblöcke für #297/#298 schreiben, je ein Commit, Nachträge, close, merge. Danach #299/#300.
- **Regeln der Session:** Umlaut-Entscheidung (Schlüssel UND Kanalname tragen den Umlaut,
  aufgelöst mit dem User), Ghost-Spione (`resetAllMocks`, nicht `clearAllMocks`), Zahlwörter
  12/4/16 statt 11/4/15 (#309-Nachtrag), die flaky `ENOTEMPTY`-Beobachtung liegt bei #289.

---

## STAND HEUTE (06.10.2026, spaet) – gilt vor ALLEN älteren Angaben weiter unten

### Session 06.10. (Fortsetzung) in Kürze

- **#262 ist GESCHLOSSEN UND gemergt.** Code `feb5c8c`, jsdom-DoD-Tests
  `tests/unit/app-einhaengung.spec.ts` (27 Pruefungen, `ab523c6`),
  Faser-Berichtigung `58f5bd4` ("Konfiguration unlesbar" statt "Configure
  unlesbar"; Parameter `meldungText` statt `hmldung`). Der Knopf "Erneut
  versuchen" baut den ERSTEN Lauf ab und startet ERST DANN neu - im Test durch
  ein Tagebuch gemessen (`['laeuftAn', 'baueAb', 'laeuftAn']`). Die DoD sprach
  von "SIEBEN" Eigenschaften des `UebergabeOverlay`, die Schnittstelle hat
  ACHT; im Issue-Nachtrag gemeldet, der Test belegt alle acht.
- **GEBUILT, auf `main` (4988 Tests gruen, 260 Dateien, Typecheck/Lint 0):**
  #218 (`b81e550`), #219 (`b997c1c`), #242 (`614186d`), #244 (`cec0066`),
  #260 (`42d689b`), #262 (`feb5c8c` + `ab523c6` + `58f5bd4`). Alle geschlossen.
- **Rueckbau der Naht erledigt (`62a5cfb`):** `inhalte-vorlauf.tsx` geloescht,
  der Re-Export in `inhalte.tsx` entfernt; App.tsx haengt jetzt an der echten
  Kette `starteRenderer` (#260) + #244. Vorher per `grep` belegt: kein
  Verbraucher der Naht mehr.
- **`alt/sicherung-arbeitsstand` VERARBEITET und geloescht (Tip `1a3bc5a`):**
  Gegenprobe vor dem Loeschen - `git diff` Branch/main fuer
  `src/renderer/preview-player/split-stile.ts` zeigt AUSSCHLIESSLICH
  Kommentarzeilen, der Laufzeitcode ist identisch; die Uebernahme ist
  vollstaendig, `main` ist die Obermenge.
- **Verfahrensfehler dieser Session (transparent):** Der Rueckbau-Branch wurde
  zuerst OHNE Commit angelegt; die Aenderung wanderte beim `checkout` mit und
  der erste Merge war ein No-op. Nachgeholt: Commit `62a5cfb` auf
  `abbau/naht-inhalte-vorlauf`, dann nach `main` gemergt.
- **#215** ist entfallen, wird aber von `tools/bereitschaft.py` weiter als
  baubereit angezeigt (Werkzeug-Limit: es zaehlt geschlossene Issues).

### Wo das Projekt steht

| Meilenstein | gebaut | | Meilenstein | gebaut |
|---|---|---|---|---|
| M0 Grundgeruest | 15 / 15 | | M5 Inhalte | 37 / 37 |
| M1 Fundament | 50 / 50 | | M6 Render & Export | 37 / 37 |
| M2 Torwaechter | 20 / 20 | | M7 Oberflaeche | **70 / 71** |
| M3 Medien | 21 / 21 | | M8 Marken | 25 / 60 |
| M4 Pixel | 26 / 26 | | | |

4988 Tests gruen (260 Dateien), Branch `main`, Arbeitsbaum sauber.
In M7 zaehlt das Messwerkzeug nur noch **#215** als offen - das ist aber
entfallen (FA-22/Motiv-Weg laeuft ueber #258), nur `bereitschaft.py` kann
geschlossene Issues nicht ablesen. M7 ist damit inhaltlich VOLLSTAENDIG.

### Offene Punkte fuer die naechste Session (in dieser Reihenfolge)

1. **M8-Kette:** 35 offen; `bereitschaft.py` meldet 0 baubereit - Zirkel #277
   (`schreibe-marken`, braucht `eingebauteMarke`) / #280 (`anfangsbestand`,
   braucht den Typ `MarkenEintrag`). VON HAND loesen: vermutlich #280 zuerst;
   #277 importiert den Typ (oder der Typ wandert in #276).
2. **Offene Meldungen aus #319:** a) Muss `setzeMarke` `stelleMarkeBereit`
   (#312) rufen? b) Zaehlt eine unbekannte `aktion.markeId` als kaputte Stelle
   (#131)?
3. **Werkzeug-Limits:** `bereitschaft.py` zaehlt geschlossene Issues mit
   (#215 bleibt sichtbar); Ursache: `gh issue list --state all`.
4. **Beim User:** [User-Entscheidung 09.10.2026] Der TV-Test (FAT32/exFAT-Befund in
   #184/#186/#188) ist ENTFALLEN - kein offener Punkt mehr (Nachträge sind an allen drei Issues
   angehängt). Das macOS-Artefakt (#7) ist am 09.10. gebaut UND gemessen worden (mac-Zielformat
   `dir`, `.app` am echten Mac gestartet, Binaries aus `app.asar.unpacked` belegt, Merge
   `b1f1534`) - **#7 ist geschlossen.** Offen bleibt: optische Abnahme der Marken-Speicher-Anzeige
   (#327-Nachtrag).
5. **Aufraeumen (optional):** Die gemergten Branches `bau/m7-262` und
   `abbau/naht-inhalte-vorlauf` koennen geloescht werden.

### Regeln, die HEUTE gegolten haben

- **Gegenproben mit Beleg:** #218 (`Math.round` in der Quelle) und #219
  (`hintergrund` an Video) haben gebissen; Ruecknahme mit Pruefsumme
  (`b1ddb55d`, `a080d1d7`). #242: die wortliche Grep-Probe `&& sichtbar` griff
  ZUERST nicht (die Mutante `stand.laeuft && props.sichtbar` enthaelt den
  Wortlaut nicht); Probe verschraerft (Muster ueber JEDE Schreibweise), danach
  gebissen (`0ed2ad21`). Lektion: Eine wortgetreue Grep-Probe NUR nach dem
  geplanten Fehlverhalten-denkbarsten Ausdruck testen.
- **Signaturen aus der definierenden Quelle:** Die MELDE-KLAUSEN von
  #218/#219/#242 haben gezuendet: Der Branch-Stand `42badd4` wich mehrfach ab,
  und das Issue-Body-Zitat zu `Listenelement` (mit `bild`) war seit TK v3.16
  ueberholt. Die gebauten Signaturen gewonnen, die definierte Quelle entscheidet
  immer. Nachtraege ANGEHAENGT (nie einen Body ersetzt).
- **NEUE GEFAHR FUER AGENTS (jetzt als Regel):** Lange Datei-Writes (ueber
  ca. 150 Zeilen) verwursten wiederholt Kommentarfasern (falsche/fremdsprachige
  Zeichen, verbastelte Woerter). Pruefung nach JEDEM Write: ein Sprach-Scan
  (Codepoints > U+2100 pruefen) plus `npm run typecheck`. Wer lang schreibt:
  in HAELFTEN schreiben (write-Kopf + Anhaenge ueber `cat >>`-Heredoc mit
  'EOF'), pro Schritt pruefen.
- **Arbeitsweise:** Ein Thema pro Schritt. Branch ZUERST. Verfahrensfehler im
  Issue-Comment transparent benennen (#242/#260/#262, alle drei benannt).
- **GEFAHR DURCH SELBSTVERSTAERKUNG (06.10., teuer):** Ein Agent, der in lange,
  ausschweifende Ausgaben geraet, kann in einen Zustand kippen, in dem er
  zusammenhanglose, teils fremdsprachige Zeichenketten und fehlerhafte
  Werkzeugaufrufe erzeugt (im heutigen Fall mitten in der Doku-Pflege). Regel:
  Wird die eigene Ausgabe unleserlich, SOFORT STOPPEN, nichts Destruktives
  ausfuehren (kein `rm`, kein `reset`) und den echten Zustand mit klaren,
  einzelnen Befehlen pruefen (`git status`, `git log -3`, `ls`). Kein Befehl auf
  Verdacht - jede Annahme zuerst belegen. Der Arbeitsbaum war trotz des
  Aussetzers sauber; das ist der Zustand, der zaehlt, nicht die Ausgabe.

---

## STAND HEUTE (05.10.2026, spaet) – gilt vor ALLEN älteren Angaben weiter unten

### Session 05.10. (späte Fortsetzung) in Kürze

- **SCHWERER BEFUND, BEHOBEN:** Vierzehn geschlossene M8/M4-Issues behaupteten „gemerged nach
  main", die Merges lagen NUR auf Branches (`bau/m4-*`, `bau/m8-*`). Die komplette Kette ist jetzt
  nach `main` gemergt (`f6992de`) – `m4-20` trug dabei bereits die ganze `m8-06`-Linie. Konflikt-
  Auflösungen BELEGT: `datenort.ts`/`einzel-instanz.ts` -> MAIN (spaetere Korrektur, Vorbefund
  gruen); `schriften.ts`/`zeichne-segment.ts`/`logo-laden.ts` -> M8-KETTE (Obermenge, 4. Parameter
  `rahmenMarke` nach #294/TK v3.18); `zone-*` -> MAIN (Branch == Basis). Die fuenf Aufrufer von
  `zeichneSegment` zeichnen jetzt mit `marke, marke`; `leererEntwurf` ist dreistellig
  (`vorlagenId, markeId, akzentfarbe`, Form laut #319). **Nahtreste-Commit `c58d749`:** Diese Aufrufer-Aenderungen lagen teils UNCOMMITTET; sie sind
  jetzt drin. Wer weiterbaut, findet sie auf `main`.
- **GEBAUT HEUTE:** #253 (Band-Bearbeitung, `834633d`), #259 (composer-montage, `434c29a`),
  #217 (preview-player Segment, `da36f86`), #243 (Undo-Aufzeichnung, `c541092`), #319
  (Aktion.markeId, `bdea7b4`), #303 (Marken-Editor Vorschau, `f3eee4e`), #216 (preview-player
  Video, `c7a900b`). **#215 ENTFALLEN** (geschlossen; `medienUrl` lebt über #258 – Nachtrag im
  Issue). **#231** war bereits gebaut (`ef191f9`), das Messwerkzeug zählte sie UNKLAR –
  `bereitschaft.py` ist nachgezogen (`1918f2d`).
- **USER-ENTSCHEIDUNG #319:** Der Main-Vorbelegungs-Konflikt ging an den #319-Kontrakt:
  `erstelleAktion` lehnt fehlendes/leeres `markeId` ab; die Vorbelegung mit
  `Project.standardMarkeId` lebt im RENDERER (`leererEntwurf`). Die M8-Kette hatte im Main
  `?? projekt.standardMarkeId` gebaut - ENTFALLEN, Nachtrag im Issue #319.
- **USER-ENTSCHEIDUNG #132:** Die geführte Reparatur endet NICHT von selbst; „N von N behoben"
  + Schliessen-Knopf (Nachtrag im Issue #132 und lokal `docs/agents/m5/M5-13.md`, `d1606ad`).
- **VORBEFUND (23.08.) GELÖST:** Die 3 Testfehler existieren nicht mehr (gemessen, 4632 grün
  auf dem Stand davor). Niemandes Arbeit war berührt.

### Wo das Projekt steht

| Meilenstein | gebaut | | Meilenstein | gebaut |
|---|---|---|---|---|
| M0 Grundgerüst | 15 / 15 | | M5 Inhalte | 37 / 37 |
| M1 Fundament | 50 / 50 | | M6 Render & Export | 37 / 37 |
| M2 Torwächter | 20 / 20 | | M7 Oberfläche | **65 / 71** |
| M3 Medien | 21 / 21 | | M8 Marken | **25 / 60** |
| M4 Pixel | 26 / 26 | | | |

**4848 Tests gruen** (234→244 Dateien), Branch `main`, Arbeitsbaum sauber. Die Session hat von 219 auf **226** gebaute Issues gebracht (plus Merge der Kette).

### Offene Punkte für die nächste Session (in dieser Reihenfolge prüfen)

1. **M7-Rest:** #218/#219 (Split-/Einblendungs-Simulation – beide nutzen `Video` mit `rahmen`
   und `hintergrund`), #242 (Vorschau zusammensetzen), #244 (inhalte-zugaenge: hier MUSS
   `umhuelleFuerBearbeitung`/`ohneAufzeichnung` gerufen werden – der Aufrufer von #243!), #260/#261
   (Bootstrap-Verdrahtung), #262.
2. **M8-Kette:** 35 offen; `bereitschaft.py` zeigt **0 baubereit**, weil `#277` (schreibe-marken)
   und `#280` (anfangsbestand) in einem Zirkel stehen (#277 braucht `eingebauteMarke`, #280 braucht
   den Typ `MarkenEintrag` aus #277). **Werkzeug-Limit oder echter Zirkel – von Hand klären**;
   vermutlich baut man #280 zuerst und #277 importiert den Typ (oder der Typ wandert in #276).
3. **Meldungen aus #319 (offen):** a) Muss `setzeMarke` `stelleMarkeBereit` (#312) rufen?
   b) Zählt eine unbekannte `aktion.markeId` als kaputte Stelle (#131)?
4. **Werkzeug-Limits (bekannt):** `bereitschaft.py` zählt geschlossene Issues mit (#215 bleibt
   sichtbar); `gh issue list --state all` heißt die Ursache.
5. **Beim User (unverändert):** TV-Test (FAT32/exFAT-Befund steht in #184/#186/#188), macOS-
   Artefakt (#7).

### Regeln, die HEUTE wieder gegolten haben (wörtlich geblieben)

- Gegenproben mit Beleg: der Bulk-Fixture-Lauf hat in `marke.spec.ts` eine absichtlich
  **falsche** Fixture „repariert" – mit Beleg zurückgenommen. Eine Probe ohne Beleg ist keine.
- Signaturen aus der definierenden Quelle: die MELDE-KLAUSEN von #217/#303 haben gezündet
  (vier-Argument-`zeichneSegment`); gemeldet im Issue-Nachtrag, nie eigenmächtig angepasst.

---

## STAND HEUTE (23.08.2026) – gilt vor ALLEN älteren Angaben weiter unten

Dieses Dokument ist gewachsen. Wo eine ältere Zeile diesem Abschnitt widerspricht, **gilt dieser
Abschnitt**. Die Historie bleibt stehen, weil die Begründungen darin wertvoll sind – sie ist
Vergangenheit, nicht Anweisung.

### Session 23.08.2026 in Kürze (vor der Tabelle das Wichtigste)

- **M6 ist KOMPLETT: 37/37.** #184/#186/#188 geschlossen. Die macOS-FAT32-Erkennung ist GEMESSEN
  (per hdiutil-Images: `statfs().type` unterscheidet FAT32/exFAT nicht; `diskutil info -plist` am
  per `st_dev` aufgelösten Mountpoint liefert Klartext in ~90 ms) und in `ziel-pruefung.ts`
  eingebaut. REST: Gegenprobe an einem ECHTEN Stick beim nächsten Anlass.
- **M8 ist vollständig GEKLÄRT** – alle 21 UNKLAREN haben entschiedene Nachträge in den Issues
  (u. a.: vorlagen-editor zeichnet gegen eine wählbare Marke mit Default „eingebaute Marke";
  Alt-RollenNamen in `akzentfarbe` setzt #281 auf `null`; Standardmarken-Wechsel - Neubereitstellung;
  Kontrast-Warnung im Farbwähler gegen beide Textfarben; Beenden-Hinweis bleibt informativ).
- **Gemessener Befund mit Folgeentscheidung:** `marken://` taintet das Canvas in JEDER
  Registrierungs-Konfiguration (SecurityError bei toBlob/toDataURL). Entscheidung: importierte
  Marken-Dateien im Zeichenpfad als BYTES laden und als Blob-URL einbinden; `marken://` bleibt
  Speicherort-Vertrag (#290), aber KEIN direktes `<img src>` im Zeichenpfad (#315, Nachtrag II).
- **NEUE ISSUES:** #336 (Beenden-Dialog bei gescheitertem Flush, alle drei Speicher, läuft NACH
  #309), #337 (verbliebene meldeAn-Kopien), #338 (`findeKaputteStellen` um Marken erweitern),
  #339 (`flaecheDunkel`-Hex-Prüfpunkt in #173).
- **#333 gebaut UND committed** (`0a78b43`): trim gilt jetzt überall; `meldeAn` liegt in
  `src/main/ipc-gateway/melde-an.ts`. **#8 gebaut UND committed** (`7aae05d`): Full-Latin-Schriften
  (Glyphennachweis ł ć ş ő ž µ), 10-s-Timeout mit sichtbarem Abbruch. Playfair trägt einen
  U+00B5→uni03BC-Cmap-Patch (OFL-Derivat, RFN-Frage offen im Issue).
- **VORBEFUND, unbehandelt:** 3 Testfehler in `tests/unit/datenort.spec.ts` /
  `einzel-instanz.spec.ts`, per Stash-Gegenprobe auf dem sauberen Baum belegt. Wer als Nächstes
  baut: zuerst klären, ob sie die eigene Arbeit berühren.
- **Bodies von #184/#186/#188 waren ZERSTÖRT** (Nachtrag hatte den Body ERSETZT statt angehängt)
  – aus den lokalen Quelldateien wiederhergestellt, deckungsgleich (`fd7aebd`). Regel-Reminder:
  Nachträge ANHÄNGEN, nie `--body-file` ohne den alten Stand.

### Wo das Projekt steht

| Meilenstein | gebaut | | Meilenstein | gebaut |
|---|---|---|---|---|
| M0 Grundgerüst | 14 / 15 | | M5 Inhalte | 28 / 37 |
| M1 Fundament | **49 / 49** ✓ | | M6 Render & Export | **37 / 37** ✓ |
| M2 Torwächter | **20 / 20** ✓ | | M7 Oberfläche | 24 / 71 |
| M3 Medien | 18 / 21 | | M8 Marken | 8 / 60 |
| M4 Pixel | 20 / 26 | | | |

Rund **219 von 339 Issues** (davon 300 offen, aber M6 komplett und M8 vollständig geklärt),
**4130 Tests** grün (plus Integrationstests; DREI Vorbefund-Fehler, s. Session-Kürze oben), Branch
`main`, Arbeitsbaum sauber. In M0 (#8, Ordner) ist die fehlende Nummer faktisch fertig – das
Messwerkzeug kann sie nur nicht ablesen. In M3 zählen #333 (gebaut, Commit `0a78b43`) und #337
(neu) zu den offenen Nummern.

**Die Logik-Kette ist durchgängig verdrahtet:** Projekt-Operationen, Medien, Warteschlange, Render
und Export sind vom Renderer aus erreichbar. Was fehlt, ist überwiegend **Oberfläche** (M7) und die
Marken (M8).

### Wie du herausfindest, was zu tun ist

```
python tools/bereitschaft.py
```

Sagt je Meilenstein: gebaut / baubereit / **UNKLAR**. Der Dateikopf nennt drei Grenzen – lies sie.
Die wichtigste: Das Werkzeug misst, ob eine Funktion **gebaut** ist, **nicht ob sie gerufen wird**.
„Fertige Funktion ohne Aufrufer" ist die häufigste Lücke des Projekts und in **jedem** Meilenstein
seit M1 aufgetreten. Für „hat das einen Aufrufer?" gibt es keinen Ersatz für einen `grep`.

### ✓ ZWEI ANFORDERUNGSÄNDERUNGEN sind entschieden UND dokumentiert

Beide sind am 15.08.2026 vom User entschieden und am 16.08.2026 in **AD v1.6 / TK v3.18** eingearbeitet
worden; die Rückwärts-Zitat-Korrektur über die angelegten Issues ist ebenfalls erledigt (Commits vom
16.08.2026). Es läuft nur noch der **Code-Umbau**.

1. **Projektweite Standarddauer, je Aktion überschreibbar.** Kette:
   `element.dauer ← aktion.standardDauer ?? projekt.standardSegmentdauer ?? 10`.
   `Project` bekommt ein Feld (9.11.3) - in AD/TK ist entschieden: **keine** Migration, weil es noch
   kein einziges Projekt gibt (`Project.standardSegmentdauer` gehört von Anfang an zu `schemaVersion`
   1, TK v3.17). Beim Ändern fragt die Oberfläche, ob der neue Standard auch für bestehende Aktionen
   gilt; betroffen sind alle mit `standardDauer: null`, einzeln **abwählbar**. **Code-Stand (geprüft
   16.08.): noch nicht gebaut** – `Project.standardSegmentdauer` und `setzeStandardSegmentdauer`
   fehlen in `src/shared/contracts/project.ts` und im `project-store`.
2. **Die Elementart `bild` wird gestrichen.** `Listenelement.art` behält nur `'video' | 'segment'`.
   **Code-Stand (geprüft 16.08.): bereits umgesetzt** – `src/shared/contracts/project.ts` führt
   `art: 'video' | 'segment'` (Kommentar verweist auf TK v3.16 / 9.11.3), ebenso `RenderItem.art`
   in `render-request.ts`; der Test-Refactor von `'bild'` auf `'segment'` ist committet. **Nicht
   betroffen:** `Asset.typ: 'video' | 'bild'` bleibt – Bilder werden weiter importiert und über
   `Aktion.bildRef` benutzt.

**Die projektweite Standarddauer ist gebaut (#334, TK v3.19/v3.20)**; `StartBefund` ist mit TK v3.20
ebenso Vertrag. Ob ein Folge-Issue baubar ist, sagt `python tools/bereitschaft.py`.

### Werkzeuge, die du benutzen sollst statt sie neu zu bauen

| Werkzeug | wofür |
|---|---|
| `tools/bereitschaft.py` | was ist baubereit |
| `tools/zitate-pruefen.py` | Rückwärts-Regel: Zitat-Abgleich über **alle** Issues nach einer Vertragsänderung |
| `tools/zitate-korrigieren.py` | setzt veraltete Zitate – in Issue **und** lokaler Quelldatei; jede Ersetzung muss genau einmal passen, sonst Abbruch |
| `tools/geruest.py` | erzeugt Rümpfe aus den Signaturblöcken; fasst bearbeitete Dateien **nie** an |
| `tools/bild-fundstellen.py` | einmalige Erhebung für die `bild`-Streichung (unterscheidet `Listenelement.art` von `Asset.typ`) |
| `tools/generate-docx.js` | Word aus Markdown, Markenlayout |

### Arbeitsweise beim Bauen – teuer gelernt

- **Gegenproben sind Pflicht, und ihre RÜCKNAHME muss belegt sein.** Am 14.08. sind zwei Agents
  mitten in einer Gegenprobe gestorben und haben eine absichtliche Verfälschung liegengelassen.
  Seither: nach jeder Mutation Prüfsumme oder `diff` gegen eine Sicherung.
- **Belege, dass die Mutation überhaupt gegriffen hat.** Achtmal in einer Sitzung meldete eine
  Gegenprobe „alles grün", weil sie einen Kommentar statt Code traf, ein Zeilenende-Muster nicht
  zündete oder das Prüfskript seinen eigenen Absturz als Erfolg las. *Eine Probe ohne Beleg, dass
  sie die Datei verändert hat, ist keine Probe.*
- **Ein Testwert, der zufällig glatt aufgeht, belegt nichts.** `dauer: 0.7` ist exakt 21 Frames und
  übersteht jede 30-fps-Rundung; von 539 zulässigen Bandhöhen gehen nur **59** glatt auf, und die
  eingebaute 162 ist eine davon. Wähle krumme Werte.
- **Grep-Proben unterscheiden nicht zwischen Code und Prosa.** Mehrfach verbot eine DoD eine
  Zeichenkette, die der verbindliche Signaturblock desselben Issues vorschreibt. Wer filtert:
  `\r\n` **zuerst** normalisieren (`core.autocrlf=true`) und mit einer Gegenprobe belegen, dass der
  Filter wirklich etwas entfernt.
- **Tests, die echte Prozesse starten, gehören nach `tests/integration/`** (Zeitgrenze dort global
  120 s). In `tests/unit/` reißen sie unter Last die 5-Sekunden-Grenze und lassen fremde Arbeit
  kaputt aussehen.
- **Widerspricht ein Issue dem gebauten Code, gewinnt der gebaute Code** – und der Widerspruch wird
  gemeldet, nicht stillschweigend aufgelöst.

### Offene Entscheidungen und Befunde (Stand 16.08.2026)

- **Datenort beim Start nicht beschreibbar** (#51/#3): entschieden ist ein Dialog im Main mit
  „Erneut versuchen"/„Beenden" und generischem Text. Ursachenbezogene Texte erst, wenn die
  errno-Zuordnung an echten Sticks **gemessen** ist. `erzwingeEinzelInstanz` liefert `StartBefund`
  mit drei Zuständen – seit TK v3.20 (23.08.2026) Vertrag; #3 trägt einen Nachtrag, der
  `index.ts`-Kommentar ist berichtigt. Die Abweichung ist damit GESCHLOSSEN.
- **`marken_datei_fehlt`** (vierter Reparatur-Weg, TK 2340) ist von `KaputteStelle` nicht abbildbar –
  eigenes Issue, gebaut mit M8.
- **`meldeAn` und `istGefuellterText` doppeln Namen** – die Folge-Issues **#332** (Nutzlast-Prüfer
  an einen Ort) und **#333** (Doppelnamen auflösen) sind angelegt.
- **Beim User:** der TV-Test (hinterlegt in #184, #186, #188, #230, #231; Nachträge vom 23.08.).
  **Recherchiert und belegt (23.08.):** Der UE85AU7170 unterstützt am USB FAT, exFAT und NTFS
  (Samsung offiziell; baugleiche TU7000-Klasse) – die 4-GiB-Grenze ist **keine** Produkteigenschaft,
  sie gilt nur für FAT32-Sticks. #184 bleibt unverändert richtig gebaut; Empfehlung ans Personal:
  Stick als exFAT formatieren. **Weiter offen (nur physisch testbar):** Läuft die USB-Wiedergabe
  nach einem Stromausfall von selbst wieder an? Ist „Repeat One" zuverlässig? Firmware-Version
  steht nur am TV (Einstellungen - Support - „Über dieses TV").

### Behobene Befunde (16.08.2026, Commit `7f6e776`; Beleg unten)

- **`RenderProgress` doppelt definiert** – `render-result.ts` trägt jetzt nur noch den Re-Export,
  `render-progress.ts` (#157) ist die einzige Wahrheit.
- **#180 „Tonspur vorhanden"** – `ausgabe-platzieren.ts` prüft die Tonspur selbst (Schritt 2b),
  unabhängig von den Layout-Merkmalen (#170).
- **H = 1078** (`videoBreite = 0`) – zulässig ist jetzt **H ≤ 1076**; die Schranke fragt den
  geteilten Rechenkern `berechneBandGeometrie` (#239).

Commit `7f6e776` nennt die Gegenproben; alle drei haben gebissen und wurden mit Prüfsumme
zurückgenommen. Damit sind die im „STAND vom 10.08." offenen Punkte **RenderProgress / Tonspur /
Bandhöhe** erledigt.

---

## STAND vom 10.08.2026 (überholt durch den Abschnitt darüber, bleibt als Beleg)
Dieses Dokument ist gewachsen und enthält viel Historie. Wo eine ältere Zeile diesem Abschnitt
widerspricht, gilt dieser Abschnitt. Die Historie bleibt stehen, weil die Begründungen darin wertvoll
sind – aber sie ist Vergangenheit, nicht Anweisung.

- **Es wird gebaut.** M0 (Grundgerüst) ist fertig: Typecheck, Lint, Tests und Build sind grün, und
  eine portable Windows-EXE startet. Offen an M0 sind nur zwei Punkte, die nur der User erledigen
  kann: das macOS-Artefakt und `npm run dist` aus einem normalen Terminal (beides #7).
- **Ein Branch für alles: `main`.** Die früheren Stränge `bau/m0-01-grundgeruest` und
  `planung/ad-v1.2-tk-v2.3-issues` sind am 10.08.2026 konfliktfrei nach `main` gemergt. Neue Arbeit
  bekommt einen eigenen Branch von `main`, je Issue einer. Die Anweisung „NICHT nach main mergen"
  weiter unten ist damit überholt.
- **Dokumente: Technisches Konzept v3.13, Anforderungsdokument v1.4.** Ältere Versionsangaben in
  diesem Dokument (v2.x, v3.3, v1.2) sind Historie. [Stand 16.08.2026: heute gelten v3.18 / v1.6,
  s. „STAND HEUTE".]
- **Meilensteine M0 bis M8.** M8 (Marken) ist am 10.08.2026 mit 56 Issues dazugekommen – mehrere
  Marken, app-weit gespeichert, mit Editor. AD/TK sind dafür bereits nachgezogen.
- **Das Funktionsgerüst steht.** 231 Dateien mit 463 werfenden Rümpfen, erzeugt aus den
  „Signatur (verbindlich)"-Blöcken der Issues durch `tools/geruest.py`. Ein Agent füllt **nur den
  Rumpf**; Signaturen ändert man im Issue, nicht in der Datei. Der Generator vergleicht beim
  erneuten Lauf Byte für Byte und fasst eine bearbeitete Datei **nie** an.
- **Der Bootstrap wird über eine Kette verdrahtet:** #268 - #269 - #270 - #271 - #272 - #273 -
  #274 - #331, je ein Glied als letztes Issue seines Meilensteins. Erst #331 stellt fest, dass
  `src/main/index.ts` lückenlos ist.
- Planungsziel: scharfe Modulgrenzen + Schnittstellen. Ich baue das Grundgerüst selbst und lasse
  die Funktionen von Agents füllen – die brauchen vollen Projektkontext und ihren Platz im Ganzen.
- WARUM der Kontext kritisch ist: Die Agents füllen einzelne, kleine Funktionen (oft nur ~30 Zeilen),
  treffen darin aber Low-Level-Entscheidungen und Trade-offs (Datenformate, Fehlerbehandlung,
  ffmpeg-Parameter, Speicher/Performance, Rundungen, Grenzfälle), die – falsch gewählt – am Ende das
  GANZE Projekt ruinieren können. Ich verstehe nicht alle eingesetzten Technologien in der Tiefe und
  kann solche Fehler nicht zuverlässig erkennen oder gegenprüfen. Deshalb muss die Planung jeden
  Baustein lückenlos in den Gesamtkontext einordnen, Annahmen und Trade-offs explizit machen und die
  Schnittstellen so scharf definieren, dass eine lokale Entscheidung in einer kleinen Funktion nicht
  global Schaden anrichten kann. Lieber eine Vorgabe zu viel als eine zu wenig.
- Liefer-Dokumente immer als Word im Markenlayout UND synchron als Markdown.
  Brand: Primärfarbe #FF4040, Logo nur auf dunklem Balken, Schriften Playfair Display / Arial Black /
  freier Helvetica-Ersatz.

## Projekt in Kürze
- Tool für das Fitnessstudio Fitnessworld24 (Baller Gruppe). Erste Stufe: EIN Studio, EIN Bildschirm.
- Hardware: nur ein Samsung Consumer-TV (UE85AU7170, 85", Tizen) + USB-Stick. Kein Mediaplayer.
- Lösung: Ein Desktop-Tool auf dem Laptop erzeugt je Lauf EINE durchgehende, frei benannte MP4
  (FA-22, mehrere je Projekt möglich); der TV spielt sie vom USB
  als MANUELL gestartete Endlosschleife. Der TV ist nur „dummer" Player (eigene Smart-TV-App
  ungeeignet: kein Autostart beim Booten, Firmware-/Zertifikatsprobleme).

## Die zwei Dokumente (liegen bei)
- Anforderungsdokument v1.6 = das „WAS" (Funktionen, Regeln, Ausgabe-Profil, Akzeptanz).
- Technisches Konzept v3.18 = das „WIE" (Architektur, Datenbestand, DFD, HLD Abschnitt 9).
  Bitte beide unbedingt lesen, bevor du etwas vorschlägst.
- WORKFLOW: Markdown ist Quelle der Wahrheit; beide .docx werden daraus generiert mit
  `node tools/generate-docx.js <in.md> <out.docx> [--dfd tools/assets/dfd.png]`. Nach jeder
  Änderung .md und .docx synchron halten. Agent-Kontext: docs/agents/system-design-context.md
  ist das lebende Kontextdokument und wird laufend mitgepflegt.

## Wichtigste Festlegungen (schon entschieden)
- Ausgabe-Profil: MP4, H.264 High, 1920×1080, 30 fps, ~10–12 Mbit/s, stumm. Dateiname FREI (FA-22).
  Abweichende Seitenverhältnisse - schwarze Balken (Letterbox/Pillarbox, kein Beschnitt).
  Videos sind trimmbar; Standard-Segmentdauer 10 s (einstellbar 10–45 s); harter Schnitt.
- Tech-Stack: Electron + TypeScript + React + Vite; dnd-kit; HTML5-Canvas - PNG für Aktions-Segmente;
  gebündeltes ffmpeg (ffmpeg-static + fluent-ffmpeg); Datenhaltung JSON je Projekt (lowdb),
  SQLite optional; Verpackung electron-builder Portable (Win 10/11 + macOS 13+, kein Installer, ohne Admin).
- Render-Pipeline (bereits prototypisch mit echtem ffmpeg getestet): jedes Element auf identisches
  Profil normalisieren (scale + pad), dann per ffmpeg concat-Demuxer mit -c copy verlustfrei und
  schnell zur fertigen Ausgabedatei zusammenfügen.
- Datenmodell-Entscheidungen: (1) Medien ins Projekt KOPIEREN; (2) Aktionen REFERENZIERBAR
  (Bibliothek je Projekt, Mehrfachnutzung erlaubt); (3) Medien PRO PROJEKT; (4) Segment-PNGs IMMER
  NEU rendern (flüchtig); (5) Vorlagen DATENGETRIEBEN ab v1 (zwei eingebaute: „Vollbild", „Split").

## Architektur & Datenfluss (Stand)
- Electron: Renderer (React-UI) + Main (Node), verbunden über typisierten IPC-Vertrag.
  Nur der Main berührt ffmpeg und Dateisystem.
- DFD-Prozesse: P1 Medienverwaltung, P2 Inhaltsverwaltung, P3 Zusammenstellung,
  P4 Finaler Render + Export, P5 Vorschau.
- Speicher: D1 Projekt-Store, D2 Medienordner, D3 App-Konfig, T1 flüchtiger Render-Arbeitsbereich.
- ZWEI Render-Arten mit gleichem Eingang (Liste + Medien): P5 Vorschau (UI-Simulation, OHNE ffmpeg,
  - Bildschirm) und P4 finaler Render (ffmpeg - benannte Ausgabe-MP4 - USB).
- Vorschau = UI-Simulation: Aktions-Segmente nutzen exakt dasselbe Canvas-Bild wie der finale Render
  (pixelgleich), Videos laufen nativ; finale Kontrolle bleibt die gerenderte Ausgabedatei.

## HLD-Modulschnitt (von mir bestätigt)
- Renderer: ipc-client, app-shell, composer [P3], action-editor [P2],
  template-canvas (geteilt: Segment - PNG), preview-player [P5].
- Main: ipc-gateway, media-service [P1], project-store [D1], config-store [D3],
  render-service [P4], export-service, ffmpeg-adapter (enthält den getesteten buildReel-Kern).
- Geteilt: contracts/types (Project, Action, Asset, ListItem, Template, Brand, RenderRequest …).
  Renderer ↔ Main reden AUSSCHLIESSLICH über den typisierten IPC-Vertrag.
- STATUS HLD: FERTIG sind render-service [P4] (TK 9.2), auftrags-manager [P6] (TK 9.3, NEU – Subsystem),
  media-service [P1] (TK 9.4, NEU). Übrige Modul-Verträge folgen.
- Auftragsverwaltung (auftrags-manager, P6, NEU, zentral): Verwaltungs-Subsystem, nicht nur Queue.
  Torwächter (serielle Freigabe, einziger Sperr-Mechanismus, KEIN zweites Lock) für
  import/loeschen/render/export; Zustandsführung; Wiederholung; drei Speicher mit drei Persistenzen:
  Q1 aktive Warteschlange (flüchtig/RAM), Q2 Wiederholung (persistent bis erledigt, projects/<id>/queue-retry.json),
  Q3 Protokoll (dauerhaft, protokoll.json; enthält Ausgabe-Historie, zuvor D3). Im DFD (TK 7) als P6 + Q1/Q2/Q3.
  Anforderungsdokument: FA-16/17/18, NFA-09, Abschnitt 4.3.

## Bereits geklärt (war der offene Punkt)
- IPC-Granularität ENTSCHIEDEN: Variante A – der Renderer rendert die Segment-PNGs
  (template-canvas, pixelgleich zur Vorschau) und übergibt sie als Binärpuffer; nur der Main
  schreibt/liest das Dateisystem und ruft ffmpeg. Nur Segment-PNGs gehen über IPC; Importe liest
  der Main per relativem Pfad aus D2. Details im TK Abschnitt 9.1/9.2.

## Nächste Schritte (in dieser Reihenfolge)
1. ERLEDIGT: IPC-Granularität entschieden (Variante A).
2. HLD finalisieren: je Modul ein scharfer Schnittstellen-Vertrag (Eingang - Ausgang, fachlich, ohne
   Implementierung), dann ins TK Abschnitt 9 – Word + Markdown.
   - ERLEDIGT: render-service [P4] (9.2), auftrags-queue (9.3), media-service [P1] (9.4).
   - ERLEDIGT: FA-13 (eigene Vorlagen, Kann), FA-14 (Trim, Soll), FA-15 (Auto-Speichern & Sitzung, Soll)
     im Anforderungsdokument v0.5; FA-10 zu „Projektverwaltung" geschärft; neue Rubrik 4.4 (einheitlicher
     Dauer-/Trim-Regler). FA-Nummern lückenlos 01–18.
   - ERLEDIGT: frame-genauer Trim als Invariante in render-service (9.2.6), gesamtdauer framegerundet.
   - ERLEDIGT: project-store/config-store [D1/D3] (9.5) – D1-Lock, Auto-Save (entprellt 3–5 s + Sofort-Flush,
     atomar, .bak-Backup), Lösch-Asymmetrie (Medium blockiert / Aktion kaskadiert medienschonend), schemaVersion.
   - ERLEDIGT: export-service (9.6) – Auftrag art:export, FAT32-Wächter vorab, atomar (.part+Rename-Ersetzen,
     vorhandene Zieldatei geschützt), fsync vor Erfolg, Zielname = QUELLNAME (der Zwang auf exakt
     loop.mp4 ist mit FA-22 ENTFALLEN), letztes Ziel in config-store.
   - ERLEDIGT: composer [P3] (9.7) – Renderer-UI Liste/Reorder/Dauer/Trim, optimistisch mit Abgleich
     (synchron abgelehnt→Rollback / Auto-Save-Fehler→kein Rollback, warnen+retry), Thumbnails renderer-seitig.
     + 9.5.4-Ergänzung (Instant-Op vs. Speichern). + 9.7.5 GEFÜHRTER Reparatur-Modus für kaputte Elemente
     (zurückleiten, eins nach dem anderen, X von N, Render erst frei wenn alle behoben).
   - ERLEDIGT: FA-19 (geführte Reparatur, Soll) im Anforderungsdokument v0.6, Akzeptanzkriterium 7.
   - ERLEDIGT: action-editor [P2] (9.8) – Aktionen anlegen/bearbeiten, Live-Vorschau via template-canvas
     (einzige Pixelquelle), Bild=Referenz, Akzentfarbe aus Markenpalette (fest v1), standardDauer nur Default,
     Kaputt-Handling 9.8.5 (fehlt-Bild - Fix auf Aktions-Ebene behebt alle referenzierenden Elemente).
   - ERLEDIGT: preview-player [P5] (9.9) – UI-Simulation ohne ffmpeg, Medienzugriff über media:// (9.5.7).
   - ERLEDIGT: project-store ist Pfad-Autorität + trägt media://-Protokoll (9.5.7); Detail durchgängig in 2,
     8, 9.1, 9.2.5, 9.4.1, 9.5, Modul-Liste ergänzt (Renderer-Medienzugriff nur lesend via media://).
   - ERLEDIGT: template-canvas (9.10) – EINZIGE Pixelquelle: eine Zeichenroutine - Canvas 1920×1080,
     Anzeige (CSS-skaliert) und PNG-Export aus DEMSELBEN Aufruf (kein zweiter Zeichenpfad); Determinismus
     (devicePixelRatio ignorieren, Schriften+Bild vor dem Zeichnen geladen, kein Zufall/Cache); Marken-
     Schriften GEBÜNDELT (Playfair Display fehlt auf Win/macOS); Sicherheitsabstand 5 % (96/54 px);
     Text-Überlauf-Kaskade umbrechen→verkleinern→„…"; fehlendes Motiv = Platzhalter (nie in den Render).
   - ERLEDIGT: Datenmodell Vorlage (9.11.1) – Zone{rolle fest/frei, bindung, rahmen ABSOLUTE Pixel im
     1920×1080-Raster, wennLeer "leer"/"ausblenden", text/bild/deko}; Zeichenreihenfolge = Array-Reihenfolge;
     KEIN automatisches Umlayouten; feste Zonen Teil der Vorlage (Editor darf sie nicht ändern);
     eigene Vorlagen dürfen freie + dekorative Zonen ergänzen; Farben/Schriften nur als ROLLEN-Verweise.
   - ERLEDIGT: eingebaute Vorlagen konkret (9.11.1) – Logo 420×120 oben links, Zone `hintergrund` zuerst
     (Aktion ohne Bild rendert nicht schwarz), „Vollbild" mit `scrim` für Textlesbarkeit, „Split" mit
     `contain` (kein Produkt-Beschnitt). Vorlagen sind APP-WEIT (vorlagen.json); Löschen nur wenn KEIN
     Projekt sie nutzt - Referenzprüfung über ALLE Projekte; eingebaute unlöschbar + eingefroren.
   - ERLEDIGT: Marke (9.11.2, Rollen + gebündelte OFL-Schriften Playfair/Archivo Black/Arimo);
     RenderProfile geschärft (9.2.4: yuv420p, High/L4.0, BT.709, SAR 1:1, gedeckeltes VBR, geschlossene GOP +
     Keyframe je Segment, stille AAC-Spur - R-06 entschieden, +faststart); Einzel-Instanz (9.5.4, an den
     DATENORT gebunden wegen portabler EXE); Project/Listenelement + ID-Schema UUID + Konstanten (9.11.3/9.11.4,
     Reihenfolge = Array-Reihenfolge, KEIN position-Feld); Undo/Redo (9.13).
   - HLD VOLLSTÄNDIG: Anforderungsdokument v1.1, TK v2.2. FA-Nummern lückenlos 01–21, R-06 entschieden.
     Alle Lücken des Prüfbefunds vom 03.07. geschlossen.
     ERLEDIGT aus dem Befund: A1 Versions-Widerspruch, A2 veraltete Vollständigkeits-Aussagen, P1–P5→P1–P6.
   - ERLEDIGT: Ambiguitäts-Audit (7 Punkte), u. a. IPC-Konventionen 9.1.1 (Ergebnis-Hülle), Q4 Warteschlangen-
     Journal, app-shell 9.14 (Modus-Reiter + Warteschlangen-Leiste).
   - ERLEDIGT: VOLLPRÜFLAUF 23.07. – 5 Befunde behoben: (A1) AD-Abschnitte standen 4.3→4.5→4.6→4.4, jetzt
     sortiert; (A2) Widerspruch 9.1.1 vs. Operations-Tabellen — die Ergebnis-Hülle steht jetzt in JEDER
     Signatur ausgeschrieben (`Ergebnis<T>` / `Ergebnis<void>`), Aufträge dagegen ausdrücklich OHNE Hülle
     (ihr Ergebnis reist über den Auftrags-Zustand); (A3) 9.2 Richtungsangabe (Render läuft über die Queue,
     kein Direktaufruf); (A4) P1–P6→P1–P7; (A5) Schluss-Notiz aktualisiert.
     ZUSÄTZLICH: Generator-Fehler gefunden — `inlineRuns` konnte Fett+Code (`**`x`**`) nicht verschachteln,
     87 Absätze zeigten im Word sichtbare Backticks/Sterne. Behoben (rekursives Parsen), 0 inhaltliche
     Abweichungen im Absatz-Diff. Agent-Kontext: neuer Abschnitt 4b mit dem IPC-Vertrag (fehlte KOMPLETT).
3. LÄUFT: Überführung in Tasks. Repo NiklasRist/Digital-Signage-Tool.
   REIHENFOLGE (vom User klargestellt 03.08.): Erst das GRUNDGERÜST bauen (M0, #1-#12), dann werden
   die offenen Punkte in M1 überhaupt beantwortbar. Die 21 braucht-entscheidung-Issues sind KEINE
   Liste, die vorher abzuarbeiten ist. Und: Ein STOPP-Punkt ist entweder eine ENTSCHEIDUNG (Produkt-
   wahl, die der User treffen kann) oder ein EXPERIMENT (empirische Frage zum Plattformverhalten -
   reicht requestSingleInstanceLock für zwei EXE-Kopien? zeigt PORTABLE_EXECUTABLE_DIR auf den Stick?).
   Experimente kann niemand entscheiden, sie müssen ausprobiert werden - und das Grundgerüst ist die
   Vorrichtung dafür. Deshalb kommt es zuerst. Nicht zu Entscheidungen drängen, die noch nicht dran sind.
   [ÜBERHOLT 10.08.2026: Alles liegt auf main, s. „STAND HEUTE" oben.] Arbeit lief auf dem Branch
   planung/ad-v1.2-tk-v2.3-issues, damals NICHT nach main gemergt.
   - M0 (Grundgerüst) = Issues #1-#12, angelegt, GEPRÜFT und korrigiert (23.07.).
     Prüflauf fand 9 Befunde, 4 kritisch: #1 DoD wegen TS18003 nicht erfüllbar (leere Ordner);
     #5 fehlendes PORTABLE_EXECUTABLE_DIR (NSIS-Portable entpackt nach Temp -> Datenverlust);
     #7 extraResources unvereinbar mit Renderer-Bundling aus #8; #11 Vitest-Config, die die
     Integrationstests nie ausgeführt hätte. #4 und #9 waren ohne Befund.
   - MUSTER dahinter: 4x stand Offenes im Block "Signatur (verbindlich)". Deshalb neu im
     Übergabe-Prompt Abschnitt 7: Regel C (verbindlich = entschieden; Offenes NUR im STOPP-Block,
     nie beides), Regel D (Zitate wörtlich oder gar nicht - ein erfundenes TK-Zitat war drin),
     Regel E (jeder DoD-Punkt muss im erlaubten Dateibereich erfüllbar sein).
   - [HISTORISCH, überholt durch den Eintrag weiter unten] M1 im Draft angefangen (M1-01..M1-29),
     damals noch nicht vollständig und nicht angelegt. Es fehlten:
     entferneElement, ordneNeu, setzeTrim, setzeDauer (TK 9.5.2), Auto-Speichern (9.5.4),
     Einzel-Instanz (9.5.4), Pfad-Autorität + media://-Auflösung (9.5.7).
     ACHTUNG: die 29 entstanden VOR den Regeln C/D/E - vor dem Anlegen gegenprüfen.
   - M1 (M1-01..M1-40) VOLLSTÄNDIG geschrieben, GEPRÜFT, KORRIGIERT und ANGELEGT (02.08.):
     Issues #13-#52, Milestone "M1 - Fundament". M1-XX -> #(XX+12). Alle M1-xx/Sx-Verweise in den
     Bodies sind zu klickbaren #-Nummern umgeschrieben (194 Stellen). Mapping-Tabelle im Draft.
     Labels neu: modul:ipc, modul:config-store, modul:project-store, art:logik, art:fehlerbehandlung.
     HINWEIS zu "braucht-entscheidung": NICHT automatisch vergeben. Regel B verlangt von JEDEM Issue
     einen STOPP-Block, damit träfe "hat offene Punkte" auf 37 von 40 zu = Rauschen. Das Label sitzt
     jetzt auf den 13 M1-Issues, bei denen eine unbeantwortete Frage die SCHNITTSTELLE oder das
     VERHALTEN festlegt (explizite Liste im Anlege-Skript begründet).
     DAS KRITERIUM (jetzt in Prompt Abschnitt 10): Ein STOPP-Block enthält zwei Arten von Einträgen -
     VERBOTE ("hier keine Pfadauflösung einbauen") und ECHTE OFFENE FRAGEN ("Datenort neben EXE oder
     userData?"). Nur die zweite Art rechtfertigt das Label. Nicht automatisierbar, ist Beurteilung.
   - NACHKORREKTUR 02.08. (eigene Fehler): (1) braucht-entscheidung saß auf ALLEN 12 M0-Issues -
     bei #1/#4/#10/#11 enthält der STOPP-Block nur Verbote, Label entfernt (jetzt 21 statt 25).
     (2) #51 (M1-39) hatte Modul "project-store", Datei aber src/main/einzel-instanz.ts, also
     AUSSERHALB des Modulordners -> nach src/main/project-store/einzel-instanz.ts verschoben, in
     Draft und GitHub. (3) Übergabe-Prompt war gegenüber den Dokumenten VERALTET: nannte v1.1/v2.2
     und "EINE fertige loop.mp4" - 11 Stellen abgeglichen auf v1.2/v2.3 + FA-22, neuer Abschnitt 5.11
     mit der kompletten Ausgabe-Regelung (brauchen M2 und M6). Neue Checklistenpunkte: Label-Kriterium
     und "Modul, Titel-Präfix und Dateipfad müssen zusammenpassen". Prüflauf: 6 Prüfer, alle 39 (+1 neues) Issues. Muster: Regel E (Testdatei-Ausnahme
     im DoD fehlte ~21x), Regel C (Signatur entscheidet + STOPP fragt dasselbe, 7x), Regel D
     (erfundene/ungenaue Zitate, 7x). Schwerste Einzelfunde: M1-28 löschte die Aktion gar nicht
     aus Project.aktionen; M1-05 fehlte ausgabeName; M1-07 fehlte historieEintrag; M1-21 fehlte
     letzterAusgabeName; M1-23 fehlte das D1-Lock; M1-17 hatte Ergebnis<unknown> mit ERFUNDENER
     Begründung. NEU: M1-40 [contracts] Typ Marke - war nirgends definiert, obwohl M1-14/M1-17
     ihn brauchen. Befund + Behebung: docs/agents/m1-pruefbefund.md.
   - BELEG, dass die Regeln wirken: M1-37/38/39 entstanden NACH Regel C/D/E - M1-37 und M1-38
     hatten NULL Befunde, M1-39 nur die Testdatei-Zeile.
   - M0 hatte dieselbe Regel-E-Lücke in #4/#6/#8 - auf GitHub korrigiert.
   - [HISTORISCH, überholt: M2-M5 sind angelegt, s. unten] M2-M7 offen. Dry-Run in
     docs/agents/issues-draft.md, Freigabe vor jedem Anlegen.
   - ANFORDERUNGSÄNDERUNG 02.08. (AD v1.2 / TK v2.3): MEHRERE benannte Ausgabedateien je Projekt.
     Ausgabeordner jetzt projects/<id>/output/ statt app-weit (app-weit war ein FEHLER: Render in
     Projekt B hätte die Datei von Projekt A überschrieben - beim Issue-Schreiben gefunden).
     RenderRequest.ausgabeName (ohne Endung), vorbelegt mit Project.letzterAusgabeName -> gleicher
     Name ersetzt, neuer Name legt zusätzlich an. KEIN Zeitstempel im Namen (Datum zeigt die UI).
     Render schreibt atomar über T1 + Rename, damit ein Fehlschlag die alte gute Datei nicht zerstört.
     Name = Nutzereingabe -> validieren. Zwang "Zielname exakt loop.mp4" ENTFALLEN; mehrere Dateien
     dürfen auf den Stick, Personal wählt am TV -> dort "Repeat One" statt "Repeat All" (Risiko R-04).
     Neu: FA-22, AD 4.7, Akzeptanzkriterium 9. Nachgezogen: DFD-Beschriftung, Agent-Kontext 9b2,
     Draft M1-06 (dateiname RAUS aus RenderProfile) und M1-07, GitHub #8.
   - M2 FERTIG (03.08.): Issues #53-#71 angelegt, Milestone "M2 - Torwächter", M2-XX -> #(XX+52).
     19 statt 16 Issues. Geschrieben mit VORAB-BRIEFING (alle vom TK offengelassenen Festlegungen
     ausgeschrieben) -> Regel D zu 100% eingehalten, Regel E lückenlos. Prüflauf: 4 Prüfer (3x je 6
     Issues + 1 QUERSCHNITT über alle), ~45 Befunde, 11 kritisch - ALLE an den NÄHTEN zwischen
     Issues, keiner innerhalb eines Issues. Schwerste: speicher_fehler in keinem Typ deklariert;
     projektId fehlte im ganzen Abschlusspfad; unklar ob Q1 lebende Einträge oder Kopien liefert
     (hätte die serielle Garantie LAUTLOS gebrochen); Abbrecher registrierbar aber nicht aufrufbar;
     NIEMAND meldete die vier Kanäle beim ipc-gateway an (-> neues Issue M2-19); Abbruch löschte
     den Fehlschlag aus Q2 (verletzt FA-17). Durchgehendes Muster: Regel A gilt auch ZWISCHEN
     Modulen - ein Aufruf darf nie nur als Issue-Nummer dastehen, Name und Signatur gehören ins
     Issue (betraf alle 18). Befund: docs/agents/m2-pruefbefund.md.
     LABEL: nach dem Schreiben hätte braucht-entscheidung auf 17 von 18 gepasst = Rauschen. Durch
     15 selbst getroffene Entscheidungen zu lokalen Details jetzt 9 von 19. Merksatz: lokale
     Detailfragen ENTSCHEIDEN, nicht in den STOPP-Block legen.
     WERKZEUG: create-issues.py hat jetzt ein PROFIL je Meilenstein (Präfix der Dateinamen wählt
     aus, unbekannter Präfix bricht ab) + Label-/Milestone-Prüfung im Trockenlauf. NEU
     tools/verweise-nachziehen.py (476 Querverweise M2-xx -> #nn umgeschrieben). Ab M2 liegen die
     Volltexte als EINE DATEI JE ISSUE in docs/agents/m2/, nicht mehr im Draft - eine Quelle.
   - [HISTORISCH] M2-Zuschnitt vom 03.08.: 18 statt 16 Issues. NEU M2-17 (ein gemeinsamer atomarer +
     serialisierter Schreib-Baustein für Q2/Q3/Q4 - TK 9.5.4 verlangt eigene Serialisierung; sonst bauen
     drei Agents drei Mechanismen) und M2-18 ("Auftrag abschließen": terminaler Übergang, Q3-Eintrag,
     Q2-Pflege, nächsten freigeben - hatte im 16er-Schnitt kein Zuhause, dieselbe Lückenklasse wie M1-28).
     KEINE Leseoperation für Q3: die Ausgabe-Liste (FA-22) kommt aus dem Ausgabeordner, nicht aus dem
     Protokoll; Q3 bleibt in v1 bewusst nur schreibend (Historie/Nachweis).
   - TK v2.4 (03.08., beim M2-Zuschnitt gefunden, vom User entschieden): (1) pendingDeletions sind KEINE
     Aufträge - 9.3 sagte "automatisch beim Start neu einreihen", das widerspricht 9.4.6/9.4.7 und wäre
     IMMER mit asset_nicht_gefunden gescheitert (der D1-Eintrag ist beim Löschen zuerst weg). Jetzt:
     Auftragsverwaltung VERWAHRT sie in Q2 und bietet main-intern Lesen/Ergänzen/Streichen; AUSGEFÜHRT
     wird vom Reconcile des media-service. (2) listeAusgaben(projektId) in 9.5.2 ergänzt - Ausgabe-Liste
     (FA-22) und Dateiauswahl beim Export (9.6.1) hatten KEINE Datenquelle; gehört zur Pfad-Autorität.
     Nachgezogen: TK.md + TK.docx (geprüft: ZIP/XML ok, 0 Backticks, Absatz-Diff = nur die Änderungen),
     Agent-Kontext, Übergabe-Prompt, uebergabe-stand. AD unverändert (v1.2).
   - TK v2.5 (03.08., beim M3-Zuschnitt gefunden, vom User entschieden): (1) Auftrag.ergebnis (9.3.1) -
     das Auftrags-Ergebnis ("der fertige Asset", 9.4.3) hatte KEINEN Weg zur Oberfläche; ein Import wäre
     unsichtbar geblieben. (2) fehler.daten (9.1.1) - asset_referenziert musste laut 9.4.9 die betroffenen
     Listenelemente nennen, konnte sie aber nirgends transportieren -> FA-19 (Reparatur-Modus) nicht
     bedienbar. (3) ffprobe wird mitgeliefert (Abschnitt 3, 9.4.5) - ffmpeg-static enthält es NICHT, der
     Import liest damit Maße und Dauer; ohne das wäre JEDER Import beim Kunden gescheitert (im Dev-Modus
     verdeckt ein zufällig installiertes ffprobe den Mangel). (4) versuche steigt beim START (Nachtrag aus
     M2). (5) pendingDeletions speichern dateiname statt Pfad (Nachtrag aus M2). (6) speicher_fehler bei
     löscheMedium ergänzt (9.4.9) - der D1-Schreibfehler war real möglich, aber in der als vollständig
     geführten Tabelle nicht vorgesehen.
     NACHGEZOGEN: 9 Issues an den neuen Vertrag (#6,#12,#16,#22,#53,#60,#61,#68,#70), danach die
     Fehlercode-Naht bis zum Ende verfolgt (HandlerErgebnis<F> generisch; Auftrag.fehler.code und
     ProtokollEintrag.fehler.code als string, weil der GETEILTE Vertrag die fachlichen Unionen der
     Main-Module nicht kennen darf - die Enge sitzt dort, wo der Code ENTSTEHT).
     ZWEI NEUE REGELN: (a) Eine Vertragsänderung erzwingt einen ZITAT-ABGLEICH über ALLE angelegten
     Issues - Regel D gilt rückwärts; 14 von 71 trugen veraltete wörtliche Zitate, 16 Ersetzungen.
     (b) Nach jeder GitHub-Änderung die LOKALEN Quelldateien angleichen, sonst überschreibt der nächste
     Lauf die Korrekturen (Kontrolle: normalisieren + diffen, zuletzt 19/19 deckungsgleich).
   - M3 FERTIG (03.08.): 17 Issues #78-#94 (Milestone "M3 - Medien", M3-XX -> #(XX+77)) plus
     6 Nachzügler #72-#77 im Milestone M1 (M1-41..46; die Faustregel XX+12 gilt für sie NICHT).
     Grösster Befund beim Zuschnitt: In ganz M1 meldet KEINE Operation ihren IPC-Kanal an (nur
     Wrapper #23 und Registry #25 existieren) - M1 wäre fertig gebaut worden und die Oberfläche käme
     an nichts heran. Deshalb die zwei Verdrahtungs-Issues; dazu fehlten dem project-store alle
     Asset-Operationen, obwohl TK 9.4.1 dem media-service eigene D1-Schreibvorgänge verbietet.
     Prüflauf: 4 Prüfer, ~45 Befunde, 5 kritische - erneut ALLE an den Nähten. Schwerste: ein Typ,
     den es nicht gibt (daten?: Fehlerdaten - im TK Platzhalter, im Vertrag unknown, in 8 Texten);
     eine falsch abgeschriebene Signatur; ein Rückgabetyp, der die durchgereichten Fehlercodes nicht
     tragen kann; FA-01 "ein ODER MEHRERE" ohne Zuständigen. Label nach der Korrektur: 7 von 23.
     WERKZEUG: create-issues.py hat jetzt ein M3-Profil und einen [ipc-gateway]-Zweig (die alte
     [ipc]-Bedingung trifft "[ipc-gateway]" NICHT - kein Teilstring); verweise-nachziehen.py nimmt
     jetzt MEHRERE Mappings, weil M3 und die Nachzügler sich gegenseitig referenzieren.
     FALLE, die zwei Stunden gekostet hätte: Ein per Skript geschriebenes "\b" im Suchmuster wurde
     als Backspace-Steuerzeichen in die Datei geschrieben - das Muster fand lautlos NULL Treffer.
     Bei generierten Regex-Zeilen immer das kompilierte Muster mit repr() gegenprüfen.
     ZWEITE FALLE derselben Klasse (04.08., aus M5): Beim Schreiben von Python-Skripten über den
     Datei-Schreibweg wurde das schliessende deutsche Anführungszeichen (U+201D) still zu einem
     ASCII-Anführungszeichen normalisiert und beendete damit das String-Literal - Fehlermeldung
     "unterminated string literal" an einer Stelle, die im Editor KORREKT aussieht. Gegenmittel:
     Sonderzeichen über chr(0x201D) aufbauen und die tatsächlichen Codepoints prüfen, nie das
     Schriftbild. Merke ausserdem: Das TK verwendet durchgehend "..." mit ASCII-Schlusszeichen -
     U+201D ist dort ein Fremdkörper und muss vereinheitlicht werden.
   - M4 (Pixel) angelegt: 25 Issues #95-#119, Milestone "M4 - Pixel", M4-XX -> #(XX+94), Volltexte
     in docs/agents/m4/ (map.json). ACHTUNG: Die Befunde dieses Durchgangs sind hier NIE festgehalten
     worden - wer sie braucht, findet nur die Issues selbst und den Draft-Abschnitt.
   - M5 FERTIG (04.08.): 36 Issues #120-#155 (Milestone "M5 - Inhalte", M5-XX -> #(XX+119)).
     Volltexte in docs/agents/m5/, Mapping in docs/agents/m5/map.json. Aufteilung: project-store
     M5-01 + M5-33; composer M5-02..M5-15 + M5-35; action-editor M5-16..M5-23; vorlagen-editor
     M5-24..M5-31 + M5-36; ipc-client M5-32; ipc-gateway M5-34. Drei neue Labels: modul:composer,
     modul:action-editor, modul:vorlagen-editor. 467 Querverweise aufgelöst. Label
     braucht-entscheidung: 15 von 36.
     ZUSCHNITT WAR 31 - der PRÜFLAUF hat FÜNF Issues ERZWUNGEN, alle fünf an den NÄHTEN:
     (1) Der Renderer konnte gar keine Ereignisse empfangen: ipc-client (#24) kannte nur rufeAuf
     (Invoke), damit war queue:geaendert unbeobachtbar und der "nicht gespeichert"-Hinweis
     (Fehlerklasse 2, TK 9.7.3) nicht baubar - VIER Autoren meldeten es unabhängig -> M5-32 (#151),
     abonniere(kanal, hoerer) -> () => void.
     (2) Listenelement.ref konnte niemand umsetzen: TK 9.7.5 nennt drei Fix-Optionen ("neu
     verknüpft/importiert, ersetzt oder entfernt"), TK 9.5.2 hatte keine Operation dafür -
     ausführbar war nur "entfernen", also FA-19 und Akzeptanzkriterium 7 UNERFÜLLBAR. Verschärfend:
     Ein Neuimport vergibt eine NEUE UUID, das Element hätte weiter auf das fehlende Asset gezeigt.
     -> M5-33 (#152) + TK v2.7.
     (3) Zwei Kanäle ohne Anmeldung: #76 meldet genau 14 project-Kanäle an und verbietet einen
     fünfzehnten; setzeEinblendung und setzeElementReferenz wären fertige Main-Funktionen OHNE
     AUFRUFER gewesen - dieselbe Lückenklasse wie in M1 und M2, jetzt zum dritten Mal -> M5-34 (#153).
     (4) Der composer hätte Platzhalter in die MP4 gebrannt: M5-09/M5-15 setzten Schriften, Logo und
     Motive als bereit voraus und verwiesen dafür auf M5-02, das nichts davon tat. Wer den composer
     öffnet, ohne vorher im Aktions-Editor gewesen zu sein, hätte für jedes Bild einen Platzhalter
     gezeichnet - TK 9.10.7 verbietet genau das im finalen Render -> M5-35 (#154).
     (5) Der Vorlagen-Editor war nicht betretbar: für erstelleVorlage, listeArbeitskopien und
     löscheVorlage gab es in ganz M5 keinen Aufrufer, und FA-13 ist ein MUSS -> M5-36 (#155).
     DREI ÜBERGREIFENDE ENTSCHEIDUNGEN, die auch für M6/M7 gelten:
     E1 - KEINE project:geaendert/vorlagen:geaendert-Ereignisse. composer, action-editor und
     vorlagen-editor laufen im SELBEN Renderer-Prozess; ein IPC-Ereignis wäre eine Reise durch den
     Main und zurück, nur um zwei Modulen mitzuteilen, was im selben Speicher schon passiert ist.
     Stattdessen: Jede Operation liefert den neuen Stand zurück, der Aufrufer gibt ihn an die
     gemeinsame Sicht weiter (Projekt: M5-02, Vorlagen: M5-36). Module ausserhalb des besitzenden
     Ordners bekommen die Aktualisierungsfunktion als PARAMETER, nicht per Import. Wer sie
     durchreicht, ist app-shell (M7).
     E2 - Ereignisse vom Main laufen über abonniere (M5-32). OFFEN bleibt, dass
     project:autoSpeichernStatus im Main KEINEN Sender hat: Empfänger da, Sender nicht.
     E3 - Renderer-Signaturen nutzen Ergebnis<T, string>. Fachliche Fehlercode-Unionen liegen in
     src/main/** und dürfen vom Renderer nicht importiert werden; die Enge sitzt dort, wo der Code
     entsteht. Ohne diese Regel hätte jedes Renderer-Issue die Union ein zweites Mal definiert.
     MUSTER zum dritten Mal bestätigt: alle kritischen Befunde sitzen an den NÄHTEN zwischen Issues,
     keiner innerhalb eines Issues. Regel A und D halten inzwischen (rund 60 fremde Signaturen
     geprüft, keine einzige falsch rekonstruiert - die M4-Fehlerklasse ist geschlossen; über 350
     Zitate verifiziert).
   - TK v2.7 (04.08., beim M5-Prüflauf gefunden, vom User entschieden): Operationsliste 9.5.2 um
     setzeEinblendung und setzeElementReferenz ergänzt. .md und .docx synchron (ZIP/XML ok,
     0 Backticks, Absatz-Diff = nur diese Änderungen). Anforderungsdokument unverändert v1.2.
     NACHGEZOGEN auf GitHub: #76 (DoD "genau 14 Kanäle" -> "die vierzehn dieses Issues", Verbot auf
     DIESE Datei eingegrenzt), #24 (DoD: window.api nur AUSSERHALB von src/renderer/ipc-client/
     verboten; Ereignisse über abonniere), #3 (siebter Bootstrap-Eintrag
     verdrahteProjectStoreNachtragIPC(), Zählung an 6 Stellen), #120/#152/#153 (die "TK ist
     nachzuziehen"-Vermerke sind mit v2.7 erledigt). Lokale Quelldateien gegen GitHub geprüft:
     36/36 deckungsgleich.
   - M6 FERTIG (04.08.): 37 Issues #156-#192 (Milestone "M6 - Render & Export", M6-XX -> #(XX+155)).
     Volltexte in docs/agents/m6/, Mapping in docs/agents/m6/map.json. Aufteilung: contracts M6-01/02;
     ffmpeg-adapter M6-03..M6-15; render-service M6-16..M6-26 + M6-34; export-service M6-27..M6-33 +
     M6-35; ipc-gateway M6-36; project-store M6-37. Vier neue Labels: modul:ffmpeg-adapter,
     modul:render-service, modul:export-service und risiko:tv-ausgabe - das letzte ist NEU und eigen
     fuer M6 (ein Fehler faellt hier nicht im Test auf, sondern erst am Fernseher), es traegt 15 der
     37 Issues. 921 Querverweise aufgeloest. braucht-entscheidung: nur 5 von 37 (#163, #168, #184,
     #191, #192) - und DREI davon sind EXPERIMENTE (Autorotation des ffmpeg-Binaries, kennt es qtrle,
     FAT32-Erkennung), keine Entscheidungen.
     ZUSCHNITT WAR 36 - der PRÜFLAUF hat M6-37 (#192) ERZWUNGEN: sofortFlush (#47) verlangt ein
     Project, das kein einziges Issue in sechs Meilensteinen main-intern herausgibt. Damit war der
     seit TK v2.8 verlangte Sofort-Flush weder in #68 noch in M6-33 baubar. Dieselbe Lückenklasse
     zum VIERTEN Mal (nach #72-#77, #71, #153).
     DIE VIER SCHWERSTEN BEFUNDE: (1) -ss an der falschen Stelle (M6-12/#167) - es stand im
     VERBINDLICHEN Argument-Array zwischen zwei -i und wurde damit zur Eingangs-Option des FALSCHEN
     Eingangs. Der Ausschnitt haette immer bei Frame 0 begonnen: richtige Laenge, falscher Inhalt -
     und die eigene DoD-Pruefung waere gruen durchgelaufen. Das Issue beschreibt diese Falle in
     seiner EIGENEN Einleitung und tappt dann hinein. (2) -progress wurde NIRGENDS gesetzt: die ganze
     Fortschrittskette #160 -> #177 -> #178 -> #191 waere gebaut und TOT gewesen, und -loglevel error
     unterdrueckt zusaetzlich die voreingestellte Ausgabe. Zwei Pruefer meldeten es unabhaengig;
     jetzt im festen Vorspann von M6-03 (#158), an genau EINER Stelle. (3) Zwei Funktionen gleichen
     Namens im selben Ordner (segmentDateiname in #175 und #177, gleiche Signatur, verschiedenes
     Ergebnis) - ein falscher Import kompiliert fehlerfrei und setzt ffmpeg auf Dateien, die es nicht
     gibt. (4) Die Toleranz der Dauerpruefung war rechnerisch falsch (M6-25/#180): max(0.5, 1 % der
     Dauer) haette bei einem 30-Minuten-Reel ein vollstaendig fehlendes Segment durchgewinkt - genau
     der Fall, gegen den die Pruefung existiert. Jetzt fest 0,5 s.
     MUSTER zum VIERTEN Mal bestaetigt: ALLE kritischen Befunde sitzen an den NAEHTEN zwischen
     Issues, keiner innerhalb eines Issues. Regel D hielt ueber rund 300 geprüfte Zitate praktisch
     fehlerfrei, Regel C ohne Verstoss in 37 Dateien, Regel E 37/37. NEU bei M6: die schwersten
     Befunde waren RECHNERISCH/POSITIONELL (Argument-Reihenfolge, Toleranzformel, Geradzahligkeit),
     nicht vertraglich - ein Pruefer, der nur Signaturen abgleicht, findet sie NICHT.
   - TK v2.8 (04.08., beim M6-Zuschnitt gefunden, vom User entschieden) - NEUN Entscheidungen:
     E-3 (WICHTIGSTE) Die fertige Ausgabedatei wird als <name>.mp4.part im PROJEKT-Ausgabeordner
     gestaget, nicht in <Temp>. Umbenennen ist nur auf DERSELBEN Partition unteilbar; die App ist
     portabel, <Temp> liegt auf C:, der Datenort kann auf dem Stick liegen. Sonst waere rename ein
     EXDEV-Fehler, der Ausweg "kopieren und loeschen" hebt Akzeptanzkriterium 9 auf - und der Fehler
     faellt in KEINEM Test auf, weil beim Entwickeln Temp und Daten auf derselben Platte liegen.
     E-5 art und höhe der Band-Vorlage wandern in den RenderRequest (der Auftrag wird beim Einreihen
     eingefroren, TK 9.3.5; sonst passen die bereits gezeichneten Band-PNGs nicht mehr zur spaeter
     nachgeschlagenen Hoehe). E-1 historieEintrag ersatzlos gestrichen - ein Feld, das ueber fuenf
     Meilensteine niemand brauchte, ist keins; Q3 ist dauerhaft, ein doppelt gefuehrtes Datum darin
     bliebe fuer immer falsch. E-4 Der Sofort-Flush laeuft als ERSTER SCHRITT IM HANDLER. Beim
     Nachziehen kam heraus, dass die vom TK genannte Stelle (der Torwaechter) kein await enthalten
     darf - niemand haette ihn gebaut: #59 darf nicht, #68 verbot ihn sich selbst. E-6 "verifiziert"
     = einmal ffprobe auf die fertige Datei gegen das Ausgabe-Profil, VOR dem Ersetzen - die einzige
     Stelle, an der ein stiller Encoder-Fehler noch auffaellt. E-9 render:fortschritt als Ereignis
     (Nutzlast und Empfaenger existierten, es fehlte allein der Sender). E-2 ausgabe.gesamtdauer wird
     number|null (der Export kennt keine Spieldauer, sein Zielpfad steht in pfad). E-7 Der Export
     loest seine Quelldatei ueber loeseAusgabePfad (#49) auf, KEIN eigenes join. E-8 Restflaechen der
     Split-Komposition = Farb-Rolle flaecheDunkel (#2F2E2E), ueber leseMarke() (#29), nie als Hexzahl
     in einer Filterkette.
   - TK v2.9 (04.08., beim M6-Prüflauf gefunden, vom User entschieden): (1) speicher_fehler als
     SIEBTER Fehlercode in 9.6.4 - der Flush-Fehlschlag im Export-Handler hatte keinen Code
     (schreib_fehler meint das Kopieren, die uebrigen fuenf das Ziel, der Flush aber den Datenort).
     (2) BANDHOEHEN MUESSEN GERADE SEIN - yuv420p verlangt gerade Hoehen und Versaetze; bei ungerader
     Hoehe brechen BEIDE Kompositionsarten (split: 1080-H ungerade; einblendung: Overlay auf
     ungerader Zeile). Durchgesetzt an der Quelle (Editor sperrt, Store weist ab), Render prueft
     zusaetzlich. (3) Die SPLIT-VIDEOBREITE WIRD AUF EIN VIELFACHES VON 4 ABGERUNDET - die gerade
     Bandhoehe allein rettet die Geometrie nicht, denn (1080-H)x16/9 ist nur ganzzahlig, wenn 1080-H
     durch 18 teilbar ist, und der zentrierte x-Versatz ist nur bei einem Vielfachen von 4 gerade.
     Die eingebaute Vorlage (H=162) geht als EINZIGE zufaellig auf und haette den Mangel verdeckt.
     Aufrunden ist verboten (braeche "contain ohne Beschnitt"). .md und .docx synchron (geprüft),
     Anforderungsdokument unveraendert v1.2.
     RUECKWAERTS NACHGEZOGEN (eine Vertragsaenderung erzwingt den Zitat-Abgleich ueber ALLE
     angelegten Issues): #3 (sieben -> ZEHN Anmeldungen plus raeumeVerwaisteArbeitsbereiche() als
     Startschritt, und verdrahteExportUndFortschrittIPC muss NACH dem Fenster stehen, weil es als
     einzige Verdrahtung ein BrowserWindow braucht), #47 (trug noch "gerufen wird sie vom
     Torwaechter"), #17, #19, #53, #62, #68, #70, #134, #72/#73/#74/#87, sowie #95/#96/#100/#102/#155
     und #103/#117/#148 (Bandhoehe).
   - M7 FERTIG (05.08.): 69 Issues #194-#262 (Milestone "M7 - Oberflaeche & Komfort").
     Volltexte in docs/agents/m7/, Mapping in docs/agents/m7/map.json. ACHTUNG BEI DEN NUMMERN:
     M7-XX -> #(XX+193) gilt NUR BIS M7-59 (#252). Danach nicht mehr, weil zwei Issues nachtraeglich
     GETEILT wurden: M7-60 -> #259, M7-61..M7-64 + M7-66/M7-67 -> #253-#258, M7-65 -> #260,
     M7-68 -> #261, M7-69 -> #262. IMMER aus map.json abschreiben, NIE rechnen. (#193 gehoert zu
     M0, nicht zu M7 - ein spaeter nachgetragenes Grundgeruest-Issue.) Fuenf neue Labels:
     modul:app-shell, modul:queue-panel, modul:preview-player, modul:projekt-verwaltung,
     modul:renderer-gemeinsam. 2756 Querverweise aufgeloest - mit Abstand der groesste Meilenstein.
     braucht-entscheidung: 38 von 69 (hoechster Anteil aller Meilensteine; passt zur Sache, weil das
     TK auf der Oberflaechen-Ebene am wenigsten vorgibt).
     DIE SIEBEN SCHWERSTEN BEFUNDE - vier davon sind dieselbe Sache: fertig gebaut, fuer den Nutzer
     nicht erreichbar. (1) ES GAB KEINEN WEG, EIN PROJEKT ANZULEGEN. erstelleProjekt, listeProjekte,
     dupliziereProjekt, loescheProjekt sind SEIT M1 GEBAUT - kein Issue rief sie auf. Die Anwendung
     waere beim ersten Start unbenutzbar gewesen. (2) ES GAB KEINEN WEG, EIN VIDEO ZU IMPORTIEREN
     (FA-01, ein MUSS): Der Import wurde genau zweimal gerufen, beide Male fuer das BILD einer
     Aktion. (3) M5 hat die gesamte Bedienlogik als reine .ts-Dateien gebaut - konsequent nach
     Regel E und in jedem Issue richtig -, aber NIEMAND ZEICHNETE Wiedergabeliste, Aktions-Editor
     oder Vorlagen-Editor. FA-05 und Akzeptanzkriterium 1 waren nicht erfuellbar. (4) Die
     BANDBEARBEITUNG (FA-20, die HAUPTBETRIEBSART) hatte keine Oberflaeche. (5) UNDO WAR GEBAUT UND
     WIRKUNGSLOS: TK 9.13.2 verlangt einen Schnappschuss vor jeder Instant-Operation, aber alle
     Instant-Operationen liegen in Modulen, die Undo ausdruecklich ausschliessen. Geloest ueber eine
     HUELLE um die gemeinsame Projekt-Sicht (M7-50 = #243) - der Schnappschuss entsteht an EINER
     Stelle, die jede Aenderung passiert, statt in dreissig aufrufenden Modulen. (6) DER
     RENDERER-BOOTSTRAP FEHLTE: sieben Einstiegspunkte ohne Aufrufer (Auftrags-Auswerter, Sitzung,
     gemeinsame Sichten, Reiterbelegung, Speicherhinweis, Warteschlangen-Leiste) -> M7-65 (#260) und
     M7-69 (#262). SECHSTE WIEDERHOLUNG derselben Lueckenklasse nach #72-#77, #71, #153, #192, #255.
     Nicht mit dem Main-Bootstrap #3 verwechseln - der verdrahtet den Main. (7) ZWEI medienUrl-
     Fassungen mit ENTGEGENGESETZTER ABNAHME (eine verlangt Prozent-Kodierung, die andere prueft
     "ohne Kodierungsumbau"). Heute unauffaellig, WEIL DIE DATEINAMEN UUIDs SIND - ein Zufall der
     Belegung, kein Vertrag. Zusammengefuehrt in M7-67 (#258): die media-Adresse wird an genau
     einer Stelle gebildet.
     NEUE FEHLERKLASSE, M7 eigen: UEBERHOLTE TATSACHENBEHAUPTUNGEN. M7 ist so gross, dass frueh
     geschriebene Dateien nicht wissen, was spaete liefern; weil Regel B von jedem Issue verlangt,
     seine Luecken zu melden, standen rund FUENFZEHN Melde-Auftraege in den Texten, die INS LEERE
     zielten - der Baustein war laengst durch ein spaeteres Issue gedeckt. Warum das gefaehrlich
     ist: Ein Agent, der "Braucht einen Baustein, den kein Issue liefert" liest, BAUT NICHT. Er
     meldet und wartet. Eine ueberholte Behauptung blockiert also GENAUSO wie eine echte Luecke,
     nur unsichtbar. NEUE REGEL: Wer ein Issue anlegt, das die Luecke eines frueheren schliesst,
     STREICHT DORT DIE MELDE-AUFFORDERUNG und setzt den Verweis auf das neue Issue an ihre Stelle.
     Das ist die Vorwaerts-Entsprechung zur Rueckwaerts-Regel (Vertragsaenderung erzwingt
     Zitat-Abgleich ueber alle angelegten Issues).
     WERKZEUG-HAERTUNG: create-issues.py ueberspringt jetzt Eintraege, die schon in map.json stehen.
     ANLASS: GitHub lehnt Bodies ueber 65 536 Zeichen ab. M7-60 und M7-65 lagen bei rund 77 000 und
     scheiterten, waehrend 65 andere im selben Lauf durchliefen - ohne die Haertung haette ein
     zweiter Lauf 65 DUPLIKATE angelegt. Beide wurden GETEILT statt gekuerzt: ein Kuerzungsversuch
     hat nachgerechnet, dass M7-65 selbst mit KOMPLETT LEEREM Signaturblock noch bei 61 561 Zeichen
     laege. Geteilt wurde nach dem Anlegen von M7-61..M7-67, daher die Sprungnummern.
     MUSTER zum FUENFTEN Mal bestaetigt: alle kritischen Befunde sitzen an den NAEHTEN - in M7 an
     der groessten ueberhaupt, der zwischen LOGIK (M1-M6) und BEDIENUNG. Die Lueckenklasse "fertige
     Funktion ohne Aufrufer" ist inzwischen in JEDEM Meilenstein seit M1 aufgetreten und wurde JEDES
     MAL erst im Prueflauf gefunden; die billigere Vorsorge steht seit #255 im Vermerk: ein
     Zuschnitt-Schritt "fuer jede Operation - WER RUFT SIE?".
   - NACHGEZOGEN nach M7 (05.08.): #3 (Main-Bootstrap) traegt jetzt DREIZEHN Anmeldungen statt
     zwoelf - neu ist verdrahteVorlagenNachtragIPC() (#255, Vorlagen-Nutzungsanzeige) als ACHTE der
     nunmehr ZEHN Anmeldungen OHNE Fenster, unmittelbar nach verdrahteVorlagenIPC() (#109);
     meldeRenderHandlerAn/meldeExportHandlerAn ruecken auf 9 und 10. Die drei Anmeldungen MIT
     Fenster bleiben unveraendert. Ausserdem die Platzhalter-Kennungen auf echte Nummern gezogen:
     M7-45 -> #238 (verdrahteSpeicherstatusIPC), M7-47 -> #240 (verdrahteProjectStoreNachtrag2IPC).
     Zaehlung an allen 9 Stellen im Text angepasst.
   - ALLE MEILENSTEINE M0-M7 SIND ANGELEGT. Die Issue-Ueberfuehrung ist abgeschlossen.
     [NACHTRAG 10.08.2026: M8 (Marken) ist mit 56 Issues dazugekommen, #275-#330.]
4. LÄUFT: BAU. Seit 04.08. wird gebaut, Branch bau/m0-01-grundgeruest (von der Planungsbranch-Spitze
   abgezweigt, weil main 21 Commits zurücklag und weder .gitignore noch CLAUDE.md noch die aktuellen
   Dokumente hatte). Nicht nach main gemergt.
   - #1 FERTIG: vier tsconfigs, 19 Modulordner mit Platzhalter-index.ts. Die Prozess-Trennung ist
     NACHGEWIESEN, nicht behauptet: fs/path/child_process in src/renderer/ -> TS2307, dieselben in
     src/main/ -> laufen durch (Gegenprobe), document in src/main/ -> TS2584, fs in src/shared/ ->
     scheitert im Renderer-Check. Tragender Schalter ist "types": [] in tsconfig.renderer.json -
     ohne ihn zieht tsc JEDES @types-Paket ein, auch @types/node, und TK 2 wäre nur Konvention.
   - #2 FERTIG: Vite (Renderer) + esbuild (Main UND Preload) + eigenes Dev-Skript. Zwei Lücken beim
     Bauen gefunden und im Issue nachgezogen: den Preload baute NIEMAND (#4 schreibt den Code, #3
     verweist auf den Pfad), und der Renderer hatte keinen Einstiegspunkt (#10 nennt nur App.tsx und
     shell/). Beide STOPP-Punkte entschieden. Merke zu ffmpeg-static: external in der esbuild-Config
     JA (beim Abnehmen mit echtem Import belegt: require bleibt stehen, Bundle 1,7 KB statt ~80 MB),
     in vite.config.ts NEIN. ACHTUNG - hier stand, dort bringe ein Renderer-Import den Build zum
     Scheitern. NACHGEMESSEN BEIM ABNEHMEN VON #2: stimmt NICHT. Vite stubbt die benutzten
     Node-Bausteine und WARNT nur, Exitcode 0; und der Renderer-Typecheck greift auch nicht, weil
     "types": [] nur ambiente @types-Pakete sperrt - ffmpeg-static bringt eigene Typen mit. Es gibt
     fuer diesen Fall DERZEIT KEINE Schranke; sie gehoert als Lint-Regel nach #193. Bis dahin haengt
     TK 2 ("Nur der Main-Prozess beruehrt ffmpeg und Dateisystem") an der Aufmerksamkeit des
     Schreibenden. Lehre daraus: Eine Schutzzusage, die nur im Kommentar steht, ist keine - beim
     Abnehmen wird sie geprobt, nicht gelesen. Volltext: docs/agents/m0/M0-02-build.md.
   - MUSTER, das sich beim Bauen wiederholt: Die Fehler sitzen an denselben NÄHTEN wie in den
     Prüfläufen - ein Artefakt, das jemand voraussetzt, aber niemand erzeugt. Erst der IPC-Kanal ohne
     Anmelder (M1/M2/M5), jetzt der Preload ohne Erbauer und der Einstiegspunkt ohne Besitzer.
     Beim Bauen JEDES Issues prüfen: Gibt es zu jedem vorausgesetzten Artefakt einen Erzeuger?
   - OFFEN aus #2: Vite warnt zu `"type": "module"`. Beide naheliegenden Auflösungen greifen den
     Bestand an (vite.config.mts widerspricht der Signatur; "type": "module" erklärt
     dist/main/index.js zu ESM und bricht den Electron-Main). Heute nur eine Warnung.
   - UMGEBUNG: Platte war am 04.08. mit 0 MB voll; der scheinbare Netzfehler
     "ENOTFOUND github.com" bei ffmpeg-static war NUR eine Folge davon. Bei seltsamen
     npm-Fehlern zuerst `df -h /c` prüfen. Electron ~215 MB + ffmpeg-static ~83 MB.
   BASIS: docs/agents/issue-generation-prompt.md ist die selbsttragende Übergabe-Prompt dafür
   (Modulschnitt, alle Invarianten zum Wörtlich-Zitieren, Pflicht-Issue-Vorlage + ausgefülltes Beispiel,
   Meilensteine M0-M7 inkl. Grundgerüst-Issues S1-S12, Labels, Dry-Run-vor-Freigabe-Ablauf).
   ERLEDIGT (04.08.): noUncheckedIndexedAccess ist in tsconfig.base.json AN. Der Schalter ist nur
   die halbe Miete - die Fluchttür `elemente[i]!` hebt ihn auf und lässt den Code zugleich geprüft
   aussehen. M0 enthielt KEIN Linting-Issue, das Verbot @typescript-eslint/no-non-null-assertion
   hatte also keinen Ort -> neues M0-Issue #193, Quelle docs/agents/m0/M0-13-eslint.md.
   MERKE zur Nummerierung: ein neues Issue verschiebt NICHTS - GitHub zählt fortlaufend über das
   ganze Repo. Ein M0-Nachzügler bekommt die nächste freie Nummer (hier #193, weil M6 schon auf
   #156-#192 lag), nicht eine Nummer innerhalb von M0.
   HINWEIS package-lock.json: bleibt im Repo (04.08. entschieden). Grund: ffmpeg-static liefert eine
   BINÄRDATEI mit, electron bringt Chromium mit (davon hängt der Canvas-Determinismus aus TK 9.10 ab)
   und electron-builder baut die EXE - driften diese Versionen still, ändert sich das fertige Video,
   ohne dass die App einen Fehler zeigt. Die Konflikt-Schmerzen sind stattdessen über .gitattributes
   entschärft (`package-lock.json binary` -> keine Konflikt-Marker in der Datei). Bei einem Konflikt
   NIE von Hand mergen, sondern regenerieren:
   `git checkout --ours package-lock.json && npm install && git add package-lock.json`
   HINWEIS Doku-Workflow: .docx NIE schreiben, während Word offen ist (Vorfall 03.07.: Schreiben-während-offen
   + harter Neustart hat Datei beschädigt). Generieren - Staging - validieren - nur bei freier Datei platzieren,
   sonst stoppen und User bitten. Keine Retry-Kopier-Schleifen.
