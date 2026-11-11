# Plan: Referenzlauf L-01 (#466)

**Angelegt:** 11.11.2026, umgeschnitten nach der Korrektur vom selben Tag. **Zweck:** das Protokoll
[`abnahme-2026-11-11-referenzlauf.md`](abnahme-2026-11-11-referenzlauf.md) mit echten Zahlen füllen.

---

## 0. Was hier verglichen wird (Korrektur 11.11.2026)

**Nicht Folien.** Der Vergleich ist **Arbeit gegen Arbeit**: dieselbe Aufgabe, einmal mit einem
**Allzweck-Werkzeug** (PowerPoint, Google Slides, Canva — welches, ist Nebensache) und einmal mit dem
Werkzeug, das für genau diesen Fall gebaut ist.

Niklas, 11.11.2026: *„es geht um anwendungen wie powerpoint dass es für den spezifischen use case
deutlich besser ist … zum beispiel durch das automatische laden von produktinformationen"*.

Daraus folgt:

- **Die Stoppuhr ist das Hauptkriterium.** Der Qualitätsbogen (AD 14) bleibt, aber er entscheidet
  nicht allein — ein gutes Deck sieht gut aus, das ist keine Kunst.
- **Der Vergleich ist symmetrisch.** Beide Seiten bekommen dieselben fünf Produkte, dieselben Bilder,
  dieselbe Zeit und auf beiden Seiten eine **fertige Vorlage**. Der Unterschied soll aus dem Werkzeug
  kommen, nicht aus einem Vorsprung an Gestaltungsarbeit.
- **Welches Programm, ist egal.** Es wird Google Slides benutzt, weil es da ist und nichts kostet.
  Das ist eine Bequemlichkeit, keine Aussage.

