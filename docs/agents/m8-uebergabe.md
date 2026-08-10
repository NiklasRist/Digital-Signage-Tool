# Übergabe M8 – Marken: Stand und was zuerst zu tun ist

> **Für eine neue Sitzung.** Voraussetzung: `uebergabe-stand.md` und `issue-generation-prompt.md`
> gelesen. Diese Datei ist der Stand **von M8** darüber.
>
> **Stand:** 10.08.2026 · AD **v1.3** · TK **v3.4** · Worktree `dst-planung`, Branch
> `planung/ad-v1.2-tk-v2.3-issues`

---

## 0. Kurzfassung

**M8 ist geschrieben, aber NICHT anlegereif.** 32 Volltexte liegen in `docs/agents/m8/`, dazu
`BRIEFING.md`. **Kein Prüflauf gelaufen, nichts auf GitHub.**

Davor sind **drei Dinge** zu erledigen, in dieser Reihenfolge. Der erste braucht eine Entscheidung
des Auftraggebers.

---

## 1. ZUERST: ein Widerspruch im TK, der M8 blockiert

**Das ist ein Fehler in TK 9.15, geschrieben am 10.08.** Drei schreibende Agents haben ihn
**unabhängig voneinander** gemeldet (in den STOPP-Blöcken von M8-08, M8-09 und M8-26).

**9.15.1 sagt:**
> „`leseMarke(markeId)` liefert die **fertig aufgelöste** Marke; kein Aufrufer sieht je eine
> Teilmenge, keiner implementiert Vererbung selbst."

**9.15.2 verlangt:**
> „**Bei einer abgeleiteten Marke ist sichtbar, was geerbt und was eigen ist.** Ein Wert, den der
> Nutzer nicht setzt, bleibt geerbt und folgt künftigen Änderungen des Parents."

**Beides gleichzeitig geht nicht.** Die aufgelöste Marke hat die Information, welcher Wert geerbt war,
**gelöscht** – genau die, die der Editor anzeigen muss. Und **keine** der acht Operationen in 9.15.1
liefert den unaufgelösten Eintrag. Der `marken-editor` kann seinen eigenen Vertrag nicht erfüllen;
M8-26 ist mit dem aktuellen Vertrag **nicht baubar**.

**Wie der Fehler entstand:** Die Auflösungsregel sollte 19 Aufrufer davor schützen, je eine eigene
Vererbungslogik zu bauen (das war und bleibt richtig). Dabei wurde der **eine** Aufrufer übersehen,
der das Gegenteil braucht.

**Naheliegende Lösung – aber es ist eine Entscheidung, nicht meine:** eine zusätzliche Operation, die
den **unaufgelösten** Eintrag liefert, ausdrücklich **nur** für den Editor, mit dem Verbot für alle
anderen. Das ist eine Änderung an TK 9.15.1/9.15.2 und damit ein eigener Schritt mit eigener Freigabe
(danach `.docx` neu erzeugen).

**Vorher keinen Prüflauf starten** – er würde diesen Widerspruch in einem Dutzend Issues erneut melden.

## 2. DANN: sieben Lücken im Zuschnitt

Alle von den schreibenden Agents gefunden, keine davon repariert. Teils neue Issues, teils Edits an
**bestehenden** Issues.

