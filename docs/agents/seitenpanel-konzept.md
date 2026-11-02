# Seitenpanel — Konzept (Stand 02.11.2026)

**Status: Entwurf. Die Entscheidung in Abschnitt 5 ist OFFEN.**
Anlass: Übergabe 01.11.2026, Schritt 3 — „das Konzept für alles im Seitenpanel (Liste/Inspector,
Bibliothek, Auswahl und Bearbeiten eines Elements)". Vorschlag Niklas: ausklappbar nach
VS-Code-Muster. **Gemeinsam entschieden, nicht allein gebaut.**

---

## 1. Was wir haben (gemessen, nicht erinnert)

Fenster: Standard **1440 × 900** (`src/main/index.ts:203`), der Treiber misst **800 × 572**
(`scripts/durchlauf.mjs`). 800 × 572 ist die enge Kante, an der jede Fläche bestehen muss.

| Fläche | Ort | Aufgabe | Beleg (Testid / Datei) |
|---|---|---|---|
| Rail, 240 px | links | Video importieren, Aktionen anlegen/öffnen/löschen, Statistik am Fuß | `composer-rail`, `bibliothek`, `composer-statistik-fuss` |
| Bühne, 520 × 280 | rechts oben | Vorschau des Videos | `composer-buehne` |
| Zeitleiste, 520 × 124 | rechts darunter | Reihenfolge, Kanten-Drop, Zoom, Playhead, Unterbrechungen, Bandspur | `zeitleiste`, `zeitleiste-block-*` |
| Ausgaben | rechts unten | gerenderte Dateien, Export | `ausgaben-bereich` |
| **Wiedergabeliste** | **`display: none`** | Position, Thumbnails, Dauer-Regler, Trim-Griffe, Bandliste, Entfernen, Gesamtdauer | `composer/index.tsx:1084`, `liste-ansicht.tsx`, `element-zeile.tsx` |
| Aktionen-Reiter | eigener Reiter | Formular + Live-Vorschau + **eigene Bibliothek, 260 px** | `aktion-editor-root`, `aktion-bibliothek` (`action-editor/index.tsx:198`) |
| Vorlagen-Reiter | eigener Reiter | Arbeitskopie + **Inspector** | `inspektor`, `inspektor-leer` |
| Marken | **Ansicht über** der Reiterfläche | Rollen + Inspector | `marken-editor` (#456) |
| Projekte-Reiter | eigener Reiter | Anlegen, Öffnen, Löschen | `projekt-verwaltung` |

Die vier Reiter: **Zusammenstellen · Aktionen · Vorlagen · Projekte.**

---

## 2. Wo die Lücken sind

### L1 — Ein Zeitleisten-Element lässt sich nicht bearbeiten

Dauer-Regler, Trim-Griffe, Bandliste und Entfernen hängen an `element-zeile.tsx` — also an einer
Zeile der **versteckten** Wiedergabeliste (`element-bedienung`, `element-regler`,
`element-griff-anfang`, `element-griff-ende`, `element-band`, `element-entfernen`).
Der Zeitleisten-Block kennt nur *auswählen* (`data-ausgewaehlt`) und *ziehen*.

### L2 — Drei der vier offenen Treiber-Einträge sind Folgen EINER Entscheidung

| Eintrag | Ursache |
|---|---|
| **Befund** „Bandliste des Video-Elements lässt sich öffnen (#453)" — `Knopf=false` | `element-band` liegt in der versteckten Liste; der Treiber klickt `composer-ansicht-liste`, das selbst `display:none` ist |
| **Untersuchung** „Dauer der MP4 (FA-08)" — Anzeige `null` | `wiedergabeliste-laenge` liegt in der versteckten Liste |
| **Untersuchung** „Dauer/Trim-Undo" — „Dauer unverändert (null)" | `element-regler` liegt in der versteckten Liste |

„Mitte raus" (Entscheidung 01.11.2026) hat drei Messpunkte erzeugt. Der vierte offene Eintrag ist
der native Export-Dialog (**MANUELL**, unverändert seit 13.10.2026).

### L3 — Es gibt keinen Inspector für die Auswahl

Ein Klick auf einen Block setzt `data-ausgewaehlt` und sonst nichts. Man sieht, *dass* etwas
gewählt ist, aber nirgends *was* daran einstellbar ist.

### L4 — Die Aktionen-Liste existiert doppelt

Rail (`aktion-<id>`, zum Ziehen in die Zeitleiste) und Aktionen-Reiter (`aktion-bibliothek`,
260 px, zum Bearbeiten). Zwei Listen, zwei Zustände, zwei Scroll-Positionen.

### L5 — Zwei Muster für Editoren

Aktionen- und Vorlagen-Editor sind **Reiter**; der Marken-Editor ist eine **Ansicht über der
Reiterfläche** (#456). Wer einen Editor baut, muss raten, welches Muster gilt.

---

## 3. Was gestrichen gehört

1. **Der Umschalter Zeitleiste/Liste** (`composer-ansicht-zeitleiste`/`-liste`). Zwei Ansichten
   für denselben Gegenstand; eine ist immer verdeckt. Kosten ohne Nutzen.
2. **Die Bibliothek im Aktionen-Editor.** Wenn das Panel Aktionen führt, ist die zweite Liste
   eine zweite Wahrheit.
3. **Der Reiter „Aktionen".** Der Editor wird eine Ansicht über der Fläche, wie der
   Marken-Editor. Danach bleiben drei Reiter: Zusammenstellen, Vorlagen, Projekte.
   *(Größte der drei Streichungen — braucht eine eigene Entscheidung.)*

---

## 4. Der Vorschlag

Ein **Panel**, ausklappbar, mit drei Abschnitten — VS-Code-Muster, aber nur so viele Abschnitte,
wie es Inhalte gibt:

```
┌ Kopf: was ist gewählt?  (leer → sagt, was zu tun ist)
├ Eigenschaften   ← was heute in element-zeile steckt:
│                    Dauer · Trim · Unterbrechungen · Band · Entfernen
├ Reihenfolge     ← die heutige Wiedergabeliste: Position, Thumbnails, Gesamtdauer
└ (Aktionen: nur wenn nichts gewählt ist → Liste zum Bearbeiten)
```

Damit wird die versteckte Liste **wieder erreichbar, ohne einen zweiten Block unter der Bühne zu
brauchen** — genau der Grund, aus dem sie verschwand (Lehre aus #456: wer Höhe ergänzt, muss den
Composer nachmessen). **L1, L2 und L3 gehen damit zu**, ohne Produktlogik zu ändern: die Flächen
existieren, sie werden nur wieder gezeigt und an die Auswahl gebunden.

---

## 5. Die offene Entscheidung (Niklas)

**Platz.** Bei 1440 ist eine Spalte von 300 px unkritisch. Bei 800 passen
240 (Rail) + 520 (Hauptspalte) + 300 (Panel) **nicht** — 1060 px in 784 verfügbaren.

- **A — Panel schiebt:** Es nimmt Breite von der Hauptspalte; bei 800 wird die Bühne schmal,
  bleibt sichtbar. Zwei Zustände (offen/zu), kein Überlappen.
- **B — Panel liegt darüber:** Es legt sich über Bühne und Zeitleiste; links bleibt alles stehen.
  Bei 800 schrumpft nichts, aber es verdeckt.

**Zweite Frage:** Soll der Inspector an die **Auswahl** gekoppelt sein (Klick auf Block → Panel
zeigt genau dieses Element)? Gekoppelt ist VS-Code-fremd, hier aber richtig, weil die Auswahl
schon existiert.

**Nichts davon ist gebaut.**

---

## 6. Die Messung (02.11.2026) — A ist bei 800 nicht baubar

Gemessen am echten Fenster mit einem **temporären 300-px-Platzhalter im DOM** (kein
Produktcode; danach byte-identisch zurückgenommen, Prüfsumme `2bea33c…` des Treibers gleich).
Die Breite 1440 wurde über den **Behälter** simuliert (`#wurzel` auf 1440 px), weil
`window.resizeTo` in Electron nicht greift; das ist zulässig, weil die Flächen ihre Breite vom
Behälter erben (die Bühne misst per `ResizeObserver`, kein `innerWidth`). **Höhe blieb die echte
(572).**

| Behälter | ohne Panel | mit 300-px-Panel |
|---|---|---|
| **1440** | Hauptspalte **1160** | Hauptspalte **852** |
| **800** | Hauptspalte **520** | Hauptspalte **212** |

**Folge:**
- **A (Panel schiebt) ist bei 1440 gut** — 852 px Hauptspalte, die Bühne bleibt brauchbar.
- **A ist bei 800 nicht baubar** — 212 px Hauptspalte; die Bühne wäre ein senkrechter Streifen
  (212 × 280, das Video darin 212 × 119). Genau die Lage, aus der #456 entstand („wer Höhe
  ergänzt, muss den Composer nachmessen" — hier ist es Breite).
- **B (Overlay) lässt alles stehen**, verdeckt bei 800 aber 300 der 520 px Bühne.

Damit ist die Entscheidung keine Geschmacksfrage mehr, sondern hat eine Zahl. Dritte
Möglichkeit, noch nicht geprüft: **das Panel ersetzt bei schmalem Fenster die Rail** (240 → 300,
Hauptspalte 520 → 452) statt daneben zu treten.

---

## 7. ENTSCHEIDUNG (Niklas, 02.11.2026): Panel und Rail sind DASSELBE

> „panel und rail sollten dasselbe sein nur das muss halt expandable und collapsable sein
> ich nenn das sidepanel und du nennst das rail"

**Damit sind A, B und C erledigt.** Es gibt **keine zweite Spalte** und **kein Overlay**: Die
Rail links ist das Sidepanel. Sie kann **auf- und zuklappen** — mehr Zustände braucht es nicht.

Was daraus folgt:

- **Ein Träger für alles, was nicht Bühne oder Zeitleiste ist.** Die Abschnitte der Rail
  (Video, Aktionen) bleiben; **Eigenschaften** (Dauer, Trim, Unterbrechungen, Band, Entfernen)
  und **Reihenfolge** kommen als Abschnitte derselben Spalte hinzu. Damit wird die
  `display:none`-Wiedergabeliste **nicht wieder als eigene Ansicht gebraucht** — ihr Inhalt
  verteilt sich: Ordnung zeigt die Zeitleiste, die Bedienung je Element das Panel.
- **L1, L2 und L3 gehen strukturell zu**, nicht durch eine zweite Fläche: die Bedienung ist
  immer erreichbar, weil die Spalte immer da ist.
- **Der Umschalter Zeitleiste/Liste entfällt** ersatzlos (Streichung 1 aus Abschnitt 3 wird
  damit zwingend).
- **Zugeklappt gewinnt die Bühne** die Breite der Spalte — bei 800 sind das rund 240 px, die
  heute dauerhaft fehlen.

**Offen (kleine Fragen, keine Richtungsentscheidung mehr):**

1. **Zugeklappt = ganz weg oder schmaler Streifen?** (Ein Streifen hält den Einstieg sichtbar;
   ganz weg gibt der Bühne 240 px und braucht einen anderen Weg zurück.)
2. **Aufgeklappt wie breit?** Heute 240 px. Mit Eigenschaften-Abschnitt werden 300–340 px
   nötig sein. Bei 800 bliebe die Hauptspalte dann bei ~420–470 px — **vor dem Bau nachmessen**.
3. **Was klappt auf?** Nur auf Klick, oder automatisch, wenn ein Element gewählt wird (dann
   wäre der Inspector an die Auswahl gekoppelt — Frage aus Abschnitt 5)?

---

## 8. PRÄZISIERUNG (Niklas, 02.11.2026): Leiste statt Zuklappen

> „vielleicht so eine Leiste wie in VS Code zum Ein- und Ausklappen … aber so eine vertikale
> Leiste wie in VS Code wo man zwischen verschiedenen Sidepanels wechseln kann macht mehr Sinn"

**Breite ziehen entfällt.** `expandable/collapsible` im Sinn von „breiter/schmaler" ergibt
keinen Sinn — gebraucht wird eine **schmale senkrechte Leiste** (VS Codes Activity Bar) und
daneben **ein Panel**, dessen Inhalt sie umschaltet.

- **Die Leiste ist immer da** (schmal). Ein Klick auf das **aktive** Symbol klappt das Panel zu
  (VS-Code-Verhalten), ein Klick auf ein anderes Symbol wechselt die Ansicht.
- **Die Panelbreite wird nicht gezogen.** Sie wird einmal festgelegt und **gemessen** — das ist
  Niklas' Punkt 2 („das muss man herausfinden").
- **Zugeklappt bleibt die Leiste**: der Einstieg ist immer sichtbar, kein versteckter Rückweg.

**Vorgeschlagene Ansichten (drei, nicht mehr):**

| Symbol | Ansicht | Inhalt heute |
|---|---|---|
| ▣ | **Video** | Import + Videozeile (`bibliothek`, oberer Teil) |
| ✦ | **Aktionen** | Aktionsliste + „+ Neue Aktion" (unterer Teil) |
| ⚙ | **Eigenschaften** | die Bedienung des GEWÄHLTEN Blocks: Dauer, Trim, Unterbrechungen, Band, Entfernen — heute in `element-zeile` der versteckten Liste |

**Die „Reihenfolge" wird gestrichen** (Streichung aus Abschnitt 3): Die Zeitleiste zeigt die
Ordnung, die Gesamtdauer steht schon in der Statistik am Fuß der Spalte. Eine eigene Liste
dafür wäre eine dritte Anzeige desselben Gegenstands.

**Damit sind die drei Fragen aus Abschnitt 7 beantwortet:**
1. Zugeklappt → **Leiste bleibt**, Panel weg. ✔
2. Breite → **nicht ziehen**, einmal festlegen und messen. ✔
3. Aufklappen → **über die Leiste**; zusätzlich kann die Auswahl eines Blocks automatisch auf
   „Eigenschaften" schalten. **Das ist noch offen.**

**Erster Bau-Schritt (klein und sichtbar):** Leiste + leeres Panel + Umschalten, **ohne Inhalte
umzuziehen** — dann ist die Breite messbar und die Bedienung am Fenster beurteilbar.

---

## 9. Die MESSLATTE (Niklas, 02.11.2026)

> „es muss besser sein für produktwerbung als powerpoint und am besten schneller vom aufwand
> her und das ist es nicht"

**Zwei Bedingungen, nicht eine.** Schönheit genügt nicht: Das Werkzeug muss für Produktwerbung
**besser** sein *und* **weniger Aufwand** kosten als PowerPoint. Heute ist es langsamer, und
zwar aus fünf Gründen, die alle im Code liegen:

1. draggen statt klicken (bei 800 px ein Ziel von wenigen Pixeln),
2. jede Aktion muss von Hand gebaut werden — kein Preset, keine Kopie,
3. zwei Aktionen sind ohne Öffnen nicht unterscheidbar (kein Bild in der Liste),
4. die Folge einer Änderung ist unsichtbar (Gesamtdauer, Bandwiederholungen),
5. das Ergebnis zeigt sich erst nach dem Rendern.

**Der Vorsprung, den PowerPoint nicht hat** (und der heute verschenkt wird): Das Band
**wiederholt sich von selbst** durch das ganze Video, frame-genau bei 30 fps, markengebunden.
In PowerPoint müsste man die Folie zwanzigmal kopieren.

### Was an Effekten mit der vorhandenen Maschine geht

Der Band-Overlay ist heute **statisch**: `overlay=x=0:y=<by>` ohne Zeitausdruck
(`filter-einblendung.ts:258`). Bewegung ist damit kein neuer Motor, sondern ein Parameter —
`overlay` nimmt Ausdrücke in `t` von sich aus.

| Effekt | Aufwand | PowerPoint |
|---|---|---|
| **Band fährt ein/aus** (0,3 s) | klein — `y` als Ausdruck | nein |
| **Motiv atmet** (langsamer Zoom auf dem Produktbild) | klein — `zoompan` | nur als Animation je Folie |
| **Unterbrechung mit Übergang** statt hartem Schnitt | klein — `fade` über 6–8 Frames | nein (anderer Schnitt) |
| **Mehrere Varianten in EINEM Lauf** (3 Angebote, ein Video) | mittel | nein |

**Ehrliche Grenze:** Das Band ist EIN gerendertes Standbild (`standbild.ts`). Bewegung *im*
Band (Text fliegt ein) hieße, eine Bildfolge zu rendern — teuer und langsam. Das Band als
Ganzes zu bewegen ist billig, seinen Inhalt zu animieren nicht. Diese Grenze gehört in die
Entscheidung, nicht in eine Überraschung.

### Der Hebel für „weniger Aufwand"

Nicht mehr Effekte zuerst, sondern **kein Schritt zu viel**: „Ins Video" als Knopf statt Drag ·
Preset beim Anlegen (Vorlage + Marke + Dauer vorbelegt) · „Duplizieren mit neuem Preis" ·
Vorschau an der Abspielmarke statt erst nach dem Rendern.




