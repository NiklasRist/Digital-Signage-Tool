# Übergabe: Stand der Task-Überführung

> **Für eine neue Sitzung.** Diese Datei sagt, **wo wir stehen** und **wie es weitergeht**.
> Das **Wie** der Issue-Erstellung steht vollständig in `issue-generation-prompt.md` — dort
> beginnen, diese Datei ist nur der Stand darüber.
>
> **Stand:** 05.08.2026 · Anforderungsdokument **v1.2** · Technisches Konzept **v3.1**

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
4. Dann **Abschnitt 4 dieser Datei**: **M0 bis M7 sind vollständig angelegt** – die
   Issue-Überführung ist damit abgeschlossen (Abschnitt 4d hält fest, was der M5-Durchgang
   gelehrt hat und welche drei Entscheidungen E1–E3 auch für M6/M7 gelten; **Abschnitt 4e**
   hält den M6-Durchgang fest – die neun Entscheidungen aus TK v2.8, die drei Nachträge aus
   v2.9 und die vier schwersten Befunde; **Abschnitt 4f** den M7-Durchgang – die sieben
   schwersten Befunde, die neue Fehlerklasse „überholte Tatsachenbehauptung" und die
   Werkzeug-Härtung gegen die 65 536-Zeichen-Grenze).

**Kein Produktivcode.** Das Projekt ist in der Planungsphase — Code erst, wenn der Nutzer
ausdrücklich sagt „wir sind nicht mehr im Plan". Aufgabe ist, Issues zu schreiben, nicht sie umzusetzen.

