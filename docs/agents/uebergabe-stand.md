# Übergabe: Stand der Task-Überführung

> **Für eine neue Sitzung.** Diese Datei sagt, **wo wir stehen** und **wie es weitergeht**.
> Das **Wie** der Issue-Erstellung steht vollständig in `issue-generation-prompt.md` — dort
> beginnen, diese Datei ist nur der Stand darüber.
>
> **Stand:** 03.08.2026 · Anforderungsdokument **v1.2** · Technisches Konzept **v2.3**

---

## 0. Womit du anfängst

1. **Diese Datei ganz lesen.** Sie ist kurz.
2. **`docs/agents/issue-generation-prompt.md`** — das ist der eigentliche Auftrag: Modulschnitt,
   alle Invarianten zum Wörtlich-Zitieren, die Pflicht-Vorlage samt ausgefülltem Beispiel und die
   fünf Regeln A–E. **Vollständig lesen, nicht querlesen** — die Regeln C, D und E sind aus
   konkreten Fehlern entstanden, die zweimal aufgetreten sind.
3. **`docs/agents/m1-pruefbefund.md`** — die Fehler des letzten Durchgangs im Detail. Wer sie kennt,
   macht sie nicht nochmal.
4. Dann **Abschnitt 4 dieser Datei**: M2 ist fertig zugeschnitten, 16 Issues. Losschreiben.

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
| **M2 Torwächter** | ⬜ zugeschnitten (Abschnitt 4), **noch nicht geschrieben** |
| **M3–M7** | ⬜ offen |

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

## 4. M2 – Torwächter (`auftrags-manager`, P6): fertiger Zuschnitt

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
| M2-14 | [auftrags-manager] `pendingDeletions` beim Projektstart nachholen | 9.3, 9.4.7 |
| M2-15 | [auftrags-manager] Neustart: Q1 leer, Q2 laden | 9.3, 9.3.5 |
| M2-16 | [auftrags-manager] Verzahnung mit `render-service` | 9.3.6 |

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
