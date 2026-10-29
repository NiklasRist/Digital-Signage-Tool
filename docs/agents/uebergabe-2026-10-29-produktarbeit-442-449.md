# Übergabe 29.10.2026 – Produktarbeit: #442, #449, Filmstreifen, Beenden

**Diese Sitzung war keine Qualitäts-Charge.** Nach dem Push der 26 Mutations-Chargen wurde
Produktarbeit gemacht – ausgelöst durch zwei User-Befunde am echten Fenster.

**Vorher:** [`uebergabe-2026-10-29-nach-charge-26.md`](uebergabe-2026-10-29-nach-charge-26.md).

---

## 1. Stand heute

| | Wert |
|---|---|
| Commits | **6 vor `origin/main`**, **nicht gepusht** |
| Gate | `npm run pruefung` **Exit 0** |
| Unit | **5.325** Tests in **343** Dateien |
| Integration | **49** in 12 Dateien |
| Treiber | **0 Befunde** |
| Lint | 0 Fehler (192 × `SAFETY` aus #448 unverändert) |
| Offene Issues | 21 (davon #449 in Review, Banner-Linie #365–#371 weiter blockiert) |

**Die sechs Commits:**

| Commit | Inhalt |
|---|---|
| `e1bf975` | #442: Drop auf den Video-Körper legt immer eine Unterbrechung an |
| `21e1519` | #442: Unterbrechung als sichtbarer Aktions-Kasten (Video \| Aktion \| Video) |
| `049649f` | #442: Unterbrechungen verschiebbar, Filmstreifen schneller |
| `962502a` | #442: Kasten springt nach dem Verschieben nicht mehr zurück |
| `4be49ce` | Beenden: Dev-Abbruch lässt keine Waise, Beenden-Frist 15 s |
| `32b40b7` | #449: Marken-Editor – Elemente anklicken, Box je Element |

---

## 2. #442 – „Aktionen zwischen Frames" (GESCHLOSSEN)

**Entscheidungen des Users (29.10.2026):**
1. Ein Drop auf den **Körper** eines Video-Blocks legt **immer** eine Unterbrechung an –
   unabhängig von der Vorlagenart. Die Heuristik aus #437 (Vorlage `vollflaeche` →
   Unterbrechung, sonst Band) war die Ursache des Befunds.
2. „Sichtbare Teilung im Block": die Unterbrechung wird als **Kasten** gezeichnet, nicht
   als dünne Marke.
3. Der Kasten ist **nachträglich verschiebbar**.

**Ursache des ursprünglichen Befunds (gemessen):** Der Drop funktionierte. Die Marke war
orange, unbeschriftet, **volle Blockhöhe** – und der **ganze Kasten war ein Lösch-Knopf**.
Der User hielt sie für einen Fehler und entfernte sie mit seinem Prüfklick. Im Projekt
`ec07ce86…` stand `unterbrechungen: []`, weil der Klick sie gelöscht hatte.

**Gebaut:**
- `verwende-zeitleisten-zug.ts`: Video-Ziel → nur noch `nehmeAktionAlsUnterbrechungAuf`.
- `zeitleiste.tsx`: Kasten mit Aktionstitel und eigenem **×**; Klick auf den Kasten löscht
  nichts mehr. Nach dem Loslassen bleibt er an der neuen Stelle („schwebend"), bis der
  gespeicherte Wert sich bewegt – sonst spränge er für einen Frame zurück (User-Befund
  „glitcht kurz zurück").
- `unterbrechungs-aufnahme.ts`: `verschiebeUnterbrechung` (rein) – klemmt in (0, Videoende),
  hält eine Frame-Lücke zum Nachbarn, erlaubt Vorbeiziehen (Neusortierung), lehnt nur ab,
  wenn zwischen zwei Nachbarn kein Platz ist.

**Belege:** Video-drop → Unterbrechung (3 Tests), Kasten/× (1), Zug/Klick (2), Schweben (1),
Verschiebe-Grenzen (6). Gegenproben, alle byte-identisch zurückgenommen: Video-Drop auf den
Kantenweg → 2 rot; Kantenweg stumm → 1 rot; Klick-Lösch-Weg → 1 rot; Klemmen ausgebaut →
2 rot; Schweben ausgebaut → 1 rot. Treiber 4b6 zieht eine Aktion mit **Band-Vorlage** →
trotzdem Unterbrechung, Entfernen über das ×, je EIN Undo. Treiber 4f2: Drop → Unterbrechung
im `project.json`, **kein** Band-Abschnitt, Blockzahl unverändert, Cmd+Z in EINEM Schritt.

**Ehrlich offen:**
- **Der Band-Drop ist entfallen** – damit auch der Zeit-Split `teileUndFuege` (#428B).
  Band-Abschnitte entstehen nur noch in der Band-Bearbeitung. Braucht es den Split dort,
  ist das ein eigenes Issue.
- Der **Filmstreifen unter dem Kasten wird nicht gekürzt**: hinter einer Unterbrechung zeigt
  er etwas spätere Einzelbilder als das echte Video. Der Kasten sitzt exakt.

---

## 3. #449 – Marken-Editor: Elemente anklicken (OFFEN, Review ausstehend)

**Entscheidung des Users:** Beschriftungen helfen „nur minimal". Stattdessen **Elemente
anklicken → kleine Box** für genau dieses Element.

**Gebaut (`32b40b7`):**
- Die **mittlere Feldliste ist entfallen.** Links Liste, rechts große Vorschau; Name,
  „abgeleitet", Löschen in einer Kopfzeile.
- `marken-elemente.ts` (neu, rein): liest die Elemente aus den **Zonen** der Vorschau-Vorlage
  (Titel, Rollen, Rahmen, Fläche). Das Motiv ist kein Element (Bild kommt aus der Aktion).
- `vorschau-flaeche.tsx`: Klickflächen als Rechtecke in Prozent der Vorlagenfläche; größte
  Fläche zuerst gezeichnet, damit der Hintergrund nicht jeden Klick abfängt.
- `index.tsx`: Box je Element (Logo + Slogan, Schrift + Textfarbe, Akzent, Verlauf,
  Hintergrund), geschrieben ausschließlich über die bestehenden Operationen.
- **Palette unter der Vorschau** für die Rollen, die „Vollbild" nicht zeigt (7 von 13 Farb-,
  2 von 4 Schriftrollen) – gleiche Box, sonst wären sie unerreichbar.
- Ein Speichern **derselben** Marke lässt die Box offen; ein Markenwechsel schließt sie.
- Herkunftszeilen tragen `data-rolle` (eine Box zeigt mehrere Farben).

**Belege:** `marken-elemente.spec.ts` (10), Editor-Wurzel (23, umgestellt). Treiber 4m/4m2
öffnen die Boxen vor jedem Zugriff; Gate grün.

**Ehrlich offen:**
- **Mutations-Gegenproben für die neuen #449-Tests fehlen** (die Gegenproben oben gelten für
  #442). Nachziehen: `elementBeiPunkt`-Sortierung ausbauen, Palette ausbauen.
- **Kein eigener Treiber-Schritt „Klick öffnet die Box"** – 4m2 bedient die Boxen, misst aber
  nicht das Öffnen/Schließen selbst.
- **#303** (Live-Vorschau) ist unverändert und kann jetzt abgenommen werden.

---

## 4. Filmstreifen („die frames laden zu langsam")

- Bilder erscheinen **einzeln**, sobald sie da sind (kein leerer Block bis zum Ende).
- `filmstreifen-speicher.ts` (neu): fertige Streifen werden gemerkt, Obergrenze 40, ältester
  fliegt; Zoom hin/zurück und Reiterwechsel sind sofort. Die **Blob-URL bleibt zeitlich
  begrenzt** (#364) – gemerkt werden nur die fertigen Canvasse.
- Zoom-Schritte warten **120 ms** vor dem Laden (Entprellung).

---

## 5. Beenden / Dev-Abbruch

**Gemessen:** Fenster schließen beendet die App korrekt (`exitCode 0`). Defekt war der
**Dev-Abbruch**: `scripts/dev.mjs` behandelte SIGINT/SIGTERM, aber nicht **SIGHUP**. Wird das
Terminal geschlossen, stirbt der Dev-Prozess sofort – das Electron läuft weiter (PPID 1, hält
die Einzelinstanz-Sperre). **Vorher/nachher belegt:** ohne Fix blieb das Tool-Electron stehen,
mit Fix nicht.

- `dev.mjs`: SIGHUP-Handler, SIGKILL-Nachfassen nach 5 s, exit-Handler.
- `beenden-ablauf.ts`: Die Frage an den Renderer hatte **keine Frist** – ein abgestürztes
  Fenster hätte die App am Beenden gehindert. Jetzt gilt nach **15 s** „verwerfen"
  (änderbar; der User hat die Zahl noch nicht bestätigt).

---

## 6. Befunde, die nichts gebaut haben

1. **`tools/bereitschaft.py` meldet geschlossene Issues als „bereit".** Es holt mit
   `--state all` und filtert den Zustand nirgends (`ist_gebaut` prüft nur Dateiexistenz).
   Die vier „bereit"-Einträge dieser Sitzung (#215/#240/#255/#317) waren längst geschlossen.
   Fix: zwei Zeilen (Zustand mitlesen, `CLOSED` überspringen).
2. **Wichtig für die nächste Sitzung:** Prozesse **nach Arbeitsverzeichnis** filtern
   (`lsof -a -p PID -d cwd`), **nicht** nach dem Programmnamen. `./node_modules/electron/… .
   ` ist auch **Kais Companion** (`Kai/companion`) – ich habe ihn in dieser Sitzung versehentlich
   abgeschossen, weil der Name identisch ist. Er läuft wieder.
3. **Der „Waisenprozess vom 27.10." war der Companion**, nicht das Tool.

---

## 7. Nächste Schritte

1. **#449 am Fenster reviewen** (`npm run dev`, Reiter Marken, Marke öffnen, Logo/Preis/
   Überschrift anklicken). Danach schließen oder nachbessern.
2. **#303 abnehmen** (Vorschau rechts, Canvas 1920×1080, Zeichenweg `zeichneSegment`).
3. **Push** – nur auf Anweisung (6 Commits).
4. **#443** Videosteuerung (entschieden 22.10., Bau offen).
5. **#446** FA-03-Ursache (12 Läufe grün, Ursache unbenannt).
6. Optional: `bereitschaft.py`-Filter; Mutations-Gegenproben für #449; Treiber-Schritt
   „Box öffnet sich"; Band-Zeit-Split als eigenes Issue.