**Lies Abschnitt 4b, bevor du den Nutzer nach Entscheidungen fragst.** Es gibt 21 Issues mit
`braucht-entscheidung`, aber die sind **keine** Bringschuld, die vorher abzuarbeiten wäre.
(Die 21 sind die aus **M0 und M1**, `#1`–`#52`. Über **alle** Meilensteine sind es am 04.08.2026
**68**: 21 in `#1`–`#52`, 9 in M2, 7 in den M1-Nachzüglern + M3, 11 in M4, 15 in M5, **5 in M6**;
mit M7 kommen **38** dazu → **106** über alle Meilensteine (Stand 05.08.2026).
Der Satz unten gilt für alle gleichermaßen. **Von den fünf M6-Punkten sind drei Experimente**,
keine Entscheidungen – s. Abschnitt 4b, „Entscheidungen und Experimente nicht verwechseln".)

---

## 1. Wo wir stehen

**Planung fertig und geprüft.** Beide Dokumente sind vollständig, mehrfach geprüft und mit den
`.docx` synchron. Repo: `NiklasRist/Digital-Signage-Tool` (privat).

| Meilenstein | Stand |
|---|---|
| **M0 Grundgerüst** | ✅ **Issues #1–#12** angelegt, geprüft, korrigiert |
| **M1 Fundament** | ✅ **Issues #13–#52** angelegt, geprüft, korrigiert (`M1-XX → #(XX+12)`) |
| **M2 Torwächter** | ✅ **Issues #53–#71** angelegt, geprüft, korrigiert (`M2-XX → #(XX+52)`) |
| **M1-Nachzügler** | ✅ **Issues #72–#77** angelegt, geprüft, korrigiert (`M1-41…46 → #72…#77`) |
| **M3 Medien** | ✅ **Issues #78–#94** angelegt, geprüft, korrigiert (`M3-XX → #(XX+77)`) |
| **M4 Pixel** | ✅ **Issues #95–#119** angelegt, geprüft, korrigiert (`M4-XX → #(XX+94)`) |
| **M5 Inhalte** | ✅ **Issues #120–#155** angelegt, geprüft, korrigiert (`M5-XX → #(XX+119)`) |
| **M6 Render & Export** | ✅ **Issues #156–#192** angelegt, geprüft, korrigiert (`M6-XX → #(XX+155)`) |
| **M7 Oberfläche & Komfort** | ✅ **Issues #194–#262** angelegt, geprüft, korrigiert (`M7-XX → #(XX+193)` **nur bis M7-59**; danach Mapping aus `docs/agents/m7/map.json`) |

**Damit sind alle acht Meilensteine M0–M7 angelegt; die Issue-Überführung ist abgeschlossen.**
**`#193` gehört NICHT zu M7**, sondern als Nachtrag zu **M0**
(`[grundgeruest] ESLint-Setup mit Verbot der Nicht-Null-Behauptung`) – es liegt nur numerisch
zwischen M6 und M7. M7 beginnt bei `#194`.

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

✅ **ERLEDIGT (03.08.), der folgende Absatz ist nur noch Nachvollzug:** `listeAusgaben` wurde als
M1-Nachzügler **M1-44 = `#75`** angelegt (Milestone M1). Die Frage unten ist damit beantwortet –
**nicht** erneut zur Entscheidung stellen.

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

## 4c. M3 – Medien (`media-service`, P1) und die sechs M1-Nachzügler: ERLEDIGT

**Stand 03.08.2026: geschrieben, von vier Prüfern geprüft (~45 Befunde, 5 kritische), korrigiert
und angelegt.** Nachzügler `M1-41…46 → #72…#77` (Meilenstein M1), Medien `M3-01…17 → #78…#94`
(Meilenstein M3). Volltexte als eine Datei je Issue in `docs/agents/m1-nachzuegler/` bzw.
`docs/agents/m3/`, Mapping je Verzeichnis in `map.json`.

**Der nächste Meilenstein war M5 (Inhalte)** – inzwischen erledigt, s. Abschnitt 4d. Ablauf wie gehabt:
Zuschnitt zeigen, Briefing schreiben, parallel schreiben lassen, vier Prüfer, korrigieren, Trockenlauf,
Freigabe, anlegen, Verweise.

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

## 4d. M5 – Inhalte (`composer` P3, `action-editor` P2, `vorlagen-editor`): ERLEDIGT, Issues #120–#155

**Stand 04.08.2026:** 36 Issues geschrieben, geprüft, korrigiert und angelegt, Milestone
„M5 – Inhalte", `M5-XX → #(XX+119)`. Volltexte als **eine Datei je Issue** in `docs/agents/m5/`,
Mapping maschinenlesbar in `docs/agents/m5/map.json`. `braucht-entscheidung` tragen **15 der 36**:
#120 · #121 · #125 · #126 · #134 · #135 · #136 · #138 · #139 · #143 · #149 · #151 · #152 · #154 · #155.

**Aufteilung nach Modul:** `project-store` M5-01 + M5-33 · `composer` M5-02…M5-15 + M5-35 ·
`action-editor` M5-16…M5-23 · `vorlagen-editor` M5-24…M5-31 + M5-36 · `ipc-client` M5-32 ·
`ipc-gateway` M5-34. **Drei neue Labels:** `modul:composer`, `modul:action-editor`,
`modul:vorlagen-editor`. 467 Querverweise auf `#`-Nummern aufgelöst.

### Der Prüflauf hat fünf zusätzliche Issues erzwungen (Zuschnitt war 31, angelegt sind 36)

Das ist der lehrreiche Teil dieses Durchgangs: **Keiner** der fünf Befunde steckte in einem Issue –
alle fünf saßen an einer **Naht**, an der jedes einzelne Issue für sich richtig war.

1. **Der Renderer konnte keine Ereignisse empfangen.** `ipc-client` (#24) kannte genau **eine**
   Funktion: `rufeAuf` (Request/Response). Alles, was der Main **von sich aus** meldet, kam nirgends
   an: `queue:geaendert` war unbeobachtbar, die Warteschlangen-Leiste hätte pollen müssen, und der
   „nicht gespeichert"-Hinweis (Fehlerklasse 2, TK 9.7.3) war schlicht nicht baubar – der
   schädlichste stille Fehler, den dieses Werkzeug haben kann. **Vier Autoren meldeten es
   unabhängig voneinander.** → **M5-32 (#151)**, `abonniere(kanal, hoerer) → () => void`.
2. **`Listenelement.ref` konnte niemand umsetzen.** TK 9.7.5 nennt drei Fix-Optionen des
   Reparatur-Modus („neu verknüpft/importiert, ersetzt oder entfernt"), die Operationsliste 9.5.2
   hatte für zwei davon **keine** Operation. Ausführbar war nur „entfernen" → **FA-19 und
   Akzeptanzkriterium 7 unerfüllbar**. Verschärfend: Ein Neuimport vergibt eine **neue** UUID
   (9.4.4) – das Element hätte danach **weiter** auf das fehlende Asset gezeigt.
   → **M5-33 (#152)** + **TK v2.7**.
3. **Zwei Kanäle ohne Anmeldung.** #76 meldet **genau 14** `project`-Kanäle an und verbietet einen
   fünfzehnten. `setzeEinblendung` und `setzeElementReferenz` wären damit fertige Main-Funktionen
   **ohne Aufrufer** gewesen – **dieselbe Lückenklasse wie in M1 (#72–#77) und M2 (#71)**, jetzt
   zum dritten Mal. → **M5-34 (#153)**.
4. **Der `composer` hätte Platzhalter in die MP4 gebrannt.** M5-09 und M5-15 setzten Schriften,
   Logo und Motive als **bereit** voraus und verwiesen dafür auf M5-02, das nichts davon tat. Wer
   den composer öffnet, **ohne** vorher im Aktions-Editor gewesen zu sein, hätte für jedes Bild
   einen Platzhalter gezeichnet – **TK 9.10.7 verbietet genau das im finalen Render.**
   → **M5-35 (#154)**.
5. **Der Vorlagen-Editor war nicht betretbar.** Für `erstelleVorlage`, `listeArbeitskopien` und
   `löscheVorlage` gab es in ganz M5 **keinen Aufrufer** – und **FA-13 ist ein MUSS**.
   → **M5-36 (#155)**.

### Drei übergreifende Entscheidungen – gelten auch für M6 und M7

- **E1 – keine `project:geaendert`/`vorlagen:geaendert`-Ereignisse.** `composer`, `action-editor`
  und `vorlagen-editor` laufen im **selben** Renderer-Prozess; ein IPC-Ereignis wäre eine Reise
  durch den Main und zurück, nur um zwei Modulen mitzuteilen, was im selben Speicher längst
  passiert ist. Stattdessen: **Jede Operation liefert den neuen Stand zurück**, der Aufrufer gibt
  ihn an die gemeinsame Sicht weiter (Projekt: M5-02 / Vorlagen: M5-36). Module **außerhalb** des
  besitzenden Ordners bekommen die Aktualisierungsfunktion als **Parameter**, nicht per Import.
  **Wer sie durchreicht, ist `app-shell` – das ist M7**, nicht M5.
- **E2 – Ereignisse vom Main laufen über `abonniere` (M5-32).** **Offen bleibt:**
  `project:autoSpeichernStatus` hat im Main **keinen Sender** – Empfänger da, Sender nicht. Das
  gehört in M6/M7 geschlossen, sonst bleibt Fehlerklasse 2 trotz M5-32 stumm.
- **E3 – Renderer-Signaturen nutzen `Ergebnis<T, string>`.** Die fachlichen Fehlercode-Unionen
  liegen in `src/main/**` und dürfen vom Renderer nicht importiert werden; **die Enge sitzt dort,
  wo der Code entsteht** (so schon im geteilten Vertrag gelöst, vgl. `Auftrag.fehler.code`). Ohne
  diese Regel hätte **jedes** Renderer-Issue die Union ein zweites Mal definiert. Verglichen wird
  gegen die Code-Literale als Zeichenketten.

### Was der Durchgang methodisch bestätigt hat

- **Zum dritten Mal in Folge: alle kritischen Befunde sitzen an den NÄHTEN zwischen Issues, keiner
  innerhalb eines Issues.** Der Querschnitts-Prüfer ist damit kein Extra mehr, sondern der Prüfer
  mit der höchsten Trefferquote.
- **Regel A und Regel D halten.** Rund 60 fremde Signaturen geprüft, **keine einzige** falsch
  rekonstruiert – die M4-Fehlerklasse ist geschlossen; über 350 Zitate verifiziert.
- **Neue Falle beim Werkzeugbau (gehört zur Escape-Sequenz-Notiz):** Beim Schreiben von
  Python-Skripten über den Datei-Schreibweg wurde das schließende deutsche Anführungszeichen
  (U+201D) still zu einem ASCII-`"` normalisiert und beendete damit das String-Literal. Die
  Fehlermeldung („unterminated string literal") zeigte auf eine Stelle, die im Editor **korrekt
  aussieht**. Gegenmittel: Sonderzeichen über `chr(0x201D)` aufbauen und die tatsächlichen
  Codepoints prüfen – nicht das Schriftbild. **Zusatz:** Das TK verwendet durchgehend `„…"` mit
  ASCII-Schlusszeichen; U+201D ist dort ein Fremdkörper und muss vereinheitlicht werden.

### TK v2.7 (04.08.2026, beim M5-Prüflauf gefunden, vom Nutzer entschieden)

Operationsliste **9.5.2** um zwei fehlende `project-store`-Operationen ergänzt:
**`setzeEinblendung`** (ohne sie wäre FA-20/Split-Screen gar nicht bedienbar gewesen, obwohl 9.7.2
sie ausdrücklich verlangt) und **`setzeElementReferenz`** (Befund 2). `.md` und `.docx` sind
synchron (ZIP/XML ok, 0 Backticks, Absatz-Diff = nur diese Änderungen). **Anforderungsdokument
unverändert v1.2.**

**Auf GitHub nachgezogen:** #76 (DoD „genau 14 Kanäle" → „die vierzehn dieses Issues", Verbot auf
**diese** Datei eingegrenzt) · #24 (DoD: `window.api` nur **außerhalb** von
`src/renderer/ipc-client/` verboten; Ereignisse laufen über `abonniere`) · #3 (siebter
Bootstrap-Eintrag `verdrahteProjectStoreNachtragIPC()`, Zählung an 6 Stellen angepasst) ·
#120/#152/#153 (die Vermerke „TK ist nachzuziehen" sind mit v2.7 erledigt). Danach lokale
Quelldateien gegen GitHub geprüft: **36/36 deckungsgleich** (Regel aus Abschnitt 4c, Punkt 2).

## 4e. M6 – Render & Export (`ffmpeg-adapter`, `render-service` P4, `export-service`): ERLEDIGT, Issues #156–#192

**Stand 04.08.2026:** 37 Issues geschrieben, geprüft, korrigiert und angelegt, Milestone
„M6 – Render & Export", `M6-XX → #(XX+155)`. Volltexte als **eine Datei je Issue** in
`docs/agents/m6/`, Mapping maschinenlesbar in `docs/agents/m6/map.json`. **921 Querverweise** auf
`#`-Nummern aufgelöst.

**Aufteilung nach Modul:** `contracts` M6-01/M6-02 · `ffmpeg-adapter` M6-03…M6-15 ·
`render-service` M6-16…M6-26 + M6-34 · `export-service` M6-27…M6-33 + M6-35 ·
`ipc-gateway` M6-36 · `project-store` M6-37.

**Vier neue Labels:** `modul:ffmpeg-adapter`, `modul:render-service`, `modul:export-service` und
**`risiko:tv-ausgabe`** – das letzte ist neu und eigen für M6: *Ein Fehler fällt hier nicht im Test
auf, sondern erst am Fernseher im Studio.* Es trägt 15 der 37 Issues (#161–#170, #174, #176, #177,
#180, #181), also praktisch die gesamte Kette, die Pixel und Container-Parameter festlegt.

**`braucht-entscheidung` tragen nur 5 der 37:** #163 · #168 · #184 · #191 · #192 – auffällig wenige
nach 15 bei M5. Und **drei davon sind Experimente, keine Entscheidungen** (Autorotation des
mitgelieferten ffmpeg-Binaries, ob es `qtrle` kennt, FAT32-Erkennung auf Windows und macOS). Sie
lassen sich **nicht beantworten, nur ausprobieren** – s. Abschnitt 4b. Nicht als Bringschuld des
Nutzers behandeln.

### Der Prüflauf hat ein zusätzliches Issue erzwungen (Zuschnitt war 36, angelegt sind 37)

**M6-37 (#192) `[project-store]` Das aktive Projekt main-intern herausgeben.** `sofortFlush` (#47)
verlangt ein `Project` als Eingabe, und **kein einziges Issue in sechs Meilensteinen gibt es
main-intern heraus**. Damit war der seit TK v2.8 verlangte Sofort-Flush weder in #68 noch in M6-33
baubar. **Dieselbe Lückenklasse zum vierten Mal** – nach M1 (#72–#77), M2 (#71) und M5 (#153):
eine fertige Funktion ohne Zugang, jedes Issue für sich richtig, die Naht dazwischen leer.

### Die vier schwersten Befunde – die lehrreichsten des ganzen Projekts

1. **`-ss` stand an der falschen Stelle (M6-12, `#167`).** Im **verbindlichen** Argument-Array lag es
   zwischen zwei `-i` und wurde damit zur Eingangs-Option des **falschen** Eingangs. Der Ausschnitt
   hätte immer bei Frame 0 begonnen: **richtige Länge, falscher Inhalt** – und die eigene
   DoD-Prüfung wäre **grün** durchgelaufen, weil sie die Dauer misst, nicht den Bildinhalt. Das
   Issue **beschreibt diese Falle in seiner eigenen Einleitung** und tappt dann hinein. Merksatz:
   Bei ffmpeg entscheidet die **Position** eines Arguments über seine Bedeutung; ein Argument-Array
   ist deshalb nie „nur eine Liste".
2. **`-progress` wurde nirgends gesetzt.** Die ganze Fortschrittskette
   M6-05 (`#160`) → M6-22 (`#177`) → M6-23 (`#178`) → M6-36 (`#191`) wäre gebaut und **tot**
   gewesen; `-loglevel error` unterdrückt zusätzlich die voreingestellte Statuszeile, an der ein
   Agent den Mangel hätte bemerken können. **Zwei Prüfer meldeten es unabhängig voneinander.**
   Behoben im **festen Vorspann von M6-03 (`#158`)**, an genau **einer** Stelle – nicht in jedem
   der Aufrufer.
3. **Zwei Funktionen gleichen Namens im selben Ordner.** `segmentDateiname` wurde in M6-20 (`#175`)
   und M6-22 (`#177`) definiert – **gleiche Signatur, verschiedenes Ergebnis**. Ein falscher Import
   **kompiliert fehlerfrei** und setzt ffmpeg auf Dateien, die es nicht gibt. Der Typprüfer schützt
   hier nicht; nur ein Querschnittsblick über die Dateinamen eines Moduls findet das.
4. **Die Toleranz der Dauerprüfung war rechnerisch falsch (M6-25, `#180`).**
   `max(0.5, 1 % der Dauer)` hätte bei einem 30-Minuten-Reel ±18 s durchgewinkt – also ein
   **vollständig fehlendes Segment**, genau den Fall, gegen den die Prüfung überhaupt existiert.
   Jetzt **fest 0,5 s**. Merksatz: Eine relative Toleranz wächst mit dem Fehler, den sie fangen soll.

### Die neun Entscheidungen des M6-Zuschnitts → TK v2.8

Alle neun folgen Prinzipien, die im Projekt bereits entschieden sind; jede ist umkehrbar.

- **E-3 (die wichtigste) – Staging der fertigen Datei im Projekt-Ausgabeordner, nicht in `<Temp>`.**
  ffmpeg schreibt nach `projects/<id>/output/<name>.mp4.part` und benennt **im selben Ordner** um.
  Umbenennen ist nur auf **derselben Partition** unteilbar; die App ist portabel, ihr Datenort kann
  auf dem Stick liegen, `<Temp>` liegt auf C:. Sonst wäre der abschließende `rename` ein
  **`EXDEV`**-Fehler, der naheliegende Ausweg „kopieren und löschen" hebt **Akzeptanzkriterium 9**
  auf – ein Absturz beim Kopieren zerstört die letzte funktionierende Ausgabedatei. **Beim
  Entwickeln fällt das nie auf**, weil dort Temp und Daten auf derselben Platte liegen.
  Mitgezogen: Abbruch und Fehlschlag räumen die `.part`-Datei weg, `listeAusgaben` darf sie nicht listen.
- **E-5 – `art` und `höhe` der Band-Vorlage wandern in den `RenderRequest`.** 9.3.5 friert den
  Render-Eingang **beim Einreihen** ein; ein Nachschlagen zur Laufzeit wäre das Gegenteil. Ändert
  jemand die Band-Vorlage, während der Auftrag wartet, passen die **bereits gezeichneten** Band-PNGs
  nicht mehr zur nachgeschlagenen Höhe → verzerrtes oder falsch platziertes Band. Nebeneffekt:
  `render-service` braucht keine Abhängigkeit zum `vorlagen-store`.
- **E-1 – `historieEintrag` ersatzlos gestrichen.** Den Q3-Eintrag baut die Auftragsverwaltung
  längst selbst. Zwei Quellen für dieselbe Information laufen auseinander, und **Q3 ist dauerhaft** –
  ein doppelt geführtes Datum darin bleibt für immer falsch. Dieselbe Begründung entfernte schon das
  `position`-Feld. **Der Punkt steht seit #19 offen und hat über fünf Meilensteine keinen Abnehmer
  gefunden – das ist selbst der Befund: Ein Feld, das niemand braucht, ist keins.**
- **E-4 – der Sofort-Flush läuft als *erster Schritt im Handler*.** Beim Nachziehen kam heraus, dass
  die vom TK zuvor genannte Stelle – der **Torwächter** – gar kein `await` enthalten darf: Sein
  Auswahl- und Statuswechsel-Abschnitt ist bewusst synchron, ein `await` bräche die serielle
  Invariante **lautlos**. **Niemand hätte ihn gebaut:** #59 darf nicht, #68 verbot ihn sich selbst.
  Beim Einreihen zu flushen wäre ebenfalls falsch – zwischen Einreihen und Start können Minuten
  liegen, in denen der Nutzer weiterarbeitet.
- **E-6 – „verifiziert" heißt: einmal `ffprobe` auf die fertige Datei**, geprüft gegen das
  Ausgabe-Profil (Dauer, 1920×1080, 30 fps, `yuv420p`, Tonspur vorhanden). Das ist die **einzige**
  Stelle, an der ein stiller Encoder-Fehler noch auffällt, bevor er die letzte funktionierende Datei
  ersetzt – und die Datei geht danach **ungeprüft auf den Fernseher**. ffprobe wird seit v2.5 ohnehin
  mitgeliefert. Ohne die Definition wäre daraus in der Praxis eine Existenzprüfung geworden.
- **E-9 – `render:fortschritt` wird als anzumeldender Kanal geführt.** Nutzlast war seit je
  vollständig definiert (9.2.7), der Empfänger existiert seit M5 (`abonniere`, #151) – **es fehlte
  allein der Sender**. Die Warteschlange behält daneben ihren groben Prozentwert (#68 unverändert).
- **E-2 – `ausgabe.gesamtdauer` wird `number | null`.** Beim `export` ist sie `null`: Er kopiert eine
  fertige Datei und kennt ihre Spieldauer nicht; sein **Zielpfad** steht im Feld `pfad`. Ein Feld, das
  leer sein darf, ist einfacher als zwei Formen – die Alternative wäre eine **erfundene Dauer im
  dauerhaften Protokoll**.
- **E-7 – der Export löst seine Quelldatei über `loeseAusgabePfad` (#49) auf**, schneidet dafür die
  Endung ab und weist Namen ohne `.mp4` zurück. **Kein eigenes `join`** – sonst baut der Agent den
  Pfad selbst zusammen und umgeht die Schranke gegen Pfad-Ausbrüche. Muss ausdrücklich im Issue stehen.
- **E-8 – die Restflächen der Split-Komposition tragen die Farb-Rolle `flaecheDunkel` (#2F2E2E)**,
  geholt über `leseMarke()` (#29), **nie** als Hexzahl in einer Filterkette. „Dunkle Markenfarbe" ist
  bei **zwölf** Farb-Rollen keine Angabe; jeder Agent hätte eine andere gewählt und Render und
  Vorschau wären auseinandergelaufen. 9.11.2 beschreibt die Rolle als „Segment- und Band-Hintergrund" –
  damit sind Band und Seitenflächen **dieselbe** Fläche.

### TK v2.9 (04.08.2026, beim M6-Prüflauf gefunden, vom Nutzer entschieden)

1. **`speicher_fehler` ist der siebte Fehlercode des `export-service`** (9.6.4). Der Flush-Fehlschlag
   im Export-Handler hatte **keinen** Code: `schreib_fehler` meint dort das **Kopieren**, die übrigen
   fünf betreffen das **Ziel** – der Flush aber den **Datenort**. Der Export hätte einen realen,
   benennbaren Fehler als `unbekannter_fehler` oder unter einem selbst erfundenen Namen gemeldet.
2. **Bandhöhen müssen *gerade* sein.** `yuv420p` tastet die Farbe in beiden Richtungen um Faktor zwei
   unter und verlangt **gerade Höhen und gerade Versätze**. Bei ungeradem `H` bricht **jede** der
   beiden Kompositionsarten: bei `split` ist die Videofläche `1080 − H` ungerade, bei `einblendung`
   liegt das Overlay auf einer ungeraden Zeile. Durchgesetzt **an der Quelle** (Editor sperrt, Store
   weist ab), der Render prüft zusätzlich.
3. **Die Split-Videobreite wird auf ein Vielfaches von 4 abgerundet.** Die gerade Bandhöhe allein
   rettet die Geometrie **nicht**: `(1080 − H) × 16/9` ist nur ganzzahlig, wenn `1080 − H` durch 18
   teilbar ist, und der zentrierte x-Versatz `(1920 − Breite) / 2` ist nur bei einer durch 4 teilbaren
   Breite gerade. **Die eingebaute Vorlage (`H = 162`) geht als einzige zufällig auf und hätte den
   Mangel verdeckt.** Aufrunden ist verboten – es bräche die Zusage „contain ohne Beschnitt".

`.md` und `.docx` sind synchron (geprüft). **Anforderungsdokument unverändert v1.2.**

### Rückwärts nachgezogen (Regel aus 4c, Punkt 1)

Die Vertragsänderung erzwang den Zitat-Abgleich über **alle** angelegten Issues. Nachgezogen wurden:
**#3** (aus sieben Anmeldungen werden **zehn**, plus `raeumeVerwaisteArbeitsbereiche()` als
Startschritt – und `verdrahteExportUndFortschrittIPC` muss **nach** dem Fenster stehen, weil es als
einzige Verdrahtung ein `BrowserWindow` braucht) · **#47** (trug noch „gerufen wird sie vom
Torwächter" – durch E-4 überholt) · #17 · #19 · #53 · #62 · #68 · #70 · #134 ·
#72/#73/#74/#87 · sowie #95/#96/#100/#102/#155 und #103/#117/#148 (Bandhöhe).

### Was der Durchgang methodisch bestätigt hat

- **Zum vierten Mal in Folge: alle kritischen Befunde sitzen an den NÄHTEN zwischen Issues, keiner
  innerhalb eines Issues.** Der Querschnitts-Prüfer bleibt der Prüfer mit der höchsten Trefferquote.
- **Regel D hielt über rund 300 geprüfte Zitate praktisch fehlerfrei, Regel C ohne Verstoß in 37
  Dateien, Regel E 37/37.** Die Regeln greifen; die verbleibende Fehlerklasse ist **ausschließlich**
  die Verzahnung.
- **Neu bei M6 und nur hier:** Die schwersten Befunde waren **rechnerisch/positionell** (Argument-
  Reihenfolge, Toleranzformel, Geradzahligkeit), nicht vertraglich. Ein Prüfer, der nur Signaturen
  abgleicht, findet sie **nicht** – bei ffmpeg-Issues muss jemand **nachrechnen**.

## 4f. M7 – Oberfläche & Komfort (`app-shell`, `queue-panel`, `preview-player`, `projekt-verwaltung`): ERLEDIGT, Issues #194–#262

**Stand 05.08.2026:** **69 Issues** geschrieben, geprüft, korrigiert und angelegt, Milestone
„M7 – Oberfläche & Komfort". Volltexte als **eine Datei je Issue** in `docs/agents/m7/`, Mapping
maschinenlesbar in `docs/agents/m7/map.json`. **2756 Querverweise** auf `#`-Nummern aufgelöst –
mit Abstand der größte Meilenstein des Projekts.

**Fünf neue Labels:** `modul:app-shell`, `modul:queue-panel`, `modul:preview-player`,
`modul:projekt-verwaltung`, `modul:renderer-gemeinsam`. **`braucht-entscheidung` tragen 38 der
69** – der höchste Anteil aller Meilensteine, was zur Sache passt: Die Oberfläche ist die Ebene,
auf der das Technische Konzept am wenigsten vorgibt.

### Die Nummern-Faustregel gilt NUR bis M7-59 – nicht rechnen, abschreiben

`M7-XX → #(XX+193)` stimmt für **M7-01…M7-59** (`#194`–`#252`). Danach **nicht** mehr:
**M7-60 → `#259`**, **M7-61…M7-64 + M7-66/M7-67 → `#253`–`#258`**, **M7-65 → `#260`**,
**M7-68 → `#261`**, **M7-69 → `#262`**. Grund s. „Werkzeug-Härtung" unten.
**Immer aus `docs/agents/m7/map.json` abschreiben.** (Am Rand: **`#193` gehört zu M0**, nicht zu
M7 – ein später nachgetragenes Grundgerüst-Issue.)

### Die sieben schwersten Befunde – der lehrreiche Teil

1. **Es gab keinen Weg, ein Projekt anzulegen.** `erstelleProjekt`, `listeProjekte`,
   `dupliziereProjekt` und `löscheProjekt` sind **seit M1 gebaut** – und **kein einziges Issue
   rief sie auf**. Die Anwendung wäre **beim ersten Start unbenutzbar** gewesen: kein Projekt, kein
   Reiterinhalt, kein Weg hinein. Der schwerste Befund des Projekts, gemessen an der Folge.
2. **Es gab keinen Weg, ein Video zu importieren** – und **FA-01 ist ein MUSS**. Der Import wurde
   in den vorhandenen Issues genau **zweimal** gerufen, beide Male für das **Bild einer Aktion**.
   Das Kernmedium des Werkzeugs hatte keinen Zugang.
3. **M5 hat die gesamte Bedienlogik als reine `.ts`-Dateien gebaut** – konsequent nach Regel E und
   in jedem einzelnen Issue richtig –, aber **niemand zeichnete** die Wiedergabeliste, den
   Aktions-Editor oder den Vorlagen-Editor. **FA-05 und Akzeptanzkriterium 1 waren nicht
   erfüllbar.** Logik ohne Darstellung ist kein bedienbares Programm.
4. **Die Bandbearbeitung (FA-20) hatte keine Oberfläche** – und das ist die **Hauptbetriebsart**.
5. **Undo war gebaut und wirkungslos.** TK 9.13.2 verlangt einen **Schnappschuss vor jeder
   Instant-Operation**; sämtliche Instant-Operationen liegen aber in Modulen, die Undo
   **ausdrücklich ausschließen**. Gelöst über eine **Hülle um die gemeinsame Projekt-Sicht**
   (M7-50, `#243`) – der Schnappschuss entsteht an **einer** Stelle, die jede Änderung passiert,
   statt in dreißig aufrufenden Modulen.
6. **Der Renderer-Bootstrap fehlte.** **Sieben** Einstiegspunkte ohne Aufrufer: der
   Auftrags-Auswerter, die Sitzungswiederherstellung, der Aufbau der gemeinsamen Sichten, die
   Reiterbelegung, der Speicherhinweis und die Warteschlangen-Leiste. → M7-65 (`#260`) und
   M7-69 (`#262`). **Sechste Wiederholung derselben Lückenklasse** („fertige Funktion ohne
   Aufrufer") – nach M1 (#72–#77), M2 (#71), M5 (#153), M6 (#192) und M7-63 (#255).
   **Nicht mit dem Main-Bootstrap #3 verwechseln:** #3 verdrahtet den **Main**.
7. **Zwei `medienUrl`-Fassungen mit entgegengesetzter Abnahme** – die eine verlangt
   **Prozent-Kodierung**, die andere prüft ausdrücklich „**ohne Kodierungsumbau**". Heute fällt das
   nicht auf, **weil die Dateinamen UUIDs sind** und darin kein kodierpflichtiges Zeichen vorkommt.
   Das ist ein **Zufall der Belegung, kein Vertrag** – zusammengeführt in M7-67 (`#258`), die
   `media`-Adresse wird an **genau einer** Stelle gebildet.

### NEUE FEHLERKLASSE – überholte Tatsachenbehauptungen (M7 eigen, gehört in die Regeln)

M7 ist so groß, dass **früh geschriebene Dateien nicht wissen, was späte liefern**. Weil Regel B
von jedem Issue verlangt, seine Lücken zu melden, standen am Ende rund **fünfzehn
Melde-Aufträge** in den Texten, die **ins Leere zielten**: „Braucht einen Baustein, den kein Issue
liefert" – obwohl ein späteres Issue ihn längst lieferte.

**Warum das gefährlich ist:** Ein Agent, der so einen Satz liest, **baut nicht**. Er meldet und
wartet. Eine überholte Tatsachenbehauptung ist damit **so blockierend wie eine echte Lücke** –
nur unsichtbar, weil formal nichts fehlt.

> **NEUE REGEL:** **Wer ein Issue anlegt, das die Lücke eines früheren schließt, streicht dort die
> Melde-Aufforderung.** Der Verweis auf das neue Issue tritt an ihre Stelle. Das ist die
> Vorwärts-Entsprechung zur Rückwärts-Regel aus 4c Punkt 1 (Vertragsänderung → Zitat-Abgleich über
> alle angelegten Issues).

### Werkzeug-Härtung: die 65 536-Zeichen-Grenze von GitHub

`create-issues.py` **überspringt jetzt Einträge, die schon in `map.json` stehen.**

**Anlass:** GitHub lehnt Bodies über **65 536 Zeichen** ab. **M7-60** und **M7-65** lagen bei rund
**77 000** und scheiterten, während **65** andere im selben Lauf durchliefen. **Ohne die Härtung
hätte ein zweiter Lauf 65 Duplikate angelegt** – und Duplikate auf GitHub sind teurer zu beseitigen
als jeder Schreibfehler im Text.

**Beide Issues wurden GETEILT, nicht gekürzt.** Ein Kürzungsversuch hat nachgerechnet: **M7-65
läge selbst mit vollständig leerem Signaturblock noch bei 61 561 Zeichen.** Kürzen hätte also
Inhalt kosten müssen, den die Regeln A–E ausdrücklich verlangen. Geteilt wurde entlang der Sache
(M7-60 → M7-60 + M7-68, M7-65 → M7-65 + M7-69), **nach** dem Anlegen von M7-61…M7-67 – daher die
Sprünge in der Nummernvergabe.

### Was der Durchgang methodisch bestätigt hat

- **Zum fünften Mal in Folge sitzen die kritischen Befunde an den NÄHTEN** – und in M7 an der
  größten Naht überhaupt: der zwischen **Logik** (M1–M6) und **Bedienung**. Die Befunde 1 bis 4
  sind alle von derselben Art: Etwas ist vollständig gebaut und für den Nutzer **nicht erreichbar**.
- **Die Lückenklasse „fertige Funktion ohne Aufrufer" ist jetzt in JEDEM Meilenstein seit M1
  aufgetreten** und wurde **jedes Mal erst im Prüflauf** gefunden. Die billigere Vorsorge steht seit
  M7-63 (`#255`) im Vermerk: ein Zuschnitt-Schritt „für jede Operation – **wer ruft sie?**".

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
