# M8 – Marken: Zuschnitt (Inventar zur Freigabe)

> **Noch nichts geschrieben und nichts angelegt.** Diese Datei ist das Inventar nach Schritt 1 des
> Ablaufs (`uebergabe-stand.md`, Abschnitt 2). Nach deiner Freigabe: Volltexte, Prüflauf, Anlegen.
>
> Grundlage: AD **v1.3** (FA-23, FA-24, Abschnitt 4.8), TK **v3.4** (9.15, 9.10.10).
> Milestone-Titel: **`M8 – Marken`** · neues Label: `modul:marken-store`, `modul:marken-editor`.

---

## Die Unterscheidung, die den Umfang bestimmt

Nicht alles Neue ist ein neues Issue. Drei der berührten Typen sind **schon definiert** – ihre
Erweiterung ist ein **Edit** am bestehenden Issue und gehört damit in den Zitat-Abgleich, nicht hierher:

| Typ | Issue | Was sich ändert |
|---|---|---|
| `Marke` | **#52** (`M1-40`) | `id`, `name`, `parent`, `eingebaut`; `logo` wird `\| null`; `Herkunft` |
| `Aktion` | **#14** (`M1-02`) | neues Pflichtfeld `markeId` |
| `Project` | **#15** (`M1-03`) | neues Feld `standardMarkeId` |

Ein **neues** Issue entsteht nur, wo es **keine** bestehende Datei gibt, die man erweitern könnte.
Sonst hätten zwei Issues dieselbe Datei – die Lückenklasse, die in jedem Meilenstein aufgetreten ist.

---

## 32 neue Issues

### contracts (geteilt) – 2

| Nr. | Issue |
|---|---|
| M8-01 | [contracts] Typ `Markennutzung` definieren – die zwei Trefferlisten (Aktionen je Projekt, abgeleitete Marken) für die Referenzprüfung |
| M8-02 | [contracts] Fehlercode-Union des `marken-store` definieren (`marke_referenziert`, `marke_eingebaut`, `marke_nicht_gefunden`, `marken_datei_fehlt`) |

### `marken-store` [V2] (Main) – 13

| Nr. | Issue |
|---|---|
| M8-03 | Atomares Schreiben von `marken.json` mit `.bak` und `schemaVersion` |
| M8-04 | Auto-Speichern + Ereignis `marken:autoSpeichernStatus` (eigener Kanal, nicht der des Projekts) |
| M8-05 | **Vererbung auflösen** – die eine Stelle; feldweise, Parent-Werte für nicht gesetzte Felder |
| M8-06 | **Bestand beim Start sicherstellen** – existiert `marken.json` nicht, die eingebaute Fitnessworld24-Marke anlegen (`eingebaut: true`, `parent: null`) |
| M8-07 | **Migration aus `config.json`** – die namenlose Marke wird die eingebaute; `standardMarkeId` und `markeId` aller Projekte darauf setzen; Feld aus `config.json` entfernen |
| M8-08 | `listeMarken` |
| M8-09 | `leseMarke(markeId)` – liefert die **aufgelöste** Marke |
| M8-10 | `erstelleMarke(name, parentId?)` – inkl. Sperre für Ketten über eine Stufe |
| M8-11 | `bearbeiteMarke(markeId, teilwerte)` |
| M8-12 | `pruefeMarkenReferenzen(markeId)` – rein lesend, über **alle** Projekte |
| M8-13 | `löscheMarke(markeId)` – blockiert bei Referenz, eingebaute nie löschbar |
| M8-14 | Pfad-Auflösung für `marken-assets/<markeId>/` (der `marken-store` ist dafür die Autorität, nicht der `project-store`) |
| M8-15 | `importiereMarkenDatei` / `entferneMarkenDatei` – Whitelist `.woff2` bzw. Bild, Kopieren, Rückfall auf geerbt/gebündelt |

### Import-Weg und Renderzeit – 3

| Nr. | Issue |
|---|---|
| M8-16 | Lese-Protokoll für `marken-assets/` (analog `media://`) – Renderer bekommt **nie** absolute Pfade |
| M8-17 | [template-canvas] **Importierte Schriften je Marke laden**, bevor die erste Zone gezeichnet wird; Nachweis über `document.fonts.check()` |
| M8-18 | [render-service] **Frühe Prüfung** auf fehlende Marken-Dateien → `marken_datei_fehlt`, **vor** dem ersten ffmpeg-Aufruf |

### `template-canvas` (Renderer) – 3

