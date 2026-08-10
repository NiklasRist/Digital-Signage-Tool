# Briefing für die M8-Issues (Marken)

> **Jeder schreibende Agent liest diese Datei zuerst.** Sie enthält alle Festlegungen, die das
> Technische Konzept offen lässt oder die aus Entscheidungen des Auftraggebers stammen. Bei M2 hat
> genau so eine Datei die Zitat-Treue auf 100 % gebracht (vorher sieben Verstöße gegen Regel D).
>
> Grundlage: AD **v1.3**, TK **v3.4**. Milestone: `M8 – Marken`.

---

## 1. Was du sonst noch liest

1. `docs/agents/issue-generation-prompt.md` – **Abschnitt 7 vollständig** (Pflicht-Vorlage + Regeln
   A–E), Abschnitt 5 (globale Invarianten), Abschnitt 8 (ausgefülltes Beispiel).
2. `docs/Technisches_Konzept_Digital-Signage-Tool.md` (**v3.4**) – für M8 zentral: **9.15** (der ganze
   Abschnitt), **9.10.10** (Ersatz-Logo), **9.11.2** (`Marke` samt Vererbungsregel), **9.10.9**
   (Farb-Rollen-Auflösung und deren zwei Ausnahmen), **9.12.1** (`vorlagen-store` – das **Muster**,
   dem der `marken-store` folgt), **9.5.4** (Schreib-Invarianten), **9.1.1** (Ergebnis-Hülle).
3. `docs/Anforderungsdokument_Digital-Signage-Tool.md` (**v1.3**) – **FA-23**, **FA-24**,
   **Abschnitt 4.8**, **R-07**, **R-08**.
4. `docs/agents/m8-zuschnitt.md` – dein Issue und seine Nachbarn.

## 2. Die fünf Regeln (aus früheren Prüfläufen entstanden – bitte ernst nehmen)

- **A – Das Issue ist die ganze Welt des Agents.** Er liest das TK **nicht**. Alles Nötige steht
  ausgeschrieben, Invarianten **wörtlich zitiert**. Ein Aufruf darf **nie** nur als Issue-Nummer
  dastehen – **Name und Signatur** gehören ins Issue.
- **B – Jede gefährliche lokale Entscheidung wird abgenommen.** Substanzieller STOPP-Block.
- **C – „verbindlich" heißt entschieden.** In „Signatur (verbindlich – NICHT ändern)" **nur**
  Entschiedenes. Keine Alternativen (`bzw.`, `oder`, `# oder …`), nichts, was parallel im STOPP-Block
  offen geführt wird. **Nie beides.** Häufigster und teuerster Formfehler.
- **D – Zitate wörtlich oder gar nicht.** Per Suche verifizieren. In früheren Läufen standen
  **erfundene** TK-Zitate in den Issues.
- **E – Jeder DoD-Punkt muss im erlaubten Dateibereich erfüllbar sein.** Schlusspunkt immer:
  „Keine Datei außerhalb von `X` **(+ zugehörige Testdatei)** geändert".

**Lokale Detailfragen selbst entscheiden**, statt sie in den STOPP-Block zu legen – sonst trägt das
Label `braucht-entscheidung` fast jedes Issue und ist wertlos. In den STOPP-Block gehört nur, was die
**Schnittstelle** oder das **Verhalten** festlegt.

## 3. Die elf Entscheidungen des Auftraggebers (10.08.2026) – ENTSCHIEDEN, nicht mehr fragen

1. **Zweck:** Partner-/Fremdwerbung **und** Saison-/Kampagnen-Looks.
2. **B und C in einem Schritt:** Bestand **und** Editor.
3. **Ableitung über `parent`** – feldweise Vererbung, **eine** Stufe tief.
4. **`Aktion.akzentfarbe` bleibt und ist ein FREIER Hex-Wert.** Der Palettenzwang aus TK 9.8.4 ist
   **zurückgenommen**.
5. **Rahmen stabil, Inhalt wechselt:** Band-Hintergrund und Split-Restflächen aus
   `Project.standardMarkeId`, **nicht** aus der Marke der sichtbaren Aktion.