| # | Lücke | Art |
|---|---|---|
| 1 | **Kein Dateidialog** für `.woff2` und Logo-Bilder. `importiereSchrift`/`importiereLogo` sind ohne ihn nicht auslösbar. Für Medien gibt es `öffneMedienDialog` (TK 9.4.3) – das Gegenstück fehlt. | **neues Issue** |
| 2 | **FA-24 verlangt „Farben, Slogan, Sicherheitsabstände"** als editierbar. Kein M8-Issue deckt **Slogan** oder **Sicherheitsabstand** ab. | **neues Issue** (1–2) |
| 3 | **`marken-assets`-Protokoll braucht Registrierung vor `app.ready`.** Für `media://` leistet das `#9`; ein Gegenstück fehlt im Zuschnitt. | **neues Issue** oder Edit `#9` |
| 4 | **M4-25 lädt das Logo** fest verdrahtet als *ein* gebündeltes, projektunabhängiges – ohne `markeId`, ohne `herkunft`. Für keine Nicht-Standard-Marke ist ein Logo ladbar. | **Edit** `#119`-Umfeld |
| 5 | **M4-23 `zeichneSegment`** braucht einen Zweig für `logo === null` (Ersatz-Logo) und einen vierten Parameter `rahmenMarke`. Das Editierrecht an M4-Dateien ist im Zuschnitt **nirgends vergeben**. | **Edit**, Zuständigkeit klären |
| 6 | **`RenderRequest` trägt keine `markeId`** (Variante A: Segmente sind fertige Pixel). M8-18 kann damit nicht wissen, welche Marken zu prüfen sind. | **Edit `#17`** + Vertragsfrage |
| 7 | **`RENDER_FEHLERCODES` in `#68`** ist eine als *unveränderlich* geführte Liste mit sieben Werten ohne `marken_datei_fehlt` – der Code würde still zu `unbekannter_fehler` degradiert. | **Edit `#68`** |
| 8 | **M7-04 `Sichten.marke`** ist ein app-weiter Wert aus `config:leseMarke`. Den entfernt M8-07. Niemand zieht `sichten.ts`/`baueSichten()` und den M7-65-Bootstrap nach. | **Edit** M7-Dateien |

**Punkt 6 ist der schwerste.** Er berührt die IPC-Granularität (Variante A) und ist keine
Textkorrektur: Entweder trägt der `RenderRequest` künftig Marken-Referenzen, oder die Prüfung wandert
an eine andere Stelle. Das gehört dem Auftraggeber vorgelegt.

## 3. DANN: Nähte zwischen den parallel geschriebenen Dateien

Die fünf schreibenden Agents liefen gleichzeitig. Drei haben ihre Dateien **nachträglich** gegen die
der anderen abgeglichen und dabei echte Signatur-Abweichungen korrigiert (`erstelleMarke`s `parentId`
als Pflicht-`string | null` statt optional; `schriftRolle` ebenso; `MarkenTeilwerte` mit einem
Sentinel `{ geerbt: true }` statt eines einfachen `Partial`).

**Was noch offen ist:**

- **M8-31 ist stale.** Sein „Fremde Signaturen"-Block zitiert die *älteren* Fassungen von
  `erstelleMarke` und `MarkenTeilwerte`. Muss vor dem Anlegen nachgezogen werden.
- **M8-22 ↔ M8-32 divergieren.** M8-32 nimmt `marken-bestand.ts` mit `MarkenBestand`/
  `ladeMarkenBestand` an; M8-22 heißt `marken-uebersicht.ts` mit anderen Exportnamen und trägt
  zusätzlich die „geöffnete Marke". Entstanden, weil M8-32 vor M8-22 geschrieben wurde.
