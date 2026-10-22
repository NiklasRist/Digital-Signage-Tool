# Treiber-Matrix: Anforderung -> Szenario

**Stand:** 21.10.2026. **Art:** Bestandsaufnahme, **keine Verhaltensaenderung**.
**Grundlage:** `docs/Anforderungsdokument_Digital-Signage-Tool.md` (FA-01 bis FA-24),
`scripts/durchlauf.mjs` (Treiber, echter Fensterlauf), `docs/agents/q4-test-audit.md` (Q4-3).

---

## 1. Zweck und Grenze

Das Gate `npm run pruefung` faehrt Unit, Integration und den Treiber. Der Treiber ist die
einzige Stufe, die das **echte Fenster** sieht. Diese Matrix beantwortet **eine** Frage:

> Welche funktionale Anforderung wird am echten Fenster gemessen - und welche nicht?

Sie ist **keine** Aussage darueber, ob eine Anforderung "fertig" ist. Unit- und
Integrationstests koennen eine Zusage tragen; sie ersetzen den Fensterbeleg aber nicht
(das war der Q4-Befund). Die Spalte **Status** bewertet deshalb **nur den Treiber**.

**Legende**

| Status | Bedeutung |
|---|---|
| **gemessen** | Der Kern der Zusage wird am echten Fenster geprueft und ist im letzten Lauf belegt. |
| **teilweise** | Ein Teil der Zusage wird geprueft; der Rest steht unter "Luecken". |
| **Luecke** | Kein Treiber-Schritt prueft diese Zusage. Auch der Fall "Schritt vorhanden, misst aber nichts, weil die Voraussetzung fehlt" faellt hierunter (FA-23). |
| **blockiert** | Die Oberflaeche fehlt; ein Szenario haette heute nichts zu messen. |
| **manuell** | Nur ein Mensch kann pruefen (nativer Dialog, optische Abnahme). |

**Nicht** in dieser Matrix: NFA-01 bis NFA-09 und die rein technischen Integrationstests.
Letztere decken die Render-Mechanik (`concat-echt`, `video-ausschnitt-echt`, `ffprobe-echt`,
`standbild-echt`, `bandspur-echt`, `uniformitaet-echt`); ein FA-Bezug steht dort hoechstens
als Randnotiz im Kommentar (FA-01 in `standbild-echt`), nicht als gepinnte Zusage.

---

## 2. Die Matrix

