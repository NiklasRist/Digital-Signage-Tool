# Übergabe: Stand der Task-Überführung

> **Für eine neue Sitzung.** Diese Datei sagt, **wo wir stehen** und **wie es weitergeht**.
> Das **Wie** der Issue-Erstellung steht vollständig in `issue-generation-prompt.md` — dort
> beginnen, diese Datei ist nur der Stand darüber.
>
> **Stand:** 03.08.2026 · Anforderungsdokument **v1.2** · Technisches Konzept **v2.6**

---

## 0. Womit du anfängst

1. **Diese Datei ganz lesen.** Sie ist kurz.
2. **`docs/agents/issue-generation-prompt.md`** — das ist der eigentliche Auftrag: Modulschnitt,
   alle Invarianten zum Wörtlich-Zitieren, die Pflicht-Vorlage samt ausgefülltem Beispiel und die
   fünf Regeln A–E. **Vollständig lesen, nicht querlesen** — die Regeln C, D und E sind aus
   konkreten Fehlern entstanden, die zweimal aufgetreten sind.
3. **`docs/agents/m2-pruefbefund.md`** und **`m1-pruefbefund.md`** — die Fehler der letzten beiden
   Durchgänge im Detail. Wer sie kennt, macht sie nicht nochmal. **M2 zuerst**: dort steht, was der
   Briefing-Ansatz gebracht hat und welches Muster (Regel A auf Modulebene) noch offen war.
4. Dann **Abschnitt 4 dieser Datei**: M2 ist fertig, **M3 ist der nächste** Meilenstein.

**Kein Produktivcode.** Das Projekt ist in der Planungsphase — Code erst, wenn der Nutzer
ausdrücklich sagt „wir sind nicht mehr im Plan". Aufgabe ist, Issues zu schreiben, nicht sie umzusetzen.

**Lies Abschnitt 4b, bevor du den Nutzer nach Entscheidungen fragst.** Es gibt 21 Issues mit
`braucht-entscheidung`, aber die sind **keine** Bringschuld, die vorher abzuarbeiten wäre.

---

## 1. Wo wir stehen

**Planung fertig und geprüft.** Beide Dokumente sind vollständig, mehrfach geprüft und mit den
`.docx` synchron. Repo: `NiklasRist/Digital-Signage-Tool` (privat).

| Meilenstein | Stand |
|---|---|
| **M0 Grundgerüst** | ✅ **Issues #1–#12** angelegt, geprüft, korrigiert |
| **M1 Fundament** | ✅ **Issues #13–#52** angelegt, geprüft, korrigiert (`M1-XX → #(XX+12)`) |
| **M2 Torwächter** | ✅ **Issues #53–#71** angelegt, geprüft, korrigiert (`M2-XX → #(XX+52)`) |
| **M1-Nachzügler** | 🟡 **6 Texte geschrieben und korrigiert**, `docs/agents/m1-nachzuegler/` — **Prüflauf und Anlegen stehen aus** |
| **M3 Medien** | 🟡 **17 Texte geschrieben und korrigiert**, `docs/agents/m3/` — **Prüflauf und Anlegen stehen aus** |
| **M4–M7** | ⬜ offen |

Alles liegt im Branch **`planung/ad-v1.2-tk-v2.3-issues`** und die Arbeit geht **auf diesem Branch
weiter** (so vom Nutzer entschieden) — nicht nach `main` mergen, nicht ungefragt pushen.

## 2. Der Ablauf, der sich bewährt hat

Pro Meilenstein, in dieser Reihenfolge — **nicht** abkürzen:

1. **Zuschnitt** aus dem Vertrag ableiten und dem Nutzer als Inventar zeigen.
2. **Schreiben** — mehrere Agents parallel, je Agent 5–8 Issues, jeder besitzt **eigene Dateien**
   (sonst greifen sich zwei dieselbe). Eine Datei je Issue, erste Zeile
   `### Issue M2-XX: [modul] Titel`.