- **`Herkunft` (M8-11) vs. `MarkenHerkunft` (M8-22)** – zwei Namen für denselben Typ aus TK 9.11.2.
- **M8-02 liegt bewusst NICHT in `contracts`.** Der Zuschnitt hatte es dort einsortiert; die
  etablierte Projektregel sagt aber, fachliche Fehlercode-Unionen liegen in `src/main/**` (Präzedenz:
  `VorlagenFehlercode` in M4-03). Neun Geschwister-Dateien folgen dieser Regel. Der Zuschnitt
  (`m8-zuschnitt.md`, Abschnitt „contracts") ist an dieser Stelle **falsch** und sollte korrigiert
  werden, nicht die Dateien.

## 4. Weitere offene Sachfragen aus den STOPP-Blöcken

Nicht blockierend, aber vor dem Bauen zu klären:

- **Der Kontrast-Schwellenwert** ist nirgends genannt. M8-19 weigert sich bewusst, ihn festzulegen,
  und übergibt ihn als Pflicht-Parameter; M8-28 führt ihn als Prop. Irgendwer muss die Zahl nennen.
- **Die zwei Trefferlisten von `Markennutzung` decken `Project.standardMarkeId` nicht.** Eine Marke
  ließe sich löschen, während sie noch Projekt-Standard ist – der nächste Render liefe in
  `marke_nicht_gefunden`. Braucht eine dritte Liste oder eine bewusste Entscheidung.
- **M8-07 Migration:** Reihum alle Projekte beim Start durchgehen, oder träge beim Öffnen? Träge
  macht die projektübergreifende Referenzprüfung (M8-12) für nie wieder geöffnete Projekte
  unzuverlässig. Für Reihum gibt es keinen etablierten Schreibweg für nicht-aktive Projekte.
- **Der Dateiname beim Import** (Originalname oder neutral?) und das Verhalten bei Namenskollision.
- **Das eingebaute Logo** (Dateiname, `seitenverhaeltnis`) ist nirgends festgenagelt – auch nicht im
  Code-Repo.

## 5. Die Reihenfolge

1. **TK-Widerspruch entscheiden** (Abschnitt 1) → AD/TK anpassen → `.docx` neu → committen.
2. **Zuschnitt-Lücken** (Abschnitt 2) schließen: neue Issues zuschneiden, Edit-Ziele benennen.
   Punkt 6 vorher dem Auftraggeber vorlegen.
3. **Nähte glätten** (Abschnitt 3) – M8-31 nachziehen, M8-22/M8-32 vereinheitlichen.
4. **Prüflauf** über alle M8-Issues, mehrere unabhängige Prüfer, je 6–8 Issues, gegen TK **und** die
   Regeln A–E. Plus **ein Querschnitts-Prüfer** nur für die Nähte – bei M2 hat genau der die
   teuersten Befunde gefunden.
5. **Korrigieren** mit Diff-Kontrolle.
6. **Anlegen:** `python tools/create-issues.py docs/agents/m8 "M8 – Marken"` – erst **trocken**, dann
   `--go`. Labels vorher anlegen: `modul:marken-store`, `modul:marken-editor`.
7. **Querverweise nachziehen** (`M8-XX` → echte `#`-Nummern, Mapping in `docs/agents/m8/map.json`).
8. **DANN der Zitat-Abgleich** über die **54** bestehenden Issues – Umfang und Klassen stehen in
   `marken-abgleich-umfang.md`. Er läuft zuletzt, damit die Klasse-3-Issues auf echte M8-Nummern
   verweisen können.

## 6. Was gut gelaufen ist – bitte beibehalten

- **Die Briefing-Datei** (`docs/agents/m8/BRIEFING.md`) hat sich wieder bewährt: Die Agents haben
  Zitate selbst verifiziert und dabei **eigene** Fehler gefunden („ein erfundenes Wort und eine
  ungekennzeichnete Auslassung in TK-Zitaten"), bevor ein Prüfer sie sehen musste.
- **Die Agents haben Widersprüche gemeldet statt sie zu überschreiben** – der TK-Widerspruch aus
  Abschnitt 1 wurde dreifach unabhängig gefunden. Genau das soll Regel B leisten.
- **Zwei Agents haben ihre eigenen Dateien nachträglich gegen die der Geschwister abgeglichen.** Das
  war nicht beauftragt und hat echte Divergenzen abgefangen.

## 7. Was schiefgelaufen ist – bitte anders machen

- **Fünf Agents gleichzeitig auf einem neuen Modul ist zu viel.** Die Signaturen entstehen erst beim
  Schreiben; wer zuerst fertig ist, legt sie fest, und die Späteren müssen nachziehen. Beim nächsten
  neuen Modul besser: **zuerst** die Typen und die Store-Signaturen (ein Agent, wenige Dateien),
  **dann** parallel den Rest gegen diese festen Signaturen.
- **Der Zuschnitt hat sieben Lücken übersehen** – alle an derselben Art Naht: eine bestehende,
  „abgeschlossene" Datei, die erweitert werden muss (M4-23, M4-25, `#17`, `#68`, M7-04). Beim
  Zuschnitt einer Anforderungsänderung gehört ein eigener Schritt dazu: **„welche bestehenden
  Verträge muss das anfassen?"** – und die Edit-Rechte ausdrücklich vergeben.
