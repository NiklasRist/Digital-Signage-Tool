# Marken-Editor: UI-Konzept (29.10.2026)

**Status: Entscheidungen des Users, kein Bau.** Dieses Dokument ist der Plan, den das Projekt
vor einem Umbau verlangt. Es beschreibt den Zielaufbau, die Reihenfolge der Arbeit und die
Erklärungsschicht — nicht den fertigen Code.

Anlass (User, 29.10.2026, wörtlich): **„das mit den Marken ist besser aber immer noch nicht
übersichtlich. das braucht einfach mehr ui planung"** — nachgefragt nannte er fünf Punkte:
Zuordnung Bild ↔ Box, „ich sehe das Ergebnis nicht", „Reihenfolge der Arbeit",
„nicht klar, welche Option in der Box was macht und warum es die braucht" und
„viel zu klein, es sollte eine eigene Bearbeitungsansicht wie im Projekt-Editor geben".

---

## 1. Stand heute (gemessen, nicht erinnert)

| Befund | Beleg |
|---|---|
| Alles steht in EINER Spalte: Liste, Bild, Palette, Box | `marken-editor/index.tsx:223–226` (zwei Spalten), `:212` Palette, `:213–220` Box |
| Die Box steht **unter der Palette**, nicht beim Element | `index.tsx:212` vor `:213` |
| Die Box ist auf **420 px** begrenzt | `index.tsx` (`maxWidth: 420`) |
| Nur **eine** Vorschau-Vorlage: „Vollbild" | `vorschau-flaeche.tsx:40–47` (`findeVorschauVorlage`) |
| Drei eingebaute Vorlagen existieren | `main/vorlagen-store/eingebaute-vorlagen.ts` — Vollbild, Split, Band-Standard |
| Rollen-Namen sind technisch („Akzent kräftig", „Fläche hell") | `index.tsx` `ROLLE_TEXT`, `SCHRIFT_TEXT` |
| Die Palette trägt die Rollen, die „Vollbild" nicht zeigt | `marken-elemente.ts:121–141` |

**Folge:** Das Bild ist breit, aber die Bedienung liegt darunter und ist beim Arbeiten außer
Sicht; welches Element gerade offen ist, verrät nur ein 1-px-Rahmen im Bild.

---

## 2. Entscheidungen des Users (29.10.2026)

1. **Inspector rechts** statt schwebender Box. Vorbehalt des Users: „kann sein, dass wir das zu
   Box ändern müssen" — der Inspector wird deshalb so gebaut, dass die Box später nur die
   Fläche tauscht, nicht die Logik.
2. **Split entfällt.** Zwei Vorschauen: **Vollbild** und **Band**. Wie weit die Streichung
   reicht (nur die Vorschau oder das ganze Programm), ist offen — s. Abschnitt 7.
3. **Marken-Auswahl als Klappliste mit Suchfeld.**
4. **Die Projektübersicht bekommt ebenfalls eine Suchleiste** — eigener, kleiner Schritt.

---

## 3. Aufbau: drei feste Bereiche

```
┌──────────────────────────────────────────────────────────────────────┐
│ Fitnessworld24   · abgeleitet von „FW24"        [Groß]   [Löschen]   │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                     Vorschau (so groß wie möglich)             │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  [Vollbild] [Band]                          Marke ▾ (Klappliste+Suche)│
├─────────────────────────────────────────────┬────────────────────────┤
│  Reihenfolge der Arbeit (wenn nichts       │  INSPECTOR             │
│  ausgewählt ist)                            │  ────────────          │
│  1 Logo            ✓                        │  ÜBERSCHRIFT           │
│  2 Flächen         ✓                        │  Schrift [▾]           │
│  3 Überschrift     …                        │  Farbe   [■]           │
│  4 Preis/Button                             │  Wofür: …              │
│  5 Verlauf                                  │                        │
│  6 Sicherheitsabstand  ⚠                    │                        │
└─────────────────────────────────────────────┴────────────────────────┘
```

- **Der Inspector** zeigt immer das ausgewählte Element: Name oben, darunter nur dessen
  Regler. Klick ins Bild oder in die Reihenfolge wählt es; das Bild markiert es sichtbar
  (kräftiger Rahmen, nicht 1 px gestrichelt).
