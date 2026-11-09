# Übergabe 09.11.2026 — Effekte: von der Entscheidung bis zum Fensterbeleg (vierundfünfzigste Sitzung)

**Auftrag (Niklas, 06.11.2026):** *„es gibt so tolle effekte um bilder so wirken zu lassen wie als
würden sie sich bewegen"*. Am 09.11. entschieden: **Option B** (Ken Burns, Text-Einblendung,
Preis-Pop) **plus** Glanz-Sweep, hochzählender Preis, Bild-Reveal, Puls, Zoom-Atmen, Drift, Parallax —
**einzeln schaltbar**, nicht als Paket. Genauigkeit: **fensterweise exakt** statt ffmpeg-Zoom.

## 1. Der Befund, der die eigene Spezifikation gekippt hat

Beim Lesen der Vorlagen für #461, **bevor** die erste Zeile Code entstand:

| Zone `hintergrund` | Inhalt in allen acht eingebauten Vorlagen |
|---|---|
| `vollbild`, `split`, `riesig`, `farbband`, `zentriert`, `ecke`, `kopf-fuss`, `band-standard` | `deko` — **Farbfläche oder Verlauf** |

**Es gibt nirgends ein Hintergrundbild.** Damit wären Zoom-Atmen und Drift auf dieser Zone
unsichtbar gewesen, und Parallax hätte gar keine zweite Ebene gehabt. AD 4.10 und TK 9.16.2 sagten
das Gegenteil — meine eigene Fassung von zwei Tagen zuvor.

**Entschieden (Niklas, 09.11.2026):** Die drei Schleifen wirken auf das **Motiv** (das ist in diesen
Segmenten das bewegte Hintergrundbild); Parallax nimmt die **Hintergrundfläche** als Gegenspieler
(0,6×). Nachgezogen in **AD 4.10**, **TK 9.16.2/9.16.3**, `effekte.ts` und den Tests. Commit
`a423bb4`. **Lehre:** Ein Effekt, der auf eine Zone zeigt, muss gegen die Vorlagen geprüft werden,
nicht gegen die eigene Vorstellung.

## 2. Die Dokumente

- **AD v1.14:** neuer Abschnitt **4.10** „Effekte: das Segment wirkt bewegt", **FA-25** in der
  Anforderungstabelle, **Akzeptanzkriterium 11**, Glossar-Eintrag.
