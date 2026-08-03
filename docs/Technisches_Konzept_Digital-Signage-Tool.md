# Technisches Konzept – Digital-Signage-Tool

**Projekt:** Digital-Signage-Tool für das Fitnessstudio der Baller Gruppe
**Bezug:** Anforderungsdokument v1.2 (das „Was")
**Inhalt dieses Dokuments:** das „Wie" – Architektur, Datenbestand, Datenfluss, Module
**Version:** 2.3 (HLD vollständig, geprüft)
**Datum:** 02.08.2026
**Status:** In Planung

---

## 1. Zweck und Einordnung

Dieses Dokument beschreibt die technische Umsetzung. Die fachlichen Anforderungen (Funktionen, Regeln, Ausgabe-Profil) stehen im **Anforderungsdokument v1.0** und werden hier nicht wiederholt, sondern referenziert. Es ist ein lebendes Planungsdokument: Datenbestand und Datenfluss sind festgelegt, das High-Level-Design (Module + Schnittstellen) ist in Abschnitt 9 ausgearbeitet (Stand und offene Punkte: siehe Schluss von Abschnitt 9).

## 2. Architektur-Überblick

Die Anwendung ist eine **Electron-Desktop-App** (portable, Windows + macOS). Sie besteht aus zwei Laufzeit-Bereichen, verbunden über IPC:

- **Renderer (React-UI):** Medienliste, Drag-and-drop, Aktions-Editor, **Vorlagen-Editor**, Vorschau, Canvas-Rendering der Segmente und Bänder.
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
| Video/Encoding | gebündeltes `ffmpeg` (`ffmpeg-static` + `fluent-ffmpeg`) |
| Datenhaltung | JSON je Projekt (`lowdb`); SQLite optional |
| Verpackung | `electron-builder`, Portable-Target |

## 4. Datenbestand nach Lebensdauer

Die Lebensdauer entscheidet, was persistent, was temporär und was nur flüchtig ist.

**A — Persistente Fachdaten** (Projektmaterial)

- **Projekt** – ID, Name, Erstell-/Änderungsdatum, geordnete Elementliste. *(FA-15, FA-10)*
- **Aktion/Produkt** – ID, Titel (Pflicht), Beschreibung?, Preis?, Bildreferenz?, CTA?, Anzeigedauer?, Vorlagen-ID, Akzentfarbe. *(FA-02, 4.1)*
- **Medium (Asset)** – ID, Typ (video|image), Dateiname, Maße, Dauer (Video, via ffprobe), Importdatum. *(FA-01)*
- **Listenelement** – ID, Art (Video|Bild|Aktions-Segment), Referenz, Dauer, Trim-Start/-Ende sowie – **nur bei Video** – optional eine **Einblendung** für die parallele Anzeige: `{ bandVorlageId, abschnitte: [{ aktionRef, dauer }] }`. Die Abschnitte rotieren während des Videos und wiederholen sich, wenn sie kürzer als das Video sind (9.2.8). **Die Reihenfolge ist die Array-Reihenfolge – es gibt kein separates Positions-Feld** (9.11.3). *(FA-04, FA-05, FA-06, FA-14, FA-20)*
- **Vorlage** – datengetriebene Layout-Definition: `art` (vollflächig | Split-Band | Einblendung), `höhe` (bei Bändern), `parent` (Arbeitskopie-Herkunft) und Zonen (feste vs. freie). Eingebaut: „Vollbild", „Split", „Band-Standard". **App-weit** gespeichert, nicht im Projekt (9.11.1, 9.12). *(FA-11, FA-13, FA-20, 4.1)*
- **Ausführungs-Protokoll / Ausgabe-Historie** – ID, Projekt-ID, Datum, Pfad, Dauer, Größe. Geführt von der Auftragsverwaltung als Speicher **Q3** (append-only, dauerhaft), nicht mehr in D3. *(Abschnitt 7, 9.3)*

**B — App-/Konfigurationsdaten** (persistent, app-weit)

- **App-Zustand** – aktives Projekt, letztes Export-Ziel, UI-Voreinstellungen. *(FA-15)*
- **Marken-/Design-Konfiguration** – Palette, Schriften, Logo. *(4.2)*

**C — Temporäre Arbeitsdaten auf der Platte** (pro Renderlauf, danach löschbar)

- gerenderte Segment-PNGs, normalisierte Zwischenclips `seg_*.mp4`, concat-Liste, Staging der fertigen Ausgabedatei vor dem Verschieben in den Projekt-Ausgabeordner.

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

Aus den Entscheidungen 1 + 3 folgt: jedes Projekt besitzt einen eigenen Ordner mit `media/`-Unterordner; Listenelemente verweisen **relativ** dorthin, nie auf Originalpfade. Aus Entscheidung 4 folgt: Segment-PNGs, Zwischenclips und concat-Liste leben ausschließlich im temporären Bereich (T1) und werden nach jedem Lauf verworfen.

```
<App-Ordner>/
  config.json                # B/D3: aktives Projekt, Marke, UI-Voreinstellungen
  protokoll.json             # Q3: Ausführungs-Protokoll (dauerhaft, unbegrenzt)
  warteschlangen-journal.json # Q4: Bewegungen der Schlange (dauerhaft, rotierend)
  vorlagen.json              # A/V1: Vorlagen-Bibliothek – APP-WEIT für alle Projekte (9.11.1.1)
  vorlagen.json.bak          # A/V1: letzte heile Version (9.12.1)
  projects/
    <projekt-id>/
      project.json           # A: Projekt, Aktionen, Liste, Vorlagen-Ref
      project.json.bak       # A: letzte heile Version (Auto-Speichern-Backup, 9.5.4)
      media/                 # A/D2: kopierte Videos und Bilder
      output/                # A: gerenderte MP4s DIESES Projekts – mehrere, frei benannt (FA-22)
      queue-retry.json       # Q2: offene Fehlschläge + pendingDeletions (persistent bis erledigt)
<Temp>/reel-XXXX/            # C/T1: flüchtig (PNG, seg_*.mp4, concat.txt)
                             # Q1 (aktive Warteschlange) lebt nur im RAM, keine Datei
```

**Der Ausgabeordner gehört zum Projekt** (`projects/<id>/output/`), nicht zur Anwendung. Läge er app-weit, überschriebe ein Render in Projekt B die noch nicht exportierte Ausgabe von Projekt A – ein stiller Datenverlust. Je Projekt dürfen **mehrere** benannte MP4s darin liegen (FA-22, Anforderungsdokument 4.7).

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
<text x="555" y="250" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">aktiv, Marke, UI</text>
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
<text x="558" y="300" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Marke</text>
<line x1="545" y1="264" x2="525" y2="320" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<text x="300" y="286" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Marke</text>
<line x1="470" y1="264" x2="230" y2="320" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<rect x="716" y="404" width="214" height="56" rx="8" fill="#e6f4f1" stroke="#2a9d8f" stroke-width="1"/>
<text x="823" y="426" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">P7 Vorlagenverwaltung</text>
<text x="823" y="446" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Arten, Zonen, Arbeitskopie/Merge</text>
<rect x="716" y="500" width="214" height="50" rx="4" fill="#f2f2f0" stroke="#9a9a95" stroke-width="1"/>
<text x="823" y="518" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="13" font-weight="600" fill="#202020">V1 Vorlagen-Bibliothek</text>
<text x="823" y="536" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">app-weit, inkl. Arbeitskopien</text>
<text x="884" y="20" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Vorlagen-Bearbeitung</text>
<path d="M400 30 L948 30 L948 432 L932 432" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<line x1="823" y1="460" x2="823" y2="498" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<text x="792" y="484" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Vorlage</text>
<path d="M716 516 L668 470 L668 400 L622 378" stroke="#6b6b66" stroke-width="1.5" fill="none" marker-end="url(#da)"/>
<text x="690" y="424" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Vorlage (lesend)</text>
<text x="690" y="440" text-anchor="middle" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="10" fill="#8f8f8f">an P2 / P4 / P5</text>
<rect x="150" y="624" width="13" height="13" rx="3" fill="#e3f0fb" stroke="#2f6db5"/>
<text x="170" y="634" text-anchor="start" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Vorschau (ohne ffmpeg)</text>
<rect x="330" y="624" width="13" height="13" rx="3" fill="#fbe7e3" stroke="#e5634d"/>
<text x="350" y="634" text-anchor="start" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Finaler Render → Ausgabe-MP4</text>
<rect x="560" y="624" width="13" height="13" rx="3" fill="#fcf1da" stroke="#d9a441"/>
<text x="580" y="634" text-anchor="start" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Auftragsverwaltung (amber = Steuerung/Freigabe)</text>
<rect x="150" y="646" width="13" height="13" rx="3" fill="#e6f4f1" stroke="#2a9d8f"/>
<text x="170" y="656" text-anchor="start" font-family="Segoe UI,Helvetica,Arial,sans-serif" font-size="11" fill="#5f5e5a">Autoren-Prozesse (P1–P3, P7)</text>
</svg>

*Abbildung 1: Zusammengeführtes DFD. Grau = Datenfluss; **amber = Steuerungsfluss** der Auftragsverwaltung (P6). P6 nimmt Aufträge entgegen und gibt die ausführenden Prozesse **seriell frei** (import/löschen → P1, render/export → P4); die vier gestrichelten Speicher Q1–Q4 halten aktive Warteschlange, Wiederholungen, Protokoll und Warteschlangen-Journal (jeweils eigene Persistenz, s. 7.2). Blau = Vorschau-Render (ohne ffmpeg → Bildschirm), Koralle = finaler Render (ffmpeg → benannte Ausgabe-MP4, von dort auf USB). Instant-Eingaben (Aktionen, Liste, Trim) laufen an P6 vorbei direkt in P2/P3. **P7 Vorlagenverwaltung** schreibt Vorlagen in die app-weite Bibliothek **V1**; V1 wird von P2 (Zuordnung) sowie P4/P5 (Zeichnen der Segmente und Bänder) **nur lesend** genutzt – im Bild ist beispielhaft der Weg zu P4 gezeichnet. Die Kataloge 7.1–7.3 beschreiben dieselben Flüsse präzise in Textform.*

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
| T1 | Render-Arbeitsbereich | Segment-PNGs, `seg_*.mp4`, concat-Liste | flüchtig | P4 |
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

- **Renderer (React-UI):** `ipc-client`, `app-shell` (Rahmen + Navigation, 9.14), `composer` [P3], `action-editor` [P2], `template-canvas` (geteilt: Segment → PNG, **einzige Pixelquelle**, 9.10), `preview-player` [P5], `vorlagen-editor` (9.12.2), `queue-panel` (Sicht auf die Auftrags-Queue).
- **Main (Node):** `ipc-gateway`, `auftrags-manager` [P6] (zentraler serieller Ausführungspunkt + Speicher Q1–Q4, 9.3), `media-service` [P1] (9.4), `project-store` [D1] (besitzt das eine D1-Schreib-Lock **und** ist Pfad-Autorität + trägt das `media://`-Protokoll, 9.5.7), `config-store` [D3], `vorlagen-store` (app-weite Vorlagen-Bibliothek, 9.12.1), `render-service` [P4] (9.2), `export-service`, `ffmpeg-adapter` (enthält den getesteten `buildReel`-Kern).
- **Geteilt:** `contracts/types` (Project, Action, Asset, ListItem, Template, Brand, RenderRequest, Auftrag …). Renderer ↔ Main reden **ausschließlich** über den typisierten IPC-Vertrag.

**Stand der Verträge:** ausgearbeitet sind `render-service` (9.2), `auftrags-manager` (9.3), `media-service` (9.4), `project-store`/`config-store` (9.5), `export-service` (9.6), `composer` (9.7), `action-editor` (9.8), `preview-player` (9.9), `template-canvas` (9.10), die geteilten Datenmodelle `Vorlage`, `Marke`, `Project`/`Listenelement` sowie ID-Schema und Konstanten (9.11) die **Vorlagen-Verwaltung** `vorlagen-store`/`vorlagen-editor` (9.12), **Undo/Redo** (9.13), die **IPC-Konventionen** (9.1.1) sowie die **`app-shell`** (9.14). **Noch offen:** das Datenmodell `Marke` (9.11.2) und die Punkte am Schluss von Abschnitt 9.

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
  | { ok: false, fehler: { code: Fehlercode, meldung: string } }
```

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

**4. Kanalbenennung `<modul>:<operation>`** – z. B. `media:importMedium`, `project:setzeTrim`, `vorlagen:löscheVorlage`. Ereignisse (Main → Renderer) heißen `<modul>:<ereignis>`, z. B. `queue:geaendert`, `render:fortschritt`. Damit erfindet niemand eigene Kanalnamen.

**5. Ereignisse sind Einbahnstraßen und tragen keinen Endzustand** (für `RenderProgress` bereits festgelegt, 9.2.7). Terminale Zustände kommen ausschließlich über Aufruf-Ergebnis bzw. Auftrags-Zustand.

**6. Der Main validiert jede eingehende Nutzlast** – er vertraut dem Renderer **nicht**. Ungültige Eingabe → `ungueltige_eingabe`, **ohne** jede Wirkung auf die Daten. Ein Fehler im Renderer darf D1 niemals beschädigen.

**7. Kein stiller Fehlschlag:** Jede Operation antwortet – `ok` oder Code. Es gibt keine Operation, die „einfach nichts" zurückgibt und auf Gelingen hofft.

**8. Unerwartete Ausnahmen fängt das Gateway** und übersetzt sie in `unbekannter_fehler` (intern protokolliert). Die App stürzt nicht ab, und **kein Stacktrace** gelangt in die Oberfläche.

**9. Binärdaten** (Segment- und Band-PNGs) reisen als **Binärpuffer**, nicht als Base64 (9.1, Punkt 3) – die Hülle ändert daran nichts.

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
| `"video"` | `medienRef` (relativer Pfad in `media/`), `trimStart`, `trimEnde` (Sekunden; **framegenauer** Schnitt s. 9.2.6), optional `einblendung` (Band-Abschnitte als PNG-Puffer + Dauern, s. 9.2.8) | Datei in D2; Band-Pixel vom Renderer | **teilweise** – Video per Pfad, Band-PNGs über IPC |
| `"bild"` | `medienRef` (relativer Pfad), `dauer` | Datei in D2 | **nein** – Main liest per Pfad |
| `"segment"` | `png` (Binärpuffer), `dauer` | Renderer via `template-canvas` | **ja** – einziger Pixel-Transport |

Gemeinsam je Item: `id` (Rückverfolgung/Fehlerzuordnung). Bei `"segment"` werden **keine** Aktions-/Vorlagendaten mitgeschickt – die Pixel sind bereits final; das ist der Kern von Variante A.

#### 9.2.3 Ausgang: `RenderResult`

Genau **ein** terminaler Ausgang je Lauf, diskriminiert über `status` ∈ { `erfolg`, `fehler`, `abgebrochen` }. Alle drei tragen die `renderId`. Die Nutzdaten je Status:

**`erfolg`:**

| Feld | Inhalt |
|---|---|
| `ausgabePfad` | absoluter Pfad der erzeugten `projects/<id>/output/<name>.mp4` |
| `gesamtdauer` | Summe der (getrimmten) Elementdauern in Sekunden – **framegerundet** gezählt (Frame-Anzahl / 30, s. 9.2.6) |
| `dateigroesse` | Größe in Bytes |
| `historieEintrag` | ID, Datum, Pfad, Dauer, Größe → von der Auftragsverwaltung ins Protokoll Q3 geschrieben (9.3) |

**`fehler`:**

| Feld | Inhalt |
|---|---|
| `fehlercode` | z. B. `medium_fehlt`, `ffmpeg_fehler`, `ungueltiges_element` |
| `fehlerhaftesElementId` | betroffenes `RenderItem` (falls zuordenbar) |
| `meldung` | für den Nutzer aufbereiteter Klartext |

**`abgebrochen`** (durch `cancelRender`, s. 9.2.7):

| Feld | Inhalt |
|---|---|
| `abgebrochenBei` | zuletzt bearbeiteter `elementIndex` (optional, für die UI) |

Bei `fehler` und `abgebrochen` entsteht **keine** neue Ausgabedatei und **kein** Historie-Eintrag; eine **bereits vorhandene Datei gleichen Namens bleibt unversehrt** (9.2.6); der Arbeitsbereich T1 ist in beiden Fällen aufgeräumt.

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
| Seitenverhältnis-Politik | einpassen + schwarze Balken (`pad`; Letterbox/Pillarbox), **kein** Beschnitt | Ausnahme: Split-Komposition füllt in Markenfarbe (9.2.8) |
| Container / Dateiname | **MP4** mit **`+faststart`** / `<ausgabeName>.mp4` (frei, FA-22) | Index vorn – hilft Playern, die ihn früh erwarten |

**Ausdrücklich verboten** (typische „für mehr Qualität"-Fehlgriffe, die den TV aussperren): 10-Bit-Tiefe, 4:2:2/4:4:4-Abtastung, exotisch hohe Referenzframe-Zahlen, offene GOPs, unbegrenztes CRF ohne VBV-Deckel.

**Alle Werte gelten identisch für jedes Segment** – sonst scheitert die Uniformitäts-Voraussetzung von `-c copy` (9.2.6). Das Profil ist eine Konstante, wird aber **explizit** im Vertrag geführt (spätere Profil-Änderung = ein Datenwert, kein Schnittstellenbruch).

#### 9.2.5 Verantwortungsteilung an der Grenze

- **Renderer:** rendert Segment-PNGs (`template-canvas`, pixelgleich zur Vorschau), stellt den `RenderRequest` zusammen, übergibt Segment-Pixel als Binärpuffer. Schreibt **nichts** auf die Platte.
- **Main (`render-service`):** schreibt die PNGs nach T1; **normalisiert jedes Element** (`scale` + `pad` → Profil) zu einem Zwischenclip `seg_*.mp4`; verkettet die Zwischenclips per concat-Demuxer (`-c copy`) zur fertigen Ausgabedatei; nutzt `ffprobe` für Maße/Dauer, wo nötig; schreibt das Ergebnis in den **Projekt-Ausgabeordner** (`projects/<id>/output/<name>.mp4`, atomar – s. 9.2.6) und meldet den Historie-Eintrag an die Auftragsverwaltung (Protokoll Q3, 9.3); **verwirft T1** nach dem Lauf. Die absoluten Pfade der Importe (`medienRef`) löst er über die Pfad-Autorität `project-store` auf (9.5.7), statt das Layout selbst zu kennen.
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
- **Die Ausgabedatei entsteht atomar – die vorige Fassung ist geschützt (FA-22):** Weil der Standard-Zielname der **zuletzt verwendete** ist, überschreibt ein Render im Regelfall eine vorhandene, gute Datei. `ffmpeg` schreibt deshalb **nie** direkt auf den Zielnamen, sondern in den Arbeitsbereich T1; erst die **fertige und verifizierte** Datei wird per Rename-mit-Ersetzen in den Projekt-Ausgabeordner gebracht (dieselbe Partition). Ein Abbruch, ein Fehler oder ein Absturz lässt die vorhandene Datei damit **unversehrt** – ohne diese Regel zerstörte ein fehlgeschlagener Probelauf die letzte funktionierende Ausgabe.
- **Der Ausgabename ist Nutzereingabe und wird validiert (FA-22):** Erlaubt ist ein reiner Dateiname **ohne** Endung – **keine** Pfadtrenner (`/`, `\`), **kein** `..`, keine für Windows/macOS/FAT32 unzulässigen Zeichen (`< > : " | ? *`, Steuerzeichen), nicht leer, keine reservierten Windows-Namen (`CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`, `LPT1`–`LPT9`). Der aufgelöste Pfad muss **innerhalb** von `projects/<id>/output/` liegen. Verstoß → `ungueltige_eingabe`, **ohne** Wirkung. Andernfalls könnte ein Name wie `../../config` aus dem Projekt ausbrechen.
- **Nur der Main schreibt/liest das Dateisystem;** der Renderer liefert ausschließlich Bytes über IPC.

#### 9.2.7 Fortschritts- und Abbruch-Ereignisse

Während eines laufenden Renders läuft der Kanal in **beide** Richtungen; beide Richtungen korrelieren über die `renderId` des Laufs:

- **Main → Renderer:** Fortschritts-Ereignisse (`RenderProgress`).
- **Renderer → Main:** Abbruch-Signal (`cancelRender`).

**Fortschritts-Ereignis `RenderProgress` (Main → Renderer):**

| Feld | Inhalt |
|---|---|
| `renderId` | Lauf, auf den sich das Ereignis bezieht |
| `phase` | `normalisieren` \| `verketten` |
| `elementIndex` / `elementAnzahl` | *k* von *n* (in Phase `normalisieren`; in `verketten` ein Gesamtschritt) |
| `elementId` | aktuelles `RenderItem` zur UI-Markierung (optional) |
| `prozent` | grober Gesamtfortschritt 0–100 |

**Keine** Restzeit-Schätzung – bei `ffmpeg` unzuverlässig, sie würde nur falsche Erwartungen erzeugen. Reine Laufzeitdaten (Kategorie D), **keine** Persistenz.

**Drosselung (Vertrag, nicht nur Umsetzung):** Ereignisse an den Element-Grenzen (Beginn/Ende je `seg_*.mp4`) plus grobe Zwischen-Ticks; **kein** Pro-Frame-Feuerwerk über IPC (Obergrenze wenige Ereignisse/Sekunde). Die genaue Rate ist Umsetzungsdetail, *dass* gedrosselt wird, ist verbindlich.

**Abbruch `cancelRender` (Renderer → Main):** Signal mit `renderId`. Der Main stoppt den laufenden `ffmpeg`-Prozess, räumt T1 auf und schließt den Lauf mit `RenderResult { status: abgebrochen }` ab (9.2.3). In v1 verfügbar. In der Praxis ist der Render **ein Auftrag der Auftrags-Queue** (9.3); der Nutzer löst den Abbruch über das `queue-panel` aus, das intern `cancelRender(renderId)` aufruft. `auftragId` und `renderId` bleiben dabei fest verknüpft (9.3).

**Abgrenzung (damit sich nichts doppelt):**

- Der Fortschrittskanal trägt **keinen** Endzustand. Erfolg, Fehler und Abbruch kommen **ausschließlich** über das `RenderResult` (9.2.3).
- Nach dem terminalen `RenderResult` dürfen **keine** weiteren `RenderProgress`-Ereignisse dieser `renderId` mehr folgen. Verspätete Ereignisse eines bereits beendeten Laufs erkennt der Renderer an der nicht mehr aktuellen `renderId` und verwirft sie.

#### 9.2.8 Parallele Einblendung: Split-Screen-Komposition (FA-20)

Ein `"video"`-Item kann eine **Einblendung** tragen: unter dem laufenden Video zeigt ein **Werbeband** eine oder mehrere rotierende Aktionen (Anforderungsdokument 4.5).

Es gibt **zwei** Kompositionsarten; welche gilt, bestimmt die **Art der Band-Vorlage** (`art`, 9.11.1) – gewählt bei der Vorlagenerstellung:

**Art A – `split` (Hauptbetriebsart): Band *unter* dem verkleinerten Video.** Die **Bandhöhe `H` kommt aus der Vorlage**, die Geometrie leitet sich daraus ab:

| Bereich | Rahmen im 1920×1080-Bild |
|---|---|
| Video-Bereich | **1920 × (1080 − H)** bei y = 0 |
| Band | **1920 × H** bei y = 1080 − H |
| Video eingepasst (16:9) | höhenbegrenzt → Breite = (1080 − H) × 16/9, zentriert |
| Restflächen | links/rechts – gefüllt mit der **dunklen Markenfarbe** |

*Beispiel mit der eingebauten Vorlage (H = 162):* Video-Bereich 1920 × 918, Video real **1632 × 918** zentriert (x = 144), Restflächen je **144 px**.

**Bewusste Abweichung vom Ausgabe-Profil – nur hier:** 9.2.4 schreibt **schwarze** Balken vor. In der Split-Komposition werden die Restflächen **in der Markenfarbe** gefüllt, damit der Split gestaltet wirkt und nicht wie ungenutzter Platz. Die Einpassung bleibt **„contain" ohne Beschnitt**.

**Art B – `einblendung`: Band *über* dem vollflächigen Video.** Das Video wird wie gewohnt auf **1920 × 1080** normalisiert (schwarze Balken nach 9.2.4, **keine** Verkleinerung, **keine** Markenfarb-Flächen). Das Band (1920 × H, **mit Alpha**) wird **unten überlagert** (y = 1080 − H). Vorteil: das Video behält seine volle Größe; dafür verdeckt das Band den unteren Bildbereich.

**Aufbau – in beiden Arten genau eine Re-Encodierung, Pipeline unverändert:**

1. **Band-Spur** erzeugen: die Band-PNGs der Abschnitte (von `template-canvas` mit einer `split`- bzw. `einblendung`-Vorlage) mit ihren Dauern zu einer **1920 × H**-Spur bei **30 fps CFR** verketten.
2. **Video vorbereiten:** bei `split` **contain** in den Video-Bereich skalieren und mit **Markenfarbe** auffüllen; bei `einblendung` normal auf 1920 × 1080 nach 9.2.4.
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
- **Die Bandhöhe `H` stammt ausschließlich aus der Vorlage** – sie ist **kein** Wert am Listenelement und **nicht** pro Element überschreibbar. So bleibt das Erscheinungsbild an die Vorlage gebunden.
- **Alle Abschnitte eines Elements nutzen dieselbe Band-Vorlage** (eine `bandVorlageId` pro Einblendung) – damit `H` und die Kompositionsart während eines Videos nicht wechseln. Ein Wechsel mitten im Video würde die Geometrie springen lassen.
- **Ohne** Band bleibt die Verarbeitung **unverändert**: Video vollflächig 1920 × 1080 mit **schwarzen** Balken nach 9.2.4.

### 9.3 Subsystem `auftrags-manager` (Auftragsverwaltung) [P6]

**Richtung:** Renderer → Main (Aufträge einreihen/steuern), Main → Renderer (Zustands-Push), ausschließlich über den typisierten IPC-Vertrag.
**Fachlich:** Die Auftragsverwaltung ist **mehr als eine Warteschlange** – ein Verwaltungs-Subsystem mit vier Aufgaben:

1. **Torwächter (Zulassung):** bestimmt, *welcher* Auftrag jetzt laufen darf — serielle Freigabe, **genau einer** gleichzeitig (der einzige Sperr-Mechanismus des Systems; FA-16 ff., NFA-09).
2. **Zustandsführung:** verfolgt jeden Auftrag über seinen Lebenszyklus (9.3.3).
3. **Wiederholung:** hält Fehlschläge vor und reiht sie auf Wunsch (oder – bei `pendingDeletions` – automatisch beim Start) neu ein.
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
  ausgabe:    { pfad, dateigroesse, gesamtdauer } | null   // nur bei erfolgreichem render/export
}