- **`[Groß]`** klappt Kopf und Inspector weg — das Bild nimmt den Reiter. Das ist die Antwort
  auf „zu klein", ohne die Bedienung zu verlieren.
- **Die Palette entfällt.** Ihre Aufgabe („Rollen, die die Vorschau nicht zeigt") übernimmt
  die Erklärungsschicht: Jede Rolle steht im Inspector, auch die unsichtbaren — mit dem
  Vermerk, dass sie in keiner Vorschau erscheint.

---

## 4. Reihenfolge der Arbeit

Wenn nichts ausgewählt ist, zeigt der Inspector die Reihenfolge, nicht ein leeres Feld:

| # | Schritt | Was er setzt |
|---|---|---|
| 1 | Logo | Logo-Bild oder Ersatz durch den Markennamen |
| 2 | Flächen | `flaecheDunkel`, `flaecheSehrDunkel`, `flaecheHell` |
| 3 | Text | Schriften und Textfarben von Überschrift und Beschreibung |
| 4 | Preis und Button | `akzent`, `flaecheHell`, `textAufHell` |
| 5 | Verlauf | `scrimStart`, `scrimEnde` |
| 6 | Sicherheitsabstand | `sicherheit.horizontal/vertikal`, mit der bestehenden Kontrast-/Vorlagenwarnung |

Ein Fortschritt wird **nur dort** angezeigt, wo er ehrlich berechenbar ist: Logo vorhanden,
Slogan gesetzt, Sicherheitsabstand ungleich 0, Kontrastwarnung aktiv. Eine Farbe ist immer
„gesetzt" — ein Häkchen dafür wäre eine Lüge.

---

## 5. Erklärungsschicht (`rollen-texte.ts`)

Jede Farb- und Schriftrolle bekommt **einen Namen und einen Satz**, was sie tut und wo man sie
sieht. Nicht als Tooltip, sondern sichtbar unter dem Regler.

| Rolle | Satz |
|---|---|
| `flaecheHell` | „Grund des Buttons. Der Text darauf ist ‚Text auf heller Fläche'." |
| `akzent` | „Fläche der Preis-Pille. Fällt im Segment zuerst auf." |
| `textAufDunkel` | „Schriftfarbe auf Hintergrund und Verlauf." |
| `linie` | „Trennlinien. Erscheint in keiner der beiden Vorschauen." |
| `akzentKraeftig` | „Für eigene Vorlagen. In diesem Projekt nicht sichtbar." |

Regel: **Kein Regler ohne Satz.** Der Satz nennt die Rolle, ihren Ort und — wenn sie nirgends
erscheint — genau das.

---

## 6. Dateiplan

**Neu**
- `marken-editor/inspector.tsx` — die rechte Spalte (Element oder Reihenfolge).
- `marken-editor/rollen-texte.ts` — `{ name, zweck }` je Farb- und Schriftrolle, eine Quelle.
- `marken-editor/auswahl.ts` — Klappliste + Suche (reine Filterfunktion, getestet).

**Umbau**
- `marken-editor/index.tsx` — drei Bereiche statt einer Spalte; Palette und Box entfallen.
- `marken-editor/vorschau-flaeche.tsx` — Vorlage als Prop statt fest „Vollbild"; zwei
  Vorschauen.

**Unverändert**
- `marken-elemente.ts` (Zonen → Elemente, #449) und `elementBeiPunkt`.
- `zeichneMarkenVorschau` und alle Marken-Operationen (`setzeFarbe`, `setzeSchrift`, Import).

---

## 7. Offen — vor dem Bau zu entscheiden

1. **Reichweite der Split-Streichung.** Drei Stufen:
   - (a) Nur die Vorschau im Marken-Editor zeigt kein Split mehr — folgenlos.
   - (b) Die eingebaute Vorlage „Split" entfällt; bestehende Projekte behalten ihre Bänder.
   - (c) Split verschwindet ganz: Vorlage **und** `split.tsx`/`split-stile.ts` **und** der
     Abschnitt TK 9.2.8 **und** eine Migration für Projekte, die Split-Bänder tragen.
   Stufe (c) ist eine Anforderungsänderung mit AD/TK-Nachtrag, kein UI-Schritt.
2. **Inspector oder Box** — wird nach dem ersten Bau am Fenster entschieden; der Umbau hält
   beides offen.
3. **`[Groß]`** — gewünscht oder reicht der größere Reiter?
