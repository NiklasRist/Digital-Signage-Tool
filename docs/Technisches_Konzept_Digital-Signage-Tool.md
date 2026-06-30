# Technisches Konzept – Digital-Signage-Tool

**Projekt:** Digital-Signage-Tool für das Fitnessstudio der Baller Gruppe
**Bezug:** Anforderungsdokument v0.5 (das „Was")
**Inhalt dieses Dokuments:** das „Wie" – Architektur, Datenbestand, Datenfluss, Module
**Version:** 0.2 (Arbeitsstand)
**Datum:** 30.06.2026
**Status:** In Planung

---

## 1. Zweck und Einordnung

Dieses Dokument beschreibt die technische Umsetzung. Die fachlichen Anforderungen (Funktionen, Regeln, Ausgabe-Profil) stehen im Anforderungsdokument v0.5 und werden hier nicht wiederholt, sondern referenziert. Es ist ein lebendes Planungsdokument: Datenbestand und Datenfluss sind festgelegt, das High-Level-Design (Module + Schnittstellen) folgt in Abschnitt 9.

## 2. Architektur-Überblick

Die Anwendung ist eine **Electron-Desktop-App** (portable, Windows + macOS). Sie besteht aus zwei Laufzeit-Bereichen, verbunden über IPC:

- **Renderer (React-UI):** Medienliste, Drag-and-drop, Aktions-Editor, Vorschau, Canvas-Rendering der Segmente.
- **Main-Prozess (Node):** Orchestrierung, Dateisystem, Projektspeicher, Aufruf des gebündelten `ffmpeg`.

Der Main-Prozess ist der einzige Bereich mit `ffmpeg`- und Dateisystem-Zugriff. Begründung der Entkopplung vom Fernseher: Anforderungsdokument, Abschnitt 3.

## 3. Technologie-Stack (entschieden)

| Bereich | Wahl |
|---|---|
| Sprache | TypeScript |
| Laufzeit/Shell | Electron (portable Auslieferung, Win + macOS) |
| UI | React + Vite |
| Reihenfolge (DnD) | dnd-kit |
| Segment-Rendering | HTML5-Canvas → PNG |
| Video/Encoding | gebündeltes `ffmpeg` (`ffmpeg-static` + `fluent-ffmpeg`) |
| Datenhaltung | JSON je Projekt (`lowdb`); SQLite optional |
| Verpackung | `electron-builder`, Portable-Target |

## 4. Datenbestand nach Lebensdauer

Die Lebensdauer entscheidet, was persistent, was temporär und was nur flüchtig ist.

**A — Persistente Fachdaten** (Projektmaterial)

- **Projekt** – ID, Name, Erstell-/Änderungsdatum, geordnete Elementliste. *(FA-15, FA-10)*
- **Aktion/Produkt** – ID, Titel (Pflicht), Beschreibung?, Preis?, Bildreferenz?, CTA?, Anzeigedauer?, Vorlagen-ID, Akzentfarbe. *(FA-02, 4.1)*
- **Medium (Asset)** – ID, Typ (video|image), Dateiname, Maße, Dauer (Video, via ffprobe), Importdatum. *(FA-01)*
- **Listenelement** – ID, Position, Typ (Video|Bild|Aktions-Segment), Referenz, Dauer, Trim-Start/-Ende. *(FA-04, FA-05, FA-06, FA-14)*
- **Vorlage** – datengetriebene Layout-Definition (feste vs. freie Zonen); v1: „Vollbild", „Split". *(FA-11, FA-13, 4.1)*
- **Ausgabe-Historie** – ID, Projekt-ID, Datum, Pfad, Dauer, Größe. *(D15, Abschnitt 7)*

**B — App-/Konfigurationsdaten** (persistent, app-weit)

- **App-Zustand** – aktives Projekt, letztes Export-Ziel, UI-Voreinstellungen. *(FA-15)*
- **Marken-/Design-Konfiguration** – Palette, Schriften, Logo. *(4.2)*

**C — Temporäre Arbeitsdaten auf der Platte** (pro Renderlauf, danach löschbar)

- gerenderte Segment-PNGs, normalisierte Zwischenclips `seg_*.mp4`, concat-Liste, `loop.mp4`-Staging vor dem Export.

**D — Reine Laufzeitdaten** (nur Arbeitsspeicher)

- UI-Zustand, Render-Fortschritts-Events, `ffmpeg`-Prozess-Handles, abgeleitete Werte (z. B. Gesamtlänge → 30-Minuten-Warnung, 5.3).

## 5. Modellierungs-Entscheidungen

1. **Medien werden in das Projekt kopiert** (nicht referenziert) – robust gegen verschobene/gelöschte Originale.
2. **Aktionen sind referenzierbare Datensätze** – mehrere Listenelemente dürfen auf dieselbe Aktion zeigen (3a); Aktions-Bibliothek je Projekt.
3. **Medien liegen pro Projekt** – klare Grenzen, keine geteilten Abhängigkeiten.
4. **Segment-PNGs werden immer neu gerendert** (flüchtig, Kategorie C) – kein Cache in v1.
5. **Vorlagen sind datengetrieben** ab v1 – eigene Vorlagen (FA-13) sind später nur ein neuer Datensatz, kein Code-Umbau.

## 6. Speicher- und Ordnerkonventionen

Aus den Entscheidungen 1 + 3 folgt: jedes Projekt besitzt einen eigenen Ordner mit `media/`-Unterordner; Listenelemente verweisen **relativ** dorthin, nie auf Originalpfade. Aus Entscheidung 4 folgt: Segment-PNGs, Zwischenclips und concat-Liste leben ausschließlich im temporären Bereich (T1) und werden nach jedem Lauf verworfen.

```
<App-Ordner>/
  config.json                # B: aktives Projekt, Marke, Historie
  projects/
    <projekt-id>/
      project.json           # A: Projekt, Aktionen, Liste, Vorlagen-Ref
      media/                 # A/D2: kopierte Videos und Bilder
  output/                    # erzeugte loop.mp4 (Historie)
<Temp>/reel-XXXX/            # C/T1: flüchtig (PNG, seg_*.mp4, concat.txt)
```

## 7. Datenfluss – Prozesse und Speicher

Das folgende zusammengeführte DFD zeigt die Autoren-Prozesse, die Speicher und die beiden Render-Arten. Beide Render-Arten lesen denselben Eingang (Liste + Medien) und unterscheiden sich nur in Engine und Ausgang.

<svg viewBox="0 0 680 548" width="680" height="548" xmlns="http://www.w3.org/2000/svg" role="img" style="max-width:100%;height:auto">
<title>Zusammengefuehrtes DFD mit zwei Render-Arten</title>
<defs><marker id="da" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9 z" fill="#6b6b66"/></marker></defs>
<rect x="280" y="22" width="120" height="44" rx="8" fill="#ede7f6" stroke="#7e57c2" stroke-width="1"/>
<text x="340" y="44" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">Nutzer</text>
<rect x="30" y="104" width="190" height="56" rx="8" fill="#e6f4f1" stroke="#2a9d8f" stroke-width="1"/>
<text x="125" y="124" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">P1 Medienverwaltung</text>
<text x="125" y="144" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Import, Kopie, ffprobe</text>
<rect x="245" y="104" width="190" height="56" rx="8" fill="#e6f4f1" stroke="#2a9d8f" stroke-width="1"/>
<text x="340" y="124" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">P2 Inhaltsverwaltung</text>
<text x="340" y="144" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Aktionen, Vorlagen</text>
<rect x="460" y="104" width="190" height="56" rx="8" fill="#e6f4f1" stroke="#2a9d8f" stroke-width="1"/>
<text x="555" y="124" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">P3 Zusammenstellung</text>
<text x="555" y="144" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Liste, Reihenfolge, Trim</text>
<text x="340" y="88" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Eingaben</text>
<line x1="320" y1="66" x2="150" y2="102" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<line x1="340" y1="66" x2="340" y2="102" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<line x1="360" y1="66" x2="540" y2="102" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<rect x="30" y="214" width="190" height="50" rx="4" fill="#f2f2f0" stroke="#9a9a95" stroke-width="1"/>
<text x="125" y="232" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">D2 Medienordner</text>
<text x="125" y="250" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">media/ (Kopien)</text>
<rect x="245" y="214" width="190" height="50" rx="4" fill="#f2f2f0" stroke="#9a9a95" stroke-width="1"/>
<text x="340" y="232" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">D1 Projekt-Store</text>
<text x="340" y="250" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Liste, Aktionen, Refs</text>
<rect x="460" y="214" width="190" height="50" rx="4" fill="#f2f2f0" stroke="#9a9a95" stroke-width="1"/>
<text x="555" y="232" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">D3 App-Konfig</text>
<text x="555" y="250" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">aktiv, Historie</text>
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
<text x="588" y="296" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Historie</text>
<line x1="560" y1="322" x2="560" y2="266" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<rect x="85" y="436" width="160" height="50" rx="8" fill="#ede7f6" stroke="#7e57c2" stroke-width="1"/>
<text x="165" y="454" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">Bildschirm</text>
<text x="165" y="472" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Live-Vorschau</text>
<text x="192" y="412" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">anzeigen</text>
<line x1="165" y1="382" x2="165" y2="434" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<rect x="408" y="436" width="100" height="50" rx="8" fill="#fcf1da" stroke="#d9a441" stroke-width="1"/>
<text x="458" y="456" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">ffmpeg</text>
<text x="458" y="473" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">gebündelt</text>
<text x="430" y="412" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Aufrufe</text>
<line x1="458" y1="382" x2="458" y2="434" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-start="url(#da)" marker-end="url(#da)"/>
<rect x="525" y="436" width="120" height="50" rx="8" fill="#f2f2f0" stroke="#9a9a95" stroke-width="1"/>
<text x="585" y="456" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">USB-Stick</text>
<text x="585" y="473" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">loop.mp4</text>
<text x="575" y="412" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Export</text>
<line x1="545" y1="382" x2="580" y2="434" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<rect x="150" y="512" width="13" height="13" rx="3" fill="#e3f0fb" stroke="#2f6db5"/>
<text x="170" y="519" text-anchor="start" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Vorschau-Render &#8211; ohne ffmpeg</text>
<rect x="410" y="512" width="13" height="13" rx="3" fill="#fbe7e3" stroke="#e5634d"/>
<text x="432" y="519" text-anchor="start" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Finaler Render &#8211; ffmpeg &#8594; loop.mp4</text>
</svg>

*Abbildung 1: Zusammengeführtes DFD. Blau = Vorschau-Render (ohne ffmpeg, auf den Bildschirm), Koralle = finaler Render (ffmpeg → `loop.mp4` auf USB). Die Kataloge 7.1–7.3 beschreiben dieselben Flüsse präzise in Textform.*

### 7.1 Prozess-Katalog

| ID | Prozess | Aufgabe | Eingang | Ausgang | Anf. |
|---|---|---|---|---|---|
| P1 | Medienverwaltung | Import, Kopie in `media/`, ffprobe-Metadaten | Datei vom Nutzer | Asset-Datensatz, kopierte Datei | FA-01 |
| P2 | Inhaltsverwaltung | Aktionen/Produkte pflegen, Vorlagen kennen | Nutzereingaben | Aktion + Vorlagen-Ref | FA-02, 4.1 |
| P3 | Zusammenstellung | Liste bauen, ordnen, Dauer/Trim, Gesamtlänge | Assets, Aktionen | Listenelemente | FA-04/05/06/14 |
| P4 | Finaler Render + Export | Segmente rendern, normalisieren, concat, USB-Export | Liste + Medien | loop.mp4, Historie | FA-08/09, 5 |
| P5 | Vorschau | Sequenz live in der UI simulieren (ohne ffmpeg) | Liste + Medien | Bilddarstellung | FA-07 |

### 7.2 Speicher-Katalog

| ID | Speicher | Inhalt | Lebensdauer | Schreiber |
|---|---|---|---|---|
| D1 | Projekt-Store | Projekte, Aktionen, Liste, Vorlagen-Ref | persistent | P1, P2, P3 |
| D2 | Medienordner | kopierte Videos/Bilder je Projekt | persistent | P1 |
| D3 | App-Konfig | aktives Projekt, Marke, Ausgabe-Historie | persistent | App, P4 |
| T1 | Render-Arbeitsbereich | Segment-PNGs, `seg_*.mp4`, concat-Liste | flüchtig | P4 |

### 7.3 Datenfluss-Tabelle

| # | Von | Daten | Nach |
|---|---|---|---|
| 1 | Nutzer | Datei-Import | P1 |
| 2 | P1 | kopierte Mediendatei | D2 |
| 3 | P1 | Asset-Datensatz (Pfad, Maße, Dauer) | D1 |
| 4 | Nutzer | Aktion/Produkt (Titel u. a.) | P2 |
| 5 | P2 | Aktion + Vorlagen-Referenz | D1 |
| 6 | Nutzer | Reihenfolge, Dauer, Trim | P3 |
| 7 | P3 | Listenelemente | D1 |
| 8 | D1 | Liste + Aktionsdaten | P4 / P5 |
| 9 | D2 | Mediendateien | P4 / P5 |
| 10 | P4 | ffmpeg-Aufrufe / Clips | ffmpeg |
| 11 | P4 | Segment-PNGs, `seg_*.mp4`, concat-Liste | T1 |
| 12 | P4 | loop.mp4 | USB |
| 13 | P4 | Historie-Eintrag | D3 |
| 14 | P5 | gerenderte Frames | Bildschirm |

### 7.4 Die zwei Render-Arten

P4 und P5 lesen **denselben** Eingang (Liste + Medien) und unterscheiden sich nur in Engine und Ausgang:

- **P5 Vorschau** – Engine: UI/Canvas, ohne `ffmpeg`; Ausgang: Bildschirm (live).
- **P4 Finaler Render** – Engine: `ffmpeg`; Ausgang: `loop.mp4` auf USB.

Das ist die Trennlinie für die spätere Arbeitsteilung: „Vorschau" und „Render" sind getrennte Module mit gemeinsamer Eingangsdatenstruktur.

## 8. Vorschau-Konzept (UI-Simulation)

Die Vorschau läuft vollständig im Renderer, ohne `ffmpeg`. Eine 16:9-Bühne (1920×1080 herunterskaliert) spielt die Liste der Reihe nach ab:

- **Aktions-Segmente** zeigen exakt dasselbe Canvas-Bild, das auch der finale Render verwendet → pixelgleich.
- **Bilder** werden gleich eingepasst (`object-fit: contain` auf Schwarz = dieselbe Letterbox/Pillarbox wie das `pad` im Render).
- **Videos** laufen nativ als `<video>` von Trim-Start bis -Ende.
- Transport: Play/Pause, Zeitleiste, Markierung des aktuellen Elements, Gesamtdauer.

**Grenze (bewusst):** Farbe, Kompression und Bitrate des finalen H.264 sind in der Simulation nicht sichtbar; der schnelle Trim kann minimal anders schneiden. Die finale Kontrolle bleibt die gerenderte `loop.mp4` (Akzeptanzkriterium 2/3).

## 9. Nächster Schritt: High-Level-Design

Übersetzung der Prozesse P1–P5 in konkrete Module mit scharfen Schnittstellen (Renderer- vs. Main-Module, IPC-Vertrag, geteilte Typen). Wird in der nächsten Iteration hier ergänzt.
