# Vorschlag: Mehrere Marken (B) und Marken-Editor (C)

> **NOCH NICHT VOLLZOGEN.** Diese Datei ist ein Entwurf zur Freigabe. AD und TK sind unverändert
> (AD v1.2, TK v3.3). Erst nach deinem OK werden die Änderungen eingearbeitet, danach die `.docx`
> erzeugt, und **erst dann** kommen Issues.
>
> **Stand:** 10.08.2026 · Grundlage: AD v1.2, TK **v3.3** (das Briefing nannte v3.2 – der Kopf sagt 3.3)

---

## 1. Was du entschieden hast

| # | Frage | Entscheidung |
|---|---|---|
| 1 | Wozu mehrere Marken? | **Partner-/Fremdwerbung** *und* **Saison-/Kampagnen-Looks** |
| 2 | B und C: ein Schritt oder zwei? | **Ein Schritt** – Bestand und Editor zusammen |
| 3 | Saison-Look als eigene Marke? | **Abgeleitete Marke** (`parent`), erbt und überschreibt nur einzelne Werte |
| 4 | `Aktion.akzentfarbe` vs. Marke? | Akzentfarbe **bleibt** und wird **freier Farbwert** (Palettenzwang entfällt) |
| 5 | Rahmenfarbe bei gemischten Marken? | **Rahmen stabil, Inhalt wechselt** – Projekt-Standardmarke färbt Band-Hintergrund und Restflächen |
| 6 | Marke löschen? | **Blockieren** wie bei Vorlagen – Aktionen *und* abgeleitete Looks blockieren |
| 7 | Eingebaute Marke? | **Unlöschbar, aber bearbeitbar** |
| 8 | Importierte Datei fehlt beim Render? | **Render bricht früh ab**, bevor ffmpeg startet |
| 9 | Kontrast bei freier Akzentfarbe? | **Warnen, nicht blockieren** |
| 10 | Marke ohne Logo? | **Ersatz-Logo**: Markenname auf Akzentfarbe, in Standardschrift (4.7) |
| 11 | Dessen Akzentfarbe? | die der **Marke** – stabil, Ausnahme in TK 9.10.9 (4.7 d) |

Zwei Fragen des Briefings fielen zusammen: Über Video-Elemente zeichnet der Render **kein Logo** –
das Logo lebt ausschließlich in Vorlagen-Zonen. Der einzige Markenwert, den ein Video braucht, ist
`flaecheDunkel` für die Pillarbox-Restflächen bei `split`, und dieselbe Rolle färbt den
Band-Hintergrund. Frage 3 („woher Logo und Slogan?") und Frage 5 („Bandgeometrie") sind damit **eine**
Frage – die nach der Rahmenfarbe.

## 2. Was das an der Produktprämisse ändert (bitte gegenlesen)

Das ist die eigentliche Tragweite. Heute sagt das AD:

> „ein fester Markenrahmen sorgt für ein einheitliches, professionelles Erscheinungsbild, während
> klar definierte freie Bereiche jeder Aktion einen eigenen, ansprechenden Auftritt erlauben" (AD 4.1)

Mit Partner-Werbung gilt das **nicht mehr für den ganzen Reel**, sondern nur noch **je Rahmen**: Der
Rahmen (Band-Hintergrund, Restflächen) bleibt in der Projekt-Standardmarke stabil, die Inhalte darin
tragen fremde Marken. Das ist eine bewusste Einschränkung der Zusage, kein Versehen – und sie muss im
AD **ausgeschrieben** stehen, sonst liest sie später jemand als Widerspruch.

Ebenso zurückgenommen wird diese Zusage:

> „**Akzentfarbe nur aus der Markenpalette** (feste Auswahl in v1, kein freier Farbwähler) – so bricht
> keine Aktion aus dem Corporate Design aus." (TK 9.8.4)

Mit dem freien Farbwert **kann** eine Aktion aus dem Corporate Design ausbrechen. Das ist gewollt
(Partner-Hausfarben stehen in keiner Palette), aber die Kontrast-Warnung ist die Gegenmaßnahme und
gehört mit in die Planung, nicht als Nachtrag.

## 3. Änderungen am Anforderungsdokument (v1.2 → v1.3)

### Neu: zwei funktionale Anforderungen