JournalEintrag {               // Q4 – eine Zeile je Bewegung
  zeit:      string             // ISO-8601 UTC
  auftragId: string
  bewegung:  "eingereiht" | "gestartet" | "entfernt" | "erneut_eingereiht"
  position:  number | null      // Platz in der Schlange, wo sinnvoll
}
```

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
| `versuche` | Anzahl bisheriger Ausführungen | macht wiederholtes Scheitern sichtbar |
| `fehler` | `{ code, meldung }` oder `null` | gesetzt bei `fehlgeschlagen`; `code` stammt aus dem Fachdienst |
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

- **`anstehend` → `laeuft`:** nur wenn **kein** anderer Auftrag `laeuft` (serielle Invariante). Auswahl in FIFO-Reihenfolge.
- **`fehlgeschlagen`/`abgebrochen`/`erfolg`** sind terminal. `fehlgeschlagen` ist über `wiederhole` reaktivierbar; der **selbe** Eintrag wird wieder `anstehend` und **ans Ende** gestellt, `versuche` +1 (kein neuer Eintrag).

#### 9.3.4 IPC-Oberfläche

```
reiheEin(art, payload) → Ergebnis<{ auftragId }>   // kehrt SOFORT zurück; sagt nichts über den Ausgang
entferne(auftragId)    → Ergebnis<void>            // anstehend: aus Schlange nehmen; laeuft+render: Abbruch (→ cancelRender)
wiederhole(auftragId)  → Ergebnis<void>            // fehlgeschlagen → anstehend, ans Ende, versuche +1
holeStand()            → Ergebnis<Auftrag[]>       // Snapshot für die UI (z. B. beim Öffnen des Panels)
```
```
QueueGeändert(Auftrag[])   // Main → Renderer: Push bei jeder Zustandsänderung → speist das queue-panel
                           // Ereignis: OHNE Hülle und ohne Endzustand (9.1.1 Punkte 5 und 2)
