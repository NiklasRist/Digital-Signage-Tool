# Übergabe – Session 09.10.2026 (Aufräumen, Treiber gebaut, Issues erledigt)

> Für die nächste Sitzung: Lies zuerst CLAUDE.md (STAND HEUTE 09.10.), dann diese Datei.

## Erledigt und gemerged

| Issue | Ergebnis | Belege |
|---|---|---|
| #7 | geschlossen | mac-Zielformat `dir` (Kommentar im Issue); Commit `6c31a08`, Merge `b1f1534`; die `.app` lief am echten Mac |
| #401 | geschlossen | vier Test-Attrappen mit `mockResolvedValue`; Merge `5ff1bb6`; Spec meldet `Errors 0` |
| #402 | geschlossen | tote Dateien gelöscht (63 Zeilen); Leiste bleibt (App.tsx:59); Merge `d1abaa6` |
| #403 | entwertet, geschlossen | Treiber-Rauschen; App arbeitete korrekt; Treiber gefixt; Merge `d217936` |
| #404 | Teil 1 erledigt | Seed-Import gemessen; Merge `bde004c`; Rest offen |

Dazu: Der TV-Test entfällt (User-Entscheid); Nachträge an #184, #186 und #188 sind
angehängt, die Übergaben nachgezogen. Der #7-Befund „.app startet am echten Mac“ ist im
Issue belegt.

## Basis-Abgleich #340 bis #353

Quelle: E2E-Lauf vom 26.08. Gegen heutiges main gemessen, Beleg je Kommentar:

- **7 geschlossen:** #341, #343, #344 (deckt den #70-Fix), #345, #348, #349, #353
  (#353 mit Restnotiz: Ersetzen läuft über die geführte Reparatur).
- **6 offen** – die „fertige Funktion ohne Aufrufer"-Familie: #340 (media://-Stub),
  #342 (Dialoge gebaut, niemand mountet), #346 (startHinweis ohne Rücksetzweg),
  #347 (Auffrisch der Ausgaben fehlt bei Render/Export), #350 (tastatur.ts ohne
  Aufrufer), #352 (Roh-Codes am Aktionsfeld).

## Der Treiber

Datei `scripts/durchlauf.mjs`, Start mit `npm run durchlauf` (`7f9c096`,
Ausbau `ff90c7f`):
- Startet das gebaute Fenster und räumt vorher `instanz.lock`/`instanz.signal` weg.
- Bedient mit `puppeteer-core`: Klicks über `data-testid`, Messung über `evaluate`.
- Sammelt `queue:geaendert` und `render:fortschritt` in `window.__durchlauf.kanaele`,
  Fenster-Fehler über `pageerror`.
- Erzeugt ein Testvideo (320×180, 2 s) mit dem gebündelten ffmpeg-static und importiert
  es über `queue:reiheEin`. Der echte Dateidialog bleibt nativ und wird nicht gemockt.
- Ergänzt das Fundsprotokoll `docs/agents/oberflaeche-durchlauf.md`.

## Messfallen des Treibers (so messen, sonst Rauschen)

1. Wartezeit: Anlegen und Öffnen brauchen Sekunden; 2,5 s sind der gemessene Minimalwert.
   Eine kürzere Messung war dreimal ein Falsch-Befund.
2. Zähle Zeilen über Kennungen (`[data-testid^="projekt-"]`), nicht über Text:
   `innerText` liest versteckte Elemente nicht, die Reiter bleiben aber gemountet.
3. Der Reiterstand gehört zur Messung: Nach jedem Ablauf zuerst messen, welcher Reiter
   aktiv ist (Aria-selected), dann an der richtigen Stelle lesen.

## Nächste Session (Reihenfolge)

1. **#342 ZUERST:** die zwei Dialoge in den Composer einhängen. Klein, und der
   Render-Schritt des Treibers braucht sie.
2. **#404 Rest:** Vorlagen-Editor-Sitzung (Kopf, Inspektor, Vorschau gegen Marke #313),
   Marken-Reiter je Zeile (Standardmarke #324/#399), Render-Ablauf nach #342.
3. **Die offenen Lücken:** #340 (media://-Handler statt Stub), #347 (Auffrisch),
   #346 (Rücksetzweg), #350 (Tastatur aufrufen), #352 (Sätze statt Codes).
4. Danach nach Fundlage; je Fund: Messen → Ursache → Fix → Gegenprobe → Issue-Nachtrag.

## Beim User

- Etwa 185 Commits ungesendet auf origin; Push nur auf ausdrückliche Anweisung.
- Optische Abnahme der Marken-Speicher-Anzeige (#327-Nachtrag).
- Design („Oberfläche 2.0") kommt NACH dem Durchlauf als eigener Schnitt; Markenfarbe
  ROT (#FF4040/#DF3131/#971316), Logo bleibt, Referenz Canva/Clipchamp-Klarheit.

## Verfahrensfehler dieser Session (transparent)

Die Sprache-Fehlklasse (verbastelte Wortfolgen in langen Schreibein) ist fünfmal
aufgetreten: Issue-Body #401, der CLAUDE.md-Abschnitt, die Treiber-Injektion, zwei
Issue-Kommentare, der erste Übergabe-Draft. Alle Orte sind berichtigt; die Berichtigung
von #401 ist im Issue benannt. Geltung bleibt: Schreiben in Halbzeiten, Sprachprobe
(Codepoints > U+2100, kyrillische Reste) und Wort-Skan nach jedem Schub; bei Fasern
SOFORT STOPPEN, nichts Destruktives laufen.
