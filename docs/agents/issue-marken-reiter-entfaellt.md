## Ziel (in einem Satz)

Der Reiter **[Marken] entfällt**; der Marken-Editor wird über die **Projektleiste** des geöffneten Projekts geöffnet und arbeitet mit dem Projekt als Kontext – der Marken-**Bestand** bleibt app-weit.

## Modul & Datei

- Modul: `app-shell` (Renderer), `marken-editor` (Renderer)
- **Umbau**
  - `src/renderer/app-shell/rahmen.tsx` (vier Reiter, Projektleiste, Ansicht „Marken")
  - `src/renderer/app-shell/inhalte.tsx` (Marken-Inhalt bekommt `projektId` und einen Rückweg)
  - `src/renderer/marken-editor/index.tsx` (Einstieg mit Projekt-Kontext, „Zurück zum Projekt")
- **Neu**
  - `src/renderer/app-shell/projektleiste.tsx`
- **Treiber**
  - `scripts/durchlauf.mjs` (4a0, 4m, 4m2 über die Projektleiste)
- Vertrag: Technisches Konzept **9.14.1**, **9.14.2**, **9.15.2** (Fassung **v3.32**), Anforderungsdokument **4.8** (v1.11)
- Prozess/Speicher: V2 (app-weit), D1 (Projekt nur gelesen)

## Warum das im Gesamtsystem wichtig ist

Marken wurden bisher an einer Stelle bearbeitet, die keinem Projekt gehört – der Nutzer musste zwischen
Reitern springen, um zu sehen, **wo** eine Marke wirkt. Mit dem Einstieg über die Projektleiste steht
beim Bearbeiten fest, **welche Aktionen dieses Projekts** die Marke tragen. Der **Bestand** bleibt
davon unberührt: `marken.json` ist app-weit (TK 9.15.1), eine Marke darf von **n** Projekten genutzt
werden, und eine Änderung an ihr wirkt überall. Es gibt **keine Migration** – am Datenformat ändert
sich nichts.

## Signatur (verbindlich – NICHT ändern)

```ts
// global.tsx / inhalte.tsx – der Marken-Inhalt bekommt den Projekt-Kontext
export interface MarkenEditorWurzelProps {
  sichtbar: boolean
  marken: MarkenZugang
  vorlagen: VorlagenZugang
  /** NEU (v3.32): das geöffnete Projekt – Kontext für „welche Aktionen tragen die Marke". */
  projektId: string
  /** NEU (v3.32): Rückweg in den Reiter, aus dem der Editor geöffnet wurde. */
  aufZurueck: () => void
}
```

```ts
// projektleiste.tsx (neu)
export interface ProjektleisteProps {
  projektName: string
  standardMarkeId: string
  /** Der app-weite Bestand für die Auswahl (nur lesend, kein `lade()` von hier). */
  markenUebersicht: readonly { id: string; name: string }[]
  aufStandardMarke: (markeId: string) => void
  aufMarken: () => void
}
export function Projektleiste(props: ProjektleisteProps): JSX.Element
```

## Aufbau

```
┌─ [Zusammenstellen] [Aktionen] [Vorlagen] [Projekte] ──────────────────────┐
│ ┌─ Projektleiste (nur bei geöffnetem Projekt) ──────────────────────────┐ │
│ │ <Projektname> · Standardmarke [ … ▾]                        [Marken] │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│   Der gewählte Reiter nutzt die ganze Fläche.                             │
└───────────────────────────────────────────────────────────────────────────┘
```

- **[Marken]** öffnet den Editor **über** dem Reiter (Ansicht der Shell, kein fünfter Reiter).
  Die Reiterleiste bleibt bei vier; `reiter-marken` existiert nicht mehr.
- **Zurück:** ein Knopf im Editor führt in den Reiter zurück, aus dem er geöffnet wurde.
- **Ohne geöffnetes Projekt** zeigt die Leiste den Hinweis „Öffne ein Projekt" statt eines Knopfes.
- Die **Projektleiste steht in jedem Reiter** – der Einstieg hängt nicht vom gerade offenen Reiter ab.

## Was ausdrücklich BLEIBT

- **Der Wechsel der Projekt-Standardmarke bleibt in der Projektverwaltung** (TK 9.14.3) und muss
  **ohne geöffnetes Projekt** möglich sein: Er ist der Ausweg aus der Lösch-Sperre einer Marke
  (TK 9.15.1). Die Projektleiste ruft **dieselbe** Operation `setzeStandardMarke` – kein zweiter
  Schreibweg.
- Der Marken-**Bestand** bleibt app-weit (V2); es wird **nichts migriert**.
- Alle Marken-Operationen (`setzeFarbe`, `waehleUndImportiereSchrift`, …) bleiben unverändert.

## Verbindliche Invarianten (wörtlich – Verletzung = Issue nicht erfüllt)

- „**Der Marken-Editor hängt am Projekt (v3.32).** Er ist **kein Reiter** mehr und ohne geöffnetes
  Projekt **nicht erreichbar** – die Projektleiste (9.14.1) trägt den Einstieg." (TK 9.14.2)
- „Der **Bestand** bleibt davon unberührt: `marken.json` (V2) ist app-weit, und eine Marke darf von
  **n** Projekten genutzt werden." (TK 9.15.2)
- „**Die Warteschlangen-Leiste ist in *jedem* Reiter sichtbar.**" (TK 9.14.2) – die Projektleiste darf
  sie nicht verdrängen.
- „**Ein Reiterwechsel verwirft nie Arbeit.**" (TK 9.14.2) – der Weg in den Editor und zurück
  verliert keine Eingabe.
- „**Der Marken-Wechsel setzt kein geladenes Projekt voraus.**" (TK 9.14.3) – bleibt unberührt.

## Fehlerpfade

| Situation | Verhalten |
|---|---|
| kein Projekt geöffnet | Leiste zeigt „Öffne ein Projekt", **[Marken]** nicht klickbar |
| Projekt beschädigt (nicht öffenbar) | Leiste erscheint nicht (das Projekt ist nicht offen) |
| Marken-Bestand nicht geladen | Editor zeigt den bestehenden Hinweis + „Marken laden" |
| Standardmarke wechseln schlägt fehl | bestehende Meldung der Operation, kein stiller Fehlschlag |

## Nicht selbst entscheiden – STOPP und fragen

- Ob der Editor als **eigene Ansicht über dem Reiter** oder als **Dialog** erscheint – der Plan sagt
  „über dem Projekteditor"; wenn die Live-Vorschau dadurch kleiner wird als heute, **fragen**.
- Ob die Projektleiste auch die **Aktionszahl** oder andere Projekt-Kennzahlen zeigt. Vorschlag: nein
  (eine Zeile, kein Armaturenbrett).
- Was passiert, wenn das Projekt **während** der Editor offen ist, gewechselt wird (Vorschlag: Editor
  schließt, Auswahl fällt weg).

## Definition of Done

- [ ] Vier Reiter; `reiter-marken` kommt im Quelltext nicht mehr vor
- [ ] Projektleiste über jedem Reiter, solange ein Projekt offen ist: Name, Standardmarke, `[Marken]`
- [ ] Standardmarke in der Leiste ruft `setzeStandardMarke` – genau ein Schreibweg
- [ ] `[Marken]` öffnet den Editor mit `projektId`; „Zurück" führt in den vorigen Reiter
- [ ] Der Editor zeigt, **welche Aktionen dieses Projekts** die Marke tragen (aus `pruefeMarkenReferenzen`)
- [ ] Ohne Projekt: Hinweis statt Knopf; kein leerer Editor erreichbar
- [ ] Warteschlangen-Leiste bleibt in jedem Reiter sichtbar
- [ ] Treiber 4a0/4m/4m2 laufen über die Projektleiste; `reiter-marken` wird nirgends mehr geklickt
- [ ] Unit-Tests: Leiste (Name, Marken-Auswahl, ohne Projekt), Reiter-Menge = 4, Editor-Aufruf mit `projektId`
- [ ] Keine Datei außerhalb der oben genannten geändert

## Abhängigkeiten

- Blockiert von: nichts (#455 ist gebaut)
- Blockiert: die Abnahme des Marken-Editors

## Bezug

FA-23, FA-24, AD 4.8 (v1.11), TK 9.14.1, 9.14.2, 9.14.3, 9.15.1, 9.15.2 (v3.32), #455
