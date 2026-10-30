## Ziel (in einem Satz)

Der Marken-Editor wird zu **drei festen Bereichen** – Kopfzeile, große Vorschau mit Vorlagen-Umschalter, Reihenfolge der Arbeit plus Inspector –; die Palette und die schwebende Box entfallen, und **jeder Regler trägt einen Satz**, der sagt, was er tut und wo man ihn sieht.

## Modul & Datei

- Modul: `marken-editor` (Renderer)
- **Neu**
  - `src/renderer/marken-editor/inspector.tsx`
  - `src/renderer/marken-editor/rollen-texte.ts`
  - `src/renderer/marken-editor/auswahl.ts`
- **Umbau**
  - `src/renderer/marken-editor/index.tsx`
  - `src/renderer/marken-editor/vorschau-flaeche.tsx`
- **Treiber**
  - `scripts/durchlauf.mjs` (Schritt 4m erweitern)
- **Unverändert** (nur aufrufen, nicht ändern)
  - `marken-elemente.ts`, `live-vorschau.ts` (`zeichneMarkenVorschau`), `marken-uebersicht.ts`,
    alle Marken-Operationen (`setzeFarbe`, `waehleUndImportiereSchrift`, `waehleUndImportiereLogo`,
    `entferneLogo`, `setzeSlogan`, `setzeSicherheitsabstand`, `setzeFeldAufGeerbt`)
- Vertrag: Technisches Konzept **9.15.2**, **9.11.1**, **9.11.2**, **9.10.1**
- Prozess/Speicher: V2 (app-weit), kein Projektbezug

## Warum das im Gesamtsystem wichtig ist

Der Editor ist die **einzige** Stelle, an der Farben und Schriften einer Marke entstehen; jede
Vorlage verweist nur auf Rollen (9.11.1 Punkt 7). Solange der Nutzer nicht erkennt, **welcher**
Regler **welche** Fläche im Bild ändert, bleibt jede Marke Zufall – und der Befund vom 29.10.2026
lautete wörtlich: „das mit den marken ist untestbar weil die ui so scheiße ist und ich nicht
verstehe was was ist." Der Umbau ist die Antwort darauf; er ändert **kein** Verhalten der
Marken-Operationen, sondern nur die Oberfläche, über die sie erreicht werden.

**Vorgänger:** #449 hat die Elemente aus den Zonen gebaut (`marken-elemente.ts`) und dazu eine
schwebende Box und eine Palette. Dieses Issue **behält die Elemente** und **ersetzt** Box und
Palette durch Inspector und Erklärungsschicht. Der Plan steht in
[`docs/agents/marken-editor-ui-2026-10-29.md`](marken-editor-ui-2026-10-29.md).

## Signatur (verbindlich – NICHT ändern)

Für die zwei **reinen** Module (kein JSX, kein IPC, kein DOM). Der `inspector.tsx` ist ein
Bauteil ohne eigene Fachlichkeit; seine Props leiten sich aus dem Seitenzustand ab und stehen
deshalb nicht hier.

```ts
// rollen-texte.ts – die EINE Quelle für Namen und Erklärung je Rolle
import type { FarbRolle, SchriftRolle } from '../../shared/contracts/marke'

export interface RollenText {
  /** Anzeigename, z. B. „Fläche hell". */
  name: string
  /** Ein Satz: was die Rolle tut und wo man sie sieht. Leerzeichen-getrennt, ein Satz. */
  zweck: string
}

export function farbRollenText(rolle: FarbRolle): RollenText
export function schriftRollenText(rolle: SchriftRolle): RollenText
```

```ts
// auswahl.ts – die Marken-Auswahl als Klappliste mit Suche
import type { Marke } from '../../shared/contracts/marke'

/**
 * Filtert den Markenbestand nach Name. Leerer Suchtext liefert den Bestand UNVERÄNDERT
 * (dieselbe Referenz). Gross/Klein zählt nicht, umschliessende Leerzeichen zählen nicht,
 * Umlaute werden NICHT gefaltet. Reihenfolge bleibt die des Bestands.
 */
export function filtereMarken(marken: readonly Marke[], suchtext: string): readonly Marke[]
```

## Aufbau: drei feste Bereiche

```
┌──────────────────────────────────────────────────────────────────────┐
│ Fitnessworld24 · abgeleitet von „FW24"                 [Groß] [Löschen]│
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                 Vorschau (so groß wie möglich)                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  [Ganzflächig] [Zwei Spalten] [Band]        Marke ▾ (Klappliste+Suche)│
├─────────────────────────────────────────────┬────────────────────────┤
│  Reihenfolge der Arbeit                     │  INSPECTOR             │
│  (nur wenn nichts ausgewählt ist)           │  ─────────             │
│  1 Logo            ✓                        │  ÜBERSCHRIFT           │
│  2 Flächen                                  │  Schrift [▾]           │
│  3 Text                                     │  Farbe   [■]           │
│  4 Preis und Button                         │  Wofür: …              │
│  5 Verlauf                                  │                        │
│  6 Sicherheitsabstand  ⚠                    │                        │
└─────────────────────────────────────────────┴────────────────────────┘
```

