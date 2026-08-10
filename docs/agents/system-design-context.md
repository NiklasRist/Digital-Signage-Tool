# System-Design-Kontext für Agents – Digital-Signage-Tool (Baller Gruppe)

> **Zweck dieser Datei:** vollständiger, laufend gepflegter Projektkontext für Agents, die einzelne
> Funktionen füllen. Eine kleine (~30 Zeilen) Funktion trifft lokale Trade-offs (Datenformate,
> Fehlerbehandlung, ffmpeg-Parameter, Rundungen, Grenzfälle), die – falsch gewählt – das ganze
> Projekt beschädigen. Deshalb: jede lokale Entscheidung muss zu den hier festgelegten globalen
> Invarianten passen. Im Zweifel lieber strikter an den Vertrag halten als „clever" abweichen.
>
> **Stand:** 10.08.2026 · Anforderungsdokument **v1.3** · Technisches Konzept **v3.7** · Phase: BAU (M0 läuft auf `bau/m0-01-grundgeruest`). Meilensteine M0–M7 sind als Issues angelegt; **M8 (Marken) ist geschrieben, aber NOCH NICHT angelegt** – seine Volltexte liegen in `docs/agents/m8/`.

---

## 1. Projekt in Kürze
- Tool für das Fitnessstudio Fitnessworld24 (Baller Gruppe). Erste Stufe: EIN Studio, EIN Bildschirm.
  **Seit AD v1.3 wird im Studio auch für Dritte geworben** (Partner-Marken) und dieselbe Marke soll in
  Saison-Anmutungen erscheinen – daher der Marken-Bestand (FA-23/FA-24, s. 9m).