6. **Löschen blockiert** bei Referenz (Aktionen **und** abgeleitete Marken), es kaskadiert nicht.
7. **Eingebaute Marke unlöschbar, aber bearbeitbar** – anders als die eingebauten Vorlagen.
8. **Fehlt eine importierte Datei beim Render → früher Abbruch**, vor dem ersten ffmpeg-Aufruf.
9. **Kontrast: warnen, nicht blockieren.**
10. **Marke ohne Logo → Ersatz-Logo:** Markenname auf Akzentfarbe, Standardschrift.
11. **Dessen Akzentfarbe ist die der MARKE**, nicht die der Aktion – stabil wie ein echtes Logo.

### Zusatz vom 10.08. zum Seeding (M8-06)

**Der Bestand wird mit der Fitnessworld24-Marke vorbelegt, und das geschieht beim Entwickeln.** Die
Werte stehen fest und vollständig in **TK 9.11.2** (Farb-Rollen, Schrift-Rollen, Sicherheitsabstand,
Radien, Schatten) und **AD 4.2**. **Das ist keine offene Frage** – schreib die Werte aus, und leg
**keinen** STOPP-Punkt dazu an. Es ist auch **keine** Funktion für den Nutzer: Er legt die eingebaute
Marke nicht an, sie ist einfach da.

## 4. Festlegungen, die ich beim Zuschnitt getroffen habe

- **Die Pfad-Auflösung für `marken-assets/` gehört dem `marken-store`** (M8-14), **nicht** dem
  `project-store`. Der ist Pfad-Autorität für **Projekt**-Daten (`projects/<id>/…`, TK 9.5.7);
  `marken-assets/` liegt app-weit. Eine zweite Autorität für einen fremden Ordner wäre genau die
  Doppelung, die 9.5.7 ausschließt.
- **Die Kontrast-Rechnung ist eine geteilte Funktion** (M8-19) im geteilten Renderer-Bereich
  (`src/renderer/gemeinsam/`, s. Modulliste in TK Abschnitt 9). **Zwei** Aufrufer: M8-20 entscheidet
  damit automatisch die Textfarbe des Ersatz-Logos, M8-28 warnt im Editor. Zweimal gebaut liefen sie
  auseinander – dann warnt der Editor bei etwas, das der Canvas anders bewertet.
- **`importiereMarkenDatei` und `entferneMarkenDatei` in einem Issue** (M8-15): dieselbe Datei,
  dieselbe Whitelist, das Entfernen ist die Umkehrung des Imports.
- **Kein Undo** für den Marken-Bestand (so in TK 9.15.2) – kein Issue dafür.
- **Format-Whitelist:** Schriften **nur `.woff2`** (ein Ladepfad statt zwei), Logos nach der
  bestehenden Bild-Whitelist (TK 9.4.2).

## 5. Was in JEDES M8-Issue gehört, das die IPC-Grenze berührt

Wörtlich aus TK 9.1.1 zitieren:

- **Einheitliche Hülle, niemals Exceptions über die Grenze:**
  `Ergebnis<T> = { ok: true, wert: T } | { ok: false, fehler: { code: Fehlercode, meldung: string } }`
  Grund: getrennte Prozesse, alles wird serialisiert; ein `throw` verliert Fehlerklasse **und** `code`.
- **`Ergebnis<void>`**, wenn nichts zu melden ist. **Verboten:** `Ergebnis<boolean>`, `Ergebnis<null>`,
  blankes `true`.
- **Instant vs. Auftrag:** Alle `marken-store`-Operationen sind **Instant** – sie laufen **nicht** über
  die Auftrags-Queue. (`import`, `loeschen`, `render`, `export` sind Aufträge; ein Marken-Import ist
  keiner: er kopiert eine kleine Datei, es gibt nichts zu serialisieren.)
- **Kanäle `<modul>:<operation>`** → `marken:leseMarke`, `marken:erstelleMarke` …; Ereignisse
  `<modul>:<ereignis>` → `marken:autoSpeichernStatus`.
- **Ereignisse tragen keine Hülle** und keinen Endzustand.
- **Der Main validiert jede eingehende Nutzlast**; ungültig → `ungueltige_eingabe` **ohne jede
  Wirkung auf die Daten**.