- **Kopfzeile:** Markenname, bei abgeleiteten Marken „abgeleitet von „<Parent>"", die Knöpfe
  **`[Groß]`** und **`[Löschen]`**. Die bestehenden Lösch-Wege (`loeschen-vorwarnung.ts`,
  `marken-loesch-blockiert`, `loeschengesuch`) bleiben unverändert und ziehen nur hierher.
- **`[Groß]`** blendet Kopfzeile, Reihenfolge und Inspector aus; die Vorschau nimmt den Reiter.
  Ein zweiter Druck stellt alles wieder her. Der Zustand ist flüchtig und wird nicht gespeichert.
- **Vorschau-Umschalter:** genau drei Vorlagen, gefunden **über die ID** – `vollbild`
  („Ganzflächig"), `split` („Zwei Spalten"), `band-standard` („Band-Standard"). Die Anzeigenamen
  sind Präsentation; maßgeblich ist die ID (TK 9.11.4).
- **Reihenfolge der Arbeit** steht im Inspector, solange nichts ausgewählt ist. Ein Klick auf einen
  Schritt wählt das zugehörige Element (oder die Rolle).
- **Palette entfällt.** Ihre Aufgabe übernimmt der Inspector: er führt **alle** Rollen, auch die,
  die in der aktuellen Vorschau nirgends erscheinen – mit dem Vermerk „in dieser Vorschau nicht
  sichtbar".

## Reihenfolge der Arbeit (sechs Schritte, fest)

| # | Schritt | Was er setzt |
|---|---|---|
| 1 | Logo | Logo importieren/entfernen, Ersatz-Logo (Markenname), Slogan |
| 2 | Flächen | `flaecheDunkel`, `flaecheSehrDunkel`, `flaecheHell` |
| 3 | Text | Schriften und Textfarben von Überschrift und Beschreibung |
| 4 | Preis und Button | `akzent`, `flaecheHell`, `textAufHell` |
| 5 | Verlauf | `scrimStart`, `scrimEnde` |
| 6 | Sicherheitsabstand | `sicherheit.horizontal/vertikal` mit der bestehenden Vorlagenwarnung |

**Fortschritt nur, wo er ehrlich berechenbar ist:** Logo vorhanden, Slogan gesetzt,
Sicherheitsabstand ungleich 0, Kontrastwarnung aktiv. Eine Farbe ist **immer** gesetzt – ein
Häkchen dafür wäre eine Lüge.

## Erklärungsschicht: kein Regler ohne Satz

Jede Farb- und Schriftrolle bekommt in `rollen-texte.ts` **einen Namen und einen Satz**. Der Satz
steht **sichtbar unter dem Regler**, nicht als Tooltip. Er nennt die Rolle, ihren Ort im Bild und –
wenn sie in der aktuellen Vorschau nirgends erscheint – genau das.

Beispiele (verbindlich im Ton, nicht im Wortlaut):

| Rolle | Satz |
|---|---|
| `flaecheHell` | „Grund des Buttons. Der Text darauf ist ‚Text auf heller Fläche'." |
| `akzent` | „Fläche der Preis-Pille. Fällt im Segment zuerst auf." |
| `textAufDunkel` | „Schriftfarbe auf Hintergrund und Verlauf." |
| `linie` | „Trennlinien. Erscheint in keiner der drei Vorschauen." |

## Bedienung → Wirkung

| Eingang | Wirkung |
|---|---|
| Klick auf eine Zone im Bild | wählt genau dieses Element; der Inspector zeigt seine Werte |
| Klick in die Reihenfolge | wählt dasselbe Element wie der Klick im Bild |
| Klick auf ein anderes Element | wechselt die Auswahl, es ist **immer nur eine** offen |
| Klick auf freie Fläche / ins Leere | hebt die Auswahl auf; der Inspector zeigt die Reihenfolge |
| ESC | hebt die Auswahl auf |
| Marke wechseln | Auswahl wird aufgehoben; die Vorschau zeichnet die neue Marke |
| Feld ändern und verlassen | schreibt über die **bestehende** Operation; die Auswahl bleibt stehen |

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)

- „**Rollen sind fest, Werte frei.** Der Editor kann **keine** Rollen hinzufügen oder entfernen –
  die Farb- und Schrift-Rollen aus 9.11.2 sind der Vertrag, auf den **jede** Vorlage verweist
  (9.11.1 Punkt 7)." (TK 9.15.2)
- „**Bei einer abgeleiteten Marke ist sichtbar, was geerbt und was eigen ist.**" (TK 9.15.2) –
  die bestehende Herkunftszeile bleibt an jedem Regler.
