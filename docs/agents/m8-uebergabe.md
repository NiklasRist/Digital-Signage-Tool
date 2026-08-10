# Übergabe M8 – Stand nach dem Prüflauf

> **Stand:** 10.08.2026, abends · AD **v1.3** · TK **v3.9** · Worktree `dst-planung`,
> Branch `planung/ad-v1.2-tk-v2.3-issues`
>
> **Die Arbeit wurde vom Sitzungs-Limit unterbrochen** (Reset 23:30). Vier Autoren liefen parallel,
> zwei wurden mitten in einer Datei abgeschnitten. **Beide Bruchstellen sind geprüft und repariert** –
> der Stand ist konsistent, nicht halbfertig.

---

## 0. Was gilt

**Der Prüflauf ist gelaufen und vollständig dokumentiert:** `docs/agents/m8-pruefbefund.md`.
Sieben Prüfer, rund 100 Befunde, davon etwa 20 kritisch, fünf Ursachen.

**M8 ist NICHT anlegereif.** Was fehlt, steht in Abschnitt 2.

---

## 1. Erledigt (committet)

| Was | Stand |
|---|---|
| **TK v3.9** | 9.10.4 trug den mit v3.7 zurückgenommenen Satz weiter – behoben. `.md` + `.docx` synchron |
| **Prüfbefund** | `m8-pruefbefund.md`, vollständig |
| **M8-21** | Flaschenhals behoben: `logo === null → zeichneErsatzLogo` **und** `sindMarkenSchriftenBereit` sind eingebaut |
| **M8-31** | Neunter Kanal `marken:öffneMarkenDateiDialog` eingetragen. **Achtung:** Die acht Zählstellen hat der Autor nicht mehr geschafft – **von Hand nachgezogen** (aus „acht Instant-Kanäle" wurde neun, aus „neun Einträge" zehn, aus „8 Aufrufe" neun). Die verbliebenen „acht" in Zeile 21 und 33 sind **richtig** (Store-Operationen bzw. historischer Bezug) |
| **M8-25** | IPC-Nutzlast trägt jetzt `schriftRolle: null` in Kanal-Angabe und DoD |
| **M8-41** (neu) | „[app-shell] Der fünfte Modus-Reiter [Marken]", 508 Zeilen |
| Textkorrekturen | M8-01, M8-02, M8-08, M8-09, M8-13, M8-17, M8-20, M8-24, M8-27 – teilweise |

---

## 2. Offen – in dieser Reihenfolge

### 2.1 Vier neue Issues fehlen noch

| Nr. | Inhalt | Warum es ein eigenes Issue ist |
|---|---|---|
| **M8-42** | `#119` `logo-laden.ts`: `holeLogo(markeId)`, Verzweigung nach `herkunft`, `leereLogoBestand()`, **Verhalten bei `logo === null`** | Vier Issues setzen es voraus, alle sperren sich die Datei. M8-39 ist ohne es **nicht baubar** |
| **M8-43** | Die `flaecheDunkel`-Kette: **#17 → #134 → #177 → #181** | Vier Glieder, dazwischen kompiliert nichts. **Achtung:** Der Zuschnitt nennt fälschlich #177 als `leseMarke`-Aufrufer – es ist **#181**. Kollision mit M8-37 auf `render-ausloesen.ts` muss aufgelöst werden |
| **M8-44** | `config:leseMarke` ersatzlos zurückbauen: #29, #77, Bootstrap #3 | TK 9.5.6 führt `leseMarke` nicht mehr in der Operationstabelle |
| **M8-45** | Die freie Akzentfarbe in **#139** und **#112** nachziehen | **Der schwerste.** #139 sagt „kein freier Farbwähler, nie ein Hex-Wert"; #112 **wirft** bei `'#FF4040'` – dem neuen Normalfall |
| **M8-46** | Ein Weg, `Aktion.markeId` zu setzen (#38, #136) | Pflichtfeld ohne Setzweg; das Wort kommt in **keinem** angelegten Issue vor |

Die vollständigen Aufträge für M8-42…M8-46 stehen im Prüfbefund, Abschnitt „Drei Funde, die über M8
hinausgehen" und „Behebung".

### 2.2 `flushBestand()` in M8-36 eintragen

M8-03 baut ihn, M8-03 und M8-04 verweisen den Aufruf an „#3 beim Beenden". M8-36 ist das einzige
Issue an `src/main/index.ts` und schließt `before-quit` aus. **Datenverlust ohne Fehlermeldung** –
und der Kanal, der es sichtbar machen würde, hat keinen Abonnenten.

### 2.3 Restliche Textkorrekturen

Aus dem Prüfbefund, noch offen: **M8-03, M8-07, M8-10, M8-23, M8-28, M8-30, M8-32, M8-39**.
Besonders:

- **M8-10** – *braucht eine Entscheidung des Auftraggebers, nicht eine Korrektur:* Eine neu angelegte
  eigenständige Marke bekommt heute eine tiefe Kopie der eingebauten **einschließlich `logo`**. Damit
  trägt jede Partner-Marke ab Sekunde eins das Fitnessworld24-Logo, und der Ersatz-Logo-Pfad wird
  **strukturell nie** ausgelöst. Beide Möglichkeiten (Logo mitkopieren / `logo: null`) gehören
  vorgelegt.
- **M8-32** – führt „Reiter oder Unterbereich" als offene Frage (seit v3.6 entschieden) und fordert,
  M8-38 zu melden statt anzulegen.
- **M8-28** – behauptet, `Marke.farben` seien immer 6-stellig; TK 9.11.2 erlaubt 8-stellig, M8-19
  **wirft** dann.
- **M8-23/24/25/27** – Verweise auf „BRIEFING Abschnitt M8-XX"; solche Abschnitte gibt es nicht.

### 2.4 Die Edit-Zuweisungen

**Von sechzehn Edits haben drei einen Ausführenden.** Nach M8-42…M8-46 bleiben die kleineren; jede
Zeile der Tabelle in `m8-zuschnitt.md` braucht einen Empfänger. Ohne ihn meldet ein Agent und baut
nicht.

### 2.5 Zuschnitt nachziehen

`m8-zuschnitt.md` kennt M8-41 noch nicht; die Zahl (39) und die Edit-Tabelle sind nachzuziehen.

### 2.6 Dann: zweiter Prüflauf

Kürzer als der erste – nur über das Geänderte und die Nähte. **Ein Querschnitts-Prüfer ist Pflicht**;
im ersten Lauf hat genau er die teuersten Befunde geliefert.

---

## 3. Zwei Dinge, die beim Weiterarbeiten Zeit sparen

**Der gebaute Code ist die Autorität über Plattformverhalten.**
`C:\Users\acer\programming\Digital-Signage-Tool\src\` enthält gemessene Befunde, die in keiner
Planungsdatei stehen – die fertige CSP, die tatsächlich gesetzten Schema-Privilegien und der
Messwert, dass `fetch('media://…')` den Handler nicht einmal erreicht. Zweimal an einem Tag hätte ich
ohne diesen Blick geraten.

**Die Werkzeugfalle mit den Anführungszeichen ist real.**
Ein deutsches Schlusszeichen im Suchmuster beendet ein Python-String-Literal mitten im Satz. Heute
zweimal aufgetreten. Zeilenbasiert arbeiten oder das Edit-Werkzeug nehmen.

---

## 4. Die Regel, die aus diesem Tag entstanden ist

TK v3.9 hat sie in den Schlussblock geschrieben, weil derselbe Fehler **dreimal an einem Tag**
auftrat (v3.6 wirft ihn v3.4 vor, v3.7 stellt ihn an sich selbst fest, v3.9 findet ihn erneut):

> Eine Änderung gilt erst als nachgezogen, wenn eine **Volltextsuche über die geänderte Aussage**
> gelaufen ist.

Sie gilt auch für Issues, nicht nur fürs TK. Die drei ERLEDIGT-Vermerke zum Dialog-Kanal sind genau
daran gescheitert: Sie wurden geschrieben, ohne M8-31 nachzuziehen – und haben die Meldung
abgeschaltet, während die Lücke bestehen blieb.