| Nr. | Titel | Inhalt | Priorität |
|---|---|---|---|
| **FA-23** | Marken-Bestand | Mehrere Marken, **app-weit** in einem projektunabhängigen Bestand. Ein Projekt darf mehrere verwenden; eine **Aktion** hat **genau eine**. Eine Marke kann von einer anderen **abgeleitet** sein und einzelne Werte überschreiben (Saison-Look). Die Fitnessworld24-Marke ist immer vorhanden und **nicht löschbar**, aber bearbeitbar. Löschen nur, wenn keine Aktion und kein abgeleiteter Look sie nutzt. | Muss |
| **FA-24** | Marken-Editor | Marken in der Anwendung **anlegen, bearbeiten und ableiten**: Farben, Slogan, Sicherheitsabstände, sowie **Import** von Logo und Schriftdateien. Bei zu geringem Kontrast zwischen Akzentfläche und Text **warnt** die Anwendung sichtbar, ohne die Wahl zu verhindern. | Muss |

### Zu schärfen

- **FA-11** („Einheitliches Grundlayout … im Corporate Design von Fitnessworld24"): Der Satz muss die
  Fitnessworld24-Marke als **eingebauten Standard** benennen, nicht als die einzige. Vorschlag:
  „… im Corporate Design der zugewiesenen Marke; eingebauter Standard ist Fitnessworld24."
- **Abschnitt 4.1**: der oben zitierte Satz zum einheitlichen Erscheinungsbild – ergänzen um die
  Rahmen/Inhalt-Trennung aus Entscheidung 5.
- **Abschnitt 4.2** („Design-Tokens / Style-Guide"): Diese Tabellen beschreiben künftig die
  **eingebaute** Marke, nicht „die" Marke. Ein Vorsatz genügt; die Werte bleiben unverändert.
- **Neuer Abschnitt 4.8** „Marken: Bestand, Ableitung, Zuweisung" – die Regeln aus FA-23/FA-24
  ausgeschrieben, so wie 4.6 es für die Vorlagen-Arbeitskopie tut.
- **Akzeptanzkriterium 10**: „Eine Aktion kann eine andere als die eingebaute Marke tragen; das
  gerenderte Video zeigt deren Logo und Farben, während Band-Hintergrund und Restflächen in der
  Projekt-Standardmarke bleiben (FA-23, FA-24)."
- **Neues Risiko R-07** „Fremdschriften und Lizenzen": Die vier mitgelieferten Schriften sind bewusst
  OFL. Für **importierte** Schriften trägt der Nutzer die Nutzungsrechte – das muss im Dokument
  stehen, weil die Anwendung sie in ein weitergegebenes Video einbrennt.
- **Neues Risiko R-08** „Unlesbarer Kontrast": Der freie Farbwert erlaubt Kombinationen, die am
  85-Zoll-Schirm aus mehreren Metern unlesbar sind. Gegenmaßnahme ist die Warnung (FA-24), nicht die
  Sperre – die Restverantwortung bleibt beim Nutzer.

## 4. Änderungen am Technischen Konzept (v3.3 → v3.4)

### 4.1 Abschnitt 6 – Ordner und Speicher

`config.json` verliert die Marke, der Bestand bekommt seinen eigenen Ort:

```
<App-Ordner>/
  config.json                # B/D3: aktives Projekt, letztes Export-Ziel, UI-Voreinstellungen
  vorlagen.json              # A/V1: Vorlagen-Bibliothek – APP-WEIT
  vorlagen.json.bak
  marken.json                # A/V2: Marken-Bestand – APP-WEIT (NEU)
  marken.json.bak            # A/V2: letzte heile Version (NEU)
  marken-assets/             # A/V2: importierte Logos und Schriften (NEU)
    <marken-id>/
      logo.<ext>
      schriften/<datei>.woff2
```

**Begründung des Zuschnitts (meine Festlegung, bitte prüfen):** Die **Daten** liegen wie bei den
Vorlagen in **einer** app-weiten JSON mit `.bak` – dasselbe erprobte Muster. Die **Dateien** liegen wie
die Projektmedien in einem Ordner **je Marke** (`projects/<id>/media/` ist die Entsprechung). Beide
Präzedenzfälle existieren schon; nichts Neues erfunden.

**`config.json` verliert „Marke" auch in 9.5.6** – dort steht heute „aktives Projekt, letztes
Export-Ziel, UI-Voreinstellungen, Marke". Issue **#265** hat das Feld aus `AppKonfig` bereits
ausdrücklich herausgehalten; der Nachzug im TK fehlte.

### 4.2 Neues Modul `marken-store` [V2]

`leseMarke` wandert aus dem `config-store` heraus. Das Modul folgt **eins zu eins** dem
`vorlagen-store` (9.12.1) – Auto-Speichern, `.bak`, `schemaVersion`, eigene Schreib-Serialisierung,
Referenzprüfung über **alle** Projekte, sichtbare Speicherfehler.

| Operation | Eingang → Ausgang |
|---|---|
| `listeMarken` | – → `Ergebnis<Marke[]>` (alle, inkl. abgeleiteter) |
| `leseMarke` | `markeId` → `Ergebnis<Marke>` – **aufgelöst**, Vererbung bereits angewandt |
| `erstelleMarke` | `name`, `parentId?` → `Ergebnis<Marke>` |
| `bearbeiteMarke` | `markeId`, `teilwerte` → `Ergebnis<Marke>` |
| `importiereMarkenDatei` | `markeId`, `art: "logo"\|"schrift"`, `quellPfad` → `Ergebnis<Marke>` |
| `löscheMarke` | `markeId` → `Ergebnis<void>`; im Fehlerfall `marke_referenziert` mit **beiden** Trefferlisten: betroffene **Aktionen** (je mit Projekt) und betroffene **abgeleitete Marken** |
| `pruefeMarkenReferenzen` | `markeId` → `Ergebnis<Markennutzung>` – rein lesend, für die Warnung **vor** dem Löschen |

**Die wichtigste Festlegung: `leseMarke` liefert die AUFGELÖSTE Marke.** Die Vererbung wird **genau
einmal** angewandt – im `marken-store`. Kein Aufrufer sieht je eine halbe Marke, keiner implementiert
Vererbung selbst. Das ist dasselbe Prinzip, das das TK für die Akzentfarbe schon festhält:

> „**Es gibt genau eine Auflösungsstelle.** Keine Zonen-Sorte (Text, Bild, Deko, Verlauf) darf
> `marke.farben[...]` direkt lesen" (TK 9.10.9)

Ohne diese Regel bekämen **19 Aufrufer** je eine eigene Vererbungslogik.

### 4.3 Abschnitt 9.11.2 – der Typ `Marke`

Ergänzt um Identität und Ableitung; die bestehenden Felder bleiben unverändert:

```
Marke {
  id:          string                        // UUID (NEU)
  name:        string                        // NEU
  parent:      string | null                 // NEU: abgeleitet von; null = eigenständig
  eingebaut:   boolean                       // NEU: true nur bei Fitnessworld24
  farben:      { <FarbRolle>: string }        // bei parent ≠ null: TEILMENGE erlaubt
  schriften:   { <SchriftRolle>: Schrift }   // dito
  logo:        { datei, seitenverhaeltnis } | null
  sicherheit:  { horizontal, vertikal }
  radien:      { pille, karte, klein }
  schatten:    { versatzY, weichzeichnen, farbe }
  slogan:      { text, aktiv }
}
```

**Auflösungsregel:** Bei `parent ≠ null` gelten die eigenen Werte, für jeden **nicht gesetzten** Wert
der des Parents – **feldweise**, nicht objektweise. Ein Saison-Look, der nur `farben.akzent` setzt,
erbt alle übrigen Farben, alle Schriften und das Logo. Ketten sind auf **eine** Stufe begrenzt
(ein Parent darf selbst keinen Parent haben) – sonst wird die Auflösung unvorhersehbar tief und die
Referenzprüfung beim Löschen rekursiv.

*(Die Begrenzung auf eine Stufe ist meine Festlegung – sag Bescheid, wenn du mehrstufig brauchst.)*

### 4.4 Wo die Marke am Datenmodell hängt

- **`Aktion.markeId: string`** – genau eine, Pflichtfeld. Vorbelegt mit der Projekt-Standardmarke.
- **`Project.standardMarkeId: string`** – bestimmt Band-Hintergrund, Pillarbox-Restflächen und die
  Vorbelegung neuer Aktionen. Beim Anlegen eines Projekts die eingebaute Marke.
- **`Aktion.akzentfarbe?`** bleibt, wird aber **freier Hex-Wert** statt Palettenauswahl.

### 4.5 Was an den Render- und Zeichenwegen nachzuziehen ist

- **9.2.8 / 9.9.2 – Restflächen und Bandhintergrund:** heute „geholt über die Marke (`leseMarke`)".
  Künftig: über die **Projekt-Standardmarke**, ausdrücklich **nicht** über die Marke der gerade
  sichtbaren Aktion. Das ist Entscheidung 5 und muss dort wörtlich stehen, sonst baut es jemand
  „konsequent" anders.
- **9.10.9 – Akzentfarbe:** Der Mechanismus bleibt unverändert (die Akzentfarbe ersetzt die drei
  Akzent-Rollen). Nur die Herkunft des Werts ändert sich: freier Hex statt Palette. Die
  Sonderregel für den Vorlagenbau („darf sich nicht auf den Kontrast zwischen zwei Akzent-Rollen
  verlassen") bleibt gültig und wird **wichtiger**.
- **9.10.9, Abschnitt „Abgrenzung – wo die Regel NICHT gilt":** ergänzen um das **Ersatz-Logo**
  (4.7 d). Es nimmt `marke.farben.akzent`, nicht `aktion.akzentfarbe` – zweiter Fall neben den
  Restflächen der Split-Komposition, mit derselben Begründung: Marken-Identität ist stabil.
- **9.8.4 – Palettenzwang:** streichen, mit Vermerk, dass er bewusst zurückgenommen wurde.
- **9.10.4 – gebündelte Schriften:** Der Abschnitt bleibt (Playfair fehlt auf Windows/macOS), bekommt
  aber den Zusatz für **importierte** Schriften – s. Abschnitt 5.

### 4.6 Der teuerste Posten: 19 Aufrufer brauchen einen Marken-Kontext

`leseMarke()` hat heute **kein Argument**. Diese Issues holen die Marke – alle über `leseMarke`,
**keines** über `leseKonfig`:

| Meilenstein | Issues |
|---|---|
| M1-Nachzügler | **#77** |
| M4 `template-canvas` | #112, #119 |
| M5 `action-editor`, `vorlagen-editor`, `composer` | #134, #139, #140, #150, #154 |
| M6 `ffmpeg-adapter`, `render-service` | #164, #176, #177, #181 |
| M7 `preview-player`, u. a. | #196, #197, #216, #218, #221, #239, #262 |

*(Das Briefing nennt 19, listet aber nur 18 – **#77** fehlt dort. Die Zahl stimmt, die Aufzählung war
unvollständig.)*

**Gute Nachricht:** Die meisten dieser Stellen haben den Kontext schon – wer eine Aktion zeichnet, hat
`aktion.markeId`; wer eine Split-Komposition baut, hat die `projektId`. Der Kontext muss also nicht
neu beschafft, sondern nur **durchgereicht** werden. Trotzdem ist es eine Signaturänderung in
19 Issues über fünf Meilensteine.

### 4.7 Ersatz-Logo, wenn eine Marke keins hat

**Regel:** Ist `logo === null`, zeichnet `template-canvas` in jeder Zone mit `bindung: logo` den
**Markennamen** auf einer Fläche in der **Akzentfarbe**, in einer **Standardschrift**. Kein leerer
Bereich, kein fremdes Logo. Das Ersatz-Logo entsteht in derselben Zeichenroutine wie alles andere –
also **pixelgleich** in Vorschau und Render, ohne zweiten Zeichenpfad (TK 9.10.1).

Vier Dinge folgen daraus. Drei habe ich entschieden, eine braucht dich:

**a) Schrift: die gebündelte `headlinePlakativ` (Archivo Black) – meine Festlegung.**
Nicht die eigene Headline-Schrift der Marke. Grund: Eine Marke ohne Logo hat oft auch keine
importierte Schrift – und wenn doch, könnte **diese Datei zur Renderzeit fehlen** (Abschnitt 5,
Punkt 3). Dann wäre selbst der *Ersatz* nicht zeichenbar. Die gebündelte Schrift ist immer da, und
`headlinePlakativ` ist die Rolle, die laut TK 9.11.2 für „hohe Signalwirkung auf dem TV" ausgewählt
wurde – genau das, was ein Logo leisten muss.

**b) Textfarbe: nach gemessenem Kontrast, nicht fest – meine Festlegung.**
Weil die Akzentfarbe jetzt ein **freier** Wert ist (Entscheidung 4), kann sie hell oder dunkel sein.
Eine feste Textfarbe wäre auf der einen Hälfte des Farbraums unlesbar. Der Canvas wählt daher zwischen
den Rollen `textAufDunkel` und `textAufHell` die mit dem **besseren Kontrast** zur Akzentfläche.
Das ist dieselbe Rechnung wie bei der Kontrast-Warnung (FA-24) – **einmal implementiert, zweimal
genutzt**. Hier entscheidet sie automatisch, statt zu warnen: Beim Ersatz-Logo gibt es keine
Nutzerwahl, die man warnen könnte.

**c) Lange Namen: verkleinern, nicht abschneiden – meine Festlegung.**
Die eingebaute Vorlage gibt dem Logo **420 × 120 px** oben links. Die bestehende Überlauf-Kaskade
lautet „umbrechen → verkleinern → `…`" (TK 9.10.6). Für ein Logo ist das Auslassungszeichen falsch –
ein abgeschnittener Markenname sieht nach Fehler aus, nicht nach Gestaltung. Für das Ersatz-Logo gilt
daher: **einzeilig, auf die Zonenbreite verkleinern, kein `…`**, bis zu einer Mindestgröße; darunter
wird zweizeilig umbrochen. `seitenverhaeltnis` ist bei `logo === null` **bedeutungslos** – die Fläche
kommt aus der Zone.