**Der eine Befund, der schon vor dem Lauf feststeht:** Der genannte Differenzierer —
automatisches Laden von Produktinformationen — ist **FA-27** und **nicht gebaut** (#469 offen).
Genauso fehlt **FA-26** (Varianten).

**Entschieden (Niklas, 11.11.2026): jetzt messen, später ein zweiter Lauf.** Der erste Lauf stellt die
**Baseline** und den **Ist-Stand** fest — mit diesen Lücken. Sobald #469 und FA-26 gebaut sind, folgt
ein zweiter Lauf und zeigt das Delta.

Damit ist die Zusage dieses Laufs **nicht** „das Werkzeug gewinnt", sondern: *die Messlatte steht, und
der Ist-Stand ist beziffert.*

---

## 1. Die drei Aufgaben (auf beiden Seiten dieselben)

| # | Aufgabe | Woran sie scheitert, wenn das Werkzeug nichts taugt |
|---|---|---|
| 1 | **Fünf Angebote anlegen** (Texte, Preise, Bilder liegen vor) | man tippt alles von Hand, obwohl die Daten im System stehen |
| 2 | **Einen Preis ändern** | jedes Vorkommen muss einzeln nachgezogen werden |
| 3 | **Ein sechstes Angebot hinzufügen** | man fängt bei null an, weil die Vorlage nicht wiederverwendbar ist |

Dazu die Referenzaufgabe aus AD 12.1: **Projekt A** 15 min / 5 Angebote / 3 Band-Spots /
2 Unterbrecher, **Projekt B** 10 min / 3 Angebote, beide als MP4, beide auf einen Stick, jede Datei
für sich loopbar.

---

## 2. Arbeitsteilung und Zeitmessung

**Der eine Grundsatz:** Die Zeiten misst **deine Hand**, nicht mein Skript. Sobald ich klicke, misst
der Lauf meine Klickroutine.

| Ich | Du |
|---|---|
| Material legen, Vorlage beschaffen, Paare schneiden, `ffprobe` prüfen, Protokoll führen, Summen rechnen, Findings formulieren | Bedienen, gestalten, **Zeit ansagen** („start" / „stopp"), Bogen ausfüllen |

**Zeitmessung:** Stoppuhr auf dem Handy, unabhängig von mir. Du sagst mir die Zahl, ich trage sie ein.

---

## 3. Die Phasen

### Phase 0 — Material und Vorlage (nicht gemessen)

- [ ] **0.1** Zwei Vorlagen wählen und in Google Slides öffnen (z. B. PresentationGO „Fitness Studio",
      SlidesCarnival „Salerio"). Eine davon wird die Baseline.
- [ ] **0.2** **Wirklich öffnen und ansehen.** Eine Vorlage, die nicht lädt, ist keine Baseline.
- [ ] **0.3** Prüfen, **was Google Slides exportieren kann** — im Menü nachsehen, nicht annehmen.
      Ergebnis ins Protokoll. (Ein Allzweck-Werkzeug, das kein Video ausgibt, ist ein Befund.)
- [ ] **0.4** Bilder prüfen — liegen in `docs/artikel/referenzangebote/`
- [ ] **0.5** Bogen bereitlegen, Etiketten bleiben blind
- [ ] **0.6** Startpunkt der Uhr festlegen (Vorschlag: erster Klick, nicht das Suchen)

### Phase 1 — Baseline: Aufgabe 1, 2, 3 (gemessen)

- [ ] **1.1** Fünf Angebote eintragen (Text, Preis, Bild) → Zeit 4.1
- [ ] **1.2** Einen Preis ändern → Zeit 4.1
- [ ] **1.3** Ein sechstes Angebot hinzufügen → Zeit 4.1
- [ ] **1.4** Fünf Ergebnisse als Bild ausgeben und ablegen

### Phase 2 — Tool: Projekt A (gemessen)

- [ ] **2.1** Projekt A aufsetzen: 15 min, 5 Angebote, 3 Band-Spots, 2 Unterbrecher → Zeit 4.2.
      **Soll: 15–30 min.**
- [ ] **2.2** **Ein** neues Angebot **inklusive Designarbeit** → Zeit 4.2. **Soll: ≤ 5 min.**
- [ ] **2.3** Preis ändern, ohne zu rendern → Zeit 4.2. **Soll: ≤ 1 min.**
- [ ] **2.4** Rendern → Zeit **separat**, zählt nicht auf 2.3.

> **Bekannter Befund:** FA-26 (Varianten) fehlt, „Designarbeit" ist damit ärmer als AD 12.1 sie meint.

### Phase 3 — Tool: Projekt B (gemessen)

- [ ] **3.1** Projekt B: 10 min, 3 Angebote → Zeit 4.3

### Phase 4 — Technische Gültigkeit (objektiv, ich prüfe)

- [ ] **4.1** Je Projekt **eine** MP4, 30 fps, Dauer gegen Anzeige, keine Naht → Protokoll 1.5
- [ ] **4.2** Beide Dateien auf **einen** USB-Stick, jede für sich loopbar

### Phase 5 — A/B-Paare schneiden (ich, ohne Wertung)

- [ ] **5.1** Zu jedem der fünf Angebote ein **Paar**: Tool gegen Baseline, Etikett **A** oder **B**.
      Die Zuordnung würfelt ein Skript und schreibt sie **erst in Abschnitt 8** des Protokolls.
- [ ] **5.2** **Entscheidung vor dem Bewerten:** woraus wird bewertet?
      - **Standbild** für Layout-Kriterien (Fokus, Preis-Hierarchie, Lesbarkeit, Konsistenz,
        Komposition, Kontrast)
      - **Bewegung** lässt sich daraus nicht beurteilen. Wie das bewertet wird, legen wir **vorher**
        fest, nicht hinterher.

### Phase 6 — Bogen ausfüllen

- [ ] **6.1** Niklas füllt aus (12 Kriterien, je 0/1/2)
- [ ] **6.2** Optional Familie/Freunde. **Bögen einzeln berichten**, nicht mitteln.

### Phase 7 — Auflösung und Auswertung (ich)

- [ ] **7.1** Etiketten auflösen, Summen bilden, Gewinnerwartung prüfen
- [ ] **7.2** Startwert verfehlt → neue Zahl aus den Messwerten **ableiten**, nicht verteidigen
- [ ] **7.3** Findings ins Protokoll, Bau-Issues **vorschlagen** (kein Bau in #466)

### Phase 8 — Abschluss

- [ ] **8.1** Protokoll vollständig, DoD-Häkchen gesetzt
- [ ] **8.2** Commit; Push nur auf Anweisung
- [ ] **8.3** Issues anlegen nur mit Freigabe

---

## 4. Was schiefgehen kann (vorher benannt)

| Risiko | Wirkung | Umgang |
|---|---|---|
| Google Slides kann kein Video exportieren | Baseline nicht 1:1 wie AD 12.1 | in Phase 0 **belegen**, Ausweichweg benennen — und als Befund festhalten |
| Vorlage lädt nicht | Phase 1 blockiert | in Phase 0 prüfen, nicht erst in Phase 1 |
| FA-26 fehlt | „Designarbeit" ärmer als zugesagt | **Befund**, kein Abbruch |
| FA-27 fehlt | der genannte Hauptvorteil fehlt im Lauf | **entschieden:** Ist-Stand messen, zweiter Lauf |
| 15-min-Video rendert lange | Zeitgefühl kippt | Renderzeit getrennt messen |
| Ich klicke versehentlich mit | Messung misst mich | bedienen tust du |
| Bewertung erkennt das Werkzeug | Bogen wertlos | Etiketten blind, Auflösung erst in Abschnitt 8 |