```

Alle vier Aufrufe sind **Instant** und tragen die Ergebnis-Hülle (9.1.1): `Ergebnis<void>` heißt „eingereiht/entfernt/wiederholt", **nicht** „fertig". Ein `entferne` auf einen bereits beendeten Auftrag ist kein Erfolg, sondern `nicht_gefunden`.

`import`, `loeschen`, `render` und `export` werden damit **nicht** als direkte Request/Response-Operationen aufgerufen, sondern über `reiheEin` eingereiht; ihr Fach-Ergebnis (`erfolg`/`fehlgeschlagen` samt Fachfehlercode) kommt über den Auftrags-Zustand.

#### 9.3.5 Invarianten (bindend)

- **Seriell:** höchstens **ein** Auftrag in `laeuft`. Das ist der einzige Sperr-Mechanismus des Systems; ein zweites Lock ist nicht nötig und darf nicht eingeführt werden. Genau daraus folgt, dass ein `loeschen` eines Mediums **nie** parallel zu einem laufenden `render` läuft — es wartet, bis der Render den Datei-Handle freigegeben hat (löst zugleich das Windows-`EBUSY`-Problem, 9.4).
- **FIFO** unter `anstehend`; `wiederhole` hängt hinten an.
- **Render friert seinen Eingang beim Einreihen ein:** die geordnete Liste + Profil des `RenderRequest` werden **zum Einreih-Zeitpunkt** als Snapshot genommen. Spätere Listenänderungen betreffen einen bereits eingereihten Render **nicht** (verhindert „gedrückt, dann getweakt, anderes Video").
- **Determinismus durch sichtbare Reihenfolge:** Reihenfolge zweier Aufträge = Einreih-Reihenfolge, im Panel sichtbar. Beispiel: `loeschen` vor `render` eingereiht → Asset ist weg, der Render scheitert deterministisch mit `medium_fehlt` (9.4); umgekehrt läuft der Render zuerst und nutzt das Asset. Der Nutzer sieht die Reihenfolge und kann sie über `entferne`/`wiederhole` steuern.
- **Differenzierte Persistenz (vier Speicher):** **Q1** (aktive Warteschlange) ist flüchtig — nach Neustart leer; **Q2** (Fehlschläge + `pendingDeletions`) überlebt den Neustart und wird nach Erledigung gelöscht; **Q3** (Protokoll) ist dauerhaft und **unbegrenzt**; **Q4** (Journal) ist dauerhaft, aber **rotierend**. Die aktive Queue wird also *nicht* persistiert, die Wiederhol-Fähigkeit und die Historie sehr wohl.
- **Wiederholen bleibt ein Eintrag:** `wiederhole` verschiebt den bestehenden Q2-Eintrag zurück nach `anstehend` (ans Ende) und erhöht `versuche`; es entsteht **kein** Duplikat. Nach Erfolg/Verwerfen verschwindet der Q2-Eintrag.

#### 9.3.6 Verzahnung mit `render-service`

Der bestehende Vertrag 9.2 (`renderReel`, `RenderRequest`/`RenderResult`, `RenderProgress`, `cancelRender`) bleibt vollständig gültig. Die Queue nutzt ihn:

- Ein `render`-Auftrag führt beim Start intern `renderReel(payload)` aus. `RenderProgress.prozent` speist `Auftrag.fortschritt`; `RenderResult` bestimmt den terminalen Auftrags-`status` (erfolg/fehlgeschlagen/abgebrochen) und liefert bei Erfolg die reichen Nutzdaten (Pfad, Größe, Dauer, Historie-Eintrag).
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

**Auftrags**-Ergebnis bei Erfolg: der fertige `Asset` (9.4.4). Es reist über den **Auftrags-Zustand**, **nicht** als `Ergebnis<T>` einer Aufrufantwort (9.1.1); der Aufruf selbst ist `reiheEin('import', …)` → `Ergebnis<{ auftragId }>`. Fehlercodes: 9.4.9.

**`löscheMedium` (Auftrag `art: loeschen`):** Eingang `LöschRequest`:

| Feld | Inhalt |
|---|---|
| `projektId` | Projekt-Kontext |
| `assetId` | zu löschender Asset |

**Auftrags**-Ergebnis bei Erfolg: `{ assetId }` – ebenfalls über den Auftrags-Zustand (s. o.). Fehlercodes: 9.4.9.

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
2. `ffprobe` auf die `.part`-Datei, **mit Timeout** *(außerhalb des Locks)*.
3. `fs.rename` `.part` → `media/<uuid>.<ext>` — **atomar**, weil gleiche Partition (Staging liegt in `media/`; cross-volume-rename wäre copy+delete und **nicht** atomar).
4. **[D1-Lock]** Asset in D1 anhängen und schreiben *(Millisekunden)*.

Crash vor 3 → nur eine `.part`-Leiche; Crash nach 3 vor 4 → eine fertige Waise ohne D1-Eintrag. Beides räumt der Reconcile (9.4.7) auf.

#### 9.4.6 Lösch-Ablauf (D1 zuerst)

1. **[D1-Lock]** Referenzen prüfen. Referenziert (ListItem zeigt darauf)? → Fehler `asset_referenziert` (mit `referenzenIds`), Abbruch. Sonst: Asset-Eintrag aus D1 entfernen, schreiben. **Referenzprüfung und Entfernen im selben kritischen Abschnitt** → schließt die TOCTOU-Lücke gegen ein gleichzeitiges Setzen einer neuen Referenz durch den `composer`.
2. `fs.unlink` der Datei *(außerhalb des Locks)*, auf Windows mit **Retry + Backoff** bei `EBUSY`/`EPERM` (Handle der Vorschau hängt evtl. Millisekunden nach; der Render-Fall ist durch die serielle Queue bereits ausgeschlossen).
3. Schlägt `unlink` endgültig fehl → Pfad in `pendingDeletions` (**Q2**, `projects/<id>/queue-retry.json` – gehört der Auftragsverwaltung, 9.3); der Reconcile beim nächsten Öffnen des Projekts holt es nach (9.4.7).

**Bewusster Trade-off (D1 zuerst):** Referenz-Konsistenz ist **immer** garantiert (nie zeigt ein ListItem auf eine gelöschte Datei = nie ein kaputter Render). Preis: bei fehlgeschlagenem `unlink` liegt kurzzeitig eine Datei **ohne** D1-Eintrag auf der Platte (Speicher erst nach Reconcile frei). Konsistenz gewinnt gegen Aufräum-Sauberkeit.

**Vorbedingung Vorschau (Regel B):** Vor einem `loeschen` gibt der Renderer jeden `<video>`-Handle auf diesen Asset frei (`src=""`, `load()`); der Windows-Retry ist nur Sicherheitsnetz.

#### 9.4.7 Reconcile beim Projektstart

Beim Öffnen eines Projekts, **bevor** die UI Medien zeigt (kein Render/keine Vorschau hält dann Handles):

- **Datei in `media/` ohne D1-Eintrag** (Crash-/`unlink`-Waise, `.part`-Leiche) → löschen, Speicher zurück.
- **D1-Eintrag ohne Datei** → `Asset.zustand = "fehlt"`. Die UI zeigt ihn rot; der `render-service` bricht **früh** mit `medium_fehlt` ab statt mitten im Lauf.
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
| `asset_referenziert` | ein ListItem zeigt noch darauf; enthält `referenzenIds: string[]` |
| `datei_fehler` | Datei konnte nicht gelöscht werden (nach Retry) → als `pendingDeletion` vorgemerkt |

---

### 9.5 Schnittstellen `project-store` [D1] und `config-store` [D3]

**Fachlich:** Diese beiden besitzen die **persistenten Fach- und App-Daten** und das **automatische Speichern** (FA-15). Der `project-store` besitzt zusätzlich das **eine D1-Schreib-Lock**, durch das *alle* `project.json`-Mutationen laufen (auch die von `media-service` delegierten), und ist die **Pfad-Autorität** des Projekts: er löst alle Medienpfade auf und trägt das `media://`-Protokoll (9.5.7).