## 6. Was in JEDES Issue gehört, das schreibt

Wörtlich aus TK 9.5.4 / 9.12.1:

- **atomar** über Temp + Rename auf **derselben** Partition – `marken.json` ist **nie** halb
  geschrieben;
- **ein** Backup `marken.json.bak` = letzte heile Version; beim Laden defekt → aus `.bak`
  wiederherstellen, ist auch das defekt → **Fehler melden**, nicht leer weiterstarten;
- **`schemaVersion`** (TK 9.5.5): höhere → Fehler, **nicht raten**; ältere → definierte Migration;
- **Speicherfehler sichtbar** statt still verschluckt – über `marken:autoSpeichernStatus`;
- **eigene Serialisierung.** Es gibt **nur ein** D1-Schreib-Lock, und das gehört dem `project-store`
  und schützt **nur** `project.json`. Der `marken-store` hat seine **eigene** – wie der
  `vorlagen-store` (TK 9.12.1) und die Queue-Speicher (TK 9.5.4, „Lock-Grenze").
- **Plattform:** Windows meldet bei gesperrter Datei `EBUSY`/`EPERM`; macOS lässt `unlink` **still**
  gelingen. Beides explizit behandeln.

## 7. Die Fehlercodes (TK 9.15.5) – geschlossener Satz

| Code | Ursache |
|---|---|
| `marke_referenziert` | Löschen abgelehnt – Aktionen und/oder abgeleitete Marken nutzen sie noch (mit **beiden** Trefferlisten) |
| `marke_eingebaut` | Löschen der eingebauten Marke versucht |
| `marke_nicht_gefunden` | unbekannte `markeId` |
| `ungueltige_eingabe` | unbekannte Rolle, Ableitungskette länger als eine Stufe, Datei nicht in der Whitelist |
| `marken_datei_fehlt` | importiertes Logo oder importierte Schrift fehlt – **beim Render**, vor dem ersten ffmpeg-Aufruf |
| `speicher_fehler` | `marken.json` nicht schreibbar |

## 8. Fallen, die schon einmal Geld gekostet haben

- **Fertige Funktion ohne Aufrufer.** In **fünf** Meilensteinen aufgetreten: Operationen, die niemand
  am `ipc-gateway` anmeldet – gebaut, funktionsfähig, für die Oberfläche unerreichbar. Deshalb ist
  M8-31 von Anfang an dabei. Wenn du eine Operation schreibst, prüfe: **wer ruft sie?**
- **Zwei Quellen für dieselbe Information.** Die Vererbung wird an **genau einer** Stelle aufgelöst
  (M8-05). Neunzehn Aufrufer holen die Marke – neunzehn eigene Vererbungslogiken liefen auseinander.
- **Stiller Schrift-Rückfall.** Ist eine Schrift beim Zeichnen nicht geladen, nimmt der Canvas
  **klanglos** eine Ersatzschrift → Vorschau ≠ Endvideo **und** Markenbruch, sichtbar erst am
  Fernseher. Deshalb: **vor** dem Zeichnen laden, Nachweis über `document.fonts.check()`.
- **Deutsche Anführungszeichen in Skripten.** Das schließende `"` ist ein ASCII-Zeichen und beendet
  ein Python-String-Literal mitten im Satz. Drei Skripte sind in diesem Projekt daran gescheitert.
  Betrifft dich nur, falls du Hilfsskripte schreibst – dann durchgehend `'''…'''` verwenden.

## 9. Form

- Eine Datei je Issue: `docs/agents/m8/M8-XX.md`.
- **Erste Zeile:** `### Issue M8-XX: [modul] Titel` – danach eine Leerzeile, dann der Body nach der
  Pflicht-Vorlage aus Abschnitt 7 der Prompt.
- Verweise auf andere M8-Issues als `M8-XX` (die echten `#`-Nummern kennt niemand vor dem Anlegen);
  Verweise auf **bestehende** Issues als echte `#`-Nummer.
- Zeilenumbruch ~100 Zeichen, wie in den bestehenden Volltexten.
- Abhängigkeiten **mit Begründung in Klammern**.
