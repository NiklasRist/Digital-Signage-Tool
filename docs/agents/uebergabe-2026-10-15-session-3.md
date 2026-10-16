# Uebergabe – Session 15.10.2026 (Session 3: #425 gebaut – Band-Aufnahme am Video)

> Fuer die naechste Sitzung: Lies zuerst CLAUDE.md (STAND HEUTE), dann diese Datei.
> Vorgaenger: `docs/agents/uebergabe-2026-10-15-session-2.md` (User-Abnahme der Kernachse,
> „Ein Projekt – ein Video" #422–#424; #425/#426 dokumentiert).

## Worum es ging
Der User hat **#425 zuerst** gewuenscht, **dann** die Abnahme von #422–#424. #425 schliesst die
Familie „fertige Funktion ohne Aufrufer" fuer die Band-Bearbeitung: `einblendung-ansicht.tsx`
(#253/M7-60) war fertig, aber nirgends montiert.

## Vor dem Bauen entschieden (die drei STOPP-Punkte des Issues, User 15.10.2026)
1. **Startdauer** eines per Drag angehaengten Band-Abschnitts = **Dauer-Kette des Produkts**
   `aktion.standardDauer ?? projekt.standardSegmentdauer ?? 10` (nicht der feste 10er-Wert).
2. **Band-Vorlage** ohne vorhandene = die **erste waehlbare** (`waehlbareBandVorlagen`, #129) –
   derselbe Startentwurf wie die Ansicht.
3. **Drop auf ein Aktions-Segment** = **kein Ablehnen**; er ordnet **sequenziell** davor/danach ein
   (die bestehende Kanten-Messung #412/#417). Nur der **Körper eines VIDEO-Blocks** ist Band-Ziel.

Festgehalten in **TK v3.23 / 9.7.7** (AD unveraendert – 4.5 beschrieb das Verhalten schon).

## Gebaut und gemergt (Branch `bau/425-band-anbinden`)
- **Neu `src/renderer/composer/band-aufnahme.ts`** (rein): `startdauerFuerBandabschnitt`,
  `bandAufnahmeAus` (ueber `entwurfAus`/`fuegeAbschnittAn`/`waehlbareBandVorlagen` – kein zweiter
  Schreibweg), `bandZielAus` (Körper-Messung am Zeitleisten-Layout).
- **`composer/einblendung-ansicht.tsx` montiert** (Overlay), kein Platzhalter mehr; Uebernehmen
  korrigiert die Sicht ueber `projekt.setzeListe` (EIN Undo-Schritt).
- **`composer/index.tsx`**: Band-Ziel waehrend des Zugs gemessen (`onDragMove`, `bandZiel`); Drop auf
  das Video → `uebernehmeBand` (#129) + EIN `setzeListe`. Nur der Video-Körper ist Band-Ziel.
- **`zeitleiste.tsx`**: sichtbares Band-Ziel (`data-band-ziel`, Umrandung + „Band").
- **Doku**: TK v3.23 / 9.7.7 (Band „gebaut und angeschlossen", drei Regeln); `.docx` neu erzeugt.

## Treiber-Beleg (echtes Fenster, `npm run durchlauf`, Schritt 4f2)
```
bandZiel=true; Bloecke 2->2; Abschnitte=[{aktionRef: <gezogene Aktion>, dauer: 10}]; Band-Zeilen=1
Undo: Band-Zeilen nach Cmd+Z = 0
```
Das heisst: ein Drop einer Aktion auf den Video-Block legt einen **Band-Abschnitt** an (belegt im
`project.json` UND in der Band-Ansicht), die Zahl der Zeitleisten-Bloecke **bleibt gleich** (das Band
ist kein neues Listenelement, TK 9.2.8), und **Cmd+Z** nimmt die Aufnahme in **einem** Schritt zurueck.
Dauer 10 = Projekt-Standard (die gesaete Aktion hat keine eigene Standarddauer).

**Treiber-Messfehler, ehrlich vermerkt:** Der erste Lauf las `project.json` 3,5 s nach dem Drop –
waehrend die Auto-Speicherung entprellt ist (3–5 s, TK 9.5.4). Der Protokolleintrag ist als
„zurueckgenommen" gekennzeichnet; der korrigierte Lauf misst zusaetzlich in der Oberflaeche mit
6,5 s Wartezeit.

## Zaehler auf `main`
- **5509 Tests gruen (315 Dateien)**, Typecheck/Lint 0. Neu: `band-aufnahme.spec.ts` (14),
  `composer-band.spec.ts` (4).
- Driver: keine Befunde ausser den bekannten (5 Reiter / MANUELL-Export).
- `#289`-Flaky im Volllauf **nicht** aufgetreten. Der dokumentierte Vorbefund-Rejection
  (`standardmarke-anzeige.spec.ts`, #324) steht weiter.
- Pendant-Dateien: `docs/agents/oberflaeche-durchlauf.md` (Nachlauf 15:20/15:2x), `docx` neu erzeugt.

## Naechste Sitzung
1. **User-Abnahme #422–#424** (Regel: Treiber-Beleg ist KEINE Abnahme). App starten:
   `./node_modules/electron/dist/Electron.app/Contents/MacOS/Electron dist/main/index.cjs`
   nach `npm run build`; vorher `instanz.lock`/`instanz.signal` raeumen.
2. **#425** ist **Treiber-gemessen** – das Issue nennt ausdruecklich „keine User-Abnahme". Schliessen
   nach dem Merge (Nachtrag-Kommentar mit den drei Entscheidungen + Belegen ist angelegt).
3. **#426 entscheiden** (kurze Unterbrechung: Modell/Render), dann Issues zuschneiden.
4. **Welle 2 / Banner-Spur** und die **#371-Klaerung** (fehlende Plan-Datei
   `trennung-banner-aktionen-plan.md`).
5. Aufraeumen: Branch `bau/425-band-anbinden` kann nach dem Merge geloescht werden; #215 bleibt
   Werkzeug-Limit.

## Beim User
- **Push nur auf ANWEISUNG** (Stand: lokal auf `main` gemergt, **nicht** gepusht).
- Optische Abnahme **#327** weiterhin offen.
- `#289`-Flaky beobachten.

---

## Nachtrag derselben Sitzung: die User-Abnahme #422–#424 hat zwei Befunde gebracht

**Abgenommen und ok:** **#422** (ein Projekt/ein Video, „Video importieren", Auto-Übernahme,
Ersetzen-Rückfrage, Löschen-Meldung) und **#423** (Video zuerst, Pflicht, kein Häkchen).
**#424** (Undo/Redo-Pfeile) konnte der User **noch nicht** testen – dabei hatte er die App
versehentlich geschlossen und konnte sie nicht neu starten.

### #427 – App beendet sich nach dem Fenster-Schliessen nicht (GEBAUT, Merge `0ce2d17`)
- **Ursache (am Code):** Beim roten Kreuz ist das Fenster beim `before-quit` bereits zerstört
  (`window-all-closed` → `app.quit()`); der Ablauf stieg bei `hauptfenster.isDestroyed()` aus, **ohne
  `app.quit()`** – der `preventDefault` stand, der Prozess blieb als Waise, `instanz.lock` blockierte
  den Neustart.
- **User-Entscheidungen:** erst flushen, dann beenden; **`before-quit` bleibt der EINZIGE Weg** (#336).
- **Fix:** `beenden-ablauf.ts` → `flushesBeimBeendenOhneDialogAus()` (drei Sofort-Flushs, Fehlschlag
  wird verworfen); `index.ts` behandelt den fenster-losen Fall damit und beendet.
- **Beleg:** `scripts/pruefe-beenden.mjs` (eigenes Prozess-Maß, nicht Teil von `durchlauf`): mit Fix
  beendet sich die App **sofort**; **Gegenprobe** (Fix aus) beißt – der Prozess lebt nach 20 s noch.
  Rücknahme per Prüfsumme (`7da36827…`) belegt. Suite **5512 grün** (+3).

### #428 – Zeitleiste als Zeit-/Frame-Band (NUR ANGELEGT, `braucht-entscheidung`)
User-Befund: „Aktionen funktionieren gar nicht … nur dahinter und davor, weil die zeitleiste keine
frames darstellt." Bestätigt: **die Zeitleiste soll Frames/Zeitstellen zeigen**, und eine Aktion soll
**an einer Zeitstelle im Video** liegen. Das braucht ein **Modell** (Band-Abschnitt mit
`position`/`start` vs. reine Reihenfolge) und berührt AD 4.5 / TK 9.2.8 – **bewusst offen**, siehe
Issue #428 (STOPP-Punkte: Zeitstelle vs. Reihenfolge, Rotation, Frame-Raster, nur Video oder auch
Segmente).

### Reihenfolge fuer die naechste Sitzung
1. **#424-Abnahme** (Rest der Kernachse), App neu starten (Fix #427 steckt im Build).
2. **#428 entscheiden** (Modell/Raster), dann zuschneiden.
3. **#426 entscheiden** (kurze Unterbrechung).
4. Welle 2 / Banner-Spur, **#371-Klärung**.

---

## Nachtrag 2 derselben Sitzung: weitere Abnahme-Befunde (#429/#430/#431)

Bei der Fortsetzung der Abnahme: **#422/#423 ok**; der User meldete **„undo/redo geht nicht"** und
**„aktionen kann man nicht löschen"**, ausserdem die **Zeitleiste-Frames** (#428).

- **#431 GEBAUT + gemessen + geschlossen (Merge `05d1850`, TK v3.24 / 9.14.2).** Hart gemessen mit
  `scripts/pruefe-menue.cjs`: Electron legt auf macOS ein **Standardmenue** mit
  `Edit → Undo (CommandOrControl+Z)`/`Redo` an; diese **Acceleratoren schlucken Cmd+Z**, bevor der
  Renderer (#350) es sieht. **Der Treiber „maß" Cmd+Z nur, weil CDP die Taste direkt an die Seite
  sendet** – ein falscher Beleg (betrifft auch frühere #350-Belege). Fix: eigenes Menue
  (`src/main/anwendungs-menue.ts`, Edit ohne Undo/Redo), auf Windows/Linux kein Menue; Fokus-Wächter
  in `tastatur.ts`. Beleg am gebauten Menue (temporärer Log, per Prüfsumme zurückgenommen):
  keine `undo/redo`-Rolle, kein `+Z`-Accelerator.
- **#429 ANGELEGT, NICHT gebaut.** Dauer/Trim schreiben über das **rohe** `gleicheElementAb`; die
  Undo-Hülle (#243) umhüllt nur `setzeListe`/`setzeProjekt` → **kein Schnappschuss**. TK 9.13.1
  verlangt aber ausdrücklich Trim+Dauer → **Vertragsbruch**. (Nicht die Ursache des User-Falls –
  eine **Aktions-Anlage** zeichnet korrekt auf, Treiber 4g2: 2→1.)
- **#430 ANGELEGT, NICHT gebaut.** Aktions-Löschen fehlt in der Composer-Bibliothek; der User will
  es an allen Stellen (Bibliothek, Reiter Aktionen, Liste/Zeitleiste, „im Editor in einem Projekt").
- **Unbestätigt/zurückgenommen:** Eine Treiber-Sonde zum Anlegen im **Aktionen-Reiter** stieg nach
  „Anlegen" nicht (2→2). Ob Bedienweg oder Sonde, ist **nicht geklärt** – die Projekt-Daten des Users
  zeigen eine dort angelegte Aktion. Als „Treiber-Sonde zurückgenommen" im Protokoll vermerkt.

Zähler: Suite **5516 grün (316 Dateien)**, Typecheck/Lint 0, lokal auf `main`, **nicht gepusht**.
Neue Werkzeuge: `scripts/pruefe-beenden.mjs` (#427), `scripts/pruefe-menue.cjs` (#431).

---

## Nachtrag 3: #429 gebaut und geschlossen (Dauer/Trim → Undo) – **User-abgenommen 16.10.2026**

**#429 GEBAUT + treiber-gemessen + geschlossen (Merge `e7a6f7d`).** Der User hatte #431 zuerst gewählt;
danach #429.

- **Ursache:** `uebernehmeGrenzen` (#125) schrieb den optimistischen Stand und die Bestätigung über das
  **rohe** `gleicheElementAb` – die Undo-Hülle (#243) umhüllt nur `setzeListe`/`setzeProjekt`. Damit lief
  jede Dauer-/Trim-Änderung am Undo-Stapel vorbei (TK 9.13.1 verlangt Trim+Dauer im Undo → Vertragsbruch).
- **Fix:** `uebernehmeGrenzen` bekommt einen **vierten Parameter, den Sicht-Schreiber** (die umhüllte
  `setzeListe`) – wie `element-entfernen`/`element-hinzufuegen`/`liste-reorder`. Anwenden/Rücknehmen laufen
  darüber → **EIN** Schnappschuss. Der **Bestätigungs-Abgleich** bleibt beim **rohen** `gleicheElementAb`:
  über die Hülle entstünde ein **zweiter** Schnappschuss (das bestätigte Element ist ein neues Objekt;
  `standGleich` vergleicht per Referenz) → die Rücknahme kostete **zwei** Schritte (am echten Fenster
  gemessen, danach behoben).
- **Beleg:** Treiber **4f4** (echtes Fenster): Dauer `2,0 → 1,9 → Undo → 2,0` in **EINEM** Schritt.
  Neuer Test `tests/unit/dauer-regler-undo.spec.ts` mit der **echten Hülle** (`kannRueckgaengig`).
  **Gegenprobe** (Anwenden am Stapel vorbei) beißt – 3/3 fallen; **Rücknahme per Prüfsumme** belegt.
- **Signatur von #125 geändert** – im Issue #125 als Kommentar gemeldet (Nachtrag), Kopf von
  `dauer-regler.ts` trägt die Ergänzung.

Zähler: Suite **5519 grün (317 Dateien)**, Typecheck/Lint 0, lokal auf `main` (11 Commits vor
`origin/main`), **nicht gepusht**.

### Reihenfolge für die nächste Sitzung (aktualisiert)
1. **#430 entscheiden** (Aktions-Löschen an allen Stellen: Bibliothek, Reiter Aktionen, Liste, Editor).
2. **#428 entscheiden** (Zeitleiste als Zeit-/Frame-Band; Modell offen).
3. **#426 entscheiden** (kurze Unterbrechung).
4. Welle 2 / Banner-Spur, **#371-Klärung**.
5. **#424-Abnahme** ist über #431 mit erledigt (Pfeile + Cmd+Z gemessen/abgenommen).

---

## Nachtrag 4: #430 gebaut und geschlossen (Aktion in der Composer-Bibliothek löschen) – **User-abgenommen 16.10.2026**

**#430 GEBAUT + treiber-gemessen + geschlossen (Merge `a97ec47`, TK v3.25 / 9.7.2).**
User-Entscheidungen 16.10.2026: Löschen in der **Composer-Bibliothek** (Aktionszeile), **ohne
Rückfrage** (EIN Undo-Schritt); der **Reiter Aktionen** bleibt mit seiner Zahlen-Vorschau (#142);
„im Editor eines Projekts" = der Reiter Aktionen.

- **`bibliothek-ansicht.tsx`**: optionale Eigenschaft `aufAktionLoeschen`; die Aktionszeile trägt
  dann einen **Löschen**-Knopf (ohne die Eigenschaft: kein Knopf).
- **`composer/index.tsx`**: `ComposerVerdrahtung.loescheAktion` (Modulgrenze E1) + `loescheAktionInline`
  – wendet den zurückgegebenen `stand` in **EINEM** `setzeProjekt` an (Wrapped-Zugang). Die Kaskade
  rechnet der Main (TK 9.5.3); **nichts wird nachgebaut**.
- **`App.tsx`**: reicht `loescheAktion` (der #142-Weg) durch.
- **Beleg:** Treiber **4g4** (echtes Fenster): Aktionen `1 → 0 → Undo 1` in **EINEM** Schritt.
- **Treffer beim Bauen:** der neue Knopf-Testid `aktion-loeschen-…` verfälschte den **Treiber-Zähler**
  (`[data-testid^="aktion-"]` matchte Zeile UND Knopf) – auf `> li` korrigiert. (Die Funktion war korrekt.)
- **Tests:** `composer-aktion-loeschen.spec` (2), `bibliothek-ansicht-ansicht.spec` (+2).

Zähler: Suite **5523 grün (318 Dateien)**, Typecheck/Lint 0, lokal auf `main` (14 Commits vor
`origin/main`), **nicht gepusht**.

### Reihenfolge für die nächste Sitzung (Stand nach #430)
1. **#428 entscheiden** (Zeitleiste als Zeit-/Frame-Band; Modell offen).
2. **#426 entscheiden** (kurze Unterbrechung).
3. Welle 2 / Banner-Spur, **#371-Klärung**.
4. **#424-Abnahme** ist über #431 mit erledigt.
