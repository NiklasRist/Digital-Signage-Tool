# Treiber-Matrix: Anforderung -> Szenario

**Stand:** 20.10.2026. **Art:** Bestandsaufnahme, **keine Verhaltensaenderung**.
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
| FA-16 | Sichtbare Warteschlange (Muss) | - | **Kein Szenario moeglich:** die Leiste ist ein leerer `<footer>`; die Auftragsliste wird nirgends montiert. Siehe Befund B1 und #257. | blockiert |
| FA-17 | Fehlgeschlagenen Auftrag mit Grund wiederholen (Muss) | - | Wie FA-16: `wiederholeAuftrag`/`darfWiederholen` haben ausser Tests **keinen Aufrufer**. | blockiert |
| FA-18 | Auftrag entfernen, laufenden Render abbrechen (Soll) | - | Wie FA-16: `entfernen.ts` wird nur als Typ importiert. | blockiert |
| FA-19 | Gefuehrte Reparatur; Render erst frei, wenn alles behoben | 4h, 4i | Kaputte Stelle erzeugt und Projekt neu geoeffnet: Panel da, Fortschritt "0 von N behoben", Render-Knopf `disabled`; Fix "Element entfernen" schrumpft die Liste, Cmd+Z stellt in EINEM Schritt her. Vierter Fall (#438) als `unterbrechung` belegt. | gemessen |
| FA-20 | Split-Screen/Einblendung, Rotation, Unterbrechung (Muss) | 4b5, 4b6, 4f2 | Unterbrechung pausiert das Video an der Zeitstelle und laeuft danach weiter; ein Drop auf den Video-Koerper erzeugt EINE Marke; ein Band-Drop legt einen Abschnitt im Store an, ohne die Blockzahl zu aendern, und ist ein Undo-Schritt. **Rotation mehrerer Aktionen** und die **Render-Ausgabe** von Band/Einblendung sind ungemessen. | teilweise |
| FA-21 | Undo/Redo in beiden Editoren | 4f3, 4f, 4f2, 4f4, 4g2, 4g4, 4h | Pfeile sichtbar und aktiv; Undo schrumpft, Redo waechst; je eine Aktion ist EIN Schritt (Einfuegen, Band, Dauer/Trim, Anlage, Loeschen, Reparatur). Der **Vorlagen-Editor** hat kein Undo-Szenario. | teilweise |
| FA-22 | Mehrere benannte Ausgaben; Vorbelegung = letzter Name | 4c | Der Name wird ohne Endung eingetippt, der Dialog prueft, die Ausgabe steht danach in der Liste. **Zweite Ausgabe**, Vorbelegung und Ersetzen-statt-Anlegen sind ungemessen. | teilweise |
| FA-23 | Marken-Bestand, Standardmarke je Projekt, Loeschsperre (Muss) | 4a | Der Wechsel am echten `<select>` wird **nur ausgefuehrt, wenn eine zweite Marke existiert**. Im Messbestand liegt genau eine - der Treiber meldet das selbst. Loeschsperren ungemessen. | Luecke |
| FA-24 | Marken anlegen, bearbeiten, ableiten, Kontrastwarnung (Muss) | - | Kein Schritt oeffnet den Marken-Reiter ueber das blosse Vorhandensein hinaus. | Luecke |

**Zaehlung:** 2 x gemessen (FA-05, FA-19), 14 x teilweise, 2 x Luecke (FA-23, FA-24),
3 x blockiert (FA-16/17/18), 3 x manuell (FA-09, FA-11, FA-12).

Aufgeteilt nach Prioritaet (AD Abschnitt 4): **15 Muss**, 9 Soll.
- **Muss:** 1 gemessen (FA-05), 9 teilweise, 2 Luecke (FA-23/24), 2 blockiert (FA-16/17),
  1 manuell (FA-09).
- **Soll:** 1 gemessen (FA-19), 5 teilweise, 1 blockiert (FA-18), 2 manuell (FA-11/12).

Damit ist **1 von 15 Muss-Anforderungen** am echten Fenster vollstaendig gemessen (FA-05) -
und **zwei weitere** (FA-16/17) haben heute ueberhaupt keine Oberflaeche (B1).

---

## 3. Befunde beim Aufstellen

### B1 - FA-16/17/18 sind nicht "ungemessen", sondern **nicht montiert** (#257)

Das ist der schwerste Befund dieser Matrix und er betrifft eine **Muss**-Anforderung:

- `src/renderer/queue-panel/warteschlangen-leiste.tsx` gibt einen **leeren** `<footer>` mit
  32 px Hoehe zurueck - kein Inhalt, keine Anzeige.
- `liste.tsx` (die Auftragsliste), `leisten-montage.ts` (Klappzustand, Rueckfrage,
  `aktuelleRenderId`), `wiederholen.ts` (FA-17) und `entfernen.ts` (FA-18) haben
  **ausserhalb von `queue-panel/` keinen Importeur** (Grep auf die Exportnamen; einziger
  Treffer ausserhalb ist ein *Typ*-Import aus `entfernen.ts`).
- `baueAuftragsSichtAuf` (#205, der `holeStand`-Aufruf) wird **nirgends** gerufen.

Damit ist genau die Lueckenklasse da, die dieses Projekt am haeufigsten getroffen hat:
**fertige Funktion ohne Aufrufer**. Das Messwerkzeug meldet M7 mit "68 von 71 gebaut",
weil es das Vorhandensein der Dateien zaehlt - nicht den Aufrufer. #257 ist **offen** und
beschreibt den Bau der Modul-Wurzel; bis dahin kann kein Treiber-Szenario fuer FA-16/17/18
existieren. **Die Matrix macht daraus eine Produkt-, keine Testluecke.**

### B2 - FA-23 wird heute gar nicht gemessen

Schritt 4a sucht eine zweite Marke im Bestand. Im Messbestand (`marken.json`) liegt **genau
eine** (Fitnessworld24). Der Treiber schreibt deshalb selbst:
`Nur eine Marke im Bestand - der Wechsel braucht eine zweite (Seed-Weg ungetestet, UI-Weg folgt).`
Der `select`-Wechsel wird also **nicht** ausgefuehrt. Ein Seed ist klein: `marken:erstelleMarke`
ist verdrahtet (`src/shared/contracts/kanaele.ts`, `marken-store/erstelle-marke.ts`).

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

### B5 - Der Treiber wertet `console.error` nicht (Gate-Blindstelle)

Beim Gate-Lauf am **20.10.2026** (nach der Korrektur aus B3) meldete das Fenster mehrfach:

```
[fenster error] Maximum update depth exceeded. This can happen when a component calls
setState inside useEffect, but useEffect either doesn't have a dependency array, or one
of the dependencies changes on every render.
```

Die Meldungen fielen **gehaeuft um 4i und 4h** (kaputte Stelle, Reparatur), also genau dort, wo
der Q4-3-Fix vom 19.10. den Reparatur-Stand neu rechnet. Der Lauf blieb trotzdem **gruen**:

- `seite.on("console")` **druckt** Fehler nur (`scripts/durchlauf.mjs`, Kopf des `main`),
- gewertet werden `pageerror` und Funde der Schwere `Befund`,
- das Protokoll (`docs/agents/oberflaeche-durchlauf.md`) enthaelt dazu **keine** Zeile -
  `grep -c "Maximum update depth"` ergibt **0**.

Damit ist die Ursache **nicht bestimmt** (ein React-Update-Loop ist wahrscheinlich, aber nicht
belegt). Zwei getrennte Punkte folgen daraus:

1. **Produkt:** Der Update-Loop braucht eine eigene Untersuchung mit Stack (eigener Schritt,
   nicht Teil dieser Matrix).
2. **Gate:** Ein `console.error` mit dieser Signatur sollte ein **Befund** sein. Sonst bleibt
   die Schleife unsichtbar, obwohl sie im Log steht - dieselbe Klasse wie der Q4-Befund
   "das Gate war blind".

---

## 4. Luecken nach Prioritaet (Vorschlag, nicht beschlossen)

Reihenfolge nach MoSCoW: **Muss** zuerst. "Treiber" heisst: neuer oder erweiterter Schritt in
`scripts/durchlauf.mjs`; "Produkt" heisst: zuerst bauen (Issue), dann messen.

| Rang | FA | Was fehlt | Weg |
|---|---|---|---|
| 1 | FA-16/17/18 | Die Warteschlange ist nicht sichtbar; Wiederholen/Entfernen nicht erreichbar | **Produkt:** #257 bauen. Danach Treiber: Auftrag erzeugen, Leiste aufklappen, Zeile und Zustand lesen; Fehlschlag provozieren, "Erneut versuchen" klicken; anstehenden Auftrag entfernen. |
| 2 | FA-01/03 | Video **ersetzen** mit Bestaetigung; Aktion **bearbeiten** | Treiber: zweites Video importieren -> `composer-ersetzen-frage`, bestaetigen -> **ein** Video-Element bleibt, Datei getauscht; Aktion oeffnen, Titel aendern, speichern, Wert im Store lesen. |
| 3 | FA-23 | Standardmarke wechseln (mangels zweiter Marke), Loeschsperre | Treiber: zweite Marke per `marken:erstelleMarke` seeden, dann 4a wie gebaut laufen lassen; Loeschen einer genutzten Marke versuchen und Sperrgrund lesen. |
| 4 | FA-24 | Marken-Editor vollstaendig | Treiber: Reiter Marken, Marke anlegen, Akzentfarbe setzen, Kontrastwarnung ausloesen (Grenzwert), ableiten, Loeschsperre. |
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
- Aufrufer-Pruefung B1: `grep` auf `WarteschlangenLeiste`, `Liste`, `baueAuftragsSichtAuf`,
  `wiederholeAuftrag`, `darfWiederholen` ueber `src/` - ausserhalb `queue-panel/` kein
  Aufrufer.
- Markenbestand B2: `marken.json` traegt eine Marke.