- **TK v3.55:** neuer Abschnitt **9.16** mit acht Unterabschnitten (Datensatz, reine Rechnung,
  Zeichnen, Bildplan, Render-Weg, Vorschau/Editor, Grenzen, „was NICHT passiert").
- **Fundstellen mitgezogen:** 9.2.2 (`RenderItemSegment` trägt `png` **oder** `bildplan`), 9.8.2
  (`Aktion.effekte`), 9.9.2, Modulübersicht „Geteilt", „Stand der Verträge", `treiber-matrix.md`
  (FA-25 als **Lücke**).
- `.docx` beider Dokumente im selben Commit neu erzeugt: **AD 420 Absätze**, **TK 2653**, 0 Backticks,
  `unzip -t` heil, TK mit **zwei** Bildern (Logo + DFD).

## 3. Die fünf gebauten Issues

- **#459 — `src/shared/effekte.ts`** (neu): `normalisiereEffekte`, `effektZustand`, `EFFEKT_GRENZEN`,
  `RUHE_ZUSTAND`. Dazu `Aktion.effekte?: EffektSatz | null` in `contracts/aktion.ts` (optional, keine
  Migration). 29 Tests. Endpunkte, Nahtlosigkeit und Monotonie sind Vertrag; Zwischenkurven nicht.
- **#460 — `src/shared/bildplan.ts`** (neu): `rahmenplan`, `expandiere`. Ein 10-s-Segment kostet
  **60 gezeichnete Frames** statt 300; 45 s bleiben bei 60. Zwei Invarianten, beide getestet:
  Summe `anzahl × wiederholungen` = `dauer × 30` (exakt) und jeder expandierte Frame trägt den
  Zustand seines Zeitpunkts. 11 Tests.
- **#461 — `zeichneSegment(..., zustand?)`**: Der fünfte Parameter ist optional; **ohne ihn läuft
  exakt der heutige Weg**. `zone-bild` (Zoom aus Bildausschnitt × Effekt, Versatz, Reveal-Beschnitt
  von rechts, Glanz-Bahn), `zone-text` (Deckkraft, Versatz, Skala für Preis/CTA), `zeichne-segment`
  (Band ignoriert Effekte, Parallax, `zaehlePreis`).
- **#462 — Vorschau**: Der Aktions-Editor spielt das Segment in einer `requestAnimationFrame`-Schleife
  (30/s) und zeichnet je Bild mit `effektZustand`; der `preview-player` zeichnet mit `bild` an der
  Abspielposition. Ohne Effekt bleibt es beim Standbild.
- **#463 — Gruppe „Effekte"**: zehn einzelne Schalter, Stärke 0–100, Fenster von/bis; normalisiert
  **beim Schreiben**; Hinweis bei fehlendem Ziel; nur im Ganzbild; alles im Entwurf, kein IPC;
  `unterschiede` vergleicht **inhaltlich**.

## 4. Der Fensterbeleg

`scripts/beleg-effekt.mjs` misst an der **echten Vorschaufläche** der gebauten App:

```json
{"vorherGleich":true,"nachherGleich":false,"groesse":53751}
```

- **Ohne Effekt:** zwei Aufnahmen im Abstand von 0,5 s sind **byte-gleich**.
- **Mit „Zoom-Atmen":** zwei Aufnahmen im Abstand von 0,5 s **unterscheiden sich**.

Die Gegenprobe („ohne Effekt gleich") ist der Kern — ohne sie wäre der Unterschied nicht dem Effekt
zuzuschreiben. Verglichen wird nur die Vorschaufläche, nicht das Fenster: kein blinkender Cursor,
keine Uhr. Commit `16439ec`.

**Was der Beleg NICHT zeigt:** die **Dauer** eines gerenderten Segments. Dafür fehlt #464.

## 5. Zwei Werkzeugbefunde

- **`bereitschaft.py` ordnete M10 dem Meilenstein M1 zu** (`startswith("M1")` trifft „M10 – Effekte").
  M1 zeigte 18 statt 12 Issues und fünf fälschlich als ungebaut. Jetzt Regex mit Ziffern-Grenze;
  dieselbe Zwei-Zeichen-Kürzung in `bild-fundstellen.py` ebenfalls behoben.
- **`bereitschaft.py` zählt #461 als „gebaut"**, weil `zeichne-segment.ts` schon existiert — das Issue
  ändert die Datei nur. Bekannte Grenze des Werkzeugs; für M10 nicht auf die Zahl verlassen.

## 6. Gate

Typecheck 0 (auch tests), ESLint/oxlint 0, Build 0, Unit **5673/5673** (371 Dateien), Integration
**51/51** (13), Treiber **0 Befunde** (1 Untersuchung: Mehrfachauswahl; 1 MANUELL: Export-Dialog).
`einzel-instanz` (#289) fiel in einem Lauf, einzeln **3/3 grün** — der bekannte Flaky.

**Gegenproben:** #459 — `dreieck` durch `weich` ersetzt (4 Tests rot, u. a. der Naht-Sprung), `staerke-0`-
Wächter entfernt (1 rot); beide byte-identisch zurück (SHA-256 `5fa4a014…`). #460 — Periodenerkennung
aus (4 rot), Summe um 1 verfälscht (6 rot); beide byte-identisch zurück (`db42b6ee…`).

**Lehre aus #459:** Der erste Nahtlosigkeits-Test verglich nur gleiche Phasen (0 vs. 60) — das gilt für
**jede** periodische Funktion und hätte die Gegenprobe überlebt. Er prüft jetzt, dass der Sprung **an
der Naht** nicht größer ist als im Inneren.

**Lehre aus #460:** `dreieck` ist **symmetrisch** — Bild 10 und Bild 50 tragen bei „Zoom-Atmen" denselben
Zustand. Ein globales Dedup machte daraus 31 statt 60 Frames und ließ die Läufe auf nicht
zusammenhängende Nummern zeigen (also auf falsche Bilder). Jetzt ist die Periode ein eigener,
zusammenhängender Block.

## 7. Ehrlich offen

- **#464 fehlt** (Bildplan im Render: `bildfolge.ts`, Prüfung, Einbau in `normalisieren.ts`). Erst damit
  ist die Dauer eines Effekt-Segments messbar (`ffprobe`: Dauer unverändert, `nb_frames = dauer × 30`).
- **Kein Komponententest** für die Effekt-Gruppe — nur `unterschiede` ist geprüft.
- **Kein Treiber-Schritt FA-25** — die Matrix führt ihn als **Lücke**. Der Fensterbeleg ist ein eigenes
  Werkzeug, kein Schritt im `durchlauf.mjs`.
- **Parallax auf einer Vollton-Fläche** bleibt unsichtbar (das ist Physik, nicht ein Fehler) — sichtbar
  nur bei Verläufen.
- 71 Dependabot-Findings, `einzel-instanz` (#289) flaky.

## 8. Stand am Sitzungsende

**19 Commits** vor `origin/main` (mit diesem Übergabe-Commit), Arbeitsbaum sauber, **nicht gepusht** —
Push nur auf Anweisung.
#459–#463 geschlossen, #464 offen. Nächster Schritt: **#464**.
