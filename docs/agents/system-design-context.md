# System-Design-Kontext für Agents – Digital-Signage-Tool (Baller Gruppe)

> **Zweck dieser Datei:** vollständiger, laufend gepflegter Projektkontext für Agents, die einzelne
> Funktionen füllen. Eine kleine (~30 Zeilen) Funktion trifft lokale Trade-offs (Datenformate,
> Fehlerbehandlung, ffmpeg-Parameter, Rundungen, Grenzfälle), die – falsch gewählt – das ganze
> Projekt beschädigen. Deshalb: jede lokale Entscheidung muss zu den hier festgelegten globalen
> Invarianten passen. Im Zweifel lieber strikter an den Vertrag halten als „clever" abweichen.
>
> **Stand:** 04.08.2026 · Anforderungsdokument **v1.2** · Technisches Konzept **v2.9** · Phase: PLANUNG (Task-Überführung läuft, kein Code).

---

## 1. Projekt in Kürze
- Tool für das Fitnessstudio Fitnessworld24 (Baller Gruppe). Erste Stufe: EIN Studio, EIN Bildschirm.
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
  Auftragsverwaltung, s. Abschnitt 8), **V1** Vorlagen-Bibliothek (P7, s. 9i).
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
  **Offen bleibt:** `project:autoSpeichernStatus` hat im Main noch **keinen Sender** (**M7**).
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
- **Renderer:** `ipc-client`, `app-shell`, `composer` [P3], `action-editor` [P2],
  `vorlagen-editor` (Zonen auf einer Arbeitskopie, 9.12/9i),
  `template-canvas` (geteilt: Segment → PNG), `preview-player` [P5], `queue-panel` (Sicht auf die Queue).
- **Main:** `ipc-gateway`, `auftrags-manager` [P6] (zentraler serieller Ausführungspunkt + Speicher
  Q1–Q4), `media-service` [P1], `project-store` [D1] (besitzt DAS EINE D1-Schreib-Lock),
  `config-store` [D3], `vorlagen-store` (`vorlagen.json` app-weit, eigene Serialisierung, 9.12/9i),
  `render-service` [P4], `export-service`, `ffmpeg-adapter` (getesteter `buildReel`-Kern).
- **Geteilt:** `contracts/types` (Project, Action, Asset, ListItem, Template, Brand, RenderRequest,
  Auftrag …).

## 6. Datenmodell-Entscheidungen
1. Medien werden ins Projekt **kopiert** (nicht referenziert). 2. Aktionen sind **referenzierbare**
Datensätze (Bibliothek je Projekt, Mehrfachnutzung erlaubt). 3. Medien liegen **pro Projekt**.
4. Segment-PNGs werden **immer neu** gerendert (flüchtig, kein Cache v1). 5. Vorlagen **datengetrieben**
ab v1 (zwei eingebaute: „Vollbild", „Split").

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
  **`abgebrochen` ist KEIN Fehlercode, sondern ein Status.** Die betroffene Element-ID reist als
  **`Auftrag.fehler.daten = { elementId }`** (9.1.1) – ohne diesen Weg erreichte sie die Oberfläche
  nie, obwohl der Reparatur-Modus (FA-19) die Stelle benennen muss.
- **`historieEintrag` gibt es NICHT mehr (v2.8, ersatzlos gestrichen).** Das `RenderResult` liefert
  Pfad, Größe und Gesamtdauer; den **Q3-Eintrag baut die Auftragsverwaltung selbst** (Abschnitt 8).
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
  `loeschen` → `{ assetId }`, `render` → Pfad/Größe/Dauer, `export` → `{ zielPfad, dateigroesse }`;
  sonst `null`. Ohne dieses Feld erführe die Oberfläche nie, was ein Auftrag hervorgebracht hat.
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
- **Auto-Speichern:** entprellt **3–5 s** + **Sofort-Flush** vor Render/Export, bei Projektwechsel, beim
  Beenden (App **blockiert**, bis geschrieben). **Atomar** (temp+rename). **Backup** `project.json.bak`:
  Laden defekt → aus `.bak`, sonst **Fehler melden** (nie leer/verlustbehaftet starten). `schemaVersion`
  in jeder Datei (höher→Fehler, älter→Migration).