#### 9.5.1 `project-store` – Verantwortung & Modell

- Besitzt `project.json` je Projekt (Projekt, Aktionen-Bibliothek, Liste, Vorlagen-Ref) und das **eine D1-Schreib-Lock**.
- Das **aktive** Projekt lebt zur Laufzeit **im Speicher** (Quelle der Wahrheit während der Sitzung; Lesezugriffe sind sofortig). Nur *ein* Projekt ist gleichzeitig geladen.
- Die **Projekt-Liste** (FA-10) sind leichte Metadaten (Name, Erstell-/Änderungsdatum, Ordner), bei Bedarf aus dem `projects/`-Ordner gelesen.
- Führt alle **Instant-Operationen** aus (nicht über die Queue): Aktion CRUD, Liste ordnen, Trim/Dauer setzen.
- Ist die **Pfad-Autorität** des Projekts: löst `(projektId, dateiname) → absoluter Pfad` auf und trägt das `media://`-Protokoll für den Renderer-Lesezugriff (9.5.7).

#### 9.5.2 Operationen (Instant, über das D1-Lock)

**Projektverwaltung (FA-10):**

| Operation | Eingang → Ausgang |
|---|---|
| `erstelleProjekt` | `name` → `Ergebnis<Projekt>` (neuer Ordner + leeres `project.json`) |
| `öffneProjekt` | `id` → `Ergebnis<Projekt>` (lädt in den Speicher; setzt aktives Projekt via `config-store`) |
| `listeProjekte` | – → `Ergebnis<ProjektMeta[]>` (id, name, erstelltAm, geändertAm, ordner) |
| `dupliziereProjekt` | `id`, `neuerName` → `Ergebnis<Projekt>` (kopiert `project.json` **und** `media/`) |
| `löscheProjekt` | `id` → `Ergebnis<void>` (entfernt den Projektordner; war es aktiv, fällt `config-store` sanft zurück) |

