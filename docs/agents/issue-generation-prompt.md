# Übergabe-Prompt: aus der Planung GitHub-Issues als agent-taugliche Tasks erzeugen

> **Verwendung:** Diesen Text vollständig als ersten Prompt in eine frische Session geben.
> Er ist absichtlich selbsttragend – die ausführende Instanz braucht keinen Vorverlauf.
>
> **Stand der Grundlage:** Anforderungsdokument **v1.2**, Technisches Konzept **v2.5**,
> Agent-Kontext `docs/agents/system-design-context.md`. Zuletzt abgeglichen: 03.08.2026.

---

## 0. Dein Auftrag

Du zerlegst eine **fertige, geprüfte Planung** in **GitHub-Issues**, die je von einem Agent mit
begrenztem Kontext umgesetzt werden können. Du schreibst **keinen Produktivcode** und du änderst
**die Planungsdokumente nicht** – sie sind für diese Aufgabe **nur lesend**.

Du lieferst am Ende:
1. eine **Dry-Run-Datei** `docs/agents/issues-draft.md` mit **allen** Issues im Volltext,
2. die Liste der anzulegenden **Labels** und **Milestones**,
3. nach ausdrücklicher Freigabe des Nutzers: die `gh`-Befehle bzw. das tatsächliche Anlegen.

**Lege niemals Issues an, ohne vorher den Dry-Run zeigen zu lassen und eine Freigabe zu haben.**
Issues sind nach außen sichtbar und in Masse mühsam zurückzunehmen.

---

## 1. Was du zuerst liest (in dieser Reihenfolge, vollständig)

| Datei | Rolle |
|---|---|
| `docs/Anforderungsdokument_Digital-Signage-Tool.md` (v1.2) | das **WAS**: FA-01…FA-22, NFA-01…NFA-09, Akzeptanzkriterien 1–9, Risiken R-01…R-06, Glossar |
| `docs/Technisches_Konzept_Digital-Signage-Tool.md` (v2.5) | das **WIE**: Architektur, Datenbestand, DFD (Abschnitt 7), **Abschnitt 9 = HLD mit allen Modul-Verträgen 9.1–9.14** |
| `docs/agents/system-design-context.md` | verdichteter Agent-Kontext; **Abschnitt 4b** = IPC-Vertrag |
| `docs/agents/uebergabe-stand.md` | **WO WIR STEHEN**: welche Meilensteine angelegt sind, der fertige M2-Zuschnitt, die wiederkehrenden Fehlermuster, die Werkzeuge |
| `docs/agents/m1-pruefbefund.md` | Befund des M1-Prüflaufs – die konkreten Fehler, die zu vermeiden sind |
| `CLAUDE.md` | Projekt-Briefing, Arbeitsweise, Entscheidungshistorie |

**Abschnitt 9 des Technischen Konzepts ist die Quelle der Wahrheit für jedes Issue.** Wenn dein
Issue-Text und der Vertrag auseinandergehen, gewinnt der Vertrag – und du korrigierst das Issue.

---

## 2. Das Projekt in Kürze (damit du den Zweck jeder Funktion verstehst)

- Digital-Signage-Tool für das Fitnessstudio **Fitnessworld24** (Baller Gruppe). Erste Stufe:
  **ein** Studio, **ein** Bildschirm.