- Hardware: nur ein Samsung Consumer-TV (UE85AU7170, 85", Tizen) + USB-Stick. Kein Mediaplayer.
- Lösung: Ein Desktop-Tool (Laptop) erzeugt je Lauf EINE durchgehende, frei benannte MP4; der TV spielt sie vom USB als
  manuell gestartete Endlosschleife. Der TV ist nur „dummer" Player.

## 2. Ausgabe-Profil (fest, TK 9.2.4 – TV-kritisch, NICHT abweichen!)
MP4 `<ausgabeName>.mp4` (Name frei, FA-22), **H.264 High / Level 4.0**, **1920×1080**, **30 fps CFR**, **`yuv420p` 8 Bit**,
**BT.709** explizit (Primaries/Transfer/Matrix), **SAR 1:1**, progressiv, **gedeckeltes VBR**
(Ziel 10 / max 12 Mbit/s, VBV 24 Mbit), **GOP geschlossen ≤ 2 s und jedes Segment beginnt mit Keyframe
(IDR)**, **stille AAC-Spur** in jedem Segment, `+faststart`.
- **Warum das zählt:** `yuv420p`/8 Bit – TVs decodieren nichts anderes. **BT.709 explizit** – sonst raten
  Player BT.601 und die **Marken-Farben verschieben sich**. **SAR 1:1** – sonst verzerrt der TV.
  **VBV-Deckel** – sonst Ruckler durch Bitraten-Spitzen. **Keyframe je Segment** – Bedingung für `concat -c copy`.
  **Stille AAC-Spur** – manche Player zicken bei rein-Video-MP4 (R-06 damit entschieden).
- **VERBOTEN:** 10 Bit, 4:2:2/4:4:4, offene GOPs, unbegrenztes CRF ohne VBV, exotisch hohe Referenzframes.
- Abweichende Seitenverhältnisse → schwarze Balken (`pad`, **kein** Beschnitt); Ausnahme Split-Komposition
  füllt in Markenfarbe (9.2.8). Videos trimmbar; Segmentdauer 10 s Standard (10–45 s); harter Schnitt.

## 3. Tech-Stack (entschieden)
Electron + TypeScript + React + Vite; dnd-kit; HTML5-Canvas → PNG für Aktions-Segmente; gebündeltes
ffmpeg **und ffprobe** (`ffmpeg-static` + `ffprobe-static` + `fluent-ffmpeg`; `ffmpeg-static` allein
enthält **kein** ffprobe, der Medien-Import braucht es für Maße und Dauer); Datenhaltung JSON je Projekt (`lowdb`), SQLite optional;
Verpackung `electron-builder` Portable (Win 10/11 + macOS 13+, kein Installer, ohne Admin).

## 4. Architektur
- **Renderer (React-UI)** und **Main (Node)**, verbunden über einen **typisierten IPC-Vertrag**.
  Renderer ↔ Main reden AUSSCHLIESSLICH darüber.
- **Nur der Main** berührt ffmpeg und Dateisystem.
- DFD-Prozesse: P1 Medienverwaltung, P2 Inhaltsverwaltung, P3 Zusammenstellung, P4 Finaler Render +
  Export, P5 Vorschau, **P6 Auftragsverwaltung** (gibt P1/P4 seriell frei), **P7 Vorlagenverwaltung**. Speicher: D1 Projekt-Store,
  D2 Medienordner, D3 App-Konfig, T1 flüchtiger Render-Arbeitsbereich, **Q1–Q4** (Speicher der
  Auftragsverwaltung, s. Abschnitt 8), **V1** Vorlagen-Bibliothek (P7, s. 9i), **V2 Marken-Bestand**
  (app-weit, s. 9m). **Die Marke kommt seit v3.4 aus V2, nicht mehr aus D3** – `config.json` führt nur
  noch aktives Projekt, Export-Ziel und UI-Voreinstellungen.
- Zwei Render-Arten, gleicher Eingang (Liste + Medien): **P5 Vorschau** (UI-Simulation, OHNE ffmpeg,
  → Bildschirm) und **P4 finaler Render** (ffmpeg → benannte Ausgabe-MP4 → USB). Vorschau-Segmente nutzen
  exakt dasselbe Canvas-Bild wie der finale Render (**pixelgleich**).

## 4b. IPC-Vertrag: Konventionen – TK 9.1.1  ⟵ GILT FÜR JEDE FUNKTION AN DER GRENZE
Wenn du eine Funktion schreibst, die vom Renderer aufgerufen wird oder im Main eine IPC-Operation
bedient, gilt **ausnahmslos** Folgendes. Diese Regeln sind der häufigste Ort für lokale Fehlgriffe.

- **Granularität (Variante A):** Der **Renderer** rendert Segment-/Band-PNGs (`template-canvas`) und
  übergibt sie als **Binärpuffer** (nicht Base64). Nur der **Main** schreibt/liest Dateien und ruft
  ffmpeg. Importierte Medien liest der Main selbst per relativem Pfad aus D2 – die gehen **nicht**
  über IPC.
- **Einheitliche Ergebnis-Hülle – NIEMALS Exceptions über die Grenze:**
  ```
  Ergebnis<T> = { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } }
  ```
  **`daten` (optional, NEU in v2.5):** strukturierte Nutzdaten des Fehlers – `asset_referenziert` trägt
  `{ referenzenIds: string[] }` (9.4.9), `vorlage_referenziert` beide Trefferlisten (9.12.1). Form **je
  Fehlercode** festgelegt, dort dokumentiert, wo der Code vergeben wird. Ohne dieses Feld könnte der
  geführte Reparatur-Modus (FA-19) den Nutzer nirgendwohin führen. **Kein Freitext-Anhang.**
  **Warum kein `throw`:** Renderer und Main sind getrennte Prozesse; Electron serialisiert alles
  dazwischen. Ein `new Error()` mit eigenem Feld `code` kommt beim Aufrufer nur noch als **Text** an
  (`"Error invoking remote method '…': …"`) – **Fehlerklasse und `code` sind verloren**. An unseren
  Codes hängt aber echtes Verhalten (Reparatur-Modus, Wiederholen, FAT32-Hinweis). Nie Meldungstexte
  vergleichen.
- **`Ergebnis<void>`**, wenn es nichts zu melden gibt – das `ok` **ist** die Information.
  **Verboten:** `Ergebnis<boolean>`, `Ergebnis<null>`, blankes `true`. Sonst gäbe es zwei Wege zu
  sagen „hat funktioniert", und ein `wert: false` würde irgendwann als Erfolg durchgehen.
- **Zwei Ebenen NICHT verwechseln:**
  – **Aufruf-Ergebnis:** hat der *Aufruf* geklappt (z. B. „eingereiht")? → `Ergebnis<T>`.
  – **Auftrags-Ergebnis:** wie ging der *Vorgang* aus? → reist über den **Auftrags-Zustand** (Abschnitt 8),
    **nicht** als Aufrufantwort. `import`, `loeschen`, `render`, `export` werden **nie** direkt
    aufgerufen, sondern über `reiheEin(art, payload) → Ergebnis<{ auftragId }>`.
- **Fehlercodes sind ein geschlossener, typisierter Satz:** fachliche je Operation (TK 9.4.9, 9.6.4,
  9.12.1) plus generisch `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. Eine rohe
  Exception-Meldung wird **nie** zum Code.
- **Kanalbenennung `<modul>:<operation>`** (`media:importMedium`, `project:setzeTrim`), Ereignisse
  `<modul>:<ereignis>` (`queue:geaendert`, `render:fortschritt`). Keine eigenen Namensschemata erfinden.
- **Ereignisse sind Einbahnstraßen**, tragen **keine** Hülle und **keinen Endzustand**. Terminale
  Zustände kommen nur über Aufruf-Ergebnis bzw. Auftrags-Zustand.
- **Empfangsweg im Renderer: `abonniere` (M5-32, `#151`)** – ⟵ NEU 04.08.
  `abonniere<T>(kanal: string, hoerer: (nutzlast: T) => void): () => void` in
  `src/renderer/ipc-client/ereignisse.ts`. **Der Rückgabewert IST die Abmeldung** – jedes Modul, das
  sich anmeldet, muss sich beim Aufräumen wieder abmelden, sonst hängt nach jedem Reiterwechsel ein
  weiterer Hörer am selben Kanal und der älteste (= veralteste) feuert zuletzt über den aktuellen
  Stand. Die Funktion **castet nur den Typ**: nichts auspacken, nicht umformen, **nie** in eine
  `Ergebnis`-Hülle zwingen und aus einer Meldung **nie** einen Endzustand ableiten – sonst entsteht
  ein zweiter, konkurrierender Weg neben Aufruf-Ergebnis und Auftrags-Zustand. `rufeAuf` (`#24`)
  bleibt Request/Response; **vor M5-32 hatte der Renderer überhaupt keinen Empfangsweg**, damit war
  `queue:geaendert` unbeobachtbar und der „nicht gespeichert"-Hinweis (Fehlerklasse 2, 9.7.3) nicht
  baubar. **`render:fortschritt` hat seit M6 einen Sender** (v2.8, ausdrücklich anzumeldender Kanal,
  9.2.7 – Nutzlast und Empfänger gab es längst, **es fehlte allein der Sender**).
  **GESCHLOSSEN mit M7:** `project:autoSpeichernStatus` hat jetzt einen **Sender** (`#238`) – und
  daneben den gleichartigen Kanal **`vorlagen:autoSpeichernStatus`** (v3.1): Das Speichern der
  Vorlagen-**Arbeitskopie** läuft entprellt und **ohne Aufruf** aus dem Renderer, es gibt also keine
  Antwort, an die sich eine Meldung hängen könnte – eine über Minuten gebaute Vorlage wäre
  **lautlos** verlorengegangen. **Zwei getrennte Kanäle**, weil die Oberfläche „dein Projekt ist
  nicht gesichert" von „deine Vorlage ist nicht gesichert" unterscheiden muss: Die
  Vorlagen-Bibliothek ist **app-weit** und hängt nicht am geladenen Projekt.
  **DRITTER Statuskanal seit v3.4: `marken:autoSpeichernStatus`** (9.15.1) – aus demselben Grund
  eigenständig: Der Marken-Bestand ist **app-weit** und hängt nicht am geladenen Projekt, also muss
  die Oberfläche „deine **Marke** ist nicht gesichert" von den beiden anderen unterscheiden können.
  Kanalfamilie der Marken-Operationen: **`marken:<operation>`**; ihre Fehlercodes stehen in **9.15.5**
  (s. 9m) – die Aufzählung der fachlichen Code-Quellen oben ist damit 9.4.9, 9.6.4, 9.12.1 **und 9.15.5**.
- **GENAU EIN FENSTER, und jedes Ereignis geht dorthin (v3.0, 9.1.1 Punkt 10).** Kein
  festgehaltenes Handle in einem Modul, keine Rundsendung an alle Fenster: Der **Bootstrap** erzeugt
  das eine `BrowserWindow` und **übergibt es als Parameter** an jede Verdrahtung, die einen Sender
  anmeldet. Nicht zu verwechseln mit der Einzel-Instanz-Sperre (9.5.4) – jene verhindert einen
  zweiten **Prozess**, diese legt fest, dass der eine Prozess **ein Fenster** führt.
- **Ereignisse VOR dem Aufbau des Fensters verfallen STILL – es wird NICHT gepuffert (v3.1,
  bindend).** Stattdessen gilt überall **„erst holen, dann abonnieren"**: Die Oberfläche holt beim
  Aufbau **einmal den vollständigen Stand** (Warteschlange: `holeStand()`, 9.3.4) und **abonniert
  erst danach**. **Baue KEINEN Puffer** – er müsste zwei Fragen beantworten, die niemand ohne Raten
  beantworten kann (**wie lange** hält er, **was** verwirft er bei Überlauf), und ein verworfenes
  `queue:geaendert` hinterlässt eine **dauerhaft falsche** Anzeige. Die umgekehrte Reihenfolge
  (erst abonnieren, dann holen) überschriebe ein bereits empfangenes Ereignis mit einem **älteren**
  Stand. Ohne das anfängliche Holen bliebe die Warteschlangen-Leiste beim Start leer, obwohl
  **Fehlschläge aus Q2** (persistent) vorliegen – ein fehlgeschlagener Render vom Vortag wäre
  unsichtbar und **nicht wiederholbar**.
- **Kein Ereignis für Renderer-interne Änderungen (Regel E1, entschieden 04.08.):** Es gibt
  **kein** `project:geaendert` und **kein** `vorlagen:geaendert`. `composer`, `action-editor` und
  `vorlagen-editor` laufen im **selben** Renderer-Prozess – ein IPC-Ereignis wäre eine Reise durch
  den Main und zurück, nur um zwei Modulen mitzuteilen, was im selben Speicher längst passiert ist.
  Stattdessen: **jede Operation liefert den neuen Stand zurück**, der Aufrufer gibt ihn an die
  gemeinsame Sicht weiter (Projekt: M5-02 `#121`, Vorlagen: M5-36 `#155`). Module **außerhalb** des
  besitzenden Ordners importieren die Sicht **nicht**, sie bekommen die Aktualisierungsfunktion als
  **Parameter**. Wer sie beim Aufbau der Oberfläche durchreicht, ist `app-shell` (**M7**).
- **Renderer-Signaturen nutzen `Ergebnis<T, string>` (Regel E3, entschieden 04.08.):** Die
  fachlichen Fehlercode-Unionen liegen in `src/main/**` und dürfen vom Renderer **nicht** importiert
  werden (Prozessgrenze). Der geteilte Vertrag löst es genauso (`Auftrag.fehler.code` ist `string`) –
  **die Enge sitzt dort, wo der Code entsteht.** Verglichen wird gegen die Code-Literale als
  Zeichenketten. **Die Union NIE ein zweites Mal in `src/renderer/**` deklarieren.**
- **Der Main validiert JEDE eingehende Nutzlast** – er vertraut dem Renderer nicht. Ungültig →
  `ungueltige_eingabe` **ohne jede Wirkung auf die Daten**. Ein Renderer-Fehler darf D1 nie beschädigen.
- **Kein stiller Fehlschlag:** jede Operation antwortet. Unerwartete Ausnahmen fängt das Gateway und
  übersetzt sie in `unbekannter_fehler` – **kein Stacktrace** in die Oberfläche.

## 5. Modulschnitt (HLD)
- **Renderer – der Rahmen:** `ipc-client` (`rufeAuf` + `abonniere`), `app-shell` (Rahmen,
  Reiter, Warteschlangen-Leiste, Undo-Stapel, Renderer-Bootstrap – s. 9l).
- **Renderer – die SIEBEN fachlichen Oberflächen** (TK 9.14.2; v3.1 fünf → sechs, v3.6 sechs → sieben):
  `composer` [P3] · `action-editor` [P2] · `vorlagen-editor` (Zonen auf einer Arbeitskopie,
  9.12/9i) · **`marken-editor`** (9.15.2, s. 9m) · `preview-player` [P5] · `queue-panel` (Sicht auf
  die Queue) · **`projekt-verwaltung`** (NEU in v3.1: anlegen, öffnen, duplizieren, löschen, beschädigte
  kennzeichnen – FA-10). **Die Shell rendert selbst KEINE Inhalte**; alles Fachliche liegt in
  diesen sieben. Vorher belegte 9.14.1 den Reiter „Projekte" mit Fachlichkeit, die keinem Modul
  gehörte – sie wäre in die Shell gewandert, obwohl sie ein **Datenverlustrisiko** trägt.
  **Dazu kommt mit v3.4 der `marken-editor`** (FA-24, 9.15.2, s. 9m) – damit sind es **SIEBEN**
  fachliche Oberflächen. **Er sitzt in einem eigenen, FÜNFTEN Reiter [Marken]** (v3.6 entschieden,
  9.14.1): [Zusammenstellen] [Aktionen] [Vorlagen] **[Marken]** [Projekte]. Wie Vorlagen und Projekte
  bleibt er **ohne offenes Projekt voll benutzbar** (app-weiter Bestand). **Undo/Redo ist in diesem
  Reiter ABGESCHALTET** – der Marken-Bestand hat in v1 bewusst keine Historie; an den Stapel des
  zuletzt aktiven Reiters gebunden widerriefe ein Klick dort die letzte Änderung an einem **Projekt**.
- **Renderer – geteilte Bausteine** (`src/renderer/**`, von mehreren Oberflächen benutzt):
  `template-canvas` (Segment/Band → PNG, **einzige Pixelquelle**, 9f) · die **gemeinsame
  Projekt-Sicht** und die **gemeinsame Vorlagen-Sicht** (Regel E1, s. 4b) · **`gemeinsam`**
  (Ordner `src/renderer/gemeinsam/`, v3.3): **kein Modul, sondern ein Ort ohne Eigentümer, aus dem
  JEDES Renderer-Modul direkt importieren darf** – er trägt, was mehrere Module benutzen und keines
  besitzt. Heute: das Register der offenen `<video>`-Handles, das **vor dem Löschen eines Mediums**
  freigegeben werden muss – sonst hält ein `<video>`-Element unter Windows ein Handle auf eine Datei,
  die der `media-service` gerade entfernen soll: `EBUSY`. *Warum nicht `src/shared/`:* Dort läge
  **Modul-Zustand**, und der Main-Prozess bekäme beim Import eine **zweite, eigene** Instanz davon –
  ein Register, das nie etwas enthält und niemandem auffällt.
- **Main:** `ipc-gateway`, `auftrags-manager` [P6] (zentraler serieller Ausführungspunkt + Speicher
  Q1–Q4), `media-service` [P1], `project-store` [D1] (besitzt DAS EINE D1-Schreib-Lock),
  `config-store` [D3], `vorlagen-store` (`vorlagen.json` app-weit, eigene Serialisierung, 9.12/9i),
  **`marken-store` [V2]** (`marken.json` app-weit, eigene Serialisierung, **löst die Marken-Vererbung
  als einzige Stelle auf**, 9.15.1/9m), `render-service` [P4], `export-service`, `ffmpeg-adapter`
  (getesteter `buildReel`-Kern).
- **Geteilt:** `contracts/types` (Project, Action, Asset, ListItem, Template, Brand, RenderRequest,
  Auftrag …). **Neu mit M7:** **`berechneBandGeometrie(höhe) → BandGeometrie`** (die **reine**
  Rechnung, s. 9h) · **`ProjektMeta`** und **`AusgabeDatei`** (die Oberfläche braucht beide, der
  Renderer darf `src/main/**` nicht importieren) · die **`media`-Adressbildung an genau EINER
  Stelle** (s. 9b, `media://`). **Merksatz:** Was Renderer **und** Main brauchen, gehört in den
  geteilten Bereich – nicht abgeschrieben, nicht zweimal gebaut.

## 6. Datenmodell-Entscheidungen
1. Medien werden ins Projekt **kopiert** (nicht referenziert). 2. Aktionen sind **referenzierbare**
Datensätze (Bibliothek je Projekt, Mehrfachnutzung erlaubt). 3. Medien liegen **pro Projekt**.
4. Segment-PNGs werden **immer neu** gerendert (flüchtig, kein Cache v1). 5. Vorlagen **datengetrieben**
ab v1 (zwei eingebaute: „Vollbild", „Split"). 6. **Marken sind APP-WEIT** (wie Vorlagen), nicht
projekt-eigen: ein Bestand in `marken.json` + `marken.json.bak`, importierte Logos und Schriften in
`marken-assets/<markeId>/` – beides im **Datenort**, nicht im Programmordner (FA-23, 9.15, s. 9m).

## 7. Render-Pfad (render-service, P4) – TK 9.2
- IPC-Granularität = **Variante A**: der Renderer rendert die Segment-PNGs (`template-canvas`,
  pixelgleich zur Vorschau) und übergibt sie als **Binärpuffer**; nur der Main schreibt/liest das
  Dateisystem. Nur Segment-PNGs gehen über IPC; Videos/Bilder liest der Main per relativem Pfad aus D2.
- `renderReel(RenderRequest) → RenderResult` + `RenderProgress`/`cancelRender`. `RenderItem` in drei
  Varianten (`video`/`bild`/`segment`), `RenderResult` in drei Stati (`erfolg`/`fehler`/`abgebrochen`).
- **Kern-Invarianten:** Normalisieren (`scale`+`pad`) erzwingt Re-Encode je Element; nur der finale
  `concat`-Schritt nutzt `-c copy` und setzt **identische** Parameter aller `seg_*.mp4` voraus
  (Codec, Profil, Auflösung, fps, Zeitbasis, Pixelformat, Streamlayout); Zwischenclips **tonlos**;
  Standbild (`bild`/`segment`) über `dauer` bei 30 fps aushalten; nur der Main am Dateisystem.
- **Staging der FERTIGEN Datei im Projekt-Ausgabeordner, NICHT in `<Temp>` (v2.8, wichtigste
  M6-Entscheidung):** In `<Temp>`/T1 liegen nur **Zwischendateien** (`seg_*.mp4`, PNGs, concat-Liste).
  Die fertige Datei entsteht als **`projects/<id>/output/<name>.mp4.part`** und wird **im selben
  Ordner** umbenannt. **Grund:** Umbenennen ist nur auf **derselben Partition** unteilbar; die App ist
  portabel, ihr Datenort kann auf dem USB-Stick liegen, `<Temp>` liegt auf `C:`. Sonst wäre der
  abschließende `rename` ein **`EXDEV`**-Fehler, und der naheliegende Ausweg „kopieren und löschen"
  hebt FA-22 / Akzeptanzkriterium 9 auf – ein Absturz mitten im Kopieren zerstört die **letzte
  funktionierende** Ausgabedatei. **Beim Entwickeln fällt das nie auf**, weil dort Temp und Daten auf
  derselben Platte liegen. **Folgen:** Abbruch und Fehlschlag räumen **auch** die `.part`-Datei weg;
  **`listeAusgaben` darf `.part` nicht listen.**
- **„Verifiziert" ist definiert (v2.8, TK 9.2.6):** einmal **`ffprobe`** auf die fertige Datei,
  Prüfung gegen das Ausgabe-Profil (**Dauer im erwarteten Rahmen, 1920×1080, 30 fps, `yuv420p`,
  Tonspur vorhanden**); erst danach ersetzt sie die vorherige Fassung, sonst `ffmpeg_fehler`. Das ist
  die **einzige** Stelle, an der ein stiller Encoder-Fehler auffällt, bevor die letzte funktionierende
  Datei überschrieben wird und die neue **ungeprüft auf den Fernseher** geht. **Keine Existenzprüfung
  daraus machen.** Die Toleranz der Dauerprüfung ist **fest 0,5 s** – **keine relative Toleranz**
  („1 % der Dauer" ließe bei einem 30-Minuten-Reel ein ganzes fehlendes Segment durch).
- **Geschlossene Fehlercode-Tabelle (v2.8, TK 9.2.3):** `medium_fehlt`, `ungueltiges_element`,
  `ungueltige_eingabe`, `ffmpeg_fehler`, `kein_platz`, `speicher_fehler`, `unbekannter_fehler`.
  **Es bleiben SIEBEN. `marken_datei_fehlt` gehört NICHT dazu** (v3.7; v3.6 hatte ihn kurzzeitig als
  achten Code geführt – **zurückgenommen**). **Der `render-service` bekommt nie eine Marken-Datei zu
  sehen:** Bei Variante A liefert der Renderer alle gezeichneten Pixel als fertiges PNG, und der
  einzige verbleibende Marken-Bezug – die Restflächen-Farbe – reist als **fertiger Hex-Wert** im
  Auftrag mit (`einblendung.flaecheDunkel`, s. 9h). Eine Datei-Prüfung hier bräche einen Lauf ab,
  dessen PNGs bereits **fertig und korrekt** sind. Die Prüfung sitzt im **Renderer vor dem Zeichnen**
  (9.15.3, s. 9f/9m).
  **`abgebrochen` ist KEIN Fehlercode, sondern ein Status.** Die betroffene Element-ID reist als
  **`Auftrag.fehler.daten = { elementId }`** (9.1.1) – ohne diesen Weg erreichte sie die Oberfläche
  nie, obwohl der Reparatur-Modus (FA-19) die Stelle benennen muss.
- **`historieEintrag` gibt es NICHT mehr (v2.8, ersatzlos gestrichen).** Das `RenderResult` liefert
  **vier** Nutzdaten: **Pfad, `ausgabeName`, Größe und Gesamtdauer** (`ausgabeName` seit v3.2, 9.2.3 –
  der **tatsächlich verwendete** Name **ohne** Endung, derselbe Wert, der im `RenderRequest` stand);
  den **Q3-Eintrag baut die Auftragsverwaltung selbst** (Abschnitt 8).
  Zwei Quellen für dieselbe Information laufen auseinander – und **Q3 ist dauerhaft**. Q3
  protokolliert auch **Fehlschlag und Abbruch**; dort bleibt nur `ausgabe` `null`.
- **`render:fortschritt` ist ein anzumeldender Kanal (v2.8, TK 9.2.7).** Nutzlast war seit je
  definiert, der Empfänger existiert seit M5 (`abonniere`, `#151`) – **es fehlte allein der Sender**.
  Daneben behält die Warteschlange ihren groben Prozentwert (`Auftrag.fortschritt`).
- **ffmpeg-Aufrufe: die Position eines Arguments entscheidet über seine Bedeutung.** `-ss` **vor**
  dem zugehörigen `-i` ist eine **Eingangs**-Option; steht es zwischen zwei `-i`, gehört es dem
  **falschen** Eingang, und der Ausschnitt beginnt bei Frame 0 – **richtige Länge, falscher Inhalt**,
  von einer Dauerprüfung **nicht** zu bemerken. Ein Argument-Array ist nie „nur eine Liste".
  Ebenso bindend: **`-progress` muss gesetzt sein**, sonst ist die gesamte Fortschrittskette tot –
  `-loglevel error` unterdrückt zusätzlich die voreingestellte Statuszeile.

## 8. Auftragsverwaltung (auftrags-manager, Prozess P6) – TK 9.3  ⟵ NEU, zentral
- **Mehr als eine Queue: ein Verwaltungs-Subsystem** mit vier Aufgaben: (1) Torwächter/Zulassung –
  gibt Prozesse **seriell** frei, max. EIN Auftrag `laeuft` (NFA-09, einziger Sperr-Mechanismus, **kein
  zweites Lock**); (2) Zustandsführung; (3) Wiederholung von Fehlschlägen; (4) Persistenz-Hoheit.
- **Einziger** Ausführungspunkt für: `import`, `loeschen` (Medium), `render`, `export`. Daraus folgt:
  `loeschen` läuft nie parallel zu `render` (es wartet) → löst das Windows-`EBUSY`-Problem.
- **VIER eigene Speicher, jeweils eigene Persistenz:**
  - **Q1 Aktive Warteschlange** – anstehende + laufender Auftrag – *flüchtig (RAM)*, nach Neustart leer.
  - **Q2 Wiederholungs-Speicher** – Fehlschläge (`payload`,`fehler`,`versuche`) + `pendingDeletions` –
    *persistent bis erledigt* (überlebt Neustart, weg nach Erfolg/Verwerfen) – `projects/<id>/queue-retry.json`.
  - **Q3 Ausführungs-Protokoll** – *dauerhaft, UNBEGRENZT* – `protokoll.json` (app-weit).
    **Ein Eintrag je BEENDETEM Versuch** (nur `erfolg`/`fehlgeschlagen`/`abgebrochen`). Wiederholung erzeugt
    einen NEUEN Eintrag mit höherem `versuch` → Fehlerhistorie bleibt sichtbar, auch wenn Q2 geleert wird.
    `ProtokollEintrag { id, auftragId, art, projektId, versuch, begonnenAm, beendetAm, ergebnis, fehler,
    ausgabe{pfad,dateigroesse,gesamtdauer}|null }` – enthält die Ausgabe-Historie (früher D3) als Teilmenge.
    **`gesamtdauer` ist `number | null` (v2.8):** Beim `export` ist sie `null` – er kopiert eine fertige
    Datei und kennt ihre Spieldauer nicht; **sein Zielpfad steht im Feld `pfad`** (der **vollständige
    Pfad der Zieldatei**, nicht nur der Zielordner). **Niemals eine Dauer schätzen** – der Eintrag ist
    dauerhaft. Den Eintrag baut die Auftragsverwaltung **selbst**; die Fachdienste liefern **keinen**
    Historie-Eintrag mit (`historieEintrag` ist in v2.8 ersatzlos gestrichen).
  - **Q4 Warteschlangen-Journal** – *dauerhaft, ROTIEREND* (letzte N) – `warteschlangen-journal.json` (app-weit).
    `JournalEintrag { zeit, auftragId, bewegung, position }` mit `bewegung: eingereiht|gestartet|entfernt|
    erneut_eingereiht`. Rein **diagnostisch**.
  - **Warum Q3/Q4 getrennt:** Q3 = „was wurde produziert" (nutzerlesbar), Q4 = „was passierte in der Schlange"
    (Diagnose). Zusammen in einem Speicher würde die Historie im Bewegungsrauschen untergehen.
  - **Ein Auftrag, der die Schlange nie verlassen hat, erzeugt KEINEN Q3-Eintrag** – nur Q4-Bewegungen.
  - **`pendingDeletions` sind KEINE Aufträge** (v2.4, 03.08.): Die Auftragsverwaltung **verwahrt** sie nur in Q2
    und bietet dem `media-service` **main-intern** (kein IPC-Kanal) Lesen/Ergänzen/Streichen an; **ausgeführt**
    wird die offene Löschung vom **Reconcile des `media-service`** beim Projektöffnen (9.4.7). Grund: Ein
    `loeschen`-Auftrag beginnt mit dem Entfernen des D1-Eintrags – der ist längst weg, ein erneut eingereihter
    Auftrag scheiterte deterministisch mit `asset_nicht_gefunden`.
- `Auftrag`: `auftragId`, `art`, `status` (`anstehend`/`laeuft`/`erfolg`/`fehlgeschlagen`/`abgebrochen`),
  `label`, `payload` (Request des Fachdiensts, vollständig aufbewahrt → Wiederholen ohne Neu-Eingabe),
  `fortschritt`, `versuche`, `fehler`, **`ergebnis`**, `erstelltAm`.
  **`ergebnis` (NEU in v2.5):** die fachlichen Nutzdaten bei Erfolg – `import` → der fertige `Asset`,
  `loeschen` → `{ assetId }`, `render` → **Pfad/Ausgabename/Größe/Dauer**, `export` →
  `{ zielPfad, dateigroesse }`; sonst `null`. Ohne dieses Feld erführe die Oberfläche nie, was ein
  Auftrag hervorgebracht hat. **Der `ausgabeName` reist NUR hier** (v3.2, 9.3.6): Über ihn erfährt die
  Oberfläche, welcher Name tatsächlich verwendet wurde, und hält ihre Vorbelegung mit
  `Project.letzterAusgabeName` (FA-22) im Gleichklang. **In `ProtokollEintrag.ausgabe` steht er NICHT**
  – dort ist er bereits Teil des Pfades; ein zweites Feld wäre genau die Doppelführung, die schon
  `historieEintrag` und `position` entfernt hat.
  **`versuche` steigt beim START einer Ausführung**, nicht beim Wiedereinreihen (9.3.3).
- IPC: `reiheEin(art,payload)→{auftragId}`, `entferne(auftragId)`, `wiederhole(auftragId)` (→ selber
  Eintrag ans Ende, `versuche`+1, KEIN Duplikat), `holeStand()→Auftrag[]`, Push `QueueGeändert(Auftrag[])`.
- **Render friert seinen Eingang beim Einreihen ein** (Liste+Profil als Snapshot; spätere Edits ändern
  einen eingereihten Render nicht). **Folge (v2.8):** Auch `art` und `höhe` der Band-Vorlage werden
  beim Einreihen **abgeleitet und mitgeführt** – s. 9h.
- **Sofort-Flush von D1: erster Schritt IM HANDLER (v2.8, TK 9.3.3/9.5.4)** – nach dem Statuswechsel,
  **bevor** der `render`- bzw. `export`-Handler irgendetwas tut; scheitert er → `speicher_fehler`,
  Ziel unberührt. **Der Torwächter darf ihn NICHT auslösen:** sein Auswahl- und
  Statuswechsel-Abschnitt ist bewusst **synchron**, ein `await` darin bräche die serielle Invariante
  **lautlos**. **Beim Einreihen zu flushen ist ebenso falsch:** Die Schlange ist streng seriell,
  zwischen Einreihen und Start können **Minuten** liegen, in denen der Nutzer weiterarbeitet – ein
  Flush beim Einreihen schriebe einen überholten Stand fest und verlöre genau diese Arbeit.
- **Instant-Operationen sind KEINE Aufträge** (reine D1-Schreibvorgänge, Millisekunden): Aktion
  anlegen/bearbeiten, Liste umsortieren, Trim setzen, **Aktion** löschen, Datei-Dialog. Laufen direkt
  über das eine `project-store`-Lock, erscheinen nicht im `queue-panel`. Auch die **Vorschau** (P5) ist
  kein Auftrag.

## 9. media-service (P1) – TK 9.4  ⟵ NEU
- **Besitzt:** D2-Dateizugriff (kopieren/löschen), ffprobe beim Import, Datei-Dialog, Reconcile beim
  Projektstart. D1-Schreibvorgänge delegiert er an `project-store` (dessen Lock).
- **Besitzt NICHT:** Lesen der Asset-Liste; Sonderbehandlung von Aktions-Bildern; jede
  Normalisierung/Konvertierung der Quelldatei (bleibt **roh**; Normalisieren erst zur Render-Zeit).
- **Format-Whitelist:** Video = MP4 (H.264/H.265); Bild = JPG/PNG/WebP. Kein MKV/MOV/AVI (Vorschau
  `<video>` bliebe je nach OS lautlos schwarz). Filter & Import-Prüfung lesen **einen** konstanten Wert
  aus `contracts/types`.
- **Import (atomar):** Kopie → `media/.staging/<uuid>.<ext>.part` → ffprobe **mit Timeout** →
  `fs.rename` (atomar, gleiche Partition) → **[D1-Lock]** Asset schreiben. Alles Langsame **außerhalb**
  des Locks.
- **Löschen (D1 zuerst):** **[D1-Lock]** Referenzen prüfen + Eintrag entfernen im **selben** kritischen
  Abschnitt (schließt TOCTOU gegen `composer`) → dann `fs.unlink` **außerhalb** des Locks, auf Windows
  **Retry+Backoff** bei `EBUSY`/`EPERM` → bei endgültigem Fehlschlag `pendingDeletions` (Q2, projekt-
  persistent, s. Abschnitt 8), Reconcile beim Start holt nach. **Trade-off bewusst:** Referenz-Konsistenz > Aufräum-Sauberkeit (nie kaputter
  Render; kurzzeitige Waise akzeptiert).
- **Reconcile beim Start** (kein Handle aktiv): Waisen/`.part` löschen; D1-Eintrag ohne Datei →
  `Asset.zustand="fehlt"` (Render bricht früh mit `medium_fehlt` ab); `pendingDeletions` nachholen.
- **`Asset`:** `id` (UUID), `typ`, `dateiname` (`<uuid>.<ext>`, **ohne** Verzeichnisanteil), `originalname`,
  `maße` (**Display**-Maße, Rotation `90/270` → tauschen, ganzzahlig), `dauer` (Sekunden, **3 Dezimalen**,
  Bild `null`), `importdatum`, `zustand` (`ok`/`fehlt`).
- **Cross-Platform-Invarianten (Agents brechen die sonst):** `dateiname` separatorfrei, Auflösung per
  `path.join`; ffprobe/ffmpeg-Argumente NIE per String-Konkatenation, immer **Argument-Array** (Windows
  Leerzeichen-Pfade); `maße` = Display-Maße (nie roh `stream.width/height`); `dauer` nie auf Integer
  runden; **kein zweites Lock / keine OS-Dateisperren** (Over-Engineering-Falle).

## 9b. project-store [D1] & config-store [D3] – TK 9.5
- **`project-store`** besitzt `project.json` je Projekt **und das eine D1-Schreib-Lock** (nur für
  `project.json`; Q2/Q3 haben eigene Serialisierung). Aktives Projekt **in-memory** (Quelle der Wahrheit
  zur Laufzeit), nur eines geladen. Projekt-Liste (FA-10) = Metadaten aus `projects/`.
- **Instant-Operationen** (nicht Queue): Projektverwaltung (erstelle/öffne/liste/dupliziere/lösche),
  Aktion CRUD, Liste (fügeHinzu/entferne/ordneNeu/setzeTrim/setzeDauer). Validierung: Trim `0≤start<ende≤Videodauer`;
  Dauer Bild/Segment 10–45 s.
- **Zwei weitere Instant-Operationen (9.5.2, NEU in TK v2.7, 04.08.)** – beide fehlten in der als
  **vollständig** geführten Operationsliste und wurden erst beim M5-Prüflauf gefunden:
  - **`setzeEinblendung(elementId, einblendung: Einblendung | null) → Ergebnis<Listenelement>`** –
    **nur bei `art: "video"`**; setzt Band-Vorlage und Abschnittsfolge **in einem Zug** (FA-20, 9.2.8).
    Die **Bandhöhe kommt ausschließlich aus der Vorlage** und ist **kein** Wert am Listenelement.
    Wird das Band leer, ist `einblendung = null`; das **Videoelement bleibt** (9.5.3). Ohne sie wäre
    FA-20 (Split-Screen, die **Hauptbetriebsart**) gar nicht bedienbar gewesen, obwohl 9.7.2 sie
    ausdrücklich verlangt.
  - **`setzeElementReferenz(elementId, referenz) → Ergebnis<Listenelement>`** – setzt die Referenz
    eines **bestehenden** Elements um, **ohne** seine Position und seine `id` zu verlieren. Der
    Zielbestand folgt der `art`: `video`/`bild` → Asset in `Project.assets` mit passendem `typ`,
    **`segment` → Aktion in `Project.aktionen`** (eine **Aktions**-ID, keine Asset-ID!). Bei `video`
    werden `trimStart`/`trimEnde` auf `null` **zurückgesetzt**, weil sie sich auf die alte Quelllänge
    bezogen. Sie trägt die Fix-Optionen „neu verknüpfen/importieren" und „ersetzen" des
    Reparatur-Modus (FA-19, 9.7.5) – **ohne sie war von drei Fix-Optionen nur „entfernen"
    ausführbar** und Akzeptanzkriterium 7 unerfüllbar. Verschärfend: Ein Neuimport vergibt eine
    **neue** UUID (9.4.4), das Element hätte sonst weiter auf das fehlende Asset gezeigt.
  - Beide brauchen einen **IPC-Kanal** (9.1.1 Punkt 4) – verdrahtet in M5-34 (`#153`), zusätzlich zu
    den vierzehn `project`-Kanälen aus `#76`.
- **Drei weitere Operationen (9.5.2, NEU in TK v3.1, 04.08.):**
  - **`setzeBearbeitungsstand(stand) → Ergebnis<Projekt>`** – der **Rückschreib-Weg für
    Undo/Redo** (9.13.2). Ersetzt `aktionen` **und** `liste` **als Ganzes** durch einen
    Schnappschuss, unter dem D1-Lock und **voll validiert** (jede Referenz auflösbar, jede Dauer im
    Bereich, jede `art` gültig, `id`s eindeutig). **AUSDRÜCKLICH NICHT enthalten: `assets` und
    `letzterAusgabeName`** – beide werden von **Aufträgen** verändert (Import, Löschen, Render), und
    Aufträge sind nach 9.13.3 **nicht undo-fähig**. Ein Undo, das sie mitzöge, ließe ein
    importiertes Medium aus dem Datenbestand verschwinden, während seine **Datei weiter auf der
    Platte liegt** – eine Waise, die der Reconcile still löscht. **Warum ein Schnappschuss und
    keine inverse Operation:** 9.13.2 verbietet inverse Operationen ausdrücklich; `entferneElement`
    ließe sich nicht umkehren (`fügeElementHinzu` vergibt eine **neue** UUID und hängt **ans Ende** –
    Position und Identität sind weg), und die Kaskade von `löscheAktion` (Listenelemente **und**
    Band-Abschnitte) erst recht nicht. Undo nimmt **denselben Pfad** wie eine normale Änderung,
    damit das Auto-Speichern anspringt.
  - **`öffneProjektordner(projektId) → Ergebnis<void>`** – öffnet den Projektordner im
    Datei-Explorer des Betriebssystems, angeboten bei einem **beschädigten** Projekt. Gehört zum
    `project-store`, **weil er die Pfad-Autorität ist** (9.5.7); im Renderer nicht baubar – er kennt
    keine Pfade. Ohne sie bliebe die v3.0-Entscheidung („beschädigtes Projekt **listen** statt
    weglassen") eine bloße Auskunft: Den Ablageort der portablen App kennt der Nutzer typischerweise
    nicht, und die App zeigt ihm absichtlich **nirgends** einen absoluten Pfad.
  - Beide brauchen einen **IPC-Kanal** – verdrahtet in `#240`, zusätzlich zu den vierzehn Kanälen
    aus `#76` und den zweien aus `#153`.
- **`listeProjekte` / `ProjektMeta` (v3.0 + v3.1):** Ein Projekt mit **beschädigter `project.json`
  wird MIT WARNHINWEIS GELISTET, nicht weggelassen** – Feld **`beschaedigt: boolean`**, Eintrag mit
  dem **Ordnernamen** als Behelfs-Bezeichnung, nicht zu öffnen. Ein weggelassenes Projekt sähe für
  den Nutzer aus wie ein **verlorenes**, obwohl seine Medien und Ausgaben unversehrt im Ordner
  liegen; es wäre zudem der einzige Ort, an dem ein Datenfehler **ohne jede Meldung** verschwindet.
  **`listeProjekte` NIMMT das D1-Lock, obwohl sie nur liest** (bewusste Ausnahme gegenüber
  `listeAusgaben`): Ein Verzeichnis-Scan während einer laufenden `dupliziereProjekt` läse sonst ein
  **halbkopiertes** Projekt ein und meldete es als beschädigt, obwohl es Minuten später vollständig
  in Ordnung ist. **Zwei weitere Felder (v3.1): `anzahlMedien` und `anzahlAusgaben`, beide AUS DEM
  ORDNER GEZÄHLT**, nicht aus `project.json` – die Zahlen müssen auch für ein **beschädigtes**
  Projekt stimmen, dessen `project.json` unlesbar ist. Sie speisen die Löschbestätigung, die
  **Projektname, Medienzahl, Ausgabenzahl und die Unumkehrbarkeit** nennt: Der Ordner enthält
  **alle** importierten Medien und **alle** fertigen Ausgabedateien, 9.13.3 schließt Undo dafür aus,
  und eine schlichte Ja/Nein-Abfrage sieht bei einem leeren Probeprojekt aus wie bei drei Wochen
  Arbeit.
- **Auto-Speichern:** entprellt **3–5 s** + **Sofort-Flush** vor Render/Export, bei Projektwechsel, beim
  Beenden (App **blockiert**, bis geschrieben). **Atomar** (temp+rename). **Backup** `project.json.bak`:
  Laden defekt → aus `.bak`, sonst **Fehler melden** (nie leer/verlustbehaftet starten). `schemaVersion`
  in jeder Datei (höher→Fehler, älter→Migration).
- **Scheitert der Sofort-Flush BEIM BEENDEN, schließt die App NICHT (v3.1, festgelegte
  Reihenfolge):** (1) die App schließt **nicht**, die Änderungen bleiben im Speicher; (2) der Fehler
  wird mit einer **auf die Ursache zugeschnittenen Handlungsempfehlung** gezeigt („Die Platte ist
  voll. Schaffen Sie Platz und versuchen Sie es erneut." / „Der Speicherort ist nicht erreichbar.
  Stecken Sie den Datenträger wieder ein."); (3) ein Knopf **„Erneut versuchen"** stößt den
  Schreibversuch neu an; (4) daneben der **ausdrücklich benannte** Ausweg **„Trotzdem schließen und
  Änderungen verwerfen"**. **Weder still schließen noch endlos blockieren:** Stilles Schließen
  widerspricht der zugesagten Verlustfreiheit (FA-15, NFA-02) – der Nutzer beendet normal und findet
  beim nächsten Start einen alten Stand vor; bloßes Blockieren ohne Ausweg lässt ihn vor einem
  Programm sitzen, das sich nicht mehr schließen lässt. **Der eigentliche Wert ist der
  Wiederholen-Knopf:** volle Platte und abgezogener Datenträger sind in einer Minute behoben, und
  dann muss **nichts** verloren gehen.
- **Lösch-Asymmetrie (wichtig):** **Medium** löschen **blockiert** bei Referenz (9.4.6). **Aktion** löschen
  **kaskadiert**: Aktion + referenzierende Listenelemente weg, aber die
  **Medien-Assets bleiben** projektweit (Aktion referenziert Asset nur, besitzt es nicht).
  **Rückgabe seit v3.2 (9.5.2/9.5.3):** `Ergebnis<{ stand: Bearbeitungsstand, entfernteElementIds:
  string[], geaenderteElementIds: string[] }>` – **`stand` ist der vollständige neue Stand** nach der
  Kaskade (Aktions-Bibliothek **und** Wiedergabeliste), die beiden Kennungslisten beschreiben, **was
  sich geändert hat**. Beides wird gebraucht, aber für Verschiedenes: Der **Stand** aktualisiert die
  Sicht und löst damit den Undo-Schnappschuss aus (9.13.2) – aus den Kennungen allein ist er **nicht**
  rekonstruierbar –, die **Kennungen** erklären dem Nutzer die Wirkung. `geaenderteElementIds` sind
  Videos mit **gekürztem Band** (9.5.3).
- **`config-store`** besitzt `config.json` (aktives Projekt, Export-Ziel, UI-Voreinstellungen).
  **Die Marke liegt seit v3.4 NICHT mehr hier** (9.5.6): Sie ist ein app-weiter **Bestand** und gehört
  dem `marken-store` (9.15.1, s. 9m); `leseMarke` ist dorthin gewandert und trägt jetzt eine `markeId`.
  **`AppKonfig` führt das Feld ausdrücklich NICHT** – lägen `leseKonfig().marke` und `leseMarke(...)`
  nebeneinander, könnten sie auseinanderlaufen, ohne dass etwas bricht.
  Sitzungswiederherstellung (FA-15): aktives Projekt beim Start laden; fehlt → sanfter Rückfall, kein Absturz.
  Der Rückfall wird im Renderer über **`leereProjektSicht()`** hergestellt (v3.2, 9.7.4, s. 9d).
- **Pfad-Autorität & `media://` (9.5.7, wichtig):** `project-store` löst `(projektId, dateiname) → absoluter Pfad`
  auf – **einzige** Quelle der Wahrheit fürs Datei-Layout. media-service/render-service/export-service
  resolven **über** ihn (kennen das Layout nicht selbst). Der **Renderer** lädt Medien (Vorschau/Thumbnails)
  **nur lesend** über das Main-Protokoll `media://<projektId>/<dateiname>` – nie absolute Pfade, kein
  `..`-Ausbruch, read-only. „Nur der Main berührt das Dateisystem" bleibt gewahrt.
- **`listeAusgaben(projektId) → Ergebnis<AusgabeDatei[]>` (9.5.2, v2.4, 03.08.):** listet `projects/<id>/output/`
  (`{dateiname, dateigroesse, geaendertAm}`, absteigend nach `geaendertAm`, nur fertige `.mp4`, fehlender Ordner
  = leere Liste). **Einzige** Quelle für die Ausgabe-Liste (FA-22) **und** die Dateiauswahl beim Export (9.6.1).
  **NICHT** aus Q3 speisen – Q3 ist Historie/Nachweis, `listeAusgaben` zeigt den Ist-Bestand. Reiner Lesezugriff,
  **ohne** D1-Schreib-Lock. Beim `project-store`, weil er die Pfad-Autorität ist.

## 9b2. Ausgabedateien: mehrere je Projekt (FA-22) – TK 9.2.1/9.2.6, AD 4.7  ⟵ NEU 02.08.
- Ausgabeordner ist **projektbezogen**: `projects/<id>/output/`. NICHT app-weit – sonst überschreibt ein
  Render in Projekt B die noch nicht exportierte Datei von Projekt A.
- `RenderRequest.ausgabeName` (Dateiname **ohne** Endung) bestimmt das Ziel. Vorbelegt mit
  `Project.letzterAusgabeName` → gleicher Name **ersetzt** die vorige Fassung, neuer Name legt eine
  zusätzliche Datei an. **Kein Zeitstempel im Namen** – Datum zeigt die UI aus dem Q3-Protokoll.
  **Der Rückweg (v3.2, s. 7/8):** Welcher Name **tatsächlich** verwendet wurde, erfährt die Oberfläche
  über **`ausgabeName` im Render-Ergebnis** (`RenderResult` → `Auftrag.ergebnis`). Ohne ihn schlüge sie
  beim nächsten Render weiter den **alten** Namen vor – der Nutzer überschriebe also nicht die Datei,
  die er überschreiben wollte, oder legte versehentlich eine zweite an.
- **Atomar, alte Fassung geschützt:** ffmpeg schreibt NIE direkt auf den Zielnamen, sondern
  **auf `<name>.mp4.part` IM Ausgabeordner selbst** (`projects/<id>/output/`, **korrigiert in v2.8** –
  vorher stand hier T1); erst die fertige, **verifizierte** Datei (ffprobe-Prüfung, s. Abschnitt 7)
  wird per Rename-mit-Ersetzen **im selben Ordner** auf den Zielnamen gebracht. Ein Fehlschlag lässt
  die vorhandene Datei unversehrt. **Ohne diese Regel zerstört ein misslungener Probelauf die letzte
  funktionierende Ausgabe.** **Warum nicht T1/`<Temp>`:** Rename ist nur auf **derselben Partition**
  unteilbar – bei portabler App auf dem Stick wäre es `EXDEV`, und „kopieren und löschen" hebt den
  Schutz auf. In T1 bleiben nur die **Zwischen**dateien. Abbruch/Fehlschlag räumen die `.part` weg;
  **`listeAusgaben` listet `.part` nicht**.
- **Name ist Nutzereingabe → validieren:** kein Pfadtrenner, kein `..`, keine für Windows/macOS/FAT32
  unzulässigen Zeichen (`< > : " | ? *`, Steuerzeichen), nicht leer, keine reservierten Windows-Namen
  (`CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`, `LPT1`–`LPT9`). Aufgelöster Pfad muss **innerhalb**
  `projects/<id>/output/` liegen. Verstoß → `ungueltige_eingabe` ohne Wirkung.
- **`dateiname` gehört NICHT ins `RenderProfile`** – das Profil ist fest, der Name wechselt je Lauf.
- Am TV: mehrere Dateien erlaubt, Personal wählt aus; **„Repeat One", nicht „Repeat All"**, sonst
  durchläuft der Player den Ordner und zeigt bei jedem Wechsel die Bedienleiste (Risiko R-04).

## 9c. export-service – TK 9.6
- Kopiert eine **gewählte** Datei aus `projects/<id>/output/` → USB/Zielordner als **Auftrag** (`art: export`, seriell nach Render,
  Fehlschlag → Q2-Retry). `wähleExportZiel` instant (letztes Ziel aus `config-store`).
- **Ablauf:** Quelle prüfen (`keine_ausgabe`) → **Ziel VORAB prüfen** (FAT32 + Datei > 4 GB →
  `datei_zu_gross_fat32`; freier Platz) → Kopie nach `<dateiname>.part` → Größe verifizieren + **`fsync`** →
  **atomar** Rename-mit-Ersetzen (Windows-Retry bei `EBUSY`).
- **Invarianten:** vorhandene Zieldatei gleichen Namens **nie** löschen, bevor die neue vollständig+
  verifiziert ist (nie eine halbe Datei für den TV); `fsync` vor Erfolg (Stick-Abzug); **Zielname =
  Quellname** – der frühere Zwang auf `loop.mp4` ist ENTFALLEN (FA-22), mehrere Dateien dürfen auf dem
  Stick liegen; Name ist Nutzereingabe → validieren (keine Pfadtrenner, kein `..`); Rename-mit-Ersetzen
  plattformsicher. Kein zweites Lock (Serialisierung via Queue).
- **Quelldatei NUR über die Pfad-Autorität auflösen (v2.8):** Endung abschneiden und
  **`loeseAusgabePfad`** benutzen; Dateinamen **ohne** `.mp4` werden abgewiesen. **Kein eigenes
  `join`** – sonst baut man den Pfad selbst zusammen und **umgeht die Schranke gegen Pfad-Ausbrüche**,
  die genau dort und nur dort sitzt.
- **`speicher_fehler` ist der SIEBTE Fehlercode (v2.9, TK 9.6.4):** der **Sofort-Flush von D1**
  scheitert – er läuft als **erster Schritt im `export`-Handler**, bevor irgendetwas kopiert wird
  (Abschnitt 8). Das **Ziel bleibt unberührt**. **Nicht** `schreib_fehler` nehmen: der meint das
  **Kopieren**, die übrigen fünf Codes betreffen das **Ziel** – der Flush aber den **Datenort**.
  Render-Pfad und `media-service` nennen dieselbe Ursache längst `speicher_fehler`; **dieselbe
  Ursache bekommt denselben Namen**, und der Code steht **dauerhaft** in Q3.

## 9d. composer [P3] (Renderer) – TK 9.7
- Renderer-UI zum **Zusammenstellen**: Bibliothek → geordnete Liste, dnd-kit reorder, Dauer/Trim-Regler
  (4.4), Gesamtlänge + 30-min-Warnung, Render/Export auslösen.
- **Grenze:** rendert **keine** Pixel (template-canvas/preview), bearbeitet **keine** Aktions-Inhalte
  (action-editor), **kein** FS/ffmpeg. Löst Instant-Mutationen (project-store 9.5.2) + Aufträge (queue) aus.
- **Optimistisch mit Abgleich.** Zwei Fehlerklassen: (1) Op **synchron abgelehnt** (ungültiger Wert) →
  **Rollback** + Inline-Meldung; (2) **Auto-Save asynchron fehlgeschlagen** (9.5.4) → **kein Rollback**,
  dauerhafter „nicht gespeichert"-Hinweis + Retry (NFA-02). Merksatz: synchron ablehnen→Rollback;
  nicht-speichern-können→warnen, nie Arbeit verwerfen.
- **Invarianten:** Gesamtlänge **frame-gerundet** (== render 9.2.6); project-store = Wahrheit (nach
  Mutation abgleichen); Thumbnails **renderer-seitig ohne ffmpeg** (Video `<video>`+Canvas auf trimStart,
  Segment template-canvas, Bild `<img>`); Render friert Liste beim Einreihen ein (9.3.5).
- **Reparatur-Modus (9.7.5, wichtig):** kaputte Elemente (`fehlt`-Asset) werden nicht nur blockiert – der
  Nutzer wird in den Bearbeitungsmodus **zurückgeleitet und geführt**: kaputte Elemente **eins nach dem
  anderen** hervorheben („X von N behoben"), pro Element Fix-Optionen (**neu verknüpfen/importieren**,
  **ersetzen**, **entfernen**); Render erst frei, wenn **alle** behoben. Nutzt bestehende Ops (media-service,
  project-store). **Konkret (v2.7):** „neu verknüpfen/importieren" und „ersetzen" laufen über
  **`setzeElementReferenz`** (9.5.2, s. 9b), „entfernen" über `entferneElement`. **Seit v3.4 deckt der
  Reparatur-Modus auch `marken_datei_fehlt` mit ab** (9.15.3): Es ist dieselbe Klasse – eine Referenz
  zeigt ins Leere.
- **Die gemeinsame Sicht lässt sich leeren – `leereProjektSicht()` (v3.2, 9.7.4, bindend).** Neben dem
  Weiterschalten auf einen neuen Stand gibt es **genau eine** Operation, die die Sicht in den Zustand
  **„kein Projekt geladen"** zurückversetzt; sie nimmt keinen Eingang und liefert nichts. Gerufen wird
  sie, wo ein Projekt **aufhört, offen zu sein**, ohne dass ein anderes an seine Stelle tritt – vor
  allem nach `löscheProjekt` auf das **aktive** Projekt und bei der Sitzungswiederherstellung (9.5.6).
  **Ausdrücklich VERBOTEN ist die naheliegende Notlösung**, statt dessen ein **leeres Projekt mit
  erfundener Kennung** in die Sicht zu setzen: Das sähe richtig aus, aber jede folgende
  Instant-Operation liefe in `nicht_gefunden`, und das Auto-Speichern legte womöglich einen
  Projektordner an, den **niemand angelegt hat**.
- **Zeichenvoraussetzungen vor dem ersten Thumbnail (M5-35, `#154`):** Marken-Schriften, Logo und
  Motive müssen **geladen** sein, bevor der composer zeichnet. Wer den composer öffnet, **ohne**
  vorher im Aktions-Editor gewesen zu sein, zeichnete sonst für jedes Bild einen **Platzhalter** –
  und **9.10.7 verbietet den Platzhalter im finalen Render**. **Seit v3.4 ist das nicht mehr EINE
  Marke:** Zu laden ist je gezeichneter Fläche die **richtige** (Aktions-Marke bzw.
  Projekt-Standardmarke, 9.15.4, s. 9m) samt ihren **importierten** Schriften (9.15.3); und `logo`
  kann `null` sein – dann greift das **Ersatz-Logo** (9.10.10, s. 9f), kein Platzhalter.

## 9e. preview-player [P5] (Renderer) – TK 9.9
- **UI-Simulation ohne ffmpeg** (16:9-Bühne), Transport (Play/Pause, Zeitleiste, aktuelles Element, Gesamtdauer).
  **Kein** Auftrag (interaktiv, unabhängig).
- Segment via `template-canvas` (pixelgleich); Bild `<img>` contain-auf-Schwarz; Video `<video>` trimStart→trimEnde;
  **alle Medien über `media://`** (9.5.7), nie absolute Pfade.
- **Im Split-Modus zeigt auch die Vorschau die Restflächen in `flaecheDunkel`** (v2.8, 9.9.2) – nicht
  schwarz. Sonst laufen Vorschau und Render an genau der Stelle auseinander, die der Nutzer am
  häufigsten sieht (Split ist die **Hauptbetriebsart**). **Die Farbe kommt aus der
  Projekt-Standardmarke** (`Project.standardMarkeId`, 9.15.4), nicht aus der Marke der gerade
  sichtbaren Aktion – **Vorschau und Vorschaubilder nehmen dieselbe Marke wie der Render, nie eine
  andere.**
- **Zeitleiste frame-gerundet** (== render 9.2.6, composer 9.7.4); native Wiedergabe Best-Effort. Kaputte
  Elemente → Platzhalter (Reparatur im composer 9.7.5). Grenze (Abschnitt 8): nicht farb-/bitraten-genau,
  finale Kontrolle bleibt die gerenderte Ausgabedatei.

## 9f. template-canvas (Renderer, geteilt) – TK 9.10  ⟵ EINZIGE PIXELQUELLE
- `zeichneSegment(aktion, vorlage, marke)` → **Canvas 1920×1080**. `marke` ist die **fertig aufgelöste**
  Marke aus `leseMarke(markeId)` (9.15.1) – **welche** Marke das ist, entscheidet nicht dieses Modul,
  sondern die Tabelle in 9.15.4 (Aktions-Segment → `aktion.markeId`; Band-Hintergrund und
  Split-Restflächen → `Project.standardMarkeId`; s. 9m). Zwei Verwendungen aus **demselben**
  Aufruf: **Anzeige** (nur per CSS herunterskaliert) und **Export** `alsPng(...)` → PNG-Bytes für den
  RenderRequest. **KEIN zweiter Zeichenpfad** – sonst bricht die Pixelgleichheit.
- Konsumenten: `action-editor` (Live-Vorschau), `composer` (Thumbnails), `preview-player`, finaler Render.
- **Determinismus (bindend):** immer bei 1920×1080 zeichnen (nie kleiner + hochskalieren) · **`devicePixelRatio`
  ignorieren** (feste Backing-Größe) · **Schriften VOR dem Zeichnen geladen** (Fallback-Schrift = Vertragsbruch)
  · **Bild VOR dem Zeichnen dekodiert** (via `media://`) · gleiche Eingabe → gleiches Bild (kein Zufall/Zeit/
  Datum) · **kein persistenter Cache**. Export = PNG, sRGB.
- **Die vier OFL-Schriften und das Fitnessworld24-Logo werden GEBÜNDELT** mitgeliefert (Playfair Display
  ist auf Win/macOS nicht vorinstalliert) und per `FontFace` geladen – sonst still Fallback-Schrift →
  Vorschau ≠ Endvideo + Markenbruch. **Seit v3.4 ist das nicht mehr der einzige Fall (9.10.4/9.15.3):**
  **Importierte** Schriften werden **je Marke** registriert und geladen, **bevor die erste Zone
  gezeichnet wird**, und der Nachweis über `document.fonts.check()` gilt für sie mit. **Fehlt eine
  importierte Datei, entsteht GAR KEIN Segment-PNG** (v3.7) – der `composer` führt in den
  Reparatur-Modus (9.7.5), und der Auftrag wird **nicht eingereiht**. **Kein** stiller Rückfall auf die
  gebündelte Schrift; der zeigte den Markenbruch erst am Fernseher. *(Bis v3.6 stand hier „bricht der
  Render früh ab, vor dem ersten ffmpeg-Aufruf" – das war die falsche Stelle: Wenn der `render-service`
  läuft, sind die Pixel längst gezeichnet.)*
- **Ersatz-Logo, wenn die Marke keins hat (9.10.10, v3.4).** `Marke.logo` ist `| null` – bei
  Werbepartnern der Normalfall. Dann wird in **jeder** Zone mit `bindung: logo` der **`marke.name`**
  gezeichnet, auf einer Fläche in **`marke.farben.akzent`** (der **Marken**-Akzentfarbe, nie
  `aktion.akzentfarbe`), in der **gebündelten** Rolle `headlinePlakativ`. Textfarbe **nach gemessenem
  Kontrast** (dieselbe Rechnung wie die Kontrast-Warnung, 9.15.2 – einmal gebaut, zweimal genutzt).
  **KEIN „…" bei langen Namen** – ein abgeschnittener Markenname sieht nach Fehler aus, nicht nach
  Gestaltung: verkleinern, dann zweizeilig. *Warum nicht die eigene Schrift der Marke:* Eine Marke ohne
  Logo hat oft auch keine importierte Schrift – und hätte sie eine, könnte **genau diese Datei
  fehlen**, dann wäre nicht einmal der Ersatz zeichenbar.
- **Fester Markenrahmen immer** gezeichnet, nicht abschaltbar (FA-11). **Sicherheitsabstand 5 %** =
  **96 px** links/rechts, **54 px** oben/unten (TV-Overscan) – dort kein bedeutungstragender Inhalt.
- **Text-Überlauf-Kaskade (verbindliche Reihenfolge):** (1) umbrechen bis Max-Zeilen → (2) Schriftgröße
  stufenweise verkleinern bis Untergrenze → (3) mit „…" kürzen. Zonen-Parameter kommen aus der `Vorlage`.
- **Die AKZENTFARBE einer Aktion ersetzt die Akzent-Rollen ihrer Vorlage (v3.0, 9.10.9).** Löst eine
  Zone eine der **drei** Akzent-Rollen `akzent`, `akzentKraeftig`, `akzentTief` auf, liefert die
  Auflösung den Wert aus **`aktion.akzentfarbe`** statt des Markenwerts; alle übrigen Rollen bleiben
  unberührt, und **ohne** gesetzte Akzentfarbe gilt der Markenwert. Vorher war `akzentfarbe` seit
  9.8.2 im Datenmodell und in FA-12 versprochen, hatte aber **keine Wirkung** – der Nutzer hätte eine
  Farbe gewählt und im Segment nichts davon gesehen. **Mitentschieden, damit es nicht sofort wieder
  offen ist:** `akzentfarbe` ist **`string | null`** · **`flaecheAkzentZart` gehört NICHT dazu**
  (trotz des Namens eine Flächen-Rolle) · es gibt **GENAU EINE Auflösungsstelle** (sonst wirkt die
  Farbe in der Pille, aber nicht im Verlauf dahinter) · **eine Vorlage darf sich NICHT auf den
  Kontrast zwischen zwei Akzent-Rollen verlassen** – nach der Ersetzung tragen alle drei denselben
  Wert, ein Text in `akzentTief` auf einer Fläche in `akzent` wäre **unsichtbar**. Der
  `render-service` bleibt unberührt (Restflächen tragen `flaecheDunkel`, keine Akzent-Rolle) – er
  braucht weiterhin **keine** Kenntnis von Aktionen.
- **Zwei Ergänzungen aus v3.4 zum Block darüber.** (1) `akzentfarbe` ist seit FA-24 ein **FREIER**
  Hex-Wert (9.8.2/9.8.4) – der frühere Zwang „nur aus der Markenpalette, kein freier Farbwähler" ist
  **bewusst zurückgenommen**, weil Partner-Hausfarben in keiner Palette stehen. Eine Aktion **kann**
  damit aus dem Corporate Design ausbrechen; Gegenmaßnahme ist die **Kontrast-Warnung** (9.15.2),
  **nicht** die Sperre (Risiko R-08). (2) Es gibt eine **zweite** Ausnahme von der Ersetzungsregel:
  Das **Ersatz-Logo** nimmt `marke.farben.akzent`, **nie** `aktion.akzentfarbe` (9.10.9
  „Abgrenzung", 9.10.10) – ein Logo ist eine Konstante, sonst blinkte das „Logo" eines Partners in
  drei Farben, während drei seiner Aktionen rotieren.
  *(Der Satz „Zugleich bleibt die Farbwahl auf die Markenpalette begrenzt … kein freier Farbwähler"
  stand bis v3.5 versehentlich weiter in 9.11.1 und war wörtlich zitierbar; **mit v3.6 ist er dort
  ersetzt**.)*
- **Fehlendes Motiv** → Platzhalter zeichnen (für action-editor 9.8.5); ein Segment mit Platzhalter darf
  **nie** in den finalen Render (Sperre im composer 9.7.5).
- Kennt **keine** Dateipfade; entscheidet **nicht** über Dauer/Reihenfolge; **kein** Queue-Auftrag.

## 9g. Datenmodell `Vorlage` – TK 9.11.1
- `Vorlage { id, name, eingebaut, zonen: Zone[] }`;
  `Zone { id, rolle:"fest"|"frei", bindung|null, rahmen{x,y,breite,höhe}, ausrichtung,
  wennLeer:"leer"|"ausblenden", text?{schriftRolle,farbRolle,größeMax,größeMin,maxZeilen},
  bild?{einpassung:"contain"|"cover"}, deko?{füllungFarbRolle,radius,statischerText} }`.
  `Bindung = titel|beschreibung|preis|cta|bild|logo|slogan`.
- **ABSOLUTE Pixel im 1920×1080-Raster** (keine Prozente). **Zeichenreihenfolge = Array-Reihenfolge**
  (später = darüber), kein implizites Sortieren.
- **`wennLeer`** je Zone: `"leer"` (Default, Zone bleibt leer) oder `"ausblenden"` (Zone inkl. Dekoration
  nicht gezeichnet – verhindert z. B. leere Preis-Pille). **Invariante: KEIN automatisches Umlayouten** –
  keine Variante verschiebt/skaliert andere Zonen.
- **Feste Zonen sind Teil der Vorlage** (nicht hartkodiert); Editor darf `rolle:"fest"` nicht ändern/entfernen
  (Markenrahmen erzwungen, FA-11). Eigene Vorlagen dürfen **freie** Zonen hinzufügen/ändern/umordnen/entfernen,
  auch **dekorative** (`bindung:null`) – ohne das `Aktion`-Modell zu erweitern.
- **Farben/Schriften sind ROLLEN-Verweise in die `Marke`**, nie Hex-Werte oder Font-Namen.
- `text.*` speist die Überlauf-Kaskade 9.10.6 (maxZeilen → größeMax/größeMin → „…").
- **Eingebaute Vorlagen sind konkret festgelegt (TK 9.11.1):** gemeinsame Basis = Inhaltsbox x 96–1824,
  y 54–1026; **Logo 420×120 oben links** (dunkler Balken ist im Asset enthalten); Zone **`hintergrund`**
  (Farb-Rolle der jeweils zuständigen Marke, s. 9m/9.15.4) wird **als erstes** gezeichnet, damit eine
  Aktion **ohne Bild nicht schwarz** rendert.
  „Vollbild": motiv `cover` vollflächig + **`scrim`** (dunkler Verlauf, y 432 h 648) für Textlesbarkeit;
  Überschrift 96→56 px/2 Zeilen; Preis/CTA als Pillen rechts, `wennLeer: ausblenden`.
  „Split": Trennung x=960, motiv **`contain`** (kein Beschnitt am Produkt), Textspalte ab x 1056.
- **Vorlagen sind APP-WEIT** (`vorlagen.json`, eine Bibliothek für alle Projekte) – anders als Medien
  (pro Projekt) und Aktionen (Bibliothek pro Projekt). **Löschen nur, wenn KEIN Projekt sie mehr nutzt**
  (blockierend, nicht kaskadierend) → **die Referenzprüfung muss ALLE Projekte lesen**, nicht nur das
  geladene (nur das aktive liegt im Speicher). **Eingebaute Vorlagen: unlöschbar und eingefroren** –
  Layout-Änderungen nur als NEUE Vorlagen-ID, sonst ändern sich bestehende Projekte nach App-Updates.

## 9h. Parallele Einblendung / Split-Screen (FA-20) – TK 9.2.8  ⟵ ANFORDERUNGSÄNDERUNG 23.07.
- **Zwei Betriebsarten** für Werbung: (1) sequenziell als vollflächiges Segment (bisher) UND (2) **parallel
  als Band unter dem laufenden Video** – mit **mehreren rotierenden Aktionen**.
- **Feste Geometrie:** Video-Bereich **1920×918** (y=0), Band **1920×162** (y=918). 16:9-Video höhenbegrenzt
  eingepasst → **1632×918** zentriert (x=144); Restflächen je 144 px in **dunkler Markenfarbe**.
  **Bewusste Abweichung** von „schwarze Balken" (9.2.4) – **nur** im Split-Modus. Kein Beschnitt.
- **Aufbau (eine Re-Encodierung, Pipeline bleibt!):** Video contain in Bereich skalieren + Markenfarbe auffüllen
  → **Band-Spur** aus den Band-PNGs mit ihren Dauern bei 30 fps CFR verketten → beide per **`vstack`** →
  1920×1080 → `seg_*.mp4`. Der finale **`concat -c copy` bleibt unangetastet**.
- **Zeitverhalten:** Abschnitts-Dauern mit **derselben Frame-Rundung** (30 fps, 9.2.6). Folge **kürzer** als
  Video → **wiederholt** sich; **länger** → am Videoende abgeschnitten. Die Elementdauer bestimmt **allein
  das Video** (Trim) – das Band verändert sie nie.
- **Invarianten:** Einblendung **nur bei `"video"`**-Items. Band-PNGs sind **deckend** (kein Alpha – echter
  Split ohne Überdeckung), Größe **1920×162**. Ohne Einblendung bleibt alles wie bisher (vollflächig, schwarze Balken).
- **Die Bandhöhe `H` MUSS GERADE SEIN (v2.9, bindend).** Das Ausgabe-Profil schreibt `yuv420p` vor
  (Abschnitt 2); dieses Pixelformat tastet die Farbe in **beiden** Richtungen um Faktor zwei unter und
  verlangt deshalb **gerade Höhen und gerade Versätze**. Bei ungeradem `H` bricht **jede** der beiden
  Kompositionsarten: bei `split` ist die Videofläche `1080 − H` ungerade, bei `einblendung` liegt das
  Overlay bei `y = 1080 − H` auf einer **ungeraden** Zeile. Durchgesetzt wird das **an der Quelle**:
  `vorlagen-editor` **sperrt** sofort, `vorlagen-store` **weist ab** (auf **jedem** setzenden Weg) –
  sonst erführe der Nutzer den Fehler erst beim Render, aus einer Filterkette statt von der Stelle, an
  der er die Zahl eingegeben hat. Der `render-service` prüft **zusätzlich** →
  `ungueltiges_element`. Die eingebaute Band-Vorlage erfüllt die Regel (`höhe: 162`).
- **Die Split-Videobreite wird auf ein VIELFACHES VON 4 ABGERUNDET (v2.9, bindend).** Die gerade
  Bandhöhe allein genügt **nicht**: `(1080 − H) × 16/9` ist nur ganzzahlig, wenn `1080 − H` durch
  **18** teilbar ist (H = 162 → 918 → 1632 ✓ trifft das **zufällig**; H = 200 → 880 × 16/9 = 1564,44 ✗),
  und der zentrierte Versatz `(1920 − Breite) / 2` ist nur bei einer **durch 4** teilbaren Breite
  gerade (1564 → 178 ✓, 1562 → 179 ✗). Abrunden auf ein Vielfaches von 4 erfüllt **beide** Bedingungen
  in einem Schritt; der Rest von höchstens 3 px verschwindet unsichtbar in den seitlichen
  `flaecheDunkel`-Flächen. **Aufrunden ist VERBOTEN** – es vergrößerte das Video über den Video-Bereich
  hinaus und bräche die Zusage „contain ohne Beschnitt". **Nicht selbst eine andere Rundung erfinden:**
  Die eingebaute Vorlage geht als einzige zufällig auf und **verdeckt den Mangel** in jedem Test.
- **Die Rechnung liegt im GETEILTEN Bereich: `berechneBandGeometrie(höhe) → BandGeometrie`
  (v3.1, bindend).** Die **reine** Rechnung – Videofläche, eingepasste Breite **mit
  Vierer-Abrundung**, Versätze, Bandposition – benutzen **Vorschau und `render-service`
  gemeinsam**; die **Prüfung** (zulässige Höhe, Fehlercode `ungueltiges_element`) bleibt im
  `render-service`. **NIE abschreiben:** 9.9.2 verlangt seit je, dass die Vorschau „die Geometrie
  nach derselben Formel" rechnet – die Rechnung lag aber im Main, und der Renderer darf dort nicht
  importieren. Ein Agent hätte sie kopiert, und **der Fehler wäre unsichtbar geblieben**: Bei der
  eingebauten Band-Vorlage (H = 162) ändert die Vierer-Abrundung **nichts** (1632). Auseinander
  liefen Vorschau und fertiges Video erst bei **eigenen** Vorlagen – **beim Nutzer, nicht beim
  Entwickler**.
- **Die Restflächen tragen die Farb-Rolle `flaecheDunkel` (v2.8)** – **nie** als Hexzahl in eine
  Filterkette getippt. **Die Quelle ist `Project.standardMarkeId`** – die **Projekt**-Standardmarke,
  **nicht** die Marke der gerade sichtbaren Aktion; dasselbe gilt für den **Band-Hintergrund**.
  *Begründung („Rahmen stabil, Inhalt wechselt", 9.15.4):* Rotieren im Band Aktionen verschiedener
  Partner, wechselte sonst die Flächenfarbe im Sekundenrhythmus – links und rechts neben dem Video und
  im Bandhintergrund. Auf einem 85-Zoll-Schirm ist das unruhig, nicht professionell. `#2F2E2E` ist
  dabei nur noch der Wert der **eingebauten** Marke, keine Konstante.
- **AUFGELÖST WIRD BEIM EINREIHEN, NICHT ZUR LAUFZEIT (v3.7, bindend).** Der **Renderer** löst die
  Rolle über `leseMarke(markeId)` auf – mit derselben Marke, mit der er die Band-PNGs zeichnet – und
  legt den **fertigen Hex-Wert** als Pflichtfeld **`einblendung.flaecheDunkel`** in den
  `RenderRequest` (9.2.2). Der `render-service` **schlägt KEINE Marke nach** und braucht **null**
  Marken-Zugriff. *Folge ohne die Einfrierung:* Ändert jemand die Marke, während der Auftrag in der
  Warteschlange wartet, füllte der Render die Restflächen in einer **anderen Farbe als die bereits
  gezeichneten Band-PNGs** – nebeneinander im selben Bild. Derselbe Fehler wie bei einer
  nachgeschlagenen Bandhöhe, nur sichtbarer. *Warum der Wert und nicht die `markeId`:* Eine Kennung
  wäre **nicht** eingefroren – die Marke dahinter kann sich ändern, ohne dass die Zuordnung sich ändert. „Dunkle Markenfarbe" ist bei
  **zwölf** Farb-Rollen keine Angabe; ohne die Festlegung wählte jeder Agent eine andere und Render
  und Vorschau liefen auseinander. 9.11.2 beschreibt die Rolle als „Segment- und **Band**-Hintergrund" –
  damit sind Band und Seitenflächen **dieselbe** Fläche und der Split wirkt aus einem Guss.
- **Datenmodell:** `Listenelement.einblendung = { bandVorlageId, abschnitte: [{ aktionRef, dauer }] }`.
  **Im `RenderItemVideo` trägt `einblendung` zusätzlich `art` und `höhe` (v2.8)** – beide werden
  **beim Einreihen** aus der Band-Vorlage abgeleitet und im Auftrag **mitgeführt**, nicht zur Laufzeit
  nachgeschlagen. **Grund:** Der Render-Eingang wird beim Einreihen eingefroren (Abschnitt 8); schlüge
  der Main die Vorlage erst beim Start nach, passten die **bereits gezeichneten** Band-PNGs (1920 × H)
  nach einer zwischenzeitlichen Vorlagenänderung nicht mehr zur Höhe → verzerrtes oder falsch
  platziertes Band im fertigen Video. Nebeneffekt: **`render-service` braucht keine Abhängigkeit zum
  `vorlagen-store`.**
  `Vorlage.art = "vollflaeche" | "band"` bestimmt die Zeichenfläche (1920×1080 bzw. 1920×162).
  Eingebaute Band-Vorlage „Band-Standard" ist in TK 9.11.1 mit Pixelwerten definiert – **bewusst ohne
  Beschreibungs-Zone** (in 162 px passt nur eine kompakte Zeile).

## 9i. Vorlagen-Verwaltung – TK 9.12  ⟵ B7, FA-13 ist jetzt MUSS (Prototyp!)
- **`vorlagen-store` [Main]** besitzt `vorlagen.json` (app-weit) mit **eigener** Schreib-Serialisierung –
  NICHT project-store (nur project.json), NICHT config-store (nur App-Einstellungen). Schreib-Invarianten
  wie 9.5.4: atomar, `.bak`, `schemaVersion`, Speicherfehler sichtbar.
  Ops: `listeVorlagen`, `erstelleVorlage`, `bearbeiteVorlage`, `dupliziereVorlage`, `löscheVorlage`,
  **`pruefeVorlagenReferenzen`**.
- **`pruefeVorlagenReferenzen(id) → Ergebnis<Vorlagennutzung>` (v3.0, rein LESEND):** ermittelt über
  **alle** Projekte, welche Aktionen und welche Listenelemente die Vorlage benutzen, und gibt die
  Treffer **NAMENTLICH** zurück (nicht nur Zahlen). Verändert **nichts**, eigener Kanal
  `vorlagen:pruefeVorlagenReferenzen` (verdrahtet in `#255`). **Angezeigt VOR dem Überarbeiten UND
  vor dem Löschen:** Eine Vorlage ist **app-weit** – ihr Überarbeiten ändert das Aussehen von
  Aktionen in Projekten, die gerade **gar nicht offen** sind, und der Merge ist ein **vollständiges
  Ersetzen**; ohne die Anzeige entschiede der Nutzer blind, und beim gescheiterten Löschen stünde er
  vor einem bloßen „geht nicht", ohne zu erfahren, **wo** aufzuräumen wäre. **`Vorlagennutzung` ist
  KEIN neuer Typ** – es ist derselbe, den `vorlage_referenziert` als `fehler.daten` trägt (9.1.1):
  **ein zweiter Typ hieße zwei Zählungen, die auseinanderlaufen.** Es gibt **einen**
  Prüf-Mechanismus, den Anzeige und Sperre gemeinsam benutzen. **Eine leere Nutzung (beide Listen
  leer) ist ein GÜLTIGES ERGEBNIS, kein Fehler.** Und: **keine UUID-Prüfung** auf der `id` – die
  eingebauten Vorlagen heißen `"vollbild"`, `"split"`, `"band-standard"` und sind **keine** UUIDs;
  eine solche Prüfung erklärte genau die drei wichtigsten Vorlagen dauerhaft für „unbenutzt".
- **Speicherfehler werden gemeldet: Kanal `vorlagen:autoSpeichernStatus` (v3.1)** – gleichartig zu
  `project:autoSpeichernStatus`, aber **ein eigener** (s. 4b).
- **Invarianten:** eingebaute Vorlagen **unveränderlich + unlöschbar** (anpassen = duplizieren) · Löschen nur
  wenn KEIN Projekt sie nutzt → Prüfung liest **alle** project.json · **`art` nach dem Anlegen unveränderlich**
  (Wechsel würde alle Zonen-Rahmen ungültig machen) · `höhe` nur bei split/einblendung, >0, <1080
  **und GERADZAHLIG** (v2.9, Begründung `yuv420p` in 9h) – der Store weist eine ungerade Höhe auf
  **jedem** setzenden Weg ab (`erstelleVorlage`, `speichereArbeitskopie`, `uebernehmeInParent`) ·
  feste Zonen nie entfernbar/verschiebbar.
- **`vorlagen-editor` [Renderer]:** Art wählen (vollflaeche/split/einblendung), Bandhöhe, Zonen anlegen/
  verschieben/bemaßen, `bindung` + `wennLeer`, Text-Parameter. **Canvas + Zahlen-Inspektor** (Ziehen trifft
  exakte Werte nicht), **Zonen-Liste = Zeichenreihenfolge** (kein z-index), Einrasten an Sicherheitsabstand/
  Kanten/8-px-Raster. **Live-Vorschau NUR über template-canvas** mit **echter Aktion** aus der Bibliothek +
  **Felder testweise leerbar**, damit `wennLeer` und Überlauf-Kaskade sichtbar werden. Prüfungen: außerhalb
  der Fläche/`höhe` ungültig (**einschließlich ungerader Bandhöhe**, v2.9)/Textzone ohne Parameter =
  **Sperre**; Sicherheitsabstand überschritten =
  **Warnung**; Überlappung = **erlaubt** (Hintergrund/Scrim). Feste Zonen sichtbar aber gesperrt.
- **`parent`-Feld = die Merge-Beziehung (User-Entwurf):** „Vorlage bearbeiten" legt eine **Arbeitskopie** mit
  `parent = Original` an (auto-gespeichert, Original unberührt, nicht auswählbar). Am Ende **explizit**:
  `uebernehmeInParent` (**vollständiges Ersetzen**, kein Feld-Abgleich → keine Konfliktauflösung nötig) oder
  `alsEigenstaendige` (**das FELD** `parent` wird auf `null` gesetzt → Beziehung durchtrennt, damit **keine
  Merge-Konflikte** mehr möglich sind). **Höchstens EINE Arbeitskopie pro Parent** – erneutes Öffnen setzt
  die bestehende fort. Bei eingebautem Parent ist Merge gesperrt.
- **DREI Vorlagen-Arten (User 23.07.):** `vollflaeche` (1920×1080, deckend, sequenzielles Segment) ·
  `split` (1920×höhe, deckend, Video verkleinert auf 1080−höhe, `vstack`) · `einblendung` (1920×höhe,
  **MIT ALPHA**, Video bleibt vollflächig, `overlay`). **Split-Screen ist die HAUPTBETRIEBSART**, nicht die
  Werbepause. Bandhöhe kommt aus der Vorlage (nicht pro Element überschreibbar); alle Abschnitte eines
  Elements nutzen dieselbe Band-Vorlage (sonst springt die Geometrie).

## 9j. Datenmodell `Marke` – TK 9.11.2
- `Marke { id, name, parent: string|null, eingebaut: boolean, farben{<Rolle>:hex},
  schriften{<Rolle>:Schrift}, logo{datei,herkunft,seitenverhaeltnis} | **null**,
  sicherheit{horizontal:96, vertikal:54}, radien{pille:40,karte:10,klein:2}, schatten{...},
  slogan{text,aktiv}, herkunftJeFeld }` · `Schrift { familie, gewicht, datei, herkunft }` ·
  `Herkunft = "gebuendelt" | "importiert"`.
  Hex darf **8-stellig** sein (Alpha) – gebraucht für den Scrim.
- **`logo` ist NULLBAR** – bei Werbepartnern der Normalfall. `null` → **Ersatz-Logo** (9.10.10, s. 9f).
  Wer das übersieht, baut eine Marke, die sich gar nicht anlegen lässt.
- **Ableitung (`parent ≠ null`), die Auflösungsregel:** `farben` und `schriften` sind dann
  **Teilmengen** – für jede Rolle, die die abgeleitete Marke **nicht** setzt, gilt der Wert des
  Parents, **feldweise, nicht objektweise**. Das gilt für **jedes** Feld außer `id`, `name`, `parent`
  und `eingebaut`. **Ketten sind auf EINE Stufe begrenzt**: Ein Parent darf selbst keinen Parent haben
  (sonst `ungueltige_eingabe`).
- **Die Auflösung geschieht an genau EINER Stelle: im `marken-store`** (9.11.2/9.15.1, s. 9m).
  `leseMarke`/`listeMarken` liefern **fertige** Marken – **kein Aufrufer sieht je eine Teilmenge,
  keiner implementiert Vererbung selbst**. Es gibt **keine** zweite, „unaufgelöste" Leseoperation.
- **`herkunftJeFeld` (v3.5) = Metadatum, nie Wertquelle.** Der Store hält beim Auflösen fest, welchen
  Zweig er je Feld genommen hat: `MarkenHerkunftJeFeld { farben{<Rolle>:"eigen"|"geerbt"},
  schriften{<Rolle>:"eigen"|"geerbt"}, logo:"eigen"|"geerbt"|"keins", sicherheit, radien, schatten,
  slogan }`. **Einziger Leser ist der `marken-editor`** – er muss zeigen, was geerbt und was eigen ist
  (FA-24); aus den aufgelösten Werten allein ist das **nicht** rekonstruierbar. Bei `parent === null`
  durchgehend `"eigen"`, **nie** leer oder undefiniert. `logo` trägt `"keins"` genau dann, wenn die
  aufgelöste `logo` `null` ist. **VERBOTEN: ein Feld-für-Feld-Vergleich zweier Marken als Ersatz** –
  setzt der Nutzer bewusst denselben Wert wie der Parent, gälte das Feld als „geerbt", obwohl es sich
  bei einer Parent-Änderung **nicht** mitändert.
- **Vorlagen verweisen NUR über Rollen** (`farbRolle`/`schriftRolle`), nie auf Hex/Schriftnamen.
- **ROLLEN sind fest, WERTE sind frei (9.15.2).** Der Satz der zwölf Farb- und vier Schrift-Rollen ist
  unverändert der Vertrag, auf den **jede** Vorlage verweist; der Editor kann **keine** Rolle
  hinzufügen oder entfernen (eine fehlende Rolle brächte jede Vorlage zum Stillstand). Die **Hexwerte
  und Schriftdateien unten sind die der EINGEBAUTEN Marke Fitnessworld24** – seit v3.4 nicht mehr die
  einzige Marke; eine andere Marke belegt dieselben Rollen mit anderen Werten.
- **Farb-Rollen (fest v1):** `akzent` #FF4040 · `akzentKraeftig` #DF3131 · `akzentTief` #971316 ·
  `flaecheDunkel` #2F2E2E · `flaecheSehrDunkel` #4B090B · `flaecheHell` #FFFFFF · `flaecheAkzentZart` #F5AEAF ·
  `textAufDunkel` #FFFFFF · `textAufHell` #202020 · `textSekundaer` #8F8F8F · `linie` #CCCCCC ·
  `scrimStart` #00000000 / `scrimEnde` #000000B3.
- **Schrift-Rollen (fest v1; die Dateien der eingebauten Marke sind GEBÜNDELT und OFL – eine Rolle
  darf seit v3.4 aber auf eine importierte `.woff2` zeigen, `herkunft: "importiert"`):**
  `headlineElegant` = **Playfair Display** 700 ·
  `headlinePlakativ` = **Archivo Black** 900 (freier Ersatz für Arial Black/Avenir Heavy) ·
  `fliesstext`/`fliesstextFett` = **Arimo** 400/700 (**metrisch Helvetica-kompatibel** → Textlängen fallen
  wie erwartet). Arial Black/Avenir sind NICHT bündelbar (Lizenz/Verfügbarkeit).
- **Zone `deko` kennt zusätzlich `verlauf{vonFarbRolle,bisFarbRolle,richtung}`** – für den Scrim.
- **Sicherheitsabstand gehört zum BILDRAHMEN, nicht zur Vorlagenfläche** (96/54 px im 1920×1080).
  **Folge für Bänder:** ein Band am unteren Rahmenrand enthält die unteren 54 px des Rahmens → bei 162 px
  Band sind nur die oberen **108 px** sicher. Die eingebaute Band-Vorlage endet daher bei Band-y 90.
- **Marken sind ein app-weiter Bestand und BEARBEITBAR** (`marken-store`, 9.15.1; FA-23/FA-24, s. 9m).
  *Bis v3.3 stand hier: „Marke ist v1 gebündelt und read-only (`config-store.leseMarke`)." Beides ist
  mit v3.4 überholt* – die Marke gehört nicht mehr dem `config-store`, und der Editor ist ein **Muss**.
- **Der Sicherheitsabstand gehört der MARKE (v3.6 entschieden).** `Marke.sicherheit` ist bearbeitbar
  (FA-24 nennt „Sicherheitsabstände" ausdrücklich); die **96/54 px in `contracts/types` sind nur noch
  die Vorbelegung der eingebauten Marke** (s. 9k). **Wer zeichnet oder prüft, liest den Wert aus der
  jeweils zuständigen Marke, NIE aus der Konstante.** **Folge, die beim Bauen zählt:** Vorlagen sind
  **app-weit** und kennen die Marke nicht, mit der sie später gezeichnet werden – eine für 54 px
  gebaute Vorlage ist bei einer Marke mit größerem Abstand **nicht mehr sicher**. Der
  `vorlagen-editor` zeichnet seine Sicherheitslinie deshalb gegen eine **benannte** Marke und **sagt
  dazu, gegen welche**.

## 9k. Datenshapes, IDs, Konstanten, Einzel-Instanz – TK 9.11.3/9.11.4, 9.5.4
- `Project { id, name, erstelltAm, geaendertAm, schemaVersion, assets[], aktionen[], liste[],
  letzterAusgabeName: string|null, standardMarkeId: string }`.
  **`Vorlage`/`Marke` liegen NICHT im Projekt** (app-weit) – das Projekt hält nur Referenzen.
  **`standardMarkeId` (FA-23, v3.4):** färbt **Band-Hintergrund und Split-Restflächen** und **belegt
  neue Aktionen vor**; beim Anlegen die **eingebaute** Marke. `letzterAusgabeName` = Vorbelegung des
  Render-Zielnamens (FA-22), `null` = noch nie gerendert.
- `Aktion { id, titel, beschreibung, preis, bildRef, cta, standardDauer, vorlagenId, markeId,
  akzentfarbe }` (9.8.2). **`markeId` ist PFLICHT – GENAU EINE Marke je Aktion** (FA-23), vorbelegt
  mit `Project.standardMarkeId`; sie bestimmt Logo, Schriften und Farb-Rollen des Segments.
  **`akzentfarbe` ist ein FREIER Hex-Wert** (FA-24, `string | null`; `null` = Markenwert gilt) und
  **ersetzt beim Zeichnen die Akzent-Rollen der Vorlage** (9.10.9, s. 9f). `bildRef` ist stets eine
  **Referenz** auf eine Asset-ID, nie ein eingebettetes Bild.
- `Bearbeitungsstand { aktionen: Aktion[], liste: Listenelement[] }` (9.5.2) – der Ausschnitt, den
  `setzeBearbeitungsstand`, die Rückgabe von `löscheAktion` (s. 9b) und der **Undo-Schnappschuss**
  (9.13.2) gemeinsam führen. *Warum nicht `Project`:* Ein weiterer Typ brächte `assets` und
  `letzterAusgabeName` mit, die `löscheAktion` gar nicht anfasst und die **nicht** in den Schnappschuss
  gehören.
- `Listenelement { id, art:"video"|"bild"|"segment", ref, dauer, trimStart, trimEnde, einblendung }`.
  Belegung: **video** → ref=Asset(video), dauer `null` (ergibt sich aus Trim), Trim gesetzt, Einblendung erlaubt ·
  **bild** → ref=Asset(bild), dauer 10–45 s, Trim `null`, keine Einblendung ·
  **segment** → ref=Aktion, dauer 10–45 s, Trim `null`, keine Einblendung.
- **Reihenfolge = ARRAY-Reihenfolge, es gibt KEIN `position`-Feld** (gleiche Regel wie Zonen und RenderRequest 9.2.1).
  Zwei Quellen für dieselbe Information laufen unweigerlich auseinander.
- **Alle IDs sind UUIDs** (Project, Asset, Aktion, Listenelement, Vorlage, **Marke**, Auftrag). **Keine Zähler**
  (kollidieren nach Löschen/Neu-Anlegen und beim Duplizieren), **keine** aus Namen abgeleiteten IDs
  (Umbenennen darf keine Referenz brechen). IDs werden **nie wiederverwendet**.
  `dupliziereProjekt` vergibt eine **neue Projekt-ID**, behält aber die projektinternen IDs.
- **Konstanten an EINER Stelle** (`contracts/types`): Standard-Anzeigedauer **10 s** · Bereich **10–45 s** ·
  Sicherheitsabstand **96/54 px – nur noch die VORBELEGUNG der eingebauten Marke** (v3.6; der geltende
  Wert steht in `Marke.sicherheit` und ist bearbeitbar, s. 9j) · Format-Whitelist MP4/JPG/PNG/WebP.
- **GENAU EINE App-Instanz** (9.5.4): Das D1-Lock ist prozessintern – zwei Instanzen = zwei Locks auf derselben
  `project.json` = **Datenkorruption**. Einzel-Instanz-Sperre beim Start, zweiter Start fokussiert das Fenster.
  **Portabel-Besonderheit:** Sperre muss an den **Datenort** (App-Ordner mit `projects/`) gebunden sein, nicht
  an den Programmpfad – sonst starten zwei Kopien der EXE auf denselben Daten.

## 9l. app-shell: Aufbau & Navigation – TK 9.14
- **Modus-Reiter** (User-Wahl): **[Zusammenstellen] [Aktionen] [Vorlagen] [Projekte]**; der gewählte Reiter
  nutzt die ganze Fläche. Zusammenstellen = `composer` + `preview-player`; Aktionen = `action-editor` mit
  großer Live-Vorschau; Vorlagen = `vorlagen-editor`; Projekte = Projektverwaltung (FA-10).
  **Grund:** action-editor UND vorlagen-editor brauchen beide eine **lesbare** template-canvas-Vorschau –
  eine schmale Spalte oder ein Seitenblatt kann das nicht leisten.
- **`queue-panel` ist eine schmale Leiste, in JEDEM Reiter sichtbar** – sie ist die einzige Stelle, an der
  laufende/anstehende/fehlgeschlagene Aufträge erkennbar sind (FA-16), darf also nie hinter einem
  Moduswechsel verschwinden. Eingeklappt = eine Zeile, aufgeklappt = volle Liste.
- **Reparatur-Modus wechselt den Reiter:** Fix eines Aktions-Bildes → Reiter „Aktionen", Aktion hervorgehoben,
  danach zurück zu „Zusammenstellen" zur nächsten kaputten Stelle. **„X von N behoben" bleibt über den
  Reiterwechsel hinweg sichtbar.**
- **Ein Reiterwechsel verwirft NIE Arbeit:** Instant-Änderungen sind gesichert (9.5.4), eine offene
  Vorlagen-**Arbeitskopie** bleibt erhalten und wird fortgesetzt (9.12.1). Es gibt keinen „ungespeicherten
  Zustand", der beim Wechseln verlorengeht.
- **Undo/Redo gilt im aktiven Reiter**, getrennte Stapel, keine Vermischung (9.13.2).
- **Ohne offenes Projekt:** Start landet im Reiter „Projekte"; andere Reiter zeigen einen **Hinweis**, keine
  Fehlermeldung. Die Shell rendert selbst **keine** Inhalte.
- **Der RENDERER-BOOTSTRAP gehört der `app-shell` (M7, `#260`/`#262`) – eine feste
  Startreihenfolge, eine Stelle.** Genau wie der Main-Bootstrap (`#3`) ist er die **eine** Stelle,
  an der sich alles einhängt: der **Auswerter der Warteschlangen-Ereignisse** (genau **einer**, s.
  unten), die **Sitzungswiederherstellung**, der Aufbau der **gemeinsamen Sichten**, die
  **Reiterbelegung**, der **Speicherhinweis** und die **Warteschlangen-Leiste**. **Nicht mit `#3`
  verwechseln:** `#3` verdrahtet den **Main**; die beiden Bootstraps sind getrennt und dürfen
  einander nicht nachbauen. **Warum überhaupt eine feste Stelle:** Eine Anmeldung „beim ersten
  Import des Moduls" hinge davon ab, wer wen zuerst importiert – Fehler, die nur manchmal auftreten
  und sich beim Umstellen einer einzigen `import`-Zeile anders verhalten.
- **GENAU EIN Auswerter je Ereignis-Kanal.** Die Warteschlangen-Ereignisse wertet **die Shell**
  aus und gibt den Stand weiter; kein zweites Modul abonniert denselben Kanal. Jede Anmeldung wird
  beim Aufräumen **wieder abgemeldet** (der Rückgabewert von `abonniere` **ist** die Abmeldung) –
  sonst hängt nach jedem Reiterwechsel ein weiterer Hörer am selben Kanal und der **älteste** (=
  veralteste) feuert zuletzt über den aktuellen Stand.
- **Undo/Redo: der Schnappschuss entsteht in einer HÜLLE um die gemeinsame Projekt-Sicht
  (M7-50, `#243`).** 9.13.2 verlangt einen Schnappschuss **vor jeder Instant-Operation**, aber
  **sämtliche** Instant-Operationen liegen in Modulen, die Undo **ausdrücklich ausschließen** –
  gebaut und wirkungslos. Die Hülle sitzt an **einer** Stelle, die **jede** Änderung passiert;
  dreißig aufrufende Module einzeln zu ändern wäre dreißig Gelegenheiten, es zu vergessen.
  **Zwei getrennte Historien** (Projekt-Bearbeitung / Vorlagen-Editor), die ein **Reiterwechsel
  nicht vermischt**. Zurückgeschrieben wird über **`setzeBearbeitungsstand`** (s. 9b) – **nie** über
  selbst gebaute inverse Operationen.
- **Regel E1 in der Praxis: die Shell REICHT DIE AKTUALISIERUNGSFUNKTIONEN DURCH.** Module
  außerhalb des besitzenden Ordners importieren die gemeinsame Sicht **nicht**, sie bekommen die
  Funktion als **Parameter** – und der Durchreicher ist die `app-shell` (s. 4b).

## 9m. Marken-Verwaltung: `marken-store` [V2] & `marken-editor` – TK 9.15  ⟵ NEU v3.4/v3.5
- **Warum es das gibt:** Bis v3.3 gab es **eine** Marke, gebündelt und nur lesbar, geführt vom
  `config-store`. Mit **FA-23** wird daraus ein **Bestand**. Zwei Anlässe: **Partner-/Fremdwerbung**
  (Aktionen tragen die Marke Dritter) und **Saison-/Kampagnen-Looks** (dieselbe Marke in anderer
  Anmutung). **FA-23 und FA-24 sind beide MUSS.**
- **`marken-store` besitzt `marken.json`** (app-weit) samt **eigener** Schreib-Serialisierung.
  Schreib-Invarianten **wie 9.5.4**: **atomar** (Temp + Rename), **`marken.json.bak`** als letzte heile
  Version, **`schemaVersion`**, Speicherfehler werden **sichtbar** gemacht statt still verschluckt –
  über den eigenen Kanal **`marken:autoSpeichernStatus`** (s. 4b).
- **Die acht Operationen (9.15.1):** `listeMarken` → `Ergebnis<Marke[]>` (aufgelöst, je samt
  `herkunftJeFeld`) · `leseMarke(markeId)` → `Ergebnis<Marke>` (aufgelöst, samt `herkunftJeFeld`) ·
  `erstelleMarke(name, parentId?)` · `bearbeiteMarke(markeId, teilwerte)` (**Auto-Speichern** während
  des Bearbeitens) · `importiereMarkenDatei(markeId, art, schriftRolle?, quellPfad)` ·
  `entferneMarkenDatei(markeId, art, schriftRolle?)` (zurück auf den geerbten bzw. gebündelten Wert) ·
  `löscheMarke(markeId)` · `pruefeMarkenReferenzen(markeId)` → `Ergebnis<Markennutzung>` (**rein
  lesend**, über **alle** Projekte). **Alle vier Schreiboperationen geben die Marke MIT frischem
  `herkunftJeFeld` zurück** (v3.5) – deshalb braucht der Editor nach einer Änderung **keinen** zweiten
  Aufruf.
- **Die Vererbung wird an genau EINER Stelle aufgelöst – hier** (s. 9j). Begründung wie bei den
  Farb-Rollen: **neunzehn** Aufrufer holen die Marke (9.15.4); neunzehn eigene Vererbungslogiken
  liefen unweigerlich auseinander.
- **Löschen blockiert bei Referenz, es kaskadiert NICHT** – wie bei den Vorlagen. Geprüft wird über
  **alle** Projekte, nicht nur das geladene, **und** über die abgeleiteten Marken; `marke_referenziert`
  trägt **beide** Trefferlisten (betroffene **Aktionen** je mit Projekt, betroffene **abgeleitete
  Marken**). Eine Kaskade änderte das Aussehen vieler Aktionen auf einen Schlag.
- **Die eingebaute Marke ist NIE löschbar (`eingebaut: true`), aber BEARBEITBAR** – anders als die
  eingebauten **Vorlagen**, die eingefroren sind. *Begründung der Abweichung:* Ändert Fitnessworld24
  sein Erscheinungsbild, soll das ohne Umweg möglich sein und **in allen abgeleiteten Looks wirken**.
  *Preis, bewusst in Kauf genommen:* Es gibt **keinen garantierten Urzustand**.
- **Wer die Marke holt – und woher den Kontext (9.15.4, bindend):** Aktions-Segment (Vollfläche oder
  Band-Abschnitt) → **`aktion.markeId`** · Band-Hintergrund → **`Project.standardMarkeId`** ·
  Restflächen der Split-Komposition → **`Project.standardMarkeId`** · Vorschau und Vorschaubilder →
  **dieselbe Marke wie beim Render, nie eine andere**. **„Rahmen stabil, Inhalt wechselt"** – s. die
  Begründung in 9h.
- **Import-Riegel (9.15.3):** **Zwei Herkünfte, eine Auflösung** – `gebuendelt` löst auf den
  Bundle-Pfad auf, `importiert` auf `marken-assets/<markeId>/`. **Import kopiert** (Quelldatei bleibt
  unberührt, wie beim Medien-Import). Whitelist: **nur `.woff2`** für Schriften (*ein Ladepfad statt
  zwei*), Bild-Whitelist (9.4.2) für Logos. Der Renderer bekommt importierte Dateien über ein
  **Lese-Protokoll wie `media://`** und **nie** über absolute Pfade. Ablage **im Datenort**, nicht im
  Programmordner – so wandern importierte Schriften bei portabler Auslieferung mit den Daten.
  **Lizenzen:** Für importierte Schriften trägt der **Nutzer** die Rechte (Risiko R-07) – die App
  brennt sie in ein Video, das weitergegeben und öffentlich gezeigt wird.
  **Das Protokoll heißt `marken://<markeId>/<dateiname>`** (v3.6 entschieden) – gleiche Bauart und
  gleiche Schutzregeln wie `media://`, die `markeId` an der Stelle der `projektId`. **Angemeldet vor
  `app.ready`.** Pfad-Autorität ist der **`marken-store`** (nicht der `project-store`) – deshalb ein
  **eigenes** Protokoll und keine Erweiterung von `media://`.
- **`marken-editor` (9.15.2):** Rollen fest / Werte frei (s. 9j) · **geerbt vs. eigen ausschließlich
  aus `herkunftJeFeld`**, nie aus einem Wertvergleich · **Kontrast-Warnung (FA-24): sichtbar warnen,
  die Wahl aber NICHT verhindern** – ein Schwellenwert machte genau die Partner-Hausfarben unbrauchbar,
  um die es geht (R-08); dieselbe Rechnung wählt beim **Ersatz-Logo** die Textfarbe (9.10.10, s. 9f) ·
  **Löschen fragt vorher** und zeigt das Ergebnis von `pruefeMarkenReferenzen` · **KEIN Undo für den
  Marken-Bestand in v1** (Undo deckt Projekt-Bearbeitung und Vorlagen-Editor ab; hier schützt der
  `.bak`).
- **Fehlercodes (9.15.5, vollständig):** `marke_referenziert` · `marke_eingebaut` ·
  `marke_nicht_gefunden` · `ungueltige_eingabe` (unbekannte Rolle, Ableitungskette länger als eine
  Stufe, Datei nicht in der Whitelist) · **`marken_datei_fehlt`** (importiertes Logo oder importierte
  Schrift fehlt) · `speicher_fehler`. **`marken_datei_fehlt` wird im RENDERER festgestellt** – beim
  Vorbereiten der Marke **vor** dem Zeichnen (9.10.3/9.10.4). Dann entsteht **kein** Segment-PNG, der
  `composer` führt in den Reparatur-Modus (9.7.5), und der Auftrag wird **gar nicht erst eingereiht**.
  **NICHT** im `render-service` – der sieht nie eine Marken-Datei (s. Abschnitt 7).
- **Migration von v3.3 (9.15.1):** Die bisher in `config.json` geführte Marke war ein **namenloses
  Wertobjekt**. Die Migration legt daraus die **eingebaute** Marke in `marken.json` an
  (`eingebaut: true`, `parent: null`, **neue `id`**), setzt `Project.standardMarkeId` und
  `Aktion.markeId` **aller** Projekte darauf und **entfernt das Feld aus `config.json`**.

## 10. Doku-Workflow (bindend)
- **Markdown ist Quelle der Wahrheit.** Beide `.docx` werden daraus im Markenlayout **neu generiert**:
  `node tools/generate-docx.js <in.md> <out.docx> [--dfd tools/assets/dfd.png]`. Nach jeder Änderung
  müssen `.md` und `.docx` deckungsgleich sein.
- **Nie in eine geöffnete `.docx` schreiben** (Vorfall 03.07.: Schreiben-während-Word-offen + harter
  Neustart hat die Datei beschädigt). Ablauf: generieren → **Staging** → validieren (ZIP + XML +
  ID-Stichproben) → Sperre prüfen → nur bei freier Datei atomar platzieren. Sonst **stoppen und fragen**.
  **Keine** Retry-Kopier-Schleifen.
- **Nach dem Generieren immer gegenprüfen** (der Generator hat still Inhalte verloren, 2×):
  Absatz-Diff alt/neu und Prüfung, dass `**`…`**`-Verschachtelungen keine sichtbaren Backticks
  hinterlassen. Beides ist inzwischen im Generator behoben (Tabellen-Wächter warnt laut;
  `inlineRuns` parst Fett/Kursiv rekursiv), aber die Kontrolle bleibt Pflicht.
- **Marke:** Primär `#FF4040`, Logo nur auf dunklem Balken, Schriften Playfair Display / Arial Black /
  Helvetica-Ersatz (Arial). Kuratiertе Palette steht im Anforderungsdokument 4.2 (Wix-Artefakte in
  `design/design-tokens.json` sind aussortiert und NICHT zu verwenden).

## 11. Status & offene Verträge
- **Aktuelle Fassungen: Anforderungsdokument v1.3 / TK v3.7 (10.08.2026).** Nachträge seit v2.2:
  v2.4 (`pendingDeletions` sind keine Aufträge, `listeAusgaben`), v2.5 (`Auftrag.ergebnis`,
  `fehler.daten`, ffprobe wird mitgeliefert), v2.7 (`setzeEinblendung`, `setzeElementReferenz` –
  s. 9b), **v2.8 (neun Entscheidungen aus dem M6-Zuschnitt: `.part`-Staging im Ausgabeordner –
  s. 7/9b2 · `art`+`höhe` im Auftrag – s. 9h · `historieEintrag` gestrichen · `gesamtdauer`
  `number|null` – s. 8 · Sofort-Flush im Handler – s. 8 · „verifiziert" definiert – s. 7 ·
  `flaecheDunkel` für die Restflächen – s. 9h · `render:fortschritt` als Kanal – s. 4b ·
  geschlossene Fehlercode-Tabelle des `render-service` – s. 7)**, **v2.9 (`speicher_fehler` als
  siebter Export-Code – s. 9c · gerade Bandhöhen · Split-Breite auf Vielfaches von 4 abrunden –
  beides s. 9h)**, **v3.0 (vier Entscheidungen: Akzentfarbe der Aktion ersetzt die Akzent-Rollen
  ihrer Vorlage, 9.10.9 · `pruefeVorlagenReferenzen` – s. 9i · genau EIN Fenster – s. 4b ·
  beschädigtes Projekt wird gelistet, `listeProjekte` nimmt das D1-Lock – s. 9b)**, **v3.1 (acht
  Entscheidungen aus dem M7-Zuschnitt: `setzeBearbeitungsstand` · Fehlschlag des Sofort-Flush beim
  Beenden · Löschbestätigung mit `anzahlMedien`/`anzahlAusgaben` · `öffneProjektordner` – die vier
  s. 9b · `berechneBandGeometrie` im geteilten Bereich – s. 9h · `vorlagen:autoSpeichernStatus` –
  s. 4b/9i · `projekt-verwaltung` als SECHSTE Renderer-Oberfläche – s. 5/9l · Ereignisse vor dem
  Fensteraufbau verfallen still, „erst holen, dann abonnieren" – s. 4b)**, **v3.2 (drei
  Entscheidungen: `leereProjektSicht()` – s. 9d · `ausgabeName` im `RenderResult` und in
  `Auftrag.ergebnis`, NICHT in `ProtokollEintrag.ausgabe` – s. 7/8 · `löscheAktion` liefert den
  vollständigen neuen `stand` samt Typ `Bearbeitungsstand` – s. 9b/9k)**, **v3.3 (der geteilte
  Renderer-Bereich `src/renderer/gemeinsam/` fehlte in der Modulliste – s. 5)**, **v3.4 (neun
  Entscheidungen, Anforderungsänderung „Mehrere Marken": Marken-Bestand statt einer gebündelten Marke
  · Ableitung mit EINER Auflösungsstelle · „Rahmen stabil, Inhalt wechselt" · Akzentfarbe wird freier
  Farbwert · Ersatz-Logo · Import-Riegel mit `herkunft` · eingebaute Marke unlöschbar aber bearbeitbar
  · Löschen blockiert statt zu kaskadieren · Migration aus `config.json` – alle s. 9m, dazu 9j/9f/9h)**,
  **v3.6 (acht Befunde aus dem Abgleich DIESES Dokuments gegen v3.2–v3.5; vier Nachzüge – V2 fehlte in
  7.2/7.3, obwohl der v3.4-Eintrag es als erledigt meldete · 9.2.8 widersprach sich selbst · der
  zurückgenommene Palettenzwang stand zitierfähig weiter in 9.11.1 · `Marke` fehlte in der UUID-Liste –
  und vier Entscheidungen: `marken_datei_fehlt` als achter Code in 9.2.3 – s. 7 · fünfter Reiter
  [Marken] – s. 5 · Sicherheitsabstand gehört der Marke – s. 9j/9k · Protokoll `marken://` – s. 9m)**,
  **v3.7 (NIMMT v3.6-Punkt 5 ZURÜCK: `marken_datei_fehlt` ist KEIN Render-Fehlercode – der
  `render-service` sieht bei Variante A nie eine Marken-Datei; die Prüfung sitzt im Renderer vor dem
  Zeichnen. Sein einziger Marken-Bezug ist die Restflächen-Farbe, und die reist als fertiger Hex-Wert
  `einblendung.flaecheDunkel` eingefroren im Auftrag mit – s. 7/9h/9m)**,
  **v3.5 (Herkunfts-Stempel `herkunftJeFeld` an der aufgelösten Marke, damit der Editor „geerbt vs.
  eigen" zeigen kann, ohne dass es eine zweite, unaufgelöste Leseoperation gibt; Wertvergleich als
  Ersatz ausdrücklich verboten – s. 9j/9m)**.
  **Merke:** Eine Vertragsänderung erzwingt einen **Zitat-Abgleich über alle bereits
  angelegten Issues** – Regel D gilt rückwärts. **Und vorwärts (neu aus M7):** Wer ein Issue anlegt,
  das die **Lücke eines früheren schließt**, streicht dort die **Melde-Aufforderung** – sonst liest
  ein Agent „Braucht einen Baustein, den kein Issue liefert" und **baut nicht**, obwohl der Baustein
  längst gedeckt ist. Diese **überholten Tatsachenbehauptungen** blockieren genauso wie echte
  Lücken, nur unsichtbar (rund fünfzehn Fälle in M7).
- **HLD VOLLSTÄNDIG und vollständig geprüft (Anforderungsdokument v1.1 / TK v2.2).** Ausgearbeitet sind alle Modul-Verträge:
  `render-service` (9.2), `auftrags-manager` (9.3), `media-service` (9.4), `project-store`/`config-store` (9.5),
  `export-service` (9.6), `composer` (9.7), `action-editor` (9.8), `preview-player` (9.9), `template-canvas` (9.10),
  `vorlagen-store`/`vorlagen-editor` (9.12), `Undo/Redo` (9.13), **`app-shell` (9.14)**,
  **`marken-store`/`marken-editor` (9.15)** – dazu alle geteilten Datenmodelle (9.11)
  und das Ausgabe-Profil (9.2.4). **Alle** Lücken des Prüfbefunds vom 03.07. sind geschlossen.
  FA-Nummern lückenlos **01–24** (FA-22 Ausgabedateien, FA-23 Marken-Bestand, FA-24 Marken-Editor);
  R-06 (Ton) ist entschieden, **R-07 (Fremdschrift-Lizenzen) und R-08 (unlesbarer Kontrast) sind seit
  v1.3 als Risiken geführt**.
- **Anforderungs-Eckpunkte (Stand v1.3):** **FA-22 mehrere benannte Ausgabedateien je Projekt**
  (s. 9b2), **FA-23 Marken-Bestand = MUSS**, **FA-24 Marken-Editor = MUSS** (beide s. 9m; mit ihnen
  gilt der Markenrahmen **je Rahmen**, nicht mehr fürs ganze Video – AD 4.1/4.8),
  FA-13 Vorlagen erstellen/bearbeiten = **MUSS** (im Prototyp!),
  FA-14 Trim (Soll), FA-15 Auto-Speichern & Sitzung (Soll), FA-16/17/18 Auftrags-Queue, FA-19 geführte
  Reparatur (Soll), **FA-20 parallele Anzeige = Muss und HAUPTBETRIEBSART**, FA-21 Undo/Redo (Muss).
  FA-10 = Projektverwaltung. **Einheitlicher Dauer-/Trim-Regler** (Anforderungsdok. 4.4): Video = 2 Griffe bis
  Quelllänge; Bild/Segment = 10–45 s; Kürzen wie Verlängern gleiche Bedienung.
- **Frame-genauer Trim (TK 9.2.6, erledigt):** Video-Trim framegenau via akkuratem (decode-basiertem)
  Seeking, kein Keyframe-Seeking; beide Grenzen auf 30-fps-Raster gerundet (`round(t×30)`), effektive
  Dauer `(endFrame−startFrame)/30`, Zwischenclip CFR 30fps; `gesamtdauer` zählt gerundete Frame-Dauern.
- **Arbeitsweise:** Planungsphase – KEIN Code, keine Task-Listen, bis ausdrücklich freigegeben. Ein
  Thema pro Schritt, Bestätigung einholen, Annahmen offen benennen.