**Aktionen (Bibliothek, referenzierbar):**

| Operation | Eingang → Ausgang |
|---|---|
| `erstelleAktion` | `aktionsdaten` → `Ergebnis<Aktion>` |
| `bearbeiteAktion` | `id`, `aktionsdaten` → `Ergebnis<Aktion>` |
| `löscheAktion` | `id` → `Ergebnis<{ entfernteElementIds: string[], geaenderteElementIds: string[] }>` – **Kaskade**: entfernte Listenelemente **und** Videos mit gekürztem Band, s. 9.5.3 |

**Liste:**

| Operation | Eingang → Ausgang |
|---|---|
| `fügeElementHinzu` | `referenz` (Asset- **oder** Aktions-ID) → `Ergebnis<Listenelement>` |
| `entferneElement` | `elementId` → `Ergebnis<void>` |
| `ordneNeu` | `reihenfolge` (elementIds) → `Ergebnis<void>` |
| `setzeTrim` | `elementId`, `trimStart`, `trimEnde` → `Ergebnis<Listenelement>` (validiert `0 ≤ start < ende ≤ Videodauer`) |
| `setzeDauer` | `elementId`, `dauer` → `Ergebnis<Listenelement>` (validiert Bereich **10–45 s** für Bild/Segment) |

#### 9.5.3 Löschsemantik – bewusste Asymmetrie