- „Der Editor rechnet **nichts** aus." (TK 9.15.2, zur Herkunft) – geerbt/eigen kommt aus
  `Marke.herkunftJeFeld`, nie aus einem Feldvergleich.
- „**Invariante:** Es gibt **keinen zweiten Zeichenpfad.** Anzeige und Export stammen immer aus
  **demselben** Aufruf – sonst driften Vorschau und Endvideo auseinander." (TK 9.10.1) – die
  Vorschau zeichnet weiter ausschließlich über `zeichneMarkenVorschau`.
- „**Löschen fragt vorher.**" (TK 9.15.2) – die drei Listen und der Hinweis auf den Reiter
  Projekte bleiben vollständig.
- Die Vorschau zeichnet **1920×1080** native; skaliert wird **nur per CSS** (TK 9.10.3).

## Fehlerpfade

| Situation | Verhalten |
|---|---|
| Marken-Bestand nicht geladen | bestehender Hinweis + Knopf „Marken laden" (`marken-lade`) |
| Vorschau-Vorlage nicht gefunden | sichtbarer Hinweis im Vorschaubereich, **kein** leeres Bild ohne Text |
| Vorschau nicht darstellbar (Zeichenwurf) | bestehender Hinweis `marken-vorschau-hinweis` mit der Meldung |
| keine Marke ausgewählt | Inspector zeigt die Reihenfolge, nicht ein leeres Feld |

## Nicht selbst entscheiden – STOPP und fragen

- **Die Vollflächen-Zone `hintergrund` (0,0,1920,1080) fängt jeden Klick im Bild ab.** Solange sie
  eine Klickfläche hat, gibt es kein „Klick ins Leere". Zwei Wege stehen offen – **nicht wählen**:
  (A) sie bleibt Klickfläche, dann hebt nur ESC oder ein anderes Element die Auswahl auf;
  (B) sie verliert die Klickfläche, `flaecheDunkel` steht dann nur im Inspector.
- **`[Groß]`** ist am 30.10.2026 mit „ich weiß nicht, was das heißt" quittiert worden. Gebaut wird
  er; über seinen **Verbleib** entscheidet das Fenster, nicht der Agent.
- Ob die Marken-Auswahl als Klappliste **über** der Vorschau oder in der Kopfzeile sitzt – der Plan
  zeigt sie unten rechts; wenn sie dort die Vorschau drückt, **fragen** statt schieben.

## Definition of Done

- [ ] Kopfzeile mit Name, Herkunft, `[Groß]`, `[Löschen]`; `[Groß]` blendet Kopfzeile und Inspector
      aus und wieder ein
- [ ] Genau **drei** Vorschauen, über die **ID** gefunden; jede zeichnet 1920×1080 nativ über
      `zeichneMarkenVorschau`
- [ ] Die mittlere Feldliste, die **Palette** und die **Box** existieren nicht mehr
      (`marken-palette`, `marken-box` kommen im Quelltext nicht mehr vor)
- [ ] Klick auf eine Zone wählt genau ein Element; der Inspector zeigt dessen Werte; ESC und Klick
      ins Leere heben die Auswahl auf (Weg A oder B, s. STOPP)
- [ ] Jeder Regler trägt sichtbar seinen Satz aus `rollen-texte.ts`; alle 13 Farb- und alle
      Schriftrollen sind erreichbar
- [ ] Fortschritts-Häkchen nur für Logo, Slogan, Sicherheitsabstand und Kontrastwarnung
- [ ] Herkunftszeile und Kontrastwarnung bleiben sichtbar
- [ ] Marken-Auswahl ist eine Klappliste mit Suchfeld (`filtereMarken`, rein geprüft)
- [ ] Treiber 4m bleibt grün und wird erweitert: Zone anklicken → Inspector zeigt ihren Namen;
      Vorlage umschalten → Canvas bleibt 1920×1080
- [ ] Unit-Tests: `rollen-texte` (jede Rolle liefert Namen und Satz, unbekannte Rolle wirft nicht),
      `filtereMarken` (leer = dieselbe Referenz, Name, Gross/Klein, Umlaute nicht gefaltet),
      Auswahl-Zustand (öffnen/wechseln/schliessen)
- [ ] Keine Datei außerhalb der oben genannten geändert

## Abhängigkeiten

- Blockiert von: nichts (die Marken-Operationen und `marken-elemente.ts` stehen)
- Blockiert: die Abnahme von #449 (dieses Issue **ersetzt** dessen Box- und Palettenteil)

## Bezug

FA-24, TK 9.15.2, TK 9.11.1, TK 9.11.2, TK 9.11.4, TK 9.10.1, TK 9.10.3, #449, #303
Plan: [`docs/agents/marken-editor-ui-2026-10-29.md`](marken-editor-ui-2026-10-29.md)