- **Lösch-Asymmetrie (wichtig):** **Medium** löschen **blockiert** bei Referenz (9.4.6). **Aktion** löschen
  **kaskadiert**: Aktion + referenzierende Listenelemente weg (`entfernteElementIds` zurück), aber die
  **Medien-Assets bleiben** projektweit (Aktion referenziert Asset nur, besitzt es nicht).
- **`config-store`** besitzt `config.json` (aktives Projekt, Export-Ziel, UI, **Marke read-only gebündelt**).
  Sitzungswiederherstellung (FA-15): aktives Projekt beim Start laden; fehlt → sanfter Rückfall, kein Absturz.
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
  **`setzeElementReferenz`** (9.5.2, s. 9b), „entfernen" über `entferneElement`.
- **Zeichenvoraussetzungen vor dem ersten Thumbnail (M5-35, `#154`):** Marken-Schriften, Logo und
  Motive müssen **geladen** sein, bevor der composer zeichnet. Wer den composer öffnet, **ohne**
  vorher im Aktions-Editor gewesen zu sein, zeichnete sonst für jedes Bild einen **Platzhalter** –
  und **9.10.7 verbietet den Platzhalter im finalen Render**.

## 9e. preview-player [P5] (Renderer) – TK 9.9
- **UI-Simulation ohne ffmpeg** (16:9-Bühne), Transport (Play/Pause, Zeitleiste, aktuelles Element, Gesamtdauer).
  **Kein** Auftrag (interaktiv, unabhängig).
- Segment via `template-canvas` (pixelgleich); Bild `<img>` contain-auf-Schwarz; Video `<video>` trimStart→trimEnde;
  **alle Medien über `media://`** (9.5.7), nie absolute Pfade.
- **Im Split-Modus zeigt auch die Vorschau die Restflächen in `flaecheDunkel`** (v2.8, 9.9.2) – nicht
  schwarz. Sonst laufen Vorschau und Render an genau der Stelle auseinander, die der Nutzer am
  häufigsten sieht (Split ist die **Hauptbetriebsart**).
- **Zeitleiste frame-gerundet** (== render 9.2.6, composer 9.7.4); native Wiedergabe Best-Effort. Kaputte
  Elemente → Platzhalter (Reparatur im composer 9.7.5). Grenze (Abschnitt 8): nicht farb-/bitraten-genau,
  finale Kontrolle bleibt die gerenderte Ausgabedatei.

## 9f. template-canvas (Renderer, geteilt) – TK 9.10  ⟵ EINZIGE PIXELQUELLE
- `zeichneSegment(aktion, vorlage, marke)` → **Canvas 1920×1080**. Zwei Verwendungen aus **demselben**
  Aufruf: **Anzeige** (nur per CSS herunterskaliert) und **Export** `alsPng(...)` → PNG-Bytes für den
  RenderRequest. **KEIN zweiter Zeichenpfad** – sonst bricht die Pixelgleichheit.
- Konsumenten: `action-editor` (Live-Vorschau), `composer` (Thumbnails), `preview-player`, finaler Render.
- **Determinismus (bindend):** immer bei 1920×1080 zeichnen (nie kleiner + hochskalieren) · **`devicePixelRatio`
  ignorieren** (feste Backing-Größe) · **Schriften VOR dem Zeichnen geladen** (Fallback-Schrift = Vertragsbruch)
  · **Bild VOR dem Zeichnen dekodiert** (via `media://`) · gleiche Eingabe → gleiches Bild (kein Zufall/Zeit/
  Datum) · **kein persistenter Cache**. Export = PNG, sRGB.
- **Marken-Schriften werden GEBÜNDELT** mitgeliefert (Playfair Display ist auf Win/macOS nicht vorinstalliert)
  und per `FontFace` geladen – sonst still Fallback-Schrift → Vorschau ≠ Endvideo + Markenbruch.
- **Fester Markenrahmen immer** gezeichnet, nicht abschaltbar (FA-11). **Sicherheitsabstand 5 %** =
  **96 px** links/rechts, **54 px** oben/unten (TV-Overscan) – dort kein bedeutungstragender Inhalt.
