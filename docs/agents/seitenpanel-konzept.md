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