**d) Akzentfarbe: die der MARKE, nicht die der Aktion – entschieden (10.08.).**
Das Ersatz-Logo nimmt `marke.farben.akzent` und bleibt damit **stabil**, auch wenn die Aktion über
`aktion.akzentfarbe` eine andere Akzentfarbe setzt. Begründung: Ein Logo ist eine Konstante – das ist
sein Zweck. Rotieren im Band drei Aktionen desselben Partners mit verschiedenen Akzentfarben, blinkte
sein „Logo" sonst in drei Farben, während ein echtes Logo als Bilddatei unverändert bliebe. Der Ersatz
muss sich verhalten wie das, was er ersetzt.

**Das ist eine Ausnahme von TK 9.10.9** und gehört in dessen bestehenden Abschnitt „**Abgrenzung – wo
die Regel NICHT gilt**", in dem bereits die Restflächen der Split-Komposition ausgenommen sind. Also
kein Bruch der Regel, sondern ein zweiter Fall derselben Art – und beide Fälle haben denselben Grund:
**Rahmen und Marken-Identität sind stabil, nur Inhalte folgen der Aktion.** Dieselbe Linie wie
Entscheidung 5.

---

## 5. Der harte Riegel: Import von Schriften und Logos

Eigener Planungsabschnitt, weil er drei Zusagen des TK berührt.

