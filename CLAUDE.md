# PROJEKT-ÜBERGABE – Digital-Signage-Tool (Baller Gruppe)

## Deine Rolle & meine Arbeitsweise
- Du hilfst mir (Berufspraktikant bei der Baller Gruppe) bei Planung und später Entwicklung
  eines Digital-Signage-Tools. Im Anhang: zwei Dokumente, die den Stand festhalten.
- WIR SIND IN DER PLANUNGSPHASE. Kein Code, keine Task-Listen, bis ich ausdrücklich sage
  „wir sind nicht mehr im Plan". Wenn du anfängst zu coden, ohne dass ich es sage: stopp.
- Arbeite Schritt für Schritt, ein Thema pro Schritt, und frag am Ende kurz nach Bestätigung,
  bevor du weitergehst. Keine Sprünge nach vorn.
- Ich hasse Ambiguität. Triff klare Annahmen, benenne sie offen und beseitige Unklarheiten aktiv.
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
- Anforderungsdokument v1.2 = das „WAS" (Funktionen, Regeln, Ausgabe-Profil, Akzeptanz).
- Technisches Konzept v2.5 = das „WIE" (Architektur, Datenbestand, DFD, HLD Abschnitt 9).
  Bitte beide unbedingt lesen, bevor du etwas vorschlägst.
- WORKFLOW: Markdown ist Quelle der Wahrheit; beide .docx werden daraus generiert mit
  `node tools/generate-docx.js <in.md> <out.docx> [--dfd tools/assets/dfd.png]`. Nach jeder
  Änderung .md und .docx synchron halten. Agent-Kontext: docs/agents/system-design-context.md
  ist das lebende Kontextdokument und wird laufend mitgepflegt.

## Wichtigste Festlegungen (schon entschieden)
- Ausgabe-Profil: MP4, H.264 High, 1920×1080, 30 fps, ~10–12 Mbit/s, stumm. Dateiname FREI (FA-22).
  Abweichende Seitenverhältnisse → schwarze Balken (Letterbox/Pillarbox, kein Beschnitt).
  Videos sind trimmbar; Standard-Segmentdauer 10 s (einstellbar 10–45 s); harter Schnitt.
- Tech-Stack: Electron + TypeScript + React + Vite; dnd-kit; HTML5-Canvas → PNG für Aktions-Segmente;
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
  → Bildschirm) und P4 finaler Render (ffmpeg → benannte Ausgabe-MP4 → USB).
- Vorschau = UI-Simulation: Aktions-Segmente nutzen exakt dasselbe Canvas-Bild wie der finale Render
  (pixelgleich), Videos laufen nativ; finale Kontrolle bleibt die gerenderte Ausgabedatei.

## HLD-Modulschnitt (von mir bestätigt)
- Renderer: ipc-client, app-shell, composer [P3], action-editor [P2],
  template-canvas (geteilt: Segment → PNG), preview-player [P5].
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
2. HLD finalisieren: je Modul ein scharfer Schnittstellen-Vertrag (Eingang → Ausgang, fachlich, ohne
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
     Kaputt-Handling 9.8.5 (fehlt-Bild → Fix auf Aktions-Ebene behebt alle referenzierenden Elemente).
   - ERLEDIGT: preview-player [P5] (9.9) – UI-Simulation ohne ffmpeg, Medienzugriff über media:// (9.5.7).
   - ERLEDIGT: project-store ist Pfad-Autorität + trägt media://-Protokoll (9.5.7); Detail durchgängig in 2,
     8, 9.1, 9.2.5, 9.4.1, 9.5, Modul-Liste ergänzt (Renderer-Medienzugriff nur lesend via media://).
   - ERLEDIGT: template-canvas (9.10) – EINZIGE Pixelquelle: eine Zeichenroutine → Canvas 1920×1080,
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
     Projekt sie nutzt → Referenzprüfung über ALLE Projekte; eingebaute unlöschbar + eingefroren.
   - ERLEDIGT: Marke (9.11.2, Rollen + gebündelte OFL-Schriften Playfair/Archivo Black/Arimo);
     RenderProfile geschärft (9.2.4: yuv420p, High/L4.0, BT.709, SAR 1:1, gedeckeltes VBR, geschlossene GOP +
     Keyframe je Segment, stille AAC-Spur → R-06 entschieden, +faststart); Einzel-Instanz (9.5.4, an den
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
   Arbeit läuft auf dem Branch planung/ad-v1.2-tk-v2.3-issues, NICHT nach main mergen.
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
   - M2-M7 offen. Dry-Run in docs/agents/issues-draft.md, Freigabe vor jedem Anlegen.
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
   BASIS: docs/agents/issue-generation-prompt.md ist die selbsttragende Übergabe-Prompt dafür
   (Modulschnitt, alle Invarianten zum Wörtlich-Zitieren, Pflicht-Issue-Vorlage + ausgefülltes Beispiel,
   Meilensteine M0-M7 inkl. Grundgerüst-Issues S1-S12, Labels, Dry-Run-vor-Freigabe-Ablauf).
   HINWEIS Doku-Workflow: .docx NIE schreiben, während Word offen ist (Vorfall 03.07.: Schreiben-während-offen
   + harter Neustart hat Datei beschädigt). Generieren → Staging → validieren → nur bei freier Datei platzieren,
   sonst stoppen und User bitten. Keine Retry-Kopier-Schleifen.