- Hardware: **nur** ein Samsung Consumer-TV **UE85AU7170** (85", Tizen) + **USB-Stick**. Kein
  Mediaplayer, keine Smart-TV-App (kein Autostart beim Booten, Firmware-/Zertifikatsprobleme).
- Lösung: Ein **Desktop-Tool** auf dem Laptop erzeugt je Lauf **EINE durchgehende MP4** unter frei
  gewähltem Namen; der TV spielt sie vom USB als **manuell gestartete Endlosschleife** („Repeat One").
  Der TV ist ein **„dummer" Player**. Ein Projekt kann **mehrere** solche Ausgabedateien vorhalten
  (**FA-22**, Anforderungsdokument 4.7).
- **Haupt-Betriebsart ist Split-Screen (FA-20):** Werbung läuft **parallel** als Band unten,
  **während** das Video läuft – nicht (nur) als Werbepause zwischen Videos.
- Der Nutzer ist **Berufspraktikant**, baut das Grundgerüst selbst und lässt die **einzelnen
  Funktionen von Agents füllen**.

**Tech-Stack (entschieden, nicht zur Diskussion):** Electron + TypeScript + React + Vite; dnd-kit;
HTML5-Canvas → PNG für Aktions-Segmente; **gebündeltes ffmpeg** (`ffmpeg-static` + `fluent-ffmpeg`);
Datenhaltung JSON je Projekt (lowdb), SQLite optional; Verpackung **electron-builder Portable**
(Win 10/11 + macOS 13+, kein Installer, ohne Admin-Rechte).

---

## 3. WARUM die Issues so genau sein müssen (lies das, es bestimmt deinen Zuschnitt)

Ein Agent füllt eine **kleine Funktion (~30 Zeilen)**. Darin trifft er **Low-Level-Entscheidungen**:
Datenformate, Fehlerbehandlung, ffmpeg-Parameter, Speicher/Performance, Rundungen, Grenzfälle.
**Falsch gewählt, ruinieren diese lokalen Entscheidungen das ganze Projekt** – und der Auftraggeber
kann sie nicht zuverlässig gegenprüfen, weil er nicht alle Technologien in der Tiefe kennt.

Daraus folgen zwei harte Regeln für dich:

> **Regel A – Das Issue ist die ganze Welt des Agents.**
> Der Agent liest **nicht** das Technische Konzept. Alles, was er wissen muss, steht **im Issue
> ausgeschrieben** – Invarianten **wörtlich zitiert**, nicht verlinkt. Ein Verweis wie „siehe TK 9.2.6"
> ist als *Quellenangabe* gut und als *Ersatz für den Inhalt* verboten.

> **Regel B – Jede gefährliche lokale Entscheidung wird dem Agent abgenommen.**
> Jedes Issue hat einen Block „**Nicht selbst entscheiden**" mit den Punkten, bei denen der Agent
> **stoppen und fragen** muss, statt zu wählen. Lieber eine Vorgabe zu viel als eine zu wenig.

---

## 4. Der Modulschnitt (so schneidest du auch die Issues)

**Renderer (React-UI):**

| Modul | Vertrag | Aufgabe |
|---|---|---|
| `ipc-client` | 9.1, **9.1.1** | typisierter Zugang zum Main, Ergebnis-Hülle auspacken |
| `app-shell` | **9.14** | Modus-Reiter `[Zusammenstellen] [Aktionen] [Vorlagen] [Projekte]` + immer sichtbare Warteschlangen-Leiste |
| `composer` [P3] | **9.7** | Liste/Reorder/Dauer/Trim, optimistische Bedienung, Reparatur-Modus (9.7.5) |
| `action-editor` [P2] | **9.8** | Aktionen anlegen/bearbeiten, Live-Vorschau |
| `template-canvas` | **9.10** | **EINZIGE Pixelquelle** – eine Zeichenroutine, Anzeige + PNG-Export aus demselben Aufruf |
| `preview-player` [P5] | **9.9** | UI-Simulation **ohne** ffmpeg, Medienzugriff über `media://` |
| `vorlagen-editor` | **9.12.2** | Vorlagen-Editor: Canvas + numerischer Inspektor |
| `queue-panel` | 9.3.4, 9.14 | Sicht auf Q1/Q2, Wiederholen |

**Main (Node):**

| Modul | Vertrag | Aufgabe |
|---|---|---|
| `ipc-gateway` | **9.1.1** | Kanäle, Validierung jeder Nutzlast, Ausnahmen → `unbekannter_fehler` |
| `auftrags-manager` [P6] | **9.3** | **zentraler serieller Torwächter**, Q1–Q4, Zustandsführung, Wiederholung |
| `media-service` [P1] | **9.4** | Import (atomar), Löschen (D1 zuerst), Reconcile beim Projektstart |
| `project-store` [D1] | **9.5** | besitzt `project.json` + **DAS EINE** D1-Schreib-Lock; **Pfad-Autorität**, trägt `media://` (9.5.7) |
| `config-store` [D3] | **9.5.6** | `config.json` app-weit |
| `render-service` [P4] | **9.2** | benannte Ausgabe-MP4 erzeugen (`ausgabeName`, 9.2.1), Fortschritt/Abbruch, Split-Komposition (9.2.8) |
| `export-service` | **9.6** | atomar auf USB, FAT32-Wächter vorab |
| `vorlagen-store` | **9.12.1** | `vorlagen.json` app-weit, Arbeitskopie-Fluss |
| `ffmpeg-adapter` | 9.2 | der getestete `buildReel`-Kern; **nur hier** laufen ffmpeg-Aufrufe |

**Geteilt:** `contracts/types` – **9.11** (`Project`, `Listenelement`, `Aktion`, `Asset`, `Vorlage`,
`Zone`, `Marke`, `Auftrag`, `RenderRequest`, `RenderProfile`, `Ergebnis<T>`, Fehlercodes, ID-Schema).

**Speicher:** D1 Projekt-Store · D2 Medienordner · D3 App-Konfig · T1 flüchtiger Render-Arbeitsbereich ·
Q1 aktive Warteschlange (flüchtig/RAM) · Q2 Wiederholung (persistent bis erledigt) · Q3 Protokoll
(dauerhaft, unbegrenzt) · Q4 Warteschlangen-Journal (dauerhaft, rotierend) · V1 Vorlagen-Bibliothek.

**Prozesse:** P1 Medienverwaltung · P2 Inhaltsverwaltung · P3 Zusammenstellung · P4 Finaler Render +
Export · P5 Vorschau · P6 Auftragsverwaltung · P7 Vorlagenverwaltung.

---

## 5. Globale Invarianten – gehören WÖRTLICH in die betroffenen Issues

Zitiere aus dem Technischen Konzept; die folgende Liste ist dein **Index**, welcher Block wohin gehört.

### 5.1 IPC-Vertrag (in JEDES Issue, das die Renderer↔Main-Grenze berührt) – TK 9.1.1
- **Variante A:** Der **Renderer** rendert Segment-/Band-PNGs (`template-canvas`) und übergibt sie als
  **Binärpuffer** (nicht Base64). Nur der **Main** schreibt/liest Dateien und ruft ffmpeg. Importierte
  Medien liest der Main selbst per **relativem Pfad** aus D2 – die gehen **nicht** über IPC.
- **Einheitliche Hülle, NIEMALS Exceptions über die Grenze:**
  `Ergebnis<T> = { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string } }`
  Grund: getrennte Prozesse, alles wird serialisiert; ein `throw` verliert Fehlerklasse **und** `code`,
  übrig bleibt Text. **Nie Meldungstexte vergleichen.**
- **`Ergebnis<void>`** wenn nichts zu melden ist. **Verboten:** `Ergebnis<boolean>`, `Ergebnis<null>`,
  blankes `true`.
- **Zwei Ebenen nicht verwechseln:** *Aufruf-Ergebnis* (hat der Aufruf geklappt) → `Ergebnis<T>`;
  *Auftrags-Ergebnis* (wie ging der Vorgang aus) → über den **Auftrags-Zustand**.
  `import`, `loeschen`, `render`, `export` werden **nie** direkt aufgerufen, sondern über
  `reiheEin(art, payload) → Ergebnis<{ auftragId }>`.
- **Fehlercodes = geschlossener, typisierter Satz** (fachlich je Operation 9.4.9/9.6.4/9.12.1 plus
  generisch `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`). Rohe Exception-Meldung wird
  **nie** zum Code.
- **Kanäle `<modul>:<operation>`**, Ereignisse `<modul>:<ereignis>`.
- **Ereignisse** tragen **keine** Hülle und **keinen Endzustand**.
- **Der Main validiert jede eingehende Nutzlast**; ungültig → `ungueltige_eingabe` **ohne jede Wirkung
  auf die Daten**. Ein Renderer-Fehler darf D1 nie beschädigen.
- **Kein stiller Fehlschlag.** Unerwartete Ausnahmen fängt das Gateway → `unbekannter_fehler`,
  **kein Stacktrace** in die Oberfläche.

### 5.2 Ausgabe-Profil (in JEDES ffmpeg-/Render-Issue) – TK 9.2.4 · **TV-KRITISCH**
MP4 `<ausgabeName>.mp4` (Name frei, FA-22) · **H.264 High, Level 4.0** · **1920×1080** · **30 fps CFR** · **yuv420p 8-bit** ·
**BT.709 explizit** · **SAR 1:1** · progressiv · **gedeckeltes VBR** (Ziel ~10, max 12 Mbit/s,
VBV 24 Mbit) · **geschlossene GOP ≤ 2 s + IDR an jedem Segmentanfang** · **stille AAC-Tonspur**
(R-06 entschieden: manche TVs verhalten sich bei rein-Video-MP4 eigenartig) · `+faststart`.

**Verboten:** 10-bit, 4:2:2/4:4:4, offene GOP, CRF ohne VBV-Deckel.

**Pipeline:** jedes Element auf **identisches** Profil normalisieren (`scale` + `pad`), dann per
**ffmpeg concat-Demuxer mit `-c copy`** verlustfrei zusammenfügen. Abweichende Seitenverhältnisse →
**schwarze Balken** (Letterbox/Pillarbox), **kein Beschnitt**. Harter Schnitt, keine Übergänge.

### 5.3 Frame-Genauigkeit (in jedes Trim-/Dauer-Issue) – TK 9.2.6
Akkurates (**decode-basiertes**) Seeking, **beide** Grenzen auf das **30-fps-Raster** gerundet,
effektive Dauer `(endFrame − startFrame) / 30`, **CFR** Zwischenclips, Gesamtdauer framegerundet.
Standard-Segmentdauer **10 s**, einstellbar **10–45 s**.

### 5.4 Pixelgleichheit (in jedes Canvas-/Vorschau-/Segment-Issue) – TK 9.10
- **EINE** Zeichenroutine → Canvas 1920×1080; Anzeige (CSS-skaliert) **und** PNG-Export aus
  **demselben Aufruf**. **Kein zweiter Zeichenpfad.**
- **Determinismus:** `devicePixelRatio` ignorieren; Schriften **und** Bild **vor** dem Zeichnen
  geladen; kein Zufall, kein Cache.
- **Marken-Schriften gebündelt** (Playfair Display fehlt auf Win/macOS) – OFL: Playfair Display,
  Archivo Black, Arimo.
- **Sicherheitsabstand 5 %** = 96 px horizontal / 54 px vertikal.
- **Text-Überlauf-Kaskade, verbindlich:** umbrechen → verkleinern → „…".
- **Fehlendes Motiv = Platzhalter**, der **nie** in den Render gelangt.
- Achtung Bänder: sitzt das Band am **unteren Bildrand**, ist innerhalb des Bandes nur
  Band-y **0–108** sicher.

### 5.5 Datenhaltung & Löschen (in jedes project-store-/media-service-Issue) – TK 9.5
- **Ein** D1-Schreib-Lock, gehalten vom `project-store`. **Kein zweites Lock** irgendwo.
- **Auto-Speichern:** entprellt **3–5 s**; **Sofort-Flush** vor Render/Export, bei Projektwechsel,
  beim Beenden (**blockiert** bis geschrieben); **atomar** (Temp + Rename); **ein** Backup
  `project.json.bak`; Speicherfehler **sichtbar** (nie still verschluckt), Änderungen bleiben im
  Speicher (**kein** Rollback).
- **Instant-Op ≠ gespeichert:** Erfolg heißt „gültig übernommen", **nicht** „auf Platte".
- **Einzel-Instanz-Sperre**, gebunden an den **DATENORT** (nicht den Programmpfad – portable EXE!).
- **Lösch-Asymmetrie:** **Medium löschen blockiert** bei Referenz (`asset_referenziert`);
  **Aktion löschen kaskadiert chirurgisch** – Segment-Elemente werden **entfernt**, in Videos werden
  **nur die betroffenen Band-Abschnitte** entfernt, das **Videoelement bleibt**; wird ein Band leer →
  `einblendung = null`, Video bleibt. Verwendete **Medien bleiben unangetastet**.
- **Löschen: D1 zuerst**, dann Datei (bewusste Wahl: Referenz-Konsistenz schlägt Aufräum-Ordnung).
- **Pfad-Autorität:** nur der `project-store` löst Pfade auf und trägt das **`media://`**-Protokoll;
  der Renderer greift auf Medien **nur lesend** über `media://` zu.

### 5.6 Auftragsverwaltung (in jedes Issue mit Import/Löschen/Render/Export) – TK 9.3
- **Streng seriell:** höchstens **ein** laufender Auftrag. Der `auftrags-manager` ist der **einzige**
  Sperr-Mechanismus – **kein** zweites Lock daneben.
- Vier Speicher mit **jeweils eigener Persistenz**: **Q1** flüchtig/RAM · **Q2** persistent bis
  erledigt (`projects/<id>/queue-retry.json`) · **Q3** dauerhaft unbegrenzt (`protokoll.json`,
  ein Eintrag je beendetem Versuch) · **Q4** dauerhaft rotierend (`warteschlangen-journal.json`,
  nur diagnostisch).
- Nach Neustart ist **Q1 leer** – in-flight-Arbeit ist nicht fortsetzbar (T1 verworfen, ffmpeg tot).

### 5.7 Plattform-Fallen (in jedes Dateisystem-Issue)
- **Windows:** gesperrte Datei → `EBUSY`/`EPERM`. **macOS:** `unlink` gelingt still, obwohl noch
  geöffnet. Beide Fälle **explizit** behandeln.
- **FAT32:** 4-GB-Grenze – **vorab** prüfen (`datei_zu_gross_fat32`, Hinweis auf exFAT).
- **Atomar schreiben:** Temp + Rename auf **derselben** Partition; `fsync` **vor** Erfolgsmeldung.
- **Export:** `.part` + Rename-Ersetzen, eine vorhandene gültige Zieldatei wird **nie** gefährdet;
  **Zielname = Quellname** – der frühere Zwang auf `loop.mp4` ist **entfallen** (FA-22). Mehrere
  Ausgabedateien dürfen auf dem Stick liegen; am TV muss dann **„Repeat One"** eingestellt sein.
- **Render schreibt atomar:** nach T1, dann Rename in `projects/<id>/output/` – ein Fehlschlag darf
  die vorhandene Datei gleichen Namens **nicht** zerstören (9.2.6). Der Name ist **Nutzereingabe**
  und wird validiert (keine Pfadtrenner, kein `..`, keine reservierten Windows-Namen).
- Dateinamen **ohne** Trennzeichen-Fallen; **ffmpeg-Argumente als Array**, **niemals**
  String-Konkatenation.

### 5.8 Undo/Redo – TK 9.13
Snapshot-basiert; **zwei getrennte Historien** (Projekt-Bearbeitung, Vorlagen-Editor); **nur
Laufzeit**, nicht persistent; **Aufträge sind nicht rückgängig machbar**; ein D1-veränderder Auftrag
**leert** die Undo-Historie.

### 5.9 Vorlagen – TK 9.11.1 / 9.12
- Drei Arten: **`vollflaeche`** (1920×1080 opak) · **`split`** (1920×H opak, Video auf 1080−H
  verkleinert, `vstack`) · **`einblendung`** (1920×H **mit Alpha**, Video in Vollgröße, `overlay`).
- `Zone.rahmen` = **absolute Pixel** im 1920×1080-Raster. **Zeichenreihenfolge = Array-Reihenfolge.**
  **Kein automatisches Umlayouten.** Feste Zonen sind Teil der Vorlage und im Editor unveränderlich.
- Farben/Schriften **nur als Rollen-Verweise** (nie Hex im Zonen-Modell).
- **`parent` ist die Merge-Beziehung:** `parent ≠ null` → **Arbeitskopie**, **nicht auswählbar**.
  Beim Speichern entweder in den Parent **mergen** (voller Ersatz, **kein** feldweiser Merge) oder
  `parent = null` setzen (eigenständige Vorlage – bewusst gekappt, um Merge-Konflikte zu vermeiden).
  Höchstens **eine** Arbeitskopie je Parent.
- Vorlagen sind **app-weit** (`vorlagen.json`), **nicht** im Projekt. Löschen nur, wenn **kein**
  Projekt sie nutzt → Referenzprüfung über **alle** Projekte. Eingebaute sind **unlöschbar und
  eingefroren**.
- Eingebaut: „Vollbild", „Split", „Band-Standard". Zone `hintergrund` wird **zuerst** gezeichnet
  (damit eine Aktion ohne Bild nicht schwarz rendert); „Vollbild" hat ein `scrim` für Textlesbarkeit;
  „Split" nutzt `contain` (kein Produkt-Beschnitt). Logo 420×120 oben links.

### 5.10 Weitere Festlegungen
- Medien werden **ins Projekt kopiert**; Medien **pro Projekt**; Aktionen **referenzierbar**
  (Bibliothek je Projekt, Mehrfachnutzung erlaubt); **Segment-PNGs immer neu rendern** (flüchtig).
- IDs: **UUID**; Reihenfolge = **Array-Reihenfolge**, **KEIN** `position`-Feld.
- Marke: Primär **#FF4040**, Logo nur auf dunklem Balken; Palette im Anforderungsdokument 4.2.
  **Die Wix-Artefakte in `design/design-tokens.json` sind aussortiert und NICHT zu verwenden.**

---

### 5.11 Ausgabedateien: mehrere je Projekt – FA-22 / TK 9.2.1, 9.2.6, 9.5.7, 9.6, AD 4.7
*(Anforderungsänderung vom 02.08. – gehört in jedes Render-, Export- und Pfad-Issue.)*
- **Ausgabeordner ist projektbezogen:** `projects/<id>/output/`. **Nicht** app-weit – sonst
  überschreibt ein Render in Projekt B die noch nicht exportierte Datei von Projekt A.
- **`RenderRequest.ausgabeName`** (Dateiname **ohne** Endung) bestimmt das Ziel. Vorbelegt mit
  **`Project.letzterAusgabeName`** → gleicher Name **ersetzt** die vorige Fassung, ein neuer Name legt
  eine zusätzliche Datei an. **Kein Zeitstempel im Namen** – Datum zeigt die UI aus dem Q3-Protokoll.
- **Atomar, vorige Fassung geschützt (9.2.6):** ffmpeg schreibt **nie** direkt auf den Zielnamen,
  sondern nach T1; erst die fertige, verifizierte Datei wird per Rename-mit-Ersetzen in den
  Ausgabeordner gebracht (gleiche Partition). **Ohne diese Regel zerstört ein misslungener Probelauf
  die letzte funktionierende Ausgabe** – und weil der Standardname der zuletzt verwendete ist, ist
  das der Regelfall, nicht der Ausnahmefall.
- **Der Name ist Nutzereingabe → validieren:** kein Pfadtrenner, kein `..`, keine für
  Windows/macOS/FAT32 unzulässigen Zeichen (`< > : " | ? *`, Steuerzeichen), nicht leer, keine
  reservierten Windows-Namen (`CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`, `LPT1`–`LPT9`). Der
  aufgelöste Pfad muss **innerhalb** `projects/<id>/output/` liegen → sonst `ungueltige_eingabe`.
- **`dateiname` gehört NICHT ins `RenderProfile`** – das Profil ist fest, der Name wechselt je Lauf.
- **Export:** Der Nutzer wählt **welche** Datei; auf dem Stick behält sie **ihren** Namen. Der Zwang
  auf `loop.mp4` ist **entfallen**. **Betriebsfolge:** Am Fernseher muss **„Repeat One"** statt
  „Repeat All" eingestellt sein, sonst durchläuft der Player den Ordner und zeigt bei jedem
  Dateiwechsel die Bedienleiste (Risiko R-04).

---

## 6. Zuschnitt: was ein gutes Issue ist

**Größe:** eine Funktion oder eine sehr eng gefasste Einheit, Zielgröße **30–80 Zeilen** Umsetzung.
Passt es nicht, **teile weiter**. Ein Issue = **ein** Modul; modulübergreifende Änderungen werden
getrennt und über die Abhängigkeit verkettet.

**Zuerst die Verträge, dann die Umsetzung.** Reihenfolge innerhalb eines Moduls:
1. Typen/Signaturen (`contracts/types`) – ohne Logik,
2. Gerüst mit definierten Fehlerpfaden,
3. die eigentliche Logik,
4. Grenzfälle/Härtung.

**Jedes Issue muss allein testbar sein.** Steht kein prüfbares Ergebnis drin, ist es kein Issue,
sondern eine Notiz.

**Das Grundgerüst bekommt eigene Issues** – Meilenstein **M0**, siehe Abschnitt 8b. Der Nutzer baut es
voraussichtlich selbst, aber es wird trotzdem in derselben Tiefe beschrieben: erstens weil die
Skelett-Entscheidungen (Prozess-Isolation, Datenort, ffmpeg-Pfad im gepackten Zustand) zu den
**teuersten** im ganzen Projekt gehören, zweitens damit sie abgebbar sind, falls er sie doch delegiert.
M0-Issues tragen das Label `wer:grundgeruest`.

**Nicht in Issues gehören:** CI/CD-Pipelines, Release-Automatisierung, Code-Signing, Telemetrie,
Container – nichts davon steht in der Planung. Fällt dir dazu etwas ein: **melden**, nicht anlegen.

---

## 7. Pflicht-Vorlage für jedes Issue

Verwende **exakt** diese Struktur. Alle Überschriften sind Pflicht; leer lassen ist nicht erlaubt –
steht nichts drin, hast du das Issue nicht verstanden.

> **Regel C – „verbindlich" heißt entschieden. Sonst gehört es nicht dorthin.**
>
> In den Block „Signatur (verbindlich – NICHT ändern)" darf **ausschließlich**, was tatsächlich
> feststeht. Alles Offene gehört **nur** in „Nicht selbst entscheiden" – **niemals in beide**.
> Verboten sind deshalb in der Signatur:
> - Alternativen (`A bzw. B`, `A oder B`, `# oder …`) – such eine aus oder verschieb die Frage,
> - Kommentare, die eine noch offene Entscheidung vorwegnehmen,
> - Werte, die parallel im STOPP-Block als zu klären geführt werden.
>
> **Warum das der teuerste Formfehler ist:** Der Agent liest „NICHT ändern" und setzt die Vorgabe um,
> **ohne zu fragen** – auch wenn sie nicht funktioniert. Eine falsche Vorgabe im verbindlichen Block
> ist damit schlimmer als gar keine: sie schaltet genau die Rückfrage ab, die Regel B erzwingen soll.
> (Im M0-Prüflauf vom 23.07. trat dieser Fehler **viermal** auf – u. a. eine Vitest-Konfiguration, die
> die Integrationstests niemals ausgeführt hätte.)
>
> **Prüffrage vor dem Abschicken:** Steht irgendein Punkt sowohl in der Signatur als auch im
> STOPP-Block? Dann ist das Issue kaputt.

> **Regel D – Zitate sind wörtlich oder gar nicht.**
>
> Was in Anführungszeichen mit TK-Verweis steht, muss **buchstäblich** so im Technischen Konzept
> stehen. Prüfe es per Suche, bevor du es als Zitat setzt. Eigene Zusammenfassungen sind erlaubt –
> aber **ohne** Anführungszeichen und **ohne** Quellenangabe, die Wörtlichkeit suggeriert.
> Grund: Regel A macht den Agenten vollständig von deiner Zitattreue abhängig; er kann nicht
> nachschlagen. Ein erfundenes Zitat ist von einem korrekten nicht unterscheidbar.

> **Regel E – Die Definition of Done muss im erlaubten Dateibereich erfüllbar sein.**
>
> Kein DoD-Punkt darf ein Ergebnis verlangen, das erst ein **anderes** Issue herstellt. Prüfe jeden
> Punkt gegen die Datei-Liste des Issues: Kann der Agent ihn allein, mit **nur** diesen Dateien,
> nachweisen? Wenn nein, gehört er in das Issue, das die fehlende Datei besitzt – oder in ein
> eigenes Integrations-Issue. Sonst muss der Agent entweder die Dateigrenze verletzen (und mit dem
> anderen Agenten kollidieren) oder das Kriterium stillschweigend abhaken.

````markdown
## Ziel (in einem Satz)
<Was danach funktioniert, fachlich – nicht „implementiere X">

## Modul & Datei
- Modul: `<modul-name>` (<Renderer|Main|geteilt>)
- Datei: `src/<pfad>/<datei>.ts`
- Vertrag: Technisches Konzept **<9.x>** (Quelle der Wahrheit)
- Prozess/Speicher: <P?/D?/Q?/T?/V1>

## Warum das im Gesamtsystem wichtig ist
<2–4 Sätze: wer ruft das auf, was hängt daran, was bricht bei einer falschen lokalen Entscheidung.>

## Signatur (verbindlich – NICHT ändern)
```ts
<exakte Signatur inkl. Ergebnis-Hülle und Typen>
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| … | … | … |

Ausgang bei Erfolg: `…`
Ausgang bei Fehler: Codes `…` (geschlossener Satz, s. Invarianten)

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- <Zitate aus Abschnitt 5 dieses Dokuments bzw. dem TK, die für DIESE Funktion gelten>

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| … | … | … |

## Nicht selbst entscheiden – STOPP und fragen
- <konkrete Punkte, bei denen der Agent nicht raten darf>

## Definition of Done
- [ ] <prüfbares Kriterium>
- [ ] Alle Fehlerpfade oben liefern den genannten Code (kein `throw` über die IPC-Grenze)
- [ ] Keine Datei außerhalb von `<Datei>` geändert (außer explizit erlaubt)
- [ ] <Test/Verifikation, konkret benannt>

## Abhängigkeiten
- Blockiert von: #<nr> (<warum>)
- Blockiert: #<nr>

## Bezug
FA-<nn>, NFA-<nn>, Akzeptanzkriterium <n>, TK <9.x>
````

---

## 8. Worked Example (so sieht die geforderte Tiefe aus)

````markdown
## Ziel (in einem Satz)
Trim-Grenzen eines Video-Elements auf das 30-fps-Raster rundenberechnen, sodass die effektive Dauer
framegenau und für den Render verlustfrei schneidbar ist.

## Modul & Datei
- Modul: `render-service` (Main)
- Datei: `src/main/render/trim-frames.ts`
- Vertrag: Technisches Konzept **9.2.6** (Quelle der Wahrheit)
- Prozess/Speicher: P4, T1

## Warum das im Gesamtsystem wichtig ist
Diese Funktion bestimmt, wie viele Frames jedes Videosegment am Ende hat. Die Segmente werden später
per concat-Demuxer mit `-c copy` **verlustfrei** zusammengefügt – das setzt voraus, dass alle Segmente
exakt dasselbe Profil und CFR 30 fps haben. Rundet diese Funktion falsch (z. B. `Math.round` auf
Sekunden statt auf Frames, oder nur eine der beiden Grenzen), driftet die Gesamtdauer, und die
angezeigte Dauer im `composer` stimmt nicht mit der gerenderten Ausgabedatei überein.

## Signatur (verbindlich – NICHT ändern)
```ts
export function berechneTrimFrames(
  trimStart: number,      // Sekunden, aus dem Listenelement
  trimEnde: number,       // Sekunden, aus dem Listenelement
  quellDauer: number,     // Sekunden, echte Länge der Quelldatei
): Ergebnis<{ startFrame: number; endFrame: number; dauerSekunden: number }>
```

## Eingang → Ausgang
| Eingang | Bedeutung | Grenzen/Validierung |
|---|---|---|
| `trimStart` | Schnittanfang in Sekunden | `≥ 0`, `< trimEnde` |
| `trimEnde` | Schnittende in Sekunden | `≤ quellDauer` |
| `quellDauer` | echte Quelllänge | `> 0`, endlich |

Ausgang bei Erfolg: `{ startFrame, endFrame, dauerSekunden }` mit
`dauerSekunden = (endFrame - startFrame) / 30`.
Ausgang bei Fehler: `ungueltige_eingabe`.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)
- „Akkurates (**decode-basiertes**) Seeking, **beide** Grenzen auf das **30-fps-Raster** gerundet,
  effektive Dauer `(endFrame − startFrame) / 30`, **CFR** Zwischenclips, Gesamtdauer framegerundet."
  (TK 9.2.6)
- Framerate ist **fest 30 fps** (TK 9.2.4). Die Zahl 30 kommt aus der Konstante des `RenderProfile`,
  **nicht** als Literal in diese Funktion.
- Es gilt `startFrame < endFrame` **immer**; ein Ergebnis mit 0 Frames ist ein Fehler, kein leeres
  Segment.
- Niemals `throw` – diese Funktion wird aus einer IPC-bedienten Operation heraus benutzt (TK 9.1.1).

## Fehlerpfade (vollständig)
| Situation | Code | Verhalten |
|---|---|---|
| `trimStart < 0` oder nicht endlich | `ungueltige_eingabe` | keine Wirkung |
| `trimEnde > quellDauer` | `ungueltige_eingabe` | keine Wirkung |
| Rundung ergibt `startFrame >= endFrame` | `ungueltige_eingabe` | keine Wirkung, Meldung nennt die Mindestdauer (1 Frame) |

## Nicht selbst entscheiden – STOPP und fragen
- **Rundungsrichtung** (`floor`/`ceil`/`round`) je Grenze: falls TK 9.2.6 sie nicht eindeutig festlegt,
  **nicht selbst wählen** – nachfragen. Die Wahl bestimmt, ob die Schleife über viele Segmente driftet.
- Ob bei `trimEnde == quellDauer` das letzte, evtl. unvollständige Frame mitgenommen wird.
- Toleranz beim Vergleich von Gleitkommazahlen (Epsilon) – nicht erfinden.

## Definition of Done
- [ ] `dauerSekunden` ist immer ein exaktes Vielfaches von `1/30`
- [ ] Beide Grenzen liegen auf dem Frame-Raster
- [ ] Alle drei Fehlerpfade liefern `ungueltige_eingabe`, kein `throw`
- [ ] Unit-Tests: Randfälle `trimStart = 0`, `trimEnde = quellDauer`, Sub-Frame-Bereich,
      nicht-frame-ausgerichtete Eingaben
- [ ] Keine Datei außer `src/main/render/trim-frames.ts` (+ zugehörige Testdatei) geändert

## Abhängigkeiten
- Blockiert von: #<Typen `Ergebnis<T>` + `RenderProfile`-Konstanten>
- Blockiert: #<Segment-Normalisierung im ffmpeg-adapter>

## Bezug
FA-14, TK 9.2.6, TK 9.2.4, Anforderungsdokument 4.4
````

---

## 8b. Meilenstein M0: das Grundgerüst

Diese Issues legst du **zuerst** an, Label `wer:grundgeruest`. Sie sind nach derselben Vorlage
(Abschnitt 7) auszuschreiben wie alle anderen.

**Warum M0 genauso streng behandelt wird wie Fachlogik:** Das Skelett entscheidet, *ob die
Invarianten überhaupt durchsetzbar sind*. Steht die Prozess-Isolation falsch, kann der Renderer am
D1-Lock und an der Pfad-Autorität vorbei schreiben – dann ist der ganze Abschnitt 9.5 Papier. Liegt das
ffmpeg-Binary im gepackten Zustand am falschen Ort, fällt es erst beim ersten echten Render beim Kunden
auf. Das sind die **teuersten** Fehlgriffe im Projekt, nicht die harmlosesten.

**Grenze M0 ↔ M1 (bindend, sonst schreiben zwei Agents dieselbe Datei):** M0 liefert **nur** die Hülle
`Ergebnis<T>` und die generischen Fehlercodes. **Alle** Domänentypen (`Project`, `Listenelement`,
`Aktion`, `Asset`, `Vorlage`, `Zone`, `Marke`, `Auftrag`, `RenderRequest`, `RenderProfile`) sind **M1**
(TK 9.11). M0 enthält **keine** Fachoperation und **keinen** Speicherzugriff auf D1.

| # | Issue | Kern | Risiko-Label |
|---|---|---|---|
| **S1** | Ordnerstruktur & TypeScript-Toolchain | `src/main`, `src/preload`, `src/renderer`, `src/shared/contracts`; **getrennte** tsconfigs je Prozess; `strict: true` | – |
| **S2** | Vite-Renderer + Main-Build + `dev`/`build`-Skripte | Renderer-HMR, Main-Neustart; `ffmpeg-static` bleibt **external** (nicht mitbundeln) | `risiko:verpackung` |
| **S3** | Main-Bootstrap & Fenster-Sicherheit | App-Lifecycle, `BrowserWindow`; **`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`**, `webSecurity` an, CSP gesetzt | `risiko:sicherheit` |
| **S4** | Preload-Bridge: die **einzige** Fläche | `contextBridge.exposeInMainWorld`; **kein** rohes `ipcRenderer` im Renderer; Kanalnamen aus geteilter Konstantenliste | `risiko:sicherheit` |
| **S5** | Datenort der App ermitteln (portabel!) | **eine** Funktion `ermittleDatenOrt()` für `projects/`, `config.json`, `vorlagen.json`, `protokoll.json`, `warteschlangen-journal.json` | `risiko:datenverlust` |
| **S6** | ffmpeg bündeln & Pfad im **gepackten** Zustand auflösen | Dev **und** Portable-EXE; Selbsttest `ffmpeg -version` beim Start | `risiko:tv-kritisch`, `risiko:verpackung` |
| **S7** | electron-builder Portable | Win 10/11 + macOS 13+, **kein** Installer, **ohne** Admin; Logo, Schriften, ffmpeg mitpacken | `risiko:verpackung` |
| **S8** | Marken-Schriften bündeln | Playfair Display, Archivo Black, Arimo (OFL) als **Dateien** + `@font-face`; `document.fonts.ready` abwarten | `risiko:pixelgleichheit` |
| **S9** | `media://`-Protokoll registrieren (**nur Hülse**) | Registrierung **vor** dem Fensterladen, privilegiertes Schema; Auflösung bleibt Stub | `risiko:sicherheit` |
| **S10** | React-Shell-Skelett (leer) | vier Reiter + Warteschlangen-Leiste als **Platzhalter**, keine Fachlogik | – |
| **S11** | Test-Setup | Vitest + Rauch-Test; **getrennter** Ordner für langsame ffmpeg-Integrationstests | `art:test` |
| **S12** | `Ergebnis<T>` + generische Fehlercodes | **die einzigen** Typen in M0 (Begründung s. Grenze oben) | `art:typen` |

### Die Fallen, die in den jeweiligen Block „Nicht selbst entscheiden" müssen

Diese Punkte sind der eigentliche Wert von M0. Schreibe sie **ausformuliert** in die Issues:

- **S1 – Renderer darf keine Node-Typen sehen.** Bekommt die Renderer-`tsconfig` `@types/node`,
  kompiliert später ein `import fs from "fs"` im Renderer **anstandslos** durch und umgeht die Regel
  „nur der Main berührt Dateisystem und ffmpeg" – der Fehler fällt erst im gepackten Build auf.
  Modulordner heißen **exakt** wie die Module aus TK Abschnitt 9, nicht „nach Gefühl".
- **S3 – Die drei Sicherheitsflags sind nicht verhandelbar**, auch nicht „temporär zum Debuggen".
  Mit `nodeIntegration: true` könnte der Renderer direkt an `project.json` schreiben; damit wären das
  **eine** D1-Lock (9.5) und die Pfad-Autorität (9.5.7) umgehbar – also genau die Invarianten, an denen
  die Datenkonsistenz hängt.
- **S4 – Das Preload darf die Hülle NICHT „vereinfachen".** Verboten: den `wert` auspacken und im
  Fehlerfall werfen. Das würde `Fehlercode` vernichten (TK 9.1.1) und Reparatur-Modus, Wiederholen und
  den FAT32-Hinweis auf „irgendwas ist schiefgelaufen" reduzieren. Das Preload leitet `Ergebnis<T>`
  **unverändert** durch und wandelt **nie** Codes um.
- **S5 – Der Datenort ist eine Produktentscheidung, keine Implementierungsdetail-Frage.** Neben der
  portablen EXE (echt portabel, aber möglicherweise schreibgeschützt oder auf einem USB-Stick) oder in
  `userData` (immer schreibbar, aber nicht mitwanderbar)? **Nicht selbst wählen – fragen.** An denselben
  Ort wird später die **Einzel-Instanz-Sperre** gebunden (TK 9.5.4: „an den DATENORT gebunden, nicht an
  den Programmpfad") – zwei EXE-Kopien auf denselben Daten müssen sich gegenseitig sehen.
- **S6 – asar-Falle.** Standardmäßig landet das ffmpeg-Binary **innerhalb** von `app.asar` und ist dort
  **nicht ausführbar**. Es muss per `asarUnpack` ausgepackt und über `app.asar.unpacked` aufgelöst
  werden. Auf macOS zusätzlich Ausführbar-Bit und Quarantäne beachten. **Ohne** den Start-Selbsttest
  merkt man das erst beim ersten echten Render – beim Kunden.
- **S7 – Signierung/Notarisierung ist nicht geplant.** Wenn der Build sie zu verlangen scheint:
  **fragen**, nicht auf eigene Faust Zertifikate oder Workarounds einbauen.
- **S8 – Nie System-Schriften verwenden.** **Playfair Display fehlt auf Windows und macOS** (TK 9.10.4).
  Wird sie nicht mitgeliefert, fällt der Canvas auf eine Ersatzschrift zurück – und Vorschau und
  gerenderte Ausgabedatei weichen sichtbar voneinander ab, obwohl beide „funktionieren".
- **S9 – Hier entsteht KEINE Pfadauflösung.** Die gehört dem `project-store` (9.5.7, M1). Wer sie ins
  Protokoll-Handler schreibt, erzeugt eine **zweite** Pfad-Autorität – genau das, was die Planung
  ausschließt. Außerdem: Protokolle **vor** `app.ready`/Fensterladen registrieren, sonst greifen sie nicht.
- **S10 – Nur Struktur, kein Verhalten.** Die Invarianten von `app-shell` (Reparatur-Modus über
  Reiterwechsel hinweg sichtbar, Reiterwechsel verwirft nie Arbeit, Warteschlangen-Leiste in jedem
  Reiter – TK 9.14.2) sind **M7**. Hier nur leere Rahmen.
- **S12 – Keine Domänentypen.** Wer hier `Project` oder `Vorlage` mit definiert, kollidiert mit dem
  M1-Issue zu TK 9.11.

---

## 9. Reihenfolge: Milestones und Abhängigkeiten

Lege die Issues in dieser Staffelung an; **innerhalb** einer Stufe möglichst unabhängig.

| Milestone | Inhalt | Warum diese Stelle |
|---|---|---|
| **M0 Grundgerüst** | Ordner/Toolchain, Vite+Main-Build, Main-Bootstrap mit Prozess-Isolation, Preload-Bridge, Datenort, ffmpeg-Bündelung, Portable-Verpackung, Marken-Schriften, `media://`-Hülse, leeres Shell-Skelett, Test-Setup, `Ergebnis<T>` (Abschnitt **8b**) | ohne durchsetzbare Prozess-Isolation und auffindbares ffmpeg sind alle späteren Invarianten unverbindlich |
| **M1 Fundament** | `contracts/types` (9.11), IPC-Konventionen + `ipc-gateway`/`ipc-client` (9.1.1), `config-store` (9.5.6), `project-store` inkl. D1-Lock, Auto-Speichern, `media://`-Auflösung (9.5) | alles andere hängt an Typen, Hülle und Pfad-Autorität; setzt **M0** voraus |
| **M2 Torwächter** | `auftrags-manager` mit Q1–Q4, Zustandsübergängen, Wiederholung (9.3) | **muss vor** allem Auftragsartigen stehen – er ist der einzige Sperr-Mechanismus |
| **M3 Medien** | `media-service`: Import atomar, Löschen D1-zuerst, Reconcile (9.4) | braucht M1 + M2 |
| **M4 Pixel** | `template-canvas` (9.10), `Vorlage`/`Zone`-Modell (9.11.1), `vorlagen-store` (9.12.1) | einzige Pixelquelle; Voraussetzung für Aktionen **und** Render |
| **M5 Inhalte** | `action-editor` (9.8), `vorlagen-editor` (9.12.2), `composer` inkl. Reparatur-Modus (9.7) | braucht M4 |
| **M6 Render & Export** | `ffmpeg-adapter`, `render-service` inkl. Split-Komposition (9.2, 9.2.8), `export-service` (9.6) | braucht M1–M5 |
| **M7 Oberfläche & Komfort** | `app-shell` (9.14), `queue-panel`, `preview-player` (9.9), Undo/Redo (9.13) | zuletzt, setzt die Module zusammen |

**Abhängigkeiten machst du explizit** – im Issue-Text („Blockiert von: #12") **und**, falls verfügbar,
über GitHubs Sub-Issue-/Task-List-Mechanik. Ein Agent darf nie an einem Issue arbeiten, dessen
Vorbedingung offen ist.

---

## 10. Labels

Erzeuge (falls nicht vorhanden) und verwende:

- **Bereich:** `modul:render-service`, `modul:auftrags-manager`, `modul:media-service`,
  `modul:project-store`, `modul:config-store`, `modul:export-service`, `modul:vorlagen-store`,
  `modul:ffmpeg-adapter`, `modul:template-canvas`, `modul:composer`, `modul:action-editor`,
  `modul:preview-player`, `modul:vorlagen-editor`, `modul:app-shell`, `modul:ipc`, `modul:contracts`
- **Ebene:** `ebene:main`, `ebene:renderer`, `ebene:geteilt`, `ebene:build` (Toolchain/Verpackung)
- **Art:** `art:typen`, `art:logik`, `art:fehlerbehandlung`, `art:ui`, `art:haertung`, `art:test`
- **Risiko:** `risiko:tv-kritisch` (alles, was das Ausgabe-Profil berührt),
  `risiko:datenverlust` (D1/Lock/Löschen/Export), `risiko:pixelgleichheit`,
  `risiko:sicherheit` (Prozess-Isolation, Preload, Protokolle),
  `risiko:verpackung` (Portable-Build, asar, Binary-/Asset-Pfade)
- **Status:** `braucht-entscheidung` — **nicht** einfach „hat einen STOPP-Block". Setze es nur, wenn
  dort eine **echte offene Frage** steht, deren Antwort die **Schnittstelle** oder das **Verhalten**
  festlegt: ohne sie kann der Agent kein korrektes Ergebnis liefern, nur eines, das später umgebaut
  werden muss.

  **Warum diese Einschränkung:** Regel B verlangt von **jedem** Issue einen STOPP-Block. Nach dem
  wörtlichen Kriterium „enthält offene Punkte" träfe das Label auf fast alle zu — im M1-Lauf auf
  **37 von 40** — und wäre als Filter wertlos. Es soll heißen „hier zuerst hinschauen, bevor du das
  an einen Agent gibst".

  **Die Unterscheidung, auf die es ankommt:** Ein STOPP-Block enthält typischerweise zwei Arten von
  Einträgen, und nur die zweite zählt:
  1. **Verbote** — „hier keine Pfadauflösung einbauen, auch nicht testweise", „die drei Sicherheits-
     flags dürfen nicht abgeschwächt werden", „keine Domänentypen ergänzen". Das sind Anweisungen,
     keine Entscheidungen. Sie brauchen **keine** Rückfrage und **kein** Label.
  2. **Echte offene Fragen** — „liegt der Datenort neben der EXE oder in `userData`?", „rundet der
     Store oder erst der Render-Pfad?", „braucht der `config-store` eine eigene Serialisierung?".
     **Nur diese** rechtfertigen das Label.

  Trägt ein Issue ausschließlich Verbote, gehört das Label **nicht** dran (im M0-Lauf betraf das
  #1, #4, #10, #11). Ein Textmuster-Automatismus funktioniert hier nicht — die Unterscheidung ist
  eine Beurteilung und gehört bewusst getroffen.
- **Zuständigkeit:** `wer:grundgeruest` (M0 – baut der Nutzer voraussichtlich selbst)

`risiko:*`-Issues brauchen im Text einen zusätzlichen Warnblock, warum ein Fehler hier teuer ist.

---

## 11. Ablauf (verbindlich)

1. **Lesen** – alle vier Dateien aus Abschnitt 1, vollständig.
2. **Inventar** – Tabelle aller geplanten Issues (Titel, Modul, Milestone, Abhängigkeiten,
   geschätzte Größe). **Dem Nutzer zeigen** und bestätigen lassen, *bevor* du Volltexte schreibst.
3. **Volltexte** – alle Issues nach der Vorlage aus Abschnitt 7 in `docs/agents/issues-draft.md`.
4. **Selbstprüfung** – Checkliste Abschnitt 12 abarbeiten und das Ergebnis berichten.
5. **Freigabe einholen.** Erst danach anlegen.
6. **Anlegen** mit `python tools/create-issues.py <verzeichnis> "<Milestone>"` – erst **ohne**
   `--go` (Trockenlauf: zeigt Titel und Labels, legt nichts an), dann mit `--go`. Der Trockenlauf ist
   Pflicht: beim M1-Lauf hat er zwei Skriptfehler aufgedeckt, bevor etwas nach außen ging.
   Vorher `gh repo view` prüfen (Remote vorhanden? sonst fragen) und fehlende Labels/Milestones
   anlegen. Issue-Körper immer **aus Datei** (`--body-file`), nie als Inline-String – Umlaute und
   Backticks überleben das Quoting nicht.
   Danach die Abhängigkeits-Nummern in den Texten nachziehen (die kennst du erst nach dem Anlegen).

**Titel-Konvention:** `[<modul>] <Verb> <Gegenstand>` – z. B.
`[render-service] Trim-Grenzen auf 30-fps-Raster runden`.

---

## 12. Selbstprüfung vor der Freigabe

- [ ] Jedes Issue nennt **Datei**, **Signatur**, **Vertragsabschnitt** und **Prozess/Speicher**.
- [ ] Jedes Issue, das die IPC-Grenze berührt, zitiert die **Ergebnis-Hülle** wörtlich –
      und unterscheidet **Aufruf-Ergebnis** von **Auftrags-Ergebnis**.
- [ ] Jedes ffmpeg-Issue zitiert das **vollständige Ausgabe-Profil** inkl. der **Verbote**.
- [ ] Jedes Issue hat einen **nicht leeren** Block „Nicht selbst entscheiden".
- [ ] **Regel C:** Kein Punkt steht gleichzeitig in der Signatur und im STOPP-Block; die Signatur
      enthält keine Alternativen (`bzw.`, `oder`, `# oder …`) und keine vorweggenommenen Entscheidungen.
- [ ] **Regel D:** Jedes als wörtlich gesetzte TK-Zitat per Suche im Dokument verifiziert.
- [ ] **Regel E:** Jeder DoD-Punkt ist mit **nur** den Dateien dieses Issues nachweisbar.
- [ ] Jede „Blockiert von"-Angabe trägt eine **Begründung** und passt zum Inhalt des Issues.
- [ ] `braucht-entscheidung` sitzt **nur** auf Issues mit einer echten offenen Frage — nicht auf
      solchen, deren STOPP-Block ausschließlich Verbote enthält (s. Abschnitt 10).
- [ ] Modul-Angabe, Titel-Präfix und **Dateipfad** passen zusammen: die Datei liegt im Ordner des
      genannten Moduls, nicht auf der `src/main/`- bzw. `src/renderer/`-Wurzel.
- [ ] Kein Issue verlangt eine Entscheidung, die die Planung schon getroffen hat (dann zitiere sie).
- [ ] Kein Issue erfordert Änderungen in einem anderen Modul, ohne dass das als Abhängigkeit steht.
- [ ] Jede **FA-01…FA-22** ist durch mindestens ein Issue gedeckt – erstelle eine
      **Abdeckungstabelle FA → Issues** und benenne Lücken ausdrücklich.
- [ ] Jedes der **9 Akzeptanzkriterien** ist auf Issues abgebildet.
- [ ] **M0 ist vollständig** (S1–S12 aus Abschnitt 8b) und jedes M0-Issue trägt `wer:grundgeruest`.
- [ ] **Grenze M0 ↔ M1 gehalten:** M0 definiert **nur** `Ergebnis<T>` + generische Fehlercodes,
      **keine** Domänentypen, **keine** Fachoperation, **keinen** D1-Zugriff.
- [ ] Die Fallen aus 8b stehen **ausformuliert** in den jeweiligen „Nicht selbst entscheiden"-Blöcken
      (Node-Typen im Renderer, die drei Sicherheitsflags, Hülle im Preload, Datenort, asar, Schriften,
      zweite Pfad-Autorität).
- [ ] Keine Issues für CI/CD, Release-Automatisierung, Signierung, Telemetrie (Abschnitt 6).
- [ ] Alle Abhängigkeitsketten sind zyklenfrei.

---

## 13. Was du NICHT tust

- **Kein Produktivcode.** Das Projekt ist in der Planungsphase; Code erst, wenn der Nutzer
  ausdrücklich sagt „wir sind nicht mehr im Plan".
- **Die Planungsdokumente nicht ändern.** Findest du einen Widerspruch: **melden**, nicht selbst
  reparieren – die Doku hat einen eigenen Workflow (Markdown ist Quelle der Wahrheit, `.docx` wird
  generiert, **nie** in eine geöffnete `.docx` schreiben).
- **Keine Issues ohne Freigabe anlegen**, und keine Massenanlage „zum Ausprobieren".
- **Nicht raten.** Ambiguität ist in diesem Projekt der Hauptfeind: „Ich hasse Ambiguität. Triff klare
  Annahmen, benenne sie offen und beseitige Unklarheiten aktiv." Wo die Planung schweigt, gehört der
  Punkt in „Nicht selbst entscheiden" **und** in eine Rückfrage an den Nutzer – nicht in eine stille
  Annahme im Code.