**Das Problem:** `Schrift.datei` und `logo.datei` verweisen heute auf **zur Bauzeit gebündelte**
Dateien – Issue #8 legt genau vier `.woff2` unter `src/renderer/assets/fonts/` ab, #7 verpackt sie als
Renderer-Bundle-Assets. Eine vom Nutzer angelegte Marke hat dort **keine Datei, auf die sie zeigen
könnte**.

**Vorschlag:**

1. **Zwei Herkünfte, eine Auflösung.** `Schrift.datei` und `logo.datei` bekommen eine Herkunft:
   `gebuendelt` (die vier OFL-Schriften, das Fitnessworld24-Logo) oder `importiert` (liegt unter
   `marken-assets/<markeId>/`). Der Renderer löst **an einer Stelle** auf – gebündelt über den
   Bundle-Pfad, importiert über das bestehende **`media://`-Protokoll** bzw. ein Geschwister davon.
   Kein zweiter Zugriffsweg, keine absoluten Pfade im Renderer.
2. **Determinismus neu beweisen.** TK 9.10.3 verlangt, dass Schriften **vor** dem Zeichnen geladen
   sind. Für gebündelte Schriften erledigt das #8 beim Start. Für importierte muss das **je Marke**
   passieren, bevor die erste Zone gezeichnet wird – und der Nachweis („nach dem Auflösen sind alle
   Familien via `document.fonts.check()` verfügbar") gilt dann für die importierten mit.
3. **Fehlt eine Datei zur Renderzeit → Render bricht früh ab** (Entscheidung 8), mit eigenem
   Fehlercode, bevor ffmpeg startet – analog zu `medium_fehlt`. Der Reparatur-Modus (FA-19) sollte
   den Fall mit abdecken, weil er dieselbe Klasse ist: eine Referenz zeigt ins Leere.
4. **Ablage neben den Daten, nicht im Programmordner.** `marken-assets/` liegt im Datenort (#5). Damit
   wandern importierte Schriften mit den Daten – bei portabler Auslieferung genau richtig.
5. **Import kopiert, wie beim Medien-Import.** Quelldatei bleibt unberührt, die Kopie gehört der
   Marke. Format-Whitelist: `.woff2` für Schriften (dasselbe Format wie die gebündelten, ein
   Renderpfad), Logo wie die Bild-Whitelist. *(Mein Vorschlag – `.ttf`/`.otf` zusätzlich zuzulassen
   wäre bequemer für den Nutzer, kostet aber einen zweiten Ladepfad.)*
6. **Lizenz:** Für importierte Schriften trägt der Nutzer die Rechte (R-07). Die Anwendung brennt sie
   in ein weitergegebenes Video ein – das gehört ins Dokument, nicht nur in einen Tooltip.

**Was das an bestehenden Issues berührt:** #7 (Verpackung), #8 (Schriften bündeln), #5 (Datenort),
#112/#119 (`template-canvas`). Diese sind bei der Umsetzung anzupassen, nicht neu zu schreiben.

## 6. Was NICHT angefasst wird

- **Vorlagen verweisen ausschließlich über Rollen** auf Farben und Schriften (TK 9.11.1 Punkt 7). Das
  ist die Festlegung, die mehrere Marken überhaupt tragfähig macht – ein Markenwechsel bleibt ein
  Datenwert und keine Vorlagen-Änderung.
- **Die eine Auflösungsstelle** für Farb-Rollen (9.10.9).
- **Der Bau-Branch** `bau/funktionsgeruest-m1-m7` und die 231 generierten Gerüstdateien. Ändert sich
  ein Vertrag, ändert sich das **Issue**; die Datei wird neu erzeugt (`tools/geruest.py`).

## 7. Was mir aufgefallen ist und deine Entscheidung braucht

1. **Eingebaute Marke bearbeitbar, eingebaute Vorlagen eingefroren** – die beiden Bestände folgen
   künftig verschiedenen Regeln. Deine Entscheidung 7 ist eindeutig, ich halte sie nur fest, damit sie
   später nicht als Inkonsistenz gelesen wird. Nebeneffekt, der dafür spricht: Weil Saison-Looks von
   der eingebauten Marke ableiten, wirkt eine Logo-Änderung dort sofort in allen Varianten.
2. **`Marke` bekommt eine `id` – das ist ein Schema-Bruch.** Heute ist `Marke` ein namenloses
   Wertobjekt in `config.json`. Bestehende `config.json`-Dateien brauchen eine Migration
   (`schemaVersion`, TK 9.5.5): die vorhandene Marke wird zur eingebauten Marke im neuen
   `marken.json`. Bei einem noch nicht ausgelieferten Prototyp ist das billig – es muss nur geplant
   sein.
3. **`logo` wird `| null` – ERLEDIGT (10.08.):** Fehlt ein Logo, zeichnet der Canvas einen **Ersatz**:
   den **Markennamen** auf **farbigem Grund in der Akzentfarbe**, in einer **Standardschrift**. Die
   Zone bleibt damit gefüllt, ohne eine fremde Marke hineinzumischen. Details in Abschnitt 4.7.

4. **Akzentfarbe des Ersatz-Logos – ERLEDIGT (10.08.):** Die **Marken**-Akzentfarbe gewinnt, das
   Ersatz-Logo bleibt stabil. Als zweite Ausnahme in TK 9.10.9 „Abgrenzung" aufzunehmen. Details in 4.7 d.

**Damit sind alle offenen Fragen dieses Durchgangs beantwortet.** Es bleiben drei Festlegungen, die
ich getroffen habe und die du überstimmen kannst: Ableitungsketten auf **eine** Stufe begrenzt (4.3),
Schrift-Import nur **`.woff2`** (Abschnitt 5, Punkt 5), und die drei Regeln zum Ersatz-Logo (4.7 a–c).

---

## 8. Ablauf ab hier

1. Du liest diesen Entwurf und sagst, was zu ändern ist – insbesondere Punkt 7.3.
2. Ich arbeite AD (v1.3) und TK (v3.4) ein, erzeuge beide `.docx`, validiere sie.
3. **Zitat-Abgleich rückwärts** über die 19 betroffenen Issues (Regel D gilt rückwärts): Wer TK 9.5.6
   oder 9.11.2 wörtlich zitiert, trägt nach der Änderung ein falsches Zitat.
4. Erst danach: Zuschnitt der neuen Issues (`marken-store`, Marken-Editor, die 19 Nachzüge), Dry-Run,
   Freigabe, Anlegen.