- **Text-Überlauf-Kaskade (verbindliche Reihenfolge):** (1) umbrechen bis Max-Zeilen → (2) Schriftgröße
  stufenweise verkleinern bis Untergrenze → (3) mit „…" kürzen. Zonen-Parameter kommen aus der `Vorlage`.
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
  (Markenfarbe) wird **als erstes** gezeichnet, damit eine Aktion **ohne Bild nicht schwarz** rendert.
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
- **Die Restflächen tragen die Farb-Rolle `flaecheDunkel` (#2F2E2E, v2.8)**, geholt über
  `leseMarke()` – **nie** als Hexzahl in eine Filterkette getippt. „Dunkle Markenfarbe" ist bei
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
  Ops: `listeVorlagen`, `erstelleVorlage`, `bearbeiteVorlage`, `dupliziereVorlage`, `löscheVorlage`.
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
- `Marke { farben{<Rolle>:hex}, schriften{<Rolle>:{familie,gewicht,datei}}, logo{datei,seitenverhaeltnis},
  sicherheit{horizontal:96, vertikal:54}, radien{pille:40,karte:10,klein:2}, schatten{...}, slogan{text,aktiv} }`.
  Hex darf **8-stellig** sein (Alpha) – gebraucht für den Scrim.
- **Vorlagen verweisen NUR über Rollen** (`farbRolle`/`schriftRolle`), nie auf Hex/Schriftnamen.
- **Farb-Rollen (fest v1):** `akzent` #FF4040 · `akzentKraeftig` #DF3131 · `akzentTief` #971316 ·
  `flaecheDunkel` #2F2E2E · `flaecheSehrDunkel` #4B090B · `flaecheHell` #FFFFFF · `flaecheAkzentZart` #F5AEAF ·
  `textAufDunkel` #FFFFFF · `textAufHell` #202020 · `textSekundaer` #8F8F8F · `linie` #CCCCCC ·
  `scrimStart` #00000000 / `scrimEnde` #000000B3.
- **Schrift-Rollen (fest v1, alle GEBÜNDELT, alle OFL):** `headlineElegant` = **Playfair Display** 700 ·
  `headlinePlakativ` = **Archivo Black** 900 (freier Ersatz für Arial Black/Avenir Heavy) ·
  `fliesstext`/`fliesstextFett` = **Arimo** 400/700 (**metrisch Helvetica-kompatibel** → Textlängen fallen
  wie erwartet). Arial Black/Avenir sind NICHT bündelbar (Lizenz/Verfügbarkeit).
- **Zone `deko` kennt zusätzlich `verlauf{vonFarbRolle,bisFarbRolle,richtung}`** – für den Scrim.
- **Sicherheitsabstand gehört zum BILDRAHMEN, nicht zur Vorlagenfläche** (96/54 px im 1920×1080).
  **Folge für Bänder:** ein Band am unteren Rahmenrand enthält die unteren 54 px des Rahmens → bei 162 px
  Band sind nur die oberen **108 px** sicher. Die eingebaute Band-Vorlage endet daher bei Band-y 90.
- Marke ist v1 **gebündelt und read-only** (`config-store.leseMarke`).

## 9k. Datenshapes, IDs, Konstanten, Einzel-Instanz – TK 9.11.3/9.11.4, 9.5.4
- `Project { id, name, erstelltAm, geaendertAm, schemaVersion, assets[], aktionen[], liste[] }`.
  **`Vorlage`/`Marke` liegen NICHT im Projekt** (app-weit) – das Projekt hält nur Referenzen.
- `Listenelement { id, art:"video"|"bild"|"segment", ref, dauer, trimStart, trimEnde, einblendung }`.
  Belegung: **video** → ref=Asset(video), dauer `null` (ergibt sich aus Trim), Trim gesetzt, Einblendung erlaubt ·
  **bild** → ref=Asset(bild), dauer 10–45 s, Trim `null`, keine Einblendung ·
  **segment** → ref=Aktion, dauer 10–45 s, Trim `null`, keine Einblendung.
- **Reihenfolge = ARRAY-Reihenfolge, es gibt KEIN `position`-Feld** (gleiche Regel wie Zonen und RenderRequest 9.2.1).
  Zwei Quellen für dieselbe Information laufen unweigerlich auseinander.
- **Alle IDs sind UUIDs** (Project, Asset, Aktion, Listenelement, Vorlage, Auftrag). **Keine Zähler**
  (kollidieren nach Löschen/Neu-Anlegen und beim Duplizieren), **keine** aus Namen abgeleiteten IDs
  (Umbenennen darf keine Referenz brechen). IDs werden **nie wiederverwendet**.
  `dupliziereProjekt` vergibt eine **neue Projekt-ID**, behält aber die projektinternen IDs.
- **Konstanten an EINER Stelle** (`contracts/types`): Standard-Anzeigedauer **10 s** · Bereich **10–45 s** ·
  Sicherheitsabstand **96/54 px** · Format-Whitelist MP4/JPG/PNG/WebP.
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
- **Aktuelle Fassungen: Anforderungsdokument v1.2 / TK v2.9 (04.08.2026).** Nachträge seit v2.2:
  v2.4 (`pendingDeletions` sind keine Aufträge, `listeAusgaben`), v2.5 (`Auftrag.ergebnis`,
  `fehler.daten`, ffprobe wird mitgeliefert), v2.7 (`setzeEinblendung`, `setzeElementReferenz` –
  s. 9b), **v2.8 (neun Entscheidungen aus dem M6-Zuschnitt: `.part`-Staging im Ausgabeordner –
  s. 7/9b2 · `art`+`höhe` im Auftrag – s. 9h · `historieEintrag` gestrichen · `gesamtdauer`
  `number|null` – s. 8 · Sofort-Flush im Handler – s. 8 · „verifiziert" definiert – s. 7 ·
  `flaecheDunkel` für die Restflächen – s. 9h · `render:fortschritt` als Kanal – s. 4b ·
  geschlossene Fehlercode-Tabelle des `render-service` – s. 7)**, **v2.9 (`speicher_fehler` als
  siebter Export-Code – s. 9c · gerade Bandhöhen · Split-Breite auf Vielfaches von 4 abrunden –
  beides s. 9h)**. **Merke:** Eine Vertragsänderung erzwingt einen **Zitat-Abgleich über alle bereits
  angelegten Issues** – Regel D gilt rückwärts.
- **HLD VOLLSTÄNDIG und vollständig geprüft (Anforderungsdokument v1.1 / TK v2.2).** Ausgearbeitet sind alle Modul-Verträge:
  `render-service` (9.2), `auftrags-manager` (9.3), `media-service` (9.4), `project-store`/`config-store` (9.5),
  `export-service` (9.6), `composer` (9.7), `action-editor` (9.8), `preview-player` (9.9), `template-canvas` (9.10),
  `vorlagen-store`/`vorlagen-editor` (9.12), `Undo/Redo` (9.13) – dazu alle geteilten Datenmodelle (9.11)
  und das Ausgabe-Profil (9.2.4). **Alle** Lücken des Prüfbefunds vom 03.07. sind geschlossen.
  FA-Nummern lückenlos **01–21**; R-06 (Ton) ist entschieden.
- **Anforderungs-Eckpunkte (Stand v1.1):** FA-13 Vorlagen erstellen/bearbeiten = **MUSS** (im Prototyp!),
  FA-14 Trim (Soll), FA-15 Auto-Speichern & Sitzung (Soll), FA-16/17/18 Auftrags-Queue, FA-19 geführte
  Reparatur (Soll), **FA-20 parallele Anzeige = Muss und HAUPTBETRIEBSART**, FA-21 Undo/Redo (Muss).
  FA-10 = Projektverwaltung. **Einheitlicher Dauer-/Trim-Regler** (Anforderungsdok. 4.4): Video = 2 Griffe bis
  Quelllänge; Bild/Segment = 10–45 s; Kürzen wie Verlängern gleiche Bedienung.
- **Frame-genauer Trim (TK 9.2.6, erledigt):** Video-Trim framegenau via akkuratem (decode-basiertem)
  Seeking, kein Keyframe-Seeking; beide Grenzen auf 30-fps-Raster gerundet (`round(t×30)`), effektive
  Dauer `(endFrame−startFrame)/30`, Zwischenclip CFR 30fps; `gesamtdauer` zählt gerundete Frame-Dauern.
- **Arbeitsweise:** Planungsphase – KEIN Code, keine Task-Listen, bis ausdrücklich freigegeben. Ein
  Thema pro Schritt, Bestätigung einholen, Annahmen offen benennen.
