# M8 – Vier Entscheidungen des Auftraggebers (11.08.2026)

> Vorgelegt nach dem zweiten Prüflauf; jede der vier Fragen hatte **keinen** Adressaten in den 49
> Issues und war damit ein Baustopp, kein Detail. Diese Datei ist das Protokoll; die Umsetzung
> wandert nach AD **v1.4** und TK **v3.11** und von dort in die Issues.

---

## E-1 · Die eingebaute Marke startet mit `logo: null`

**Frage war:** Womit startet die eingebaute Fitnessworld24-Marke beim allerersten Start? Im Repository
liegt **keine** gebündelte Logo-Datei; `tools/assets/logo.png` gehört zur Word-Generierung und ist
kein App-Bestandteil. M8-06 sollte aber `logo: { datei, herkunft: "gebuendelt", seitenverhaeltnis }`
anlegen.

**Entschieden:** Die eingebaute Marke wird mit **`logo: null`** angelegt. Gezeichnet wird das
**Ersatz-Logo** (TK 9.10.10) aus Markenname und Akzentfarbe. Das echte Logo kommt später über den
Import in der Oberfläche und trägt dann `herkunft: "importiert"`.

**Warum das die richtige Wahl ist – und nicht nur die bequemste:** Der Ersatz-Logo-Pfad war bisher
**strukturell tot**. Hätte die eingebaute Marke ein Logo mitgebracht und jede abgeleitete Marke es
geerbt, wäre `logo === null` nie eingetreten – der ganze in 9.10.10 spezifizierte Zweig samt
Kontrast-Rechnung (M8-19), Ersatz-Logo (M8-20) und Dispatch (M8-21) wäre gebaut, geprüft und **nie
ausgeführt** worden. Jetzt ist er der **Normalfall beim ersten Start**.

**Folge, die ausgesprochen werden muss:** In v1 wird **kein Logo gebündelt ausgeliefert**. Damit
kann `logo.herkunft` praktisch nur den Wert `"importiert"` annehmen. Der Wert `"gebuendelt"` bleibt
im Typ – für **Schriften** ist er der Regelfall (vier OFL-Schriften werden mitgeliefert) –, aber für
**Logos** hat er in v1 keinen Erzeuger. Wer den `gebuendelt`-Zweig in `holeLogo` (M8-42) baut, baut
ihn für die Symmetrie und für später, nicht für einen Fall, der v1 erreicht. **Das gehört in M8-42,
sonst sucht dort jemand einen Fehler, der keiner ist.**

**Betrifft:** M8-06 (Seeding), M8-42 (`logo-laden.ts`), M8-21 (`null`-Dispatch), M8-25 (Import und
Entfernen), TK 9.11.2 und die Tabelle der eingebauten Marke.

---

## E-2 · Löschen blockiert auch bei Projekt-Standard – und die Standardmarke wird wählbar

**Frage war:** Darf eine Marke gelöscht werden, die noch als `Project.standardMarkeId` eingetragen
ist? Die Referenzprüfung kannte **zwei** Trefferlisten (Aktionen, abgeleitete Marken);
`Project.standardMarkeId` war in keiner. Der nächste Render wäre in `marke_nicht_gefunden` gelaufen –
für Band-Hintergrund und Split-Restflächen, also mitten im Hauptbetrieb.

**Entschieden – zwei Teile, der zweite ist neu:**

1. **Löschen wird blockiert**, solange ein Projekt die Marke als Standard führt. `Markennutzung`
   bekommt eine **dritte** Trefferliste.
2. **Der Nutzer bekommt eine Mitteilung, dass er den Standard ändern muss – und einen Ort, an dem er
   das tun kann.** Eine Sperre ohne Ausweg wäre eine Sackgasse: Die Marke ließe sich nie löschen,
   weil sich der Grund nicht beseitigen ließe.

**Warum Teil 2 nicht optional ist:** Es gibt in den 49 Issues **keine** Operation und **keine**
Oberfläche, die `Project.standardMarkeId` setzt. Das Feld entsteht bei der Migration (M8-07) und
wird danach nur noch **gelesen**. Ohne Teil 2 wäre die Blockade aus Teil 1 endgültig – dieselbe
Lückenklasse, die in jedem Meilenstein aufgetreten ist, nur diesmal vom Auftraggeber gefunden.

