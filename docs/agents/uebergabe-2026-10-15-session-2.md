# Uebergabe – Session 15.10.2026 (Session 2: User-Abnahme der Kernachse → „Ein Projekt – ein Video")

> Fuer die naechste Sitzung: Lies zuerst CLAUDE.md (STAND HEUTE), dann diese Datei.
> Vorgaenger derselben Sitzung: `docs/agents/uebergabe-2026-10-15.md` (die sechs Kernachse-Nachzuege).

## Worum es ging
Die Session begann mit **Push** und der **User-Abnahme der Kernachse** (#416–#421). Aus der Abnahme
entstanden **Anforderungsaenderungen**, die dokumentiert UND gebaut wurden.

## Entschieden (User) und umgesetzt

| Thema | Entscheidung | Stand |
|---|---|---|
| **Ein Projekt – ein Video** | genau EIN Video (AD FA-01/03/05 ueberstimmt); Durchsetzung **nur in der Oberflaeche** | AD v1.7, TK v3.21/9.7.6 |
| **Import-Beschriftung** | „Medien importieren" → **„Video importieren"** (Composer + Bibliothek) | #422 |
| **Auto-Uebernahme** | neu importiertes Video landet **automatisch ans Listenende** | #422 |
| **Ersetzen** | bei vorhandenem Video **Bestätigung**, dann ersetzen in **EINEM** Undo-Schritt | #422 |
| **Immer genau ein Video** | Video wird **nicht geloescht**, nur ersetzt; „Loeschen" zeigt eine Meldung | #422 |
| **Video zuerst, Pflicht** | Anlegen oeffnet **zuerst** den Video-Dialog; **ohne Video kein Projekt** (Haekchen entfernt) | #423 |
| **Undo/Redo-Pfeile** | sichtbar in der Reiterleiste; Marken/Projekte abgeschaltet | #424 |
| **Aktionen aufs Video** | **Band parallel (FA-20)** UND **Aktion unterbricht das Video kurz** (neu) | nur dokumentiert: #425/#426 |

## Gebaut und gemergt (alle auf `main`, gepusht)
- **#422** [composer] – `72b1d62`/`4fddcda`
- **#423** [projekt-verwaltung] – `64b6a70`/`e3bb416`; **Video-Pflicht** – `f80daf9`/`de44830`
- **#424** [app-shell] Undo/Redo-Pfeile – `2aab0f8`/`93b0c53`
- Doku: AD v1.7 / TK v3.21 `367d5f9` u.a.; **Aktionen aufs Video** AD 4.5 / TK v3.22 (9.7.7) – `615450b`/`3bb966f`

## Nur dokumentiert (NICHT gebaut)
- **#425** [composer] Band-Bearbeitung anbinden + Aktion aufs Video ziehen = Band-Abschnitt (FA-20).
  Befund: `composer/einblendung-ansicht.tsx` (#253/M7-60) ist **fertig, aber nirgends montiert** –
  wieder „fertige Funktion ohne Aufrufer". Blockiert von #422 (jetzt frei).
- **#426** [braucht-entscheidung] „Aktion unterbricht das Video kurz" – **neue** Anforderung; Modell und
  Render (Video teilen: Video-Teil · Aktion · Video-Teil) sind **zu entwerfen**. Bewusst offen.

## Zaehler auf `main`
- **5491 Tests gruen (313 Dateien)**, Typecheck/Lint 0.
- **Alles gepusht** (0 Commits vor `origin/main`). Vorheriger Stand war 876825e; jetzt `3bb966f`.
- Untracked (bekannt): `.e2e-echt-datenort/`, `.e2e-flow-ist-datenort/`, `marken.json`, `marken.json.bak`.
- `docx`: Das `docx`-Paket fehlt in node_modules; ich habe es mit `npm install docx --no-save`
  installiert (package.json/Lock UNVERAENDERT). Der Doku-Workflow lief damit.

## Regeln/Beobachtungen der Session
1. **Der Haken war ein Bedienfehler, keine Anforderung** – der User wollte „Video zuerst, Pflicht"; das
   Aendern der Oberflaeche zog AD/TK + #423 nach.
2. **Neue Anforderung „immer ein Video" kippt #229:** das Medium-Loesch-Overlay ist im Composer ohne
   Ausloeser. NICHT entfernt (beruehrt #229/Grundbestand), an #422 als Nachzug vermerkt.
3. **Der Treiber musste nach:** Mit „Video zuerst" oeffnet das Anlegen einen NATIVEN Dialog → der
   Treiber kann kein Projekt mehr per UI anlegen. Loesung: Haekchen-Abwesenheit messen, dann Projekt per
   **IPC-Seed** (`window.api.invoke('project:erstelleProjekt')`) anlegen und ueber die **Liste oeffnen**.
4. **`#289`-Flaky** fiel im Volllauf zweimal (einzeln gruen) – unveraendert beobachten.
5. **Die Altmessung-Idee aus der Vorsession** hat sich bestaetigt: „zwischen Frames" meinte der User
   NICHT als Zeitleisten-Luecke, sondern als **waehrend des Videos** (Band/Unterbrechung).
6. **Banner-Spur:** Die Plan-Quelle `trennung-banner-aktionen-plan.md` **fehlt im Repo** (#371); die
   Band-Kette (#425) ist davon zu trennen.

## Naechste Sitzung
1. **User-Abnahme #422/#423/#424** (Regel: Treiber-Beleg ist KEINE Abnahme). Checkliste in der
   Antwort der Session; die App laeuft (falls zu: `./node_modules/electron/dist/Electron.app/Contents/MacOS/Electron dist/main/index.cjs` nach `npm run build`, vorher `instanz.lock`/`instanz.signal` raeumen).
2. Danach **#425 bauen** (Band anbinden + Drag aufs Video) – die groesste Luecke (Hauptbetriebsart).
3. **#426 entscheiden** (Modell/Render der Unterbrechung), dann Issues zuschneiden.
4. **Welle 2 / Banner-Spur** und die **#371-Klaerung** (fehlende Plan-Datei).
5. Aufraeumen: Branches `bau/422-…`, `bau/423-…`, `bau/424-…`, `bau/423-video-pflicht`, `bau/425-426-doku` loeschen; #215 bleibt Werkzeug-Limit.

## Beim User
- Push nur auf ANWEISUNG (aktuell alles gepusht).
- Optische Abnahme #327 weiterhin offen.
- #289-Flaky beobachten.