- **Medium löschen** (`media-service` 9.4.6): **blockiert** bei Referenz (`asset_referenziert`). Die Datei ist die schwere, geteilte Ressource; versehentlicher Verlust wäre teuer.
- **Aktion löschen** (`löscheAktion`): **Kaskade – aber chirurgisch.** Eine Aktion kann an **zwei** Stellen referenziert sein, und die richtige Reaktion ist jeweils eine andere:
  1. **Listenelement mit `art: "segment"`**, dessen `ref` die Aktion ist → das Element **ist** diese Aktion und wird **entfernt**.
  2. **`einblendung.abschnitte[].aktionRef`** in einem **Video**-Element → die Aktion ist nur **ein Abschnitt** eines rotierenden Bandes. Hier werden **ausschließlich die betroffenen Abschnitte** entfernt; das **Videoelement bleibt erhalten**.

  **Warum diese Unterscheidung zwingend ist:** Würde Fall 2 wie Fall 1 behandelt, verlöre der Nutzer sein **Video aus der Wiedergabeliste**, nur weil eine von mehreren rotierenden Werbeaktionen gelöscht wurde. Würde Fall 2 gar nicht behandelt, bliebe eine **verwaiste Referenz** und der Render bräche.

  **Randfall:** Wird ein Band durch das Entfernen leer (keine Abschnitte mehr), entfällt die **Einblendung ganz** (`einblendung = null`) – das **Videoelement bleibt**. Ein Band mit null Abschnitten hätte nichts zu zeigen, und der Render müsste eine Bandspur der Länge 0 bauen.

  **Rückgabe:** `löscheAktion` meldet **beide** Wirkungen – `entfernteElementIds` (entfernte Listenelemente) **und** `geaenderteElementIds` (Videos, deren Band gekürzt oder entfernt wurde) – damit die UI vorher präzise warnen kann („wird aus 2 Elementen entfernt und aus dem Werbeband von 3 Videos").

  Die von der Aktion **verwendeten Medien-Assets bleiben unangetastet** und projektweit verfügbar – eine Aktion *referenziert* ein Asset nur, sie besitzt es nicht.

#### 9.5.4 Auto-Speichern (Invarianten, bindend)

- **Entprellt 3–5 s** nach der letzten Änderung (kein Platten-Hämmern beim Slider-Ziehen).
- **Sofort-Flush** unabhängig vom Timer: **vor** jedem Render/Export, **bei** Projektwechsel, **beim Beenden**. Beim Beenden **blockiert** die App, bis der Schreibvorgang abgeschlossen ist (kein Schließen mit ausstehendem Schreiben).
- **Atomar:** Schreiben nach Temp-Datei + Rename (gleiche Partition). `project.json` ist **nie** halb geschrieben.
- **Ein Backup:** `project.json.bak` = letzte heile Version. Ist `project.json` beim Laden defekt → aus `.bak` wiederherstellen; ist auch das defekt → **Fehler melden**, **nicht** leer/verlustbehaftet weiterstarten.
- **Genau eine App-Instanz (Voraussetzung für das ganze Lock-Design):** Das D1-Schreib-Lock ist ein **prozessinternes** Lock. Zwei gleichzeitig laufende App-Instanzen hätten **zwei unabhängige** Locks auf derselben `project.json` – das Ergebnis wäre ein Lost Update und damit **Datenkorruption**. Deshalb erzwingt die App beim Start eine **Einzel-Instanz-Sperre**; ein zweiter Start **fokussiert das bestehende Fenster** statt eine zweite Instanz zu öffnen.
  **Wichtig für die portable Auslieferung:** Die Sperre muss an den **Datenort** gebunden sein (den App-Ordner mit `projects/`), nicht an den Programmpfad. Sonst könnten zwei Kopien der portablen EXE, die auf **dieselben** Daten zeigen, beide starten – genau der Fall, den die Sperre verhindern soll.
- **Lock-Grenze:** Das D1-Lock schützt **nur** `project.json`. Die Auftragsverwaltungs-Speicher Q2/Q3 (eigene Dateien, 9.3) haben ihre **eigene** Serialisierung – der `auftrags-manager` hängt **nicht** am `project-store`-Lock.
- **Instant-Op vs. Speichern getrennt:** Eine Instant-Operation (9.5.2) validiert und wendet **im Speicher** an, *bevor* sie „ok" meldet – ihr Erfolg bedeutet „gültig übernommen", **nicht** „schon auf Platte". Die Platten-Schreibung ist die entprellte Auto-Speicherung.
- **Speicherfehler sind sichtbar (NFA-02):** Scheitert eine Auto-Speicherung (Platte voll, Rechte), wird das **nicht still verschluckt** – die UI zeigt dauerhaft „nicht gespeichert" + automatischer Wiederholversuch; die Änderungen **bleiben im Speicher** (kein Rollback, kein Arbeitsverlust). Erst nach erfolgreichem Schreiben verschwindet der Hinweis.

#### 9.5.5 `schemaVersion` & Migration

Jede `project.json` und `config.json` trägt eine `schemaVersion`. Beim Laden: **höhere** (unbekannte) Version → Fehler (nicht raten); **ältere** Version → definierte Migration auf die aktuelle. So bleiben ältere Projekte nach App-Updates lesbar.

#### 9.5.6 `config-store` [D3]

Besitzt `config.json` (app-weit): aktives Projekt, letztes Export-Ziel, UI-Voreinstellungen, Marke.

| Operation | Eingang → Ausgang |
|---|---|
| `leseKonfig` | – → `Ergebnis<AppKonfig>` |
| `setzeAktivesProjekt` | `projektId` → `Ergebnis<void>` |
| `setzeExportZiel` | `pfad` → `Ergebnis<void>` |
| `leseMarke` | – → `Ergebnis<Marke>` (**nur lesend**) |
| `setzeUIVoreinstellung` | `schlüssel`, `wert` → `Ergebnis<void>` |

- **Marke gebündelt & read-only** im MVP (Palette #FF4040 …, Logo fix); ein Marken-Editor ist kein MVP (wie FA-13).
- **Sitzungswiederherstellung (FA-15):** beim Start das zuletzt aktive Projekt laden; **fehlt** es (extern gelöscht) → sanfter Rückfall auf „kein aktives Projekt / Projektliste", **kein** Absturz.
- Gleiche Schreib-Invarianten wie 9.5.4 (atomar, `schemaVersion`).

#### 9.5.7 Pfad-Autorität & `media://`-Protokoll

- **`project-store` ist die eine Pfad-Autorität.** Er löst `(projektId, dateiname) → absoluter Pfad` auf – die **einzige** Quelle der Wahrheit für das Datei-Layout eines Projekts (`projects/<id>/media/<datei>`). Jeder Main-Dienst, der eine Mediendatei anfassen muss, **resolved den Pfad über den `project-store`**, statt das Layout selbst zu kennen: `media-service` (kopieren/löschen), `render-service` (lesen beim Normalisieren), `export-service` (Quelle: die gewählte Datei aus `projects/<id>/output/`). Er löst ebenso `(projektId, ausgabeName) → projects/<id>/output/<name>.mp4` auf. So kann eine Layout-Änderung nirgends auseinanderlaufen.
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

**Auftrags**-Ergebnis bei Erfolg: `{ zielPfad, dateigroesse }` – über den **Auftrags-Zustand**, **nicht** als Aufrufantwort (9.1.1); der Aufruf ist `reiheEin('export', …)` → `Ergebnis<{ auftragId }>`. Fehlercodes: 9.6.4.

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
- **`project-store` ist die Wahrheit:** die Liste im composer ist nur eine Sicht; nach jeder Mutation mit dem Rückgabestand abgleichen.
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
  akzentfarbe:  string          // aus der Markenpalette (feste Auswahl, v1)
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
- **Akzentfarbe nur aus der Markenpalette** (feste Auswahl in v1, kein freier Farbwähler) – so bricht keine Aktion aus dem Corporate Design aus.
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
  - **`split`:** Das `<video>` wird in den oberen Bereich **1920 × (1080 − H)** gelegt (`contain`), die Restflächen links/rechts in der **Markenfarbe** gefüllt; das Band-Canvas (**1920 × H**) sitzt **darunter**.
  - **`einblendung`:** Das `<video>` bleibt **vollflächig** 1920 × 1080 (schwarze Balken nach 9.2.4); das Band-Canvas (**1920 × H**, mit **Alpha**) liegt **darüber** am unteren Rand. Die Überlagerung im DOM respektiert den Alphakanal von sich aus.
- **Zeitverhalten identisch zum Render:** Das Band **wechselt zeitgesteuert** nach den Abschnitts-Dauern (frame-gerundet), **wiederholt** sich, wenn die Folge kürzer als das (getrimmte) Video ist, und wird am Videoende **abgeschnitten** – **dieselben** Regeln wie 9.2.8.
- **Invariante:** Die Vorschau **rechnet die Geometrie nach derselben Formel** wie `render-service` (9.2.8). Eine eigene, abweichende Herleitung im Renderer würde genau die Übereinstimmung zerstören, für die der `preview-player` existiert.

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

**Playfair Display ist auf Windows/macOS nicht vorinstalliert.** Die Marken-Schriften werden daher als **Dateien mit der App gebündelt** und explizit registriert/geladen (`FontFace`), bevor gezeichnet wird. Andernfalls rendert der Canvas still auf eine Fallback-Schrift → Vorschau ≠ Endvideo **und** Markenbruch. *(Konsequenz für die Verpackung: die Font-Dateien gehören ins Bundle.)*

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

---

### 9.11 Geteilte Datenmodelle: `Vorlage` und `Marke`

Dieser Abschnitt sammelt die **geteilten Datenmodelle** aus `contracts/types`: `Vorlage` und `Marke` (9.11.1/9.11.2 – gemeinsam mit der `Aktion` der Eingang von `template-canvas`, 9.10) sowie `Project` und `Listenelement` (9.11.3) und die projektweiten Festlegungen zu IDs und Konstanten (9.11.4). Alle sind **datengetrieben**, damit eigene Vorlagen (FA-13) ein reiner Datensatz bleiben.

#### 9.11.1 `Vorlage`

```
Vorlage {
  id:        string        // "vollbild" | "split" | "band-standard" | <uuid> bei eigenen
  name:      string        // Anzeigename
  art:       "vollflaeche" | "split" | "einblendung"   // Fläche + Kompositionsart (s. u.)
  höhe:      number | null // nur bei "split"/"einblendung": Bandhöhe in px; bei "vollflaeche" null
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
7. **Farben und Schriften sind Rollen-Verweise in die `Marke`** (z. B. `farbRolle: "akzent"`, `schriftRolle: "headlineDisplay"`), **keine** Hex-Werte oder Font-Namen. So bleibt ein Marken-Wechsel ein Datenwert und keine Vorlagen-Änderung.

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
  farben:      { <FarbRolle>: string }      // Hex, 6- oder 8-stellig (8 = mit Alpha)
  schriften:   { <SchriftRolle>: Schrift }
  logo:        { datei, seitenverhaeltnis }  // Balken ist im Asset enthalten
  sicherheit:  { horizontal: 96, vertikal: 54 }   // absolute px im 1920×1080-RAHMEN
  radien:      { pille: 40, karte: 10, klein: 2 }
  schatten:    { versatzY: 4, weichzeichnen: 8, farbe: "#0000001A" }
  slogan:      { text: string, aktiv: boolean }
}
Schrift { familie, gewicht, datei }
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

**Marke ist in v1 gebündelt und read-only** (`config-store.leseMarke`, 9.5.6); ein Marken-Editor ist kein MVP.

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
- **`höhe` nur bei `split`/`einblendung`**, Wertebereich > 0 und < 1080. Bei `vollflaeche` immer `null`.
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
- **Nutzung wird angezeigt,** bevor überarbeitet oder gelöscht wird („wird von 7 Aktionen in 2 Projekten verwendet") – ein Merge verändert **alle** davon. Die Lösch-Sperre selbst sitzt im `vorlagen-store`.
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
- **Zwei getrennte Historien:** Projekt-Bearbeitung und Vorlagen-Editor haben **eigene** Stapel (sie bearbeiten verschiedene Datensätze) und werden nie vermischt.
- **Begrenzte Tiefe** (Größenordnung 50 Schritte), damit der Speicherbedarf gedeckelt bleibt.
- **Nur Laufzeit** (Kategorie D): die Historie wird **nicht** persistiert und ist nach Projektwechsel, Editor-Schluss oder App-Neustart leer.
- **Undo/Redo läuft über denselben Pfad wie eine normale Änderung** – es aktualisiert den Speicher und löst das gewohnte Auto-Speichern (9.5.4) aus. **Kein** Sonderweg, der Platte und Speicher auseinanderlaufen ließe.

#### 9.13.3 Invariante gegen Datenverlust (wichtig)

**Ein Auftrag, der D1 verändert (Medien-Import oder -Löschen), leert die Undo-Historie der Projekt-Bearbeitung.**

*Begründung:* Ohne diese Regel entsteht Datenverlust. Beispiel: Du ordnest die Liste um (Schnappschuss), dann läuft ein Import durch und trägt ein neues Asset in D1 ein, dann drückst du Undo – der Schnappschuss stammt aus der Zeit **vor** dem Import und würde das neu importierte Asset **wieder entfernen**. Genau diese Klasse von Fehlern soll die Regel ausschließen. Da Aufträge seriell und vergleichsweise selten sind (9.3), ist das Leeren der Historie ein billiger Preis für Korrektheit.

---

### 9.14 Modul `app-shell` (Renderer): Aufbau und Navigation

**Fachlich:** Die `app-shell` ist der Rahmen, der die fünf Renderer-Oberflächen anordnet und den Wechsel zwischen ihnen führt. Ohne sie wäre offen, wo `composer`, `action-editor`, `vorlagen-editor`, `preview-player` und `queue-panel` überhaupt leben.

#### 9.14.1 Grundstruktur: Modus-Reiter + Warteschlangen-Leiste

```
┌─ [Zusammenstellen] [Aktionen] [Vorlagen] [Projekte] ──────────────────────┐
│                                                                           │
│   Der gewählte Reiter nutzt die ganze Fläche:                             │
│     Zusammenstellen = composer [P3]  +  preview-player [P5]               │
│     Aktionen        = action-editor [P2]  + große Live-Vorschau           │
│     Vorlagen        = vorlagen-editor (Canvas + Zonen-Liste + Inspektor)  │
│     Projekte        = Projektverwaltung (FA-10)                           │
│                                                                           │
├───────────────────────────────────────────────────────────────────────────┤
│ queue-panel als schmale Leiste: „Render läuft · 3 von 7"  ▸ aufklappbar   │
└───────────────────────────────────────────────────────────────────────────┘
```

**Begründung der Wahl:** `action-editor` und `vorlagen-editor` brauchen **beide** eine Live-Vorschau über `template-canvas` in **lesbarer** Größe (9.8, 9.12.2), der Vorlagen-Editor zusätzlich Canvas **plus** Zonen-Liste **plus** Inspektor. Eine schmale Seitenspalte oder ein Seitenblatt kann das nicht leisten. Reiter geben jeder Oberfläche die volle Fläche – auf einem Laptop-Bildschirm die tragfähige Lösung.

#### 9.14.2 Invarianten (bindend)

- **Die Warteschlangen-Leiste ist in *jedem* Reiter sichtbar.** Sie ist die einzige Stelle, an der laufende, anstehende und fehlgeschlagene Aufträge erkennbar sind (FA-16) – sie darf nie hinter einem Moduswechsel verschwinden. Eingeklappt zeigt sie den Zustand in einer Zeile, aufgeklappt die volle Liste (9.3.4).
- **Der geführte Reparatur-Modus wechselt den Reiter.** Führt die Reparatur eines Aktions-Bildes in den `action-editor` (9.7.5, 9.8.5), wechselt die Shell in den Reiter **Aktionen**, hebt die betroffene Aktion hervor und **kehrt danach zum Reiter Zusammenstellen zurück**, zur nächsten kaputten Stelle. Der Fortschritt „X von N behoben" bleibt dabei **über den Reiterwechsel hinweg** sichtbar – sonst verliert der Nutzer den Faden.
- **Ein Reiterwechsel verwirft nie Arbeit.** Instant-Änderungen sind bereits gesichert (9.5.4); eine offene Vorlagen-**Arbeitskopie** bleibt beim Verlassen des Reiters erhalten (9.12.1) und wird beim Zurückkehren fortgesetzt. Es gibt **keinen** „ungespeicherten Zustand", der beim Wechseln verlorengeht.
- **Undo/Redo gilt im jeweils aktiven Reiter** und arbeitet auf dessen Historie (9.13.2: getrennte Stapel für Projekt-Bearbeitung und Vorlagen-Editor). Ein Reiterwechsel **vermischt** die Historien nicht.
- **Ohne offenes Projekt sind die Reiter Zusammenstellen/Aktionen leer statt kaputt.** Beim Start ohne wiederherstellbares Projekt (9.5.6) landet der Nutzer im Reiter **Projekte**; die anderen Reiter zeigen einen Hinweis, keine Fehlermeldung.
- **Die Shell rendert selbst keine Inhalte** – sie ordnet an, wechselt und hält die Warteschlangen-Leiste. Alles Fachliche liegt in den fünf Modulen.

---

> **Stand des High-Level-Designs.** **Ausgearbeitet:** `render-service` (9.2), `auftrags-manager` (9.3), `media-service` (9.4), `project-store`/`config-store` (9.5), `export-service` (9.6), `composer` (9.7), `action-editor` (9.8), `preview-player` (9.9).
>
> **Das High-Level-Design ist damit vollständig.** Alle Modul-Verträge (9.2–9.10, 9.12, 9.14), alle geteilten Datenmodelle (9.11), die Konventionen des IPC-Vertrags (9.1.1) und das Ausgabe-Profil (9.2.4) sind ausgearbeitet.
>
> Geschlossen sind: die Lücken des Prüfbefunds vom 03.07. (Einzel-Instanz 9.5.4, ID-Schema und Konstanten 9.11.4, `RenderProfile` 9.2.4 samt Audio-Entscheidung R-06); die Anforderungsänderung Split-Screen (FA-20: 9.2.8, 9.11.1); Vorlagen-Erstellung und -Bearbeitung (FA-13: 9.12 samt Arbeitskopie-Fluss); Undo/Redo (FA-21: 9.13); das Warteschlangen-Journal Q4 (9.3); und der Aufbau der Oberfläche (9.14).
>
> **Nächster Schritt – nur nach ausdrücklicher Freigabe:** Überführung in agent-taugliche Tasks. Bis dahin gilt weiter die Planungsphase (kein Code).