3. **Prüfen** — mehrere unabhängige Prüfer, je 6–8 Issues, gegen TK **und** die Regeln A–E.
   Das ist der Schritt, der sich auszahlt: Bei M1 fanden 6 Prüfer über 40 Issues rund
   50 Befunde, davon 9 kritische.
4. **Korrigieren** — wieder per Agent, mit **Diff-Kontrolle**: „ändere ausschließlich das
   Beauftragte, alles andere zeichengenau" und danach den Diff wirklich ansehen.
5. **Anlegen** — `python tools/create-issues.py <verzeichnis> "<Milestone>"` erst **trocken**,
   dann mit `--go`.
6. **Zweiter Durchgang:** Querverweise (`M2-07` …) auf die echten `#`-Nummern umschreiben — die
   kennt man erst nach dem Anlegen. Mapping steht in `<verzeichnis>/map.json`.
7. **Draft nachziehen** (`issues-draft.md`) und Mapping-Tabelle ergänzen, damit Draft und GitHub
   nie auseinanderlaufen.

**Freigabe des Nutzers vor jedem Anlegen.** Issues sind nach außen sichtbar.

## 3. Die Fehlermuster, die zweimal aufgetreten sind

Bei M0 und M1 **dieselben** vier. Wer sie beim Schreiben vermeidet, spart den halben Prüflauf.

| Muster | Was schiefgeht |
|---|---|
| **Regel C** (M0 4×, M1 7×) | Die „Signatur (verbindlich)" entscheidet etwas, und der STOPP-Block stellt **denselben** Punkt als offen dar. Der Agent liest „NICHT ändern", setzt um und fragt nie — die Rückfrage ist strukturell abgeschaltet. |
| **Regel E** (M1 ~21×) | DoD-Schlusspunkt „Keine Datei außerhalb von `X` geändert", während andere DoD-Punkte Tests verlangen. Immer „**(+ zugehörige Testdatei)**" schreiben. |
| **Regel D** (M1 7×) | Erfundene TK-Zitate. Zwei standen im TK **gar nicht**. Jedes Zitat per Suche verifizieren — der Agent kann nicht nachschlagen. |
| **Fehlende Begründung** | „Blockiert von: #12" ohne Klammerzusatz. Die Vorlage verlangt ihn. |

**Beleg, dass es hilft:** M1-37/38/39 entstanden **nach** den Regeln C/D/E. M1-37 und M1-38 hatten
**null** Befunde, M1-39 nur die Testdatei-Zeile. Die 29 älteren Issues brauchten 370 Zeilen Korrektur.

## 4. M2 – Torwächter (`auftrags-manager`, P6): ERLEDIGT, Issues #53–#71

**Stand 03.08.2026:** 19 Issues geschrieben, von vier Prüfern geprüft (~45 Befunde, 11 kritische),
in drei Durchgängen korrigiert und angelegt. Details: `m2-pruefbefund.md`. Die Volltexte liegen als
**eine Datei je Issue** in `docs/agents/m2/` — das ist das Format, das `create-issues.py` frisst;
das Mapping steht in `docs/agents/m2/map.json`.

**Was der Durchgang gelehrt hat (gilt ab M3):**

1. **Eine Briefing-Datei vor dem Schreiben zahlt sich aus.** Alle Festlegungen, die das Technische
   Konzept offen lässt, gehören ausgeschrieben in eine Vorgabe, die jeder schreibende Agent liest.
   Ergebnis: Regel D zu 100 % eingehalten (bei M1 sieben Verstöße), Regel E lückenlos.
