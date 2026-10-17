# Plan: Frames-Anzeige in der Zeitleiste (#433)

**Status:** GEBAUT. **Erstellt:** 17.10.2026.
**Herkunft:** #433 (`braucht-entscheidung`), Uebergabe `docs/agents/uebergabe-2026-10-16-session.md`.

## Die Entscheidung (User, 17.10.2026)

Der User hat auf die Nachfrage klar gesagt, was er will: **„literally die frames, also die
einzelnen Bilder des Videos"**. Nicht Teilstriche, keine Label-Achse - die **echten Videobilder**
sollen sichtbar sein. Auf die Frage nach dem Standard-Zoom: Standard lassen („ka warum man das
braucht").

Damit ist der STOPP aus #433 aufgeloest.

## Was gebaut wird (und was nicht)

**Gebaut:** Der Video-Block der Zeitleiste bekommt einen **Filmstreifen** - echte Einzelbilder
des Videos, nebeneinander. Die **Anzahl folgt der Blockbreite** (und damit dem Zoom): je breiter,
desto mehr Bilder. Beim Hineinzoomen naehert sich der Streifen den einzelnen Frames.

**Nicht gebaut:** keine Aenderung an der Tick-Achse (`baueZeitachse`) und am Standard-Zoom.
Der Befund „die 5-px-Schwelle laesst nie Einzel-Frame-Ticks zu" bleibt gueltig, ist aber **nicht**
das, was der User wollte - die Achse bleibt wie sie ist.

## Umsetzung

- **`composer/thumbnails.ts`:** `fangeBild(video, hoehe)` und `warteAufMetadaten` werden
  **exportiert** (aus `fangeEin`/`videoThumbnail` herausgeloest). So benutzt der Filmstreifen
  DIESELBE Bild-Aufnahme wie die #128-Thumbnails - keine zweite Bildquelle.
- **`composer/video-filmstreifen.tsx` (neu):**
  - `anzahlBilder(breitePx)` (rein): `floor(breite/40)`, mind. 1, hoechstens 40.
  - `bildZeitpunkte(start, ende, anzahl)` (rein): je Bild die Mitte seines Zeit-Abschnitts.
  - `VideoFilmstreifen`: laedt ein `<video>` (eine `media://`-Quelle wie #128), sucht die
    Zeitpunkte an und zeichnet die Bilder als `<canvas>`-Reihe (`data-testid="zeitleiste-filmstreifen"`,
    je Bild `…-bild`). Fehler/kein Video = kein Streifen (der Block faellt auf seine Farbe zurueck).
- **`composer/zeitleiste.tsx`:** der `ZeilenBlock` eines `video`-Elements traegt den Filmstreifen
  (`position: absolute`, `zIndex 0`); Dauer-Text, Band-Spur und Art-Label bleiben mit
  `zIndex 1` + Textschatten lesbar. Der Zoom/`pxProSekunde` wirkt dadurch **automatisch** auf die
  Bild-Anzahl (die Blockbreite ist die Zoom-Funktion).

## Belege

- **Rein:** `tests/unit/video-filmstreifen.spec.ts` (6 Pruefungen) - Anzahl und Zeitpunkte,
  inkl. Trim.
- **Echtes Fenster (Treiber `npm run durchlauf`, Schritt 4b4):** bei Standard-Zoom **1** Einzelbild,
  nach 4x „Zoom +" (128 px/s) **6** Einzelbilder; kein Befund, keine Fenster-Fehler
  (pageerror). Die Kernabschnitte 4f/4f2/4f4/4g2/4g4 bleiben unveraendert.
- Typecheck/Lint 0, Suite **5556/323**.

## Offen (nicht Teil dieses Plans)

- Ob der Streifen **optisch** gefaellt (Dichte `ZIEL_BREITE_PX = 40`, feste Bildhoehe 64), ist
  eine Sichtfrage - am echten Fenster zu beurteilen, nicht im Voraus zu entscheiden.
- Die Tick-Achse (`baueZeitachse`) ist vom #433-Befund (nie Einzel-Frame-Ticks) nicht beruehrt;
  eine eigene Entscheidung, falls je gewuenscht.
