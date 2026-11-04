# Übergabe 04.11.2026 — Aktions-Editor umgebaut (neunundvierzigste Sitzung)

**Auftrag (Niklas, 04.11.2026):** *„der aktionseditor muss stark überarbeitet werden. und allgemein
der gesamte core flow"*. Entschieden wurde in drei Fragen, alle nach meinem Vorschlag:

1. **Ein Speichermodell** — alles ist Entwurf, „Fertig" schreibt **einmal**; ein Undo-Schritt je
   Bearbeitung statt je Feld (ändert TK 9.13.1 in der Granularität, nicht im Verfahren).
2. **Die Bibliothek wird ein Bildstreifen** (96 → 108 px, nur Motive, „+ Neue Aktion" im Kopf).
3. **„Fertig & ins Video"** als zweiter Abschluss — der Editor beauftragt das Platzieren, der
   Composer führt es aus (TK 9.8.1 sagte bis heute das Gegenteil: „platziert nicht in die Liste").

## Was gebaut ist

**Aufbau** (`action-editor/index.tsx`, 823 → ~900 Zeilen, aber anders geschnitten):

- **Kopfleiste**: ← Zurück · Titelfeld · [Fertig & ins Video] [Anlegen/Fertig]. Die zweite Leiste in
  `App.tsx` („Zurück zum Projekt" in einem eigenen Streifen) ist **entfallen** — zwei Leisten
  übereinander kosteten Höhe und trennten den Knopf von dem, was er speichert.
- **Bildstreifen 108 px** statt Textliste 260 px: je Aktion das gezeichnete Motiv, Auswahl blau,
  kaputt rot, Titel linksbündig darunter, „+“ oben. Das Motiv kommt aus
  **`gemeinsam/aktions-motiv.ts`** (verschoben aus `composer/aktions-vorschau.ts`) — der Editor darf
  den Composer nicht importieren, und zwei Mal dieselbe Verkleinerung wäre eine zweite Bildquelle.
- **Inspector 340 px** mit fünf nummerierten Schritten: Vorlage (Kacheln zu **zweit** à 150 px),
  Inhalt, Bild, Farbe, Dauer. Vorher acht Blöcke untereinander; „5. Dauer" lag unter der Kante.
- **Bühne**: die Vorschau ist jetzt **mittig**; vorher hing sie oben, darunter blieben 220 px leer.
  Das Bühnenfeld ist selbst ein Flex-Container — `height: 100%` am Kind greift in einer Spalte mit
  `flex: 1` nicht.

**EIN Speichermodell** (`action-editor/aktions-entwurf.ts`, neu, rein):

- Jedes Feld schreibt in den Entwurf, **kein IPC**. Die Vorschau zeichnet den **Entwurf** — auch im
  Modus „bestehend" (das konnte `template-canvas` seit `AktionsInhalt`, Sitzung 43; genutzt wurde es
  nur im Modus „neu").
- Geschrieben wird an **drei** Stellen, je einmal: Abschluss („Fertig"/„Anlegen"), Wechsel auf eine
  andere Aktion, Verlassen der Ansicht. Ohne Änderung wird **nicht** geschrieben (`unterschiede`).
- **Rückweg von außen**: Reiterklick und das Öffnen einer anderen Ansicht schließen die Ansicht von
  `rahmen.tsx` aus. Deshalb meldet der Editor einen **Wächter** an
  (`setzeSchliessenWaechter` in `gemeinsam/aktionen-ansicht.ts`): er schreibt und schließt dann
  selbst; scheitert das Schreiben, bleibt die Ansicht offen mit Meldung.

**„Fertig & ins Video"** (`gemeinsam/aktion-ins-video.ts`, neu):

- Der Editor legt einen Auftrag ab und schließt sich; der Composer hört zu und ruft
  `fuegeAktionInsVideo` (denselben Weg wie der Knopf „Ins Video"). Der Auftrag gilt genau einmal.
- Ohne angelegte Aktion (leerer Titel) sagt der Editor, dass es nichts zu platzieren gibt.

**Entfallen**: `weiseBildZu`, `entferneBild` (die Prüfung lebt als `pruefeBildWahl` weiter),
der Bild-Schreibweg, die Leiste in `App.tsx`, der Feld-für-Feld-Schreibweg.

## Belege

- **Treiber `4g9` (neu):** `{"geklickt":true,"aktion":true,"unterbrechungen":"0 -> 1","ansichtZu":true,"dauerMs":4273}`
  — der zweite Abschluss schreibt die Aktion, legt sie als **Unterbrechung** an und schließt die
  Ansicht. Das ist der erste Beleg für den neuen Fluss am Fenster.
- **`4g` neu geschrieben:** „Anlegen" schließt die Ansicht **selbst** (vorher klickte der Treiber
  danach „Zurück"); Titel nach **4019 ms** im `project.json`, Aktionen 1 → 2.
- **`4g3`:** der Titel wird über „Fertig" geschrieben (4265 ms), nicht mehr beim Verlassen des Feldes.
- **`4q`:** die neue Aktion steht in der **Streifen**liste (Testid `aktion-strip-<id>`), nicht mehr
  in `aktion-bibliothek li`.
- **Gate:** Typecheck 0 (auch tests), ESLint/oxlint 0, Build 0, Unit **5490/5490** (365 Dateien),
  Integration **51/51** (13), Treiber **0 Befunde** (1 Untersuchung: Mehrfachauswahl; 1 MANUELL:
  Export-Dialog).
- **Neu geprüft:** `aktions-entwurf.spec.ts` (7 Fälle, rein), `aktion-ins-video.spec.ts` (4 Fälle),
  `pruefeBildWahl` (6 Fälle, ersetzt die `weiseBildZu`/`entferneBild`-Fälle).

## Befund BEHOBEN — das gemerkte Projekt öffnete nicht (FA-15)

**Am laufenden Fenster reproduziert (04.11.2026):** Beim Start öffnete der Main das gemerkte Projekt
(`öffneProjekt`, samt Aufräumlauf — im Log sichtbar), aber `bootstrap.ts:159` schob es über
`projektRoh.setzeProjekt(...)` in die Sicht, und `composer/projektzustand.ts:239` **wies das ab**,
solange kein `ladeProjekt` gelaufen war („setzeProjekt ohne geladenes Projekt"). `ladeProjekt` ruft
nur `projekt-verwaltung/anlegen-oeffnen.ts:84` — also **nur ein Klick in der Projektliste**.
Folge: Nach einem Neustart stand die App auf „kein Projekt", obwohl der Main es geöffnet hatte.

**Warum die Tests grün blieben:** `bootstrap-ablauf.spec.ts` prüfte `setzeProjekt` gegen ein
**Doppel**, das jede Eingabe annimmt — die Sperre im echten Store wurde nie berührt. Eine grüne
Suite war hier eine Aussage über den Test, nicht über das Produkt.

**Behoben:** `composer/projektzustand.ts` hat jetzt `uebernimmGeoeffnetesProjekt(projekt)` — ein
**benannter** Weg für genau den Fall „der Main hat geöffnet und aufgeräumt". Der Bootstrap benutzt
ihn (`bootstrap.ts`), die Sperre auf `setzeProjekt` bleibt unverändert (9.7.4: kein zweiter Einstieg
in den geladenen Zustand). Der Zugang `ProjektZugang` trägt die Funktion; die Hülle reicht sie durch
(kein Schnappschuss fürs Öffnen).

**Beleg am Fenster:** `node scripts/schau.mjs …` startet die **gebaute** App und meldet
`Projekt beim Start offen: true`. Vorher — mit **derselben** `config.json` — blieb die App leer.
Neu: `uebernimmGeoeffnetesProjekt`-Tests in `projektzustand.spec.ts` (2 Fälle, gegen den ECHTEN
Store) und die Bootstrap-Reihenfolge prüft jetzt `roh/uebernimmGeoeffnetesProjekt` und
`nicht roh/setzeProjekt`.

## Werkzeug: `scripts/schau.mjs`

Weil ein Bildschirmfoto des Desktops nur hilft, solange das Fenster vorn ist (und Klicks von außen an
fehlenden Bedienungshilfen scheitern), startet dieses Werkzeug die **gebaute** App über CDP — derselbe
Weg wie der Treiber —, öffnet das gemerkte Projekt, optional den Aktions-Editor, und legt einen
Screenshot ab. `--gross` setzt den Viewport auf 1440 × 900 und gibt die **Maße** der drei Flächen aus:
`{"buehne":{"w":952,"h":748},"canvas":{"y":216,"h":534},"streifen":{"w":108},"inspector":{"w":340}}` —
der Canvas-Mittelpunkt (483) liegt auf dem der Bühne (484), die Vorschau sitzt also **mittig**.

## Ehrlich offen

- Die **Breiten** der neuen Spalten sind jetzt bei 1440 × 900 gemessen (952 / 340 / 108); bei
  **800 × 572** bleibt der Inspector bei 340 px = 42 % der Breite — dort sind „4. Farbe" und
  „5. Dauer" nur nach Scrollen sichtbar (am Bild gesehen, nicht als Fehler eingestuft: das Fenster
  ist die Stressgröße des Treibers, nicht die Arbeitsgröße).
- Der **Band-Motiv**-Fall im Streifen ist mit `object-fit: cover` gelöst (1920 × 162 wäre bei 108 px
  ein 9-px-Streifen). Sichtbar ist der linke Teil mit dem Logo — bewusst beschnitten, nicht verzerrt.
- **Kern-Flow ist erst begonnen.** Der nächste Schritt ist die **Vorschau im Video-Kontext** (die
  Aktion im laufenden Video sehen) — dafür fehlt jede Messung und jede Entscheidung.

## Nicht gepusht

**51 Commits** vor `origin/main` vor dieser Sitzung; mit den Commits dieser Sitzung mehr. Die Zahl
wächst mit jedem Doku-Commit — **mit dem Befehl zählen** (`git log --oneline origin/main..HEAD`).
**Push nur auf Anweisung.**

## Lehren

1. **Ein HMR-Reload im Dev-Lauf kostet das Projekt** (siehe Befund) — jede Layout-Iteration kostet
   ein manuelles Öffnen. Wer am UI arbeitet, sollte die Fixes **bündeln**, bevor er Niklas um einen
   Blick bittet.
2. **jsdom prüft kein Layout.** Die drei Layout-Fehler (abgeschnittene Kacheln, Höhenfresser,
   zentrierter Titel) waren für 5486 grüne Tests unsichtbar. Sichtprüfung ist nicht optional.
3. **`object-fit` auf Canvas funktioniert** (Chromium) — ein beschnittenes Motiv ist besser als ein
   9-px-Streifen.
4. **Eine Sperre, die einen legitimen Weg abschneidet, ist ein Befund** — nicht stillschweigend
   umgehen (`setzeProjekt`) und nicht stillschweigend aufweichen.