2. **Regel A gilt auch zwischen Modulen.** Ein Aufruf darf nie nur als Issue-Nummer dastehen
   („über M2-04 anhängen") — **Name und Signatur** gehören ins Issue. Das betraf alle 18 Texte.
3. **Die teuren Befunde liegen an den Nähten**, nicht in den einzelnen Issues. Ein Querschnitts-Prüfer,
   der nur Verzahnung, Abhängigkeitsgraph und doppelte Zuständigkeit prüft, hat sich gelohnt.
4. **Lokale Detailfragen selbst entscheiden**, statt sie in den STOPP-Block zu legen. Sonst trägt das
   Label `braucht-entscheidung` 17 von 18 Issues und ist wertlos. Nach 15 Entscheidungen: 9 von 19.

**Die verbliebenen 9 Entscheidungs-Issues:** #53 · #61 · #64 · #65 · #67 · #68 · #69 · #70 · #71
(Begründung je Issue in `m2-pruefbefund.md`).

<details>
<summary>Der ursprüngliche Zuschnitt (16 Issues) — zur Nachvollziehbarkeit</summary>

Vertrag **TK 9.3**. Der `Auftrag`-Typ existiert schon (**#16**). Milestone-Titel: `M2 – Torwächter`.

| Nr. | Issue | Vertrag |
|---|---|---|
| M2-01 | [contracts] `ProtokollEintrag` und `JournalEintrag` definieren | 9.3 |
| M2-02 | [auftrags-manager] Q1 aktive Warteschlange (RAM) + FIFO-Auswahl | 9.3, 9.3.5 |
| M2-03 | [auftrags-manager] Q2 Wiederholungs-Speicher, atomar, **pro Projekt** | 9.3 |
| M2-04 | [auftrags-manager] Q3 Ausführungs-Protokoll (append-only, unbegrenzt) | 9.3 |
| M2-05 | [auftrags-manager] Q4 Warteschlangen-Journal (rotierend) | 9.3 |
| M2-06 | [auftrags-manager] Zustandsübergänge validieren | 9.3.3 |
| M2-07 | [auftrags-manager] serieller Torwächter: nächsten Auftrag freigeben | 9.3.5 |
| M2-08 | [auftrags-manager] Dispatcher `art` → Fachdienst | 9.3.2 |
| M2-09 | [auftrags-manager] `reiheEin` | 9.3.4 |
| M2-10 | [auftrags-manager] `entferne` (anstehend vs. laufend → `cancelRender`) | 9.3.4, 9.3.6 |
| M2-11 | [auftrags-manager] `wiederhole` | 9.3.4, 9.3.5 |
| M2-12 | [auftrags-manager] `holeStand` | 9.3.4 |
| M2-13 | [auftrags-manager] Ereignis `QueueGeändert` | 9.3.4, 9.1.1 |
| M2-14 | [auftrags-manager] `pendingDeletions` in Q2 führen: lesen, ergänzen, streichen (**kein** Auftrag) | 9.3, 9.4.7 |
| M2-15 | [auftrags-manager] Neustart: Q1 leer, Q2 laden | 9.3, 9.3.5 |
| M2-16 | [auftrags-manager] Verzahnung mit `render-service` | 9.3.6 |
| **M2-17** | [auftrags-manager] Atomares, **serialisiertes** Schreiben der Queue-Dateien (Q2/Q3/Q4) | 9.5.4 |
| **M2-18** | [auftrags-manager] Auftrag abschließen: terminaler Übergang, Q3-Eintrag, Q2-Pflege, nächsten freigeben | 9.3, 9.3.3 |

**Nachträge vom 03.08. (vom Nutzer entschieden, Zuschnitt jetzt 18 Issues):**

- **M2-17 neu:** Q2, Q3 und Q4 sind drei Dateien mit derselben Anforderung. TK 9.5.4: „Die
  Auftragsverwaltungs-Speicher Q2/Q3 (eigene Dateien, 9.3) haben ihre **eigene** Serialisierung."
  Ohne gemeinsamen Baustein bauen drei Agents drei Schreibmechanismen.
- **M2-18 neu:** Der terminale Übergang hatte im 16er-Schnitt **kein Zuhause** – damit wäre die Regel
  „ein Q3-Eintrag je beendetem Versuch" heimatlos gewesen. Dieselbe Lückenklasse wie M1-28, wo die
  Kaskade perfekt beschrieben war und das eigentliche Löschen fehlte.
- **M2-14 geändert:** `pendingDeletions` sind **keine** Aufträge (TK v2.4). Die Auftragsverwaltung
  **verwahrt** sie und bietet dem `media-service` main-intern Lesen/Ergänzen/Streichen an; **ausgeführt**
  wird vom Reconcile (9.4.7). Ein erneut eingereihter `loeschen`-Auftrag wäre **immer** an
  `asset_nicht_gefunden` gescheitert, weil beim Löschen der D1-Eintrag zuerst verschwindet.
- **Keine Leseoperation für Q3.** Die Ausgabe-Liste (FA-22) speist sich aus dem **Ausgabeordner**
  (`listeAusgaben`, TK 9.5.2 – neu in v2.4), nicht aus dem Protokoll: Das Änderungsdatum der Datei **ist**
  der Renderzeitpunkt, weil sie atomar dorthin gelangt. Q3 bleibt in v1 **bewusst nur schreibend**
  (Historie/Nachweis inkl. Fehlschläge). Das gehört ausdrücklich ins Q3-Issue, sonst „ergänzt" es ein Agent.
- **`entferne` bleibt bei drei Fällen** (9.3.4 klärt es): anstehend → aus der Schlange; laufender Render →
  `cancelRender`; **beendeter** Auftrag → `nicht_gefunden`. „Verwerfen" wird **keine** Operation.

**Neue Labels dafür:** `modul:auftrags-manager` (Farbe `1d76db`).

### Die Invarianten, die in die M2-Issues gehören (wörtlich aus TK 9.3.5 zitieren)

- **Seriell:** höchstens **ein** Auftrag in `laeuft`. Das ist der **einzige** Sperr-Mechanismus des
  Systems — ein zweites Lock darf es nicht geben. (Das eine D1-Schreib-Lock gehört dem
  `project-store` und schützt nur `project.json`.)
- **FIFO** unter `anstehend`; `wiederhole` hängt **hinten** an.
- **Render friert seinen Eingang beim Einreihen ein** — Liste + Profil als Snapshot zum
  Einreih-Zeitpunkt. Sonst rendert ein Auftrag eine Liste, die der Nutzer inzwischen geändert hat.
- **Wiederholen bleibt ein Eintrag:** derselbe Q2-Eintrag wandert zurück nach `anstehend`,
  `versuche` +1. Aber: **jede** Wiederholung erzeugt einen **neuen** Q3-Eintrag mit höherem
  `versuch` — Fehlschläge bleiben sichtbar.
- **Q3 protokolliert nur, was tatsächlich gelaufen ist.** Ein Auftrag, der die Schlange nie
  verlassen hat, erzeugt **keinen** Eintrag.
- **Q3 vs. Q4 ist Absicht:** Q3 beantwortet „was wurde produziert" (nutzerlesbar), Q4 „was
  passierte in der Schlange" (diagnostisch, rotierend).
- **Vier Speicher, vier Persistenzen:** Q1 flüchtig/RAM · Q2 persistent bis erledigt,
  `projects/<id>/queue-retry.json` · Q3 dauerhaft unbegrenzt, `protokoll.json` app-weit ·
  Q4 dauerhaft rotierend, `warteschlangen-journal.json` app-weit.
- **Ereignisse tragen keine Ergebnis-Hülle** und keinen Endzustand (9.1.1).
- **`render_aktiv` ist entfallen** — die serielle Ordnung macht die Kollision unmöglich.

</details>

⚠ **Offen und terminiert, gehört NICHT zu M2:** Für `listeAusgaben` (TK 9.5.2, neu in v2.4) gibt es
**noch kein Issue**. Es ist eine **`project-store`**-Operation, also fachlich M1 – der Milestone ist
aber schon angelegt (#13–#52). Entweder als Nachzügler in M1 (wie seinerzeit M1-40 `Marke`) oder zu
Beginn von **M6**, wo `export-service` sie zuerst braucht. **Vor M6 entscheiden**, sonst fällt die
Operation zwischen die Meilensteine – und ohne sie hat weder die Ausgabe-Liste (FA-22) noch der
Export-Dialog eine Datenquelle.

⚠ **Drei Doku-Nachträge aus dem M2-Lauf** (eigener Schritt, eigene Freigabe, Word + Markdown zusammen):
**TK 9.3.3/9.3.4/9.3.5** – `versuche` +1 gehört an den Start, nicht an `wiederhole` (vom Nutzer am
03.08. entschieden; das Feld heißt „Anzahl bisheriger Ausführungen", sonst stünde ein gescheiterter
Auftrag bei null) · **TK 9.4.6 Schritt 3** – „Pfad in `pendingDeletions`" → `dateiname` ohne
Verzeichnisanteil (passend zu 9.4.8 und zur portablen Auslieferung) · **M7** – „Abbrechen" wird nur bei
laufendem `render` angeboten.

## 4c. M3 – Medien (`media-service`, P1) und die sechs M1-Nachzügler: WO ES STEHT

**Stand 03.08.2026: geschrieben und korrigiert, aber NICHT geprüft und NICHT angelegt.**
Wer hier weitermacht, fängt beim **Prüflauf** an (Abschnitt 2, Schritt 3) — vier Prüfer wie bei M2,
davon einer im Querschnitt. Danach korrigieren, anlegen, Verweise nachziehen, Doku.

- **17 Texte für M3** in `docs/agents/m3/` (M3-01…M3-17). Der harte Kern liegt in M3-07 bis M3-10:
  Kopie ins Staging → atomarer Rename; beim Löschen **D1 zuerst**, Datei danach. Falsch herum gebaut
  zeigt die Liste auf eine Datei, die es nicht mehr gibt.
- **6 Nachzügler** in `docs/agents/m1-nachzuegler/` (M1-41…M1-46), Meilenstein **M1**, nicht M3:
  drei Asset-Operationen des `project-store` (ohne sie kann der Medien-Dienst nichts eintragen —
  TK 9.4.1 verbietet ihm eigene D1-Schreibvorgänge), `listeAusgaben` (der Nachtrag aus v2.4) und
  **zwei IPC-Verdrahtungen**.
- **Die Nummern-Faustregel gilt für die Nachzügler NICHT.** `#41`–`#46` sind längst vergeben; sie
  bekommen fortlaufende Nummern **ab #72**, M3 danach. In den Texten steht deshalb `M1-41` …, nie
  eine erfundene `#`-Nummer.

**Warum es die Nachzügler überhaupt gibt — der wichtigste Befund dieses Durchgangs:**
Von 40 M1-Issues melden genau **zwei** ihren IPC-Kanal an: der generische Wrapper (#23) und die
Registry (#25). **Keine einzige der rund 18 Operationen** tut es. M1 wäre fertig gebaut worden, und
die Oberfläche käme an nichts heran. Derselbe Befund wie bei M2 (dort wurde daraus #71), nur eine
Ebene größer. Aufgefallen ist er erst, weil für M3 zu klären war, wer den Aufräumlauf anstößt.

**Zwei Regeln, die aus diesem Durchgang folgen:**

1. **Eine Vertragsänderung erzwingt einen Zitat-Abgleich über ALLE angelegten Issues.** Regel D gilt
   auch rückwärts. Nach der Anhebung auf TK v2.5 trugen **14 der 71** Issues wörtliche Zitate der
   geänderten Stellen — bei dreien hätte ein Agent daraufhin den Versuchszähler doppelt hochgezählt.
   Vorgehen: alle Bodies ziehen, auf die alten Wortlaute suchen, mechanisch ersetzen, gegenprüfen.
2. **Nach jeder Änderung auf GitHub die lokalen Quelldateien angleichen.** `docs/agents/<m>/` ist die
   Quelle der Wahrheit; wird nur GitHub nachgezogen, überschreibt der nächste Lauf die Korrekturen
   stillschweigend. Kontrolle: lokale Datei normalisieren (`M2-07` → `#59`) und gegen den Body
   diffen — bei M2 waren so zuletzt 19 von 19 deckungsgleich.

## 4b. Reihenfolge: erst das Grundgerüst, dann die M1-Entscheidungen

**Wichtig, sonst drängt man den Nutzer zu Entscheidungen, die noch nicht dran sind.**

Die 21 Issues mit `braucht-entscheidung` sind **keine Liste, die vor dem Anfangen abzuarbeiten
ist**. Sie sind gestaffelt:

1. **M0 (#1–#12) zuerst** — der Nutzer baut das Grundgerüst selbst. Die dortigen offenen Punkte
   gehören in **diesen** Bauprozess: Watch-Tool (#2), CSP-Wortlaut (#3), Datenort (#5),
   macOS-Zielformat (#7).
2. **Erst wenn das Gerüst steht, werden die M1-Punkte überhaupt beantwortbar.** Vorher fehlt die
   Grundlage: Ob der `config-store` eine eigene Serialisierung braucht (#31), lässt sich am
   laufenden Gerüst beurteilen — vorher ist es Spekulation.

### Entscheidungen und Experimente nicht verwechseln

Ein STOPP-Punkt kann zwei sehr verschiedene Dinge sein, und nur die erste Art lässt sich „beantworten":

- **Entscheidung** — eine Produkt- oder Design-Wahl, die der Nutzer treffen kann und muss:
  „Datenort neben der EXE oder in `userData`?", „Dateiname mit oder ohne Zeitstempel?",
  „welcher Fehlercode bei fehlendem aktivem Projekt?"
- **Experiment** — eine empirische Frage über Plattformverhalten. Die kann **niemand entscheiden**,
  sie muss **ausprobiert** werden: Reicht `requestSingleInstanceLock()` für zwei Kopien derselben
  portablen EXE auf denselben Daten (#51)? Zeigt `PORTABLE_EXECUTABLE_DIR` wirklich auf den
  Stick-Ort (#5)? Löst `document.fonts.ready` bei Canvas-Text zu früh auf (#8)? Startet der TV die
  USB-Schleife nach dem Einschalten von selbst (R-01)?

**Genau deshalb kommt das Grundgerüst zuerst:** Es ist die Vorrichtung, mit der man die Experimente
überhaupt durchführen kann. Ein Experiment vorab „zu entscheiden" heißt raten — und Raten ist das,
was die ganze Konstruktion verhindern soll.

Wer also an M2–M7 weiterschreibt: **das geht parallel**, es hängt nicht am Gerüst. Aber die offenen
Punkte in M0/M1 nicht als Bringschuld des Nutzers behandeln, und **keine** Antworten erfinden, um
Issues „fertig" aussehen zu lassen.

---

## 5. Wovon die Finger lassen

- **Kein Produktivcode.** Planungsphase, bis der Nutzer ausdrücklich sagt „wir sind nicht mehr im Plan".
- **`.docx` nie schreiben, während Word sie offen hält.** Am 03.07. hat das die Datei beschädigt;
  nur ein Systemneustart löste den Windows-Lock. Ablauf: generieren → Staging → validieren →
  Sperre prüfen (`~$`-Datei? Datei mit `r+b` öffnen?) → nur bei freier Datei atomar platzieren.
  Sonst **stoppen und fragen**. Keine Retry-Kopier-Schleifen.
- **`braucht-entscheidung` nicht automatisch vergeben.** Regel B verlangt von jedem Issue einen
  STOPP-Block, damit träfe „hat offene Punkte" auf fast alle zu (bei M1: 37 von 40). Ein STOPP-Block
  enthält **Verbote** („hier keine Pfadauflösung einbauen") **und echte offene Fragen**
  („Datenort neben der EXE oder in `userData`?"). Nur letztere rechtfertigen das Label. Ist
  Beurteilung, nicht automatisierbar — Kriterium in `issue-generation-prompt.md` Abschnitt 10.
- **Modul, Titel-Präfix und Dateipfad müssen zusammenpassen.** Bei M1-39 lag die Datei auf der
  `src/main/`-Wurzel, während das Modul `project-store` hieß — nachträglich korrigiert.

## 6. Widersprüche melden, nicht raten

Das Schreiben der Issues hat **zwei echte Planungsfehler** gefunden, die beim Lesen der Dokumente
niemandem aufgefallen waren. Beide hätten Datenverlust verursacht:

- **Ausgabeordner war app-weit** statt `projects/<id>/output/`. Ein Render in Projekt B hätte die
  noch nicht exportierte Datei von Projekt A überschrieben. → behoben, wurde zu **FA-22**.
- **`pendingDeletions` stand an zwei Orten** (Q2 pro Projekt vs. D3 app-weit). Der Reconcile hätte
  im falschen Speicher gesucht und verwaiste Mediendateien nie aufgeräumt. → auf Q2 vereinheitlicht.

**Wenn beim Schreiben etwas nicht zusammenpasst: melden und den Nutzer entscheiden lassen.** Die
Dokumente sind für die Issue-Erstellung **nur lesend** — Änderungen daran sind ein eigener Schritt
mit eigener Freigabe, weil beide `.docx` mitgezogen werden müssen.

## 7. Werkzeuge

| Was | Wie |
|---|---|
| Word erzeugen | `node tools/generate-docx.js <in.md> <out.docx> [--dfd tools/assets/dfd.png]` |
| DFD neu rendern | SVG im TK ändern → `node tools/render-dfd.js <svg> tools/assets/dfd.png` → Word neu |
| Issues anlegen | `python tools/create-issues.py <verzeichnis> "<Milestone>" [--go]` |
| Querverweise nachziehen | `python tools/verweise-nachziehen.py <verzeichnis> [--go]` (nach dem Anlegen) |

**`create-issues.py` wählt die Label über ein PROFIL je Meilenstein** (Präfix der Dateinamen:
`M2-07.md` → Profil `M2`). Ein unbekannter Präfix **bricht ab** statt zu raten — für M3 also erst ein
Profil anlegen. Der Trockenlauf prüft zusätzlich, ob alle Label und der Milestone auf GitHub
existieren; `gh issue create` legt beides **nicht** an und bräche sonst mitten in der Reihe ab.

`NODE_PATH="C:/Users/acer/programming/node_modules"` setzen — die Abhängigkeiten liegen im
übergeordneten Ordner, nicht im Repo.

**Nach jedem Word-Lauf prüfen:** ZIP intakt, XML wohlgeformt, Stichprobe der IDs vorhanden,
**0 sichtbare Backticks**, und ein **Absatz-Diff** gegen die vorige Fassung. Der Generator hat
zweimal still Inhalt verloren bzw. verfälscht; beide Fehler sind behoben, aber die Kontrolle bleibt.
Nicht auf Zeichenzahlen schauen — die schwanken durch XML-Entities.

## 8. Was der Nutzer erwartet

- **Ein Thema pro Schritt**, am Ende kurz nach Bestätigung fragen. Keine Sprünge nach vorn.
- **Keine Ambiguität.** Klare Annahmen treffen, sie **offen benennen**, Unklarheiten aktiv
  beseitigen. Lieber eine Vorgabe zu viel als eine zu wenig.
- **Der Grund für die Strenge:** Die Agents füllen kleine Funktionen (~30 Zeilen) und treffen darin
  Low-Level-Entscheidungen — Datenformate, ffmpeg-Parameter, Rundungen, Grenzfälle. Falsch gewählt,
  ruinieren sie das ganze Projekt, und der Nutzer kann das nicht zuverlässig gegenprüfen.
