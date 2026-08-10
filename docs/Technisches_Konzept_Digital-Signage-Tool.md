# Technisches Konzept – Digital-Signage-Tool

**Projekt:** Digital-Signage-Tool für das Fitnessstudio der Baller Gruppe
**Bezug:** Anforderungsdokument v1.3 (das „Was")
**Inhalt dieses Dokuments:** das „Wie" – Architektur, Datenbestand, Datenfluss, Module
**Version:** 3.4 (HLD vollständig, geprüft)
**Datum:** 10.08.2026
**Status:** In Planung

---

## 1. Zweck und Einordnung

Dieses Dokument beschreibt die technische Umsetzung. Die fachlichen Anforderungen (Funktionen, Regeln, Ausgabe-Profil) stehen im **Anforderungsdokument v1.2** und werden hier nicht wiederholt, sondern referenziert. Es ist ein lebendes Planungsdokument: Datenbestand und Datenfluss sind festgelegt, das High-Level-Design (Module + Schnittstellen) ist in Abschnitt 9 ausgearbeitet (Stand und offene Punkte: siehe Schluss von Abschnitt 9).

## 2. Architektur-Überblick

Die Anwendung ist eine **Electron-Desktop-App** (portable, Windows + macOS). Sie besteht aus zwei Laufzeit-Bereichen, verbunden über IPC:

- **Renderer (React-UI):** Medienliste, Drag-and-drop, Aktions-Editor, **Vorlagen-Editor**, **Projektverwaltung**, Vorschau, Canvas-Rendering der Segmente und Bänder.
- **Main-Prozess (Node):** Orchestrierung, Dateisystem, Projektspeicher, Aufruf des gebündelten `ffmpeg`. Der Renderer erhält Lesezugriff auf Medien (Vorschau, Thumbnails) ausschließlich über ein vom Main bereitgestelltes `media://`-Protokoll (Pfad-Autorität: `project-store`, 9.5.7).

Der Main-Prozess ist der einzige Bereich mit `ffmpeg`- und Dateisystem-Zugriff. Begründung der Entkopplung vom Fernseher: Anforderungsdokument, Abschnitt 3.

Es läuft immer **genau eine App-Instanz**: die Schreib-Sperren auf die Projektdaten sind prozessintern, zwei Instanzen würden dieselbe Datei unkoordiniert schreiben. Ein zweiter Start fokussiert das bestehende Fenster (Details und die Besonderheit bei portabler Auslieferung: 9.5.4).

Alle länger laufenden oder dateiverändernden Vorgänge (Import, Löschen von Medien, finaler Render, USB-Export) laufen im Main-Prozess über die **Auftragsverwaltung** (`auftrags-manager`) – ein Verwaltungs-Subsystem, das mehr ist als eine Warteschlange: es **gibt Prozesse seriell frei** (der einzige Ausführungspunkt, FA-16 ff., NFA-09), führt ihren Zustand, ermöglicht das Wiederholen von Fehlschlägen und hält dafür **vier eigene Speicher mit jeweils eigener Persistenz** (Q1 flüchtig, Q2 persistent-bis-erledigt, Q3 dauerhaft-unbegrenzt, Q4 dauerhaft-rotierend). Für den Nutzer ist das über das `queue-panel` sichtbar. Details: Abschnitt 9.3.

## 3. Technologie-Stack (entschieden)

| Bereich | Wahl |
|---|---|
| Sprache | TypeScript |
| Laufzeit/Shell | Electron (portable Auslieferung, Win + macOS) |
| UI | React + Vite |
| Reihenfolge (DnD) | dnd-kit |
| Segment-Rendering | HTML5-Canvas → PNG |
| Video/Encoding | gebündeltes `ffmpeg` **und `ffprobe`** (`ffmpeg-static` + `ffprobe-static` + `fluent-ffmpeg`) |
| Datenhaltung | JSON je Projekt (`lowdb`); SQLite optional |
| Verpackung | `electron-builder`, Portable-Target |

## 4. Datenbestand nach Lebensdauer

Die Lebensdauer entscheidet, was persistent, was temporär und was nur flüchtig ist.

**A — Persistente Fachdaten** (Projektmaterial)

- **Projekt** – ID, Name, Erstell-/Änderungsdatum, geordnete Elementliste. *(FA-15, FA-10)*
- **Aktion/Produkt** – ID, Titel (Pflicht), Beschreibung?, Preis?, Bildreferenz?, CTA?, Anzeigedauer?, Vorlagen-ID, Akzentfarbe? (ersetzt die Akzent-Rollen der Vorlage, 9.10.9). *(FA-02, 4.1)*
- **Medium (Asset)** – ID, Typ (video|image), Dateiname, Maße, Dauer (Video, via ffprobe), Importdatum. *(FA-01)*
- **Listenelement** – ID, Art (Video|Bild|Aktions-Segment), Referenz, Dauer, Trim-Start/-Ende sowie – **nur bei Video** – optional eine **Einblendung** für die parallele Anzeige: `{ bandVorlageId, abschnitte: [{ aktionRef, dauer }] }`. Die Abschnitte rotieren während des Videos und wiederholen sich, wenn sie kürzer als das Video sind (9.2.8). **Die Reihenfolge ist die Array-Reihenfolge – es gibt kein separates Positions-Feld** (9.11.3). *(FA-04, FA-05, FA-06, FA-14, FA-20)*
- **Vorlage** – datengetriebene Layout-Definition: `art` (vollflächig | Split-Band | Einblendung), `höhe` (bei Bändern), `parent` (Arbeitskopie-Herkunft) und Zonen (feste vs. freie). Eingebaut: „Vollbild", „Split", „Band-Standard". **App-weit** gespeichert, nicht im Projekt (9.11.1, 9.12). *(FA-11, FA-13, FA-20, 4.1)*
- **Ausführungs-Protokoll / Ausgabe-Historie** – ID, Projekt-ID, Datum, Pfad, Dauer (nur bei Render, sonst leer – 9.3), Größe. Geführt von der Auftragsverwaltung als Speicher **Q3** (append-only, dauerhaft), nicht mehr in D3. *(Abschnitt 7, 9.3)*

**B — App-/Konfigurationsdaten** (persistent, app-weit)

- **App-Zustand** – aktives Projekt, letztes Export-Ziel, UI-Voreinstellungen. *(FA-15)*
- **Marken-/Design-Konfiguration** – Palette, Schriften, Logo. *(4.2)*

**C — Temporäre Arbeitsdaten auf der Platte** (pro Renderlauf, danach löschbar)

- gerenderte Segment-PNGs, normalisierte Zwischenclips `seg_*.mp4`, concat-Liste.
- **Nicht** hier: die **fertige** Ausgabedatei. Sie entsteht direkt im Projekt-Ausgabeordner als `<name>.mp4.part` und wird dort umbenannt (Begründung: Abschnitt 6 und 9.2.6). T1 hält ausschließlich Zwischenprodukte.

**D — Reine Laufzeitdaten** (nur Arbeitsspeicher)

- UI-Zustand, Render-Fortschritts-Events, `ffmpeg`-Prozess-Handles, abgeleitete Werte (z. B. Gesamtlänge → 30-Minuten-Warnung, 5.3).
- **Q1 – Aktive Warteschlange** der Auftragsverwaltung (anstehende Aufträge + der eine laufende, mit Fortschritt). Bewusst **nicht** persistent: nach einem Neustart ist die aktive Queue leer (Anforderungsdokument 4.3), denn in-flight-Arbeit ist nicht fortsetzbar (T1 verworfen, `ffmpeg`-Prozess tot).

**Die vier Speicher der Auftragsverwaltung** (Prozess P6, Abschnitte 7 und 9.3) – bewusst mit *jeweils eigener* Persistenz:

- **Q1 – Aktive Warteschlange** *(Kategorie D, flüchtig/RAM)*: anstehende + laufender Auftrag; nach Neustart leer.
- **Q2 – Wiederholungs-Speicher** *(persistent bis erledigt)*: fehlgeschlagene Aufträge (mit `payload`, `fehler`, `versuche`) und `pendingDeletions`; **überlebt den Neustart**, Eintrag wird nach erfolgreichem Wiederholen oder Verwerfen gelöscht. Grund: „Wiederholen" muss auch einen Absturz überstehen.
- **Q3 – Ausführungs-Protokoll** *(dauerhaft, append-only, unbegrenzt)*: **ein Eintrag je beendetem Versuch** – was lief wann mit welchem Ergebnis; wird nie automatisch gelöscht. Enthält die Ausgabe-Historie (erfolgreiche Renders) als Teilmenge.
- **Q4 – Warteschlangen-Journal** *(dauerhaft, aber rotierend)*: die **Bewegungen** der Schlange (eingereiht, gestartet, entfernt, erneut eingereiht). Rein **diagnostisch** – deshalb genügen die letzten N Bewegungen. Bewusst **getrennt von Q3**, damit das Protokoll als „was wurde produziert" lesbar bleibt.

## 5. Modellierungs-Entscheidungen

1. **Medien werden in das Projekt kopiert** (nicht referenziert) – robust gegen verschobene/gelöschte Originale.
2. **Aktionen sind referenzierbare Datensätze** – mehrere Listenelemente dürfen auf dieselbe Aktion zeigen (3a); Aktions-Bibliothek je Projekt.
3. **Medien liegen pro Projekt** – klare Grenzen, keine geteilten Abhängigkeiten.
4. **Segment-PNGs werden immer neu gerendert** (flüchtig, Kategorie C) – kein Cache in v1.
5. **Vorlagen sind datengetrieben** ab v1 – **eigene Vorlagen (FA-13) sind Teil des Prototyps** (nicht später) und bleiben trotzdem nur ein neuer Datensatz, kein Code-Umbau.

## 6. Speicher- und Ordnerkonventionen

Aus den Entscheidungen 1 + 3 folgt: jedes Projekt besitzt einen eigenen Ordner mit `media/`-Unterordner; Listenelemente verweisen **relativ** dorthin, nie auf Originalpfade. Aus Entscheidung 4 folgt: Segment-PNGs, Zwischenclips und concat-Liste leben ausschließlich im temporären Bereich (T1) und werden nach jedem Lauf verworfen. Die **fertige** Ausgabedatei gehört ausdrücklich **nicht** dazu – sie entsteht direkt im Projekt-Ausgabeordner (Begründung unten).

```
<App-Ordner>/
  config.json                # B/D3: aktives Projekt, letztes Export-Ziel, UI-Voreinstellungen
  protokoll.json             # Q3: Ausführungs-Protokoll (dauerhaft, unbegrenzt)
  warteschlangen-journal.json # Q4: Bewegungen der Schlange (dauerhaft, rotierend)
  vorlagen.json              # A/V1: Vorlagen-Bibliothek – APP-WEIT für alle Projekte (9.11.1.1)
  vorlagen.json.bak          # A/V1: letzte heile Version (9.12.1)
  marken.json                # A/V2: Marken-Bestand – APP-WEIT für alle Projekte (FA-23, 9.15.1)
  marken.json.bak            # A/V2: letzte heile Version (9.15.1)
  marken-assets/             # A/V2: IMPORTIERTE Logos und Schriften (FA-24, 9.15.3)
    <marken-id>/
      logo.<ext>             #      importiertes Logo dieser Marke
      schriften/<datei>.woff2 #     importierte Schriften dieser Marke
  projects/
    <projekt-id>/
      project.json           # A: Projekt, Aktionen, Liste, Vorlagen-Ref
      project.json.bak       # A: letzte heile Version (Auto-Speichern-Backup, 9.5.4)
      media/                 # A/D2: kopierte Videos und Bilder
      output/                # A: gerenderte MP4s DIESES Projekts – mehrere, frei benannt (FA-22)
        <name>.mp4           # A: fertige Ausgabedatei
        <name>.mp4.part      # C: laufender Render – HIER, nicht in <Temp> (9.2.6)
      queue-retry.json       # Q2: offene Fehlschläge + pendingDeletions (persistent bis erledigt)
<Temp>/reel-XXXX/            # C/T1: flüchtig (PNG, seg_*.mp4, concat.txt) – NUR Zwischenprodukte
                             # Q1 (aktive Warteschlange) lebt nur im RAM, keine Datei
```

**Der Ausgabeordner gehört zum Projekt** (`projects/<id>/output/`), nicht zur Anwendung. Läge er app-weit, überschriebe ein Render in Projekt B die noch nicht exportierte Ausgabe von Projekt A – ein stiller Datenverlust. Je Projekt dürfen **mehrere** benannte MP4s darin liegen (FA-22, Anforderungsdokument 4.7).

**Die fertige Ausgabedatei wird im Ausgabeordner selbst gestaget, nicht in `<Temp>`.** `ffmpeg` schreibt den finalen `concat`-Schritt nach `projects/<id>/output/<name>.mp4.part`; erst die fertige und verifizierte Datei wird **innerhalb desselben Ordners** per Rename-mit-Ersetzen zu `<name>.mp4` (9.2.6). *Begründung:* Umbenennen ist nur auf **derselben Partition** unteilbar. Die App ist **portabel** – ihr Datenort kann auf einem USB-Stick oder einem zweiten Laufwerk liegen, `<Temp>` liegt dagegen auf der Systemplatte. Läge das Staging in `<Temp>`, wäre der abschließende `rename` ein laufwerksübergreifender Aufruf und schlüge mit `EXDEV` fehl; der naheliegende Ausweg „kopieren und löschen" ist **nicht** unteilbar und hebt damit genau die Schutzzusage aus FA-22 / Akzeptanzkriterium 9 auf: Ein Absturz mitten im Kopieren zerstört die letzte funktionierende Ausgabedatei. Der Fehler fiele beim Entwickeln **nicht** auf, weil dort Temp und Daten auf derselben Platte liegen. **T1 behält** die Segment-PNGs, die Zwischenclips `seg_*.mp4` und die concat-Liste – nur das Staging der Enddatei wandert in den Ausgabeordner.

**Der Marken-Bestand liegt app-weit** (`marken.json`), nicht im Projekt – wie die Vorlagen (9.11.1.1). Eine Marke, die für ein Projekt angelegt wurde, steht damit allen zur Verfügung; ein Werbepartner wird **einmal** erfasst und nicht je Projekt erneut. Die **Daten** liegen in **einer** JSON mit `.bak`, genau wie bei den Vorlagen; die **importierten Dateien** dagegen in einem Ordner **je Marke** (`marken-assets/<marken-id>/`) – dasselbe Muster wie `projects/<id>/media/`. Beide Präzedenzfälle existierten bereits; für Marken ist nichts Neues erfunden.

Die Auftragsverwaltung legt ihre persistenten Speicher als schlanke JSON-Dateien ab: **Q2** je Projekt (`queue-retry.json` – Fehlschläge/pendingDeletions gehören zum Projekt und werden bei dessen Öffnen nachgeholt) sowie **Q3** und **Q4** app-weit (`protokoll.json` – projektübergreifendes Protokoll; `warteschlangen-journal.json` – diagnostische Bewegungen, rotierend). **Q1** ist rein flüchtig.

## 7. Datenfluss – Prozesse und Speicher

Das folgende zusammengeführte DFD zeigt die Autoren-Prozesse, die Speicher, die beiden Render-Arten und – neu – die **Auftragsverwaltung (P6)** als Steuerungsschicht mit ihren vier Speichern Q1–Q4. Beide Render-Arten lesen denselben Eingang (Liste + Medien) und unterscheiden sich nur in Engine und Ausgang; die dateiverändernden bzw. langen Prozesse (P1 import/löschen, P4 render/export) werden von P6 **seriell freigegeben**.

<svg viewBox="0 0 960 664" width="960" height="664" xmlns="http://www.w3.org/2000/svg" role="img" style="max-width:100%;height:auto">
<title>DFD mit Auftragsverwaltung (P6), den vier Queue-Speichern Q1-Q4 und Vorlagenverwaltung (P7/V1)</title>
<defs>
<marker id="da" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9 z" fill="#6b6b66"/></marker>
<marker id="am" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9 z" fill="#d9a441"/></marker>
</defs>
<rect x="280" y="22" width="120" height="44" rx="8" fill="#ede7f6" stroke="#7e57c2" stroke-width="1"/>
<text x="340" y="49" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">Nutzer</text>
<rect x="30" y="104" width="190" height="56" rx="8" fill="#e6f4f1" stroke="#2a9d8f" stroke-width="1"/>
<text x="125" y="124" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">P1 Medienverwaltung</text>
<text x="125" y="144" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Import, Kopie, ffprobe</text>
<rect x="245" y="104" width="190" height="56" rx="8" fill="#e6f4f1" stroke="#2a9d8f" stroke-width="1"/>
<text x="340" y="124" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">P2 Inhaltsverwaltung</text>
<text x="340" y="144" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Aktionen, Vorlage zuordnen</text>
<rect x="460" y="104" width="190" height="56" rx="8" fill="#e6f4f1" stroke="#2a9d8f" stroke-width="1"/>
<text x="555" y="124" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">P3 Zusammenstellung</text>
<text x="555" y="144" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Liste, Reihenfolge, Trim</text>
<text x="300" y="88" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Instant-Eingaben</text>
<line x1="325" y1="66" x2="340" y2="102" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<line x1="360" y1="66" x2="540" y2="102" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<rect x="30" y="214" width="190" height="50" rx="4" fill="#f2f2f0" stroke="#9a9a95" stroke-width="1"/>
<text x="125" y="232" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">D2 Medienordner</text>
<text x="125" y="250" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">media/ (Kopien)</text>
<rect x="245" y="214" width="190" height="50" rx="4" fill="#f2f2f0" stroke="#9a9a95" stroke-width="1"/>
<text x="340" y="232" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">D1 Projekt-Store</text>
<text x="340" y="250" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Liste, Aktionen, Refs</text>
<rect x="460" y="214" width="190" height="50" rx="4" fill="#f2f2f0" stroke="#9a9a95" stroke-width="1"/>
<text x="555" y="232" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">D3 App-Konfig</text>
<text x="555" y="250" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">aktiv, Export-Ziel, UI</text>
<text x="98" y="188" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Kopie</text>
<line x1="125" y1="160" x2="125" y2="212" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<text x="240" y="184" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Asset</text>
<line x1="195" y1="160" x2="300" y2="212" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<text x="362" y="186" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Aktion</text>
<line x1="340" y1="160" x2="340" y2="212" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<text x="468" y="184" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Liste</text>
<line x1="520" y1="160" x2="400" y2="212" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<rect x="60" y="322" width="210" height="60" rx="8" fill="#e3f0fb" stroke="#2f6db5" stroke-width="1"/>
<text x="165" y="344" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">P5 Vorschau</text>
<text x="165" y="364" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">UI-Sim, ohne ffmpeg</text>
<rect x="410" y="322" width="210" height="60" rx="8" fill="#fbe7e3" stroke="#e5634d" stroke-width="1"/>
<text x="515" y="344" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">P4 Finaler Render</text>
<text x="515" y="364" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">ffmpeg, T1, concat</text>
<text x="232" y="296" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Liste + Medien</text>
<line x1="305" y1="264" x2="185" y2="320" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<text x="452" y="296" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Liste + Medien</text>
<line x1="375" y1="264" x2="495" y2="320" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<rect x="85" y="436" width="160" height="50" rx="8" fill="#ede7f6" stroke="#7e57c2" stroke-width="1"/>
<text x="165" y="456" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">Bildschirm</text>
<text x="165" y="473" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Live-Vorschau</text>
<text x="192" y="412" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">anzeigen</text>
<line x1="165" y1="382" x2="165" y2="434" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<rect x="408" y="436" width="100" height="50" rx="8" fill="#fcf1da" stroke="#d9a441" stroke-width="1"/>
<text x="458" y="456" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">ffmpeg</text>
<text x="458" y="473" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">gebündelt</text>
<text x="430" y="412" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Aufrufe</text>
<line x1="458" y1="382" x2="458" y2="434" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-start="url(#da)" marker-end="url(#da)"/>
<rect x="525" y="436" width="120" height="50" rx="8" fill="#f2f2f0" stroke="#9a9a95" stroke-width="1"/>
<text x="585" y="456" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">USB-Stick</text>
<text x="585" y="473" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Ausgabe-MP4</text>
<text x="575" y="412" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Export</text>
<line x1="545" y1="382" x2="580" y2="434" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<rect x="720" y="96" width="210" height="60" rx="8" fill="#fcf1da" stroke="#d9a441" stroke-width="1.5"/>
<text x="825" y="120" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">P6 Auftragsverwaltung</text>
<text x="825" y="140" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">seriell · Zustand · Wiederholung</text>
<rect x="720" y="182" width="210" height="30" rx="4" fill="#f2f2f0" stroke="#9a9a95" stroke-width="1" stroke-dasharray="4 2"/>
<text x="825" y="201" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Q1 Warteschlange · RAM</text>
<rect x="720" y="216" width="210" height="30" rx="4" fill="#f2f2f0" stroke="#9a9a95" stroke-width="1" stroke-dasharray="4 2"/>
<text x="825" y="235" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Q2 Wiederholung · bis erledigt</text>
<rect x="720" y="250" width="210" height="30" rx="4" fill="#f2f2f0" stroke="#9a9a95" stroke-width="1" stroke-dasharray="4 2"/>
<text x="825" y="269" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Q3 Protokoll · unbegrenzt</text>
<rect x="720" y="284" width="210" height="30" rx="4" fill="#f2f2f0" stroke="#9a9a95" stroke-width="1" stroke-dasharray="4 2"/>
<text x="825" y="303" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Q4 Journal · rotierend</text>
<text x="560" y="60" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Auftrag</text>
<line x1="400" y1="44" x2="718" y2="112" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<line x1="880" y1="156" x2="880" y2="180" stroke="#9a9a95" stroke-width="1.5" fill="none" marker-start="url(#da)" marker-end="url(#da)"/>
<path d="M720 118 L690 118 L690 82 L125 82 L125 102" stroke="#d9a441" stroke-width="1.5" fill="none" stroke-dasharray="5 3" marker-end="url(#am)"/>
<text x="405" y="76" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#d9a441" font-weight="600">Freigabe import/löschen</text>
<path d="M716 140 L704 140 L704 352 L622 352" stroke="#d9a441" stroke-width="1.5" fill="none" stroke-dasharray="5 3" marker-start="url(#am)" marker-end="url(#am)"/>
<text x="668" y="330" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#d9a441" font-weight="600">Freigabe / Ergebnis</text>
<text x="672" y="52" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Einstellungen</text>
<path d="M400 58 L690 58 L690 234 L652 234" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<rect x="716" y="404" width="214" height="56" rx="8" fill="#e6f4f1" stroke="#2a9d8f" stroke-width="1"/>
<text x="823" y="426" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">P7 Vorlagenverwaltung</text>
<text x="823" y="446" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Arten, Zonen, Arbeitskopie/Merge</text>
<rect x="716" y="500" width="214" height="50" rx="4" fill="#f2f2f0" stroke="#9a9a95" stroke-width="1"/>
<text x="823" y="518" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">V1 Vorlagen-Bibliothek</text>
<text x="823" y="536" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">app-weit, inkl. Arbeitskopien</text>
<rect x="716" y="560" width="214" height="50" rx="4" fill="#f2f2f0" stroke="#9a9a95" stroke-width="1"/>
<text x="823" y="578" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">V2 Marken-Bestand</text>
<text x="823" y="596" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">app-weit, ableitbar (FA-23)</text>
<text x="884" y="20" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Vorlagen-Bearbeitung</text>
<path d="M400 30 L948 30 L948 432 L932 432" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<line x1="823" y1="460" x2="823" y2="498" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<text x="792" y="484" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Vorlage</text>
<path d="M716 516 L668 470 L668 400 L622 378" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<text x="690" y="424" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Vorlage (lesend)</text>
<text x="690" y="440" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="10" fill="#8f8f8f">an P2 / P4 / P5</text>
<path d="M716 585 L640 585 L640 392 L622 384" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<text x="600" y="560" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Marke (lesend)</text>
<text x="600" y="576" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="10" fill="#8f8f8f">an P2 / P4 / P5</text>
<rect x="150" y="624" width="13" height="13" rx="3" fill="#e3f0fb" stroke="#2f6db5"/>
<text x="170" y="634" text-anchor="start" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Vorschau (ohne ffmpeg)</text>
<rect x="330" y="624" width="13" height="13" rx="3" fill="#fbe7e3" stroke="#e5634d"/>
<text x="350" y="634" text-anchor="start" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Finaler Render → Ausgabe-MP4</text>
<rect x="560" y="624" width="13" height="13" rx="3" fill="#fcf1da" stroke="#d9a441"/>
<text x="580" y="634" text-anchor="start" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Auftragsverwaltung (amber = Steuerung/Freigabe)</text>
<rect x="150" y="646" width="13" height="13" rx="3" fill="#e6f4f1" stroke="#2a9d8f"/>
<text x="170" y="656" text-anchor="start" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Autoren-Prozesse (P1–P3, P7)</text>
</svg>

*Abbildung 1: Zusammengeführtes DFD. Grau = Datenfluss; **amber = Steuerungsfluss** der Auftragsverwaltung (P6). P6 nimmt Aufträge entgegen und gibt die ausführenden Prozesse **seriell frei** (import/löschen → P1, render/export → P4); die vier gestrichelten Speicher Q1–Q4 halten aktive Warteschlange, Wiederholungen, Protokoll und Warteschlangen-Journal (jeweils eigene Persistenz, s. 7.2); **V1** und **V2** sind die beiden app-weiten, projektunabhängigen Bestände – Vorlagen und Marken. **Die Marke kommt seit v3.4 aus V2, nicht mehr aus D3**; `config.json` führt nur noch aktives Projekt, Export-Ziel und UI-Voreinstellungen. Blau = Vorschau-Render (ohne ffmpeg → Bildschirm), Koralle = finaler Render (ffmpeg → benannte Ausgabe-MP4, von dort auf USB). Instant-Eingaben (Aktionen, Liste, Trim) laufen an P6 vorbei direkt in P2/P3. **P7 Vorlagenverwaltung** schreibt Vorlagen in die app-weite Bibliothek **V1**; V1 wird von P2 (Zuordnung) sowie P4/P5 (Zeichnen der Segmente und Bänder) **nur lesend** genutzt – im Bild ist beispielhaft der Weg zu P4 gezeichnet. Die Kataloge 7.1–7.3 beschreiben dieselben Flüsse präzise in Textform.*

### 7.1 Prozess-Katalog

| ID | Prozess | Aufgabe | Eingang | Ausgang | Anf. |
|---|---|---|---|---|---|
| P1 | Medienverwaltung | Import, Kopie in `media/`, ffprobe-Metadaten | Datei vom Nutzer | Asset-Datensatz, kopierte Datei | FA-01 |
| P2 | Inhaltsverwaltung | Aktionen/Produkte pflegen, Vorlage zuordnen | Nutzereingaben | Aktion + Vorlagen-Ref | FA-02, 4.1 |
| P3 | Zusammenstellung | Liste bauen, ordnen, Dauer/Trim, Gesamtlänge | Assets, Aktionen | Listenelemente | FA-04/05/06/14 |
| P4 | Finaler Render + Export | Segmente rendern, normalisieren, concat, USB-Export | Liste + Medien | benannte Ausgabe-MP4; Ergebnis → P6 | FA-08/09/22, 5 |
| P5 | Vorschau | Sequenz live in der UI simulieren (ohne ffmpeg) | Liste + Medien | Bilddarstellung | FA-07 |
| P7 | Vorlagenverwaltung | Vorlagen anlegen/bearbeiten: Art, Zonen, Parameter; Arbeitskopie und Merge | Nutzereingaben | Vorlage in V1 | FA-13, 4.6 |
| P6 | Auftragsverwaltung | Aufträge annehmen, **seriell** freigeben (genau einer), Zustand führen, Fehlschläge wiederholen, protokollieren | Auftrag (import/loeschen/render/export) | Freigabe an P1/P4; Q1–Q4 | FA-16/17/18, NFA-09 |

**Ausführung:** P1 (Import/Löschen) und P4 (Render/Export) laufen **ausschließlich als Aufträge über P6** (seriell freigegeben). P2/P3 sind **Instant-Operationen** (reine D1-Schreibvorgänge, nicht über P6). P5 (Vorschau) läuft **außerhalb** der Queue. Details: Abschnitt 9.3.

### 7.2 Speicher-Katalog

| ID | Speicher | Inhalt | Lebensdauer | Schreiber |
|---|---|---|---|---|
| D1 | Projekt-Store | Projekte, Aktionen, Liste, Vorlagen-Ref | persistent | P1, P2, P3 |
| D2 | Medienordner | kopierte Videos/Bilder je Projekt | persistent | P1 |
| D3 | App-Konfig | aktives Projekt, Marke, UI-Voreinstellungen | persistent | App |
| T1 | Render-Arbeitsbereich | Segment-PNGs, `seg_*.mp4`, concat-Liste – **nicht** die fertige Ausgabedatei (9.2.6) | flüchtig | P4 |
| Q1 | Aktive Warteschlange | anstehende Aufträge + laufender Auftrag | **flüchtig (RAM)** | P6 |
| Q2 | Wiederholungs-Speicher | offene Fehlschläge (mit `payload`) + `pendingDeletions` | **persistent bis erledigt** | P6 |
| Q3 | Ausführungs-Protokoll | ein Eintrag je beendetem Versuch (append-only) | **dauerhaft, unbegrenzt** | P6 |
| Q4 | Warteschlangen-Journal | Bewegungen: eingereiht/gestartet/entfernt/erneut eingereiht | **dauerhaft, rotierend** | P6 |
| V1 | Vorlagen-Bibliothek | app-weite Vorlagen inkl. Arbeitskopien (`parent ≠ null`) | persistent | P7 |

Q1–Q4 gehören zur Auftragsverwaltung (P6) und tragen **jeweils eigene Persistenz** (flüchtig → persistent-bis-erledigt → dauerhaft-unbegrenzt → dauerhaft-rotierend). Q3 enthält die frühere Ausgabe-Historie (erfolgreiche Renders) als Teilmenge; sie liegt damit bei P6 statt in D3.

### 7.3 Datenfluss-Tabelle

| # | Von | Daten | Nach |
|---|---|---|---|
| 1 | Nutzer | Aktion/Produkt (Titel u. a.) | P2 *(instant)* |
| 2 | Nutzer | Reihenfolge, Dauer, Trim | P3 *(instant)* |
| 3 | P2 / P3 | Aktion + Vorlagen-Ref, Listenelemente | D1 |
| 4 | Nutzer / App | Einstellungen (aktives Projekt, Marke, UI) | D3 |
| 5 | Nutzer | Auftrag (import/loeschen/render/export) | P6 |
| 6 | P6 | Freigabe (genau einer, seriell) | P1 / P4 |
| 7 | P1 | kopierte Mediendatei | D2 |
| 8 | P1 | Asset-Datensatz (Pfad, Maße, Dauer) | D1 |
| 9 | D1 | Liste + Aktionsdaten | P4 / P5 |
| 10 | D2 | Mediendateien | P4 / P5 |
| 11 | D3 | Marke (für Aktions-Segmente) | P4 / P5 |
| 12 | P4 | ffmpeg-Aufrufe / Clips | ffmpeg |
| 13 | P4 | Segment-PNGs, `seg_*.mp4`, concat-Liste | T1 |
| 13a | P4 | fertige Ausgabe-MP4 (`<name>.mp4.part` → Rename, 9.2.6) | `projects/<id>/output/` |
| 14 | P4 | gewählte Ausgabe-MP4 | USB |
| 15 | P1 / P4 | Ergebnis (erfolg/fehler) | P6 |
| 16 | P6 | anstehender/laufender Auftrag | Q1 |
| 17 | P6 | Fehlschlag + `pendingDeletion` | Q2 |
| 18 | P6 | Protokoll-Eintrag je beendetem Versuch | Q3 |
| 18a | P6 | Warteschlangen-Bewegung | Q4 |
| 19 | P5 | gerenderte Frames | Bildschirm |
| 20 | Nutzer | Vorlagen-Bearbeitung (Art, Zonen, Parameter) | P7 |
| 21 | P7 | Vorlage / Arbeitskopie | V1 |
| 22 | V1 | Vorlage (Zonen, Rollen-Verweise) | P2 / P4 / P5 |

### 7.4 Die zwei Render-Arten

P4 und P5 lesen **denselben** Eingang (Liste + Medien) und unterscheiden sich nur in Engine und Ausgang:

- **P5 Vorschau** – Engine: UI/Canvas, ohne `ffmpeg`; Ausgang: Bildschirm (live).
- **P4 Finaler Render** – Engine: `ffmpeg`; Ausgang: benannte Ausgabe-MP4 im Projekt-Ausgabeordner, von dort per Export auf USB.

Das ist die Trennlinie für die spätere Arbeitsteilung: „Vorschau" und „Render" sind getrennte Module mit gemeinsamer Eingangsdatenstruktur.

## 8. Vorschau-Konzept (UI-Simulation)

Die Vorschau läuft vollständig im Renderer, ohne `ffmpeg`. Eine 16:9-Bühne (1920×1080 herunterskaliert) spielt die Liste der Reihe nach ab:

- **Aktions-Segmente** zeigen exakt dasselbe Canvas-Bild, das auch der finale Render verwendet → pixelgleich.
- **Bilder** werden gleich eingepasst (`object-fit: contain` auf Schwarz = dieselbe Letterbox/Pillarbox wie das `pad` im Render).
- **Videos** laufen nativ als `<video>` von Trim-Start bis -Ende.
- **Medienzugriff** erfolgt ausschließlich über das `media://`-Protokoll (Pfad-Autorität `project-store`, 9.5.7) – der Renderer sieht nie absolute Pfade. Vertrag des Players: 9.9.
- Transport: Play/Pause, Zeitleiste, Markierung des aktuellen Elements, Gesamtdauer.

**Grenze (bewusst):** Farbe, Kompression und Bitrate des finalen H.264 sind in der Simulation nicht sichtbar; der schnelle Trim kann minimal anders schneiden. Die finale Kontrolle bleibt die gerenderte Ausgabedatei (Akzeptanzkriterium 2/3).

## 9. High-Level-Design (Module & Schnittstellen)

Dieser Abschnitt übersetzt die Prozesse **P1–P7** in konkrete Module mit scharfen Schnittstellen (Renderer- vs. Main-Module, typisierter IPC-Vertrag, geteilte Typen). Je Modul ein Schnittstellen-Vertrag, jeweils **fachlich als Eingang → Ausgang**, ohne Implementierung, aber mit den Invarianten, die eine lokale Umsetzung nicht verletzen darf. Begonnen wurde mit dem **Render-Pfad** (P4, `render-service`), weil dessen Granularität den IPC-Vertrag prägt.

**Modulübersicht:**

- **Renderer (React-UI):** `ipc-client`, `app-shell` (Rahmen + Navigation, 9.14), `composer` [P3], `action-editor` [P2], `template-canvas` (geteilt: Segment → PNG, **einzige Pixelquelle**, 9.10), `preview-player` [P5], `vorlagen-editor` (9.12.2), `marken-editor` (9.15.2), `projekt-verwaltung` (Projektverwaltung FA-10, 9.14.3), `queue-panel` (Sicht auf die Auftrags-Queue). **Dazu `gemeinsam` – kein Modul, sondern der geteilte Renderer-Bereich:** ein Ort ohne Eigentümer, aus dem **jedes** Renderer-Modul direkt importieren darf. Er trägt, was mehrere Module benutzen und keines besitzt – heute das Register der offenen `<video>`-Handles, das vor dem Löschen eines Mediums freigegeben werden muss (9.4.6). *Warum nicht `src/shared/`:* Dort läge **Modul-Zustand**, und der Main-Prozess bekäme beim Import eine **zweite, eigene** Instanz davon – ein Register, das nie etwas enthält und niemandem auffällt. *Warum kein Durchreichen als Parameter:* Der Eintrag entsteht am **unteren Ende** zweier Bauteilketten (Vorschau-Video und Vorschaubild); ein Register, dessen Inhalt davon abhängt, ob jede Zwischenstufe die Funktion weitergereicht hat, ist keins.
- **Main (Node):** `ipc-gateway`, `auftrags-manager` [P6] (zentraler serieller Ausführungspunkt + Speicher Q1–Q4, 9.3), `media-service` [P1] (9.4), `project-store` [D1] (besitzt das eine D1-Schreib-Lock **und** ist Pfad-Autorität + trägt das `media://`-Protokoll, 9.5.7), `config-store` [D3], `vorlagen-store` (app-weite Vorlagen-Bibliothek, 9.12.1), `marken-store` [V2] (app-weiter Marken-Bestand, **löst die Marken-Vererbung als einzige Stelle auf**, 9.15.1), `render-service` [P4] (9.2), `export-service`, `ffmpeg-adapter` (enthält den getesteten `buildReel`-Kern).
- **Geteilt:** `contracts/types` (Project, Action, Asset, ListItem, Template, Brand, RenderRequest, Auftrag …) **und die reine Bandgeometrie-Rechnung** `berechneBandGeometrie` (9.2.8) – die einzige Stelle, an der `render-service` und `preview-player` dieselbe Formel benutzen, statt sie zweimal zu schreiben. Renderer ↔ Main reden **ausschließlich** über den typisierten IPC-Vertrag.

**Stand der Verträge:** ausgearbeitet sind `render-service` (9.2), `auftrags-manager` (9.3), `media-service` (9.4), `project-store`/`config-store` (9.5), `export-service` (9.6), `composer` (9.7), `action-editor` (9.8), `preview-player` (9.9), `template-canvas` (9.10), die geteilten Datenmodelle `Vorlage`, `Marke`, `Project`/`Listenelement` sowie ID-Schema und Konstanten (9.11) die **Vorlagen-Verwaltung** `vorlagen-store`/`vorlagen-editor` (9.12), **Undo/Redo** (9.13), die **IPC-Konventionen** (9.1.1), die **`app-shell`** (9.14) samt dem Modul **`projekt-verwaltung`** (9.14.3) sowie die **Marken-Verwaltung** `marken-store`/`marken-editor` (9.15). **Speicher `V2`** (Marken-Bestand) tritt neben `V1` (Vorlagen). **Noch offen:** die Punkte am Schluss von Abschnitt 9. *(Bis v2.1 stand hier auch das Datenmodell `Marke`; es ist seit 9.11.2 vollständig ausgeschrieben. Der Satz blieb stehen und hätte einen Agenten glauben lassen, die Marken-Rollen seien noch nicht festgelegt – woran u. a. die Füllfarbe der Split-Restflächen hängt, 9.2.8.)*

### 9.1 IPC-Vertrag: Granularität (Variante A) und Konventionen

Offen war, wer die Aktions-Segment-PNGs erzeugt. Zwei Varianten standen zur Wahl:

- **A – Renderer rendert vor:** Der Renderer erzeugt jedes Segment-PNG über das geteilte `template-canvas`-Modul und übergibt die Pixel an den Main.
- **B – Main rendert selbst:** Der Main erzeugt die PNGs headless aus den Rohdaten (Aktion + Vorlage + Marke).

**Festgelegt: Variante A.** Ausschlaggebend ist die **eine** Rendering-Quelle: Dasselbe Canvas-Bild, das die Vorschau (P5) zeigt, geht 1:1 in den finalen Render. Die geforderte Pixelgleichheit (Abschnitt 8) ist damit **strukturell** garantiert statt nur per Disziplin. Zusätzlich bleibt der Main frei von einer Grafik-Abhängigkeit (kein `node-canvas`, kein doppelter Rendering-Pfad, keine Packaging-Last für Win + macOS). Variante B würde genau die gefährlichste Fehlerklasse eröffnen – Vorschau und Endvideo laufen auseinander – und wurde deshalb verworfen.

**Daraus folgende Festlegungen für den Vertrag:**

1. **Nur gerenderte Segment-PNGs reisen über IPC.** Importierte Videos und Bilder liegen bereits kopiert in `media/` (D2) und werden vom Main **direkt per relativem Pfad** gelesen (Pfadauflösung über die Pfad-Autorität `project-store`, 9.5.7) – sie gehen **nie** über IPC. Braucht der **Renderer** dieselben Medien (Vorschau/Thumbnails), lädt er sie **nur lesend** über das `media://`-Protokoll (ebenfalls 9.5.7), nicht über IPC.
2. **Segment-Format = PNG** (verlustfrei, text- und kantensicher für flächiges Corporate-Design; von `ffmpeg` nativ lesbar). Kein JPEG (DCT-Artefakte an Textkanten), keine verlustbehaftete Umkodierung. WebP-lossless bleibt eine spätere Optimierung, falls eine Messung einen IPC-Engpass zeigt.
3. **PNG-Übergabe als Binärpuffer** (kein Base64 im Nachrichtenkörper). Der **Renderer schreibt nichts auf die Platte**; er liefert die Bytes, der **Main** persistiert sie in den flüchtigen Arbeitsbereich (T1). Die Regel „nur der Main berührt das Dateisystem" bleibt unangetastet.
4. **1080p ist Render-Normalisierung, kein Import-Umschreiben.** Das Herunterskalieren auf 1920×1080 geschieht zur **Render-Zeit** (`scale` + `pad` je Element, Abschnitt 9.2.4), angewendet auf **jedes** Element. Die gespeicherten Importe bleiben **roh/unangetastet**. (Klärt die in Anforderungsdokument 2.2/6 offen gehaltene 4K-Option zugunsten des festgelegten 1080p-Ausgabe-Profils.)

#### 9.1.1 Konventionen des IPC-Vertrags (`ipc-gateway` / `ipc-client`)

Diese Konventionen gelten für **jede** Operation über die Renderer↔Main-Grenze. Ohne sie erfindet jedes Modul eigene Fehler-, Namens- und Validierungsregeln.

**1. Zwei Ebenen nicht verwechseln.**
- **Aufruf-Ergebnis:** Hat der *Aufruf* funktioniert (z. B. „Auftrag eingereiht", „Trim gesetzt")?
- **Auftrags-Ergebnis:** Wie ging der *Vorgang* aus (`RenderResult`, Export-Ergebnis …)? Das reist **nicht** als Aufruf-Antwort, sondern über den **Auftrags-Zustand** (9.3).

`reiheEin` antwortet also sofort mit `{ ok, auftragId }`; ob der Render gelang, kommt später über die Queue. Diese Trennung war bisher nur implizit.

**2. Einheitliche Ergebnis-Hülle – niemals Exceptions über die Grenze.**

```
Ergebnis<T> =
  | { ok: true,  wert: T }
  | { ok: false, fehler: { code: Fehlercode, meldung: string, daten?: Fehlerdaten } }
```

**Strukturierte Fehlerdaten (`daten`, optional).** Manche Fehler sind erst mit ihren Nutzdaten bedienbar: `asset_referenziert` muss die **betroffenen Listenelemente** nennen (`{ referenzenIds: string[] }`, 9.4.9), `vorlage_referenziert` beide Trefferlisten (9.12.1). Ohne dieses Feld bliebe von der Zusage „der Code trägt echtes Verhalten" nur der Code selbst übrig, und der geführte Reparatur-Modus (FA-19) könnte den Nutzer nirgendwohin führen. Regeln: Das Feld ist **optional** – Codes ohne Zusatzdaten lassen es weg; seine Form ist **je Fehlercode festgelegt und typisiert** (dokumentiert dort, wo der Code vergeben wird: 9.4.9, 9.6.4, 9.12.1); es ist **kein Freitext-Anhang** und **kein Ersatz für `meldung`**. Ein Aufrufer, der `daten` nicht kennt, funktioniert unverändert weiter.

*Begründung (bitte nicht „vereinfachen"):* Renderer und Main sind **getrennte Prozesse**; alles dazwischen wird serialisiert. Wirft der Main `new Error(...)` mit einem eigenen Feld `code`, kommt beim Renderer **nicht** dieser Fehler an, sondern eine verpackte Meldung der Art

```
Error: Error invoking remote method 'media:importMedium': Error: Datei nicht gefunden
```

**Fehlerklasse und eigene Felder wie `code` sind verloren** – übrig ist Text. Der Aufrufer müsste dann Meldungstexte vergleichen (`e.message.includes(...)`), was bei jeder Umformulierung, Tippfehler-Korrektur oder Übersetzung bricht.

Bei uns hängt an den Codes **echtes Verhalten**: `asset_referenziert` zeigt die betroffenen Listenelemente, `vorlage_referenziert` beide Trefferlisten (9.12.1), `datei_zu_gross_fat32` erklärt exFAT, `kein_platz` und `ziel_gesperrt` brauchen verschiedene Hinweise. Geht der Code verloren, degradieren Reparatur-Modus, Wiederholen und der FAT32-Hinweis alle zu „irgendwas ist schiefgelaufen".

Die Hülle hält den **Code typisiert** und **zwingt** den Aufrufer, den Fehlerfall zu behandeln – Vergessen ist strukturell unmöglich.

**Ausschreiben statt andeuten.** In **allen** Operations-Signaturen von Abschnitt 9 steht die Hülle **explizit** (`→ Ergebnis<Asset>`), nicht nur die Nutzlast. Wer nur seine eigene Tabelle liest, sieht damit sofort die richtige Rückgabe.

Wo eine Operation **nichts** zu melden hat, lautet die Nutzlast `void`: **`Ergebnis<void>`** – das gelungene `ok` **ist** die Information. **Verboten** sind Ersatzformen wie `Ergebnis<boolean>`, `Ergebnis<null>` oder ein blankes `true`. Grund: Sonst gäbe es **zwei** Wege zu sagen „hat funktioniert" (`ok: true` *und* `wert: true`), und ein Aufrufer prüft irgendwann den falschen – ein Fehlschlag mit `wert: false` würde als Erfolg durchgehen.

**Nur Instant-Aufrufe tragen die Hülle.** Auftragsartige Operationen (`import`, `loeschen`, `render`, `export`) werden **nicht** direkt aufgerufen; der Aufruf ist `reiheEin` → `Ergebnis<{ auftragId }>`, ihr Fach-Ergebnis reist über den **Auftrags-Zustand** (Punkt 1, 9.3). Deshalb steht bei ihnen unten „Auftrags-Ergebnis" und **keine** `Ergebnis<T>`-Signatur. **Ereignisse** (Main → Renderer) tragen ebenfalls keine Hülle (Punkt 5).

**3. Fehlercodes sind ein geschlossener, typisierter Satz:** die fachlichen je Operation (9.4.9, 9.6.4, 9.12.1) plus die generischen `ungueltige_eingabe`, `nicht_gefunden`, `unbekannter_fehler`. **Eine rohe Exception-Meldung wird nie zum Code.**

**4. Kanalbenennung `<modul>:<operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B. `queue:geaendert`, `render:fortschritt`. Damit erfindet niemand eigene Kanalnamen. **Diese beiden Ereignis-Kanäle sind keine bloßen Beispiele:** `queue:geaendert` (9.3.4) und `render:fortschritt` (9.2.7) sind die Ereignis-Kanäle der v1 und werden **tatsächlich gebaut und angemeldet** – Sender im Main, Anmeldung im `ipc-gateway`, Abonnent im Renderer.

**5. Ereignisse sind Einbahnstraßen und tragen keinen Endzustand** (für `RenderProgress` bereits festgelegt, 9.2.7). Terminale Zustände kommen ausschließlich über Aufruf-Ergebnis bzw. Auftrags-Zustand.

**6. Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen.

**7. Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft.

**8. Unerwartete Ausnahmen fängt das Gateway** und übersetzt sie in `unbekannter_fehler` (intern protokolliert). Die App stürzt nicht ab, und **kein Stacktrace** gelangt in die Oberfläche.

**9. Binärdaten** (Segment- und Band-PNGs) reisen als **Binärpuffer**, nicht als Base64 (9.1, Punkt 3) – die Hülle ändert daran nichts.

**10. Die App hat GENAU EIN Fenster – und jedes Ereignis geht an dieses eine Fenster.** Damit ist die **Empfängerfrage** für alle Main→Renderer-Ereignisse (`render:fortschritt` 9.2.7, `queue:geaendert` 9.3.4, die Auto-Speichern-Meldung 9.5.4) **einheitlich beantwortet**: Der Sender im Main adressiert das eine Fenster; es gibt **keine** Verteilerlogik, **keine** Empfängerliste, **kein** „an alle Fenster senden". Wer im Main ein Ereignis verschickt, hat **keine** Wahl zu treffen. *Begründung:* Die erste Stufe ist **ein Studio, ein Bildschirm, ein Laptop** (Anforderungsdokument, Abschnitt 3); die App ist ein Werkzeug für **einen** Bearbeiter, der eine Wiedergabeliste zusammenstellt und rendert. Ein zweites Fenster hätte in diesem Ablauf keine Aufgabe – es brächte nur die Frage mit, welches Fenster den Fortschritt sieht, wer den Abbruch auslösen darf und was passiert, wenn ein Fenster geschlossen wird, während ein Auftrag läuft. Diese Frage bleibt **ungestellt**, solange es nur ein Fenster gibt. *Vorsorglich mitgeschleppt wird sie nicht:* Käme später ein zweites Fenster, ist die Nachbesserung überschaubar und liegt an den **Verdrahtungsstellen** (Sender im Main, Anmeldung im `ipc-gateway`) – sie wird dann **bewusst** gemacht, statt heute in jedem Modul eine Verteilerlogik zu tragen, die nie gebraucht wird. **Diese Festlegung ist nicht dasselbe wie die Einzel-Instanz-Sperre (9.5.4):** Jene verhindert einen **zweiten Prozess** auf denselben Daten, diese legt fest, dass der **eine** Prozess **ein** Fenster führt.

**Ereignisse vor dem Aufbau des Fensters verfallen still – es wird NICHT gepuffert (bindend).** Fällt eine Meldung an, bevor das eine Fenster geladen und der Abonnent angemeldet ist, geht sie **verloren**; der Sender im Main merkt sich **nichts** und wiederholt **nichts**. Den Ausgleich schafft die Oberfläche selbst, und zwar in **genau dieser Reihenfolge**: Beim Aufbau holt sie **einmal den vollständigen Stand** über eine lesende Operation und **abonniert erst danach** das zugehörige Ereignis. Für die Warteschlange gibt es diese Leseoperation bereits – **`holeStand()`** (9.3.4), ausdrücklich „Snapshot für die UI"; die Warteschlangen-Leiste nutzt sie so (9.14.2). *Begründung:* Ein Puffer müsste zwei Fragen beantworten, die niemand beantworten kann, ohne zu raten – **wie lange** er hält (das Fenster könnte nie kommen) und **was er bei Überlauf verwirft** (ein verworfenes `queue:geaendert` hinterlässt eine dauerhaft falsche Anzeige). „Erst holen, dann abonnieren" lässt dagegen **keine Lücke**: Ein Ereignis, das zwischen Lesen und Abonnieren fällt, ist im gelesenen Stand entweder schon enthalten oder kommt als nächstes Ereignis nach. Die umgekehrte Reihenfolge (erst abonnieren, dann holen) wäre **falsch** – die Antwort auf das Holen könnte einen **älteren** Stand tragen als ein zwischenzeitlich empfangenes Ereignis und es damit überschreiben.

### 9.2 Schnittstelle `render-service`: Operation `renderReel`

**Richtung:** Renderer → Main **über die Auftrags-Queue** (`reiheEin`, `art: render`) – **kein** direkter Request/Response-Aufruf (9.3.4); Main → Renderer (Fortschritts-Ereignisse 9.2.7, Endergebnis über den Auftrags-Zustand), ausschließlich über den typisierten IPC-Vertrag.
**Fachlich:** „Erzeuge aus der geordneten Liste **eine durchgehende** MP4 im festgelegten Ausgabe-Profil und lege sie unter dem gewählten Namen im **Projekt-Ausgabeordner** (`projects/<id>/output/`) ab; melde Ergebnis und Fortschritt zurück." (Der USB-Export ist eine **eigene** Operation des `export-service` und **nicht** Teil hiervon.)

```
renderReel(request: RenderRequest) → RenderResult      // + Fortschritts-Ereignisse Main → Renderer
```

#### 9.2.1 Eingang: `RenderRequest`

| Feld | Inhalt | Zweck |
|---|---|---|
| `renderId` | ID des Laufs | korreliert Fortschritts-Ereignisse und Abbruch (9.2.7) eindeutig zu **diesem** Lauf |
| `projektId` | ID | löst Projekt- und Medienordner (D2) auf; Main liest Importe von dort |
| `elemente` | geordnete Liste von `RenderItem` | die zu verkettende Sequenz, **bereits in Wiedergabereihenfolge** |
| `profil` | `RenderProfile` | Ziel-Normalisierung + Encoding (aktuell fest, s. 9.2.4) |
| `ausgabeName` | Dateiname **ohne** Endung | Zieldatei `projects/<id>/output/<ausgabeName>.mp4` (FA-22). Vorbelegt mit `Project.letzterAusgabeName`; ein gleicher Name **ersetzt** die vorige Fassung, ein neuer legt eine zusätzliche Datei an |

Der Ausgabe-**Pfad** ist **nicht** Teil der Anfrage – nur der **Name**: Der Main setzt ihn über die Pfad-Autorität (9.5.7) zu `projects/<projektId>/output/<ausgabeName>.mp4` zusammen. Der Renderer kennt **keine** absoluten Pfade. Der Name ist **Nutzereingabe** und daher zu validieren (9.2.6). Die `renderId` wird **vom Renderer vergeben**, sodass er verspätete Ereignisse eines alten Laufs sicher erkennen kann (9.2.7). Jedes `RenderItem` trägt eine `id` zur eindeutigen **Fehlerzuordnung**; die Reihenfolge ergibt sich aus der Listenposition, nicht aus einem separaten Feld.

#### 9.2.2 `RenderItem` – drei Varianten (diskriminiert über `art`)

| `art` | Nutzdaten | Herkunft der Pixel | über IPC? |
|---|---|---|---|
| `"video"` | `medienRef` (relativer Pfad in `media/`), `trimStart`, `trimEnde` (Sekunden; **framegenauer** Schnitt s. 9.2.6), optional `einblendung` (**`art`**, **`höhe`** und die Band-Abschnitte als PNG-Puffer + Dauern, s. u. und 9.2.8) | Datei in D2; Band-Pixel vom Renderer | **teilweise** – Video per Pfad, Band-PNGs über IPC |
| `"bild"` | `medienRef` (relativer Pfad), `dauer` | Datei in D2 | **nein** – Main liest per Pfad |
| `"segment"` | `png` (Binärpuffer), `dauer` | Renderer via `template-canvas` | **ja** – einziger Pixel-Transport |

Gemeinsam je Item: `id` (Rückverfolgung/Fehlerzuordnung). Bei `"segment"` werden **keine** Aktions-/Vorlagendaten mitgeschickt – die Pixel sind bereits final; das ist der Kern von Variante A.

**Die `einblendung` eines `"video"`-Items trägt die Geometrie mit:**

| Feld | Inhalt |
|---|---|
| `art` | `"split"` \| `"einblendung"` – Kompositionsart (Band **unter** bzw. **über** dem Video, 9.2.8) |
| `höhe` | Bandhöhe `H` in Pixeln (ganzzahlig und **gerade**, 9.2.8) |
| `abschnitte` | geordnete Folge `{ png (Binärpuffer, 1920 × H), dauer }` |

*Warum `art` und `höhe` im Auftrag stehen und nicht zur Laufzeit nachgeschlagen werden:* Der Render **friert seinen Eingang beim Einreihen ein** (9.3.5). Beide Werte stammen aus der Band-Vorlage und werden **beim Einreihen** aus ihr abgeleitet. Würde der Main die Vorlage stattdessen erst beim Start des Auftrags im `vorlagen-store` nachschlagen, wäre der Eingang **nicht** eingefroren: Ändert jemand die Bandhöhe, während der Auftrag in der Warteschlange wartet, passten die bereits gezeichneten Band-PNGs (1920 × H **zum Einreih-Zeitpunkt**) nicht mehr zur nachgeschlagenen Höhe – das Band im fertigen Video wäre verzerrt oder falsch platziert. So bleibt der Auftrag **in sich geschlossen**, und der `render-service` braucht **keine** Abhängigkeit zum `vorlagen-store`. Der Renderer kennt beide Werte ohnehin: er hat das Band damit gezeichnet.

#### 9.2.3 Ausgang: `RenderResult`

Genau **ein** terminaler Ausgang je Lauf, diskriminiert über `status` ∈ { `erfolg`, `fehler`, `abgebrochen` }. Alle drei tragen die `renderId`. Die Nutzdaten je Status:

**`erfolg`:**

| Feld | Inhalt |
|---|---|
| `ausgabePfad` | absoluter Pfad der erzeugten `projects/<id>/output/<name>.mp4` |
| `ausgabeName` | der **tatsächlich verwendete** Ausgabename **ohne Endung** – derselbe Wert, der im `RenderRequest` stand (9.2.1) |
| `gesamtdauer` | Summe der (getrimmten) Elementdauern in Sekunden – **framegerundet** gezählt (Frame-Anzahl / 30, s. 9.2.6) |
| `dateigroesse` | Größe in Bytes |

**Warum `ausgabeName` mitgeliefert wird (bindend).** Der `render-service` setzt bei Erfolg `Project.letzterAusgabeName` in D1 (FA-22); genau dieser Wert belegt beim **nächsten** Render das Namensfeld vor. Ohne ihn im Ergebnis erführe die Oberfläche vom neuen Namen **nichts** und schlüge weiter den alten vor – der Nutzer überschriebe nicht die Datei, die er überschreiben wollte, oder legte versehentlich eine zweite an. *Begründung für diesen Weg statt des naheliegenden:* **eine** Quelle der Wahrheit statt zweier. Merkte sich die Oberfläche den Namen selbst, liefen beide Werte spätestens dann auseinander, wenn ein Render **fehlschlägt** (D1 bleibt unverändert, die Oberfläche hätte den Namen längst übernommen) oder wenn die App **neu startet** (der Renderer-Zustand ist weg, D1 nicht). Der Wert steht zudem **dauerhaft** in Q3 (9.3) – dort allerdings **nicht** als eigenes Feld: `ProtokollEintrag.ausgabe` trägt weiterhin nur `pfad`, `dateigroesse` und `gesamtdauer`, und der Name ist im Pfad bereits enthalten. Ein zweites Feld für dieselbe Information wäre genau die Doppelführung, die schon `historieEintrag` und `position` entfernt hat.

**Es gibt bewusst *kein* Feld `historieEintrag`.** Der Q3-Protokolleintrag wird **allein von der Auftragsverwaltung** gebaut (9.3) – sie besitzt ohnehin `auftragId`, `art`, `projektId`, `versuch`, `begonnenAm` und `beendetAm`. Der `render-service` liefert nur, was **nur er** weiß: Pfad, Größe, Gesamtdauer und den verwendeten Ausgabenamen; aus den ersten dreien wird `ProtokollEintrag.ausgabe` – der Name geht **nicht** eigens ins Protokoll, er steckt im Pfad (s. o.). *Begründung:* Zwei Quellen für dieselbe Information laufen unweigerlich auseinander (dieselbe Regel entfernte schon das `position`-Feld, 9.11.3, und die doppelte Ablage der offenen Löschungen, 9.3) – und **Q3 ist dauerhaft**: ein doppelt geführtes Datum darin bliebe für immer falsch.

**`fehler`:**

| Feld | Inhalt |
|---|---|
| `fehlercode` | **einer** der Codes aus der Tabelle unten – ein geschlossener Satz, keine freie Zeichenkette |
| `fehlerhaftesElementId` | betroffenes `RenderItem` (falls zuordenbar) |
| `meldung` | für den Nutzer aufbereiteter Klartext |

**`abgebrochen`** (durch `cancelRender`, s. 9.2.7):

| Feld | Inhalt |
|---|---|
| `abgebrochenBei` | zuletzt bearbeiteter `elementIndex` (optional, für die UI) |

Bei `fehler` und `abgebrochen` entsteht **keine** neue Ausgabedatei; eine **bereits vorhandene Datei gleichen Namens bleibt unversehrt** (9.2.6). Aufgeräumt sind in beiden Fällen **der Arbeitsbereich T1 *und* die angefangene `<name>.mp4.part` im Ausgabeordner** – sonst bliebe im Ausgabeordner eine wachsende Leiche liegen. **Der Q3-Protokolleintrag entsteht trotzdem:** Q3 hält *einen Eintrag je beendetem Versuch*, also auch für Fehlschlag und Abbruch (9.3); nur das Feld `ausgabe` bleibt dort `null`.

**Fehlercodes des `render-service` (geschlossener Satz):**

| Code | Wann | Was der Nutzer tun kann |
|---|---|---|
| `medium_fehlt` | Ein referenziertes Medium liegt nicht (mehr) in `media/` oder ist vom Reconcile als `zustand: "fehlt"` markiert (9.4.7). Geprüft **vor** dem ersten `ffmpeg`-Aufruf, nicht mitten im Lauf | Über den geführten Reparatur-Modus (9.7.5) neu verknüpfen/importieren, ersetzen oder das Element entfernen |
| `ungueltiges_element` | Ein einzelnes `RenderItem` ist in sich unstimmig: Trim außerhalb der Quelldauer, `dauer` außerhalb 10–45 s, `"segment"` ohne PNG-Puffer, `einblendung` ohne Abschnitte, mit `höhe` ≥ 1080 oder mit **ungerader** `höhe` (9.2.8), PNG-Maße ≠ der erwarteten Fläche (1920 × 1080 bzw. 1920 × `höhe`) | Das benannte Element im `composer` korrigieren (Dauer/Trim/Band) und erneut rendern |
| `ungueltige_eingabe` | Die **Anfrage** verletzt den Vertrag, unabhängig von einzelnen Elementen: unzulässiger `ausgabeName` (9.2.6), leere Elementliste, unbekannte `art`, fehlende `projektId`. Generischer Code aus 9.1.1 Punkt 3 – **ohne jede Wirkung** auf Daten oder Dateien | Zielnamen korrigieren bzw. mindestens ein Element in die Liste legen |
| `ffmpeg_fehler` | Ein `ffmpeg`-/`ffprobe`-Aufruf endet mit Fehlerstatus oder liefert keine verwertbare Ausgabe (defekter Stream, nicht dekodierbare Quelle) – **einschließlich einer fehlgeschlagenen Verifikation** der fertigen Datei (9.2.6) | Wiederholen (Q2, FA-17); bleibt es dabei, das im Fehler benannte Element austauschen. Die vorherige Ausgabedatei ist unversehrt |
| `kein_platz` | Zu wenig freier Speicher – für T1 (Zwischenclips) **oder** für `<name>.mp4.part` im Ausgabeordner. Beide Orte können auf **verschiedenen** Laufwerken liegen | Platz schaffen, dann den Auftrag wiederholen |
| `speicher_fehler` | Schreib- oder Rename-Fehler am **Ziel** jenseits von Platzmangel: fehlende Rechte, Ausgabeordner nicht anlegbar, Zieldatei durch einen anderen Prozess gesperrt (nach Retry) – **ebenso** ein gescheiterter Sofort-Flush von D1 zu Beginn des Handlers (9.3.3, 9.5.4) | Die Ausgabedatei in Player/Explorer schließen, Rechte prüfen, wiederholen |
| `unbekannter_fehler` | Jede nicht zuordenbare Ausnahme; das Gateway übersetzt sie (9.1.1 Punkt 8) – **kein** Stacktrace in der Oberfläche | Wiederholen; der Versuch steht mit Zeitstempel in Q3 |

**`abgebrochen` ist *kein* Fehlercode.** Ein vom Nutzer abgebrochener Lauf endet über `status: "abgebrochen"` (9.2.7) und trägt **kein** `fehler`-Objekt – sonst gäbe es zwei Wege, denselben Ausgang zu melden, und die Oberfläche zeigte einen Abbruch als Fehler an.

**Die betroffene Element-ID erreicht die Oberfläche über die strukturierten Fehlerdaten.** `RenderResult.fehlerhaftesElementId` ist Modul-intern; beim Abschluss des Auftrags übernimmt die Auftragsverwaltung `fehlercode` → `Auftrag.fehler.code`, `meldung` → `Auftrag.fehler.meldung` und `fehlerhaftesElementId` → **`Auftrag.fehler.daten = { elementId }`** (9.1.1, 9.3.1). Ohne diesen Weg käme die ID **nie** beim Nutzer an – obwohl 9.2.1 die `RenderItem.id` genau damit begründet („eindeutige Fehlerzuordnung") und der Reparatur-Modus (FA-19) die Stelle benennen muss, zu der er führt. Die Form von `daten` ist damit **je Fehlercode festgelegt**: `{ elementId: string }` bei `medium_fehlt` und `ungueltiges_element`, sonst nicht gesetzt.

#### 9.2.4 `RenderProfile` (aktuell fest)

| Feld | Wert | Begründung / Falle |
|---|---|---|
| Auflösung | **1920 × 1080** | Ausgabe-Profil |
| Bildrate | **30 fps, CFR** (konstant) | Voraussetzung für die Frame-Rundung (9.2.6) |
| Video-Codec | **H.264**, Profil **High**, **Level 4.0** | 1080p30 bei ~12 Mbit/s liegt sicher in Level 4.0 – der maximal kompatible Wert für Consumer-Geräte |
| **Pixelformat** | **`yuv420p`, 8 Bit** | Consumer-TVs decodieren **nur** 4:2:0/8 Bit. Wird das Format der Quelle übernommen (4:2:2, 4:4:4 oder 10 Bit), **spielt der TV die Datei nicht ab** |
| **Ratensteuerung** | **gedeckeltes VBR**: Ziel **10**, max **12 Mbit/s**, VBV-Puffer **24 Mbit** | Hardware-Decoder haben begrenzte Puffer; unbegrenztes VBR (z. B. reines CRF) erzeugt Spitzen → **Ruckler** am TV |
| **GOP** | **geschlossen**, ≤ 2 s (60 Frames); **jedes Segment beginnt mit einem Keyframe (IDR)** | **Voraussetzung für `concat -c copy`** (9.2.6): ohne Keyframe am Segmentanfang bricht die verlustfreie Verkettung |
| **Farbmetadaten** | **BT.709** explizit gesetzt (Primaries, Transfer, Matrix) | Ohne Metadaten **raten** Player, viele nehmen BT.601 an → die **Farben verschieben sich**, `#FF4040` sieht am TV falsch aus. Bei einer Marke inakzeptabel |
| **Pixel-Seitenverhältnis** | **1:1** (quadratisch, SAR 1:1) | Quellvideos mit nicht-quadratischen Pixeln würden am TV **verzerrt** dargestellt |
| Abtastung | **progressiv** | kein Interlacing |
| **Audio** | **stille AAC-Spur** (48 kHz, mono, niedrige Bitrate) – in **jedem** Segment identisch | Manche Player/TVs erwarten eine Audiospur und verhalten sich bei rein-Video-MP4 eigenartig. Das Ergebnis ist trotzdem **still** (Anforderungsdokument R-06 ist damit **entschieden**) |
| Seitenverhältnis-Politik | einpassen + schwarze Balken (`pad`; Letterbox/Pillarbox), **kein** Beschnitt | Ausnahme: Split-Komposition füllt in der Farb-Rolle `flaecheDunkel` (9.2.8, 9.11.2) |
| Container / Dateiname | **MP4** mit **`+faststart`** / `<ausgabeName>.mp4` (frei, FA-22) | Index vorn – hilft Playern, die ihn früh erwarten |

**Ausdrücklich verboten** (typische „für mehr Qualität"-Fehlgriffe, die den TV aussperren): 10-Bit-Tiefe, 4:2:2/4:4:4-Abtastung, exotisch hohe Referenzframe-Zahlen, offene GOPs, unbegrenztes CRF ohne VBV-Deckel.

**Alle Werte gelten identisch für jedes Segment** – sonst scheitert die Uniformitäts-Voraussetzung von `-c copy` (9.2.6). Das Profil ist eine Konstante, wird aber **explizit** im Vertrag geführt (spätere Profil-Änderung = ein Datenwert, kein Schnittstellenbruch).

#### 9.2.5 Verantwortungsteilung an der Grenze

- **Renderer:** rendert Segment-PNGs (`template-canvas`, pixelgleich zur Vorschau), stellt den `RenderRequest` zusammen, übergibt Segment-Pixel als Binärpuffer. Schreibt **nichts** auf die Platte.
- **Main (`render-service`):** schreibt die PNGs nach T1; **normalisiert jedes Element** (`scale` + `pad` → Profil) zu einem Zwischenclip `seg_*.mp4`; verkettet die Zwischenclips per concat-Demuxer (`-c copy`) **direkt in den Projekt-Ausgabeordner** nach `projects/<id>/output/<name>.mp4.part`; **verifiziert** die fertige Datei mit `ffprobe` gegen das Profil und benennt sie erst danach im selben Ordner per Rename-mit-Ersetzen um (atomar – s. 9.2.6); nutzt `ffprobe` auch sonst für Maße/Dauer, wo nötig; meldet **Pfad, Ausgabename, Größe und Gesamtdauer** als Auftrags-Ergebnis an die Auftragsverwaltung, die daraus den Q3-Protokolleintrag baut (9.3) – er wird **nicht** vom `render-service` vorgefertigt; **verwirft T1** nach dem Lauf. Die absoluten Pfade der Importe (`medienRef`) löst er über die Pfad-Autorität `project-store` auf (9.5.7), statt das Layout selbst zu kennen.
- **Nicht Teil dieser Operation:** USB-Export (`export-service`) und Vorschau (P5, läuft ganz ohne diese Schnittstelle).

#### 9.2.6 Invarianten (Vorgaben an die Umsetzung)

Diese Zusicherungen sind Teil des Vertrags und dürfen von keiner lokalen Entscheidung verletzt werden:

- **Normalisieren erzwingt Re-Encode:** Jedes Element wird beim `scale`+`pad` neu codiert – auch Videos (ein skaliertes Bild lässt sich nicht kopieren). Nur der **finale** concat-Schritt nutzt `-c copy`.
- **`-c copy` setzt Uniformität voraus:** Alle `seg_*.mp4` müssen **identische** Parameter tragen (Codec, Profil, Auflösung, `fps`, Zeitbasis, Pixelformat, Streamlayout). Deshalb die vorherige Normalisierung; **kein** concat auf Rohdateien.
- **Einheitliche stille Tonspur:** Jeder Zwischenclip erhält **dieselbe** stille AAC-Spur (9.2.4), damit das Streamlayout über alle Segmente gleich bleibt (Voraussetzung für verlustfreies `-c copy`). Eine Quelle **mit** Ton wird verworfen und durch die stille Spur **ersetzt**; eine Quelle **ohne** Ton bekommt sie hinzugefügt. Entscheidend ist nicht, *ob* Ton da ist, sondern dass **alle Segmente identisch** aufgebaut sind.
- **Jedes Segment beginnt mit einem Keyframe (IDR), GOP geschlossen:** ohne Keyframe am Segmentanfang bricht der `concat`-Schritt mit `-c copy`. Das ist keine Optimierung, sondern **Bedingung** dafür, dass die verlustfreie Verkettung überhaupt funktioniert.
- **Standbild → Clip:** `"segment"`- und `"bild"`-Items werden als Standbild über ihre `dauer` bei 30 fps im Profil ausgehalten; harter Schnitt an den Grenzen.
- **Video-Trim ist framegenau (30 fps):** Bei `"video"`-Items wird der Ausschnitt `[trimStart, trimEnde)` **framegenau** geschnitten – über **decode-basiertes (akkurates) Seeking**, nicht das schnelle Keyframe-Seeking (zulässig, weil ohnehin neu codiert wird; ein keyframe-approximativer Schnitt läge je nach GOP-Länge um bis zu Sekunden daneben). Beide Grenzen werden auf **dasselbe** 30-fps-Raster gerundet: `startFrame = round(trimStart × 30)`, `endFrame = round(trimEnde × 30)`; behalten werden die Frames `[startFrame, endFrame)`. Die effektive Elementdauer ist damit `(endFrame − startFrame) / 30` – **nicht** die rohe Sekundendifferenz. Der Zwischenclip ist **CFR** (konstante Bildrate 30 fps), damit die Frame-Anzahl deterministisch bleibt. Dieselbe Rundungsregel gilt ausnahmslos (kein `floor` an einer, `round` an anderer Stelle) – sonst weicht die Dauer um einen Frame ab.
- **`gesamtdauer` zählt gerundete Frame-Dauern:** Die im `RenderResult` gemeldete `gesamtdauer` summiert die **gerundeten** Elementdauern (Frame-Anzahl / 30), nicht die rohen Trim-Sekunden – sonst driften die angezeigte Gesamtlänge (5.3, 30-Minuten-Warnung) und die tatsächliche Länge der Ausgabedatei auseinander.
- **Vorschau-Abgleich:** Die Vorschau (P5, natives `<video>`) kann um bis zu einen Frame anders schneiden (Browser-Seek); **maßgeblich ist die gerenderte Ausgabedatei** (Abschnitt 8). Die hier definierte Render-Regel ist verbindlich und deterministisch.
- **Die Ausgabedatei entsteht atomar – die vorige Fassung ist geschützt (FA-22):** Weil der Standard-Zielname der **zuletzt verwendete** ist, überschreibt ein Render im Regelfall eine vorhandene, gute Datei. `ffmpeg` schreibt deshalb **nie** direkt auf den Zielnamen, sondern auf **`projects/<id>/output/<ausgabeName>.mp4.part`**; erst die **fertige und verifizierte** Datei wird **innerhalb desselben Ordners** per Rename-mit-Ersetzen zu `<ausgabeName>.mp4`. Ein Abbruch, ein Fehler oder ein Absturz lässt die vorhandene Datei damit **unversehrt** – ohne diese Regel zerstörte ein fehlgeschlagener Probelauf die letzte funktionierende Ausgabe. Endet der Lauf nicht mit Erfolg, wird die `.part`-Datei entfernt (9.2.3).
- **Das Staging liegt im Ausgabeordner, NICHT in T1 (`<Temp>`):** Umbenennen ist nur auf **derselben Partition** unteilbar. Die App ist **portabel** – ihr Datenort kann auf einem USB-Stick oder einem zweiten Laufwerk liegen, während `<Temp>` auf der Systemplatte liegt. Ein `rename` aus `<Temp>` in den Ausgabeordner wäre dann ein laufwerksübergreifender Aufruf und schlüge mit **`EXDEV`** fehl; der naheliegende Ausweg „kopieren und löschen" ist **nicht** unteilbar und hebt genau die eben zugesagte Schutzwirkung (FA-22, Akzeptanzkriterium 9) wieder auf – ein Absturz mitten im Kopieren zerstörte die letzte funktionierende Ausgabedatei. Der Fehler fiele beim Entwickeln **nicht** auf, weil dort Temp und Daten auf derselben Platte liegen. **T1 bleibt** für Segment-PNGs, Zwischenclips `seg_*.mp4` und concat-Liste zuständig (Abschnitt 6).
- **„Verifiziert" ist definiert, nicht Auslegungssache:** Bevor die fertige Datei die vorherige Fassung ersetzt, wird sie **genau einmal** mit `ffprobe` ausgelesen und gegen das Ausgabe-Profil (9.2.4) geprüft: **Dauer** im erwarteten Rahmen (die framegerundete `gesamtdauer`, mit enger Toleranz), **1920 × 1080**, **30 fps**, **`yuv420p`**, **Tonspur vorhanden**. Weicht etwas ab → `ffmpeg_fehler` (9.2.3), die `.part`-Datei wird verworfen, die vorherige Fassung bleibt stehen. *Begründung:* Das ist die **einzige** Stelle, an der ein stiller Encoder-Fehler (abgebrochener Stream, still gedroppte Tonspur, falsches Pixelformat) noch auffällt, **bevor** er die letzte funktionierende Datei ersetzt – danach geht die Datei ungeprüft auf den Fernseher im Studio. Ein bis zwei Sekunden nach einem mehrminütigen Render sind dafür vertretbar; `ffprobe` wird ohnehin mitgeliefert (Abschnitt 3).
- **Der Ausgabename ist Nutzereingabe und wird validiert (FA-22):** Erlaubt ist ein reiner Dateiname **ohne** Endung – **keine** Pfadtrenner (`/`, `\`), **kein** `..`, keine für Windows/macOS/FAT32 unzulässigen Zeichen (`< > : " | ? *`, Steuerzeichen), nicht leer, keine reservierten Windows-Namen (`CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`, `LPT1`–`LPT9`). Der aufgelöste Pfad muss **innerhalb** von `projects/<id>/output/` liegen. Verstoß → `ungueltige_eingabe`, **ohne** Wirkung. Andernfalls könnte ein Name wie `../../config` aus dem Projekt ausbrechen.
- **Nur der Main schreibt/liest das Dateisystem;** der Renderer liefert ausschließlich Bytes über IPC.

#### 9.2.7 Fortschritts- und Abbruch-Ereignisse

Während eines laufenden Renders läuft der Kanal in **beide** Richtungen; beide Richtungen korrelieren über die `renderId` des Laufs:

- **Main → Renderer:** Fortschritts-Ereignisse (`RenderProgress`) auf dem Kanal **`render:fortschritt`** – an **das eine Fenster** der App (9.1.1 Punkt 10); der Sender hat keinen Empfänger auszuwählen.
- **Renderer → Main:** Abbruch-Signal (`cancelRender`).

**Der Kanal `render:fortschritt` wird gebaut, nicht nur erwähnt.** Er ist in 9.1.1 Punkt 4 als Beispiel für die Ereignis-Namenskonvention genannt; das ist **kein** Platzhalter: Der `render-service` meldet darauf, das `ipc-gateway` meldet ihn an, der Renderer abonniert ihn. *Begründung:* Ein Render kann Minuten dauern; ein Balken ohne Kontext lässt offen, ob überhaupt etwas passiert. Die Nutzlast steht unten vollständig fest, und der Empfänger im Renderer existiert. **Daneben behält die Warteschlange ihren groben Prozentwert:** `RenderProgress.prozent` speist `Auftrag.fortschritt` (9.3.6), der über `queue:geaendert` in die Warteschlangen-Leiste geht. Zwei Kanäle mit verschiedenem Zweck – der eine detailliert und flüchtig für die Render-Ansicht, der andere grob im Auftrags-Zustand.

**Fortschritts-Ereignis `RenderProgress` (Main → Renderer, Kanal `render:fortschritt`):**

| Feld | Inhalt |
|---|---|
| `renderId` | Lauf, auf den sich das Ereignis bezieht |
| `phase` | `normalisieren` \| `verketten` |
| `elementIndex` / `elementAnzahl` | *k* von *n* (in Phase `normalisieren`; in `verketten` ein Gesamtschritt) |
| `elementId` | aktuelles `RenderItem` zur UI-Markierung (optional) |
| `prozent` | grober Gesamtfortschritt 0–100 |

**Keine** Restzeit-Schätzung – bei `ffmpeg` unzuverlässig, sie würde nur falsche Erwartungen erzeugen. Reine Laufzeitdaten (Kategorie D), **keine** Persistenz.

**Drosselung (Vertrag, nicht nur Umsetzung):** Ereignisse an den Element-Grenzen (Beginn/Ende je `seg_*.mp4`) plus grobe Zwischen-Ticks; **kein** Pro-Frame-Feuerwerk über IPC (Obergrenze wenige Ereignisse/Sekunde). Die genaue Rate ist Umsetzungsdetail, *dass* gedrosselt wird, ist verbindlich.

**Abbruch `cancelRender` (Renderer → Main):** Signal mit `renderId`. Der Main stoppt den laufenden `ffmpeg`-Prozess, räumt T1 **und die angefangene `<name>.mp4.part` im Ausgabeordner** auf und schließt den Lauf mit `RenderResult { status: abgebrochen }` ab (9.2.3). In v1 verfügbar. In der Praxis ist der Render **ein Auftrag der Auftrags-Queue** (9.3); der Nutzer löst den Abbruch über das `queue-panel` aus, das intern `cancelRender(renderId)` aufruft. `auftragId` und `renderId` bleiben dabei fest verknüpft (9.3).

**Abgrenzung (damit sich nichts doppelt):**

- Der Fortschrittskanal trägt **keinen** Endzustand. Erfolg, Fehler und Abbruch kommen **ausschließlich** über das `RenderResult` (9.2.3).
- Nach dem terminalen `RenderResult` dürfen **keine** weiteren `RenderProgress`-Ereignisse dieser `renderId` mehr folgen. Verspätete Ereignisse eines bereits beendeten Laufs erkennt der Renderer an der nicht mehr aktuellen `renderId` und verwirft sie.

#### 9.2.8 Parallele Einblendung: Split-Screen-Komposition (FA-20)

Ein `"video"`-Item kann eine **Einblendung** tragen: unter dem laufenden Video zeigt ein **Werbeband** eine oder mehrere rotierende Aktionen (Anforderungsdokument 4.5).

Es gibt **zwei** Kompositionsarten; welche gilt, bestimmt die **Art der Band-Vorlage** (`art`, 9.11.1) – gewählt bei der Vorlagenerstellung. **Genauer:** Die Art wird **beim Einreihen** des Render-Auftrags aus der Band-Vorlage abgeleitet und zusammen mit der Bandhöhe `H` als `einblendung.art` / `einblendung.höhe` im `RenderRequest` **mitgeführt** (9.2.2). Der `render-service` schlägt die Vorlage **nicht** zur Laufzeit nach – sein Eingang ist beim Einreihen eingefroren (9.3.5), und die Band-PNGs sind bereits in `1920 × H` gezeichnet.

**Art A – `split` (Hauptbetriebsart): Band *unter* dem verkleinerten Video.** Die **Bandhöhe `H` stammt aus der Band-Vorlage** und liegt dem Render als `einblendung.höhe` vor; die Geometrie leitet sich daraus ab:

| Bereich | Rahmen im 1920×1080-Bild |
|---|---|
| Video-Bereich | **1920 × (1080 − H)** bei y = 0 |
| Band | **1920 × H** bei y = 1080 − H |
| Video eingepasst (16:9) | höhenbegrenzt → Breite = (1080 − H) × 16/9, **abgerundet auf das nächstkleinere Vielfache von 4**, zentriert |
| Restflächen | links/rechts – gefüllt mit der Farb-Rolle **`flaecheDunkel`** (s. u.) |

*Beispiel mit der eingebauten Vorlage (H = 162):* Video-Bereich 1920 × 918, Video real **1632 × 918** zentriert (x = 144), Restflächen je **144 px**.

**Warum die Breite auf ein Vielfaches von 4 abgerundet wird – bindend:** `yuv420p` (9.2.4) tastet die Farbe in **beiden** Richtungen um den Faktor zwei unter und verlangt deshalb eine gerade Breite **und** einen geraden x-Versatz. Die gerade Bandhöhe (Punkt oben) allein genügt dafür **nicht**: (1080 − H) × 16/9 ist nur ganzzahlig, wenn 1080 − H durch 18 teilbar ist – H = 162 trifft das zufällig (918 → 1632), H = 200 nicht (880 × 16/9 = 1564,44). Und selbst eine gerade Breite reicht nicht, weil der Versatz (1920 − Breite) / 2 nur dann gerade ist, wenn die Breite durch 4 teilbar ist (1564 → 178 ✓, 1562 → 179 ✗). Abrunden auf ein Vielfaches von 4 erfüllt beide Bedingungen in einem Schritt. Der Rest von höchstens 3 px geht in die seitlichen `flaecheDunkel`-Flächen – er ist unsichtbar, weil die Restflächen ohnehin dort liegen. **Aufrunden ist verboten:** Es würde das Video über den Video-Bereich hinaus vergrößern und damit die Zusage „contain ohne Beschnitt" brechen.

**Die Rechnung liegt im geteilten Bereich, die Prüfung im `render-service` (bindend).** Die **reine** Geometrie-Rechnung – Videofläche, eingepasste Breite mit der Vierer-Abrundung, Versätze, Bandposition – ist eine Funktion **ohne Seiteneffekte** und gehört deshalb in den **geteilten Bereich** (`contracts`, Abschnitt 9): `berechneBandGeometrie(höhe) → BandGeometrie { videoBereichBreite, videoBereichHöhe, videoBreite, videoHöhe, videoVersatzX, videoVersatzY, bandY }`. **`render-service` (9.2.8) und `preview-player` (9.9.2) rufen dieselbe Funktion auf**; keiner von beiden rechnet selbst. Die **Prüfung** dagegen – zulässige Bandhöhe, Fehlercode `ungueltiges_element` (9.2.3) – bleibt im `render-service`: Sie ist Torwächter-Arbeit am Auftrags-Eingang, kennt Fehlercodes des Main und hat in einer reinen Rechenfunktion nichts zu suchen. *Begründung:* 9.9.2 verlangt seit je, dass die Vorschau „die Geometrie nach derselben Formel" rechnet. Solange die Formel im Main liegt, kann der Renderer sie **nicht importieren** (9.1) – er müsste sie **abschreiben**, und abgeschriebene Formeln driften. Verschärfend ist, dass ein Abschreibfehler bei der eingebauten Vorlage **unsichtbar** bliebe: H = 162 ergibt 1632, ein Vielfaches von 4, die Abrundung ändert dort **nichts**. Wer sie weglässt, merkt es erst, wenn ein Nutzer eine **eigene** Band-Vorlage baut – dann laufen Vorschau und fertiges Video auseinander, und zwar genau bei dem Nutzer, der es am wenigsten nachvollziehen kann.

**Bewusste Abweichung vom Ausgabe-Profil – nur hier:** 9.2.4 schreibt **schwarze** Balken vor. In der Split-Komposition werden die Restflächen **in der Markenfarbe** gefüllt, damit der Split gestaltet wirkt und nicht wie ungenutzter Platz. Die Einpassung bleibt **„contain" ohne Beschnitt**.

**Welche Markenfarbe – festgelegt:** die Farb-Rolle **`flaecheDunkel`** (9.11.2). Sie ist dort ausdrücklich als „Segment- und **Band**-Hintergrund" beschrieben; damit sind Band und seitliche Restflächen **dieselbe** Fläche und der Split wirkt aus einem Guss. Der `render-service` holt den Wert **über die Marke** (`config-store.leseMarke`, 9.5.6) und tippt ihn **nie** als Hexzahl in eine Filterkette – sonst hätte das Projekt zwei Quellen für dieselbe Farbe (9.11.1, Punkt 7).

**Art B – `einblendung`: Band *über* dem vollflächigen Video.** Das Video wird wie gewohnt auf **1920 × 1080** normalisiert (schwarze Balken nach 9.2.4, **keine** Verkleinerung, **keine** Markenfarb-Flächen). Das Band (1920 × H, **mit Alpha**) wird **unten überlagert** (y = 1080 − H). Vorteil: das Video behält seine volle Größe; dafür verdeckt das Band den unteren Bildbereich.

**Aufbau – in beiden Arten genau eine Re-Encodierung, Pipeline unverändert:**

1. **Band-Spur** erzeugen: die Band-PNGs der Abschnitte (von `template-canvas` mit einer `split`- bzw. `einblendung`-Vorlage) mit ihren Dauern zu einer **1920 × H**-Spur bei **30 fps CFR** verketten.
2. **Video vorbereiten:** bei `split` **contain** in den Video-Bereich skalieren und mit **`flaecheDunkel`** auffüllen (Wert aus der **Projekt-Standardmarke** `Project.standardMarkeId`, **nicht** aus der Marke der gerade sichtbaren Aktion – s. u.); bei `einblendung` normal auf 1920 × 1080 nach 9.2.4.
3. **Zusammensetzen:** bei `split` beide Spuren **vertikal stapeln** (`vstack`); bei `einblendung` die Band-Spur **unten überlagern** (`overlay`, Alpha respektiert).
4. Ergebnis ist der Zwischenclip `seg_*.mp4` im Profil. Der finale `concat -c copy` (9.2.6) bleibt **völlig unangetastet** – die Kern-Pipeline gilt in beiden Arten weiter.

**Zeitverhalten:**

- Abschnitts-Dauern unterliegen **derselben Frame-Rundung** wie alles andere (30 fps, 9.2.6) – sonst driftet das Band gegen das Video.
- Ist die Abschnitts-Folge **kürzer** als das (getrimmte) Video, **wiederholt** sie sich bis zum Videoende.
- Ist sie **länger**, wird am Videoende **abgeschnitten**.
- Die Elementdauer bestimmt **allein das Video** (Trim). Das Band verlängert oder verkürzt sie **nie**.

**Invarianten (bindend):**

- Parallele Bänder gibt es **nur bei `"video"`-Items**; `"bild"` und `"segment"` sind bereits vollflächige Standbilder.
- **Deckkraft folgt der Vorlagenart:** `split`-Bänder sind **deckend** (echter Split, keine Überdeckung); `einblendung`-Bänder tragen **Alpha** (sie überlagern das Video). `template-canvas` liefert beide in **1920 × H** (9.10.2).
- **Die Bandhöhe `H` stammt ausschließlich aus der Vorlage** – sie ist **kein** Wert am Listenelement und **nicht** pro Element überschreibbar. So bleibt das Erscheinungsbild an die Vorlage gebunden. Dass `H` (und `art`) im `RenderRequest` **mitreisen** (9.2.2), ist **keine** zweite Quelle: Es ist der beim Einreihen eingefrorene Stand **derselben** Vorlage (9.3.5) – dieselbe Beziehung wie zwischen Aktion und fertigem Segment-PNG.
- **Die Bandhöhe `H` muss *gerade* sein.** Das Ausgabe-Profil schreibt `yuv420p` vor (9.2.4); dieses Pixelformat tastet die Farbe in **beiden** Richtungen um den Faktor zwei unter und verlangt deshalb **gerade Höhen und gerade Versätze**. Bei ungeradem `H` bricht **jede** der beiden Kompositionsarten: bei `split` ist die Videofläche `1080 − H` ungerade, bei `einblendung` liegt das Overlay bei `y = 1080 − H` auf einer **ungeraden** Zeile. Durchgesetzt wird das **an der Quelle**, wo die Höhe entsteht: der `vorlagen-editor` sperrt eine ungerade Bandhöhe sofort (9.12.2), der `vorlagen-store` weist sie ab (9.12.1) – sonst erführe der Nutzer den Fehler erst beim Render, nachdem er die Vorlage fertig gebaut hat. Der `render-service` prüft sie **zusätzlich** und meldet `ungueltiges_element` (9.2.3), damit ein Auftrag aus einem älteren Bestand nicht mitten im Lauf scheitert. Die eingebaute Band-Vorlage erfüllt die Regel (`höhe: 162`, 9.11.1).
- **Alle Abschnitte eines Elements nutzen dieselbe Band-Vorlage** (eine `bandVorlageId` pro Einblendung) – damit `H` und die Kompositionsart während eines Videos nicht wechseln. Ein Wechsel mitten im Video würde die Geometrie springen lassen.
- **Ohne** Band bleibt die Verarbeitung **unverändert**: Video vollflächig 1920 × 1080 mit **schwarzen** Balken nach 9.2.4.

### 9.3 Subsystem `auftrags-manager` (Auftragsverwaltung) [P6]

**Richtung:** Renderer → Main (Aufträge einreihen/steuern), Main → Renderer (Zustands-Push), ausschließlich über den typisierten IPC-Vertrag.
**Fachlich:** Die Auftragsverwaltung ist **mehr als eine Warteschlange** – ein Verwaltungs-Subsystem mit vier Aufgaben:

1. **Torwächter (Zulassung):** bestimmt, *welcher* Auftrag jetzt laufen darf — serielle Freigabe, **genau einer** gleichzeitig (der einzige Sperr-Mechanismus des Systems; FA-16 ff., NFA-09).
2. **Zustandsführung:** verfolgt jeden Auftrag über seinen Lebenszyklus (9.3.3).
3. **Wiederholung:** hält Fehlschläge vor und reiht sie **auf Wunsch** wieder ein (`wiederhole`, 9.3.4). **`pendingDeletions` sind ausdrücklich KEINE Aufträge:** Sie werden in Q2 nur **verwahrt**; nachgeholt werden sie vom Reconcile des `media-service` beim Öffnen des Projekts (9.4.7). *Begründung:* Ein `loeschen`-Auftrag beginnt laut 9.4.6 mit dem Entfernen des D1-Eintrags – bei einer offenen Löschung ist der längst weg, ein erneut eingereihter Auftrag scheiterte also deterministisch mit `asset_nicht_gefunden`. Übrig bleibt allein das Entfernen der Datei, und das gehört dem `media-service`.
4. **Persistenz-Hoheit:** entscheidet, was flüchtig bleibt und was den Neustart überlebt — dafür die vier Speicher unten.

Sie setzt sich als Steuerungs- und Sichtbarkeits-Schicht **vor** die fachlichen Dienste (`media-service`, `render-service`, `export-service`); deren interne Verträge bleiben unberührt. Sie **plant, ordnet und protokolliert** nur — sie ersetzt keine Fachlogik.

**Die vier Speicher (Q1–Q4) – bewusst jeweils eigene Persistenz:**

| Speicher | Inhalt | Persistenz | Ort | Warum diese Stufe |
|---|---|---|---|---|
| **Q1 Aktive Warteschlange** | anstehende Aufträge + der eine laufende (mit Fortschritt) | **flüchtig (RAM)** — nach Neustart leer | nur Arbeitsspeicher | in-flight-Arbeit ist nicht fortsetzbar (T1 verworfen, `ffmpeg` tot); ein halber Render darf nicht „auferstehen" |
| **Q2 Wiederholungs-Speicher** | fehlgeschlagene Aufträge (`payload`, `fehler`, `versuche`) + `pendingDeletions` | **persistent bis erledigt** — überlebt Neustart, Eintrag weg nach Erfolg/Verwerfen | `projects/<id>/queue-retry.json` | „Wiederholen" muss einen **Absturz** überstehen; nach Erledigung bleibt kein Müll |
| **Q3 Ausführungs-Protokoll** | **ein Eintrag je beendetem Versuch** (append-only) | **dauerhaft, unbegrenzt** — nie automatisch gelöscht | `protokoll.json` (app-weit) | Nachvollziehbarkeit/Audit; enthält die Ausgabe-Historie (erfolgreiche Renders) als Teilmenge |
| **Q4 Warteschlangen-Journal** | **Bewegungen** der Schlange (eingereiht/gestartet/entfernt/erneut eingereiht) | **dauerhaft, rotierend** (letzte N) | `warteschlangen-journal.json` (app-weit) | rein **diagnostisch** („warum lief das nie?"); getrennt von Q3, damit das Protokoll lesbar bleibt |

Q2 liegt **pro Projekt** (Fehlschläge/pendingDeletions gehören zum Projekt und werden bei dessen Öffnen nachgeholt, vgl. 9.4.7); Q3 und Q4 sind **app-weit**. Die Ausgabe-Historie wandert damit von D3 in Q3.

**Eigentum und Ausführung trennen sich bei `pendingDeletions`:** Die Datei `queue-retry.json` **gehört** der Auftragsverwaltung – sie allein schreibt sie (eigene Serialisierung, 9.5.4) und bietet dem `media-service` **main-intern** (kein IPC-Kanal) an, die offenen Löschungen zu **lesen**, zu **ergänzen** und einzeln zu **streichen**. **Ausgeführt** wird eine offene Löschung dagegen vom Reconcile des `media-service` (9.4.7) – nicht über die Warteschlange und nicht als Auftrag.

**Datensätze von Q3 und Q4:**

```
ProtokollEintrag {              // Q3 – ein Eintrag je BEENDETEM Versuch
  id:         string            // UUID
  auftragId:  string            // derselbe Auftrag kann mehrere Einträge haben (Wiederholungen)
  art:        "import" | "loeschen" | "render" | "export"
  projektId:  string
  versuch:    number            // 1, 2, 3 … – steigt bei jeder Wiederholung
  begonnenAm: string            // ISO-8601 UTC
  beendetAm:  string            // ISO-8601 UTC  → die Dauer ergibt sich daraus
  ergebnis:   "erfolg" | "fehlgeschlagen" | "abgebrochen"
  fehler:     { code, meldung } | null
  ausgabe:    { pfad:         string,
                dateigroesse: number,
                gesamtdauer:  number | null } | null       // nur bei erfolgreichem render/export
}

JournalEintrag {               // Q4 – eine Zeile je Bewegung
  zeit:      string             // ISO-8601 UTC
  auftragId: string
  bewegung:  "eingereiht" | "gestartet" | "entfernt" | "erneut_eingereiht"
  position:  number | null      // Platz in der Schlange, wo sinnvoll
}
```

**`ausgabe.gesamtdauer` darf `null` sein – und ist es beim Export immer.** Ein `render` kennt die Spieldauer der erzeugten Datei (framegerundet, 9.2.6); ein `export` kopiert nur eine fertige Datei und kennt sie **nicht** – er müsste sie eigens mit `ffprobe` ermitteln, ohne dass jemand den Wert braucht. Deshalb ein **nullbares Feld** statt zweier Formen von `ausgabe`: Ein Feld, das leer sein darf, ist leichter zu lesen und zu schreiben als eine zweite Variante, und die Frage „was wurde produziert" beantwortet der **Pfad**, nicht die Dauer. **`pfad` ist beim `render` die erzeugte Ausgabedatei, beim `export` die Zieldatei auf dem Stick** (`zielPfad` + Dateiname, 9.6.1) – in beiden Fällen die Datei, die dieser Versuch hervorgebracht hat.

**Wann geschrieben wird – abgeleitet aus der Zustandsmaschine (9.3.3):**

| Übergang | Q3 | Q4 |
|---|---|---|
| – → `anstehend` (eingereiht) | – | `eingereiht` |
| `anstehend` → `laeuft` | – | `gestartet` |
| `laeuft` → `erfolg` | **Eintrag** | – |
| `laeuft` → `fehlgeschlagen` | **Eintrag** | – |
| `laeuft` → `abgebrochen` | **Eintrag** | – |
| `anstehend` → entfernt | – | `entfernt` |
| `fehlgeschlagen` → `anstehend` (`wiederhole`) | – | `erneut_eingereiht` |

- **Q3 protokolliert nur, was tatsächlich gelaufen ist.** Ein Auftrag, der die Schlange nie verlassen hat, erzeugt **keinen** Protokolleintrag – es gibt nichts zu berichten. Seine Bewegungen stehen in Q4.
- **Fehlschläge bleiben sichtbar:** Eine Wiederholung erzeugt einen **neuen** Q3-Eintrag mit höherem `versuch`. Ein Export, der zweimal an einem vollen Stick scheitert und beim dritten Mal klappt, hinterlässt **drei** Einträge – die Fehlerhistorie geht nicht verloren, auch wenn der Q2-Eintrag nach dem Erfolg verschwindet.
- **Die Trennung Q3/Q4 ist Absicht:** Q3 beantwortet „**was wurde produziert**" (nutzerlesbare Historie), Q4 „**was passierte in der Schlange**" (Diagnose). Beides in einem Speicher würde die Historie im Bewegungsrauschen untergehen lassen – deshalb ist Q3 unbegrenzt und Q4 rotierend.

#### 9.3.1 Der `Auftrag`

| Feld | Inhalt | Zweck |
|---|---|---|
| `auftragId` | ID des Auftrags (Main-vergeben) | eindeutige Referenz für Steuerung und Zustands-Push |
| `art` | `import` \| `loeschen` \| `render` \| `export` | diskriminiert die `payload` |
| `status` | `anstehend` \| `laeuft` \| `erfolg` \| `fehlgeschlagen` \| `abgebrochen` | Zustand (9.3.3) |
| `label` | UI-Klartext, z. B. „Import: sommer-aktion.mp4" | Anzeige im `queue-panel` |
| `payload` | `ImportRequest` \| `LöschRequest` \| `RenderRequest` \| `ExportRequest` | vollständig aufbewahrt → Wiederholung ohne Neu-Eingabe möglich |
| `fortschritt` | 0–100 oder `null` | grober Fortschritt (bei `render` aus `RenderProgress`, 9.2.7); `null` wo unbestimmt |
| `versuche` | Anzahl **tatsächlich gestarteter** Ausführungen | macht wiederholtes Scheitern sichtbar; wird **beim Start** einer Ausführung erhöht (s. 9.3.3) |
| `fehler` | `{ code, meldung, daten? }` oder `null` | gesetzt bei `fehlgeschlagen`; `code` stammt aus dem Fachdienst, `daten` trägt die Nutzdaten des Codes (9.1.1) |
| `ergebnis` | fachliche Nutzdaten des Dienstes oder `null` | gesetzt bei `erfolg`: `import` → der fertige `Asset` (9.4.4), `loeschen` → `{ assetId }`, `render` → Pfad/**Ausgabename**/Größe/Dauer (9.2.3), `export` → `{ zielPfad, dateigroesse }` (9.6.1). **Ohne dieses Feld erführe die Oberfläche nie, was ein Auftrag hervorgebracht hat** – ein Import bliebe unsichtbar, bis der Nutzer das Projekt neu öffnet |
| `erstelltAm` | ISO-8601 UTC | Reihenfolge/Anzeige |

#### 9.3.2 Auftragsarten

| `art` | ausführender Dienst | Nutzlast |
|---|---|---|
| `import` | `media-service` (9.4) | `ImportRequest` |
| `loeschen` | `media-service` (9.4) | `LöschRequest` |
| `render` | `render-service` (9.2, `renderReel`) | `RenderRequest` |
| `export` | `export-service` | `ExportRequest` |

**Nicht** über die Queue laufen **Instant-Operationen** (Millisekunden, reine D1-Schreibvorgänge): Aktion anlegen/bearbeiten, Liste umsortieren, Trim setzen, **Aktion** löschen, Datei-Dialog öffnen. Sie laufen direkt (Request → Response), abgesichert allein durch das eine D1-Schreib-Lock des `project-store`, und erscheinen nicht im `queue-panel` (sonst Rauschen). Auch die interaktive **Vorschau** (P5) ist **kein** Auftrag — sie läuft unabhängig und wird von der Queue weder blockiert noch blockiert sie diese.

#### 9.3.3 Zustände und Übergänge

```
        reiheEin                start (frei)              Erfolg
  (–) ─────────────▶ anstehend ───────────▶ laeuft ───────────────▶ erfolg
                        │                     │
              entferne  │                     │ Fehler
                        ▼                     ▼
                    (entfernt)          fehlgeschlagen ──wiederhole──▶ anstehend (ans Ende)
                                              │
                          entferne/cancel     ▼
                    laeuft ───────────────▶ abgebrochen
```

- **`anstehend` → `laeuft`:** nur wenn **kein** anderer Auftrag `laeuft` (serielle Invariante). Auswahl in FIFO-Reihenfolge. Bei `render` und `export` erzwingt der Main den **Sofort-Flush** von D1 (9.5.4) – nicht beim Einreihen. **Er läuft als erster Schritt IM HANDLER**, also nach dem Statuswechsel und bevor der Handler die eigentliche Arbeit aufnimmt. Begründung: Die Auswahl des nächsten Auftrags und der Statuswechsel bilden einen **synchronen** Abschnitt ohne `await` – nur so ist die serielle Invariante bewiesen. Ein Flush ist asynchron; dazwischengeschoben, öffnete er genau das Fenster, in dem ein zweiter Auftrag starten könnte. Nach dem Statuswechsel ist der Platz belegt, ein `await` also gefahrlos.
- **`fehlgeschlagen`/`abgebrochen`/`erfolg`** sind terminal. `fehlgeschlagen` ist über `wiederhole` reaktivierbar; der **selbe** Eintrag wird wieder `anstehend` und **ans Ende** gestellt (kein neuer Eintrag).
- **`versuche` wird beim Übergang `anstehend` → `laeuft` erhöht**, also genau dann, wenn eine Ausführung **tatsächlich beginnt** – **nicht** beim Wiedereinreihen. Das Feld zählt „bisherige Ausführungen" (9.3.1); würde `wiederhole` erhöhen, stünde ein einmal gelaufener, gescheiterter Auftrag bei `0`, und eine nie gestartete Wiederholung würde mitgezählt. `ProtokollEintrag.versuch` (9.3) ist der Wert dieses Laufs und beginnt damit bei 1.

#### 9.3.4 IPC-Oberfläche

```
reiheEin(art, payload) → Ergebnis<{ auftragId }>   // kehrt SOFORT zurück; sagt nichts über den Ausgang
entferne(auftragId)    → Ergebnis<void>            // anstehend: aus Schlange nehmen; laeuft+render: Abbruch (→ cancelRender)
wiederhole(auftragId)  → Ergebnis<void>            // fehlgeschlagen → anstehend, ans Ende (versuche steigt erst beim Start, 9.3.3)
holeStand()            → Ergebnis<Auftrag[]>       // Snapshot für die UI (z. B. beim Öffnen des Panels)
```
```
QueueGeändert(Auftrag[])   // Main → Renderer: Push bei jeder Zustandsänderung → speist das queue-panel
                           // Ereignis: OHNE Hülle und ohne Endzustand (9.1.1 Punkte 5 und 2)
                           // Empfänger: DAS EINE Fenster der App (9.1.1 Punkt 10)
```

Alle vier Aufrufe sind **Instant** und tragen die Ergebnis-Hülle (9.1.1): `Ergebnis<void>` heißt „eingereiht/entfernt/wiederholt", **nicht** „fertig". Ein `entferne` auf einen bereits beendeten Auftrag ist kein Erfolg, sondern `nicht_gefunden`.

`import`, `loeschen`, `render` und `export` werden damit **nicht** als direkte Request/Response-Operationen aufgerufen, sondern über `reiheEin` eingereiht; ihr Fach-Ergebnis (`erfolg`/`fehlgeschlagen` samt Fachfehlercode) kommt über den Auftrags-Zustand.

#### 9.3.5 Invarianten (bindend)

- **Seriell:** höchstens **ein** Auftrag in `laeuft`. Das ist der einzige Sperr-Mechanismus des Systems; ein zweites Lock ist nicht nötig und darf nicht eingeführt werden. Genau daraus folgt, dass ein `loeschen` eines Mediums **nie** parallel zu einem laufenden `render` läuft — es wartet, bis der Render den Datei-Handle freigegeben hat (löst zugleich das Windows-`EBUSY`-Problem, 9.4).
- **FIFO** unter `anstehend`; `wiederhole` hängt hinten an.
- **Render friert seinen Eingang beim Einreihen ein:** die geordnete Liste + Profil des `RenderRequest` werden **zum Einreih-Zeitpunkt** als Snapshot genommen. Spätere Listenänderungen betreffen einen bereits eingereihten Render **nicht** (verhindert „gedrückt, dann getweakt, anderes Video").
- **Determinismus durch sichtbare Reihenfolge:** Reihenfolge zweier Aufträge = Einreih-Reihenfolge, im Panel sichtbar. Beispiel: `loeschen` vor `render` eingereiht → Asset ist weg, der Render scheitert deterministisch mit `medium_fehlt` (9.4); umgekehrt läuft der Render zuerst und nutzt das Asset. Der Nutzer sieht die Reihenfolge und kann sie über `entferne`/`wiederhole` steuern.
- **Differenzierte Persistenz (vier Speicher):** **Q1** (aktive Warteschlange) ist flüchtig — nach Neustart leer; **Q2** (Fehlschläge + `pendingDeletions`) überlebt den Neustart und wird nach Erledigung gelöscht; **Q3** (Protokoll) ist dauerhaft und **unbegrenzt**; **Q4** (Journal) ist dauerhaft, aber **rotierend**. Die aktive Queue wird also *nicht* persistiert, die Wiederhol-Fähigkeit und die Historie sehr wohl.
- **Wiederholen bleibt ein Eintrag:** `wiederhole` verschiebt den bestehenden Q2-Eintrag zurück nach `anstehend` (ans Ende); `versuche` steigt beim **Start** der Wiederholung (9.3.3). Es entsteht **kein** Duplikat. Nach Erfolg/Verwerfen verschwindet der Q2-Eintrag.

#### 9.3.6 Verzahnung mit `render-service`

Der bestehende Vertrag 9.2 (`renderReel`, `RenderRequest`/`RenderResult`, `RenderProgress`, `cancelRender`) bleibt vollständig gültig. Die Queue nutzt ihn:

- Ein `render`-Auftrag führt beim Start intern `renderReel(payload)` aus – **nach** dem Sofort-Flush von D1 (9.5.4). `RenderProgress.prozent` (Kanal `render:fortschritt`, 9.2.7) speist `Auftrag.fortschritt`; `RenderResult` bestimmt den terminalen Auftrags-`status` (erfolg/fehlgeschlagen/abgebrochen) und liefert bei Erfolg die Nutzdaten **Pfad, Ausgabename, Größe und Gesamtdauer** (9.2.3) – daraus baut die Auftragsverwaltung `Auftrag.ergebnis` **und** den Q3-Protokolleintrag. Der **Ausgabename** reist dabei **nur** in `Auftrag.ergebnis`: Über ihn erfährt die Oberfläche, welcher Name tatsächlich verwendet wurde, und hält ihre Vorbelegung mit `Project.letzterAusgabeName` (FA-22) im Gleichklang. In `ProtokollEintrag.ausgabe` steht er **nicht** – er ist dort bereits Teil des Pfades. Einen fertig vorbereiteten Historie-Eintrag liefert der `render-service` **nicht**; das wäre eine zweite Quelle für dieselbe Information.
- `entferne` auf einen laufenden `render` delegiert an `cancelRender(renderId)`; die `renderId` liegt im `RenderRequest` des Auftrags — `auftragId` und `renderId` bleiben fest verknüpft.
- Der frühere Fehlercode `render_aktiv` **entfällt** — durch die serielle Ordnung kann die Kollision, die er gemeldet hätte, gar nicht mehr auftreten.

---

### 9.4 Schnittstelle `media-service` [P1]

**Richtung:** Renderer → Main (über die Auftrags-Queue bzw. für den Dialog direkt), Main → Renderer (Ergebnis über Auftrags-Zustand).
**Fachlich:** „Bringe eine Quelldatei robust in den Medienbestand des Projekts (Kopie + Metadaten + Datensatz) bzw. entferne ein Medium wieder — konsistent, atomar und plattformgleich auf Windows und macOS."

#### 9.4.1 Verantwortungsgrenze

- **`media-service` besitzt:** den Dateizugriff auf D2 (kopieren, löschen), das `ffprobe`-Auslesen beim Import, den nativen Datei-Dialog (weil der Formatfilter zum Dienst gehört) sowie den Reconcile beim Projektstart (9.4.7). Alle D1-Schreibvorgänge delegiert er an den `project-store` (dessen einziges Schreib-Lock, 9.3.5). Auch die **Pfadauflösung** (welcher absolute Pfad zu `projektId`+`dateiname` gehört) kommt vom `project-store` (Pfad-Autorität, 9.5.7) – `media-service` liest/schreibt die Bytes, kennt das Ordner-Layout aber nicht selbst.
- **`media-service` besitzt NICHT:** das Lesen der Asset-Liste (das macht `project-store`); eine Sonderbehandlung von Aktions-Bildern (jedes importierte Bild ist ein gleichwertiges `Asset`); jede Normalisierung/Konvertierung der Quelldatei (die bleibt **roh**; das Normalisieren auf das Profil geschieht erst zur Render-Zeit, 9.2.4/9.2.6).

#### 9.4.2 Format-Whitelist

| Typ | Erlaubte Formate |
|---|---|
| `video` | MP4 (H.264/H.265) |
| `bild` | JPG, PNG, WebP |

*Begründung:* MP4 ist das einzige Videoformat, das Chromium in der Vorschau (`<video>`) zuverlässig nativ abspielt. MKV/MOV/AVI werden **ausgeschlossen** — sie würden im Render (ffmpeg) zwar lesbar, aber die Vorschau (P5) bliebe je nach OS **lautlos** schwarz; das widerspricht der Pixel-/Darstellungsgleichheit und ist durch keine lokale 30-Zeilen-Entscheidung heilbar. Quelldateien in anderen Formaten muss der Nutzer vorab konvertieren.

**Invariante:** Der Formatfilter des Dialogs (9.4.3) und die Prüfung beim Import lesen **denselben** konstanten Wert aus `contracts/types` — sie dürfen nie auseinanderlaufen.

#### 9.4.3 Operationen

**`öffneMedienDialog` (Instant, kein Auftrag):**

```
öffneMedienDialog() → Ergebnis<{ pfade: string[] }>     // Instant
```

| Fall | Ergebnis |
|---|---|
| Nutzer wählt Dateien | `pfade` = Array absoluter Quellpfade |
| Nutzer bricht ab | `ok: true` mit `pfade = []` – Abbruch ist **kein** Fehler |

**`importMedium` (Auftrag `art: import`):** Eingang `ImportRequest`:

| Feld | Inhalt |
|---|---|
| `projektId` | Ziel-Projekt; bestimmt den `media/`-Ordner |
| `quellPfad` | absoluter Pfad der Quelldatei (aus `öffneMedienDialog`) |

**Auftrags**-Ergebnis bei Erfolg: der fertige `Asset` (9.4.4) – er steht in **`Auftrag.ergebnis`** (9.3.1) und erreicht die Oberfläche über den Auftrags-Zustand (`queue:geaendert`/`holeStand`), **nicht** als `Ergebnis<T>` einer Aufrufantwort (9.1.1); der Aufruf selbst ist `reiheEin('import', …)` → `Ergebnis<{ auftragId }>`. Fehlercodes: 9.4.9.

**`löscheMedium` (Auftrag `art: loeschen`):** Eingang `LöschRequest`:

| Feld | Inhalt |
|---|---|
| `projektId` | Projekt-Kontext |
| `assetId` | zu löschender Asset |

**Auftrags**-Ergebnis bei Erfolg: `{ assetId }` in **`Auftrag.ergebnis`** – ebenfalls über den Auftrags-Zustand (s. o.). Fehlercodes: 9.4.9.

#### 9.4.4 Der `Asset`-Typ

```
Asset {
  id:           string              // UUID, vom media-service beim Import vergeben
  typ:          "video" | "bild"
  dateiname:    string              // "<uuid>.<ext_kleingeschrieben>" — OHNE Verzeichnisanteil
  originalname: string              // ursprünglicher Dateiname, nur für die UI-Anzeige
  maße: { breite: number, höhe: number }   // DISPLAY-Maße in Pixeln, ganzzahlig (9.4.8)
  dauer:        number | null       // Sekunden, 3 Nachkommastellen (Video); null (Bild)
  importdatum:  string              // ISO-8601 UTC
  zustand:      "ok" | "fehlt"      // "fehlt" gesetzt vom Reconcile, wenn die Datei fehlt (9.4.7)
}
```

#### 9.4.5 Import-Ablauf (atomar)

1. Quelle → `media/.staging/<uuid>.<ext>.part` kopieren *(langsam, **außerhalb** des D1-Locks)*.
2. `ffprobe` auf die `.part`-Datei, **mit Timeout** *(außerhalb des Locks)*. `ffprobe` wird **mitgeliefert** (Abschnitt 3) und wie `ffmpeg` im gepackten Zustand aufgelöst und beim Start selbstgetestet – `ffmpeg-static` allein enthält es **nicht**.
3. `fs.rename` `.part` → `media/<uuid>.<ext>` — **atomar**, weil gleiche Partition (Staging liegt in `media/`; cross-volume-rename wäre copy+delete und **nicht** atomar).
4. **[D1-Lock]** Asset in D1 anhängen, danach **Sofort-Flush** (9.5.4) – der Auftrag meldet Erfolg erst, wenn der Eintrag auf der Platte steht *(Millisekunden)*. Scheitert der Flush → `speicher_fehler` (9.4.9).

Crash vor 3 → nur eine `.part`-Leiche; Crash nach 3 vor 4 → eine fertige Waise ohne D1-Eintrag. Beides räumt der Reconcile (9.4.7) auf.

#### 9.4.6 Lösch-Ablauf (D1 zuerst)

1. **[D1-Lock]** Referenzen prüfen. Referenziert (ListItem zeigt darauf)? → Fehler `asset_referenziert` (mit `referenzenIds`), Abbruch. Sonst: Asset-Eintrag aus D1 entfernen, danach **Sofort-Flush** (9.5.4) – erst wenn der Eintrag **dauerhaft** weg ist, darf Schritt 2 die Datei anfassen; sonst wäre „D1 zuerst" nur im Arbeitsspeicher wahr und ein Absturz dazwischen ließe einen Eintrag ohne Datei zurück. Scheitert der Flush → `speicher_fehler`, die Datei bleibt unangetastet. **Referenzprüfung und Entfernen im selben kritischen Abschnitt** → schließt die TOCTOU-Lücke gegen ein gleichzeitiges Setzen einer neuen Referenz durch den `composer`.
2. `fs.unlink` der Datei *(außerhalb des Locks)*, auf Windows mit **Retry + Backoff** bei `EBUSY`/`EPERM` (Handle der Vorschau hängt evtl. Millisekunden nach; der Render-Fall ist durch die serielle Queue bereits ausgeschlossen).
3. Schlägt `unlink` endgültig fehl → **`dateiname`** (ohne Verzeichnisanteil, s. 9.4.8 Punkt 1) in `pendingDeletions` (**Q2**, `projects/<id>/queue-retry.json` – gehört der Auftragsverwaltung, 9.3); der Reconcile beim nächsten Öffnen des Projekts holt es nach (9.4.7). *Bewusst nicht der absolute Pfad:* Die App ist portabel – ein gespeicherter OS-Pfad wird ungültig, sobald der Ordner umzieht (USB-Stick), und der Reconcile suchte an der falschen Stelle.

**Bewusster Trade-off (D1 zuerst):** Referenz-Konsistenz ist **immer** garantiert (nie zeigt ein ListItem auf eine gelöschte Datei = nie ein kaputter Render). Preis: bei fehlgeschlagenem `unlink` liegt kurzzeitig eine Datei **ohne** D1-Eintrag auf der Platte (Speicher erst nach Reconcile frei). Konsistenz gewinnt gegen Aufräum-Sauberkeit.

**Vorbedingung Vorschau (Regel B):** Vor einem `loeschen` gibt der Renderer jeden `<video>`-Handle auf diesen Asset frei (`src=""`, `load()`); der Windows-Retry ist nur Sicherheitsnetz.

#### 9.4.7 Reconcile beim Projektstart

Beim Öffnen eines Projekts, **bevor** die UI Medien zeigt (kein Render/keine Vorschau hält dann Handles):

- **Datei in `media/` ohne D1-Eintrag** (Crash-/`unlink`-Waise, `.part`-Leiche) → löschen, Speicher zurück.
- **D1-Eintrag ohne Datei** → `Asset.zustand = "fehlt"`. Die UI zeigt ihn rot; der `render-service` bricht **früh** mit `medium_fehlt` ab statt mitten im Lauf. **Umgekehrt gilt dasselbe:** Ist die Datei wieder da (der Nutzer hat sie zurückkopiert, ein Netzlaufwerk war offline), wird `zustand` auf `"ok"` zurückgesetzt. Ohne diese Rückrichtung bliebe ein einmal als fehlend markiertes Medium **für immer** rot und unbenutzbar, obwohl es vorhanden ist.
- **`pendingDeletions` aus Q2** (`projects/<id>/queue-retry.json`) → jetzt nachholen. Q2 liegt **pro Projekt**, weil ausstehende Löschungen zum Projekt gehören und mit ihm verschwinden (9.3).

#### 9.4.8 Invarianten (bindend)

1. **`dateiname` = `<uuid>.<ext_kleingeschrieben>`, ohne Verzeichnisanteil.** Auflösung immer per `path.join(projektMediaDir, dateiname)`. Nie der Originalname, nie ein gespeicherter OS-Pfad mit `\`/`/` — sonst ist das Projekt nicht zwischen Windows und macOS portabel.
2. **ffprobe/ffmpeg-Argumente nie per String-Konkatenation, immer als Argument-Array.** Windows-Pfade enthalten regelmäßig Leerzeichen; ein zusammengebautes Kommando bricht dort und funktioniert auf macOS scheinbar.
3. **`maße` = Display-Maße.** Trägt der Videostream einen Rotations-Tag `rotate ∈ {90, 270}`, werden `breite`/`höhe` getauscht; sonst direkt übernommen. Immer ganzzahlig (`Math.round`). Nie `stream.width`/`stream.height` ohne Rotationskorrektur — sonst zeigt die UI falsche Maße und der Nutzer setzt falsche Trim-Punkte.
4. **`dauer` = ffprobe-Sekunden, 3 Dezimalstellen, nie auf Integer gerundet** (z. B. `12.033`). Für Bilder immer `null`.
5. **Atomizität Import:** Kopie scheitert → kein D1-Eintrag. D1-Schreibfehler nach Rename → kein Halbzustand mit Referenz. (Reconcile bereinigt Waisen.)
6. **Atomizität Löschen:** Reihenfolge D1 → Datei. Kein ListItem zeigt je auf eine bereits gelöschte Datei.
7. **Format-Whitelist** kommt aus **einem** konstanten Wert in `contracts/types` (Dialog-Filter **und** Import-Prüfung).
8. **`media/` enthält im Normalbetrieb nur Dateien mit D1-Eintrag.** Abweichungen (nur durch Crash/`unlink`-Fehler möglich) bereinigt ausschließlich der Reconcile beim Start; **kein** periodisches Aufräumen im laufenden Betrieb.
9. **Kein zweites Lock.** Serialisierung von Operationen liefert die Queue (9.3), Serialisierung von D1-Schreibvorgängen das eine `project-store`-Lock. `media-service` führt **kein** eigenes Lock und **keine** OS-Dateisperren ein (Over-Engineering-Falle).

#### 9.4.9 Fehlercodes

**`importMedium`:**

| Fehlercode | Ursache |
|---|---|
| `datei_nicht_gefunden` | `quellPfad` existiert nicht mehr (zwischen Dialog und Import verschoben) |
| `format_nicht_unterstuetzt` | Endung/MIME nicht in der Whitelist (9.4.2) |
| `probe_fehler` | `ffprobe` liefert keine Metadaten (beschädigte Datei) **oder** Timeout (gekillt) |
| `kopier_fehler` | Disk-Fehler, Platzmangel |
| `speicher_fehler` | D1-Schreibfehler |

**`löscheMedium`:**

| Fehlercode | Ursache |
|---|---|
| `asset_nicht_gefunden` | `assetId` existiert nicht in D1 |
| `asset_referenziert` | ein ListItem zeigt noch darauf; trägt `daten: { referenzenIds: string[] }` (strukturierte Fehlerdaten, 9.1.1) |
| `datei_fehler` | Datei konnte nicht gelöscht werden (nach Retry) → als `pendingDeletion` vorgemerkt |
| `speicher_fehler` | D1-Schreibfehler beim Entfernen des Eintrags (Platte voll, Rechte) – die Datei bleibt unangetastet, weil Schritt 1 nie abgeschlossen wurde |

---

### 9.5 Schnittstellen `project-store` [D1] und `config-store` [D3]

**Fachlich:** Diese beiden besitzen die **persistenten Fach- und App-Daten** und das **automatische Speichern** (FA-15). Der `project-store` besitzt zusätzlich das **eine D1-Schreib-Lock**, durch das *alle* `project.json`-Mutationen laufen (auch die von `media-service` delegierten), und ist die **Pfad-Autorität** des Projekts: er löst alle Medienpfade auf und trägt das `media://`-Protokoll (9.5.7).

#### 9.5.1 `project-store` – Verantwortung & Modell

- Besitzt `project.json` je Projekt (Projekt, Aktionen-Bibliothek, Liste, Vorlagen-Ref) und das **eine D1-Schreib-Lock**.
- Das **aktive** Projekt lebt zur Laufzeit **im Speicher** (Quelle der Wahrheit während der Sitzung; Lesezugriffe sind sofortig). Nur *ein* Projekt ist gleichzeitig geladen.
- Die **Projekt-Liste** (FA-10) sind leichte Metadaten (Name, Erstell-/Änderungsdatum, Ordner, **Kennzeichnung beschädigter Projekte**), bei Bedarf aus dem `projects/`-Ordner gelesen – der Scan läuft **unter dem D1-Lock** (Begründung: 9.5.2).
- Führt alle **Instant-Operationen** aus (nicht über die Queue): Aktion CRUD, Liste ordnen, Trim/Dauer setzen.
- Ist die **Pfad-Autorität** des Projekts: löst `(projektId, dateiname) → absoluter Pfad` auf und trägt das `media://`-Protokoll für den Renderer-Lesezugriff (9.5.7).

#### 9.5.2 Operationen (Instant, über das D1-Lock)

**Projektverwaltung (FA-10):**

| Operation | Eingang → Ausgang |
|---|---|
| `erstelleProjekt` | `name` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`) |
| `öffneProjekt` | `id` → `Ergebnis<Projekt>` (lädt in den Speicher; setzt aktives Projekt via `config-store`) |
| `listeProjekte` | – → `Ergebnis<ProjektMeta[]>` (id, name, erstelltAm, geaendertAm, ordner, **beschaedigt**) – listet **auch** Projekte mit defekter `project.json`, gekennzeichnet statt weggelassen (s. u.) |
| `dupliziereProjekt` | `id`, `neuerName` → `Ergebnis<Projekt>` (kopiert `project.json` **und** `media/`) |
| `löscheProjekt` | `id` → `Ergebnis<void>` (entfernt den Projektordner; war es aktiv, fällt `config-store` sanft zurück – und die Oberfläche leert ihre gemeinsame Projekt-Sicht, 9.7.4). Die Oberfläche **muss vorher benennen, was verschwindet** – s. u. |
| `öffneProjektordner` | `projektId` → `Ergebnis<void>` – öffnet den Projektordner im **Datei-Explorer des Betriebssystems**; eigener Kanal `project:öffneProjektordner`, s. u. |

```
ProjektMeta {
  id:             string       // = Ordnername unter projects/
  name:           string       // aus project.json; bei beschaedigt: true der ORDNERNAME als Behelf
  erstelltAm:     string       // ISO-8601 UTC; bei beschaedigt: true aus den Ordner-Zeitstempeln
  geaendertAm:    string       // ISO-8601 UTC; bei beschaedigt: true aus den Ordner-Zeitstempeln
  ordner:         string       // relativer Ordnername
  beschaedigt:    boolean      // true = weder project.json noch project.json.bak lesbar
  anzahlMedien:   number       // Dateien in media/ – aus dem ORDNER gezählt, nicht aus project.json
  anzahlAusgaben: number       // fertige .mp4 in output/ – Zählweise wie listeAusgaben (.part zählt nicht)
}
```

**Ein beschädigtes Projekt wird MIT WARNHINWEIS gelistet, nicht weggelassen (bindend).** Ist die `project.json` eines Ordners unlesbar oder ungültig **und** lässt sie sich auch nicht aus `project.json.bak` wiederherstellen (9.5.4), erscheint der Eintrag **trotzdem** in der Liste: mit dem **Ordnernamen** als Behelfs-Bezeichnung und `beschaedigt: true`. Die Oberfläche kennzeichnet ihn sichtbar und lässt ihn **nicht öffnen** – ein `öffneProjekt` auf ihn scheitert unverändert nach der Regel aus 9.5.4 (Fehler melden, **nicht** leer weiterstarten).

*Begründung:* Die **Medien des Nutzers liegen weiterhin im Ordner** (`projects/<id>/media/`), ebenso die gerenderten Ausgaben. Ein weggelassenes Projekt sieht für ihn aus wie ein **verlorenes** – er würde von vorn anfangen, obwohl seine Arbeit noch vollständig auf der Platte liegt. Sichtbar mit Warnung ist die **ehrlichere** und zugleich die **reparierbare** Variante: Der Eintrag ist der einzige Hinweis darauf, dass dort etwas zu retten ist. Ein stilles Ausblenden wäre außerdem der einzige Ort im ganzen System, an dem ein Datenfehler **ohne jede Meldung** verschwindet – das widerspricht 9.1.1 Punkt 7 („kein stiller Fehlschlag").

**`listeProjekte` nimmt das D1-Lock, obwohl sie nur liest (bindend).** Sie ist damit die **Ausnahme** zur Regel „lesen braucht kein Lock" – anders als `listeAusgaben` (s. u.), die nur einen Ordner ausliest. *Begründung:* Der Verzeichnis-Scan läuft über **fremde** Projektordner, und `dupliziereProjekt` erzeugt einen solchen Ordner **schrittweise** (`project.json` schreiben, `media/` kopieren). Ein Scan mitten hinein läse ein Projekt in einem **halbkopierten Zwischenzustand** ein – je nach Reihenfolge mit fehlender oder halb geschriebener `project.json`, also als **fälschlich beschädigt** gemeldetes Projekt, das Minuten später völlig in Ordnung ist. Das Lock macht den Scan gegen laufende Schreibvorgänge dicht; sein Preis ist eine kurze Wartezeit beim Öffnen der Projektliste.

**`löscheProjekt` nennt vorher, was verschwindet (bindend).** Die Bestätigung ist **keine** schlichte Ja/Nein-Abfrage. Sie nennt **drei** Angaben und einen Hinweis: den **Projektnamen**, die **Anzahl der enthaltenen Medien**, die **Anzahl der gerenderten Ausgabedateien** und dass der Vorgang **nicht rückgängig zu machen** ist (Beispiel: „Projekt Sommeraktion löschen? Der Ordner enthält 14 Medien und 3 gerenderte Ausgabedateien. Das lässt sich nicht rückgängig machen."). Die beiden Zahlen kommen aus `ProjektMeta.anzahlMedien` / `anzahlAusgaben` (s. o.) und damit aus **derselben** Quelle wie die Projektliste – die Oberfläche zählt **nicht** selbst nach.

*Begründung:* Der Projektordner enthält **alle importierten Videos und Bilder** (`media/`, D2) **und alle fertigen Ausgabedateien** (`output/`, FA-22). Beides ist Arbeit, die der Nutzer nicht in Minuten wiederherstellt: Die Medien müsste er erneut zusammensuchen und importieren, die Ausgaben erneut rendern. Undo greift hier **nicht** – 9.13.3 schließt Vorgänge mit Dateiwirkung ausdrücklich aus, und der Ordner ist nach dem Löschen weg. Eine Abfrage, die nur nach „wirklich?" fragt, verschweigt damit genau die **Tragweite**, die der Nutzer zum Entscheiden bräuchte; die Zahlen machen den Unterschied zwischen einem leeren Probeprojekt und drei Wochen Arbeit sichtbar, **bevor** er klickt.

*Warum die Zahlen aus dem Ordner gezählt werden und nicht aus `project.json`:* Sie müssen auch für ein **beschädigtes** Projekt stimmen (`beschaedigt: true`, s. o.) – gerade dort ist die Frage „ist da noch etwas zu retten?" die eigentliche Entscheidungsgrundlage, und `project.json` ist genau in diesem Fall nicht lesbar. Für `output/` ist die Ordner-Zählung ohnehin die richtige (`listeAusgaben` zählt ebenso den **Ist-Bestand**, s. u.); Arbeitsdateien (`.part`) zählen dabei **nicht** mit.

**`öffneProjektordner` – der Weg zu dem, was noch da ist.** Die Operation öffnet `projects/<projektId>/` im **Datei-Explorer des Betriebssystems** (Explorer unter Windows, Finder unter macOS) und meldet `Ergebnis<void>`; ein unbekanntes oder fehlendes Projekt ergibt `nicht_gefunden`. Sie ist ein **Instant-Aufruf**, **kein** Auftrag der Queue (sie verändert nichts) und braucht das D1-Lock **nicht**. Angeboten wird sie vor allem bei einem **beschädigten** Projekt (s. o.), das sich nicht öffnen lässt – daneben aber überall in der Projektverwaltung (9.14.3).

*Warum sie zum `project-store` gehört:* Er ist die **Pfad-Autorität** (9.5.7); der Renderer kennt **keine absoluten Pfade** und könnte den Ordner deshalb gar nicht benennen. Ein zweiter Ort, der das Ordner-Layout kennt, ist damit ausgeschlossen. Sie braucht nach 9.1.1 Punkt 4 einen **eigenen IPC-Kanal** (`project:öffneProjektordner`) – ohne Anmeldung im `ipc-gateway` bliebe sie eine Main-Funktion ohne Aufrufer.

*Warum es sie überhaupt gibt:* Der Sinn der Entscheidung aus v3.0 (beschädigtes Projekt **mit Warnhinweis listen** statt weglassen) war, dass der Nutzer **erfährt**, dass in diesem Ordner noch etwas zu retten ist – seine Medien und seine gerenderten Ausgaben liegen unversehrt darin. Ohne einen **Weg dorthin** bleibt es bei der bloßen Information: Den Ablageort der portablen Anwendung kennt der typische Nutzer nicht, und die App zeigt ihm absichtlich nirgends einen absoluten Pfad. Ein Knopf, der den Ordner öffnet, macht aus der Auskunft eine **Handlungsmöglichkeit** – und er ist das gelindeste Mittel dafür: kein Reparatur-Versuch am kaputten JSON, kein Datei-Browser in der App.

**Aktionen (Bibliothek, referenzierbar):**

| Operation | Eingang → Ausgang |
|---|---|
| `erstelleAktion` | `aktionsdaten` → `Ergebnis<Aktion>` |
| `bearbeiteAktion` | `id`, `aktionsdaten` → `Ergebnis<Aktion>` |
| `löscheAktion` | `id` → `Ergebnis<{ stand: Bearbeitungsstand, entfernteElementIds: string[], geaenderteElementIds: string[] }>` – **Kaskade**: entfernte Listenelemente **und** Videos mit gekürztem Band, s. 9.5.3. `stand` ist der **vollständige neue Stand** nach der Kaskade (Aktions-Bibliothek **und** Wiedergabeliste), die beiden Kennungslisten beschreiben, **was sich geändert hat** |

**`löscheAktion` liefert den neuen Stand, nicht nur die Kennungen (bindend).** Der Rückgabewert trägt **beides**: den vollständigen `stand` (Typ `Bearbeitungsstand`, s. u. bei `setzeBearbeitungsstand`) **und** die bisherigen Listen `entfernteElementIds`/`geaenderteElementIds`. Beide werden gebraucht, aber für Verschiedenes: Der **Stand** aktualisiert die Sicht, die **Kennungen** erklären dem Nutzer die Wirkung („aus 2 Elementen entfernt und aus dem Werbeband von 3 Videos gekürzt", 9.5.3) und benennen die Stellen, die die Oberfläche hervorheben kann.

*Begründung:* 9.13.1 führt „Aktionen: anlegen, bearbeiten, **löschen**" unter „Umfasst", ist also **undo-fähig**; 9.13.2 verlangt dafür einen Schnappschuss, und der entsteht beim **Übergang der Sicht von einem Stand auf den nächsten**. Aus bloßen Kennungen lässt sich der neue Stand nicht bilden – der einzige Weg dorthin wäre ein **Neuladen** des Projekts, und das setzt die Sicht an der Schnappschuss-Stelle **vorbei**: Undo wäre gebaut und für genau den Fall wirkungslos, für den es am dringendsten gebraucht wird. Mit dem Stand läuft das Löschen über **denselben** Weg wie jede andere Änderung, der Schnappschuss entsteht von selbst, und Rückgängig braucht **keinen** Sonderfall. **Ausdrücklich verworfen** wurde ein zweiter Eingang in die Rückgängig-Verwaltung allein für diesen Fall: Eine Ausnahme von der Regel „Schnappschüsse entstehen an genau **einer** Stelle" ist genau die Art Sonderfall, die in diesem Projekt bisher die teuersten Fehler verursacht hat. *Warum `Bearbeitungsstand` und nicht `Projekt`:* Es ist derselbe Ausschnitt, den der Schnappschuss ohnehin führt (`aktionen` + `liste`, 9.5.2/9.13.2) – ein zweiter, weiterer Typ an dieser Stelle brächte `assets` und `letzterAusgabeName` mit, die `löscheAktion` gar nicht anfasst und die nach 9.13.2 **nicht** in den Schnappschuss gehören.

**Liste:**

| Operation | Eingang → Ausgang |
|---|---|
| `fügeElementHinzu` | `referenz` (Asset- **oder** Aktions-ID) → `Ergebnis<Listenelement>` |
| `entferneElement` | `elementId` → `Ergebnis<void>` |
| `ordneNeu` | `reihenfolge` (elementIds) → `Ergebnis<void>` |
| `setzeTrim` | `elementId`, `trimStart`, `trimEnde` → `Ergebnis<Listenelement>` (validiert `0 ≤ start < ende ≤ Videodauer`) |
| `setzeDauer` | `elementId`, `dauer` → `Ergebnis<Listenelement>` (validiert Bereich **10–45 s** für Bild/Segment) |
| `setzeEinblendung` | `elementId`, `einblendung` (`Einblendung` **oder** `null`) → `Ergebnis<Listenelement>` – **nur bei `art: "video"`**; setzt Band-Vorlage und Abschnittsfolge in einem Zug (FA-20, 9.2.8). Die Bandhöhe kommt **ausschließlich** aus der Vorlage und ist kein Wert am Listenelement. Wird das Band leer, ist `einblendung = null`; das Videoelement **bleibt** (9.5.3) |
| `setzeElementReferenz` | `elementId`, `referenz` → `Ergebnis<Listenelement>` – setzt die Referenz eines bestehenden Elements um, **ohne** seine Position und seine `id` zu verlieren. Der Zielbestand folgt der `art`: `video`/`bild` → Asset in `Project.assets` mit passendem `typ`, `segment` → Aktion in `Project.aktionen`. Bei `video` werden `trimStart`/`trimEnde` auf `null` zurückgesetzt, weil sie sich auf die alte Quelllänge bezogen. Trägt die Fix-Optionen „neu verknüpfen/importieren" und „durch ein anderes ersetzen" des Reparatur-Modus (FA-19, 9.7.5) |

**Rückgängig/Wiederherstellen (FA-21):**

| Operation | Eingang → Ausgang |
|---|---|
| `setzeBearbeitungsstand` | `stand` (`Bearbeitungsstand`) → `Ergebnis<Projekt>` – ersetzt `aktionen` **und** `liste` des geladenen Projekts **als Ganzes** durch den Schnappschuss, unter dem D1-Lock und **voll validiert**. Der einzige Rückschreib-Weg für Undo/Redo (9.13.2) |

```
Bearbeitungsstand {
  aktionen: Aktion[]          // die vollständige Aktionen-Bibliothek des Projekts
  liste:    Listenelement[]   // die vollständige Wiedergabeliste, Reihenfolge = Array-Reihenfolge (9.11.3)
}
```

**Warum es diese Operation braucht (bindend).** 9.13.2 legt Undo **schnappschuss-basiert** fest – ausdrücklich **nicht** über inverse Operationen. Die übrigen Operationen dieser Liste sind aber **feingranular**, und für zwei Fälle aus 9.13.1 („Umfasst") gibt es damit **überhaupt keinen** Rückweg:

1. **`entferneElement`** – die naheliegende Umkehrung `fügeElementHinzu` vergibt eine **neue** `id` (9.11.4) und hängt das Element **ans Ende**. Position **und** Identität des ursprünglichen Elements sind verloren; alles, was auf die alte `id` zeigt, zeigt ins Leere.
2. **`löscheAktion`** – die Kaskade aus 9.5.3 entfernt Listenelemente **und** kürzt Band-Abschnitte in Videos. **Nichts davon** lässt sich mit den vorhandenen Operationen zurückschreiben: Es gibt keine Operation, die ein entferntes Element an **seiner alten Stelle** mit **seiner alten `id`** wieder einsetzt, und keine, die eine Abschnittsfolge samt Reihenfolge wiederherstellt.

Ohne diese Operation wäre FA-21 – ein **Muss** – für genau die Fälle unerfüllbar, in denen Undo am dringendsten gebraucht wird (versehentliches Löschen). Ein Agent, der die Lücke lokal schließt, baut zwangsläufig die verbotenen inversen Operationen nach.

**Ausdrücklich NICHT enthalten: `assets` und `letzterAusgabeName`.** Der `Bearbeitungsstand` trägt **nur** `aktionen` und `liste`. *Begründung:* Beide anderen Felder werden von **Aufträgen** verändert – `assets` vom Import und vom Löschen (9.4.5/9.4.6), `letzterAusgabeName` vom Render (FA-22) –, und Aufträge sind nach 9.13.3 **grundsätzlich nicht undo-fähig**. Zöge ein Undo sie mit, verschwände ein soeben importiertes Medium aus dem Datenbestand, **während seine Datei weiter auf der Platte liegt**: eine Waise, die der Reconcile beim nächsten Start stillschweigend löscht (9.4.7) – Datenverlust durch einen Knopf, der Datenverlust verhindern soll. Die Regel ergänzt 9.13.3 (ein D1-verändernder Auftrag **leert** die Historie) an ihrer Flanke: Jene verhindert einen **veralteten** Schnappschuss, diese begrenzt seinen **Umfang**.

**Volle Validierung – der Schnappschuss ist keine Vertrauensfrage (bindend).** Die Operation prüft den eingehenden Stand **vollständig**, so als käme er von außen (9.1.1 Punkt 6): **jede** Referenz muss auflösbar sein (`art: "video"`/`"bild"` → ein `Asset` in `Project.assets` mit passendem `typ`; `art: "segment"` → eine `Aktion` in `stand.aktionen`; jede `einblendung.abschnitte[].aktionRef` ebenso; jede `bandVorlageId` eine vorhandene Vorlage), **jede** Dauer muss im zulässigen Bereich liegen (10–45 s bei Bild/Segment, Trim `0 ≤ start < ende ≤ Videodauer`), **jede** `art` muss gültig sein, und die `id`s müssen eindeutig sein. Scheitert eine Prüfung, gilt `ungueltige_eingabe` **ohne jede Wirkung** – ein halb eingespielter Schnappschuss wäre schlimmer als ein nicht ausgeführtes Undo. *Warum trotz „der Stand kam ja aus unserem eigenen Speicher":* Zwischen Schnappschuss und Undo kann ein Auftrag `assets` verändert haben; die Historie wird zwar geleert (9.13.3), aber die Prüfung ist die **strukturelle** Absicherung dieser Zusage statt bloßer Disziplin. Ein Undo darf D1 unter **keinen** Umständen in einen Zustand bringen, den der Render später mit `medium_fehlt` quittiert.

**Eigener IPC-Kanal** nach 9.1.1 Punkt 4: `project:setzeBearbeitungsstand`. Undo/Redo läuft im Renderer (`composer`, `action-editor`), die Operation im Main – ohne Anmeldung im `ipc-gateway` bliebe sie eine Main-Funktion ohne Aufrufer. Dasselbe gilt für `öffneProjektordner` (s. o.); **beide** Operationen dieser Fassung brauchen je einen Kanal.

**Ausgabedateien (FA-22):**

| Operation | Eingang → Ausgang |
|---|---|
| `listeAusgaben` | `projektId` → `Ergebnis<AusgabeDatei[]>` – Inhalt von `projects/<id>/output/`, absteigend nach `geaendertAm` |

```
AusgabeDatei {
  dateiname:    string   // MIT Endung, z. B. "sommeraktion.mp4"
  dateigroesse: number   // Bytes
  geaendertAm:  string   // ISO-8601 UTC – zugleich der Renderzeitpunkt (die Datei entsteht atomar, 9.2.6)
}
```

- **Wozu:** Sie speist die **Ausgabe-Liste** der Oberfläche (FA-22: „Datum und Uhrzeit stehen in der Ausgabe-Liste der Anwendung, **nicht** im Dateinamen") und die **Auswahl im Export** (`ExportRequest.dateiname`, 9.6.1). Ohne diese Operation gäbe es keine Quelle für beides.
- **Warum beim `project-store`:** Er ist die **Pfad-Autorität** (9.5.7) und löst `(projektId, ausgabeName)` ohnehin auf. Ein zweiter Ort, der das Ordner-Layout kennt, ist damit ausgeschlossen. Der Renderer bekommt **Dateinamen, nie absolute Pfade**.
- **`geaendertAm` ist der Renderzeitpunkt, nicht das Protokoll.** Die Datei wird als `<name>.mp4.part` **im Ausgabeordner selbst** geschrieben und bekommt erst nach der Verifikation ihren endgültigen Namen (Rename-mit-Ersetzen im selben Ordner, 9.2.6). Das Umbenennen lässt das Änderungsdatum unberührt, also ist es der Zeitpunkt, zu dem der Render seinen letzten Byte geschrieben hat – Sekunden vor der Fertigmeldung. **Q3 ist NICHT die Quelle dieser Liste** – Q3 ist Historie und Nachweis (auch der Fehlschläge), die Ausgabe-Liste zeigt den **Ist-Bestand** des Ordners.
- **Abweichung von der Abschnittsüberschrift:** Diese Operation liest **nur** den Ausgabeordner; sie fasst `project.json` nicht an und läuft deshalb **ohne** das D1-Schreib-Lock.
- Gelistet werden **ausschließlich fertige `.mp4`-Dateien**; Arbeitsdateien (`.part`, Temporäres) bleiben unsichtbar. **Das ist bindend, nicht kosmetisch:** Während eines laufenden Renders liegt eine wachsende `<name>.mp4.part` **in genau diesem Ordner** (9.2.6). Würde sie mitgelistet, böte die Oberfläche eine halbfertige Datei zum Export an. Fehlt der Ordner (noch nie gerendert), ist das Ergebnis eine **leere Liste**, **kein** Fehler.

#### 9.5.3 Löschsemantik – bewusste Asymmetrie

- **Medium löschen** (`media-service` 9.4.6): **blockiert** bei Referenz (`asset_referenziert`). Die Datei ist die schwere, geteilte Ressource; versehentlicher Verlust wäre teuer.
- **Aktion löschen** (`löscheAktion`): **Kaskade – aber chirurgisch.** Eine Aktion kann an **zwei** Stellen referenziert sein, und die richtige Reaktion ist jeweils eine andere:
  1. **Listenelement mit `art: "segment"`**, dessen `ref` die Aktion ist → das Element **ist** diese Aktion und wird **entfernt**.
  2. **`einblendung.abschnitte[].aktionRef`** in einem **Video**-Element → die Aktion ist nur **ein Abschnitt** eines rotierenden Bandes. Hier werden **ausschließlich die betroffenen Abschnitte** entfernt; das **Videoelement bleibt erhalten**.

  **Warum diese Unterscheidung zwingend ist:** Würde Fall 2 wie Fall 1 behandelt, verlöre der Nutzer sein **Video aus der Wiedergabeliste**, nur weil eine von mehreren rotierenden Werbeaktionen gelöscht wurde. Würde Fall 2 gar nicht behandelt, bliebe eine **verwaiste Referenz** und der Render bräche.

  **Randfall:** Wird ein Band durch das Entfernen leer (keine Abschnitte mehr), entfällt die **Einblendung ganz** (`einblendung = null`) – das **Videoelement bleibt**. Ein Band mit null Abschnitten hätte nichts zu zeigen, und der Render müsste eine Bandspur der Länge 0 bauen.

  **Rückgabe:** `löscheAktion` meldet **beide** Wirkungen – `entfernteElementIds` (entfernte Listenelemente) **und** `geaenderteElementIds` (Videos, deren Band gekürzt oder entfernt wurde) – damit die UI präzise benennen kann, was geschehen ist („aus 2 Elementen entfernt und aus dem Werbeband von 3 Videos gekürzt"). **Zusätzlich trägt die Rückgabe den vollständigen neuen `stand`** (Aktions-Bibliothek und Wiedergabeliste **nach** der Kaskade, 9.5.2): Er ist es, der die Sicht auf das Projekt weiterschaltet und damit den Undo-Schnappschuss auslöst (9.13.2) – die Kennungen allein könnten das nicht, aus ihnen ist der neue Stand nicht rekonstruierbar.

  Die von der Aktion **verwendeten Medien-Assets bleiben unangetastet** und projektweit verfügbar – eine Aktion *referenziert* ein Asset nur, sie besitzt es nicht.

#### 9.5.4 Auto-Speichern (Invarianten, bindend)

- **Entprellt 3–5 s** nach der letzten Änderung (kein Platten-Hämmern beim Slider-Ziehen).
- **Sofort-Flush** unabhängig vom Timer, in vier Fällen: (1) **als erster Schritt im `render`- bzw. `export`-Handler**, bevor dieser die eigentliche Arbeit aufnimmt (9.3.3 – nicht im Torwächter, dessen Auswahl- und Statuswechsel-Abschnitt kein `await` enthalten darf), (2) **bei** Projektwechsel, (3) **beim Beenden**, (4) **am Ende jedes Auftrags, der D1 verändert hat** (Import, Löschen – s. 9.4.5/9.4.6). Beim Beenden **blockiert** die App, bis der Schreibvorgang abgeschlossen ist (kein Schließen mit ausstehendem Schreiben).
  *Wer Fall 1 auslöst und wann – ausdrücklich festgelegt:* Der **Main** löst ihn aus, und zwar beim Übergang `anstehend` → `laeuft` (9.3.3) – also **unmittelbar vor dem Start**, **nicht** beim Einreihen. *Begründung:* Die Warteschlange ist streng seriell; zwischen Einreihen und Start können **Minuten** liegen, und der Nutzer darf in dieser Zeit weiterarbeiten. Ein Flush beim Einreihen schriebe einen Stand fest, der beim Start längst überholt ist, und verlöre bei einem Absturz genau die Arbeit dazwischen. Dass der **Main** auslöst und nicht der Renderer, spart zudem einen IPC-Kanal: Der Renderer müsste sonst vor jedem `reiheEin` erst „jetzt speichern" rufen und auf die Antwort warten. (Der eingereihte Render selbst arbeitet unabhängig davon auf seinem **eingefrorenen** Snapshot, 9.3.5 – der Flush sichert die *Projektdaten*, nicht den Auftrags-Eingang.)
  *Warum Aufträge dazugehören:* Die Entprellung fängt **schnelle, wiederholte Bearbeitungen** ab (Slider-Ziehen). Ein Auftrag ist das Gegenteil davon – er läuft einmal, dauert bei einem großen Video Minuten, und die Mediendatei liegt am Ende bereits auf der Platte. Ein Absturz in den 3–5 s danach ließe eine **Waise** zurück, die der Reconcile beim nächsten Start **stillschweigend löscht** (9.4.7): Der Nutzer hat minutenlang gewartet und findet nichts vor. Ein Schreibvorgang **je Auftrag** (nicht je Tastendruck) verhindert das. Zugleich wird damit die Reihenfolge „D1 zuerst, Datei danach" (9.4.6) auch **über einen Absturz hinweg** wahr und nicht nur im Arbeitsspeicher – und der Auftrag kann einen Schreibfehler überhaupt melden (`speicher_fehler`, 9.4.9), statt Erfolg zu melden und später still zu scheitern.
- **Scheitert der Sofort-Flush beim BEENDEN, schließt die App NICHT (bindend).** Der Fall (3) oben sagt, die App blockiere bis zum Abschluss des Schreibvorgangs – was bei seinem **Fehlschlag** geschieht, ist damit festgelegt, und zwar **in dieser Reihenfolge**:
  1. **Die App schließt nicht.** Das Beenden wird abgebrochen, das Fenster bleibt stehen, die Änderungen bleiben **im Speicher** (kein Rollback – wie bei jedem anderen Speicherfehler, s. u.).
  2. **Der Fehler wird gezeigt – mit einer auf die Ursache zugeschnittenen Handlungsempfehlung**, nicht als roher Fehlertext. Bei zu wenig Platz: „Die Platte ist voll. Schaffen Sie Platz und versuchen Sie es erneut." Bei nicht erreichbarem Datenort: „Der Speicherort ist nicht erreichbar. Stecken Sie den Datenträger wieder ein." Für andere Ursachen bleibt der generische Text – die **Empfehlung** ist der Punkt, nicht die Vollständigkeit der Liste.
  3. **Ein Knopf „Erneut versuchen"** stößt denselben Schreibversuch noch einmal an. Gelingt er, schließt die App wie geplant.
  4. **Daneben ein ausdrücklich benannter Ausweg: „Trotzdem schließen und Änderungen verwerfen."** Er ist als Verlust **benannt**, nicht als „Abbrechen" getarnt.

  *Begründung:* Ein **stilles** Schließen widerspräche der zugesagten Verlustfreiheit (FA-15, NFA-02) – der Nutzer hätte die App normal beendet und fände beim nächsten Start einen alten Stand vor, ohne je erfahren zu haben, dass etwas fehlt. Ein **bloßes Blockieren ohne Ausweg** wäre das andere Extrem: ein Programm, das sich nicht mehr schließen lässt, weil eine Datei nicht schreibbar ist. Der eigentliche Wert liegt im **Wiederholen**: Die beiden häufigsten Ursachen – volle Platte, abgezogener USB-Datenträger mit dem Datenort – kann der Nutzer in **einer Minute** beheben, und dann muss er **nichts** verlieren. Genau dafür ist Punkt 4 auch nur der letzte Ausweg und nie die vorausgewählte Antwort.
- **Atomar:** Schreiben nach Temp-Datei + Rename (gleiche Partition). `project.json` ist **nie** halb geschrieben.
- **Ein Backup:** `project.json.bak` = letzte heile Version. Ist `project.json` beim Laden defekt → aus `.bak` wiederherstellen; ist auch das defekt → **Fehler melden**, **nicht** leer/verlustbehaftet weiterstarten.
- **Genau eine App-Instanz (Voraussetzung für das ganze Lock-Design):** Das D1-Schreib-Lock ist ein **prozessinternes** Lock. Zwei gleichzeitig laufende App-Instanzen hätten **zwei unabhängige** Locks auf derselben `project.json` – das Ergebnis wäre ein Lost Update und damit **Datenkorruption**. Deshalb erzwingt die App beim Start eine **Einzel-Instanz-Sperre**; ein zweiter Start **fokussiert das bestehende Fenster** statt eine zweite Instanz zu öffnen.
  **Wichtig für die portable Auslieferung:** Die Sperre muss an den **Datenort** gebunden sein (den App-Ordner mit `projects/`), nicht an den Programmpfad. Sonst könnten zwei Kopien der portablen EXE, die auf **dieselben** Daten zeigen, beide starten – genau der Fall, den die Sperre verhindern soll.
- **Lock-Grenze:** Das D1-Lock schützt **nur** `project.json`. Die Auftragsverwaltungs-Speicher Q2/Q3 (eigene Dateien, 9.3) haben ihre **eigene** Serialisierung – der `auftrags-manager` hängt **nicht** am `project-store`-Lock.
- **Instant-Op vs. Speichern getrennt:** Eine Instant-Operation (9.5.2) validiert und wendet **im Speicher** an, *bevor* sie „ok" meldet – ihr Erfolg bedeutet „gültig übernommen", **nicht** „schon auf Platte". Die Platten-Schreibung ist die entprellte Auto-Speicherung.
- **Speicherfehler sind sichtbar (NFA-02):** Scheitert eine Auto-Speicherung (Platte voll, Rechte), wird das **nicht still verschluckt** – die UI zeigt dauerhaft „nicht gespeichert" + automatischer Wiederholversuch; die Änderungen **bleiben im Speicher** (kein Rollback, kein Arbeitsverlust). Erst nach erfolgreichem Schreiben verschwindet der Hinweis. Der Weg dorthin ist ein **Ereignis vom Main** auf dem Kanal **`project:autoSpeichernStatus`** (das Auto-Speichern läuft ohne Aufruf aus dem Renderer, es gibt also keine Antwort, an die sich die Meldung hängen könnte); Empfänger ist **das eine Fenster** der App (9.1.1 Punkt 10). Der `vorlagen-store` hat für seinen eigenen Speicher ein **gleichartiges** Ereignis auf einem **eigenen** Kanal (9.12.1).

#### 9.5.5 `schemaVersion` & Migration

Jede `project.json` und `config.json` trägt eine `schemaVersion`. Beim Laden: **höhere** (unbekannte) Version → Fehler (nicht raten); **ältere** Version → definierte Migration auf die aktuelle. So bleiben ältere Projekte nach App-Updates lesbar.

#### 9.5.6 `config-store` [D3]

Besitzt `config.json` (app-weit): aktives Projekt, letztes Export-Ziel, UI-Voreinstellungen.

> **Die Marke liegt seit v3.4 NICHT mehr hier.** Sie ist mit FA-23 zu einem app-weiten **Bestand** geworden und gehört dem `marken-store` (9.15.1); `leseMarke` ist dorthin gewandert und trägt jetzt eine `markeId`. `AppKonfig` führt das Feld ausdrücklich **nicht** – lägen `leseKonfig().marke` und `leseMarke(...)` nebeneinander, könnten sie auseinanderlaufen, ohne dass etwas bricht.

| Operation | Eingang → Ausgang |
|---|---|
| `leseKonfig` | – → `Ergebnis<AppKonfig>` |
| `setzeAktivesProjekt` | `projektId` → `Ergebnis<void>` |
| `setzeExportZiel` | `pfad` → `Ergebnis<void>` |
| `setzeUIVoreinstellung` | `schlüssel`, `wert` → `Ergebnis<void>` |

- **Sitzungswiederherstellung (FA-15):** beim Start das zuletzt aktive Projekt laden; **fehlt** es (extern gelöscht) → sanfter Rückfall auf „kein aktives Projekt / Projektliste", **kein** Absturz. Im Renderer wird dieser Zustand über `leereProjektSicht()` hergestellt (9.7.4) – derselbe Weg wie nach dem Löschen des aktiven Projekts.
- Gleiche Schreib-Invarianten wie 9.5.4 (atomar, `schemaVersion`).

#### 9.5.7 Pfad-Autorität & `media://`-Protokoll

- **`project-store` ist die eine Pfad-Autorität.** Er löst `(projektId, dateiname) → absoluter Pfad` auf – die **einzige** Quelle der Wahrheit für das Datei-Layout eines Projekts (`projects/<id>/media/<datei>`). Jeder Main-Dienst, der eine Mediendatei anfassen muss, **resolved den Pfad über den `project-store`**, statt das Layout selbst zu kennen: `media-service` (kopieren/löschen), `render-service` (lesen beim Normalisieren), `export-service` (Quelle: die gewählte Datei aus `projects/<id>/output/`). Er löst ebenso `(projektId, ausgabeName) → projects/<id>/output/<name>.mp4` auf und **listet diesen Ordner** (`listeAusgaben`, 9.5.2). So kann eine Layout-Änderung nirgends auseinanderlaufen.
- **`media://`-Protokoll (Renderer-Lesezugriff).** Für die Vorschau (P5) und Thumbnails (`composer`, `action-editor`) muss der **Renderer** Medien anzeigen. Dafür registriert der Main ein eigenes Protokoll **`media://<projektId>/<dateiname>`**, dessen Handler die Auflösung des `project-store` nutzt und die Datei **nur lesend** ausliefert. Der Renderer verwendet diese URLs direkt in `<video>`/`<img>`.
- **Sicherheits-Invarianten:** Der Renderer sieht **nur relative** Referenzen (`dateiname`), **nie** absolute Pfade. Der Resolver stellt sicher, dass das Ziel **innerhalb** des `media/`-Ordners des Projekts bleibt (kein `..`-Ausbruch, keine Symlink-Flucht); Zugriff strikt **read-only**. Die Regel „**nur der Main berührt das Dateisystem**" bleibt gewahrt: der Main löst auf und liefert die Bytes; der Renderer erhält eine URL, keinen direkten Dateizugriff.

---

### 9.6 Schnittstelle `export-service`

**Richtung:** Renderer → Main (über die Auftrags-Queue bzw. für den Zieldialog direkt).
**Fachlich:** „Kopiere **eine gewählte** Ausgabedatei des Projekts **vollständig und unbeschädigt** auf den USB-Stick (oder Zielordner) – unter **ihrem eigenen Namen** –, ohne eine dort bereits vorhandene, gültige Datei gleichen Namens zu gefährden." Eigener Auftrag (`art: export`), läuft **seriell nach** dem Render; getrennt von `render-service` (9.2).

#### 9.6.1 Operationen

**`wähleExportZiel` (Instant, kein Auftrag):**

```
wähleExportZiel() → Ergebnis<{ pfad }>   // Instant; Ordner-/Laufwerks-Dialog, vorbelegt mit letztem Ziel (config-store)
```

**`export` (Auftrag `art: export`):** Eingang `ExportRequest`:

| Feld | Inhalt |
|---|---|
| `projektId` | Projekt-Kontext; zusammen mit `dateiname` die Quelle |
| `dateiname` | **welche** Ausgabedatei kopiert wird (FA-22) – aufgelöst zu `projects/<id>/output/<dateiname>` |
| `zielPfad` | gewählter Zielordner (z. B. USB-Wurzel) |

**Auftrags**-Ergebnis bei Erfolg: `{ zielPfad, dateigroesse }` – über den **Auftrags-Zustand**, **nicht** als Aufrufantwort (9.1.1); der Aufruf ist `reiheEin('export', …)` → `Ergebnis<{ auftragId }>`. `zielPfad` ist hier der **vollständige Pfad der geschriebenen Zieldatei** (Zielordner + `dateiname`), nicht der Ordner allein – aus ihm wird `ProtokollEintrag.ausgabe.pfad` (9.3). Fehlercodes: 9.6.4.

**Woher `dateiname` kommt:** Die Auswahl speist sich aus `listeAusgaben` (9.5.2); der Renderer liest den Ausgabeordner **nie** selbst und kennt **keine** absoluten Pfade.

#### 9.6.2 Ablauf (atomar, vorab geprüft)

1. **Quelle prüfen:** existiert `projects/<id>/output/<dateiname>`? Sonst `keine_ausgabe` (erst rendern bzw. andere Datei wählen).
2. **Ziel vorab prüfen** *(vor dem Kopieren, damit kein 20-Minuten-Kopiervorgang am Ende scheitert)*: Ziel erreichbar? Ziel-**Dateisystem erkennen** – ist es **FAT32** und die Datei **> 4 GB** → `datei_zu_gross_fat32` (klare Meldung, exFAT empfehlen). Freier Platz < Dateigröße → `kein_platz`.
3. **Kopieren** nach `zielPfad/<dateiname>.part` *(langsam)*.
4. **Verifizieren:** Größe von `.part` == Quellgröße; danach **`fsync`** (Schreibpuffer physisch auf den Stick zwingen).
5. **Atomar ersetzen:** `.part` → `<dateiname>` per Rename-mit-Ersetzen. Auf Windows bei `EBUSY`/`EPERM` **Retry+Backoff**.
6. **Erfolg** melden: `{ zielPfad, dateigroesse }`.

#### 9.6.3 Invarianten (bindend)

- **Die vorhandene Zieldatei ist geschützt:** Eine Datei gleichen Namens auf dem Ziel wird **nie** gelöscht oder überschrieben, bevor die neue **vollständig kopiert und größen-verifiziert** ist. Deshalb `.part` + Rename-mit-Ersetzen zum Schluss. Ein Abbruch (Stick abgezogen, Absturz) hinterlässt höchstens eine `.part`-Leiche, nie eine **halbe** MP4, die der TV abspielen würde.
- **FAT32-Wächter vorab:** Ziel-Dateisystem **und** Dateigröße werden **vor** dem Kopieren geprüft (nicht erst der Schreibfehler mitten im Vorgang).
- **`fsync` vor Erfolg:** Erst wenn die Bytes physisch auf dem Stick sind, gilt der Export als fertig – ein sofort abgezogener Stick verliert so keine gepufferten Daten.
- **Zieldateiname = Quelldateiname.** Der frühere Zwang auf exakt `loop.mp4` ist **entfallen** (FA-22): Auf dem Speicher dürfen mehrere Ausgabedateien unter eigenen Namen liegen; das Personal wählt am Gerät aus. **Folge für den Betrieb:** Am Fernseher muss „Repeat One" statt „Repeat All" eingestellt sein, sonst durchläuft der Player den Ordner und zeigt bei jedem Wechsel die Bedienleiste (Risiko R-04, Anforderungsdokument 7).
- **Der Name ist Nutzereingabe** und wird wie in 9.2.6 validiert: keine Pfadtrenner, kein `..`, keine für das Zieldateisystem unzulässigen Zeichen. Der Export darf **nie** außerhalb von `zielPfad` schreiben.
- **Rename-mit-Ersetzen plattformsicher:** Das atomare Ersetzen verhält sich auf Windows anders als auf POSIX; die Umsetzung muss ein **Ersetzen** garantieren, ohne die alte Datei vor Fertigstellung der neuen zu entfernen.
- **Nur der Main** berührt das Dateisystem. **Kein zweites Lock** – die Serialisierung liefert die Queue (`export` ist ein Auftrag).

#### 9.6.4 Fehlercodes

| Fehlercode | Ursache |
|---|---|
| `keine_ausgabe` | die gewählte Datei fehlt in `projects/<id>/output/` – noch nicht gerendert oder gelöscht |
| `ziel_nicht_verfügbar` | Zielpfad/Laufwerk nicht erreichbar (Stick abgezogen) |
| `datei_zu_gross_fat32` | Ziel ist FAT32 und die Datei überschreitet 4 GB → exFAT nötig |
| `kein_platz` | zu wenig freier Speicher am Ziel |
| `ziel_gesperrt` | Zieldatei durch anderen Prozess gesperrt (nach Retry) |
| `schreib_fehler` | sonstiger I/O-Fehler beim Kopieren |
| `speicher_fehler` | der **Sofort-Flush von D1** scheitert – er läuft als **erster Schritt im `export`-Handler**, bevor irgendetwas kopiert wird (9.3.3, 9.5.4): Platte voll, fehlende Rechte, `project.json` gesperrt. Das Ziel bleibt **unberührt**, es wurde nichts geschrieben. Der Nutzer schafft Platz bzw. prüft die Rechte am **Datenort** (nicht am Ziel) und reiht den Auftrag erneut ein |

**Warum derselbe Name wie im Render-Pfad – und nicht `schreib_fehler`:** Vor der Ergänzung hatte der als **vollständig** geführte Satz für diese Ursache **keinen** passenden Code: `schreib_fehler` meint hier ausdrücklich das **Kopieren**, die übrigen fünf betreffen sämtlich das **Ziel** – der gescheiterte Flush trifft aber den **Datenort** und lässt das Ziel unangetastet. Der Render-Pfad meldet dieselbe Ursache bereits als `speicher_fehler` (9.2.3), der `media-service` ebenso (9.4.9). **Dieselbe Ursache bekommt denselben Namen.** Alles andere zwänge die Oberfläche, **zwei** Namen für **eine** Sache zu kennen (zwei Meldungstexte, zwei Zweige im Reparatur-/Wiederhol-Pfad) – und der Code steht **dauerhaft** im Protokoll Q3 (9.3): eine hier erfundene Bezeichnung bliebe für immer darin stehen und wäre später nicht mehr zusammenführbar.

#### 9.6.5 Verzahnung (config-store & Queue)

- Das gewählte Ziel merkt sich der `config-store` (`setzeExportZiel`, 9.5.6) und belegt den Dialog beim nächsten Mal vor.
- `export` ist ein Auftrag der Auftragsverwaltung (9.3): seriell **nach** dem Render; ein Fehlschlag (Stick voll/abgezogen) landet in **Q2** und ist per „erneut einreihen" wiederholbar, sobald der Nutzer das Ziel behoben hat – genau der Wiederhol-Fall aus FA-17.

---

### 9.7 Modul `composer` [P3] (Renderer)

**Fachlich:** Die zentrale UI zum **Zusammenstellen der Wiedergabeliste** – Elemente aus der Bibliothek in die geordnete Liste bringen, per Drag-and-drop ordnen (dnd-kit), pro Element Dauer/Trim setzen (Regler aus Anforderungsdokument 4.4), Gesamtlänge + 30-Minuten-Warnung anzeigen und Render/Export anstoßen.

#### 9.7.1 Rolle & Grenze

- **Ist:** Renderer-UI für Liste/Reihenfolge/Dauer/Trim und das Auslösen von Render/Export.
- **Ist NICHT:** rendert **keine** Pixel (Aktions-Segmente aus `template-canvas`, Vorschau aus `preview-player`); bearbeitet **keine** Aktions-Inhalte (`action-editor` [P2]) – er *platziert* Aktionen nur; berührt **kein** Dateisystem/ffmpeg (alles über `ipc-client` an den Main).

#### 9.7.2 Eingang → Ausgang

- **Eingang:** Projektzustand (Liste, Asset-Bibliothek, Aktions-Bibliothek) via `ipc-client` vom `project-store`.
- **Ausgang – Instant-Mutationen** (`project-store` 9.5.2): `fügeElementHinzu` (Asset- **oder** Aktions-Referenz; mehrere Listenelemente dürfen dieselbe Aktion referenzieren), `entferneElement`, `ordneNeu`, `setzeTrim`, `setzeDauer`, sowie – **nur bei Video-Elementen** – `setzeEinblendung` (Band-Vorlage wählen, Abschnitte hinzufügen/ordnen/entfernen, Abschnitts-Dauern setzen; FA-20, 9.2.8).
- **Parallele Einblendung in der UI (FA-20):** Am Video-Element lässt sich ein Werbeband anhängen: **Band-Vorlage** wählen (`art: "band"`, 9.11.1) und eine **Folge von Aktionen mit Dauern** zusammenstellen. Der composer zeigt dabei an, ob die Folge **kürzer** als das Video ist (dann wiederholt sie sich) oder **länger** (dann wird am Videoende abgeschnitten) – damit der Nutzer die Wirkung versteht, ohne rendern zu müssen. Die Elementdauer bleibt **allein** durch das Video bestimmt; das Band verändert sie nie.
- **Ausgang – Aufträge** (Queue 9.3): `render`, `export`.

#### 9.7.3 Optimistische Bedienung & Fehlerbehandlung

- **Optimistisch mit Abgleich:** Reorder/Trim/Dauer werden **lokal sofort** angezeigt, dann per Instant-Op bestätigt; der zurückgegebene Stand wird abgeglichen (nie dauerhaft driften).
- **Fehlerklasse 1 – Operation abgelehnt (synchron):** z. B. ungültiger Wert. → optimistischen Schritt **rückgängig** machen (letzter bestätigter Stand) + kurze Inline-Meldung.
- **Fehlerklasse 2 – Auto-Speichern fehlgeschlagen (asynchron, 9.5.4):** Änderung ist im Speicher gültig. → **kein Rollback**; dauerhafter „nicht gespeichert"-Hinweis + automatischer Wiederholversuch (NFA-02).

#### 9.7.4 Invarianten (bindend)

- **Gesamtlänge = frame-gerundete Summe** der Elementdauern – **dieselbe** Rundungsregel wie `render-service` (9.2.6), sonst weicht die angezeigte Länge von der echten Ausgabedatei ab. Die 30-Minuten-Warnung (5.3) hängt daran.
- **`project-store` ist die Wahrheit:** die Liste im composer ist nur eine Sicht; nach jeder Mutation mit dem Rückgabestand abgleichen. Diese Sicht ist die **gemeinsame Sicht auf das offene Projekt**; sie kennt neben einem geladenen Projekt ausdrücklich den Zustand **„kein Projekt geladen"** (s. u.).
- **Die gemeinsame Sicht lässt sich leeren – `leereProjektSicht()` (bindend).** Neben dem Weiterschalten auf einen neuen Stand gibt es **genau eine** Operation, die die Sicht in den Zustand **„kein Projekt geladen"** zurückversetzt. Sie nimmt keinen Eingang und liefert nichts; danach ist kein Projekt geladen, und die Oberfläche zeigt den Zustand, den 9.5.6 als **sanften Rückfall auf „kein aktives Projekt / Projektliste"** beschreibt (9.14.3: der Reiter **Projekte** bleibt ohne offenes Projekt voll benutzbar). Gerufen wird sie, wo ein Projekt **aufhört, offen zu sein**, ohne dass ein anderes an seine Stelle tritt – vor allem nach `löscheProjekt` (9.5.2) auf das **aktive** Projekt.

  *Begründung:* Der Zustand „kein Projekt geladen" ist im Datentyp der Sicht **bereits vorgesehen**; es fehlte allein der **Weg dorthin**. Ohne ihn zeigt die Oberfläche nach dem Löschen des aktiven Projekts weiter dessen Liste, Aktionen und Vorschau – **Geisterdaten**, auf die jeder Klick ins Leere läuft, während der Ordner auf der Platte schon weg ist. **Ausdrücklich verboten ist die naheliegende Notlösung**, statt dessen ein **leeres Projekt mit erfundener Kennung** in die Sicht zu setzen: Das sähe richtig aus, aber jede folgende Instant-Operation liefe in `nicht_gefunden` (9.1.1), und das Auto-Speichern (9.5.4) legte womöglich einen Projektordner an, den **niemand angelegt hat**.
- **Angezeigte Reihenfolge = gerenderte Reihenfolge** – keine versteckte Sortierung.
- **Thumbnails renderer-seitig, ohne ffmpeg:** Video-Vorschaubild per nativem `<video>` (auf `trimStart` spulen → Frame ins Canvas), Aktions-Segment per `template-canvas` (pixelgleich zur Vorschau), Bild direkt als `<img>`. Der Main bekommt **keine** Thumbnail-Pflicht (konsistent mit Variante A).
- **Kaputte Stellen blockieren den Render und starten die geführte Reparatur (9.7.5):** zeigt ein Listenelement **oder ein Band-Abschnitt** auf ein `fehlt`-Asset (media-service 9.4.7), wird die Stelle **rot markiert**; ein Render wird nicht gestartet (er würde mit `medium_fehlt` scheitern bzw. einen Platzhalter einbetten), sondern der Nutzer in den Reparatur-Modus geführt.
- **Render friert die Liste beim Einreihen ein (9.3.5):** die Liste bleibt danach editierbar, aber der bereits eingereihte Render nutzt den Snapshot – der composer stellt das nicht in Frage.

#### 9.7.5 Reparatur-Modus für kaputte Elemente

**Kaputt** ist eine Stelle, deren Referenz ins Leere zeigt – v. a. ein Asset, das der Reconcile beim Projekt-Öffnen als `fehlt` markiert hat (media-service 9.4.7). Es gibt **drei** solche Stellen, und alle drei zählen:

| # | Kaputte Stelle | Repariert wird auf Ebene |
|---|---|---|
| 1 | Listenelement → **Asset fehlt** (Video/Bild) | Listenelement |
| 2 | Listenelement (`segment`) → **Aktion**, deren Bild fehlt | **Aktion** (behebt alle Verwendungen) |
| 3 | **Band-Abschnitt** eines Videos → **Aktion**, deren Bild fehlt | **Aktion** (behebt alle Verwendungen) |

**Fall 3 ist der leicht zu übersehende:** Das Video selbst ist einwandfrei, nur ein Abschnitt seines Bandes zeigt auf eine Aktion mit fehlendem Bild. Würde er nicht gezählt, gälte das Element als heil – `template-canvas` zeichnete aber einen **Platzhalter**, und der darf **nie** in den finalen Render (9.10.7). Der Nutzer stünde vor einem blockierten Render **ohne** gezeigten Weg.

Bloßes Blockieren genügt nicht; der composer **führt den Nutzer aktiv durch die Reparatur**, damit garantiert **alle** kaputten Stellen behoben werden:

- **Zurückleiten:** Beim Render-Versuch mit kaputten Elementen (oder auf Hinweis direkt nach dem Öffnen) wird der Nutzer in den **Bearbeitungsmodus** zurückgeleitet – kein stiller Abbruch.
- **Eins nach dem anderen:** Das erste kaputte Element wird hervorgehoben; ein Fortschritt zeigt „**X von N behoben**". Ist es behoben, springt die UI **automatisch zum nächsten** kaputten Element – bis keins mehr übrig ist.
- **Fix-Optionen je Element:** Medium **neu verknüpfen/importieren** (media-service), durch ein **anderes ersetzen** (Referenz umsetzen), oder das **Element entfernen** (`entferneElement`, project-store). Es werden ausschließlich bestehende Operationen genutzt.
- **Aktions-Segmente werden auf Aktions-Ebene repariert:** Ist ein Aktions-Segment kaputt, weil das **Bild der Aktion** fehlt, liegt der Defekt an der **Aktion**, nicht am einzelnen Listenelement. Die Reparatur leitet dann in den `action-editor` [P2] über (Bild neu verknüpfen/ersetzen/entfernen). Da Aktionen **referenzierbar** sind, behebt **ein** Fix an der Aktion **alle** Stellen, die sie verwenden – Listenelemente **und Band-Abschnitte**. Der Fortschritt „X von N" kann dadurch um mehr als eins sinken.
- **Kaputter Band-Abschnitt (Fall 3):** Er wird als **eigene** Reparatur-Position geführt und angesteuert. Fix-Optionen: **Bild der Aktion reparieren** (`action-editor`, behebt alle Verwendungen), **Abschnitt durch eine andere Aktion ersetzen**, oder **Abschnitt entfernen**. Beim Entfernen gilt die Regel aus 9.5.3: **wird das Band dadurch leer, entfällt die Einblendung – das Videoelement bleibt.**
- **Freigabe:** Erst wenn **kein** kaputtes Element mehr existiert, ist der Render wieder frei. So kann ein Lauf nicht an einem übersehenen kaputten Element scheitern.

---

### 9.8 Modul `action-editor` [P2] (Renderer)

**Fachlich:** Die UI zum **Anlegen und Bearbeiten von Aktionen** (FA-02/04) und zur Pflege der Aktions-Bibliothek: Vorlage wählen, freie Zonen füllen (Überschrift, Bild, Preis/CTA, Akzentfarbe, FA-12), mit **Live-Vorschau** über `template-canvas`.

#### 9.8.1 Rolle & Grenze

- **Ist:** Aktionen anlegen/bearbeiten/löschen, Vorlage zuweisen, freie Zonen gestalten, Live-Vorschau der Aktion.
- **Ist NICHT:** platziert Aktionen **nicht** in die Liste (`composer` [P3]); macht **keinen** finalen Render; **kein** Dateisystem/ffmpeg (alles über `ipc-client` an den Main).

#### 9.8.2 Der `Aktion`-Datensatz

```
Aktion {
  id:           string
  titel:        string          // Pflicht
  beschreibung: string | null
  preis:        string | null
  bildRef:      string | null   // Referenz auf eine Asset-ID (NICHT eingebettet)
  cta:          string | null   // Call-to-Action, z. B. "Gratis Probetraining"
  standardDauer:number | null   // Default-Anzeigedauer; nur Vorgabe (s. 9.8.4)
  vorlagenId:   string          // gewählte Vorlage (eingebaut oder eigene, FA-13)
  markeId:      string          // GENAU EINE Marke (FA-23, 9.15.1). Pflicht; vorbelegt mit
                                //   Project.standardMarkeId. Bestimmt Logo, Schriften und Farb-Rollen
  akzentfarbe:  string | null   // FREIER Hex-Wert (FA-24; bis v3.3 nur Auswahl aus der Palette).
                                //   ERSETZT beim Zeichnen die Akzent-Rollen der Vorlage (9.10.9).
                                //   null = Markenwert gilt
}
```

#### 9.8.3 Operationen

- Über `project-store` (9.5.2, instant): `erstelleAktion`, `bearbeiteAktion`, `löscheAktion` (Kaskade, 9.5.3).
- **Bildzuweisung:** aus der Medien-Bibliothek **wählen** (Asset-ID) **oder** neu **importieren** (media-service → dann Asset-ID). Das Bild ist stets eine **Referenz**.
- **Live-Vorschau:** `template-canvas` rendert (Aktion + Vorlage + Marke) → dieselben Pixel, die später als Segment-PNG in den finalen Render gehen.

#### 9.8.4 Invarianten (bindend)

- **`template-canvas` ist die einzige Pixelquelle:** die Live-Vorschau ist **pixelgleich** zur Vorschau (P5) und zum finalen Segment-PNG (Variante A). Es gibt **keinen** zweiten Gestaltungs-/Renderpfad.
- **Titel ist Pflicht:** eine Aktion ohne Titel ist nicht speicherbar.
- **Bild = Referenz, nie Kopie:** die Aktion hält nur eine Asset-ID; das Asset bleibt projektweit und wird beim Löschen der Aktion **nicht** angetastet (9.5.3).
- **Akzentfarbe ist ein freier Farbwert** (FA-24). Bis v3.3 stand hier das Gegenteil: „nur aus der Markenpalette (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus". Diese Zusage ist mit FA-24 **bewusst zurückgenommen**, weil Partner-Hausfarben in keiner Palette stehen. Eine Aktion **kann** damit aus dem Corporate Design ausbrechen; die Gegenmaßnahme ist die **Kontrast-Warnung** (9.15.2), nicht die Sperre – ein Schwellenwert würde eine echte Hausfarbe unbrauchbar machen (Risiko R-08).
- **Die Akzentfarbe ERSETZT die Akzent-Rollen der Vorlage – sie ist kein Zierwert.** Beim Zeichnen liefert jede Zone, die eine der drei Akzent-Rollen `akzent`, `akzentKraeftig` oder `akzentTief` auflöst, den Wert aus `aktion.akzentfarbe` statt des Markenwerts; alle übrigen Rollen bleiben unberührt (vollständige Regel: 9.10.9). **Die Vorlage bestimmt, WO Akzentfarbe hingehört; die Aktion bestimmt, WELCHE.** Für den Editor heißt das zweierlei: Die Farbwahl ist **sofort in der Live-Vorschau sichtbar** (sie geht durch dieselbe Zeichenroutine, 9.8.3), und sie wirkt **nur dort, wo die Vorlage Akzentfarbe vorgesehen hat** – der Editor verspricht also **nicht**, dass jede Vorlage sichtbar auf die Farbwahl reagiert. Wählt eine Aktion **keine** Akzentfarbe, gilt der Markenwert; das ist gültig und kein Fehler.
- **Fester Markenrahmen immer erzwungen** (Logo, Sicherheitsabstände, FA-11); der Editor gestaltet nur die **freien Zonen** (FA-12).
- **`standardDauer` ist nur ein Default:** maßgeblich für den Render ist die **Listenelement-Dauer** (composer, Anforderungsdokument 4.4). Beim Platzieren wird `standardDauer` als Startwert übernommen, danach überschreibbar.

#### 9.8.5 Kaputt-Handling: fehlendes Aktions-Bild (FA-19)

- Zeigt `bildRef` auf ein `fehlt`-Asset (media-service 9.4.7), wird die **Aktion** als kaputt markiert; die Live-Vorschau zeigt einen **Platzhalter** statt des Bildes.
- **Fix-Optionen:** Bild **neu verknüpfen/importieren** (media-service), durch ein **anderes ersetzen**, oder **entfernen** (eine Aktion ohne Bild ist gültig – Bild ist optional, Titel Pflicht).
- Da Aktionen **referenzierbar** sind, behebt **ein** Fix an der Aktion **alle** Listenelemente, die sie verwenden. Der Reparatur-Modus des composer (9.7.5) leitet für Aktions-Segmente genau hierher über.

---

### 9.9 Modul `preview-player` [P5] (Renderer)

**Fachlich:** **UI-Simulation** der zusammengestellten Sequenz **ohne `ffmpeg`** – die schnelle Kontrolle vor dem finalen Render (Konzept: Abschnitt 8). Läuft vollständig im Renderer.

#### 9.9.1 Rolle & Grenze

- **Ist:** eine 16:9-Bühne (1920×1080 herunterskaliert), die die Liste der Reihe nach abspielt; Transport: Play/Pause, Zeitleiste, Markierung des aktuellen Elements, Gesamtdauer.
- **Ist NICHT:** **kein** `ffmpeg`, **kein** finaler Render; **kein** Auftrag der Queue (interaktiv, unabhängig – blockiert nichts, wird von nichts blockiert, 9.3.2).

#### 9.9.2 Darstellung je Elementtyp

- **Aktions-Segment:** exakt dasselbe `template-canvas`-Bild wie der finale Render → **pixelgleich** (Variante A).
- **Bild:** `<img>` mit `object-fit: contain` auf Schwarz – **dieselbe** Letterbox/Pillarbox wie das `pad` im Render.
- **Video:** natives `<video>` von `trimStart` bis `trimEnde`.
- **Medienzugriff ausschließlich über `media://`** (9.5.7) – der `preview-player` sieht **nie** absolute Pfade, sondern lädt `media://<projektId>/<dateiname>` in `<video>`/`<img>`.
- **Parallele Anzeige (FA-20, 9.2.8) – beide Modi:** Trägt ein Video eine Einblendung, bestimmt die **`art` der Band-Vorlage**, was die Bühne simuliert – **genau wie im Render**. Die Bandhöhe `H` kommt aus der Vorlage; die Geometrie wird **daraus abgeleitet**, nie hartkodiert:
  - **`split`:** Das `<video>` wird in den oberen Bereich **1920 × (1080 − H)** gelegt (`contain`), die Restflächen links/rechts in der Farb-Rolle **`flaecheDunkel`** gefüllt – **derselben**, die der Render benutzt (9.2.8, 9.11.2), und aus **derselben Quelle**: der **Projekt-Standardmarke** (`Project.standardMarkeId`, 9.15.4), **nicht** aus der Marke der gerade sichtbaren Aktion; das Band-Canvas (**1920 × H**) sitzt **darunter**.
  - **`einblendung`:** Das `<video>` bleibt **vollflächig** 1920 × 1080 (schwarze Balken nach 9.2.4); das Band-Canvas (**1920 × H**, mit **Alpha**) liegt **darüber** am unteren Rand. Die Überlagerung im DOM respektiert den Alphakanal von sich aus.
- **Zeitverhalten identisch zum Render:** Das Band **wechselt zeitgesteuert** nach den Abschnitts-Dauern (frame-gerundet), **wiederholt** sich, wenn die Folge kürzer als das (getrimmte) Video ist, und wird am Videoende **abgeschnitten** – **dieselben** Regeln wie 9.2.8.
- **Invariante:** Die Vorschau **rechnet die Geometrie nach derselben Formel** wie `render-service` (9.2.8). **Genauer: nicht „nach derselben Formel", sondern mit derselben Funktion.** Die reine Rechnung liegt im **geteilten Bereich** – `berechneBandGeometrie(höhe) → BandGeometrie` (9.2.8) –, und der `preview-player` **ruft sie auf**, statt sie nachzubilden. Eine eigene, abweichende Herleitung im Renderer würde genau die Übereinstimmung zerstören, für die der `preview-player` existiert; besonders tückisch ist dabei die **Vierer-Abrundung** der Videobreite, die bei der eingebauten Band-Vorlage (H = 162 → 1632) **zufällig aufgeht** und erst bei eigenen Vorlagen auffiele. Die **Prüfung** der Bandhöhe bleibt beim `render-service` – der `preview-player` prüft nichts und meldet keine Fehlercodes.

#### 9.9.3 Invarianten (bindend)

- **Zeitleiste ist frame-gerundet** – die maßgebliche Uhr nutzt **dieselben** frame-gerundeten Dauern wie `render-service` (9.2.6) und `composer` (9.7.4). Die native `<video>`-Wiedergabe ist Best-Effort; die Zeitleiste bleibt deterministisch und deckt sich mit der Gesamtlänge der Ausgabedatei.
- **Kaputte Elemente** (`fehlt`-Asset, 9.4.7) zeigen einen **Platzhalter** (konsistent mit `action-editor` 9.8.5); die eigentliche Reparatur erfolgt im `composer` (9.7.5).
- **Bewusste Grenze (Abschnitt 8):** Farbe, Kompression und Bitrate des finalen H.264 sind in der Simulation **nicht** sichtbar; der schnelle Trim kann um bis zu einen Frame anders schneiden. Die **finale Kontrolle bleibt die gerenderte Ausgabedatei** (Akzeptanzkriterium 2/3).

---

### 9.10 Modul `template-canvas` (Renderer, geteilt)

**Fachlich:** Erzeugt aus (**Aktion + Vorlage + Marke**) das Bild eines Aktions-Segments – die **einzige Pixelquelle** des Systems (Variante A, 9.1). Genutzt von `action-editor` (Live-Vorschau, 9.8), `composer` (Thumbnails, 9.7), `preview-player` (Wiedergabe, 9.9) **und** dem finalen Render (Segment-PNG über IPC, 9.2.2). Genau deshalb braucht es einen scharfen Vertrag: rendern diese vier je „irgendwie", ist die zugesagte Pixelgleichheit wertlos.

#### 9.10.1 Schnittstelle: **eine** Zeichenroutine, zwei Verwendungen

```
zeichneSegment(aktion, vorlage, marke) → SegmentBild        // Canvas 1920×1080
   ├─ Anzeige : Canvas wird nur per CSS herunterskaliert (Vorschau, Thumbnail)
   └─ Export  : alsPng(SegmentBild) → PNG-Bytes (Binärpuffer für den RenderRequest, 9.2.2)
```

**Invariante:** Es gibt **keinen zweiten Zeichenpfad.** Anzeige und Export stammen immer aus **demselben** Aufruf – sonst driften Vorschau und Endvideo auseinander.

**Die `aktion` liefert nicht nur Feldinhalte, sondern auch Farbe.** Sie ist der dritte Eingang der **Farb-Rollen-Auflösung**: Ihre `akzentfarbe` ersetzt die Akzent-Rollen der Vorlage (9.10.9). Wer beim Auflösen einer `farbRolle` nur `vorlage` und `marke` heranzieht, erfüllt den Vertrag **nicht** – die Farbwahl der Aktion bliebe wirkungslos.

#### 9.10.2 Ausgabe-Festlegungen

| Feld | Wert |
|---|---|
| Auflösung | **die native Fläche der Vorlagenart** – `art: "vollflaeche"` → **1920 × 1080** (= `RenderProfile`, 9.2.4); `art: "split"` bzw. `"einblendung"` → **1920 × `höhe`** (Bandhöhe aus der Vorlage, 9.2.8). Immer die native Fläche, **unabhängig** von der Anzeigegröße. |
| Export-Format | **PNG** (verlustfrei; Begründung 9.1, Punkt 2) |
| Deckkraft | **folgt der Vorlagenart:** `vollflaeche` und `split` → **deckend**; `einblendung` → **mit Alpha** (das Band überlagert das Video, 9.2.8). PNG trägt den Alphakanal verlustfrei. |
| Farbraum | sRGB |

#### 9.10.3 Determinismus-Invarianten (bindend)

1. **Immer bei der nativen Fläche der Vorlagenart zeichnen** (1920×1080 bzw. 1920×162, s. 9.10.2); Skalierung geschieht **nur** zur Darstellung (CSS). **Nie** kleiner rendern und hochskalieren – das erzeugt ein unscharfes Segment bzw. Band im Endvideo.
2. **`devicePixelRatio` wird ignoriert** – feste Canvas-Backing-Größe entsprechend der Vorlagenart. Das Ergebnis darf **nicht** vom Gerät abhängen (HiDPI-Laptop = gleiches Bild).
3. **Schriften sind vor dem Zeichnen geladen.** Der Aufruf wartet, bis alle benötigten Fonts einsatzbereit sind. Zeichnen mit Fallback-Schrift ist ein **Vertragsbruch** (lautloser Drift zwischen Vorschau und Endvideo).
4. **Bilder sind vor dem Zeichnen dekodiert.** Der Aufruf wartet auf das Motiv (geladen über `media://`, 9.5.7) – sonst entsteht ein Segment ohne Bild.
5. **Gleiche Eingabe → gleiches Bild.** Keine Zeit-, Zufalls- oder Zustandsabhängigkeit (keine Animation, kein Datum, kein `Math.random`).
6. **Kein persistenter Cache** (Modellierungs-Entscheidung 4); innerhalb einer Sitzung darf ein bereits gezeichnetes Canvas zur *Anzeige* weiterverwendet werden.

#### 9.10.4 Marken-Schriften werden mitgeliefert

**Playfair Display ist auf Windows/macOS nicht vorinstalliert.** Die Marken-Schriften werden daher als **Dateien mit der App gebündelt** und explizit registriert/geladen (`FontFace`), bevor gezeichnet wird. **Seit v3.4 gilt dasselbe für importierte Schriften** (FA-24): Sie werden **je Marke** registriert und geladen, **bevor** die erste Zone gezeichnet wird, und der Nachweis unten gilt für sie mit (9.15.3). Fehlt eine importierte Datei zur Renderzeit, bricht der Render **früh** ab (`marken_datei_fehlt`) – ein Rückfall auf die gebündelte Schrift wäre genau der stille Markenbruch, den dieser Abschnitt verhindert. Andernfalls rendert der Canvas still auf eine Fallback-Schrift → Vorschau ≠ Endvideo **und** Markenbruch. *(Konsequenz für die Verpackung: die Font-Dateien gehören ins Bundle.)*

#### 9.10.5 Fester Markenrahmen & Sicherheitsabstand

- Der **feste Markenrahmen** wird **immer** gezeichnet (Logo, Grundgestaltung) und ist **nicht abschaltbar** (FA-11); gestalterischer Spielraum besteht ausschließlich in den **freien Zonen** (FA-12).
- **Sicherheitsabstand: 5 % Innenabstand** – bei 1920×1080 also **96 px** links/rechts und **54 px** oben/unten. Innerhalb dieses Randes liegt **kein bedeutungstragender Inhalt** (TV-Overscan, Anforderungsdokument 4.1).

#### 9.10.6 Text-Überlauf: verbindliche Kaskade

Passt ein Text nicht in seine Zone, greift **genau diese Reihenfolge**:

1. **Umbrechen** bis zur zonenspezifischen Maximal-Zeilenzahl.
2. **Schriftgröße stufenweise verkleinern** bis zu einer definierten Untergrenze.
3. **Kürzen mit „…"** als letzter Ausweg.

Die Kaskade ist **verbindlich und deterministisch** – nie ein zerstörtes Layout, nie ein zufälliges Ergebnis. Die Zonen-Parameter (Maximal-Zeilen, Schriftgrößen-Bereich) kommen aus der `Vorlage` (Datenmodell: 9.11).

#### 9.10.7 Fehlendes Motiv

Ist `aktion.bildRef` ein `fehlt`-Asset (9.4.7), zeichnet `template-canvas` einen **Platzhalter** an der Bildzone, damit der `action-editor` den Defekt zeigen kann (9.8.5). **Ein Segment mit Platzhalter darf nie in den finalen Render gelangen** – diese Sperre sitzt im `composer` (Reparatur-Modus 9.7.5), nicht hier.

#### 9.10.8 Abgrenzung

- Kennt **keine** Dateisystem-Pfade – Motive kommen ausschließlich über `media://` (9.5.7).
- Entscheidet **nicht** über Dauer (Listenelement/`composer`) und **nicht** über Reihenfolge.
- Ist **kein** Auftrag der Queue – eine reine, synchron aufrufbare Renderer-Funktion.

#### 9.10.9 Farb-Rollen-Auflösung: die Akzentfarbe der Aktion ersetzt die Akzent-Rollen

Bisher blieb offen, **wie** `aktion.akzentfarbe` (9.8.2) auf das gezeichnete Segment wirkt: Die Vorlage nennt Farben nur als **Rollen** (9.11.1, Punkt 7), die Aktion bringt eine Akzentfarbe mit – aber die Zeichenroutine reichte sie nie an die Zonen-Auflösung weiter. Wirkung: **gar keine**. Das ist hiermit entschieden.

**Die Regel (bindend):** Beim Zeichnen einer Zone wird jeder `farbRolle`-Verweis über **eine** Auflösungsfunktion aufgelöst, die **drei** Eingänge kennt – die Rolle, die `Marke` und die **`Aktion`**:

```
löseFarbe(farbRolle, marke, aktion) →
    aktion.akzentfarbe   , wenn farbRolle ∈ { "akzent", "akzentKraeftig", "akzentTief" }
                           UND aktion.akzentfarbe gesetzt ist
    marke.farben[farbRolle] , sonst
```

- **Die drei Akzent-Rollen** sind `akzent`, `akzentKraeftig` und `akzentTief` (9.11.2). **`flaecheAkzentZart` gehört NICHT dazu** – trotz des Namens ist es eine **Flächen**-Rolle für dezente Hintergründe, und ein Hintergrund, der bei jeder Aktion die Farbe wechselt, war nie gemeint.
- **Alle übrigen Rollen bleiben unberührt** – Text-Rollen (`textAufDunkel`, `textAufHell`, `textSekundaer`), Flächen-Rollen (`flaecheDunkel`, `flaecheSehrDunkel`, `flaecheHell`, `flaecheAkzentZart`), `linie` sowie `scrimStart`/`scrimEnde`. Sie kommen **immer** aus der `Marke`.
- **Ist `aktion.akzentfarbe` nicht gesetzt, gilt der Markenwert** der jeweiligen Rolle. Das ist der reguläre Rückfall und **kein** Fehler; eine Aktion ohne gewählte Akzentfarbe sieht aus wie die Vorlage sie vorsieht.
- **Es gibt genau eine Auflösungsstelle.** Keine Zonen-Sorte (Text, Bild, Deko, Verlauf) darf `marke.farben[...]` direkt lesen – sonst wirkt die Akzentfarbe in der Pille, aber nicht im Verlauf dahinter, und niemand fände den Grund. Auch `deko.verlauf` (`vonFarbRolle`/`bisFarbRolle`) läuft durch dieselbe Funktion.

**Begründung:** So entstehen aus **einer** Vorlage ohne jede Zusatzarbeit verschiedene Anmutungen – dieselbe „Vollbild"-Vorlage trägt eine rote und eine blaue Aktion. Der **Aufbau** der Vorlage bleibt dabei unangetastet: Sie sagt weiterhin, **welche** Zone Akzentfarbe trägt (Preis-Pille, CTA-Pille, Badge), und diese Aussage gilt unabhängig davon, welche Farbe die einzelne Aktion mitbringt. Die Alternative – Vorlagen je Farbe zu duplizieren – hätte die Bibliothek vervielfacht und jede Layout-Korrektur mehrfach nötig gemacht. Zugleich bleibt die Farbwahl auf die **Markenpalette** begrenzt (9.8.4): Es entsteht **kein** freier Farbwähler, und keine Aktion kann aus dem Corporate Design ausbrechen.

**Folge für den Vorlagenbau (bindend):** Eine Vorlage darf sich **nicht auf den Kontrast zwischen zwei Akzent-Rollen verlassen** – etwa Fläche `akzent` mit Text `akzentTief` in derselben Zone. Nach der Ersetzung tragen **alle drei** Rollen denselben Wert, der Text wäre unsichtbar. Wo lesbarer Kontrast auf einer Akzentfläche gebraucht wird, ist der Text eine **Text-Rolle** (`textAufDunkel` / `textAufHell`). Die eingebauten Vorlagen halten das bereits ein (9.11.1): Ihre Akzent-Pillen (`preis`, `cta`) tragen Akzentfarbe **als Fläche**, ihr Text kommt aus einer Text-Rolle.

**Abgrenzung – wo die Regel NICHT gilt (zwei Fälle):** Erstens das **Ersatz-Logo** (9.10.10): Es nimmt `marke.farben.akzent` und **nicht** `aktion.akzentfarbe` – ein Logo ist eine Konstante, das ist sein Zweck. Rotieren im Band drei Aktionen desselben Partners mit verschiedenen Akzentfarben, blinkte sein „Logo" sonst in drei Farben, während ein echtes Logo als Bilddatei unverändert bliebe; der Ersatz muss sich verhalten wie das, was er ersetzt. Zweitens: Die Ersetzung geschieht **ausschließlich** in der Zonen-Auflösung von `template-canvas`. Die Restflächen der Split-Komposition (9.2.8) füllt der `render-service` mit `flaecheDunkel` – **keine** Akzent-Rolle, also unverändert der Markenwert. Der `render-service` bekommt dadurch **keine** Kenntnis von Aktionen: Er sieht ohnehin nur fertige Pixel (Variante A, 9.1) und eine einzige Farbe aus der Marke. Ebenso unberührt bleiben Vorschau (9.9) und `composer`-Thumbnails – sie zeichnen über **dieselbe** Routine und bekommen die Ersetzung geschenkt.

---

#### 9.10.10 Ersatz-Logo, wenn eine Marke keins hat

`Marke.logo` ist seit v3.4 `| null` – bei Werbepartnern der Normalfall. Ist es `null`, zeichnet
`template-canvas` in **jeder** Zone mit `bindung: logo` einen **Ersatz**: den **Markennamen**
(`marke.name`) auf einer Fläche in der **Akzentfarbe der Marke**. Kein leerer Bereich, und **kein**
fremdes Logo an dieser Stelle – eine geliehene Marke wäre schlimmer als gar keine.

Das Ersatz-Logo entsteht in **derselben** Zeichenroutine wie alles andere (9.10.1) und ist damit
pixelgleich in Vorschau und Render. Vier Festlegungen, bindend:

- **Schrift: die gebündelte Rolle `headlinePlakativ`** (Archivo Black), **nicht** die eigene
  Headline-Schrift der Marke. *Begründung:* Eine Marke ohne Logo hat oft auch keine importierte
  Schrift – und hat sie eine, kann **genau diese Datei zur Renderzeit fehlen** (9.15.3). Dann wäre
  nicht einmal der *Ersatz* zeichenbar. Die gebündelte Schrift ist immer vorhanden, und
  `headlinePlakativ` ist laut 9.11.2 die Rolle mit „hoher Signalwirkung auf dem TV" – genau das, was
  ein Logo leisten muss.
- **Textfarbe nach gemessenem Kontrast**, nicht fest: Der Canvas wählt zwischen den Rollen
  `textAufDunkel` und `textAufHell` die mit dem **besseren Kontrast** zur Akzentfläche. *Begründung:*
  Die Akzentfarbe ist seit FA-24 ein **freier** Wert und kann hell oder dunkel sein; eine feste
  Textfarbe wäre auf der einen Hälfte des Farbraums unlesbar. Es ist dieselbe Rechnung wie bei der
  Kontrast-Warnung des Editors (9.15.2) – **einmal gebaut, zweimal genutzt**. Hier entscheidet sie
  automatisch statt zu warnen: Beim Ersatz-Logo gibt es keine Nutzerwahl, die man warnen könnte.
- **Lange Namen werden verkleinert, nicht abgeschnitten:** Die allgemeine Überlauf-Kaskade lautet
  „umbrechen → verkleinern → `…`" (9.10.6). Für ein Logo ist das Auslassungszeichen falsch – ein
  abgeschnittener Markenname sieht nach Fehler aus, nicht nach Gestaltung. Also **einzeilig auf die
  Zonenbreite verkleinern** bis zur Mindestgröße, darunter **zweizeilig umbrechen**, **kein `…`**.
- **`seitenverhaeltnis` ist bei `logo === null` bedeutungslos.** Die Fläche kommt aus dem
  Zonen-`rahmen` – in der eingebauten Vorlage 420 × 120 px oben links (9.11.1).

**Die Akzentfarbe des Ersatz-Logos ist die der MARKE** (`marke.farben.akzent`), nicht die der Aktion.
Das ist eine ausdrückliche Ausnahme von 9.10.9 und dort im Abschnitt „Abgrenzung" verzeichnet. Sie hat
denselben Grund wie die zweite Ausnahme dort und wie die Herkunft der Restflächen-Farbe (9.2.8):
**Rahmen und Marken-Identität sind stabil, nur Inhalte folgen der Aktion.**

---

### 9.11 Geteilte Datenmodelle: `Vorlage` und `Marke`

Dieser Abschnitt sammelt die **geteilten Datenmodelle** aus `contracts/types`: `Vorlage` und `Marke` (9.11.1/9.11.2 – gemeinsam mit der `Aktion` der Eingang von `template-canvas`, 9.10) sowie `Project` und `Listenelement` (9.11.3) und die projektweiten Festlegungen zu IDs und Konstanten (9.11.4). Alle sind **datengetrieben**, damit eigene Vorlagen (FA-13) ein reiner Datensatz bleiben.

#### 9.11.1 `Vorlage`

```
Vorlage {
  id:        string        // "vollbild" | "split" | "band-standard" | <uuid> bei eigenen
  name:      string        // Anzeigename
  art:       "vollflaeche" | "split" | "einblendung"   // Fläche + Kompositionsart (s. u.)
  höhe:      number | null // nur bei "split"/"einblendung": Bandhöhe in px, GERADZAHLIG (Punkt 8);
                           //   bei "vollflaeche" null
  parent:    string | null // Herkunft: ID der Vorlage, von der diese abgeleitet wurde.
                           //   ≠ null → ARBEITSKOPIE (in Bearbeitung, nicht auswählbar)
                           //   = null → eigenständige, nutzbare Vorlage
  eingebaut: boolean       // true = mitgeliefert; false = eigene (FA-13)
  zonen:     Zone[]        // Zeichenreihenfolge = Array-Reihenfolge (später = darüber)
}

Zone {
  id:          string                  // "ueberschrift" | "motiv" | "preis" | "logo" …
  rolle:       "fest" | "frei"         // fest = Markenrahmen (FA-11), im Editor unveränderlich
  bindung:     Bindung | null          // null = dekorative/statische Zone
  rahmen:      { x, y, breite, höhe }  // ABSOLUTE Pixel im 1920×1080-Raster
  ausrichtung: { horizontal: "links"|"mitte"|"rechts", vertikal: "oben"|"mitte"|"unten" }
  wennLeer:    "leer" | "ausblenden"   // Verhalten bei leerem gebundenem Feld (Default: "leer")
  text?: { schriftRolle, farbRolle, größeMax, größeMin, maxZeilen }
  bild?: { einpassung: "contain" | "cover" }
  deko?: { füllungFarbRolle?, radius?, statischerText?,
           verlauf?: { vonFarbRolle, bisFarbRolle, richtung: "oben"|"unten"|"links"|"rechts" } }
}

Bindung = "titel" | "beschreibung" | "preis" | "cta" | "bild" | "logo" | "slogan"
```

**Festlegungen (bindend):**

0. **`art` bestimmt Zeichenfläche *und* Kompositionsart** (gewählt bei der Vorlagenerstellung, FA-13):

   | `art` | Zeichenfläche | Deckkraft | Video | Komposition (9.2.8) |
   |---|---|---|---|---|
   | `"vollflaeche"` | 1920 × 1080 | deckend | – | eigenständiges Segment (sequenziell) |
   | `"split"` | 1920 × `höhe` | deckend | **verkleinert** auf 1080 − `höhe` | `vstack` (Band **unter** dem Video) |
   | `"einblendung"` | 1920 × `höhe` | **mit Alpha** | bleibt **vollflächig** | `overlay` (Band **über** dem Video, unten) |

   Alle `rahmen`-Werte einer Zone beziehen sich auf die Fläche **ihrer** Vorlagenart. Die Arten sind **nicht** austauschbar: `composer` und `action-editor` bieten jeweils nur die passende Art an (vollflächig für eigenständige Segmente, `split`/`einblendung` für parallele Bänder).
1. **Absolute Pixel** im Raster der Vorlagenart – keine Prozentwerte. Eindeutig, keine Rundungsdrift, deckungsgleich mit der Canvas-Auflösung (9.10.2).
2. **Zeichenreihenfolge = Array-Reihenfolge** (später gezeichnete Zone liegt oben). **Kein** implizites Sortieren – sonst ist die Überlagerung nicht reproduzierbar.
3. **`bindung`** verknüpft Zone ↔ Aktions-Feld **deklarativ**. **`wennLeer`** bestimmt das Verhalten bei leerem Feld:
   - **`"leer"`** *(Default)*: Zone bleibt leer, Layout unverändert.
   - **`"ausblenden"`**: Zone wird **gar nicht** gezeichnet – **inklusive Dekoration** (verhindert z. B. eine leere rote Preis-Pille).
   **Invariante:** *Keine* der beiden Varianten verschiebt oder skaliert andere Zonen. Es gibt **kein automatisches Umlayouten** – sonst erfindet jeder Agent eine eigene Layout-Logik und das Ergebnis wird unvorhersehbar.
4. **Feste Zonen sind Teil der Vorlage**, nicht hartkodiert – dadurch bleibt FA-13 ein reiner Datensatz. Der Editor darf Zonen mit `rolle: "fest"` **nicht** ändern, verschieben oder entfernen (Markenrahmen erzwungen, FA-11).
5. **Eigene Vorlagen dürfen freie Zonen hinzufügen, ändern, umordnen und entfernen** – auch **dekorative** Zonen (`bindung: null`) mit eigener Füllung, Radius oder statischem Text. So lässt sich Neues ergänzen, **ohne** das `Aktion`-Datenmodell zu erweitern. Ebenso ist `wennLeer` je Zone frei wählbar.
6. **`text.*` speist die Überlauf-Kaskade** (9.10.6): `maxZeilen` = Stufe 1 (Umbruch), `größeMax`→`größeMin` = Stufe 2 (Verkleinern), danach Stufe 3 („…").
7. **Farben und Schriften sind Rollen-Verweise in die `Marke`** (z. B. `farbRolle: "akzent"`, `schriftRolle: "headlineElegant"`), **keine** Hex-Werte oder Font-Namen. So bleibt ein Marken-Wechsel ein Datenwert und keine Vorlagen-Änderung.

   **Die Akzent-Rollen sind der eine Rollen-Satz, den die Aktion überschreibt.** Löst eine Zone eine der drei Akzent-Rollen **`akzent`**, **`akzentKraeftig`** oder **`akzentTief`** (9.11.2) auf, liefert die Auflösung **nicht** den Markenwert, sondern den Wert aus **`aktion.akzentfarbe`** (9.8.2). Alle übrigen Rollen – Text- und Flächen-Rollen einschließlich `flaecheDunkel` und `flaecheAkzentZart` – bleiben **unberührt**. **Die Vorlage bestimmt also, WO Akzentfarbe hingehört; die Aktion bestimmt, WELCHE Farbe der Markenpalette dort landet.** Ist `aktion.akzentfarbe` nicht gesetzt, gilt **der Markenwert** der jeweiligen Rolle – der Fall ist ausdrücklich vorgesehen und **kein** Fehler. Die Regeln der Auflösung stehen vollständig in 9.10.9; hier steht nur, dass die Rollen-Verweise der Vorlage davon betroffen sind.
8. **`höhe` ist geradzahlig** – bei `art: "split"` und `"einblendung"` muss die Bandhöhe eine **gerade** Zahl sein (Wertebereich > 0 und < 1080, 9.12.1). Grund ist das Ausgabe-Profil `yuv420p` (9.2.4): Es verlangt gerade Höhen und gerade Versätze. Bei ungerader Höhe ist die Videofläche `1080 − höhe` (bei `split`) bzw. der Overlay-Versatz `y = 1080 − höhe` (bei `einblendung`) ungerade – **beide** Kompositionsarten aus 9.2.8 brechen. Geprüft wird schon im Editor (Sperre, 9.12.2), nicht erst beim Render.

**Gemeinsame Basis der eingebauten Vorlagen**

- Raster 1920×1080; Sicherheitsbereich 96/54 → **Inhaltsbox x 96–1824, y 54–1026** (9.10.5).
- **Logo 420×120**, **oben links** (Seitenverhältnis des Assets ≈ 3,5 : 1; der dunkle Balken ist im Logo-Asset **enthalten** – es braucht keine eigene Hintergrundzone).
- Die Zone **`hintergrund`** (fest, dekorativ, Markenfarbe) wird **als erstes** gezeichnet. Grund: das Bild einer Aktion ist **optional** (FA-02) – ohne diese Zone würde eine Aktion ohne Motiv **schwarz** rendern statt markenkonform.

**Eingebaute Vorlage „Vollbild"** *(Zeichenreihenfolge = Tabellenreihenfolge)*

| Zone | rolle | bindung | rahmen (x, y, b, h) | Parameter |
|---|---|---|---|---|
| `hintergrund` | fest | – (deko) | 0, 0, 1920, 1080 | Markenfarbe (dunkel) |
| `motiv` | frei | bild | 0, 0, 1920, 1080 | `cover`; darf über die Inhaltsbox bluten |
| `scrim` | fest | – (deko) | 0, 432, 1920, 648 | Verlauf `scrimStart` → `scrimEnde`, Richtung `unten` – sichert die **Lesbarkeit** von Text über Fotos |
| `logo` | fest | logo | 96, 54, 420, 120 | |
| `ueberschrift` | frei | titel | 96, 640, 1150, 190 | 96 → 56 px, max **2** Zeilen |
| `beschreibung` | frei | beschreibung | 96, 850, 1150, 100 | 48 → 34 px, max **2** Zeilen |
| `preis` | frei | preis | 1300, 660, 524, 150 | Pille (Akzent), `wennLeer: ausblenden` |
| `cta` | frei | cta | 1300, 830, 524, 120 | Pille, `wennLeer: ausblenden` |

**Eingebaute Vorlage „Split"** *(Motiv links, Text rechts; Trennung bei x = 960)*

| Zone | rolle | bindung | rahmen (x, y, b, h) | Parameter |
|---|---|---|---|---|
| `hintergrund` | fest | – (deko) | 0, 0, 1920, 1080 | Markenfarbe (dunkel) |
| `motiv` | frei | bild | 0, 0, 960, 1080 | **`contain`** – das ganze Produkt bleibt sichtbar, kein Beschnitt |
| `logo` | fest | logo | 1056, 54, 420, 120 | oben in der Textspalte |
| `ueberschrift` | frei | titel | 1056, 260, 768, 240 | 84 → 52 px, max **3** Zeilen |
| `beschreibung` | frei | beschreibung | 1056, 530, 768, 200 | 40 → 30 px, max **4** Zeilen |
| `preis` | frei | preis | 1056, 780, 360, 130 | Pille (Akzent), `wennLeer: ausblenden` |
| `cta` | frei | cta | 1056, 930, 500, 96 | Pille, `wennLeer: ausblenden` |

Alle Ränder liegen exakt auf der Inhaltsbox (rechts 1824, unten 1026). Die Werte sind datengetrieben und nach dem ersten echten Render leicht nachjustierbar.

**Eingebaute Band-Vorlage „Band-Standard"** *(`art: "split"`, `höhe: 162`, Fläche 1920 × 162, deckend – für die Hauptbetriebsart Split-Screen, 9.2.8)*

| Zone | rolle | bindung | rahmen (x, y, b, h) | Parameter |
|---|---|---|---|---|
| `hintergrund` | fest | – (deko) | 0, 0, 1920, 162 | `flaecheDunkel`, deckend |
| `logo` | fest | logo | 96, 20, 240, 69 | vertikal in der sicheren Zone zentriert |
| `titel` | frei | titel | 380, 18, 900, 72 | `headlinePlakativ`, 64 → 44 px, max **1** Zeile |
| `preis` | frei | preis | 1330, 18, 240, 72 | Pille (`akzent`), `wennLeer: ausblenden` |
| `cta` | frei | cta | 1590, 18, 234, 72 | Pille, `wennLeer: ausblenden` |

**Alle Zonen enden bei Band-y 90 – und das ist zwingend:** Das Band sitzt am unteren Rahmenrand (Rahmen-y 918–1080), also fallen die unteren **54 px des Rahmens in das Band**. Sicher nutzbar sind damit nur die oberen **108 px** des Bandes (9.11.2). Inhalt tiefer als Band-y 108 kann am TV abgeschnitten werden.

**Bewusst ohne Beschreibungs-Zone:** In den sicher nutzbaren ~90 px passt genau **eine kompakte Zeile**. Eine Beschreibung wäre unlesbar und ist im Band nicht vorgesehen (Anforderungsdokument 4.5). Seitlich gilt der Sicherheitsabstand (96 px); rechts endet die letzte Zone exakt bei 1824.

#### 9.11.1.1 Ablage und Lebenszyklus von Vorlagen

- **Vorlagen sind app-weit** – **eine** Bibliothek für **alle** Projekte (`vorlagen.json`, Abschnitt 6). Das unterscheidet sie bewusst von **Medien** (pro Projekt, D2) und **Aktionen** (Bibliothek pro Projekt).
- **Löschen erst, wenn keine Aktion in *keinem* Projekt die Vorlage mehr verwendet.** Blockiert wie beim Medium-Löschen (9.4.6), **nicht** kaskadierend – ein Layout-Verlust würde alle betroffenen Aktionen zerstören.
  **Wichtige Konsequenz:** Die Referenzprüfung muss über **alle** Projekte laufen, **nicht nur** über das geladene. Nur das aktive Projekt liegt im Speicher (9.5.1); für die Prüfung müssen die übrigen `project.json` gelesen werden.
- **Eingebaute Vorlagen sind unlöschbar und eingefroren:** Layout-Änderungen an einer eingebauten Vorlage werden **nicht in-place** vorgenommen, sondern als **neue Vorlagen-ID** ausgeliefert. Sonst sähen Aktionen in bestehenden Projekten nach einem App-Update plötzlich anders aus.

#### 9.11.2 `Marke`

Die `Marke` ist die **konsumierbare** Fassung des Markenauftritts (Anforderungsdokument 4.2). Vorlagen verweisen **ausschließlich über Rollen** darauf – niemals auf Hex-Werte oder Schriftnamen (9.11.1, Punkt 7). Dadurch ist ein Marken-Wechsel ein Datenwert und keine Vorlagen-Änderung.

```
Marke {
  id:          string                       // UUID (9.11.4)
  name:        string                       // im Editor sichtbar, trägt das Ersatz-Logo (9.10.10)
  parent:      string | null                // abgeleitet von dieser Marke; null = eigenständig
  eingebaut:   boolean                      // true NUR bei Fitnessworld24 – nicht löschbar (9.15.1)
  farben:      { <FarbRolle>: string }      // Hex, 6- oder 8-stellig (8 = mit Alpha)
  schriften:   { <SchriftRolle>: Schrift }
  logo:        { datei, herkunft, seitenverhaeltnis } | null   // null -> Ersatz-Logo (9.10.10)
  sicherheit:  { horizontal: 96, vertikal: 54 }   // absolute px im 1920×1080-RAHMEN
  radien:      { pille: 40, karte: 10, klein: 2 }
  schatten:    { versatzY: 4, weichzeichnen: 8, farbe: "#0000001A" }
  slogan:      { text: string, aktiv: boolean }
}
Schrift { familie, gewicht, datei, herkunft }
Herkunft = "gebuendelt" | "importiert"      // gebuendelt: Bundle-Asset (9.10.4);
                                            // importiert: marken-assets/<id>/ (9.15.3)
```

**Ableitung – die Auflösungsregel (bindend):** Bei `parent ≠ null` sind `farben` und `schriften`
**Teilmengen**: Für jede Rolle, die die abgeleitete Marke **nicht** setzt, gilt der Wert des Parents –
**feldweise**, nicht objektweise. Ein Saison-Look, der nur `farben.akzent` setzt, erbt damit alle
übrigen Farben, alle Schriften, Logo, Abstände, Radien, Schatten und Slogan. Setzt er ein Feld, gilt
seins. Das gilt für **jedes** Feld außer `id`, `name`, `parent` und `eingebaut`.

**Ketten sind auf EINE Stufe begrenzt:** Ein Parent darf selbst keinen Parent haben. Sonst müsste die
Auflösung beliebig tief laufen und die Referenzprüfung beim Löschen (9.15.1) rekursiv über einen Baum
statt über eine Liste – beides ohne fachlichen Gewinn, denn zwei Stufen decken „Marke + Look" ab.

**Die Auflösung geschieht an genau EINER Stelle:** im `marken-store`. `leseMarke(markeId)` liefert die
**fertig aufgelöste** Marke; kein Aufrufer sieht je eine Teilmenge, keiner implementiert Vererbung
selbst. Das ist dieselbe Begründung wie bei den Farb-Rollen (9.10.9): **neunzehn** Aufrufer holen die
Marke (9.15.1) – neunzehn eigene Vererbungslogiken liefen unweigerlich auseinander.

```
```

**Farb-Rollen (v1, fest):**

| Rolle | Wert | Verwendung |
|---|---|---|
| `akzent` | `#FF4040` | **Primärfarbe** – Badges, Preis, CTA |
| `akzentKraeftig` | `#DF3131` | satte Variante |
| `akzentTief` | `#971316` | Akzenttext, Tiefe |
| `flaecheDunkel` | `#2F2E2E` | Segment- und **Band**-Hintergrund |
| `flaecheSehrDunkel` | `#4B090B` | starker Kontrast |
| `flaecheHell` | `#FFFFFF` | helle Flächen |
| `flaecheAkzentZart` | `#F5AEAF` | dezente Flächen |
| `textAufDunkel` | `#FFFFFF` | Text auf dunklem Grund |
| `textAufHell` | `#202020` | Haupttext |
| `textSekundaer` | `#8F8F8F` | Nebentext |
| `linie` | `#CCCCCC` | Linien, Trenner |
| `scrimStart` / `scrimEnde` | `#00000000` / `#000000B3` | Verlauf für Textlesbarkeit über Fotos |

**Schrift-Rollen (v1, fest) – alle Dateien werden mitgeliefert (9.10.4):**

| Rolle | Schrift | Lizenz | Begründung |
|---|---|---|---|
| `headlineElegant` | **Playfair Display** (700) | OFL | Serif-Display aus dem Markenauftritt |
| `headlinePlakativ` | **Archivo Black** (900) | OFL | freier Ersatz für Arial Black / Avenir 85 Heavy; hohe Signalwirkung auf dem TV |
| `fliesstext` | **Arimo** (400) | OFL | **metrisch kompatibel** zu Helvetica/Arial – Textlängen fallen wie erwartet |
| `fliesstextFett` | **Arimo** (700) | OFL | Auszeichnung im Fließtext |

*Begründung der Ersatzwahl:* „Arial Black" und „Avenir 85 Heavy" sind nicht frei lizenziert bzw. nicht auf jedem System vorhanden – als **gebündelte** Datei unbrauchbar. Arimo ist metrisch Helvetica-kompatibel, sodass Layouts nicht springen.

**Sicherheitsabstand ist eine Eigenschaft des Bildrahmens, nicht der Vorlagenfläche.** Er gilt absolut im 1920×1080-Rahmen (96 px horizontal, 54 px vertikal, 9.10.5). **Wichtige Folge für Bänder:** Ein Band sitzt am unteren Rahmenrand – die unteren **54 px des Rahmens liegen damit *innerhalb* des Bandes**. Bei einem 162 px hohen Band sind also nur die oberen **108 px** sicher nutzbar; Inhalt darunter kann am TV abgeschnitten werden. Der `vorlagen-editor` zeigt diese Linie an und warnt (9.12.2).

**Marken sind ein app-weiter Bestand und bearbeitbar** (`marken-store`, 9.15.1; FA-23/FA-24). *Bis v3.3 stand hier: „Marke ist in v1 gebündelt und read-only (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP." Beides ist mit v3.4 überholt – die Marke gehört nicht mehr dem `config-store`, und der Editor ist ein Muss.* **Gebündelt bleiben** die vier OFL-Schriften und das Fitnessworld24-Logo; importierte Dateien tragen die Herkunft `importiert` (9.15.3).

#### 9.11.3 `Project` und `Listenelement`

```
Project {
  id:            string          // UUID
  name:          string
  erstelltAm:    string          // ISO-8601 UTC
  geaendertAm:   string          // ISO-8601 UTC
  schemaVersion: number          // 9.5.5
  assets:        Asset[]         // Medien-Bibliothek des Projekts (9.4.4)
  aktionen:      Aktion[]        // Aktions-Bibliothek des Projekts (9.8.2)
  liste:         Listenelement[] // geordnete Wiedergabeliste
  letzterAusgabeName: string | null  // FA-22: Vorbelegung des Render-Zielnamens; null = noch nie gerendert
  standardMarkeId:    string         // FA-23: färbt Band-Hintergrund und Split-Restflächen und
                                     //   belegt neue Aktionen vor. Beim Anlegen die eingebaute Marke
}

Listenelement {
  id:          string                                   // UUID
  art:         "video" | "bild" | "segment"
  ref:         string                                   // Asset-ID (video|bild) oder Aktions-ID (segment)
  dauer:       number | null                            // Sekunden – bei bild/segment
  trimStart:   number | null                            // Sekunden – nur bei video
  trimEnde:    number | null                            // Sekunden – nur bei video
  einblendung: { bandVorlageId, abschnitte: [{ aktionRef, dauer }] } | null   // nur bei video
}
```

**Belegung je `art` (bindend):**

| `art` | `ref` zeigt auf | `dauer` | `trimStart`/`trimEnde` | `einblendung` |
|---|---|---|---|---|
| `video` | `Asset` (typ `video`) | `null` – die Dauer ergibt sich aus dem Trim | gesetzt | erlaubt |
| `bild` | `Asset` (typ `bild`) | gesetzt (10–45 s) | `null` | `null` |
| `segment` | `Aktion` | gesetzt (10–45 s) | `null` | `null` |

**Invarianten:**

- **Die Reihenfolge ist die Array-Reihenfolge von `liste`** – es gibt **kein** separates `position`-Feld. Zwei Quellen für dieselbe Information würden unweigerlich auseinanderlaufen. (Gleiche Regel wie bei den Zonen einer Vorlage und beim `RenderRequest`, 9.2.1.)
- **`Vorlage` und `Marke` liegen NICHT im Projekt** – sie sind app-weit (9.11.1.1, 9.5.6). Das Projekt hält nur **Referenzen** (`vorlagenId`, `bandVorlageId`).
- **Assets und Aktionen sind projekt-eigen** (Modellierungs-Entscheidungen 2 + 3); ihre IDs sind nur **innerhalb** des Projekts eindeutig.

#### 9.11.4 ID-Schema und Konstanten

- **Alle IDs sind UUIDs** – `Project`, `Asset`, `Aktion`, `Listenelement`, `Vorlage`, `Auftrag`. **Keine** fortlaufenden Zähler: die kollidieren nach Löschen/Neu-Anlegen und beim Duplizieren von Projekten. **Keine** aus Namen abgeleiteten IDs: ein Umbenennen darf niemals Referenzen brechen.
- **IDs werden nie wiederverwendet**, auch nicht nach dem Löschen.
- **`dupliziereProjekt` vergibt eine neue Projekt-ID**, behält aber die projektinternen IDs (Assets, Aktionen, Listenelemente) – sie sind ohnehin nur projektweit eindeutig, und ein Umschreiben würde alle inneren Referenzen gefährden.
- **Konstanten in `contracts/types`** (an *einer* Stelle, nicht verstreut):

| Konstante | Wert | Bezug |
|---|---|---|
| Standard-Anzeigedauer | **10 s** | Vorbelegung für Bild/Segment und `Aktion.standardDauer` |
| Dauer-Bereich | **10–45 s** | Validierung in `setzeDauer` (9.5.2) |
| Sicherheitsabstand | **96 / 54 px** | im 1920×1080-Rahmen (9.10.5, 9.11.2) |
| Format-Whitelist | MP4 / JPG, PNG, WebP | Dialog **und** Import-Prüfung (9.4.2) |
| Aktuelle `schemaVersion` | **1** | wird von `öffneProjekt`, `schreibeProjekt` und der Migration gelesen (9.5.5) – **eine** Stelle, sonst laufen drei Kopien auseinander |

---

### 9.12 Vorlagen-Verwaltung: `vorlagen-store` [Main] und `vorlagen-editor` [Renderer]

Vorlagen sind **app-weit** (9.11.1.1) und liegen damit **außerhalb** von `project.json`. Sie brauchen deshalb einen **eigenen** Besitzer im Main – **nicht** den `project-store` (der besitzt nur `project.json`) und **nicht** den `config-store` (der besitzt App-Einstellungen, keine Fachdaten).

#### 9.12.1 `vorlagen-store` [Main]

**Besitzt** `vorlagen.json` (app-weite Vorlagen-Bibliothek) samt **eigener** Schreib-Serialisierung. Die Schreib-Invarianten sind **dieselben** wie in 9.5.4: **atomar** (Temp + Rename), **`vorlagen.json.bak`** als letzte heile Version, **`schemaVersion`**, und Speicherfehler werden **sichtbar** gemacht statt still verschluckt.

**Sichtbar heißt: derselbe Melde-Weg wie beim `project-store`, auf einem eigenen Kanal (bindend).** Der `vorlagen-store` sendet bei einem gescheiterten Schreibvorgang ein **Ereignis vom Main** an das eine Fenster (9.1.1 Punkt 10) – Kanal **`vorlagen:autoSpeichernStatus`**, Nutzlast und Verhalten **gleichartig** zu `project:autoSpeichernStatus` (9.5.4): dauerhafter Hinweis „nicht gespeichert" in der Oberfläche, automatischer Wiederholversuch, die Änderungen **bleiben im Speicher** (kein Rollback), und der Hinweis verschwindet erst nach erfolgreichem Schreiben. Ohne Anmeldung im `ipc-gateway` bliebe er ein Sender ohne Empfänger.

*Begründung:* Bis hierher stand die Zusage „sichtbar statt still verschluckt" **ohne Ereignis und ohne Kanal** da – sie war damit **nicht umsetzbar**. Das Speichern der Arbeitskopie läuft **entprellt und ohne Aufruf** aus dem Renderer (s. u.), es gibt also – genau wie beim Auto-Speichern von D1 – **keine Antwort**, an die sich eine Fehlermeldung hängen könnte. Die Folge wäre gewesen: Eine im Vorlagen-Editor über Minuten aufgebaute Vorlage geht **lautlos** verloren, und der Nutzer merkt es erst beim nächsten Start, wenn seine Zonen wieder auf dem alten Stand stehen. Ein **eigener** Kanal statt einer Mitbenutzung von `project:autoSpeichernStatus` ist nötig, weil die Oberfläche die beiden Fälle **unterscheiden** muss: Der eine bedeutet „dein Projekt ist nicht gesichert", der andere „deine Vorlage ist nicht gesichert" – und die Vorlagen-Bibliothek ist **app-weit**, sie hängt nicht am geladenen Projekt.

| Operation | Eingang → Ausgang |
|---|---|
| `listeVorlagen` | – → `Ergebnis<Vorlage[]>` – **nur nutzbare** (`parent = null`); Arbeitskopien erscheinen hier **nicht** |
| `listeArbeitskopien` | – → `Ergebnis<Vorlage[]>` (`parent ≠ null`) – für „Bearbeitung fortsetzen" |
| `erstelleVorlage` | `art`, `höhe?`, `name` → `Ergebnis<Vorlage>` mit `parent = null` (feste Zonen der Art vorbelegt) |
| `oeffneZurBearbeitung` | `id` → `Ergebnis<Vorlage>` – legt eine **Arbeitskopie** mit `parent = id` an und gibt sie zurück |
| `speichereArbeitskopie` | `arbeitsId`, `vorlage` → `Ergebnis<Vorlage>` – **Auto-Speichern** während des Bearbeitens |
| `uebernehmeInParent` | `arbeitsId` → `Ergebnis<Vorlage>` – **mergt** in den Parent, Arbeitskopie verschwindet („überarbeiten") |
| `alsEigenstaendige` | `arbeitsId`, `name` → `Ergebnis<Vorlage>` – setzt **`parent = null`**, Arbeitskopie wird eine echte Vorlage |
| `verwerfeArbeitskopie` | `arbeitsId` → `Ergebnis<void>` |
| `löscheVorlage` | `id` → `Ergebnis<void>`; im Fehlerfall Code `vorlage_referenziert` mit **beiden** Trefferlisten: betroffene **Aktionen** und betroffene **Listenelemente**, je mit Projekt |
| `pruefeVorlagenReferenzen` | `id` → `Ergebnis<Vorlagennutzung>` – **rein lesend**: ermittelt über **alle** Projekte, welche Aktionen und welche Listenelemente die Vorlage benutzen, und gibt die Treffer **namentlich** zurück (nicht nur Zahlen). Verändert **nichts** |

**`pruefeVorlagenReferenzen` – die Nutzung wird VOR dem Überarbeiten und VOR dem Löschen angezeigt.** 9.12.2 verlangt die Anzeige seit je („wird von 7 Aktionen in 2 Projekten verwendet"), aber die Operationsliste kannte keine Operation dafür – die Zählung existierte nur **intern** als Sperre beim Löschen und war von der Oberfläche aus **nicht erreichbar**. Diese Operation schließt die Lücke.

- **Ausgang – der Typ existiert bereits:** `Vorlagennutzung` ist genau das, was `löscheVorlage` im Fehlerfall als `fehler.daten` des Codes `vorlage_referenziert` trägt (9.1.1). Es wird **kein zweiter Typ** dafür erfunden:

  ```
  VorlagenReferenz {           // ein Fundort
    projektId:   string
    projektName: string        // für die Meldung „… in 2 Projekten"
    id:          string        // Aktions-ID bzw. Listenelement-ID des Treffers
  }

  Vorlagennutzung {
    aktionen:       VorlagenReferenz[]   // Treffer über aktion.vorlagenId
    listenelemente: VorlagenReferenz[]   // Treffer über listenelement.einblendung.bandVorlageId
  }
  ```

- **Dieselbe Prüfung wie die Lösch-Sperre, nur ohne Wirkung.** Sie erfasst **beide** Referenzarten und liest **alle** `project.json` (s. die Lösch-Invariante unten). Es gibt **einen** Prüf-Mechanismus, den die Anzeige und die Sperre gemeinsam benutzen – zwei Zählungen liefen unweigerlich auseinander, und die harmlosere von beiden wäre die falsche.
- **Eigener IPC-Kanal** nach 9.1.1 Punkt 4: `vorlagen:pruefeVorlagenReferenzen`. Ohne Anmeldung im `ipc-gateway` bliebe die Operation eine Main-Funktion ohne Aufrufer.
- **Kein Lock, keine Wirkung:** Sie schreibt nichts, sie reiht nichts ein, sie ist **kein** Auftrag der Queue (9.3.2) – ein Instant-Aufruf wie die übrigen Leseoperationen. Eine **leere** Nutzung (beide Listen leer) ist ein **gültiges Ergebnis**, kein Fehler: Sie bedeutet „diese Vorlage ist frei".

*Begründung:* Eine Vorlage ist **app-weit** (9.11.1.1). Ihr Überarbeiten (`uebernehmeInParent`) ändert das Aussehen von Aktionen in Projekten, die der Nutzer gerade **gar nicht offen hat** – und der Merge ist ein vollständiges Ersetzen, kein Feld-Abgleich. Ohne die Anzeige trifft er diese Entscheidung **blind**. Beim Löschen ist die Lage noch schärfer: Dort steht er sonst vor einem bloßen „geht nicht", ohne zu erfahren, **was** ihn blockiert und wo er aufräumen müsste. Die Treffer müssen deshalb **namentlich** kommen (Projekt und Fundstelle), nicht als Zahl – eine Zahl sagt ihm, dass es ein Problem gibt, aber nicht, wo.

**Der Arbeitskopie-Fluss (Kern von FA-13):**

```
Vorlage X bearbeiten
  └─ oeffneZurBearbeitung(X)  →  Arbeitskopie  (parent = X)
        └─ Bearbeiten  →  speichereArbeitskopie (AUTO, entprellt)   ← X bleibt unberührt
              ├─ uebernehmeInParent   →  Änderungen wandern in X, Arbeitskopie weg
              ├─ alsEigenstaendige    →  parent = null, neue eigene Vorlage entsteht
              └─ verwerfeArbeitskopie →  alles zurück, X unverändert
```

**Zweck des `parent`-Feldes (und warum es genullt wird):** Das Feld `parent` ist **die Merge-Beziehung** – es sagt „diese Vorlage stammt von X und kann in X zurückgeschrieben werden". Wählt der Nutzer „als eigenständige Vorlage", wird **das Feld** auf `null` gesetzt (nicht der Parent verändert!). Damit ist die Beziehung **bewusst durchtrennt** – genau das schließt spätere **Merge-Konflikte** aus: eine Vorlage ohne `parent` kann niemanden mehr überschreiben und von niemandem überschrieben werden.

**Invarianten (bindend):**

- **Höchstens eine Arbeitskopie pro Parent.** Wird eine Vorlage geöffnet, für die bereits eine Arbeitskopie existiert, wird **diese fortgesetzt** statt eine zweite anzulegen. So kann es strukturell **keinen** Merge-Konflikt geben (zwei Kopien, die denselben Parent überschreiben wollen).
- **Merge ist ein vollständiges Ersetzen, kein Feld-Abgleich.** `uebernehmeInParent` schreibt den Stand der Arbeitskopie **komplett** in den Parent (Zonen, Parameter, Höhe) – die `id` des Parents und dessen `eingebaut`-Kennzeichen bleiben. Es gibt **keine** teilweise Zusammenführung; genau deshalb braucht es keine Konfliktauflösung.
- **Auto-Speichern trifft nur die Arbeitskopie.** Während des Bearbeitens wird entprellt gesichert (3–5 s, wie 9.5.4) – aber **ausschließlich** in die Arbeitskopie. Die genutzte Vorlage ändert sich **erst** beim expliziten `uebernehmeInParent` bzw. `alsEigenstaendige`. So kann Experimentieren **nie** laufende Werbung in anderen Projekten verändern.
- **Arbeitskopien (`parent ≠ null`) sind nicht auswählbar.** `composer` und `action-editor` bekommen sie nicht angeboten – halbfertige Vorlagen können nicht in einen Render geraten.
- **`uebernehmeInParent` ist gesperrt, wenn der Parent eingebaut ist.** Eingebaute Vorlagen bleiben unveränderlich (9.11.1.1); dort bleibt nur `alsEigenstaendige`. Der Editor macht das vorher sichtbar, statt beim Speichern zu scheitern.
- **`art` ist nach dem Anlegen unveränderlich** – auch über die Arbeitskopie. Ein Wechsel würde alle Zonen-Rahmen ungültig machen (andere Fläche); stattdessen neu anlegen.
- **`höhe` nur bei `split`/`einblendung`**, Wertebereich > 0 und < 1080 **und geradzahlig** (9.11.1 Punkt 8, Begründung `yuv420p` in 9.2.8). Bei `vollflaeche` immer `null`. Der Store weist eine ungerade Höhe ab – auf **jedem** Weg, der sie setzen kann (`erstelleVorlage`, `speichereArbeitskopie`, `uebernehmeInParent`); der Editor sperrt sie bereits vorher (9.12.2).
- **Feste Zonen (`rolle: "fest"`) dürfen nie entfernt oder verschoben werden** – auch nicht in eigenen Vorlagen (Markenrahmen erzwungen, FA-11).
- **Löschen nur, wenn die Vorlage in *keinem* Projekt mehr benutzt wird.** Die Prüfung muss **beide** Referenzarten erfassen – das ist die entscheidende Feinheit:
  1. **`aktion.vorlagenId`** – Aktionen, die die Vorlage als vollflächiges Segment nutzen.
  2. **`listenelement.einblendung.bandVorlageId`** – Listenelemente, die sie als **Band** nutzen (Split/Einblendung, 9.2.8).

  **Eine Band-Vorlage wird ausschließlich über Weg 2 referenziert.** Wer nur Aktionen prüft, hält sie fälschlich für unbenutzt und löscht sie – der nächste Render bricht dann mit einer verwaisten Referenz. Die Prüfung liest dafür **alle** `project.json`, **nicht nur** das geladene Projekt (nur das aktive liegt im Speicher, 9.5.1). Blockierend, **nicht** kaskadierend.
- **Arbeitskopien blockieren das Löschen nicht** – sie sind kein „Benutzen". Wird der Parent gelöscht, wird deren `parent` genullt (s. u.).
- **Eine Arbeitskopie hält den Parent nicht am Leben:** Wird der Parent gelöscht, während eine Arbeitskopie existiert, wird deren `parent` auf `null` gesetzt (sie wird zur eigenständigen Vorlage) – **keine** verwaiste Referenz.

#### 9.12.2 `vorlagen-editor` [Renderer]

**Ist:** die UI zum Anlegen und Bearbeiten – **Art wählen** (vollflächig / Split-Screen / Einblendung), Bandhöhe setzen, freie und dekorative Zonen anlegen, verschieben, bemaßen, `bindung` und `wennLeer` wählen, Text-Parameter setzen (Schrift-/Farb-Rolle, Größenbereich, Max-Zeilen).
**Ist NICHT:** bearbeitet **keine** Aktions-Inhalte (`action-editor`), platziert nichts in die Liste (`composer`), rendert **keine** Pixel selbst, **kein** Dateisystem/ffmpeg.

**Bedienung – zwei Wege auf dieselben Werte:**

- **Canvas mit Zonen-Rechtecken:** ziehen und an Griffen bemaßen – für das schnelle Gestalten.
- **Zahlen-Inspektor** (`x` / `y` / `breite` / `höhe`): für exakte Werte. Reines Ziehen trifft einen Wert wie 1056 nie genau, deshalb sind **beide** Wege Pflicht.
- **Einrasten** an den Sicherheitsabstand-Linien, an Kanten anderer Zonen und an ein **8-px-Raster** – saubere Layouts ohne Verlust der Pixel-Genauigkeit.
- **Zonen-Liste = Zeichenreihenfolge:** per Drag sortierbar; sie **bestimmt die Überlagerung** (9.11.1, Punkt 2). **Kein** `z-index`, **keine** Sortierung nach Position – sonst ist die Überlagerung nicht reproduzierbar.
- **Zone hinzufügen** aus drei Sorten: **gebundene Textzone** (Titel/Beschreibung/Preis/CTA), **Bildzone** (Motiv/Logo), **dekorative Zone** (`bindung: null`, mit Füllung/Radius/statischem Text).

**Prüfungen – harte Sperre vs. Warnung:**

| Fall | Verhalten |
|---|---|
| Zone ganz oder teilweise **außerhalb der Fläche** | **Sperre** – nicht speicherbar |
| `höhe` ≤ 0 oder ≥ 1080 (bei `split`/`einblendung`) | **Sperre** |
| `höhe` **ungerade** (bei `split`/`einblendung`) | **Sperre** – `yuv420p` verlangt gerade Höhen und Versätze; ungerade bricht **beide** Kompositionsarten (9.2.8, 9.11.1 Punkt 8) |
| Textzone ohne Text-Parameter (Größenbereich, Max-Zeilen) | **Sperre** |
| Zone überschreitet den **Sicherheitsabstand** (5 %, 9.10.5) | **Warnung** – am TV evtl. abgeschnitten |
| Zonen **überlappen** | **erlaubt** – wird für Hintergrund und Scrim gebraucht |
| Feste Zone verschieben oder löschen | **gesperrt**, nur sichtbar |

**Invarianten (bindend):**

- **Live-Vorschau ausschließlich über `template-canvas`** (9.10) – **kein** zweiter Zeichenpfad. Gezeichnet wird mit einer **echten Aktion aus der Bibliothek** (im Editor wählbar); ist die Bibliothek leer, greift eine eingebaute Beispiel-Aktion.
- **Felder testweise leer schaltbar:** Der Editor kann einzelne Aktions-Felder für die Vorschau leeren, damit `wennLeer` (leer bleiben vs. ausblenden) und die **Überlauf-Kaskade** (9.10.6) **sichtbar** werden statt geraten.
- **Zonen-Rahmen in absoluten Pixeln** der jeweiligen Vorlagen-Fläche (9.11.1); Eingaben werden auf die Fläche **begrenzt**.
- **Feste Zonen sind sichtbar, aber gesperrt** – der Nutzer sieht den Markenrahmen, kann ihn aber nicht verändern.
- **Bearbeitet wird immer eine Arbeitskopie** (9.12.1). Der Editor zeigt durchgehend, **ob** er auf einer Arbeitskopie sitzt und **welcher Parent** dahintersteht – und beim Speichern die zwei Wege: **„Vorlage überarbeiten"** (Merge in den Parent) oder **„als neue eigenständige Vorlage"** (`parent = null`). Ist der Parent eingebaut, ist „überarbeiten" **von Anfang an deaktiviert** samt Begründung.
- **Nutzung wird angezeigt,** bevor überarbeitet oder gelöscht wird („wird von 7 Aktionen in 2 Projekten verwendet") – ein Merge verändert **alle** davon. Die Zahlen kommen aus **`pruefeVorlagenReferenzen`** (9.12.1) und aus **keiner** zweiten, editor-eigenen Zählung. Weil die Operation die Treffer **namentlich** liefert, zeigt der Editor sie **aufklappbar** (Projekt + Fundstelle), statt es bei der Zahl zu belassen: Beim Löschen ist genau diese Liste die einzige Auskunft darüber, wo aufgeräumt werden müsste. Die Lösch-**Sperre** selbst sitzt weiterhin im `vorlagen-store`; der Editor macht sie nur **vorher sichtbar**, statt den Nutzer in ein „geht nicht" laufen zu lassen.
- **Undo/Redo** gilt im Editor für alle Zonen- und Parameter-Änderungen (9.13).

### 9.13 Undo/Redo (Projekt-Bearbeitung und Vorlagen-Editor)

**Fachlich:** Beide Editoren – die **Projekt-Bearbeitung** (`composer` + `action-editor`) und der **`vorlagen-editor`** – bieten **Undo/Redo**. Ein versehentlich verschobenes Element oder eine gelöschte Zone muss ohne Handarbeit zurückholbar sein.

#### 9.13.1 Was rückgängig gemacht werden kann – und was nicht

| Umfasst (Instant-Operationen) | **Nicht** umfasst (Aufträge) |
|---|---|
| Liste: hinzufügen, entfernen, umordnen, Trim, Dauer, Einblendung | **Medien-Import** |
| Aktionen: anlegen, bearbeiten, löschen | **Medien-Löschen** |
| Vorlagen-Editor: Zonen anlegen/verschieben/bemaßen, Parameter | **Render**, **USB-Export** |

**Warum die Trennung bindend ist:** Aufträge haben **unumkehrbare Nebenwirkungen auf dem Dateisystem**. Ein gelöschtes Medium ist von der Platte weg (9.4.6) – ein „Undo" könnte es nicht zurückholen, sondern würde nur einen Datensatz auf eine fehlende Datei zeigen lassen. Ein Render/Export ist bereits geschrieben. **Aufträge sind daher grundsätzlich nicht undo-fähig**; ein gelöschtes Medium muss neu importiert werden.

#### 9.13.2 Mechanismus

- **Schnappschuss-basiert:** Vor jeder Instant-Operation wird ein Schnappschuss des betroffenen Datensatzes gehalten; Undo stellt ihn wieder her. **Nicht** über „inverse Operationen" – eine falsch implementierte Umkehrung ist eine stille Fehlerquelle, ein Schnappschuss ist trivial korrekt.
- **Der Rückschreib-Weg der Projekt-Bearbeitung ist `setzeBearbeitungsstand` (9.5.2) – und zwar der einzige.** Der Schnappschuss umfasst `aktionen` **und** `liste`, und er wird **als Ganzes** zurückgeschrieben, unter dem D1-Lock und voll validiert. **Verboten** ist der Versuch, ein Undo aus den feingranularen Operationen (`fügeElementHinzu`, `ordneNeu`, `setzeTrim` …) zusammenzusetzen: Genau das wären die oben ausgeschlossenen inversen Operationen, und für `entferneElement` und `löscheAktion` ist es nachweislich unmöglich – `fügeElementHinzu` vergibt eine **neue** `id` und hängt ans Ende, und die Lösch-Kaskade aus 9.5.3 (Listenelemente **und** Band-Abschnitte) hat gar keine Umkehrung. `assets` und `letzterAusgabeName` gehören **nicht** in den Schnappschuss (Begründung in 9.5.2).
- **Zwei getrennte Historien:** Projekt-Bearbeitung und Vorlagen-Editor haben **eigene** Stapel (sie bearbeiten verschiedene Datensätze) und werden nie vermischt.
- **Begrenzte Tiefe** (Größenordnung 50 Schritte), damit der Speicherbedarf gedeckelt bleibt.
- **Nur Laufzeit** (Kategorie D): die Historie wird **nicht** persistiert und ist nach Projektwechsel, Editor-Schluss oder App-Neustart leer.
- **Undo/Redo läuft über denselben Pfad wie eine normale Änderung** – es ruft `setzeBearbeitungsstand` (9.5.2) auf wie jede andere Instant-Operation, aktualisiert damit den Speicher und löst das gewohnte Auto-Speichern (9.5.4) aus. **Kein** Sonderweg, der Platte und Speicher auseinanderlaufen ließe: Ein Undo, das nur die Anzeige zurücksetzt, ohne dass das entprellte Speichern anspringt, wäre nach dem nächsten Start wieder verschwunden.

#### 9.13.3 Invariante gegen Datenverlust (wichtig)

**Ein Auftrag, der D1 verändert (Medien-Import oder -Löschen), leert die Undo-Historie der Projekt-Bearbeitung.**

*Begründung:* Ohne diese Regel entsteht Datenverlust. Beispiel: Du ordnest die Liste um (Schnappschuss), dann läuft ein Import durch und trägt ein neues Asset in D1 ein, dann drückst du Undo – der Schnappschuss stammt aus der Zeit **vor** dem Import und würde das neu importierte Asset **wieder entfernen**. Genau diese Klasse von Fehlern soll die Regel ausschließen. Da Aufträge seriell und vergleichsweise selten sind (9.3), ist das Leeren der Historie ein billiger Preis für Korrektheit.

---

### 9.14 Modul `app-shell` (Renderer): Aufbau und Navigation

**Fachlich:** Die `app-shell` ist der Rahmen, der die **sechs** Renderer-Oberflächen anordnet und den Wechsel zwischen ihnen führt. Ohne sie wäre offen, wo `composer`, `action-editor`, `vorlagen-editor`, `preview-player`, `projekt-verwaltung` und `queue-panel` überhaupt leben.

#### 9.14.1 Grundstruktur: Modus-Reiter + Warteschlangen-Leiste

```
┌─ [Zusammenstellen] [Aktionen] [Vorlagen] [Projekte] ──────────────────────┐
│                                                                           │
│   Der gewählte Reiter nutzt die ganze Fläche:                             │
│     Zusammenstellen = composer [P3]  +  preview-player [P5]               │
│     Aktionen        = action-editor [P2]  + große Live-Vorschau           │
│     Vorlagen        = vorlagen-editor (Canvas + Zonen-Liste + Inspektor)  │
│     Projekte        = projekt-verwaltung (FA-10, 9.14.3)                  │
│                                                                           │
├───────────────────────────────────────────────────────────────────────────┤
│ queue-panel als schmale Leiste: „Render läuft · 3 von 7"  ▸ aufklappbar   │
└───────────────────────────────────────────────────────────────────────────┘
```

**Begründung der Wahl:** `action-editor` und `vorlagen-editor` brauchen **beide** eine Live-Vorschau über `template-canvas` in **lesbarer** Größe (9.8, 9.12.2), der Vorlagen-Editor zusätzlich Canvas **plus** Zonen-Liste **plus** Inspektor. Eine schmale Seitenspalte oder ein Seitenblatt kann das nicht leisten. Reiter geben jeder Oberfläche die volle Fläche – auf einem Laptop-Bildschirm die tragfähige Lösung.

#### 9.14.2 Invarianten (bindend)

- **Die Warteschlangen-Leiste ist in *jedem* Reiter sichtbar.** Sie ist die einzige Stelle, an der laufende, anstehende und fehlgeschlagene Aufträge erkennbar sind (FA-16) – sie darf nie hinter einem Moduswechsel verschwinden. Eingeklappt zeigt sie den Zustand in einer Zeile, aufgeklappt die volle Liste (9.3.4).
- **Die Warteschlangen-Leiste holt beim Aufbau ERST den Stand und abonniert DANACH.** Ereignisse, die vor dem Aufbau des Fensters anfallen, **verfallen still** – es wird nicht gepuffert (9.1.1 Punkt 10). Deshalb ruft die Leiste beim Aufbau **einmal `holeStand()`** (9.3.4, „Snapshot für die UI") und abonniert **erst anschließend** `queue:geaendert`. Die umgekehrte Reihenfolge wäre falsch: Die Antwort auf `holeStand()` könnte einen **älteren** Stand tragen als ein zwischenzeitlich empfangenes Ereignis und es überschreiben. *Warum das hier besonders zählt:* Beim Start liegen bereits **Fehlschläge aus Q2** vor (persistent, 9.3.5) – ohne das anfängliche Holen bliebe die Leiste leer, bis zufällig der nächste Auftrag etwas ändert, und ein fehlgeschlagener Render vom Vortag wäre unsichtbar und damit nicht wiederholbar.
- **Der geführte Reparatur-Modus wechselt den Reiter.** Führt die Reparatur eines Aktions-Bildes in den `action-editor` (9.7.5, 9.8.5), wechselt die Shell in den Reiter **Aktionen**, hebt die betroffene Aktion hervor und **kehrt danach zum Reiter Zusammenstellen zurück**, zur nächsten kaputten Stelle. Der Fortschritt „X von N behoben" bleibt dabei **über den Reiterwechsel hinweg** sichtbar – sonst verliert der Nutzer den Faden.
- **Ein Reiterwechsel verwirft nie Arbeit.** Instant-Änderungen sind bereits gesichert (9.5.4); eine offene Vorlagen-**Arbeitskopie** bleibt beim Verlassen des Reiters erhalten (9.12.1) und wird beim Zurückkehren fortgesetzt. Es gibt **keinen** „ungespeicherten Zustand", der beim Wechseln verlorengeht.
- **Undo/Redo gilt im jeweils aktiven Reiter** und arbeitet auf dessen Historie (9.13.2: getrennte Stapel für Projekt-Bearbeitung und Vorlagen-Editor). Ein Reiterwechsel **vermischt** die Historien nicht.
- **Ohne offenes Projekt sind die Reiter Zusammenstellen/Aktionen leer statt kaputt.** Beim Start ohne wiederherstellbares Projekt (9.5.6) landet der Nutzer im Reiter **Projekte**; **Zusammenstellen** und **Aktionen** zeigen dort einen Hinweis mit dem Weg zum Reiter Projekte, keine Fehlermeldung. **Ausgenommen sind Projekte und Vorlagen:** Beide bleiben ohne offenes Projekt **voll benutzbar** – der Reiter Projekte ist die Einstiegsstelle, und die Vorlagen-Bibliothek ist **app-weit** (9.11.1.1), gehört also keinem Projekt. Wer eine Vorlage bauen will, bevor er ein Projekt anlegt, darf das; ein Hinweis dort wäre eine erfundene Abhängigkeit.
- **Die Shell rendert selbst keine Inhalte** – sie ordnet an, wechselt und hält die Warteschlangen-Leiste. Alles Fachliche liegt in den **sechs** Modulen (einschließlich `projekt-verwaltung`, 9.14.3).

#### 9.14.3 Modul `projekt-verwaltung` [Renderer]

**Die Projektverwaltung ist ein eigenes Modul, kein Teil der Shell (bindend).** 9.14.1 belegt den Reiter **Projekte** mit ihr (FA-10); 9.14.2 sagt zugleich, die Shell rendere **selbst keine Inhalte**. Beides zusammen ging nur auf, solange niemand nachfragte, **wem** dieser Reiter gehört. Er gehört dem Renderer-Modul **`projekt-verwaltung`** – dem sechsten.

*Begründung:* Die Projektverwaltung ist **echte Fachlichkeit**, keine Anordnung. Sie führt **fünf** Vorgänge – Projekt **anlegen**, **öffnen**, **duplizieren**, **löschen** und **beschädigte kennzeichnen** –, davon einen mit **Datenverlustrisiko** (`löscheProjekt` entfernt Medien und gerenderte Ausgaben unwiederbringlich, 9.5.2) und einen mit eigener Sonderbehandlung (beschädigte Projekte: Warnhinweis, nicht öffenbar, „Ordner öffnen"). Eine Shell, die das mitträgt, ist nicht mehr der dünne Rahmen, als den 9.14.2 sie beschreibt – und die Invariante „die Shell rendert selbst keine Inhalte" wäre von Anfang an gebrochen gewesen. Getrennt bleibt sie prüfbar: Die Shell hält Reiter und Warteschlangen-Leiste, das Modul hält die Projekte.

**Ist:** die Liste der Projekte (`listeProjekte`, 9.5.2) mit Name, Datum und **Beschädigt-Kennzeichnung**; die Bedienung der fünf Vorgänge über die Operationen des `project-store`; die **Lösch-Bestätigung**, die Name, Medienzahl, Ausgabenzahl und die Unumkehrbarkeit nennt (9.5.2); der Knopf **„Ordner öffnen"** (`öffneProjektordner`, 9.5.2), vor allem beim beschädigten Projekt.

**Ist NICHT:** kein Dateisystem-Zugriff, keine absoluten Pfade (die Pfad-Autorität ist der `project-store`, 9.5.7), keine eigene Reparatur einer defekten `project.json`, kein Verzeichnis-Browser in der App.

**Invarianten (bindend):**

- **Ein beschädigtes Projekt wird gezeigt, aber nicht geöffnet** (9.5.2): sichtbare Kennzeichnung, „Öffnen" deaktiviert, „Ordner öffnen" **aktiv**. Es aus der Liste zu nehmen ist verboten – das ist der einzige Hinweis darauf, dass dort etwas zu retten ist.
- **Kein Löschen ohne die drei Angaben.** Name, Anzahl Medien und Anzahl Ausgabedateien stammen aus `ProjektMeta` (9.5.2) und werden **nicht** in der Oberfläche nachgezählt.
- **Beim Öffnen eines Projekts wechselt die Shell in den Reiter Zusammenstellen** – der Nutzer landet dort, wo er weiterarbeitet, statt in der Liste stehen zu bleiben.
- **Der Reiter Projekte bleibt ohne offenes Projekt voll benutzbar.** Er ist die Einstiegsstelle beim Start ohne wiederherstellbares Projekt (9.14.2, 9.5.6) – als einziger Reiter zeigt er dann keinen Hinweis, sondern Inhalt.

### 9.15 Marken-Verwaltung: `marken-store` [Main] und `marken-editor` [Renderer]

**Richtung:** Renderer → Main (Instant, über den typisierten IPC-Vertrag).
**Fachlich:** „Führe den app-weiten Marken-Bestand (FA-23) und mache ihn bearbeitbar (FA-24) – Farben,
Slogan, Abstände, importierte Logos und Schriften; löse die Ableitung an genau einer Stelle auf."

Bis v3.3 gab es **eine** Marke, gebündelt und nur lesbar, geführt vom `config-store` (9.5.6). Mit FA-23
wird daraus ein Bestand. Zwei Anlässe: **Partner-/Fremdwerbung** (Aktionen tragen die Marke Dritter) und
**Saison-/Kampagnen-Looks** (dieselbe Marke in anderer Anmutung).

#### 9.15.1 `marken-store` [V2]

**Besitzt** `marken.json` (app-weiter Bestand, Abschnitt 6) samt **eigener** Schreib-Serialisierung.
Die Schreib-Invarianten sind **dieselben** wie in 9.5.4: **atomar** (Temp + Rename), **`marken.json.bak`**
als letzte heile Version, **`schemaVersion`**, und Speicherfehler werden **sichtbar** gemacht statt still
verschluckt – über einen **eigenen** Kanal `marken:autoSpeichernStatus`, gleichartig zu
`vorlagen:autoSpeichernStatus` (9.12.1). Ein eigener Kanal ist nötig, weil die Oberfläche „deine Marke
ist nicht gesichert" von „dein Projekt ist nicht gesichert" unterscheiden muss – der Bestand ist app-weit
und hängt nicht am geladenen Projekt.

| Operation | Eingang → Ausgang |
|---|---|
| `listeMarken` | – → `Ergebnis<Marke[]>` – **aufgelöst**, einschließlich abgeleiteter |
| `leseMarke` | `markeId` → `Ergebnis<Marke>` – **aufgelöst** (Vererbung angewandt, 9.11.2) |
| `erstelleMarke` | `name`, `parentId?` → `Ergebnis<Marke>` (`parentId` gesetzt → abgeleitet) |
| `bearbeiteMarke` | `markeId`, `teilwerte` → `Ergebnis<Marke>` – **Auto-Speichern** während des Bearbeitens |
| `importiereMarkenDatei` | `markeId`, `art: "logo"\|"schrift"`, `schriftRolle?`, `quellPfad` → `Ergebnis<Marke>` (kopiert nach `marken-assets/<markeId>/`, 9.15.3) |
| `entferneMarkenDatei` | `markeId`, `art`, `schriftRolle?` → `Ergebnis<Marke>` – zurück auf den geerbten bzw. gebündelten Wert |
| `löscheMarke` | `markeId` → `Ergebnis<void>`; im Fehlerfall Code `marke_referenziert` mit **beiden** Trefferlisten: betroffene **Aktionen** (je mit Projekt) und betroffene **abgeleitete Marken** |
| `pruefeMarkenReferenzen` | `markeId` → `Ergebnis<Markennutzung>` – **rein lesend**: ermittelt über **alle** Projekte, wer die Marke nutzt; speist die Warnung **vor** dem Löschen |

**Invarianten (bindend):**

- **Die Vererbung wird an genau EINER Stelle aufgelöst** – hier. `leseMarke` und `listeMarken` liefern
  **fertige** Marken; kein Aufrufer sieht je eine Teilmenge. **Neunzehn** Issues holen die Marke
  (9.15.4); neunzehn eigene Vererbungslogiken liefen unweigerlich auseinander. Dieselbe Begründung wie
  bei den Farb-Rollen: „**Es gibt genau eine Auflösungsstelle.**" (9.10.9)
- **Löschen blockiert bei Referenz**, es kaskadiert **nicht** – wie bei den Vorlagen (9.12.1). Eine
  Marke steckt in Aktionen **und** möglicherweise in abgeleiteten Looks; eine Kaskade änderte das
  Aussehen vieler Aktionen auf einen Schlag. Geprüft wird über **alle** Projekte, nicht nur das
  geladene.
- **Die eingebaute Marke ist nie löschbar** (`eingebaut: true`): Sie ist der Projekt-Standard und die
  Basis der abgeleiteten Looks. **Bearbeitbar ist sie aber** – anders als die eingebauten Vorlagen, die
  eingefroren sind (9.12.1). *Begründung der Abweichung:* Ändert Fitnessworld24 sein Erscheinungsbild,
  soll das ohne Umweg möglich sein und **in allen abgeleiteten Looks wirken**; ein eingefrorenes
  Original hätte eine Kopie daneben erzeugt und das Original veralten lassen. Preis: Es gibt keinen
  garantierten Urzustand, auf den man zurücksetzen kann.
- **Ableitungsketten sind auf eine Stufe begrenzt** (9.11.2): `erstelleMarke` mit einer `parentId`,
  deren Marke selbst einen Parent hat, wird mit `ungueltige_eingabe` abgewiesen.
- **`schemaVersion` und Migration** wie 9.5.5. **Für den Übergang von v3.3 wichtig:** Die bisher in
  `config.json` geführte Marke war ein **namenloses Wertobjekt**. Die Migration legt daraus die
  eingebaute Marke in `marken.json` an (`eingebaut: true`, `parent: null`, neue `id`), setzt
  `Project.standardMarkeId` und `Aktion.markeId` aller Projekte darauf und entfernt das Feld aus
  `config.json`.
- **Nur der Main** berührt das Dateisystem; der Renderer bekommt Marken über IPC und importierte
  Dateien über das Protokoll (9.15.3).

#### 9.15.2 `marken-editor` [Renderer]

**Fachlich:** Die UI zum Anlegen, Bearbeiten und Ableiten von Marken (FA-24). Sie zeigt die Rollen aus
9.11.2 mit ihren Werten, erlaubt den Import von Logo und Schriften und stellt das Ergebnis über
`template-canvas` dar – **dieselbe** Zeichenroutine wie überall, damit die Vorschau im Editor dem
späteren Segment entspricht (9.10.1).

**Invarianten (bindend):**

- **Rollen sind fest, Werte frei.** Der Editor kann **keine** Rollen hinzufügen oder entfernen – die
  Farb- und Schrift-Rollen aus 9.11.2 sind der Vertrag, auf den **jede** Vorlage verweist (9.11.1
  Punkt 7). Eine fehlende Rolle brächte jede Vorlage zum Stillstand, die sie auflöst.
- **Bei einer abgeleiteten Marke ist sichtbar, was geerbt und was eigen ist.** Ein Wert, den der Nutzer
  nicht setzt, bleibt geerbt und folgt künftigen Änderungen des Parents; ein gesetzter Wert löst sich
  davon. Ohne diese Anzeige wüsste niemand, warum sich eine Farbe „von selbst" geändert hat.
- **Kontrast-Warnung (FA-24):** Der Editor berechnet den Kontrast zwischen Akzentfläche und dem darauf
  liegenden Text und **warnt sichtbar**, ohne die Wahl zu verhindern. *Begründung, warum nicht sperren:*
  Die Akzentfarbe ist seit FA-24 ein freier Wert, damit Partner-Hausfarben darstellbar sind – ein
  Schwellenwert machte genau die unbrauchbar. Die Restverantwortung bleibt beim Nutzer (Risiko R-08).
  **Dieselbe Rechnung** wählt beim Ersatz-Logo automatisch die Textfarbe (9.10.10) – einmal gebaut,
  zweimal genutzt.
- **Löschen fragt vorher.** Vor `löscheMarke` zeigt der Editor das Ergebnis von
  `pruefeMarkenReferenzen`: welche Aktionen in welchen Projekten und welche abgeleiteten Looks
  betroffen sind.
- **Kein Undo für den Marken-Bestand in v1.** Undo/Redo deckt Projekt-Bearbeitung und Vorlagen-Editor
  ab (9.13); der Marken-Editor käme als dritte Historie hinzu. Stattdessen gilt hier der `.bak`-Schutz
  des Stores. *(Bewusste Grenze – wenn sie störend wird, ist es eine eigene Entscheidung.)*

#### 9.15.3 Import von Logos und Schriften – der Bündelungs-Riegel

Bis v3.3 verwiesen `Schrift.datei` und `logo.datei` auf **zur Bauzeit gebündelte** Dateien: genau vier
`.woff2` unter `src/renderer/assets/fonts/`, verpackt als Renderer-Bundle-Assets. Eine vom Nutzer
angelegte Marke hätte dort **keine Datei, auf die sie zeigen könnte**. Deshalb trägt jede Datei-Referenz
jetzt eine **`herkunft`** (9.11.2).

- **Zwei Herkünfte, eine Auflösung.** `gebuendelt` löst auf den Bundle-Pfad auf (die vier OFL-Schriften,
  das Fitnessworld24-Logo), `importiert` auf `marken-assets/<markeId>/`. Der Renderer bekommt
  importierte Dateien über ein **Lese-Protokoll** wie die Projektmedien (`media://`, 9.5.7) und **nie**
  über absolute Pfade. **Genau eine** Stelle löst auf – nicht jede Zonen-Sorte einzeln.
- **Import kopiert.** Die Quelldatei bleibt unberührt, die Kopie gehört der Marke – wie beim
  Medien-Import (9.4.5). Format-Whitelist: **`.woff2`** für Schriften, die Bild-Whitelist (9.4.2) für
  Logos. *Nur `.woff2`, weil die gebündelten Schriften dasselbe Format haben: ein Ladepfad statt zwei,
  und `FontFace` verlangt für andere Formate eigene Behandlung.*
- **Determinismus muss neu erfüllt werden.** 9.10.3 verlangt, dass Schriften **vor** dem Zeichnen
  geladen sind; für die gebündelten erledigt das der Start. Für importierte gilt: Sie werden **je
  Marke** registriert und geladen, **bevor** die erste Zone gezeichnet wird, und der Nachweis aus
  9.10.4 (alle Familien über `document.fonts.check()` verfügbar) gilt für sie mit. Ohne das rendert der
  Canvas still auf eine Fallback-Schrift → **Vorschau ≠ Endvideo und Markenbruch**.
- **Fehlt eine importierte Datei zur Renderzeit, bricht der Render FRÜH ab** – vor dem ersten
  ffmpeg-Aufruf, mit dem Fehlercode `marken_datei_fehlt`. Dieselbe Linie wie `medium_fehlt` (9.4.7)
  und wie das Verbot, einen Platzhalter in den finalen Render zu geben (9.10.7). Ein stiller Rückfall
  zeigte den Markenbruch erst am Fernseher. Der geführte Reparatur-Modus (FA-19, 9.7.5) deckt den Fall
  mit ab: Es ist dieselbe Klasse – eine Referenz zeigt ins Leere.
- **Ablage neben den Daten, nicht im Programmordner.** `marken-assets/` liegt im Datenort (Abschnitt 6).
  So wandern importierte Schriften mit den Daten – bei portabler Auslieferung genau richtig.
- **Lizenzen:** Für importierte Schriften trägt der Nutzer die Rechte (Risiko R-07). Die Anwendung
  brennt sie in ein Video, das weitergegeben und öffentlich gezeigt wird.

#### 9.15.4 Wer die Marke holt – und woher den Kontext

`leseMarke` hatte bis v3.3 **kein Argument**; es gab nur eine Marke. Ab v3.4 braucht jeder Aufrufer eine
`markeId`. **Neunzehn** Issues holen die Marke, alle über `leseMarke` und **keines** über `leseKonfig`:
`#77`, `#112`, `#119`, `#134`, `#139`, `#140`, `#150`, `#154`, `#164`, `#176`, `#177`, `#181`, `#196`,
`#197`, `#216`, `#218`, `#221`, `#239`, `#262`.

Woher der Kontext kommt, ist **nicht** frei wählbar:

| Wer zeichnet | Marke |
|---|---|
| Aktions-Segment (Vollfläche oder Band-Abschnitt) | `aktion.markeId` – die Marke **der Aktion** |
| Band-Hintergrund (Zone `hintergrund` der Einblendung) | `Project.standardMarkeId` |
| Restflächen der Split-Komposition (`flaecheDunkel`) | `Project.standardMarkeId` |
| Vorschau und Vorschaubilder | dieselbe Marke wie beim Render – nie eine andere |

**Rahmen stabil, Inhalt wechselt (bindend).** Band-Hintergrund und Restflächen nehmen die
**Projekt-Standardmarke**, **nicht** die Marke der gerade sichtbaren Aktion. *Begründung:* Rotieren im
Band Aktionen verschiedener Partner, wechselte sonst die Flächenfarbe im Sekundenrhythmus – links und
rechts neben dem Video und im Bandhintergrund. Auf einem 85-Zoll-Schirm ist das unruhig, nicht
professionell, und es widerspräche der Zusage aus Anforderungsdokument 4.1, die genau deshalb auf „**je
Rahmen**" eingeschränkt wurde (4.8). Es ist dieselbe Linie wie beim Ersatz-Logo (9.10.10): Marken-
Identität und Rahmen sind stabil.

#### 9.15.5 Fehlercodes

| Fehlercode | Ursache |
|---|---|
| `marke_referenziert` | Löschen abgelehnt – Aktionen und/oder abgeleitete Marken nutzen sie noch (mit beiden Trefferlisten) |
| `marke_eingebaut` | Löschen der eingebauten Marke versucht |
| `marke_nicht_gefunden` | unbekannte `markeId` |
| `ungueltige_eingabe` | unbekannte Rolle, Ableitungskette länger als eine Stufe, Datei nicht in der Whitelist |
| `marken_datei_fehlt` | importiertes Logo oder importierte Schrift fehlt – **beim Render**, vor dem ersten ffmpeg-Aufruf |
| `speicher_fehler` | `marken.json` nicht schreibbar (Platte voll, Rechte) |

---

> **Stand des High-Level-Designs.** **Ausgearbeitet:** `render-service` (9.2), `auftrags-manager` (9.3), `media-service` (9.4), `project-store`/`config-store` (9.5), `export-service` (9.6), `composer` (9.7), `action-editor` (9.8), `preview-player` (9.9).
>
> **Das High-Level-Design ist damit vollständig.** Alle Modul-Verträge (9.2–9.10, 9.12, 9.14, **9.15**), alle geteilten Datenmodelle (9.11), die Konventionen des IPC-Vertrags (9.1.1) und das Ausgabe-Profil (9.2.4) sind ausgearbeitet.
>
> Geschlossen sind: die Lücken des Prüfbefunds vom 03.07. (Einzel-Instanz 9.5.4, ID-Schema und Konstanten 9.11.4, `RenderProfile` 9.2.4 samt Audio-Entscheidung R-06); die Anforderungsänderung Split-Screen (FA-20: 9.2.8, 9.11.1); Vorlagen-Erstellung und -Bearbeitung (FA-13: 9.12 samt Arbeitskopie-Fluss); Undo/Redo (FA-21: 9.13); das Warteschlangen-Journal Q4 (9.3); und der Aufbau der Oberfläche (9.14).
>
> **Nachgezogen in v3.4 (10.08.2026), vom Auftraggeber entschieden – Anforderungsänderung „Mehrere Marken":**
>
> 1. **Der Marken-Bestand ersetzt die eine gebündelte Marke** – neuer Abschnitt **9.15** (`marken-store` [V2] + `marken-editor`), neue Anforderungen **FA-23**/**FA-24**, neuer Speicher **V2** (Abschnitt 6, DFD, 7.2). *Anlass:* Es wird für Dritte geworben (Partner-Marken) und dieselbe Marke soll in Saison-Anmutungen erscheinen. *Folge ohne die Änderung:* Beides wäre unmöglich – 9.5.6 schloss einen Marken-Editor ausdrücklich aus („ein Marken-Editor ist kein MVP"), und die Marke lag als **namenloses Wertobjekt** in `config.json`, ohne `id`, ohne die Möglichkeit, eine zweite zu führen.
>
> 2. **Marken sind ableitbar (`parent`), und die Vererbung wird an genau EINER Stelle aufgelöst** (9.11.2, 9.15.1). Ein Saison-Look setzt nur die Farben und erbt Schriften, Logo und Abstände; `leseMarke(markeId)` liefert die **fertig aufgelöste** Marke. *Folge ohne die Auflösungsregel:* **Neunzehn** Aufrufer holen die Marke (9.15.4) – jeder hätte die Vererbung selbst gebaut, und sie liefen auseinander. Es ist dieselbe Begründung wie bei den Farb-Rollen („Es gibt genau eine Auflösungsstelle", 9.10.9). Mitentschieden: **Ketten nur eine Stufe tief**, sonst müsste die Referenzprüfung beim Löschen rekursiv über einen Baum laufen statt über eine Liste.
>
> 3. **Rahmen stabil, Inhalt wechselt** (9.15.4, mitgezogen 9.2.8 und 9.9.2). Band-Hintergrund und die Restflächen der Split-Komposition nehmen die **Projekt-Standardmarke** (`Project.standardMarkeId`), **nicht** die Marke der gerade sichtbaren Aktion. *Folge ohne die Festlegung:* Rotieren im Band Aktionen verschiedener Partner, wechselte die Flächenfarbe alle zehn Sekunden – links und rechts neben dem Video und im Bandhintergrund. Auf einem 85-Zoll-Schirm ist das unruhig, nicht professionell. Deshalb gilt die Zusage aus Anforderungsdokument 4.1 („ein fester Markenrahmen sorgt für ein einheitliches Erscheinungsbild") ab v1.3 ausdrücklich **je Rahmen** und nicht mehr für das ganze Video (AD 4.8).
>
> 4. **Die Akzentfarbe wird ein freier Farbwert** (9.8.2, 9.8.4). *Zurückgenommen wird damit:* „Akzentfarbe nur aus der Markenpalette (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus." Grund: Partner-Hausfarben stehen in keiner Palette. Eine Aktion **kann** damit ausbrechen; Gegenmaßnahme ist die **Kontrast-Warnung** (9.15.2), nicht die Sperre – ein Schwellenwert machte genau die Hausfarben unbrauchbar, um die es geht (Risiko R-08).
>
> 5. **Ersatz-Logo für Marken ohne Logo** – neuer Abschnitt **9.10.10**, `Marke.logo` wird `| null`. Bei Partnern ist ein fehlendes Logo der Normalfall. Gezeichnet wird der **Markenname** auf einer Fläche in der **Akzentfarbe der Marke**, in der **gebündelten** Rolle `headlinePlakativ`. *Warum nicht die eigene Schrift der Marke:* Eine Marke ohne Logo hat oft auch keine importierte Schrift, und hätte sie eine, könnte **genau diese Datei fehlen** – dann wäre nicht einmal der Ersatz zeichenbar. *Warum die Marken- und nicht die Aktions-Akzentfarbe:* Ein Logo ist eine Konstante. Sonst blinkte das „Logo" eines Partners in drei Farben, während drei seiner Aktionen rotieren – ein echtes Logo als Bilddatei bliebe unverändert. Zweite Ausnahme in 9.10.9 „Abgrenzung", mit demselben Grund wie die erste. Mitentschieden: Textfarbe **nach gemessenem Kontrast** (dieselbe Rechnung wie die Warnung, einmal gebaut, zweimal genutzt) und **kein `…`** bei langen Namen – ein abgeschnittener Markenname sieht nach Fehler aus, nicht nach Gestaltung.
>
> 6. **Import von Logos und Schriften bricht den Bündelungs-Riegel auf** (9.15.3, mitgezogen 9.10.4, 9.11.2). Datei-Referenzen tragen jetzt eine **`herkunft`** (`gebuendelt` | `importiert`). *Folge ohne die Änderung:* Eine vom Nutzer angelegte Marke hätte **keine Datei, auf die sie zeigen könnte** – #8 legt genau vier `.woff2` ins Bundle, #7 verpackt sie. Mitentschieden: nur **`.woff2`** (ein Ladepfad statt zwei), Ablage **im Datenort** (`marken-assets/`, wandert mit den Daten), Zugriff über ein **Lese-Protokoll** wie `media://` statt über absolute Pfade, und bei fehlender Datei **früher Abbruch** des Renders (`marken_datei_fehlt`) statt stillem Rückfall – der Markenbruch fiele sonst erst am Fernseher auf.
>
> 7. **Die eingebaute Marke ist unlöschbar, aber bearbeitbar** (9.15.1) – anders als die eingebauten **Vorlagen**, die eingefroren sind (9.12.1). *Begründung der Abweichung:* Ändert Fitnessworld24 sein Erscheinungsbild, soll das ohne Umweg möglich sein und **in allen abgeleiteten Looks wirken**; ein eingefrorenes Original hätte eine Kopie daneben erzeugt und das Original veralten lassen. Preis, bewusst in Kauf genommen: Es gibt keinen garantierten Urzustand.
>
> 8. **Löschen blockiert bei Referenz, es kaskadiert nicht** (9.15.1) – wie bei den Vorlagen, geprüft über **alle** Projekte, und zusätzlich über die **abgeleiteten** Marken. *Folge ohne die Prüfung:* Eine Kaskade änderte das Aussehen vieler Aktionen auf einen Schlag; bei den Vorlagen wurde genau das ausgeschlossen.
>
> 9. **Migration von v3.3:** Die bisher in `config.json` geführte, namenlose Marke wird zur **eingebauten** Marke in `marken.json` (`eingebaut: true`, `parent: null`, neue `id`); `Project.standardMarkeId` und `Aktion.markeId` aller Projekte zeigen darauf, und das Feld verschwindet aus `config.json` (9.15.1, mitgezogen 9.5.6). Issue **#265** hatte `marke` aus `AppKonfig` bereits ausdrücklich herausgehalten – der Nachzug im TK fehlte bis hier.

> **Nachgezogen in v3.3 (05.08.2026), beim Bauen von #1 gefunden:** **Der geteilte Renderer-Bereich `gemeinsam` fehlte in der Modulliste (Abschnitt 9).** Sechs Issues schreiben nach `src/renderer/gemeinsam/`, und M7 führt dafür ein eigenes Label – die Liste kannte ihn nicht. *Folge ohne die Änderung:* Die Modulliste ist die **einzige** Autorität für die Ordnerstruktur des Grundgerüsts; #1 baut sein Gerüst gegen genau diese Zeile und wird daran abgenommen. Der Ordner wäre also nicht entstanden, und sechs Issues hätten in ein Verzeichnis geschrieben, das es nicht gibt. Dieselbe Lücke hatte kurz zuvor schon `projekt-verwaltung` getroffen: Der Ordner fehlte, #1 galt trotzdem als erfüllt, und es fiel erst beim Bauen auf.
>
> **Nachgezogen in v3.2 (05.08.2026), vom Auftraggeber entschieden:**
>
> 1. **Die gemeinsame Projekt-Sicht bekommt einen Weg, geleert zu werden** – neue Operation **`leereProjektSicht()`** in 9.7.4, mitgezogen 9.5.2 (`löscheProjekt`) und 9.5.6 (Sitzungswiederherstellung). Sie versetzt die Sicht in den Zustand **„kein Projekt geladen"**; gerufen wird sie, wo ein Projekt aufhört, offen zu sein, ohne dass ein anderes an seine Stelle tritt – vor allem nach dem Löschen des **aktiven** Projekts. *Folge ohne die Entscheidung:* Der Zustand war im Datentyp der Sicht **ausdrücklich vorgesehen**, es gab aber **keine** Operation, die ihn herstellt. Die Oberfläche zeigte nach dem Löschen des aktiven Projekts weiter dessen Liste, Aktionen und Vorschau – **Geisterdaten**, auf die jeder Klick ins Leere läuft, während der Ordner auf der Platte bereits weg ist; der von 9.5.6 verlangte **sanfte Rückfall** auf „kein aktives Projekt / Projektliste" war mit den vorhandenen Mitteln nicht herstellbar. **Ausdrücklich verboten** ist die naheliegende Notlösung, ein **leeres Projekt mit erfundener Kennung** in die Sicht zu setzen: Es sähe richtig aus, aber jede folgende Instant-Operation liefe in `nicht_gefunden` (9.1.1), und das Auto-Speichern (9.5.4) legte womöglich einen Projektordner an, den **niemand angelegt hat**.
>
> 2. **Das Render-Ergebnis trägt den verwendeten Ausgabenamen** – neues Feld **`ausgabeName`** im `RenderResult` bei `status: "erfolg"` (9.2.3, mitgezogen 9.2.5, 9.3.1 und 9.3.6). Es ist der Name **ohne Endung**, genau so, wie er im `RenderRequest` stand. *Folge ohne die Entscheidung:* Der `render-service` setzt bei Erfolg `Project.letzterAusgabeName` in D1 (FA-22), das Auftrags-Ergebnis trug aber nur Pfad, Dateigröße und Gesamtdauer – die Oberfläche erführe vom neuen Namen **nichts** und schlüge beim nächsten Render weiter den alten vor. Der Nutzer überschriebe also nicht die Datei, die er überschreiben wollte, oder legte versehentlich eine zweite an. Der Weg über das Ergebnis ist **eine** Quelle der Wahrheit statt zweier: Merkte sich die Oberfläche den Namen selbst, liefen beide Werte spätestens bei einem **fehlgeschlagenen** Render (D1 unverändert) oder nach einem **Neustart** (Renderer-Zustand weg) auseinander – und der Wert steht **dauerhaft** in Q3. **Nicht** mitgezogen wurde `ProtokollEintrag.ausgabe` (9.3): Es trägt weiterhin nur `pfad`, `dateigroesse` und `gesamtdauer`, denn der Name steckt im Pfad; ein zweites Feld dafür wäre genau die Doppelführung, die schon `historieEintrag` (v2.8) und `position` (9.11.3) entfernt hat.
>
> 3. **`löscheAktion` liefert den vollständigen neuen Stand** – die Rückgabe wird `Ergebnis<{ stand: Bearbeitungsstand, entfernteElementIds, geaenderteElementIds }>` (9.5.2, mitgezogen 9.5.3). Die beiden Kennungslisten **bleiben**: Der `stand` schaltet die Sicht weiter, die Kennungen erklären dem Nutzer die Wirkung („aus 2 Elementen entfernt und aus dem Werbeband von 3 Videos gekürzt") und benennen die hervorzuhebenden Stellen. *Folge ohne die Entscheidung:* 9.13.1 führt „Aktionen: anlegen, bearbeiten, **löschen**" unter „Umfasst", ist also undo-fähig; 9.13.2 verlangt dafür einen Schnappschuss, und der entsteht beim **Übergang der Sicht von einem Stand auf den nächsten**. Aus bloßen Kennungen ist der neue Stand nicht bildbar – der einzige Weg dorthin wäre ein **Neuladen** des Projekts, und das setzt die Sicht an der Schnappschuss-Stelle **vorbei**: Undo wäre gebaut und ausgerechnet für das **versehentliche Löschen** wirkungslos. **Ausdrücklich verworfen** wurde ein zweiter Eingang in die Rückgängig-Verwaltung nur für diesen Fall – eine Ausnahme von der Regel „Schnappschüsse entstehen an genau **einer** Stelle" ist die Art Sonderfall, die in diesem Projekt bisher die teuersten Fehler verursacht hat. Der Typ ist `Bearbeitungsstand` und **nicht** `Projekt`, weil das genau der Ausschnitt ist, den der Schnappschuss ohnehin führt (`aktionen` + `liste`); `assets` und `letzterAusgabeName` gehören nach 9.13.2 nicht hinein und werden von `löscheAktion` auch nicht angefasst.
>
> **Nachgezogen in v3.1 (04.08.2026), vom Auftraggeber entschieden und beim M7-Zuschnitt gefunden:**
>
> 1. **Rückgängig/Wiederherstellen bekommt einen eigenen Rückschreib-Weg** – neue Instant-Operation **`setzeBearbeitungsstand`** (`stand` → `Ergebnis<Projekt>`) in 9.5.2, mitgezogen 9.13.2. Sie ersetzt `aktionen` **und** `liste` **als Ganzes** durch einen Schnappschuss, unter dem D1-Lock und **voll validiert** (jede Referenz auflösbar, jede Dauer im Bereich, jede `art` gültig, `id`s eindeutig). *Folge ohne die Entscheidung:* 9.13.2 verlangt schnappschuss-basiertes Undo und verbietet inverse Operationen ausdrücklich – „eine falsch implementierte Umkehrung ist eine stille Fehlerquelle, ein Schnappschuss ist trivial korrekt". Die Operationsliste 9.5.2 ist aber feingranular, und für **zwei** in 9.13.1 ausdrücklich unter „Umfasst" geführte Fälle gab es **keinen** Rückweg: `entferneElement` (die naheliegende Umkehrung `fügeElementHinzu` vergibt eine **neue** UUID und hängt ans Ende – Position und Identität sind weg) und `löscheAktion` (die Kaskade aus 9.5.3 entfernt Listenelemente **und** Band-Abschnitte; nichts davon ist zurückschreibbar). FA-21 ist ein **Muss** und wäre genau für das versehentliche Löschen unerfüllbar geblieben; ein Agent hätte die Lücke mit eben den verbotenen inversen Operationen geschlossen. **Ausdrücklich NICHT enthalten:** `assets` und `letzterAusgabeName` – beide werden von **Aufträgen** verändert (Import, Löschen, Render), und Aufträge sind nach 9.13.3 grundsätzlich nicht undo-fähig. Ein Undo, das sie mitzöge, ließe ein importiertes Medium aus dem Datenbestand verschwinden, während seine **Datei weiter auf der Platte liegt** – eine Waise, die der Reconcile still löscht (9.4.7). Undo nimmt denselben Pfad wie eine normale Änderung, damit das Auto-Speichern anspringt (9.13.2).
>
> 2. **Scheitert der Sofort-Flush beim BEENDEN, schließt die App nicht** (9.5.4). Festgelegt ist die Reihenfolge: (1) die App schließt **nicht**, die Änderungen bleiben im Speicher; (2) der Fehler wird mit einer **auf die Ursache zugeschnittenen Handlungsempfehlung** gezeigt („Die Platte ist voll. Schaffen Sie Platz und versuchen Sie es erneut." / „Der Speicherort ist nicht erreichbar. Stecken Sie den Datenträger wieder ein."); (3) ein Knopf **„Erneut versuchen"** stößt den Schreibversuch neu an; (4) daneben der ausdrücklich benannte Ausweg **„Trotzdem schließen und Änderungen verwerfen"**. *Folge ohne die Entscheidung:* 9.5.4 sagte nur, die App blockiere bis zum Abschluss des Schreibvorgangs – über den **Fehlschlag** stand nirgends etwas. Ein stilles Schließen widerspricht der zugesagten Verlustfreiheit (FA-15, NFA-02): Der Nutzer beendet normal und findet beim nächsten Start einen alten Stand vor. Ein bloßes Blockieren ohne Ausweg lässt ihn vor einem Programm sitzen, das sich nicht mehr schließen lässt. Der eigentliche Wert ist der **Wiederholen-Knopf**: Die häufigsten Ursachen – volle Platte, abgezogener Datenträger – behebt der Nutzer in einer Minute, und dann muss er **nichts** verlieren.
>
> 3. **Das Löschen eines Projekts nennt vorher, was verschwindet** (9.5.2, mitgezogen 9.14.3). Die Bestätigung nennt **Projektname**, **Anzahl der Medien**, **Anzahl der gerenderten Ausgabedateien** und die **Unumkehrbarkeit**. Dafür trägt `ProjektMeta` zwei neue Felder – **`anzahlMedien`** und **`anzahlAusgaben`** –, beide **aus dem Ordner gezählt**, nicht aus `project.json`. *Folge ohne die Entscheidung:* Der Projektordner enthält **alle** importierten Medien und **alle** fertigen Ausgabedateien; 9.13.3 schließt Undo für Vorgänge mit Dateiwirkung aus, der Ordner ist danach weg. Eine schlichte Ja/Nein-Abfrage verschweigt genau die **Tragweite** – sie sieht bei einem leeren Probeprojekt aus wie bei drei Wochen Arbeit. Die Ordner-Zählung ist Pflicht, weil die Zahlen auch für ein **beschädigtes** Projekt stimmen müssen, dessen `project.json` unlesbar ist – dort ist „ist da noch etwas zu retten?" die eigentliche Frage.
>
> 4. **Ein beschädigtes Projekt bietet „Ordner öffnen" an** – neue Operation **`öffneProjektordner`** (`projektId` → `Ergebnis<void>`) in 9.5.2, eigener Kanal `project:öffneProjektordner`, angeboten in 9.14.3. Sie gehört zum `project-store`, weil er die **Pfad-Autorität** ist (9.5.7). *Folge ohne die Entscheidung:* Der Sinn der v3.0-Entscheidung (beschädigtes Projekt mit Warnhinweis **listen** statt weglassen) war, dass der Nutzer **erfährt**, dass in dem Ordner etwas zu retten ist. Ohne einen **Weg dorthin** bliebe es bei dieser Information: Den Ablageort der portablen Anwendung kennt er typischerweise nicht, und die App zeigt ihm absichtlich nirgends einen absoluten Pfad (9.5.7). Im Renderer wäre die Operation nicht baubar – er kennt keine Pfade.
>
> 5. **Die Bandgeometrie-Rechnung wandert in den geteilten Bereich** – **`berechneBandGeometrie(höhe) → BandGeometrie`** (Abschnitt 9 Modulübersicht, Invariante in 9.2.8, mitgezogen 9.9.2). Die **reine** Rechnung (Videofläche, eingepasste Breite mit Vierer-Abrundung, Versätze, Bandposition) wird von **Vorschau und `render-service` gemeinsam** benutzt; die **Prüfung** (zulässige Höhe, Fehlercode `ungueltiges_element`) bleibt im `render-service`. *Folge ohne die Änderung:* 9.9.2 verlangt seit je, dass die Vorschau „die Geometrie nach derselben Formel" rechnet wie 9.2.8 – die Rechnung lag aber im Main, und der Renderer darf dort nicht importieren (9.1). Ein Agent hätte sie **abgeschrieben**, und der Fehler wäre **unsichtbar** geblieben: Bei der eingebauten Band-Vorlage (H = 162) geht die Vierer-Abrundung **zufällig** auf (1632), sie ändert dort nichts. Auseinandergelaufen wären Vorschau und fertiges Video erst bei **eigenen** Vorlagen – beim Nutzer, nicht beim Entwickler.
>
> 6. **Der `vorlagen-store` bekommt das Melde-Ereignis für Speicherfehler** – Kanal **`vorlagen:autoSpeichernStatus`**, gleichartig zu `project:autoSpeichernStatus` (9.12.1, mitgezogen 9.5.4, wo der Kanalname des `project-store` jetzt ausgeschrieben steht). *Folge ohne die Änderung:* 9.12.1 sagte, die Schreib-Invarianten seien „dieselben wie in 9.5.4 … und Speicherfehler werden **sichtbar** gemacht statt still verschluckt" – es gab dafür aber **weder Ereignis noch Kanal**, die Zusage war nicht umsetzbar. Das Speichern der Arbeitskopie läuft entprellt und **ohne Aufruf** aus dem Renderer; es gibt also keine Antwort, an die sich eine Meldung hängen könnte. Eine über Minuten gebaute Vorlage wäre **lautlos** verlorengegangen. Ein **eigener** Kanal ist nötig, weil die Oberfläche „dein Projekt ist nicht gesichert" von „deine Vorlage ist nicht gesichert" unterscheiden muss – die Vorlagen-Bibliothek ist app-weit und hängt nicht am geladenen Projekt.
>
> 7. **Die Projektverwaltung ist die sechste Renderer-Oberfläche** – neues Modul **`projekt-verwaltung`** (Modulübersicht Abschnitt 9, Vertragsabsatz 9.14.3, mitgezogen 9.14 Einleitung, 9.14.1 Skizze und 9.14.2: „fünf" → „sechs"). *Folge ohne die Änderung:* 9.14.1 belegte den Reiter „Projekte = Projektverwaltung (FA-10)", 9.14.2 sagte zugleich „Die Shell rendert selbst keine Inhalte … Alles Fachliche liegt in den **fünf** Modulen" – und die Projektverwaltung war keins davon. Der Widerspruch hätte die Fachlichkeit in die Shell wandern lassen, obwohl es echte Fachlichkeit mit **fünf** Vorgängen (anlegen, öffnen, duplizieren, löschen, beschädigte kennzeichnen) und einem **Datenverlustrisiko** ist; ein Rahmen, der so etwas mitträgt, ist nicht mehr die dünne Schicht, als die 9.14.2 ihn beschreibt.
>
> 8. **Ereignisse vor dem Aufbau des Fensters verfallen still – es wird nicht gepuffert** (9.1.1 Punkt 10, mitgezogen 9.14.2 für die Warteschlangen-Leiste). Stattdessen holt die Oberfläche beim Aufbau **einmal den vollständigen Stand** (für die Warteschlange: `holeStand()`, 9.3.4) und **abonniert erst danach**. *Folge ohne die Änderung:* v3.0 legte fest, dass es genau ein Fenster gibt und jedes Ereignis dorthin geht – offen blieb, was mit Meldungen geschieht, die **vor** dem Laden anfallen. Ein Puffer müsste zwei Fragen beantworten, die niemand beantworten kann, ohne zu raten: **wie lange** er hält und **was er bei Überlauf verwirft** – ein verworfenes `queue:geaendert` hinterlässt eine dauerhaft falsche Anzeige. „Erst holen, dann abonnieren" ist die einzige Reihenfolge, die **keine Lücke** lässt; die umgekehrte überschriebe ein bereits empfangenes Ereignis mit einem älteren Stand. Ohne das anfängliche Holen bliebe die Warteschlangen-Leiste beim Start leer, obwohl **Fehlschläge aus Q2** (persistent, 9.3.5) vorliegen – ein fehlgeschlagener Render vom Vortag wäre unsichtbar und nicht wiederholbar.
>
> **Nachgezogen in v3.0 (04.08.2026), vom Auftraggeber entschieden:**
>
> 1. **Die Akzentfarbe einer Aktion ersetzt die Akzent-Rollen ihrer Vorlage** (9.10.9 neu, mitgezogen 9.10.1, 9.11.1 Punkt 7, 9.8.2, 9.8.4). Löst eine Zone eine der drei Akzent-Rollen `akzent`, `akzentKraeftig`, `akzentTief` (9.11.2) auf, liefert die Auflösung den Wert aus `aktion.akzentfarbe` statt des Markenwerts; alle übrigen Rollen bleiben unberührt, und ohne gesetzte Akzentfarbe gilt der Markenwert. *Folge ohne die Entscheidung:* `aktion.akzentfarbe` war seit 9.8.2 im Datenmodell und in FA-12 versprochen, hatte aber **keine Wirkung** – die Vorlage nennt Farben nur als Rollen (9.11.1 Punkt 7), und die Zeichenroutine reichte die Aktion nie an die Zonen-Auflösung weiter. Der Nutzer hätte eine Farbe gewählt und im Segment nichts davon gesehen; ein Agent hätte die Lücke lokal geschlossen – der eine im `action-editor`, der nächste in `template-canvas`, ein dritter gar nicht. Mitentschieden, weil es sonst sofort wieder offen wäre: `akzentfarbe` ist **`string | null`** (ohne Nullbarkeit gäbe es den zugesagten Zustand „nicht gesetzt" nicht), `flaecheAkzentZart` gehört **nicht** zu den Akzent-Rollen (es ist trotz des Namens eine Flächen-Rolle), es gibt **genau eine** Auflösungsstelle (sonst wirkt die Farbe in der Pille, aber nicht im Verlauf dahinter), und eine Vorlage darf sich **nicht** auf den Kontrast **zwischen zwei** Akzent-Rollen verlassen – nach der Ersetzung tragen alle drei denselben Wert, ein Text in `akzentTief` auf einer Fläche in `akzent` wäre unsichtbar. Unberührt bleibt der `render-service`: Die Restflächen der Split-Komposition tragen `flaecheDunkel` (9.2.8) – keine Akzent-Rolle –, er braucht also weiterhin **keine** Kenntnis von Aktionen.
> 2. **Die Nutzung einer Vorlage wird vor dem Überarbeiten und vor dem Löschen angezeigt** – neue lesende Operation `pruefeVorlagenReferenzen` (`id` → `Ergebnis<Vorlagennutzung>`) in 9.12.1, mitgezogen 9.12.2. Sie liefert die Treffer **namentlich** (Aktionen und Listenelemente, je mit Projekt), verändert nichts und bekommt den eigenen Kanal `vorlagen:pruefeVorlagenReferenzen`. *Folge ohne die Entscheidung:* 9.12.2 verlangte die Anzeige („wird von 7 Aktionen in 2 Projekten verwendet"), die Operationsliste 9.12.1 kannte aber **keine** Operation dafür – die Zählung existierte nur intern als Sperre beim Löschen und war von der Oberfläche aus **nicht erreichbar**. Eine Vorlage ist app-weit: Ihr Überarbeiten ändert das Aussehen von Aktionen in Projekten, die gerade **gar nicht offen** sind, und der Merge ist ein vollständiges Ersetzen (9.12.1) – der Nutzer hätte blind entschieden. Beim gescheiterten Löschen stünde er vor einem bloßen „geht nicht", ohne zu erfahren, wo aufzuräumen wäre. Der Rückgabetyp `Vorlagennutzung` ist **nicht neu**: Es ist derselbe, den `vorlage_referenziert` als `fehler.daten` trägt (9.1.1) – ein zweiter Typ hätte zwei Zählungen bedeutet, die auseinanderlaufen.
> 3. **Die App hat genau ein Fenster, und jedes Ereignis geht an dieses eine Fenster** (9.1.1 Punkt 10 neu, mitgezogen 9.2.7, 9.3.4, 9.5.4). *Folge ohne die Entscheidung:* Für **jedes** Main→Renderer-Ereignis (`render:fortschritt`, `queue:geaendert`, die Auto-Speichern-Meldung) wäre offen geblieben, **wen** der Sender adressiert – jeder Agent hätte es anders gelöst, vom festgehaltenen Fenster-Handle bis zur Rundsendung an alle Fenster, und ein minutenlanger Render meldete seinen Fortschritt womöglich ins Leere. Die erste Stufe ist ein Studio, ein Bildschirm, ein Laptop: Ein zweites Fenster hätte keine Aufgabe, brächte aber sofort die Fragen mit, wer den Abbruch auslösen darf und was ein geschlossenes Fenster während eines laufenden Auftrags bedeutet. Käme später ein zweites Fenster, ist die Nachbesserung überschaubar und liegt an den Verdrahtungsstellen – sie wird dann **bewusst** gemacht, statt vorsorglich mitgeschleppt zu werden. Nicht zu verwechseln mit der Einzel-Instanz-Sperre (9.5.4): Jene verhindert einen zweiten **Prozess**, diese legt fest, dass der eine Prozess **ein Fenster** führt.
> 4. **Ein Projekt mit beschädigter `project.json` wird mit Warnhinweis gelistet, nicht weggelassen** (9.5.2, `listeProjekte`). `ProjektMeta` trägt dafür das Feld **`beschaedigt: boolean`**; der Eintrag erscheint mit dem **Ordnernamen** als Behelfs-Bezeichnung und lässt sich nicht öffnen. *Folge ohne die Entscheidung:* Ein weggelassenes Projekt sieht für den Nutzer aus wie ein **verlorenes** – er finge neu an, obwohl seine Medien und seine gerenderten Ausgaben unversehrt im Ordner liegen. Es wäre zudem der einzige Ort im System, an dem ein Datenfehler **ohne jede Meldung** verschwindet, gegen 9.1.1 Punkt 7. Sichtbar mit Warnung ist die ehrlichere und die reparierbare Variante. **Mitentschieden:** `listeProjekte` **nimmt das D1-Lock, obwohl sie nur liest** – ein Verzeichnis-Scan während einer laufenden `dupliziereProjekt` (die den Zielordner schrittweise aufbaut) läse sonst ein Projekt in einem **halbkopierten** Zwischenzustand ein und meldete es als beschädigt, obwohl es Minuten später vollständig in Ordnung ist. Damit ist sie die bewusste Ausnahme gegenüber `listeAusgaben`, die ohne Lock läuft (9.5.2).
>
> **Nachgezogen in v2.9 (04.08.2026), beim Prüflauf der M6-Issues gefunden:**
>
> 1. **`speicher_fehler` ist der siebte Fehlercode des `export-service`** (9.6.4). Der Sofort-Flush von D1 läuft seit v2.8 als **erster Schritt im `export`-Handler** (9.3.3, 9.5.4); scheitert er, hatte der als **vollständig** geführte Satz aus 9.6.4 keinen passenden Code – `schreib_fehler` meint dort ausdrücklich das **Kopieren**, die übrigen fünf betreffen das **Ziel**, der Flush aber den **Datenort**. *Folge ohne die Änderung:* Der Export hätte einen realen, benennbaren Fehler als `unbekannter_fehler` oder – schlimmer – unter einem selbst erfundenen Namen gemeldet. Der Render-Pfad kennt für dieselbe Ursache längst `speicher_fehler` (9.2.3), der `media-service` ebenso (9.4.9); zwei Namen für eine Sache zwängen die Oberfläche zu zwei Meldungstexten und zwei Zweigen, und der Code steht **dauerhaft** in Q3. Mitgezogen: 9.2.3 nennt den gescheiterten Flush jetzt ausdrücklich mit – seine Beschreibung war auf Fehler **am Ziel** verengt und deckte den Fall im Render-Handler streng gelesen selbst nicht ab.
> 2. **Bandhöhen müssen gerade sein** (Invariante 9.2.8, Datenmodell 9.11.1 Punkt 8, **Sperre** im Editor 9.12.2, Abweisung im Store 9.12.1, zusätzliche Render-Prüfung 9.2.3 / Feldbeschreibung 9.2.2). Das Ausgabe-Profil verlangt `yuv420p` (9.2.4); dieses Pixelformat tastet die Farbe in beiden Richtungen um den Faktor zwei unter und verlangt deshalb gerade Höhen **und** gerade Versätze. *Folge ohne die Änderung:* Bei ungerader Bandhöhe `H` bricht **jede** der beiden Kompositionsarten aus 9.2.8 – bei `split` ist die Videofläche `1080 − H` ungerade, bei `einblendung` liegt das Overlay bei `y = 1080 − H` auf einer ungeraden Zeile. Der Nutzer erführe das erst **beim Render**, nachdem er die Vorlage fertig gebaut hat, und der Fehler käme aus einer Filterkette statt von der Stelle, an der die Zahl eingegeben wurde. Die eingebaute Band-Vorlage (`höhe: 162`) und die Beispielrechnungen in 9.2.8 und 9.11.2 sind bereits geradzahlig – die Lücke war deshalb unauffällig.
>
> 3. **Die Split-Videobreite wird auf ein Vielfaches von 4 abgerundet** (9.2.8). *Folge ohne die Änderung:* Die gerade Bandhöhe aus Punkt 2 rettet die Split-Geometrie nur scheinbar – (1080 − H) × 16/9 ist bei den meisten geraden H **nicht** ganzzahlig, und der zentrierte x-Versatz wäre selbst bei gerader Breite oft ungerade. `yuv420p` verlangt beides gerade; der Agent hätte die Rundung selbst erfunden, in drei Dateien unterschiedlich, und die eingebaute Vorlage (H = 162) hätte den Mangel verdeckt, weil sie als einzige zufällig aufgeht.
>
> **Nachgezogen in v2.8 (04.08.2026), beim Zuschnitt der M6-Issues gefunden:**
>
> 1. **Das Staging der fertigen Ausgabedatei wandert aus `<Temp>` in den Projekt-Ausgabeordner** (Abschnitt 4/6, 7.2/7.3, 9.2.5, 9.2.6): `ffmpeg` schreibt nach `projects/<id>/output/<name>.mp4.part` und benennt **im selben Ordner** um. *Folge ohne die Änderung:* Umbenennen ist nur auf **derselben Partition** unteilbar; die App ist portabel, ihr Datenort kann auf einem anderen Laufwerk liegen als `<Temp>`. Der abschließende `rename` wäre dann ein `EXDEV`-Fehler, und der naheliegende Ausweg „kopieren und löschen" hebt die Schutzzusage aus FA-22 / Akzeptanzkriterium 9 auf – ein Absturz beim Kopieren zerstört die letzte funktionierende Ausgabedatei. Beim Entwickeln fiele das **nie** auf, weil dort Temp und Daten auf derselben Platte liegen. Mitgezogen: Abbruch und Fehlschlag räumen jetzt **auch** die `.part`-Datei weg (9.2.3, 9.2.7), und `listeAusgaben` darf sie nicht listen (9.5.2).
> 2. **`einblendung` im `RenderItemVideo` trägt `art` und `höhe`** (9.2.2, 9.2.8). *Folge ohne die Änderung:* 9.3.5 friert den Render-Eingang beim Einreihen ein – schlüge der Main die Band-Vorlage erst beim Start nach, wäre er es **nicht**. Eine zwischenzeitliche Vorlagenänderung ließe die bereits gezeichneten Band-PNGs (1920 × H) nicht mehr zur nachgeschlagenen Höhe passen: verzerrtes oder falsch platziertes Band im fertigen Video. Zusätzlich entfällt damit eine Abhängigkeit `render-service` → `vorlagen-store`. 9.2.8 sagt jetzt, dass die Art beim **Einreihen** aus der Vorlage abgeleitet und im Auftrag **mitgeführt** wird.
> 3. **`historieEintrag` ersatzlos gestrichen** (9.2.3, 9.2.5, 9.3.6). Das `RenderResult` liefert Pfad, Größe und Gesamtdauer; den Q3-Eintrag baut die Auftragsverwaltung selbst (9.3). *Folge ohne die Änderung:* zwei Quellen für dieselbe Information laufen auseinander – und **Q3 ist dauerhaft**, ein doppelt geführtes Datum darin bliebe für immer falsch. Dieselbe Regel entfernte schon das `position`-Feld (9.11.3). Nebenbefund beim Streichen: 9.2.3 behauptete, bei Fehler und Abbruch entstehe „**kein** Historie-Eintrag" – das widersprach 9.3 („ein Eintrag je **beendetem** Versuch"). Jetzt steht dort ausdrücklich, dass Q3 auch Fehlschlag und Abbruch protokolliert und nur `ausgabe` `null` bleibt.
> 4. **`ausgabe.gesamtdauer` wird `number | null`** (9.3). Beim `export` ist sie `null` – er kopiert eine fertige Datei und kennt ihre Spieldauer nicht; sein Zielpfad steht im Feld `pfad`. *Folge ohne die Änderung:* entweder zwei Formen von `ausgabe` oder eine erfundene Dauer im dauerhaften Protokoll. Mitgezogen: 9.6.1 stellt klar, dass das Export-Ergebnis den **vollständigen Pfad der Zieldatei** trägt, nicht nur den Zielordner.
> 5. **Der Sofort-Flush vor Render/Export wird vom MAIN ausgelöst, und zwar als erster Schritt IM HANDLER** – nach dem Statuswechsel, bevor der Handler arbeitet (9.5.4, 9.3.3). Der Torwächter selbst darf ihn **nicht** auslösen: Sein Auswahl- und Statuswechsel-Abschnitt ist bewusst synchron, und ein `await` darin bräche die serielle Invariante lautlos. *Folge ohne die Änderung:* Die Schlange ist streng seriell, zwischen Einreihen und Start können Minuten liegen; ein Flush beim Einreihen schriebe einen überholten Stand fest und verlöre bei einem Absturz genau die Arbeit dazwischen. Die Formulierung „vor jedem Render/Export" ließ zudem offen, **wer** auslöst – jeder Agent hätte es anders gebaut.
> 6. **„Verifiziert" ist jetzt definiert** (9.2.6): einmal `ffprobe` auf die fertige Datei, Prüfung gegen das Ausgabe-Profil (Dauer im erwarteten Rahmen, 1920 × 1080, 30 fps, `yuv420p`, Tonspur vorhanden); erst danach ersetzt sie die vorherige Fassung, sonst `ffmpeg_fehler`. *Folge ohne die Änderung:* 9.2.6 verlangte eine „fertige und **verifizierte**" Datei, ohne zu sagen, was das heißt – in der Praxis wäre daraus eine Existenzprüfung geworden. Das ist die **einzige** Stelle, an der ein stiller Encoder-Fehler auffällt, bevor die letzte funktionierende Datei überschrieben wird und die Datei ungeprüft auf den Fernseher geht.
> 7. **Die Restflächen der Split-Komposition tragen die Farb-Rolle `flaecheDunkel`** (9.2.8, mitgezogen 9.2.4 und 9.9.2), geholt über die Marke (`leseMarke`; seit v3.4 im `marken-store`, 9.15.1, und aus der **Projekt-Standardmarke**, 9.15.4), **nie** als Hexzahl in einer Filterkette. *Folge ohne die Änderung:* „dunkle Markenfarbe" ist keine Angabe – bei zwölf Farb-Rollen (9.11.2) hätte jeder Agent eine andere gewählt, und Render und Vorschau wären auseinandergelaufen. `flaecheDunkel` ist in 9.11.2 ausdrücklich „Segment- und **Band**-Hintergrund"; damit sind Band und Seitenflächen dieselbe Fläche.
> 8. **Das Ereignis `render:fortschritt` wird ausdrücklich als anzumeldender Kanal geführt** (9.2.7, 9.1.1 Punkt 4). *Folge ohne die Änderung:* 9.1.1 nannte es nur als Namens-**Beispiel**; die Nutzlast war seit je vollständig definiert und der Empfänger im Renderer vorhanden – gefehlt hätte allein der Sender, und ein minutenlanger Render liefe ohne jede Rückmeldung. Die Warteschlange behält daneben ihren groben Prozentwert (`Auftrag.fortschritt`, 9.3.6).
> 9. **Der `render-service` hat jetzt eine geschlossene Fehlercode-Tabelle** (9.2.3), im Stil von 9.4.9 und 9.6.4: `medium_fehlt`, `ungueltiges_element`, `ungueltige_eingabe`, `ffmpeg_fehler`, `kein_platz`, `speicher_fehler`, `unbekannter_fehler`; **`abgebrochen` ist kein Fehlercode**, sondern ein Status. *Folge ohne die Änderung:* Das TK nannte drei Codes „z. B." – ein offener Satz an genau der Stelle, an der 9.1.1 Punkt 3 einen **geschlossenen, typisierten** verlangt; jeder Agent hätte eigene Codes erfunden. Ergänzt ist außerdem der Transportweg der betroffenen Element-ID: `fehlerhaftesElementId` → **`Auftrag.fehler.daten = { elementId }`** (9.1.1). Ohne ihn erreichte die ID die Oberfläche **nie**, obwohl 9.2.1 die `RenderItem.id` genau damit begründet und der Reparatur-Modus (FA-19) die Stelle benennen muss.
>
> **Nachgezogen in v2.7 (04.08.2026), beim Prüflauf der M5-Issues gefunden:** Zwei Operationen des `project-store` fehlten in der als vollständig geführten Liste 9.5.2. (1) **`setzeEinblendung`** – 9.7.2 verlangt sie ausdrücklich („Band-Vorlage wählen, Abschnitte hinzufügen/ordnen/entfernen"), die Operationsliste kannte sie nicht; damit wäre FA-20 (Split-Screen) gar nicht bedienbar gewesen. (2) **`setzeElementReferenz`** – 9.7.5 nennt als Fix-Optionen des Reparatur-Modus „neu verknüpft/importiert, **ersetzt** oder entfernt", es gab aber **keine** Operation, die `Listenelement.ref` umsetzen kann. Von drei Fix-Optionen war nur „entfernen" ausführbar, und FA-19 samt Akzeptanzkriterium 7 war unerfüllbar. Verschärfend: Ein Neuimport vergibt eine **neue** UUID (9.4.4), das Element hätte also weiter auf das fehlende Asset gezeigt. Der Zielbestand folgt der `art` des Elements – bei `segment` ist die Referenz eine **Aktions**-ID, nicht eine Asset-ID. Beide Operationen brauchen einen Kanal; 9.1.1 Punkt 4 gilt unverändert.
>
> **Nachgezogen in v2.6 (03.08.2026), beim Prüflauf der M3-Issues gefunden:** Das automatische Speichern ist **entprellt** (3–5 s), 9.4.5 Schritt 4 verlangte aber „anhängen **und schreiben**" – beides zusammen ging nicht, und der Fehlercode `speicher_fehler` (9.4.9) war auf beiden Wegen **unerreichbar**: Der Auftrag hätte Erfolg gemeldet und wäre Sekunden später still gescheitert. Aufgelöst durch einen vierten Eintrag in der bestehenden Sofort-Flush-Liste (9.5.4): **Ein Auftrag, der D1 verändert, schreibt am Ende sofort.** Die Entprellung bleibt für Bearbeitungen unverändert – sie fängt Slider-Ziehen ab, nicht Aufträge. Nebeneffekt: „D1 zuerst, Datei danach" (9.4.6) gilt jetzt auch **über einen Absturz hinweg**.
>
> **Nachgezogen in v2.5 (03.08.2026), beim Zuschnitt der M3-Issues gefunden:** (1) **Strukturierte Fehlerdaten** (`fehler.daten`, 9.1.1) – `asset_referenziert` musste laut 9.4.9 die betroffenen Listenelemente nennen, konnte sie aber nirgends transportieren; damit war der geführte Reparatur-Modus (FA-19) nicht bedienbar. (2) **`Auftrag.ergebnis`** (9.3.1) – das Auftrags-Ergebnis („der fertige `Asset`", 9.4.3) hatte keinen Weg zur Oberfläche; ein Import wäre unsichtbar geblieben. (3) **`ffprobe` wird mitgeliefert** (Abschnitt 3, 9.4.5) – `ffmpeg-static` enthält es nicht, der Import braucht es für Maße und Dauer. (4) **`versuche` steigt beim Start** statt beim Wiedereinreihen (9.3.1/9.3.3/9.3.4/9.3.5, vom Auftraggeber entschieden). (5) **`pendingDeletions` speichern den `dateiname`**, nicht den absoluten Pfad (9.4.6) – die App ist portabel. (6) **`speicher_fehler` bei `löscheMedium`** ergänzt (9.4.9) – der D1-Schreibfehler beim Entfernen des Eintrags war real möglich (volle Platte), aber in der als vollständig geführten Fehlercode-Tabelle nicht vorgesehen; die Lücke fiel erst auf, als der Fachdienst-Fehlercode typisiert durchgereicht wurde.
>
> **Nachgezogen in v2.4 (03.08.2026), beim Zuschnitt der M2-Issues gefunden:** (1) **`pendingDeletions` sind keine Aufträge** – 9.3 hat sie zum automatischen Neu-Einreihen beim Start erklärt, was 9.4.6/9.4.7 widerspricht und deterministisch mit `asset_nicht_gefunden` gescheitert wäre; die Auftragsverwaltung **verwahrt** sie jetzt nur, ausgeführt werden sie vom Reconcile des `media-service` (9.3, 9.4.7). (2) **`listeAusgaben` (9.5.2) ergänzt** – die Ausgabe-Liste (FA-22) und die Dateiauswahl beim Export (9.6.1) hatten **keine** Datenquelle; das Auflisten des Ausgabeordners gehört zur Pfad-Autorität (9.5.7).
>
> **Nächster Schritt – nur nach ausdrücklicher Freigabe:** Überführung in agent-taugliche Tasks. Bis dahin gilt weiter die Planungsphase (kein Code).