**Was daraus folgt:**
- **Anforderungsdokument:** FA-23 nennt heute wörtlich zwei Bedingungen („keine Aktion und keine
  abgeleitete Marke"). Die dritte muss hinein, ebenso die Zuweisbarkeit der Projekt-Standardmarke.
- **Technisches Konzept:** `Markennutzung` (9.15) um die dritte Liste; eine **neue Operation** zum
  Setzen der Projekt-Standardmarke in der Operationsliste des `project-store` (9.5.2); die
  Fehlermeldung beim blockierten Löschen muss die betroffenen **Projekte** benennen können
  (`fehler.daten`, 9.1.1 – derselbe Weg, den `asset_referenziert` schon nimmt).
- **Issues:** M8-01 (Typ `Markennutzung`), M8-12 (Referenzprüfung), M8-13 (Löschen), M8-29
  (Lösch-Vorwarnung) – und **mindestens ein neues Issue** für die Auswahl selbst.

**Offen und beim Ausarbeiten zu entscheiden:** **Wo** die Auswahl sitzt. Die Projekt-Standardmarke
ist eine Eigenschaft des **Projekts**, nicht des Marken-Bestands – sie gehört damit eher in die
Projekt-Verwaltung oder an den Kopf der Zusammenstellung als in den Marken-Reiter. Das ist eine
Bedienfrage und wird beim Zuschnitt des neuen Issues vorgelegt, nicht hier geraten.

---

## E-3 · Ein neues Projekt bekommt die eingebaute Marke – aber der Handler holt sie, nicht der Store

**Frage war:** Wer setzt `Project.standardMarkeId`, wenn ein neues Projekt angelegt wird?
`erstelleProjekt` (**#33**) baut das initiale `Project` und weiß von keiner Marke. Suche über alle
M8-Volltexte nach `erstelleProjekt`: **null Treffer**. Ein Pflichtfeld ohne Befüller.

**Gewählt wurde:** „`erstelleProjekt` holt die eingebaute Marke."

**KORREKTUR MEINER EIGENEN ENTSCHEIDUNGSVORLAGE:** Ich habe den Preis dieser Wahl als „eine neue
Abhängigkeit `project-store` → `marken-store`" beschrieben. Das war **zu harmlos**. Der
`marken-store` liest **bereits** aus dem `project-store`: `pruefeMarkenReferenzen` (M8-12) geht über
`listeProjekte` (**#35**) durch die `project.json` **aller** Projekte. Eine Abhängigkeit in die
Gegenrichtung wäre also ein **RINGSCHLUSS zwischen zwei Main-Modulen** – nicht eine Zeile, sondern
genau die Sorte Architekturschaden, die später niemand mehr sauber auflöst.

**Umsetzung, die die Absicht erhält und den Ring vermeidet:** Die Zusammensetzung geschieht **eine
Schicht höher**, im **Handler** für `project:erstelleProjekt` (Main). Handler dürfen Module
zusammensetzen – das ist ihre Aufgabe. Konkret:

- `project-store.erstelleProjekt(name, standardMarkeId)` nimmt die Marken-Kennung als **Parameter**
  entgegen und kennt den `marken-store` **nicht**.
- Der **Handler** fragt den `marken-store` nach der eingebauten Marke und reicht deren `id` weiter.
- Für den **Renderer ändert sich nichts**: Er ruft weiterhin `erstelleProjekt(name)` über IPC.

Damit ist ein neues Projekt ab Sekunde eins vertragskonform befüllt, die Abhängigkeit bleibt
**einseitig** (`marken-store` → `project-store`), und die Signatur-Änderung trifft nur `#33` und
seinen einen main-seitigen Aufrufer.

**Betrifft:** `#33` (`erstelleProjekt`), den Handler (`#3`-Verdrahtung / `ipc-gateway`), TK 9.5.2 und
die Modul-Abhängigkeiten in TK Abschnitt 9.

---

## E-4 · Scheitert der Marken-Flush beim Beenden, wird das Beenden abgebrochen – mit geführter Reparatur

**Frage war:** Was geschieht, wenn das Speichern der Marken beim Beenden fehlschlägt? Für
`project.json` ist es geregelt (TK 9.5.4: schließt die App **nicht**). Für Marken sagt TK 9.15.1 nur,
die Schreib-Invarianten seien „dieselben" – und der Dialog, der es anzeigen würde, lebt im Renderer,
der beim Beenden bereits abgebaut sein kann.

**Entschieden:** **Das Beenden wird abgebrochen**, der Nutzer wird gewarnt, und er bekommt einen
**Lösungsvorschlag oder einen geführten Reparaturvorgang** – nicht nur eine Fehlermeldung.

**Warum das mehr ist als eine Meldung:** Das Muster existiert im Projekt bereits als **FA-19**
(geführte Reparatur kaputter Elemente): zurückleiten, eins nach dem anderen, „X von N", und der
blockierte Vorgang wird erst freigegeben, wenn alles behoben ist. Ein Marken-Schreibfehler ist
derselbe Fall in klein – und ohne Führung stünde der Nutzer vor einer App, die sich nicht schließen
lässt, ohne zu wissen, warum.

**Was beim Ausarbeiten zu klären ist – ausdrücklich NICHT hier geraten:**
- **Der Renderer muss beim Beenden noch leben**, sonst gibt es niemanden, der Warnung und Führung
  zeigt. Das berührt die Reihenfolge in `before-quit` (`#3`/M8-36) und ist die eigentliche
  technische Frage dieser Entscheidung.
- **Was die Führung anbietet.** Naheliegend: erneut versuchen; den Datenort prüfen (voll, gesperrt,
  schreibgeschützt); als letzten Ausweg die Änderung **bewusst verwerfen** und schließen. Der letzte
  Punkt ist wichtig, sonst ist eine App mit dauerhaft defektem Datenort **unschließbar** – der
  Nutzer bliebe nur mit dem Task-Manager übrig.
- **Gilt dasselbe für `project.json`?** TK 9.5.4 sagt heute ausdrücklich das **Gegenteil** („schließt
  die App **nicht**"). Zwei verschiedene Verhaltensweisen für zwei Dateien desselben Datenorts sind
  schwer zu erklären und schwer zu bauen. **Das ist die nächste Frage an den Auftraggeber** und wird
  zusammen mit dem TK-Nachzug vorgelegt.

**Betrifft:** M8-03/M8-04 (Flush), M8-36 (Beenden-Ablauf), `#47`/`#98` (die zwei anderen Flushes),
TK 9.5.4 und 9.15.1, und mit hoher Wahrscheinlichkeit das Anforderungsdokument (FA-19 oder eine
eigene Anforderung).