| Nr. | Issue |
|---|---|
| M8-19 | **Kontrast-Rechnung als geteilte Funktion** – einmal gebaut, zweimal genutzt (Ersatz-Logo wählt automatisch, Editor warnt) |
| M8-20 | **Ersatz-Logo zeichnen** (9.10.10): Markenname, Akzentfarbe **der Marke**, gebündelte `headlinePlakativ`, Textfarbe nach Kontrast, kein `…` |
| M8-21 | Marken-Kontext in die Zonen-Auflösung führen: Aktions-Marke für Segmente, Projekt-Standardmarke für Rahmen |

### `marken-editor` (Renderer) – 9

| Nr. | Issue |
|---|---|
| M8-22 | Grundgerüst des Editors + Marken-Liste (eigenständige und abgeleitete unterscheidbar) |
| M8-23 | Farb-Rollen bearbeiten – Rollen **fest**, Werte frei |
| M8-24 | Schrift-Rollen anzeigen und Schrift importieren |
| M8-25 | Logo importieren und entfernen (Entfernen → Ersatz-Logo greift) |
| M8-26 | **Geerbt vs. eigen sichtbar machen** – ein nicht gesetzter Wert folgt künftigen Änderungen des Parents |
| M8-27 | Marke ableiten (neue Marke mit `parent`) |
| M8-28 | **Kontrast-Warnung** (FA-24) – warnen, nicht blockieren |
| M8-29 | Löschen mit Vorwarnung – zeigt `pruefeMarkenReferenzen` vor dem Löschen |
| M8-30 | Live-Vorschau über `template-canvas` – dieselbe Zeichenroutine wie das Segment |

### Verdrahtung – 2

| Nr. | Issue |
|---|---|
| M8-31 | [ipc-gateway] Die Kanäle des `marken-store` anmelden (sonst kommt die Oberfläche an nichts heran – diese Lücke trat in M1, M2, M5, M6 und M7 auf) |
| M8-32 | [app-shell] Einstieg in den `marken-editor` – Reiter oder Unterbereich, plus Durchreichen der gemeinsamen Marken-Sicht |

---

## Was ich beim Zuschnitt entschieden habe

1. **Die Pfad-Auflösung für `marken-assets/` gehört dem `marken-store`** (M8-14), nicht dem
   `project-store`. Begründung: Der `project-store` ist Pfad-Autorität für **Projekt**-Daten
   (`projects/<id>/…`, TK 9.5.7); `marken-assets/` liegt **app-weit** neben `vorlagen.json`. Eine
   zweite Autorität für einen fremden Ordner wäre genau die Doppelung, die 9.5.7 ausschließt.
2. **`importiereMarkenDatei` und `entferneMarkenDatei` in einem Issue** (M8-15) – dieselbe Datei,
   dieselbe Whitelist, und das Entfernen ist die Umkehrung des Imports. Getrennt müssten beide
   dieselbe Herkunfts-Logik beschreiben.
3. **Die Kontrast-Rechnung ist ein eigenes Issue** (M8-19) und liegt im geteilten Renderer-Bereich.
   Zwei Aufrufer (M8-20 zeichnet automatisch, M8-28 warnt) – zweimal gebaut liefen sie auseinander,
   und dann warnte der Editor bei etwas, das der Canvas anders bewertet.
4. **Kein Undo für den Marken-Bestand** – so in TK 9.15.2 festgelegt. Deshalb **kein** Issue dafür.

## Was auffällt und deine Aufmerksamkeit braucht

- **M8-06 und M8-07 sind leicht zu vergessen.** Ohne das Seeding steht die App beim ersten Start
  ohne Marke da; ohne die Migration verlieren bestehende Projekte ihre. Beides fällt erst beim
  Ausprobieren auf, nicht beim Typecheck.
- **M8-31 ist die Lücke, die in fünf Meilensteinen aufgetreten ist**: fertige Operationen, die
  niemand anmeldet. Deshalb steht sie hier von Anfang an drin, nicht als Nachzügler.
- **M8-18 hängt an M6.** Die frühe Prüfung gehört in den `render-service`; dessen Vorprüfung ist
  bereits gebaut (`medium_fehlt`). Das Issue erweitert sie, statt eine zweite Prüfstelle zu schaffen.

## Danach: der Zitat-Abgleich

54 Issues, drei Klassen (`marken-abgleich-umfang.md`). Er läuft **nach** dem Anlegen von M8, damit
die Klasse-3-Issues auf echte Nummern verweisen können statt auf Platzhalter.