| FA | Zusage (AD, verkuerzt) | Treiber-Schritt(e) | Was am Fenster wirklich gemessen wird | Status |
|---|---|---|---|---|
| FA-01 | Ein Projekt, genau ein Video; Import ans Listenende, erneuter Import ersetzt nach Bestaetigung | 4b, 4b3, 2 | Seed-Import ueber `queue:reiheEin`: Video steht automatisch in der Zeitleiste, die Video-Zeile hat **kein** "Zur Liste hinzufuegen", das Video ist ausgewaehlt. Der **Ersetzen-Weg** mit Bestaetigung wird nicht gefahren. | teilweise |
| FA-02 | Aktion anlegen (Titel, Text, Preis, Bild, Dauer) | 4g, 4b5, 4i | Inline-Formular in der Bibliothek: Titel eintippen, Anlegen -> Aktionszaehler +1, Eintrag sofort sichtbar. Nur der **Titel** wird ueber das Formular gesetzt; Preis/Bild/Dauer kommen im Seed ueber IPC. | teilweise |
| FA-03 | Inhalte bearbeiten/loeschen; Video ersetzen | 4g4, 4e, 4e2 | Aktion loeschen (1 -> 0, Undo in EINEM Schritt); Listeneintrag im Kontextmenue duplizieren/entfernen (Liste und Zeitleiste). **Aktion bearbeiten** und **Video ersetzen** fehlen. | teilweise |
| FA-04 | Aus einer Aktion ein Segment mit Anzeigedauer erzeugen | 4f, 4c | Eine Aktion wird als Block in die Zeitleiste gelegt; der Render-Lauf erzeugt eine Datei. Dass das Segment die **Dauer** traegt und im Render **erscheint**, wird nicht geprueft. | teilweise |
| FA-05 | Reihenfolge per Drag-and-drop | 4f | Aktionszeile auf die Spalte zwischen zwei Bloecken ziehen: Blockzahl +1 an der Position, **ein** Cmd+Z nimmt es zurueck. | gemessen |
| FA-06 | Dauer je Segment, Standarddauer-Kette | 4f4 | Griff am Regler ziehen -> Dauertext aendert sich; Undo-Pfeil stellt den Wert in EINEM Schritt her. Die Kette `Aktion ?? Projekt ?? 10`, die Grenzen 10-45 s und das Verlaengern sind ungemessen. | teilweise |
| FA-07 | Vorschau der Sequenz vor dem Rendern | 4b3, 4b4, 4b5 | Buehne hat sichtbare Hoehe, Video-Box da, Play bewegt `currentTime` und Uhr-Frame; der Filmstreifen zeigt Einzelbilder des Videos und mehr davon beim Hineinzoomen (#433); an der Unterbrechung pausiert das Video und laeuft danach weiter. Ob die **Sequenz** (Video + Segmente) in Reihenfolge gezeigt wird, wird nicht geprueft. | teilweise |
| FA-08 | **Eine** durchgehende MP4 je Lauf | 4c | Der echte Render laeuft ueber den Dialog, `render:fortschritt` kommt an, die Ausgabe erscheint ohne Auffrisch-Klick in der Liste. Die **Dauer/Framezahl** der erzeugten Datei wird nicht gegen die Liste geprueft. | teilweise |
| FA-09 | Export auf USB unter eigenem Namen | 3 | Der Export-Dialog oeffnet und laesst sich abbrechen. Der Zielordner-Dialog ist **nativ** (User-Entscheidung 13.10.2026) - der Treiber bedient ihn nicht. | manuell |
| FA-10 | Projekt anlegen, oeffnen, duplizieren, loeschen | 2, 4, 5 | Anlegen ueber IPC-Seed, Zeile in der Liste, Oeffnen ueber die Liste, Start-Hinweis verschwindet. **Duplizieren** und **Loeschen** ueber die Oberflaeche sind ungemessen (Loeschen nur als Aufraeum-IPC). | teilweise |
| FA-11 | Einheitliches Grundlayout im Markenrahmen | - | Nicht im DOM pruefbar. Der Render erzeugt Pixel; ohne Bildvergleich sagt der DOM nichts ueber Logo, Abstaende und Typografie. | manuell |
| FA-12 | Gestalterischer Spielraum je Aktion | - | Wie FA-11: eine Aussage ueber das **Ergebnis** braucht einen Bildbeleg, keine Test-Kennung. | manuell |
| FA-13 | Eigene Vorlagen anlegen/bearbeiten; Arbeitskopie + explizites Speichern | 4 | Die Editor-Sitzung oeffnet (`arbeitskopie-kopf` im DOM). Zonen aendern, speichern, verwerfen, neu anlegen: **kein** Schritt. | teilweise |
| FA-14 | Video nicht-destruktiv trimmen | 4f4 | Derselbe Regler-Schritt wie FA-06 (Wert + Undo). Ob der **Trim** am Video-Element liegt und die Originaldatei unveraendert bleibt, wird nicht geprueft. | teilweise |
| FA-15 | Fortlaufend automatisch speichern; letztes Projekt beim Start | 4f2, 4h | Nach dem Band-Drop wird `project.json` nach dem entprellten Speichern gelesen (Auto-Speichern implizit). Das **Wiederherstellen beim Start** (letztes Projekt, letztes Export-Ziel) ist ungemessen. | teilweise |
| FA-16 | Sichtbare Warteschlange (Muss) | 4j | Die Leiste ist im Fenster, startet eingeklappt, zeigt einen **geholten** Stand (nicht "wird geladen"), bleibt beim Reiterwechsel sichtbar und laesst sich ueber den echten Schalter aufklappen (danach 1 Auftragszeile). **Seit #257 (20.10.2026).** | teilweise |
| FA-17 | Fehlgeschlagenen Auftrag mit Grund wiederholen (Muss) | 4k | Ein Import einer **nicht vorhandenen** Datei wird eingereiht; die Zeile steht als `fehlgeschlagen` in der Leiste, der Grund als Klartext ("Datei nicht gefunden") und der Schalter "Erneut versuchen" daran. Dann wird die Datei angelegt und der echte Schalter geklickt: der Auftrag ist danach aus Q1 **und** Q2 weg, und das importierte Asset steht in D1 (project.json). **Seit 21.10.2026.** | gemessen |
| FA-18 | Auftrag entfernen, laufenden Render abbrechen (Soll) | 4l | Ein 30-Elemente-Render laeuft; ein dahinter eingereihter Import steht als `wartet` und wird ueber "Aus der Warteschlange nehmen" entfernt (Zeile weg, Render laeuft weiter). Danach "Render abbrechen": die Rueckfrage erscheint mit Klartext ("keine Ausgabedatei"), Bestaetigen beendet den Render, die Zeile verschwindet, kein Auftrag bleibt im Stand, keine Ausgabedatei entsteht. **Seit 21.10.2026.** | gemessen |
| FA-19 | Gefuehrte Reparatur; Render erst frei, wenn alles behoben | 4h, 4i | Kaputte Stelle erzeugt und Projekt neu geoeffnet: Panel da, Fortschritt "0 von N behoben", Render-Knopf `disabled`; Fix "Element entfernen" schrumpft die Liste, Cmd+Z stellt in EINEM Schritt her. Vierter Fall (#438) als `unterbrechung` belegt. | gemessen |
| FA-20 | Split-Screen/Einblendung, Rotation, Unterbrechung (Muss) | 4b5, 4b6, 4f2 | Unterbrechung pausiert das Video an der Zeitstelle und laeuft danach weiter; ein Drop auf den Video-Koerper erzeugt EINE Marke; ein Band-Drop legt einen Abschnitt im Store an, ohne die Blockzahl zu aendern, und ist ein Undo-Schritt. **Rotation mehrerer Aktionen** und die **Render-Ausgabe** von Band/Einblendung sind ungemessen. | teilweise |
| FA-21 | Undo/Redo in beiden Editoren | 4f3, 4f, 4f2, 4f4, 4g2, 4g4, 4h | Pfeile sichtbar und aktiv; Undo schrumpft, Redo waechst; je eine Aktion ist EIN Schritt (Einfuegen, Band, Dauer/Trim, Anlage, Loeschen, Reparatur). Der **Vorlagen-Editor** hat kein Undo-Szenario. | teilweise |
| FA-22 | Mehrere benannte Ausgaben; Vorbelegung = letzter Name | 4c | Der Name wird ohne Endung eingetippt, der Dialog prueft, die Ausgabe steht danach in der Liste. **Zweite Ausgabe**, Vorbelegung und Ersetzen-statt-Anlegen sind ungemessen. | teilweise |
| FA-23 | Marken-Bestand, Standardmarke je Projekt, Loeschsperre (Muss) | 4a, 4a0, 4a2 | Eine **zweite Marke** wird ueber die echte Oberflaeche angelegt (4a0; vorher lag genau eine im Bestand - B2). 4a wechselt die Standardmarke am echten `<select>` **gezielt auf diese Marke** und belegt den Wert zusaetzlich in `project:listeProjekte` (D1). 4a2 versucht, die nun genutzte Marke zu loeschen: **gesperrt** mit Klartext-Grund (`loesch-standard` nennt das Projekt) und Ausweg; nach dem Zurueckstellen der Standardmarke wird sie **geloescht** (Sperre = Nutzung, nicht Zufall). **Seit 21.10.2026.** | gemessen |
| FA-24 | Marken anlegen, bearbeiten, ableiten, Kontrastwarnung (Muss) | 4m, 4m2 | **4m:** Marke ueber die echte Oberflaeche **anlegen/oeffnen**, **Akzentfarbe frei** setzen (Wert im Bestand V2), **Kontrast-Warnung** am Grenzwert ("4.13:1 … mindestens 4.50:1") **ohne Sperre**, Warnung weg bei ausreichendem Kontrast, Felder zeigen die **neu geoeffnete** Marke, **Ableiten** mit `abgeleitet` und Herkunftszeilen. **4m2:** **alle dreizehn Farbrollen** schreiben (13/13 im Bestand), **Slogan** (Text + Schalter) und **Sicherheitsabstand** (80/40) schreiben, **Wachsens-Hinweis** vor dem Speichern, **Bearbeiten einer abgeleiteten Marke** (eigen -> "Eigener Wert" -> Vererbung wiederherstellen -> geerbt), **Import-Pipeline** fuer Schrift und Logo mit echten Dateien (`herkunft: importiert`, Anzeige "(importiert)") und **Logo entfernen**. **MANUELL bleibt nur der native Dateidialog** (Klick auf "Eigene Schrift/Logo waehlen"), wie FA-09/Export; die Pipeline danach ist gemessen. **Nicht Teil von FA-24, aber offen:** die Live-Vorschau (TK 9.14.1/9.15.2, B11) und die Text/Store-Spannung beim Logo-Entfernen (B12). **Seit 22.10.2026.** | gemessen |

**Zaehlung:** 6 x gemessen (FA-05, FA-17, FA-18, FA-19, FA-23, FA-24), 15 x teilweise, 0 x Luecke,
0 x blockiert, 3 x manuell (FA-09, FA-11, FA-12).

Aufgeteilt nach Prioritaet (AD Abschnitt 4): **15 Muss**, 9 Soll.
- **Muss:** 4 gemessen (FA-05, FA-17, FA-23, FA-24), 10 teilweise, 0 Luecke, 1 manuell (FA-09).
- **Soll:** 2 gemessen (FA-18, FA-19), 5 teilweise, 0 Luecke, 2 manuell (FA-11/12).

Damit sind **4 von 15 Muss-Anforderungen** am echten Fenster vollstaendig gemessen (FA-05,
FA-17, FA-23, FA-24). FA-16/17/18 hatten beim Aufstellen der Matrix **keine Oberflaeche** - das ist mit
#257 behoben (B1); 4j misst die Leiste, 4k/4l die drei Bedienwege Fehlschlag/Entfernen/Abbruch.

---

## 3. Befunde beim Aufstellen

### B1 - FA-16/17/18 waren nicht "ungemessen", sondern **nicht montiert** (#257 - am 20.10.2026 behoben)

Der Befund beim Aufstellen der Matrix:

- `src/renderer/queue-panel/warteschlangen-leiste.tsx` gab einen **leeren** `<footer>` mit
  32 px Hoehe zurueck - kein Inhalt, keine Anzeige.
- `liste.tsx`, `leisten-montage.ts`, `wiederholen.ts` und `entfernen.ts` hatten **ausserhalb
  von `queue-panel/` keinen Importeur**; `baueAuftragsSichtAuf` (der `holeStand`-Aufruf) wurde
  **nirgends** gerufen.
- Das Messwerkzeug meldete M7 trotzdem mit "68 von 71 gebaut", weil es Dateien zaehlt, nicht
  Aufrufer. #257 war **offen**.

**Behoben mit #257:** `queue-panel/index.tsx` ist die Modul-Wurzel (Aufbau der Sicht genau
einmal, danach der Fortschritt; Klappzustand, Rueckfrage, eine Meldung; Schalter aus #209/#210,
Fehlertext aus #211). Die leere Platzhalterdatei ist geloescht, `App.tsx` importiert
`./queue-panel`. Treiber-Schritt **4j** misst die Leiste am echten Fenster.

**Abweichung von der Issue-Dateiliste (gemeldet):** #257 erlaubte nur `leisten-montage.ts` und
`index.tsx`. Der gebaute Stand hatte die Leiste aber ueber `warteschlangen-leiste.tsx` in
`App.tsx` haengen; ohne Aenderung an `App.tsx` (Importpfad), das Loeschen der Platzhalterdatei
und den Mock-Pfad in `app-einhaengung.spec.ts` waere die neue Wurzel **wieder ein Aufrufer
ohne Aufrufer** gewesen. Der gebaute Code gewinnt; die Abweichung steht im Issue-Kommentar.

**Ehrlich offen (Stand 21.10.2026 nach 4k/4l):** 4j misst Sichtbarkeit, Aufklappen und den
geholten Stand; **4k** misst den provozierten Fehlschlag samt Grund und die gelungene
Wiederholung, **4l** das Entfernen eines wartenden Auftrags und den bestaetigten Abbruch eines
laufenden Renders. **Nicht** gemessen: der Fehlschlag eines RENDERS (nur Import) und das
Entfernen waehrend eines Abbruchs.

### B2 - FA-23 wurde nicht gemessen, weil nur EINE Marke im Bestand lag (behoben 21.10.2026)

Schritt 4a sucht eine zweite Marke im Bestand. Im Messbestand (`marken.json`) lag **genau
eine** (Fitnessworld24); der Treiber schrieb deshalb selbst:
`Nur eine Marke im Bestand - der Wechsel braucht eine zweite (Seed-Weg ungetestet, UI-Weg folgt).`

**Behoben mit 4a0:** Die zweite Marke wird ueber die **echte Oberflaeche** angelegt
(Namensfeld + "Neue Marke", `marken-editor/index.tsx`), nicht per Roh-IPC. 4a wechselt
gezielt auf ihre Kennung (nicht "irgendeine andere" - im Bestand koennen weitere Marken
liegen), und 4a2 raeumt sie am Ende wieder weg. Der Treiber loescht ausserdem alle
`DurchlaufMarke-*` im Schritt-5-Aufraeumen, damit auch abgebrochene Laeufe keinen Bestand
hinterlassen.

### B3 - Eine veraltete Erwartung im Treiber (behoben)

Der Treiber erwartete `4 Reiter (TK 9.14.1)` und meldete im Protokoll
`Untersuchung: gemessen 5`. TK 9.14.1 zeigt seit dem Marken-Reiter **fuenf** Reiter
(Zusammenstellen, Aktionen, Vorlagen, Marken, Projekte); das Fenster misst genau diese fuenf.
Die Erwartung war also falsch, nicht das Fenster. Sie ist in `scripts/durchlauf.mjs` auf
**5** korrigiert und nennt TK 9.14.1 als Quelle. Kein Verhalten geaendert.

### B4 - "gemessen" heisst nicht "Anforderung erfuellt"

Ein Treiber-Schritt pinnt **ein** Szenario. FA-05 ist "gemessen", weil ein Drop an einer Kante
und sein Undo belegt sind - nicht, weil jede Reihenfolge-Bedienung belegt ist. Die Spalte
**Status** ist deshalb bewusst grob; die belastbare Aussage steht in der Spalte
"Was am Fenster wirklich gemessen wird".

### B6 - Die terminale Zeile blieb in der Leiste (21.10.2026, behoben)

Beim Bau von 4k/4l gemessen: Nach **Erfolg** und nach **Abbruch** blieb die Auftragszeile in
der Warteschlangen-Leiste stehen (25 s bzw. 30 s beobachtet), obwohl `queue:holeStand` sie
nicht mehr enthielt. Ursache: `beende-auftrag.ts` meldete `queue:geaendert` **vor** dem
Entfernen aus Q1 und danach nie wieder; `starteNaechsten` meldet nur, wenn es einen NAECHSTEN
Auftrag startet - bei leerer Schlange also nicht. Der Kommentar an Schritt 5/6 setzte einen
"zweiten Push (nach dem Entfernen)" bereits voraus; gebaut war er nie.

**Behoben:** zweiter Push nach `entferneAusQ1`, Verhaltens-Test in `beende-auftrag.spec.ts`
(Reihenfolge + Sichtbarkeit in Q1 je Meldung). Gegenprobe: Push entfernt -> 2 Tests rot,
Ruecknahme byte-identisch.

### B7 - "Erneut versuchen" erreichte die Sicht nicht (21.10.2026, behoben)

Beim Bau von 4k gemessen: Nach dem Klick auf "Erneut versuchen" war der Auftrag aus Q1/Q2 weg
und das Asset in D1 (project.json 2 -> 3), aber die Galerie blieb bei 2 Eintraegen. Ursache:
`auftrags-nachlauf.ts` merkte sich die **`auftragId`** als "ausgewertet". Ein Wiederholungs-
versuch behaelt laut TK 9.3.3 dieselbe ID; nur `versuche` steigt. Der Fehlschlag des ersten
Versuchs galt damit als ausgewertet, der Spaeter-Erfolg fiel unter den Tisch - kein
`setzeProjekt`, kein Asset in der Sicht.

**Behoben:** Merker-Schluessel ist `auftragId:versuche` (je Versuch genau eine Auswertung);
Verhaltens-Test in `auftrags-nachlauf-auffrisch.spec.ts`. Gegenprobe: Schluessel wieder auf
die ID -> Test rot, Ruecknahme byte-identisch. Nach dem Fix: Galerie 2 -> 3.

### B8 - Der "Ausweg" aus der Loeschsperre war eine Sackgasse (21.10.2026, behoben)

Beim Bau von 4a2 gemessen: Nach einer **gesperrten** Loeschung blieb
`marken-loesch-blockiert` stehen. Der Nutzer folgt dem angezeigten Ausweg ("Wechsle die
Standardmarke im Reiter Projekte"), kommt zurueck - und der Loeschweg ist **weg**: kein
"Loeschen"-Knopf mehr, keine neue Pruefung, bis die App neu startet. Ursache: Besuchte
Reiter bleiben montiert (TK 9.14.2); die `loeschvorschau` im `marken-editor` wurde beim
Oeffnen einer Marke nie zurueckgesetzt.

**Behoben:** Der Abo-Hoerer auf die geoeffnete Marke setzt `loeschvorschau` und
`meldeaktionFehler` zurueck - das erneute Oeffnen der Marke ist der natuerliche Neustart
der Pruefung. Verhaltens-Test in `marken-editor-wurzel.spec.ts`. Gegenprobe: Ruecksetzen
entfernt -> Test rot, Ruecknahme byte-identisch.



### B9 - Der Marken-Editor zeigte den Stand des ERSTEN Aufbaus (22.10.2026, behoben)

Beim Bau von 4m gemessen: Nach dem Oeffnen einer Marke mit **96/54 px** standen im
Sicherheitsabstand **0/0** - der Wert, mit dem die Wurzel beim App-Start initialisiert wurde,
als noch keine Marke offen war. Slogan und Sicherheitsabstand lagen als Momentaufnahme im
Zustand der Wurzel und wurden beim Wechsel der geoeffneten Marke nicht nachgezogen. Ein Klick
auf "Abstand uebernehmen" haette den Abstand der Marke damit **still auf 0/0 gesetzt** - der
Wert steuert Zeichnen und Band-Sicherheit (TK 9.11.4).

**Behoben:** Der Abo-Hoerer auf die geoeffnete Marke zieht `slogan` und `sicherheit` nach und
verwirft den alten Abstands-Hinweis. Verhaltens-Test in `marken-editor-wurzel.spec.ts`
(Abstand 96/54, Slogan-Text und -Schalter, Schreiben mit dem Wert DER Marke). Gegenprobe:
Nachziehen entfernt -> Test rot ("expected '0' to be '96'"), Ruecknahme byte-identisch.

### B10 - Nach dem Markenwechsel stand der alte Farbwert im Feld (22.10.2026, behoben)

Beim Bau von 4m gemessen: Nach dem Wechsel von der bearbeiteten Marke (Akzent `#808080`) auf
die eingebaute (`#FF4040`) zeigte das Akzentfeld weiter **`#808080`** - die Kontrast-Warnung
verschwand korrekt, aber das Feld log. Ursache: Die Farbfelder sind unkontrolliert
(`defaultValue`); React benutzt dasselbe DOM-Element weiter, und ein einmal bearbeitetes Feld
("dirty") folgt einem neuen `defaultValue` nicht mehr. Der naechste `onBlur` haette den ALTEN
Wert in die NEUE Marke geschrieben.

**Behoben:** Der Bereich `marken-offen` traegt `key=<markeId>` und wird beim Wechsel der Marke
neu aufgebaut; innerhalb derselben Marke bleibt alles stehen. Verhaltens-Test in
`marken-editor-wurzel.spec.ts`. Gegenprobe: `key` entfernt -> Test rot ("expected '#123456' to
be '#FF4040'"), Ruecknahme byte-identisch.

### B11 - Die Live-Vorschau ist gebaut, aber NICHT montiert (offen, bewusst)

Der Marken-Editor hat drei Teile (TK 9.14.1); der dritte, die **Live-Vorschau**, ist eine
neutrale Flaeche. `live-vorschau.ts` (#303) ist gebaut und getestet, wird aber von der Wurzel
nicht gerufen: `MarkenEditorWurzelProps` hat genau zwei Felder (`sichtbar`, `marken`) - ohne
`VorlagenZugang` und ohne `ZeichenZugang`, und `ZeichenZugang.bereiteVor` verlangt ein
`Project`, das der Marken-Reiter laut TK 9.14.2 gerade nicht hat. #330 fuehrt das als
**echte offene Frage** ("NICHT selbst entscheiden") und setzt bis zur Antwort bewusst keinen
Ersatzweg. 4m/4m2 lassen die Spalte deshalb aus. FA-24 selbst (AD: anlegen, bearbeiten,
ableiten, Import, Kontrastwarnung) ist ohne sie gemessen - die Vorschau ist eine Zusage aus
TK 9.14.1/9.15.2, nicht aus dem FA-24-Satz.

### B12 - Logo entfernen: der Hinweis verspricht das Ersatz-Logo, der Bestand liefert das gebündelte Fremdlogo (offen, 22.10.2026)

Beim Bau von 4m2 gemessen: Eine **eigenständige** Marke bekommt ein importiertes Logo
(`logo.png`, `herkunft: importiert`). Nach "Logo entfernen" steht im Bestand **nicht** `logo:
null` (Ersatz-Logo mit dem Markennamen), sondern das **gebündelte Logo der eingebauten Marke**
(`logo-fitnessworld24.png`, `herkunft: gebuendelt`).

Das ist **durch #298 ausdrücklich erlaubt** („das Ergebnis kann `logo: null` tragen ODER einen
geerbten/gebündelten Wert – BEIDES ist ein gültiger Erfolg"), steht aber im Widerspruch zum
angezeigten `HINWEIS_LOGO_ENTFERNT` („stattdessen erscheint der Markenname auf der
Akzentfarbe") und zur Begründung in `erstelle-marke.ts`, die `logo: null` bewusst **nicht**
mitkopiert, damit der Ersatz-Logo-Pfad (#293) erreichbar bleibt. Praktische Folge: Nach
Import + Entfernen trägt eine Partner-Marke dauerhaft das Baller-Logo.

**Nicht eigenmächtig geändert** – der gebaute Code gewinnt, die Entscheidung gehört dem
Auftraggeber (Issue mit `braucht-entscheidung`). Der Treiber meldet den Fall als
**Untersuchung**, nicht als Befund, weil #298 beide Ausgänge zulässt.

### B13 - `löscheMarke` räumt `marken-assets/<markeId>/` nicht auf (offen, 22.10.2026)

Beim Aufräumen von 4m2 gemessen: Drei Läufe importierten je eine Schrift und löschten die
Marke über die Oberfläche; danach lagen drei verwaiste Ordner
`marken-assets/<markeId>/fliesstext.woff2` im Datenort, deren Kennungen nicht mehr in
`marken.json` standen. `loesche-marke.ts` enthält keinen Datei-/Ordner-Zugriff. TK 9.15.3
sagt „die Kopie gehört der Marke" – mit dem Löschen gehört sie niemandem mehr.

**Nicht gebaut** (eigene Entscheidung: rekursiv löschen im Store oder eigener Waisen-Lauf;
ein Dateifehler darf das Löschen der Marke nicht verhindern). **Issue #441.** Der Treiber
entfernt seine importierten Dateien jetzt vor dem Löschen der Messmarke, damit der Datenort
zwischen den Läufen leer bleibt.



### B5 - Der Treiber wertet `console.error` nicht (Gate-Blindstelle) - Loop am 20.10.2026 behoben

Beim Gate-Lauf am **20.10.2026** meldete das Fenster mehrfach:

```
[fenster error] Maximum update depth exceeded. This can happen when a component calls
setState inside useEffect, but useEffect either doesn't have a dependency array, or one
of the dependencies changes on every render.
```

Die Meldungen fielen gehaueft um 4i/4h (kaputte Stelle, Reparatur). Der Lauf blieb
**gruen**, weil der Treiber `console.error` nur druckt; gewertet werden `pageerror` und
`Befund`.

**Untersucht und behoben** (`docs/agents/update-loop-2026-10-20.md`): `baueReiterInhalte`
wurde bei jedem App-Rendern aufgerufen; seine Rueckgabe-Funktionen sind die
Komponententypen im Rahmen - jeder App-Render mountete den aktiven Reiter neu, der
Reparatur-Effekt meldete erneut (gemessen: **2.300** Durchlaeufe). Die Reiterinhalte sind
jetzt je Zugaengen-Satz memoisiert, die Umgebung reist als Getter. Nachher: **12**
Effekt-Durchlaeufe, **keine** Loop-Meldung, Gate **Exit 0**.

**Weiter offen (Gate):** "Maximum update depth" sollte ein **Befund** sein. Sonst bleibt
eine Rueckkehr der Schleife unsichtbar, obwohl sie im Log steht - dieselbe Klasse wie der
Q4-Befund "das Gate war blind".

---

## 4. Luecken nach Prioritaet (Vorschlag, nicht beschlossen)

Reihenfolge nach MoSCoW: **Muss** zuerst. "Treiber" heisst: neuer oder erweiterter Schritt in
`scripts/durchlauf.mjs`; "Produkt" heisst: zuerst bauen (Issue), dann messen.

| Rang | FA | Was fehlt | Weg |
|---|---|---|---|
| ~~1~~ | ~~FA-17/18~~ | **ERLEDIGT 21.10.2026** durch die Treiber-Schritte **4k/4l** - s. Abschnitt 2. | siehe 4k/4l |
| 2 | FA-01/03 | Video **ersetzen** mit Bestaetigung; Aktion **bearbeiten** | Treiber: zweites Video importieren -> `composer-ersetzen-frage`, bestaetigen -> **ein** Video-Element bleibt, Datei getauscht; Aktion oeffnen, Titel aendern, speichern, Wert im Store lesen. |
| ~~3~~ | ~~FA-23~~ | **ERLEDIGT 21.10.2026** durch **4a0/4a/4a2** - s. Abschnitt 2 (Wechsel, Loeschsperre mit Grund/Ausweg, Freigabe nach Zurueckstellen). | siehe 4a0/4a/4a2 |
| ~~4~~ | ~~FA-24~~ | **ERLEDIGT 22.10.2026** durch **4m/4m2**: anlegen/oeffnen, alle dreizehn Farbrollen, Slogan, Sicherheitsabstand samt Wachstums-Hinweis, Ableiten und Bearbeiten (eigen -> geerbt), Import-Pipeline fuer Schrift/Logo, Logo entfernen. **MANUELL** bleibt nur der native Dateidialog. Offen (nicht FA-24): Live-Vorschau (B11) und die Text/Store-Spannung beim Logo-Entfernen (B12). | siehe 4m/4m2 |
| 5 | FA-13 | Vorlagen anlegen/bearbeiten/speichern/verwerfen | Treiber: aus der Uebersicht anlegen, Zone hinzufuegen, speichern, Store lesen; "Verwerfen" stellt den Ausgangsstand her. |
| 6 | FA-22 | Zweite Ausgabe, Vorbelegung, Ersetzen statt Anlegen | Treiber: zweiten Render mit **gleichem** Namen -> eine Datei; mit **neuem** Namen -> zwei Zeilen; Namensfeld ist mit dem letzten Namen vorbelegt. |
| 7 | FA-08 | "Eine durchgehende Datei" inhaltlich | Treiber: nach dem Render die erzeugte Datei mit `ffprobe` messen (Dauer gegen Listensumme, genau eine Datei). Naeher an der Anforderung als "Datei erscheint in der Liste". |
| 8 | FA-06/14 | Standarddauer-Kette, Grenzen 10-45 s, Verlaengern | Treiber: Projekt-Standard setzen, Aktion ohne eigene Dauer platzieren -> Startwert; Grenze ziehen -> 10/45 s; Video-Trim gegen Quelllaenge. |

**Nicht als Treiber-Szenario sinnvoll:** FA-09 (nativer Zielordner-Dialog, User-Entscheidung),
FA-11/FA-12 (optische Abnahme am gerenderten Bild). Beide bleiben **manuell** - wie #433.

---

## 5. Pflege (damit die Matrix nicht verrottet)

Ein Dokument ohne Waechter veraltet still. `tests/unit/treiber-matrix.spec.ts` haelt drei
Zusagen mechanisch:

1. **Jede** FA-Nummer aus dem Anforderungsdokument (FA-01 bis FA-24) hat **genau eine**
   Zeile in der Tabelle.
2. Jede in der Spalte **Treiber-Schritt(e)** genannte Kennung (kommagetrennt, z. B. `4b3`)
   **existiert** als `[schritt-4b3]` im Treiber - ein umbenannter Schritt faellt sofort auf.
3. Jeder **Szenario**-Schritt des Treibers (`[schritt-4*]`, also jede Messung am Fenster)
   ist in der Matrix **erwaehnt** - ein neuer Schritt ohne Zuordnung faellt auf.

Die Infrastruktur-Schritte 1, 2, 3, 4 und 5 werden im Waechter nicht verlangt; sie messen
Start, Projektweg, Dialog-Montage und Aufraeumen, keine FA-Zusage.

**Grenze des Waechters:** Er prueft **Vollstaendigkeit der Zuordnung**, nicht die Wahrheit
der Statusspalte. Ob "teilweise" noch stimmt, entscheidet nur das Lesen des Schritts.

---

## 6. Belege

- Gelesen: `scripts/durchlauf.mjs` **vollstaendig** (2.165 Zeilen, 23 verschiedene
  Schritt-Marker), `docs/Anforderungsdokument_Digital-Signage-Tool.md` Abschnitt 4,
  `docs/agents/q4-test-audit.md`.
- **Gate-Lauf am 20.10.2026** (`npm run pruefung`): Build, Unit, Integration und Treiber
  ohne `Befund`; die `Untersuchung` "4 Reiter" ist nach der Korrektur aus B3 **weg**. Im
  Fenster-Log stehen jedoch die `console.error` aus B5 - sie werden nicht gewertet.
- **#257 am Fenster (20.10.2026):** `[schritt-4j] Warteschlange GEMESSEN: Leiste da,
  eingeklappt ...`; Reiterwechsel und Aufklappen (1 Auftragszeile) ebenfalls belegt.
- **4k/4l am Fenster (21.10.2026):** `[schritt-4k] Fehlschlag GEMESSEN: Zeile
  "fehlgeschlagen", Grund "Datei nicht gefunden ...", Schalter "Erneut versuchen".` Dann
  `Wiederholen GEMESSEN: ... Auftrag aus Q1/Q2 weg, Asset in D1 (FA-17).` Und
  `[schritt-4l] Anstehend GEMESSEN: ... wartet`, `Entfernen GEMESSEN: anstehender Auftrag
  ist aus der Leiste verschwunden (FA-18)`, `Abbrechen GEMESSEN: Rueckfrage bestaetigt,
  Render abgebrochen, keine Ausgabedatei (FA-18)`.
- **4a0/4a2 am Fenster (21.10.2026):** `Zweite Marke GEMESSEN: "DurchlaufMarke-…" (3 -> 4)`;
  `Standardmarke-Wechsel GEMESSEN am echten select und in der Liste`; `Loeschsperre GEMESSEN:
  DurchlaufTest-…; Ausweg "Wechsle die Standardmarke im Reiter Projekte."`; nach dem
  Zurueckstellen `Nach dem Loeschen: {"anzahl":1,"nochDa":false}`.
- **Gate 21.10.2026 (zweiter Lauf, mit FA-23):** `npm run pruefung` ohne `Befund`;
  **5.602 Unit-Tests (333 Dateien)**, **49 Integrationstests (12 Dateien)**. Typecheck/Lint 0.
- Aufrufer-Pruefung B1: `grep` auf `WarteschlangenLeiste`, `Liste`, `baueAuftragsSichtAuf`,
  `wiederholeAuftrag`, `darfWiederholen` ueber `src/` - ausserhalb `queue-panel/` kein
  Aufrufer.
- Markenbestand B2: `marken.json` traegt eine Marke.

